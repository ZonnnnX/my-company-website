const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
require("dotenv").config();

const prisma = new PrismaClient();
const path = require("path");
const os = require("os");

const app = express();

function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === "IPv4" && !iface.internal) {
                return iface.address;
            }
        }
    }
    return "127.0.0.1";
}

const LOCAL_IP = getLocalIP();

// Serve static files from parent directory (root project folder containing index.html)
app.use(express.static(path.join(__dirname, "..")));

app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
}));
const allowedOrigins = [
    "http://localhost:5000",
    "http://localhost:3000",
    "http://localhost:5500",
    "http://127.0.0.1:5000",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5500",
    "null", // Allow file:// protocol
];
if (process.env.CORS_ORIGIN) {
    allowedOrigins.push(process.env.CORS_ORIGIN);
}
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, curl, etc.)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1) {
            return callback(null, true);
        }
        // Allow all localhost subdomains
        if (origin.startsWith("http://localhost") || origin.startsWith("http://127.0.0.1")) {
            return callback(null, true);
        }
        // Allow file:// protocol
        if (origin === "null") {
            return callback(null, true);
        }
        callback(null, true); // Allow all origins in development
    },
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-in-production";
const PORT = process.env.PORT || 5000;

// === Auth Middleware ===

function authenticateToken(req, res, next) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN
    if (!token) {
        return res.status(401).json({ message: "Authentication required." });
    }
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ message: "Invalid or expired token." });
    }
}

function requireAdmin(req, res, next) {
    if (req.user && req.user.role === "ADMIN") {
        next();
    } else {
        return res.status(403).json({ message: "Admin access required." });
    }
}

// === Health Check ===

app.get("/api/health", (req, res) => {
    res.json({
        message: "Backend company website running!"
    });
});

// === Auth API ===

// Register a new user
app.post("/api/auth/register", async (req, res) => {
    try {
        const { name, email, password, inviteCode } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: "Name, email, and password are required." });
        }

        if (typeof name !== "string" || name.trim().length < 2) {
            return res.status(400).json({ message: "Name must be at least 2 characters." });
        }

        if (typeof email !== "string" || !email.includes("@")) {
            return res.status(400).json({ message: "Valid email is required." });
        }

        if (typeof password !== "string" || password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters." });
        }

        const existing = await prisma.user.findUnique({ 
            where: { email: email.toLowerCase().trim() } 
        });

        if (existing) {
            return res.status(409).json({ 
                message: "An account with this email already exists." 
            });
        }

        // Check invite code if provided
        let newRole = "EMPLOYEE";
        let newStatus = "PENDING";
        let newGroup = "General";
        if (inviteCode && typeof inviteCode === "string" && inviteCode.trim().length > 0) {
            const invite = await prisma.invite.findUnique({ where: { code: inviteCode.trim() } });
            if (!invite) {
                return res.status(400).json({ message: "Mã mời không hợp lệ hoặc đã bị xóa." });
            }
            if (invite.usedBy) {
                return res.status(400).json({ message: "Mã mời này đã được sử dụng." });
            }
            if (invite.email && invite.email !== email.toLowerCase().trim()) {
                return res.status(400).json({ message: "Mã mời này chỉ dành cho email: " + invite.email });
            }
            newRole = invite.role || "EMPLOYEE";
            newStatus = "APPROVED";
            newGroup = invite.group || "General";
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                name: name.trim(),
                email: email.toLowerCase().trim(),
                password: hashedPassword,
                role: newRole,
                group: newGroup,
                status: newStatus
            }
        });

        // If invite used, mark it
        if (inviteCode && typeof inviteCode === "string" && inviteCode.trim().length > 0) {
            await prisma.invite.updateMany({
                where: { code: inviteCode.trim() },
                data: { usedBy: user.id, usedByName: user.name, usedAt: new Date() }
            });
        }

        // Notify admins about new registration
        if (newStatus === "PENDING") {
            const admins = await prisma.user.findMany({ where: { role: "ADMIN" }, select: { id: true } });
            for (const a of admins) {
                await createNotification(a.id, "registration", "New registration", `${user.name} (${user.email}) registered and needs approval.`);
            }
        }

        return res.status(201).json({
            message: newStatus === "APPROVED"
                ? "Đăng ký thành công! Tài khoản của bạn đã được cấp quyền qua mã mời."
                : "Registration successful. Your account is pending admin approval.",
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                status: user.status
            }
        });

    } catch (error) {
        console.error("======================");
        console.error(error);
        console.error(error.message);
        console.error(error.stack);
        console.error("======================");

        return res.status(500).json({
            message: "Server error."
        });
    }
});


// Login
app.post("/api/auth/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required." });
        }

        const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
        if (!user) {
            return res.status(401).json({ message: "Invalid email or password." });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ message: "Invalid email or password." });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, name: user.name, role: user.role, status: user.status },
            JWT_SECRET,
            { expiresIn: "24h" }
        );

        return res.json({
            message: "Login successful.",
            token,
            user: { id: user.id, name: user.name, email: user.email, role: user.role, status: user.status }
        });
    } catch (error) {
    console.error("========== LOGIN ERROR ==========");
    console.error(error);
    console.error(error.message);
    console.error(error.stack);
    console.error("=================================");

    return res.status(500).json({
        message: error.message
    });
}
});

// Get current user from token
app.get("/api/auth/me", authenticateToken, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: { id: true, name: true, email: true, role: true, status: true, createdAt: true }
        });
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }
        return res.json(user);
    } catch (error) {
        console.error("Get me error:", error);
        return res.status(500).json({ message: "Server error." });
    }
});

// === Admin API ===

// Get count of pending users (admin only) - for notifications
app.get("/api/admin/pending-count", authenticateToken, requireAdmin, async (req, res) => {
    try {
        const count = await prisma.user.count({ where: { status: "PENDING" } });
        return res.json({ count });
    } catch (error) {
        console.error("Pending count error:", error);
        return res.status(500).json({ message: "Server error." });
    }
});

// List all users (admin only)
app.get("/api/admin/users", authenticateToken, requireAdmin, async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            orderBy: { createdAt: "desc" },
            select: { id: true, name: true, email: true, role: true, status: true, group: true, permissions: true, createdAt: true, updatedAt: true }
        });
        return res.json(users);
    } catch (error) {
        console.error("List users error:", error);
        return res.status(500).json({ message: "Server error." });
    }
});

// Approve or reject a user (admin only)
app.patch("/api/admin/users/:id/status", authenticateToken, requireAdmin, async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) {
            return res.status(400).json({ message: "Invalid user ID." });
        }

        const { status } = req.body;
        if (!status || !["APPROVED", "REJECTED"].includes(status)) {
            return res.status(400).json({ message: "Status must be APPROVED or REJECTED." });
        }

        const user = await prisma.user.findUnique({ where: { id } });
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        const updated = await prisma.user.update({
            where: { id },
            data: { status },
            select: { id: true, name: true, email: true, role: true, status: true, permissions: true, updatedAt: true }
        });

        return res.json({ message: `User ${status.toLowerCase()}.`, user: updated });
    } catch (error) {
        console.error("Update user status error:", error);
        return res.status(500).json({ message: "Server error." });
    }
});

