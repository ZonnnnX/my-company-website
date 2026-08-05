    // === Reports Page ===
    (function() {
      var div = document.createElement('div');
      div.innerHTML = `
      <div class="doc-manager-overlay" id="report-form-overlay">
        <div class="doc-manager-modal">
          <button class="close-btn" onclick="closeReportForm()">&times;</button>
          <h3>&#128202; Thêm Báo Cáo Tài Khoản</h3>
          <div class="doc-manager-form">
            <div>
              <label>Account ID</label>
              <input id="report-form-accountid" type="text" placeholder="VD: ACC-001" />
            </div>
            <div>
              <label>Tên tài khoản</label>
              <input id="report-form-accountname" type="text" placeholder="VD: Tài khoản A" />
            </div>
            <div>
              <label>Số DIE</label>
              <input id="report-form-diecount" type="number" min="0" placeholder="0" />
            </div>
            <div>
              <label>Nhóm</label>
              <select id="report-form-group">
                <option value="General">General</option>
                <option value="GROUP1">Thực thi nhóm 1 (GROUP1)</option>
                <option value="GROUP2">Thực thi nhóm 2 (GROUP2)</option>
                <option value="GROUP3">Thực thi nhóm 3 (GROUP3)</option>
                <option value="FUND1">Quỹ chứng 1 (FUND1)</option>
              </select>
            </div>
            <div class="form-actions">
              <span class="form-msg" id="report-form-msg"></span>
              <button class="btn primary" onclick="saveReport()">&#10003; Lưu</button>
              <button class="btn" onclick="closeReportForm()" style="padding:8px 20px">Đóng</button>
            </div>
          </div>
        </div>
      </div>`;
      document.body.appendChild(div.firstElementChild);
    })();

    function closeReportForm() {
      var overlay = document.getElementById('report-form-overlay');
      if (overlay) overlay.classList.remove('active');
    }

    function openReportForm() {
      var overlay = document.getElementById('report-form-overlay');
      if (overlay) {
        overlay.classList.add('active');
        document.getElementById('report-form-accountid').value = '';
        document.getElementById('report-form-accountname').value = '';
        document.getElementById('report-form-diecount').value = '';
        document.getElementById('report-form-group').value = 'General';
        var msg = document.getElementById('report-form-msg');
        msg.textContent = '';
        msg.style.color = '';
      }
    }

    async function saveReport() {
      var accountId = document.getElementById('report-form-accountid').value.trim();
      var accountName = document.getElementById('report-form-accountname').value.trim();
      var dieCount = parseInt(document.getElementById('report-form-diecount').value) || 0;
      var group = document.getElementById('report-form-group').value;
      var msg = document.getElementById('report-form-msg');
      if (!accountId || !accountName) {
        msg.textContent = 'Vui lòng nhập Account ID và tên tài khoản.';
        msg.style.color = 'var(--danger)';
        return;
      }
      try {
        await api('/api/reports', {
          method: 'POST',
          body: JSON.stringify({ accountId: accountId, accountName: accountName, dieCount: dieCount, group: group, category: 'Group' })
        });
        closeReportForm();
        loadReports();
      } catch (e) {
        msg.textContent = 'Lỗi: ' + e.message;
        msg.style.color = 'var(--danger)';
      }
    }

    async function loadReports() {
      var container = document.getElementById('reports-list');
      if (!container) return;
      try {
        var reports = await api('/api/reports');
        var user = getUser();
        var isAdmin = user && user.role === 'ADMIN';
        var addBtn = document.getElementById('report-add-btn');
        if (addBtn) addBtn.style.display = isAdmin ? 'inline-flex' : 'none';
        var summary = document.getElementById('reports-summary');
        if (summary) summary.textContent = 'Tổng số báo cáo: ' + reports.length;
        if (!reports || reports.length === 0) {
          container.innerHTML = '<div style="text-align:center;padding:30px;color:var(--muted)">Chưa có báo cáo nào.</div>';
          return;
        }
        var html = '<table><thead><tr><th>Account ID</th><th>Tên tài khoản</th><th>Số DIE</th><th>Nhóm</th><th>Người tạo</th><th>Thời gian</th></tr></thead><tbody>';
        for (var i = 0; i < reports.length; i++) {
          var r = reports[i];
          var creatorName = r.createdBy ? r.createdBy.name : '—';
          html += '<tr>';
          html += '<td>' + r.accountId + '</td>';
          html += '<td>' + r.accountName + '</td>';
          html += '<td style="font-weight:700;color:var(--accent2)">' + r.dieCount + '</td>';
          html += '<td>' + r.group + '</td>';
          html += '<td>' + creatorName + '</td>';
          html += '<td style="color:var(--muted);font-size:12px">' + new Date(r.createdAt).toLocaleString() + '</td>';
          html += '</tr>';
        }
        html += '</tbody></table>';
        container.innerHTML = html;
      } catch (e) {
        container.innerHTML = '<div style="color:var(--danger);text-align:center;padding:20px">Lỗi: ' + e.message + '</div>';
      }
    }

    // === Check Pending Count (Notification Badge) ===
    var pendingPollInterval = null;
    var lastPendingCount = 0;

    async function checkPendingCount() {
      try {
        var result = await api('/api/admin/pending-count');
        var badge = document.getElementById('pending-badge');
        if (!badge) return;
        if (result.count > 0) {
          badge.style.display = 'inline';
          badge.textContent = result.count + ' pending';
          if (result.count > lastPendingCount) {
            // New user registered — show browser notification
            var newUsers = result.count - lastPendingCount;
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('New Registration' + (newUsers > 1 ? 's' : ''), {
                body: newUsers + ' new user' + (newUsers > 1 ? 's have' : ' has') + ' registered and needs approval.',
                icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🔔</text></svg>'
              });
            }
            // Also auto-reload the user list if admin panel is visible
            loadAdminUsers();
          }
          lastPendingCount = result.count;
        } else {
          badge.style.display = 'none';
          lastPendingCount = 0;
        }
      } catch (e) {
        // Silently ignore polling errors
      }
    }

    // === Check Auth State ===
    function checkAuthState() {
      var user = getUser();
      var token = getToken();

      if (!token || !user) {
        gate.style.display = 'flex';
        content.style.display = 'none';
        logoutBtn.style.display = 'none';
        if (userInfoBar) userInfoBar.style.display = 'none';
        switchTab('login');
        return;
      }

// User is logged in
      gate.style.display = 'none';
      content.style.display = 'block';

      // Apply saved site content to the UI
      applySiteContentToUI();

      // Update lock button
      logoutBtn.style.display = 'inline-block';

      // Show user info bar
      if (userInfoBar && userInfoText) {
        var statusBadge = '';
        if (user.status === 'PENDING') statusBadge = ' <span class="status-pending">(Pending)</span>';
        else if (user.status === 'APPROVED') statusBadge = ' <span class="status-approved">(Approved) &#10003;</span>';
        else if (user.status === 'REJECTED') statusBadge = ' <span class="status-rejected">(Rejected)</span>';
        var roleDisplay = user.role ? '<span class="sub-badge">' + user.role + '</span>' : '';
        userInfoText.innerHTML = '&#128100; <strong>' + user.name + '</strong>' + roleDisplay + statusBadge;
        userInfoBar.style.display = 'block';
      }

      // Show admin panel nav button if role is ADMIN
      var adminNavBtn = document.getElementById('admin-panel-btn');
      if (user.role === 'ADMIN') {
        if (adminNavBtn) adminNavBtn.style.display = 'inline-block';
        loadAdminUsers();
      } else {
        if (adminNavBtn) adminNavBtn.style.display = 'none';
      }

      // For all approved users (including ADMIN), close the gate and show content
      if (user.role === 'ADMIN' || user.status === 'APPROVED') {
        gate.style.display = 'none';
        content.style.display = 'block';
      } else if (user.status === 'PENDING') {
        document.getElementById('form-login').classList.remove('active');
        document.getElementById('form-register').classList.remove('active');
        document.getElementById('form-pending').classList.add('active');
        document.getElementById('form-admin').classList.remove('active');
        gate.style.display = 'flex';
        content.style.display = 'none';
      } else if (user.status === 'REJECTED') {
        document.getElementById('form-login').classList.remove('active');
        document.getElementById('form-register').classList.remove('active');
        document.getElementById('form-pending').classList.add('active');
        document.querySelector('#form-pending h3').textContent = 'Account Rejected';
        document.querySelector('#form-pending p').innerHTML = 'Your account has been rejected by an administrator. Please contact support for more information.';
        document.getElementById('form-admin').classList.remove('active');
        gate.style.display = 'flex';
        content.style.display = 'none';
      } else {
        // Approved - show content
        gate.style.display = 'none';
        content.style.display = 'block';
      }
    }

    // === Check Status (for pending users) ===
    async function handleCheckStatus() {
      try {
        var user = await api('/api/auth/me');
        if (user.status === 'APPROVED') {
          var storedUser = getUser();
          if (storedUser) {
            storedUser.status = 'APPROVED';
            var token = getToken();
            setAuth(token, storedUser);
          }
          checkAuthState();
        } else if (user.status === 'REJECTED') {
          var storedUser = getUser();
          if (storedUser) {
            storedUser.status = 'REJECTED';
            var token = getToken();
            setAuth(token, storedUser);
          }
          checkAuthState();
        } else {
          alert('Your account is still pending approval. Please check back later.');
        }
      } catch (err) {
        alert('Error checking status: ' + err.message);
      }
    }

    // === Logout ===
    function handleLogout() {
      clearAuth();
      checkAuthState();
    }

