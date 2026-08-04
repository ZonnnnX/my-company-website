    async function localStorageApi(path, options) {
        var method = (options && options.method) || 'GET';
        var body = (options && options.body) ? JSON.parse(options.body) : {};
        var token = getToken();
        var currentUser = getUser();

        // === AUTH ===
        if (path === '/api/auth/login' && method === 'POST') {
            var users = getLocalUsers();
            var user = null;
            for (var ui = 0; ui < users.length; ui++) {
                if (users[ui].email === body.email.toLowerCase().trim()) { user = users[ui]; break; }
            }
            if (!user || body.password !== user.password) throw new Error('Invalid email or password.');
            if (user.status === 'PENDING') throw new Error('Your account is pending approval.');
            if (user.status === 'REJECTED') throw new Error('Your account has been rejected.');
            var fakeJwt = 'local_' + user.id + '_' + btoa(JSON.stringify({ id: user.id, email: user.email, name: user.name, role: user.role, status: user.status }));
            return { token: fakeJwt, user: { id: user.id, name: user.name, email: user.email, role: user.role, status: user.status } };
        }

        if (path === '/api/auth/register' && method === 'POST') {
            var users = getLocalUsers();
            for (var ui2 = 0; ui2 < users.length; ui2++) {
                if (users[ui2].email === body.email.toLowerCase().trim()) throw new Error('An account with this email already exists.');
            }
            var maxId = 0;
            for (var ui3 = 0; ui3 < users.length; ui3++) { if (users[ui3].id > maxId) maxId = users[ui3].id; }
            var newRole = 'EMPLOYEE';
            var newStatus = 'PENDING';
            var newGroup = 'General';
            var invite = null;
            // Check invite code if provided
            if (body.inviteCode) {
                var invites = getLocalInvites();
                for (var iiv = 0; iiv < invites.length; iiv++) {
                    if (invites[iiv].code === body.inviteCode) { invite = invites[iiv]; break; }
                }
                if (!invite) throw new Error('Mã mời không hợp lệ hoặc đã bị xóa.');
                if (invite.usedBy) throw new Error('Mã mời này đã được sử dụng.');
                if (invite.email && invite.email !== body.email.toLowerCase().trim()) {
                    throw new Error('Mã mời này chỉ dành cho email: ' + invite.email);
                }
                newRole = invite.role || 'EMPLOYEE';
                newStatus = 'APPROVED';
                newGroup = invite.group || 'General';
                invite.usedBy = maxId + 1;
                invite.usedByName = body.name.trim();
                invite.usedAt = new Date().toISOString();
                saveLocalInvites(invites);
            }
            var newUser = {
                id: maxId + 1,
                name: body.name.trim(),
                email: body.email.toLowerCase().trim(),
                password: body.password,
                role: newRole,
                status: newStatus,
                group: newGroup,
                permissions: '{}',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            users.push(newUser);
            saveLocalUsers(users);
            return { message: invite ? 'Đăng ký thành công! Tài khoản của bạn đã được cấp quyền qua mã mời.' : 'Registration successful. Your account is pending admin approval.', user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role, status: newUser.status } };
        }

        if (path === '/api/auth/me' && method === 'GET') {
            if (!token || !currentUser) throw new Error('Not authenticated');
            var users = getLocalUsers();
            for (var ui4 = 0; ui4 < users.length; ui4++) {
                if (users[ui4].id === currentUser.id) return { id: users[ui4].id, name: users[ui4].name, email: users[ui4].email, role: users[ui4].role, status: users[ui4].status, createdAt: users[ui4].createdAt };
            }
            throw new Error('User not found.');
        }

        // === ADMIN ===
        if (path === '/api/admin/pending-count' && method === 'GET') {
            var users = getLocalUsers();
            var count = 0;
            for (var ui5 = 0; ui5 < users.length; ui5++) { if (users[ui5].status === 'PENDING') count++; }
            return { count: count };
        }

        if (path === '/api/admin/users' && method === 'GET') {
            var users = getLocalUsers();
            var result = [];
            for (var ui6 = 0; ui6 < users.length; ui6++) {
                var u = users[ui6];
                result.push({ id: u.id, name: u.name, email: u.email, role: u.role, status: u.status, group: u.group, permissions: u.permissions, createdAt: u.createdAt, updatedAt: u.updatedAt });
            }
            return result;
        }

        if (path === '/api/admin/users' && method === 'POST') {
            var users = getLocalUsers();
            var name = (body.name || '').trim();
            var email = (body.email || '').trim().toLowerCase();
            var password = body.password || '';
            var role = body.role || 'EMPLOYEE';
            var group = body.group || 'General';
            var status = body.status || 'APPROVED';
            if (!name) throw new Error('Name, email, and password are required.');
            if (!email || email.indexOf('@') === -1) throw new Error('Valid email is required.');
            if (password.length < 6) throw new Error('Password must be at least 6 characters.');
            for (var cui = 0; cui < users.length; cui++) {
                if (users[cui].email === email) throw new Error('An account with this email already exists.');
            }
            var maxNewId = 0;
            for (var cui2 = 0; cui2 < users.length; cui2++) { if (users[cui2].id > maxNewId) maxNewId = users[cui2].id; }
            var newUser = {
                id: maxNewId + 1,
                name: name,
                email: email,
                password: password,
                role: role,
                status: status,
                group: group,
                permissions: '{}',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            users.push(newUser);
            saveLocalUsers(users);
            return { message: 'User created successfully.', user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role, status: newUser.status, group: newUser.group, permissions: newUser.permissions, createdAt: newUser.createdAt, updatedAt: newUser.updatedAt } };
        }

        var statusMatch = path.match(/^\/api\/admin\/users\/(\d+)\/status$/);
        if (statusMatch && method === 'PATCH') {
            var users = getLocalUsers();
            var sid = parseInt(statusMatch[1]);
            for (var ui7 = 0; ui7 < users.length; ui7++) {
                if (users[ui7].id === sid) {
                    users[ui7].status = body.status;
                    users[ui7].updatedAt = new Date().toISOString();
                    saveLocalUsers(users);
                    return { message: 'User ' + body.status.toLowerCase() + '.', user: users[ui7] };
                }
            }
            throw new Error('User not found.');
        }

        var roleMatch = path.match(/^\/api\/admin\/users\/(\d+)\/role$/);
        if (roleMatch && method === 'PATCH') {
            var users = getLocalUsers();
            var rid = parseInt(roleMatch[1]);
            for (var ui8 = 0; ui8 < users.length; ui8++) {
                if (users[ui8].id === rid) {
                    users[ui8].role = body.role;
                    users[ui8].updatedAt = new Date().toISOString();
                    saveLocalUsers(users);
                    return { message: 'User role updated to ' + body.role + '.', user: users[ui8] };
                }
            }
            throw new Error('User not found.');
        }

        var groupMatch = path.match(/^\/api\/admin\/users\/(\d+)\/group$/);
        if (groupMatch && method === 'PATCH') {
            var users = getLocalUsers();
            var gid = parseInt(groupMatch[1]);
            for (var ui8b = 0; ui8b < users.length; ui8b++) {
                if (users[ui8b].id === gid) {
                    users[ui8b].group = body.group;
                    users[ui8b].updatedAt = new Date().toISOString();
                    saveLocalUsers(users);
                    return { message: 'User group updated to ' + body.group + '.', user: users[ui8b] };
                }
            }
            throw new Error('User not found.');
        }

        var userDelMatch = path.match(/^\/api\/admin\/users\/(\d+)$/);
        if (userDelMatch && method === 'DELETE') {
            var users = getLocalUsers();
            var delUserId = parseInt(userDelMatch[1]);
            var newUsersList = [];
            var foundDel = false;
            for (var ui8c = 0; ui8c < users.length; ui8c++) {
                if (users[ui8c].id === delUserId) { foundDel = true; continue; }
                newUsersList.push(users[ui8c]);
            }
            if (!foundDel) throw new Error('User not found.');
            saveLocalUsers(newUsersList);
            // Also remove their private messages
            var allPvt = getLocalPvtMsgs();
            allPvt = allPvt.filter(function(m) { return m.senderId !== delUserId && m.receiverId !== delUserId; });
            saveLocalPvtMsgs(allPvt);
            // Also remove them from any group chats
            var allGroups = getLocalGroupChats();
            for (var giDel = 0; giDel < allGroups.length; giDel++) {
                if (allGroups[giDel].members) {
                    allGroups[giDel].members = allGroups[giDel].members.filter(function(m) { return m !== delUserId; });
                }
            }
            saveLocalGroupChats(allGroups);
            return { message: 'User deleted.' };
        }

        // === CUSTOM ROLES ===
        if (path === '/api/admin/custom-roles' && method === 'GET') {
            return getCustomRoles();
        }
        if (path === '/api/admin/custom-roles' && method === 'POST') {
            var customRoles = getCustomRoles();
            var newRoleName = (body.name || '').trim().toUpperCase();
            if (!newRoleName) throw new Error('Tên role không được để trống.');
            if (DEFAULT_ROLES.indexOf(newRoleName) !== -1) throw new Error('Role "' + newRoleName + '" đã tồn tại trong hệ thống.');
            if (GROUP_ROLES.indexOf(newRoleName) !== -1) throw new Error('Role "' + newRoleName + '" đã tồn tại trong hệ thống.');
            for (var cri = 0; cri < customRoles.length; cri++) {
                if (customRoles[cri].name.toUpperCase() === newRoleName) throw new Error('Role "' + newRoleName + '" đã tồn tại.');
            }
            var newRole = { name: newRoleName, createdAt: new Date().toISOString() };
            customRoles.push(newRole);
            saveCustomRoles(customRoles);
            return newRole;
        }
        var customRoleDelMatch = path.match(/^\/api\/admin\/custom-roles\/(.+)$/);
        if (customRoleDelMatch && method === 'DELETE') {
            var delRoleName = decodeURIComponent(customRoleDelMatch[1]).toUpperCase();
            var customRoles = getCustomRoles();
            var foundRole = false;
            for (var cdi = 0; cdi < customRoles.length; cdi++) {
                if (customRoles[cdi].name.toUpperCase() === delRoleName) { customRoles.splice(cdi, 1); foundRole = true; break; }
            }
            if (!foundRole) throw new Error('Role không tồn tại.');
            saveCustomRoles(customRoles);
            return { message: 'Đã xóa role ' + delRoleName + '.' };
        }

        // === INVITES ===
        if (path === '/api/admin/invites' && method === 'GET') {
            return getLocalInvites();
        }
        if (path === '/api/admin/invites' && method === 'POST') {
            var invites = getLocalInvites();
            var inviteCode = 'INV' + Date.now().toString(36).toUpperCase();
            var newInvite = {
                id: invites.length > 0 ? invites[invites.length - 1].id + 1 : 1,
                code: inviteCode,
                email: body.email ? body.email.toLowerCase().trim() : null,
                role: body.role || 'EMPLOYEE',
                group: body.group || 'General',
                createdById: currentUser ? currentUser.id : null,
                createdByName: currentUser ? currentUser.name : null,
                createdAt: new Date().toISOString(),
                usedBy: null,
                usedByName: null,
                usedAt: null
            };
            invites.push(newInvite);
            saveLocalInvites(invites);
            return newInvite;
        }
        var inviteDelMatch = path.match(/^\/api\/admin\/invites\/(\d+)$/);
        if (inviteDelMatch && method === 'DELETE') {
            var invites = getLocalInvites();
            var delInviteId = parseInt(inviteDelMatch[1]);
            var newInvites = [];
            var foundInvite = false;
            for (var ivi = 0; ivi < invites.length; ivi++) {
                if (invites[ivi].id === delInviteId) { foundInvite = true; continue; }
                newInvites.push(invites[ivi]);
            }
            if (!foundInvite) throw new Error('Mã mời không tồn tại.');
            saveLocalInvites(newInvites);
            return { message: 'Đã xóa mã mời.' };
        }

// === BROADCAST ===
        if (path === '/api/admin/broadcasts' && method === 'GET') {
            return getLocalBroadcasts();
        }
        if (path === '/api/admin/broadcasts' && method === 'POST') {
            var broadcasts = getLocalBroadcasts();
            var maxBid = 0;
            for (var bi = 0; bi < broadcasts.length; bi++) { if (broadcasts[bi].id > maxBid) maxBid = broadcasts[bi].id; }
            var bc = {
                id: maxBid + 1,
                title: (body.title || '').trim(),
                message: (body.message || '').trim(),
                roles: body.roles || [],
                createdById: currentUser ? currentUser.id : null,
                createdByName: currentUser ? currentUser.name : null,
                createdAt: new Date().toISOString()
            };
            broadcasts.push(bc);
            saveLocalBroadcasts(broadcasts);
            return bc;
        }
        var broadcastDelMatch = path.match(/^\/api\/admin\/broadcasts\/(\d+)$/);
        if (broadcastDelMatch && method === 'DELETE') {
            var broadcasts = getLocalBroadcasts();
            var delBid = parseInt(broadcastDelMatch[1]);
            var newBroadcasts = [];
            var foundBc = false;
            for (var bi2 = 0; bi2 < broadcasts.length; bi2++) {
                if (broadcasts[bi2].id === delBid) { foundBc = true; continue; }
                newBroadcasts.push(broadcasts[bi2]);
            }
            if (!foundBc) throw new Error('Thông báo không tồn tại.');
            saveLocalBroadcasts(newBroadcasts);
            return { message: 'Đã xóa thông báo.' };
        }

        // === CHAT ===
        if (path === '/api/chat/messages' && method === 'GET') {
            var msgs = getLocalMsgs();
            var out = [];
            for (var mi = msgs.length - 1; mi >= 0; mi--) out.push(msgs[mi]);
            return out;
        }

        if (path === '/api/chat/messages' && method === 'POST') {
            var msgs = getLocalMsgs();
            var maxMid = 0;
            for (var mi2 = 0; mi2 < msgs.length; mi2++) { if (msgs[mi2].id > maxMid) maxMid = msgs[mi2].id; }
            var msg = { id: maxMid + 1, senderId: currentUser.id, senderName: currentUser.name, senderRole: currentUser.role, content: body.content.trim(), createdAt: new Date().toISOString() };
            msgs.push(msg);
            saveLocalMsgs(msgs);
            return msg;
        }

        // === PRIVATE CHAT ===
        var sendPvtMatch = path.match(/^\/api\/chat\/private\/(\d+)$/);
        if (sendPvtMatch && method === 'POST') {
            var receiverId = parseInt(sendPvtMatch[1]);
            var pmsgs = getLocalPvtMsgs();
            var maxPid = 0;
            for (var pi = 0; pi < pmsgs.length; pi++) { if (pmsgs[pi].id > maxPid) maxPid = pmsgs[pi].id; }
            var pmsg = { id: maxPid + 1, senderId: currentUser.id, senderName: currentUser.name, receiverId: receiverId, content: body.content.trim(), read: false, createdAt: new Date().toISOString() };
            pmsgs.push(pmsg);
            saveLocalPvtMsgs(pmsgs);
            return pmsg;
        }

        var getPvtMatch = path.match(/^\/api\/chat\/private\/(\d+)$/);
        if (getPvtMatch && method === 'GET') {
            var otherId = parseInt(getPvtMatch[1]);
            var pmsgs = getLocalPvtMsgs();
            var filtered = [];
            for (var pi2 = 0; pi2 < pmsgs.length; pi2++) {
                var m = pmsgs[pi2];
                if ((m.senderId === currentUser.id && m.receiverId === otherId) || (m.senderId === otherId && m.receiverId === currentUser.id)) {
                    filtered.push(m);
                    if (m.senderId === otherId && m.receiverId === currentUser.id) m.read = true;
                }
            }
            saveLocalPvtMsgs(pmsgs);
            filtered.sort(function(a, b) { return new Date(a.createdAt) - new Date(b.createdAt); });
            return filtered;
        }

        if ((path === '/api/chat/conversations' || path === '/api/chat/private/conversations/list') && method === 'GET') {
            var allMsgs = getLocalPvtMsgs();
            var allUsers = getLocalUsers();
            var userIdSet = {};
            for (var pi3 = 0; pi3 < allMsgs.length; pi3++) {
                if (allMsgs[pi3].senderId === currentUser.id) userIdSet[allMsgs[pi3].receiverId] = true;
                if (allMsgs[pi3].receiverId === currentUser.id) userIdSet[allMsgs[pi3].senderId] = true;
            }
            var convs = [];
            var uidKeys = Object.keys(userIdSet);
            for (var ki = 0; ki < uidKeys.length; ki++) {
                var uid = parseInt(uidKeys[ki]);
                var foundUser = null;
                for (var ui9 = 0; ui9 < allUsers.length; ui9++) { if (allUsers[ui9].id === uid) { foundUser = allUsers[ui9]; break; } }
                if (!foundUser) continue;
                var userMsgs = [];
                for (var pi4 = 0; pi4 < allMsgs.length; pi4++) {
                    var m2 = allMsgs[pi4];
                    if ((m2.senderId === currentUser.id && m2.receiverId === uid) || (m2.senderId === uid && m2.receiverId === currentUser.id)) {
                        userMsgs.push(m2);
                    }
                }
                var lastMsg = userMsgs.length > 0 ? userMsgs[userMsgs.length - 1] : null;
                var unreadCount = 0;
                for (var pi5 = 0; pi5 < allMsgs.length; pi5++) {
                    if (allMsgs[pi5].senderId === uid && allMsgs[pi5].receiverId === currentUser.id && !allMsgs[pi5].read) unreadCount++;
                }
                convs.push({ user: { id: foundUser.id, name: foundUser.name, email: foundUser.email, role: foundUser.role }, participants: [{ id: currentUser.id }, { id: uid }], lastMessage: lastMsg, unreadCount: unreadCount });
            }
            convs.sort(function(a, b) { if (!a.lastMessage) return 1; if (!b.lastMessage) return -1; return new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt); });
            return convs;
        }

        // === REPORTS ===
        if (path === '/api/reports' && method === 'GET') {
            var reports = getLocalReports();
            var allUsers = getLocalUsers();
            var result = [];
            for (var ri = 0; ri < reports.length; ri++) {
                var rpt = reports[ri];
                var creator = null;
                for (var ui10 = 0; ui10 < allUsers.length; ui10++) { if (allUsers[ui10].id === rpt.createdById) { creator = { id: allUsers[ui10].id, name: allUsers[ui10].name, role: allUsers[ui10].role }; break; } }
                result.push({ id: rpt.id, accountId: rpt.accountId, accountName: rpt.accountName, dieCount: rpt.dieCount, group: rpt.group, category: rpt.category, createdById: rpt.createdById, createdAt: rpt.createdAt, updatedAt: rpt.updatedAt, createdBy: creator });
            }
            return result;
        }

        if (path === '/api/reports' && method === 'POST') {
            var reports = getLocalReports();
            var maxRid = 0;
            for (var ri2 = 0; ri2 < reports.length; ri2++) { if (reports[ri2].id > maxRid) maxRid = reports[ri2].id; }
            var report = { id: maxRid + 1, accountId: body.accountId.trim(), accountName: body.accountName.trim(), dieCount: parseInt(body.dieCount) || 0, group: body.group || 'General', category: body.category || 'Group', createdById: currentUser.id, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
            reports.push(report);
            saveLocalReports(reports);
            var allUsers = getLocalUsers();
            var creator = null;
            for (var ui11 = 0; ui11 < allUsers.length; ui11++) { if (allUsers[ui11].id === currentUser.id) { creator = { id: allUsers[ui11].id, name: allUsers[ui11].name, role: allUsers[ui11].role }; break; } }
            report.createdBy = creator;
            return report;
        }

        var reportPutMatch = path.match(/^\/api\/reports\/(\d+)$/);
        if (reportPutMatch && method === 'PUT') {
            var reports = getLocalReports();
            var reportId = parseInt(reportPutMatch[1]);
            for (var ri3 = 0; ri3 < reports.length; ri3++) {
                if (reports[ri3].id === reportId) {
                    if (body.accountId !== undefined) reports[ri3].accountId = body.accountId.trim();
                    if (body.accountName !== undefined) reports[ri3].accountName = body.accountName.trim();
                    if (body.dieCount !== undefined) reports[ri3].dieCount = parseInt(body.dieCount);
                    if (body.group !== undefined) reports[ri3].group = body.group.trim();
                    if (body.category !== undefined) reports[ri3].category = body.category;
                    reports[ri3].updatedAt = new Date().toISOString();
                    saveLocalReports(reports);
                    var allUsers = getLocalUsers();
                    var creator = null;
                    for (var ui12 = 0; ui12 < allUsers.length; ui12++) { if (allUsers[ui12].id === reports[ri3].createdById) { creator = { id: allUsers[ui12].id, name: allUsers[ui12].name, role: allUsers[ui12].role }; break; } }
                    reports[ri3].createdBy = creator;
                    return reports[ri3];
                }
            }
            throw new Error('Report not found.');
        }

        var reportDelMatch = path.match(/^\/api\/reports\/(\d+)$/);
        if (reportDelMatch && method === 'DELETE') {
            var reports = getLocalReports();
            var delId = parseInt(reportDelMatch[1]);
            var newReports = [];
            for (var ri4 = 0; ri4 < reports.length; ri4++) { if (reports[ri4].id !== delId) newReports.push(reports[ri4]); }
            saveLocalReports(newReports);
            return { message: 'Report deleted.' };
        }

        if (path === '/api/access-code/verify' && method === 'POST') {
            return { valid: body.code === '1234', message: 'Access granted.' };
        }

        if (path === '/api/health' && method === 'GET') {
            return { message: 'OK' };
        }

        if (path === '/api/admin/groups' && method === 'GET') {
            var users = getLocalUsers();
            var groups = [];
            for (var ui13 = 0; ui13 < users.length; ui13++) { if (users[ui13].group && groups.indexOf(users[ui13].group) === -1) groups.push(users[ui13].group); }
            return groups;
        }

        // Access codes list/create/delete
        if (path === '/api/access-codes' && method === 'GET') return [];
        if (path === '/api/access-codes' && method === 'POST') return { id: 1, code: body.code, label: body.label || '', isActive: true, maxUses: body.maxUses || 0, useCount: 0, createdAt: new Date().toISOString() };
        var acDelMatch = path.match(/^\/api\/access-codes\/(\d+)$/);
        if (acDelMatch && method === 'DELETE') return { message: 'Deleted.' };

        // === TEAM MEMBERS ===
        if (path === '/api/team-members' && method === 'GET') {
            var team = getLocalTeamMembers();
            var activeTeam = [];
            for (var ti = 0; ti < team.length; ti++) {
                if (team[ti].isActive !== false) activeTeam.push(team[ti]);
            }
            activeTeam.sort(function(a, b) { return (a.displayOrder || 0) - (b.displayOrder || 0); });
            return activeTeam;
        }

        if (path === '/api/team-members/all' && method === 'GET') {
            var team = getLocalTeamMembers();
            return team;
        }

        if (path === '/api/team-members' && method === 'POST') {
            var team = getLocalTeamMembers();
            var maxTeamId = 0;
            for (var ti2 = 0; ti2 < team.length; ti2++) { if (team[ti2].id > maxTeamId) maxTeamId = team[ti2].id; }
            var newMember = {
                id: maxTeamId + 1,
                name: (body.name || '').trim(),
                position: (body.position || '').trim(),
                role: body.role || 'EMPLOYEE',
                description: (body.description || '').trim(),
                avatarIcon: body.avatarIcon || '&#128100;',
                roleClass: body.roleClass || 'role-placeholder',
                displayOrder: parseInt(body.displayOrder) || 0,
                isActive: true
            };
            team.push(newMember);
            saveLocalTeamMembers(team);
            return newMember;
        }

        var teamPutMatch = path.match(/^\/api\/team-members\/(\d+)$/);
        if (teamPutMatch && method === 'PUT') {
            var team = getLocalTeamMembers();
            var teamId = parseInt(teamPutMatch[1]);
            for (var ti3 = 0; ti3 < team.length; ti3++) {
                if (team[ti3].id === teamId) {
                    if (body.name !== undefined) team[ti3].name = (body.name || '').trim();
                    if (body.position !== undefined) team[ti3].position = (body.position || '').trim();
                    if (body.role !== undefined) team[ti3].role = body.role;
                    if (body.description !== undefined) team[ti3].description = (body.description || '').trim();
                    if (body.avatarIcon !== undefined) team[ti3].avatarIcon = body.avatarIcon;
                    if (body.roleClass !== undefined) team[ti3].roleClass = body.roleClass;
                    if (body.displayOrder !== undefined) team[ti3].displayOrder = parseInt(body.displayOrder) || 0;
                    if (body.isActive !== undefined) team[ti3].isActive = body.isActive;
                    saveLocalTeamMembers(team);
                    return team[ti3];
                }
            }
            throw new Error('Team member not found.');
        }

        var teamDelMatch = path.match(/^\/api\/team-members\/(\d+)$/);
        if (teamDelMatch && method === 'DELETE') {
            var team = getLocalTeamMembers();
            var delTeamId = parseInt(teamDelMatch[1]);
            var newTeam = [];
            for (var ti4 = 0; ti4 < team.length; ti4++) { if (team[ti4].id !== delTeamId) newTeam.push(team[ti4]); }
            saveLocalTeamMembers(newTeam);
            return { message: 'Team member deleted.' };
        }

        // === SITE CONTENT ===
        if (path === '/api/site-content' && method === 'GET') {
            return getSiteContent();
        }
        if (path === '/api/site-content' && method === 'PUT') {
            var sc = getSiteContent();
            if (body.hero !== undefined) sc.hero = body.hero;
            if (body.quickFacts !== undefined) sc.quickFacts = body.quickFacts;
            if (body.announcements !== undefined) sc.announcements = body.announcements;
            if (body.about !== undefined) sc.about = body.about;
            if (body.services !== undefined) sc.services = body.services;
            if (body.contact !== undefined) sc.contact = body.contact;
            if (body.footer !== undefined) sc.footer = body.footer;
            saveSiteContent(sc);
            return sc;
        }

        // === GROUP CHAT ===
        if (path === '/api/group-chats' && method === 'GET') {
            var groups = getLocalGroupChats();
            return groups;
        }
        if (path === '/api/group-chats' && method === 'POST') {
            var groups = getLocalGroupChats();
            var maxGid = 0;
            for (var gi = 0; gi < groups.length; gi++) { if (groups[gi].id > maxGid) maxGid = groups[gi].id; }
            var newGroup = {
                id: maxGid + 1,
                name: (body.name || '').trim(),
                createdById: currentUser.id,
                createdByName: currentUser.name,
                members: [currentUser.id],
                createdAt: new Date().toISOString()
            };
            groups.push(newGroup);
            saveLocalGroupChats(groups);
            return newGroup;
        }
        var groupMsgsMatch = path.match(/^\/api\/group-chats\/(\d+)\/messages$/);
        if (groupMsgsMatch && method === 'GET') {
            var groupId = parseInt(groupMsgsMatch[1]);
            var groups = getLocalGroupChats();
            for (var gi2 = 0; gi2 < groups.length; gi2++) {
                if (groups[gi2].id === groupId) {
                    return groups[gi2].messages || [];
                }
            }
            throw new Error('Group not found.');
        }
        if (groupMsgsMatch && method === 'POST') {
            var groupId = parseInt(groupMsgsMatch[1]);
            var groups = getLocalGroupChats();
            for (var gi3 = 0; gi3 < groups.length; gi3++) {
                if (groups[gi3].id === groupId) {
                    if (!groups[gi3].messages) groups[gi3].messages = [];
                    var msgsG = groups[gi3].messages;
                    var maxGMsgId = 0;
                    for (var gmi = 0; gmi < msgsG.length; gmi++) { if (msgsG[gmi].id > maxGMsgId) maxGMsgId = msgsG[gmi].id; }
                    var gmsg = { id: maxGMsgId + 1, senderId: currentUser.id, senderName: currentUser.name, senderRole: currentUser.role, content: (body.content || '').trim(), createdAt: new Date().toISOString() };
                    msgsG.push(gmsg);
                    saveLocalGroupChats(groups);
                    return gmsg;
                }
            }
            throw new Error('Group not found.');
        }
        var groupAddMemberMatch = path.match(/^\/api\/group-chats\/(\d+)\/members$/);
        if (groupAddMemberMatch && method === 'POST') {
            var groupId = parseInt(groupAddMemberMatch[1]);
            var groups = getLocalGroupChats();
            for (var gi4 = 0; gi4 < groups.length; gi4++) {
                if (groups[gi4].id === groupId) {
                    if (!groups[gi4].members) groups[gi4].members = [];
                    if (groups[gi4].members.indexOf(parseInt(body.userId)) === -1) {
                        groups[gi4].members.push(parseInt(body.userId));
                    }
                    saveLocalGroupChats(groups);
                    return groups[gi4];
                }
            }
            throw new Error('Group not found.');
        }

        throw new Error('API endpoint not available offline: ' + method + ' ' + path);
    }
