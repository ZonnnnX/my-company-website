const fs = require("fs");
const c = fs.readFileSync("d:/Project-Company/my-company-website/index.html", "utf8");

const markers = [
  "function api(",
  "function renderUsers",
  "function loadAdminUsers",
  "function renderAdminUsers",
  "function createUser",
  "function editUser",
  "function saveUser",
  "function addCustomRole",
  "function loadCustomRoles",
  "function renderCustomRoles",
  "function loadDocuments",
  "function renderDocuments",
  "function loadReports",
  "function renderReports",
  "function approveUser",
  "function updateUserRole",
  "function updateUserGroup",
  "function updateUserPermissions",
  "function renderPermissions",
  "function loadRoles",
  "function renderRoles",
  "function switchAdminTab",
  "function loadUsers",
  "function getUsers",
];

function sliceAround(marker, before, after, label) {
  const idx = c.indexOf(marker);
  console.log("\n===== " + label + " (idx " + idx + ") =====");
  if (idx === -1) { console.log("NOT FOUND"); return; }
  console.log(c.slice(Math.max(0, idx - before), Math.min(c.length, idx + after)));
}

markers.forEach((m) => sliceAround(m, 0, 2500, m));
