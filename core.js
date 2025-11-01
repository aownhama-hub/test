// --- Firebase Config ---
const firebaseConfig = {
    apiKey: "AIzaSyDvdLLedCxzLdJNn1uwEyN4P_6wpxnHnlk",
    authDomain: "time-tracker-c2a96.firebaseapp.com",
    projectId: "time-tracker-c2a96",
    storageBucket: "time-tracker-c2a96.appspot.com",
    messagingSenderId: "134709372879",
    appId: "1:134709372879:web:68a6272f51e9edb176d4ba",
    measurementId: "G-Z0D68CN682"
};
// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();
const auth = firebase.auth();
let googleProvider = null; 

// --- Global State ---
let userId = null;
let currentTimer = null;
let categories = new Map(); // NEW: For V24
let activities = new Map();
let plannerItems = new Map(); // Planner items (tasks, deadlines)
let allTimeLogs = []; // Cache for all logs, used by Track page
let currentAnalysisView = 'daily'; 
let currentAnalysisDate = new Date(); 
let barChartInstance = null;
let pieChartInstance = null;
let analysisLogs = []; // Logs for the current analysis period
let logToEditId = null;
let logToDelete = { id: null, type: null };
let activityToEditId = null;
let previousTimeString = "00:00:00"; 
let currentEmojiInputTarget = null;
let stopTimerCompletion = null; 

// --- NEW Track Page State ---
let currentTrackView = 'list'; // 'list' or 'grid'
let currentTrackTimeRange = { 
    type: 'today', // 'today', 'week', 'month', 'year', 'all', 'custom'
    start: getStartOfDate(new Date()), 
    end: getEndOfDate(new Date()) 
};
let currentTrackFilters = { 
    types: [], // 'goal', 'task', 'deadline'
    activities: [], // array of activity IDs
    categories: [] // array of category names
};
let trackSearchQuery = '';

// --- Element References ---
const mainApp = document.getElementById('main-app');
// UPDATED: Page references
const pages = {
    home: document.getElementById('home-page'),
    track: document.getElementById('track-page'), 
    categories: document.getElementById('categories-page'), // NEW
    analysis: document.getElementById('analysis-page')
    // settings: DELETED
};
const navButtons = document.querySelectorAll('.nav-btn');
const categoryDatalist = document.getElementById('category-list-datalist');

// Settings page refs (now in modal)
const settingsModal = document.getElementById('settings-modal'); // NEW
const showSettingsBtn = document.getElementById('show-settings-btn'); // NEW
const closeSettingsBtn = document.getElementById('close-settings-btn'); // NEW
const themeToggleBtnSettings = document.getElementById('theme-toggle-btn-settings');
const themeIconLightSettings = document.getElementById('theme-icon-light-settings');
const themeIconDarkSettings = document.getElementById('theme-icon-dark-settings');
const fontSizeSlider = document.getElementById('font-size-slider');
const signInBtn = document.getElementById('sign-in-btn');
const signOutBtn = document.getElementById('sign-out-btn');
const userInfo = document.getElementById('user-info');
const userEmail = document.getElementById('user-email');

// Home page refs
const homeTimerCard = document.getElementById('home-timer-card'); 
const homeTimerLabel = document.getElementById('home-timer-label');
const homeTimerActivityName = document.getElementById('home-timer-activity-name'); 
const homeTimerTime = document.getElementById('home-timer-time'); 
const homeTimerStopBtn = document.getElementById('home-timer-stop-btn'); 
const generateAiSummaryBtn = document.getElementById('generate-ai-summary-btn'); 
const aiSummaryContent = document.getElementById('ai-summary-content'); 
// NEW Home Card Refs
const homeCardsContainer = document.getElementById('home-cards-container');
const homeTodayCard = document.getElementById('home-today-card');
const homeGoalsCard = document.getElementById('home-goals-card');
const homeUpcomingCard = document.getElementById('home-upcoming-card');
const homeNotificationsCard = document.getElementById('home-notifications-card');
const homeTodayList = document.getElementById('home-today-list');
const homeGoalsList = document.getElementById('home-goals-list');
const homeUpcomingList = document.getElementById('home-upcoming-list');
const homeNotificationsList = document.getElementById('home-notifications-list');
const editHomeCardsBtn = document.getElementById('edit-home-cards-btn');

// Track page refs
const trackSearchBox = document.getElementById('search-box');
const trackViewToggleBtn = document.getElementById('view-toggle-btn');
const trackViewIconList = document.getElementById('view-toggle-icon-list');
const trackViewIconGrid = document.getElementById('view-toggle-icon-grid');
const trackTimeRangeBtn = document.getElementById('time-range-btn');
const trackTimeNavPrev = document.getElementById('time-nav-prev');
const trackTimeNavNext = document.getElementById('time-nav-next');
const trackFilterBtn = document.getElementById('filter-btn'); 
const trackContentArea = document.getElementById('track-content-area');

// Categories page refs (NEW)
// const addCategoryBtn = document.getElementById('add-category-btn'); // DELETED: Button removed from header
const categoriesDateNavigator = document.getElementById('categories-date-navigator');
const categoriesNavPrev = document.getElementById('categories-nav-prev');
const categoriesNavNext = document.getElementById('categories-nav-next');
const categoriesNavText = document.getElementById('categories-nav-text');
const categoriesChartContainer = document.getElementById('categories-chart-container');
const categoriesListContainer = document.getElementById('categories-list-container');


const timerBanner = document.getElementById('timer-banner');
const bannerActivityName = document.getElementById('banner-activity-name');
const bannerTime = document.getElementById('banner-time');
const bannerStopBtn = document.getElementById('banner-stop-btn'); 
const flipClockPage = document.getElementById('flip-clock-page');
const flipClockBackBtn = document.getElementById('flip-clock-back-btn');
const flipClockActivity = document.getElementById('flip-clock-activity');

const flipDigitElements = {
    h1: document.querySelector('[data-digit="h1"]'), h2: document.querySelector('[data-digit="h2"]'),
    m1: document.querySelector('[data-digit="m1"]'), m2: document.querySelector('[data-digit="m2"]'),
    s1: document.querySelector('[data-digit="s1"]'), s2: document.querySelector('[data-digit="s2"]'),
};

const deleteModal = document.getElementById('delete-modal');
const deleteModalText = document.getElementById('delete-modal-text');
const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
const confirmDeleteBtn = document.getElementById('confirm-delete-btn');

