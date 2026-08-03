const fs = require("fs");
const c = fs.readFileSync("d:/Project-Company/my-company-website/index.html", "utf8");

const markers = [
  "function handleRoleChange",
  "function handleAdminAction",
  "function getAllRoles",
  "function isGroupRole",
  "function getGroupRoleName",
  "function groupRoles",
  "GROUP_ROLES",
  "function renderDocRepo",
  "function loadDocRepo",
  "function getDocItems",
  "function renderDocItems",
  "function hasPermission",
  "function can",
  "function getUser",
  "function getToken",
  "function getLocalUsers",
  "function getLocalTeamMembers",
  "function localStorageApi",
  "function populateInviteSelects",
  "function renderAdminInvitesList",
  "function handleRoleChange",
  "admin-tab-reports",
  "data-admintab=\"reports\"",
  "admin-tab-invites",
  "data-admintab=\"invites\"",
  "admin-tab-team",
];

function sliceAround(marker, before, after, label) {
  const idx = c.indexOf(marker);
  console.log("\n===== " + label + " (idx " + idx + ") =====");
  if (idx === -1) { console.log("NOT FOUND"); return; }
  console.log(c.slice(Math.max(0, idx - before), Math.min(c.length, idx + after)));
}

markers.forEach((m) => sliceAround(m, 0, 2000, m));
