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
let plannerItems = new Map(); // NEW
let todaysLogs = [];
// globalSettings is removed
let currentAnalysisView = 'daily'; 
let currentAnalysisDate = new Date(); 
let barChartInstance = null;
let pieChartInstance = null;
let analysisLogs = [];
let logToEditId = null;
let logToDelete = { id: null, type: null };
let activityToEditId = null;
let draggedItemElement = null;
let previousTimeString = "00:00:00"; 
let currentEmojiInputTarget = null;
let stopTimerCompletion = null; 
let selectedGoalView = 'weekly'; 
let currentPeriodLogTotals = new Map(); 

// --- Element References ---
const mainApp = document.getElementById('main-app');
// UPDATED: Page references
const pages = {
    home: document.getElementById('home-page'),
    track: document.getElementById('track-page'), 
    planner: document.getElementById('planner-page'), // NEW
    analysis: document.getElementById('analysis-page'),
    settings: document.getElementById('settings-page')
};
const navButtons = document.querySelectorAll('.nav-btn');
const activityListEl = document.getElementById('activity-list');
const addActivityForm = document.getElementById('add-activity-form'); 
const newActivityNameInput = document.getElementById('new-activity-name');
const newActivityColorInput = document.getElementById('new-activity-color');
const newActivityEmojiBtn = document.getElementById('new-activity-emoji'); 
const newActivityEmojiValue = document.getElementById('new-activity-emoji-value');
const newActivityCategoryInput = document.getElementById('new-activity-category'); 
const addActivityBtn = document.getElementById('add-activity-btn');
const categoryDatalist = document.getElementById('category-list-datalist'); // NEW
const categoryFilter = document.getElementById('category-filter'); // NEW

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
const homeTimerLabel = document.getElementById('home-timer-label'); // NEW
const homeTimerActivityName = document.getElementById('home-timer-activity-name'); 
const homeTimerTime = document.getElementById('home-timer-time'); 
const homeTimerStopBtn = document.getElementById('home-timer-stop-btn'); 
const generateAiSummaryBtn = document.getElementById('generate-ai-summary-btn'); 
const aiSummaryContent = document.getElementById('ai-summary-content'); 
const homeAgendaList = document.getElementById('home-agenda-list'); // NEW
const homeTasksList = document.getElementById('home-tasks-list'); // NEW
const homeDailyGoalsList = document.getElementById('home-daily-goals-list'); // NEW
// Removed daily goal circle refs

// Track page refs
const goalViewToggle = document.getElementById('goal-view-toggle'); 

// Planner Page Refs (NEW)
const plannerTabContainer = document.getElementById('planner-tab-container');
const plannerSubpageTasks = document.getElementById('planner-subpage-tasks');
const plannerSubpageGoals = document.getElementById('planner-subpage-goals');
const addPlannerItemForm = document.getElementById('add-planner-item-form');
const plannerItemType = document.getElementById('planner-item-type');
const plannerItemNameInput = document.getElementById('planner-item-name');
const plannerItemDueDateInput = document.getElementById('planner-item-due-date');
const plannerTargetHoursGroup = document.getElementById('planner-target-hours-group');
const plannerItemTargetHoursInput = document.getElementById('planner-item-target-hours');
const addPlannerItemBtn = document.getElementById('add-planner-item-btn');
const plannerListOverdue = document.getElementById('planner-list-overdue');
const plannerListToday = document.getElementById('planner-list-today');
const plannerListUpcoming = document.getElementById('planner-list-upcoming');
const plannerListCompleted = document.getElementById('planner-list-completed');
const plannerRecurringGoalsList = document.getElementById('planner-recurring-goals-list');
const plannerItemListContainer = document.getElementById('planner-item-list-container'); // NEW

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
const showManualEntryBtn = document.getElementById('show-manual-entry-btn');
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
const editActivityCategoryInput = document.getElementById('edit-activity-category'); 
const editActivityGoalValueInput = document.getElementById('edit-activity-goal-value'); 
const editActivityGoalPeriodInput = document.getElementById('edit-activity-goal-period'); 
const editActivityPinToggle = document.getElementById('edit-activity-pin');

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

// --- App Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    loadThemePreference(); 
    loadFontSizePreference();
    setupEventListeners();
    authenticateUser(); 
    setDefaultAnalysisDate();
    setFlipClock("00:00:00"); 
    populateEmojiPicker();
    // NEW: Set default goal view toggle
    document.querySelector(`#goal-view-toggle .tab-btn[data-period="${selectedGoalView}"]`).classList.add('active');
});

