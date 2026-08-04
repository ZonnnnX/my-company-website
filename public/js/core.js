    // === DOM refs ===
    var gate = document.getElementById('gate');
    var content = document.getElementById('content');
    var logoutBtn = document.getElementById('lock');
    var userInfoBar = document.getElementById('user-info-bar');
    var userInfoText = document.getElementById('user-info-text');
    var loginEmail = document.getElementById('login-email');
    var loginPassword = document.getElementById('login-password');
    var loginBtn = document.getElementById('login-btn');
    var loginError = document.getElementById('login-error');
    var regName = document.getElementById('reg-name');
    var regEmail = document.getElementById('reg-email');
    var regPassword = document.getElementById('reg-password');
    var regInvite = document.getElementById('reg-invite');
    var registerBtn = document.getElementById('register-btn');
    var registerError = document.getElementById('register-error');
    var registerSuccess = document.getElementById('register-success');
    var checkStatusBtn = document.getElementById('check-status-btn');
    var adminUsersList = document.getElementById('admin-users-list');
    var adminLogoutBtn = document.getElementById('admin-logout-btn');

    // === Helpers ===
    function getToken() { return localStorage.getItem(TOKEN_KEY); }
    function getUser() {
      try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch(e) { return null; }
    }
    function setAuth(token, user) {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
    function clearAuth() {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
    function showError(el, msg) { if (el) el.textContent = msg; }
    function clearErrors() {
      showError(loginError, '');
      showError(registerError, '');
      showError(registerSuccess, '');
    }

    // === Tab Switching ===
    function switchTab(tab) {
      clearErrors();
      document.querySelectorAll('.tab').forEach(function(t) { t.classList.remove('active'); });
      document.querySelectorAll('.auth-form').forEach(function(f) { f.classList.remove('active'); });
      var tabEl = document.querySelector('.tab[data-tab="' + tab + '"]');
      if (tabEl) tabEl.classList.add('active');
      var formEl = document.getElementById('form-' + tab);
      if (formEl) formEl.classList.add('active');
    }

// === API Calls (Hybrid mode: try real backend first, fallback to localStorage) ===
    var API_BASE = '';
    var API_OFFLINE = false;
    var API_TIMEOUT = 8000;

    // Determine backend base URL from current host if page is served by backend
    function detectApiBase() {
      var proto = window.location.protocol;
      var host = window.location.host;
      // If already served from the backend (port 5000), use same origin
      if (host && (host.indexOf(':5000') !== -1)) {
        return '';
      }
      // Otherwise point to localhost:5000
      return 'http://localhost:5000';
    }
    API_BASE = detectApiBase();

    async function api(path, options) {
      options = options || {};
      var method = (options.method || 'GET').toUpperCase();
      var headers = options.headers || {};
      var token = getToken();
      if (token) headers['Authorization'] = 'Bearer ' + token;
      if (options.body) headers['Content-Type'] = 'application/json';

      // Try real backend first (unless we've determined we're offline)
      if (!API_OFFLINE) {
        try {
          var controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
          var timer = null;
          if (controller) {
            timer = setTimeout(function() { controller.abort(); }, API_TIMEOUT);
          }
          var resp = await fetch(API_BASE + path, {
            method: method,
            headers: headers,
            body: options.body || undefined,
            credentials: 'include',
            signal: controller ? controller.signal : undefined
          });
          if (timer) clearTimeout(timer);
          var data = null;
          try { data = await resp.json(); } catch(e) { data = null; }
          if (resp.status >= 200 && resp.status < 300) {
            return data;
          }
          // Backend responded with an error - throw so caller can handle
          var err = new Error((data && data.message) ? data.message : ('Request failed (' + resp.status + ')'));
          err.status = resp.status;
          err.data = data;
          throw err;
        } catch (fetchErr) {
          // Abort / network failure => fall back to localStorage offline mode
          if (fetchErr && (fetchErr.name === 'AbortError' || fetchErr.status || (fetchErr.data))) {
            // Server reachable but error/abort: still try offline fallback for read-only where sensible,
            // but for auth/admin operations we should surface the real error.
            if (fetchErr.status) {
              throw fetchErr;
            }
          }
          // Network error => offline mode
          API_OFFLINE = true;
          // fall through to localStorage
        }
      }

      // Offline fallback using localStorage
      return await localStorageApi(path, options);
    }

    // Reset offline flag periodically (e.g., when server comes back)
    function resetApiOfflineFlag() {
      API_OFFLINE = false;
    }

    // === Login ===
    async function handleLogin() {
      clearErrors();
      var email = loginEmail.value.trim();
      var password = loginPassword.value;
      if (!email || !password) {
        showError(loginError, 'Please enter your email and password.');
        return;
      }
      loginBtn.disabled = true;
      loginBtn.innerHTML = '<span class="spinner"></span> Signing in...';
      try {
        var data = await api('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email: email, password: password })
        });
        setAuth(data.token, data.user);
        showError(loginError, '');
        checkAuthState();
      } catch (err) {
        showError(loginError, err.message);
      } finally {
        loginBtn.disabled = false;
        loginBtn.innerHTML = '<span class="dot"></span> Sign In';
      }
    }

    // === Register ===
    async function handleRegister() {
      clearErrors();
      var name = regName.value.trim();
      var email = regEmail.value.trim();
      var password = regPassword.value;
      if (!name || !email || !password) {
        showError(registerError, 'All fields are required.');
        return;
      }
      if (password.length < 6) {
        showError(registerError, 'Password must be at least 6 characters.');
        return;
      }
      registerBtn.disabled = true;
      registerBtn.innerHTML = '<span class="spinner"></span> Registering...';
      try {
        var data = await api('/api/auth/register', {
          method: 'POST',
          body: JSON.stringify({
            name: name,
            email: email,
            password: password,
            inviteCode: regInvite ? regInvite.value.trim() : ''
          })
        });
        showError(registerError, '');
        showError(registerSuccess, data.message);
        regName.value = '';
        regEmail.value = '';
        regPassword.value = '';
        if (regInvite) regInvite.value = '';
        setTimeout(function() {
          switchTab('login');
          loginEmail.value = email;
          showError(registerSuccess, '');
        }, 2000);
      } catch (err) {
        showError(registerError, err.message);
      } finally {
        registerBtn.disabled = false;
        registerBtn.innerHTML = '<span class="dot"></span> Register';
      }
    }

    // === Admin: Update User Status ===
    async function handleAdminAction(userId, status) {
      try {
        await api('/api/admin/users/' + userId + '/status', {
          method: 'PATCH',
          body: JSON.stringify({ status: status })
        });
        loadAdminUsers();
      } catch (err) {
        alert('Error: ' + err.message);
      }
    }

    // === Admin: Update User Role ===
    async function handleRoleChange(userId, role) {
      try {
        await api('/api/admin/users/' + userId + '/role', {
          method: 'PATCH',
          body: JSON.stringify({ role: role })
        });
        loadAdminUsers();
      } catch (err) {
        alert('Error updating role: ' + err.message);
        loadAdminUsers();
      }
    }

    // === Admin: Create User Account ===
    function openCreateUserModal() {
      var overlay = document.getElementById('create-user-overlay');
      if (!overlay) return;
      overlay.classList.add('active');
      document.getElementById('newuser-name').value = '';
      document.getElementById('newuser-email').value = '';
      document.getElementById('newuser-password').value = '';
      document.getElementById('newuser-status').value = 'APPROVED';
      var msg = document.getElementById('newuser-msg');
      if (msg) { msg.textContent = ''; msg.style.color = ''; }
      // Populate role select with all roles (default + group + custom)
      var roleSel = document.getElementById('newuser-role');
      var allRoles = getAllRoles();
      var html = '';
      for (var i = 0; i < allRoles.length; i++) {
        var roleVal = allRoles[i];
        // Custom roles are objects {name, createdAt}
        if (typeof roleVal === 'object' && roleVal.name) roleVal = roleVal.name;
        var roleLabel = isGroupRole(roleVal) ? (getGroupRoleName(roleVal) + ' (' + roleVal + ')') : roleVal;
        html += '<option value="' + roleVal + '"' + (roleVal === 'EMPLOYEE' ? ' selected' : '') + '>' + roleLabel + '</option>';
      }
      roleSel.innerHTML = html;
      document.getElementById('newuser-group').value = 'General';
    }

    function closeCreateUserModal() {
      var overlay = document.getElementById('create-user-overlay');
      if (overlay) overlay.classList.remove('active');
    }

    async function createUserAccount() {
      var name = document.getElementById('newuser-name').value.trim();
      var email = document.getElementById('newuser-email').value.trim();
      var password = document.getElementById('newuser-password').value;
      var role = document.getElementById('newuser-role').value;
      var group = document.getElementById('newuser-group').value;
      var status = document.getElementById('newuser-status').value;
      var msg = document.getElementById('newuser-msg');
      if (!msg) return;
      msg.textContent = '';
      msg.style.color = '';
      if (!name) { msg.textContent = 'Vui lòng nhập tên.'; msg.style.color = 'var(--danger)'; return; }
      if (!email) { msg.textContent = 'Vui lòng nhập email.'; msg.style.color = 'var(--danger)'; return; }
      if (!password || password.length < 6) { msg.textContent = 'Mật khẩu phải có ít nhất 6 ký tự.'; msg.style.color = 'var(--danger)'; return; }
      var btn = event.target;
      if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> Đang tạo...'; }
      try {
        await api('/api/admin/users', {
          method: 'POST',
          body: JSON.stringify({ name: name, email: email, password: password, role: role, group: group, status: status })
        });
        msg.textContent = 'Đã tạo tài khoản "' + name + '" thành công!';
        msg.style.color = 'var(--accent2)';
        setTimeout(closeCreateUserModal, 1200);
        loadAdminUsers();
      } catch (err) {
        msg.textContent = 'Lỗi: ' + err.message;
        msg.style.color = 'var(--danger)';
      } finally {
        if (btn) { btn.disabled = false; btn.innerHTML = '&#10003; Tạo tài khoản'; }
      }
    }

    // === Admin: Load Users ===
    async function loadAdminUsers() {
      if (!adminUsersList) return;
      adminUsersList.innerHTML = '<div style="text-align:center;padding:20px;color:var(--muted)"><span class="spinner"></span> Loading users...</div>';
      try {
        var users = await api('/api/admin/users');
        if (!users || users.length === 0) {
          adminUsersList.innerHTML = '<div style="text-align:center;padding:20px;color:var(--muted)">No users registered yet.</div>';
          return;
        }
        var html = '<table><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Nhóm</th><th>Status</th><th>Actions</th></tr></thead><tbody>';
        // Build full role list: default roles + group roles + custom roles
        var roleOptions = [];
        var allRoles = getAllRoles();
        for (var ri = 0; ri < allRoles.length; ri++) {
          roleOptions.push(allRoles[ri]);
        }
        for (var i = 0; i < users.length; i++) {
          var u = users[i];
          var statusClass = 'status-' + u.status.toLowerCase();
          var groupName = u.group || 'General';
          html += '<tr>';
          html += '<td>' + u.name + '</td>';
          html += '<td>' + u.email + '</td>';
html += '<td><select class="admin-select" onchange="handleRoleChange(' + u.id + ',this.value)" style="padding:4px 8px;font-size:12px">';
          for (var r = 0; r < roleOptions.length; r++) {
            var roleVal = roleOptions[r];
            var roleLabel = isGroupRole(roleVal) ? (getGroupRoleName(roleVal) + ' (' + roleVal + ')') : roleVal;
            html += '<option value="' + roleVal + '"' + (u.role === roleVal ? ' selected' : '') + '>' + roleLabel + '</option>';
          }
          html += '</select></td>';
          html += '<td>' + groupName + '</td>';
          html += '<td class="' + statusClass + '">' + u.status + '</td>';
          html += '<td class="admin-actions">';
          if (u.status === 'PENDING') {
            html += '<button class="btn success" onclick="handleAdminAction(' + u.id + ',\'APPROVED\')" style="padding:6px 12px;font-size:12px">Approve</button>';
            html += '<button class="btn danger" onclick="handleAdminAction(' + u.id + ',\'REJECTED\')" style="padding:6px 12px;font-size:12px">Reject</button>';
          } else {
            html += '<span style="color:var(--muted);font-size:12px">—</span>';
          }
          html += '</td>';
          html += '</tr>';
        }
        html += '</tbody></table>';
        adminUsersList.innerHTML = html;
      } catch (err) {
        adminUsersList.innerHTML = '<div style="text-align:center;padding:20px;color:var(--danger)">Error loading users: ' + err.message + '</div>';
      }
    }

    // === Admin: Switch Admin Tabs ===
    function switchAdminTab(tab) {
      document.querySelectorAll('.admin-tabs .tab').forEach(function(t) { t.classList.remove('active'); });
      document.querySelectorAll('.admin-tab-content').forEach(function(c) { c.style.display = 'none'; });
      var tabEl = document.querySelector('.admin-tabs .tab[data-admintab="' + tab + '"]');
      if (tabEl) tabEl.classList.add('active');
      var contentEl = document.getElementById('admin-tab-' + tab);
      if (contentEl) contentEl.style.display = 'block';
      if (tab === 'roles') renderAdminRolesList();
      if (tab === 'docs') { renderAdminDocRoles(); renderAdminDocList(); }
      if (tab === 'invites') { populateInviteSelects(); renderAdminInvitesList(); }
if (tab === 'content') loadSiteContentFromAdmin();
      if (tab === 'broadcast') { renderBroadcastRoles(); renderBroadcastHistory(); }
    }

    // === Admin: Custom Roles Tab ===
    async function renderAdminRolesList() {
      var container = document.getElementById('admin-roles-list');
      if (!container) return;
      try {
        var roles = await api('/api/admin/custom-roles');
        if (!roles || roles.length === 0) {
          container.innerHTML = '<div style="text-align:center;padding:14px;color:var(--muted);font-size:13px">Chưa có role tùy chỉnh nào.</div>';
          return;
        }
        var html = '<table><thead><tr><th>Role</th><th>Ngày tạo</th><th></th></tr></thead><tbody>';
        for (var i = 0; i < roles.length; i++) {
          var r = roles[i];
          html += '<tr><td style="font-weight:600">' + r.name + '</td><td style="color:var(--muted);font-size:12px">' + (r.createdAt ? new Date(r.createdAt).toLocaleString() : '—') + '</td>';
          html += '<td style="text-align:right"><button class="btn danger" onclick="deleteCustomRole(\'' + r.name + '\')" style="padding:4px 10px;font-size:12px">Xóa</button></td></tr>';
        }
        html += '</tbody></table>';
        container.innerHTML = html;
      } catch (e) {
        container.innerHTML = '<div style="color:var(--danger);font-size:13px">Lỗi tải role: ' + e.message + '</div>';
      }
    }

    async function deleteCustomRole(name) {
      if (!confirm('Xóa role "' + name + '"?')) return;
      try {
        await api('/api/admin/custom-roles/' + encodeURIComponent(name), { method: 'DELETE' });
        document.getElementById('role-error').textContent = '';
        document.getElementById('role-success').textContent = 'Đã xóa role ' + name + '.';
        renderAdminRolesList();
      } catch (e) {
        document.getElementById('role-error').textContent = e.message;
      }
    }

    async function addCustomRole() {
      var nameInput = document.getElementById('new-role-name');
      var name = nameInput.value.trim();
      var errEl = document.getElementById('role-error');
      var sucEl = document.getElementById('role-success');
      if (!errEl || !sucEl) return;
      errEl.textContent = '';
      sucEl.textContent = '';
      if (!name) { errEl.textContent = 'Vui lòng nhập tên role.'; return; }
      try {
        await api('/api/admin/custom-roles', { method: 'POST', body: JSON.stringify({ name: name }) });
        nameInput.value = '';
        sucEl.textContent = 'Đã thêm role ' + name.toUpperCase() + '.';
        renderAdminRolesList();
      } catch (e) {
        errEl.textContent = e.message;
      }
    }

    // === Admin: Docs Tab ===
    function renderAdminDocRoles() {
      var container = document.getElementById('admin-doc-roles-container');
      if (!container) return;
      var allRoles = getAllRoles();
      var html = '';
      for (var i = 0; i < allRoles.length; i++) {
        var role = allRoles[i];
        var label = isGroupRole(role) ? getGroupRoleName(role) + ' (' + role + ')' : role;
        var checked = (role === 'ADMIN' || role === 'DIRECTOR' || role === 'IT' || role === 'ACCOUNTING') ? ' checked' : '';
        html += '<label style="display:flex;align-items:center;gap:4px;font-size:12px;color:var(--text);cursor:pointer"><input type="checkbox" class="admin-doc-role-cb" value="' + role + '"' + checked + '> ' + label + '</label>';
      }
      container.innerHTML = html;
    }

    function getAdminDocRoles() {
      var cbs = document.querySelectorAll('.admin-doc-role-cb');
      var roles = [];
      for (var i = 0; i < cbs.length; i++) {
        if (cbs[i].checked) roles.push(cbs[i].value);
      }
      return roles;
    }

    function renderAdminDocList() {
      var container = document.getElementById('admin-doc-list');
      if (!container) return;
      var items = getDocItems();
      if (items.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:14px;color:var(--muted);font-size:13px">Chưa có mục nào.</div>';
        return;
      }
      var html = '';
      for (var i = 0; i < items.length; i++) {
        var it = items[i];
        var rolesStr = (it.visibleRoles && it.visibleRoles.length > 0) ? it.visibleRoles.join(', ') : 'Tất cả';
        html += '<div class="doc-item-row"><div class="item-info">' +
                '<div class="item-name">' + it.name + '</div>' +
                '<div class="item-group">' + (it.category || 'Group') + ' | Vai trò: ' + rolesStr + '</div>' +
                '<div class="item-link">' + it.link + '</div></div>' +
                '<div class="item-actions">' +
                '<button class="edit-btn" onclick="editAdminDocItem(\'' + it.id + '\')">&#9998;</button>' +
                '<button class="del-btn" onclick="deleteAdminDocItem(\'' + it.id + '\')">&#10005;</button>' +
                '</div></div>';
      }
      container.innerHTML = html;
    }

    function editAdminDocItem(id) {
      var items = getDocItems();
      var item = null;
      for (var i = 0; i < items.length; i++) { if (items[i].id === id) { item = items[i]; break; } }
      if (!item) return;
      document.getElementById('admin-doc-name').value = item.name;
      document.getElementById('admin-doc-link').value = item.link;
      document.getElementById('admin-doc-category').value = item.category || 'Group';
      var cbs = document.querySelectorAll('.admin-doc-role-cb');
      var selected = item.visibleRoles || [];
      for (var j = 0; j < cbs.length; j++) {
        cbs[j].checked = selected.indexOf(cbs[j].value) !== -1;
      }
      var msg = document.getElementById('admin-doc-msg');
      msg.textContent = 'Đang sửa: ' + item.name + '. Nhấn "Cập nhật" để lưu.';
      msg.style.color = 'var(--accent)';
      var addBtn = document.getElementById('admin-doc-add-btn');
      addBtn.innerHTML = '&#10003; Cập nhật';
      addBtn.onclick = function() { updateAdminDocItem(id); };
    }

    function updateAdminDocItem(id) {
      var name = document.getElementById('admin-doc-name').value.trim();
      var link = document.getElementById('admin-doc-link').value.trim();
      var category = document.getElementById('admin-doc-category').value;
      var roles = getAdminDocRoles();
      var msg = document.getElementById('admin-doc-msg');
      if (!name || !link) { msg.textContent = 'Vui lòng nhập tên và link.'; msg.style.color = 'var(--danger)'; return; }
      if (roles.length === 0) { msg.textContent = 'Chọn ít nhất một vai trò.'; msg.style.color = 'var(--danger)'; return; }
      var items = getDocItems();
      for (var i = 0; i < items.length; i++) {
        if (items[i].id === id) {
          items[i].name = name; items[i].link = link; items[i].category = category; items[i].visibleRoles = roles;
          break;
        }
      }
      saveDocItems(items);
      resetAdminDocForm();
      msg.textContent = 'Đã cập nhật!'; msg.style.color = 'var(--accent2)';
      renderAdminDocList();
      buildDropdownMenu();
    }

    function deleteAdminDocItem(id) {
      if (!confirm('Xóa mục tài liệu này?')) return;
      var items = getDocItems();
      items = items.filter(function(it) { return it.id !== id; });
      saveDocItems(items);
      renderAdminDocList();
      buildDropdownMenu();
    }

    function resetAdminDocForm() {
      document.getElementById('admin-doc-name').value = '';
      document.getElementById('admin-doc-link').value = '';
      document.getElementById('admin-doc-category').value = 'Group';
      var cbs = document.querySelectorAll('.admin-doc-role-cb');
      for (var i = 0; i < cbs.length; i++) {
        var v = cbs[i].value;
        cbs[i].checked = (v === 'ADMIN' || v === 'DIRECTOR' || v === 'IT' || v === 'ACCOUNTING');
      }
      var msg = document.getElementById('admin-doc-msg');
      msg.textContent = '';
      var addBtn = document.getElementById('admin-doc-add-btn');
      addBtn.innerHTML = '+ Thêm mục';
      addBtn.onclick = addAdminDocItem;
    }

    function addAdminDocItem() {
      var name = document.getElementById('admin-doc-name').value.trim();
      var link = document.getElementById('admin-doc-link').value.trim();
      var category = document.getElementById('admin-doc-category').value;
      var roles = getAdminDocRoles();
      var msg = document.getElementById('admin-doc-msg');
      if (!name || !link) { msg.textContent = 'Vui lòng nhập tên và link.'; msg.style.color = 'var(--danger)'; return; }
      if (roles.length === 0) { msg.textContent = 'Chọn ít nhất một vai trò.'; msg.style.color = 'var(--danger)'; return; }
      var items = getDocItems();
      items.push({ id: 'd' + Date.now(), name: name, link: link, category: category, visibleRoles: roles });
      saveDocItems(items);
      resetAdminDocForm();
      msg.textContent = 'Đã thêm mục thành công!'; msg.style.color = 'var(--accent2)';
      renderAdminDocList();
      buildDropdownMenu();
    }

    // === Admin: Invites Tab ===
    function populateInviteSelects() {
      var roleSel = document.getElementById('invite-role');
      if (!roleSel) return;
      var allRoles = getAllRoles();
      var html = '';
      for (var i = 0; i < allRoles.length; i++) {
        var role = allRoles[i];
        var label = isGroupRole(role) ? getGroupRoleName(role) + ' (' + role + ')' : role;
        html += '<option value="' + role + '">' + label + '</option>';
      }
      roleSel.innerHTML = html;
    }

    async function renderAdminInvitesList() {
      var container = document.getElementById('admin-invites-list');
      if (!container) return;
      try {
        var invites = await api('/api/admin/invites');
        if (!invites || invites.length === 0) {
          container.innerHTML = '<div style="text-align:center;padding:14px;color:var(--muted);font-size:13px">Chưa có mã mời nào.</div>';
          return;
        }
        var html = '<table><thead><tr><th>Code</th><th>Email</th><th>Role</th><th>Nhóm</th><th>Trạng thái</th><th></th></tr></thead><tbody>';
        for (var i = 0; i < invites.length; i++) {
          var inv = invites[i];
          var used = !!inv.usedBy;
          var status = used ? 'Đã dùng' : 'Còn hiệu lực';
          var statusColor = used ? 'var(--muted)' : 'var(--accent2)';
          html += '<tr><td style="font-weight:600">' + inv.code + '</td>';
          html += '<td>' + (inv.email || '—') + '</td>';
          html += '<td>' + inv.role + '</td>';
          html += '<td>' + inv.group + '</td>';
          html += '<td style="color:' + statusColor + '">' + status + '</td>';
          html += '<td style="text-align:right"><button class="btn danger" onclick="deleteInvite(' + inv.id + ')" style="padding:4px 10px;font-size:12px">Xóa</button></td></tr>';
        }
        html += '</tbody></table>';
        container.innerHTML = html;
      } catch (e) {
        container.innerHTML = '<div style="color:var(--danger);font-size:13px">Lỗi: ' + e.message + '</div>';
      }
    }

    async function deleteInvite(id) {
      if (!confirm('Xóa mã mời này?')) return;
      try {
        await api('/api/admin/invites/' + id, { method: 'DELETE' });
        document.getElementById('invite-error').textContent = '';
        renderAdminInvitesList();
      } catch (e) {
        document.getElementById('invite-error').textContent = e.message;
      }
    }

    async function createInviteLink() {
      var email = document.getElementById('invite-email').value.trim();
      var role = document.getElementById('invite-role').value;
      var group = document.getElementById('invite-group').value;
      var errEl = document.getElementById('invite-error');
      var resultEl = document.getElementById('invite-result');
      if (!errEl || !resultEl) return;
      errEl.textContent = '';
      try {
        var invite = await api('/api/admin/invites', {
          method: 'POST',
          body: JSON.stringify({ email: email || null, role: role, group: group })
        });
        var link = window.location.origin + window.location.pathname + '#invite=' + invite.code;
        resultEl.innerHTML = '<div style="padding:12px;border:1px solid var(--border);border-radius:12px;background:rgba(124,240,193,.06);font-size:13px">' +
          '<div style="font-weight:600;color:var(--accent2);margin-bottom:6px">Mã mời đã tạo:</div>' +
          '<div style="font-weight:700;margin-bottom:6px">' + invite.code + '</div>' +
          '<div style="font-size:11px;color:var(--muted);margin-bottom:6px">Người dùng nhập mã này tại ô "Mã mời" khi đăng ký.</div>' +
          '<div style="font-size:12px;word-break:break-all;color:var(--accent);margin-bottom:8px">' + link + '</div>' +
          '<button class="btn" onclick="copyInviteLink(\'' + link + '\')" style="padding:6px 14px;font-size:12px">Sao chép link</button>' +
          '</div>';
        document.getElementById('invite-email').value = '';
        renderAdminInvitesList();
      } catch (e) {
        errEl.textContent = e.message;
      }
    }

    function copyInviteLink(link) {
      var ta = document.createElement('textarea');
      ta.value = link;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch(e) {}
      document.body.removeChild(ta);
      var resultEl = document.getElementById('invite-result');
      if (resultEl) {
        var notice = document.createElement('div');
        notice.style.cssText = 'color:var(--accent2);font-size:12px;margin-top:4px';
        notice.textContent = 'Đã sao chép link!';
        resultEl.appendChild(notice);
      }
    }
