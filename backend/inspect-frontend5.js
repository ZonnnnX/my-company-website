const fs = require("fs");
const c = fs.readFileSync("d:/Project-Company/my-company-website/index.html", "utf8");

const markers = [
  "loadSiteContentFromAdmin",
  "saveSiteContentFromAdmin",
  "admin-tabs",
  "id=\"admin-panel\"",
  "admin-panel",
  "reports-section",
  "id=\"reports",
  "doc-repo",
  "id=\"doc-repo",
  "function openReportForm",
  "function closeReportForm",
  "function showReports",
  "function openSection",
  "function navigateTo",
  "function showTab",
  "function openTab",
  "function switchMainTab",
  "function showAdmin",
  "function openAdmin",
  "function toggleAdmin",
  "function renderReportsSection",
  "function loadReportsSection",
  "function initReports",
  "function initAdmin",
  "function init",
  "function loadSiteContent",
  "function saveSiteContent",
  "function renderSiteContent",
  "function loadContent",
  "function saveContent",
];

function sliceAround(marker, before, after, label) {
  const idx = c.indexOf(marker);
  console.log("\n===== " + label + " (idx " + idx + ") =====");
  if (idx === -1) { console.log("NOT FOUND"); return; }
  console.log(c.slice(Math.max(0, idx - before), Math.min(c.length, idx + after)));
}

markers.forEach((m) => sliceAround(m, 0, 2000, m));
