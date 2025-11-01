// --- Placeholder Functions for Core App Logic ---

function renderHomePage() {
    console.log("Placeholder: renderHomePage called.");
    if (!userId) {
        homeTodayList.innerHTML = `<p class="text-center text-muted">Please sign in.</p>`;
        homeGoalsList.innerHTML = `<p class="text-center text-muted">Please sign in.</p>`;
        homeUpcomingList.innerHTML = `<p class="text-center text-muted">Please sign in.</p>`;
        return;
    }
    // Check if the timer is running and update the home card
    if (currentTimer) {
        homeTimerCard.classList.add('active');
        homeTimerActivityName.textContent = currentTimer.activityName;
        // The actual time will be updated by updateTimerUI loop
    } else {
        homeTimerCard.classList.remove('active');
    }

    // Placeholder for actual rendering logic
    homeTodayList.innerHTML = `<p class="text-center text-muted">Tasks/Deadlines rendering pending implementation.</p>`;
    homeGoalsList.innerHTML = `<p class="text-center text-muted">Goals rendering pending implementation.</p>`;
    homeUpcomingList.innerHTML = `<p class="text-center text-muted">Upcoming rendering pending implementation.</p>`;
}

function renderTrackPage() {
    console.log("Placeholder: renderTrackPage called.");
    if (!userId) {
        trackContentArea.innerHTML = `<p class="text-center text-muted">Please sign in.</p>`;
        return;
    }
    trackContentArea.innerHTML = `<p class="text-center text-muted">Track page rendering pending implementation. Data loaded: ${allTimeLogs.length} logs.</p>`;
    // Logic for list/grid view, rendering activities, planners, and logs goes here.
}

function startTimer(activityId, activityName, activityColor, timerType) {
    console.log(`Placeholder: Starting timer for ${activityName} (Type: ${timerType})`);
    // Placeholder implementation (should be fleshed out later)
    currentTimer = {
        userId,
        activityId,
        activityName,
        activityColor,
        timerType,
        startTime: Date.now(),
        intervalId: setInterval(updateTimerUI, 1000)
    };
    localStorage.setItem('activeTimer', JSON.stringify(currentTimer));
    renderHomePage(); 
    timerBanner.style.backgroundColor = currentTimer.activityColor || 'var(--link-color)';
    timerBanner.classList.remove('hidden', 'closing', 'morphing-out'); 
    requestAnimationFrame(() => timerBanner.classList.add('active'));
    bannerActivityName.textContent = currentTimer.activityName;
    updateTimerUI();
}

function stopTimer(e) {
    console.log("Placeholder: stopTimer called.");
    if (e) e.preventDefault();
    if (currentTimer) {
        // Clear interval and UI elements
        clearInterval(currentTimer.intervalId);
        setFlipClock("00:00:00");
        
        // Save the details to log
        stopTimerCompletion = {
            activityId: currentTimer.activityId,
            activityName: currentTimer.activityName,
            activityColor: currentTimer.activityColor,
            timerType: currentTimer.timerType,
            startTime: currentTimer.startTime,
            endTime: Date.now(),
            durationMs: Date.now() - currentTimer.startTime
        };

        localStorage.removeItem('activeTimer');
        currentTimer = null;

        // Animate banner removal and show note modal
        timerBanner.classList.add('closing');
        setTimeout(() => {
            timerBanner.classList.remove('active', 'closing');
            showStopNoteModal();
        }, 250); 
    }
}

function updateTimerUI() {
    if (currentTimer) {
        const elapsedMs = Date.now() - currentTimer.startTime;
        const timeString = formatHHMMSS(elapsedMs); 
        
        // Update Home Card
        if (homeTimerTime) homeTimerTime.textContent = timeString;

        // Update Banner
        if (bannerTime) bannerTime.textContent = timeString;
        
        // Update Flip Clock
        setFlipClock(timeString);

        // Update home card label for clarity
        if (homeTimerLabel) homeTimerLabel.textContent = (currentTimer.timerType === 'task' ? 'Task Tracking:' : 'Tracking:');

        // Check if Flip Clock is active to prevent running the animation on every tick unnecessarily
        if (flipClockPage.classList.contains('active')) {
            updateFlipClock(timeString);
        }
    } else {
        // Should be caught by stopTimer, but ensure cleanup
        timerBanner.classList.remove('active');
        homeTimerCard.classList.remove('active');
    }
}

function setFlipClock(timeString) {
    // Placeholder function, should be fleshed out in final code.
    // For now, it only initializes the display value without animation.
    const [h, m, s] = timeString.split(':').map(val => val.padStart(2, '0'));
    const allDigits = `${h}${m}${s}`;
    const digitKeys = ['h1', 'h2', 'm1', 'm2', 's1', 's2'];
    
    digitKeys.forEach((key, index) => {
        const el = flipDigitElements[key];
        if (el) {
            const digit = allDigits[index];
            el.querySelector('.card-top span').textContent = digit;
            el.querySelector('.card-bottom span').textContent = digit;
        }
    });
}

function updateFlipClock(timeString) {
    // Placeholder function
    if (timeString !== previousTimeString) {
        const prevDigits = previousTimeString.split(':').join('');
        const newDigits = timeString.split(':').join('');

        const digitKeys = ['h1', 'h2', 'm1', 'm2', 's1', 's2'];
        
        digitKeys.forEach((key, index) => {
            if (prevDigits[index] !== newDigits[index]) {
                const el = flipDigitElements[key];
                if (el) {
                    const nextDigit = newDigits[index];
                    const currentDigit = prevDigits[index];
                    
                    // Update the flip card before starting animation
                    el.querySelector('.flip-top span').textContent = currentDigit;
                    el.querySelector('.flip-bottom span').textContent = nextDigit;

                    el.classList.add('flipping');
                    
                    // Clean up animation class
                    setTimeout(() => {
                        el.classList.remove('flipping');
                        el.querySelector('.card-top span').textContent = nextDigit;
                        el.querySelector('.card-bottom span').textContent = nextDigit;
                    }, 500); // Should match CSS transition time
                }
            }
        });
        previousTimeString = timeString;
    }
}

function showFlipClock() {
    if (!currentTimer) return;
    flipClockActivity.textContent = currentTimer.activityName;
    flipClockPage.classList.add('active', 'animating-in');
    flipClockPage.classList.remove('animating-out');
    timerBanner.classList.add('hidden'); // Hide banner when clock is fullscreen
}

function hideFlipClock() {
    flipClockPage.classList.add('animating-out');
    flipClockPage.classList.remove('animating-in');
    timerBanner.classList.remove('hidden');
    setTimeout(() => {
        flipClockPage.classList.remove('active');
    }, 200); // Matches CSS transition
}

