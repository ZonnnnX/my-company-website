const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "index.js");
let c = fs.readFileSync(filePath, "utf8");

// Check if prisma is already defined
if (c.indexOf("const prisma") === -1) {
  // Find the pattern: require("dotenv").config(); followed by blank lines then for loop
  const brokenMatch = c.match(/require\("dotenv"\)\.config\(\);[\s\S]*?for \(const name of Object\.keys\(interfaces\)\) \{/);
  if (brokenMatch) {
    const replacement = 
`require("dotenv").config();

const prisma = new PrismaClient();
const path = require("path");
const os = require("os");

const app = express();

function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {`;
    c = c.replace(brokenMatch[0], replacement);
    fs.writeFileSync(filePath, c, "utf8");
    console.log("✅ File fixed! Added missing code (prisma, path, os, app, getLocalIP).");
  } else {
    console.log("❌ Could not find the broken section pattern.");
  }
} else {
  console.log("✅ File already has prisma defined - nothing to fix.");
}
