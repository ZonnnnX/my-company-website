const fs = require("fs");
const c = fs.readFileSync("d:/Project-Company/my-company-website/index.html", "utf8");

function sliceAround(marker, before, after, label) {
  const idx = c.indexOf(marker);
  console.log("\n===== " + label + " (idx " + idx + ") =====");
  if (idx === -1) {
    console.log("NOT FOUND");
    return;
  }
  const start = Math.max(0, idx - before);
  const end = Math.min(c.length, idx + after);
  console.log(c.slice(start, end));
}

sliceAround('<div id="private-chat-area">', 200, 3000, "PRIVATE CHAT AREA HTML");
sliceAround(".toast", 200, 1500, "TOAST STYLES/JS");
sliceAround("showNotifToast", 300, 1500, "showNotifToast");
sliceAround("admin-tab-users", 0, 3000, "ADMIN USERS TAB HTML");
sliceAround('<div class="admin-tab-content" id="admin-tab-docs"', 0, 2500, "ADMIN DOCS TAB");
sliceAround("function switchAdminTab", 0, 1500, "switchAdminTab");
sliceAround("buildDropdownMenu();", 0, 500, "buildDropdownMenu call");
sliceAround("checkAuthState();", 0, 800, "checkAuthState call at init");
sliceAround("function api(", 0, 800, "api function");
sliceAround("async function api(", 0, 1200, "async api function");
sliceAround("getLocalGroupChats", 0, 1200, "getLocalGroupChats");
sliceAround("LOCAL_GROUP_CHAT_KEY", 0, 600, "LOCAL_GROUP_CHAT_KEY");