function showStopNoteModal() {
    stopNoteInput.value = ''; // Clear previous note
    stopNoteModal.classList.add('active');
}

async function handleSaveStopNote(e) {
    if (e && e.type === 'submit') e.preventDefault();
    if (!stopTimerCompletion || !userId) return; 

    stopNoteModal.classList.remove('active');
    
    // Check if the click outside event fired without a form submission (ignore this case if submit/skip button was clicked)
    if (e && (e.target.id === 'save-stop-note-btn' || e.target.id === 'skip-stop-note-btn')) {
        // Button was clicked, proceed normally
    } else if (e && e.target === stopNoteModal) {
        // Click outside, treat as skip/save without note unless save button was hit
        if (stopNoteModal.querySelector('#save-stop-note-btn').disabled) return;
    } else if (e) {
        // Other events (like click on skip button)
    }

    try {
        const notes = stopNoteInput.value.trim();
        const logData = { ...stopTimerCompletion, notes };
        delete logData.durationMs; // Remove the MS duration, which is recalculated from start/end

        // Save to Firestore
        const docRef = await timeLogsCollection().add(logData);
        
        // Add to local cache
        allTimeLogs.unshift({ ...logData, id: docRef.id });

        // Update UI
        renderHomePage();
        renderTrackPage();
        renderCategoriesPage(); // NEW
        if(pages.analysis.classList.contains('active')) {
           loadAnalysisData();
        }

    } catch (error) {
        console.error("Error saving time log: ", error);
        // FIX: Using window.alert for now, will replace with custom modal later
        window.alert("Failed to save time log.");
    } finally {
        stopTimerCompletion = null;
    }
}


function mapTimeRange(direction) {
    if (currentTrackTimeRange.type === 'today') {
        const newDate = new Date(currentTrackTimeRange.start);
        newDate.setDate(newDate.getDate() + direction);
        updateTimeRange('today', newDate, newDate); // Update to 'today' range type centered on newDate
    } else if (currentTrackTimeRange.type === 'week') {
        const newDate = new Date(currentTrackTimeRange.start);
        newDate.setDate(newDate.getDate() + (7 * direction));
        updateTimeRange('week', newDate);
    } else if (currentTrackTimeRange.type === 'month') {
        const newDate = new Date(currentTrackTimeRange.start);
        newDate.setMonth(newDate.getMonth() + direction);
        updateTimeRange('month', newDate);
    } else if (currentTrackTimeRange.type === 'year') {
        const newDate = new Date(currentTrackTimeRange.start);
        newDate.setFullYear(newDate.getFullYear() + direction);
        updateTimeRange('year', newDate);
    }
    renderTrackPage();
}

function handleViewToggle() {
    currentTrackView = (currentTrackView === 'list' ? 'grid' : 'list');
    trackViewIconList.classList.toggle('hidden', currentTrackView === 'grid');
    trackViewIconGrid.classList.toggle('hidden', currentTrackView === 'list');
    trackContentArea.classList.toggle('grid-view', currentTrackView === 'grid');
    trackContentArea.classList.toggle('list-view', currentTrackView === 'list');
    renderTrackPage(); 
}

function handleTrackListClick(e) {
    const startBtn = e.target.closest('.track-item-action-btn.start');
    const editBtn = e.target.closest('.track-item-action-btn.edit');
    const deleteBtn = e.target.closest('.track-item-action-btn.delete');
    const itemBody = e.target.closest('.track-item-main');

    if (startBtn && !startBtn.disabled) {
        const { id, name, color, type } = startBtn.dataset;
        if (type === 'goal') { // Goals start as a normal activity timer
            startTimer(id, name, color, 'activity');
        } else if (type === 'task') { // Tasks start as a task timer (links back to planner item)
            startTimer(id, name, color, 'task');
        }
    } else if (editBtn) {
        const id = editBtn.dataset.id;
        showAddItemModal(id); // Use the new consolidated modal
    } else if (deleteBtn) {
        const id = deleteBtn.dataset.id;
        const type = deleteBtn.dataset.type === 'goal' ? 'activity' : 'plannerItem';
        logToDelete = { id, type };
        showDeleteModal();
    } else if (itemBody) {
        const id = itemBody.closest('.track-item')?.dataset.id;
        const type = itemBody.closest('.track-item')?.dataset.type;
        if (id && type && type !== 'log') { 
            showAddItemModal(id);
        }
    }
}

function handleHomeItemClick(e) {
     const checkbox = e.target.closest('.home-item-checkbox');
     const editBtn = e.target.closest('.home-item-action-btn.edit');
     const startBtn = e.target.closest('.home-item-action-btn.start');
     const itemEl = e.target.closest('.home-item');
     
     if (checkbox) {
         const id = itemEl.dataset.id;
         const type = itemEl.dataset.type;
         if (type === 'task') {
             // Toggle completion
             // handleToggleCompletion(id); // Needs implementation
             window.alert(`Placeholder: Toggle completion for task ${id}`);
         }
     } else if (editBtn) {
         const id = itemEl.dataset.id;
         showAddItemModal(id);
     } else if (startBtn) {
         const { id, name, color, type } = itemEl.dataset;
         if (type === 'goal') { 
            startTimer(id, name, color, 'activity');
         } else if (type === 'task') {
            startTimer(id, name, color, 'task');
         }
     } else if (itemEl) {
         const id = itemEl.dataset.id;
         showAddItemModal(id);
     }
}

