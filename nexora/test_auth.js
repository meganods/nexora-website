const mongoose = require('mongoose');
const ServicePartner = require('./backend/models/ServicePartner');
require('dotenv').config({ path: './backend/.env' });

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const vendor = await ServicePartner.findOne({ email: 'test@example.com' });
  if (!vendor) {
    console.log("No test vendor found. Creating one.");
    const v = new ServicePartner({
      name: "Test Vendor",
      email: "test@example.com",
      phone: "9999999999",
      category: "Plumbing",
      password: "password123",
      kycStatus: "APPROVED"
    });
    await v.save();
    console.log("Test vendor created.");
  } else {
    console.log("Test vendor exists.");
  }
  process.exit();
}
run();