// Update user role (admin only)
app.patch("/api/admin/users/:id/role", authenticateToken, requireAdmin, async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) {
            return res.status(400).json({ message: "Invalid user ID." });
        }

        const { role } = req.body;
        const validRoles = ["ADMIN", "DIRECTOR", "LEADER", "IT", "IMPLEMENTATION", "ACCOUNTING", "EMPLOYEE"];
        if (!role || !validRoles.includes(role)) {
            return res.status(400).json({ message: "Role must be one of: " + validRoles.join(", ") });
        }

        const user = await prisma.user.findUnique({ where: { id } });
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        const updated = await prisma.user.update({
            where: { id },
            data: { role },
            select: { id: true, name: true, email: true, role: true, status: true, permissions: true, updatedAt: true }
        });

        return res.json({ message: `User role updated to ${role}.`, user: updated });
    } catch (error) {
        console.error("Update user role error:", error);
        return res.status(500).json({ message: "Server error." });
    }
});

// Update user permissions (admin only)
app.patch("/api/admin/users/:id/permissions", authenticateToken, requireAdmin, async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) {
            return res.status(400).json({ message: "Invalid user ID." });
        }

        const { permissions } = req.body;
        if (!permissions || typeof permissions !== "object") {
            return res.status(400).json({ message: "Permissions must be a JSON object." });
        }

        const user = await prisma.user.findUnique({ where: { id } });
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        const updated = await prisma.user.update({
            where: { id },
            data: { permissions: JSON.stringify(permissions) },
            select: { id: true, name: true, email: true, role: true, status: true, permissions: true, updatedAt: true }
        });

        return res.json({ message: `Permissions updated.`, user: updated });
    } catch (error) {
        console.error("Update permissions error:", error);
        return res.status(500).json({ message: "Server error." });
    }
});

// Update user group (admin only)
app.patch("/api/admin/users/:id/group", authenticateToken, requireAdmin, async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) {
            return res.status(400).json({ message: "Invalid user ID." });
        }

        const { group } = req.body;
        if (!group || typeof group !== "string" || group.trim().length === 0) {
            return res.status(400).json({ message: "Group name is required." });
        }

        const user = await prisma.user.findUnique({ where: { id } });
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        const updated = await prisma.user.update({
            where: { id },
            data: { group: group.trim() },
            select: { id: true, name: true, email: true, role: true, status: true, group: true, updatedAt: true }
        });

        return res.json({ message: `User group updated to ${group.trim()}.`, user: updated });
    } catch (error) {
        console.error("Update user group error:", error);
        return res.status(500).json({ message: "Server error." });
    }
});

// Get list of unique groups (admin only)
app.get("/api/admin/groups", authenticateToken, requireAdmin, async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: { group: true },
            distinct: ["group"]
        });

        const groups = users.map(u => u.group).filter(Boolean);

        return res.json(groups);

    } catch (error) {
        console.error("List groups error:", error);

        return res.status(500).json({
            message: "Server error."
        });
    }
});
// === Notifications API ===

// Get notifications for the current user
app.get("/api/notifications", authenticateToken, async (req, res) => {
    try {
        const notifications = await prisma.notification.findMany({
            where: { userId: req.user.id },
            orderBy: { createdAt: "desc" },
            take: 50
        });

        return res.json(notifications);

    } catch (error) {
        console.error("Get notifications error:", error);
        return res.status(500).json({ message: "Server error." });
    }
});

// Get unread notification count
app.get("/api/notifications/unread-count", authenticateToken, async (req, res) => {
    try {
        const count = await prisma.notification.count({
            where: { userId: req.user.id, read: false }
        });
        return res.json({ count });
    } catch (error) {
        console.error("Unread count error:", error);
        return res.status(500).json({ message: "Server error." });
    }
});

// Mark notification as read
app.post("/api/notifications/mark-read", authenticateToken, async (req, res) => {
    try {
        const { id } = req.body;
        if (id) {
            await prisma.notification.updateMany({
                where: { id: parseInt(id), userId: req.user.id },
                data: { read: true }
            });
        } else {
            // Mark all as read
            await prisma.notification.updateMany({
                where: { userId: req.user.id, read: false },
                data: { read: true }
            });
        }
        return res.json({ message: "Notifications marked as read." });
    } catch (error) {
        console.error("Mark read error:", error);
        return res.status(500).json({ message: "Server error." });
    }
});

// === Private Chat API (1:1 Messenger-style) ===

// Send a private message to a specific user
app.post("/api/chat/private/:userId", authenticateToken, async (req, res) => {
    try {
        const receiverId = parseInt(req.params.userId);
        const { content } = req.body;

        if (!receiverId || isNaN(receiverId)) {
            return res.status(400).json({ message: "Invalid receiver ID." });
        }

        if (!content || typeof content !== "string" || content.trim().length === 0) {
            return res.status(400).json({ message: "Message content is required." });
        }

        const receiver = await prisma.user.findUnique({ where: { id: receiverId } });
        if (!receiver) {
            return res.status(404).json({ message: "Receiver not found." });
        }

        // Get sender info for the response
        const sender = await prisma.user.findUnique({ 
            where: { id: req.user.id },
            select: { id: true, name: true, role: true }
        });

        const message = await prisma.privateMessage.create({
            data: {
                senderId: req.user.id,
                receiverId: receiverId,
                content: content.trim()
            }
        });

        // Create notification + SSE push for receiver
        await createNotification(receiverId, "chat", "New private message", `${req.user.name} sent you a message: ${content.trim().substring(0, 50)}${content.trim().length > 50 ? '...' : ''}`);
        sseSend(receiverId, "private_message", {
            sender: sender ? { id: sender.id, name: sender.name, role: sender.role } : { id: req.user.id, name: req.user.name, role: req.user.role },
            message: {
                id: message.id,
                senderId: req.user.id,
                receiverId,
                content: message.content,
                read: message.read,
                createdAt: message.createdAt,
                senderName: sender ? sender.name : req.user.name
            }
        });

        // Return message with sender info
        return res.status(201).json({
            ...message,
            senderName: sender ? sender.name : req.user.name,
            senderRole: sender ? sender.role : req.user.role
        });
    } catch (error) {
        console.error("Send private message error:", error);
        return res.status(500).json({ message: "Server error." });
    }
});

// Keep backward compatibility for the old route format (without userId in URL)
app.post("/api/chat/private", authenticateToken, async (req, res) => {
    try {
        const { receiverId, content } = req.body;
        if (!receiverId || !content || typeof content !== "string" || content.trim().length === 0) {
            return res.status(400).json({ message: "Receiver ID and content are required." });
        }

        const receiver = await prisma.user.findUnique({ where: { id: parseInt(receiverId) } });
        if (!receiver) {
            return res.status(404).json({ message: "Receiver not found." });
        }

        const sender = await prisma.user.findUnique({ 
            where: { id: req.user.id },
            select: { id: true, name: true, role: true }
        });

        const message = await prisma.privateMessage.create({
            data: {
                senderId: req.user.id,
                receiverId: parseInt(receiverId),
                content: content.trim()
            }
        });

        // Create notification + SSE push for receiver
        await createNotification(parseInt(receiverId), "chat", "New private message", `${req.user.name} sent you a message: ${content.trim().substring(0, 50)}${content.trim().length > 50 ? '...' : ''}`);
        sseSend(parseInt(receiverId), "private_message", {
            sender: sender ? { id: sender.id, name: sender.name, role: sender.role } : { id: req.user.id, name: req.user.name, role: req.user.role },
            message: {
                id: message.id,
                senderId: req.user.id,
                receiverId: parseInt(receiverId),
                content: message.content,
                read: message.read,
                createdAt: message.createdAt,
                senderName: sender ? sender.name : req.user.name
            }
        });

        return res.status(201).json({
            ...message,
            senderName: sender ? sender.name : req.user.name,
            senderRole: sender ? sender.role : req.user.role
        });
    } catch (error) {
        console.error("Send private message error:", error);
        return res.status(500).json({ message: "Server error." });
    }
});

