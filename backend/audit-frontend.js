const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "..", "index.html");
const content = fs.readFileSync(file, "utf8");

// Extract all onclick/onkeydown handler function names
const onclickRefs = new Set();
const regex = /(?:onclick|onchange|onkeydown|onsubmit|onload)="([^"]*)"/g;
let m;
while ((m = regex.exec(content)) !== null) {
    const handler = m[1];
    // Extract function call names like handleLogin(...) or switchTab('x')
    const calls = handler.match(/[A-Za-z_$][A-Za-z0-9_$]*(?=\()/g);
    if (calls) {
        calls.forEach(c => onclickRefs.add(c));
    }
}

// Also find function declarations and assignments
const definedFuncs = new Set();
const defRegex = /function\s+([A-Za-z_$][A-Za-z0-9_$]*)/g;
while ((m = defRegex.exec(content)) !== null) {
    definedFuncs.add(m[1]);
}
const assignRegex = /([A-Za-z_$][A-Za-z0-9_$]*)\s*=\s*function/g;
while ((m = assignRegex.exec(content)) !== null) {
    definedFuncs.add(m[1]);
}

console.log("=== Functions referenced in HTML attributes but NOT defined ===\n");
const missing = [...onclickRefs].filter(f => !definedFuncs.has(f)).sort();
missing.forEach(f => console.log("  - " + f));
console.log("\nTotal missing: " + missing.length);

console.log("\n=== Also check for meaningful referenced-but-missing (size filter) ===");
console.log("(list above is authoritative)");

// Save report for reference
fs.writeFileSync(path.join(__dirname, "audit-report.txt"), 
    "Missing functions:\n" + missing.map(f => "  " + f).join("\n") + "\n", "utf8");

