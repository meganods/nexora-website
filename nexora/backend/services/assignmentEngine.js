/**
 * Assignment Engine
 * ─────────────────
 * Finds the best available Service Partner for a given booking using a
 * multi-factor weighted scoring algorithm:
 *
 *   Score = Σ (weight_i × normalised_score_i)   where Σ weights = 100
 *
 * Factors
 * ─────────────────────────────────────────────────────────────
 *  1. categoryMatch  – Is the partner's category an exact match?
 *  2. location       – Inverse-distance score within maxRadiusKm.
 *  3. availability   – Is the partner currently online?
 *  4. workload       – Fewer active bookings = higher score.
 *  5. rating         – avgRating field (future-proof; defaults to 5).
 */

const ServicePartner = require('../models/ServicePartner');
const Booking      = require('../models/Booking');
const AdminSettings = require('../models/AdminSettings');

// Statuses that count as "active" workload for a partner
const ACTIVE_STATUSES = ['ASSIGNED', 'ARRIVED', 'IN_PROGRESS'];

/**
 * Normalise a value between 0 and 1.
 * @param {number} value
 * @param {number} min
 * @param {number} max
 */
function normalise(value, min, max) {
  if (max === min) return 1;
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

/**
 * Calculate the location score between a service partner and the requested booking location.
 * Same Area      = 100
 * Same Pincode   = 90
 * Same City      = 50
 * Nearby City    = 10
 * No Match       = 0
 */
function getLocationScore(partner, booking) {
  if (booking.areaId && partner.serviceAreaIds && partner.serviceAreaIds.some(id => id.toString() === booking.areaId.toString())) {
    return 100;
  }
  const bPincode = (booking.address?.pincode || '').toLowerCase().trim();
  if (partner.serviceAreas && partner.serviceAreas.some(area => area.toLowerCase().trim() === bPincode)) {
    return 90;
  }
  const bCity = (booking.address?.city || '').toLowerCase().trim();
  if (partner.location?.city && partner.location.city.toLowerCase().trim() === bCity) {
    return 50;
  }
  if (partner.serviceAreas && partner.serviceAreas.some(area => area.toLowerCase().trim() === bCity)) {
    return 50;
  }
  if (partner.serviceAreas && partner.serviceAreas.some(area => {
    const a = area.toLowerCase().trim();
    return a.includes(bCity) || bCity.includes(a);
  })) {
    return 10;
  }
  return 0;
}

/**
 * Compute distance in kilometres between two [lon, lat] points (Haversine).
 */
function haversineKm([lon1, lat1], [lon2, lat2]) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Run the assignment engine for a given booking.
 *
 * @param {object} booking - Mongoose Booking document (populated serviceId).
 * @returns {{ partner: VendorDoc, score: number, breakdown: object } | null}
 */
async function findBestPartner(booking, returnAll = false) {
  const settings = await AdminSettings.getSingleton();
  const { weights, maxRadiusKm } = settings;

  // Defensively populate required category fields if not present
  if (booking.serviceId && (!booking.serviceId.categoryId || !booking.serviceId.categoryId.name)) {
    await booking.populate({
      path: 'serviceId',
      populate: { path: 'categoryId', select: 'name' }
    });
  }
  if (booking.isPackageBooking && booking.packageId) {
    if (!booking.packageId.categoryIds || booking.packageId.categoryIds.length === 0 || typeof booking.packageId.categoryIds[0] === 'string' || !booking.packageId.categoryIds[0].name) {
      await booking.populate({
        path: 'packageId',
        populate: { path: 'categoryIds', select: 'name' }
      });
    }
  }

  // ── 1. Build geo-query ─────────────────────────────────────────────────────
  // Use customer address coordinates if available; fall back to city-level mock.
  // In production the booking address should carry coordinates from the geocoder.
  const bookingCoords = booking.address?.coordinates; // [lon, lat] — optional
  
  let vendorQuery = {
    kycStatus: 'APPROVED',
    isActive: true,
  };

  let vendorsWithDistance = [];

  if (bookingCoords && Array.isArray(bookingCoords) && bookingCoords.length === 2) {
    // Full 2dsphere geo search
    const geoResults = await ServicePartner.find({
      ...vendorQuery,
      location: {
        $nearSphere: {
          $geometry: { type: 'Point', coordinates: bookingCoords },
          $maxDistance: maxRadiusKm * 1000, // metres
        },
      },
    }).lean();

    vendorsWithDistance = geoResults.map(v => ({
      vendor: v,
      distanceKm: haversineKm(bookingCoords, v.location.coordinates),
    }));
  } else {
    // No coordinates — fall back: return all verified vendors, treat distance as 0
    const allVendors = await ServicePartner.find(vendorQuery).lean();
    vendorsWithDistance = allVendors.map(v => ({ vendor: v, distanceKm: 0 }));
  }

  if (vendorsWithDistance.length === 0) return null;

  // ── 2. Gather workload for each vendor ────────────────────────────────────
  const vendorIds = vendorsWithDistance.map(v => v.vendor._id);
  const activeBookings = await Booking.aggregate([
    { $match: { vendorId: { $in: vendorIds }, status: { $in: ACTIVE_STATUSES } } },
    { $group: { _id: '$vendorId', count: { $sum: 1 } } },
  ]);
  const workloadMap = {};
  activeBookings.forEach(b => { workloadMap[b._id.toString()] = b.count; });

  // Max workload for normalisation
  const maxWorkload = Math.max(1, ...Object.values(workloadMap));

  // ── 3. Score each vendor ──────────────────────────────────────────────────
  let requiredCategories = [];
  if (booking.isPackageBooking && booking.packageId) {
    requiredCategories = (booking.packageId.categoryIds || []).map(c => (c.name || '').toLowerCase());
  } else if (booking.serviceId && booking.serviceId.categoryId) {
    requiredCategories = [ (booking.serviceId.categoryId.name || '').toLowerCase() ];
  }

  const scored = vendorsWithDistance.map(({ vendor, distanceKm }) => {
    const wl = workloadMap[vendor._id.toString()] || 0;

    // Factor scores [0–1]
    const s_category   = requiredCategories.includes(vendor.category?.toLowerCase()) ? 1 : 0;
    const s_dist       = bookingCoords ? 1 - normalise(distanceKm, 0, maxRadiusKm) : 0.5;
    const s_hierarchy  = getLocationScore(vendor, booking) / 100;
    const s_location   = s_hierarchy > 0 ? (s_hierarchy * 0.7 + s_dist * 0.3) : s_dist;
    const s_availability = vendor.isOnline ? 1 : 0;
    const s_workload   = 1 - normalise(wl, 0, maxWorkload);
    const s_rating     = normalise(vendor.avgRating || 5, 1, 5);

    // Weighted total (weights sum to 100, divide by 100 for [0–100] score)
    const totalScore =
      (weights.categoryMatch * s_category +
       weights.location      * s_location +
       weights.availability  * s_availability +
       weights.workload      * s_workload +
       weights.rating        * s_rating);

    return {
      partner: vendor,
      score: Math.round(totalScore * 10) / 10,
      breakdown: {
        categoryMatch:  +(s_category   * weights.categoryMatch).toFixed(1),
        location:       +(s_location   * weights.location).toFixed(1),
        availability:   +(s_availability * weights.availability).toFixed(1),
        workload:       +(s_workload    * weights.workload).toFixed(1),
        rating:         +(s_rating      * weights.rating).toFixed(1),
        distanceKm:     +distanceKm.toFixed(2),
        activeBookings: wl,
      },
    };
  });

  // ── 4. Return top scorer ──────────────────────────────────────────────────
  scored.sort((a, b) => b.score - a.score);
  if (returnAll) return scored;
  return scored[0] || null;
}

/**
 * Run the engine for all REQUESTED bookings (batch auto-assign).
 * Returns an array of assignment results.
 */
async function runBatchAutoAssign() {
  const pendingBookings = await Booking.find({ status: 'REQUESTED' })
    .populate({
      path: 'serviceId',
      populate: { path: 'categoryId', select: 'name' }
    })
    .populate({
      path: 'packageId',
      populate: { path: 'categoryIds', select: 'name' }
    });

  const results = [];
  for (const booking of pendingBookings) {
    const best = await findBestPartner(booking);
    if (best) {
      await Booking.findByIdAndUpdate(booking._id, {
        vendorId: best.partner._id,
        status: 'ASSIGNED',
      });
      results.push({
        bookingId: booking._id,
        assignedPartnerId: best.partner._id,
        partnerName: best.partner.name,
        score: best.score,
        breakdown: best.breakdown,
      });
    } else {
      results.push({ bookingId: booking._id, assignedPartnerId: null, reason: 'No eligible partner found' });
    }
  }
  return results;
}

module.exports = { findBestPartner, runBatchAutoAssign };
