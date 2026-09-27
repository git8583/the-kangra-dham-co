(function () {
    'use strict';

    const MEASUREMENT_ID = 'G-M812X04ENX';
    const CONSENT_KEY = 'kangra_analytics_consent';

    function loadAnalytics() {
        if (window.gtag) return;
        window.dataLayer = window.dataLayer || [];
        window.gtag = function () { window.dataLayer.push(arguments); };
        window.gtag('js', new Date());
        window.gtag('config', MEASUREMENT_ID, { anonymize_ip: true });
        const script = document.createElement('script');
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
        document.head.appendChild(script);
    }

    function showConsent() {
        const banner = document.createElement('aside');
        banner.className = 'consent-banner';
        banner.setAttribute('aria-label', 'Analytics preferences');
        banner.innerHTML = `
            <p>We use optional analytics to understand visits and improve the website. <a href="privacy.html">Privacy details</a></p>
            <div class="consent-actions">
                <button type="button" class="btn btn-outline" data-consent="declined">Decline</button>
                <button type="button" class="btn btn-primary" data-consent="accepted">Allow Analytics</button>
            </div>
        `;
        banner.addEventListener('click', event => {
            const choice = event.target.closest('[data-consent]')?.dataset.consent;
            if (!choice) return;
            localStorage.setItem(CONSENT_KEY, choice);
            banner.remove();
            if (choice === 'accepted') loadAnalytics();
        });
        document.body.appendChild(banner);
    }

    const consent = localStorage.getItem(CONSENT_KEY);
    if (consent === 'accepted') loadAnalytics();
    else if (!consent) {
        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', showConsent);
        else showConsent();
    }
})();
