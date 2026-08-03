const fs = require("fs");
const c = fs.readFileSync("d:/Project-Company/my-company-website/index.html", "utf8");

const markers = [
  "function loadAdminUsers",
  "private-chat-area",
  "id=\"private-chat",
  "private-chat-toggle",
  "chat-toggle",
  "function togglePrivateChat",
  "function renderReports",
  "reports-section",
  "id=\"reports\"",
  "function loadReports",
  "function handleRoleChange",
  "function handleAdminAction",
  "admin-users-list",
  "Approve",
  "function editUser",
  "function deleteUser",
  "function addUser",
  "function createUserAccount",
];

function sliceAround(marker, before, after, label) {
  const idx = c.indexOf(marker);
  console.log("\n===== " + label + " (idx " + idx + ") =====");
  if (idx === -1) { console.log("NOT FOUND"); return; }
  console.log(c.slice(Math.max(0, idx - before), Math.min(c.length, idx + after)));
}

markers.forEach((m) => sliceAround(m, 0, 2200, m));
