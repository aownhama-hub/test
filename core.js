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
let activities = new Map();
let plannerItems = new Map(); // Planner items (tasks, deadlines)
let allTimeLogs = []; // Cache for all logs, used by Track page
// let todaysLogs = []; // This is now deprecated, logic moves to renderTrackList
// globalSettings is removed
let currentAnalysisView = 'daily'; 
let currentAnalysisDate = new Date(); 
let barChartInstance = null;
let pieChartInstance = null;
let analysisLogs = []; // Logs for the current analysis period
let logToEditId = null;
let logToDelete = { id: null, type: null };
let activityToEditId = null;
// draggedItemElement is removed
let previousTimeString = "00:00:00"; 
let currentEmojiInputTarget = null;
let stopTimerCompletion = null; 
// selectedGoalView is removed
// currentPeriodLogTotals is removed

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
    // planner: DELETED
    analysis: document.getElementById('analysis-page'),
    settings: document.getElementById('settings-page')
};
const navButtons = document.querySelectorAll('.nav-btn');
// activityListEl is DELETED
// addActivityForm is DELETED
// newActivityNameInput is DELETED
// newActivityColorInput is DELETED
// newActivityEmojiBtn is DELETED
// newActivityEmojiValue is DELETED
// newActivityCategoryInput is DELETED
// addActivityBtn is DELETED
const categoryDatalist = document.getElementById('category-list-datalist');
// categoryFilter is DELETED

const themeToggleBtnSettings = document.getElementById('theme-toggle-btn-settings');
const themeIconLightSettings = document.getElementById('theme-icon-light-settings');
const themeIconDarkSettings = document.getElementById('theme-icon-dark-settings');

// Settings page refs
const fontSizeSlider = document.getElementById('font-size-slider');
const signInBtn = document.getElementById('sign-in-btn');
const signOutBtn = document.getElementById('sign-out-btn');
const userInfo = document.getElementById('user-info');
const userEmail = document.getElementById('user-email');
// Removed global settings form refs

// Home page refs
const homeTimerCard = document.getElementById('home-timer-card'); 
const homeTimerLabel = document.getElementById('home-timer-label');
const homeTimerActivityName = document.getElementById('home-timer-activity-name'); 
const homeTimerTime = document.getElementById('home-timer-time'); 
const homeTimerStopBtn = document.getElementById('home-timer-stop-btn'); 
const generateAiSummaryBtn = document.getElementById('generate-ai-summary-btn'); 
const aiSummaryContent = document.getElementById('ai-summary-content'); 
const homeTodayList = document.getElementById('home-today-list'); // NEW
// homeAgendaList, homeTasksList, homeDailyGoalsList are DELETED

// Track page refs
// goalViewToggle is DELETED
// NEW Track Page Refs
const trackSearchBox = document.getElementById('search-box');
const trackViewToggleBtn = document.getElementById('view-toggle-btn');
const trackViewIconList = document.getElementById('view-toggle-icon-list');
const trackViewIconGrid = document.getElementById('view-toggle-icon-grid');
const trackTimeRangeBtn = document.getElementById('time-range-btn');
const trackTimeNavPrev = document.getElementById('time-nav-prev');
const trackTimeNavNext = document.getElementById('time-nav-next');
const trackFilterBtn = document.getElementById('filter-btn');
const trackContentArea = document.getElementById('track-content-area');

// Planner Page Refs are DELETED

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
// showManualEntryBtn is DELETED
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

const editActivityModal = document.getElementById('edit-activity-modal');
const editActivityForm = document.getElementById('edit-activity-form');
const cancelEditActivityBtn = document.getElementById('cancel-edit-activity-btn');
const editActivityIdInput = document.getElementById('edit-activity-id');
const editActivityNameInput_Input = document.getElementById('edit-activity-name-input');
const editActivityColorInput = document.getElementById('edit-activity-color-input');
const editActivityEmojiBtn = document.getElementById('edit-activity-emoji-input'); 
const editActivityEmojiValue = document.getElementById('edit-activity-emoji-value');
const deleteActivityFromModalBtn = document.getElementById('delete-activity-from-modal-btn'); 