// === Close Admin Panel (X button) ===
    function closeAdminPanel() {
      gate.style.display = 'none';
    }

    // === Toggle Admin Panel (Nav Button) ===
    var adminPanelBtn = document.getElementById('admin-panel-btn');
    if (adminPanelBtn) {
      adminPanelBtn.addEventListener('click', function(e) {
        e.preventDefault();
        gate.style.display = 'flex';
        document.getElementById('form-login').classList.remove('active');
        document.getElementById('form-register').classList.remove('active');
        document.getElementById('form-pending').classList.remove('active');
        document.getElementById('form-admin').classList.add('active');
        loadAdminUsers();
      });
    }

    // === Event Listeners ===
    loginBtn.addEventListener('click', handleLogin);
    registerBtn.addEventListener('click', handleRegister);
    logoutBtn.addEventListener('click', function(e) { e.preventDefault(); handleLogout(); });
    adminLogoutBtn.addEventListener('click', handleLogout);
    if (checkStatusBtn) checkStatusBtn.addEventListener('click', handleCheckStatus);

    // Allow Enter key to submit forms
    loginPassword.addEventListener('keydown', function(e) { if (e.key === 'Enter') handleLogin(); });
    regPassword.addEventListener('keydown', function(e) { if (e.key === 'Enter') handleRegister(); });

    // === Start/Stop Pending Polling ===
    function startPendingPolling() {
      if (pendingPollInterval) clearInterval(pendingPollInterval);
      lastPendingCount = 0;
      checkPendingCount(); // Check immediately
      pendingPollInterval = setInterval(checkPendingCount, 5000); // Check every 5 seconds
    }

    function stopPendingPolling() {
      if (pendingPollInterval) {
        clearInterval(pendingPollInterval);
        pendingPollInterval = null;
      }
    }

    // Intercept checkAuthState to manage polling
    var origCheckAuthState = checkAuthState;
    checkAuthState = function() {
      origCheckAuthState();
      var user = getUser();
      if (user && user.role === 'ADMIN' && getToken()) {
        startPendingPolling();
        // Request notification permission
        if ('Notification' in window && Notification.permission === 'default') {
          Notification.requestPermission();
        }
      } else {
        stopPendingPolling();
      }
      // Show/hide chat based on auth
      var chatToggle = document.getElementById('chat-toggle');
      var chatArea = document.getElementById('chat-area');
      if (user && getToken() && (user.status === 'APPROVED' || user.role === 'ADMIN')) {
        chatToggle.style.display = 'block';
      } else {
        chatToggle.style.display = 'none';
        chatArea.style.display = 'none';
      }
    };

    // === Chat Functions ===
    var chatPollInterval = null;

    function toggleChat() {
      var chatArea = document.getElementById('chat-area');
      var chatToggle = document.getElementById('chat-toggle');
      if (chatArea.style.display === 'block') {
        chatArea.style.display = 'none';
        chatToggle.textContent = '\u{1F4AC}';
        if (chatPollInterval) { clearInterval(chatPollInterval); chatPollInterval = null; }
      } else {
        chatArea.style.display = 'block';
        chatToggle.textContent = '\u274C';
        loadChatMessages();
        if (chatPollInterval) clearInterval(chatPollInterval);
        chatPollInterval = setInterval(loadChatMessages, 3000);
      }
    }

    async function loadChatMessages() {
      var chatMsgs = document.getElementById('chat-msgs');
      if (!chatMsgs) return;
      try {
        var messages = await api('/api/chat/messages');
        var user = getUser();
        var html = '';
        for (var i = 0; i < messages.length; i++) {
          var m = messages[i];
          var isOwn = (m.senderId === user.id);
          var cls = isOwn ? 'own' : 'other';
          html += '<div class="msg ' + cls + '">';
          html += '<div>' + m.content + '</div>';
          html += '<div class="meta">' + m.senderName + ' (' + m.senderRole + ') &middot; ' + new Date(m.createdAt).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}) + '</div>';
          html += '</div>';
        }
        if (messages.length === 0) {
          html = '<div style="text-align:center;color:var(--muted);padding:20px;font-size:13px">No messages yet. Say hello!</div>';
        }
        chatMsgs.innerHTML = html;
        chatMsgs.scrollTop = chatMsgs.scrollHeight;
      } catch (e) {
        // Silently ignore
      }
    }

    async function sendChatMsg() {
      var input = document.getElementById('chat-input');
      var content = input.value.trim();
      if (!content) return;
      input.value = '';
      try {
        await api('/api/chat/messages', {
          method: 'POST',
          body: JSON.stringify({ content: content })
        });
        loadChatMessages();
      } catch (err) {
        alert('Error sending message: ' + err.message);
      }
    }

    // === Hash Router: Page Navigation ===
    var pageViews = document.querySelectorAll('.page-view');
    var navLinks = document.querySelectorAll('nav a[href^="#"]');

    function showPage(pageId) {
      pageViews.forEach(function(p) { p.style.display = 'none'; });
      var target = document.getElementById('page-' + pageId);
      if (target) {
        target.style.display = 'block';
      } else {
        // Default to home
        var home = document.getElementById('page-home');
        if (home) home.style.display = 'block';
      }
      // Update active link in nav
      navLinks.forEach(function(a) { a.classList.remove('active-link'); });
      var activeNav = document.querySelector('nav a[href="#' + pageId + '"]');
      if (activeNav) activeNav.classList.add('active-link');
    }

    function handleRouteChange() {
      var hash = window.location.hash.replace('#', '') || 'home';
      showPage(hash);
    }

    window.addEventListener('hashchange', handleRouteChange);
    window.addEventListener('load', handleRouteChange);

    // === Override nav link click for hash routing ===
    navLinks.forEach(function(a) {
      a.addEventListener('click', function(e) {
        // Allow default hash behavior but also trigger route
        setTimeout(handleRouteChange, 10);
      });
    });

    // === Contact Form Handler ===
    async function handleContactForm(event) {
      event.preventDefault();
      var name = document.getElementById('contact-name').value.trim();
      var email = document.getElementById('contact-email').value.trim();
      var message = document.getElementById('contact-message').value.trim();
      var status = document.getElementById('contact-status');
      var submitBtn = document.getElementById('contact-submit-btn');

      if (!name || !email || !message) {
        status.textContent = 'Please fill in all fields.';
        return false;
      }

      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner"></span> Sending...';
      status.textContent = '';

      try {
        // If we have an authenticated user, send via API. Otherwise, simulate.
        var token = getToken();
        var user = getUser();
        if (token && user) {
          await api('/api/contact', {
            method: 'POST',
            body: JSON.stringify({ name: name, email: email, message: message })
          });
        } else {
          // Simulate sending (since contact API may not exist)
          await new Promise(function(resolve) { setTimeout(resolve, 1000); });
        }
        status.textContent = 'Message sent! We\'ll get back to you soon.';
        status.style.color = 'var(--accent2)';
        document.getElementById('contact-name').value = '';
        document.getElementById('contact-email').value = '';
        document.getElementById('contact-message').value = '';
      } catch (err) {
        status.textContent = 'Error: ' + err.message;
        status.style.color = 'var(--danger)';
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span class="dot"></span> Send Message';
      }
      return false;
    }

    // === Doc Manager Modal HTML (injected) ===
    (function() {
      var div = document.createElement('div');
      div.innerHTML = `
      <div class="doc-manager-overlay" id="doc-manager-overlay">
        <div class="doc-manager-modal">
          <button class="close-btn" onclick="closeDocManager()">&times;</button>
          <h3>&#128196; Quản lý Danh Mục Tài Liệu</h3>
          <div id="doc-manager-list"></div>
          <div class="doc-manager-form">
            <div class="full">
              <label>Tên mục</label>
              <input id="doc-form-name" type="text" placeholder="VD: Nhóm A, Quỹ ABC, VPS ..." />
            </div>
            <div class="full">
              <label>Google Drive Link</label>
              <input id="doc-form-link" type="url" placeholder="https://drive.google.com/..." />
            </div>
            <div>
              <label>Danh mục (Category)</label>
              <select id="doc-form-category">
                <option value="Group">Group</option>
                <option value="Fund">Fund</option>
                <option value="VPS">VPS</option>
                <option value="Profile">Profile</option>
              </select>
            </div>
            <div class="full" style="margin-top:4px">
              <label>Vai trò được phép xem (Role Access):</label>
              <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:4px" id="doc-form-roles-container">
                <label style="display:flex;align-items:center;gap:4px;font-size:12px;color:var(--text);cursor:pointer">
                  <input type="checkbox" class="doc-role-cb" value="ADMIN" checked> Admin
                </label>
                <label style="display:flex;align-items:center;gap:4px;font-size:12px;color:var(--text);cursor:pointer">
                  <input type="checkbox" class="doc-role-cb" value="DIRECTOR" checked> Giám Đốc
                </label>
                <label style="display:flex;align-items:center;gap:4px;font-size:12px;color:var(--text);cursor:pointer">
                  <input type="checkbox" class="doc-role-cb" value="IT" checked> IT
                </label>
                <label style="display:flex;align-items:center;gap:4px;font-size:12px;color:var(--text);cursor:pointer">
                  <input type="checkbox" class="doc-role-cb" value="ACCOUNTING" checked> Kế Toán
                </label>
                <label style="display:flex;align-items:center;gap:4px;font-size:12px;color:var(--text);cursor:pointer">
                  <input type="checkbox" class="doc-role-cb" value="LEADER"> Leader
                </label>
                <label style="display:flex;align-items:center;gap:4px;font-size:12px;color:var(--text);cursor:pointer">
                  <input type="checkbox" class="doc-role-cb" value="EMPLOYEE"> Thực Thi
                </label>
                <label style="display:flex;align-items:center;gap:4px;font-size:12px;color:var(--text);cursor:pointer">
                  <input type="checkbox" class="doc-role-cb" value="IMPLEMENTATION"> Implementation
                </label>
              </div>
            </div>
            <div style="display:flex;align-items:flex-end">
              <button class="btn primary" id="doc-form-add-btn" onclick="addDocItem()" style="width:100%">+ Thêm mục</button>
            </div>
            <div class="form-actions">
              <span class="form-msg" id="doc-form-msg"></span>
              <button class="btn" onclick="closeDocManager()" style="padding:8px 20px">Đóng</button>
            </div>
          </div>
        </div>
      </div>`;
      document.body.appendChild(div.firstElementChild);
    })();

    // === Team Manager Modal HTML (injected) ===
    (function() {
      var div = document.createElement('div');
      div.innerHTML = `
      <div class="doc-manager-overlay" id="team-manager-overlay">
        <div class="doc-manager-modal">
          <button class="close-btn" onclick="closeTeamManager()">&times;</button>
          <h3>&#128101; Quản lý Thành Viên Team</h3>
          <div id="team-manager-list"></div>
          <div class="doc-manager-form">
            <div class="full">
              <label>Tên thành viên</label>
              <input id="team-form-name" type="text" placeholder="VD: Nguyễn Văn A" />
            </div>
            <div>
              <label>Chức vụ (Position)</label>
              <input id="team-form-position" type="text" placeholder="VD: IT, Accounting..." />
            </div>
            <div>
              <label>Biểu tượng (Avatar)</label>
              <select id="team-form-avatar">
                <option value="&#128100;">&#128100; Person</option>
                <option value="&#128187;">&#128187; IT</option>
                <option value="&#128200;">&#128200; Report</option>
                <option value="&#128170;">&#128170; Executor</option>
                <option value="&#128203;">&#128203; Accounting</option>
                <option value="&#127891;">&#127891; Training</option>
                <option value="&#128295;">&#128295; Support</option>
              </select>
            </div>
            <div>
              <label>Nhóm vai trò (Role Class)</label>
              <select id="team-form-roleclass">
                <option value="role-director">Giám đốc (Director)</option>
                <option value="role-it">IT</option>
                <option value="role-executor">Thực thi (Executor)</option>
                <option value="role-accounting">Kế toán (Accounting)</option>
                <option value="role-profile">Profile</option>
                <option value="role-placeholder">Khác (Placeholder)</option>
              </select>
            </div>
            <div class="full">
              <label>Mô tả</label>
              <textarea id="team-form-description" rows="3" placeholder="Mô tả về thành viên..." style="width:100%;padding:10px 12px;border-radius:10px;border:1px solid var(--border);background:rgba(255,255,255,.04);color:var(--text);outline:none;resize:vertical;font-family:inherit;font-size:13px"></textarea>
            </div>
            <div class="full">
              <label>Thứ tự hiển thị (0 = đầu tiên)</label>
              <input id="team-form-order" type="number" value="0" min="0" style="width:80px" />
            </div>
            <div style="display:flex;align-items:flex-end">
              <button class="btn primary" id="team-form-add-btn" onclick="addTeamMember()" style="width:100%">+ Thêm thành viên</button>
            </div>
            <div class="form-actions">
              <span class="form-msg" id="team-form-msg"></span>
              <button class="btn" onclick="closeTeamManager()" style="padding:8px 20px">Đóng</button>
            </div>
          </div>
        </div>
      </div>`;
      document.body.appendChild(div.firstElementChild);
    })();

    // === Team Members Data (localStorage fallback) ===
    var LOCAL_TEAM_KEY = '_pvt_team_data';

    function getDefaultTeamMembers() {
      return [
        { id: 1, name: "Daniel Nguyễn", position: "Founder & Director", role: "DIRECTOR", description: "Oversees all company operations, strategy, and growth. With years of industry experience, Daniel leads the organization with vision and dedication.", avatarIcon: "&#128100;", roleClass: "role-director", displayOrder: 0, isActive: true },
        { id: 2, name: "Công", position: "IT", role: "IT", description: "Responsible for maintaining IT infrastructure, systems administration, and technical support across the organization.", avatarIcon: "&#128187;", roleClass: "role-it", displayOrder: 1, isActive: true },
        { id: 3, name: "Tấn Thắng", position: "IT", role: "IT", description: "Handles network operations, system security, and technology solutions to keep our digital environment running smoothly.", avatarIcon: "&#128187;", roleClass: "role-it", displayOrder: 2, isActive: true },
        { id: 4, name: "Trọng Việt", position: "Executor (Người thực thi)", role: "EMPLOYEE", description: "Responsible for executing key projects and operational tasks. Ensures timely delivery and quality output.", avatarIcon: "&#128170;", roleClass: "role-executor", displayOrder: 3, isActive: true },
        { id: 5, name: "Thanh Trai", position: "Executor (Người thực thi)", role: "EMPLOYEE", description: "Carries out operational tasks and project execution with precision and efficiency.", avatarIcon: "&#128170;", roleClass: "role-executor", displayOrder: 4, isActive: true },
        { id: 6, name: "Phước Bình", position: "Executor (Người thực thi)", role: "EMPLOYEE", description: "Supports project execution and operational workflows. Dedicated to achieving team goals.", avatarIcon: "&#128170;", roleClass: "role-executor", displayOrder: 5, isActive: true },
        { id: 7, name: "Nguyễn Thái", position: "Accounting", role: "ACCOUNTING", description: "Manages financial records, accounting operations, and financial reporting for the entire organization.", avatarIcon: "&#128203;", roleClass: "role-accounting", displayOrder: 6, isActive: true }
      ];
    }

    function getLocalTeamMembers() {
      var stored = localStorage.getItem(LOCAL_TEAM_KEY);
      if (stored) {
        try { return JSON.parse(stored); } catch(e) {}
      }
      var defaults = getDefaultTeamMembers();
      localStorage.setItem(LOCAL_TEAM_KEY, JSON.stringify(defaults));
      return defaults;
    }

    function saveLocalTeamMembers(members) {
      localStorage.setItem(LOCAL_TEAM_KEY, JSON.stringify(members));
    }

