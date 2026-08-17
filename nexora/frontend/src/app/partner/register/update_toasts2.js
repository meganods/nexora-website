const fs = require('fs');

function processRegister() {
  const path = '/Users/patelpulseventures/Desktop/nexora website/nexora/frontend/src/app/partner/register/page.tsx';
  let content = fs.readFileSync(path, 'utf8');

  // Replace remaining setErrorMsg
  content = content.replace(/setErrorMsg\((.*?)\);/g, "toast.error($1);");
  content = content.replace(/setSuccessMsg\((.*?)\);/g, "toast.success($1);");

  // Remove the state declarations
  content = content.replace(/const \[errorMsg, setErrorMsg\] = useState\(''\);\n?/g, '');
  content = content.replace(/const \[successMsg, setSuccessMsg\] = useState\(''\);\n?/g, '');

  fs.writeFileSync(path, content, 'utf8');
  console.log('register updated.');
}

function processLogin() {
  const path = '/Users/patelpulseventures/Desktop/nexora website/nexora/frontend/src/app/partner/login/page.tsx';
  let content = fs.readFileSync(path, 'utf8');

  if (!content.includes("import toast from 'react-hot-toast';")) {
    content = content.replace("import api from '@/lib/api';", "import api from '@/lib/api';\nimport toast from 'react-hot-toast';");
  }

  // Replace setError with toast.error
  content = content.replace(/setError\((.*?)\);/g, (match, p1) => {
    if (p1 === "''" || p1 === '""') return ""; // Remove clear error
    return `toast.error(${p1});`;
  });

  // Remove state
  content = content.replace(/const \[error, setError\] = useState\(''\);\n?/g, '');

  // Remove JSX rendering for error
  // Usually looks like {error && ( ... )}
  content = content.replace(/\{error && \([\s\S]*?\}\)/g, "");

  fs.writeFileSync(path, content, 'utf8');
  console.log('login updated.');
}

processRegister();
processLogin();