// Get private messages between current user and another user
app.get("/api/chat/private/:userId", authenticateToken, async (req, res) => {
    try {
        const otherUserId = parseInt(req.params.userId);
        if (isNaN(otherUserId)) {
            return res.status(400).json({ message: "Invalid user ID." });
        }

        const messages = await prisma.privateMessage.findMany({
            where: {
                OR: [
                    { senderId: req.user.id, receiverId: otherUserId },
                    { senderId: otherUserId, receiverId: req.user.id }
                ]
            },
            orderBy: { createdAt: "asc" },
            take: 100,
            include: {
                sender: { select: { id: true, name: true, role: true } },
                receiver: { select: { id: true, name: true, role: true } }
            }
        });

        // Mark received messages as read
        await prisma.privateMessage.updateMany({
            where: { senderId: otherUserId, receiverId: req.user.id, read: false },
            data: { read: true }
        });

        // Add senderName and senderRole to each message for frontend compatibility
        const enriched = messages.map(m => ({
            ...m,
            senderName: m.sender.name,
            senderRole: m.sender.role
        }));

        return res.json(enriched);
    } catch (error) {
        console.error("Get private messages error:", error);
        return res.status(500).json({ message: "Server error." });
    }
});

// Frontend-compatible conversations list endpoint
app.get("/api/chat/conversations", authenticateToken, async (req, res) => {
    try {
        const sentMessages = await prisma.privateMessage.findMany({
            where: { senderId: req.user.id },
            select: { receiverId: true },
            distinct: ["receiverId"]
        });

        const receivedMessages = await prisma.privateMessage.findMany({
            where: { receiverId: req.user.id },
            select: { senderId: true },
            distinct: ["senderId"]
        });

        const userIds = new Set();
        sentMessages.forEach(m => userIds.add(m.receiverId));
        receivedMessages.forEach(m => userIds.add(m.senderId));

        const userIdsArray = Array.from(userIds);
        const conversations = [];

        for (const uid of userIdsArray) {
            const otherUser = await prisma.user.findUnique({
                where: { id: uid },
                select: { id: true, name: true, email: true, role: true }
            });
            if (otherUser) {
                // Get last message
                const lastMessage = await prisma.privateMessage.findFirst({
                    where: {
                        OR: [
                            { senderId: req.user.id, receiverId: uid },
                            { senderId: uid, receiverId: req.user.id }
                        ]
                    },
                    orderBy: { createdAt: "desc" }
                });

                // Get unread count
                const unreadCount = await prisma.privateMessage.count({
                    where: { senderId: uid, receiverId: req.user.id, read: false }
                });

                conversations.push({
                    participants: [
                        { id: req.user.id, name: req.user.name, role: req.user.role },
                        { id: otherUser.id, name: otherUser.name, role: otherUser.role }
                    ],
                    lastMessage: lastMessage ? { 
                        content: lastMessage.content, 
                        createdAt: lastMessage.createdAt 
                    } : null,
                    unreadCount
                });
            }
        }

        // Sort by last message time descending
        conversations.sort((a, b) => {
            if (!a.lastMessage) return 1;
            if (!b.lastMessage) return -1;
            return new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt);
        });

        return res.json(conversations);
    } catch (error) {
        console.error("Get conversations error:", error);
        return res.status(500).json({ message: "Server error." });
    }
});

// Get conversations list for current user (who they've chatted with) - old route
app.get("/api/chat/private/conversations/list", authenticateToken, async (req, res) => {
    try {
        const sentMessages = await prisma.privateMessage.findMany({
            where: { senderId: req.user.id },
            select: { receiverId: true },
            distinct: ["receiverId"]
        });

        const receivedMessages = await prisma.privateMessage.findMany({
            where: { receiverId: req.user.id },
            select: { senderId: true },
            distinct: ["senderId"]
        });

        const userIds = new Set();
        sentMessages.forEach(m => userIds.add(m.receiverId));
        receivedMessages.forEach(m => userIds.add(m.senderId));

        const userIdsArray = Array.from(userIds);
        const conversations = [];

        for (const uid of userIdsArray) {
            const user = await prisma.user.findUnique({
                where: { id: uid },
                select: { id: true, name: true, email: true, role: true }
            });
            if (user) {
                // Get last message
                const lastMessage = await prisma.privateMessage.findFirst({
                    where: {
                        OR: [
                            { senderId: req.user.id, receiverId: uid },
                            { senderId: uid, receiverId: req.user.id }
                        ]
                    },
                    orderBy: { createdAt: "desc" }
                });

                // Get unread count
                const unreadCount = await prisma.privateMessage.count({
                    where: { senderId: uid, receiverId: req.user.id, read: false }
                });

                conversations.push({
                    user,
                    lastMessage: lastMessage ? lastMessage.content : null,
                    lastMessageAt: lastMessage ? lastMessage.createdAt : null,
                    unreadCount
                });
            }
        }

        // Sort by last message time descending
        conversations.sort((a, b) => {
            if (!a.lastMessageAt) return 1;
            if (!b.lastMessageAt) return -1;
            return new Date(b.lastMessageAt) - new Date(a.lastMessageAt);
        });

        return res.json(conversations);
    } catch (error) {
        console.error("Get conversations error:", error);
        return res.status(500).json({ message: "Server error." });
    }
});

// === Access Code API ===

// Verify an access code
app.post("/api/access-code/verify", async (req, res) => {
    try {
        const { code } = req.body;
        if (!code || typeof code !== "string") {
            return res.status(400).json({ valid: false, message: "Code is required." });
        }

        const trimmed = code.trim();
        const record = await prisma.accessCode.findUnique({ where: { code: trimmed } });

        if (!record) {
            return res.json({ valid: false, message: "Invalid access code." });
        }

        if (!record.isActive) {
            return res.json({ valid: false, message: "Access code is deactivated." });
        }

        if (record.maxUses > 0 && record.useCount >= record.maxUses) {
            return res.json({ valid: false, message: "Access code has expired (max uses reached)." });
        }

        await prisma.accessCode.update({
            where: { id: record.id },
            data: { useCount: { increment: 1 } }
        });

        return res.json({ valid: true, message: "Access granted." });
    } catch (error) {
        console.error("Verify access code error:", error);
        return res.status(500).json({ valid: false, message: "Server error." });
    }
});

// List all access codes (admin only)
app.get("/api/access-codes", authenticateToken, requireAdmin, async (req, res) => {
    try {
        const codes = await prisma.accessCode.findMany({
            orderBy: { createdAt: "desc" }
        });
        return res.json(codes);
    } catch (error) {
        console.error("List access codes error:", error);
        return res.status(500).json({ message: "Server error." });
    }
});

