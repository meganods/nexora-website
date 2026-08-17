const fs = require('fs');
const path = '/Users/patelpulseventures/Desktop/nexora website/nexora/frontend/src/app/partner/register/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add import toast
if (!content.includes("import toast from 'react-hot-toast';")) {
  content = content.replace("import api from '@/lib/api';", "import api from '@/lib/api';\nimport toast from 'react-hot-toast';");
}

// 2. Replace setErrorMsg('...') with toast.error('...')
// but avoid setErrorMsg('') and setSuccessMsg('')
content = content.replace(/setErrorMsg\(['"]([^'"]+)['"]\);?/g, "toast.error('$1');");
content = content.replace(/setSuccessMsg\(['"]([^'"]+)['"]\);?/g, "toast.success('$1');");

// 3. Remove setErrorMsg(''); and setSuccessMsg('');
content = content.replace(/setErrorMsg\(['"]['"]\);?/g, "");
content = content.replace(/setSuccessMsg\(['"]['"]\);?/g, "");

// 4. Remove the rendering of errorMsg and successMsg
// {errorMsg && ( ... )}
// {successMsg && ( ... )}
content = content.replace(/\{errorMsg && \([\s\S]*?\}\)/g, "");
content = content.replace(/\{successMsg && \([\s\S]*?\}\)/g, "");

fs.writeFileSync(path, content, 'utf8');
console.log('register/page.tsx updated.');
