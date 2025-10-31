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
let activities = new Map(); // Stores "Goals" (recurring activities)
let plannerItems = new Map(); // Stores "Tasks" and "Deadlines"
let todaysLogs = []; // Caches logs just for today (for home page)
let currentAnalysisView = 'daily'; 
let currentAnalysisDate = new Date(); 
let barChartInstance = null;
let pieChartInstance = null;
let analysisLogs = []; // Caches logs for the analysis page's current view
let logToEditId = null;
let logToDelete = { id: null, type: null };
let activityToEditId = null; // Note: This is now for "Goals"
let draggedItemElement = null;
let previousTimeString = "00:00:00"; 
let currentEmojiInputTarget = null;
let stopTimerCompletion = null; 

// --- Track Page State ---
let currentTrackView = 'list'; // 'list' or 'grid'
let currentTrackTimeRange = {
    type: 'today',
    startDate: null, // Start of range
    endDate: null,   // End of range
};
// Default filters show everything
let currentTrackFilters = {
    types: { goal: true, task: true, deadline: true },
    activities: new Set(), // Empty = all
    categories: new Set(), // Empty = all
};

// --- Element References ---
const mainApp = document.getElementById('main-app');
const pages = {
    home: document.getElementById('home-page'),
    track: document.getElementById('track-page'), 
    analysis: document.getElementById('analysis-page'),
    settings: document.getElementById('settings-page')
};
const navButtons = document.querySelectorAll('.nav-btn');

// --- Datalist ---
const categoryDatalist = document.getElementById('category-list-datalist'); 

// --- Settings Page ---
const themeToggleBtnSettings = document.getElementById('theme-toggle-btn-settings');
const themeIconLightSettings = document.getElementById('theme-icon-light-settings');
const themeIconDarkSettings = document.getElementById('theme-icon-dark-settings');
const fontSizeSlider = document.getElementById('font-size-slider');
const signInBtn = document.getElementById('sign-in-btn');
const signOutBtn = document.getElementById('sign-out-btn');
const userInfo = document.getElementById('user-info');
const userEmail = document.getElementById('user-email');

// --- Home Page ---
const homeTimerCard = document.getElementById('home-timer-card'); 
const homeTimerLabel = document.getElementById('home-timer-label'); 
const homeTimerActivityName = document.getElementById('home-timer-activity-name'); 
const homeTimerTime = document.getElementById('home-timer-time'); 
const homeTimerStopBtn = document.getElementById('home-timer-stop-btn'); 
const generateAiSummaryBtn = document.getElementById('generate-ai-summary-btn'); 
const aiSummaryContent = document.getElementById('ai-summary-content'); 
const homeTodayList = document.getElementById('home-today-list'); 

// --- Track Page ---
const searchBox = document.getElementById('search-box');
const viewToggleBtn = document.getElementById('view-toggle-btn');
const viewToggleIconList = document.getElementById('view-toggle-icon-list');
const viewToggleIconGrid = document.getElementById('view-toggle-icon-grid');
const timeRangeBtn = document.getElementById('time-range-btn');
const timeNavPrev = document.getElementById('time-nav-prev');
const timeNavNext = document.getElementById('time-nav-next');
const filterBtn = document.getElementById('filter-btn');
const trackContentArea = document.getElementById('track-content-area');

// --- Universal Add Button ---
const universalAddBtn = document.getElementById('universal-add-btn');

// --- Timer UI ---
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

// --- Analysis Page ---
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
const exportCsvBtn = document.getElementById('export-csv-btn');

// --- Modals ---
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

const editActivityModal = document.getElementById('edit-activity-modal');
const editActivityForm = document.getElementById('edit-activity-form');
const cancelEditActivityBtn = document.getElementById('cancel-edit-activity-btn');
const editActivityIdInput = document.getElementById('edit-activity-id');
const editActivityNameInput_Input = document.getElementById('edit-activity-name-input');
const editActivityColorInput = document.getElementById('edit-activity-color-input');
const editActivityEmojiBtn = document.getElementById('edit-activity-emoji-input'); 
const editActivityEmojiValue = document.getElementById('edit-activity-emoji-value');
const deleteActivityFromModalBtn = document.getElementById('delete-activity-from-modal-btn'); 
const editActivityCategoryInput = document.getElementById('edit-activity-category'); 
const editActivityGoalValueInput = document.getElementById('edit-activity-goal-value'); 
const editActivityGoalPeriodInput = document.getElementById('edit-activity-goal-period'); 
const editActivityPinToggle = document.getElementById('edit-activity-pin'); // Deprecated, but we'll leave it

const logDetailsModal = document.getElementById('log-details-modal');
const logDetailsList = document.getElementById('log-details-list');
const closeLogDetailsBtn = document.getElementById('close-log-details-btn');

const emojiModal = document.getElementById('emoji-modal');
const emojiGrid = document.getElementById('emoji-grid');
const closeEmojiModalBtn = document.getElementById('close-emoji-modal-btn');
const emojiCategories = document.getElementById('emoji-categories');

// --- NEW Modal Refs ---
const addItemModal = document.getElementById('add-item-modal');
const addItemForm = document.getElementById('add-item-form');
const cancelAddItemBtn = document.getElementById('cancel-add-item-btn');
const saveAddItemBtn = document.getElementById('save-add-item-btn');
const addItemTypeSelect = document.getElementById('add-item-type');
// ... (Add refs for all form inputs inside add-item-modal later)

const timeRangeModal = document.getElementById('time-range-modal');
const cancelTimeRangeBtn = document.getElementById('cancel-time-range-btn');

const filterModal = document.getElementById('filter-modal');
const closeFilterModalBtn = document.getElementById('close-filter-modal-btn');
const filterTypeContainer = document.getElementById('filter-type-container');
const filterTabActivities = document.getElementById('filter-tab-activities');
const filterTabCategories = document.getElementById('filter-tab-categories');
const filterListActivities = document.getElementById('filter-list-activities');
const filterListCategories = document.getElementById('filter-list-categories');

// --- Firebase Collections ---
const activitiesCollection = () => db.collection('users').doc(userId).collection('activities');
const timeLogsCollection = () => db.collection('users').doc(userId).collection('timeLogs');
const plannerCollection = () => db.collection('users').doc(userId).collection('plannerItems');

// --- App Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    // Set initial time range to Today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    currentTrackTimeRange.startDate = today;
    currentTrackTimeRange.endDate = tomorrow;
    currentTrackTimeRange.type = 'today';

    loadThemePreference(); 
    loadFontSizePreference();
    setupEventListeners();
    authenticateUser(); 
    setDefaultAnalysisDate();
    setFlipClock("00:00:00"); 
    populateEmojiPicker();
});