// Create a new access code (admin only)
app.post("/api/access-codes", authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { code, label, isActive, maxUses } = req.body;
        if (!code || typeof code !== "string" || code.trim().length === 0) {
            return res.status(400).json({ message: "Code is required." });
        }

        const existing = await prisma.accessCode.findUnique({ where: { code: code.trim() } });
        if (existing) {
            return res.status(409).json({ message: "Access code already exists." });
        }

        const record = await prisma.accessCode.create({
            data: {
                code: code.trim(),
                label: label || "",
                isActive: isActive !== undefined ? isActive : true,
                maxUses: maxUses || 0
            }
        });

        return res.status(201).json(record);
    } catch (error) {
        console.error("Create access code error:", error);
        return res.status(500).json({ message: "Server error." });
    }
});

// Delete an access code (admin only)
app.delete("/api/access-codes/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) {
            return res.status(400).json({ message: "Invalid ID." });
        }
        await prisma.accessCode.delete({ where: { id } });
        return res.json({ message: "Access code deleted." });
    } catch (error) {
        console.error("Delete access code error:", error);
        return res.status(500).json({ message: "Server error." });
    }
});

// === Team Members API ===

// Get all active team members (public - no auth required for viewing)
app.get("/api/team-members", async (req, res) => {
    try {
        const members = await prisma.teamMember.findMany({
            where: { isActive: true },
            orderBy: { displayOrder: "asc" }
        });
        return res.json(members);
    } catch (error) {
        console.error("Get team members error:", error);
        return res.status(500).json({ message: "Server error." });
    }
});

// Get all team members including inactive (admin only)
app.get("/api/team-members/all", authenticateToken, requireAdmin, async (req, res) => {
    try {
        const members = await prisma.teamMember.findMany({
            orderBy: { displayOrder: "asc" }
        });
        return res.json(members);
    } catch (error) {
        console.error("Get all team members error:", error);
        return res.status(500).json({ message: "Server error." });
    }
});

// Create a new team member (admin only)
app.post("/api/team-members", authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { name, position, role, description, avatarIcon, roleClass, displayOrder } = req.body;
        if (!name || typeof name !== "string" || name.trim().length === 0) {
            return res.status(400).json({ message: "Name is required." });
        }

        const member = await prisma.teamMember.create({
            data: {
                name: name.trim(),
                position: position || "",
                role: role || "EMPLOYEE",
                description: description || "",
                avatarIcon: avatarIcon || "&#128100;",
                roleClass: roleClass || "role-placeholder",
                displayOrder: parseInt(displayOrder) || 0,
                createdById: req.user.id
            }
        });
        return res.status(201).json(member);
    } catch (error) {
        console.error("Create team member error:", error);
        return res.status(500).json({ message: "Server error." });
    }
});

// Update a team member (admin only)
app.put("/api/team-members/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) return res.status(400).json({ message: "Invalid ID." });

        const existing = await prisma.teamMember.findUnique({ where: { id } });
        if (!existing) return res.status(404).json({ message: "Team member not found." });

        const { name, position, role, description, avatarIcon, roleClass, displayOrder, isActive } = req.body;

        const updated = await prisma.teamMember.update({
            where: { id },
            data: {
                ...(name !== undefined && { name: name.trim() }),
                ...(position !== undefined && { position }),
                ...(role !== undefined && { role }),
                ...(description !== undefined && { description }),
                ...(avatarIcon !== undefined && { avatarIcon }),
                ...(roleClass !== undefined && { roleClass }),
                ...(displayOrder !== undefined && { displayOrder: parseInt(displayOrder) }),
                ...(isActive !== undefined && { isActive })
            }
        });
        return res.json(updated);
    } catch (error) {
        console.error("Update team member error:", error);
        return res.status(500).json({ message: "Server error." });
    }
});

// Delete a team member (admin only)
app.delete("/api/team-members/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) return res.status(400).json({ message: "Invalid ID." });

        const existing = await prisma.teamMember.findUnique({ where: { id } });
        if (!existing) return res.status(404).json({ message: "Team member not found." });

        await prisma.teamMember.delete({ where: { id } });
        return res.json({ message: "Team member deleted." });
    } catch (error) {
        console.error("Delete team member error:", error);
        return res.status(500).json({ message: "Server error." });
    }
});

// Seed default team members (admin only) - one-time setup
app.post("/api/team-members/seed", authenticateToken, requireAdmin, async (req, res) => {
    try {
        const count = await prisma.teamMember.count();
        if (count > 0) {
            return res.json({ message: "Team members already seeded.", count });
        }

        const defaults = [
            { name: "Daniel Nguyễn", position: "Founder & Director", role: "DIRECTOR", description: "Oversees all company operations, strategy, and growth. With years of industry experience, Daniel leads the organization with vision and dedication.", avatarIcon: "&#128100;", roleClass: "role-director", displayOrder: 0 },
            { name: "Công", position: "IT", role: "IT", description: "Responsible for maintaining IT infrastructure, systems administration, and technical support across the organization.", avatarIcon: "&#128187;", roleClass: "role-it", displayOrder: 1 },
            { name: "Tấn Thắng", position: "IT", role: "IT", description: "Handles network operations, system security, and technology solutions to keep our digital environment running smoothly.", avatarIcon: "&#128187;", roleClass: "role-it", displayOrder: 2 },
            { name: "Trọng Việt", position: "Executor (Người thực thi)", role: "EMPLOYEE", description: "Responsible for executing key projects and operational tasks. Ensures timely delivery and quality output.", avatarIcon: "&#128170;", roleClass: "role-executor", displayOrder: 3 },
            { name: "Thanh Trai", position: "Executor (Người thực thi)", role: "EMPLOYEE", description: "Carries out operational tasks and project execution with precision and efficiency.", avatarIcon: "&#128170;", roleClass: "role-executor", displayOrder: 4 },
            { name: "Phước Bình", position: "Executor (Người thực thi)", role: "EMPLOYEE", description: "Supports project execution and operational workflows. Dedicated to achieving team goals.", avatarIcon: "&#128170;", roleClass: "role-executor", displayOrder: 5 },
            { name: "Nguyễn Thái", position: "Accounting", role: "ACCOUNTING", description: "Manages financial records, accounting operations, and financial reporting for the entire organization.", avatarIcon: "&#128203;", roleClass: "role-accounting", displayOrder: 6 }
        ];

        for (const member of defaults) {
            await prisma.teamMember.create({
                data: { ...member, createdById: req.user.id }
            });
        }

        return res.status(201).json({ message: "Default team members seeded.", count: defaults.length });
    } catch (error) {
        console.error("Seed team members error:", error);
        return res.status(500).json({ message: "Server error." });
    }
});

// === Chat API ===

// Post a chat message (authenticated users)
app.post("/api/chat/messages", authenticateToken, async (req, res) => {
    try {
        const { content } = req.body;
        if (!content || typeof content !== "string" || content.trim().length === 0) {
            return res.status(400).json({ message: "Message content is required." });
        }

        const message = await prisma.chatMessage.create({
            data: {
                senderId: req.user.id,
                senderName: req.user.name,
                senderRole: req.user.role,
                content: content.trim()
            }
        });

        // Real-time push to other connected users
        sseBroadcast("chat_message", message);

        return res.status(201).json(message);
    } catch (error) {
        console.error("Create message error:", error);
        return res.status(500).json({ message: "Server error." });
    }
});

