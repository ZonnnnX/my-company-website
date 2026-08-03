const fs = require("fs");
const c = fs.readFileSync("d:/Project-Company/my-company-website/index.html", "utf8");

// Reports section
const markers = ["reports", "Báo Cáo", "page-reports", "reports-toolbar", "reports-list", "report-add-btn", "reports-summary"];
markers.forEach((m) => {
  const idx = c.indexOf(m);
  console.log(`\n===== ${m} (idx ${idx}) =====`);
  if (idx !== -1) console.log(c.slice(Math.max(0, idx - 100), idx + 800));
});

// Find the page-view structure
const pageView = c.indexOf('page-view');
console.log("\n\n===== PAGE VIEWS =====");
let idx = 0;
while ((idx = c.indexOf('page-view', idx)) !== -1) {
  console.log("page-view at", idx, ":", c.slice(idx, idx + 80).replace(/\n/g, ' '));
  idx += 10;
}
