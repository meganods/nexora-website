const fs = require('fs');
let content = fs.readFileSync('src/app/page.tsx', 'utf8');

// 1. Fix toggleWishlist
content = content.replace(
`  const toggleWishlist = async (id: string, serviceName: string) => {
    let updated = [...wishlist];
    const isAdded = !updated.includes(id);
    if (!isAdded) {
      updated = updated.filter(x => x !== id);
    } else {
      updated.push(id);
    }
    setWishlist(updated);
    localStorage.setItem('user_wishlist', JSON.stringify(updated));

    const role = typeof window !== 'undefined' ? localStorage.getItem('nexora_role') : '';
    if (!user || role !== 'user') {
      toast.success(isAdded ? \`\${serviceName} added to wishlist (offline)\` : \`\${serviceName} removed from wishlist (offline)\`);
      return;
    }`,
`  const toggleWishlist = async (id: string, serviceName: string) => {
    const role = typeof window !== 'undefined' ? localStorage.getItem('nexora_role') : '';
    if (!user || role !== 'user') {
      toast.error('Please login or create an account to wishlist services.');
      window.location.href = '/login';
      return;
    }

    let updated = [...wishlist];
    const isAdded = !updated.includes(id);
    if (!isAdded) {
      updated = updated.filter(x => x !== id);
    } else {
      updated.push(id);
    }
    setWishlist(updated);
    localStorage.setItem('user_wishlist', JSON.stringify(updated));`
);

// 2. Fix mock data IDs in fetchPopularServices (two occurrences)
content = content.replace(
  /{ _id: 'ac-service', name: 'AC Service',/g,
  "{ _id: '64c123456789012345678901', name: 'AC Service',"
).replace(
  /{ _id: 'bathroom-cleaning', name: 'Bathroom Cleaning',/g,
  "{ _id: '64c123456789012345678902', name: 'Bathroom Cleaning',"
).replace(
  /{ _id: 'womens-haircut', name: "Women's Haircut",/g,
  "{ _id: '64c123456789012345678903', name: \"Women's Haircut\","
).replace(
  /{ _id: 'electrician-visit', name: 'Electrician Visit',/g,
  "{ _id: '64c123456789012345678904', name: 'Electrician Visit',"
).replace(
  /{ _id: 'sofa-cleaning', name: 'Sofa Cleaning',/g,
  "{ _id: '64c123456789012345678905', name: 'Sofa Cleaning',"
).replace(
  /{ _id: 'ro-service', name: 'RO Service',/g,
  "{ _id: '64c123456789012345678906', name: 'RO Service',"
);

// 3. Fix "How Nexora Works" section layout
content = content.replace(
  `            {HOW_STEPS.map((step, i) => (
              <div key={i} className="relative flex flex-col items-center text-center group">
                {/* Step circle */}
                <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center border-4 border-cream shadow-lg z-10 mb-5 group-hover:scale-110 transition-transform duration-300">
                  <step.icon className="w-6 h-6 text-white" />
                </div>
                {/* Number */}
                <span className="absolute -top-3 sm:-top-4 text-4xl sm:text-6xl font-black text-black/5 select-none z-0">
                  {step.num}
                </span>

                <div className="bg-white rounded-3xl p-6 border border-gold/20 shadow-sm hover:shadow-md hover:border-gold/40 transition-all mt-4 w-full">`,
  `            {HOW_STEPS.map((step, i) => (
              <div key={i} className="relative flex flex-col items-center text-center group h-full">
                {/* Step circle */}
                <div className="w-14 h-14 shrink-0 rounded-full bg-primary flex items-center justify-center border-4 border-cream shadow-lg z-10 mb-5 group-hover:scale-110 transition-transform duration-300">
                  <step.icon className="w-6 h-6 text-white" />
                </div>
                {/* Number */}
                <span className="absolute -top-3 sm:-top-4 text-4xl sm:text-6xl font-black text-black/5 select-none z-0">
                  {step.num}
                </span>

                <div className="bg-white rounded-3xl p-6 border border-gold/20 shadow-sm hover:shadow-md hover:border-gold/40 transition-all mt-4 w-full flex-1 flex flex-col justify-start">`
);

fs.writeFileSync('src/app/page.tsx', content);
