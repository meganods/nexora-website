/**
 * Replace all placeholder services with realistic named services
 */
require('dotenv').config();
const mongoose = require('mongoose');
require('./models/Category');
const Service = require('./models/Service');
const Category = require('./models/Category');

const REAL_SERVICES = {
  'salon-women': [
    { name: 'Haircut & Blow Dry', slug: 'haircut-blowdry-women', description: 'Professional haircut with blow-dry and styling by experienced salon experts at home.', basePrice: 399, estimatedDurationMins: 60, rating: 4.9, reviewCount: 521, discountPercentage: 10, inclusions: ['Consultation', 'Shampoo & conditioner', 'Haircut', 'Blow-dry', 'Styling'] },
    { name: 'Deep Cleansing Facial', slug: 'deep-cleansing-facial', description: 'Relaxing deep-cleansing facial for radiant and glowing skin.', basePrice: 599, estimatedDurationMins: 60, rating: 4.8, reviewCount: 389, discountPercentage: 15, inclusions: ['Skin analysis', 'Cleansing', 'Scrubbing', 'Facial massage', 'Mask', 'Moisturising'] },
    { name: 'Full Body Waxing', slug: 'full-body-waxing-women', description: 'Rica or chocolate wax for smooth, long-lasting results.', basePrice: 799, estimatedDurationMins: 90, rating: 4.7, reviewCount: 312, discountPercentage: 20, inclusions: ['Arms', 'Legs', 'Underarms', 'Upper lip'] },
    { name: 'Classic Manicure', slug: 'classic-manicure-women', description: 'Classic manicure with nail shaping, cuticle care, and nail paint.', basePrice: 299, estimatedDurationMins: 45, rating: 4.8, reviewCount: 267, discountPercentage: 0, inclusions: ['Nail soaking', 'Shaping', 'Cuticle care', 'Hand massage', 'Nail paint'] },
    { name: 'Classic Pedicure', slug: 'classic-pedicure-women', description: 'Relaxing pedicure with foot scrub, nail care, and massage.', basePrice: 399, estimatedDurationMins: 60, rating: 4.8, reviewCount: 289, discountPercentage: 0, inclusions: ['Foot soak', 'Scrubbing', 'Nail shaping', 'Foot massage', 'Nail paint'] },
    { name: 'Hair Spa Treatment', slug: 'hair-spa-women', description: 'Nourishing hair spa to repair damaged and dry hair.', basePrice: 699, estimatedDurationMins: 75, rating: 4.7, reviewCount: 198, discountPercentage: 10, inclusions: ['Oil massage', 'Steam', 'Shampoo', 'Conditioning', 'Blow-dry'] },
    { name: 'Eyebrow Threading', slug: 'eyebrow-threading-women', description: 'Expert eyebrow shaping and threading.', basePrice: 99, estimatedDurationMins: 15, rating: 4.8, reviewCount: 567, discountPercentage: 0, inclusions: ['Brow measurement', 'Threading', 'Shaping'] },
    { name: 'Bridal Makeup', slug: 'bridal-makeup-women', description: 'Professional bridal makeup with HD finish.', basePrice: 3999, estimatedDurationMins: 120, rating: 4.9, reviewCount: 98, discountPercentage: 0, inclusions: ['Foundation & contouring', 'Eye makeup', 'Lip colour', 'Setting spray'] },
    { name: 'De-Tan Treatment', slug: 'detan-treatment-women', description: 'Professional de-tanning for arms, legs, and face.', basePrice: 699, estimatedDurationMins: 60, rating: 4.7, reviewCount: 189, discountPercentage: 15, inclusions: ['Cleansing', 'De-tan scrub', 'Mask', 'Toning'] },
    { name: 'Nail Art', slug: 'nail-art-women', description: 'Creative nail art designs using gel and acrylic.', basePrice: 499, estimatedDurationMins: 60, rating: 4.9, reviewCount: 312, discountPercentage: 0, inclusions: ['Base coat', 'Design', 'Top coat', 'UV setting'] },
  ],
  'salon-men': [
    { name: "Men's Haircut & Styling", slug: 'haircut-styling-men', description: 'Professional haircut by expert barbers with styling.', basePrice: 249, estimatedDurationMins: 30, rating: 4.8, reviewCount: 434, discountPercentage: 0, inclusions: ['Consultation', 'Haircut', 'Styling', 'Finishing spray'] },
    { name: 'Beard Grooming & Shaping', slug: 'beard-grooming-men', description: 'Professional beard trimming, shaping, and styling.', basePrice: 199, estimatedDurationMins: 30, rating: 4.7, reviewCount: 312, discountPercentage: 0, inclusions: ['Beard wash', 'Trimming', 'Shaping', 'Beard oil'] },
    { name: "Men's Facial & Clean Up", slug: 'facial-cleanup-men', description: 'Deep cleansing facial for men with de-tanning.', basePrice: 499, estimatedDurationMins: 45, rating: 4.6, reviewCount: 189, discountPercentage: 10, inclusions: ['Cleansing', 'Scrub', 'Facial massage', 'Mask', 'Moisturiser'] },
    { name: 'Hair Colour for Men', slug: 'hair-colour-men', description: 'Professional hair colouring including root touch-up.', basePrice: 599, estimatedDurationMins: 60, rating: 4.5, reviewCount: 143, discountPercentage: 15, inclusions: ['Consultation', 'Colour application', 'Shampoo', 'Conditioning'] },
    { name: "Men's Manicure", slug: 'manicure-men', description: 'Nail and hand care including cuticle care and buffing.', basePrice: 249, estimatedDurationMins: 30, rating: 4.6, reviewCount: 134, discountPercentage: 0, inclusions: ['Nail soaking', 'Shaping', 'Cuticle care', 'Hand massage'] },
    { name: "Men's Pedicure", slug: 'pedicure-men', description: 'Refreshing pedicure designed for men.', basePrice: 349, estimatedDurationMins: 45, rating: 4.7, reviewCount: 189, discountPercentage: 0, inclusions: ['Foot soak', 'Scrubbing', 'Nail care', 'Foot massage'] },
    { name: 'Head Massage', slug: 'head-massage-men', description: 'Therapeutic head massage to relieve stress.', basePrice: 299, estimatedDurationMins: 30, rating: 4.8, reviewCount: 198, discountPercentage: 0, inclusions: ['Oil application', 'Scalp massage', 'Neck & shoulder'] },
    { name: "Men's D-Tan Pack", slug: 'dtan-men', description: 'Quick de-tanning treatment for face and neck.', basePrice: 349, estimatedDurationMins: 30, rating: 4.6, reviewCount: 167, discountPercentage: 10, inclusions: ['Face wash', 'D-tan pack', 'Moisturiser'] },
    { name: 'Anti-Dandruff Treatment', slug: 'anti-dandruff-men', description: 'Medicated scalp treatment for dandruff control.', basePrice: 399, estimatedDurationMins: 40, rating: 4.5, reviewCount: 112, discountPercentage: 0, inclusions: ['Scalp analysis', 'Medicated shampoo', 'Treatment serum'] },
    { name: 'Hair Spa for Men', slug: 'hair-spa-men', description: 'Nourishing hair spa treatment for men.', basePrice: 499, estimatedDurationMins: 60, rating: 4.6, reviewCount: 145, discountPercentage: 10, inclusions: ['Oil massage', 'Steam', 'Shampoo', 'Conditioning'] },
  ],
  'ac-appliance': [
    { name: 'AC Repair', slug: 'ac-repair', description: 'Expert diagnosis and repair of split, window, and central AC units.', basePrice: 499, estimatedDurationMins: 60, rating: 4.8, reviewCount: 342, discountPercentage: 10, inclusions: ['Diagnosis', 'Filter cleaning', 'Coolant check', 'Electrical inspection'] },
    { name: 'AC Installation', slug: 'ac-installation', description: 'Professional installation of split ACs with pipe laying.', basePrice: 799, estimatedDurationMins: 120, rating: 4.7, reviewCount: 215, discountPercentage: 0, inclusions: ['Wall mounting', 'Pipe fitting', 'Wiring', 'Test run'] },
    { name: 'AC Gas Refill', slug: 'ac-gas-refill', description: 'Refrigerant gas refill for optimal cooling.', basePrice: 1299, estimatedDurationMins: 45, rating: 4.6, reviewCount: 189, discountPercentage: 5, inclusions: ['Pressure test', 'Gas filling', 'Leak detection'] },
    { name: 'AC Deep Cleaning', slug: 'ac-deep-cleaning', description: 'Complete deep cleaning of AC indoor and outdoor units.', basePrice: 599, estimatedDurationMins: 90, rating: 4.9, reviewCount: 278, discountPercentage: 15, inclusions: ['Indoor cleaning', 'Outdoor cleaning', 'Filter wash', 'Coil cleaning'] },
    { name: 'AC Annual Maintenance', slug: 'ac-annual-maintenance', description: 'Annual maintenance contract covering cleaning and service.', basePrice: 1499, estimatedDurationMins: 90, rating: 4.7, reviewCount: 124, discountPercentage: 20, inclusions: ['2 service visits/year', 'Cleaning', 'Gas check', 'Priority support'] },
    { name: 'Washing Machine Repair', slug: 'washing-machine-repair', description: 'Repair for fully and semi-automatic washing machines.', basePrice: 399, estimatedDurationMins: 60, rating: 4.6, reviewCount: 167, discountPercentage: 0, inclusions: ['Fault diagnosis', 'Drum cleaning', 'Pump check'] },
    { name: 'Refrigerator Repair', slug: 'refrigerator-repair', description: 'Compressor, thermostat, and door seal repairs.', basePrice: 449, estimatedDurationMins: 60, rating: 4.5, reviewCount: 143, discountPercentage: 0, inclusions: ['Cooling diagnosis', 'Compressor check', 'Seal inspection'] },
    { name: 'Microwave Repair', slug: 'microwave-repair', description: 'Repair of all microwave brands and types.', basePrice: 349, estimatedDurationMins: 45, rating: 4.5, reviewCount: 98, discountPercentage: 0, inclusions: ['Fault detection', 'Component repair', 'Test run'] },
    { name: 'Geyser Repair', slug: 'geyser-repair', description: 'Repair and servicing of all types of geysers.', basePrice: 299, estimatedDurationMins: 45, rating: 4.7, reviewCount: 156, discountPercentage: 0, inclusions: ['Heating element check', 'Thermostat repair', 'Safety valve test'] },
    { name: 'TV Repair', slug: 'tv-repair', description: 'Repair of LED, LCD, and Smart TVs of all brands.', basePrice: 499, estimatedDurationMins: 60, rating: 4.4, reviewCount: 87, discountPercentage: 0, inclusions: ['Fault diagnosis', 'Panel check', 'Component repair'] },
  ],
  'cleaning-pest': [
    { name: 'Deep Home Cleaning', slug: 'deep-home-cleaning', description: 'Complete deep cleaning of entire home.', basePrice: 799, estimatedDurationMins: 180, rating: 4.9, reviewCount: 412, discountPercentage: 20, inclusions: ['All rooms dusting', 'Kitchen deep clean', 'Bathroom scrubbing', 'Floor mopping'] },
    { name: 'Bathroom Deep Cleaning', slug: 'bathroom-deep-cleaning', description: 'Deep scrubbing of bathrooms including tiles and toilet.', basePrice: 399, estimatedDurationMins: 60, rating: 4.8, reviewCount: 298, discountPercentage: 10, inclusions: ['Tile scrubbing', 'Toilet sanitisation', 'Basin cleaning', 'Floor mopping'] },
    { name: 'Kitchen Deep Cleaning', slug: 'kitchen-deep-cleaning', description: 'Thorough cleaning of chimney, hob, tiles, and cabinets.', basePrice: 599, estimatedDurationMins: 120, rating: 4.7, reviewCount: 234, discountPercentage: 15, inclusions: ['Chimney cleaning', 'Hob cleaning', 'Tile degreasing', 'Floor mopping'] },
    { name: 'Sofa & Upholstery Cleaning', slug: 'sofa-cleaning', description: 'Dry and wet cleaning of fabric and leather sofas.', basePrice: 499, estimatedDurationMins: 60, rating: 4.6, reviewCount: 189, discountPercentage: 0, inclusions: ['Pre-treatment', 'Deep cleaning', 'Stain removal', 'Deodorising'] },
    { name: 'Carpet & Rug Cleaning', slug: 'carpet-cleaning', description: 'Steam and dry cleaning of carpets and rugs.', basePrice: 699, estimatedDurationMins: 90, rating: 4.7, reviewCount: 156, discountPercentage: 10, inclusions: ['Pre-vacuum', 'Steam cleaning', 'Stain treatment', 'Anti-allergen spray'] },
    { name: 'Pest Control', slug: 'pest-control', description: 'Safe pest control for cockroaches, ants, and mosquitoes.', basePrice: 999, estimatedDurationMins: 90, rating: 4.5, reviewCount: 143, discountPercentage: 0, inclusions: ['Inspection', 'Targeted treatment', 'Spray application'] },
    { name: 'Tank & Overhead Cleaning', slug: 'tank-cleaning', description: 'Water tank and overhead tank cleaning and disinfection.', basePrice: 799, estimatedDurationMins: 90, rating: 4.6, reviewCount: 112, discountPercentage: 5, inclusions: ['Draining', 'Scrubbing', 'Disinfection', 'Refill check'] },
    { name: 'Balcony Cleaning', slug: 'balcony-cleaning', description: 'Deep cleaning of balcony floor, railing, and walls.', basePrice: 299, estimatedDurationMins: 45, rating: 4.7, reviewCount: 98, discountPercentage: 0, inclusions: ['Railing scrubbing', 'Floor cleaning', 'Drain clearing'] },
    { name: 'Post-Construction Cleaning', slug: 'post-construction-cleaning', description: 'Professional cleaning after renovation or construction.', basePrice: 1499, estimatedDurationMins: 240, rating: 4.8, reviewCount: 87, discountPercentage: 10, inclusions: ['Debris removal', 'Dust cleaning', 'Surface scrubbing', 'Floor polishing'] },
    { name: 'Disinfection & Sanitisation', slug: 'disinfection-service', description: 'Complete home disinfection with certified solutions.', basePrice: 599, estimatedDurationMins: 60, rating: 4.8, reviewCount: 234, discountPercentage: 0, inclusions: ['Surface spray', 'Fogging', 'Touch point sanitisation'] },
  ],
  'electrician-plumbing': [
    { name: 'Fan Installation', slug: 'fan-installation', description: 'Safe installation of ceiling fans and exhaust fans.', basePrice: 299, estimatedDurationMins: 30, rating: 4.8, reviewCount: 387, discountPercentage: 0, inclusions: ['Ceiling hook', 'Wiring', 'Canopy fitting', 'Test run'] },
    { name: 'Switch & Socket Repair', slug: 'switch-socket-repair', description: 'Replacement of faulty switches, sockets, and MCBs.', basePrice: 199, estimatedDurationMins: 30, rating: 4.7, reviewCount: 265, discountPercentage: 0, inclusions: ['Fault detection', 'Part removal', 'New installation', 'Safety test'] },
    { name: 'Wiring & Rewiring', slug: 'wiring-repair', description: 'Diagnosis and repair of faulty electrical wiring.', basePrice: 499, estimatedDurationMins: 60, rating: 4.6, reviewCount: 178, discountPercentage: 0, inclusions: ['Fault tracing', 'Wire replacement', 'Load testing'] },
    { name: 'Light Installation', slug: 'light-installation', description: 'Installation of ceiling lights, LED panels, and spotlights.', basePrice: 249, estimatedDurationMins: 30, rating: 4.8, reviewCount: 289, discountPercentage: 0, inclusions: ['Fixture mounting', 'Wiring', 'Test run'] },
    { name: 'MCB & DB Box Work', slug: 'mcb-db-box', description: 'MCB installation, DB box repair and load balancing.', basePrice: 399, estimatedDurationMins: 45, rating: 4.6, reviewCount: 134, discountPercentage: 0, inclusions: ['Inspection', 'MCB replacement', 'Load balancing', 'Safety test'] },
    { name: 'Tap & Faucet Repair', slug: 'tap-repair', description: 'Fixing leaking taps and replacing washers.', basePrice: 199, estimatedDurationMins: 30, rating: 4.7, reviewCount: 312, discountPercentage: 0, inclusions: ['Tap inspection', 'Washer replacement', 'Seal replacement', 'Leak test'] },
    { name: 'Pipe Leakage Repair', slug: 'pipe-leakage-repair', description: 'Detection and repair of hidden water pipe leaks.', basePrice: 599, estimatedDurationMins: 90, rating: 4.5, reviewCount: 134, discountPercentage: 0, inclusions: ['Pressure test', 'Leak detection', 'Pipe repair'] },
    { name: 'Drain Cleaning & Unclogging', slug: 'drain-cleaning', description: 'Unclogging of bathroom, kitchen, and outdoor drains.', basePrice: 399, estimatedDurationMins: 45, rating: 4.6, reviewCount: 198, discountPercentage: 10, inclusions: ['Block detection', 'Mechanical unclogging', 'Water flow test'] },
    { name: 'Geyser Installation', slug: 'geyser-installation', description: 'Safe installation of electric and gas geysers.', basePrice: 499, estimatedDurationMins: 60, rating: 4.7, reviewCount: 156, discountPercentage: 0, inclusions: ['Bracket mounting', 'Pipe connection', 'Electrical wiring', 'Test run'] },
    { name: 'Toilet Repair & Installation', slug: 'toilet-repair', description: 'Repair of flush tanks, seats, and toilet fitting.', basePrice: 349, estimatedDurationMins: 45, rating: 4.5, reviewCount: 112, discountPercentage: 0, inclusions: ['Flush mechanism', 'Seat replacement', 'Seal repair'] },
  ],
  'carpentry': [
    { name: 'Furniture Assembly', slug: 'furniture-assembly', description: 'Professional assembly of flat-pack and modular furniture.', basePrice: 499, estimatedDurationMins: 90, rating: 4.7, reviewCount: 234, discountPercentage: 0, inclusions: ['Unboxing', 'Assembly', 'Levelling', 'Clean-up'] },
    { name: 'Door Repair & Fitting', slug: 'door-repair', description: 'Repair of wooden doors, hinges, and door locks.', basePrice: 299, estimatedDurationMins: 45, rating: 4.6, reviewCount: 167, discountPercentage: 0, inclusions: ['Hinge check', 'Door alignment', 'Lock repair'] },
    { name: 'Wardrobe Installation', slug: 'wardrobe-installation', description: 'Installation of modular and sliding wardrobes.', basePrice: 799, estimatedDurationMins: 120, rating: 4.8, reviewCount: 145, discountPercentage: 10, inclusions: ['Measurement', 'Panel fitting', 'Handle installation', 'Track alignment'] },
    { name: 'Window Repair & Fitting', slug: 'window-repair', description: 'Repair and installation of wooden and UPVC windows.', basePrice: 399, estimatedDurationMins: 60, rating: 4.5, reviewCount: 98, discountPercentage: 0, inclusions: ['Frame inspection', 'Glass replacement', 'Lock fitting'] },
    { name: 'TV Unit & Wall Mounting', slug: 'tv-unit-mounting', description: 'Wall mounting of TV and installation of TV units.', basePrice: 599, estimatedDurationMins: 60, rating: 4.8, reviewCount: 312, discountPercentage: 5, inclusions: ['Wall drilling', 'Bracket mounting', 'TV mounting', 'Cable management'] },
    { name: 'Shelves & Rack Installation', slug: 'shelf-installation', description: 'Installation of wall shelves and storage racks.', basePrice: 349, estimatedDurationMins: 45, rating: 4.7, reviewCount: 189, discountPercentage: 0, inclusions: ['Wall drilling', 'Bracket installation', 'Shelf fitting', 'Levelling'] },
    { name: 'Cabinet Repair', slug: 'cabinet-repair', description: 'Repair of kitchen and bathroom cabinets.', basePrice: 249, estimatedDurationMins: 30, rating: 4.5, reviewCount: 134, discountPercentage: 0, inclusions: ['Hinge repair', 'Handle replacement', 'Door alignment'] },
    { name: 'Bed Assembly', slug: 'bed-assembly', description: 'Assembly of single, double, and king-size beds.', basePrice: 599, estimatedDurationMins: 90, rating: 4.8, reviewCount: 198, discountPercentage: 0, inclusions: ['Frame assembly', 'Headboard fitting', 'Mattress placement'] },
    { name: 'False Ceiling Work', slug: 'false-ceiling', description: 'POP and gypsum false ceiling installation.', basePrice: 1999, estimatedDurationMins: 240, rating: 4.6, reviewCount: 87, discountPercentage: 15, inclusions: ['Framework', 'Panel fitting', 'Finishing', 'Primer coat'] },
    { name: 'Wooden Flooring', slug: 'wooden-flooring', description: 'Laminate and engineered wood flooring installation.', basePrice: 2499, estimatedDurationMins: 300, rating: 4.7, reviewCount: 65, discountPercentage: 10, inclusions: ['Surface preparation', 'Underlay fitting', 'Plank installation', 'Edge finishing'] },
  ],
  'home-painting': [
    { name: 'Interior Wall Painting', slug: 'interior-wall-painting', description: 'Professional interior painting with premium paints.', basePrice: 1499, estimatedDurationMins: 300, rating: 4.8, reviewCount: 234, discountPercentage: 10, inclusions: ['Surface preparation', 'Putty work', 'Primer coat', 'Two paint coats', 'Clean-up'] },
    { name: 'Exterior Wall Painting', slug: 'exterior-wall-painting', description: 'Weather-resistant exterior painting.', basePrice: 2499, estimatedDurationMins: 480, rating: 4.7, reviewCount: 145, discountPercentage: 15, inclusions: ['Surface repair', 'Waterproof primer', 'Two exterior coats'] },
    { name: 'Texture Painting', slug: 'texture-painting', description: 'Designer texture paint for walls with various patterns.', basePrice: 1999, estimatedDurationMins: 240, rating: 4.9, reviewCount: 112, discountPercentage: 0, inclusions: ['Surface prep', 'Base coat', 'Texture application', 'Design finish'] },
    { name: 'Wood & Metal Painting', slug: 'wood-metal-painting', description: 'Painting of doors, windows, grills, and metal surfaces.', basePrice: 799, estimatedDurationMins: 120, rating: 4.6, reviewCount: 167, discountPercentage: 5, inclusions: ['Sanding', 'Primer', 'Enamel paint', 'Finishing'] },
    { name: 'Waterproofing', slug: 'waterproofing', description: 'Waterproofing treatment for terrace, bathroom, and walls.', basePrice: 1999, estimatedDurationMins: 180, rating: 4.7, reviewCount: 98, discountPercentage: 0, inclusions: ['Surface cleaning', 'Crack filling', 'Waterproof coat', 'Test run'] },
    { name: 'Wall Putty & Primer', slug: 'wall-putty-primer', description: 'Smooth wall putty application before final paint.', basePrice: 999, estimatedDurationMins: 180, rating: 4.6, reviewCount: 134, discountPercentage: 0, inclusions: ['Surface prep', 'Putty application', 'Sanding', 'Primer coat'] },
    { name: 'Stencil & Design Painting', slug: 'stencil-painting', description: 'Creative stencil and design work for accent walls.', basePrice: 1499, estimatedDurationMins: 180, rating: 4.8, reviewCount: 87, discountPercentage: 10, inclusions: ['Design selection', 'Base coat', 'Stencil application', 'Finishing'] },
    { name: 'Ceiling Painting', slug: 'ceiling-painting', description: 'Fresh coat of paint for ceilings with professional tools.', basePrice: 999, estimatedDurationMins: 120, rating: 4.7, reviewCount: 112, discountPercentage: 0, inclusions: ['Surface prep', 'Primer', 'Two coats', 'Edge work'] },
    { name: 'Epoxy Floor Coating', slug: 'epoxy-floor-coating', description: 'Industrial-grade epoxy coating for parking and utility areas.', basePrice: 2999, estimatedDurationMins: 300, rating: 4.6, reviewCount: 45, discountPercentage: 0, inclusions: ['Surface grinding', 'Primer', 'Epoxy coat', 'Sealing'] },
    { name: 'Polish & Varnish Work', slug: 'polish-varnish', description: 'Wood polishing and varnishing for furniture and floors.', basePrice: 1499, estimatedDurationMins: 180, rating: 4.7, reviewCount: 78, discountPercentage: 5, inclusions: ['Sanding', 'Polish application', 'Varnish coat', 'Buffing'] },
  ],
  'spa-therapies': [
    { name: 'Swedish Full Body Massage', slug: 'swedish-massage', description: 'Relaxing full body Swedish massage for total relaxation.', basePrice: 1299, estimatedDurationMins: 90, rating: 4.9, reviewCount: 312, discountPercentage: 10, inclusions: ['Oil massage', 'Full body', 'Steam towel', 'Relaxation session'] },
    { name: 'Deep Tissue Massage', slug: 'deep-tissue-massage', description: 'Intense deep tissue massage for muscle relief.', basePrice: 1499, estimatedDurationMins: 90, rating: 4.8, reviewCount: 234, discountPercentage: 0, inclusions: ['Pressure point therapy', 'Deep tissue work', 'Cool-down'] },
    { name: 'Head & Neck Massage', slug: 'head-neck-massage', description: 'Therapeutic head, neck, and shoulder massage.', basePrice: 499, estimatedDurationMins: 45, rating: 4.8, reviewCount: 387, discountPercentage: 0, inclusions: ['Oil application', 'Scalp massage', 'Neck & shoulder work'] },
    { name: 'Foot & Reflexology', slug: 'foot-reflexology', description: 'Reflexology massage targeting pressure points in feet.', basePrice: 699, estimatedDurationMins: 60, rating: 4.7, reviewCount: 198, discountPercentage: 5, inclusions: ['Foot soak', 'Reflexology massage', 'Moisturising'] },
    { name: 'Aromatherapy Massage', slug: 'aromatherapy-massage', description: 'Relaxing massage with essential oils for wellness.', basePrice: 1199, estimatedDurationMins: 75, rating: 4.9, reviewCount: 167, discountPercentage: 10, inclusions: ['Essential oil selection', 'Full body massage', 'Relaxation'] },
    { name: 'Hot Stone Therapy', slug: 'hot-stone-therapy', description: 'Heated basalt stone massage for deep relaxation.', basePrice: 1699, estimatedDurationMins: 90, rating: 4.8, reviewCount: 98, discountPercentage: 15, inclusions: ['Stone heating', 'Stone placement', 'Massage', 'Cool-down'] },
    { name: 'Back Pain Therapy', slug: 'back-pain-therapy', description: 'Targeted therapy to relieve lower and upper back pain.', basePrice: 799, estimatedDurationMins: 45, rating: 4.6, reviewCount: 178, discountPercentage: 5, inclusions: ['Pain assessment', 'Hot oil massage', 'Pressure therapy'] },
    { name: 'Sports Massage', slug: 'sports-massage', description: 'Deep tissue sports massage for athletes.', basePrice: 1299, estimatedDurationMins: 90, rating: 4.7, reviewCount: 145, discountPercentage: 0, inclusions: ['Muscle assessment', 'Sports massage', 'Stretching'] },
    { name: 'Couple Massage', slug: 'couple-massage', description: 'Relaxing massage session for couples at home.', basePrice: 2499, estimatedDurationMins: 90, rating: 4.9, reviewCount: 87, discountPercentage: 20, inclusions: ['Side-by-side massage', 'Aromatherapy', 'Relaxation session'] },
    { name: 'Ayurvedic Massage', slug: 'ayurvedic-massage', description: 'Traditional Ayurvedic massage for holistic wellness.', basePrice: 1499, estimatedDurationMins: 90, rating: 4.8, reviewCount: 134, discountPercentage: 0, inclusions: ['Dosha assessment', 'Herbal oil', 'Ayurvedic techniques'] },
  ],
  'packagers-movers': [
    { name: 'Home Shifting (1 BHK)', slug: 'home-shifting-1bhk', description: 'Complete packing and moving service for 1 BHK homes.', basePrice: 4999, estimatedDurationMins: 480, rating: 4.7, reviewCount: 167, discountPercentage: 10, inclusions: ['Packing', 'Loading', 'Transport', 'Unloading', 'Unpacking'] },
    { name: 'Home Shifting (2 BHK)', slug: 'home-shifting-2bhk', description: 'Complete relocation service for 2 BHK homes.', basePrice: 7999, estimatedDurationMins: 720, rating: 4.7, reviewCount: 145, discountPercentage: 10, inclusions: ['Professional packing', 'Loading', 'Transport', 'Unloading', 'Arrangement'] },
    { name: 'Office Shifting', slug: 'office-shifting', description: 'Professional office relocation with minimal downtime.', basePrice: 9999, estimatedDurationMins: 720, rating: 4.8, reviewCount: 98, discountPercentage: 5, inclusions: ['Equipment packing', 'IT gear handling', 'Transport', 'Setup'] },
    { name: 'Furniture Transport', slug: 'furniture-transport', description: 'Safe transport of individual furniture items.', basePrice: 1999, estimatedDurationMins: 180, rating: 4.6, reviewCount: 134, discountPercentage: 0, inclusions: ['Wrapping', 'Loading', 'Transport', 'Placement'] },
    { name: 'Bike Transportation', slug: 'bike-transportation', description: 'Safe bike shifting with proper crating.', basePrice: 1499, estimatedDurationMins: 120, rating: 4.5, reviewCount: 112, discountPercentage: 5, inclusions: ['Crating', 'Loading', 'Transport', 'Delivery'] },
    { name: 'Car Transportation', slug: 'car-transportation', description: 'Door-to-door car transport on flatbed trucks.', basePrice: 4999, estimatedDurationMins: 240, rating: 4.6, reviewCount: 87, discountPercentage: 0, inclusions: ['Car inspection', 'Loading', 'Transport', 'Delivery inspection'] },
    { name: 'Packing Only Service', slug: 'packing-only', description: 'Professional packing service for your belongings.', basePrice: 1499, estimatedDurationMins: 180, rating: 4.7, reviewCount: 156, discountPercentage: 0, inclusions: ['Bubble wrap', 'Carton boxes', 'Labelling', 'Fragile item care'] },
    { name: 'Storage Service', slug: 'storage-service', description: 'Secure short-term and long-term storage facility.', basePrice: 2999, estimatedDurationMins: 120, rating: 4.5, reviewCount: 65, discountPercentage: 10, inclusions: ['Inventory', 'Secure storage', 'Monthly billing', 'Retrieval'] },
    { name: 'International Relocation', slug: 'international-relocation', description: 'Complete international relocation with customs support.', basePrice: 24999, estimatedDurationMins: 480, rating: 4.7, reviewCount: 34, discountPercentage: 0, inclusions: ['Documentation', 'Packing', 'Customs', 'Delivery'] },
    { name: 'House Deep Clean Post-Moving', slug: 'moving-cleanup', description: 'Deep cleaning of home after moving out or in.', basePrice: 1499, estimatedDurationMins: 240, rating: 4.8, reviewCount: 98, discountPercentage: 15, inclusions: ['All rooms', 'Bathrooms', 'Kitchen', 'Floor mopping'] },
  ],
  'water-purifier': [
    { name: 'RO Installation', slug: 'ro-installation', description: 'Professional installation of RO water purifiers.', basePrice: 499, estimatedDurationMins: 60, rating: 4.8, reviewCount: 287, discountPercentage: 0, inclusions: ['Wall mounting', 'Pipe connection', 'Tank fitting', 'Test run'] },
    { name: 'RO Repair', slug: 'ro-repair', description: 'Diagnosis and repair of all RO purifier issues.', basePrice: 299, estimatedDurationMins: 45, rating: 4.7, reviewCount: 213, discountPercentage: 0, inclusions: ['Fault diagnosis', 'Filter inspection', 'Pump check', 'Repair'] },
    { name: 'RO Filter Replacement', slug: 'ro-filter-replacement', description: 'Replacement of RO, sediment, and carbon filters.', basePrice: 799, estimatedDurationMins: 30, rating: 4.8, reviewCount: 345, discountPercentage: 5, inclusions: ['Old filter removal', 'New filter installation', 'Flow test', 'TDS check'] },
    { name: 'UV Purifier Installation', slug: 'uv-purifier-installation', description: 'Installation of UV water purifiers.', basePrice: 399, estimatedDurationMins: 45, rating: 4.7, reviewCount: 134, discountPercentage: 0, inclusions: ['Mounting', 'Pipe connection', 'Test run'] },
    { name: 'Water Purifier Servicing', slug: 'water-purifier-servicing', description: 'Annual servicing and maintenance of water purifiers.', basePrice: 599, estimatedDurationMins: 60, rating: 4.7, reviewCount: 178, discountPercentage: 10, inclusions: ['Filter cleaning', 'Membrane check', 'Tank cleaning', 'Performance test'] },
    { name: 'TDS & Water Quality Check', slug: 'tds-water-check', description: 'Professional water quality testing and TDS measurement.', basePrice: 199, estimatedDurationMins: 30, rating: 4.8, reviewCount: 267, discountPercentage: 0, inclusions: ['TDS measurement', 'Quality report', 'Filter recommendation'] },
    { name: 'RO Uninstallation', slug: 'ro-uninstallation', description: 'Safe uninstallation and packing of RO units for relocation.', basePrice: 249, estimatedDurationMins: 30, rating: 4.6, reviewCount: 87, discountPercentage: 0, inclusions: ['Pipe disconnection', 'Unit dismounting', 'Packing'] },
    { name: 'Alkaline Water Purifier Setup', slug: 'alkaline-purifier-setup', description: 'Setup of alkaline ionizer water systems.', basePrice: 699, estimatedDurationMins: 60, rating: 4.6, reviewCount: 65, discountPercentage: 0, inclusions: ['Installation', 'pH calibration', 'Test run'] },
    { name: 'Water Softener Installation', slug: 'water-softener-installation', description: 'Installation of water softener systems for hard water.', basePrice: 999, estimatedDurationMins: 90, rating: 4.7, reviewCount: 78, discountPercentage: 5, inclusions: ['Plumbing', 'Tank setup', 'Salt filling', 'Test'] },
    { name: 'Water Tank Cleaning', slug: 'water-tank-cleaning', description: 'Cleaning and sanitisation of overhead and underground tanks.', basePrice: 899, estimatedDurationMins: 120, rating: 4.7, reviewCount: 156, discountPercentage: 10, inclusions: ['Draining', 'Scrubbing', 'Disinfection', 'Refilling'] },
  ],
};

async function replaceServices() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    let totalReplaced = 0;
    let totalSkipped = 0;

    for (const [catSlug, services] of Object.entries(REAL_SERVICES)) {
      const category = await Category.findOne({ slug: catSlug });
      if (!category) {
        console.log(`⚠️  Category not found: ${catSlug}`);
        continue;
      }
      console.log(`\n📁 Processing: ${category.name}`);

      // Delete existing placeholder services for this category
      const deleted = await Service.deleteMany({ categoryId: category._id });
      console.log(`   🗑️  Deleted ${deleted.deletedCount} placeholder services`);

      // Insert real services
      for (const svc of services) {
        await Service.create({ ...svc, categoryId: category._id, isActive: true });
        console.log(`   ✅ Added: ${svc.name}`);
        totalReplaced++;
      }
    }

    console.log(`\n🎉 Done! Replaced ${totalReplaced} services.`);
  } catch (err) {
    console.error('❌ Failed:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected');
  }
}

replaceServices();