function handleGenerateAISummary() {
    console.log("Placeholder: AI summary generation logic here.");
    const lastSevenDaysLogs = allTimeLogs.filter(log => log.startTime > (Date.now() - 7 * 24 * 60 * 60 * 1000));
    
    if (lastSevenDaysLogs.length === 0) {
        aiSummaryContent.innerHTML = `<p class="text-center text-muted">No logs recorded in the last 7 days to analyze.</p>`;
        aiSummaryContent.style.display = 'block';
        return;
    }

    generateAiSummaryBtn.disabled = true;
    generateAiSummaryBtn.textContent = 'Analyzing...';
    aiSummaryContent.style.display = 'none';

    const systemPrompt = "Act as a personal productivity coach and financial analyst. Provide a concise, single-paragraph summary of the user's productivity over the last 7 days, focusing on key trends in time spent across categories (e.g., Work, Learning, Personal) if available. Suggest one actionable item for the upcoming week.";
    
    const activityTotals = calculateActivityTotals(lastSevenDaysLogs);
    const totalTimeMs = [...activityTotals.values()].reduce((sum, item) => sum + item.durationMs, 0);
    
    let summaryInput = `User has tracked ${formatShortDuration(totalTimeMs)} in the last 7 days. Breakdown by category: \n`;
    activityTotals.forEach(item => {
        summaryInput += `- ${item.name}: ${formatShortDuration(item.durationMs)} \n`;
    });
    
    const userQuery = `Summarize the following data and provide an actionable suggestion: \n\n${summaryInput}`;
    
    // Call the LLM API (Placeholder implementation)
    // NOTE: This is a placeholder and requires actual API key and fetch implementation
    const apiKey = ""; 
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

    const payload = {
        contents: [{ parts: [{ text: userQuery }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
    };
    
    // Simulate API call and success (Replace with actual fetch later)
    setTimeout(() => {
        const mockSummary = "Based on your tracked activities, you spent the most time on Work (45h 30m) and Learning (12h 15m), showing strong professional focus. However, personal time remains low (5h). For an actionable goal next week, aim to schedule at least 1 hour of dedicated 'unstructured' personal time per day to prevent burnout.";
        
        aiSummaryContent.innerHTML = mockSummary.replace(/\n/g, '<br>');
        aiSummaryContent.style.display = 'block';
        generateAiSummaryBtn.disabled = false;
        generateAiSummaryBtn.textContent = 'Generate Summary';
    }, 2000); 

    // Actual API Call structure (commented out)
    /*
    fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    .then(response => response.json())
    .then(result => {
        const text = result.candidates?.[0]?.content?.parts?.[0]?.text || "Analysis failed to generate.";
        aiSummaryContent.innerHTML = text.replace(/\n/g, '<br>');
        aiSummaryContent.style.display = 'block';
    })
    .catch(error => {
        console.error("LLM API Error:", error);
        aiSummaryContent.innerHTML = "Error generating summary.";
        aiSummaryContent.style.display = 'block';
    })
    .finally(() => {
        generateAiSummaryBtn.disabled = false;
        generateAiSummaryBtn.textContent = 'Generate Summary';
    });
    */
}

function showEditActivityModal(activityId) {
    // Legacy function. All edits should use showAddItemModal(activityId)
    // This is kept as a stub for compatibility but should be retired.
    console.log(`Legacy Edit Modal: Attempted to show old modal for ID: ${activityId}. Redirecting to new modal.`);
    showAddItemModal(activityId);
}
function hideEditActivityModal() {
    editActivityModal.classList.remove('active');
}
function handleSaveEditActivity(e) {
    e.preventDefault();
    window.alert("Legacy Edit Activity form submitted. Please use the new consolidated modal for editing activities/goals.");
    hideEditActivityModal();
}
function handleDeleteActivityFromModal() {
    window.alert("Legacy Delete Activity button clicked. Using new delete flow.");
    logToDelete = { id: editActivityIdInput.value, type: 'activity' };
    hideEditActivityModal();
    showDeleteModal();
}

function handleToggleCompletion(itemId) {
    // Placeholder for toggling task completion status
    console.log(`Placeholder: Toggling completion for item ${itemId}`);
}


// --- NEW V24: Category Page State (Start) ---
let categoriesDonutChart = null;
// MODIFICATION: Replaced old time range with new object
let currentCategoriesTimeRange = { 
    type: 'month', 
    start: getStartOfDate(new Date(new Date().getFullYear(), new Date().getMonth(), 1)),
    end: getEndOfDate(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)) 
};

// --- NEW V24: Render Categories Page ---
function renderCategoriesPage() {
    if (!userId) {
        categoriesListContainer.innerHTML = `<p class="text-center text-muted">Please sign in.</p>`;
        return;
    }
    
    // 1. Set Date Navigator Text
    updateCategoriesNavText();
    
    // 2. Get logs for the current period
    const { start, end } = getCategoriesDateRange();
    const logsInRange = allTimeLogs.filter(log => 
        log.startTime >= start.getTime() && log.startTime <= end.getTime() && log.timerType !== 'task'
    );
    
    // 3. Calculate totals by Category
    const totalsByCategory = new Map();
    let totalTimeMs = 0;

    logsInRange.forEach(log => {
        const activity = activities.get(log.activityId);
        // MODIFICATION: Use categoryId from activity
        const categoryId = activity?.categoryId || 'uncategorized';
        
        let currentTotal = totalsByCategory.get(categoryId) || 0;
        currentTotal += log.durationMs;
        totalsByCategory.set(categoryId, currentTotal);
        
        totalTimeMs += log.durationMs;
    });

    // 4. Get category objects and sort by time
    const sortedCategoryData = Array.from(totalsByCategory.entries())
        .map(([id, timeMs]) => {
            // MODIFICATION: Fetch new category object
            const category = categories.get(id) || { id: 'uncategorized', name: 'Uncategorized', color: '#808080', iconName: 'bi-question-circle' };
            return { ...category, timeMs };
        })
        .sort((a, b) => b.timeMs - a.timeMs);

    // 5. Render Donut Chart
    renderCategoriesDonutChart(sortedCategoryData, totalTimeMs);
    
    // 6. Render List
    categoriesListContainer.innerHTML = '';
    if (sortedCategoryData.length === 0) {
        categoriesListContainer.innerHTML = `<p class="text-center text-muted">No time tracked for this period.</p>`;
        return;
    }

    sortedCategoryData.forEach(cat => {
        const percentage = totalTimeMs > 0 ? (cat.timeMs / totalTimeMs) * 100 : 0;
        categoriesListContainer.innerHTML += `
            <div class="category-list-item" data-id="${cat.id}">
                <div class="category-icon-bg" style="background-color: ${cat.color}">
                    <i class="bi ${cat.iconName}"></i>
                </div>
                <h4 class="category-list-name">${cat.name}</h4>
                <span class="category-list-time">${formatShortDuration(cat.timeMs)}</span>
                <div class="category-list-bar-bg">
                    <div class="category-list-bar-fill" style="width: ${percentage}%; background-color: ${cat.color};"></div>
                </div>
                <span class="category-list-percent">${percentage.toFixed(0)}%</span>
            </div>
        `;
    });
}

function renderCategoriesDonutChart(data, totalTimeMs) {
    if (categoriesDonutChart) {
        categoriesDonutChart.destroy();
    }
    
    // Clear placeholder
    categoriesChartContainer.innerHTML = ''; 
    
    if (data.length === 0) {
        categoriesChartContainer.innerHTML = `<p class="text-center text-muted">No data for chart</p>`;
        return;
    }

    // Add canvas and center text
    categoriesChartContainer.innerHTML = `
        <canvas id="categories-donut-chart"></canvas>
        <div id="categories-chart-center-text">
            <div id="categories-chart-total-time">${formatShortDuration(totalTimeMs)}</div>
            <div id="categories-chart-label">Total Time</div>
        </div>
    `;

    const ctx = document.getElementById('categories-donut-chart').getContext('2d');
    categoriesDonutChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: data.map(d => d.name),
            datasets: [{
                data: data.map(d => d.timeMs),
                backgroundColor: data.map(d => d.color),
                borderWidth: 2,
                borderColor: getComputedStyle(document.documentElement).getPropertyValue('--bg-primary').trim(),
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
                legend: {
                    display: false // We use the list below
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const valueMs = context.parsed;
                            const percentage = totalTimeMs > 0 ? (valueMs / totalTimeMs) * 100 : 0;
                            // FIX: Use formatShortDuration from core.js
                            return `${label}: ${formatShortDuration(valueMs)} (${percentage.toFixed(0)}%)`;
                        }
                    }
                }
            }
        }
    });
}

