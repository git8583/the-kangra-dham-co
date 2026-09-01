// The Kangra Dham Co. - Hindi Language Support
// Adds a language toggle button and translates key content

const TRANSLATIONS = {
    en: {
        tagline: 'Tradition, Taste & Emotion',
        heroSub: 'The Authentic Himachali Feast — Slow-Cooked in Brass Charotis, Served Fresh Daily.',
        viewMenu: 'View Today\'s Menu',
        getDirections: 'Get Directions',
        todaysMadra: "Today's Madra",
        todaysKhatta: "Today's Khatta / Secondary",
        orderNow: 'Order Now',
        navigate: 'Navigate',
        corporateBulk: 'Corporate / Bulk',
        brandStoryTitle: 'Our Heritage',
        brandStory: 'In the quiet valleys of Kangra, food is not merely prepared — it is blessed. Passed down through generations of master \'Botis\' (traditional chefs), Kangra Dham is a sacred feast cooked without onion or garlic, relying on pure ghee, fresh curd, and whole aromatic spices.',
        weeklyMenu: '7-Day Rotating Menu',
        weeklyMenuSub: 'A different Madra every day — plan your visit',
        findUs: 'Find Us',
        reviews: 'What Our Guests Say',
        ctaTitle: 'Experience the Sacred Feast of Kangra Valley',
        ctaSub: 'Walk in today. Check today\'s rotating Madra. Or order for your team via WhatsApp.',
        included: 'Also Included in Your Thali:',
        heroMadra: 'Hero Madra (Rich & Yogurt-Based)',
        secondaryCurry: 'Secondary Curry / Khatta',
        lang: 'हिंदी'
    },
    hi: {
        tagline: 'परम्परा, स्वाद और भावना',
        heroSub: 'प्रामाणिक हिमाचली भोज — भारी पीतल की चरोटी में धीमी आंच पर पकाया, रोज़ ताज़ा परोसा।',
        viewMenu: 'आज का मेनू देखें',
        getDirections: 'दिशा-निर्देश',
        todaysMadra: 'आज का मद्रा',
        todaysKhatta: 'आज का खट्टा / सहायक',
        orderNow: 'ऑर्डर करें',
        navigate: 'नेविगेट करें',
        corporateBulk: 'कॉर्पोरेट / बल्क',
        brandStoryTitle: 'हमारी विरासत',
        brandStory: 'कांगड़ा की शांत घाटियों में, भोजन केवल बनाया नहीं जाता — उसे आशीर्वाद दिया जाता है। पीढ़ियों से चली आ रही \'बोटी\' (पारंपरिक रसोइये) परंपरा में, कांगड़ा धाम एक पवित्र भोज है जो बिना प्याज-लहसुन के, शुद्ध घी, ताज़ी दही, और साबुत मसालों से पकाया जाता है।',
        weeklyMenu: '7-दिन का रोटेटिंग मेनू',
        weeklyMenuSub: 'हर दिन एक अलग मद्रा — अपनी विज़िट प्लान करें',
        findUs: 'हमें खोजें',
        reviews: 'हमारे मेहमान क्या कहते हैं',
        ctaTitle: 'कांगड़ा घाटी के पवित्र भोज का अनुभव करें',
        ctaSub: 'आज ही आएं। आज का रोटेटिंग मद्रा चेक करें। या WhatsApp पर अपनी टीम के लिए ऑर्डर करें।',
        included: 'आपकी थाली में यह भी शामिल:',
        heroMadra: 'मुख्य मद्रा (दही आधारित)',
        secondaryCurry: 'सहायक करी / खट्टा',
        lang: 'English'
    }
};

// Language toggle functionality
(function() {
    const currentLang = localStorage.getItem('kangra_lang') || 'en';

    // Create toggle button
    function createLangToggle() {
        const btn = document.createElement('button');
        btn.id = 'lang-toggle';
        btn.className = 'lang-toggle-btn';
        btn.textContent = TRANSLATIONS[currentLang].lang;
        btn.setAttribute('aria-label', 'Switch language');
        btn.onclick = toggleLanguage;
        document.body.appendChild(btn);
    }

    function toggleLanguage() {
        const newLang = localStorage.getItem('kangra_lang') === 'hi' ? 'en' : 'hi';
        localStorage.setItem('kangra_lang', newLang);
        location.reload();
    }

    // Apply translations to elements with data-i18n attributes
    function applyTranslations() {
        const lang = localStorage.getItem('kangra_lang') || 'en';
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (TRANSLATIONS[lang][key]) {
                el.textContent = TRANSLATIONS[lang][key];
            }
        });

        // Update HTML lang attribute
        document.documentElement.lang = lang === 'hi' ? 'hi' : 'en';
    }

    // Add CSS for toggle button
    function addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .lang-toggle-btn {
                position: fixed;
                top: 80px;
                right: 1rem;
                z-index: 9998;
                background: var(--color-accent, #2C5E3B);
                color: white;
                border: none;
                padding: 0.5rem 1rem;
                border-radius: 20px;
                font-size: 0.85rem;
                font-weight: 600;
                cursor: pointer;
                box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                transition: all 0.3s ease;
            }
            .lang-toggle-btn:hover {
                transform: scale(1.05);
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            }
            @media (max-width: 768px) {
                .lang-toggle-btn {
                    top: 70px;
                    right: 0.5rem;
                    font-size: 0.75rem;
                    padding: 0.4rem 0.8rem;
                }
            }
        `;
        document.head.appendChild(style);
    }

    // Initialize
    document.addEventListener('DOMContentLoaded', () => {
        addStyles();
        createLangToggle();
        applyTranslations();
    });
})();
