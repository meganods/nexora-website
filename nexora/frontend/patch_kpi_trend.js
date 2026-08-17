const fs = require('fs');
let content = fs.readFileSync('src/app/admin/dashboard/page.tsx', 'utf8');

// Use regex to remove trend="+..." or trend="-..."
content = content.replace(/ trend="[^"]+"/g, '');

fs.writeFileSync('src/app/admin/dashboard/page.tsx', content);
