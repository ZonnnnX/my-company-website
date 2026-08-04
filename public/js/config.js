    // === Configuration (Static Website — all data stored in localStorage) ===
    // No backend server needed! Everything works in the browser.
    var TOKEN_KEY = "private_access_token";
    var USER_KEY = "private_access_user";

    // === LOCAL STORAGE BACKEND (offline mode - no server needed) ===
    var LOCAL_USERS_KEY = '_pvt_users_data';
    var LOCAL_MSG_KEY = '_pvt_chat_data';
    var LOCAL_PVT_MSG_KEY = '_pvt_pvt_msg_data';
    var LOCAL_REPORTS_KEY = '_pvt_reports_data';
var LOCAL_CUSTOM_ROLES_KEY = '_pvt_custom_roles';
    var LOCAL_INVITES_KEY = '_pvt_invites';
    var LOCAL_BROADCAST_KEY = '_pvt_broadcasts';

    // Default system roles + group roles (RBAC)
    var DEFAULT_ROLES = ['ADMIN','DIRECTOR','LEADER','IT','ACCOUNTING','IMPLEMENTATION','EMPLOYEE'];
    var GROUP_ROLES = ['GROUP1','GROUP2','GROUP3','FUND1'];

    // Full-access roles for Document Repository
    var FULL_ACCESS_ROLES = ['ADMIN','DIRECTOR','ACCOUNTING','IT','LEADER'];

    // Roles that can create/manage group chats
    var GROUP_MANAGER_ROLES = ['ADMIN','IT','DIRECTOR'];

    function getCustomRoles() {
      try { return JSON.parse(localStorage.getItem(LOCAL_CUSTOM_ROLES_KEY)) || []; } catch(e) { return []; }
    }
    function saveCustomRoles(roles) {
      localStorage.setItem(LOCAL_CUSTOM_ROLES_KEY, JSON.stringify(roles));
    }
    function getAllRoles() {
      return DEFAULT_ROLES.concat(GROUP_ROLES).concat(getCustomRoles());
    }
    function getGroupRoleName(role) {
      var map = {
        'GROUP1':'Thực thi nhóm 1',
        'GROUP2':'Thực thi nhóm 2',
        'GROUP3':'Thực thi nhóm 3',
        'FUND1':'Quỹ chứng 1'
      };
      return map[role] || role;
    }
    function isGroupRole(role) {
      return GROUP_ROLES.indexOf(role) !== -1;
    }
    function getRoleGroup(user) {
      if (!user) return null;
      if (user.role === 'GROUP1') return 'GROUP1';
      if (user.role === 'GROUP2') return 'GROUP2';
      if (user.role === 'GROUP3') return 'GROUP3';
      if (user.role === 'FUND1') return 'FUND1';
      return null;
    }
    function getLocalInvites() {
      try { return JSON.parse(localStorage.getItem(LOCAL_INVITES_KEY)) || []; } catch(e) { return []; }
    }
    function saveLocalInvites(invites) {
      localStorage.setItem(LOCAL_INVITES_KEY, JSON.stringify(invites));
    }

    function getLocalUsers() {
        try { return JSON.parse(localStorage.getItem(LOCAL_USERS_KEY)) || []; } catch(e) { return []; }
    }
    function saveLocalUsers(users) {
        localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
    }
    function getLocalMsgs() {
        try { return JSON.parse(localStorage.getItem(LOCAL_MSG_KEY)) || []; } catch(e) { return []; }
    }
    function saveLocalMsgs(msgs) {
        localStorage.setItem(LOCAL_MSG_KEY, JSON.stringify(msgs));
    }
    function getLocalPvtMsgs() {
        try { return JSON.parse(localStorage.getItem(LOCAL_PVT_MSG_KEY)) || []; } catch(e) { return []; }
    }
    function saveLocalPvtMsgs(msgs) {
        localStorage.setItem(LOCAL_PVT_MSG_KEY, JSON.stringify(msgs));
    }
    function getLocalReports() {
        try { return JSON.parse(localStorage.getItem(LOCAL_REPORTS_KEY)) || []; } catch(e) { return []; }
    }
    function saveLocalReports(reports) {
        localStorage.setItem(LOCAL_REPORTS_KEY, JSON.stringify(reports));
    }
    function getLocalBroadcasts() {
        try { return JSON.parse(localStorage.getItem(LOCAL_BROADCAST_KEY)) || []; } catch(e) { return []; }
    }
    function saveLocalBroadcasts(broadcasts) {
        localStorage.setItem(LOCAL_BROADCAST_KEY, JSON.stringify(broadcasts));
    }

    // Seed default admin on first run
    (function() {
        if (!localStorage.getItem('_pvt_seeded')) {
            var users = [{
                id: 1,
                name: 'Admin',
                email: 'Thangtan480@gmail.com',
                password: 'Sliverseven0',
                role: 'ADMIN',
                status: 'APPROVED',
                group: 'General',
                permissions: '{}',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }];
            saveLocalUsers(users);
            localStorage.setItem('_pvt_seeded', 'true');
        }
    })();

    // Process API calls using localStorage (offline fallback)