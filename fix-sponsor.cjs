const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'app', 'src', 'pages', 'Sponsorship.tsx');
let s = fs.readFileSync(file, 'utf8');
s = s.replace(/Ready to get started\? Fill out the form and we.ll be in touch\./, "Tell us about your goals and we'll put together a tailored package.");
fs.writeFileSync(file, s);
console.log('Done');
