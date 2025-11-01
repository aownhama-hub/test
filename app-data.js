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