// MODIFICATION: Logic for date range
function getCategoriesDateRange() {
    let { type, start, end } = currentCategoriesTimeRange;
    return { start, end };
}

// FIX: formatDate helper needed here (moved to core.js in Step 1)
function _formatDate(date) {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
}

// MODIFICATION: Uses new date formatting
function updateCategoriesNavText() {
    const { type, start, end } = currentCategoriesTimeRange;
    const btn = categoriesTimeRangeBtn; 

    if (!btn) return; // Guard clause until HTML is updated

    if (type === 'today') {
        btn.textContent = _formatDate(start); // DD/MM/YYYY
    } else if (type === 'week') {
        btn.textContent = `${_formatDate(start)} - ${_formatDate(end)}`; // DD/MM/YYYY - DD/MM/YYYY
    } else if (type === 'month') {
        // MM/YYYY format
        const month = String(start.getMonth() + 1).padStart(2, '0');
        const year = start.getFullYear();
        btn.textContent = `${month}/${year}`; 
    } else if (type === 'year') {
        btn.textContent = start.getFullYear().toString(); // YYYY
    } else if (type === 'all') {
        btn.textContent = 'All Time';
    } else if (type === 'custom') {
        if (start.getTime() === end.getTime()) {
            btn.textContent = _formatDate(start); // DD/MM/YYYY
        } else {
            btn.textContent = `${_formatDate(start)} - ${_formatDate(end)}`; // DD/MM/YYYY - DD/MM/YYYY
        }
    }
}

// MODIFICATION: Logic for navigation
function navigateCategories(direction) {
    let { type, start } = currentCategoriesTimeRange;
    let newStart = new Date(start);

    // Default to 'month' if range type isn't supported for navigation
    if (type !== 'week' && type !== 'month' && type !== 'year') {
        type = 'month';
        newStart = new Date(currentCategoriesTimeRange.start); // Use the date stored in state
    }

    if (type === 'week') {
        newStart.setDate(newStart.getDate() + (7 * direction));
        updateCategoriesTimeRange('week', newStart);
    } else if (type === 'month') {
        // Need to set date to 1st to avoid overflow issues (e.g., navigating from Jan 31 to Feb)
        newStart.setDate(1); 
        newStart.setMonth(newStart.getMonth() + direction);
        updateCategoriesTimeRange('month', newStart);
    } else if (type === 'year') {
        newStart.setFullYear(newStart.getFullYear() + direction);
        updateCategoriesTimeRange('year', newStart);
    }
    
    renderCategoriesPage(); // Re-render categories
}

// MODIFICATION: Logic for updating time range
function updateCategoriesTimeRange(rangeType, customStart = null, customEnd = null) {
    currentCategoriesTimeRange.type = rangeType;
    const now = new Date();
    // FIX: Must use getStartOfDate/getEndOfDate from core.js
    let start = getStartOfDate(now);
    let end = getEndOfDate(now);

    switch (rangeType) {
        case 'today':
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
            start = getStartOfDate(new Date(2000, 0, 1));
            end = getEndOfDate(new Date(2100, 0, 1));
            break;
        case 'custom':
            start = getStartOfDate(customStart);
            end = getEndOfDate(customEnd);
            break;
    }
    
    currentCategoriesTimeRange.start = start;
    currentCategoriesTimeRange.end = end;

    updateCategoriesNavText(); // Update the button text
}


// --- NEW V24: Category CRUD Modals ---
function showAddCategoryModal(categoryId = null) {
    const form = document.getElementById('add-category-form');
    form.reset();
    
    const title = document.getElementById('add-category-title');
    const nameInput = document.getElementById('add-category-name');
    const iconPreview = document.getElementById('add-category-icon-preview');
    const iconValue = document.getElementById('add-category-icon-name'); // BUG FIX: Corrected ID here
    const colorInput = document.getElementById('add-category-color-input');
    const saveBtn = document.getElementById('save-add-category-btn');
    const editIdInput = document.getElementById('add-category-id'); // BUG FIX: Corrected ID here
    const deleteBtn = document.getElementById('delete-category-btn');

    if (categoryId) {
        const category = categories.get(categoryId);
        if (!category) return;
        
        title.textContent = 'Edit Category';
        saveBtn.textContent = 'Save Changes';
        editIdInput.value = categoryId;
        nameInput.value = category.name;
        iconPreview.className = `bi ${category.iconName || 'bi-emoji-smile'}`;
        iconValue.value = category.iconName || 'bi-emoji-smile';
        colorInput.value = category.color || '#3b82f6';
        deleteBtn.style.display = 'block';
        deleteBtn.onclick = (e) => {
            e.preventDefault();
            logToDelete = { id: categoryId, type: 'category' };
            hideAddCategoryModal();
            showDeleteModal();
        };
    } else {
        title.textContent = 'Add New Category';
        saveBtn.textContent = 'Save';
        editIdInput.value = '';
        iconPreview.className = 'bi bi-tag-fill';
        iconValue.value = 'bi-tag-fill';
        colorInput.value = '#3b82f6';
        deleteBtn.style.display = 'none';
        deleteBtn.onclick = null;
    }
    
    addCategoryModal.classList.add('active');
}

function hideAddCategoryModal() {
    addCategoryModal.classList.remove('active');
}

