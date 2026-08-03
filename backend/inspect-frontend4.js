const fs = require("fs");
const c = fs.readFileSync("d:/Project-Company/my-company-website/index.html", "utf8");

const markers = [
  "const DEFAULT_ROLES",
  "LOCAL_CUSTOM_ROLES_KEY",
  "var DEFAULT_ROLES",
  "function renderAdminDocList",
  "function saveAdminDoc",
  "function deleteAdminDoc",
  "function addAdminDoc",
  "admin-doc-add-btn",
  "function createReport",
  "function addReport",
  "function saveReport",
  "function deleteReport",
  "editReport",
  "report-form",
  "function openReports",
  "function showSection",
  "canManageReports",
  "LOCAL_REPORTS_KEY",
  "function getRoleGroup",
  "function applyRoleGroupFilter",
  "renderReports",
  "function switchAdminTab",
];

function sliceAround(marker, before, after, label) {
  const idx = c.indexOf(marker);
  console.log("\n===== " + label + " (idx " + idx + ") =====");
  if (idx === -1) { console.log("NOT FOUND"); return; }
  console.log(c.slice(Math.max(0, idx - before), Math.min(c.length, idx + after)));
}

markers.forEach((m) => sliceAround(m, 0, 2200, m));