function setupEventListeners() {
    navButtons.forEach(btn => btn.addEventListener('click', () => showPage(btn.dataset.page)));
    
    // --- Settings ---
    themeToggleBtnSettings.addEventListener('click', toggleTheme); 
    fontSizeSlider.addEventListener('input', handleFontSizeChange);
    signInBtn.addEventListener('click', signInWithGoogle);
    signOutBtn.addEventListener('click', signOut);

    // --- Home ---
    homeTimerStopBtn.addEventListener('click', stopTimer); 
    generateAiSummaryBtn.addEventListener('click', handleGenerateAISummary); 
    homeTodayList.addEventListener('click', handleTrackListClick); // Clicks on home list are delegated

    // --- Track Page ---
    searchBox.addEventListener('input', () => renderTrackPage(false));
    viewToggleBtn.addEventListener('click', toggleTrackView);
    timeRangeBtn.addEventListener('click', showTimeRangeModal);
    timeNavPrev.addEventListener('click', () => navigateTimeRange(-1));
    timeNavNext.addEventListener('click', () => navigateTimeRange(1));
    filterBtn.addEventListener('click', showFilterModal);
    trackContentArea.addEventListener('click', handleTrackListClick);

    // --- Universal Add Button ---
    universalAddBtn.addEventListener('click', showAddItemModal);

    // --- Analysis ---
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
    
    // --- Timer UI ---
    timerBanner.addEventListener('click', (e) => {
        if (!e.target.closest('#banner-stop-btn')) { 
            if (currentTimer) showFlipClock(); 
        }
    });
    bannerStopBtn.addEventListener('click', stopTimer); 
    flipClockBackBtn.addEventListener('click', hideFlipClock);
    
    // --- Standard Modals ---
    cancelDeleteBtn.addEventListener('click', hideDeleteModal);
    confirmDeleteBtn.addEventListener('click', handleConfirmDelete);
    
    stopNoteForm.addEventListener('submit', handleSaveStopNote);
    skipStopNoteBtn.addEventListener('click', handleSaveStopNote);
    addClickOutsideListener(stopNoteModal, handleSaveStopNote);
    
    cancelManualEntryBtn.addEventListener('click', hideManualEntryModal);
    manualEntryForm.addEventListener('submit', handleSaveManualEntry);
    
    cancelEditLogBtn.addEventListener('click', hideEditLogModal);
    editLogForm.addEventListener('submit', handleSaveEditLog);
    
    // --- Edit Activity (Goal) Modal ---
    cancelEditActivityBtn.addEventListener('click', hideEditActivityModal);
    editActivityForm.addEventListener('submit', handleSaveEditActivity);
    deleteActivityFromModalBtn.addEventListener('click', handleDeleteActivityFromModal); 
    
    // --- Emoji Modal ---
    addClickOutsideListener(emojiModal, hideEmojiPicker);
    emojiCategories.addEventListener('click', handleEmojiCategorySelect);
    emojiGrid.addEventListener('click', handleEmojiSelect);
    closeEmojiModalBtn.addEventListener('click', hideEmojiPicker);

    // --- NEW Modals ---
    cancelAddItemBtn.addEventListener('click', hideAddItemModal);
    addItemForm.addEventListener('submit', handleAddItem);
    addClickOutsideListener(addItemModal, hideAddItemModal);
    if (addItemTypeSelect) addItemTypeSelect.addEventListener('change', handleAddItemTypeChange);
    
    cancelTimeRangeBtn.addEventListener('click', hideTimeRangeModal);
    timeRangeModal.addEventListener('click', handleTimeRangeSelect);
    addClickOutsideListener(timeRangeModal, hideTimeRangeModal);

    closeFilterModalBtn.addEventListener('click', applyFiltersAndClose);
    filterTypeContainer.addEventListener('click', handleFilterTypeToggle);
    filterTabActivities.addEventListener('click', () => switchFilterTab('activities'));
    filterTabCategories.addEventListener('click', () => switchFilterTab('categories'));
    filterListActivities.addEventListener('click', (e) => handleFilterListCheck(e, 'activities'));
    filterListCategories.addEventListener('click', (e) => handleFilterListCheck(e, 'categories'));

    // --- Modal Click-outside Listeners ---
    addClickOutsideListener(deleteModal, hideDeleteModal);
    addClickOutsideListener(manualEntryModal, hideManualEntryModal);
    addClickOutsideListener(editLogModal, hideEditLogModal);
    addClickOutsideListener(editActivityModal, hideEditActivityModal);
    addClickOutsideListener(logDetailsModal, hideLogDetailsModal);
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
function setDefaultAnalysisDate() {
    currentAnalysisDate = new Date(); 
    currentAnalysisDate.setHours(0,0,0,0);
    analysisDateInput.value = getTodayString(); 
    manualDateInput.value = getTodayString(); 
}
function getStartOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    return new Date(d.setDate(diff));
}

// --- Auth & Data Loading ---
function authenticateUser() {
    googleProvider = new firebase.auth.GoogleAuthProvider(); // This line was missing
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
            await loadTodaysTimeLogs(); // This caches today's logs
            
            // Render current page
            const activePage = document.querySelector('.page.active')?.id || 'home-page';
            showPage(activePage.replace('-page', ''));
            
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
    if (!googleProvider) {
        googleProvider = new firebase.auth.GoogleAuthProvider();
    }
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

function clearAllUserData() {
    if (currentTimer) stopTimer(); 
    activities.clear();
    plannerItems.clear();
    todaysLogs = [];
    analysisLogs = [];
    
    // Reset filters
    currentTrackFilters.activities.clear();
    currentTrackFilters.categories.clear();

    trackContentArea.innerHTML = `<p class="text-center text-muted p-4">Please sign in to track your time.</p>`;
    homeTodayList.innerHTML = `<p class="text-center text-muted p-4">Please sign in.</p>`;
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
        renderHomePage(); 
        renderTrackPage(false); // Re-render track page
    }
}