// Edit Activity Modal refs for Goal/Pin/Category
const editActivityCategory = document.getElementById('edit-activity-category'); // MODIFIED
const editActivityGoalValueInput = document.getElementById('edit-activity-goal-value'); 
const editActivityGoalPeriodInput = document.getElementById('edit-activity-goal-period'); 
const editActivityPin = document.getElementById('edit-activity-pin'); // MODIFIED

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

const emojiModal = document.getElementById('emoji-modal');
const emojiGrid = document.getElementById('emoji-grid');
const closeEmojiModalBtn = document.getElementById('close-emoji-modal-btn');
const emojiCategories = document.getElementById('emoji-categories');

// --- NEW Universal Add Button ---
const universalAddBtn = document.getElementById('universal-add-btn');

// --- NEW Modal Refs ---
const addItemModal = document.getElementById('add-item-modal');
const addItemForm = document.getElementById('add-item-form');
const cancelAddItemBtn = document.getElementById('cancel-add-item-btn');
const saveAddItemBtn = document.getElementById('save-add-item-btn');

const timeRangeModal = document.getElementById('time-range-modal');
const cancelTimeRangeBtn = document.getElementById('cancel-time-range-btn');

const filterModal = document.getElementById('filter-modal');
const closeFilterModalBtn = document.getElementById('close-filter-modal-btn');
const filterTypeContainer = document.getElementById('filter-type-container');
const filterTabActivities = document.getElementById('filter-tab-activities');
const filterTabCategories = document.getElementById('filter-tab-categories');
const filterListActivities = document.getElementById('filter-list-activities');
const filterListCategories = document.getElementById('filter-list-categories');

// --- App Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    loadThemePreference(); 
    loadFontSizePreference();
    setupEventListeners();
    authenticateUser(); 
    setDefaultAnalysisDate();
    setFlipClock("00:00:00"); 
    populateEmojiPicker();
    // Set default time range
    updateTimeRange('today');
});