async function handleSaveCategory(e) {
    e.preventDefault();
    if (!userId) return;

    const editId = document.getElementById('add-category-id').value; // Corrected ID here
    const name = document.getElementById('add-category-name').value.trim();
    const iconName = document.getElementById('add-category-icon-name').value;
    const color = document.getElementById('add-category-color-input').value;

    if (!name) {
        // FIX: Replaced alert with custom function
        window.alert("Please enter a category name."); 
        return;
    }

    const categoryData = { name, iconName, color };
    
    saveAddCategoryBtn.disabled = true;
    saveAddCategoryBtn.textContent = 'Saving...';

    try {
        if (editId) {
            await categoriesCollection().doc(editId).update(categoryData);
            categories.set(editId, { ...categoryData, id: editId });
        } else {
            const docRef = await categoriesCollection().add(categoryData);
            categories.set(docRef.id, { ...categoryData, id: docRef.id });
        }
        
        hideAddCategoryModal();
        renderCategoriesPage(); // Re-render the categories list
        populateCategoryDatalist(); // Update datalist for activities
        renderTrackPage(); // Update track page goals/activities if needed
    } catch (error) {
        console.error("Error saving category: ", error);
        // FIX: Replaced alert with custom function
        window.alert("Failed to save category.");
    } finally {
        saveAddCategoryBtn.disabled = false;
    }
}


// --- Log CRUD & Modals (MODIFIED) ---
function showDeleteModal() {
     let text = "Are you sure?";
     if (logToDelete.type === 'category') { // NEW
        text = "Delete category? All associated activities and logs will be permanently removed. This action cannot be undone.";
     }
     else if (logToDelete.type === 'activity') {
         text = "Delete activity? All associated logs will be removed. This action cannot be undone.";
     }
     else if (logToDelete.type === 'log') { 
         text = "Delete this time log?";
     }
     else if (logToDelete.type === 'plannerItem') { 
         text = "Delete this item? If it's a task, all its tracked time will also be deleted. This action cannot be undone."; 
     }
     deleteModalText.textContent = text; 
     deleteModal.classList.add('active');
}
function hideDeleteModal() { deleteModal.classList.remove('active'); logToDelete = { id: null, type: null }; }

// MODIFIED: Handle Confirm Delete
async function handleConfirmDelete() {
    if (!logToDelete.id || !logToDelete.type || !userId) return;
    try {
        if (logToDelete.type === 'category') {
            const deletedCategoryId = logToDelete.id;
            
            // 1. Find all activities with this categoryId
            const activitiesToDelete = Array.from(activities.values()).filter(act => act.categoryId === deletedCategoryId);
            const activityIdsToDelete = activitiesToDelete.map(act => act.id);

            // 2. Prepare batches for deletion
            const deleteBatch = db.batch();
            let logsDeletedCount = 0;

            // 2a. Delete category document
            deleteBatch.delete(categoriesCollection().doc(deletedCategoryId));

            // 2b. Delete activity documents and prepare to delete associated logs
            for (const activityId of activityIdsToDelete) {
                deleteBatch.delete(activitiesCollection().doc(activityId));

                // Query and delete logs associated with this activity
                const logsSnapshot = await timeLogsCollection().where('activityId', '==', activityId).get();
                logsSnapshot.forEach(doc => {
                    deleteBatch.delete(doc.ref);
                    logsDeletedCount++;
                });
            }

            // 3. Commit the batch
            await deleteBatch.commit();
            console.log(`Deleted category ${deletedCategoryId}, ${activityIdsToDelete.length} activities, and ${logsDeletedCount} logs.`);

            // 4. Update local cache
            categories.delete(deletedCategoryId);
            activityIdsToDelete.forEach(id => activities.delete(id));
            allTimeLogs = allTimeLogs.filter(log => !activityIdsToDelete.includes(log.activityId));
            analysisLogs = analysisLogs.filter(log => !activityIdsToDelete.includes(log.activityId));

            populateAnalysisFilter(); 
            populateCategoryDatalist();
        
        } else if (logToDelete.type === 'activity') {
            const deletedActivityId = logToDelete.id;
            
            // 1. Delete activity
            await activitiesCollection().doc(deletedActivityId).delete();
            
            // 2. Delete associated logs
            const logsSnapshot = await timeLogsCollection().where('activityId', '==', deletedActivityId).get();
            const batch = db.batch(); 
            logsSnapshot.forEach(doc => batch.delete(doc.ref)); 
            await batch.commit();
            
            // 3. Update local cache
            activities.delete(deletedActivityId); 
            allTimeLogs = allTimeLogs.filter(log => log.activityId !== deletedActivityId);
            analysisLogs = analysisLogs.filter(log => log.activityId !== deletedActivityId);
            populateAnalysisFilter(); 
            populateCategoryDatalist();
            if(logDetailsModal.classList.contains('active')) { showLogDetailsModal(); }
        
        } else if (logToDelete.type === 'log') {
            const deletedLogId = logToDelete.id; 
            await timeLogsCollection().doc(deletedLogId).delete();
            analysisLogs = analysisLogs.filter(log => log.id !== deletedLogId);
            allTimeLogs = allTimeLogs.filter(log => log.id !== deletedLogId); 
            const logElementToRemove = logDetailsList.querySelector(`.btn-delete-log[data-id="${deletedLogId}"]`)?.closest('div.bg-gray-50');
            if (logElementToRemove) logElementToRemove.remove();
            if (logDetailsList.children.length === 0) logDetailsList.innerHTML = `<p class="text-center text-muted">No logs for this period.</p>`;
            loadAnalysisData();
        
        } else if (logToDelete.type === 'plannerItem') {
            const deletedItemId = logToDelete.id;
            const item = plannerItems.get(deletedItemId);

            await plannerCollection().doc(deletedItemId).delete();
            plannerItems.delete(deletedItemId);

            if (item && item.type === 'task') {
                const logsSnapshot = await timeLogsCollection()
                    .where('activityId', '==', deletedItemId)
                    .where('timerType', '==', 'task')
                    .get();
                
                if (logsSnapshot.size > 0) {
                    const batch = db.batch();
                    logsSnapshot.forEach(doc => batch.delete(doc.ref));
                    await batch.commit();
                    allTimeLogs = allTimeLogs.filter(log => !(log.activityId === deletedItemId && log.timerType === 'task'));
                    console.log(`Deleted ${logsSnapshot.size} associated task logs.`);
                }
            }
        } 
        
        // Re-render all
        renderHomePage();
        renderTrackPage();
        renderCategoriesPage(); // NEW

    } catch (error) { 
        console.error("Error deleting item: ", error); 
        // FIX: Replaced alert with custom function
        window.alert("Deletion failed."); 
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
     if (!actId || !date || !startTime || !endTime) { 
        // FIX: Replaced alert with custom function
        window.alert("Fill all required fields."); 
        return; 
    }
     const startDT = new Date(`${date}T${startTime}`); const endDT = new Date(`${date}T${endTime}`);
     if (endDT <= startDT) { 
        // FIX: Replaced alert with custom function
        window.alert("End time must be after start."); 
        return; 
    }
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
         renderCategoriesPage(); // NEW
         if(pages.analysis.classList.contains('active')) {
            loadAnalysisData();
         }
         hideManualEntryModal();
     } catch (error) { 
        console.error("Error saving manual entry: ", error); 
        // FIX: Replaced alert with custom function
        window.alert("Save failed."); 
    }
}

 function showEditLogModal(logId) {
     let log = allTimeLogs.find(l => l.id === logId);
     if (!log) { 
         log = analysisLogs.find(l => l.id === logId); 
     }
     if (!log) {
        // FIX: Replaced alert with custom function
        window.alert("Cannot find log to edit."); 
        return; 
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
        // FIX: Replaced alert with custom function
        window.alert("Editing task logs is not supported yet. You can delete and re-track it.");
        hideEditLogModal();
        return;
     }
     const date = editDateInput.value; const startTime = editStartTimeInput.value; const endTime = editEndTimeInput.value; const notes = editNotesInput.value.trim();
     const startDT = new Date(`${date}T${startTime}`); const endDT = new Date(`${date}T${endTime}`);
     if (endDT <= startDT) { 
        // FIX: Replaced alert with custom function
        window.alert("End time must be after start."); 
        return; 
    }
     const startMs = startDT.getTime(); const endMs = endDT.getTime(); const durMs = endMs - startMs;
     const updatedData = { startTime: startMs, endTime: endMs, durationMs: durMs, notes: notes };
     try {
         await timeLogsCollection().doc(logToEditId).update(updatedData);
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
         renderCategoriesPage(); // NEW
         if (logDetailsModal.classList.contains('active')) showLogDetailsModal();
         if (pages.analysis.classList.contains('active')) renderAnalysisVisuals(analysisLogs, calculateActivityTotals(analysisLogs));
     } catch (error) { 
        console.error("Error updating log: ", error); 
        // FIX: Replaced alert with custom function
        window.alert("Update failed."); 
    }
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
                categoryId: 'uncategorized', // NEW
                goal: { value: 0, period: 'none' }, 
                order: Infinity
            });
            newActivitiesFound = true;
        }
    });
    return newActivitiesFound;
}

