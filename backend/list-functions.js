const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "..", "index.html");
const content = fs.readFileSync(file, "utf8");
const lines = content.split("\n");

const targetFuncs = [
    "loadSiteContentFromAdmin",
    "saveSiteContentFromAdmin",
    "addContentAnnouncement",
    "addContentService",
    "renderContentServices",
    "renderContentAnnouncements",
    "showToast",
    "loadGroupChats",
    "renderGroupChats",
    "createGroupChat",
    "openGroupChat",
    "loadSiteContent",
    "applySiteContent",
    "loadNotifications",
    "loadNotifFromApi",
    "toggleDropdown",
    "loadTeamMembers",
    "loadReports",
    "loadAdminUsers",
    "buildDropdownMenu",
    "openTeamManager",
    "openDocManager",
    "loadPrivateConversations",
    "loadChatMessages",
    "checkAuthState",
    "handleContactForm",
    "loadSiteContentToUI",
    "applySiteContentToUI",
    "content-load",
    "closeDocManager",
    "closeTeamManager",
    "closeReportForm",
    "openReportForm",
    "saveReport",
    "loadReports",
    "sendChatMsg",
    "sendPrivateMsg",
    "startNotifPolling",
    "startPendingPolling",
    "checkPendingCount",
    "updateNotifUI",
    "sseConnect",
    "initSSE",
    "connectSSE",
    "loadGroupChatList",
    "renderGroupChatList",
    "openGroupChatWindow",
    "sendGroupMessage",
];

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const f of targetFuncs) {
        if (line.includes("function " + f) || line.includes(f + " = function") || line.includes(f + "()")) {
            console.log((i + 1) + ": " + line.trim());
            break;
        }
    }
}
