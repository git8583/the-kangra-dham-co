// The Kangra Dham Co. - Security Module
// XSS protection, form validation, rate limiting, CSP enforcement

(function() {
    'use strict';

    // ========================================
    // 1. INPUT SANITIZATION
    // ========================================
    const SecurityUtils = {
        // Sanitize HTML to prevent XSS
        sanitizeHTML(str) {
            const temp = document.createElement('div');
            temp.textContent = str;
            return temp.innerHTML;
        },

        // Validate email format
        isValidEmail(email) {
            return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
        },

        // Validate phone (Indian format)
        isValidPhone(phone) {
            const cleaned = phone.replace(/[\s\-\+\(\)]/g, '');
            return /^(91)?[6-9]\d{9}$/.test(cleaned);
        },

        // Validate name (no special characters that could be injection)
        isValidName(name) {
            return /^[a-zA-Z\s\u0900-\u097F\.',-]{2,100}$/.test(name);
        },

        // Strip dangerous patterns
        stripDangerous(str) {
            return str
                .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                .replace(/javascript:/gi, '')
                .replace(/on\w+\s*=/gi, '')
                .replace(/<iframe/gi, '')
                .replace(/<object/gi, '')
                .replace(/<embed/gi, '')
                .replace(/<form/gi, '');
        },

        // Limit string length
        truncate(str, maxLen) {
            return str.length > maxLen ? str.substring(0, maxLen) : str;
        }
    };

    // ========================================
    // 2. RATE LIMITING
    // ========================================
    const RateLimiter = {
        attempts: {},

        check(action, maxAttempts, windowMs) {
            const now = Date.now();
            if (!this.attempts[action]) {
                this.attempts[action] = [];
            }
            // Clean old entries
            this.attempts[action] = this.attempts[action].filter(t => now - t < windowMs);
            
            if (this.attempts[action].length >= maxAttempts) {
                return false; // Rate limited
            }
            this.attempts[action].push(now);
            return true;
        }
    };

    // ========================================
    // 3. FORM PROTECTION
    // ========================================
    function secureForm(form) {
        if (!form) return;

        // Add honeypot field (hidden from users, bots fill it)
        const honeypot = document.createElement('input');
        honeypot.type = 'text';
        honeypot.name = 'website_url_hp';
        honeypot.id = 'website_url_hp';
        honeypot.tabIndex = -1;
        honeypot.autocomplete = 'off';
        honeypot.style.cssText = 'position:absolute;left:-9999px;top:-9999px;height:0;width:0;overflow:hidden;';
        honeypot.setAttribute('aria-hidden', 'true');
        form.appendChild(honeypot);

        // Add timestamp (bot detection)
        const timestamp = document.createElement('input');
        timestamp.type = 'hidden';
        timestamp.name = '_form_loaded';
        timestamp.value = Date.now().toString();
        form.appendChild(timestamp);

        form.addEventListener('submit', function(e) {
            e.preventDefault();

            // Check honeypot (if filled, it's a bot)
            if (honeypot.value) {
                console.warn('Bot detected');
                return false;
            }

            // Check timestamp (form submitted too quickly = bot)
            const loadTime = parseInt(timestamp.value);
            if (Date.now() - loadTime < 3000) {
                alert('Please wait a moment before submitting.');
                return false;
            }

            // Rate limit: max 3 submissions per 5 minutes
            if (!RateLimiter.check('form_submit', 3, 300000)) {
                alert('Too many submissions. Please wait a few minutes and try again.');
                return false;
            }

            // Validate all required fields
            const errors = [];
            const nameField = form.querySelector('#name, [name="name"]');
            const emailField = form.querySelector('#email, [name="email"]');
            const phoneField = form.querySelector('#phone, [name="phone"]');
            const messageField = form.querySelector('#message, [name="message"], textarea');

            if (nameField && nameField.value) {
                const cleanName = SecurityUtils.truncate(nameField.value.trim(), 100);
                if (!SecurityUtils.isValidName(cleanName)) {
                    errors.push('Please enter a valid name (letters only, 2-100 characters).');
                }
                nameField.value = SecurityUtils.sanitizeHTML(cleanName);
            }

            if (emailField && emailField.value) {
                const cleanEmail = SecurityUtils.truncate(emailField.value.trim(), 254);
                if (!SecurityUtils.isValidEmail(cleanEmail)) {
                    errors.push('Please enter a valid email address.');
                }
                emailField.value = SecurityUtils.sanitizeHTML(cleanEmail);
            }

            if (phoneField && phoneField.value) {
                const cleanPhone = SecurityUtils.truncate(phoneField.value.trim(), 15);
                if (!SecurityUtils.isValidPhone(cleanPhone)) {
                    errors.push('Please enter a valid Indian phone number.');
                }
            }

            if (messageField && messageField.value) {
                messageField.value = SecurityUtils.stripDangerous(
                    SecurityUtils.truncate(messageField.value.trim(), 2000)
                );
            }

            if (errors.length > 0) {
                alert('Please fix the following:\n\n' + errors.join('\n'));
                return false;
            }

            // Form is valid — show success
            const btn = form.querySelector('button[type="submit"]');
            const originalText = btn.textContent;
            btn.textContent = '✓ Sent!';
            btn.disabled = true;
            btn.style.background = '#2C5E3B';

            // Send via WhatsApp as fallback (no backend)
            const formData = new FormData(form);
            const name = formData.get('name') || 'Guest';
            const subject = formData.get('subject') || 'General';
            const message = formData.get('message') || '';
            const phone = formData.get('phone') || '';
            
            const waText = encodeURIComponent(
                `New Website Enquiry:\nName: ${name}\nSubject: ${subject}\nPhone: ${phone}\nMessage: ${message}`
            );
            
            // Open WhatsApp with form data
            setTimeout(() => {
                window.open(`https://wa.me/917011376087?text=${waText}`, '_blank');
                form.reset();
                btn.textContent = originalText;
                btn.disabled = false;
                btn.style.background = '';
            }, 1000);
        });
    }

    // ========================================
    // 4. ADMIN PANEL SECURITY
    // ========================================
    function secureAdminPanel() {
        const loginForm = document.getElementById('login-form');
        const passInput = document.getElementById('admin-pass');
        if (!loginForm || !passInput) return;

        // Rate limit login attempts
        let loginAttempts = parseInt(sessionStorage.getItem('admin_attempts') || '0');
        let lockoutUntil = parseInt(sessionStorage.getItem('admin_lockout') || '0');

        if (Date.now() < lockoutUntil) {
            const remaining = Math.ceil((lockoutUntil - Date.now()) / 1000);
            loginForm.innerHTML = `
                <div style="text-align:center; padding: 2rem;">
                    <h3 style="color: red;">🔒 Account Locked</h3>
                    <p>Too many failed attempts. Try again in <strong id="lockout-timer">${remaining}</strong> seconds.</p>
                </div>
            `;
            const timer = setInterval(() => {
                const rem = Math.ceil((lockoutUntil - Date.now()) / 1000);
                const el = document.getElementById('lockout-timer');
                if (el) el.textContent = rem;
                if (rem <= 0) { clearInterval(timer); location.reload(); }
            }, 1000);
            return;
        }

        // Override the login function with rate-limited version
        window.login = function() {
            if (!RateLimiter.check('admin_login', 5, 60000)) {
                loginAttempts = 5;
                sessionStorage.setItem('admin_attempts', '5');
                sessionStorage.setItem('admin_lockout', (Date.now() + 300000).toString());
                location.reload();
                return;
            }

            const pass = passInput.value;
            // Use hashed comparison instead of plaintext
            const hash = simpleHash(pass);
            if (hash === '1952643781') { // hash of 'kangra2026'
                sessionStorage.setItem('admin_authenticated', 'true');
                sessionStorage.setItem('admin_attempts', '0');
                document.getElementById('login-form').style.display = 'none';
                document.getElementById('admin-panel').classList.add('active');
                if (typeof initPanel === 'function') initPanel();
            } else {
                loginAttempts++;
                sessionStorage.setItem('admin_attempts', loginAttempts.toString());
                const errorEl = document.getElementById('login-error');
                if (errorEl) {
                    errorEl.style.display = 'block';
                    errorEl.textContent = `Incorrect password. ${5 - loginAttempts} attempts remaining.`;
                }
                if (loginAttempts >= 5) {
                    sessionStorage.setItem('admin_lockout', (Date.now() + 300000).toString());
                    location.reload();
                }
            }
        };

        // Check if already authenticated this session
        if (sessionStorage.getItem('admin_authenticated') === 'true') {
            document.getElementById('login-form').style.display = 'none';
            document.getElementById('admin-panel').classList.add('active');
            if (typeof initPanel === 'function') setTimeout(initPanel, 100);
        }
    }

    // Simple hash function for password (NOT cryptographic, but better than plaintext)
    function simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString();
    }

    // ========================================
    // 5. LINK SECURITY
    // ========================================
    function secureExternalLinks() {
        document.querySelectorAll('a[target="_blank"]').forEach(link => {
            // Prevent tabnabbing
            link.setAttribute('rel', 'noopener noreferrer');
        });
    }

    // ========================================
    // 6. CONTENT SECURITY POLICY (Meta tag)
    // ========================================
    function addCSPMeta() {
        if (document.querySelector('meta[http-equiv="Content-Security-Policy"]')) return;
        
        const meta = document.createElement('meta');
        meta.httpEquiv = 'Content-Security-Policy';
        meta.content = [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com",
            "font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com",
            "img-src 'self' data: https://upload.wikimedia.org https://images.pexels.com https://cdn.pixabay.com https://www.google-analytics.com",
            "frame-src https://www.google.com",
            "connect-src 'self' https://www.google-analytics.com https://www.googletagmanager.com"
        ].join('; ');
        document.head.prepend(meta);
    }

    // ========================================
    // 7. ADDITIONAL SECURITY HEADERS (Meta)
    // ========================================
    function addSecurityMeta() {
        // X-Content-Type-Options
        const noSniff = document.createElement('meta');
        noSniff.httpEquiv = 'X-Content-Type-Options';
        noSniff.content = 'nosniff';
        document.head.appendChild(noSniff);

        // Referrer Policy
        const referrer = document.createElement('meta');
        referrer.name = 'referrer';
        referrer.content = 'strict-origin-when-cross-origin';
        document.head.appendChild(referrer);

        // X-Frame-Options (prevent clickjacking)
        const xframe = document.createElement('meta');
        xframe.httpEquiv = 'X-Frame-Options';
        xframe.content = 'SAMEORIGIN';
        document.head.appendChild(xframe);
    }

    // ========================================
    // 8. DISABLE RIGHT-CLICK SOURCE VIEW (optional deterrent)
    // ========================================
    function addSourceProtection() {
        // Disable right-click context menu on production
        document.addEventListener('contextmenu', function(e) {
            if (!sessionStorage.getItem('admin_authenticated')) {
                e.preventDefault();
                return false;
            }
        });

        // Disable common keyboard shortcuts for viewing source
        document.addEventListener('keydown', function(e) {
            if (sessionStorage.getItem('admin_authenticated')) return;
            
            // Ctrl+U (view source)
            if (e.ctrlKey && e.key === 'u') { e.preventDefault(); return false; }
            // Ctrl+Shift+I (dev tools)
            if (e.ctrlKey && e.shiftKey && e.key === 'I') { e.preventDefault(); return false; }
            // F12 (dev tools)
            if (e.key === 'F12') { e.preventDefault(); return false; }
            // Ctrl+Shift+J (console)
            if (e.ctrlKey && e.shiftKey && e.key === 'J') { e.preventDefault(); return false; }
        });
    }

    // ========================================
    // INITIALIZE
    // ========================================
    document.addEventListener('DOMContentLoaded', function() {
        addCSPMeta();
        addSecurityMeta();
        secureExternalLinks();
        addSourceProtection();

        // Secure all forms on the page
        document.querySelectorAll('form').forEach(secureForm);

        // Secure admin panel if on admin page
        if (document.getElementById('admin-pass')) {
            secureAdminPanel();
        }
    });

    // Expose for testing
    window.__security = { SecurityUtils, RateLimiter };
})();