const stopNoteModal = document.getElementById('stop-note-modal');
const stopNoteForm = document.getElementById('stop-note-form');
const stopNoteInput = document.getElementById('stop-note-input');
const saveStopNoteBtn = document.getElementById('save-stop-note-btn');
const skipStopNoteBtn = document.getElementById('skip-stop-note-btn');

const manualEntryModal = document.getElementById('manual-entry-modal');
const cancelManualEntryBtn = document.getElementById('cancel-manual-entry-btn');
const manualEntryForm = document.getElementById('manual-entry-form');
const manualActivitySelect = document.getElementById('manual-activity-select');
const manualDateInput = document.getElementById('manual-date');
const manualStartTimeInput = document.getElementById('manual-start-time');
const manualEndTimeInput = document.getElementById('manual-end-time');
const manualNotesInput = document.getElementById('manual-notes');

const editLogModal = document.getElementById('edit-log-modal');
const editLogForm = document.getElementById('edit-log-form');
const cancelEditLogBtn = document.getElementById('cancel-edit-log-btn');
const editLogIdInput = document.getElementById('edit-log-id');
const editActivityNameInput = document.getElementById('edit-activity-name');
const editDateInput = document.getElementById('edit-date');
const editStartTimeInput = document.getElementById('edit-start-time');
const editEndTimeInput = document.getElementById('edit-end-time');
const editNotesInput = document.getElementById('edit-notes');

// Old Edit Activity Modal (will be deprecated)
const editActivityModal = document.getElementById('edit-activity-modal');
const editActivityForm = document.getElementById('edit-activity-form');
const cancelEditActivityBtn = document.getElementById('cancel-edit-activity-btn');
const editActivityIdInput = document.getElementById('edit-activity-id');
const editActivityNameInput_Input = document.getElementById('edit-activity-name-input');
const editActivityColorInput = document.getElementById('edit-activity-color-input');
const editActivityEmojiBtn = document.getElementById('edit-activity-emoji-input'); 
const editActivityEmojiValue = document.getElementById('edit-activity-emoji-value');
const deleteActivityFromModalBtn = document.getElementById('delete-activity-from-modal-btn'); 
const editActivityCategory = document.getElementById('edit-activity-category'); 
const editActivityGoalValueInput = document.getElementById('edit-activity-goal-value'); 
const editActivityGoalPeriodInput = document.getElementById('edit-activity-goal-period'); 
const editActivityPin = document.getElementById('edit-activity-pin'); 

// Analysis page refs
const analysisDateInput = document.getElementById('analysis-date');
const analysisNavPrev = document.getElementById('analysis-nav-prev'); 
const analysisNavNext = document.getElementById('analysis-nav-next'); 
const analysisNavText = document.getElementById('analysis-nav-text'); 
const rankingList = document.getElementById('ranking-list');
const rankingTitle = document.getElementById('ranking-title'); 
const barChartCanvas = document.getElementById('analysis-bar-chart'); 
const barChartCard = document.getElementById('bar-chart-card'); 
const barChartTitle = document.getElementById('bar-chart-title'); 
const pieChartCanvas = document.getElementById('analysis-pie-chart'); 
const pieChartCard = document.getElementById('pie-chart-card'); 
const analysisTabButtons = document.querySelectorAll('.analysis-tab-btn'); 
const heatmapCard = document.getElementById('heatmap-card');
const heatmapGrid = document.getElementById('heatmap-grid');
const heatmapTitle = document.getElementById('heatmap-title');
const analysisFilterContainer = document.getElementById('analysis-filter-container');
const analysisActivityFilter = document.getElementById('analysis-activity-filter');
const viewAllLogsBtn = document.getElementById('view-all-logs-btn');
const logDetailsModal = document.getElementById('log-details-modal');
const logDetailsList = document.getElementById('log-details-list');
const closeLogDetailsBtn = document.getElementById('close-log-details-btn');
const exportCsvBtn = document.getElementById('export-csv-btn');

// Old Emoji Modal (will be deprecated)
const emojiModal = document.getElementById('emoji-modal');
const emojiGrid = document.getElementById('emoji-grid');
const closeEmojiModalBtn = document.getElementById('close-emoji-modal-btn');
const emojiCategories = document.getElementById('emoji-categories');

// --- Universal Add Button ---
const universalAddBtn = document.getElementById('universal-add-btn');

// --- NEW Modal Refs ---
const addItemModal = document.getElementById('add-item-modal');
const addItemForm = document.getElementById('add-item-form');
const cancelAddItemBtn = document.getElementById('cancel-add-item-btn');
const saveAddItemBtn = document.getElementById('save-add-item-btn');

// NEW V24 Refs
const addCategoryModal = document.getElementById('add-category-modal');
const cancelAddCategoryBtn = document.getElementById('cancel-add-category-btn');
const addCategoryForm = document.getElementById('add-category-form');
const saveAddCategoryBtn = document.getElementById('save-add-category-btn');

const iconPickerModal = document.getElementById('icon-picker-modal');
const iconPickerGrid = document.getElementById('icon-picker-grid');
const iconSearchInput = document.getElementById('icon-search');
const closeIconPickerBtn = document.getElementById('close-icon-picker-btn');
let currentIconInputTarget = null; // { button: buttonEl, value: inputEl, preview: iEl }


// --- App Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    loadThemePreference(); 
    loadFontSizePreference();
    setupEventListeners();
    authenticateUser(); 
    setDefaultAnalysisDate();
    setFlipClock("00:00:00"); 
    populateEmojiPicker(); // Old, will be replaced by populateIconPicker
    populateIconPicker(); // NEW
    // Set default time range
    updateTimeRange('today');
});