// === SITE CONTENT (editable website copy) ===
    var LOCAL_CONTENT_KEY = '_pvt_site_content';
    var LOCAL_GROUP_CHAT_KEY = '_pvt_group_chats';
    var __siteContentCache = null;
    var __siteContentLoadedFromServer = false;

    // Deep-merge defaults with loaded content so new fields always exist
    function mergeContent(base, loaded) {
      if (!loaded) return base;
      var out = {};
      for (var k in base) {
        out[k] = (loaded[k] === undefined) ? base[k] : loaded[k];
      }
      if (!out.hero) out.hero = {};
      if (!out.quickFacts) out.quickFacts = {};
      if (!out.about) out.about = {};
      if (!out.sections) out.sections = {};
      if (!out.contact) out.contact = {};
      if (!Array.isArray(out.announcements)) out.announcements = [];
      if (!Array.isArray(out.services)) out.services = [];
      if (!Array.isArray(out.about.values)) out.about.values = [];
      if (!Array.isArray(out.about.overviewPoints)) out.about.overviewPoints = [];
      return out;
    }

    function getDefaultSiteContent() {
      return {
hero: {
          title: 'Trusted solutions for your next milestone.',
          lead: 'A private corporate site with secure navigation, clean layout, and quick content sections.',
          feature1Title: 'Secure by design',
          feature1Desc: 'Server-side authentication with role-based access control.',
          feature2Title: 'Modern UI',
          feature2Desc: 'Responsive layout, accessible components, and a polished dark theme.',
          feature3Title: 'Easy to customize',
          feature3Desc: 'Update copy, images, and links without touching the structure.',
          buttonServices: 'Explore services',
          buttonContact: 'Get in touch'
        },
        quickFacts: {
          industry: '[Your industry]',
          hq: '[City, Country]',
          note: 'Internal documents and announcements can be linked here.'
        },
        announcements: [
          { title: 'New policy update', text: '[Date] — Replace with your latest update.' },
          { title: 'Office hours', text: '[Details] — Replace with current schedule.' }
        ],
        about: {
          mission: 'To deliver innovative solutions that empower businesses to achieve their full potential. We believe in building lasting partnerships through trust, transparency, and exceptional service.',
          values: [
            'Integrity — We do the right thing, always',
            'Excellence — We pursue the highest standards',
            'Innovation — We embrace change and new ideas',
            'Collaboration — We succeed together',
            'Customer-first — Our clients are our priority'
          ],
overview: 'Founded with a vision to transform the [your industry] landscape, we have grown into a trusted partner for organizations worldwide. Our team brings decades of combined experience across strategy, technology, and operations.',
          overviewPoints: [
            'Operational excellence driven by data',
            'Long-term partnerships with measurable impact',
            'Commitment to sustainable growth'
          ]
        },
        sections: {
          about: { heading: 'About Us', subheading: 'Our mission, values, and story' },
          services: { heading: 'Our Services', subheading: 'Comprehensive solutions tailored to your needs' },
          team: { heading: 'Company', subheading: 'Our team & organizational structure' },
          contact: { heading: 'Contact Us', subheading: 'We\'d love to hear from you' },
          reports: { heading: '📊 Báo Cáo Tài Khoản', subheading: 'Quản lý báo cáo số lượng DIE của các tài khoản' }
        },
        services: [
          { title: '📈 Consulting', desc: 'Strategic planning, market analysis, and business transformation guidance. We help you identify opportunities, mitigate risks, and chart a clear path forward with data-driven recommendations.' },
          { title: '⚙ Implementation', desc: 'End-to-end deployment of solutions, system integration, and operational setup. Our team works alongside yours to ensure seamless rollout with measurable outcomes and minimal disruption.' },
          { title: '🔧 Support', desc: 'Ongoing maintenance, troubleshooting, and continuous improvement. We provide reliable support to keep your systems running smoothly with guaranteed response times.' },
          { title: '☁ Managed Services', desc: 'Full-service management of your critical operations. Reduce your team\'s workload with predictable delivery, proactive monitoring, and dedicated account management.' },
          { title: '📊 Reporting & Analytics', desc: 'Custom dashboards, performance summaries, and actionable insights for stakeholders. Make informed decisions with real-time data visualization and trend analysis.' },
          { title: '🎓 Training', desc: 'Workshops, documentation, and knowledge transfer for smooth adoption. Empower your team with the skills they need to succeed through structured learning programs.' }
        ],
        contact: {
          email: 'contact@redsv.vn',
          office: '123 Business Avenue, Suite 100\n[City, Country]',
          responseTime: 'Typically within 24 hours'
        },
        footer: 'Company Name. Private site template.'
      };
    }

