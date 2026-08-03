const fs = require("fs");
const c = fs.readFileSync("d:/Project-Company/my-company-website/index.html", "utf8");

function sliceAround(marker, before, after, label) {
  const idx = c.indexOf(marker);
  console.log("\n===== " + label + " (idx " + idx + ") =====");
  if (idx === -1) { console.log("NOT FOUND"); return; }
  console.log(c.slice(Math.max(0, idx - before), Math.min(c.length, idx + after)));
}

sliceAround("function startNotifPolling", 0, 3000, "startNotifPolling");
sliceAround("function startPendingPolling", 0, 2000, "startPendingPolling");
sliceAround("checkAuthState = function", 0, 3000, "checkAuthState override");
sliceAround("var chatToggle", 0, 1200, "chat toggle def");
sliceAround("function toggleChat", 0, 1500, "toggleChat");
sliceAround("function togglePrivateChat", 0, 1200, "togglePrivateChat");
sliceAround("function toggleNotifPanel", 0, 800, "toggleNotifPanel");
sliceAround("// === Init ===", 0, 1500, "Init section");
sliceAround("document.getElementById('year')", 0, 800, "year init");
console.log("\n\n===== LAST 3500 CHARS =====");
console.log(c.slice(c.length - 3500));