// Get chat messages (authenticated users)
app.get("/api/chat/messages", authenticateToken, async (req, res) => {
    try {
        const messages = await prisma.chatMessage.findMany({
            orderBy: { createdAt: "desc" },
            take: 100
        });
        // Return in chronological order
        return res.json(messages.reverse());
    } catch (error) {
        console.error("Get messages error:", error);
        return res.status(500).json({ message: "Server error." });
    }
});

// === Reports API (Báo Cáo Tài Khoản) ===

// Helper: check if user can view all reports
function canViewAllReports(user) {
    return ["ADMIN", "DIRECTOR", "IT", "ACCOUNTING"].indexOf(user.role) !== -1;
}

// Helper: check if user can manage reports (create/edit/delete) in their group
function canManageReports(user) {
    return ["ADMIN", "LEADER", "IMPLEMENTATION", "EMPLOYEE"].indexOf(user.role) !== -1;
}

// Get all report items (with role-based filtering)
app.get("/api/reports", authenticateToken, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({ where: { id: req.user.id } });
        if (!user) return res.status(404).json({ message: "User not found." });

        let reports;
        if (canViewAllReports(user)) {
            // Director, IT, Accounting, Admin can see ALL reports
            reports = await prisma.reportItem.findMany({
                orderBy: { createdAt: "desc" },
                include: {
                    createdBy: { select: { id: true, name: true, role: true } }
                }
            });
        } else if (canManageReports(user)) {
            // Leader, Implementation, Employee can only see their own group's reports
            reports = await prisma.reportItem.findMany({
                where: {
                    OR: [
                        { group: user.group },
                        { createdById: user.id }
                    ]
                },
                orderBy: { createdAt: "desc" },
                include: {
                    createdBy: { select: { id: true, name: true, role: true } }
                }
            });
        } else {
            return res.status(403).json({ message: "You don't have permission to view reports." });
        }

        return res.json(reports);
    } catch (error) {
        console.error("Get reports error:", error);
        return res.status(500).json({ message: "Server error." });
    }
});

// Create a new report item
app.post("/api/reports", authenticateToken, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({ where: { id: req.user.id } });
        if (!user) return res.status(404).json({ message: "User not found." });

        if (!canManageReports(user) && user.role !== "ADMIN") {
            return res.status(403).json({ message: "You don't have permission to create reports." });
        }

        const { accountId, accountName, dieCount, group, category } = req.body;

        if (!accountId || !accountName) {
            return res.status(400).json({ message: "Account ID and Account Name are required." });
        }

        // Enforce group scoping: non-admin users can only create reports for their own group
        const targetGroup = group || user.group;
        if (user.role !== "ADMIN" && targetGroup !== user.group) {
            return res.status(403).json({ message: "You can only create reports for your own group/fund." });
        }

        const report = await prisma.reportItem.create({
            data: {
                accountId: accountId.trim(),
                accountName: accountName.trim(),
                dieCount: parseInt(dieCount) || 0,
                group: targetGroup,
                category: category || "Group",
                createdById: user.id
            },
            include: {
                createdBy: { select: { id: true, name: true, role: true } }
            }
        });

        return res.status(201).json(report);
    } catch (error) {
        console.error("Create report error:", error);
        return res.status(500).json({ message: "Server error." });
    }
});

// Update a report item
app.put("/api/reports/:id", authenticateToken, async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) return res.status(400).json({ message: "Invalid report ID." });

        const user = await prisma.user.findUnique({ where: { id: req.user.id } });
        if (!user) return res.status(404).json({ message: "User not found." });

        const existing = await prisma.reportItem.findUnique({ where: { id } });
        if (!existing) return res.status(404).json({ message: "Report not found." });

        // Only creator, admin, or leader of the same group can edit
        const canEdit = existing.createdById === user.id ||
                        user.role === "ADMIN" ||
                        (user.role === "LEADER" && existing.group === user.group);

        if (!canEdit) {
            return res.status(403).json({ message: "You don't have permission to edit this report." });
        }

        const { accountId, accountName, dieCount, group, category } = req.body;

        const updated = await prisma.reportItem.update({
            where: { id },
            data: {
                ...(accountId !== undefined && { accountId: accountId.trim() }),
                ...(accountName !== undefined && { accountName: accountName.trim() }),
                ...(dieCount !== undefined && { dieCount: parseInt(dieCount) }),
                ...(group !== undefined && { group: group.trim() }),
                ...(category !== undefined && { category })
            },
            include: {
                createdBy: { select: { id: true, name: true, role: true } }
            }
        });

        return res.json(updated);
    } catch (error) {
        console.error("Update report error:", error);
        return res.status(500).json({ message: "Server error." });
    }
});

// Delete a report item
app.delete("/api/reports/:id", authenticateToken, async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) return res.status(400).json({ message: "Invalid report ID." });

        const user = await prisma.user.findUnique({ where: { id: req.user.id } });
        if (!user) return res.status(404).json({ message: "User not found." });

        const existing = await prisma.reportItem.findUnique({ where: { id } });
        if (!existing) return res.status(404).json({ message: "Report not found." });

        // Only creator, admin, or leader of the same group can delete
        const canDelete = existing.createdById === user.id ||
                          user.role === "ADMIN" ||
                          (user.role === "LEADER" && existing.group === user.group);

        if (!canDelete) {
            return res.status(403).json({ message: "You don't have permission to delete this report." });
        }

        await prisma.reportItem.delete({ where: { id } });
        return res.json({ message: "Report deleted." });
    } catch (error) {
        console.error("Delete report error:", error);
        return res.status(500).json({ message: "Server error." });
    }
});

// ============================================================
// === NEW FEATURES: Admin CRUD, Roles, Invites, Content, Docs,
// === Group Chats, Broadcast Notifications, Contact, SSE Realtime
// ============================================================

// --- SSE Real-Time Event Stream ---
const sseClients = new Map(); // userId -> Set<res>

function sseSend(userId, event, data) {
    const clients = sseClients.get(userId);
    if (!clients) return;
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const res of clients) {
        try { res.write(payload); } catch (e) {}
    }
}

function sseBroadcast(event, data) {
    for (const userId of Array.from(sseClients.keys())) {
        sseSend(userId, event, data);
    }
}

async function createNotification(userId, type, title, message) {
    try {
        const notif = await prisma.notification.create({
            data: { userId, type, title, message }
        });
        sseSend(userId, "notification", notif);
        return notif;
    } catch (e) {
        console.error("createNotification error:", e);
        return null;
    }
}

app.get("/api/events", async (req, res) => {
    const token = req.query.token;
    if (!token) return res.status(401).json({ message: "Token required." });
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await prisma.user.findUnique({ where: { id: decoded.id } });
        if (!user) return res.status(404).json({ message: "User not found." });

        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");
        res.setHeader("X-Accel-Buffering", "no");
        res.flushHeaders();

        res.write(`event: connected\ndata: {"message":"connected"}\n\n`);

        if (!sseClients.has(user.id)) sseClients.set(user.id, new Set());
        sseClients.get(user.id).add(res);

        const heartbeat = setInterval(() => {
            try { res.write(`: heartbeat\n\n`); } catch (e) {}
        }, 25000);

        req.on("close", () => {
            clearInterval(heartbeat);
            const clients = sseClients.get(user.id);
            if (clients) {
                clients.delete(res);
                if (clients.size === 0) sseClients.delete(user.id);
            }
        });
    } catch (err) {
        return res.status(403).json({ message: "Invalid token." });
    }
});