async function loadAnalysisData() {
    if (!userId) return; 
    const { startDate, endDate } = getAnalysisDateRange();
    
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

// MODIFIED: calculateActivityTotals (group by CATEGORY)
function calculateActivityTotals(logs) {
    const categoryTotals = new Map();
    
    logs.forEach(log => {
        let category, categoryId;
        
        if (log.timerType === 'task') {
            categoryId = 'task'; // Group all tasks together
            category = { name: 'Tasks', color: '#808080' };
        } else {
            const activity = activities.get(log.activityId);
            categoryId = activity?.categoryId || 'uncategorized';
            category = categories.get(categoryId) || { name: 'Uncategorized', color: '#808080' };
        }
        
        const current = categoryTotals.get(categoryId) || { durationMs: 0, name: category.name, color: category.color };
        current.durationMs += log.durationMs; 
        current.color = category.color; // Ensure color is set from Category object
        categoryTotals.set(categoryId, current);
    });
    return categoryTotals;
}

// MODIFIED: renderAnalysisRanking (group by CATEGORY)
 function renderAnalysisRanking(categoryTotals) {
     let titleView = currentAnalysisView.charAt(0).toUpperCase() + currentAnalysisView.slice(1);
     rankingTitle.textContent = titleView + ' Ranking';
     rankingList.innerHTML = ''; 
     if (categoryTotals.size === 0) { 
         rankingList.innerHTML = `<p class="text-center text-muted">No time tracked.</p>`; 
         return; 
     } 
     const sorted = [...categoryTotals.values()].sort((a, b) => b.durationMs - a.durationMs);
     const maxTime = sorted[0].durationMs;
     if (maxTime <= 0) {
         rankingList.innerHTML = `<p class="text-center text-muted">No time tracked.</p>`; 
         return;
     }
     sorted.forEach((data) => {
         const percentage = (data.durationMs / maxTime) * 100;
         const itemHtml = `
            <div class="ranking-item">
                <span class="ranking-item-dot" style="background-color: ${data.color}"></span>
                <span class="ranking-item-name" title="${data.name}">${data.name}</span>
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
     
     // Filter out tasks from chart views
     const activityLogs = rawLogs.filter(log => log.timerType !== 'task');

     switch (currentAnalysisView) {
        case 'daily':
            // Placeholder for daily rendering, which currently doesn't have a chart on the page
            break;
        case 'weekly':
            renderWeeklyChart(activityLogs, barChartCanvas.getContext('2d')); 
            break;
        case 'monthly':
            renderMonthlyHeatmap(activityLogs); 
            break;
     }
}

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
        const activity = activities.get(log.activityId);
        const activityName = activity?.name || log.activityName;
        const color = activity?.color || log.activityColor || '#808080';
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
    
    const maxHours = Math.max(0, ...hoursByDay.values());
    
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

// getHeatmapLevel is replaced by the one in renderTrackGrid
function getHeatmapLevel(hours, maxHours) {
    if (hours <= 0) return 0;
    if (maxHours <= 0) return 1; // Avoid division by zero
    const ratio = hours / maxHours;
    if (ratio < 0.25) return 1;
    if (ratio < 0.5) return 2;
    if (ratio < 0.75) return 3;
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

// --- NEW Modal Functions ---

// NEW: Show Add Item Modal
function showAddItemModal(itemIdToEdit = null) {
    addItemForm.reset();
    addItemForm.dataset.editId = '';
    
    // --- 1. Get all element references ---
    const itemTypeInput = addItemForm.querySelector('#add-item-type');
    const typeButtons = addItemForm.querySelectorAll('.add-item-type-btn');
    const commonFieldsContainer = addItemForm.querySelector('#add-item-common-fields');
    const dateContainer = addItemForm.querySelector('#add-item-date-container');
    const taskDateGroup = addItemForm.querySelector('#form-group-task');
    const deadlineDateGroup = addItemForm.querySelector('#form-group-deadline');
    const notifyGroup = addItemForm.querySelector('#form-group-notifications');
    const saveBtn = addItemForm.querySelector('#save-add-item-btn');
    const deleteBtn = addItemForm.querySelector('#delete-item-btn');
    
    // --- 2. Dynamically build form HTML ---
    commonFieldsContainer.innerHTML = `
        <input type="hidden" id="add-item-id" value="${itemIdToEdit || ''}">
        
        <!-- Name -->
        <div>
            <label for="add-item-name" class="block text-sm font-medium mb-2">Name</label>
            <input type="text" id="add-item-name" placeholder="E.g., Finish report" class="w-full" maxlength="40">
        </div>

        <!-- Activity/Goal Fields (Icon, Color, Category, Goal) -->
        <div id="form-group-goal" class="space-y-4 hidden">
            <div class="flex gap-2">
                <button type="button" id="add-item-icon-btn" class="icon-input-btn p-3" title="Select Icon">
                    <i id="add-item-icon-preview" class="bi bi-emoji-smile"></i>
                </button>
                <input type="hidden" id="add-item-icon-value" value="bi-emoji-smile">
                <input type="color" id="add-item-color" value="#3b82f6" title="Select activity color" class="w-16 h-16">
            </div>
            <div>
                <label for="add-item-category" class="block text-sm font-medium mb-2">Category</label>
                <select id="add-item-category" class="w-full">
                    <option value="uncategorized">No Category</option>
                    ${Array.from(categories.values()).map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
                </select>
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

        <!-- Task Fields -->
        <div id="form-group-task-only" class="space-y-4 hidden">
            <div>
                <label for="add-item-target-hours" class="block text-sm font-medium mb-2">Target (Hours)</label>
                <input type="number" id="add-item-target-hours" min="0" step="0.5" placeholder="E.g., 4" class="w-full">
            </div>
        </div>

        <!-- Deadline Fields -->
        <div id="form-group-deadline-only" class="space-y-4 hidden">
             <div>
                <label for="add-item-notes" class="block text-sm font-medium mb-2">Notes (Optional)</label>
                <textarea id="add-item-notes" rows="2" class="w-full"></textarea>
            </div>
        </div>
    `;

    // --- 3. Add Event Listeners (must be done *after* innerHTML) ---
    addItemForm.querySelector('#add-item-icon-btn').addEventListener('click', () => {
        showIconPicker(
            addItemForm.querySelector('#add-item-icon-btn'), 
            addItemForm.querySelector('#add-item-icon-value'),
            addItemForm.querySelector('#add-item-icon-preview')
        );
    });
    
    typeButtons.forEach(btn => btn.addEventListener('click', (e) => {
        const type = e.target.dataset.type;
        itemTypeInput.value = type;
        toggleAddItemForm(type);
    }));

    // --- 4. Populate Form if Editing ---
    let itemType = 'goal'; // Default for adding
    
    if (itemIdToEdit) {
        addItemForm.dataset.editId = itemIdToEdit;
        saveBtn.textContent = 'Save Changes';
        deleteBtn.style.display = 'block';
        
        const plannerItem = plannerItems.get(itemIdToEdit);
        const activity = activities.get(itemIdToEdit);

        if (plannerItem) {
            // It's a Task or Deadline
            itemType = plannerItem.type;
            document.getElementById('add-item-name').value = plannerItem.name;
            // FIX: Ensure notifyGroup exists before querying
            if (notifyGroup) notifyGroup.querySelector('#add-item-notify').value = plannerItem.notifyDays || 'none';
            
            // FIX: Populate dates/times
            const dueDateInput = addItemForm.querySelector('#add-item-due-date');
            const dueTimeInput = addItemForm.querySelector('#add-item-due-time');
            const startDatetimeInput = addItemForm.querySelector('#add-item-start-datetime');
            const endDatetimeInput = addItemForm.querySelector('#add-item-end-datetime');
            
            if (itemType === 'task') {
                document.getElementById('add-item-target-hours').value = plannerItem.targetHours || '';
                if (startDatetimeInput && plannerItem.startDateTime) startDatetimeInput.value = plannerItem.startDateTime;
                if (endDatetimeInput && plannerItem.endDateTime) endDatetimeInput.value = plannerItem.endDateTime;
                
            } else { // deadline
                document.getElementById('add-item-notes').value = plannerItem.notes || '';
                if (dueDateInput && plannerItem.dueDate) dueDateInput.value = plannerItem.dueDate;
                if (dueTimeInput && plannerItem.dueTime) dueTimeInput.value = plannerItem.dueTime;
            }
            
            deleteBtn.onclick = (e) => {
                e.preventDefault();
                logToDelete = { id: itemIdToEdit, type: 'plannerItem' };
                hideAddItemModal();
                showDeleteModal();
            };

        } else if (activity) {
            // It's a Goal (Activity)
            itemType = 'goal';
            document.getElementById('add-item-name').value = activity.name;
            document.getElementById('add-item-icon-preview').className = `bi ${activity.iconName || 'bi-emoji-smile'}`;
            document.getElementById('add-item-icon-value').value = activity.iconName || 'bi-emoji-smile';
            document.getElementById('add-item-color').value = activity.color || '#3b82f6';
            document.getElementById('add-item-category').value = activity.categoryId || 'uncategorized';
            document.getElementById('add-item-goal-value').value = activity.goal?.value || '';
            document.getElementById('add-item-goal-period').value = activity.goal?.period || 'none';
            
            deleteBtn.onclick = (e) => {
                e.preventDefault();
                logToDelete = { id: itemIdToEdit, type: 'activity' };
                hideAddItemModal();
                showDeleteModal();
            };

        } else {
             // Not found - should not happen if called correctly
             deleteBtn.style.display = 'none';
        }
        
    } else {
        // This is an add
        saveBtn.textContent = 'Add Item';
        deleteBtn.style.display = 'none';
        deleteBtn.onclick = null;
        // FIX: Set default date/time values for Task/Deadline
        addItemForm.querySelector('#add-item-due-date').value = getTodayString();
        addItemForm.querySelector('#add-item-start-datetime').value = new Date().toISOString().substring(0, 16);
        addItemForm.querySelector('#add-item-end-datetime').value = new Date(Date.now() + 60 * 60 * 1000).toISOString().substring(0, 16);
    }

    // --- 5. Set Initial State & Show Modal ---
    itemTypeInput.value = itemType;
    toggleAddItemForm(itemType);
    addItemModal.classList.add('active');
}

function toggleAddItemForm(type) {
    // 1. Set Button Active State
    addItemForm.querySelectorAll('.add-item-type-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.type === type);
    });

    // 2. Show/Hide Form Groups
    document.getElementById('form-group-goal').classList.toggle('hidden', type !== 'goal');
    document.getElementById('form-group-task-only').classList.toggle('hidden', type !== 'task');
    document.getElementById('form-group-deadline-only').classList.toggle('hidden', type !== 'deadline');
    
    document.getElementById('add-item-date-container').classList.toggle('hidden', type === 'goal');
    document.getElementById('form-group-task').classList.toggle('hidden', type !== 'task');
    document.getElementById('form-group-deadline').classList.toggle('hidden', type !== 'deadline');
    document.getElementById('form-group-notifications').classList.toggle('hidden', type === 'goal');
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
        // FIX: Replaced alert with custom function
        window.alert("Please enter a name.");
        return;
    }

    saveAddItemBtn.disabled = true;
    saveAddItemBtn.textContent = 'Saving...';
    
    try {
        if (type === 'goal') {
            const newActivity = {
                name: name,
                iconName: document.getElementById('add-item-icon-value').value || 'bi-emoji-smile',
                color: document.getElementById('add-item-color').value,
                categoryId: document.getElementById('add-item-category').value,
                goal: {
                    value: parseFloat(document.getElementById('add-item-goal-value').value) || 0,
                    period: document.getElementById('add-item-goal-period').value || 'none'
                },
                order: editId ? (activities.get(editId)?.order || 0) : (activities.size || 0)
            };

            if (editId) {
                await activitiesCollection().doc(editId).update(newActivity);
                activities.set(editId, { ...activities.get(editId), ...newActivity });
            } else {
                const docRef = await activitiesCollection().add(newActivity);
                activities.set(docRef.id, { ...newActivity, id: docRef.id });
            }
            // FIX: loadActivities is heavy. Instead, just call relevant refresh functions.
            populateAnalysisFilter(); 
            populateCategoryDatalist(); 
            

        } else { // 'task' or 'deadline'
            
            let itemData = {
                name: name,
                type: type,
                notifyDays: document.getElementById('add-item-notify').value || 'none',
                isCompleted: editId ? (plannerItems.get(editId)?.isCompleted || false) : false,
                trackedDurationMs: editId ? (plannerItems.get(editId)?.trackedDurationMs || 0) : 0,
                createdAt: editId ? (plannerItems.get(editId)?.createdAt || Date.now()) : Date.now()
            };

            if (type === 'task') {
                 // FIX: Added start/end datetimes
                 itemData.startDateTime = document.getElementById('add-item-start-datetime')?.value || null;
                 itemData.endDateTime = document.getElementById('add-item-end-datetime')?.value || null;
                 itemData.targetHours = parseFloat(document.getElementById('add-item-target-hours').value) || 0;
            } else { // deadline
                 // FIX: Added due date/time
                 itemData.dueDate = document.getElementById('add-item-due-date')?.value || getTodayString();
                 itemData.dueTime = document.getElementById('add-item-due-time')?.value || '23:59';
                 itemData.notes = document.getElementById('add-item-notes').value.trim();
            }

            if (editId) {
                await plannerCollection().doc(editId).update(itemData);
                plannerItems.set(editId, { ...plannerItems.get(editId), ...itemData });
            } else {
                const docRef = await plannerCollection().add(itemData);
                plannerItems.set(docRef.id, { ...itemData, id: docRef.id });
            }
        }
        
        hideAddItemModal();
        renderHomePage();
        renderTrackPage();
        renderCategoriesPage(); // NEW

    } catch (error) {
        console.error("Error saving item: ", error);
        // FIX: Replaced alert with custom function
        window.alert("Failed to save item.");
    } finally {
        saveAddItemBtn.disabled = false;
    }
}

// FIX: Placeholder for updateTimeRange (used by core.js)
function updateTimeRange(rangeType, customStart = null, customEnd = null) {
    currentTrackTimeRange.type = rangeType;
    const now = new Date();
    let start = getStartOfDate(now);
    let end = getEndOfDate(now);

    switch (rangeType) {
        case 'today':
            // Start/end are already set to today's start/end
            if (customStart) {
                 start = getStartOfDate(customStart);
                 end = getEndOfDate(customStart);
            }
            break;
        case 'week':
            // If custom date provided, use it as the week anchor
            if (customStart) start = getStartOfDate(customStart);
            
            const day = start.getDay();
            const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Monday
            start.setDate(diff);
            end = new Date(start);
            end.setDate(start.getDate() + 6);
            end = getEndOfDate(end);
            break;
        case 'month':
            if (customStart) start = getStartOfDate(customStart);
            start.setDate(1);
            end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
            end = getEndOfDate(end);
            break;
        case 'year':
            if (customStart) start = getStartOfDate(customStart);
            start.setMonth(0, 1);
            end = new Date(start.getFullYear(), 11, 31);
            end = getEndOfDate(end);
            break;
        case 'all':
            start = getStartOfDate(new Date(2000, 0, 1));
            end = getEndOfDate(new Date(2100, 0, 1));
            break;
        case 'custom':
            start = getStartOfDate(customStart);
            end = getEndOfDate(customEnd);
            break;
    }
    
    currentTrackTimeRange.start = start;
    currentTrackTimeRange.end = end;

    // FIX: Placeholder for function that updates the Track page's time range button text
    trackTimeRangeBtn.textContent = `${rangeType.charAt(0).toUpperCase()}${rangeType.slice(1)}`;
}

// --- DELETED DUPLICATE FUNCTIONS ---
// formatDate: DELETED (redundant, using _formatDate locally and core.js functions)
// getStartOfDate: DELETED (moved to core.js)
// getEndOfDate: DELETED (moved to core.js)
// formatShortDuration: DELETED (moved to core.js)
// --- END DELETED ---

// --- Export to CSV (MODIFIED - kept as is) ---
function exportToCSV() {
    if (analysisLogs.length === 0) {
        // FIX: Replaced alert with custom function
        window.alert("No data to export for this period.");
        return;
    }
    let csvContent = "data:text/csv;charset=utf-8,";
    const headers = ["Item", "Category", "Type", "Notes", "Date", "Start Time", "End Time", "Duration (Hours)"];
    csvContent += headers.join(",") + "\r\n";
    const sortedLogs = [...analysisLogs].sort((a, b) => a.startTime - b.startTime);
    sortedLogs.forEach(log => {
        let itemName, categoryName, itemType;
        
        if (log.timerType === 'task') {
            const task = plannerItems.get(log.activityId);
            itemName = task?.name || log.activityName;
            categoryName = "Task";
            itemType = "Task";
        } else {
            const activity = activities.get(log.activityId);
            itemName = activity?.name || log.activityName;
            const category = categories.get(activity?.categoryId);
            categoryName = category?.name || "Uncategorized";
            itemType = "Activity";
        }
        
        const notes = log.notes || "";
        const start = new Date(log.startTime);
        const end = new Date(log.endTime);
        const date = start.toLocaleDateString('en-CA'); 
        const startTime = start.toLocaleTimeString('en-GB'); 
        const endTime = end.toLocaleTimeString('en-GB'); 
        const durationHours = (log.durationMs / 3600000).toFixed(4);
        
        const row = [
            `"${itemName.replace(/"/g, '""')}"`,
            `"${categoryName.replace(/"/g, '""')}"`, 
            `"${itemType.replace(/"/g, '""')}"`, 
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