// --- MODIFIED Event Listeners Setup ---
function setupEventListeners() {
    navButtons.forEach(btn => btn.addEventListener('click', () => showPage(btn.dataset.page)));
    
    // --- Home Listeners ---
    homeTimerStopBtn.addEventListener('click', stopTimer); 
    generateAiSummaryBtn.addEventListener('click', handleGenerateAISummary); 
    homeTodayList.addEventListener('click', handleHomeItemClick); 
    homeGoalsList.addEventListener('click', handleHomeItemClick); // NEW
    homeUpcomingList.addEventListener('click', handleHomeItemClick); // NEW
    homeNotificationsList.addEventListener('click', handleHomeItemClick); // NEW

    // --- Track Listeners ---
    trackSearchBox.addEventListener('input', () => {
        trackSearchQuery = trackSearchBox.value;
        renderTrackPage();
    });
    trackViewToggleBtn.addEventListener('click', handleViewToggle);
    trackTimeNavPrev.addEventListener('click', () => mapTimeRange(-1));
    trackTimeNavNext.addEventListener('click', () => mapTimeRange(1));
    // trackFilterBtn.addEventListener('click', showFilterModal); // DELETED
    trackContentArea.addEventListener('click', handleTrackListClick);

    // --- Universal Add Button ---
    // MODIFICATION: Context-aware click listener
    universalAddBtn.addEventListener('click', () => {
        if (pages.categories.classList.contains('active')) {
            showAddCategoryModal();
        } else if (pages.track.classList.contains('active')) {
            showAddItemModal();
        }
    }); 

    // --- Settings Modal Listeners (NEW) ---
    showSettingsBtn.addEventListener('click', showSettingsModal);
    closeSettingsBtn.addEventListener('click', hideSettingsModal);
    addClickOutsideListener(settingsModal, hideSettingsModal);
    themeToggleBtnSettings.addEventListener('click', toggleTheme); 
    fontSizeSlider.addEventListener('input', handleFontSizeChange);
    signInBtn.addEventListener('click', signInWithGoogle);
    signOutBtn.addEventListener('click', signOut);

    // --- Analysis Listeners (Unchanged) ---
    exportCsvBtn.addEventListener('click', exportToCSV);
    analysisDateInput.addEventListener('change', () => {
        currentAnalysisDate = new Date(analysisDateInput.value + 'T00:00:00');
        loadAnalysisData();
    });
    analysisNavPrev.addEventListener('click', () => navigateAnalysis(-1));
    analysisNavNext.addEventListener('click', () => navigateAnalysis(1));
    analysisTabButtons.forEach(btn => btn.addEventListener('click', () => setAnalysisView(btn.dataset.view)));
    analysisActivityFilter.addEventListener('change', () => {
        localStorage.setItem('lastAnalysisFilter', analysisActivityFilter.value);
        renderAnalysisVisuals(analysisLogs, calculateActivityTotals(analysisLogs));
    });
    viewAllLogsBtn.addEventListener('click', showLogDetailsModal);
    closeLogDetailsBtn.addEventListener('click', hideLogDetailsModal);
    logDetailsList.addEventListener('click', handleLogDetailsClick);

    // --- Edit Activity Listeners (Old, will be deprecated) ---
    cancelEditActivityBtn.addEventListener('click', hideEditActivityModal);
    editActivityForm.addEventListener('submit', handleSaveEditActivity);
    deleteActivityFromModalBtn.addEventListener('click', handleDeleteActivityFromModal); 
    
    // --- Timer Banner/Clock Listeners (Unchanged) ---
    timerBanner.addEventListener('click', (e) => {
        if (!e.target.closest('#banner-stop-btn')) { 
            if (currentTimer) {
                showFlipClock(); 
            }
        }
    });
    bannerStopBtn.addEventListener('click', stopTimer); 
    flipClockBackBtn.addEventListener('click', hideFlipClock);
    
    // --- Core Modal Listeners (Modified) ---
    cancelDeleteBtn.addEventListener('click', hideDeleteModal);
    confirmDeleteBtn.addEventListener('click', handleConfirmDelete); 
    
    stopNoteForm.addEventListener('submit', handleSaveStopNote);
    skipStopNoteBtn.addEventListener('click', handleSaveStopNote);
    addClickOutsideListener(stopNoteModal, handleSaveStopNote);
    
    cancelManualEntryBtn.addEventListener('click', hideManualEntryModal);
    manualEntryForm.addEventListener('submit', handleSaveManualEntry);
    
    cancelEditLogBtn.addEventListener('click', hideEditLogModal);
    editLogForm.addEventListener('submit', handleSaveEditLog);
    
    addClickOutsideListener(deleteModal, hideDeleteModal);
    addClickOutsideListener(manualEntryModal, hideManualEntryModal);
    addClickOutsideListener(editLogModal, hideEditLogModal);
    // addClickOutsideListener(editActivityModal, hideEditActivityModal); // BUG FIX: This line caused the crash. It is now removed.
    addClickOutsideListener(logDetailsModal, hideLogDetailsModal);
    addClickOutsideListener(emojiModal, hideEmojiPicker);

    // --- NEW Modal Listeners ---
    addClickOutsideListener(addItemModal, hideAddItemModal);
    cancelAddItemBtn.addEventListener('click', hideAddItemModal);
    addItemForm.addEventListener('submit', handleAddItem);

    // --- DELETED Modal Listeners ---
    // (timeRangeModal and filterModal listeners removed)

    // --- Emoji Picker Listeners (Old) ---
    emojiCategories.addEventListener('click', handleEmojiCategorySelect);
    emojiGrid.addEventListener('click', handleEmojiSelect);
    closeEmojiModalBtn.addEventListener('click', hideEmojiPicker);

    // --- NEW V24 Listeners ---
    // addCategoryBtn.addEventListener('click', () => showAddCategoryModal()); // DELETED: Button removed from header
    cancelAddCategoryBtn.addEventListener('click', hideAddCategoryModal);
    addCategoryForm.addEventListener('submit', handleSaveCategory);
    addClickOutsideListener(addCategoryModal, hideAddCategoryModal);

    closeIconPickerBtn.addEventListener('click', hideIconPicker);
    iconPickerGrid.addEventListener('click', handleIconSelect);
    addClickOutsideListener(iconPickerModal, hideIconPicker);
    iconSearchInput.addEventListener('input', populateIconPicker);
    
    // NEW: Categories Page Listeners
    categoriesNavPrev.addEventListener('click', () => navigateCategories(-1));
    categoriesNavNext.addEventListener('click', () => navigateCategories(1));
    categoriesListContainer.addEventListener('click', handleCategoriesListClick);
}

function addClickOutsideListener(modalElement, hideFunction) {
    if (modalElement) {
        modalElement.addEventListener('click', (e) => {
            if (e.target === modalElement) {
                hideFunction();
            }
        });
    }
}

