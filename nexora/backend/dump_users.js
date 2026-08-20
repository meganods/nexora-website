require('dotenv').config();
const mongoose = require('mongoose');
const MONGO_URI = process.env.MONGODB_URI;

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
  const Partner = mongoose.model('ServicePartner', new mongoose.Schema({}, { strict: false }));

  const users = await User.find({});
  console.log('USERS IN DATABASE:');
  console.log(JSON.stringify(users.map(u => ({ id: u._id, name: u.name, phone: u.phone, email: u.email })), null, 2));

  const partners = await Partner.find({});
  console.log('PARTNERS IN DATABASE:');
  console.log(JSON.stringify(partners.map(p => ({ id: p._id, name: p.name, phone: p.phone, email: p.email })), null, 2));

  mongoose.connection.close();
}

run().catch(console.error);
