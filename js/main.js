// ========================================
// Kangra Dham Express - Main JavaScript
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    // Mobile Navigation Toggle
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');

    if (navToggle && navMenu) {
        navToggle.addEventListener('click', function() {
            navToggle.classList.toggle('active');
            navMenu.classList.toggle('active');
        });

        navMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navToggle.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });
    }

    // Navbar scroll effect
    const navbar = document.getElementById('navbar');
    if (navbar) {
        window.addEventListener('scroll', function() {
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
    }

    // ========================================
    // TODAY'S MENU - Dynamic Banner (Homepage)
    // ========================================
    const todaysMenuContent = document.getElementById('todaysMenuContent');
    const todaysDate = document.getElementById('todaysDate');

    if (todaysMenuContent && typeof getTodaysMenu === 'function') {
        const today = getTodaysMenu();
        const now = new Date();
        const dateStr = now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
        
        if (todaysDate) {
            todaysDate.textContent = dateStr;
        }

        todaysMenuContent.innerHTML = `
            <div class="todays-dishes">
                <div class="todays-dish hero-dish">
                    <span class="dish-emoji">${today.emoji}</span>
                    <div class="dish-info">
                        <span class="dish-label">Today's Madra</span>
                        <h3>${today.madra}</h3>
                    </div>
                </div>
                <div class="todays-dish">
                    <span class="dish-emoji">🍋</span>
                    <div class="dish-info">
                        <span class="dish-label">Today's Khatta / Secondary</span>
                        <h3>${today.khatta}</h3>
                    </div>
                </div>
            </div>
            <div class="todays-meta">
                <span class="todays-price">${today.price}</span>
                <span class="todays-note">${today.note}</span>
            </div>
        `;
    }

    // ========================================
    // WEEK PREVIEW (Homepage)
    // ========================================
    const weekPreview = document.getElementById('weekPreview');
    if (weekPreview && typeof MENU_DATA !== 'undefined') {
        const currentDay = getCurrentMenuDay();
        let html = '';
        
        // Show Mon-Sun (1-6, 0)
        const order = [1, 2, 3, 4, 5, 6, 0];
        order.forEach(i => {
            const item = MENU_DATA.daily[i];
            const isToday = i === currentDay;
            html += `
                <div class="week-day-card ${isToday ? 'today' : ''} ${item.highlight ? 'special' : ''}">
                    <div class="week-day-header">
                        <span class="week-day-name">${item.dayShort}</span>
                        ${isToday ? '<span class="today-tag">TODAY</span>' : ''}
                    </div>
                    <span class="week-day-emoji">${item.emoji}</span>
                    <p class="week-day-dish">${item.madra.split('(')[0].trim()}</p>
                    <span class="week-day-price">${item.price}</span>
                </div>
            `;
        });
        weekPreview.innerHTML = html;
    }

    // ========================================
    // INTERACTIVE 7-DAY MENU SWITCHER (Menu Page)
    // ========================================
    const menuCalendar = document.getElementById('menuCalendar');
    const menuDetail = document.getElementById('menuDetail');

    if (menuCalendar && menuDetail && typeof MENU_DATA !== 'undefined') {
        const currentDay = getCurrentMenuDay();
        
        // Build calendar tabs
        const order = [1, 2, 3, 4, 5, 6, 0];
        let tabsHtml = '';
        order.forEach(i => {
            const item = MENU_DATA.daily[i];
            const isToday = i === currentDay;
            tabsHtml += `
                <button class="menu-day-tab ${isToday ? 'active' : ''}" data-day="${i}">
                    <span class="tab-day">${item.dayShort}</span>
                    <span class="tab-emoji">${item.emoji}</span>
                    ${isToday ? '<span class="tab-today">Today</span>' : ''}
                </button>
            `;
        });
        menuCalendar.innerHTML = tabsHtml;

        // Show detail for selected day
        function showDayDetail(dayIndex) {
            const item = MENU_DATA.daily[dayIndex];
            const isToday = dayIndex === currentDay;
            
            menuDetail.innerHTML = `
                <div class="menu-detail-card ${item.highlight ? 'premium' : ''}">
                    ${item.image ? `<div class="menu-detail-image"><img src="${item.image}" alt="${item.title || item.day + ' Dham'}" loading="lazy"></div>` : ''}
                    <div class="menu-detail-header">
                        <h3>${item.emoji} ${item.title || item.day + "'s Dham"}</h3>
                        <span class="detail-day-label">${item.day}</span>
                        ${isToday ? '<span class="live-badge">🔴 TODAY</span>' : ''}
                        <span class="detail-price">${item.price}</span>
                    </div>
                    <div class="menu-detail-body">
                        <div class="detail-dish">
                            <span class="detail-label">Hero Madra (Rich & Yogurt-Based)</span>
                            <p class="detail-name">${item.madra}</p>
                        </div>
                        <div class="detail-dish">
                            <span class="detail-label">Secondary Curry / Khatta</span>
                            <p class="detail-name">${item.khatta}</p>
                        </div>
                        <div class="detail-note">
                            <i class="fas fa-info-circle"></i> ${item.note}
                        </div>
                    </div>
                    <div class="menu-detail-fixed">
                        <h4>Also Included in Your Thali:</h4>
                        <ul>
                            ${MENU_DATA.fixedItems.map(f => `<li>✓ ${f}</li>`).join('')}
                        </ul>
                    </div>
                </div>
            `;
        }

        // Initial render
        showDayDetail(currentDay);

        // Tab click handlers
        menuCalendar.querySelectorAll('.menu-day-tab').forEach(tab => {
            tab.addEventListener('click', function() {
                menuCalendar.querySelectorAll('.menu-day-tab').forEach(t => t.classList.remove('active'));
                this.classList.add('active');
                showDayDetail(parseInt(this.dataset.day));
            });
        });
    }

    // ========================================
    // SIDE MENU & RETAIL RENDERING (Menu Page)
    // ========================================
    const sideMenuGrid = document.getElementById('sideMenuGrid');
    if (sideMenuGrid && typeof MENU_DATA !== 'undefined') {
        sideMenuGrid.innerHTML = MENU_DATA.sideMenu.map(item => `
            <div class="side-item-card">
                <span class="side-item-emoji">${item.emoji}</span>
                <div class="side-item-info">
                    <h4>${item.name}</h4>
                    <p>${item.desc}</p>
                </div>
                <span class="side-item-price">${item.price}</span>
            </div>
        `).join('');
    }

    const retailGrid = document.getElementById('retailGrid');
    if (retailGrid && typeof MENU_DATA !== 'undefined') {
        retailGrid.innerHTML = MENU_DATA.retail.map(item => `
            <div class="retail-item-card">
                <span class="retail-item-emoji">${item.emoji}</span>
                <h4>${item.name}</h4>
                <p>${item.desc}</p>
                <div class="retail-item-meta">
                    <span>${item.size}</span>
                    <strong>${item.price}</strong>
                </div>
            </div>
        `).join('');
    }

    // ========================================
    // Scroll animations
    // ========================================
    const animatedElements = document.querySelectorAll('[data-animate]');
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
    animatedElements.forEach(el => observer.observe(el));

    // ========================================
    // Form handling
    // ========================================
    ['contactForm', 'cateringForm'].forEach(formId => {
        const form = document.getElementById(formId);
        if (form) {
            form.addEventListener('submit', function(e) {
                e.preventDefault();
                const btn = form.querySelector('button[type="submit"]');
                const originalText = btn.textContent;
                btn.textContent = '✓ Sent Successfully!';
                btn.style.background = '#2E7D32';
                setTimeout(() => {
                    btn.textContent = originalText;
                    btn.style.background = '';
                    form.reset();
                }, 3000);
            });
        }
    });

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            const target = document.querySelector(targetId);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
});
