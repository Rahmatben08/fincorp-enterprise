const fs = require('fs');
let content = fs.readFileSync('resources/js/AppOriginal.tsx', 'utf8');
const badStr = ""<AppLayout theme={theme} handleLogout={handleLogout} userName={userName} userRole={userRole || 'staff'}>`n              <Dashboard theme={theme} userRole={userRole} />"";
content = content.split(badStr).join('');
fs.writeFileSync('resources/js/AppOriginal.tsx', content, 'utf8');
