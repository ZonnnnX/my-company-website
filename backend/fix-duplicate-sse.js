const fs = require("fs");
const filePath = __dirname + "/index.js";
let c = fs.readFileSync(filePath, "utf8");

const marker = "// === SSE (Server-Sent Events) Real-Time ===";
const authMarker = "// === Auth Middleware ===";

const firstIdx = c.indexOf(marker);
const authIdx = c.indexOf(authMarker);

console.log("First SSE block index:", firstIdx);
console.log("Auth middleware index:", authIdx);

if (firstIdx !== -1 && authIdx !== -1 && firstIdx < authIdx) {
  const removed = c.slice(firstIdx, authIdx);
  c = c.slice(0, firstIdx) + c.slice(authIdx);
  fs.writeFileSync(filePath, c, "utf8");
  console.log("Removed duplicate SSE block. Removed chars:", removed.length);
  console.log("Remaining 'const sseClients' occurrences:", (c.match(/const sseClients/g) || []).length);
  console.log("Remaining 'function sseSend' occurrences:", (c.match(/function sseSend/g) || []).length);
  console.log("Remaining 'function sseBroadcast' occurrences:", (c.match(/function sseBroadcast/g) || []).length);
  console.log("Remaining '/api/sse' occurrences:", (c.match(/\/api\/sse/g) || []).length);
  console.log("Remaining '/api/events' occurrences:", (c.match(/\/api\/events/g) || []).length);
} else {
  console.log("Markers not found in expected order — nothing removed.");
}

