const axios = require('axios');
const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('--- STARTING BOOKING E2E VERIFICATION ---');
  let adminToken = '';
  let partnerAToken = '';
  let partnerAId = '';

  try {
    const res = await axios.post(`${BASE_URL}/admin/login`, { email: 'admin@nexora.com', password: 'password123' });
    adminToken = res.data.token;
  } catch (err) { console.error('❌ Admin Login FAILED'); return; }

  try {
    const uniqueA = Date.now();
    const resA = await axios.post(`${BASE_URL}/partner/signup`, {
      name: 'Partner A ' + uniqueA, email: `partnerA_${uniqueA}@test.com`, phone: `9${String(uniqueA).slice(-9)}`, category: 'Home Painting', password: 'Password123!'
    });
    partnerAToken = resA.data.token;
    partnerAId = resA.data.vendor._id;

    await axios.put(`${BASE_URL}/partner/onboarding`, {
      onboardingStep: 3, experience: 5, kycDetails: { aadharNumber: '123456789012', panNumber: 'ABCDE1234F' }, bankDetails: { accountHolderName: 'Test', bankName: 'Test Bank', accountNumber: '123', ifscCode: 'TEST1234' }
    }, { headers: { Authorization: `Bearer ${partnerAToken}` } });
    await axios.post(`${BASE_URL}/partner/kyc/submit`, {}, { headers: { Authorization: `Bearer ${partnerAToken}` } });
    await axios.patch(`${BASE_URL}/admin/vendors/${partnerAId}/verify`, { action: 'verify' }, { headers: { Authorization: `Bearer ${adminToken}` } });
  } catch (err) { console.error('❌ Partner Setup FAILED', err.message); return; }

  try {
    const userUnique = Date.now();
    const userRes = await axios.post(`${BASE_URL}/user/signup`, {
      name: 'Customer', email: `customer_${userUnique}@test.com`, phone: `8${String(userUnique).slice(-9)}`, password: 'password123'
    });
    const userToken = userRes.data.token;

    const mongoose = require('mongoose');
    require('dotenv').config();
    const Service = require('./models/Service');
    await mongoose.connect(process.env.MONGODB_URI);
    const serviceRecord = await Service.findOne();
    if (!serviceRecord) throw new Error("No service found in DB to test booking");
    const validServiceId = serviceRecord._id;

    const bookingRes = await axios.post(`${BASE_URL}/bookings/create-order`, {
      serviceId: validServiceId,
      scheduledDate: new Date(),
      scheduledSlot: 'Morning',
      location: { address: 'Test Location', coordinates: [77, 28] },
      basePrice: 1000
    }, { headers: { Authorization: `Bearer ${userToken}` } });

    const orderId = bookingRes.data.orderId;
    let bookingId = bookingRes.data.bookingId;

    // We cannot use Cashfree without a real checkout, so we mock the payment manually via Mongoose
    const Booking = require('./models/Booking');
    await Booking.findByIdAndUpdate(bookingId, {
      status: 'REQUESTED',
      'paymentDetails.status': 'PAID',
      'paymentDetails.cashfreePaymentSessionId': 'mock_payment'
    });
    console.log('✅ Booking creation and mock payment VERIFIED');

    await axios.post(`${BASE_URL}/admin/assign/${bookingId}`, { vendorId: partnerAId }, { headers: { Authorization: `Bearer ${adminToken}` } });
    console.log('✅ Booking assignment VERIFIED');

    await axios.post(`${BASE_URL}/partner/requests/${bookingId}/accept`, {}, { headers: { Authorization: `Bearer ${partnerAToken}` } });
    console.log('✅ Partner Accept Booking VERIFIED');

    let activeReqs = await axios.get(`${BASE_URL}/partner/my-requests`, { headers: { Authorization: `Bearer ${partnerAToken}` } });
    let b = activeReqs.data.find(r => r._id === bookingId);
    let otp = b ? b.otp : "1234"; // it might not return otp in the API response directly but let's see. If not, it will fail.
    if(!otp) {
        // If OTP is not in API response, we simulate reading it directly from DB
        const mongoose = require('mongoose');
        const Booking = require('./models/Booking');
        await mongoose.connect(process.env.MONGODB_URI);
        const bookingRecord = await Booking.findById(bookingId);
        otp = bookingRecord.otp;
    }

    // Partner Arrives
    await axios.patch(`${BASE_URL}/partner/requests/${bookingId}/status`, { status: 'ARRIVED' }, { headers: { Authorization: `Bearer ${partnerAToken}` } });
    console.log('✅ Partner Arrive Booking (ARRIVED) VERIFIED');

    // Partner Starts
    await axios.patch(`${BASE_URL}/partner/requests/${bookingId}/status`, { status: 'IN_PROGRESS', otp, beforePhotoUrl: 'http://example.com/before.jpg' }, { headers: { Authorization: `Bearer ${partnerAToken}` } });
    console.log('✅ Partner Start Booking (IN_PROGRESS) VERIFIED');

    // Partner Complete
    await axios.patch(`${BASE_URL}/partner/requests/${bookingId}/status`, { status: 'COMPLETED', afterPhotoUrl: 'http://example.com/after.jpg' }, { headers: { Authorization: `Bearer ${partnerAToken}` } });
    console.log('✅ Partner Complete Booking (COMPLETED) VERIFIED');

    const walletRes = await axios.get(`${BASE_URL}/partner/profile`, { headers: { Authorization: `Bearer ${partnerAToken}` } });
    if (walletRes.data.vendor.walletBalance > 0) {
      console.log('✅ Wallet Balance & Commission update VERIFIED');
    } else {
      console.log('❌ Wallet Balance update FAILED');
    }
  } catch(err) {
    console.error('❌ Booking Test FAILED', err.response?.data || err.message);
  }
  console.log('--- TEST COMPLETE ---');
}
runTests();
