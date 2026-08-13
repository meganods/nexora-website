const mongoose = require('mongoose');
const ServicePartner = require('./backend/models/ServicePartner');
require('dotenv').config({ path: './backend/.env' });

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const vendors = await ServicePartner.find({}).select("email phone");
  console.log("Registered vendors:", vendors);
  process.exit();
}
run();
