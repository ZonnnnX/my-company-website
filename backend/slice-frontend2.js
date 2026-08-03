const fs = require("fs");
const c = fs.readFileSync("d:/Project-Company/my-company-website/index.html", "utf8");

function sliceAround(marker, before, after, label) {
  const idx = c.indexOf(marker);
  console.log("\n===== " + label + " (idx " + idx + ") =====");
  if (idx === -1) {
    console.log("NOT FOUND");
    return;
  }
  console.log(c.slice(Math.max(0, idx - before), Math.min(c.length, idx + after)));
}

sliceAround("async function api(", 0, 3500, "FULL api function");
sliceAround("API_BASE", 0, 1200, "API_BASE + API_OFFLINE + API_TIMEOUT defs");
sliceAround("showNotifToast", 500, 2500, "toast helper (searching variants)");
sliceAround("function toast(", 0, 1500, "toast function");
sliceAround("toastContainer", 0, 800, "toastContainer");
sliceAround("function addNotification", 0, 2500, "addNotification");
sliceAround("EventSource", 2000, 2000, "EventSource (context around)");
sliceAround("pollPrivate", 0, 1500, "pollPrivate");
sliceAround("loadGroupChats", 0, 2000, "loadGroupChats");
sliceAround("renderGroupChatList", 0, 2000, "renderGroupChatList");
sliceAround("openGroupChat", 0, 2000, "openGroupChat");
sliceAround("createGroupChatModal", 0, 2000, "createGroupChatModal");
sliceAround("function loadAdminUsers", 0, 3500, "loadAdminUsers");
sliceAround("admin-tab-content", 0, 1200, "admin tab contents listing");
sliceAround("data-admintab", 0, 1500, "admin tabs");
sliceAround("function renderPrivateChatUsers", 0, 2000, "renderPrivateChatUsers (all users list)");
sliceAround("function loadAllUsers", 0, 1500, "loadAllUsers");
sliceAround("loadPrivateConversations", 0, 1200, "loadPrivateConversations");

