/**
 * Nexora Database Seed Script
 * Run: node seed.js
 * Seeds categories and services into MongoDB
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('./models/Category');
const Service = require('./models/Service');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/nexora';


const SEED_DATA = [
  {
    category: { name: 'AC & Appliance Repair', slug: 'ac-appliance-repair', description: 'Professional AC and home appliance repair services.', icon: 'Wind' },
    services: [
      { name: 'AC Repair', slug: 'ac-repair', description: 'Expert diagnosis and repair of split AC, window AC, and central AC units. Includes coolant check, filter cleaning, and fault resolution.', basePrice: 499, estimatedDurationMins: 60, rating: 4.8, reviewCount: 342, discountPercentage: 10, inclusions: ['Diagnosis & fault detection', 'Filter cleaning', 'Coolant level check', 'Electrical inspection', 'Service report'] },
      { name: 'AC Installation', slug: 'ac-installation', description: 'Professional installation of split ACs with proper pipe laying and electrical work.', basePrice: 799, estimatedDurationMins: 120, rating: 4.7, reviewCount: 215, discountPercentage: 0, inclusions: ['Wall mounting bracket', 'Copper pipe fitting', 'Electrical wiring', 'Test run', 'Demo of controls'] },
      { name: 'AC Gas Refill', slug: 'ac-gas-refill', description: 'Refrigerant gas (R32/R410A) refill for optimal cooling performance.', basePrice: 1299, estimatedDurationMins: 45, rating: 4.6, reviewCount: 189, discountPercentage: 5, inclusions: ['Pressure testing', 'Gas filling', 'Leak detection', 'Post-fill cooling check'] },
      { name: 'AC Deep Cleaning', slug: 'ac-deep-cleaning', description: 'Complete deep cleaning of AC indoor and outdoor unit for hygiene and performance.', basePrice: 599, estimatedDurationMins: 90, rating: 4.9, reviewCount: 278, discountPercentage: 15, inclusions: ['Indoor unit cleaning', 'Outdoor unit cleaning', 'Filter wash', 'Coil cleaning', 'Anti-bacterial treatment'] },
      { name: 'AC Annual Maintenance', slug: 'ac-annual-maintenance', description: 'Comprehensive annual maintenance contract covering cleaning, gas check, and service.', basePrice: 1499, estimatedDurationMins: 90, rating: 4.7, reviewCount: 124, discountPercentage: 20, inclusions: ['2 service visits per year', 'Cleaning', 'Gas check', 'Electrical inspection', 'Priority support'] },
      { name: 'Washing Machine Repair', slug: 'washing-machine-repair', description: 'Repair for fully automatic and semi-automatic washing machines.', basePrice: 399, estimatedDurationMins: 60, rating: 4.6, reviewCount: 167, discountPercentage: 0, inclusions: ['Fault diagnosis', 'Drum cleaning', 'Pump check', 'Parts repair'] },
      { name: 'Refrigerator Repair', slug: 'refrigerator-repair', description: 'Cooling issue, compressor, thermostat and door seal repairs for all brands.', basePrice: 449, estimatedDurationMins: 60, rating: 4.5, reviewCount: 143, discountPercentage: 0, inclusions: ['Cooling diagnosis', 'Compressor check', 'Thermostat test', 'Seal inspection'] },
    ]
  },
  {
    category: { name: 'Cleaning & Pest Control', slug: 'cleaning-pest', description: 'Professional home cleaning and pest control services.', icon: 'Broom' },
    services: [
      { name: 'Deep Home Cleaning', slug: 'deep-home-cleaning', description: 'Complete deep cleaning of entire home including kitchen, bathrooms, and all rooms.', basePrice: 799, estimatedDurationMins: 180, rating: 4.9, reviewCount: 412, discountPercentage: 20, inclusions: ['All rooms dusting & vacuuming', 'Kitchen deep clean', 'Bathroom scrubbing', 'Floor mopping', 'Window cleaning', 'Cupboard cleaning'] },
      { name: 'Bathroom Cleaning', slug: 'bathroom-cleaning', description: 'Deep scrubbing and sanitisation of bathrooms including tiles, toilet, and basin.', basePrice: 399, estimatedDurationMins: 60, rating: 4.8, reviewCount: 298, discountPercentage: 10, inclusions: ['Tile scrubbing', 'Toilet sanitisation', 'Basin cleaning', 'Shower area cleaning', 'Floor mopping', 'Mirror cleaning'] },
      { name: 'Kitchen Deep Cleaning', slug: 'kitchen-deep-cleaning', description: 'Thorough cleaning of kitchen chimney, hob, tiles, cabinets, and floors.', basePrice: 599, estimatedDurationMins: 120, rating: 4.7, reviewCount: 234, discountPercentage: 15, inclusions: ['Chimney cleaning', 'Hob & burner cleaning', 'Tile degreasing', 'Cabinet exterior cleaning', 'Floor mopping'] },
      { name: 'Sofa Cleaning', slug: 'sofa-cleaning', description: 'Professional dry and wet cleaning of fabric, leather, and rexine sofas.', basePrice: 499, estimatedDurationMins: 60, rating: 4.6, reviewCount: 189, discountPercentage: 0, inclusions: ['Pre-treatment spray', 'Deep cleaning', 'Stain removal', 'Deodorising', 'Drying'] },
      { name: 'Carpet Cleaning', slug: 'carpet-cleaning', description: 'Steam and dry cleaning of carpets to remove dust, stains, and allergens.', basePrice: 699, estimatedDurationMins: 90, rating: 4.7, reviewCount: 156, discountPercentage: 10, inclusions: ['Pre-vacuum', 'Steam or dry cleaning', 'Stain treatment', 'Anti-allergen spray', 'Drying'] },
      { name: 'Pest Control', slug: 'pest-control', description: 'Chemical-free safe pest control for cockroaches, ants, mosquitoes, and rodents.', basePrice: 999, estimatedDurationMins: 90, rating: 4.5, reviewCount: 143, discountPercentage: 0, inclusions: ['Pre-service inspection', 'Treatment for targeted pests', 'Spray/gel application', 'Post-service guidance'] },
    ]
  },
  {
    category: { name: 'Electrician & Plumber', slug: 'electrician-plumber', description: 'Licensed electricians and plumbers for all home repair needs.', icon: 'Wrench' },
    services: [
      { name: 'Fan Installation', slug: 'fan-installation', description: 'Safe installation of ceiling fans, exhaust fans, and table fans.', basePrice: 299, estimatedDurationMins: 30, rating: 4.8, reviewCount: 387, discountPercentage: 0, inclusions: ['Ceiling hook installation', 'Wiring connection', 'Canopy fitting', 'Blade balancing', 'Test run'] },
      { name: 'Switch & Socket Repair', slug: 'switch-socket-repair', description: 'Replacement and repair of faulty switches, sockets, and MCBs.', basePrice: 199, estimatedDurationMins: 30, rating: 4.7, reviewCount: 265, discountPercentage: 0, inclusions: ['Fault detection', 'Old part removal', 'New part installation', 'Safety testing'] },
      { name: 'Wiring Repair', slug: 'wiring-repair', description: 'Diagnosis and repair of faulty or damaged electrical wiring in homes.', basePrice: 499, estimatedDurationMins: 60, rating: 4.6, reviewCount: 178, discountPercentage: 0, inclusions: ['Fault tracing', 'Wire replacement', 'Junction box work', 'Load testing'] },
      { name: 'Tap Repair', slug: 'tap-repair', description: 'Fixing leaking taps, replacing washers, and repairing taps in kitchens and bathrooms.', basePrice: 199, estimatedDurationMins: 30, rating: 4.7, reviewCount: 312, discountPercentage: 0, inclusions: ['Tap inspection', 'Washer replacement', 'Seal replacement', 'Leak test'] },
      { name: 'Pipe Leakage Repair', slug: 'pipe-leakage-repair', description: 'Detection and repair of hidden water pipe leaks using pressure testing.', basePrice: 599, estimatedDurationMins: 90, rating: 4.5, reviewCount: 134, discountPercentage: 0, inclusions: ['Pressure test', 'Leak detection', 'Pipe repair', 'Joint sealing', 'Final test'] },
      { name: 'Drain Cleaning', slug: 'drain-cleaning', description: 'Unclogging of blocked bathroom, kitchen, and outdoor drains.', basePrice: 399, estimatedDurationMins: 45, rating: 4.6, reviewCount: 198, discountPercentage: 10, inclusions: ['Block detection', 'Mechanical unclogging', 'Chemical treatment if needed', 'Water flow test'] },
      { name: 'Light Installation', slug: 'light-installation', description: 'Installation of ceiling lights, LED panels, chandeliers, and spotlights.', basePrice: 249, estimatedDurationMins: 30, rating: 4.8, reviewCount: 289, discountPercentage: 0, inclusions: ['Fixture mounting', 'Wiring', 'Driver installation', 'Test run'] },
    ]
  },
  {
    category: { name: 'Salon for Women', slug: 'salon-women', description: 'Professional salon services for women at home.', icon: 'Brush' },
    services: [
      { name: 'Haircut & Styling', slug: 'haircut-women', description: 'Professional haircut with blow-dry and styling by experienced salon experts at home.', basePrice: 399, estimatedDurationMins: 60, rating: 4.9, reviewCount: 521, discountPercentage: 10, inclusions: ['Consultation', 'Shampoo & conditioner', 'Haircut', 'Blow-dry', 'Styling'] },
      { name: 'Facial', slug: 'facial-women', description: 'Relaxing deep-cleansing facial for radiant and glowing skin.', basePrice: 599, estimatedDurationMins: 60, rating: 4.8, reviewCount: 389, discountPercentage: 15, inclusions: ['Skin analysis', 'Cleansing', 'Scrubbing', 'Facial massage', 'Mask application', 'Moisturising'] },
      { name: 'Full Body Waxing', slug: 'full-body-waxing', description: 'Complete body waxing using Rica or chocolate wax for smooth, long-lasting results.', basePrice: 799, estimatedDurationMins: 90, rating: 4.7, reviewCount: 312, discountPercentage: 20, inclusions: ['Arms', 'Legs', 'Underarms', 'Upper lip', 'Back'] },
      { name: 'Manicure', slug: 'manicure', description: 'Classic manicure with nail shaping, cuticle care, and nail paint application.', basePrice: 299, estimatedDurationMins: 45, rating: 4.8, reviewCount: 267, discountPercentage: 0, inclusions: ['Nail soaking', 'Shaping', 'Cuticle care', 'Hand massage', 'Nail paint'] },
      { name: 'Pedicure', slug: 'pedicure', description: 'Relaxing pedicure with foot scrub, nail care, and massage.', basePrice: 399, estimatedDurationMins: 60, rating: 4.8, reviewCount: 289, discountPercentage: 0, inclusions: ['Foot soak', 'Scrubbing', 'Nail shaping', 'Cuticle care', 'Foot massage', 'Nail paint'] },
      { name: 'Hair Spa', slug: 'hair-spa', description: 'Nourishing hair spa treatment to repair damaged and dry hair.', basePrice: 699, estimatedDurationMins: 75, rating: 4.7, reviewCount: 198, discountPercentage: 10, inclusions: ['Oil massage', 'Steam treatment', 'Shampoo', 'Conditioning', 'Blow-dry'] },
    ]
  },
  {
    category: { name: 'Salon for Men', slug: 'salon-men', description: 'Professional grooming services for men at home.', icon: 'Scissors' },
    services: [
      { name: "Men's Haircut", slug: 'haircut-men', description: 'Professional haircut by expert barbers with styling and finishing.', basePrice: 249, estimatedDurationMins: 30, rating: 4.8, reviewCount: 434, discountPercentage: 0, inclusions: ['Consultation', 'Haircut', 'Styling', 'Finishing spray'] },
      { name: 'Beard Grooming', slug: 'beard-grooming', description: 'Professional beard shaping, trimming, and styling.', basePrice: 199, estimatedDurationMins: 30, rating: 4.7, reviewCount: 312, discountPercentage: 0, inclusions: ['Beard wash', 'Trimming', 'Shaping', 'Beard oil application'] },
      { name: "Men's Facial", slug: 'facial-men', description: 'Deep cleansing facial for men with de-tanning and skin brightening.', basePrice: 499, estimatedDurationMins: 45, rating: 4.6, reviewCount: 189, discountPercentage: 10, inclusions: ['Skin cleansing', 'De-tan scrub', 'Facial massage', 'Mask', 'Moisturiser'] },
      { name: "Men's Clean Up", slug: 'cleanup-men', description: 'Quick refreshing clean-up treatment for men.', basePrice: 299, estimatedDurationMins: 30, rating: 4.7, reviewCount: 234, discountPercentage: 0, inclusions: ['Face wash', 'Scrub', 'Steam', 'Mask', 'Moisturiser'] },
      { name: 'Hair Colour for Men', slug: 'hair-colour-men', description: 'Professional hair colouring for men including root touch-up.', basePrice: 599, estimatedDurationMins: 60, rating: 4.5, reviewCount: 143, discountPercentage: 15, inclusions: ['Consultation', 'Colour application', 'Development time', 'Shampoo', 'Conditioning'] },
    ]
  },
  {
    category: { name: "Women's Therapies", slug: 'womens-therapies', description: 'Relaxing therapeutic treatments for women.', icon: 'Flower2' },
    services: [
      { name: 'Full Body Massage', slug: 'full-body-massage-women', description: 'Relaxing full body Swedish or deep tissue massage by certified therapists.', basePrice: 1299, estimatedDurationMins: 90, rating: 4.9, reviewCount: 312, discountPercentage: 10, inclusions: ['Oil massage', 'Full body coverage', 'Steam towel finish', 'Relaxation session'] },
      { name: 'Head & Scalp Massage', slug: 'head-scalp-massage', description: 'Therapeutic head and scalp massage to relieve tension and improve circulation.', basePrice: 399, estimatedDurationMins: 30, rating: 4.8, reviewCount: 234, discountPercentage: 0, inclusions: ['Oil application', 'Scalp massage', 'Neck & shoulder', 'Cool-down'] },
      { name: 'De-Tan Treatment', slug: 'detan-treatment', description: 'Professional de-tanning treatment for arms, legs, and face.', basePrice: 699, estimatedDurationMins: 60, rating: 4.7, reviewCount: 189, discountPercentage: 15, inclusions: ['Cleansing', 'De-tan scrub', 'Mask application', 'Toning'] },
      { name: 'Bridal Makeup', slug: 'bridal-makeup', description: 'Professional bridal makeup with HD finish for special occasions.', basePrice: 3999, estimatedDurationMins: 120, rating: 4.9, reviewCount: 98, discountPercentage: 0, inclusions: ['Base preparation', 'Foundation & contouring', 'Eye makeup', 'Lip colour', 'Setting spray'] },
      { name: 'Eyebrow Threading', slug: 'eyebrow-threading', description: 'Expert eyebrow shaping and threading by trained professionals.', basePrice: 99, estimatedDurationMins: 15, rating: 4.8, reviewCount: 567, discountPercentage: 0, inclusions: ['Brow measurement', 'Threading', 'Shaping', 'Cooling lotion'] },
    ]
  },
  {
    category: { name: "Men's Therapies", slug: 'mens-therapies', description: 'Relaxing therapeutic treatments for men.', icon: 'User' },
    services: [
      { name: 'Full Body Massage for Men', slug: 'full-body-massage-men', description: 'Relaxing full body massage to relieve muscle tension and stress.', basePrice: 999, estimatedDurationMins: 60, rating: 4.8, reviewCount: 234, discountPercentage: 10, inclusions: ['Oil massage', 'Back & shoulders', 'Legs & arms', 'Relaxation session'] },
      { name: 'Sports Massage', slug: 'sports-massage', description: 'Deep tissue sports massage for athletes and active individuals.', basePrice: 1299, estimatedDurationMins: 90, rating: 4.7, reviewCount: 145, discountPercentage: 0, inclusions: ['Pressure point therapy', 'Deep tissue work', 'Muscle recovery focus', 'Cool-down'] },
      { name: 'Back Pain Therapy', slug: 'back-pain-therapy', description: 'Targeted therapy to relieve lower and upper back back pain.', basePrice: 799, estimatedDurationMins: 45, rating: 4.6, reviewCount: 178, discountPercentage: 5, inclusions: ['Pain assessment', 'Hot oil massage', 'Pressure therapy', 'Stretching'] },
      { name: "Men's Pedicure", slug: 'pedicure-men', description: 'Refreshing pedicure treatment designed for men with extra scrubbing.', basePrice: 349, estimatedDurationMins: 45, rating: 4.7, reviewCount: 189, discountPercentage: 0, inclusions: ['Foot soak', 'Scrubbing', 'Nail care', 'Foot massage', 'Moisturising'] },
      { name: "Men's Manicure", slug: 'manicure-men', description: 'Nail and hand care for men including cuticle care and buffing.', basePrice: 249, estimatedDurationMins: 30, rating: 4.6, reviewCount: 134, discountPercentage: 0, inclusions: ['Nail soaking', 'Shaping', 'Cuticle care', 'Hand massage', 'Buffing'] },
    ]
  },
  {
    category: { name: 'Hair, Skin & Nails', slug: 'hair-skin-nails', description: 'Specialist treatments for hair, skin, and nail care.', icon: 'Sparkles' },
    services: [
      { name: 'Keratin Treatment', slug: 'keratin-treatment', description: 'Professional keratin smoothing treatment for frizz-free, silky hair.', basePrice: 2499, estimatedDurationMins: 180, rating: 4.8, reviewCount: 167, discountPercentage: 10, inclusions: ['Hair analysis', 'Shampoo', 'Keratin application', 'Straightening', 'Post-treatment conditioning'] },
      { name: 'Nail Art', slug: 'nail-art', description: 'Creative nail art designs using gel, acrylic, and stamping techniques.', basePrice: 499, estimatedDurationMins: 60, rating: 4.9, reviewCount: 312, discountPercentage: 0, inclusions: ['Base coat', 'Design application', 'Top coat', 'UV setting', 'Nail art of choice'] },
      { name: 'Skin Brightening Facial', slug: 'skin-brightening-facial', description: 'Advanced skin brightening facial for a radiant and even skin tone.', basePrice: 899, estimatedDurationMins: 75, rating: 4.8, reviewCount: 189, discountPercentage: 15, inclusions: ['Double cleansing', 'Brightening serum', 'Vitamin C treatment', 'Mask', 'SPF moisturiser'] },
      { name: 'Hair Colour & Highlights', slug: 'hair-colour-highlights', description: 'Global colour, highlights, ombre, or balayage by professional colourists.', basePrice: 1999, estimatedDurationMins: 150, rating: 4.7, reviewCount: 145, discountPercentage: 0, inclusions: ['Consultation', 'Colour formulation', 'Application', 'Processing', 'Shampoo & conditioning', 'Style'] },
      { name: 'Gel Nails', slug: 'gel-nails', description: 'Long-lasting gel nail extension and overlay with UV curing.', basePrice: 799, estimatedDurationMins: 90, rating: 4.8, reviewCount: 267, discountPercentage: 10, inclusions: ['Nail prep', 'Gel base', 'Colour application', 'UV curing', 'Top coat', 'Finishing'] },
      { name: 'Anti-Dandruff Treatment', slug: 'anti-dandruff-treatment', description: 'Medicated scalp treatment to control dandruff and scalp issues.', basePrice: 599, estimatedDurationMins: 45, rating: 4.6, reviewCount: 134, discountPercentage: 5, inclusions: ['Scalp analysis', 'Medicated shampoo', 'Treatment serum', 'Scalp massage', 'Conditioning'] },
    ]
  },
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    let totalCategories = 0;
    let totalServices = 0;
    let skippedCategories = 0;
    let skippedServices = 0;

    for (const entry of SEED_DATA) {
      // Upsert category
      let category = await Category.findOne({ slug: entry.category.slug });
      if (!category) {
        category = await Category.create(entry.category);
        console.log(`  📁 Created category: ${category.name}`);
        totalCategories++;
      } else {
        console.log(`  ⏭️  Category exists: ${category.name}`);
        skippedCategories++;
      }

      // Upsert services
      for (const svc of entry.services) {
        const exists = await Service.findOne({ slug: svc.slug });
        if (!exists) {
          await Service.create({ ...svc, categoryId: category._id });
          console.log(`    ✅ Created service: ${svc.name}`);
          totalServices++;
        } else {
          console.log(`    ⏭️  Service exists: ${svc.name}`);
          skippedServices++;
        }
      }
    }

    console.log(`\n🎉 Seed complete!`);
    console.log(`   Categories created: ${totalCategories} | skipped: ${skippedCategories}`);
    console.log(`   Services created: ${totalServices} | skipped: ${skippedServices}`);
  } catch (err) {
    console.error('❌ Seed failed:', err);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

seed();