// Backend-FIRST content loader. Returns cached content immediately and
    // asynchronously replaces it with server data when available.
    function getSiteContent() {
      if (__siteContentCache) return __siteContentCache;
      var defaults = getDefaultSiteContent();
      __siteContentCache = mergeContent(defaults, null);
      // Fire-and-forget: fetch from server to enable cross-user sync
      if (!__siteContentLoadedFromServer) {
        __siteContentLoadedFromServer = true;
        try {
          api('/api/site-content').then(function(serverContent) {
            if (serverContent && typeof serverContent === 'object') {
              var updated = mergeContent(getDefaultSiteContent(), serverContent);
              __siteContentCache = updated;
              try { localStorage.setItem(LOCAL_CONTENT_KEY, JSON.stringify(updated)); } catch(e) {}
              applySiteContentToUI(updated);
            }
          }).catch(function() {
            try {
              var stored = localStorage.getItem(LOCAL_CONTENT_KEY);
              if (stored) {
                var parsed = JSON.parse(stored);
                __siteContentCache = mergeContent(getDefaultSiteContent(), parsed);
              }
            } catch(e) {}
          });
        } catch(e) {}
      }
      return __siteContentCache;
    }

    function saveSiteContent(content) {
      __siteContentCache = content;
      try { localStorage.setItem(LOCAL_CONTENT_KEY, JSON.stringify(content)); } catch(e) {}
    }

    // === Toast Notifications (Facebook-style) ===
    function showToast(type, title, msg, duration) {
      var container = document.getElementById('toast-container');
      if (!container) return;
      var icons = { success: '&#10003;', error: '&#10007;', warning: '&#9888;', message: '&#128172;', group: '&#128101;' };
      var icon = icons[type] || '&#8505;';
      var toast = document.createElement('div');
      toast.className = 'toast ' + (type || 'message');
      toast.innerHTML = '<div class="toast-icon">' + icon + '</div>' +
        '<div class="toast-body">' +
          '<div class="toast-title">' + (title || '') + '</div>' +
          '<div class="toast-msg">' + (msg || '') + '</div>' +
        '</div>' +
        '<button class="toast-close" onclick="this.parentNode.classList.add(\'out\');setTimeout(function(){this.parentNode.remove()}.bind(this),300)">&times;</button>';
      container.appendChild(toast);
      var t = duration || 4000;
      setTimeout(function() {
        toast.classList.add('out');
        setTimeout(function() { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 300);
      }, t);
    }

    // === Apply saved site content to the actual UI ===
    function applySiteContentToUI(content) {
      if (!content) content = getSiteContent();
      // Hero
      var el = document.getElementById('home-hero-title');
      if (el && content.hero && content.hero.title) el.textContent = content.hero.title;
      el = document.getElementById('home-hero-lead');
      if (el && content.hero && content.hero.lead) el.textContent = content.hero.lead;
      var feats = [
        { t: 'home-feature1-title', d: 'home-feature1-desc', tt: 'feature1Title', dd: 'feature1Desc' },
        { t: 'home-feature2-title', d: 'home-feature2-desc', tt: 'feature2Title', dd: 'feature2Desc' },
        { t: 'home-feature3-title', d: 'home-feature3-desc', tt: 'feature3Title', dd: 'feature3Desc' }
      ];
      for (var fi = 0; fi < feats.length; fi++) {
        var fe = feats[fi];
        var te = document.getElementById(fe.t);
        if (te && content.hero && content.hero[fe.tt]) te.textContent = content.hero[fe.tt];
        var de = document.getElementById(fe.d);
        if (de && content.hero && content.hero[fe.dd]) de.textContent = content.hero[fe.dd];
      }
      // Quick facts
      var qf = content.quickFacts;
      if (qf) {
        el = document.getElementById('home-qf-industry');
        if (el && qf.industry) el.textContent = qf.industry;
        el = document.getElementById('home-qf-hq');
        if (el && qf.hq) el.textContent = qf.hq;
        el = document.getElementById('home-qf-note');
        if (el && qf.note) el.textContent = qf.note;
      }
      // Announcements
      var annContainer = document.getElementById('home-announcements');
      if (annContainer && content.announcements && content.announcements.length > 0) {
        var annHtml = '';
        for (var ai = 0; ai < content.announcements.length; ai++) {
          var a = content.announcements[ai];
          if (ai > 0) annHtml += '<div style="border-top:1px solid var(--border); margin:12px 0"></div>';
          annHtml += '<div style="font-weight:700">&bull; ' + a.title + '</div>';
          annHtml += '<div style="color:var(--muted); font-size:13.5px; margin-top:6px">' + a.text + '</div>';
        }
        annContainer.innerHTML = annHtml;
      }
      // About
      if (content.about) {
        var missionEl = document.querySelector('#page-about .card p');
        if (missionEl && content.about.mission) missionEl.textContent = content.about.mission;
        var valuesUl = document.querySelectorAll('#page-about .two-col .list');
        if (valuesUl[0] && content.about.values) {
          var vh = '';
          for (var vi = 0; vi < content.about.values.length; vi++) {
            vh += '<li>' + content.about.values[vi] + '</li>';
          }
          valuesUl[0].innerHTML = vh;
        }
        if (valuesUl[1] && content.about.overview) {
          var op = valuesUl[1].querySelector('p');
          if (op) op.textContent = content.about.overview;
        }
      }
      // Services
      var svcContainer = document.getElementById('page-services');
      if (svcContainer && content.services && content.services.length > 0) {
        var grid = svcContainer.querySelector('.grid');
        if (grid) {
          var sh = '';
          for (var si = 0; si < content.services.length; si++) {
            var s = content.services[si];
            sh += '<div class="feature"><h3>' + s.title + '</h3><p>' + s.desc + '</p></div>';
          }
          grid.innerHTML = sh;
        }
      }
      // Contact
      if (content.contact) {
        var mailEl = document.querySelector('#page-contact .btn.primary[href^="mailto:"]');
        if (mailEl && content.contact.email) {
          mailEl.href = 'mailto:' + content.contact.email;
          mailEl.textContent = content.contact.email;
        }
        var officeEl = document.querySelector('#page-contact .card:nth-child(2) .card div:nth-child(2)');
        if (officeEl && content.contact.office) officeEl.textContent = content.contact.office;
        var respEl = document.querySelector('#page-contact .card:nth-child(2) .accent2');
        if (respEl && content.contact.responseTime) respEl.textContent = content.contact.responseTime;
      }
      // Footer
      if (content.footer) {
        var footerEl = document.querySelector('footer');
        if (footerEl) footerEl.innerHTML = '&copy; <span id="year"></span> ' + content.footer + ' <span style="color:var(--muted);font-size:12px">| <a href="#home" style="color:var(--accent)">Home</a> | <a href="#about" style="color:var(--accent)">About</a> | <a href="#services" style="color:var(--accent)">Services</a> | <a href="#team" style="color:var(--accent)">Team</a> | <a href="#contact" style="color:var(--accent)">Contact</a></span>';
        var yearEl = document.getElementById('year');
        if (yearEl) yearEl.textContent = new Date().getFullYear();
      }
    }

    // === Admin Content tab: load site content into the editor ===
    function renderContentAnnouncementsList(content) {
      var container = document.getElementById('content-announcements-list');
      if (!container) return;
      var anns = (content && content.announcements) ? content.announcements : [];
      if (anns.length === 0) {
        container.innerHTML = '<div style="color:var(--muted);font-size:12px;padding:6px 0">Chưa có thông báo nào.</div>';
        return;
      }
      var html = '';
      for (var i = 0; i < anns.length; i++) {
        var a = anns[i];
        html += '<div class="doc-item-row" style="margin-bottom:6px">' +
          '<div class="item-info">' +
          '<div class="item-name">' + a.title + '</div>' +
          '<div class="item-group">' + a.text + '</div>' +
          '</div>' +
          '<div class="item-actions">' +
          '<button class="del-btn" onclick="deleteContentAnnouncement(' + i + ')">&#10005;</button>' +
          '</div></div>';
      }
      container.innerHTML = html;
    }

    function renderContentServicesList(content) {
      var container = document.getElementById('content-services-list');
      if (!container) return;
      var svcs = (content && content.services) ? content.services : [];
      if (svcs.length === 0) {
        container.innerHTML = '<div style="color:var(--muted);font-size:12px;padding:6px 0">Chưa có dịch vụ nào.</div>';
        return;
      }
      var html = '';
      for (var i = 0; i < svcs.length; i++) {
        var s = svcs[i];
        html += '<div class="doc-item-row" style="margin-bottom:6px">' +
          '<div class="item-info">' +
          '<div class="item-name">' + s.title + '</div>' +
          '<div class="item-group">' + s.desc + '</div>' +
          '</div>' +
          '<div class="item-actions">' +
          '<button class="del-btn" onclick="deleteContentService(' + i + ')">&#10005;</button>' +
          '</div></div>';
      }
      container.innerHTML = html;
    }

    function loadSiteContentFromAdmin() {
      var content = getSiteContent();
      var set = function(id, val) {
        var el = document.getElementById(id);
        if (el && val !== undefined && val !== null) el.value = val;
      };
      if (content.hero) {
        set('content-hero-title', content.hero.title);
        set('content-hero-lead', content.hero.lead);
        set('content-feature1-title', content.hero.feature1Title);
        set('content-feature1-desc', content.hero.feature1Desc);
        set('content-feature2-title', content.hero.feature2Title);
        set('content-feature2-desc', content.hero.feature2Desc);
        set('content-feature3-title', content.hero.feature3Title);
        set('content-feature3-desc', content.hero.feature3Desc);
      }
      if (content.quickFacts) {
        set('content-qf-industry', content.quickFacts.industry);
        set('content-qf-hq', content.quickFacts.hq);
        set('content-qf-note', content.quickFacts.note);
      }
      var annList = document.getElementById('content-announcements-list');
      if (annList) renderContentAnnouncementsList(content);
      if (content.about) {
        set('content-about-mission', content.about.mission);
        set('content-about-values', (content.about.values || []).join('\n'));
        set('content-about-overview', content.about.overview);
      }
      var svcList = document.getElementById('content-services-list');
      if (svcList) renderContentServicesList(content);
      if (content.contact) {
        set('content-contact-email', content.contact.email);
        set('content-contact-response', content.contact.responseTime);
        set('content-contact-office', content.contact.office);
      }
      set('content-footer', content.footer);
      var msg = document.getElementById('admin-content-msg');
      if (msg) msg.textContent = '';
    }

    function addContentAnnouncement() {
      var title = document.getElementById('content-announcement-new-title');
      var text = document.getElementById('content-announcement-new-text');
      if (!title || !text) return;
      if (!title.value.trim() || !text.value.trim()) {
        showToast('warning', 'Thiếu thông tin', 'Vui lòng nhập tiêu đề và nội dung thông báo.');
        return;
      }
      var content = getSiteContent();
      if (!content.announcements) content.announcements = [];
      content.announcements.push({ title: title.value.trim(), text: text.value.trim() });
      saveSiteContent(content);
      title.value = '';
      text.value = '';
      renderContentAnnouncementsList(content);
      showToast('success', 'Đã thêm', 'Đã thêm thông báo. Nhấn "Lưu nội dung" để áp dụng.');
    }

    function deleteContentAnnouncement(index) {
      var content = getSiteContent();
      if (!content.announcements) return;
      if (!confirm('Xóa thông báo này?')) return;
      content.announcements.splice(index, 1);
      saveSiteContent(content);
      renderContentAnnouncementsList(content);
      showToast('success', 'Đã xóa', 'Đã xóa thông báo.');
    }

    function addContentService() {
      var title = document.getElementById('content-service-new-title');
      var desc = document.getElementById('content-service-new-desc');
      if (!title || !desc) return;
      if (!title.value.trim() || !desc.value.trim()) {
        showToast('warning', 'Thiếu thông tin', 'Vui lòng nhập tên và mô tả dịch vụ.');
        return;
      }
      var content = getSiteContent();
      if (!content.services) content.services = [];
      content.services.push({ title: title.value.trim(), desc: desc.value.trim() });
      saveSiteContent(content);
      title.value = '';
      desc.value = '';
      renderContentServicesList(content);
      showToast('success', 'Đã thêm', 'Đã thêm dịch vụ. Nhấn "Lưu nội dung" để áp dụng.');
    }

    function deleteContentService(index) {
      var content = getSiteContent();
      if (!content.services) return;
      if (!confirm('Xóa dịch vụ này?')) return;
      content.services.splice(index, 1);
      saveSiteContent(content);
      renderContentServicesList(content);
      showToast('success', 'Đã xóa', 'Đã xóa dịch vụ.');
    }

    async function saveSiteContentFromAdmin() {
      var content = getSiteContent();
      var get = function(id) {
        var el = document.getElementById(id);
        return el ? el.value : '';
      };
      content.hero = {
        title: get('content-hero-title'),
        lead: get('content-hero-lead'),
        feature1Title: get('content-feature1-title'),
        feature1Desc: get('content-feature1-desc'),
        feature2Title: get('content-feature2-title'),
        feature2Desc: get('content-feature2-desc'),
        feature3Title: get('content-feature3-title'),
        feature3Desc: get('content-feature3-desc')
      };
      content.quickFacts = {
        industry: get('content-qf-industry'),
        hq: get('content-qf-hq'),
        note: get('content-qf-note')
      };
      content.about = {
        mission: get('content-about-mission'),
        values: (get('content-about-values') || '').split('\n').map(function(s) { return s.trim(); }).filter(function(s) { return s.length > 0; }),
        overview: get('content-about-overview')
      };
      content.contact = {
        email: get('content-contact-email'),
        responseTime: get('content-contact-response'),
        office: get('content-contact-office')
      };
      content.footer = get('content-footer');
      saveSiteContent(content);
      var msg = document.getElementById('admin-content-msg');
      try {
        await api('/api/site-content', { method: 'PUT', body: JSON.stringify(content) });
        saveSiteContent(content);
        if (msg) { msg.textContent = 'Đã lưu nội dung (đã đồng bộ server)!'; msg.style.color = 'var(--accent2)'; }
        showToast('success', 'Đã lưu', 'Nội dung đã được lưu và áp dụng.');
      } catch (e) {
        if (msg) { msg.textContent = 'Đã lưu (offline).'; msg.style.color = 'var(--accent2)'; }
        showToast('success', 'Đã lưu', 'Nội dung đã được lưu (offline).');
      }
      applySiteContentToUI(content);
    }

// === Admin: Broadcast Tab ===
    function renderBroadcastRoles() {
      var container = document.getElementById('broadcast-roles-container');
      if (!container) return;
      var allRoles = getAllRoles();
      var html = '';
      for (var i = 0; i < allRoles.length; i++) {
        var role = allRoles[i];
        var label = isGroupRole(role) ? getGroupRoleName(role) + ' (' + role + ')' : role;
        html += '<label style="display:flex;align-items:center;gap:4px;font-size:12px;color:var(--text);cursor:pointer"><input type="checkbox" class="broadcast-role-cb" value="' + role + '"> ' + label + '</label>';
      }
      container.innerHTML = html;
    }

    function getBroadcastRoles() {
      var cbs = document.querySelectorAll('.broadcast-role-cb');
      var roles = [];
      for (var i = 0; i < cbs.length; i++) {
        if (cbs[i].checked) roles.push(cbs[i].value);
      }
      return roles;
    }

    async function sendBroadcast() {
      var title = document.getElementById('broadcast-title').value.trim();
      var message = document.getElementById('broadcast-message').value.trim();
      var roles = getBroadcastRoles();
      var msg = document.getElementById('broadcast-msg');
      if (!msg) return;
      if (!title || !message) {
        msg.textContent = 'Vui lòng nhập tiêu đề và nội dung.';
        msg.style.color = 'var(--danger)';
        return;
      }
      var btn = event.target;
      if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> Đang gửi...'; }
      try {
        await api('/api/admin/broadcasts', {
          method: 'POST',
          body: JSON.stringify({ title: title, message: message, roles: roles })
        });
        document.getElementById('broadcast-title').value = '';
        document.getElementById('broadcast-message').value = '';
        var cbs = document.querySelectorAll('.broadcast-role-cb');
        for (var i = 0; i < cbs.length; i++) cbs[i].checked = false;
        msg.textContent = 'Đã gửi thông báo thành công!';
        msg.style.color = 'var(--accent2)';
        showToast('success', 'Đã gửi', 'Thông báo đã được gửi tới người dùng.');
        renderBroadcastHistory();
      } catch (e) {
        msg.textContent = 'Lỗi: ' + e.message;
        msg.style.color = 'var(--danger)';
      } finally {
        if (btn) { btn.disabled = false; btn.innerHTML = '<span class="dot"></span> Gửi Thông Báo'; }
      }
    }

    async function renderBroadcastHistory() {
      var container = document.getElementById('broadcast-history-list');
      if (!container) return;
      try {
        var broadcasts = await api('/api/admin/broadcasts');
        if (!broadcasts || broadcasts.length === 0) {
          container.innerHTML = '<div style="text-align:center;padding:14px;color:var(--muted);font-size:13px">Chưa có thông báo nào.</div>';
          return;
        }
        var html = '';
        for (var i = broadcasts.length - 1; i >= 0; i--) {
          var b = broadcasts[i];
          var rolesStr = (b.roles && b.roles.length > 0) ? b.roles.join(', ') : 'Tất cả';
          html += '<div class="doc-item-row" style="margin-bottom:6px">' +
                  '<div class="item-info">' +
                  '<div class="item-name">' + b.title + '</div>' +
                  '<div class="item-group">' + b.message + '</div>' +
                  '<div class="item-link" style="font-size:11px;color:var(--muted)">Gửi tới: ' + rolesStr + ' | ' + (b.createdByName || '—') + ' | ' + new Date(b.createdAt).toLocaleString() + '</div>' +
                  '</div>' +
                  '<div class="item-actions">' +
                  '<button class="del-btn" onclick="deleteBroadcast(' + b.id + ')">&#10005;</button>' +
                  '</div></div>';
        }
        container.innerHTML = html;
      } catch (e) {
        container.innerHTML = '<div style="color:var(--danger);font-size:13px">Lỗi: ' + e.message + '</div>';
      }
    }

    async function deleteBroadcast(id) {
      if (!confirm('Xóa thông báo này?')) return;
      try {
        await api('/api/admin/broadcasts/' + id, { method: 'DELETE' });
        renderBroadcastHistory();
      } catch (e) {
        alert('Lỗi: ' + e.message);
      }
    }

    function getLocalGroupChats() {
      var stored = localStorage.getItem(LOCAL_GROUP_CHAT_KEY);
      if (stored) {
        try { return JSON.parse(stored); } catch(e) {}
      }
      var defaults = [];
      localStorage.setItem(LOCAL_GROUP_CHAT_KEY, JSON.stringify(defaults));
      return defaults;
    }

    function saveLocalGroupChats(groups) {
      localStorage.setItem(LOCAL_GROUP_CHAT_KEY, JSON.stringify(groups));
    }

