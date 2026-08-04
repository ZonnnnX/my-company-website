const fs = require("fs");
const path = require("path");

const ROOT = "d:/Project-Company/my-company-website";
const src = path.join(ROOT, "index.html");
const html = fs.readFileSync(src, "utf8");
const lines = html.split("\n");

function findLine(marker) {
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(marker)) return i; // 0-based
  }
  throw new Error("Marker not found: " + marker);
}

// ------- CSS extraction -------
const styleOpen = findLine("<style>");
const styleClose = findLine("</style>");
const cssContent = lines.slice(styleOpen + 1, styleClose).join("\n");
const cssDir = path.join(ROOT, "public", "css");
fs.mkdirSync(cssDir, { recursive: true });
fs.writeFileSync(path.join(cssDir, "style.css"), cssContent, "utf8");
console.log("Wrote public/css/style.css (" + cssContent.split("\n").length + " lines)");

// ------- JS extraction -------
const scriptOpen = findLine("<script>");
const scriptClose = findLine("</script>");
const jsStart = scriptOpen + 1; // first line inside script
const jsEnd = scriptClose; // exclusive

// Split points (0-based indices) - use comment markers
const splitMarkers = [
  { name: "config.js", marker: "// === Configuration" },
  { name: "localStorageApi.js", marker: "async function localStorageApi" },
  { name: "core.js", marker: "// === DOM refs ===" },
  { name: "admin.js", marker: "// === Reports Page ===" },
  { name: "chat.js", marker: "// === Member Detail Modal" },
  { name: "init.js", marker: "// === Init ===" }
];

let positions = [];
for (const s of splitMarkers) {
  positions.push({ name: s.name, line: findLine(s.marker) });
}
// Ensure positions are in order and within script range
positions = positions.filter(p => p.line >= jsStart && p.line < jsEnd);
positions.sort((a, b) => a.line - b.line);

const jsDir = path.join(ROOT, "public", "js");
fs.mkdirSync(jsDir, { recursive: true });

// Extract each segment
for (let i = 0; i < positions.length; i++) {
  const startLine = positions[i].line;
  const endLine = (i + 1 < positions.length) ? positions[i + 1].line : jsEnd;
  const segment = lines.slice(startLine, endLine).join("\n");
  const file = path.join(jsDir, positions[i].name);
  fs.writeFileSync(file, segment, "utf8");
  console.log("Wrote public/js/" + positions[i].name + " (" + (endLine - startLine) + " lines)");
}

// ------- Build new index.html -------
const beforeStyle = lines.slice(0, styleOpen).join("\n"); // up to <style> line
const afterStyleToScript = lines.slice(styleClose + 1, scriptOpen).join("\n"); // between </style> and <script>
const afterScript = lines.slice(scriptClose + 1).join("\n"); // from </script> to end

const newHtml = beforeStyle + "\n" +
  '  <link rel="stylesheet" href="public/css/style.css" />\n' +
  afterStyleToScript + "\n" +
  '  <script src="public/js/config.js"></script>\n' +
  '  <script src="public/js/localStorageApi.js"></script>\n' +
  '  <script src="public/js/core.js"></script>\n' +
  '  <script src="public/js/admin.js"></script>\n' +
  '  <script src="public/js/chat.js"></script>\n' +
  '  <script src="public/js/init.js"></script>\n' +
  afterScript;

fs.writeFileSync(src, newHtml, "utf8");
console.log("\nRewrote index.html (" + newHtml.split("\n").length + " lines)");
console.log("Original index.html lines: " + lines.length);
