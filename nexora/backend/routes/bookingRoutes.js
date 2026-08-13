const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { protect } = require('../middlewares/auth');

router.post('/create-order', protect, bookingController.createOrder);
router.post('/verify-payment', bookingController.verifyPayment);
router.get('/', protect, bookingController.getCustomerBookings);
router.get('/:id', protect, bookingController.getBookingDetails);
router.post('/:id/cancel', protect, bookingController.cancelBooking);

module.exports = router;
