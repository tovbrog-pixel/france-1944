// Copies the simulation engine and three.js into app/ so the desktop shell can load them.
// Run from the repository root: node tools/build-app.js
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const engineFiles = ['data.js', 'divisions.js', 'map.js', 'scenarios.js', 'tutorial.js', 'balance.js', 'commanders.js', 'guidance.js', 'sim.js', 'command.js', 'transport.js', 'air.js', 'assess.js'];
const outEngine = path.join(root, 'app', 'engine'), outVendor = path.join(root, 'app', 'vendor');
fs.mkdirSync(outEngine, { recursive: true }); fs.mkdirSync(outVendor, { recursive: true });
for (const f of engineFiles) fs.copyFileSync(path.join(root, 'engine', 'src', f), path.join(outEngine, f));
fs.copyFileSync(path.join(root, 'node_modules', 'three', 'build', 'three.min.js'), path.join(outVendor, 'three.min.js'));
console.log('app/ prepared: ' + engineFiles.length + ' engine files and three.min.js');
