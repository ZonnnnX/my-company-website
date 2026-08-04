    // === Member Detail Modal: showMemberModal ===
    function showMemberModal(name, position, roleClass, description, role, avatar) {
      var overlay = document.getElementById('member-modal');
      if (!overlay) return;
      document.getElementById('modal-avatar').innerHTML = avatar || '&#128100;';
      document.getElementById('modal-name').textContent = name || '';
      document.getElementById('modal-role').textContent = position || '';
      document.getElementById('modal-desc').textContent = description || '';
      overlay.classList.add('active');
    }

    // === Team Members UI Functions ===
    async function loadTeamMembers() {
      var container = document.getElementById('team-members-container');
      if (!container) return;
      container.innerHTML = '<div style="text-align:center;padding:30px;color:var(--muted);grid-column:1/-1"><span class="spinner"></span> Loading team members...</div>';
      try {
        var members = await api('/api/team-members');
        renderTeamMembers(members);
      } catch (err) {
        // Fallback to localStorage
        var members = getLocalTeamMembers();
        renderTeamMembers(members);
      }
    }

    function renderTeamMembers(members) {
      var container = document.getElementById('team-members-container');
      if (!container) return;
      if (!members || members.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:30px;color:var(--muted);grid-column:1/-1">No team members yet.</div>';
        return;
      }
      var html = '';
      // Filter only active members and sort by displayOrder
      var active = members.filter(function(m) { return m.isActive !== false; });
      active.sort(function(a, b) { return (a.displayOrder || 0) - (b.displayOrder || 0); });
      for (var i = 0; i < active.length; i++) {
        var m = active[i];
        var roleClass = m.roleClass || 'role-placeholder';
        var pos = m.position || '';
        var desc = m.description || '';
        var avatar = m.avatarIcon || '&#128100;';
        html += '<div class="member-card" onclick="showMemberModal(\'' + m.name.replace(/'/g, "\\'") + '\',\'' + pos.replace(/'/g, "\\'") + '\',\'' + roleClass + '\',\'' + desc.replace(/'/g, "\\'") + '\',\'' + (m.role || '') + '\',\'' + avatar + '\')">';
        html += '<div class="expand-icon">&#9432;</div>';
        html += '<div class="avatar">' + avatar + '</div>';
        html += '<h3 style="margin:0;font-size:15px">' + m.name + '</h3>';
        html += '<div><span class="role-tag ' + roleClass + '">' + pos + '</span></div>';
        html += '</div>';
      }
      // Add a placeholder card at the end
      html += '<div class="member-card-placeholder"><div style="text-align:center;padding:16px"><div style="font-size:28px;margin-bottom:6px;opacity:0.5">&#128101;</div><div>Additional role</div><div style="font-size:11px;margin-top:4px;opacity:0.6">Position open — future hire</div></div></div>';
      container.innerHTML = html;
    }

    // === Team Manager Modal Functions ===
    var editingTeamMemberId = null;

    function openTeamManager() {
      var overlay = document.getElementById('team-manager-overlay');
      if (overlay) {
        overlay.classList.add('active');
        renderTeamManagerList();
        document.getElementById('team-form-name').value = '';
        document.getElementById('team-form-position').value = '';
        document.getElementById('team-form-avatar').value = '&#128100;';
        document.getElementById('team-form-roleclass').value = 'role-placeholder';
        document.getElementById('team-form-description').value = '';
        document.getElementById('team-form-order').value = '0';
        document.getElementById('team-form-msg').textContent = '';
        editingTeamMemberId = null;
        var addBtn = document.getElementById('team-form-add-btn');
        addBtn.innerHTML = '+ Thêm thành viên';
        addBtn.onclick = addTeamMember;
      }
    }

    function closeTeamManager() {
      var overlay = document.getElementById('team-manager-overlay');
      if (overlay) overlay.classList.remove('active');
    }

    function renderTeamManagerList() {
      var container = document.getElementById('team-manager-list');
      if (!container) return;
      api('/api/team-members/all').then(function(members) {
        if (!members || members.length === 0) {
          container.innerHTML = '<div style="text-align:center;padding:20px;color:var(--muted)">Chưa có thành viên. Thêm mới bên dưới.</div>';
          return;
        }
        var html = '';
        for (var i = 0; i < members.length; i++) {
          var m = members[i];
          var statusIcon = m.isActive ? '&#10003;' : '&#10007;';
          var statusColor = m.isActive ? 'var(--accent2)' : 'var(--danger)';
          html += '<div class="doc-item-row">' +
                  '<div class="item-info">' +
                  '<div class="item-name">' + m.avatarIcon + ' ' + m.name + ' <span style="color:' + statusColor + ';font-size:11px">' + statusIcon + '</span></div>' +
                  '<div class="item-group">' + (m.position || 'No position') + ' | Thứ tự: ' + (m.displayOrder || 0) + '</div>' +
                  '<div class="item-link" style="font-size:12px;color:var(--muted)">' + (m.description ? m.description.substring(0, 80) + (m.description.length > 80 ? '...' : '') : '') + '</div>' +
                  '</div>' +
                  '<div class="item-actions">' +
                  '<button class="edit-btn" onclick="editTeamMember(' + m.id + ')">&#9998;</button>' +
                  '<button class="del-btn" onclick="deleteTeamMember(' + m.id + ')">&#10005;</button>' +
                  '</div>' +
                  '</div>';
        }
        container.innerHTML = html;
      }).catch(function() {
        // Fallback to localStorage
        var members = getLocalTeamMembers();
        if (members.length === 0) {
          container.innerHTML = '<div style="text-align:center;padding:20px;color:var(--muted)">Chưa có thành viên. Thêm mới bên dưới.</div>';
          return;
        }
        var html = '';
        for (var i = 0; i < members.length; i++) {
          var m = members[i];
          var statusIcon = m.isActive !== false ? '&#10003;' : '&#10007;';
          var statusColor = m.isActive !== false ? 'var(--accent2)' : 'var(--danger)';
          html += '<div class="doc-item-row">' +
                  '<div class="item-info">' +
                  '<div class="item-name">' + (m.avatarIcon || '&#128100;') + ' ' + m.name + ' <span style="color:' + statusColor + ';font-size:11px">' + statusIcon + '</span></div>' +
                  '<div class="item-group">' + (m.position || 'No position') + ' | Thứ tự: ' + (m.displayOrder || 0) + '</div>' +
                  '<div class="item-link" style="font-size:12px;color:var(--muted)">' + (m.description ? m.description.substring(0, 80) + (m.description.length > 80 ? '...' : '') : '') + '</div>' +
                  '</div>' +
                  '<div class="item-actions">' +
                  '<button class="edit-btn" onclick="editTeamMember(' + m.id + ')">&#9998;</button>' +
                  '<button class="del-btn" onclick="deleteTeamMember(' + m.id + ')">&#10005;</button>' +
                  '</div>' +
                  '</div>';
        }
        container.innerHTML = html;
      });
    }

    async function addTeamMember() {
      var name = document.getElementById('team-form-name').value.trim();
      var position = document.getElementById('team-form-position').value.trim();
      var avatarIcon = document.getElementById('team-form-avatar').value;
      var roleClass = document.getElementById('team-form-roleclass').value;
      var description = document.getElementById('team-form-description').value.trim();
      var displayOrder = parseInt(document.getElementById('team-form-order').value) || 0;
      var msg = document.getElementById('team-form-msg');

      if (!name) {
        msg.textContent = 'Vui lòng nhập tên thành viên.';
        msg.style.color = 'var(--danger)';
        return;
      }

      try {
        await api('/api/team-members', {
          method: 'POST',
          body: JSON.stringify({
            name: name,
            position: position,
            role: roleClass === 'role-director' ? 'DIRECTOR' :
                  roleClass === 'role-it' ? 'IT' :
                  roleClass === 'role-accounting' ? 'ACCOUNTING' :
                  roleClass === 'role-executor' ? 'EMPLOYEE' : 'EMPLOYEE',
            description: description,
            avatarIcon: avatarIcon,
            roleClass: roleClass,
            displayOrder: displayOrder
          })
        });
        msg.textContent = 'Đã thêm thành viên thành công!';
        msg.style.color = 'var(--accent2)';
        document.getElementById('team-form-name').value = '';
        document.getElementById('team-form-position').value = '';
        document.getElementById('team-form-description').value = '';
        document.getElementById('team-form-order').value = '0';
        renderTeamManagerList();
        loadTeamMembers();
      } catch (err) {
        // Fallback to localStorage
        var members = getLocalTeamMembers();
        var maxId = 0;
        for (var i = 0; i < members.length; i++) { if (members[i].id > maxId) maxId = members[i].id; }
        var newMember = {
          id: maxId + 1,
          name: name,
          position: position,
          role: roleClass === 'role-director' ? 'DIRECTOR' : roleClass === 'role-it' ? 'IT' : roleClass === 'role-accounting' ? 'ACCOUNTING' : roleClass === 'role-executor' ? 'EMPLOYEE' : 'EMPLOYEE',
          description: description,
          avatarIcon: avatarIcon,
          roleClass: roleClass,
          displayOrder: displayOrder,
          isActive: true
        };
        members.push(newMember);
        saveLocalTeamMembers(members);
        msg.textContent = 'Đã thêm thành viên (offline)!';
        msg.style.color = 'var(--accent2)';
        document.getElementById('team-form-name').value = '';
        document.getElementById('team-form-position').value = '';
        document.getElementById('team-form-description').value = '';
        document.getElementById('team-form-order').value = '0';
        renderTeamManagerList();
        loadTeamMembers();
      }
    }

    function editTeamMember(id) {
      api('/api/team-members/all').then(function(members) {
        var item = null;
        for (var i = 0; i < members.length; i++) { if (members[i].id === id) { item = members[i]; break; } }
        if (!item) return;
        fillTeamForm(item);
      }).catch(function() {
        var members = getLocalTeamMembers();
        var item = null;
        for (var i = 0; i < members.length; i++) { if (members[i].id === id) { item = members[i]; break; } }
        if (!item) return;
        fillTeamForm(item);
      });
    }

    function fillTeamForm(item) {
      editingTeamMemberId = item.id;
      document.getElementById('team-form-name').value = item.name;
      document.getElementById('team-form-position').value = item.position || '';
      document.getElementById('team-form-avatar').value = item.avatarIcon || '&#128100;';
      document.getElementById('team-form-roleclass').value = item.roleClass || 'role-placeholder';
      document.getElementById('team-form-description').value = item.description || '';
      document.getElementById('team-form-order').value = item.displayOrder || 0;
      document.getElementById('team-form-msg').textContent = 'Đang sửa: ' + item.name + '. Nhấn "Cập nhật" để lưu.';
      document.getElementById('team-form-msg').style.color = 'var(--accent)';

      var addBtn = document.getElementById('team-form-add-btn');
      addBtn.innerHTML = '&#10003; Cập nhật';
      addBtn.onclick = function() {
        updateTeamMember(item.id);
      };
    }

    async function updateTeamMember(id) {
      var name = document.getElementById('team-form-name').value.trim();
      var position = document.getElementById('team-form-position').value.trim();
      var avatarIcon = document.getElementById('team-form-avatar').value;
      var roleClass = document.getElementById('team-form-roleclass').value;
      var description = document.getElementById('team-form-description').value.trim();
      var displayOrder = parseInt(document.getElementById('team-form-order').value) || 0;
      var msg = document.getElementById('team-form-msg');

      if (!name) {
        msg.textContent = 'Vui lòng nhập tên thành viên.';
        msg.style.color = 'var(--danger)';
        return;
      }

      try {
        await api('/api/team-members/' + id, {
          method: 'PUT',
          body: JSON.stringify({
            name: name,
            position: position,
            role: roleClass === 'role-director' ? 'DIRECTOR' :
                  roleClass === 'role-it' ? 'IT' :
                  roleClass === 'role-accounting' ? 'ACCOUNTING' :
                  roleClass === 'role-executor' ? 'EMPLOYEE' : 'EMPLOYEE',
            description: description,
            avatarIcon: avatarIcon,
            roleClass: roleClass,
            displayOrder: displayOrder
          })
        });
        msg.textContent = 'Đã cập nhật!';
        msg.style.color = 'var(--accent2)';
        resetTeamForm();
        renderTeamManagerList();
        loadTeamMembers();
      } catch (err) {
        // Fallback to localStorage
        var members = getLocalTeamMembers();
        for (var i = 0; i < members.length; i++) {
          if (members[i].id === id) {
            members[i].name = name;
            members[i].position = position;
            members[i].avatarIcon = avatarIcon;
            members[i].roleClass = roleClass;
            members[i].description = description;
            members[i].displayOrder = displayOrder;
            break;
          }
        }
        saveLocalTeamMembers(members);
        msg.textContent = 'Đã cập nhật (offline)!';
        msg.style.color = 'var(--accent2)';
        resetTeamForm();
        renderTeamManagerList();
        loadTeamMembers();
      }
    }

    function resetTeamForm() {
      editingTeamMemberId = null;
      document.getElementById('team-form-name').value = '';
      document.getElementById('team-form-position').value = '';
      document.getElementById('team-form-avatar').value = '&#128100;';
      document.getElementById('team-form-roleclass').value = 'role-placeholder';
      document.getElementById('team-form-description').value = '';
      document.getElementById('team-form-order').value = '0';
      var addBtn = document.getElementById('team-form-add-btn');
      addBtn.innerHTML = '+ Thêm thành viên';
      addBtn.onclick = addTeamMember;
    }

    async function deleteTeamMember(id) {
      if (!confirm('Xóa thành viên này?')) return;
      try {
        await api('/api/team-members/' + id, { method: 'DELETE' });
        renderTeamManagerList();
        loadTeamMembers();
      } catch (err) {
        // Fallback to localStorage
        var members = getLocalTeamMembers();
        members = members.filter(function(m) { return m.id !== id; });
        saveLocalTeamMembers(members);
        renderTeamManagerList();
        loadTeamMembers();
      }
    }

    // === Document Repository Data (with 3 Categories: Group, Fund, VPS + Role-Based Access) ===
    var DOC_GROUPS_KEY = "private_doc_groups";

    // Full-access roles: ADMIN, DIRECTOR, IT, ACCOUNTING, LEADER — can see ALL items
    // NOTE: do NOT redeclare here (already declared at top with LEADER). Remove duplicate.
    // Group roles (GROUP1/2/3, FUND1) only see their own group docs + VPS + Profile items they are granted.

    function getDefaultDocItems() {
      return [
        { id: "d1", name: "Nhóm A", link: "https://drive.google.com/drive/folders/1", category: "Group", visibleRoles: ["ADMIN", "DIRECTOR", "IT", "ACCOUNTING", "LEADER", "EMPLOYEE", "IMPLEMENTATION"] },
        { id: "d2", name: "Nhóm B", link: "https://drive.google.com/drive/folders/2", category: "Group", visibleRoles: ["ADMIN", "DIRECTOR", "IT", "ACCOUNTING", "LEADER", "EMPLOYEE"] },
        { id: "d3", name: "Nhóm C", link: "https://drive.google.com/drive/folders/3", category: "Group", visibleRoles: ["ADMIN", "DIRECTOR", "IT", "ACCOUNTING", "LEADER"] },
        { id: "d4", name: "Quỹ ABC", link: "https://drive.google.com/drive/folders/4", category: "Fund", visibleRoles: ["ADMIN", "DIRECTOR", "IT", "ACCOUNTING", "LEADER"] },
        { id: "d5", name: "Quỹ XYZ", link: "https://drive.google.com/drive/folders/5", category: "Fund", visibleRoles: ["ADMIN", "DIRECTOR", "IT", "ACCOUNTING"] },
        { id: "d6", name: "VPS Server 1", link: "https://drive.google.com/drive/folders/6", category: "VPS", visibleRoles: ["ADMIN", "DIRECTOR", "IT", "ACCOUNTING"] },
        { id: "d7", name: "VPS Server 2", link: "https://drive.google.com/drive/folders/7", category: "VPS", visibleRoles: ["ADMIN", "DIRECTOR", "IT"] },
        { id: "d8", name: "Profile Mẫu A", link: "https://drive.google.com/drive/folders/8", category: "Profile", visibleRoles: ["ADMIN", "DIRECTOR", "IT", "ACCOUNTING", "LEADER", "EMPLOYEE", "IMPLEMENTATION"] },
        { id: "d9", name: "Profile Mẫu B", link: "https://drive.google.com/drive/folders/9", category: "Profile", visibleRoles: ["ADMIN", "DIRECTOR", "IT", "ACCOUNTING"] }
      ];
    }

    function getDocItems() {
      var stored = localStorage.getItem(DOC_GROUPS_KEY);
      if (stored) {
        try { return JSON.parse(stored); } catch(e) {}
      }
      var defaults = getDefaultDocItems();
      localStorage.setItem(DOC_GROUPS_KEY, JSON.stringify(defaults));
      return defaults;
    }

    function saveDocItems(items) {
      localStorage.setItem(DOC_GROUPS_KEY, JSON.stringify(items));
    }

    function getRolesFromCheckboxes() {
      var cbs = document.querySelectorAll('.doc-role-cb');
      var roles = [];
      for (var i = 0; i < cbs.length; i++) {
        if (cbs[i].checked) roles.push(cbs[i].value);
      }
      return roles;
    }

    function setRoleCheckboxes(roles) {
      var cbs = document.querySelectorAll('.doc-role-cb');
      for (var i = 0; i < cbs.length; i++) {
        cbs[i].checked = roles.indexOf(cbs[i].value) !== -1;
      }
    }

    // Check if current user can see an item based on their role
    function canUserSeeItem(item, userRole) {
      if (!userRole) return false;
      // Full-access roles see everything
      if (FULL_ACCESS_ROLES.indexOf(userRole) !== -1) return true;
      // For Leader, Employee (Thực Thi), Implementation — check visibleRoles
      if (item.visibleRoles && item.visibleRoles.length > 0) {
        return item.visibleRoles.indexOf(userRole) !== -1;
      }
      return false;
    }

    // Build dropdown menu from grouped items (with role filtering)
    function buildDropdownMenu() {
      var menu = document.getElementById('doc-repo-menu');
      if (!menu) return;
      var user = getUser();
      var userRole = user ? user.role : null;
      var items = getDocItems();
      // Filter items by user role
      var filtered = [];
      for (var fi = 0; fi < items.length; fi++) {
        if (canUserSeeItem(items[fi], userRole)) {
          filtered.push(items[fi]);
        }
      }
      // Group by category (Group, Fund, VPS, Profile)
      var categoryOrder = ["Group", "Fund", "VPS", "Profile"];
      var groups = {};
      for (var i = 0; i < filtered.length; i++) {
        var cat = filtered[i].category || "Group";
        if (!groups[cat]) groups[cat] = [];
        groups[cat].push(filtered[i]);
      }
      var html = '';
      var isAdmin = userRole === 'ADMIN';
      for (var ci = 0; ci < categoryOrder.length; ci++) {
        var catName = categoryOrder[ci];
        var catItems = groups[catName];
        if (!catItems || catItems.length === 0) continue;
        html += '<span class="group-label">' + catName + '</span>';
        for (var ii = 0; ii < catItems.length; ii++) {
          var it = catItems[ii];
          html += '<a href="' + it.link + '" target="_blank" rel="noopener noreferrer">' +
                  '<span class="gdrive-icon">&#128196;</span> ' + it.name;
          // Show delete button only for admins
          if (isAdmin) {
            html += '<button class="delete-item" onclick="event.preventDefault();event.stopPropagation();deleteDocItem(\'' + it.id + '\')" title="Xóa">&times;</button>';
          }
          html += '</a>';
        }
      }
      if (filtered.length === 0) {
        html = '<div style="text-align:center;padding:20px;color:var(--muted);font-size:13px">Bạn chưa được cấp quyền xem mục nào.</div>';
      }
      // Show manage link only for admins
      if (isAdmin) {
        html += '<div class="manage-link" onclick="event.preventDefault();openDocManager()">&#9881; Quản lý danh mục</div>';
      }
      menu.innerHTML = html;
    }

    // Delete a document item
    function deleteDocItem(id) {
      if (!confirm('Xóa mục tài liệu này?')) return;
      var items = getDocItems();
      items = items.filter(function(it) { return it.id !== id; });
      saveDocItems(items);
      buildDropdownMenu();
    }

    // Delete a document item from the manager modal
    function deleteDocItemFromManager(id) {
      if (!confirm('Xóa mục tài liệu này?')) return;
      var items = getDocItems();
      items = items.filter(function(it) { return it.id !== id; });
      saveDocItems(items);
      renderDocManagerList();
      buildDropdownMenu();
    }

    // Open Doc Manager
    function openDocManager() {
      var overlay = document.getElementById('doc-manager-overlay');
      if (overlay) {
        overlay.classList.add('active');
        renderDocManagerList();
        document.getElementById('doc-form-name').value = '';
        document.getElementById('doc-form-link').value = '';
        document.getElementById('doc-form-category').value = 'Group';
        // Reset roles: by default check full-access roles
        setRoleCheckboxes(["ADMIN", "DIRECTOR", "IT", "ACCOUNTING"]);
        document.getElementById('doc-form-msg').textContent = '';
      }
    }

    function closeDocManager() {
      var overlay = document.getElementById('doc-manager-overlay');
      if (overlay) overlay.classList.remove('active');
    }

    // Render items in the manager
    function renderDocManagerList() {
      var container = document.getElementById('doc-manager-list');
      if (!container) return;
      var items = getDocItems();
      if (items.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:20px;color:var(--muted)">Chưa có mục nào. Thêm mới bên dưới.</div>';
        return;
      }
      var html = '';
      for (var i = 0; i < items.length; i++) {
        var it = items[i];
        var rolesStr = (it.visibleRoles && it.visibleRoles.length > 0) ? it.visibleRoles.join(', ') : 'Tất cả';
        html += '<div class="doc-item-row">' +
                '<div class="item-info">' +
                '<div class="item-name">' + it.name + '</div>' +
                '<div class="item-group">' + (it.category || 'Group') + ' | Vai trò: ' + rolesStr + '</div>' +
                '<div class="item-link">' + it.link + '</div>' +
                '</div>' +
                '<div class="item-actions">' +
                '<button class="edit-btn" onclick="editDocItem(\'' + it.id + '\')">&#9998;</button>' +
                '<button class="del-btn" onclick="deleteDocItemFromManager(\'' + it.id + '\')">&#10005;</button>' +
                '</div>' +
                '</div>';
      }
      container.innerHTML = html;
    }

    // Add a new document item
    function addDocItem() {
      var name = document.getElementById('doc-form-name').value.trim();
      var link = document.getElementById('doc-form-link').value.trim();
      var category = document.getElementById('doc-form-category').value;
      var visibleRoles = getRolesFromCheckboxes();
      var msg = document.getElementById('doc-form-msg');
      if (!name || !link) {
        msg.textContent = 'Vui lòng nhập tên và link.';
        msg.style.color = 'var(--danger)';
        return;
      }
      if (visibleRoles.length === 0) {
        msg.textContent = 'Vui lòng chọn ít nhất một vai trò được xem.';
        msg.style.color = 'var(--danger)';
        return;
      }
      var items = getDocItems();
      var newId = 'd' + Date.now();
      items.push({ id: newId, name: name, link: link, category: category, visibleRoles: visibleRoles });
      saveDocItems(items);
      document.getElementById('doc-form-name').value = '';
      document.getElementById('doc-form-link').value = '';
      msg.textContent = 'Đã thêm mục thành công!';
      msg.style.color = 'var(--accent2)';
      renderDocManagerList();
      buildDropdownMenu();
    }

    // Edit a document item (pre-fill form and scroll)
    function editDocItem(id) {
      var items = getDocItems();
      var item = null;
      for (var i = 0; i < items.length; i++) {
        if (items[i].id === id) { item = items[i]; break; }
      }
      if (!item) return;
      document.getElementById('doc-form-name').value = item.name;
      document.getElementById('doc-form-link').value = item.link;
      document.getElementById('doc-form-category').value = item.category || 'Group';
      setRoleCheckboxes(item.visibleRoles || ["ADMIN", "DIRECTOR", "IT", "ACCOUNTING"]);
      document.getElementById('doc-form-msg').textContent = 'Đang sửa: ' + item.name + '. Nhấn "Cập nhật" để lưu.';
      document.getElementById('doc-form-msg').style.color = 'var(--accent)';

      // Override add button temporarily
      var addBtn = document.getElementById('doc-form-add-btn');
      addBtn.innerHTML = '&#10003; Cập nhật';
      addBtn.onclick = function() {
        var newName = document.getElementById('doc-form-name').value.trim();
        var newLink = document.getElementById('doc-form-link').value.trim();
        var newCategory = document.getElementById('doc-form-category').value;
        var newRoles = getRolesFromCheckboxes();
        if (!newName || !newLink) {
          document.getElementById('doc-form-msg').textContent = 'Vui lòng nhập tên và link.';
          document.getElementById('doc-form-msg').style.color = 'var(--danger)';
          return;
        }
        if (newRoles.length === 0) {
          document.getElementById('doc-form-msg').textContent = 'Vui lòng chọn ít nhất một vai trò.';
          document.getElementById('doc-form-msg').style.color = 'var(--danger)';
          return;
        }
        items = getDocItems();
        for (var j = 0; j < items.length; j++) {
          if (items[j].id === id) {
            items[j].name = newName;
            items[j].link = newLink;
            items[j].category = newCategory;
            items[j].visibleRoles = newRoles;
            break;
          }
        }
        saveDocItems(items);
        document.getElementById('doc-form-name').value = '';
        document.getElementById('doc-form-link').value = '';
        document.getElementById('doc-form-msg').textContent = 'Đã cập nhật!';

        addBtn.innerHTML = '+ Thêm mục';
        addBtn.onclick = addDocItem;
        renderDocManagerList();
        buildDropdownMenu();
      };
    }

    function closeMemberModal(event) {
      var overlay = document.getElementById('member-modal');
      if (!event || event.target === overlay) {
        overlay.classList.remove('active');
      }
    }

    // === Toggle Dropdown ===
    function toggleDropdown(event) {
      event.stopPropagation();
      var btn = event.currentTarget;
      var menu = document.getElementById('doc-repo-menu');
      var isOpen = menu.classList.contains('show');
      // Close all other dropdowns first
      document.querySelectorAll('.dropdown-content.show').forEach(function(m) {
        m.classList.remove('show');
      });
      document.querySelectorAll('.dropbtn.active').forEach(function(b) {
        b.classList.remove('active');
        b.setAttribute('aria-expanded', 'false');
      });
      if (!isOpen) {
        menu.classList.add('show');
        btn.classList.add('active');
        btn.setAttribute('aria-expanded', 'true');
      }
    }

    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
      if (!e.target.closest('.dropdown')) {
        document.querySelectorAll('.dropdown-content.show').forEach(function(m) {
          m.classList.remove('show');
        });
        document.querySelectorAll('.dropbtn.active').forEach(function(b) {
          b.classList.remove('active');
          b.setAttribute('aria-expanded', 'false');
        });
      }
    });

    // Build the dropdown menu on page load
    buildDropdownMenu();

    // === Notification System (using backend API) ===
    var NOTIF_KEY = "private_notifications";
    var notifPollInterval = null;
    var lastNotifCount = 0;

    function getStoredNotifs() {
      try { return JSON.parse(localStorage.getItem(NOTIF_KEY)) || []; } catch(e) { return []; }
    }
    function saveStoredNotifs(notifs) {
      localStorage.setItem(NOTIF_KEY, JSON.stringify(notifs));
    }

    function addNotification(title, msg) {
      var notifs = getStoredNotifs();
      notifs.unshift({ id: Date.now(), title: title, msg: msg, time: new Date().toISOString(), read: false });
      if (notifs.length > 50) notifs = notifs.slice(0, 50);
      saveStoredNotifs(notifs);
      updateNotifUI();
    }

    function updateNotifUI() {
      var notifs = getStoredNotifs();
      var badge = document.getElementById('notif-badge');
      var list = document.getElementById('notif-list');
      if (!badge || !list) return;
      var unread = notifs.filter(function(n) { return !n.read; }).length;
      if (unread > 0) {
        badge.textContent = unread;
        badge.classList.add('show');
      } else {
        badge.classList.remove('show');
      }
      if (notifs.length === 0) {
        list.innerHTML = '<div class="notif-empty">No notifications</div>';
        return;
      }
      var html = '';
      for (var i = 0; i < notifs.length; i++) {
        var n = notifs[i];
        var cls = n.read ? '' : 'unread';
        html += '<div class="notif-item ' + cls + '" onclick="markNotifRead(' + n.id + ')">' +
                '<div class="notif-title">' + n.title + '</div>' +
                '<div class="notif-msg">' + n.msg + '</div>' +
                '<div class="notif-time">' + new Date(n.time).toLocaleString() + '</div>' +
                '</div>';
      }
      list.innerHTML = html;
    }

    function markNotifRead(id) {
      var notifs = getStoredNotifs();
      for (var i = 0; i < notifs.length; i++) {
        if (notifs[i].id === id) { notifs[i].read = true; break; }
      }
      saveStoredNotifs(notifs);
      updateNotifUI();
    }

    function markAllNotifsRead() {
      var notifs = getStoredNotifs();
      for (var i = 0; i < notifs.length; i++) notifs[i].read = true;
      saveStoredNotifs(notifs);
      updateNotifUI();
    }

    function toggleNotifPanel(event) {
      event.stopPropagation();
      var panel = document.getElementById('notif-panel');
      panel.classList.toggle('show');
    }

    // Close notification panel when clicking outside
    document.addEventListener('click', function(e) {
      if (!e.target.closest('.notif-bell') && !e.target.closest('.notif-panel')) {
        var panel = document.getElementById('notif-panel');
        if (panel) panel.classList.remove('show');
      }
    });

    // Poll for notifications from backend
    function startNotifPolling() {
      if (notifPollInterval) clearInterval(notifPollInterval);
      notifPollInterval = setInterval(function() {
        var user = getUser();
        if (!user || !getToken()) return;
        // Check for new pending registrations via pending-count
        if (user.role === 'ADMIN') {
          api('/api/admin/pending-count').then(function(result) {
            if (result.count > 0 && result.count > lastNotifCount) {
              addNotification('New Registration', result.count + ' user(s) pending approval.');
            }
            lastNotifCount = result.count;
          }).catch(function(){});
        }
        // Check for new chat messages
        api('/api/chat/messages?limit=1').then(function(messages) {
          if (messages && messages.length > 0) {
            var latest = messages[messages.length - 1];
            if (latest.senderId !== user.id) {
              // Check if we already have a notification for this message
              var existing = getStoredNotifs();
              var found = false;
              for (var i = 0; i < existing.length; i++) {
                if (existing[i].title === 'New Chat Message' && existing[i].msg.indexOf(latest.content.substring(0,20)) >= 0) {
                  found = true; break;
                }
              }
              if (!found) {
                addNotification('New Chat Message', latest.senderName + ': ' + latest.content.substring(0, 80));
              }
            }
          }
        }).catch(function(){});
      }, 10000);
    }

    // === Private Chat Functions ===
    var privateChatPollInterval = null;
    var privateChatUserId = null; // Current conversation partner ID

    function togglePrivateChat() {
      var area = document.getElementById('private-chat-area');
      var toggle = document.getElementById('private-chat-toggle');
      if (area.style.display === 'block') {
        area.style.display = 'none';
        toggle.innerHTML = '&#128172;<span class="badge" id="private-chat-badge">0</span>';
        if (privateChatPollInterval) { clearInterval(privateChatPollInterval); privateChatPollInterval = null; }
      } else {
        area.style.display = 'block';
        toggle.innerHTML = '&#10005;<span class="badge" id="private-chat-badge" style="display:none">0</span>';
        showPrivateConversations();
        if (privateChatPollInterval) clearInterval(privateChatPollInterval);
        privateChatPollInterval = setInterval(loadPrivateConversations, 5000);
      }
    }

    function showPrivateConversations() {
      privateChatUserId = null;
      document.getElementById('private-chat-back').style.display = 'none';
      document.getElementById('private-chat-title').textContent = '\u{1F4AC} Private Messages';
      document.getElementById('private-chat-conversations').style.display = 'block';
      document.getElementById('private-chat-messages').style.display = 'none';
      loadPrivateConversations();
    }

    async function loadPrivateConversations() {
      var container = document.getElementById('private-chat-conversations');
      if (!container) return;
      try {
        var convs = await api('/api/chat/conversations');
        var user = getUser();
        var html = '';
        for (var i = 0; i < convs.length; i++) {
          var c = convs[i];
          var otherUser = c.participants.find(function(p) { return p.id !== user.id; }) || c.participants[0];
          var avatarLetter = otherUser ? otherUser.name.charAt(0).toUpperCase() : '?';
          var unreadCount = c.unreadCount || 0;
          var lastMsg = c.lastMessage ? c.lastMessage.content : 'No messages yet';
          var unreadClass = unreadCount > 0 ? 'show' : '';
          html += '<div class="conv-item" onclick="openPrivateChat(' + otherUser.id + ',\'' + otherUser.name + '\')">' +
                  '<div class="conv-avatar">' + avatarLetter + '</div>' +
                  '<div class="conv-info">' +
                  '<div class="conv-name">' + (otherUser ? otherUser.name : 'Unknown') + ' <span style="font-size:11px;color:var(--muted);opacity:.7">(' + (otherUser ? otherUser.role : '') + ')</span></div>' +
                  '<div class="conv-preview">' + lastMsg + '</div>' +
                  '</div>' +
                  '<div class="conv-unread ' + unreadClass + '">' + (unreadCount > 0 ? unreadCount : '') + '</div>' +
                  '</div>';
        }
        if (convs.length === 0) {
          html = '<div style="text-align:center;padding:30px;color:var(--muted);font-size:13px">No conversations yet.<br/><span style="font-size:11px">Send a message to start chatting.</span></div>';
        }
        container.innerHTML = html;
      } catch (e) {
        // silently ignore
      }
    }

    var privateChatUserMap = {};

    function openPrivateChat(userId, userName) {
      privateChatUserId = userId;
      document.getElementById('private-chat-back').style.display = 'inline-block';
      document.getElementById('private-chat-title').textContent = '\u{1F4AC} ' + userName;
      document.getElementById('private-chat-conversations').style.display = 'none';
      document.getElementById('private-chat-messages').style.display = 'block';
      loadPrivateMessages();
      if (privateChatPollInterval) clearInterval(privateChatPollInterval);
      privateChatPollInterval = setInterval(loadPrivateMessages, 3000);
    }

    async function loadPrivateMessages() {
      if (!privateChatUserId) return;
      var msgsContainer = document.getElementById('private-chat-msgs');
      if (!msgsContainer) return;
      try {
        var messages = await api('/api/chat/private/' + privateChatUserId);
        var user = getUser();
        var html = '';
        for (var i = 0; i < messages.length; i++) {
          var m = messages[i];
          var isOwn = (m.senderId === user.id);
          var cls = isOwn ? 'own' : 'other';
          html += '<div class="msg ' + cls + '">';
          html += '<div>' + m.content + '</div>';
          html += '<div class="meta">' + m.senderName + ' &middot; ' + new Date(m.createdAt).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}) + '</div>';
          html += '</div>';
        }
        if (messages.length === 0) {
          html = '<div style="text-align:center;color:var(--muted);padding:20px;font-size:13px">No messages yet. Say hello!</div>';
        }
        msgsContainer.innerHTML = html;
        msgsContainer.scrollTop = msgsContainer.scrollHeight;
      } catch (e) {
        // silently ignore
      }
    }

    async function sendPrivateMsg() {
      var input = document.getElementById('private-chat-input');
      var content = input.value.trim();
      if (!content || !privateChatUserId) return;
      input.value = '';
      try {
        await api('/api/chat/private/' + privateChatUserId, {
          method: 'POST',
          body: JSON.stringify({ content: content })
        });
        loadPrivateMessages();
      } catch (err) {
        alert('Error sending message: ' + err.message);
      }
    }

    // === Enhance checkAuthState with notifications and private chat ===
    var origCheckAuthState2 = checkAuthState;
    checkAuthState = function() {
      origCheckAuthState2();
      var user = getUser();
      var token = getToken();

      // Show/hide notification bell based on auth
      var notifBell = document.getElementById('notif-bell');
      var notifPanel = document.getElementById('notif-panel');
      if (user && token) {
        if (notifBell) notifBell.style.display = 'inline-flex';
        updateNotifUI();
        startNotifPolling();
      } else {
        if (notifBell) notifBell.style.display = 'none';
        if (notifPanel) notifPanel.classList.remove('show');
        if (notifPollInterval) { clearInterval(notifPollInterval); notifPollInterval = null; }
      }

      // Show/hide private chat
      var privateChatToggle = document.getElementById('private-chat-toggle');
      var privateChatArea = document.getElementById('private-chat-area');
      if (user && token && (user.status === 'APPROVED' || user.role === 'ADMIN')) {
        privateChatToggle.style.display = 'block';
      } else {
        privateChatToggle.style.display = 'none';
        privateChatArea.style.display = 'none';
        if (privateChatPollInterval) { clearInterval(privateChatPollInterval); privateChatPollInterval = null; }
      }

// Show/hide document repo manage link based on admin/role
      buildDropdownMenu();

      // Show/hide team manage button based on admin role
      var teamManageBtn = document.getElementById('team-manage-btn');
      if (teamManageBtn) {
        if (user && user.role === 'ADMIN') {
          teamManageBtn.style.display = 'inline-flex';
        } else {
          teamManageBtn.style.display = 'none';
        }
      }
    };

    // Override showPage to load team members / reports when their page is shown
    var origShowPage = showPage;
    showPage = function(pageId) {
      origShowPage(pageId);
      if (pageId === 'team') {
        loadTeamMembers();
      }
      if (pageId === 'reports') {
        loadReports();
      }
    };
