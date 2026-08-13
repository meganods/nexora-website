require('dotenv').config();
const mongoose = require('mongoose');
const Service = require('./models/Service');
const Category = require('./models/Category');

async function seedTestService() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    let category = await Category.findOne();
    if (!category) {
      category = await Category.create({ name: 'Test Category', slug: 'test-category' });
    }

    const testService = await Service.create({
      categoryId: category._id,
      name: 'Test Service',
      slug: 'test-service',
      description: 'A test service for testing live payments',
      basePrice: 1,
      estimatedDurationMins: 30
    });

    console.log('Test Service created!');
    console.log('ID:', testService._id);
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seedTestService();
