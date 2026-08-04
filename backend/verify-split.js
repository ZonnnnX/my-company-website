const fs = require("fs");
const path = require("path");
const ROOT = "d:/Project-Company/my-company-website";

// Verify the JS files' concatenation matches the original script content
const src = fs.readFileSync(path.join(ROOT, "index.html.bak"), "utf8");
const lines = src.split("\n");

function findLine(marker) {
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(marker)) return i;
  }
  return -1;
}

const scriptOpen = findLine("<script>");
const scriptClose = findLine("</script>");
const originalJS = lines.slice(scriptOpen + 1, scriptClose).join("\n");

const jsFiles = ["config.js", "localStorageApi.js", "core.js", "admin.js", "chat.js", "init.js"];
let combined = "";
for (const f of jsFiles) {
  combined += fs.readFileSync(path.join(ROOT, "public", "js", f), "utf8") + "\n";
}

// Normalize trailing whitespace for comparison
const norm = (s) => s.replace(/\s+$/g, "").trim();
console.log("Original JS length:", originalJS.length);
console.log("Combined JS length:", combined.length);
console.log("MATCH (trimmed):", norm(originalJS) === norm(combined));

// Also verify CSS
const styleOpen = findLine("<style>");
const styleClose = findLine("</style>");
const originalCSS = lines.slice(styleOpen + 1, styleClose).join("\n");
const extractedCSS = fs.readFileSync(path.join(ROOT, "public", "css", "style.css"), "utf8");
console.log("CSS MATCH:", norm(originalCSS) === norm(extractedCSS));

// Verify new index.html script tags
const newHtml = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
const scriptTags = newHtml.match(/<script src="[^"]+"><\/script>/g) || [];
console.log("\nScript tags in new index.html:");
scriptTags.forEach(t => console.log("  " + t));
