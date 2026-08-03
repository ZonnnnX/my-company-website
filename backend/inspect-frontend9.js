const fs = require("fs");
const c = fs.readFileSync("d:/Project-Company/my-company-website/index.html", "utf8");

// Find the private chat / group chat HTML body section
const markers = [
  "private-chat-tabs",
  "pchat-tab",
  "Nhóm",
  "Tạo nhóm",
  "group-chat-list",
  "id=\"group-chat",
  "create-group",
  "function toggleGroupChat",
  "function showGroupChats",
  "function switchPchatTab",
  "function openGroupChatModal",
  "function createGroupChatModal",
];

function sliceExact(marker, before, after, label) {
  const idx = c.indexOf(marker);
  console.log("\n===== " + label + " (idx " + idx + ") =====");
  if (idx === -1) { console.log("NOT FOUND"); return; }
  console.log(c.slice(Math.max(0, idx - before), Math.min(c.length, idx + after)));
}

markers.forEach((m) => sliceExact(m, 100, 1200, m));

// Also dump the whole private chat HTML block region
const start = c.indexOf('id="private-chat-toggle"');
if (start !== -1) {
  console.log("\n\n===== FULL PRIVATE CHAT HTML REGION =====");
  console.log(c.slice(start, start + 2600));
}