// --- Admin: Create User Manually ---
app.post("/api/admin/users", authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { name, email, password, role, group, status, permissions } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: "Name, email, and password are required." });
        }
        if (typeof email !== "string" || !email.includes("@")) {
            return res.status(400).json({ message: "Valid email is required." });
        }
        if (typeof password !== "string" || password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters." });
        }

        const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
        if (existing) {
            return res.status(409).json({ message: "An account with this email already exists." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: {
                name: name.trim(),
                email: email.toLowerCase().trim(),
                password: hashedPassword,
                role: role || "EMPLOYEE",
                group: group || "General",
                status: status || "APPROVED",
                permissions: permissions ? JSON.stringify(permissions) : "{}"
            },
            select: { id: true, name: true, email: true, role: true, status: true, group: true, permissions: true, createdAt: true, updatedAt: true }
        });

        return res.status(201).json({ message: "User created successfully.", user });
    } catch (error) {
        console.error("Create user error:", error);
        return res.status(500).json({ message: "Server error." });
    }
});

// --- Admin: Edit User Manually (PUT /api/admin/users/:id) ---
app.put("/api/admin/users/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) return res.status(400).json({ message: "Invalid user ID." });

        const user = await prisma.user.findUnique({ where: { id } });
        if (!user) return res.status(404).json({ message: "User not found." });

        const { name, role, group, status, permissions } = req.body;

        const updated = await prisma.user.update({
            where: { id },
            data: {
                ...(name !== undefined && { name: name.trim() }),
                ...(role !== undefined && { role }),
                ...(group !== undefined && { group: group.trim() }),
                ...(status !== undefined && { status }),
                ...(permissions !== undefined && { permissions: typeof permissions === "string" ? permissions : JSON.stringify(permissions) })
            },
            select: { id: true, name: true, email: true, role: true, status: true, group: true, permissions: true, updatedAt: true }
        });

        return res.json({ message: "User updated.", user: updated });
    } catch (error) {
        console.error("Update user error:", error);
        return res.status(500).json({ message: "Server error." });
    }
});

// --- Admin: Reset User Password ---
app.post("/api/admin/users/:id/password", authenticateToken, requireAdmin, async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) return res.status(400).json({ message: "Invalid user ID." });

        const { password } = req.body;
        if (!password || typeof password !== "string" || password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters." });
        }

        const user = await prisma.user.findUnique({ where: { id } });
        if (!user) return res.status(404).json({ message: "User not found." });

        const hashedPassword = await bcrypt.hash(password, 10);
        await prisma.user.update({
            where: { id },
            data: { password: hashedPassword }
        });

        return res.json({ message: "Password reset successfully." });
    } catch (error) {
        console.error("Reset password error:", error);
        return res.status(500).json({ message: "Server error." });
    }
});

// --- Admin: Delete User ---
app.delete("/api/admin/users/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) return res.status(400).json({ message: "Invalid user ID." });

        if (id === req.user.id) {
            return res.status(400).json({ message: "You cannot delete your own account." });
        }

        const user = await prisma.user.findUnique({ where: { id } });
        if (!user) return res.status(404).json({ message: "User not found." });

        // Clean up related data
        await prisma.privateMessage.deleteMany({ where: { OR: [{ senderId: id }, { receiverId: id }] } });
        await prisma.chatMessage.deleteMany({ where: { senderId: id } });
        await prisma.notification.deleteMany({ where: { userId: id } });
        await prisma.groupChatMember.deleteMany({ where: { userId: id } });
        await prisma.groupChatMessage.deleteMany({ where: { senderId: id } });
        await prisma.reportItem.deleteMany({ where: { createdById: id } });
        await prisma.contactMessage.deleteMany({ where: { userId: id } });
        await prisma.user.delete({ where: { id } });

        return res.json({ message: "User deleted." });
    } catch (error) {
        console.error("Delete user error:", error);
        return res.status(500).json({ message: "Server error." });
    }
});

// --- Custom Roles API ---
app.get("/api/admin/custom-roles", authenticateToken, requireAdmin, async (req, res) => {
    try {
        const roles = await prisma.customRole.findMany({ orderBy: { createdAt: "asc" } });
        return res.json(roles);
    } catch (error) {
        console.error("List custom roles error:", error);
        return res.status(500).json({ message: "Server error." });
    }
});

app.post("/api/admin/custom-roles", authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { name, permissions } = req.body;
        if (!name || typeof name !== "string" || name.trim().length === 0) {
            return res.status(400).json({ message: "Role name is required." });
        }
        const roleName = name.trim().toUpperCase();
        const existing = await prisma.customRole.findUnique({ where: { name: roleName } });
        if (existing) {
            return res.status(409).json({ message: `Role "${roleName}" already exists.` });
        }
        const role = await prisma.customRole.create({
            data: { name: roleName, permissions: permissions ? JSON.stringify(permissions) : "{}" }
        });
        return res.status(201).json(role);
    } catch (error) {
        console.error("Create custom role error:", error);
        return res.status(500).json({ message: "Server error." });
    }
});

app.put("/api/admin/custom-roles/:name", authenticateToken, requireAdmin, async (req, res) => {
    try {
        const roleName = decodeURIComponent(req.params.name).toUpperCase();
        const { permissions } = req.body;
        const role = await prisma.customRole.findUnique({ where: { name: roleName } });
        if (!role) return res.status(404).json({ message: "Role not found." });

        const updated = await prisma.customRole.update({
            where: { name: roleName },
            data: { permissions: permissions ? JSON.stringify(permissions) : role.permissions }
        });
        return res.json(updated);
    } catch (error) {
        console.error("Update custom role error:", error);
        return res.status(500).json({ message: "Server error." });
    }
});

app.delete("/api/admin/custom-roles/:name", authenticateToken, requireAdmin, async (req, res) => {
    try {
        const roleName = decodeURIComponent(req.params.name).toUpperCase();
        await prisma.customRole.delete({ where: { name: roleName } });
        return res.json({ message: "Role deleted." });
    } catch (error) {
        console.error("Delete custom role error:", error);
        return res.status(500).json({ message: "Server error." });
    }
});

// --- Invites API ---
app.get("/api/admin/invites", authenticateToken, requireAdmin, async (req, res) => {
    try {
        const invites = await prisma.invite.findMany({ orderBy: { createdAt: "desc" } });
        return res.json(invites);
    } catch (error) {
        console.error("List invites error:", error);
        return res.status(500).json({ message: "Server error." });
    }
});

app.post("/api/admin/invites", authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { email, role, group } = req.body;
        const code = "INV" + Date.now().toString(36).toUpperCase();
        const invite = await prisma.invite.create({
            data: {
                code,
                email: email ? email.toLowerCase().trim() : null,
                role: role || "EMPLOYEE",
                group: group || "General",
                createdById: req.user.id
            }
        });
        return res.status(201).json(invite);
    } catch (error) {
        console.error("Create invite error:", error);
        return res.status(500).json({ message: "Server error." });
    }
});