// --- Utility Functions ---
function getTodayString() {
    const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// --- NEW Date Utilities ---
function getStartOfDate(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
}
function getEndOfDate(date) {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
}

function setDefaultAnalysisDate() {
    currentAnalysisDate = new Date(); 
    currentAnalysisDate.setHours(0,0,0,0);
    analysisDateInput.value = getTodayString(); 
    manualDateInput.value = getTodayString(); 
}

// --- Auth & Data Loading (MODIFIED) ---
const categoriesCollection = () => db.collection('users').doc(userId).collection('categories'); // NEW
const activitiesCollection = () => db.collection('users').doc(userId).collection('activities');
const timeLogsCollection = () => db.collection('users').doc(userId).collection('timeLogs');
const plannerCollection = () => db.collection('users').doc(userId).collection('plannerItems');

// MODIFIED: Authenticate User
function authenticateUser() {
    googleProvider = new firebase.auth.GoogleAuthProvider();
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            userId = user.uid;
            signInBtn.style.display = 'none';
            signOutBtn.style.display = 'block';
            userInfo.style.display = 'block';
            userEmail.textContent = user.email;

            // Load all user data
            checkTimerRecovery(); 
            await loadCategories(); // NEW: Load categories first
            await loadActivities(); 
            await loadPlannerItems();
            await loadAllTimeLogs(); // NEW: Load all logs into cache
            
            // Render current page
            const activePage = document.querySelector('.page.active').id;
            if (activePage === 'home-page') {
                renderHomePage(); 
            } else if (activePage === 'track-page') {
                renderTrackPage();
            } else if (activePage === 'analysis-page') {
                await loadAnalysisData();
            } else if (activePage === 'categories-page') { // NEW
                renderCategoriesPage(); // This function will be in app-data.js
            }
        } else {
            userId = null;
            signInBtn.style.display = 'block';
            signOutBtn.style.display = 'none';
            userInfo.style.display = 'none';
            userEmail.textContent = '';
            clearAllUserData();
        }
    });
}

function signInWithGoogle() {
    auth.signInWithPopup(googleProvider)
        .catch((error) => {
            console.error("Google Sign-In Error:", error);
            alert("Failed to sign in. Please try again.");
        });
}

function signOut() {
    auth.signOut().catch((error) => {
        console.error("Sign-Out Error:", error);
    });
}

// MODIFIED: Clear All User Data
function clearAllUserData() {
    if (currentTimer) stopTimer(); 
    categories.clear(); // NEW
    activities.clear();
    plannerItems.clear(); 
    allTimeLogs = []; 
    analysisLogs = [];
    
    // Reset state
    currentTrackView = 'list';
    updateTimeRange('today');
    currentTrackFilters = { types: [], activities: [], categories: [] };
    trackSearchQuery = '';
    trackSearchBox.value = '';

    trackContentArea.innerHTML = `<p class="text-center text-muted p-4">Please sign in to track your time.</p>`;
    rankingList.innerHTML = `<p class="text-center text-muted">Please sign in.</p>`;
    if (barChartInstance) barChartInstance.destroy();
    if (pieChartInstance) pieChartInstance.destroy();
    
    const barCtx = barChartCanvas.getContext('2d');
    const pieCtx = pieChartCanvas.getContext('2d');
    barCtx.clearRect(0, 0, barChartCanvas.width, barChartCanvas.height);
    pieCtx.clearRect(0, 0, pieChartCanvas.width, pieChartCanvas.height);
    heatmapGrid.innerHTML = '';
    
    renderHomePage(); // Clear home page
    categoriesListContainer.innerHTML = `<p class="text-center text-muted">Please sign in.</p>`; // NEW
    if (categoriesDonutChart) categoriesDonutChart.destroy(); // NEW
    categoriesChartContainer.innerHTML = ''; // NEW
}

function checkTimerRecovery() {
    const savedTimerJSON = localStorage.getItem('activeTimer');
    if (savedTimerJSON) {
        const savedTimer = JSON.parse(savedTimerJSON);
        
        if (savedTimer.userId !== userId) {
            localStorage.removeItem('activeTimer');
            return;
        }

        currentTimer = { ...savedTimer, intervalId: null };
        
        const elapsedMs = Date.now() - currentTimer.startTime;
        const timeString = formatHHMMSS(elapsedMs);
        setFlipClock(timeString); 
        previousTimeString = timeString; 

        currentTimer.intervalId = setInterval(updateTimerUI, 1000); 
        
        timerBanner.classList.remove('hidden', 'closing', 'morphing-out'); 
        requestAnimationFrame(() => { 
            timerBanner.classList.add('active');
        });
        
        bannerActivityName.textContent = currentTimer.activityName;
        updateTimerUI(); 
        
        // Re-render relevant pages
        renderHomePage(); 
        if (pages.track.classList.contains('active')) {
            renderTrackPage();
        }
    }
}

// MODIFIED: Show Page
function showPage(pageName) {
    Object.values(pages).forEach(p => p.classList.remove('active'));
    navButtons.forEach(btn => {
         const isActive = btn.dataset.page === pageName;
         btn.classList.toggle('active-nav', isActive); 
    });

    if (pages[pageName]) {
         pages[pageName].classList.add('active');
         
         // MODIFICATION: Show/hide universal add button
         if (pageName === 'categories' || pageName === 'track') {
            universalAddBtn.style.display = 'flex';
         } else {
            universalAddBtn.style.display = 'none';
         }

         // Load data or render page
         if (pageName === 'home') {
            renderHomePage(); 
         }
         if (pageName === 'track') {
            renderTrackPage();
         }
         if (pageName === 'categories') { // NEW
            renderCategoriesPage(); // This function will be in app-data.js
         }
         if (pageName === 'analysis') {
            if (analysisLogs.length === 0) { // Only load if not already loaded
                 setDefaultAnalysisDate(); 
                 setAnalysisView('daily'); 
            }
         }
    } else {
        console.error("Tried to navigate to non-existent page:", pageName);
    }
}

// NEW V24 Function: Load Categories
async function loadCategories() {
    if (!userId) return;
    try {
        const snapshot = await categoriesCollection().orderBy('name', 'asc').get(); 
        categories.clear();
        snapshot.forEach(doc => {
             const data = { ...doc.data(), id: doc.id };
             categories.set(doc.id, data);
         });
    } catch (error) { 
         console.error("Error loading categories: ", error);
    }
}

async function loadActivities() {
    if (!userId) return;
    try {
        const snapshot = await activitiesCollection().orderBy('name', 'asc').get(); 
        activities.clear();
        snapshot.forEach(doc => {
             const data = { ...doc.data(), id: doc.id };
             activities.set(doc.id, data);
         });
         
         populateAnalysisFilter(); 
         populateCategoryDatalist();
    } catch (error) { 
         console.error("Error loading activities: ", error);
    }
}

