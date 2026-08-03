const fs = require("fs");
const c = fs.readFileSync("d:/Project-Company/my-company-website/index.html", "utf8");

const markers = [
  "admin-tab-users",
  "createUser",
  "Create User",
  "Tạo tài khoản",
  "add-user",
  "new-user",
  "user-form",
  "admin-create-user",
  "function openCreateUser",
  "function addNewUser",
  "function createNewUser",
  "function toggleChat",
  "function sendChat",
  "chat-area",
  "chat-box",
  "function renderPrivateChat",
  "function loadPrivateConversations",
  "function sendPrivateMessage",
  "function renderConversations",
  "function loadChatMessages",
  "function loadGroupChats",
  "function initChat",
  "admin-users-list",
];

function sliceAround(marker, before, after, label) {
  const idx = c.indexOf(marker);
  console.log("\n===== " + label + " (idx " + idx + ") =====");
  if (idx === -1) { console.log("NOT FOUND"); return; }
  console.log(c.slice(Math.max(0, idx - before), Math.min(c.length, idx + after)));
}

markers.forEach((m) => sliceAround(m, 0, 1800, m));
