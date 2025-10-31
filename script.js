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
    universalAddBtn.addEventListener('click', showAddItemModal);

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

// --- NEW Home Page Rendering ---
function renderHomePage() {
    if (!userId) {
        homeTodayList.innerHTML = `<p class="text-center text-muted text-sm w-full">Please sign in.</p>`;
        homeTimerCard.classList.remove('active');
        aiSummaryContent.style.display = 'none';
        return;
    }

    const todayString = getTodayString();
    
    // 1. Render Active Timer Card
    if (currentTimer) {
        homeTimerLabel.textContent = currentTimer.timerType === 'task' ? 'Tracking Task:' : 'Tracking Activity:';
        homeTimerActivityName.textContent = currentTimer.activityName;
        const elapsedMs = Date.now() - currentTimer.startTime;
        homeTimerTime.textContent = formatHHMMSS(elapsedMs);
        homeTimerCard.classList.add('active');
    } else {
        homeTimerCard.classList.remove('active');
    }

    // 2. Render Today List (Goals, Tasks, Deadlines)
    homeTodayList.innerHTML = '';
    
    // Get Today's Planner Items
    const todayPlannerItems = Array.from(plannerItems.values())
        .filter(item => item.dueDate === todayString && !item.isCompleted)
        .sort((a, b) => a.name.localeCompare(b.name));

    // Get Daily Goals from Activities
    const dailyGoals = Array.from(activities.values())
        .filter(act => act.goal && act.goal.period === 'daily' && act.goal.value > 0)
        .sort((a, b) => a.name.localeCompare(b.name));

    let itemsFound = false;

    // Render Daily Goals
    if (dailyGoals.length > 0) {
        itemsFound = true;
        dailyGoals.forEach(activity => {
            const totalTodayMs = allTimeLogs
                .filter(log => log.activityId === activity.id && log.timerType === 'activity' && new Date(log.startTime) >= getStartOfDate(new Date()))
                .reduce((acc, log) => acc + log.durationMs, 0);
            
            homeTodayList.insertAdjacentHTML('beforeend', renderHomeItem(activity, 'goal', totalTodayMs));
        });
    }

    // Render Today's Planner Items
    if (todayPlannerItems.length > 0) {
        itemsFound = true;
        todayPlannerItems.forEach(item => {
            homeTodayList.insertAdjacentHTML('beforeend', renderHomeItem(item, item.type));
        });
    }

    if (!itemsFound) {
        homeTodayList.innerHTML = `<p class="text-sm" style="color: var(--text-muted);">Nothing scheduled for today. Tap the '+' button to add an item.</p>`;
    }
}

// NEW: Renderer for a single item on the Home page
function renderHomeItem(item, type, totalTodayMs = 0) {
    const isRunning = currentTimer && currentTimer.activityId === item.id && 
                      ((type === 'task' && currentTimer.timerType === 'task') || (type === 'goal' && currentTimer.timerType === 'activity'));
    const timerActive = currentTimer !== null;

    let emoji, name, detailsHtml, actionHtml;

    if (type === 'goal') {
        emoji = item.emoji || '🎯';
        name = item.name;
        
        let goalMs = (item.goal.value || 0) * 3600000;
        const percentage = goalMs > 0 ? Math.min(100, (totalTodayMs / goalMs) * 100) : 0;
        
        detailsHtml = `
            <p>${formatShortDuration(totalTodayMs)} of ${item.goal.value}h (${percentage.toFixed(0)}%)</p>
            <div class="goal-bar-bg mt-1">
                <div class="goal-bar-fill" style="width: ${percentage}%; background-color: ${item.color || '#808080'}"></div>
            </div>
        `;
        actionHtml = `
            <button class="home-item-action-btn btn-start-activity" data-id="${item.id}" data-type="activity" ${timerActive ? 'disabled' : ''}>
                <svg class="w-6 h-6 pointer-events-none" fill="currentColor" viewBox="0 0 20 20">${isRunning ? 
                    `<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clip-rule="evenodd"></path>` : 
                    `<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd"></path>`
                }</svg>
            </button>
        `;
    } else if (type === 'task') {
        emoji = '📌'; // Task emoji
        name = item.name;
        const tracked = item.trackedDurationMs || 0;
        let subtext = `${formatShortDuration(tracked)} tracked`;
        if (item.targetHours > 0) {
            const targetMs = item.targetHours * 3600000;
            const percentage = Math.min(100, (tracked / targetMs) * 100).toFixed(0);
            subtext = `${formatShortDuration(tracked)} / ${item.targetHours}h (${percentage}%)`;
        }
        detailsHtml = `<p>${subtext}</p>`;
        actionHtml = `
            <button class="home-item-action-btn btn-start-task" data-id="${item.id}" data-type="task" ${timerActive ? 'disabled' : ''}>
                <svg class="w-6 h-6 pointer-events-none" fill="currentColor" viewBox="0 0 20 20">${isRunning ? 
                    `<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clip-rule="evenodd"></path>` : 
                    `<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd"></path>`
                }</svg>
            </button>
        `;
    } else { // 'deadline'
        emoji = '📅'; // Deadline emoji
        name = item.name;
        detailsHtml = `<p>Deadline</p>`;
        actionHtml = `
            <input type="checkbox" class="home-item-checkbox" data-id="${item.id}" ${item.isCompleted ? 'checked' : ''}>
        `;
    }

    return `
    <div class-="home-item" data-id="${item.id}" data-type="${type}">
        <span class="home-item-emoji">${emoji}</span>
        <div class="home-item-details">
            <h4>${name}</h4>
            ${detailsHtml}
        </div>
        ${actionHtml}
    </div>
    `;
}

// NEW: Handle Home Page Clicks
function handleHomeItemClick(e) {
    const startTaskBtn = e.target.closest('.btn-start-task');
    const startActivityBtn = e.target.closest('.btn-start-activity');
    const checkbox = e.target.closest('.home-item-checkbox');

    if (startTaskBtn && !startTaskBtn.disabled) {
        const id = startTaskBtn.dataset.id;
        const item = plannerItems.get(id);
        if (item) {
            startTimer(item.id, item.name, '#808080', 'task');
        }
    } else if (startActivityBtn && !startActivityBtn.disabled) {
        const id = startActivityBtn.dataset.id;
        const activity = activities.get(id);
        if (activity) {
            startTimer(activity.id, activity.name, activity.color, 'activity');
        }
    } else if (checkbox) {
        const id = checkbox.dataset.id;
        handlePlannerItemCheck(id, checkbox.checked);
    }
}

// --- NEW AI Summary Functions (Unchanged from old file) ---
async function handleGenerateAISummary() {
    if (!userId) return;
    generateAiSummaryBtn.disabled = true;
    generateAiSummaryBtn.textContent = "Generating...";
    aiSummaryContent.style.display = 'none';
    try {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        sevenDaysAgo.setHours(0, 0, 0, 0);
        const snapshot = await timeLogsCollection()
            .where('startTime', '>=', sevenDaysAgo.getTime())
            .orderBy('startTime', 'asc')
            .get();
        if (snapshot.empty) {
            aiSummaryContent.innerHTML = `<p>Not enough data from the last 7 days to generate a summary.</p>`;
            aiSummaryContent.style.display = 'block';
            return;
        }
        let logSummary = "Activity Log (Last 7 Days):\n";
        let dayLogs = new Map();
        snapshot.forEach(doc => {
            const log = doc.data();
            if (log.timerType === 'task') return; 
            const date = new Date(log.startTime).toLocaleDateString('en-CA');
            const activityName = activities.get(log.activityId)?.name || log.activityName;
            if (!dayLogs.has(date)) dayLogs.set(date, new Map());
            let dateMap = dayLogs.get(date);
            let currentDuration = dateMap.get(activityName) || 0;
            dateMap.set(activityName, currentDuration + log.durationMs);
        });
        if (dayLogs.size === 0) {
             aiSummaryContent.innerHTML = `<p>No activity data from the last 7 days to generate a summary (only task data found).</p>`;
            aiSummaryContent.style.display = 'block';
            return;
        }
        dayLogs.forEach((dateMap, date) => {
            logSummary += `Date: ${date}\n`;
            dateMap.forEach((durationMs, activityName) => {
                logSummary += `- ${activityName}: ${formatShortDuration(durationMs)}\n`;
            });
        });
        const systemPrompt = "You are a friendly and encouraging productivity coach. Analyze the user's time tracking log for the past week. Provide a concise, 2-3 sentence summary. Be encouraging, point out one positive trend, and gently suggest one area for potential improvement. Do not use markdown or bullet points, just a simple paragraph.";
        const userQuery = logSummary;
        const responseText = await callGeminiAPI(systemPrompt, userQuery);
        aiSummaryContent.innerHTML = `<p>${responseText.replace(/\n/g, '<br>')}</p>`;
        aiSummaryContent.style.display = 'block';
    } catch (error) {
        console.error("Error generating AI summary:", error);
        aiSummaryContent.innerHTML = `<p>Sorry, an error occurred while generating the summary.</p>`;
        aiSummaryContent.style.display = 'block';
    } finally {
        generateAiSummaryBtn.disabled = false;
        generateAiSummaryBtn.textContent = "Generate Summary";
    }
}
async function callGeminiAPI(systemPrompt, userQuery) {
    const apiKey = ""; // API key will be injected
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
    const payload = {
        contents: [{ parts: [{ text: userQuery }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
    };
    const response = await fetchWithBackoff(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorBody}`);
    }
    const result = await response.json();
    const candidate = result.candidates?.[0];
    if (candidate && candidate.content?.parts?.[0]?.text) {
        return candidate.content.parts[0].text;
    } else {
        console.warn("Gemini API response structure unexpected:", result);
        throw new Error("Invalid response from AI service.");
    }
}
async function fetchWithBackoff(url, options, retries = 3, delay = 1000) {
    try {
        const response = await fetch(url, options);
        if (response.status === 429 && retries > 0) { 
            await new Promise(resolve => setTimeout(resolve, delay));
            return fetchWithBackoff(url, options, retries - 1, delay * 2);
        }
        return response;
    } catch (error) {
        if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, delay));
            return fetchWithBackoff(url, options, retries - 1, delay * 2);
        }
        throw error;
    }
}

// --- Track Page (NEW) ---

// renderQuickStart() and handleQuickStartClick() are DELETED

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

// loadTodaysTimeLogs() is DELETED
// handleGoalViewToggle() is DELETED
// getGoalDateRange() is DELETED
// updateLogCache() is DELETED
// renderGoalItem() is DELETED (logic moved to renderHomeItem/renderTrackItem)
// renderActivityList() is DELETED (replaced by renderTrackPage)

// --- NEW Track Page Main Functions ---

function handleViewToggle() {
    if (currentTrackView === 'list') {
        currentTrackView = 'grid';
        trackViewIconList.classList.add('hidden');
        trackViewIconGrid.classList.remove('hidden');
    } else {
        currentTrackView = 'list';
        trackViewIconList.classList.remove('hidden');
        trackViewIconGrid.classList.add('hidden');
    }
    renderTrackPage();
}

function renderTrackPage() {
    if (!userId) {
        trackContentArea.innerHTML = `<p class="text-center text-muted p-4">Please sign in.</p>`;
        return;
    }
    
    trackContentArea.innerHTML = `<div class="text-center p-8"><p class="text-muted">Loading...</p></div>`; // Loading state

    if (currentTrackView === 'list') {
        trackContentArea.classList.remove('grid-view');
        renderTrackList();
    } else {
        trackContentArea.classList.add('grid-view');
        renderTrackGrid();
    }
}

