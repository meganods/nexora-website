const mongoose = require('mongoose');
require('dotenv').config();
const Category = require('../models/Category');
const Service = require('../models/Service');

const categoriesData = [
  { name: "Salon for Women", slug: "salon-women", description: "Premium salon, makeup, facial and hair treatment at home.", icon: "Brush", fee: 12 },
  { name: "Salon for Men", slug: "salon-men", description: "Grooming, haircuts, shave, massage and beard styling.", icon: "Scissors", fee: 10 },
  { name: "AC & Appliance Repair", slug: "ac-appliance", description: "Expert service for AC jet wash, refrigerators, and washing machines.", icon: "Wind", fee: 15 },
  { name: "Cleaning & Pest Control", slug: "cleaning-pest", description: "Deep home cleaning, bathroom disinfection, and pest eradication.", icon: "Broom", fee: 12 },
  { name: "Electrician & Plumbing", slug: "electrician-plumbing", description: "On-demand repairs, wiring, geyser install, pipe fixes and taps.", icon: "Wrench", fee: 10 },
  { name: "Carpentry", slug: "carpentry", description: "Furniture repair, lock replacement, and bespoke fittings.", icon: "Wrench", fee: 10 },
  { name: "Home Painting", slug: "home-painting", description: "Consultation, wall putty, waterproof coatings and full home color.", icon: "Brush", fee: 14 },
  { name: "Spa & Therapies", slug: "spa-therapies", description: "Stress-relieving massages, body scrubs and wellness therapy.", icon: "Flower2", fee: 15 },
  { name: "Packagers & Movers", slug: "packagers-movers", description: "Seamless shifting, packing materials, and safe transport.", icon: "Wind", fee: 12 },
  { name: "Water Purifier Service", slug: "water-purifier", description: "RO repair, filter replacement, and TDS status check.", icon: "Wrench", fee: 10 }
];

const getServicesData = (categoryId, categorySlug) => {
  return Array.from({ length: 10 }).map((_, idx) => {
    const serviceNum = idx + 1;
    const basePrice = Math.floor(199 + (Math.random() * 2300));
    const duration = Math.floor(30 + (Math.random() * 150));
    const rating = parseFloat((4.2 + (Math.random() * 0.7)).toFixed(1));
    const reviews = Math.floor(15 + (Math.random() * 200));
    const discount = [0, 10, 15, 20, 25][Math.floor(Math.random() * 5)];

    return {
      categoryId,
      name: `${categorySlug.replace('-', ' ')} Service Item ${serviceNum}`,
      slug: `${categorySlug}-service-${serviceNum}`,
      description: `High-quality, professional at-home ${categorySlug.replace('-', ' ')} service number ${serviceNum}. Certified technician guaranteed.`,
      basePrice,
      estimatedDurationMins: duration,
      inclusions: ["Verified Materials", "Service Warranty", "Post-Service Cleanup"],
      imageUrl: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 1000000)}?auto=format&fit=crop&w=600&q=80`,
      rating,
      reviewCount: reviews,
      discountPercentage: discount,
      isActive: true
    };
  });
};

const seedDatabase = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error("MONGODB_URI is not defined");

    await mongoose.connect(uri);
    console.log("Connected to MongoDB for seeding...");

    // Clear existing
    await Category.deleteMany({});
    await Service.deleteMany({});
    console.log("Cleared old Categories and Services successfully.");

    // Seed Categories
    for (const cat of categoriesData) {
      const dbCat = await Category.create({
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        icon: cat.icon,
        platformFeePercentage: cat.fee,
        isActive: true
      });

      // Seed 10 services under this category
      const services = getServicesData(dbCat._id, dbCat.slug);
      await Service.insertMany(services);
      console.log(`Seeded category [${dbCat.name}] with 10 service sub-items.`);
    }

    console.log("🎉 Database seeding completed successfully! Added 10 categories and 100 services.");
    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
};

seedDatabase();
