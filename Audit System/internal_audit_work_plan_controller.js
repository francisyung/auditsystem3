/**
 * Sentinel Core Internal Audit Work Plan Controller
 * Governs scheduler matrices, dynamic role assignments, budget summation math, and cloud flows.
 */

document.addEventListener("DOMContentLoaded", () => {
    if (window.Theme) window.Theme.init();
    
    // Connect live cloud listener subscription hook
    if (window.AuditStore) {
        window.AuditStore.subscribeToAudit((snapshotData) => {
            renderWorkPlanWorkspace(snapshotData);
        });
    }
});

/**
 * Loops and builds scheduling rows using inherited risk database vectors
 */
//
/**
 * Loops and builds scheduling rows using inherited risk database vectors
 */
function renderWorkPlanWorkspace(data) {
    const planRows = data?.phase1_planning?.workPlan || [];
    const meta = data?.phase1_planning?.workPlanMetadata || {};
    const tbody = document.getElementById("tbl-plan-body");
    if (!tbody) return;

    tbody.innerHTML = "";

    if (planRows.length === 0) {
        document.getElementById("empty-plan-row")?.classList.remove("hidden");
        updateBudgetSummarySummaryTotals(0);
        return;
    }

    document.getElementById("empty-plan-row")?.classList.add("hidden");

    planRows.forEach((row, idx) => {
        const tr = document.createElement("tr");
        tr.className = "border-b border-outline-variant/30 dark:border-slate-800 last:border-0 hover:bg-surface-container-low dark:hover:bg-slate-900/40 align-top transition-colors";
        
        let riskBadgeClass = "bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300";
        let displayLevel = row.riskLevel || "LOW";

        if (displayLevel.toUpperCase().includes("MEDIUM") || displayLevel.toUpperCase().includes("MOD")) {
            riskBadgeClass = "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300";
            displayLevel = "MODERATE";
        } else if (displayLevel.toUpperCase().includes("HIGH")) {
            riskBadgeClass = "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300";
            displayLevel = "HIGH";
        } else {
            displayLevel = "LOW";
        }

        let processedRiskDesc = row.riskDescription || "—";
        if (processedRiskDesc.includes("scope item:")) {
            processedRiskDesc = "Vulnerability audit mapped for assigned area scope parameters.";
        }

        const safeRefNum = window.escapeAttr(row.refNumber);

        tr.innerHTML = `
            <!-- 1. S/number -->
            <td class="p-3 text-center text-xs font-bold text-on-surface-variant dark:text-slate-400 bg-surface-container-low/40 dark:bg-slate-900/20 align-middle">${idx + 1}</td>
            
            <!-- 2. Reference number -->
            <td class="p-3 text-xs font-mono font-bold text-primary dark:text-sky-400 align-middle">${safeRefNum}</td>
            
            <!-- 3. Audit Area Particulars Column -->
            <td class="p-3 text-xs font-bold text-on-surface dark:text-slate-200 align-middle max-w-xs truncate" title="${window.escapeAttr(row.auditAreaReplica || '')}">
                ${window.escapeAttr(row.auditAreaReplica || '—')}
            </td>

            <!-- 4. Risk Description Column -->
            <td class="p-3 text-xs text-on-surface-variant dark:text-slate-400 italic align-middle max-w-xs">
                ${window.escapeAttr(processedRiskDesc)}
            </td>

            <!-- Level of Risk Cell -->
            <td class="p-3 text-center align-middle">
                <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${riskBadgeClass}">
                    ${displayLevel}
                </span>
            </td>
            
            <!-- 5. Audit Objectives -->
            <td class="p-2">
                <textarea onchange="updatePlanField('${safeRefNum}', 'auditObjectives', this.value)" rows="3" placeholder="Enter objectives..." class="w-full bg-slate-50 dark:bg-[#0d0e10] border border-outline-variant/40 dark:border-slate-700 text-xs rounded-lg p-1.5 focus:outline-none focus:ring-1 focus:ring-primary">${window.escapeAttr(row.auditObjectives || '')}</textarea>
            </td>
            
            <!-- 6. Audit Scope -->
            <td class="p-2">
                <textarea onchange="updatePlanField('${safeRefNum}', 'auditScopeBoundaries', this.value)" rows="3" placeholder="Define boundaries..." class="w-full bg-slate-50 dark:bg-[#0d0e10] border border-outline-variant/40 dark:border-slate-700 text-xs rounded-lg p-1.5 focus:outline-none focus:ring-1 focus:ring-primary">${window.escapeAttr(row.auditScopeBoundaries || '')}</textarea>
            </td>
            
            <!-- 7. Audit Duration (With Target Automated Calculation Triggers) -->
            <td class="p-2 space-y-2">
                <div class="flex gap-1.5">
                    <input type="number" min="1" value="${row.durationValue || 4}" onchange="updatePlanNumericField('${safeRefNum}', 'durationValue', this.value)" class="w-16 bg-slate-50 dark:bg-[#0d0e10] border border-outline-variant/40 dark:border-slate-700 text-xs rounded-lg p-1.5 text-center">
                    <select onchange="updatePlanField('${safeRefNum}', 'scale', this.value)" class="flex-1 text-xs bg-slate-50 dark:bg-[#0d0e10] border border-outline-variant/40 dark:border-slate-700 rounded-lg p-1.5">
                        <option value="Weeks" ${row.scale === 'Weeks' ? 'selected' : ''}>Weeks</option>
                        <option value="Months" ${row.scale === 'Months' ? 'selected' : ''}>Months</option>
                    </select>
                </div>
                <div class="space-y-1">
                    <div class="flex items-center gap-1">
                        <span class="text-[9px] uppercase font-bold text-slate-400">Start:</span>
                        <input type="date" value="${row.startDate || ''}" onchange="updatePlanField('${safeRefNum}', 'startDate', this.value)" class="flex-1 bg-slate-50 dark:bg-[#0d0e10] border border-outline-variant/40 dark:border-slate-700 text-[11px] rounded-lg p-1">
                    </div>
                    <div class="flex items-center gap-1">
                        <span class="text-[9px] uppercase font-bold text-slate-400">End:</span>
                        <input type="date" value="${row.endDate || ''}" onchange="updatePlanField('${safeRefNum}', 'endDate', this.value)" class="flex-1 bg-slate-50 dark:bg-[#0d0e10] border border-outline-variant/40 dark:border-slate-700 text-[11px] rounded-lg p-1" readonly disabled>
                    </div>
                </div>
            </td>
            
            <!-- 8. Audit resources -->
            <td class="p-2 space-y-2">
                <div class="space-y-1">
                    <label class="block text-[9px] font-black uppercase text-slate-400">Budget (KES)</label>
                    <input type="number" min="0" step="100" value="${row.budgetKsh || 0}" onchange="handleBudgetFieldModification('${safeRefNum}', this.value)" placeholder="Ksh" class="w-full bg-slate-50 dark:bg-[#0d0e10] border border-outline-variant/40 dark:border-slate-700 text-xs font-bold text-emerald-600 rounded-lg p-1.5">
                </div>
                <div class="space-y-1">
                    <label class="block text-[9px] font-black uppercase text-slate-400">No. of Auditors</label>
                    <input type="number" min="1" value="${row.noOfAuditors || 1}" onchange="updatePlanNumericField('${safeRefNum}', 'noOfAuditors', this.value)" class="w-full bg-slate-50 dark:bg-[#0d0e10] border border-outline-variant/40 dark:border-slate-700 text-xs rounded-lg p-1.5 text-center">
                </div>
                <div class="space-y-1">
                    <label class="block text-[9px] font-black uppercase text-slate-400">Physical Resources</label>
                    <input type="text" value="${window.escapeAttr(row.physicalItResources || '')}" onchange="updatePlanField('${safeRefNum}', 'physicalItResources', this.value)" placeholder="e.g. Laptops, Scanners" class="w-full bg-slate-50 dark:bg-[#0d0e10] border border-outline-variant/40 dark:border-slate-700 text-xs rounded-lg p-1.5">
                </div>
            </td>
            
            <!-- 9. Assignment of Auditors -->
            <td class="p-2 space-y-1.5">
                <div><span class="block text-[9px] uppercase font-bold text-slate-400 pl-0.5">Input</span><input type="text" value="${window.escapeAttr(row.auditorInput || '')}" onchange="updatePlanField('${safeRefNum}', 'auditorInput', this.value)" placeholder="Name" class="w-full bg-slate-50 dark:bg-[#0d0e10] border border-outline-variant/40 dark:border-slate-700 text-xs rounded-lg p-1"></div>
                <div><span class="block text-[9px] uppercase font-bold text-slate-400 pl-0.5">Lead</span><input type="text" value="${window.escapeAttr(row.leadAuditor || '')}" onchange="updatePlanField('${safeRefNum}', 'leadAuditor', this.value)" placeholder="Name" class="w-full bg-slate-50 dark:bg-[#0d0e10] border border-outline-variant/40 dark:border-slate-700 text-xs rounded-lg p-1"></div>
                <div><span class="block text-[9px] uppercase font-bold text-slate-400 pl-0.5">Reviewer 1</span><input type="text" value="${window.escapeAttr(row.auditor1 || '')}" onchange="updatePlanField('${safeRefNum}', 'auditor1', this.value)" placeholder="Name" class="w-full bg-slate-50 dark:bg-[#0d0e10] border border-outline-variant/40 dark:border-slate-700 text-xs rounded-lg p-1"></div>
                <div><span class="block text-[9px] uppercase font-bold text-slate-400 pl-0.5">Reviewer 2</span><input type="text" value="${window.escapeAttr(row.auditor2 || '')}" onchange="updatePlanField('${safeRefNum}', 'auditor2', this.value)" placeholder="Name" class="w-full bg-slate-50 dark:bg-[#0d0e10] border border-outline-variant/40 dark:border-slate-700 text-xs rounded-lg p-1"></div>
                <div><span class="block text-[9px] uppercase font-bold text-slate-400 pl-0.5">Reviewer 3</span><input type="text" value="${window.escapeAttr(row.auditor3 || '')}" onchange="updatePlanField('${safeRefNum}', 'auditor3', this.value)" placeholder="Name" class="w-full bg-slate-50 dark:bg-[#0d0e10] border border-outline-variant/40 dark:border-slate-700 text-xs rounded-lg p-1"></div>
                <div><span class="block text-[9px] uppercase font-bold text-slate-400 pl-0.5">Approver</span><input type="text" value="${window.escapeAttr(row.approver || '')}" onchange="updatePlanField('${safeRefNum}', 'approver', this.value)" placeholder="Name" class="w-full bg-slate-50 dark:bg-[#0d0e10] border border-outline-variant/40 dark:border-slate-700 text-xs rounded-lg p-1"></div>
            </td>

            <!-- NEW PIPELINE ACTION CELL: Launch Isolated Program Execution Stage -->
            <td class="p-3 text-center align-middle">
                <button onclick="launchExecutionProgram(${idx})" class="px-3 py-2 text-[10px] font-black uppercase tracking-wider bg-primary dark:bg-sky-500 hover:opacity-90 text-white rounded-lg transition-all shadow flex items-center gap-1 mx-auto">
                    Launch <span class="material-symbols-outlined text-xs">rocket_launch</span>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    if (meta) {
        const inputMinutes = document.getElementById("txt-minutes");
        const inputDate = document.getElementById("txt-approval-date");
        if (inputMinutes && !inputMinutes.matches(':focus')) inputMinutes.value = meta.minuteNumberRef || "";
        if (inputDate && !inputDate.matches(':focus')) inputDate.value = meta.approvalDate || "";
    }

    calculateRunningBudgetTotal(planRows);
}

function updatePlanField(refNumber, fieldKey, val) {
    const store = window.AuditStore;
    if (!store || !store.current) return;
    
    const workPlan = store.current.phase1_planning.workPlan || [];
    
    // Strategy A: Find row by matching absolute unique reference number
    let targetRow = workPlan.find(w => w.refNumber === refNumber);
    
    // Strategy B Fallback: If refNumber string lookup fails, attempt parsing out array index suffix
    if (!targetRow) {
        const structuralIndexSuffix = refNumber.split('-').pop();
        const parsedIndexIdx = parseInt(structuralIndexSuffix) - 1; 
        if (workPlan[parsedIndexIdx]) {
            targetRow = workPlan[parsedIndexIdx];
        }
    }

    if (!targetRow) {
        console.warn(`⚠️ Pipeline lookup failed. Row reference could not be localized: ${refNumber}`);
        return;
    }
    
    targetRow[fieldKey] = val;

    // Run automated calendar verification math if a timeline metric changes
    if (fieldKey === 'startDate' || fieldKey === 'scale') {
        performAutomatedCalendarMath(targetRow);
    }
}

function updatePlanNumericField(refNumber, fieldKey, val) {
    const store = window.AuditStore;
    if (!store || !store.current) return;
    
    const workPlan = store.current.phase1_planning.workPlan || [];
    
    // Strategy A: Find row by matching absolute unique reference number
    let targetRow = workPlan.find(w => w.refNumber === refNumber);
    
    // Strategy B Fallback: Fallback safety lookup mapping
    if (!targetRow) {
        const structuralIndexSuffix = refNumber.split('-').pop();
        const parsedIndexIdx = parseInt(structuralIndexSuffix) - 1;
        if (workPlan[parsedIndexIdx]) {
            targetRow = workPlan[parsedIndexIdx];
        }
    }

    if (!targetRow) {
        console.warn(`⚠️ Pipeline lookup failed. Row reference could not be localized: ${refNumber}`);
        return;
    }
    
    targetRow[fieldKey] = parseInt(val) || 0;

    // Run automated calendar verification math if duration numeric scalar changes
    if (fieldKey === 'durationValue') {
        performAutomatedCalendarMath(targetRow);
    }
}

function handleBudgetFieldModification(refNumber, numericValueValue) {
    const store = window.AuditStore;
    if (!store || !store.current) return;
    
    const workPlan = store.current.phase1_planning.workPlan || [];
    
    // Strategy A: Find row by matching absolute unique reference number
    let targetRow = workPlan.find(w => w.refNumber === refNumber);
    
    // Strategy B Fallback: Fallback safety lookup mapping
    if (!targetRow) {
        const structuralIndexSuffix = refNumber.split('-').pop();
        const parsedIndexIdx = parseInt(structuralIndexSuffix) - 1;
        if (workPlan[parsedIndexIdx]) {
            targetRow = workPlan[parsedIndexIdx];
        }
    }

    if (!targetRow) {
        console.warn(`⚠️ Pipeline lookup failed. Row reference could not be localized: ${refNumber}`);
        return;
    }
    
    targetRow.budgetKsh = parseFloat(numericValueValue) || 0;
    calculateRunningBudgetTotal(workPlan);
}

/**
 * Iterates through active arrays executing automated summation calculus equations
 *//**
 * Automatically computes end dates using start inputs and scaled duration bounds
 */
function performAutomatedCalendarMath(row) {
    if (!row.startDate || !row.durationValue) return;

    const baseDate = new Date(row.startDate);
    if (isNaN(baseDate.getTime())) return;

    const scalarAmount = parseInt(row.durationValue) || 0;
    const measurementScale = row.scale || "Weeks";

    if (measurementScale === "Weeks") {
        // Add weeks (1 week = 7 days)
        baseDate.setDate(baseDate.getDate() + (scalarAmount * 7));
    } else if (measurementScale === "Months") {
        // Add months safely across calendar year wrapping boundaries
        baseDate.setMonth(baseDate.getMonth() + scalarAmount);
    }

    // Convert date object smoothly to local HTML standard pattern representation (YYYY-MM-DD)
    const computedYear = baseDate.getFullYear();
    const computedMonth = String(baseDate.getMonth() + 1).padStart(2, '0');
    const computedDay = String(baseDate.getDate()).padStart(2, '0');

    row.endDate = `${computedYear}-${computedMonth}-${computedDay}`;

    // Force an immediate layout workspace re-render so the user sees the new end date on screen instantly
    const store = window.AuditStore;
    if (store && typeof renderWorkPlanWorkspace === 'function') {
        renderWorkPlanWorkspace(store.current);
    }
}

/**
 * Iterates through active arrays executing automated summation calculus equations
 */
function calculateRunningBudgetTotal(rowsArray) {
    let sum = 0;
    rowsArray.forEach(r => {
        sum += parseFloat(r.budgetKsh || 0);
    });
    updateBudgetSummarySummaryTotals(sum);
}

function updateBudgetSummarySummaryTotals(totalAmount) {
    const formattedCurrency = new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(totalAmount);
    
    const displayCard = document.getElementById("lbl-total-budget-card");
    const tableRowSum = document.getElementById("lbl-table-sum");
    
    if (displayCard) displayCard.textContent = formattedCurrency;
    if (tableRowSum) tableRowSum.textContent = formattedCurrency;
}

/**
 * Commits schedule states and inputs directly to Firestore
 */
async function commitWorkPlanProgress() {
    const store = window.AuditStore;
    if (!store || !store.current) return;

    const rows = store.current.phase1_planning.workPlan || [];
    let computedSum = 0;
    rows.forEach(r => computedSum += parseFloat(r.budgetKsh || 0));

    const minutes = document.getElementById("txt-minutes")?.value || "";
    const approvalDate = document.getElementById("txt-approval-date")?.value || "";

    try {
        await store.updateWorkPlan(rows, computedSum, minutes, approvalDate);
        alert("Internal Audit Work Plan configurations committed successfully to corporate cloud persistence layers! 🔒");
    } catch (err) {
        alert("Cloud communication exception encountered. Progress save aborted.");
    }
}

/**
 * Persists the chosen active row index pointer to the cloud document tracking path, then advances routes
 */
async function launchExecutionProgram(selectedIdx) {
    const store = window.AuditStore;
    if (!store || !store.current) return;

    // Pull current spreadsheet input states to ensure dirty-form data safety before routing
    const rows = store.current.phase1_planning.workPlan || [];
    let computedSum = 0;
    rows.forEach(r => computedSum += parseFloat(r.budgetKsh || 0));
    
    const minutes = document.getElementById("txt-minutes")?.value || "";
    const approvalDate = document.getElementById("txt-approval-date")?.value || "";

    try {
        // Initialize structural node safety check wrapper
        if (!store.current.phase1_planning) store.current.phase1_planning = {};
        
        // Write selection index directly into cloud configuration layer properties tracking token
        store.current.phase1_planning.selectedExecutionId = selectedIdx;

        // Force a transaction upstream synchronization save
        await store.updateWorkPlan(rows, computedSum, minutes, approvalDate);
        
        // Fallback protection check handler for standard stage triggers
        if (typeof store.carryToDraft === 'function') store.carryToDraft();
        
        // Dispatch document path location pointer route forward to Stage 2 Canvas Spreadsheet View
        window.location.href = "Audit_Plan&Program.html";
    } catch (err) {
        console.error("Pipeline handoff validation error exception context trace:", err);
        alert("Cloud pipeline tracking error: Failed to initialize selected audit execution line reference context.");
    }
}

/**
 * Transitions into Phase 2, Stage 1 (Legacy Button Catch Event Fallback Route Handler)
 */
async function finalizePlanningAndAdvancePhase() {
    const store = window.AuditStore;
    if (!store || !store.current) return;

    const rows = store.current.phase1_planning.workPlan || [];
    if (rows.length === 0) {
        alert("Cannot advance phase with an empty scheduling track matrix.");
        return;
    }

    try {
        let computedSum = 0;
        rows.forEach(r => computedSum += parseFloat(r.budgetKsh || 0));
        
        const minutes = document.getElementById("txt-minutes")?.value || "";
        const approvalDate = document.getElementById("txt-approval-date")?.value || "";
        
        // Fallback protection defaults active item index state tracker index to row 0 if button hit blindly
        if (store.current.phase1_planning.selectedExecutionId === undefined) {
            store.current.phase1_planning.selectedExecutionId = 0;
        }

        await store.updateWorkPlan(rows, computedSum, minutes, approvalDate);
        
        if (typeof store.carryToDraft === 'function') store.carryToDraft(); 
        window.location.href = "Audit_Plan&Program.html";
    } catch (err) {
        alert("Pipeline error. Secure handoff context failed to save.");
    }
}
