const fs = require('fs');
let content = fs.readFileSync('src/app/page.tsx', 'utf8');

content = content.replace(/gradient: "from-\\[#0F3D30\\] to-\\[#1D6B50\\]",\n    },/g, 'gradient: "from-[#0F3D30] to-[#1D6B50]",\n      img: "",\n    },');
content = content.replace(/gradient: "from-\\[#5c1a06\\] to-\\[#9e2a2b\\]",\n    }/g, 'gradient: "from-[#5c1a06] to-[#9e2a2b]",\n      img: "",\n    }');

fs.writeFileSync('src/app/page.tsx', content);
