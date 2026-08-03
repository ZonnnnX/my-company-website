const fs = require("fs");
const c = fs.readFileSync("d:/Project-Company/my-company-website/index.html", "utf8");

function sliceAround(marker, before, after, label) {
  const idx = c.indexOf(marker);
  console.log("\n===== " + label + " (idx " + idx + ") =====");
  if (idx === -1) { console.log("NOT FOUND"); return; }
  console.log(c.slice(Math.max(0, idx - before), Math.min(c.length, idx + after)));
}

sliceAround('data-admintab="content"', 0, 3000, "CONTENT TAB HTML");
sliceAround("function loadSiteContentFromAdmin", 0, 2000, "loadSiteContentFromAdmin");
sliceAround("function saveSiteContentFromAdmin", 0, 2500, "saveSiteContentFromAdmin");
sliceAround("admin-tab-content\" id=\"admin-tab-content\"", 0, 2500, "admin-content panel");
sliceAround("function openTeamManager", 0, 1500, "openTeamManager");
sliceAround("function loadReports", 0, 1200, "loadReports");
sliceAround("private-chat-tabs", 0, 1200, "private-chat-tabs HTML");
sliceAround("openPrivateChat", 0, 1200, "openPrivateChat");
sliceAround("// === Team Members UI Functions", 0, 800, "team members section");
sliceAround("function toggleDropdown(event)", 0, 800, "toggleDropdown");

