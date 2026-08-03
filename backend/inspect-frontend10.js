const fs = require("fs");
const c = fs.readFileSync("d:/Project-Company/my-company-website/index.html", "utf8");

// Find the private chat HTML after the header (tabs + conversations)
const start = c.indexOf('id="private-chat-toggle"');
const pchatBox = c.indexOf('private-chat-tabs');
console.log("=".repeat(40));
console.log("Looking for private chat tabs HTML in body");
console.log("=".repeat(40));

// Search for the tab HTML in the body region (after the header)
const bodyIdx = c.indexOf('<div id="private-chat-area">');
if (bodyIdx !== -1) {
  console.log("FOUND private-chat-area at", bodyIdx);
  console.log(c.slice(bodyIdx, bodyIdx + 1800));
} else {
  console.log("private-chat-area body not found");
}

// Check where the reports section is
const reportsIdx = c.indexOf('id="reports"');
console.log("\n\n===== REPORTS SECTION (idx " + reportsIdx + ") =====");
if (reportsIdx !== -1) {
  console.log(c.slice(reportsIdx - 20, reportsIdx + 1500));
}