// NEW: Load All Time Logs (for Track Page cache)
async function loadAllTimeLogs() {
    if (!userId) return;
    try {
        const snapshot = await timeLogsCollection().orderBy('startTime', 'desc').get();
        allTimeLogs = [];
        snapshot.forEach(doc => {
            allTimeLogs.push({ ...doc.data(), id: doc.id });
        });
    } catch (error) {
        console.error("Error loading all time logs: ", error);
    }
}

// MODIFIED: Load Planner Items
async function loadPlannerItems() {
    if (!userId) return;
    try {
        const snapshot = await plannerCollection().orderBy('dueDate', 'asc').get();
        plannerItems.clear();
        snapshot.forEach(doc => {
            plannerItems.set(doc.id, { ...doc.data(), id: doc.id });
        });
        
        // Re-render pages that depend on this data
        if (pages.home.classList.contains('active')) {
            renderHomePage();
        }
        if (pages.track.classList.contains('active')) {
            renderTrackPage();
        }
    } catch (error) {
        console.error("Error loading planner items: ", error);
    }
}

// Populate Category Datalist (Now for Activities)
function populateCategoryDatalist() {
    categoryDatalist.innerHTML = '';
    // This will now be populated by the new Category objects
    categories.forEach(c => {
        categoryDatalist.innerHTML += `<option value="${c.name}">`;
    });
}

function populateAnalysisFilter() {
    while (analysisActivityFilter.options.length > 1) {
        analysisActivityFilter.remove(1);
    }
    const sortedActivities = Array.from(activities.values()).sort((a, b) => a.name.localeCompare(b.name));
    sortedActivities.forEach(activity => {
         analysisActivityFilter.innerHTML += `<option value="${activity.id}">${activity.name}</option>`;
    });
    const lastFilter = localStorage.getItem('lastAnalysisFilter');
    if (lastFilter) {
        analysisActivityFilter.value = lastFilter;
    }
}

