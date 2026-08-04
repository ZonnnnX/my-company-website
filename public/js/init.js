// === Init ===
    document.getElementById('year').textContent = new Date().getFullYear();
    updateNotifUI();
    checkAuthState();
    // Apply saved site content on page load
    let siteContent = getSiteContent();
    applySiteContentToUI(siteContent);