async function renderTrackList() {
    if (!userId) return;

    // 1. Get all items (Goals from Activities, Tasks/Deadlines from Planner)
    let allItems = [];
    
    // Get Goals from activities
    activities.forEach(activity => {
        if (activity.goal && activity.goal.value > 0) {
            allItems.push({
                ...activity,
                type: 'goal',
                date: null // Recurring goals don't have a single due date
            });
        }
    });

    // Get Tasks and Deadlines from planner
    plannerItems.forEach(item => {
        allItems.push({
            ...item,
            type: item.type, // 'task' or 'deadline'
            date: new Date(item.dueDate + 'T00:00:00')
        });
    });

    // 2. Filter items based on state
    const today = getStartOfDate(new Date());
    const searchQuery = trackSearchQuery.toLowerCase();
    
    const filteredItems = allItems.filter(item => {
        // Filter by Search Query
        if (searchQuery) {
            const name = item.name?.toLowerCase() || '';
            const category = item.category?.toLowerCase() || '';
            const notes = item.notes?.toLowerCase() || ''; // For deadlines
            if (!name.includes(searchQuery) && !category.includes(searchQuery) && !notes.includes(searchQuery)) {
                return false;
            }
        }
        
        // Filter by Type
        if (currentTrackFilters.types.length > 0 && !currentTrackFilters.types.includes(item.type)) {
            return false;
        }
        
        // Filter by Activity (only applies to goals)
        if (item.type === 'goal' && currentTrackFilters.activities.length > 0 && !currentTrackFilters.activities.includes(item.id)) {
            return false;
        }

        // Filter by Category
        if (currentTrackFilters.categories.length > 0 && !currentTrackFilters.categories.includes(item.category)) {
            return false;
        }

        // Filter by Time Range (only for tasks and deadlines)
        if (item.type === 'task' || item.type === 'deadline') {
            if (item.date < currentTrackTimeRange.start || item.date > currentTrackTimeRange.end) {
                // Check for overdue items if range includes today
                const isOverdue = item.date < today && !item.isCompleted;
                const rangeIncludesToday = currentTrackTimeRange.start <= today && currentTrackTimeRange.end >= today;
                
                if (isOverdue && rangeIncludesToday) {
                    // It's overdue, show it in today's range
                } else {
                    return false;
                }
            }
        }
        
        return true;
    });
    
    // 3. Group filtered items by day
    const groups = new Map();
    const todayString = today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    // Add recurring goals to a special 'Recurring' group if they fit the period
    filteredItems.filter(item => item.type === 'goal').forEach(goal => {
        const period = goal.goal.period;
        let groupName = 'Recurring Goals';
        
        if (period === 'daily' && currentTrackTimeRange.type !== 'today') groupName = null;
        if (period === 'weekly' && currentTrackTimeRange.type !== 'week') groupName = null;
        if (period === 'monthly' && currentTrackTimeRange.type !== 'month') groupName = null;
        if (period === 'yearly' && currentTrackTimeRange.type !== 'year') groupName = null;
        
        if (groupName) {
            if (!groups.has(groupName)) groups.set(groupName, []);
            groups.get(groupName).push(goal);
        }
    });

    // Add tasks and deadlines
    filteredItems.filter(item => item.type === 'task' || item.type === 'deadline').forEach(item => {
        let groupName;
        if (item.date < today && !item.isCompleted) {
            groupName = 'Overdue';
        } else {
            groupName = item.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            if (groupName === todayString) groupName = 'Today';
        }
        
        if (!groups.has(groupName)) groups.set(groupName, []);
        groups.get(groupName).push(item);
    });

    // 4. Render groups
    trackContentArea.innerHTML = '';
    
    if (filteredItems.length === 0) {
        trackContentArea.innerHTML = `<p class="text-center text-muted p-4">No items match your criteria.</p>`;
        return;
    }

    // Sort groups (Overdue, Today, Recurring Goals, then by date)
    const sortedGroupNames = Array.from(groups.keys()).sort((a, b) => {
        if (a === 'Overdue') return -1;
        if (b === 'Overdue') return 1;
        if (a === 'Today') return -1;
        if (b === 'Today') return 1;
        if (a === 'Recurring Goals') return -1;
        if (b === 'Recurring Goals') return 1;
        return new Date(a) - new Date(b); // Sort by date
    });

    sortedGroupNames.forEach(groupName => {
        const items = groups.get(groupName).sort((a, b) => a.name.localeCompare(b.name));
        
        // Calculate group totals
        let totalGoalMs = 0;
        let totalTrackedMs = 0;
        
        items.forEach(item => {
            if (item.type === 'task' || item.type === 'goal') {
                totalGoalMs += (item.targetHours || item.goal?.value || 0) * 3600000;
                
                if (item.type === 'task') {
                    totalTrackedMs += item.trackedDurationMs || 0;
                } else { // 'goal'
                    // Find logs for this goal within the current time range
                    totalTrackedMs += allTimeLogs
                        .filter(log => log.activityId === item.id && 
                                       log.timerType === 'activity' && 
                                       log.startTime >= currentTrackTimeRange.start.getTime() &&
                                       log.startTime <= currentTrackTimeRange.end.getTime())
                        .reduce((acc, log) => acc + log.durationMs, 0);
                }
            }
        });

        const headerHtml = `
            <div class="track-list-header">
                <h2>${groupName}</h2>
                <p>
                    ${totalTrackedMs > 0 ? `${formatShortDuration(totalTrackedMs)}` : ''}
                    ${totalGoalMs > 0 ? `<span> / ${formatShortDuration(totalGoalMs)}</span>` : ''}
                </p>
            </div>
        `;
        trackContentArea.insertAdjacentHTML('beforeend', headerHtml);
        
        items.forEach(item => {
            trackContentArea.insertAdjacentHTML('beforeend', renderTrackItem(item));
        });
    });
}

