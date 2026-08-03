const fs = require("fs");
const c = fs.readFileSync("d:/Project-Company/my-company-website/index.html", "utf8");

const checks = [
  "function createGroupChat",
  "toggleGroupChat",
  "openGroupChat",
  "function renderGroupChats",
  "group-chat",
  "pchat-tab",
  "function createUserForm",
  "function editUserModal",
  "createUser",
  "addUser",
  "function showNotifToast",
  "function sse",
  "EventSource",
  "function startSSE",
  "api/events",
  "notif-bell",
  "function addNotification",
  "toast",
  "function sseSend",
  "sseConnect",
  "new EventSource",
];

checks.forEach((k) => {
  const n = (c.match(new RegExp(k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) || []).length;
  console.log(k + ": " + n);
});

console.log("TOTAL LENGTH:", c.length);
