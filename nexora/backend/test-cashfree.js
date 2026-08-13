require('dotenv').config();
const { Cashfree, CFEnvironment } = require('cashfree-pg');

async function testCashfree() {
  console.log('Testing Cashfree SDK Integration...');
  console.log('APP_ID:', process.env.CASHFREE_APP_ID);
  console.log('ENV:', process.env.CASHFREE_ENV);

  const cf = new Cashfree();
  cf.XClientId = process.env.CASHFREE_APP_ID;
  cf.XClientSecret = process.env.CASHFREE_SECRET_KEY;
  cf.XEnvironment = process.env.CASHFREE_ENV === 'PRODUCTION' 
    ? CFEnvironment.PRODUCTION 
    : CFEnvironment.SANDBOX;

  const orderId = `test_order_${Date.now()}`;
  
  const request = {
    order_amount: 100,
    order_currency: "INR",
    order_id: orderId,
    customer_details: {
      customer_id: "test_customer_123",
      customer_phone: "9999999999"
    }
  };

  try {
    console.log(`Attempting to create order: ${orderId}...`);
    const response = await cf.PGCreateOrder("2023-08-01", request).catch(async () => {
       return await cf.PGCreateOrder(request);
    });
    console.log('✅ SUCCESS! Cashfree Order Created!');
    console.log('Payment Session ID:', response.data.payment_session_id);
    console.log('Order Status:', response.data.order_status);
  } catch (error) {
    console.error('❌ FAILED to create order.');
    console.error(error.response?.data || error.message);
  }
}

testCashfree();