app.delete("/api/admin/invites/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) return res.status(400).json({ message: "Invalid ID." });
        await prisma.invite.delete({ where: { id } });
        return res.json({ message: "Invite deleted." });
    } catch (error) {
        console.error("Delete invite error:", error);
        return res.status(500).json({ message: "Server error." });
    }
});

// --- Site Content API ---
app.get("/api/site-content", async (req, res) => {
    try {
        const records = await prisma.siteContent.findMany();
        const content = {};
        for (const r of records) {
            try { content[r.key] = JSON.parse(r.value); } catch (e) { content[r.key] = r.value; }
        }
        return res.json(content);
    } catch (error) {
        console.error("Get site content error:", error);
        return res.status(500).json({ message: "Server error." });
    }
});

app.put("/api/site-content", authenticateToken, requireAdmin, async (req, res) => {
    try {
        const updates = req.body || {};
        for (const key of Object.keys(updates)) {
            const value = JSON.stringify(updates[key]);
            const existing = await prisma.siteContent.findUnique({ where: { key } });
            if (existing) {
                await prisma.siteContent.update({ where: { key }, data: { value } });
            } else {
                await prisma.siteContent.create({ data: { key, value } });
            }
        }
        return res.json({ message: "Site content updated." });
    } catch (error) {
        console.error("Update site content error:", error);
        return res.status(500).json({ message: "Server error." });
    }
});

// --- Documents API (Document Repository) ---
app.get("/api/documents", async (req, res) => {
    try {
        const docs = await prisma.documentItem.findMany({ orderBy: { displayOrder: "asc" } });
        return res.json(docs);
    } catch (error) {
        console.error("Get documents error:", error);
        return res.status(500).json({ message: "Server error." });
    }
});

app.get("/api/documents/all", authenticateToken, requireAdmin, async (req, res) => {
    try {
        const docs = await prisma.documentItem.findMany({ orderBy: { displayOrder: "asc" } });
        return res.json(docs);
    } catch (error) {
        console.error("Get all documents error:", error);
        return res.status(500).json({ message: "Server error." });
    }
});

app.post("/api/documents", authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { name, link, category, visibleRoles, displayOrder } = req.body;
        if (!name || !link) return res.status(400).json({ message: "Name and link are required." });
        const doc = await prisma.documentItem.create({
            data: {
                name: name.trim(),
                link: link.trim(),
                category: category || "Group",
                visibleRoles: visibleRoles ? JSON.stringify(visibleRoles) : "[]",
                displayOrder: parseInt(displayOrder) || 0,
                createdById: req.user.id
            }
        });
        return res.status(201).json(doc);
    } catch (error) {
        console.error("Create document error:", error);
        return res.status(500).json({ message: "Server error." });
    }
});

app.put("/api/documents/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) return res.status(400).json({ message: "Invalid ID." });
        const { name, link, category, visibleRoles, displayOrder } = req.body;
        const doc = await prisma.documentItem.findUnique({ where: { id } });
        if (!doc) return res.status(404).json({ message: "Document not found." });

        const updated = await prisma.documentItem.update({
            where: { id },
            data: {
                ...(name !== undefined && { name: name.trim() }),
                ...(link !== undefined && { link: link.trim() }),
                ...(category !== undefined && { category }),
                ...(visibleRoles !== undefined && { visibleRoles: JSON.stringify(visibleRoles) }),
                ...(displayOrder !== undefined && { displayOrder: parseInt(displayOrder) })
            }
        });
        return res.json(updated);
    } catch (error) {
        console.error("Update document error:", error);
        return res.status(500).json({ message: "Server error." });
    }
});

app.delete("/api/documents/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) return res.status(400).json({ message: "Invalid ID." });
        await prisma.documentItem.delete({ where: { id } });
        return res.json({ message: "Document deleted." });
    } catch (error) {
        console.error("Delete document error:", error);
        return res.status(500).json({ message: "Server error." });
    }
});

// --- Group Chats API ---
// Helper: can user manage group chats
function canManageGroupChats(user) {
    return ["ADMIN", "DIRECTOR", "IT", "ACCOUNTING", "LEADER"].indexOf(user.role) !== -1;
}

// List group chats the user is a member of
app.get("/api/group-chats", authenticateToken, async (req, res) => {
    try {
        const memberships = await prisma.groupChatMember.findMany({
            where: { userId: req.user.id },
            include: {
                group: {
                    include: {
                        members: { include: { user: { select: { id: true, name: true, role: true } } } },
                        createdBy: { select: { id: true, name: true } }
                    }
                }
            }
        });
        const groups = memberships.map(m => m.group);
        for (const g of groups) {
            const lastMsg = await prisma.groupChatMessage.findFirst({
                where: { groupId: g.id },
                orderBy: { createdAt: "desc" }
            });
            g.lastMessage = lastMsg || null;
        }
        return res.json(groups);
    } catch (error) {
        console.error("Get group chats error:", error);
        return res.status(500).json({ message: "Server error." });
    }
});

// List all group chats (admin only)
app.get("/api/group-chats/all", authenticateToken, requireAdmin, async (req, res) => {
    try {
        const groups = await prisma.groupChat.findMany({
            include: {
                members: { include: { user: { select: { id: true, name: true, role: true } } } },
                createdBy: { select: { id: true, name: true } }
            }
        });
        return res.json(groups);
    } catch (error) {
        console.error("Get all group chats error:", error);
        return res.status(500).json({ message: "Server error." });
    }
});

// Create a group chat
app.post("/api/group-chats", authenticateToken, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({ where: { id: req.user.id } });
        if (!user) return res.status(404).json({ message: "User not found." });
        if (!canManageGroupChats(user)) {
            return res.status(403).json({ message: "You don't have permission to create group chats." });
        }

        const { name, description, memberIds } = req.body;
        if (!name || typeof name !== "string" || name.trim().length === 0) {
            return res.status(400).json({ message: "Group name is required." });
        }

        const group = await prisma.groupChat.create({
            data: {
                name: name.trim(),
                description: description || "",
                createdById: user.id,
                members: {
                    create: [
                        { userId: user.id, role: "ADMIN" },
                        ...(memberIds || []).filter(mid => parseInt(mid) !== user.id).map(mid => ({
                            userId: parseInt(mid), role: "MEMBER"
                        }))
                    ]
                }
            },
            include: {
                members: { include: { user: { select: { id: true, name: true, role: true } } } },
                createdBy: { select: { id: true, name: true } }
            }
        });

        const memberUserIds = (memberIds || []).filter(mid => parseInt(mid) !== user.id);
        for (const mid of memberUserIds) {
            await createNotification(parseInt(mid), "group", "Added to group chat", `You were added to the group "${group.name}" by ${user.name}.`);
        }

        return res.status(201).json(group);
    } catch (error) {
        console.error("Create group chat error:", error);
        return res.status(500).json({ message: "Server error." });
    }
});

