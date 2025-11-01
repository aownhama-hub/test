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
    <div class="home-item" data-id="${item.id}" data-type="${type}">
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