// UPDATED: Show Page
function showPage(pageName) {
    if (!pages[pageName]) pageName = 'home'; // Default to home

    Object.values(pages).forEach(p => p.classList.remove('active'));
    navButtons.forEach(btn => {
         const isActive = btn.dataset.page === pageName;
         btn.classList.toggle('active-nav', isActive); 
    });
    
    pages[pageName].classList.add('active');
    
    // Load data or render if page is opened
    if (pageName === 'analysis') {
        if (analysisLogs.length === 0) { // Only load if not already loaded
             setDefaultAnalysisDate(); 
             setAnalysisView('daily'); 
        }
    } else if (pageName === 'home') {
        renderHomePage(); 
    } else if (pageName === 'track') {
        renderTrackPage(false); // Don't force data reload, just render
    }

    // Toggle universal add button
    universalAddBtn.style.display = (pageName === 'track') ? 'flex' : 'none';
}

async function loadActivities() { // These are "Goals"
    if (!userId) return;
    try {
        const snapshot = await activitiesCollection().orderBy('order', 'asc').get(); 
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

async function loadPlannerItems() { // These are "Tasks" and "Deadlines"
    if (!userId) return;
    try {
        const snapshot = await plannerCollection().orderBy('dueDate', 'asc').get();
        plannerItems.clear();
        snapshot.forEach(doc => {
            plannerItems.set(doc.id, { ...doc.data(), id: doc.id });
        });
    } catch (error) {
        console.error("Error loading planner items: ", error);
    }
}

async function loadTodaysTimeLogs() {
    if (!userId) return;
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    try {
        const snapshot = await timeLogsCollection().where('startTime', '>=', todayStart.getTime()).get();
        todaysLogs = []; 
        snapshot.forEach(doc => { 
            todaysLogs.push({ ...doc.data(), id: doc.id }); 
        });
        renderHomePage(); // Update home page
    } catch (error) { console.error("Error loading today's logs: ", error); }
}

function populateCategoryDatalist() {
    const categories = new Set();
    activities.forEach(act => {
        if (act.category) categories.add(act.category);
    });
    
    categoryDatalist.innerHTML = '';
    categories.forEach(cat => {
        categoryDatalist.innerHTML += `<option value="${cat}">`;
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

// --- Home Page ---
function renderHomePage() {
    if (!userId) {
        homeTodayList.innerHTML = `<p class="text-center text-muted p-4">Please sign in.</p>`;
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

    // 2. Render Today's List (Simplified)
    homeTodayList.innerHTML = '';
    let itemsFound = false;

    // Get Today's Deadlines
    const agendaItems = Array.from(plannerItems.values())
        .filter(item => item.type === 'deadline' && item.dueDate === todayString && !item.isCompleted)
        .sort((a, b) => a.name.localeCompare(b.name));

    if (agendaItems.length > 0) {
        itemsFound = true;
        homeTodayList.insertAdjacentHTML('beforeend', `<h3 class="text-xl font-semibold mb-3 mt-4">Today's Agenda</h3>`);
        agendaItems.forEach(item => {
            homeTodayList.insertAdjacentHTML('beforeend', renderHomeItem(item));
        });
    }

    // Get Today's Tasks
    const taskItems = Array.from(plannerItems.values())
        .filter(item => item.type === 'task' && item.dueDate === todayString && !item.isCompleted)
        .sort((a, b) => a.name.localeCompare(b.name));
    
    if (taskItems.length > 0) {
        itemsFound = true;
        homeTodayList.insertAdjacentHTML('beforeend', `<h3 class="text-xl font-semibold mb-3 mt-4">Today's Tasks</h3>`);
        taskItems.forEach(item => {
            homeTodayList.insertAdjacentHTML('beforeend', renderHomeItem(item));
        });
    }
    
    // Get Daily Goals
    const dailyGoals = Array.from(activities.values())
        .filter(act => act.goal && act.goal.period === 'daily' && act.goal.value > 0)
        .sort((a, b) => (a.order || 0) - (b.order || 0));

    if (dailyGoals.length > 0) {
        itemsFound = true;
        homeTodayList.insertAdjacentHTML('beforeend', `<h3 class="text-xl font-semibold mb-3 mt-4">Daily Goals</h3>`);
        dailyGoals.forEach(activity => {
            const totalTodayMs = todaysLogs
                .filter(log => log.activityId === activity.id && log.timerType === 'activity')
                .reduce((acc, log) => acc + log.durationMs, 0);
            homeTodayList.insertAdjacentHTML('beforeend', renderHomeItem(activity, totalTodayMs));
        });
    } 
    
    if (!itemsFound && !currentTimer) {
        homeTodayList.innerHTML = `<p class="text-center text-muted p-4">Nothing scheduled for today. Add items from the 'Track' tab.</p>`;
    }
}

/**
 * Renders a simplified item for the Home page list.
 */
function renderHomeItem(item, trackedMs) {
    const isActivity = !!item.color;
    let emoji, name, subtext, id, type;

    if (isActivity) { // It's a Goal
        id = item.id;
        type = 'goal';
        emoji = item.emoji || '🎯';
        name = item.name;
        const targetMs = (item.goal?.value || 0) * 3600000;
        const percentage = Math.min(100, (trackedMs / targetMs) * 100);
        subtext = `${formatShortDuration(trackedMs)} / ${item.goal.value}h (${percentage.toFixed(0)}%)`;
    } else { // It's a Task or Deadline
        id = item.id;
        type = item.type;
        emoji = item.type === 'task' ? '📌' : '📅';
        name = item.name;
        if (type === 'task') {
            const targetHours = item.targetHours || 0;
            const trackedDurationMs = item.trackedDurationMs || 0;
            subtext = `${formatShortDuration(trackedDurationMs)} / ${targetHours}h`;
        } else {
            subtext = item.notes || 'Deadline';
        }
    }

    return `
    <div class="track-item" data-id="${id}" data-type="${type}">
        <div class="track-item-emoji">${emoji}</div>
        <div class="track-item-content py-3">
            <div class="track-item-main-name">${name}</div>
            <div class="track-item-main-notes">${subtext}</div>
        </div>
    </div>
    `;
}

// --- Track Page ---

function toggleTrackView() {
    if (currentTrackView === 'list') {
        currentTrackView = 'grid';
        viewToggleIconList.classList.add('hidden');
        viewToggleIconGrid.classList.remove('hidden');
    } else {
        currentTrackView = 'list';
        viewToggleIconList.classList.remove('hidden');
        viewToggleIconGrid.classList.add('hidden');
    }
    renderTrackPage(false); // Re-render with new view
}

// Main render function for the Track page
async function renderTrackPage(forceDataReload = false) {
    if (!userId) {
        trackContentArea.innerHTML = `<p class="text-center text-muted p-4">Please sign in.</p>`;
        return;
    }
    
    updateTimeRangeButtonText();

    if (forceDataReload) {
        // This is where we would re-fetch logs if the time range is huge
        // For now, we'll just re-render
    }

    if (currentTrackView === 'list') {
        renderTrackList();
    } else {
        renderTrackGrid();
    }
}

async function renderTrackList() {
    trackContentArea.innerHTML = ''; // Clear content
    
    // 1. Get all items (Goals, Tasks, Deadlines)
    let allItems = [
        ...Array.from(activities.values()).map(a => ({...a, itemType: 'goal'})),
        ...Array.from(plannerItems.values()).map(p => ({...p, itemType: p.type}))
    ];

    // 2. Filter by Search
    const searchTerm = searchBox.value.toLowerCase();
    if (searchTerm) {
        allItems = allItems.filter(item => 
            item.name.toLowerCase().includes(searchTerm) ||
            (item.category && item.category.toLowerCase().includes(searchTerm)) ||
            (item.notes && item.notes.toLowerCase().includes(searchTerm))
        );
    }

    // 3. Filter by Type
    const { goal, task, deadline } = currentTrackFilters.types;
    if (!goal || !task || !deadline) { // Only filter if not all are true
        allItems = allItems.filter(item => 
            (item.itemType === 'goal' && goal) ||
            (item.itemType === 'task' && task) ||
            (item.itemType === 'deadline' && deadline)
        );
    }
    
    // 4. Filter by Activity/Category
    if (currentTrackFilters.activities.size > 0) {
        allItems = allItems.filter(item => currentTrackFilters.activities.has(item.id));
    }
    if (currentTrackFilters.categories.size > 0) {
        allItems = allItems.filter(item => currentTrackFilters.categories.has(item.category));
    }

    // 5. Filter by Time Range
    // This is complex. We need to get all logs in the time range first.
    let logsInRange = [];
    if (currentTrackTimeRange.type !== 'all') {
        try {
            const snapshot = await timeLogsCollection()
                .where('startTime', '>=', currentTrackTimeRange.startDate.getTime())
                .where('startTime', '<', currentTrackTimeRange.endDate.getTime())
                .get();
            snapshot.forEach(doc => logsInRange.push(doc.data()));
        } catch (e) {
            console.error("Error fetching logs for range: ", e);
        }
    }
    // ... logic to associate logs with items ...
    
    // 6. Group by Day
    // ... (This logic is complex and involves creating day headers)
    
    // 7. Render
    // For now, just render the filtered list without day grouping
    if (allItems.length === 0) {
        trackContentArea.innerHTML = `<p class="text-center text-muted p-4">No items match your criteria.</p>`;
        return;
    }
    
    let html = '';
    allItems.forEach(item => {
        let trackedMs = 0;
        // This is a simplification; ideally, we'd sum logs for the *selected time range*
        if (item.itemType === 'goal') {
            trackedMs = todaysLogs.filter(log => log.activityId === item.id).reduce((acc, l) => acc + l.durationMs, 0);
        } else if (item.itemType === 'task') {
            trackedMs = item.trackedDurationMs || 0;
        }
        html += renderTrackItem(item, trackedMs);
    });
    trackContentArea.innerHTML = html;
}

function renderTrackItem(item, trackedMs = 0) {
    const isActivity = !!item.color; // Activities have colors
    let itemType, id, name, emoji, category, notes, dueDate, targetHours, isCompleted, color;

    if (isActivity) {
        // It's a Goal (Activity)
        itemType = 'goal';
        id = item.id;
        name = item.name;
        emoji = item.emoji || '🎯';
        category = item.category || 'Uncategorized';
        notes = null; 
        dueDate = null;
        targetHours = item.goal?.value || 0;
        isCompleted = false; 
        color = item.color;
    } else {
        // It's a Task or Deadline
        itemType = item.type; // 'task' or 'deadline'
        id = item.id;
        name = item.name;
        emoji = item.type === 'task' ? '📌' : '📅';
        category = "Planner"; // Planner items don't have categories
        notes = item.notes || null;
        dueDate = item.dueDate;
        targetHours = item.targetHours || 0;
        currentTrackedMs = item.trackedDurationMs || 0;
        isCompleted = item.isCompleted;
        color = 'var(--link-color)'; // Default color for tasks
    }

    const isRunning = currentTimer && currentTimer.activityId === id;
    const timerActive = currentTimer !== null;
    
    // --- Dates ---
    let dateInfo = '';
    if (dueDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dueDateObj = new Date(dueDate + 'T00:00:00');
        const isOverdue = dueDateObj < today && !isCompleted;
        
        dateInfo = `<span class="track-item-due-date ${isOverdue ? 'overdue' : ''}">
            ${isOverdue ? 'Overdue' : `Due: ${dueDate}`}
        </span>`;
    }

    // --- Progress Bar & Subtext ---
    let progressHtml = '';
    if (itemType === 'goal' || itemType === 'task') {
        if (targetHours > 0) {
            const targetMs = targetHours * 3600000;
            const percentage = targetMs > 0 ? Math.min(100, (trackedMs / targetMs) * 100) : 0;
            progressHtml = `
                <div class="track-item-progress-bar">
                    <div class="track-item-progress-fill" style="width: ${percentage}%; background-color: ${color}"></div>
                </div>
                <div class="track-item-details">
                    <span>${formatShortDuration(trackedMs)} / ${targetHours}h (${percentage.toFixed(0)}%)</span>
                    ${dateInfo}
                </div>
            `;
        } else if (itemType === 'task') {
             progressHtml = `
                <div class="track-item-details">
                    <span>${formatShortDuration(trackedMs)} tracked</span>
                    ${dateInfo}
                </div>`;
        }
    } else if (itemType === 'deadline') {
        progressHtml = `
            <p class="track-item-main-notes">${notes || ''}</p>
            <div class="track-item-details">
                <span></span> ${dateInfo}
            </div>
        `;
    }
    
    // --- Action Box ---
    let actionBoxHtml = '';
    if (itemType === 'goal' || itemType === 'task') {
        const action = isRunning ? 'stop' : 'start';
        actionBoxHtml = `
            <button class="action-${action}" 
                    data-id="${id}" 
                    data-name="${name}" 
                    data-color="${color}" 
                    data-type="${itemType}"
                    ${timerActive && !isRunning ? 'disabled' : ''}
                    title="${isRunning ? 'Stop' : 'Start'}">
                ${isRunning ? 
                    `<span class="timer">${formatHHMMSS(Date.now() - currentTimer.startTime).substring(0, 5)}</span>
                     <svg fill="currentColor" viewBox="0 0 20 20"><path d="M5 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H5z"></path></svg>` : 
                    `<svg fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"></path></svg>
                     <span>Start</span>`
                }
            </button>
        `;
    } else if (itemType === 'deadline') {
        actionBoxHtml = `
            <button classm"action-done" data-id="${id}" data-type="deadline" title="Mark as Done">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span>Done</span>
            </button>
        `;
    }

    return `
    <div class="track-item ${isCompleted ? 'completed' : ''}" data-id="${id}" data-type="${itemType}">
        <div class="track-item-emoji">${emoji}</div>
        <div class="track-item-content">
            <div class="track-item-main">
                <div class="track-item-main-category">${category}</div>
                <div class="track-item-main-name">${name}</div>
            </div>
            ${progressHtml}
        </div>
        <div class="track-item-action-box" style="${(timerActive && !isRunning && (itemType === 'goal' || itemType === 'task')) ? 'background-color: var(--bg-button-secondary);' : ''}">
            ${actionBoxHtml}
        </div>
    </div>
    `;
}

function handleTrackListClick(e) {
    const actionBtn = e.target.closest('.track-item-action-box button');
    if (!actionBtn) return; // Didn't click an action

    const itemEl = e.target.closest('.track-item');
    const id = itemEl.dataset.id;
    const type = itemEl.dataset.type;

    if (type === 'goal' || type === 'task') {
        const name = actionBtn.dataset.name;
        const color = actionBtn.dataset.color;
        
        if (currentTimer && currentTimer.activityId === id) {
            stopTimer();
        } else if (!currentTimer) {
            startTimer(id, name, color, type);
        }
    } else if (type === 'deadline') {
        const isCompleted = !itemEl.classList.contains('completed');
        handlePlannerItemCheck(id, isCompleted); // Mark as complete/incomplete
    }
}

async function handlePlannerItemCheck(id, isCompleted) {
    const item = plannerItems.get(id);
    if (!item) return;

    try {
        await plannerCollection().doc(id).update({ isCompleted: isCompleted });
        item.isCompleted = isCompleted; // Update local cache
        renderTrackPage(false); // Re-render
        renderHomePage(); // Re-render
    } catch (e) {
        console.error("Error updating item completion: ", e);
    }
}


async function renderTrackGrid() {
    trackContentArea.innerHTML = `<p class="text-center text-muted p-4">Grid View (Implementation Pending)</p>`;
    // This function will be implemented later as discussed
}

function updateTimeRangeButtonText() {
    const formatOpts = { month: 'short', day: 'numeric', year: 'numeric' };
    let text = 'Today';
    switch(currentTrackTimeRange.type) {
        case 'today':
            text = new Date().toLocaleDateString(undefined, { month: 'long', day: 'numeric' });
            break;
        case 'week':
            const start = currentTrackTimeRange.startDate;
            const end = new Date(currentTrackTimeRange.endDate);
            end.setDate(end.getDate() - 1); // Go to last day of range
            text = `${start.toLocaleDateString(undefined, {month: 'short', day: 'numeric'})} - ${end.toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}`;
            break;
        case 'month':
            text = currentTrackTimeRange.startDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
            break;
        case 'year':
            text = currentTrackTimeRange.startDate.toLocaleDateString(undefined, { year: 'numeric' });
            break;
        case 'all':
            text = 'All Time';
            break;
        case 'custom':
            // ... (add custom logic later)
            text = 'Custom Range';
            break;
    }
    timeRangeBtn.textContent = text;
}

function navigateTimeRange(direction) {
    // direction is -1 for prev, 1 for next
    let newStartDate = new Date(currentTrackTimeRange.startDate);
    
    switch(currentTrackTimeRange.type) {
        case 'today':
            newStartDate.setDate(newStartDate.getDate() + direction);
            break;
        case 'week':
            newStartDate.setDate(newStartDate.getDate() + (7 * direction));
            break;
        case 'month':
            newStartDate.setMonth(newStartDate.getMonth() + direction, 1);
            break;
        case 'year':
            newStartDate.setFullYear(newStartDate.getFullYear() + direction, 0, 1);
            break;
        case 'all':
            return; // Can't navigate all time
    }
    
    // Recalculate range based on new start date and type
    setTrackTimeRange(currentTrackTimeRange.type, newStartDate);
    renderTrackPage(true); // Force reload
}

function setTrackTimeRange(type, startDate) {
    let endDate;
    startDate.setHours(0, 0, 0, 0);

    switch(type) {
        case 'today':
            endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + 1);
            break;
        case 'week':
            startDate = getStartOfWeek(startDate);
            endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + 7);
            break;
        case 'month':
            startDate.setDate(1);
            endDate = new Date(startDate);
            endDate.setMonth(endDate.getMonth() + 1);
            break;
        case 'year':
            startDate.setMonth(0, 1);
            endDate = new Date(startDate);
            endDate.setFullYear(endDate.getFullYear() + 1);
            break;
        case 'all':
            startDate = new Date(2000, 0, 1); // Far in past
            endDate = new Date(2100, 0, 1); // Far in future
            break;
    }
    
    currentTrackTimeRange = { type, startDate, endDate };
}

function handleTimeRangeSelect(e) {
    const btn = e.target.closest('button[data-range]');
    if (!btn) return;
    
    const rangeType = btn.dataset.range;
    if (rangeType === 'custom') {
        alert("Custom range not implemented yet.");
        return;
    }
    
    setTrackTimeRange(rangeType, new Date());
    renderTrackPage(true); // Force data reload
    hideTimeRangeModal();
}

// --- Modals (Show/Hide) ---
function showAddItemModal() { addItemModal.classList.add('active'); }
function hideAddItemModal() { addItemModal.classList.remove('active'); }
function showTimeRangeModal() { timeRangeModal.classList.add('active'); }
function hideTimeRangeModal() { timeRangeModal.classList.remove('active'); }
function showFilterModal() { 
    populateFilterLists();
    filterModal.classList.add('active'); 
}
function applyFiltersAndClose() {
    // Logic to save selected filters from lists
    // ...
    filterModal.classList.remove('active'); 
    renderTrackPage(false); // Re-render with new filters
}
// ... (All other modal show/hide functions: delete, stopNote, manualEntry, editLog, editActivity, logDetails, emoji)

// --- Filter Modal Logic ---
function handleFilterTypeToggle(e) {
    const btn = e.target.closest('.filter-toggle-btn');
    if (!btn) return;

    const type = btn.dataset.type; // 'goal', 'task', 'deadline'
    const isActive = btn.classList.toggle('active');
    currentTrackFilters.types[type] = isActive;
    
    // Add check icon logic here
}
function switchFilterTab(tabName) {
    if (tabName === 'activities') {
        filterTabActivities.classList.add('active', 'border-blue-600');
        filterTabActivities.classList.remove('text-gray-500');
        filterTabCategories.classList.remove('active', 'border-blue-600');
        filterTabCategories.classList.add('text-gray-500');
        filterListActivities.style.display = 'block';
        filterListCategories.style.display = 'none';
    } else {
        filterTabCategories.classList.add('active', 'border-blue-600');
        filterTabCategories.classList.remove('text-gray-500');
        filterTabActivities.classList.remove('active', 'border-blue-600');
        filterTabActivities.classList.add('text-gray-500');
        filterListActivities.style.display = 'none';
        filterListCategories.style.display = 'block';
    }
}
function populateFilterLists() {
    // Populate Activities
    filterListActivities.innerHTML = '';
    Array.from(activities.values()).sort((a,b) => a.name.localeCompare(b.name)).forEach(act => {
        const isChecked = currentTrackFilters.activities.has(act.id);
        filterListActivities.innerHTML += `
            <div class="filter-list-item">
                <input type="checkbox" id="filter-act-${act.id}" data-id="${act.id}" ${isChecked ? 'checked' : ''}>
                <label for="filter-act-${act.id}" class="ml-3">${act.name}</label>
            </div>
        `;
    });
    
    // Populate Categories
    filterListCategories.innerHTML = '';
    const categories = new Set();
    activities.forEach(act => { if(act.category) categories.add(act.category) });
    
    Array.from(categories).sort().forEach(cat => {
        const isChecked = currentTrackFilters.categories.has(cat);
        filterListCategories.innerHTML += `
            <div class="filter-list-item">
                <input type="checkbox" id="filter-cat-${cat}" data-id="${cat}" ${isChecked ? 'checked' : ''}>
                <label for="filter-cat-${cat}" class="ml-3">${cat}</label>
            </div>
        `;
    });
}
function handleFilterListCheck(e, type) {
    const checkbox = e.target.closest('input[type="checkbox"]');
    if (!checkbox) return;

    const id = checkbox.dataset.id;
    const filterSet = (type === 'activities') ? currentTrackFilters.activities : currentTrackFilters.categories;
    
    if (checkbox.checked) {
        filterSet.add(id);
    } else {
        filterSet.delete(id);
    }
}


// --- CRUD (Create) ---
function handleAddItemTypeChange() {
    // This function will show/hide relevant form fields in the add item modal
    // (e.g., hide "Target Hours" if type is "Deadline")
}
async function handleAddItem(e) {
    e.preventDefault();
    // This function will be large:
    // 1. Get all form data from add-item-modal
    // 2. Get the type ('activity', 'task', 'deadline')
    // 3. If 'activity', save to 'activities' collection
    // 4. If 'task' or 'deadline', save to 'plannerItems' collection
    // 5. Reload the respective local cache (activities or plannerItems)
    // 6. Re-render the track page and home page
    // 7. Hide the modal
    alert("Add item logic not implemented yet.");
}
async function handleAddActivity(e) { /* This function is now OBSOLETE, replaced by handleAddItem */ }

// --- CRUD (Update) ---
async function handleSaveEditActivity(e) {
    e.preventDefault(); if (!activityToEditId) return;
    // This function now only edits GOALS (activities)
    const newName = editActivityNameInput_Input.value.trim(); 
    const newColor = editActivityColorInput.value;
    const newEmoji = editActivityEmojiValue.value.trim() || '👉';
    const newCategory = editActivityCategoryInput.value.trim() || 'Uncategorized';
    const newGoal = {
        value: parseFloat(editActivityGoalValueInput.value) || 0,
        period: editActivityGoalPeriodInput.value || 'none'
    };
    
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
    };
    
    try {
        await activitiesCollection().doc(activityToEditId).set(updatedActivity, { merge: true }); 
        activities.set(activityToEditId, updatedActivity);
        // We no longer update associated logs on edit, too slow
        
        renderTrackPage(false); 
        populateAnalysisFilter(); 
        populateCategoryDatalist();
        if (pages.analysis.classList.contains('active')) {
            loadAnalysisData();
        }
        hideEditActivityModal();
         
    } catch (error) { 
        console.error("Error updating activity: ", error); 
        alert("Update failed."); 
    }
}


// --- CRUD (Delete) ---
function handleDeleteActivityFromModal() {
    if (activityToEditId) {
        logToDelete = { id: activityToEditId, type: 'activity' }; // 'activity' is a Goal
        showDeleteModal();
        hideEditActivityModal(); 
    }
}
async function handleConfirmDelete() {
    if (!logToDelete.id || !logToDelete.type || !userId) return;
    try {
        if (logToDelete.type === 'activity') {
            const deletedActivityId = logToDelete.id;
            await activitiesCollection().doc(deletedActivityId).delete();
            // Delete associated time logs
            await deleteLogsForActivity(deletedActivityId, 'activity');
            
            activities.delete(deletedActivityId); 
            
        } else if (logToDelete.type === 'plannerItem') {
            const deletedItemId = logToDelete.id;
            await plannerCollection().doc(deletedItemId).delete();
            // Delete associated time logs if it was a task
            await deleteLogsForActivity(deletedItemId, 'task');

            plannerItems.delete(deletedItemId);

        } else if (logToDelete.type === 'log') {
            const deletedLogId = logToDelete.id; 
            await timeLogsCollection().doc(deletedLogId).delete();
            
            analysisLogs = analysisLogs.filter(log => log.id !== deletedLogId);
            todaysLogs = todaysLogs.filter(log => log.id !== deletedLogId); 
            
            if (logDetailsModal.classList.contains('active')) {
                showLogDetailsModal(); // Refresh the list
            }
        } 
        
        // Refresh UI
        loadTodaysTimeLogs(); // Refreshes home page
        renderTrackPage(false); // Refreshes track page
        if(pages.analysis.classList.contains('active')) {
            loadAnalysisData(); // Refreshes analysis page
        }

    } catch (error) { 
        console.error("Error deleting item: ", error); 
        alert("Deletion failed."); 
    }
    finally { 
        hideDeleteModal(); 
    }
}
async function deleteLogsForActivity(activityId, timerType) {
    if (!userId) return;
    const query = timeLogsCollection()
        .where('activityId', '==', activityId)
        .where('timerType', '==', timerType);
        
    try {
        const snapshot = await query.get();
        const batch = db.batch(); 
        snapshot.forEach(doc => batch.delete(doc.ref)); 
        await batch.commit();
    } catch (error) { 
        console.error(`Batch delete logs for ${timerType} ${activityId} error: `, error); 
    }
}


// --- AI Summary ---
async function handleGenerateAISummary() {
    if (!userId) return;

    generateAiSummaryBtn.disabled = true;
    generateAiSummaryBtn.textContent = "Generating...";
    aiSummaryContent.style.display = 'none';

    try {
        // 1. Fetch logs for the last 7 days
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

        // 2. Process logs into a simple text format
        let logSummary = "Activity Log (Last 7 Days):\n";
        let dayLogs = new Map();

        snapshot.forEach(doc => {
            const log = doc.data();
            const date = new Date(log.startTime).toLocaleDateString('en-CA');
            const activityName = log.timerType === 'task' ? `Task: ${log.activityName}` : log.activityName;
            
            if (!dayLogs.has(date)) dayLogs.set(date, new Map());
            let dateMap = dayLogs.get(date);
            
            let currentDuration = dateMap.get(activityName) || 0;
            dateMap.set(activityName, currentDuration + log.durationMs);
        });

        dayLogs.forEach((dateMap, date) => {
            logSummary += `Date: ${date}\n`;
            dateMap.forEach((durationMs, activityName) => {
                logSummary += `- ${activityName}: ${formatShortDuration(durationMs)}\n`;
            });
        });

        // 3. Call Gemini API
        const systemPrompt = "You are a friendly and encouraging productivity coach. Analyze the user's time tracking log for the past week. Provide a concise, 2-3 sentence summary. Be encouraging, point out one positive trend, and gently suggest one area for potential improvement. Do not use markdown or bullet points, just a simple paragraph.";
        const userQuery = logSummary;

        const responseText = await callGeminiAPI(systemPrompt, userQuery);

        // 4. Display response
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
        systemInstruction: {
            parts: [{ text: systemPrompt }]
        },
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
        if (response.status === 429 && retries > 0) { // Throttling
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

// ... (All other existing functions: hideModals, flip clock, analysis page, etc.)
// ... (The file is complete now)


// --- Analysis Page ---
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
async function loadAnalysisData() {
    if (!userId) return; 
    const { startDate, endDate } = getAnalysisDateRange();
    
    try {
        const snapshot = await timeLogsCollection().where('startTime', '>=', startDate.getTime()).where('startTime', '<=', endDate.getTime()).orderBy('startTime', 'desc').get();
        analysisLogs = []; 
        snapshot.forEach(doc => {
            analysisLogs.push({ ...doc.data(), id: doc.id }); 
        });
        
        const activityTotals = calculateActivityTotals(analysisLogs);
        renderAnalysisRanking(activityTotals); 
        renderAnalysisVisuals(analysisLogs, activityTotals); 
    
    } catch (error) { console.error("Error loading analysis data: ", error); }
}
function calculateActivityTotals(logs) {
    const activityTotals = new Map();
    logs.forEach(log => {
        // NEW: Add "Task: " prefix if it's a task log
        const name = log.timerType === 'task' 
            ? `Task: ${log.activityName}` 
            : activities.get(log.activityId)?.name || log.activityName || 'Unknown';
        
        const color = log.timerType === 'task'
            ? '#808080' // Default grey for all tasks
            : activities.get(log.activityId)?.color || log.activityColor || '#808080';
        
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
     if (maxTime <= 0) return; 

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
function renderAnalysisVisuals(rawLogs, activityTotals) {
     if (barChartInstance) { barChartInstance.destroy(); barChartInstance = null; }
     if (pieChartInstance) { pieChartInstance.destroy(); pieChartInstance = null; }
     
     // NEW: Filter out 'task' logs from charts
     const activityLogs = rawLogs.filter(log => log.timerType === 'activity');

     switch (currentAnalysisView) {
        case 'daily':
            break;
        case 'weekly':
            renderWeeklyChart(activityLogs);
            break;
        case 'monthly':
            renderMonthlyHeatmap(activityLogs); 
            break;
     }
}
function renderWeeklyChart(activityLogs) {
    const selectedActivityId = analysisActivityFilter.value;
    const selectedActivityName = analysisActivityFilter.options[analysisActivityFilter.selectedIndex].text;

    const filteredLogs = selectedActivityId === 'all' 
        ? activityLogs 
        : activityLogs.filter(log => log.activityId === selectedActivityId);

    barChartTitle.textContent = selectedActivityId === 'all' ? 'Weekly Breakdown (Activities)' : `Weekly: ${selectedActivityName}`;
    
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

    let firstDayIndex = firstDayOfMonth.getDay();
    firstDayIndex = (firstDayIndex === 0) ? 6 : (firstDayIndex - 1); 

    for (let i = 0; i < firstDayIndex; i++) {
        heatmapGrid.innerHTML += '<div class="heatmap-day-padding"></div>';
    }

    for (let i = 1; i <= numDaysInMonth; i++) {
        const hours = hoursByDay.get(i) || 0;
        const level = getHeatmapLevel(hours);
        
        const dateStr = new Date(startDate.getFullYear(), startDate.getMonth(), i).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
        const title = `${dateStr}: ${hours.toFixed(1)} hours${selectedActivityId === 'all' ? '' : ` (${selectedActivityName})`}`;
        
        heatmapGrid.innerHTML += `<div class="heatmap-day" data-level="${level}" title="${title}"></div>`;
    }
}
function getHeatmapLevel(hours) {
    if (hours <= 0) return 0;
    if (hours < 1) return 1;
    if (hours < 3) return 2;
    if (hours < 5) return 3;
    return 4;
}
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

            const isTask = log.timerType === 'task';
            const activityName = isTask ? `Task: ${log.activityName}` : (activities.get(log.activityId)?.name || log.activityName);
            const activityColor = isTask ? 'var(--text-primary)' : (activities.get(log.activityId)?.color || log.activityColor || 'var(--text-primary)');

            const logHtml = `
                <div class="bg-gray-50 p-3 rounded-lg flex justify-between items-center log-item-pop" style="animation-delay: ${index * 50}ms">
                    <div>
                        <p class="font-semibold" style="color: ${activityColor}">${activityName}</p> 
                        <p class="text-sm">${startStr} - ${endStr} (${formatShortDuration(log.durationMs)})</p> 
                        ${log.notes ? `<p class="text-xs italic mt-1" style="color: var(--text-muted);">${log.notes}</p>` : ''} 
                    </div>
                    <div class="flex space-x-2">
                        <button class="btn-edit-log p-2 text-gray-500 hover:text-blue-600" data-id="${log.id}">
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
    if (editBtn) {
        showEditLogModal(editBtn.dataset.id);
        hideLogDetailsModal(); 
    } else if (deleteBtn) {
        logToDelete = { id: deleteBtn.dataset.id, type: 'log' };
        showDeleteModal();
    }
}
function showDeleteModal() {
     let text = "Are you sure?";
     if (logToDelete.type === 'activity') { text = "Delete activity? All associated logs will be removed."; }
     else if (logToDelete.type === 'log') { text = "Delete this time log?"; }
     else if (logToDelete.type === 'plannerItem') { text = "Delete this item? All associated task logs will also be removed."; }
     deleteModalText.textContent = text; deleteModal.classList.add('active');
}
function hideDeleteModal() { deleteModal.classList.remove('active'); logToDelete = { id: null, type: null }; }
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
     const timeLog = { activityId:actId, activityName:actName, activityColor:actColor, startTime: startMs, endTime: endMs, durationMs: durMs, notes: notes, timerType: 'activity' };
     try {
         const docRef = await timeLogsCollection().add(timeLog);
         const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
         if (startMs >= todayStart.getTime()) {
             todaysLogs.push({ ...timeLog, id: docRef.id });
         }
         renderHomePage(); 
         renderTrackPage(false);
         if(pages.analysis.classList.contains('active')) {
            loadAnalysisData();
         }
         hideManualEntryModal();
     } catch (error) { console.error("Error saving manual entry: ", error); alert("Save failed."); }
}
function showEditLogModal(logId) {
     let log = analysisLogs.find(l => l.id === logId);
     if (!log) { 
         log = todaysLogs.find(l => l.id === logId); 
     }
     if (!log) {
         alert("Cannot find log to edit."); return; 
     } 
     logToEditId = log.id;
     const startD = new Date(log.startTime); const endD = new Date(log.endTime);
     editActivityNameInput.value = log.activityName;
     editDateInput.value = `${startD.getFullYear()}-${String(startD.getMonth() + 1).padStart(2, '0')}-${String(startD.getDate()).padStart(2, '0')}`;
     editStartTimeInput.value = `${String(startD.getHours()).padStart(2, '0')}:${String(startD.getMinutes()).padStart(2, '0')}`;
     editEndTimeInput.value = `${String(endD.getHours()).padStart(2, '0')}:${String(endD.getMinutes()).padStart(2, '0')}`;
     editNotesInput.value = log.notes || ""; 
     
     // Disable editing if it's a task log, as that would break duration sync
     const isTask = log.timerType === 'task';
     editDateInput.disabled = isTask;
     editStartTimeInput.disabled = isTask;
     editEndTimeInput.disabled = isTask;
     if(isTask) {
         alert("Editing time for a 'Task' is not allowed. Delete this log and create a new one. You can edit the notes.");
     }
     
     editLogModal.classList.add('active');
}
function hideEditLogModal() { editLogModal.classList.remove('active'); logToEditId = null; }
async function handleSaveEditLog(e) {
     e.preventDefault(); if (!logToEditId || !userId) return;
     
     const notes = editNotesInput.value.trim();
     let updatedData = { notes: notes };
     
     const log = analysisLogs.find(l => l.id === logToEditId) || todaysLogs.find(l => l.id === logToEditId);
     const isTask = log.timerType === 'task';
     
     if(!isTask) {
         const date = editDateInput.value; const startTime = editStartTimeInput.value; const endTime = editEndTimeInput.value; 
         const startDT = new Date(`${date}T${startTime}`); const endDT = new Date(`${date}T${endTime}`);
         if (endDT <= startDT) { alert("End time must be after start."); return; }
         const startMs = startDT.getTime(); const endMs = endDT.getTime(); const durMs = endMs - startMs;
         updatedData = { ...updatedData, startTime: startMs, endTime: endMs, durationMs: durMs };
     }
     
     try {
         await timeLogsCollection().doc(logToEditId).update(updatedData);
         hideEditLogModal(); 
         loadAnalysisData(); 
         loadTodaysTimeLogs(); 
     } catch (error) { console.error("Error updating log: ", error); alert("Update failed."); }
}
function showEditActivityModal(activityId) {
    const activity = activities.get(activityId); if (!activity) return;
    activityToEditId = activity.id;
    editActivityNameInput_Input.value = activity.name; 
    editActivityColorInput.value = activity.color;
    editActivityEmojiBtn.textContent = activity.emoji || '👉';
    editActivityEmojiValue.value = activity.emoji || '👉';
    
    editActivityCategoryInput.value = activity.category || '';
    const goal = activity.goal || { value: 0, period: 'none' };
    editActivityGoalValueInput.value = goal.value || 0;
    editActivityGoalPeriodInput.value = goal.period || 'none';
    editActivityPinToggle.checked = false; // Deprecated
    
    editActivityModal.classList.add('active');
}
function hideEditActivityModal() { 
    editActivityModal.classList.remove('active'); 
    activityToEditId = null; 
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
     
     // 3. Track Page List
     const runningItem = trackContentArea.querySelector(`.track-item-action-box button.action-stop[data-id="${currentTimer.activityId}"]`);
     if(runningItem) {
         runningItem.querySelector('.timer').textContent = timeString.substring(0, 5);
     }

     // 4. Flip Clock (if active)
     if (flipClockPage.classList.contains('active')) {
        updateFlipClock(timeString);
     }
}
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
function exportToCSV() {
    if (analysisLogs.length === 0) {
        alert("No data to export for this period.");
        return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    const headers = ["Item Type", "Name", "Category", "Notes", "Date", "Start Time", "End Time", "Duration (Hours)"];
    csvContent += headers.join(",") + "\r\n";

    const sortedLogs = [...analysisLogs].sort((a, b) => a.startTime - b.startTime);

    sortedLogs.forEach(log => {
        const isTask = log.timerType === 'task';
        const itemType = isTask ? 'Task' : 'Activity';
        const activity = activities.get(log.activityId);
        const activityName = log.activityName;
        const category = isTask ? 'Task' : (activity?.category || 'Uncategorized');
        const notes = log.notes || "";
        const start = new Date(log.startTime);
        const end = new Date(log.endTime);
        
        const date = start.toLocaleDateString('en-CA'); 
        const startTime = start.toLocaleTimeString('en-GB'); 
        const endTime = end.toLocaleTimeString('en-GB'); 
        const durationHours = (log.durationMs / 3600000).toFixed(4);

        const row = [
            itemType,
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