// Update group chat (name, description, add/remove members)
app.put("/api/group-chats/:id", authenticateToken, async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) return res.status(400).json({ message: "Invalid group ID." });

        const group = await prisma.groupChat.findUnique({ where: { id } });
        if (!group) return res.status(404).json({ message: "Group not found." });

        const user = await prisma.user.findUnique({ where: { id: req.user.id } });
        if (!user) return res.status(404).json({ message: "User not found." });

        const membership = await prisma.groupChatMember.findUnique({
            where: { groupId_userId: { groupId: id, userId: user.id } }
        });
        const isGroupAdmin = membership && membership.role === "ADMIN";
        if (!canManageGroupChats(user) && !isGroupAdmin) {
            return res.status(403).json({ message: "You don't have permission to edit this group." });
        }

        const { name, description, memberIds } = req.body;

        const updated = await prisma.groupChat.update({
            where: { id },
            data: {
                ...(name !== undefined && { name: name.trim() }),
                ...(description !== undefined && { description })
            }
        });

        if (memberIds && Array.isArray(memberIds)) {
            const currentMembers = await prisma.groupChatMember.findMany({ where: { groupId: id } });
            const currentIds = new Set(currentMembers.map(m => m.userId));
            const newIds = new Set(memberIds.map(mid => parseInt(mid)));
            for (const m of currentMembers) {
                if (!newIds.has(m.userId)) {
                    await prisma.groupChatMember.delete({ where: { id: m.id } });
                }
            }
            for (const mid of newIds) {
                if (!currentIds.has(mid)) {
                    await prisma.groupChatMember.create({
                        data: { groupId: id, userId: mid, role: "MEMBER" }
                    });
                    const addedUser = await prisma.user.findUnique({ where: { id: mid } });
                    if (addedUser) {
                        await createNotification(mid, "group", "Added to group chat", `You were added to the group "${updated.name}" by ${user.name}.`);
                    }
                }
            }
        }

        const result = await prisma.groupChat.findUnique({
            where: { id },
            include: {
                members: { include: { user: { select: { id: true, name: true, role: true } } } },
                createdBy: { select: { id: true, name: true } }
            }
        });

        return res.json(result);
    } catch (error) {
        console.error("Update group chat error:", error);
        return res.status(500).json({ message: "Server error." });
    }
});

// Delete a group chat (creator or admin only)
app.delete("/api/group-chats/:id", authenticateToken, async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) return res.status(400).json({ message: "Invalid group ID." });

        const group = await prisma.groupChat.findUnique({ where: { id } });
        if (!group) return res.status(404).json({ message: "Group not found." });

        const user = await prisma.user.findUnique({ where: { id: req.user.id } });
        if (!user) return res.status(404).json({ message: "User not found." });

        const isOwner = group.createdById === user.id;
        const canDelete = isOwner || user.role === "ADMIN" || user.role === "DIRECTOR" || user.role === "IT";
        if (!canDelete) {
            return res.status(403).json({ message: "You don't have permission to delete this group." });
        }

        await prisma.groupChat.delete({ where: { id } });
        return res.json({ message: "Group chat deleted." });
    } catch (error) {
        console.error("Delete group chat error:", error);
        return res.status(500).json({ message: "Server error." });
    }
});

// Get group chat messages
app.get("/api/group-chats/:id/messages", authenticateToken, async (req, res) => {
    try {
        const groupId = parseInt(req.params.id, 10);
        if (isNaN(groupId)) return res.status(400).json({ message: "Invalid group ID." });

        const membership = await prisma.groupChatMember.findUnique({
            where: { groupId_userId: { groupId, userId: req.user.id } }
        });
        if (!membership) return res.status(403).json({ message: "You are not a member of this group." });

        const messages = await prisma.groupChatMessage.findMany({
            where: { groupId },
            orderBy: { createdAt: "asc" },
            take: 200
        });
        return res.json(messages);
    } catch (error) {
        console.error("Get group messages error:", error);
        return res.status(500).json({ message: "Server error." });
    }
});

// Send a message to a group
app.post("/api/group-chats/:id/messages", authenticateToken, async (req, res) => {
    try {
        const groupId = parseInt(req.params.id, 10);
        if (isNaN(groupId)) return res.status(400).json({ message: "Invalid group ID." });
        const { content } = req.body;
        if (!content || typeof content !== "string" || content.trim().length === 0) {
            return res.status(400).json({ message: "Message content is required." });
        }

        const membership = await prisma.groupChatMember.findUnique({
            where: { groupId_userId: { groupId, userId: req.user.id } }
        });
        if (!membership) return res.status(403).json({ message: "You are not a member of this group." });

        const group = await prisma.groupChat.findUnique({ where: { id: groupId } });
        const message = await prisma.groupChatMessage.create({
            data: {
                groupId,
                senderId: req.user.id,
                senderName: req.user.name,
                content: content.trim()
            }
        });

        // Notify all other members in real-time
        const members = await prisma.groupChatMember.findMany({ where: { groupId } });
        for (const m of members) {
            if (m.userId !== req.user.id) {
                await createNotification(m.userId, "group_chat", `New message in ${group.name}`, `${req.user.name}: ${content.trim().substring(0, 60)}`);
                sseSend(m.userId, "group_message", {
                    groupId,
                    message
                });
            }
        }

        return res.status(201).json(message);
    } catch (error) {
        console.error("Send group message error:", error);
        return res.status(500).json({ message: "Server error." });
    }
});

// --- Broadcast Notification (Admin only) ---
app.post("/api/notifications/broadcast", authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { title, message, roles } = req.body;
        if (!title || !message) {
            return res.status(400).json({ message: "Title and message are required." });
        }

        const where = roles && roles.length > 0 ? { role: { in: roles } } : {};
        const users = await prisma.user.findMany({ where, select: { id: true } });

        for (const u of users) {
            await createNotification(u.id, "broadcast", title, message);
        }

        return res.json({ message: `Broadcast sent to ${users.length} users.` });
    } catch (error) {
        console.error("Broadcast notification error:", error);
        return res.status(500).json({ message: "Server error." });
    }
});

// --- Contact API ---
app.post("/api/contact", async (req, res) => {
    try {
        const { name, email, message, userId } = req.body;
        if (!name || !email || !message) {
            return res.status(400).json({ message: "Name, email, and message are required." });
        }
        const contact = await prisma.contactMessage.create({
            data: {
                name: name.trim(),
                email: email.trim(),
                message: message.trim(),
                userId: userId ? parseInt(userId) : null
            }
        });
        return res.status(201).json({ message: "Message sent.", contact });
    } catch (error) {
        console.error("Contact error:", error);
        return res.status(500).json({ message: "Server error." });
    }
});

// Get all contact messages (admin only)
app.get("/api/contact", authenticateToken, requireAdmin, async (req, res) => {
    try {
        const contacts = await prisma.contactMessage.findMany({ orderBy: { createdAt: "desc" } });
        return res.json(contacts);
    } catch (error) {
        console.error("Get contacts error:", error);
        return res.status(500).json({ message: "Server error." });
    }
});

console.log("3. About to listen on", PORT);
app.listen(PORT, "0.0.0.0", () => {
    console.log(`\n🚀 Server running!`);
    console.log(`   Local:    http://localhost:${PORT}`);
    console.log(`   Network:  http://${LOCAL_IP}:${PORT}`);
    console.log(`   SQLite DB: backend/prisma/dev.db`);
    console.log(`   Admin:    http://${LOCAL_IP}:${PORT} (then sign in)\n`);
});