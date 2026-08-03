const fs = require("fs");
const c = fs.readFileSync("d:/Project-Company/my-company-website/index.html", "utf8");

const markers = [
  "group-chat",
  "GROUP_CHAT",
  "function createGroupChat",
  "function openGroupChat",
  "function renderGroupChats",
  "function loadGroupChats",
  "function sendGroupMessage",
  "pchat-tab",
  "function switchChatTab",
  "localStorageApi",
  "groupChats",
  "function getRoleGroup",
  "private-chat-tabs",
  "function renderPrivateChat",
  "function sendPrivateMsg",
  "function openPrivateChat",
  "startSSE",
  "EventSource",
  "function showToast",
  "function showNotifToast",
];

function sliceAround(marker, before, after, label) {
  const idx = c.indexOf(marker);
  console.log("\n===== " + label + " (idx " + idx + ") =====");
  if (idx === -1) { console.log("NOT FOUND"); return; }
  console.log(c.slice(Math.max(0, idx - before), Math.min(c.length, idx + after)));
}

markers.forEach((m) => sliceAround(m, 0, 1600, m));
