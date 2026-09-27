// ========================================
// Kangra Dham Express - Main JavaScript
// ========================================

document.addEventListener('DOMContentLoaded', async function() {
    if (window.menuDataReady) await window.menuDataReady;

    const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, character => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
    })[character]);
    const safeImageUrl = value => {
        try {
            const url = new URL(value);
            return url.protocol === 'https:' ? escapeHTML(url.href) : '';
        } catch {
            return '';
        }
    };
    // Mobile Navigation Toggle
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');

    if (navToggle && navMenu) {
        navToggle.addEventListener('click', function() {
            navToggle.classList.toggle('active');
            navMenu.classList.toggle('active');
            navToggle.setAttribute('aria-expanded', String(navMenu.classList.contains('active')));
        });

        navMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navToggle.classList.remove('active');
                navMenu.classList.remove('active');
                navToggle.setAttribute('aria-expanded', 'false');
            });
        });
        document.addEventListener('keydown', event => {
            if (event.key === 'Escape' && navMenu.classList.contains('active')) {
                navToggle.classList.remove('active');
                navMenu.classList.remove('active');
                navToggle.setAttribute('aria-expanded', 'false');
                navToggle.focus();
            }
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
                    <span class="dish-emoji">${escapeHTML(today.emoji)}</span>
                    <div class="dish-info">
                        <span class="dish-label">Today's Madra</span>
                        <h3>${escapeHTML(today.madra)}</h3>
                    </div>
                </div>
                <div class="todays-dish">
                    <span class="dish-emoji">🍋</span>
                    <div class="dish-info">
                        <span class="dish-label">Today's Khatta / Secondary</span>
                        <h3>${escapeHTML(today.khatta)}</h3>
                    </div>
                </div>
            </div>
            <div class="todays-meta">
                <span class="todays-price">${escapeHTML(today.price)}</span>
                <span class="todays-note">${escapeHTML(today.note)}</span>
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
                        <span class="week-day-name">${escapeHTML(item.dayShort)}</span>
                        ${isToday ? '<span class="today-tag">TODAY</span>' : ''}
                    </div>
                    <span class="week-day-emoji">${escapeHTML(item.emoji)}</span>
                    <p class="week-day-dish">${escapeHTML(item.madra.split('(')[0].trim())}</p>
                    <span class="week-day-price">${escapeHTML(item.price)}</span>
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
        const requestedDay = Number(new URLSearchParams(location.search).get('day'));
        const selectedDay = Number.isInteger(requestedDay) && requestedDay >= 0 && requestedDay <= 6
            ? requestedDay
            : currentDay;
        
        // Build calendar tabs
        const order = [1, 2, 3, 4, 5, 6, 0];
        let tabsHtml = '';
        order.forEach(i => {
            const item = MENU_DATA.daily[i];
            const isToday = i === currentDay;
            tabsHtml += `
                <button type="button" class="menu-day-tab ${i === selectedDay ? 'active' : ''}" data-day="${i}" aria-pressed="${i === selectedDay}">
                    <span class="tab-day">${escapeHTML(item.dayShort)}</span>
                    <span class="tab-emoji">${escapeHTML(item.emoji)}</span>
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
                    ${safeImageUrl(item.image) ? `<div class="menu-detail-image"><img src="${safeImageUrl(item.image)}" alt="${escapeHTML(item.title || item.day + ' Dham')}" width="800" height="500" loading="lazy"></div>` : ''}
                    <div class="menu-detail-header">
                        <h3>${escapeHTML(item.emoji)} ${escapeHTML(item.title || item.day + "'s Dham")}</h3>
                        <span class="detail-day-label">${escapeHTML(item.day)}</span>
                        ${isToday ? '<span class="live-badge">🔴 TODAY</span>' : ''}
                        <span class="detail-price">${escapeHTML(item.price)}</span>
                    </div>
                    <div class="menu-detail-body">
                        <div class="detail-dish">
                            <span class="detail-label">Hero Madra (Rich & Yogurt-Based)</span>
                            <p class="detail-name">${escapeHTML(item.madra)}</p>
                        </div>
                        <div class="detail-dish">
                            <span class="detail-label">Secondary Curry / Khatta</span>
                            <p class="detail-name">${escapeHTML(item.khatta)}</p>
                        </div>
                        <div class="detail-note">
                            <i class="fas fa-info-circle" aria-hidden="true"></i> ${escapeHTML(item.note)}
                        </div>
                    </div>
                    <div class="menu-detail-fixed">
                        <h4>Also Included in Your Thali:</h4>
                        <ul>
                            ${MENU_DATA.fixedItems.map(f => `<li>✓ ${escapeHTML(f)}</li>`).join('')}
                        </ul>
                    </div>
                </div>
            `;
        }

        // Initial render
        showDayDetail(selectedDay);

        // Tab click handlers
        menuCalendar.querySelectorAll('.menu-day-tab').forEach(tab => {
            tab.addEventListener('click', function() {
                menuCalendar.querySelectorAll('.menu-day-tab').forEach(t => t.classList.remove('active'));
                this.classList.add('active');
                menuCalendar.querySelectorAll('.menu-day-tab').forEach(t => t.setAttribute('aria-pressed', String(t === this)));
                const day = parseInt(this.dataset.day);
                const url = new URL(location.href);
                url.searchParams.set('day', day);
                history.replaceState({}, '', url);
                showDayDetail(day);
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
                <span class="side-item-emoji">${escapeHTML(item.emoji)}</span>
                <div class="side-item-info">
                    <h4>${escapeHTML(item.name)}</h4>
                    <p>${escapeHTML(item.desc)}</p>
                </div>
                <span class="side-item-price">${escapeHTML(item.price)}</span>
            </div>
        `).join('');
    }

    const retailGrid = document.getElementById('retailGrid');
    if (retailGrid && typeof MENU_DATA !== 'undefined') {
        retailGrid.innerHTML = MENU_DATA.retail.map(item => `
            <div class="retail-item-card">
                <span class="retail-item-emoji">${escapeHTML(item.emoji)}</span>
                <h4>${escapeHTML(item.name)}</h4>
                <p>${escapeHTML(item.desc)}</p>
                <div class="retail-item-meta">
                    <span>${escapeHTML(item.size)}</span>
                    <strong>${escapeHTML(item.price)}</strong>
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

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js').catch(() => {
            // The website remains fully usable when service workers are unavailable.
        });
    }
});