// --- MODIFIED Event Listeners Setup ---
function setupEventListeners() {
    navButtons.forEach(btn => btn.addEventListener('click', () => showPage(btn.dataset.page)));
    
    // --- Removed Old Listeners ---
    // addActivityForm.addEventListener('submit', handleAddActivity); // Replaced
    // activityListEl.addEventListener('click', handleActivityListClick); // Replaced
    // goalViewToggle.addEventListener('click', handleGoalViewToggle); // Replaced
    // categoryFilter.addEventListener('change', () => renderActivityList()); // Replaced
    // plannerTabContainer.addEventListener('click', handlePlannerTabClick); // Replaced
    // addPlannerItemForm.addEventListener('submit', handleAddPlannerItem); // Replaced
    // plannerItemType.addEventListener('change', toggleTargetHours); // Replaced
    // plannerItemListContainer.addEventListener('click', handlePlannerListClick); // Replaced
    // homeTasksList.addEventListener('click', handleHomeTaskListClick); // Replaced
    // showManualEntryBtn.addEventListener('click', showManualEntryModal); // Replaced

    // --- NEW Home Listeners ---
    homeTimerStopBtn.addEventListener('click', stopTimer); 
    generateAiSummaryBtn.addEventListener('click', handleGenerateAISummary); 
    homeTodayList.addEventListener('click', handleHomeItemClick); // NEW

    // --- NEW Track Listeners ---
    trackSearchBox.addEventListener('input', () => {
        trackSearchQuery = trackSearchBox.value;
        renderTrackPage();
    });
    trackViewToggleBtn.addEventListener('click', handleViewToggle);
    trackTimeRangeBtn.addEventListener('click', showTimeRangeModal);
    trackTimeNavPrev.addEventListener('click', () => mapTimeRange(-1));
    trackTimeNavNext.addEventListener('click', () => mapTimeRange(1));
    trackFilterBtn.addEventListener('click', showFilterModal);
    trackContentArea.addEventListener('click', handleTrackListClick);

    // --- NEW Universal Add Button ---
    // **** THIS IS THE FIX ****
    universalAddBtn.addEventListener('click', () => showAddItemModal()); // Wrapped in () => ... to prevent passing event

    // --- Settings Listeners (Unchanged) ---
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

    // --- Edit Activity Listeners (Unchanged) ---
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
    confirmDeleteBtn.addEventListener('click', handleConfirmDelete); // Logic inside is updated
    
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
    addClickOutsideListener(editActivityModal, hideEditActivityModal);
    addClickOutsideListener(logDetailsModal, hideLogDetailsModal);
    addClickOutsideListener(emojiModal, hideEmojiPicker);

    // --- NEW Modal Listeners ---
    addClickOutsideListener(addItemModal, hideAddItemModal);
    cancelAddItemBtn.addEventListener('click', hideAddItemModal);
    addItemForm.addEventListener('submit', handleAddItem);

    addClickOutsideListener(timeRangeModal, hideTimeRangeModal);
    cancelTimeRangeBtn.addEventListener('click', hideTimeRangeModal);
    timeRangeModal.addEventListener('click', handleTimeRangeSelect);

    closeFilterModalBtn.addEventListener('click', applyFiltersAndClose);
    filterTypeContainer.addEventListener('click', handleFilterTypeToggle);
    filterTabActivities.addEventListener('click', () => switchFilterTab('activities'));
    filterTabCategories.addEventListener('click', () => switchFilterTab('categories'));
    // Checkbox clicks are handled by applyFiltersAndClose

    // --- Emoji Picker Listeners (Unchanged) ---
    // editActivityEmojiBtn is now a dynamic element, listener added in showAddItemModal
    emojiCategories.addEventListener('click', handleEmojiCategorySelect);
    emojiGrid.addEventListener('click', handleEmojiSelect);
    closeEmojiModalBtn.addEventListener('click', hideEmojiPicker);
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
    // plannerItemDueDateInput.value = getTodayString(); // DELETED
}

// --- Auth & Data Loading (MODIFIED) ---
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

// loadGlobalSettings() and handleSaveSettings() are DELETED

