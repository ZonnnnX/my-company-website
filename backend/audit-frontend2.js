const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "..", "index.html");
const content = fs.readFileSync(file, "utf8");

// Collect all defined functions (function name, or name = function, or async function name)
const definedFuncs = new Set();
const defRegexes = [
    /function\s+([A-Za-z_$][A-Za-z0-9_$]*)/g,
    /async\s+function\s+([A-Za-z_$][A-Za-z0-9_$]*)/g,
    /([A-Za-z_$][A-Za-z0-9_$]*)\s*=\s*(?:async\s*)?function/g,
    /([A-Za-z_$][A-Za-z0-9_$]*)\s*:\s*(?:async\s*)?function/g,
    /var\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*=\s*function/g,
    /let\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*=\s*function/g,
    /const\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*=\s*function/g,
];
for (const re of defRegexes) {
    let m;
    while ((m = re.exec(content)) !== null) {
        definedFuncs.add(m[1]);
    }
}

// Collect all function calls: identifier(
const callRegex = /\b([A-Za-z_$][A-Za-z0-9_$]*)\s*\(/g;
const callSet = new Set();
let m;
while ((m = callRegex.exec(content)) !== null) {
    const name = m[1];
    // Skip JS keywords / builtins
    const skip = new Set([
        "if", "for", "while", "switch", "catch", "function", "return", "typeof",
        "new", "delete", "void", "in", "of", "this", "document", "window", "console",
        "Math", "JSON", "Object", "Array", "String", "Number", "Boolean", "Date",
        "setTimeout", "setInterval", "clearTimeout", "clearInterval", "parseInt",
        "parseFloat", "isNaN", "encodeURIComponent", "decodeURIComponent", "btoa",
        "fetch", "alert", "confirm", "prompt", "Notification", "localStorage",
        "sessionStorage", "Promise", "Error", "Set", "Map", "Symbol", "RegExp",
        "require", "module", "exports", "process", "Notification", "requestAnimationFrame",
        "AbortController", "EventSource", "animate", "toString", "toLocaleString",
        "toLocaleTimeString", "substring", "indexOf", "charAt", "toUpperCase",
        "toLowerCase", "trim", "split", "join", "push", "pop", "shift", "unshift",
        "splice", "slice", "concat", "filter", "map", "forEach", "find", "findIndex",
        "some", "every", "reduce", "sort", "reverse", "keys", "values", "includes",
        "hasOwnProperty", "exec", "test", "match", "replace", "closest", "querySelector",
        "querySelectorAll", "getElementById", "createElement", "appendChild", "removeChild",
        "addEventListener", "removeEventListener", "classList", "style", "scrollTop",
        "scrollHeight", "stopPropagation", "preventDefault", "getBoundingClientRect",
        "select", "focus", "click", "lastIndexOf", "startsWith", "endsWith", "padStart",
        "String.prototype", "continuning", "continue"
    ]);
    if (skip.has(name)) continue;
    callSet.add(name);
}

const missing = [...callSet].filter(f => !definedFuncs.has(f)).sort();
console.log("=== Functions called in JS but NOT defined in file ===");
missing.forEach(f => console.log("  - " + f));
console.log("\nTotal: " + missing.length);

// Write report
fs.writeFileSync(path.join(__dirname, "audit-report2.txt"),
    "JS-called missing functions:\n" + missing.map(f => "  " + f).join("\n") + "\n", "utf8");

