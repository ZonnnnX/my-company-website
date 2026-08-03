const fs = require("fs");
const path = require("path");
const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
const funcs = [
  "loadSiteContentFromAdmin",
  "saveSiteContentFromAdmin",
  "addContentAnnouncement",
  "addContentService",
  "applySiteContentToUI",
  "showToast",
  "function togglePrivateChat",
  "function showPrivateConversations",
  "function openPrivateChat",
  "function loadPrivateConversations",
  "function loadPrivateMessages",
  "function sendPrivateMsg",
  "function loadChatMessages",
  "function sendChatMsg",
  "function toggleChat",
  "function buildDropdownMenu",
  "function openDocManager",
  "function openTeamManager",
  "function loadReports",
  "function loadAdminUsers",
  "function switchAdminTab",
  "function startNotifPolling",
  "function addNotification",
  "function updateNotifUI",
  "function loadSiteContent",
  "function renderTeamMembers",
  "function loadTeamMembers",
  "EventSource",
  "function connectSSE",
  "function startSSE",
  "function openBroadcastModal",
  "function sendBroadcast"
];
for (const f of funcs) {
  console.log((html.includes(f) ? "FOUND   " : "MISSING ") + f);
}