// MODIFIED: Clear All User Data
function clearAllUserData() {
    if (currentTimer) stopTimer(); 
    activities.clear();
    plannerItems.clear(); // NEW
    allTimeLogs = []; // NEW
    analysisLogs = [];
    // currentPeriodLogTotals.clear(); // DELETED
    
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
         
         // Show/hide universal add button
         if (pageName === 'home' || pageName === 'track') {
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
         // populateCategoryFilter(); // DELETED
         // setupDragAndDrop(activityListEl, activities, 'activity'); // DELETED
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

// Populate Category Datalist (Kept)
function populateCategoryDatalist() {
    categoryDatalist.innerHTML = '';
    const categories = new Set(Array.from(activities.values()).map(a => a.category).filter(c => c && c !== 'Uncategorized'));
    categories.forEach(c => {
        categoryDatalist.innerHTML += `<option value="${c}">`;
    });
}

// populateCategoryFilter() is DELETED

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

// --- Emoji Picker Functions (No Changes) ---
const EMOJI_CATEGORIES = [
    { name: 'Smileys', icon: '😀', emojis: ['😀', '😁', '😂', '🤣', '😃', '😄', '😅', '😆', '😉', '😊', '😋', '😎', '😍', '😘', '🥰', '😗', '😙', '🥲', '🤔', '🤫', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '😮‍💨', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '🥸', '🤓', '🧐', '😕', '😟', '🙁', '😮', '😯', '😲', '😳', '🥺', '😦', '😧', '😨', '😰', '😥', '😢', '😭', '😱', '😖', '😣', '😞', '😓', '😩', '😫', '🥱', '😤', '😡', '😠', '🤬', '😈', '👿', '💀', '💩', '🤡', '👹', '👺', '👻', '👽', '🤖', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾']},
    { name: 'People', icon: '👋', emojis: ['👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🫰', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💅', '🤳', '💪', '🦾', '🦵', '🦶', '👂', '🦻', '👃', '🧠', '🫀', '🦷', '🦴', '👀', '👁️', '👅', '👄', '👶', '🧒', '👦', '👧', '🧑', '👱', '👨', '👩', '🧓', '👴', '👵', '🙍', '🙎', '🙅', '🙆', '💁', '🙋', '🧏', '🙇', '🤦', '🤷', '🧑‍⚕️', '🧑‍🎓', '🧑‍🏫', '🧑‍⚖️', '🧑‍🌾', '🧑‍🍳', '🧑‍🔧', '🧑‍🏭', '🧑‍💼', '🧑‍🔬', '🧑‍💻', '🧑‍🎤', '🧑‍🎨', '🧑‍✈️', '🧑‍🚀', '🧑‍🚒', '👮', '🕵️', '💂', '🥷', '👷', '🤴', '👸', '👳', '👲', '🧕', '🤵', '👰', '🤰', '🤱', '👼', '🎅', '🦸', '🦹', '🧙', '🧚', '🧛', '🧜', '🧝', '🧞', '🧟', '💆', '💇', '🚶', '🧍', '🧎', '🧑‍🦽', '🧑‍🦼', '🏃', '💃', '🕺', '🕴️', '👯', '🧘', '🛀', '🛌', '🫂', '🗣️', '👤', '👥', '👣']},
    { name: 'Food', icon: '🍎', emojis: ['🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶️', '🫑', '🌽', '🥕', '🫒', '🧄', '🧅', '🥔', '🍠', '🥐', '🥯', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳', '🧈', '🥞', '🧇', '🥓', '🥩', '🍗', '🍖', '🦴', '🌭', '🍔', '🍟', '🍕', '🫓', '🥪', '🥙', '🧆', '🌮', '🌯', '🫔', '🥗', '🥘', '🫕', '🥫', '🍝', '🍜', '🍲', '🍛', '🍣', '🍱', '🥟', '🦪', '🍤', '🍙', '🍚', '🍘', '🍥', '🥠', '🥮', '🍢', '🍡', '🍧', '🍨', '🍦', '🍰', '🧁', '🥧', '🍮', '🎂', '🍭', '🍬', '🍫', '🍿', '🍩', '🍪', '🌰', '🥜', '🍯', '🥛', '🍼', '☕', '🫖', '🍵', '🍶', '🍾', '🍷', '🍸', '🍹', '🍺', '🍻', '🥂', '🥃', '🥤', '🧋', '🧃', '🧉', '🧊', '🥄', '🍴', '🔪', '🏺', '🌍', '🇪🇺', '🇺🇸', '🌏', '🇦🇺']},
    { name: 'Activities', icon: '⚽', emojis: ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛷', '⛸️', '🥌', '🎿', '⛷️', '🏂', '🪂', '🏋️', '🤸', '⛹️', '🤺', '🤾', '🏌️', '🏇', '🧘', '🏄', '🏊', '🤽', '🚣', '🧗', '🚵', '🚴', '🏆', '🥇', '🥈', '🥉', '🏅', '🎗️', '🎫', '🎪', '🤹', '🎭', '🩰', '🎨', '🎬', '🎤', '🎧', '🎼', '🎹', '🥁', '🎷', '🎺', '🎸', '🪕', '🎻', '🎲', '♟️', '🎯', '🎱', '🎮', '🎰', '🧩']},
    { name: 'Travel', icon: '🚗', emojis: ['🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🛻', '🚚', '🚛', '🚜', '🚔', '🚍', '🏍️', '🛵', '🦽', '🦼', '🛺', '🚲', '🛴', '🛹', '🛼', '🚏', '🛣️', '🛤️', '🛢️', '⛽', '🛞', '🚨', '🚥', '🚦', '🛑', '🚧', '⚓', '⛵', '🛶', '🚤', '🛳️', '⛴️', '🛥️', '🚢', '✈️', '🛩️', '🛫', '🛬', '🪂', '💺', '🚁', '🚠', '🚞', '🚊', '🚝', '🚄', '🚅', '🚈', '🚂', '🚆', '🚇', '🚉', '🛸', '🚀', '🛰️', '🪐', '🌠', '🌌', '⛱️', '🎆', '🎇', '🎑', '🗾', '🗺️', '🌍', '🌎', '🌏', '🌐', '🧭', '🏔️', '⛰️', '🌋', '🗻', '🏕️', '🏖️', '🏜️', '🏝️', '🏞️', '🏟️', '🏛️', '🏗️', '🏘️', '🏚️', '🏠', '🏡', '🏢', '🏣', '🏤', '🏥', '🏦', '🏨', '🏪', '🏫', '🏬', '🏭', '🏯', '🏰', '💒', '🗼', '🗽', '⛪', '🕌', '🛕', '🕍', '🕋', '⛲', '⛺', '🌁', '🌃', '🏙️', '🌄', '🌅', '🌆', '🌇', '🌉', '♨️', '🎠', '🎡', '🎢', '💈', '🛎️', '🧳', '⌛', '⏳', '⌚', '⏰', '⏱️', '⏲️', '🕰️', '🌡️', '☀️', '☁️', '⛅', '⛈️', '🌤️', '🌥️', '🌦️', '🌧️', '🌨️', '🌩️', '🌪️', '🌫️', '🌬️', '🌀', '🌈', '🌂', '☂️', '☔', '⚡', '❄️', '☃️', '⛄', '☄️', '🔥', '💧', '🌊']},
    { name: 'Objects', icon: '⌚', emojis: ['⌚', '📱', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '🖲️', '🕹️', '🗜️', '⚙️', '🔧', '🔨', '⚒️', '⛏️', '🔩', '🧱', '🪨', '🪵', '🛖', '🛞', '⚖️', '🦯', '🔗', '⛓️', '🪝', '🧰', '🧲', '🪜', '⚗️', '🧪', '🧫', '🧬', '🔬', '🔭', '📡', '💉', '🩸', '💊', '🩹', '🩺', '🚪', '🛗', '🪞', '🪟', '🛏️', '🛋️', '🪑', '🚽', '🪠', '🚿', '🛁', '🪤', '🪒', '🧴', '🧷', '🧹', '🧺', '🧻', '🪣', '🧼', '🪥', '🧽', '🧯', '🛒', '🚬', '⚰️', '🪦', '⚱️', '🗿', '🪧', '🔮', '🪄', '📿', '💎', '💍', '💄', '💋', '💌', '💘', '💝', '💖', '💗', '💓', '💞', '💕', '💟', '❣️', '💔', '💯', '💢', '💣', '😵', '🤯', '💬', '👁️‍🗨️', '🗨️', '🗯️', '💭', '💤', '💮', '💈', '👓', '🕶️', '🥽', '🥼', '🦺', '👔', '👕', '👖', '🧣', '🧤', '🧥', '🧦', '👗', '👘', '🥻', '🩱', '🩲', '🩳', '👙', '👚', '👛', '👜', '👝', '🎒', '🩴', '👞', '👟', '🥾', '🥿', '👠', '👡', '🩰', '👢', '👑', '👒', '🎩', '🎓', '🧢', '🪖', '⛑️', '🔇', '🔈', '🔉', '🔊', '📢', '📣', '📯', '🔔', '🔕', '🎼', '🎵', '🎶', '💹', '📇', '📈', '📉', '📊', '📋', '📌', '📍', '📎', '🖇️', '📏', '📐', '✂️', '🗃️', '🗂️', '🗑️', '🔒', '🔓', '🔏', '🔐', '🔑', '🗝️', '🔨', '🪓', '⛏️', '⚒️', '🛠️', '🗡️', '⚔️', '🔫', '🪃', '🏹', '🛡️', '🪚', '🔧', '🔩', '🗜️', '⚖️', '🦯', '🔗', '⛓️', '🪝', '🧰', '🧲', '🪜', '⚗️', '🧪', '🧫', '🧬', '🔬', '🔭', '📡', '💉', '🩸', '💊', '🩹', '🩺', '🚪', '🛗', '🪞', '🪟', '🛏️', '🛋️', '🪑', '🚽', '🪠', '🚿', '🛁', '🪤', '🪒', '🧴', '🧷', '🧹', '🧺', '🧻', 'G', '🧽', '🧯', '🛒', '🚬', '⚰️', '🪦', '⚱️', '🗿', '🪧', '🎄', '🎆', '🎇', '🧨', '✨', '🎈', '🎉', '🎊', '🎋', '🎍', '🎎', '🎏', '🎐', '🎑', '🧧', '🎀', '🎁']},
    { name: 'Symbols', icon: '❤️', emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤎', '🤍', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐', '⛎', '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓', '🆔', '⚛️', '🉑', '☢️', '☣️', '📴', '📳', '🈶', '🈚', '🈸', '🈺', '🈷️', '✴️', '🆚', '💮', '🉐', '㊙️', '㊗️', '🈴', '🈵', '🈹', '🈲', '🅰️', '🅱️', '🆎', '🆑', '🅾️', '🆘', '❌', '⭕', '🛑', '⛔', '📛', '🚫', '💯', '💢', '♨️', '🚷', '🚯', '🚳', '🚱', '🔞', '📵', '🚭', '❗️', '❕', '❓', '❔', '‼️', '⁉️', '🔅', '🔆', '〽️', '⚠️', '🚸', '🔱', '⚜️', '🔰', '♻️', '✅', '🈯', '💹', '❇️', '✳️', '❎', '🌐', '💠', 'Ⓜ️', '🌀', '💤', '🏧', '🚾', '♿', '🅿️', '🛗', '🈳', '🈂️', '🛂', '🛃', '🛄', '🛅', '🛜', '🚰', '🚹', '♂️', '🚺', '♀️', '⚧️', '🚼', '🚻', '🚮', '🎦', '📶', '🈁', '🔣', 'ℹ️', '🔤', '🔡', '🔠', 'F', '🆗', '🆙', '🆒', '🆕', '🆓', '0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟', '🔢', '#️⃣', '*️⃣', '⏏️', '▶️', '⏸️', '⏯️', '⏹️', '⏺️', '⏭️', '⏮️', '⏩', '⏪', '⏫', '⏬', '◀️', '🔼', '🔽', '➡️', '⬅️', '⬆️', '⬇️', '↗️', '↘️', '↙️', '↖️', '↕️', '↔️', '↪️', '↩️', '⤴️', '⤵️', '🔀', '🔁', '🔂', '🔄', '🔃', '🎵', '🎶', '➕', '➖', '➗', '✖️', '🟰', '♾️', '💲', '💱', '™️', '©️', '®️', '🔚', '🔙', '🔛', '🔝', '🔜', '〰️', '➰', 'G', '✔️', '☑️', '🔘', '🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '⚫', '⚪', '🟤', '🔺', '🔻', '🔼', '🔽', '🔳', '🔲', '▪️', '▫️', '◾', '◽', '◼️', '◻️', '🟥', '🟧', '🟨', '🟩', '🟦', '🟪', '🟫', '⬛', '⬜', '🔶', '🔷', '🔸', '🔹']},
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

// --- Drag & Drop (DELETED) ---
// setupDragAndDrop()
// getDragAfterElement()
// reorderLocalArrayAndCategory()
// saveOrder()
// --- All DELETED ---