// --- Emoji Picker Functions (Old) ---
const EMOJI_CATEGORIES = [
    { name: 'Smileys', icon: '😀', emojis: ['😀', '😁', '😂', '🤣', '😃', '😄', '😅', '😆', '😉', '😊', '😋', '😎', '😍', '😘', '🥰', '😗', '😙', '🥲', '🤔', '🤫', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '😮‍💨', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '🥸', '🤓', '🧐', '😕', '😟', '🙁', '😮', '😯', '😲', '😳', '🥺', '😦', '😧', '😨', '😰', '😥', '😢', '😭', '😱', '😖', '😣', '😞', '😓', '😩', '😫', '🥱', '😤', '😡', '😠', '🤬', '😈', '👿', '💀', '💩', '🤡', '👹', '👺', '👻', '👽', '🤖', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾']},
    { name: 'People', icon: '👋', emojis: ['👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🫰', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💅', '🤳', '💪', '🦾', '🦵', '🦶', '👂', '🦻', '👃', '🧠', '🫀', '🦷', '🦴', '👀', '👁️', '👅', '👄', '👶', '🧒', '👦', '👧', '🧑', '👱', '👨', '👩', '🧓', '👴', '👵', '🙍', '🙎', '🙅', '🙆', '💁', '🙋', '🧏', '🙇', '🤦', '🤷', '🧑‍⚕️', '🧑‍🎓', '🧑‍🏫', '🧑‍⚖️', '🧑‍🌾', '🧑‍🍳', '🧑‍🔧', '🧑‍🏭', '🧑‍💼', '🧑‍🔬', '🧑‍💻', '🧑‍🎤', '🧑‍🎨', '🧑‍✈️', '🧑‍🚀', '🧑‍🚒', '👮', '🕵️', '💂', '🥷', '👷', '🤴', '👸', '👳', '👲', '🧕', '🤵', '👰', '🤰', '🤱', '👼', '🎅', '🦸', '🦹', '🧙', '🧚', '🧛', '🧜', '🧝', '🧞', '🧟', '💆', '💇', '🚶', '🧍', '🧎', '🧑‍🦽', '🧑‍🦼', '🏃', '💃', '🕺', '🕴️', '👯', '🧘', '🛀', '🛌', '🫂', '🗣️', '👤', '👥', '👣']},
    { name: 'Food', icon: '🍎', emojis: ['🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶️', '🫑', '🌽', '🥕', '🫒', '🧄', '🧅', '🥔', '🍠', '🥐', '🥯', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳', '🧈', '🥞', '🧇', '🥓', '🥩', '🍗', '🍖', '🦴', '🌭', '🍔', '🍟', '🍕', '🫓', '🥪', '🥙', '🧆', '🌮', '🌯', '🫔', '🥗', '🥘', '🫕', '🥫', '🍝', '🍜', '🍲', '🍛', '🍣', '🍱', '🥟', '🦪', '🍤', '🍙', '🍚', '🍘', '🍥', '🥠', '🥮', '🍢', '🍡', '🍧', '🍨', '🍦', '🍰', '🧁', '🥧', '🍮', '🎂', '🍭', '🍬', '🍫', '🍿', '🍩', '🍪', '🌰', '🥜', '🍯', '🥛', '🍼', '☕', '🫖', '🍵', '🍶', '🍾', '🍷', '🍸', '🍹', '🍺', '🍻', '🥂', '🥃', '🥤', '🧋', '🧃', '🧉', '🧊', '🥄', '🍴', '🔪', '🏺', '🌍', '🇪🇺', '🇺🇸', '🌏', '🇦🇺']},
    { name: 'Activities', icon: '⚽', emojis: ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛷', '⛸️', '🥌', '🎿', '⛷️', '🏂', '🪂', '🏋️', '🤸', '⛹️', '🤺', '🤾', '🏌️', '🏇', '🧘', '🏄', '🏊', '🤽', '🚣', '🧗', '🚵', '🚴', '🏆', '🥇', '🥈', '🥉', '🏅', '🎗️', '🎫', '🎪', '🤹', '🎭', '🩰', '🎨', '🎬', '🎤', '🎧', '🎼', '🎹', '🥁', '🎷', '🎺', '🎸', '🪕', '🎻', '🎲', '♟️', '🎯', '🎱', '🎮', '🎰', '🧩']},
    { name: 'Travel', icon: '🚗', emojis: ['🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🛻', '🚚', '🚛', '🚜', '🚔', '🚍', '🏍️', '🛵', '🦽', '🦼', '🛺', '🚲', '🛴', '🛹', '🛼', '🚏', '🛣️', '🛤️', '🛢️', '⛽', '🛞', '🚨', '🚥', '🚦', '🛑', '🚧', '⚓', '⛵', '🛶', '🚤', '🛳️', '⛴️', '🛥️', '🚢', '✈️', '🛩️', '🛫', '🛬', '🪂', '💺', '🚁', '🚠', '🚞', '🚊', '🚝', '🚄', '🚅', '🚈', '🚂', '🚆', '🚇', '🚉', '🛸', '🚀', '🛰️', '🪐', '🌠', '🌌', '⛱️', '🎆', '🎇', '🎑', '🗾', '🗺️', '🌍', '🌎', '🌏', '🌐', '🧭', '🏔️', '⛰️', '🌋', '🗻', '🏕️', '🏖️', '🏜️', '🏝️', '🏞️', '🏟️', '🏛️', '🏗️', '🏘️', '🏚️', '🏠', '🏡', '🏢', '🏣', '🏤', '🏥', '🏦', '🏨', '🏪', '🏫', '🏬', '🏭', '🏯', '🏰', '💒', '🗼', '🗽', '⛪', '🕌', '🛕', '🕍', '🕋', '⛲', '⛺', '🌁', '🌃', '🏙️', '🌄', '🌅', '🌆', '🌇', '🌉', '♨️', '🎠', '🎡', '🎢', '💈', '🛎️', '🧳', '⌛', '⏳', '⌚', '⏰', '⏱️', '⏲️', '🕰️', '🌡️', '☀️', '☁️', '⛅', '⛈️', '🌤️', '🌥️', '🌦️', '🌧️', '🌨️', '🌩️', '🌪️', '🌫️', '🌬️', '🌀', '🌈', '🌂', '☂️', '☔', '⚡', '❄️', '☃️', '⛄', '☄️', '🔥', '💧', '🌊']},
    { name: 'Objects', icon: '⌚', emojis: ['⌚', '📱', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '🖲️', '🕹️', '🗜️', '⚙️', '🔧', '🔨', '⚒️', '⛏️', '🔩', '🧱', '🪨', '🪵', '🛖', '🛞', '⚖️', '🦯', '🔗', '⛓️', '🪝', '🧰', '🧲', '🪜', '⚗️', '🧪', '🧫', '🧬', '🔬', '🔭', '📡', '💉', '🩸', '💊', '🩹', '🩺', '🚪', '🛗', '🪞', '🪟', '🛏️', '🛋️', '🪑', '🚽', '🪠', '🚿', '🛁', '🪤', '🪒', '🧴', '🧷', '🧹', '🧺', '🧻', '🪣', '🧼', '🪥', '🧽', '🧯', '🛒', '🚬', '⚰️', '🪦', '⚱️', '🗿', '🪧', '🔮', '🪄', '📿', '💎', '💍', '💄', '💋', '💌', '💘', '💝', '💖', '💗', '💓', '💞', '💕', '💟', '❣️', '💔', '💯', '💢', '💣', '😵', '🤯', '💬', '👁️‍🗨️', '🗨️', '🗯️', '💭', '💤', '💮', '💈', '👓', '🕶️', '🥽', '🥼', '🦺', '👔', '👕', '👖', '🧣', '🧤', '🧥', '🧦', '👗', '👘', '🥻', '🩱', '🩲', '🩳', '👙', '👚', '👛', '👜', '👝', '🎒', '🩴', '👞', '👟', 'G', '🥿', '👠', '👡', '🩰', '👢', '👑', '👒', '🎩', '🎓', '🧢', '🪖', '⛑️', '🔇', '🔈', '🔉', '🔊', '📢', '📣', '📯', '🔔', '🔕', '🎼', '🎵', '🎶', '💹', '📇', '📈', '📉', '📊', '📋', '📌', '📍', '📎', '🖇️', '📏', '📐', '✂️', '🗃️', '🗂️', '🗑️', '🔒', '🔓', '🔏', '🔐', '🔑', '🗝️', '🔨', '🪓', '⛏️', '⚒️', '🛠️', '🗡️', '⚔️', '🔫', '🪃', '🏹', '🛡️', '🪚', '🔧', '🔩', '🗜️', '⚖️', '🦯', '🔗', '⛓️', '🪝', '🧰', 'G', '🪜', '⚗️', '🧪', '🧫', '🧬', '🔬', '🔭', '📡', '💉', '🩸', '💊', '🩹', '🩺', '🚪', '🛗', '🪞', '🪟', '🛏️', '🛋️', '🪑', '🚽', '🪠', '🚿', '🛁', '🪤', '🪒', '🧴', '🧷', '🧹', '🧺', '🧻', '🪣', '🧼', '🪥', '🧽', '🧯', '🛒', '🚬', '⚰️', '🪦', '⚱️', '🗿', '🪧', '🎄', '🎆', '🎇', '🧨', '✨', '🎈', '🎉', '🎊', '🎋', '🎍', '🎎', '🎏', '🎐', '🎑', '🧧', '🎀', '🎁']},
    { name: 'Symbols', icon: '❤️', emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤎', '🤍', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐', '⛎', '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓', '🆔', '⚛️', '🉑', '☢️', '☣️', '📴', '📳', '🈶', '🈚', '🈸', '🈺', '🈷️', '✴️', '🆚', '💮', '🉐', '㊙️', '㊗️', '🈴', '🈵', '🈹', '🈲', '🅰️', '🅱️', '🆎', '🆑', '🅾️', '🆘', '❌', '⭕', '🛑', '⛔', '📛', '🚫', '💯', '💢', '♨️', '🚷', '🚯', '🚳', '🚱', '🔞', '📵', '🚭', '❗️', '❕', '❓', '❔', '‼️', '⁉️', '🔅', '🔆', '〽️', '⚠️', '🚸', '🔱', '⚜️', '🔰', '♻️', '✅', '🈯', '💹', '❇️', '✳️', '❎', '🌐', '💠', 'Ⓜ️', '🌀', '💤', '🏧', '🚾', '♿', '🅿️', '🛗', '🈳', '🈂️', '🛂', '🛃', 'G', '🛅', '🛜', '🚰', '🚹', '♂️', '🚺', '♀️', '⚧️', '🚼', '🚻', '🚮', '🎦', '📶', '🈁', '🔣', 'ℹ️', '🔤', '🔡', '🔠', 'F', '🆗', '🆙', '🆒', '🆕', '🆓', '0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟', '🔢', '#️⃣', '*️⃣', '⏏️', '▶️', '⏸️', '⏯️', '⏹️', '⏺️', '⏭️', '⏮️', '⏩', '⏪', '⏫', '⏬', '◀️', '🔼', '🔽', '➡️', '⬅️', '⬆️', '⬇️', '↗️', '↘️', '↙️', '↖️', '↕️', '↔️', '↪️', '↩️', '⤴️', '⤵️', '🔀', '🔁', '🔂', '🔄', '🔃', '🎵', '🎶', '➕', '➖', '➗', '✖️', '🟰', '♾️', '💲', '💱', '™️', '©️', '®️', '🔚', '🔙', '🔛', '🔝', '🔜', '〰️', '➰', 'G', '✔️', '☑️', '🔘', '🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '⚫', '⚪', '🟤', '🔺', '🔻', '🔼', '🔽', '🔳', '🔲', '▪️', '▫️', '◾', '◽', '◼️', '◻️', '🟥', '🟧', '🟨', '🟩', '🟦', '🟪', '🟫', '⬛', '⬜', '🔶', '🔷', '🔸', '🔹']},
];
function populateEmojiPicker() {
    emojiCategories.innerHTML = '';
    EMOJI_CATEGORIES.forEach((category, index) => {
        const isActive = index === 0;
        emojiCategories.innerHTML += `<button class="emoji-category-btn ${isActive ? 'active' : ''}" data-category="${category.name}" title="${category.name}">${category.icon}</button>`;
    });
    loadEmojiCategory(EMOJI_CATEGORIES[0].name);
}
function loadEmojiCategory(categoryName) {
    const category = EMOJI_CATEGORIES.find(c => c.name === categoryName);
    const emojis = category ? category.emojis : [];
    let emojiHtml = '';
    emojis.forEach(emoji => {
        if (emoji) { 
            emojiHtml += `<button class="emoji-btn">${emoji}</button>`;
        }
    });
    emojiGrid.innerHTML = emojiHtml;
    emojiGrid.scrollTop = 0;
}
function handleEmojiCategorySelect(e) {
    const btn = e.target.closest('.emoji-category-btn');
    if (!btn) return;
    document.querySelectorAll('.emoji-category-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    loadEmojiCategory(btn.dataset.category);
}
function showEmojiPicker(buttonTarget, valueTarget) {
    currentEmojiInputTarget = { button: buttonTarget, value: valueTarget };
    emojiModal.classList.add('active');
}
function hideEmojiPicker() {
    emojiModal.classList.remove('active');
    currentEmojiInputTarget = null;
}
function handleEmojiSelect(e) {
    const btn = e.target.closest('.emoji-btn');
    if (btn && currentEmojiInputTarget) {
        const emoji = btn.textContent;
        currentEmojiInputTarget.button.textContent = emoji;
        currentEmojiInputTarget.value.value = emoji;
        hideEmojiPicker();
    }
}

// --- NEW V24: Icon Picker Functions ---
const ALL_BOOTSTRAP_ICONS = [ // A subset for performance
    'bi-alarm-fill', 'bi-archive-fill', 'bi-aspect-ratio-fill', 'bi-award-fill', 'bi-bank', 'bi-bar-chart-fill',
    'bi-basket-fill', 'bi-bell-fill', 'bi-book-fill', 'bi-bookmark-fill', 'bi-briefcase-fill', 'bi-broadcast',
    'bi-bug-fill', 'bi-building', 'bi-bullseye', 'bi-calculator-fill', 'bi-calendar-check-fill', 'bi-calendar-event-fill',
    'bi-camera-fill', 'bi-camera-video-fill', 'bi-capsule', 'bi-card-checklist', 'bi-cart-fill', 'bi-cash-coin',
    'bi-chat-dots-fill', 'bi-check-circle-fill', 'bi-clipboard-data-fill', 'bi-clock-fill', 'bi-cloud-fill',
    'bi-code-slash', 'bi-coin', 'bi-collection-play-fill', 'bi-compass-fill', 'bi-controller', 'bi-credit-card-fill',
    'bi-cup-fill', 'bi-diagram-3-fill', 'bi-display-fill', 'bi-dribbble', 'bi-droplet-fill', 'bi-earbuds',
    'bi-egg-fill', 'bi-eject-fill', 'bi-emoji-smile-fill', 'bi-envelope-fill', 'bi-file-earmark-code-fill', 'bi-file-earmark-music-fill',
    'bi-file-earmark-text-fill', 'bi-film', 'bi-filter', 'bi-flag-fill', 'bi-folder-fill', 'bi-fuel-pump-fill',
    'bi-funnel-fill', 'bi-gear-fill', 'bi-gem', 'bi-geo-alt-fill', 'bi-gift-fill', 'bi-github', 'bi-globe',
    'bi-google', 'bi-graph-up', 'bi-grid-fill', 'bi-hammer', 'bi-handbag-fill', 'bi-headphones', 'bi-heart-fill',
    'bi-house-door-fill', 'bi-image-fill', 'bi-inbox-fill', 'bi-joystick', 'bi-key-fill', 'bi-keyboard-fill',
    'bi-laptop-fill', 'bi-layout-text-window-reverse', 'bi-lightbulb-fill', 'bi-lightning-fill', 'bi-list-task',
    'bi-lock-fill', 'bi-magic', 'bi-mailbox', 'bi-map-fill', 'bi-megaphone-fill', 'bi-mic-fill', 'bi-moon-fill',
    'bi-mouse-fill', 'bi-music-note-beamed', 'bi-newspaper', 'bi-palette-fill', 'bi-paperclip', 'bi-pause-fill',
    'bi-pc-display', 'bi-pencil-fill', 'bi-people-fill', 'bi-phone-fill', 'bi-pie-chart-fill', 'bi-piggy-bank-fill',
    'bi-pin-map-fill', 'bi-play-fill', 'bi-plug-fill', 'bi-printer-fill', 'bi-puzzle-fill', 'bi-question-circle-fill',
    'bi-receipt', 'bi-rocket-takeoff-fill', 'bi-save-fill', 'bi-sd-card-fill', 'bi-search', 'bi-shield-shaded',
    'bi-shop', 'bi-skip-forward-fill', 'bi-slack', 'bi-smartwatch', 'bi-snow', 'bi-speaker-fill', 'bi-spotify',
    'bi-star-fill', 'bi-stopwatch-fill', 'bi-sun-fill', 'bi-tablet-fill', 'bi-tag-fill', 'bi-terminal-fill',
    'bi-tools', 'bi-trash-fill', 'bi-translate', 'bi-trophy-fill', 'bi-truck', 'bi-tv-fill', 'bi-twitch',
    'bi-twitter', 'bi-umbrella-fill', 'bi-unlock-fill', 'bi-vinyl-fill', 'bi-wallet-fill', 'bi-water',
    'bi-whatsapp', 'bi-wifi', 'bi-wind', 'bi-window-fullscreen', 'bi-wordpress', 'bi-wrench-adjustable',
    'bi-youtube', 'bi-zoom-in'
];

function populateIconPicker() {
    const query = iconSearchInput.value.toLowerCase();
    iconPickerGrid.innerHTML = '';
    let html = '';
    for (const iconName of ALL_BOOTSTRAP_ICONS) {
        if (query === '' || iconName.includes(query)) {
            html += `<button class="icon-picker-btn" data-icon="${iconName}" title="${iconName}"><i class="bi ${iconName} pointer-events-none"></i></button>`;
        }
    }
    iconPickerGrid.innerHTML = html;
}

function showIconPicker(buttonTarget, valueTarget, previewTarget) {
    currentIconInputTarget = { button: buttonTarget, value: valueTarget, preview: previewTarget };
    iconSearchInput.value = '';
    populateIconPicker();
    iconPickerModal.classList.add('active');
}

function hideIconPicker() {
    iconPickerModal.classList.remove('active');
    currentIconInputTarget = null;
}

function handleIconSelect(e) {
    const btn = e.target.closest('.icon-picker-btn');
    if (btn && currentIconInputTarget) {
        const iconName = btn.dataset.icon;
        
        // This is for Add/Edit Category modal
        if (currentIconInputTarget.preview) {
             currentIconInputTarget.preview.className = `bi ${iconName}`;
        }
        
        // This is for Add/Edit Activity (Goal) modal
        if (currentIconInputTarget.button) {
            currentIconInputTarget.button.innerHTML = `<i class="bi ${iconName}"></i>`;
        }
        
        currentIconInputTarget.value.value = iconName;
        hideIconPicker();
    }
}
// --- END V24 Icon Picker ---

// --- NEW V24 Settings Modal ---
function showSettingsModal() {
    settingsModal.classList.add('active');
}
function hideSettingsModal() {
    settingsModal.classList.remove('active');
}
// --- END V24 Settings Modal ---


// --- Theme (No Changes) ---
function toggleTheme() {
    const isDark = document.body.classList.toggle('dark-theme');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    updateTheme(isDark);
}
function loadThemePreference() {
    const preferredTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    let isDark = preferredTheme ? (preferredTheme === 'dark') : systemPrefersDark; 
    if (isDark) document.body.classList.add('dark-theme');
    else document.body.classList.remove('dark-theme');
    updateTheme(isDark); 
}
function updateTheme(isDark) {
    updateThemeIcon(isDark);
    updateChartDefaults(isDark);
    if (pages.analysis.classList.contains('active')) {
       loadAnalysisData(); 
    }
    if (pages.categories.classList.contains('active')) { // NEW
       renderCategoriesPage();
    }
}
function updateThemeIcon(isDark) {
     if(!themeIconLightSettings || !themeIconDarkSettings) return; 
     themeIconLightSettings.classList.toggle('hidden', isDark);
     themeIconDarkSettings.classList.toggle('hidden', !isDark);
}
function updateChartDefaults(isDark) {
    const legendColor = getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim();
    const gridColor = getComputedStyle(document.documentElement).getPropertyValue('--chart-grid-color').trim();
    const tooltipBgColor = getComputedStyle(document.documentElement).getPropertyValue('--chart-tooltip-bg').trim();
    const tooltipColor = getComputedStyle(document.documentElement).getPropertyValue('--chart-tooltip-text').trim();
    const chartBorderColor = getComputedStyle(document.documentElement).getPropertyValue('--chart-border-color').trim(); 
    Chart.defaults.color = legendColor;
    Chart.defaults.borderColor = chartBorderColor; 
    Chart.defaults.plugins.legend.labels.color = legendColor; 
    Chart.defaults.plugins.tooltip.backgroundColor = tooltipBgColor;
    Chart.defaults.plugins.tooltip.titleColor = tooltipColor;
    Chart.defaults.plugins.tooltip.bodyColor = tooltipColor;
    Chart.defaults.scale.grid.color = gridColor;
    Chart.defaults.scale.ticks.color = legendColor;
}

// --- Font Size (No Changes) ---
function handleFontSizeChange(e) {
    const scales = ['0.8rem', '0.9rem', '1.0rem', '1.1rem', '1.2rem'];
    const val = e.target.value; // 0-4
    const newSize = scales[val] || '1.0rem';
    document.documentElement.style.fontSize = newSize;
    localStorage.setItem('fontSize', newSize);
}
function loadFontSizePreference() {
    const savedFontSize = localStorage.getItem('fontSize');
    if (savedFontSize) {
        document.documentElement.style.fontSize = savedFontSize;
        const scales = ['0.8rem', '0.9rem', '1.0rem', '1.1rem', '1.2rem'];
        const index = scales.indexOf(savedFontSize);
        fontSizeSlider.value = index !== -1 ? index : 2;
    }
}

// --- Formatters (No Changes) ---
function formatHHMMSS(ms) {
     const secs = Math.floor(ms / 1000); const h = Math.floor(secs / 3600); const m = Math.floor((secs % 3600) / 60); const s = secs % 60;
     return [h, m, s].map(v => String(v).padStart(2, '0')).join(':');
}
function formatShortDuration(ms) {
     if (ms < 1000) return "0m"; const secs = Math.floor(ms / 1000); const h = Math.floor(secs / 3600); const m = Math.floor((secs % 3600) / 60);
     let parts = []; if (h > 0) parts.push(`${h}h`); if (m > 0) parts.push(`${m}m`);
     if (h === 0 && m === 0) { if (secs > 0) parts.push(`${secs}s`); else return "0m"; } return parts.join(' ');
}

// --- NEW V24 Categories Page Navigation ---
function navigateCategories(direction) {
    const d = currentCategoriesTimeRange.date;
    if (currentCategoriesTimeRange.type === 'month') {
        d.setMonth(d.getMonth() + direction);
    } else if (currentCategoriesTimeRange.type === 'year') {
        d.setFullYear(d.getFullYear() + direction);
    }
    renderCategoriesPage();
}

function handleCategoriesListClick(e) {
    const item = e.target.closest('.category-list-item');
    if (item) {
        const id = item.dataset.id;
        if (id && id !== 'uncategorized') {
            showAddCategoryModal(id);
        }
    }
}