function setupEventListeners() {
    navButtons.forEach(btn => btn.addEventListener('click', () => showPage(btn.dataset.page)));
    addActivityForm.addEventListener('submit', handleAddActivity); 
    activityListEl.addEventListener('click', handleActivityListClick);
    
    // Settings Listeners
    themeToggleBtnSettings.addEventListener('click', toggleTheme); 
    fontSizeSlider.addEventListener('input', handleFontSizeChange);
    signInBtn.addEventListener('click', signInWithGoogle);
    signOutBtn.addEventListener('click', signOut);
    // Removed global settings form listener

    // Home Listeners
    homeTimerStopBtn.addEventListener('click', stopTimer); 
    generateAiSummaryBtn.addEventListener('click', handleGenerateAISummary); 
    homeTasksList.addEventListener('click', handleHomeTaskListClick); // NEW

    // Track Listeners
    goalViewToggle.addEventListener('click', handleGoalViewToggle); 
    categoryFilter.addEventListener('change', () => renderActivityList()); // NEW

    // Planner Listeners (NEW)
    plannerTabContainer.addEventListener('click', handlePlannerTabClick);
    addPlannerItemForm.addEventListener('submit', handleAddPlannerItem);
    plannerItemType.addEventListener('change', toggleTargetHours);
    plannerItemListContainer.addEventListener('click', handlePlannerListClick);

    // Analysis Listeners
    exportCsvBtn.addEventListener('click', exportToCSV);

    // Edit Activity Listeners
    cancelEditActivityBtn.addEventListener('click', hideEditActivityModal);
    editActivityForm.addEventListener('submit', handleSaveEditActivity);
    deleteActivityFromModalBtn.addEventListener('click', handleDeleteActivityFromModal); 
    
    timerBanner.addEventListener('click', (e) => {
        if (!e.target.closest('#banner-stop-btn')) { 
            if (currentTimer) {
                showFlipClock(); 
            }
        }
    });

    bannerStopBtn.addEventListener('click', stopTimer); 
    flipClockBackBtn.addEventListener('click', hideFlipClock);
    
    // Modal Listeners
    cancelDeleteBtn.addEventListener('click', hideDeleteModal);
    confirmDeleteBtn.addEventListener('click', handleConfirmDelete);
    
    stopNoteForm.addEventListener('submit', handleSaveStopNote);
    skipStopNoteBtn.addEventListener('click', handleSaveStopNote);
    addClickOutsideListener(stopNoteModal, handleSaveStopNote);
    
    cancelManualEntryBtn.addEventListener('click', hideManualEntryModal);
    manualEntryForm.addEventListener('submit', handleSaveManualEntry);
    showManualEntryBtn.addEventListener('click', showManualEntryModal); 
    
    cancelEditLogBtn.addEventListener('click', hideEditLogModal);
    editLogForm.addEventListener('submit', handleSaveEditLog);
    
    addClickOutsideListener(deleteModal, hideDeleteModal);
    addClickOutsideListener(manualEntryModal, hideManualEntryModal);
    addClickOutsideListener(editLogModal, hideEditLogModal);
    addClickOutsideListener(editActivityModal, hideEditActivityModal);
    addClickOutsideListener(logDetailsModal, hideLogDetailsModal);
    addClickOutsideListener(emojiModal, hideEmojiPicker);
    
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

    newActivityEmojiBtn.addEventListener('click', () => showEmojiPicker(newActivityEmojiBtn, newActivityEmojiValue));
    editActivityEmojiBtn.addEventListener('click', () => showEmojiPicker(editActivityEmojiBtn, editActivityEmojiValue));
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
function setDefaultAnalysisDate() {
    currentAnalysisDate = new Date(); 
    currentAnalysisDate.setHours(0,0,0,0);
    analysisDateInput.value = getTodayString(); 
    manualDateInput.value = getTodayString(); 
    plannerItemDueDateInput.value = getTodayString(); // NEW
}

// --- Auth & Data Loading (UPDATED) ---
const activitiesCollection = () => db.collection('users').doc(userId).collection('activities');
const timeLogsCollection = () => db.collection('users').doc(userId).collection('timeLogs');
const plannerCollection = () => db.collection('users').doc(userId).collection('plannerItems'); // NEW

function authenticateUser() {
    googleProvider = new firebase.auth.GoogleAuthProvider();
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            userId = user.uid;
            signInBtn.style.display = 'none';
            signOutBtn.style.display = 'block';
            userInfo.style.display = 'block';
            userEmail.textContent = user.email;

            // Load user data
            // Removed loadGlobalSettings()
            checkTimerRecovery(); 
            await loadActivities(false); 
            await loadPlannerItems(); // NEW
            await loadTodaysTimeLogs(); // This will also call renderActivityList
            
            // Render current page
            if (pages.home.classList.contains('active')) {
                renderHomePage(); 
            }
            if (pages.planner.classList.contains('active')) {
                renderPlannerPage();
            }
            
            // Conditionally load analysis if page is active
            if (pages.analysis.classList.contains('active')) {
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

// Removed loadGlobalSettings() and handleSaveSettings()

function clearAllUserData() {
    if (currentTimer) stopTimer(); 
    activities.clear();
    plannerItems.clear(); // NEW
    todaysLogs = [];
    analysisLogs = [];
    currentPeriodLogTotals.clear();
    // Removed globalSettings reset
    
    activityListEl.innerHTML = `<p class="text-center text-muted p-4">Please sign in to track your time.</p>`;
    rankingList.innerHTML = `<p class="text-center text-muted">Please sign in.</p>`;
    if (barChartInstance) barChartInstance.destroy();
    if (pieChartInstance) pieChartInstance.destroy();
    
    const barCtx = barChartCanvas.getContext('2d');
    const pieCtx = pieChartCanvas.getContext('2d');
    barCtx.clearRect(0, 0, barChartCanvas.width, barChartCanvas.height);
    pieCtx.clearRect(0, 0, pieChartCanvas.width, pieChartCanvas.height);
    heatmapGrid.innerHTML = '';
    
    renderHomePage(); // Clear home page
    renderPlannerPage(); // NEW: Clear planner page
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
        if (activities.size > 0) renderActivityList(); 
        renderHomePage(); 
    }
}

// UPDATED: Show Page
function showPage(pageName) {
    Object.values(pages).forEach(p => p.classList.remove('active'));
    navButtons.forEach(btn => {
         const isActive = btn.dataset.page === pageName;
         btn.classList.toggle('active-nav', isActive); 
    });
    if (pages[pageName]) {
         pages[pageName].classList.add('active');
         // Load data if page is opened
         if (pageName === 'analysis') {
            if (analysisLogs.length === 0) { // Only load if not already loaded
                 setDefaultAnalysisDate(); 
                 setAnalysisView('daily'); 
            }
         }
         if (pageName === 'home') {
            renderHomePage(); // NEW
         }
         if (pageName === 'planner') {
             renderPlannerPage(); // NEW
         }
         if (pageName === 'track') {
            if (activities.size === 0) { // Only load if not already loaded
                loadActivities();
            } else {
                renderActivityList(); // Re-render in case goal view changed
            }
         }
    } else {
        console.error("Tried to navigate to non-existent page:", pageName);
    }
}

async function loadActivities(shouldRender = true) {
    if (!userId) return;
    try {
        const snapshot = await activitiesCollection().orderBy('order', 'asc').get(); 
        activities.clear();
        snapshot.forEach(doc => {
             const data = { ...doc.data(), id: doc.id };
             activities.set(doc.id, data);
         });
         if (shouldRender) {
            await renderActivityList(); 
         }
         // Removed renderQuickStart()
         populateAnalysisFilter(); 
         populateCategoryDatalist(); // NEW
         populateCategoryFilter(); // NEW
         setupDragAndDrop(activityListEl, activities, 'activity'); 
    } catch (error) { 
         console.error("Error loading activities: ", error);
    }
}

// NEW: Load Planner Items
async function loadPlannerItems() {
    if (!userId) return;
    try {
        const snapshot = await plannerCollection().orderBy('dueDate', 'asc').get();
        plannerItems.clear();
        snapshot.forEach(doc => {
            plannerItems.set(doc.id, { ...doc.data(), id: doc.id });
        });
        
        if (pages.planner.classList.contains('active')) {
            renderPlannerPage();
        }
        if (pages.home.classList.contains('active')) {
            renderHomePage();
        }
    } catch (error) {
        console.error("Error loading planner items: ", error);
    }
}

// --- NEW Home Page Rendering ---
function renderHomePage() {
    if (!userId) {
        // Clear home page if logged out
        homeAgendaList.innerHTML = `<p class="text-center text-muted text-sm w-full">Please sign in.</p>`;
        homeTasksList.innerHTML = `<p class="text-center text-muted text-sm w-full">Please sign in.</p>`;
        homeDailyGoalsList.innerHTML = `<p class="text-center text-muted text-sm w-full">Please sign in.</p>`;
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

    // 2. Render Home Agenda (Deadlines)
    homeAgendaList.innerHTML = '';
    const agendaItems = Array.from(plannerItems.values())
        .filter(item => item.type === 'deadline' && item.dueDate === todayString && !item.isCompleted)
        .sort((a, b) => a.name.localeCompare(b.name));

    if (agendaItems.length > 0) {
        agendaItems.forEach(item => {
            homeAgendaList.insertAdjacentHTML('beforeend', renderPlannerItem(item));
        });
    } else {
        homeAgendaList.innerHTML = `<p class="text-sm" style="color: var(--text-muted);">No deadlines due today.</p>`;
    }

    // 3. Render Home Tasks
    homeTasksList.innerHTML = '';
    const taskItems = Array.from(plannerItems.values())
        .filter(item => item.type === 'task' && item.dueDate === todayString && !item.isCompleted)
        .sort((a, b) => a.name.localeCompare(b.name));
    
    if (taskItems.length > 0) {
        taskItems.forEach(item => {
            homeTasksList.insertAdjacentHTML('beforeend', renderPlannerItem(item));
        });
    } else {
        homeTasksList.innerHTML = `<p class="text-sm" style="color: var(--text-muted);">No tasks scheduled for today.</p>`;
    }
    
    // 4. Render Home Daily Goals
    homeDailyGoalsList.innerHTML = '';
    const dailyGoals = Array.from(activities.values())
        .filter(act => act.goal && act.goal.period === 'daily' && act.goal.value > 0)
        .sort((a, b) => (a.order || 0) - (b.order || 0));

    if (dailyGoals.length > 0) {
        dailyGoals.forEach(activity => {
            const totalTodayMs = todaysLogs
                .filter(log => log.activityId === activity.id)
                .reduce((acc, log) => acc + log.durationMs, 0);
            
            homeDailyGoalsList.insertAdjacentHTML('beforeend', renderGoalItem(activity, totalTodayMs));
        });
    } else {
        homeDailyGoalsList.innerHTML = `<p class="text-sm" style="color: var(--text-muted);">No daily goals set. You can add them from the 'Track' page.</p>`;
    }
}

// NEW: Handle Home Task List Click (for starting timer)
function handleHomeTaskListClick(e) {
    const startBtn = e.target.closest('.btn-start-task');
    if (startBtn && !startBtn.disabled) {
        const itemEl = startBtn.closest('.planner-item');
        const id = itemEl.dataset.id;
        const item = plannerItems.get(id);
        if (item) {
            startTimer(item.id, item.name, '#808080', 'task'); // Use a generic color for tasks
        }
    } else if (e.target.closest('.planner-item-checkbox')) {
        // Handle checkbox click
        const itemEl = e.target.closest('.planner-item');
        handlePlannerItemCheck(itemEl.dataset.id, e.target.checked);
    } else if (e.target.closest('.btn-delete-item')) {
        // Handle delete click
        const itemEl = e.target.closest('.planner-item');
        handlePlannerItemDelete(itemEl.dataset.id);
    }
}

// --- NEW AI Summary Functions ---
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
            // Filter out task logs, only summarize activities
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

// Exponential backoff for API calls
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

// --- Track Page (Updated) ---

// Removed renderQuickStart() and handleQuickStartClick()

// NEW: Populate Category Datalist & Filter
function populateCategoryDatalist() {
    categoryDatalist.innerHTML = '';
    const categories = new Set(Array.from(activities.values()).map(a => a.category).filter(c => c && c !== 'Uncategorized'));
    categories.forEach(c => {
        categoryDatalist.innerHTML += `<option value="${c}">`;
    });
}

function populateCategoryFilter() {
    categoryFilter.innerHTML = '<option value="all">All Categories</option>';
    const categories = new Set(Array.from(activities.values()).map(a => a.category).filter(c => c));
    
    const sortedCategories = Array.from(categories).sort((a, b) => {
        if (a === 'Uncategorized') return 1;
        if (b === 'Uncategorized') return -1;
        return a.localeCompare(b);
    });

    sortedCategories.forEach(c => {
        categoryFilter.innerHTML += `<option value="${c}">${c}</option>`;
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

async function loadTodaysTimeLogs() {
    if (!userId) return;
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    try {
        const snapshot = await timeLogsCollection().where('startTime', '>=', todayStart.getTime()).get();
        todaysLogs = []; 
        snapshot.forEach(doc => { 
            todaysLogs.push({ ...doc.data(), id: doc.id }); 
        });

        patchActivitiesFromLogs(todaysLogs);
        await updateLogCache(selectedGoalView); 
        renderActivityList();
        renderHomePage(); 
    } catch (error) { console.error("Error loading today's logs: ", error); }
}
 
// NEW: Handle Goal View Toggle
async function handleGoalViewToggle(e) {
    const btn = e.target.closest('.tab-btn');
    if (btn && !btn.classList.contains('active')) {
        document.querySelectorAll('#goal-view-toggle .tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedGoalView = btn.dataset.period;
        
        // Reload cache and re-render list
        await updateLogCache(selectedGoalView);
        renderActivityList();
    }
}

// NEW: Get date range for a goal period
function getGoalDateRange(period) {
    const now = new Date();
    let startDate = new Date(now);
    startDate.setHours(0, 0, 0, 0);

    switch (period) {
        case 'daily':
            // Start date is already today at 00:00
            break;
        case 'weekly':
            const day = startDate.getDay();
            const diff = startDate.getDate() - day + (day === 0 ? -6 : 1); // Monday
            startDate.setDate(diff);
            break;
        case 'monthly':
            startDate.setDate(1);
            break;
        case 'yearly':
            startDate.setMonth(0, 1);
            break;
        default:
            // 'none' or invalid, return today's range
            break;
    }
    return startDate;
}

// NEW: Update log cache for the selected goal view
async function updateLogCache(period) {
    if (!userId) return;
    const startDate = getGoalDateRange(period);
    currentPeriodLogTotals.clear();

    try {
        const snapshot = await timeLogsCollection().where('startTime', '>=', startDate.getTime()).get();
        snapshot.forEach(doc => {
            const log = doc.data();
            // Only count activity logs towards activity goals
            if (log.timerType === 'task') return; 
            const current = currentPeriodLogTotals.get(log.activityId) || 0;
            currentPeriodLogTotals.set(log.activityId, current + log.durationMs);
        });
    } catch (error) {
        console.error(`Error loading logs for ${period} goals:`, error);
    }
}
 
// NEW: Render a single goal item (for Home and Planner)
function renderGoalItem(activity, trackedMs) {
    const goal = activity.goal;
    if (!goal || goal.period === 'none' || !goal.value) return '';

    let goalMs = goal.value * 3600000;
    const percentage = Math.min(100, (trackedMs / goalMs) * 100);
    const periodName = goal.period.charAt(0).toUpperCase() + goal.period.slice(1);
    
    return `
    <div class="p-4 rounded-lg shadow-md flex items-center justify-between item-list-item" style="padding-left: 1.5rem; border-left-color: ${activity.color};"> 
        <div class="flex items-center flex-grow min-w-0 mr-2" style="padding-left: 0;"> 
            <span class="text-2xl mr-3">${activity.emoji || '👉'}</span>
            <div class="min-w-0 flex-grow">
                <h3 class="text-lg font-semibold truncate" title="${activity.name}">${activity.name}</h3>
                <div class="goal-bar-bg">
                    <div class="goal-bar-fill" style="width: ${percentage}%; background-color: ${activity.color}"></div>
                </div>
                <p class="text-xs mt-1" style="color: var(--text-muted);">${formatShortDuration(trackedMs)} of ${goal.value}h ${periodName} goal (${percentage.toFixed(0)}%)</p>
            </div>
        </div>
    </div>`;
}

// UPDATED: renderActivityList to show Goals and Categories
async function renderActivityList(newItemId = null) {
    if (!userId) return; 
    activityListEl.innerHTML = '';
    
    // This is for "Today: Xh" text
    const todayTotals = new Map();
    todaysLogs.forEach(log => {
        // Only count activity logs
        if (log.timerType === 'task') return;
        const current = todayTotals.get(log.activityId) || 0;
        todayTotals.set(log.activityId, current + log.durationMs);
    });

    if (activities.size === 0) { 
        activityListEl.innerHTML = `<p class="text-center text-muted p-4">No activities yet. Add one above to start!</p>`; 
        return; 
    } 

    const selectedCategory = categoryFilter.value; // NEW

    // NEW: Group by category
    const activitiesByCategory = new Map();
    activities.forEach(activity => {
        // NEW: Filter by category
        if (selectedCategory !== 'all' && activity.category !== selectedCategory) {
            return;
        }
        const category = activity.category || 'Uncategorized';
        if (!activitiesByCategory.has(category)) {
            activitiesByCategory.set(category, []);
        }
        activitiesByCategory.get(category).push(activity);
    });

    // Sort categories (Uncategorized last)
    const sortedCategories = Array.from(activitiesByCategory.keys()).sort((a, b) => {
        if (a === 'Uncategorized') return 1;
        if (b === 'Uncategorized') return -1;
        return a.localeCompare(b);
    });

    if (sortedCategories.length === 0) {
        activityListEl.innerHTML = `<p class="text-center text-muted p-4">No activities found in this category.</p>`; 
        return;
    }

    // Loop through categories
    sortedCategories.forEach(category => {
        const headerHtml = `<h2 class="category-header">${category}</h2>`;
        activityListEl.insertAdjacentHTML('beforeend', headerHtml);
        
        const sortedActivities = activitiesByCategory.get(category).sort((a, b) => {
            const orderA = a.order ?? Infinity; 
            const orderB = b.order ?? Infinity;
            if (orderA !== orderB) return orderA - orderB;
            return a.name.localeCompare(b.name); 
        });

        // Loop through activities in this category
        sortedActivities.forEach(activity => {
            const id = activity.id; 
            const totalTodayMs = todayTotals.get(id) || 0;
            const isRunning = currentTimer && currentTimer.activityId === id && currentTimer.timerType === 'activity'; // UPDATED
            const timerActive = currentTimer !== null;
            const color = activity.color || '#3b82f6';
            const emoji = activity.emoji || '👉';
            
            const stopBtnHtml = `<button class="btn-stop p-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition" data-id="${id}" data-name="${activity.name}"><svg class="w-5 h-5 pointer-events-none" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clip-rule="evenodd"></path></svg></button>`;
            const startBtnHtml = `<button class="btn-start p-3 ${timerActive ? 'bg-gray-300' : 'bg-green-600 hover:bg-green-700'} text-white rounded-lg transition" data-id="${id}" data-name="${activity.name}" data-color="${color}" ${timerActive ? 'disabled style="background-color: var(--bg-button-secondary); color: var(--text-muted); cursor: not-allowed;"' : 'style="background-color: #10b981;"'}><svg class="w-5 h-5 pointer-events-none" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd"></path></svg></button>`;
            
            // NEW: Check for goal based on selectedGoalView
            let goalHtml = `<p class="text-sm">${"Today: " + formatShortDuration(totalTodayMs)}</p>`;
            const activityGoal = activity.goal || { value: 0, period: 'none' };
            
            if (activityGoal.period === selectedGoalView && activityGoal.value > 0) {
                const totalPeriodMs = currentPeriodLogTotals.get(id) || 0;
                let goalMs = activityGoal.value * 3600000;
                const percentage = Math.min(100, (totalPeriodMs / goalMs) * 100);
                const periodName = activityGoal.period.charAt(0).toUpperCase() + activityGoal.period.slice(1);
                goalHtml = `
                    <div class="goal-bar-bg">
                        <div class="goal-bar-fill" style="width: ${percentage}%; background-color: ${color}"></div>
                    </div>
                    <p class="text-xs mt-1" style="color: var(--text-muted);">${formatShortDuration(totalPeriodMs)} of ${activityGoal.value}h ${periodName} goal (${percentage.toFixed(0)}%)</p>
                `;
            }
            
            const fullItemHtml = `
            <div class="p-4 rounded-lg shadow-md flex items-center justify-between item-list-item" draggable="true" data-id="${id}" data-type="activity" style="padding-left: 1.5rem;"> 
                
                <div class="flex items-center flex-grow min-w-0 mr-2 btn-edit-activity cursor-pointer" data-id="${id}" style="padding-left: 0;"> 
                    <span class="text-2xl mr-3">${emoji}</span>
                    <div class="min-w-0 flex-grow">
                        <h3 class="text-lg font-semibold truncate" title="${activity.name}">${activity.name}</h3>
                        ${goalHtml}
                    </div>
                </div>

                <div class="flex-shrink-0">
                    ${isRunning ? stopBtnHtml : startBtnHtml}
                </div>
            </div>`;
            activityListEl.insertAdjacentHTML('beforeend', fullItemHtml);
            const newItemEl = activityListEl.lastElementChild;

            if (newItemEl) {
                newItemEl.style.borderLeftColor = color; 
            }
            
            if (id === newItemId && newItemEl) {
                newItemEl.classList.add('new-item-pop');
                setTimeout(() => newItemEl.classList.remove('new-item-pop'), 300); 
            }
        });
    });
}
 
// --- Activity CRUD (UPDATED) ---
 async function handleAddActivity(e) {
     e.preventDefault();
     const name = newActivityNameInput.value.trim(); 
     const color = newActivityColorInput.value;
     const emoji = newActivityEmojiValue.value.trim() || '👉';
     const category = newActivityCategoryInput.value.trim() || 'Uncategorized'; 
     
     const isDuplicate = Array.from(activities.values()).some(activity => activity.name.toLowerCase() === name.toLowerCase());
     if (isDuplicate) {
        alert("An activity with this name already exists.");
        return; 
     }
     if (!name) { alert("Please enter activity name."); return; }
     if (!userId) { alert("Please sign in to add activities."); return; }

     const originalBtnText = addActivityBtn.textContent;
     addActivityBtn.textContent = "Saving...";
     addActivityBtn.disabled = true;

     const maxOrder = activities.size > 0 ? Math.max(...Array.from(activities.values()).map(a => a.order || 0)) : -1;
     
     const newActivity = { 
        name, 
        color, 
        emoji, 
        category, 
        order: maxOrder + 1, 
        goal: { value: 0, period: 'none' }, 
        isPinned: false 
    };
     
     try {
         const docRef = await activitiesCollection().add(newActivity);
         activities.set(docRef.id, { ...newActivity, id: docRef.id });
         renderActivityList(docRef.id); 
         populateAnalysisFilter(); 
         populateCategoryDatalist(); // NEW
         populateCategoryFilter(); // NEW
         newActivityNameInput.value = '';
         newActivityCategoryInput.value = ''; 
         newActivityEmojiBtn.textContent = '😀';
         newActivityEmojiValue.value = '😀';
         newActivityColorInput.value = '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
     } catch (error) { 
         console.error("Error adding activity: ", error); 
         alert("Failed to add activity."); 
     } finally {
         addActivityBtn.textContent = originalBtnText;
         addActivityBtn.disabled = false;
     }
}

function handleActivityListClick(e) {
     const startBtn = e.target.closest('.btn-start');
     const stopBtn = e.target.closest('.btn-stop');
     const editBtn = e.target.closest('.btn-edit-activity'); 

     if (startBtn && !startBtn.disabled) {
         startTimer(startBtn.dataset.id, startBtn.dataset.name, startBtn.dataset.color, 'activity'); // UPDATED
     } else if (stopBtn) {
         stopTimer();
     } else if (editBtn) { 
         activityToEditId = editBtn.dataset.id;
         showEditActivityModal();
     }
}

// UPDATED: Show Edit Activity Modal with new fields
 function showEditActivityModal() {
    const activity = activities.get(activityToEditId); if (!activity) return;
    editActivityNameInput_Input.value = activity.name; 
    editActivityColorInput.value = activity.color;
    editActivityEmojiBtn.textContent = activity.emoji || '👉';
    editActivityEmojiValue.value = activity.emoji || '👉';
    
    // Populate Category, Goal, Pin
    editActivityCategoryInput.value = activity.category || '';
    const goal = activity.goal || { value: 0, period: 'none' };
    editActivityGoalValueInput.value = goal.value || 0;
    editActivityGoalPeriodInput.value = goal.period || 'none';
    editActivityPinToggle.checked = activity.isPinned || false;
    
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

// UPDATED: Save Edit Activity with new fields
async function handleSaveEditActivity(e) {
    e.preventDefault(); if (!activityToEditId) return;
    const newName = editActivityNameInput_Input.value.trim(); 
    const newColor = editActivityColorInput.value;
    const newEmoji = editActivityEmojiValue.value.trim() || '👉';
    
    // Get Category, Goal, Pin
    const newCategory = editActivityCategoryInput.value.trim() || 'Uncategorized';
    const newGoal = {
        value: parseFloat(editActivityGoalValueInput.value) || 0,
        period: editActivityGoalPeriodInput.value || 'none'
    };
    const newIsPinned = editActivityPinToggle.checked;

    if (!newName) { alert("Name cannot be empty."); return; }
    
    const originalActivity = activities.get(activityToEditId);
    
    const newOrder = (originalActivity.order === Infinity || originalActivity.order === undefined)
        ? (activities.size > 0 ? Math.max(...Array.from(activities.values()).map(a => a.order || 0).filter(o => o !== Infinity)) + 1 : 0)
        : originalActivity.order;

    const updatedActivity = { 
        ...originalActivity, 
        name: newName, 
        color: newColor, 
        emoji: newEmoji, 
        order: newOrder, 
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
        
        renderActivityList(); 
        populateAnalysisFilter(); 
        populateCategoryDatalist(); // NEW
        populateCategoryFilter(); // NEW
        if (pages.analysis.classList.contains('active')) {
            loadAnalysisData();
        }
        if (pages.home.classList.contains('active')) {
            renderHomePage();
        }
        if (pages.planner.classList.contains('active')) {
            renderPlannerPage();
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
     // IMPORTANT: Only update logs that are NOT tasks
     const batchSize = 100; let query = timeLogsCollection().where('activityId', '==', activityId).where('timerType', '!=', 'task');
     try {
         let snapshot = await query.limit(batchSize).get();
         while (snapshot.size > 0) {
             const batch = db.batch(); snapshot.docs.forEach(doc => { batch.update(doc.ref, { activityName: newName, activityColor: newColor }); });
             await batch.commit(); if (snapshot.size < batchSize) break;
             const lastDoc = snapshot.docs[snapshot.size - 1]; snapshot = await query.startAfter(lastDoc).limit(batchSize).get();
         }
     } catch (error) { console.error("Batch update logs error: ", error); }
}

// --- Timer Logic (UPDATED) ---
function startTimer(activityId, activityName, activityColor, timerType = 'activity') { // UPDATED
     if (currentTimer) return;
     const now = Date.now();
     currentTimer = { activityId, activityName, activityColor, startTime: now, intervalId: null, timerType }; // UPDATED
     
     const savedTimer = { activityId, activityName, activityColor, startTime: now, userId: userId, timerType }; // UPDATED
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
     renderActivityList();
     renderHomePage(); 
     renderPlannerPage(); // NEW
}

async function stopTimer() {
     if (!currentTimer) return;
     const timerToStop = { ...currentTimer }; 
     currentTimer = null; 
     
     clearInterval(timerToStop.intervalId);
     localStorage.removeItem('activeTimer');
     
     timerBanner.classList.add('closing');
     timerBanner.classList.remove('active');

     renderActivityList(); 
     renderHomePage(); 
     renderPlannerPage(); // NEW

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
         timerType: timerToStop.timerType || 'activity' // UPDATED
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
             const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
             if (timeLog.startTime >= todayStart.getTime()) {
                 todaysLogs.push({ ...timeLog, id: docRef.id }); 
             }
             
             // NEW: Update task's tracked duration if it was a task timer
             if (timeLog.timerType === 'task') {
                const task = plannerItems.get(timeLog.activityId);
                if (task) {
                    const newDuration = (task.trackedDurationMs || 0) + timeLog.durationMs;
                    await plannerCollection().doc(timeLog.activityId).update({ trackedDurationMs: newDuration });
                    task.trackedDurationMs = newDuration; // Update local cache
                    renderPlannerPage(); // Re-render planner to show new time
                }
             } else {
                // Only update activity goal cache if it was an activity
                await updateLogCache(selectedGoalView); 
             }
             
             if (pages.analysis.classList.contains('active')) {
                loadAnalysisData();
             }
             renderActivityList(); // Re-render with new goal data
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

// NEW: Consolidated UI updater
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

     // 3. Flip Clock (if active)
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

// --- Log CRUD & Modals (UPDATED) ---
function showDeleteModal() {
     let text = "Are you sure?";
     if (logToDelete.type === 'activity') { text = "Delete activity? All associated logs will be removed."; }
     else if (logToDelete.type === 'log') { text = "Delete this time log?"; }
     else if (logToDelete.type === 'plannerItem') { text = "Delete this planner item?"; } // NEW
     deleteModalText.textContent = text; deleteModal.classList.add('active');
}
function hideDeleteModal() { deleteModal.classList.remove('active'); logToDelete = { id: null, type: null }; }

async function handleConfirmDelete() {
    if (!logToDelete.id || !logToDelete.type || !userId) return;
    try {
        if (logToDelete.type === 'activity') {
            const deletedActivityId = logToDelete.id;
            await activitiesCollection().doc(deletedActivityId).delete();
            
            const logsSnapshot = await timeLogsCollection().where('activityId', '==', deletedActivityId).get();
            const batch = db.batch(); 
            logsSnapshot.forEach(doc => batch.delete(doc.ref)); 
            await batch.commit();
            
            activities.delete(deletedActivityId); 
            todaysLogs = todaysLogs.filter(log => log.activityId !== deletedActivityId);
            analysisLogs = analysisLogs.filter(log => log.activityId !== deletedActivityId);
            
            renderActivityList(); 
            populateAnalysisFilter(); 
            populateCategoryDatalist();
            populateCategoryFilter();
            
            const activityTotals = calculateActivityTotals(analysisLogs);
            renderAnalysisRanking(activityTotals); 
            
            if(logDetailsModal.classList.contains('active')) {
                showLogDetailsModal(); 
            }
            renderHomePage();
            renderPlannerPage();
        
        } else if (logToDelete.type === 'log') {
            const deletedLogId = logToDelete.id; 
            await timeLogsCollection().doc(deletedLogId).delete();
            
            analysisLogs = analysisLogs.filter(log => log.id !== deletedLogId);
            todaysLogs = todaysLogs.filter(log => log.id !== deletedLogId); 
            
            const logElementToRemove = logDetailsList.querySelector(`.btn-delete-log[data-id="${deletedLogId}"]`)?.closest('div.bg-gray-50');
            if (logElementToRemove) {
                logElementToRemove.remove();
            }
            if (logDetailsList.children.length === 0) {
                 logDetailsList.innerHTML = `<p class="text-center text-muted">No logs for this period.</p>`;
            }
            loadAnalysisData();
            loadTodaysTimeLogs(); 
        
        // NEW: Handle Planner Item Deletion
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
                    console.log(`Deleted ${logsSnapshot.size} associated task logs.`);
                }
            }
            
            renderPlannerPage();
            renderHomePage();
        } 
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
     // Only show activities in manual entry
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
         const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
         if (startMs >= todayStart.getTime()) {
             todaysLogs.push({ ...timeLog, id: docRef.id });
         }
         await updateLogCache(selectedGoalView); 
         renderActivityList(); 
         renderHomePage(); 
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
     
     // Find the original item name (could be activity or task)
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
     
     // Disable fields if it's a task, for now
     const isTask = log.timerType === 'task';
     editDateInput.disabled = isTask;
     editStartTimeInput.disabled = isTask;
     editEndTimeInput.disabled = isTask;
     
     editLogModal.classList.add('active');
}
function hideEditLogModal() { editLogModal.classList.remove('active'); logToEditId = null; }
async function handleSaveEditLog(e) {
     e.preventDefault(); if (!logToEditId || !userId) return;
     
     const originalLog = analysisLogs.find(l => l.id === logToEditId) || todaysLogs.find(l => l.id === logToEditId);
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
         hideEditLogModal(); 
         loadAnalysisData(); 
         loadTodaysTimeLogs(); 
     } catch (error) { console.error("Error updating log: ", error); alert("Update failed."); }
}

// --- Analysis Page (UPDATED) ---
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
        if (log.timerType === 'task') return; // Don't patch from task logs
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
    
    try {
        const snapshot = await timeLogsCollection().where('startTime', '>=', startDate.getTime()).where('startTime', '<=', endDate.getTime()).orderBy('startTime', 'desc').get();
        analysisLogs = []; 
        snapshot.forEach(doc => {
            analysisLogs.push({ ...doc.data(), id: doc.id }); 
        });
        
        const newActivities = patchActivitiesFromLogs(analysisLogs);
        if (newActivities) {
            populateAnalysisFilter();
        }

        const activityTotals = calculateActivityTotals(analysisLogs);
        renderAnalysisRanking(activityTotals); 
        renderAnalysisVisuals(analysisLogs, activityTotals); 
    
    } catch (error) { console.error("Error loading analysis data: ", error); }
}

function calculateActivityTotals(logs) {
    const activityTotals = new Map();
    logs.forEach(log => {
        let color, name;

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

function renderAnalysisVisuals(rawLogs, activityTotals) {
     if (barChartInstance) { barChartInstance.destroy(); barChartInstance = null; }
     if (pieChartInstance) { pieChartInstance.destroy(); pieChartInstance = null; }
     
     // Filter out tasks from chart views
     const activityLogs = rawLogs.filter(log => log.timerType !== 'task');

     switch (currentAnalysisView) {
        case 'daily':
            // No charts, just ranking
            break;
        case 'weekly':
            renderWeeklyChart(activityLogs, barChartCanvas.getContext('2d'));
            break;
        case 'monthly':
            renderMonthlyHeatmap(activityLogs); 
            break;
     }
}

function renderWeeklyChart(activityLogs, barCtx) { // UPDATED: only receives activityLogs
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

function renderMonthlyHeatmap(activityLogs) { // UPDATED: only receives activityLogs
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

// --- Log Details Modal ---
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
                activityColor = 'var(--text-secondary)'; // Tasks are neutral color
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

// --- NEW PLANNER FUNCTIONS ---
function handlePlannerTabClick(e) {
    const btn = e.target.closest('.tab-btn');
    if (btn && !btn.classList.contains('active')) {
        document.querySelectorAll('#planner-tab-container .tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        const subpage = btn.dataset.subpage;
        if (subpage === 'tasks') {
            plannerSubpageTasks.classList.add('active');
            plannerSubpageGoals.classList.remove('active');
        } else {
            plannerSubpageTasks.classList.remove('active');
            plannerSubpageGoals.classList.add('active');
        }
    }
}

function toggleTargetHours() {
    if (plannerItemType.value === 'task') {
        plannerTargetHoursGroup.style.display = 'block';
    } else {
        plannerTargetHoursGroup.style.display = 'none';
    }
}

async function handleAddPlannerItem(e) {
    e.preventDefault();
    if (!userId) return;

    const name = plannerItemNameInput.value.trim();
    const type = plannerItemType.value;
    const dueDate = plannerItemDueDateInput.value;
    const targetHours = parseFloat(plannerItemTargetHoursInput.value) || 0;

    if (!name || !dueDate) {
        alert("Please provide a name and due date.");
        return;
    }

    const newItem = {
        name,
        type, // 'task' or 'deadline'
        dueDate,
        targetHours: type === 'task' ? targetHours : 0,
        trackedDurationMs: 0,
        isCompleted: false,
        createdAt: Date.now()
    };

    addPlannerItemBtn.disabled = true;
    addPlannerItemBtn.textContent = 'Saving...';

    try {
        const docRef = await plannerCollection().add(newItem);
        plannerItems.set(docRef.id, { ...newItem, id: docRef.id });
        renderPlannerPage();
        
        // Reset form
        plannerItemNameInput.value = '';
        plannerItemDueDateInput.value = getTodayString();
        plannerItemTargetHoursInput.value = '';
    } catch (error) {
        console.error("Error adding planner item: ", error);
        alert("Failed to save item.");
    } finally {
        addPlannerItemBtn.disabled = false;
        addPlannerItemBtn.textContent = 'Add to Planner';
    }
}

function handlePlannerListClick(e) {
    const checkBtn = e.target.closest('.planner-item-checkbox');
    const deleteBtn = e.target.closest('.btn-delete-item');
    const startBtn = e.target.closest('.btn-start-task');

    if (checkBtn) {
        const id = checkBtn.closest('.planner-item').dataset.id;
        handlePlannerItemCheck(id, checkBtn.checked);
    } else if (deleteBtn) {
        const id = deleteBtn.closest('.planner-item').dataset.id;
        handlePlannerItemDelete(id);
    } else if (startBtn && !startBtn.disabled) {
        const id = startBtn.closest('.planner-item').dataset.id;
        const item = plannerItems.get(id);
        if (item) {
            startTimer(item.id, item.name, '#808080', 'task'); // Use a generic color for tasks
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
        renderPlannerPage();
        renderHomePage();
    } catch (error) {
        console.error("Error updating planner item: ", error);
        alert("Failed to update item.");
    }
}

async function handlePlannerItemDelete(id) {
    logToDelete = { id, type: 'plannerItem' };
    showDeleteModal();
}

function renderPlannerPage() {
    if (!userId) {
        plannerListOverdue.innerHTML = `<p class="text-sm" style="color: var(--text-muted);">Please sign in.</p>`;
        plannerListToday.innerHTML = '';
        plannerListUpcoming.innerHTML = '';
        plannerListCompleted.innerHTML = '';
        plannerRecurringGoalsList.innerHTML = `<p class="text-sm" style="color: var(--text-muted);">Please sign in.</p>`;
        return;
    }

    // --- Render Tasks & Deadlines Tab ---
    plannerListOverdue.innerHTML = '';
    plannerListToday.innerHTML = '';
    plannerListUpcoming.innerHTML = '';
    plannerListCompleted.innerHTML = '';

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayString = getTodayString();

    const sortedItems = Array.from(plannerItems.values()).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    
    let overdueCount = 0, todayCount = 0, upcomingCount = 0, completedCount = 0;

    sortedItems.forEach(item => {
        const itemHtml = renderPlannerItem(item);
        if (item.isCompleted) {
            plannerListCompleted.insertAdjacentHTML('beforeend', itemHtml);
            completedCount++;
        } else {
            const dueDate = new Date(item.dueDate + 'T00:00:00');
            if (dueDate < today) {
                plannerListOverdue.insertAdjacentHTML('beforeend', itemHtml);
                overdueCount++;
            } else if (item.dueDate === todayString) {
                plannerListToday.insertAdjacentHTML('beforeend', itemHtml);
                todayCount++;
            } else {
                plannerListUpcoming.insertAdjacentHTML('beforeend', itemHtml);
                upcomingCount++;
            }
        }
    });

    if (overdueCount === 0) plannerListOverdue.innerHTML = `<p class="text-sm" style="color: var(--text-muted);">Nothing overdue.</p>`;
    if (todayCount === 0) plannerListToday.innerHTML = `<p class="text-sm" style="color: var(--text-muted);">Nothing scheduled for today.</p>`;
    if (upcomingCount === 0) plannerListUpcoming.innerHTML = `<p class="text-sm" style="color: var(--text-muted);">No upcoming items.</p>`;
    if (completedCount === 0) plannerListCompleted.innerHTML = `<p class="text-sm" style="color: var(--text-muted);">No completed items.</p>`;

    // --- Render Recurring Goals Tab ---
    plannerRecurringGoalsList.innerHTML = '';
    const recurringGoals = Array.from(activities.values())
        .filter(act => act.goal && act.goal.period !== 'none' && act.goal.value > 0)
        .sort((a, b) => (a.order || 0) - (b.order || 0));
    
    if (recurringGoals.length > 0) {
        recurringGoals.forEach(activity => {
            const trackedMs = currentPeriodLogTotals.get(activity.id) || 0;
            plannerRecurringGoalsList.insertAdjacentHTML('beforeend', renderGoalItem(activity, trackedMs));
        });
    } else {
        plannerRecurringGoalsList.innerHTML = `<p class="text-sm" style="color: var(--text-muted);">No recurring goals set.</p>`;
    }
}

// NEW: Render a single planner item
function renderPlannerItem(item) {
    const isTask = item.type === 'task';
    const isRunning = currentTimer && currentTimer.activityId === item.id;
    const timerActive = currentTimer !== null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(item.dueDate + 'T00:00:00');
    const isOverdue = dueDate < today && !item.isCompleted;

    let subtext = '';
    if (isTask) {
        const tracked = item.trackedDurationMs || 0;
        if (item.targetHours > 0) {
            const targetMs = item.targetHours * 3600000;
            const percentage = Math.min(100, (tracked / targetMs) * 100).toFixed(0);
            subtext = `${formatShortDuration(tracked)} / ${item.targetHours}h (${percentage}%)`;
        } else {
            subtext = `${formatShortDuration(tracked)} tracked`;
        }
    }

    return `
    <div class="planner-item ${item.isCompleted ? 'completed' : ''}" data-id="${item.id}">
        <input type="checkbox" class="planner-item-checkbox" ${item.isCompleted ? 'checked' : ''}>
        <div class="planner-item-name-wrapper">
            <p class="planner-item-name">${item.name}</p>
            ${subtext ? `<p class="planner-item-subtext">${subtext}</p>` : ''}
        </div>
        <span class="planner-item-due-date ${isOverdue ? 'overdue' : ''}">${isOverdue ? 'Overdue' : item.dueDate}</span>
        <div class="planner-item-actions">
            ${isTask && !item.isCompleted ? `
                <button class="btn-start-task p-2" ${timerActive ? 'disabled' : ''} title="Start Timer">
                    <svg class="w-6 h-6 pointer-events-none" fill="currentColor" viewBox="0 0 20 20">${isRunning ? 
                        `<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clip-rule="evenodd"></path>` : 
                        `<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd"></path>`
                    }</svg>
                </button>
            ` : ''}
            <button class="btn-delete-item p-2" title="Delete Item">
                <svg class="w-6 h-6 pointer-events-none" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clip-rule="evenodd"></path></svg>
            </button>
        </div>
    </div>
    `;
}

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

// --- Drag & Drop (UPDATED) ---
function setupDragAndDrop(listElement, dataMap, itemType) { 
    listElement.addEventListener('dragstart', (e) => {
        if (e.target.closest('button') || !e.target.classList.contains('item-list-item')) { e.preventDefault(); return; }
        draggedItemElement = e.target;
        setTimeout(() => e.target.classList.add('dragging'), 0); 
    });
    listElement.addEventListener('dragend', (e) => {
        if (draggedItemElement) {
            draggedItemElement.classList.remove('dragging');
            draggedItemElement = null;
            saveOrder(dataMap, itemType); 
        }
    });
    listElement.addEventListener('dragover', (e) => {
        e.preventDefault(); 
        const draggingElement = document.querySelector('.dragging');
        if (!draggingElement) return;

        // NEW: Drag over category header
        const overElement = e.target;
        if (overElement.classList.contains('category-header')) {
            // Find the first item *after* this header
            let nextElement = overElement.nextElementSibling;
            while(nextElement && nextElement.classList.contains('category-header')) {
                nextElement = nextElement.nextElementSibling;
            }
            // Insert before the first item in that category
            if (nextElement) {
                listElement.insertBefore(draggingElement, nextElement);
            } else {
                // If category is empty, just append
                listElement.appendChild(draggingElement);
            }
        } else {
            // Original logic
            const afterElement = getDragAfterElement(listElement, e.clientY);
            if (afterElement == null) listElement.appendChild(draggingElement);
            else listElement.insertBefore(draggingElement, afterElement);
        }
    });
    listElement.addEventListener('drop', (e) => {
         e.preventDefault(); 
         reorderLocalArrayAndCategory(listElement, dataMap, itemType); // UPDATED
    });
}
function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.item-list-item:not(.dragging)')];
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) return { offset: offset, element: child };
        else return closest;
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}
// UPDATED: Reorder and assign new category
 function reorderLocalArrayAndCategory(listElement, dataMap, itemType) { 
    if (itemType !== 'activity') return;
    
    const itemElements = [...listElement.querySelectorAll('.item-list-item, .category-header')];
    const newMap = new Map();
    let currentCategory = 'Uncategorized';
    let orderIndex = 0;

    itemElements.forEach(el => {
        if (el.classList.contains('category-header')) {
            currentCategory = el.textContent;
        } else if (el.classList.contains('item-list-item')) {
            const id = el.dataset.id;
            const item = dataMap.get(id);
            if (item) {
                item.order = orderIndex++;
                item.category = currentCategory; // Assign new category
                newMap.set(id, item);
            }
        }
    });

    // Ensure any items not in the list (shouldn't happen) are re-added
    dataMap.forEach((item, id) => {
        if (!newMap.has(id)) {
            item.order = orderIndex++;
            newMap.set(id, item);
        }
    });
    
    activities = newMap; 
}
async function saveOrder(dataMap, itemType) { 
    if (!userId || itemType !== 'activity') return; 
    const collection = activitiesCollection();
    const batch = db.batch();
    Array.from(dataMap.values()).forEach((item) => {
        if (item.id && typeof item.order === 'number') { 
             // UPDATED: Save order and category
             batch.update(collection.doc(item.id), { 
                order: item.order,
                category: item.category || 'Uncategorized'
             });
         } else { console.error("Item missing ID or order:", item); }
    }); 
    try { 
        await batch.commit(); 
        console.log(`${itemType} order and categories saved.`); 
        // Re-render to be safe, though drop does it locally
        renderActivityList();
        populateCategoryDatalist();
        populateCategoryFilter();
    } 
    catch (error) { console.error(`Error saving ${itemType} order:`, error); }
}

// --- Export to CSV (No Changes) ---
function exportToCSV() {
    if (analysisLogs.length === 0) {
        alert("No data to export for this period.");
        return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    // NEW: Added Category
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