// NEW: Renderer for a single item on the Track page list
function renderTrackItem(item) {
    const isRunning = currentTimer && currentTimer.activityId === item.id && 
                      ((item.type === 'task' && currentTimer.timerType === 'task') || (item.type === 'goal' && currentTimer.timerType === 'activity'));
    const timerActive = currentTimer !== null;
    const isOverdue = (item.type === 'task' || item.type === 'deadline') && new Date(item.dueDate + 'T00:00:00') < getStartOfDate(new Date()) && !item.isCompleted;

    let emoji, name, subtext, progressBar, actionHtml;

    if (item.type === 'goal' || item.type === 'task') {
        emoji = item.emoji || (item.type === 'goal' ? '🎯' : '📌');
        name = item.name;
        subtext = item.category || (item.type === 'goal' ? `${item.goal.period} goal` : 'Task');
        
        let trackedMs = 0;
        let targetMs = 0;

        if (item.type === 'goal') {
            targetMs = (item.goal.value || 0) * 3600000;
            // Get tracked time within the current range
            trackedMs = allTimeLogs
                .filter(log => log.activityId === item.id && 
                               log.timerType === 'activity' &&
                               log.startTime >= currentTrackTimeRange.start.getTime() &&
                               log.startTime <= currentTrackTimeRange.end.getTime())
                .reduce((acc, log) => acc + log.durationMs, 0);
        } else { // 'task'
            targetMs = (item.targetHours || 0) * 3600000;
            trackedMs = item.trackedDurationMs || 0;
        }
        
        const percentage = targetMs > 0 ? Math.min(100, (trackedMs / targetMs) * 100) : 0;
        
        progressBar = `
            <div class="track-item-progress-bar">
                <div class="track-item-progress-fill" style="width: ${percentage}%; background-color: ${item.color || '#808080'}"></div>
            </div>
            <p>${formatShortDuration(trackedMs)} / ${formatShortDuration(targetMs)} (${percentage.toFixed(0)}%)</p>
        `;
        
        actionHtml = `
            <button class="track-item-action-btn ${isRunning ? 'stop' : 'start'}" data-id="${item.id}" data-type="${item.type === 'goal' ? 'activity' : 'task'}" ${!isRunning && timerActive ? 'disabled' : ''}>
                ${isRunning ? 
                    `<svg class="w-6 h-6 pointer-events-none" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clip-rule="evenodd"></path></svg>
                     <span class="track-item-timer">${formatHHMMSS(Date.now() - currentTimer.startTime).substring(3)}</span>` : 
                    `<svg class="w-6 h-6 pointer-events-none" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd"></path></svg>`
                }
            </button>
        `;

    } else { // 'deadline'
        emoji = '📅';
        name = item.name;
        subtext = item.notes || 'Deadline';
        progressBar = '';
        actionHtml = `
            <input type="checkbox" class="track-item-checkbox" data-id="${item.id}" ${item.isCompleted ? 'checked' : ''}>
        `;
    }

    return `
    <div class="track-item ${isOverdue ? 'overdue' : ''}" data-id="${item.id}" data-type="${item.type}">
        <div class="track-item-main" data-id="${item.id}" data-type="${item.type}">
            <div class="track-item-emoji">${emoji}</div>
            <div class="track-item-details">
                <h4>${name}</h4>
                <p>${subtext}</p>
                ${progressBar}
            </div>
        </div>
        <div class="track-item-actions">
            ${actionHtml}
        </div>
    </div>
    `;
}

// NEW: Render Track Page Grid View
function renderTrackGrid() {
    let gridHtml = '<div id="heatmap-weekdays"><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span></div><div class="track-grid-heatmap">';
    
    const { start, end } = currentTrackTimeRange;
    
    // Get all logs within the range
    const logsInRange = allTimeLogs.filter(log => {
        return log.startTime >= start.getTime() && log.startTime <= end.getTime();
    });

    // Group logs by day
    const hoursByDay = new Map(); // Key: 'YYYY-MM-DD'
    logsInRange.forEach(log => {
        const dayStr = new Date(log.startTime).toLocaleDateString('en-CA');
        const hours = log.durationMs / 3600000;
        hoursByDay.set(dayStr, (hoursByDay.get(dayStr) || 0) + hours);
    });
    
    // Find max hours for heatmap levels
    const maxHours = Math.max(0, ...hoursByDay.values());
    
    let loopDate = new Date(start);
    
    // Add padding for the first day
    let firstDayIndex = loopDate.getDay();
    firstDayIndex = (firstDayIndex === 0) ? 6 : (firstDayIndex - 1); // Mon=0, Sun=6
    for (let i = 0; i < firstDayIndex; i++) {
        gridHtml += '<div class="heatmap-day-padding"></div>';
    }
    
    // Generate day cells
    while (loopDate <= end) {
        const dayStr = loopDate.toLocaleDateString('en-CA');
        const hours = hoursByDay.get(dayStr) || 0;
        const level = getHeatmapLevel(hours, maxHours);
        
        const title = `${dayStr}: ${hours.toFixed(1)} hours`;
        gridHtml += `<div class="track-grid-day" data-level="${level}" title="${title}" data-date="${dayStr}"></div>`;
        
        loopDate.setDate(loopDate.getDate() + 1);
    }
    
    gridHtml += '</div>'; // Close .track-grid-heatmap
    trackContentArea.innerHTML = gridHtml;
}

// NEW: Heatmap level calculator (different from analysis one)
function getHeatmapLevel(hours, maxHours) {
    if (hours <= 0) return 0;
    if (maxHours <= 0) return 1; // Avoid division by zero
    const ratio = hours / maxHours;
    if (ratio < 0.25) return 1;
    if (ratio < 0.5) return 2;
    if (ratio < 0.75) return 3;
    return 4;
}

// --- NEW Track Page Event Handlers ---

function handleTrackListClick(e) {
    const startBtn = e.target.closest('.track-item-action-btn.start');
    const stopBtn = e.target.closest('.track-item-action-btn.stop');
    const checkbox = e.target.closest('.track-item-checkbox');
    const mainItem = e.target.closest('.track-item-main');

    if (startBtn && !startBtn.disabled) {
        const id = startBtn.dataset.id;
        const type = startBtn.dataset.type; // 'activity' or 'task'
        
        if (type === 'activity') {
            const activity = activities.get(id);
            if (activity) {
                startTimer(activity.id, activity.name, activity.color, 'activity');
            }
        } else { // 'task'
            const item = plannerItems.get(id);
            if (item) {
                startTimer(item.id, item.name, '#808080', 'task');
            }
        }
    } else if (stopBtn) {
        stopTimer();
    } else if (checkbox) {
        handlePlannerItemCheck(checkbox.dataset.id, checkbox.checked);
    } else if (mainItem) {
        const id = mainItem.dataset.id;
        const type = mainItem.dataset.type;
        
        if (type === 'goal') {
            activityToEditId = id;
            showEditActivityModal();
        } else { // 'task' or 'deadline'
            // Show new edit planner item modal (or reuse add modal)
            showAddItemModal(id); // Pass ID to edit
        }
    }
}

// NEW: Handle click on grid heatmap day
function handleTrackGridClick(e) {
    const dayCell = e.target.closest('.track-grid-day');
    if (dayCell) {
        const dateStr = dayCell.dataset.date;
        if (dateStr) {
            const clickedDate = new Date(dateStr + 'T00:00:00');
            updateTimeRange('custom', clickedDate, clickedDate);
            currentTrackView = 'list'; // Switch to list view
            renderTrackPage();
        }
    }
}

async function handlePlannerItemCheck(id, isCompleted) {
    if (!userId) return;
    const item = plannerItems.get(id);
    if (!item) return;
    
    try {
        await plannerCollection().doc(id).update({ isCompleted });
        item.isCompleted = isCompleted;
        // Re-render both pages
        renderTrackPage();
        renderHomePage();
    } catch (error) {
        console.error("Error updating planner item: ", error);
        alert("Failed to update item.");
    }
}

// --- NEW Modal Functions ---

// NEW: Show Add Item Modal
function showAddItemModal(itemIdToEdit = null) {
    addItemForm.reset();
    addItemForm.dataset.editId = '';
    
    let formHtml = `
        <input type="hidden" id="add-item-id" value="${itemIdToEdit || ''}">
        <div>
            <label for="add-item-type" class="block text-sm font-medium mb-2">Item Type</label>
            <select id="add-item-type" class="w-full p-3 border rounded-lg shadow-sm">
                <option value="activity">Activity (for Goal)</option>
                <option value="task">Task (Trackable)</option>
                <option value="deadline">Deadline (Checklist)</option>
            </select>
        </div>

        <!-- Common Fields -->
        <div id="form-group-name">
            <label for="add-item-name" class="block text-sm font-medium mb-2">Name</label>
            <input type="text" id="add-item-name" placeholder="E.g., Finish report" class="w-full" maxlength="40">
        </div>
        
        <!-- Activity Fields -->
        <div id="form-group-activity" class="space-y-4 hidden">
            <div class="flex gap-2">
                <button type="button" id="add-item-emoji" class="p-3 emoji-input-btn" title="Select Emoji">😀</button>
                <input type="hidden" id="add-item-emoji-value" value="😀">
                <input type="color" id="add-item-color" value="#3b82f6" title="Select activity color">
            </div>
            <div>
                <label for="add-item-category" class="block text-sm font-medium mb-2">Category</label>
                <input type="text" id="add-item-category" placeholder="E.g., Work" class="w-full" maxlength="20" list="category-list-datalist">
            </div>
            <div>
                <label class="block text-sm font-medium mb-2">Goal</label>
                <div class="flex gap-2">
                    <input type="number" id="add-item-goal-value" min="0" step="0.5" placeholder="E.g., 5" class="w-1/2">
                    <select id="add-item-goal-period" class="w-1/2">
                        <option value="none">None</option>
                        <option value="daily">per Day</option>
                        <option value="weekly">per Week</option>
                        <option value="monthly">per Month</option>
                        <option value="yearly">per Year</option>
                    </select>
                </div>
            </div>
        </div>

        <!-- Task/Deadline Fields -->
        <div id="form-group-planner" class="space-y-4 hidden">
             <div>
                <label for="add-item-due-date" class="block text-sm font-medium mb-2">Due Date</label>
                <input type="date" id="add-item-due-date" class="w-full">
            </div>
            <div id="form-group-task-only" class="hidden">
                <label for="add-item-target-hours" class="block text-sm font-medium mb-2">Target (Hours)</label>
                <input type="number" id="add-item-target-hours" min="0" step="0.5" placeholder="E.g., 4" class="w-full">
            </div>
             <div id="form-group-deadline-only" class="hidden">
                <label for="add-item-notes" class="block text-sm font-medium mb-2">Notes (Optional)</label>
                <textarea id="add-item-notes" rows="2" class="w-full"></textarea>
            </div>
        </div>
    `;
    
    // Inject form HTML, excluding buttons
    addItemForm.innerHTML = formHtml + addItemForm.innerHTML.substring(addItemForm.innerHTML.indexOf('<div class="flex justify-end'));
    
    // Add event listener for the new emoji button
    document.getElementById('add-item-emoji').addEventListener('click', () => {
        showEmojiPicker(document.getElementById('add-item-emoji'), document.getElementById('add-item-emoji-value'));
    });
    
    // Add event listener for type change
    const itemTypeSelect = document.getElementById('add-item-type');
    itemTypeSelect.addEventListener('change', toggleAddItemForm);

    if (itemIdToEdit) {
        // This is an edit
        addItemForm.dataset.editId = itemIdToEdit;
        saveAddItemBtn.textContent = 'Save Changes';
        
        // Try to find as planner item first
        const plannerItem = plannerItems.get(itemIdToEdit);
        if (plannerItem) {
            itemTypeSelect.value = plannerItem.type; // 'task' or 'deadline'
            document.getElementById('add-item-name').value = plannerItem.name;
            document.getElementById('add-item-due-date').value = plannerItem.dueDate;
            if (plannerItem.type === 'task') {
                document.getElementById('add-item-target-hours').value = plannerItem.targetHours || '';
            } else { // deadline
                document.getElementById('add-item-notes').value = plannerItem.notes || '';
            }
        } else {
            // Not a planner item, must be an activity (goal)
            const activity = activities.get(itemIdToEdit);
            if (activity) {
                itemTypeSelect.value = 'activity';
                document.getElementById('add-item-name').value = activity.name;
                document.getElementById('add-item-emoji').textContent = activity.emoji || '😀';
                document.getElementById('add-item-emoji-value').value = activity.emoji || '😀';
                document.getElementById('add-item-color').value = activity.color || '#3b82f6';
                document.getElementById('add-item-category').value = activity.category || '';
                document.getElementById('add-item-goal-value').value = activity.goal?.value || '';
                document.getElementById('add-item-goal-period').value = activity.goal?.period || 'none';
            }
        }
        itemTypeSelect.disabled = true; // Don't allow changing type when editing
    } else {
        // This is an add
        saveAddItemBtn.textContent = 'Add Item';
        document.getElementById('add-item-due-date').value = getTodayString();
        itemTypeSelect.disabled = false;
    }

    toggleAddItemForm(); // Set initial visibility
    addItemModal.classList.add('active');
}

function toggleAddItemForm() {
    const type = document.getElementById('add-item-type').value;
    
    document.getElementById('form-group-activity').classList.toggle('hidden', type !== 'activity');
    document.getElementById('form-group-planner').classList.toggle('hidden', type === 'activity');
    document.getElementById('form-group-task-only').classList.toggle('hidden', type !== 'task');
    document.getElementById('form-group-deadline-only').classList.toggle('hidden', type !== 'deadline');
}

function hideAddItemModal() {
    addItemModal.classList.remove('active');
}

// NEW: Handle Add/Edit Item Submission
async function handleAddItem(e) {
    e.preventDefault();
    if (!userId) return;

    const type = document.getElementById('add-item-type').value;
    const name = document.getElementById('add-item-name').value.trim();
    const editId = addItemForm.dataset.editId;
    
    if (!name) {
        alert("Please enter a name.");
        return;
    }

    saveAddItemBtn.disabled = true;
    saveAddItemBtn.textContent = 'Saving...';
    
    try {
        if (type === 'activity') {
            const newActivity = {
                name: name,
                color: document.getElementById('add-item-color').value,
                emoji: document.getElementById('add-item-emoji-value').value || '😀',
                category: document.getElementById('add-item-category').value.trim() || 'Uncategorized',
                goal: {
                    value: parseFloat(document.getElementById('add-item-goal-value').value) || 0,
                    period: document.getElementById('add-item-goal-period').value || 'none'
                },
                // Keep existing pin/order settings if editing
                isPinned: editId ? activities.get(editId)?.isPinned : false,
                order: editId ? activities.get(editId)?.order : (activities.size || 0)
            };

            if (editId) {
                await activitiesCollection().doc(editId).update(newActivity);
                activities.set(editId, { ...newActivity, id: editId });
            } else {
                const docRef = await activitiesCollection().add(newActivity);
                activities.set(docRef.id, { ...newActivity, id: docRef.id });
            }
            await loadActivities(); // Reload to refresh datalists etc.

        } else { // 'task' or 'deadline'
            const newPlannerItem = {
                name: name,
                type: type,
                dueDate: document.getElementById('add-item-due-date').value,
                targetHours: type === 'task' ? (parseFloat(document.getElementById('add-item-target-hours').value) || 0) : 0,
                notes: type === 'deadline' ? (document.getElementById('add-item-notes').value.trim()) : '',
                // Keep existing completed/tracked status if editing
                isCompleted: editId ? plannerItems.get(editId)?.isCompleted : false,
                trackedDurationMs: editId ? plannerItems.get(editId)?.trackedDurationMs : 0,
                createdAt: editId ? plannerItems.get(editId)?.createdAt : Date.now()
            };

            if (editId) {
                await plannerCollection().doc(editId).update(newPlannerItem);
                plannerItems.set(editId, { ...newPlannerItem, id: editId });
            } else {
                const docRef = await plannerCollection().add(newPlannerItem);
                plannerItems.set(docRef.id, { ...newPlannerItem, id: docRef.id });
            }
        }
        
        hideAddItemModal();
        renderHomePage();
        renderTrackPage();

    } catch (error) {
        console.error("Error saving item: ", error);
        alert("Failed to save item.");
    } finally {
        saveAddItemBtn.disabled = false;
    }
}


// NEW: Time Range Modal
function showTimeRangeModal() {
    timeRangeModal.classList.add('active');
}
function hideTimeRangeModal() {
    timeRangeModal.classList.remove('active');
}
function handleTimeRangeSelect(e) {
    const range = e.target.dataset.range;
    if (!range) return;
    
    if (range === 'custom') {
        alert("Custom range selection is not yet implemented."); // Placeholder
        return;
    }
    
    updateTimeRange(range);
    hideTimeRangeModal();
    renderTrackPage();
}

// NEW: Update time range state
function updateTimeRange(rangeType, customStart = null, customEnd = null) {
    currentTrackTimeRange.type = rangeType;
    const now = new Date();
    let start = getStartOfDate(now);
    let end = getEndOfDate(now);

    switch (rangeType) {
        case 'today':
            // Defaults are already set
            break;
        case 'week':
            const day = start.getDay();
            const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Monday
            start.setDate(diff);
            end = new Date(start);
            end.setDate(start.getDate() + 6);
            end = getEndOfDate(end);
            break;
        case 'month':
            start.setDate(1);
            end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
            end = getEndOfDate(end);
            break;
        case 'year':
            start.setMonth(0, 1);
            end = new Date(start.getFullYear(), 11, 31);
            end = getEndOfDate(end);
            break;
        case 'all':
            start = new Date(2000, 0, 1); // Far in past
            end = new Date(2100, 0, 1); // Far in future
            break;
        case 'custom':
            start = getStartOfDate(customStart);
            end = getEndOfDate(customEnd);
            break;
    }
    
    currentTrackTimeRange.start = start;
    currentTrackTimeRange.end = end;
    
    // Update button text
    const options = { month: 'short', day: 'numeric' };
    if (rangeType === 'today') trackTimeRangeBtn.textContent = 'Today';
    else if (rangeType === 'week') trackTimeRangeBtn.textContent = `Week: ${start.toLocaleDateString('en-US', options)} - ${end.toLocaleDateString('en-US', options)}`;
    else if (rangeType === 'month') trackTimeRangeBtn.textContent = start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    else if (rangeType === 'year') trackTimeRangeBtn.textContent = start.getFullYear().toString();
    else if (rangeType === 'all') trackTimeRangeBtn.textContent = 'All Time';
    else if (rangeType === 'custom') trackTimeRangeBtn.textContent = `${start.toLocaleDateString('en-US', options)} - ${end.toLocaleDateString('en-US', options)}`;
}

// NEW: Map Time Range (Prev/Next)
function mapTimeRange(direction) {
    let { type, start } = currentTrackTimeRange;
    let newStart = new Date(start);

    if (type === 'today' || (type === 'custom' && currentTrackTimeRange.end.getTime() - start.getTime() <= 86400000)) {
        newStart.setDate(newStart.getDate() + direction);
        updateTimeRange('custom', newStart, newStart);
    } else if (type === 'week') {
        newStart.setDate(newStart.getDate() + (7 * direction));
        updateTimeRange('week', newStart); // updateTimeRange recalculates start/end for 'week'
    } else if (type === 'month') {
        newStart.setDate(1); // Go to start of month to avoid date overflow
        newStart.setMonth(newStart.getMonth() + direction);
        updateTimeRange('month', newStart);
    } else if (type === 'year') {
        newStart.setFullYear(newStart.getFullYear() + direction);
        updateTimeRange('year', newStart);
    } else {
        return; // Don't map for 'all'
    }
    
    renderTrackPage();
}

// --- NEW Filter Modal Functions ---
function showFilterModal() {
    populateFilterLists();
    filterModal.classList.add('active');
}
function hideFilterModal() {
    filterModal.classList.remove('active');
}

function applyFiltersAndClose() {
    // 1. Read Item Types
    currentTrackFilters.types = [];
    filterTypeContainer.querySelectorAll('.filter-toggle-btn.active').forEach(btn => {
        currentTrackFilters.types.push(btn.dataset.type);
    });

    // 2. Read Activities
    currentTrackFilters.activities = [];
    filterListActivities.querySelectorAll('input[type="checkbox"]:checked').forEach(cb => {
        currentTrackFilters.activities.push(cb.dataset.id);
    });
    
    // 3. Read Categories
    currentTrackFilters.categories = [];
    filterListCategories.querySelectorAll('input[type="checkbox"]:checked').forEach(cb => {
        currentTrackFilters.categories.push(cb.dataset.name);
    });

    hideFilterModal();
    renderTrackPage();
}

function handleFilterTypeToggle(e) {
    const btn = e.target.closest('.filter-toggle-btn');
    if (btn) {
        btn.classList.toggle('active');
    }
}

function switchFilterTab(tab) {
    if (tab === 'activities') {
        filterTabActivities.classList.add('border-blue-600', 'text-blue-600');
        filterTabActivities.classList.remove('text-gray-500');
        filterTabCategories.classList.remove('border-blue-600', 'text-blue-600');
        filterTabCategories.classList.add('text-gray-500');
        filterListActivities.style.display = 'block';
        filterListCategories.style.display = 'none';
    } else {
        filterTabActivities.classList.remove('border-blue-600', 'text-blue-600');
        filterTabActivities.classList.add('text-gray-500');
        filterTabCategories.classList.add('border-blue-600', 'text-blue-600');
        filterTabCategories.classList.remove('text-gray-500');
        filterListActivities.style.display = 'none';
        filterListCategories.style.display = 'block';
    }
}

function populateFilterLists() {
    // 1. Populate Activities
    filterListActivities.innerHTML = '';
    const sortedActivities = Array.from(activities.values()).sort((a, b) => a.name.localeCompare(b.name));
    sortedActivities.forEach(activity => {
        const isChecked = currentTrackFilters.activities.includes(activity.id);
        filterListActivities.innerHTML += `
            <div class="filter-list-item">
                <input type="checkbox" id="filter-act-${activity.id}" data-id="${activity.id}" ${isChecked ? 'checked' : ''}>
                <label for="filter-act-${activity.id}">${activity.emoji || '🎯'} ${activity.name}</label>
            </div>
        `;
    });

    // 2. Populate Categories
    filterListCategories.innerHTML = '';
    const categories = new Set(Array.from(activities.values()).map(a => a.category || 'Uncategorized'));
    const sortedCategories = Array.from(categories).sort((a, b) => a.localeCompare(b));
    sortedCategories.forEach(category => {
        const isChecked = currentTrackFilters.categories.includes(category);
        filterListCategories.innerHTML += `
            <div class="filter-list-item">
                <input type="checkbox" id="filter-cat-${category}" data-name="${category}" ${isChecked ? 'checked' : ''}>
                <label for="filter-cat-${category}">${category}</label>
            </div>
        `;
    });
}


// --- Activity CRUD (No changes, now called from Add Item Modal) ---
// handleAddActivity is now called from handleAddItem
 async function handleAddActivity_Legacy(e) {
     e.preventDefault();
     // This function is now OBSOLETE, its logic is inside handleAddItem
     // Keeping it here to show what it was replaced
}

function handleActivityListClick(e) {
     // This function is OBSOLETE, replaced by handleTrackListClick
}

// showEditActivityModal is now called from handleTrackListClick or showAddItemModal(editId)
 function showEditActivityModal() {
    const activity = activities.get(activityToEditId); if (!activity) return;
    editActivityNameInput_Input.value = activity.name; 
    editActivityColorInput.value = activity.color;
    editActivityEmojiBtn.textContent = activity.emoji || '👉';
    editActivityEmojiValue.value = activity.emoji || '👉';
    
    editActivityCategory.value = activity.category || '';
    const goal = activity.goal || { value: 0, period: 'none' };
    editActivityGoalValueInput.value = goal.value || 0;
    editActivityGoalPeriodInput.value = goal.period || 'none';
    editActivityPin.checked = activity.isPinned || false; // MODIFIED
    
    editActivityModal.classList.add('active');
}
function hideEditActivityModal() { 
    editActivityModal.classList.remove('active'); 
    activityToEditId = null; 
}

function handleDeleteActivityFromModal() {
    if (activityToEditId) {
        logToDelete = { id: activityToEditId, type: 'activity' };
        showDeleteModal();
        hideEditActivityModal(); 
    }
}

// handleSaveEditActivity is now OBSOLETE, logic moved to handleAddItem
async function handleSaveEditActivity(e) {
    e.preventDefault(); if (!activityToEditId) return;
    // This logic is now inside handleAddItem when editId is present and type is 'activity'
    
    // The old modal form is still used, so we keep this logic
    const newName = editActivityNameInput_Input.value.trim(); 
    const newColor = editActivityColorInput.value;
    const newEmoji = editActivityEmojiValue.value.trim() || '👉';
    const newCategory = editActivityCategory.value.trim() || 'Uncategorized'; // MODIFIED
    const newGoal = {
        value: parseFloat(editActivityGoalValueInput.value) || 0,
        period: editActivityGoalPeriodInput.value || 'none'
    };
    const newIsPinned = editActivityPin.checked; // MODIFIED

    if (!newName) { alert("Name cannot be empty."); return; }
    
    const originalActivity = activities.get(activityToEditId);
    
    const updatedActivity = { 
        ...originalActivity, 
        name: newName, 
        color: newColor, 
        emoji: newEmoji, 
        id: activityToEditId,
        category: newCategory, 
        goal: newGoal, 
        isPinned: newIsPinned 
    };
    
    const saveBtn = document.getElementById('save-edit-activity-btn');
    const oldBtnText = saveBtn.textContent;

    try {
        saveBtn.textContent = 'Saving...';
        saveBtn.disabled = true;

        await activitiesCollection().doc(activityToEditId).set(updatedActivity, { merge: true }); 
        activities.set(activityToEditId, updatedActivity);
        await updateAssociatedLogs(activityToEditId, newName, newColor);
        
        await loadActivities(); // Full reload
        renderTrackPage();
        renderHomePage();
        if (pages.analysis.classList.contains('active')) {
            loadAnalysisData();
        }
        hideEditActivityModal();
         
    } catch (error) { 
        console.error("Error updating activity: ", error); 
        alert("Update failed."); 
    } finally {
        saveBtn.textContent = oldBtnText;
        saveBtn.disabled = false;
    }
}

async function updateAssociatedLogs(activityId, newName, newColor) {
     if (!userId) return;
     const batchSize = 100; let query = timeLogsCollection().where('activityId', '==', activityId).where('timerType', '!=', 'task');
     try {
         let snapshot = await query.limit(batchSize).get();
         while (snapshot.size > 0) {
             const batch = db.batch(); snapshot.docs.forEach(doc => { batch.update(doc.ref, { activityName: newName, activityColor: newColor }); });
             await batch.commit(); if (snapshot.size < batchSize) break;
             const lastDoc = snapshot.docs[snapshot.size - 1]; snapshot = await query.startAfter(lastDoc).limit(batchSize).get();
         }
         // Update local cache
         allTimeLogs.forEach(log => {
             if (log.activityId === activityId && log.timerType !== 'task') {
                 log.activityName = newName;
                 log.activityColor = newColor;
             }
         });
     } catch (error) { console.error("Batch update logs error: ", error); }
}

// --- Timer Logic (MODIFIED) ---
function startTimer(activityId, activityName, activityColor, timerType = 'activity') { // Unchanged
     if (currentTimer) return;
     const now = Date.now();
     currentTimer = { activityId, activityName, activityColor, startTime: now, intervalId: null, timerType };
     
     const savedTimer = { activityId, activityName, activityColor, startTime: now, userId: userId, timerType };
     localStorage.setItem('activeTimer', JSON.stringify(savedTimer));
     
     setFlipClock("00:00:00"); 
     previousTimeString = "00:00:00"; 
     
     currentTimer.intervalId = setInterval(updateTimerUI, 1000); 

     timerBanner.classList.remove('hidden', 'closing', 'morphing-out'); 
     requestAnimationFrame(() => { 
        timerBanner.classList.add('active'); 
     });

     bannerActivityName.textContent = activityName;
     updateTimerUI(); 
     
     // Re-render pages
     renderHomePage();
     renderTrackPage();
}

async function stopTimer() {
     if (!currentTimer) return;
     const timerToStop = { ...currentTimer }; 
     currentTimer = null; 
     
     clearInterval(timerToStop.intervalId);
     localStorage.removeItem('activeTimer');
     
     timerBanner.classList.add('closing');
     timerBanner.classList.remove('active');

     // Re-render pages
     renderHomePage(); 
     renderTrackPage();

     const endTime = Date.now();
     const durationMs = endTime - timerToStop.startTime;
     
     const timeLog = {
         activityId: timerToStop.activityId,
         activityName: timerToStop.activityName,
         activityColor: timerToStop.activityColor,
         startTime: timerToStop.startTime,
         endTime: endTime,
         durationMs: durationMs,
         notes: "",
         timerType: timerToStop.timerType || 'activity'
     };

     stopNoteInput.value = '';
     
     stopTimerCompletion = async (notes) => {
        timeLog.notes = notes || ""; 
        
        if (!userId) {
            alert("Error: Not signed in. Log not saved.");
            return;
        }

        try {
             const docRef = await timeLogsCollection().add(timeLog);
             const newLog = { ...timeLog, id: docRef.id };
             allTimeLogs.unshift(newLog); // Add to local cache
             
             // *** NEW CRITICAL LOGIC ***
             if (timeLog.timerType === 'task') {
                const task = plannerItems.get(timeLog.activityId);
                if (task) {
                    const newDuration = (task.trackedDurationMs || 0) + timeLog.durationMs;
                    await plannerCollection().doc(timeLog.activityId).update({ trackedDurationMs: newDuration });
                    task.trackedDurationMs = newDuration; // Update local cache
                }
             }
             
             if (pages.analysis.classList.contains('active')) {
                loadAnalysisData(); // Reload analysis
             }
             // Re-render pages
             renderTrackPage();
             renderHomePage(); 
        } catch (error) {
             console.error("Error saving log: ", error);
             alert("Failed to save the time log. Please check connection.");
        } finally {
            stopTimerCompletion = null; 
        }
     };

     stopNoteModal.classList.add('active');
     stopNoteInput.focus();
}

function handleSaveStopNote(e) {
    if (e) e.preventDefault();
    if (stopTimerCompletion) {
        const notes = stopNoteInput.value.trim();
        stopTimerCompletion(notes); 
    }
    stopNoteModal.classList.remove('active');
    stopNoteInput.value = '';
}

// MODIFIED: Consolidated UI updater
function updateTimerUI() {
     if (!currentTimer) return; 
     const elapsedMs = Date.now() - currentTimer.startTime;
     const timeString = formatHHMMSS(elapsedMs);
     
     // 1. Banner
     bannerTime.textContent = timeString; 
     
     // 2. Home Card
     if (pages.home.classList.contains('active')) {
        homeTimerTime.textContent = timeString;
     }
     
     // 3. Track Page (if list view)
     if (pages.track.classList.contains('active') && currentTrackView === 'list') {
        const timerType = currentTimer.timerType === 'task' ? 'task' : (currentTimer.timerType === 'activity' ? 'activity' : null);
        if (timerType) {
            // Find the running item
            const runningItemEl = trackContentArea.querySelector(`.track-item-action-btn.stop[data-id="${currentTimer.activityId}"][data-type="${timerType}"]`);
            if (runningItemEl) {
                const timerEl = runningItemEl.querySelector('.track-item-timer');
                if (timerEl) {
                    timerEl.textContent = timeString.substring(3); // MM:SS
                }
            }
        }
     }

     // 4. Flip Clock (if active)
     if (flipClockPage.classList.contains('active')) {
        updateFlipClock(timeString);
     }
}

// --- Flip Clock UI (No Changes) ---
function setFlipClock(timeString) {
    const digits = timeString.replace(/:/g, ''); 
    const digitKeys = ['h1', 'h2', 'm1', 'm2', 's1', 's2'];
    for(let i = 0; i < digitKeys.length; i++) {
        const key = digitKeys[i];
        const el = flipDigitElements[key];
        const digit = digits[i];
        if (el) {
            el.querySelector('.card-top span').textContent = digit;
            el.querySelector('.card-bottom span').textContent = digit;
            el.querySelector('.flip-top span').textContent = digit;
            el.querySelector('.flip-bottom span').textContent = digit;
        }
    }
}
function updateFlipClock(timeString) {
    const newDigits = timeString.replace(/:/g, ''); 
    const oldDigits = previousTimeString.replace(/:/g, ''); 
    const digitKeys = ['h1', 'h2', 'm1', 'm2', 's1', 's2'];
    for(let i = 0; i < digitKeys.length; i++) {
        if (newDigits[i] !== oldDigits[i]) {
            const key = digitKeys[i];
            const el = flipDigitElements[key];
            if (el) {
                triggerFlip(el, oldDigits[i], newDigits[i]);
            }
        }
    }
    previousTimeString = timeString; 
}
function triggerFlip(digitElement, oldDigit, newDigit) {
    if (digitElement.classList.contains('flipping')) {
        digitElement.querySelector('.card-top span').textContent = newDigit;
        digitElement.querySelector('.flip-bottom span').textContent = newDigit;
        return; 
    }
    const cardTopSpan = digitElement.querySelector('.card-top span');
    const cardBottomSpan = digitElement.querySelector('.card-bottom span');
    const flipTopSpan = digitElement.querySelector('.flip-top span');
    const flipBottomSpan = digitElement.querySelector('.flip-bottom span');
    const cardFlip = digitElement.querySelector('.card-flip');
    cardTopSpan.textContent = newDigit;    
    cardBottomSpan.textContent = oldDigit; 
    flipTopSpan.textContent = oldDigit;    
    flipBottomSpan.textContent = newDigit; 
    digitElement.classList.add('flipping');
    const onFlipEnd = () => {
        cardBottomSpan.textContent = newDigit;
        cardFlip.style.transition = 'none';
        digitElement.classList.remove('flipping');
        flipTopSpan.textContent = newDigit;
        void cardFlip.offsetHeight; 
        cardFlip.style.transition = ''; 
        cardFlip.removeEventListener('transitionend', onFlipEnd);
    };
    cardFlip.addEventListener('transitionend', onFlipEnd);
    setTimeout(() => {
        if (digitElement.classList.contains('flipping')) {
            onFlipEnd(); 
        }
    }, 550); 
}
function showFlipClock() {
     if (!currentTimer) return;
     flipClockActivity.textContent = currentTimer.activityName;
     const elapsedMs = Date.now() - currentTimer.startTime;
     const timeString = formatHHMMSS(elapsedMs);
     setFlipClock(timeString); 
     previousTimeString = timeString; 
     timerBanner.classList.add('morphing-out');
     timerBanner.classList.remove('active'); 
     flipClockPage.classList.remove('animating-out'); 
     flipClockPage.style.display = 'flex'; 
     requestAnimationFrame(() => {
        flipClockPage.classList.add('animating-in', 'active');
     });
     setTimeout(() => { mainApp.style.display = 'none'; }, 50); 
     setTimeout(() => { timerBanner.classList.remove('morphing-out'); }, 300); 
}
function hideFlipClock() {
    flipClockPage.classList.remove('animating-in');
    flipClockPage.classList.add('animating-out');
    flipClockPage.classList.remove('active');
    mainApp.style.display = 'block';
    previousTimeString = "00:00:00";
    setTimeout(() => {
        flipClockPage.classList.remove('animating-out');
        flipClockPage.style.display = 'none'; 
        if (currentTimer) {
             timerBanner.classList.remove('hidden', 'closing', 'morphing-out'); 
             requestAnimationFrame(() => {
                 timerBanner.classList.add('active'); 
             });
        }
    }, 200); 
}

// --- Log CRUD & Modals (MODIFIED) ---
function showDeleteModal() {
     let text = "Are you sure?";
     if (logToDelete.type === 'activity') { text = "Delete activity? All associated logs will be removed."; }
     else if (logToDelete.type === 'log') { text = "Delete this time log?"; }
     else if (logToDelete.type === 'plannerItem') { text = "Delete this item? If it's a task, all its tracked time will also be deleted."; } // MODIFIED
     deleteModalText.textContent = text; deleteModal.classList.add('active');
}
function hideDeleteModal() { deleteModal.classList.remove('active'); logToDelete = { id: null, type: null }; }

// MODIFIED: Handle Confirm Delete
async function handleConfirmDelete() {
    if (!logToDelete.id || !logToDelete.type || !userId) return;
    try {
        if (logToDelete.type === 'activity') {
            // This logic is unchanged
            const deletedActivityId = logToDelete.id;
            await activitiesCollection().doc(deletedActivityId).delete();
            const logsSnapshot = await timeLogsCollection().where('activityId', '==', deletedActivityId).get();
            const batch = db.batch(); 
            logsSnapshot.forEach(doc => batch.delete(doc.ref)); 
            await batch.commit();
            activities.delete(deletedActivityId); 
            allTimeLogs = allTimeLogs.filter(log => log.activityId !== deletedActivityId);
            analysisLogs = analysisLogs.filter(log => log.activityId !== deletedActivityId);
            populateAnalysisFilter(); 
            populateCategoryDatalist();
            if(logDetailsModal.classList.contains('active')) { showLogDetailsModal(); }
        
        } else if (logToDelete.type === 'log') {
            // This logic is unchanged
            const deletedLogId = logToDelete.id; 
            await timeLogsCollection().doc(deletedLogId).delete();
            analysisLogs = analysisLogs.filter(log => log.id !== deletedLogId);
            allTimeLogs = allTimeLogs.filter(log => log.id !== deletedLogId); 
            const logElementToRemove = logDetailsList.querySelector(`.btn-delete-log[data-id="${deletedLogId}"]`)?.closest('div.bg-gray-50');
            if (logElementToRemove) logElementToRemove.remove();
            if (logDetailsList.children.length === 0) logDetailsList.innerHTML = `<p class="text-center text-muted">No logs for this period.</p>`;
            loadAnalysisData();
        
        // *** NEW CRITICAL LOGIC ***
        } else if (logToDelete.type === 'plannerItem') {
            const deletedItemId = logToDelete.id;
            const item = plannerItems.get(deletedItemId);

            await plannerCollection().doc(deletedItemId).delete();
            plannerItems.delete(deletedItemId);

            // If it was a task, delete all associated time logs
            if (item && item.type === 'task') {
                const logsSnapshot = await timeLogsCollection()
                    .where('activityId', '==', deletedItemId)
                    .where('timerType', '==', 'task')
                    .get();
                
                if (logsSnapshot.size > 0) {
                    const batch = db.batch();
                    logsSnapshot.forEach(doc => batch.delete(doc.ref));
                    await batch.commit();
                    // Remove from local cache
                    allTimeLogs = allTimeLogs.filter(log => !(log.activityId === deletedItemId && log.timerType === 'task'));
                    console.log(`Deleted ${logsSnapshot.size} associated task logs.`);
                }
            }
        } 
        
        // Re-render all
        renderHomePage();
        renderTrackPage();

    } catch (error) { 
        console.error("Error deleting item: ", error); 
        alert("Deletion failed."); 
    }
    finally { 
        hideDeleteModal(); 
    }
}

function showManualEntryModal() {
     manualActivitySelect.innerHTML = '';
     if (activities.size === 0) { manualActivitySelect.innerHTML = '<option value="">Create activity first</option>'; }
     activities.forEach((act, id) => { manualActivitySelect.innerHTML += `<option value="${id}" data-name="${act.name}" data-color="${act.color}">${act.name}</option>`; });
     manualDateInput.value = getTodayString(); manualStartTimeInput.value = ''; manualEndTimeInput.value = ''; manualNotesInput.value = '';
     manualEntryModal.classList.add('active');
}
function hideManualEntryModal() { manualEntryModal.classList.remove('active'); }
async function handleSaveManualEntry(e) {
     e.preventDefault(); if (!userId) return;
     const selOpt = manualActivitySelect.querySelector(`option[value="${manualActivitySelect.value}"]`);
     const actId = manualActivitySelect.value; const actName = selOpt ? selOpt.dataset.name : 'Unknown'; const actColor = selOpt ? selOpt.dataset.color : '#808080';
     const date = manualDateInput.value; const startTime = manualStartTimeInput.value; const endTime = manualEndTimeInput.value; const notes = manualNotesInput.value.trim();
     if (!actId || !date || !startTime || !endTime) { alert("Fill all required fields."); return; }
     const startDT = new Date(`${date}T${startTime}`); const endDT = new Date(`${date}T${endTime}`);
     if (endDT <= startDT) { alert("End time must be after start."); return; }
     const startMs = startDT.getTime(); const endMs = endDT.getTime(); const durMs = endMs - startMs;
     const timeLog = { 
         activityId:actId, 
         activityName:actName, 
         activityColor:actColor, 
         startTime: startMs, 
         endTime: endMs, 
         durationMs: durMs, 
         notes: notes,
         timerType: 'activity' // Manual entries are always 'activity'
    };
     try {
         const docRef = await timeLogsCollection().add(timeLog);
         allTimeLogs.unshift({ ...timeLog, id: docRef.id }); // Add to cache
         
         renderTrackPage(); 
         renderHomePage(); 
         if(pages.analysis.classList.contains('active')) {
            loadAnalysisData();
         }
         hideManualEntryModal();
     } catch (error) { console.error("Error saving manual entry: ", error); alert("Save failed."); }
}

 function showEditLogModal(logId) {
     let log = allTimeLogs.find(l => l.id === logId);
     if (!log) { 
         log = analysisLogs.find(l => l.id === logId); 
     }
     if (!log) {
         alert("Cannot find log to edit."); return; 
     } 
     logToEditId = log.id;
     const startD = new Date(log.startTime); const endD = new Date(log.endTime);
     let itemName = "Unknown";
     if (log.timerType === 'task') {
        itemName = plannerItems.get(log.activityId)?.name || log.activityName;
     } else {
        itemName = activities.get(log.activityId)?.name || log.activityName;
     }
     editActivityNameInput.value = log.timerType === 'task' ? `Task: ${itemName}` : itemName;
     editDateInput.value = `${startD.getFullYear()}-${String(startD.getMonth() + 1).padStart(2, '0')}-${String(startD.getDate()).padStart(2, '0')}`;
     editStartTimeInput.value = `${String(startD.getHours()).padStart(2, '0')}:${String(startD.getMinutes()).padStart(2, '0')}`;
     editEndTimeInput.value = `${String(endD.getHours()).padStart(2, '0')}:${String(endD.getMinutes()).padStart(2, '0')}`;
     editNotesInput.value = log.notes || ""; 
     const isTask = log.timerType === 'task';
     editDateInput.disabled = isTask;
     editStartTimeInput.disabled = isTask;
     editEndTimeInput.disabled = isTask;
     editLogModal.classList.add('active');
}
function hideEditLogModal() { editLogModal.classList.remove('active'); logToEditId = null; }
async function handleSaveEditLog(e) {
     e.preventDefault(); if (!logToEditId || !userId) return;
     const originalLog = allTimeLogs.find(l => l.id === logToEditId);
     if (originalLog && originalLog.timerType === 'task') {
        alert("Editing task logs is not supported yet. You can delete and re-track it.");
        hideEditLogModal();
        return;
     }
     const date = editDateInput.value; const startTime = editStartTimeInput.value; const endTime = editEndTimeInput.value; const notes = editNotesInput.value.trim();
     const startDT = new Date(`${date}T${startTime}`); const endDT = new Date(`${date}T${endTime}`);
     if (endDT <= startDT) { alert("End time must be after start."); return; }
     const startMs = startDT.getTime(); const endMs = endDT.getTime(); const durMs = endMs - startMs;
     const updatedData = { startTime: startMs, endTime: endMs, durationMs: durMs, notes: notes };
     try {
         await timeLogsCollection().doc(logToEditId).update(updatedData);
         // Update local caches
         const updateCache = (log) => {
             if (log.id === logToEditId) {
                 return { ...log, ...updatedData };
             }
             return log;
         };
         allTimeLogs = allTimeLogs.map(updateCache);
         analysisLogs = analysisLogs.map(updateCache);
         
         hideEditLogModal(); 
         renderTrackPage();
         renderHomePage();
         if (logDetailsModal.classList.contains('active')) showLogDetailsModal();
         if (pages.analysis.classList.contains('active')) renderAnalysisVisuals(analysisLogs, calculateActivityTotals(analysisLogs));
     } catch (error) { console.error("Error updating log: ", error); alert("Update failed."); }
}

// --- Analysis Page (MODIFIED) ---
function setAnalysisView(view) {
     currentAnalysisView = view; 
     analysisTabButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.view === view));
     pages.analysis.classList.remove('view-daily', 'view-weekly', 'view-monthly');
     pages.analysis.classList.add(`view-${view}`);
     if (view === 'monthly') {
        heatmapCard.style.display = 'block';
        analysisFilterContainer.style.display = 'block';
        barChartCard.style.display = 'none'; 
        pieChartCard.style.display = 'none'; 
     } else if (view === 'weekly') {
        heatmapCard.style.display = 'none';
        analysisFilterContainer.style.display = 'block';
        barChartCard.style.display = 'block'; 
        pieChartCard.style.display = 'none'; 
     } else { // Daily
        heatmapCard.style.display = 'none';
        analysisFilterContainer.style.display = 'none';
        barChartCard.style.display = 'none'; 
        pieChartCard.style.display = 'none';
     }
     loadAnalysisData(); 
}

function navigateAnalysis(direction) {
    if (currentAnalysisView === 'weekly') {
        currentAnalysisDate.setDate(currentAnalysisDate.getDate() + (7 * direction));
    } else if (currentAnalysisView === 'monthly') {
        const newMonth = currentAnalysisDate.getMonth() + direction;
        currentAnalysisDate.setDate(1); 
        currentAnalysisDate.setMonth(newMonth);
    }
    loadAnalysisData();
}

function updateAnalysisNavText(startDate, endDate) {
    const dateFormat = { day: '2-digit', month: '2-digit', year: 'numeric' };
    if (currentAnalysisView === 'weekly') {
        analysisNavText.textContent = `${startDate.toLocaleDateString('en-GB', dateFormat)} - ${endDate.toLocaleDateString('en-GB', dateFormat)}`;
    } else if (currentAnalysisView === 'monthly') {
        analysisNavText.textContent = startDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    }
}

function getAnalysisDateRange() {
     const selD = new Date(currentAnalysisDate); 
     let startD = new Date(selD); let endD = new Date(selD);
     switch (currentAnalysisView) {
         case 'daily': 
            startD.setHours(0,0,0,0); 
            endD.setHours(23,59,59,999); 
            break;
         case 'weekly': 
            const day = startD.getDay(); 
            const diff = startD.getDate() - day + (day === 0 ? -6 : 1); 
            startD = new Date(startD.setDate(diff));
            startD.setHours(0,0,0,0); 
            endD = new Date(startD); 
            endD.setDate(startD.getDate() + 6); 
            endD.setHours(23,59,59,999); 
            break;
         case 'monthly': 
            startD = new Date(startD.getFullYear(), startD.getMonth(), 1); 
            startD.setHours(0,0,0,0); 
            endD = new Date(startD.getFullYear(), startD.getMonth() + 1, 0); 
            endD.setHours(23,59,59,999); 
            break;
     }
     updateAnalysisNavText(startD, endD); 
     return { startDate: startD, endDate: endD };
}

function patchActivitiesFromLogs(logs) {
    let newActivitiesFound = false;
    logs.forEach(log => {
        if (log.timerType === 'task') return; 
        if (log.activityId && !activities.has(log.activityId)) {
            activities.set(log.activityId, {
                id: log.activityId,
                name: log.activityName || "Unknown Activity",
                color: log.activityColor || "#808080",
                category: "Uncategorized", 
                goal: { value: 0, period: 'none' }, 
                order: Infinity,
                isPinned: false
            });
            newActivitiesFound = true;
        }
    });
    return newActivitiesFound;
}

async function loadAnalysisData() {
    if (!userId) return; 
    const { startDate, endDate } = getAnalysisDateRange();
    
    // Use the allTimeLogs cache instead of fetching
    analysisLogs = allTimeLogs.filter(log => 
        log.startTime >= startDate.getTime() && log.startTime <= endDate.getTime()
    );
        
    const newActivities = patchActivitiesFromLogs(analysisLogs);
    if (newActivities) {
        populateAnalysisFilter();
    }

    const activityTotals = calculateActivityTotals(analysisLogs);
    renderAnalysisRanking(activityTotals); 
    renderAnalysisVisuals(analysisLogs, activityTotals); 
}

// MODIFIED: calculateActivityTotals (prefix task names)
function calculateActivityTotals(logs) {
    const activityTotals = new Map();
    logs.forEach(log => {
        let color, name;
        
        // *** NEW LOGIC ***
        if (log.timerType === 'task') {
            const task = plannerItems.get(log.activityId);
            name = `Task: ${task?.name || log.activityName || 'Unknown'}`;
            color = '#808080'; // Generic color for all tasks
        } else {
            const activity = activities.get(log.activityId);
            name = activity?.name || log.activityName || 'Unknown';
            color = activity?.color || log.activityColor || '#808080';
        }
        
        const current = activityTotals.get(name) || { durationMs: 0, color: color };
        current.durationMs += log.durationMs; 
        current.color = color; 
        activityTotals.set(name, current);
    });
    return activityTotals;
}

 function renderAnalysisRanking(activityTotals) {
     let titleView = currentAnalysisView.charAt(0).toUpperCase() + currentAnalysisView.slice(1);
     rankingTitle.textContent = titleView + ' Ranking';
     rankingList.innerHTML = ''; 
     if (activityTotals.size === 0) { 
         rankingList.innerHTML = `<p class="text-center text-muted">No time tracked.</p>`; 
         return; 
     } 
     const sorted = [...activityTotals.entries()].sort((a, b) => b[1].durationMs - a[1].durationMs);
     const maxTime = sorted[0][1].durationMs;
     if (maxTime <= 0) {
         rankingList.innerHTML = `<p class="text-center text-muted">No time tracked.</p>`; 
         return;
     }
     sorted.forEach(([name, data]) => {
         const percentage = (data.durationMs / maxTime) * 100;
         const itemHtml = `
            <div class="ranking-item">
                <span class="ranking-item-dot" style="background-color: ${data.color}"></span>
                <span class="ranking-item-name" title="${name}">${name}</span>
                <span class="ranking-item-time">${formatShortDuration(data.durationMs)}</span>
                <div class="ranking-bar-bg">
                    <div class="ranking-bar-fill" style="width: ${percentage}%; background-color: ${data.color}"></div>
                </div>
            </div>
         `;
         rankingList.insertAdjacentHTML('beforeend', itemHtml); 
     });
}

// MODIFIED: renderAnalysisVisuals (filter logs)
function renderAnalysisVisuals(rawLogs, activityTotals) {
     if (barChartInstance) { barChartInstance.destroy(); barChartInstance = null; }
     if (pieChartInstance) { pieChartInstance.destroy(); pieChartInstance = null; }
     
     // *** NEW LOGIC: Filter out tasks from chart views ***
     const activityLogs = rawLogs.filter(log => log.timerType !== 'task');

     switch (currentAnalysisView) {
        case 'daily':
            break;
        case 'weekly':
            renderWeeklyChart(activityLogs, barChartCanvas.getContext('2d')); // Pass filtered logs
            break;
        case 'monthly':
            renderMonthlyHeatmap(activityLogs); // Pass filtered logs
            break;
     }
}

// MODIFIED: renderWeeklyChart (now receives pre-filtered logs)
function renderWeeklyChart(activityLogs, barCtx) { 
    const selectedActivityId = analysisActivityFilter.value;
    const selectedActivityName = analysisActivityFilter.options[analysisActivityFilter.selectedIndex].text;

    const filteredLogs = selectedActivityId === 'all' 
        ? activityLogs 
        : activityLogs.filter(log => log.activityId === selectedActivityId);

    barChartTitle.textContent = selectedActivityId === 'all' ? 'Weekly Activity Breakdown' : `Weekly: ${selectedActivityName}`;
    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const dataByActivity = new Map(); 
    filteredLogs.forEach(log => {
        let dayIndex = new Date(log.startTime).getDay();
        dayIndex = (dayIndex === 0) ? 6 : (dayIndex - 1); 
        const activityName = activities.get(log.activityId)?.name || log.activityName;
        const color = activities.get(log.activityId)?.color || log.activityColor || '#808080';
        let entry = dataByActivity.get(activityName);
        if (!entry) {
            entry = { color: color, data: [0, 0, 0, 0, 0, 0, 0] };
            dataByActivity.set(activityName, entry);
        }
        entry.data[dayIndex] += (log.durationMs / 3600000); 
    });
    const datasets = Array.from(dataByActivity.entries()).map(([name, d]) => ({
        label: name,
        data: d.data.map(h => h.toFixed(2)),
        backgroundColor: d.color,
    }));
    barChartInstance = new Chart(barChartCanvas, {
        type: 'bar',
        data: { labels, datasets },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { 
                legend: { display: true, position: 'bottom' },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) { label += ': '; }
                            if (context.parsed.y !== null) { label += context.parsed.y.toFixed(2) + 'h'; }
                            return label;
                        }
                    }
                }
            },
            scales: {
                y: { stacked: true, beginAtZero: true, title: { display: true, text: 'Hours' } },
                x: { stacked: true, grid: { display: false } }
            }
        }
    });
}

// MODIFIED: renderMonthlyHeatmap (now receives pre-filtered logs)
function renderMonthlyHeatmap(activityLogs) { 
    heatmapGrid.innerHTML = ''; 
    const { startDate, endDate } = getAnalysisDateRange();
    const selectedActivityId = analysisActivityFilter.value;
    const selectedActivityName = analysisActivityFilter.options[analysisActivityFilter.selectedIndex].text;
    heatmapTitle.textContent = selectedActivityId === 'all' ? 'Monthly Activity' : `Monthly Activity: ${selectedActivityName}`;
    const filteredLogs = selectedActivityId === 'all' 
        ? activityLogs 
        : activityLogs.filter(log => log.activityId === selectedActivityId);
    const numDaysInMonth = endDate.getDate();
    const firstDayOfMonth = new Date(startDate);
    const hoursByDay = new Map();
    filteredLogs.forEach(log => {
        const day = new Date(log.startTime).getDate(); 
        const hours = log.durationMs / 3600000;
        hoursByDay.set(day, (hoursByDay.get(day) || 0) + hours);
    });
    
    const maxHours = Math.max(0, ...hoursByDay.values()); // Get max for this specific filter
    
    let firstDayIndex = firstDayOfMonth.getDay();
    firstDayIndex = (firstDayIndex === 0) ? 6 : (firstDayIndex - 1); 
    for (let i = 0; i < firstDayIndex; i++) {
        heatmapGrid.innerHTML += '<div class="heatmap-day-padding"></div>';
    }
    for (let i = 1; i <= numDaysInMonth; i++) {
        const hours = hoursByDay.get(i) || 0;
        const level = getHeatmapLevel(hours, maxHours); // Use modified heatmap level
        const dateStr = new Date(startDate.getFullYear(), startDate.getMonth(), i).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
        const title = `${dateStr}: ${hours.toFixed(1)} hours${selectedActivityId === 'all' ? '' : ` (${selectedActivityName})`}`;
        heatmapGrid.innerHTML += `<div class="heatmap-day" data-level="${level}" title="${title}"></div>`;
    }
}

// getHeatmapLevel is replaced by the one in renderTrackGrid, but we need one for Analysis
// Using the old one:
function getHeatmapLevel_Analysis(hours) {
    if (hours <= 0) return 0;
    if (hours < 1) return 1;
    if (hours < 3) return 2;
    if (hours < 5) return 3;
    return 4;
}


// --- Log Details Modal (Unchanged) ---
function showLogDetailsModal() {
    logDetailsList.innerHTML = ''; 
    if (analysisLogs.length === 0) {
        logDetailsList.innerHTML = `<p class="text-center text-muted">No logs for this period.</p>`;
    } else {
        const sortedLogs = [...analysisLogs].sort((a, b) => b.startTime - a.startTime);
        sortedLogs.forEach((log, index) => {
            const start = new Date(log.startTime);
            const startStr = start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const end = new Date(log.endTime);
            const endStr = end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            let activityName, activityColor;
            if (log.timerType === 'task') {
                const task = plannerItems.get(log.activityId);
                activityName = `Task: ${task?.name || log.activityName}`;
                activityColor = 'var(--text-secondary)'; 
            } else {
                const activity = activities.get(log.activityId);
                activityName = activity?.name || log.activityName;
                activityColor = activity?.color || log.activityColor || 'var(--text-primary)';
            }
            const logHtml = `
                <div class="bg-gray-50 p-3 rounded-lg flex justify-between items-center log-item-pop" style="animation-delay: ${index * 50}ms">
                    <div>
                        <p class="font-semibold" style="color: ${activityColor}">${activityName}</p> 
                        <p class="text-sm">${startStr} - ${endStr} (${formatShortDuration(log.durationMs)})</p> 
                        ${log.notes ? `<p class="text-xs italic mt-1" style="color: var(--text-muted);">${log.notes}</p>` : ''} 
                    </div>
                    <div class="flex space-x-2">
                        <button class="btn-edit-log p-2 text-gray-500 hover:text-blue-600 ${log.timerType === 'task' ? 'opacity-50 cursor-not-allowed' : ''}" data-id="${log.id}" ${log.timerType === 'task' ? 'disabled' : ''}>
                            <svg class="w-5 h-5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536l12.232-12.232z"></path></svg>
                        </button>
                        <button class="btn-delete-log p-2 text-gray-500 hover:text-red-600" data-id="${log.id}">
                            <svg class="w-5 h-5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                    </div>
                </div>
            `;
            logDetailsList.insertAdjacentHTML('beforeend', logHtml);
            const newItemEl = logDetailsList.lastElementChild;
            if (newItemEl) {
                setTimeout(() => {
                    if (newItemEl) { 
                        newItemEl.classList.remove('log-item-pop');
                        newItemEl.style.animationDelay = '';
                    }
                }, 300 + (index * 50)); 
            }
        });
    }
    if (!logDetailsModal.classList.contains('active')) {
        logDetailsModal.classList.add('active');
    }
}
function hideLogDetailsModal() { 
    logDetailsModal.classList.remove('active'); 
}
function handleLogDetailsClick(e) {
    const editBtn = e.target.closest('.btn-edit-log');
    const deleteBtn = e.target.closest('.btn-delete-log');
    if (editBtn && !editBtn.disabled) {
        showEditLogModal(editBtn.dataset.id);
        hideLogDetailsModal(); 
    } else if (deleteBtn) {
        logToDelete = { id: deleteBtn.dataset.id, type: 'log' };
        showDeleteModal();
    }
}

// --- Old Planner Functions (DELETED) ---
// handlePlannerTabClick
// toggleTargetHours
// handleAddPlannerItem
// handlePlannerListClick
// handlePlannerItemDelete
// renderPlannerPage
// renderPlannerItem
// --- All DELETED ---


// --- Emoji Picker Functions (No Changes) ---
const EMOJI_CATEGORIES = [
    { name: 'Smileys', icon: '😀', emojis: ['😀', '😁', '😂', '🤣', '😃', '😄', '😅', '😆', '😉', '😊', '😋', '😎', '😍', '😘', '🥰', '😗', '😙', '🥲', '🤔', '🤫', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '😮‍💨', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '🥸', '🤓', '🧐', '😕', '😟', '🙁', '😮', '😯', '😲', '😳', '🥺', '😦', '😧', '😨', '😰', '😥', '😢', '😭', '😱', '😖', '😣', '😞', '😓', '😩', '😫', '🥱', '😤', '😡', '😠', '🤬', '😈', '👿', '💀', '💩', '🤡', '👹', '👺', '👻', '👽', '🤖', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾']},
    { name: 'People', icon: '👋', emojis: ['👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🫰', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💅', '🤳', '💪', '🦾', '🦵', '🦶', '👂', '🦻', '👃', '🧠', '🫀', '🦷', '🦴', '👀', '👁️', '👅', '👄', '👶', '🧒', '👦', '👧', '🧑', '👱', '👨', '👩', '🧓', '👴', '👵', '🙍', '🙎', '🙅', '🙆', '💁', '🙋', '🧏', '🙇', '🤦', '🤷', '🧑‍⚕️', '🧑‍🎓', '🧑‍🏫', '🧑‍⚖️', '🧑‍🌾', '🧑‍🍳', '🧑‍🔧', '🧑‍🏭', '🧑‍💼', '🧑‍🔬', '🧑‍💻', '🧑‍🎤', '🧑‍🎨', '🧑‍✈️', '🧑‍🚀', '🧑‍🚒', '👮', '🕵️', '💂', '🥷', '👷', '🤴', '👸', '👳', '👲', '🧕', '🤵', '👰', '🤰', '🤱', '👼', '🎅', '🦸', '🦹', '🧙', '🧚', '🧛', '🧜', '🧝', '🧞', '🧟', '💆', '💇', '🚶', '🧍', '🧎', '🧑‍🦽', '🧑‍🦼', '🏃', '💃', '🕺', '🕴️', '👯', '🧘', '🛀', '🛌', '🫂', '🗣️', '👤', '👥', '👣']},
    { name: 'Food', icon: '🍎', emojis: ['🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶️', '🫑', '🌽', '🥕', '🫒', '🧄', '🧅', '🥔', '🍠', '🥐', '🥯', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳', '🧈', '🥞', '🧇', '🥓', '🥩', '🍗', '🍖', '🦴', '🌭', '🍔', '🍟', '🍕', '🫓', '🥪', '🥙', '🧆', '🌮', '🌯', '🫔', '🥗', '🥘', '🫕', '🥫', '🍝', '🍜', '🍲', '🍛', '🍣', '🍱', '🥟', '🦪', '🍤', '🍙', '🍚', '🍘', '🍥', '🥠', '🥮', '🍢', '🍡', '🍧', '🍨', '🍦', '🍰', '🧁', '🥧', '🍮', '🎂', '🍭', '🍬', '🍫', '🍿', '🍩', '🍪', '🌰', '🥜', '🍯', '🥛', '🍼', '☕', '🫖', '🍵', '🍶', '🍾', '🍷', '🍸', '🍹', '🍺', '🍻', '🥂', '🥃', '🥤', '🧋', '🧃', '🧉', '🧊', '🥄', '🍴', '🔪', '🏺', '🌍', '🇪🇺', '🇺🇸', '🌏', '🇦🇺']},
    { name: 'Activities', icon: '⚽', emojis: ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛷', '⛸️', '🥌', '🎿', '⛷️', '🏂', '🪂', '🏋️', '🤸', '⛹️', '🤺', '🤾', '🏌️', '🏇', '🧘', '🏄', '🏊', '🤽', '🚣', '🧗', '🚵', '🚴', '🏆', '🥇', '🥈', '🥉', '🏅', '🎗️', '🎫', '🎪', '🤹', '🎭', '🩰', '🎨', '🎬', '🎤', '🎧', '🎼', '🎹', '🥁', '🎷', '🎺', '🎸', '🪕', '🎻', '🎲', '♟️', '🎯', '🎱', '🎮', '🎰', '🧩']},
    { name: 'Travel', icon: '🚗', emojis: ['🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🛻', '🚚', '🚛', '🚜', '🚔', '🚍', '🏍️', '🛵', '🦽', '🦼', '🛺', '🚲', '🛴', '🛹', '🛼', '🚏', '🛣️', '🛤️', '🛢️', '⛽', '🛞', '🚨', '🚥', '🚦', '🛑', '🚧', '⚓', '⛵', '🛶', '🚤', '🛳️', '⛴️', '🛥️', '🚢', '✈️', '🛩️', '🛫', '🛬', '🪂', '💺', '🚁', '🚠', '🚞', '🚊', '🚝', '🚄', '🚅', '🚈', '🚂', '🚆', '🚇', '🚉', '🛸', '🚀', '🛰️', '🪐', '🌠', '🌌', '⛱️', '🎆', '🎇', '🎑', '🗾', '🗺️', '🌍', '🌎', '🌏', '🌐', '🧭', '🏔️', '⛰️', '🌋', '🗻', '🏕️', '🏖️', '🏜️', '🏝️', '🏞️', '🏟️', '🏛️', '🏗️', '🏘️', '🏚️', '🏠', '🏡', '🏢', '🏣', '🏤', '🏥', '🏦', '🏨', '🏪', '🏫', '🏬', '🏭', '🏯', '🏰', '💒', '🗼', '🗽', '⛪', '🕌', '🛕', '🕍', '🕋', '⛲', '⛺', '🌁', '🌃', '🏙️', '🌄', '🌅', '🌆', '🌇', '🌉', '♨️', '🎠', '🎡', '🎢', '💈', '🛎️', '🧳', '⌛', '⏳', '⌚', '⏰', '⏱️', '⏲️', '🕰️', '🌡️', '☀️', '☁️', '⛅', '⛈️', '🌤️', '🌥️', '🌦️', '🌧️', '🌨️', '🌩️', '🌪️', '🌫️', '🌬️', '🌀', '🌈', '🌂', '☂️', '☔', '⚡', '❄️', '☃️', '⛄', '☄️', '🔥', '💧', '🌊']},
    { name: 'Objects', icon: '⌚', emojis: ['⌚', '📱', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '🖲️', '🕹️', '🗜️', '⚙️', '🔧', '🔨', '⚒️', '⛏️', '🔩', '🧱', '🪨', '🪵', '🛖', '🛞', '⚖️', '🦯', '🔗', '⛓️', '🪝', '🧰', '🧲', '🪜', '⚗️', '🧪', '🧫', '🧬', '🔬', '🔭', '📡', '💉', '🩸', '💊', '🩹', '🩺', '🚪', '🛗', '🪞', '🪟', '🛏️', '🛋️', '🪑', '🚽', '🪠', '🚿', '🛁', '🪤', '🪒', '🧴', '🧷', '🧹', '🧺', '🧻', '🪣', '🧼', '🪥', '🧽', '🧯', '🛒', '🚬', '⚰️', '🪦', '⚱️', '🗿', '🪧', '🔮', '🪄', '📿', '💎', '💍', '💄', '💋', '💌', '💘', '💝', '💖', '💗', '💓', '💞', '💕', '💟', '❣️', '💔', '💯', '💢', '💣', '😵', '🤯', '💬', '👁️‍🗨️', '🗨️', '🗯️', '💭', '💤', '💮', '💈', '👓', '🕶️', '🥽', '🥼', '🦺', '👔', '👕', '👖', '🧣', '🧤', '🧥', '🧦', '👗', '👘', '🥻', '🩱', '🩲', '🩳', '👙', '👚', '👛', '👜', '👝', '🎒', '🩴', '👞', '👟', '🥾', '🥿', '👠', '👡', '🩰', '👢', '👑', '👒', '🎩', '🎓', '🧢', '🪖', '⛑️', '🔇', '🔈', '🔉', '🔊', '📢', '📣', '📯', '🔔', '🔕', '🎼', '🎵', '🎶', '💹', '📇', '📈', '📉', '📊', '📋', '📌', '📍', '📎', '🖇️', '📏', '📐', '✂️', '🗃️', '🗂️', '🗑️', '🔒', '🔓', '🔏', '🔐', '🔑', '🗝️', '🔨', '🪓', '⛏️', '⚒️', '🛠️', '🗡️', '⚔️', '🔫', '🪃', '🏹', '🛡️', '🪚', '🔧', '🔩', '🗜️', '⚖️', '🦯', '🔗', '⛓️', '🪝', '🧰', '🧲', '🪜', '⚗️', '🧪', '🧫', '🧬', '🔬', '🔭', '📡', '💉', '🩸', '💊', '🩹', '🩺', '🚪', '🛗', '🪞', '🪟', '🛏️', '🛋️', '🪑', '🚽', '🪠', '🚿', '🛁', '🪤', '🪒', '🧴', '🧷', '🧹', '🧺', '🧻', 'G', '🧽', '🧯', '🛒', '🚬', '⚰️', '🪦', '⚱️', '🗿', '🪧', '🎄', '🎆', '🎇', '🧨', '✨', '🎈', '🎉', '🎊', '🎋', '🎍', '🎎', '🎏', '🎐', '🎑', '🧧', '🎀', '🎁']},
    { name: 'Symbols', icon: '❤️', emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤎', '🤍', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐', '⛎', '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓', '🆔', '⚛️', '🉑', '☢️', '☣️', '📴', '📳', '🈶', '🈚', '🈸', '🈺', '🈷️', '✴️', '🆚', '💮', '🉐', '㊙️', '㊗️', '🈴', '🈵', '🈹', '🈲', '🅰️', '🅱️', '🆎', '🆑', '🅾️', '🆘', '❌', '⭕', '🛑', '⛔', '📛', '🚫', '💯', '💢', '♨️', '🚷', '🚯', '🚳', '🚱', '🔞', '📵', '🚭', '❗️', '❕', '❓', '❔', '‼️', '⁉️', '🔅', '🔆', '〽️', '⚠️', '🚸', '🔱', '⚜️', '🔰', '♻️', '✅', '🈯', '💹', '❇️', '✳️', '❎', '🌐', '💠', 'Ⓜ️', '🌀', '💤', '🏧', '🚾', '♿', '🅿️', '🛗', '🈳', '🈂️', '🛂', '🛃', '🛄', '🛅', '🛜', '🚰', '🚹', '♂️', '🚺', '♀️', '⚧️', '🚼', '🚻', '🚮', '🎦', '📶', '🈁', '🔣', 'ℹ️', '🔤', '🔡', '🔠', '🆖', '🆗', '🆙', '🆒', '🆕', '🆓', '0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟', '🔢', '#️⃣', '*️⃣', '⏏️', '▶️', '⏸️', '⏯️', '⏹️', '⏺️', '⏭️', '⏮️', '⏩', '⏪', '⏫', '⏬', '◀️', '🔼', '🔽', '➡️', '⬅️', '⬆️', '⬇️', '↗️', '↘️', '↙️', '↖️', '↕️', '↔️', '↪️', '↩️', '⤴️', '⤵️', '🔀', '🔁', '🔂', '🔄', '🔃', '🎵', '🎶', '➕', '➖', '➗', '✖️', '🟰', '♾️', '💲', '💱', '™️', '©️', '®️', '🔚', '🔙', '🔛', '🔝', '🔜', '〰️', '➰', '➿', '✔️', '☑️', '🔘', '🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '⚫', '⚪', '🟤', '🔺', '🔻', '🔼', '🔽', '🔳', '🔲', '▪️', '▫️', '◾', '◽', '◼️', '◻️', '🟥', '🟧', '🟨', '🟩', '🟦', '🟪', '🟫', '⬛', '⬜', '🔶', '🔷', '🔸', '🔹']},
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

// --- Export to CSV (Unchanged) ---
function exportToCSV() {
    if (analysisLogs.length === 0) {
        alert("No data to export for this period.");
        return;
    }
    let csvContent = "data:text/csv;charset=utf-8,";
    const headers = ["Activity", "Category", "Notes", "Date", "Start Time", "End Time", "Duration (Hours)"];
    csvContent += headers.join(",") + "\r\n";
    const sortedLogs = [...analysisLogs].sort((a, b) => a.startTime - b.startTime);
    sortedLogs.forEach(log => {
        let activityName, category;
        if (log.timerType === 'task') {
            const task = plannerItems.get(log.activityId);
            activityName = `Task: ${task?.name || log.activityName}`;
            category = "Planner Task";
        } else {
            const activity = activities.get(log.activityId);
            activityName = activity?.name || log.activityName;
            category = activity?.category || 'Uncategorized';
        }
        const notes = log.notes || "";
        const start = new Date(log.startTime);
        const end = new Date(log.endTime);
        const date = start.toLocaleDateString('en-CA'); 
        const startTime = start.toLocaleTimeString('en-GB'); 
        const endTime = end.toLocaleTimeString('en-GB'); 
        const durationHours = (log.durationMs / 3600000).toFixed(4);
        const row = [
            `"${activityName.replace(/"/g, '""')}"`,
            `"${category.replace(/"/g, '""')}"`, 
            `"${notes.replace(/"/g, '""')}"`,
            date,
            startTime,
            endTime,
            durationHours
        ];
        csvContent += row.join(",") + "\r\n";
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `time-tracker-export-${getTodayString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
