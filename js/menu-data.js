// ========================================
// The Kangra Dham Co. - Menu Data
// 7-Day Rotating Dham Schedule
// Admin can override day via: window.MENU_DAY_OVERRIDE = 3; (0=Sun, 1=Mon...)
// ========================================

const MENU_DATA = {
    // Fixed items in every thali
    fixedItems: [
        'Steamed Basmati Rice',
        'Spiced Yogurt Palda',
        'Desi Ghee Drizzle',
        'Meetha Bhat (sweet rice with raisins & dry fruits)'
    ],

    // 7-day rotating schedule (0 = Sunday, 1 = Monday, etc.)
    daily: [
        {
            day: 'Sunday',
            dayShort: 'Sun',
            title: 'The Grand Shadi Wali Dham',
            madra: 'Double Madra (Chana Madra + Sepu Badi)',
            khatta: 'Khatta + Meetha Bhat + Babru',
            note: 'Designed for family outings — the complete Dham experience',
            price: '₹299',
            emoji: '🎊',
            highlight: true,
            image: 'https://upload.wikimedia.org/wikipedia/commons/2/27/DHAM_AT_MATA_SHRI_NAINA_DEVI_TEMPLE.jpg'
        },
        {
            day: 'Monday',
            dayShort: 'Mon',
            title: 'The Classic Comfort',
            madra: 'Chana Madra (Chickpeas slow-cooked in rich curd, ghee, raisins & whole cardamom)',
            khatta: 'Khatta Kale Chane (Tangy black chickpeas with dry mango & jaggery)',
            note: 'The classic, comforting start to the week',
            price: '₹200–₹250',
            emoji: '🫘',
            image: null
        },
        {
            day: 'Tuesday',
            dayShort: 'Tue',
            title: 'The Wholesome Feast',
            madra: 'Rajma Madra (Red kidney beans simmered in spiced yogurt)',
            khatta: 'Teliyan Maash (Whole black lentils slow-cooked overnight with mustard oil)',
            note: 'High-protein, wholesome homestyle meal',
            price: '₹200–₹250',
            emoji: '💪',
            image: 'https://upload.wikimedia.org/wikipedia/commons/4/43/Rajma_Chawal.JPG'
        },
        {
            day: 'Wednesday',
            dayShort: 'Wed',
            title: 'The Royal Delicacy',
            madra: 'Sepu Badi Madra (King of Dham — spinach & fried lentil dumplings in yogurt gravy)',
            khatta: 'Ambal / Gur Imli Khatta (Sweet & sour pumpkin/tamarind gravy)',
            note: 'The most sought-after Dham day',
            price: '₹200–₹250',
            emoji: '👑',
            image: null
        },
        {
            day: 'Thursday',
            dayShort: 'Thu',
            title: 'The Fragrant Mid-Week',
            madra: 'Paneer / Phool Gobi Madra (Cottage cheese or cauliflower in rich spiced curd)',
            khatta: 'Hing Chana Dal (Yellow lentils tempered with asafoetida & cumin)',
            note: 'Light, fragrant digestives for mid-week',
            price: '₹200–₹250',
            emoji: '🧀',
            image: 'https://upload.wikimedia.org/wikipedia/commons/1/14/Paneer_Makhani_-_Mohali_2016-08-07_9114.JPG'
        },
        {
            day: 'Friday',
            dayShort: 'Fri',
            title: 'The Festive Friday',
            madra: 'Kaale Chane ka Madra (Brown chickpea Madra cooked with dry fruits)',
            khatta: 'Dham Khatta (Tangy boondi & mustard seed gravy)',
            note: 'Rich and festive finish to the work week',
            price: '₹200–₹250',
            emoji: '🎉',
            image: 'https://upload.wikimedia.org/wikipedia/commons/c/ce/Black_Chick_peas_soup_%28Kala_Chana_curry%29.jpg'
        },
        {
            day: 'Saturday',
            dayShort: 'Sat',
            title: 'The Weekend Warmup',
            madra: 'Guchhi (Wild Himalayan Mushroom) / Paneer Special Madra',
            khatta: 'Teliyan Maash (Rich black lentils)',
            note: 'Premium weekend flavor profile',
            price: '₹200–₹250',
            emoji: '🍄',
            image: null
        }
    ],

    // Fixed side menu (A La Carte)
    sideMenu: [
        { name: 'Pahadi Siddu', desc: 'Steamed wheat bread filled with spiced poppy seeds/walnuts, served with hot Desi Ghee', price: '₹80', emoji: '🫓', image: 'https://upload.wikimedia.org/wikipedia/commons/f/f9/Siddu_%E2%80%93_Traditional_Steamed_Bread_from_Himachal_Pradesh.jpg' },
        { name: 'Babru (2 pcs)', desc: 'Himachali stuffed puri with spiced black gram paste', price: '₹60', emoji: '🥟', image: null },
        { name: 'Pahadi Chhaas', desc: 'Smoked buttermilk infused with roasted cumin, mint & rock salt', price: '₹40', emoji: '🥛', image: null },
        { name: 'Kangra Orthodox Tea', desc: 'Freshly brewed loose-leaf hill tea from Palampur gardens', price: '₹40', emoji: '🍵', image: 'https://upload.wikimedia.org/wikipedia/commons/a/a1/Palampur_tea_plantation%2C_Himachal_Pradesh%2C_India.jpg' }
    ],

    // Retail shelf
    retail: [
        { name: 'Galgal ka Achar', desc: 'Authentic hill lemon pickle', size: '250g Jar', price: '₹150', emoji: '🫙', image: 'https://upload.wikimedia.org/wikipedia/commons/c/c5/Lemon_pickle_%28_sweet%29.JPG' },
        { name: 'Lingad Pickle', desc: 'Wild fiddlehead fern pickle — rare Pahadi delicacy', size: '250g Jar', price: '₹220', emoji: '🌿', image: 'https://upload.wikimedia.org/wikipedia/commons/d/d1/FiddleheadFerns.JPG' },
        { name: 'Kangra Loose Leaf Tea', desc: 'Premium estate tea leaves from Kangra Valley', size: 'Packets', price: '₹180–₹350', emoji: '🍃', image: 'https://upload.wikimedia.org/wikipedia/commons/7/7a/Ceylon_black_tea_leaves.jpg' }
    ]
};

let serverMenuOverride = null;

window.menuDataReady = fetch('api/menu', {
    headers: { Accept: 'application/json' }
}).then(response => {
    if (!response.ok) throw new Error('Menu API unavailable');
    return response.json();
}).then(({ menu, override }) => {
    Object.assign(MENU_DATA, menu);
    serverMenuOverride = override;
}).catch(error => {
    console.warn('Using bundled menu data:', error.message);
});

// Get current day (or server-side admin override)
function getCurrentMenuDay() {
    if (typeof window.MENU_DAY_OVERRIDE === 'number') {
        return window.MENU_DAY_OVERRIDE;
    }
    if (Number.isInteger(serverMenuOverride)) return serverMenuOverride;
    return new Date().getDay();
}

function getTodaysMenu() {
    const dayIndex = getCurrentMenuDay();
    return MENU_DATA.daily[dayIndex];
}
