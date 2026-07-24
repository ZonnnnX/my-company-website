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

const app = express();

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
        const { name, email, password } = req.body;

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
                role: "EMPLOYEE",
                status: "PENDING"
            }
        });

        return res.status(201).json({
            message: "Registration successful. Your account is pending admin approval.",
            user: { id: user.id, name: user.name, email: user.email, role: user.role, status: user.status }
        });
    } catch (error) {
        console.error("Register error:", error);
        return res.status(500).json({ message: "Server error." });
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
        console.error("Login error:", error);
        return res.status(500).json({ message: "Server error." });
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
        return res.status(500).json({ message: "Server error." });
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

// Send a private message
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

        const message = await prisma.privateMessage.create({
            data: {
                senderId: req.user.id,
                receiverId: parseInt(receiverId),
                content: content.trim()
            }
        });

        // Create notification for receiver
        await prisma.notification.create({
            data: {
                userId: parseInt(receiverId),
                type: "chat",
                title: "New private message",
                message: `${req.user.name} sent you a message: ${content.trim().substring(0, 50)}${content.trim().length > 50 ? '...' : ''}`
            }
        });

        return res.status(201).json(message);
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
            take: 100
        });

        // Mark received messages as read
        await prisma.privateMessage.updateMany({
            where: { senderId: otherUserId, receiverId: req.user.id, read: false },
            data: { read: true }
        });

        return res.json(messages);
    } catch (error) {
        console.error("Get private messages error:", error);
        return res.status(500).json({ message: "Server error." });
    }
});

// Get conversations list for current user (who they've chatted with)
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

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

