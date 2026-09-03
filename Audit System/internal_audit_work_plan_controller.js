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
        
        // Define color badges matching inherited level strings
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

        tr.innerHTML = `
            <!-- 1. S/number -->
            <td class="p-3 text-center text-xs font-bold text-on-surface-variant dark:text-slate-400 bg-surface-container-low/40 dark:bg-slate-900/20 align-middle">${idx + 1}</td>
            
            <!-- 2. Reference number -->
            <td class="p-3 text-xs font-mono font-bold text-primary dark:text-sky-400 align-middle">${window.escapeAttr(row.refNumber || '')}</td>
            
            <!-- 3. Audit Area/Particulars & 4b. Risk Description(s) -->
            <td class="p-3 text-xs space-y-1 max-w-xs">
                <div class="font-bold text-on-surface dark:text-slate-200">${window.escapeAttr(row.auditAreaReplica || '')}</div>
                <div class="text-[11px] text-on-surface-variant dark:text-slate-400 italic">${window.escapeAttr(row.riskDescription || '')}</div>
            </td>
            
            <!-- 4. Level of Risk: H/M/L -->
            <td class="p-3 text-center align-middle">
                <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black tracking-wider ${riskBadgeClass}">
                    ${displayLevel}
                </span>
            </td>
            
            <!-- 5. Audit Objectives -->
            <td class="p-2">
                <textarea onchange="updatePlanField(${idx}, 'auditObjectives', this.value)" rows="3" placeholder="Enter objectives..." class="w-full bg-slate-50 dark:bg-[#0d0e10] border border-outline-variant/40 dark:border-slate-700 text-xs rounded-lg p-1.5 focus:outline-none focus:ring-1 focus:ring-primary">${window.escapeAttr(row.auditObjectives || '')}</textarea>
            </td>
            
            <!-- 6. Audit Scope -->
            <td class="p-2">
                <textarea onchange="updatePlanField(${idx}, 'auditScopeBoundaries', this.value)" rows="3" placeholder="Define boundaries..." class="w-full bg-slate-50 dark:bg-[#0d0e10] border border-outline-variant/40 dark:border-slate-700 text-xs rounded-lg p-1.5 focus:outline-none focus:ring-1 focus:ring-primary">${window.escapeAttr(row.auditScopeBoundaries || '')}</textarea>
            </td>
            
            <!-- 7. Audit Duration -->
            <td class="p-2 space-y-2">
                <div class="flex gap-1.5">
                    <input type="number" min="1" value="${row.durationValue || 4}" onchange="updatePlanNumericField(${idx}, 'durationValue', this.value)" class="w-16 bg-slate-50 dark:bg-[#0d0e10] border border-outline-variant/40 dark:border-slate-700 text-xs rounded-lg p-1.5 text-center">
                    <select onchange="updatePlanField(${idx}, 'scale', this.value)" class="flex-1 text-xs bg-slate-50 dark:bg-[#0d0e10] border-outline-variant/40 dark:border-slate-700 rounded-lg p-1.5">
                        <option value="Weeks" ${row.scale === 'Weeks' ? 'selected' : ''}>Weeks</option>
                        <option value="Months" ${row.scale === 'Months' ? 'selected' : ''}>Months</option>
                    </select>
                </div>
                <div class="space-y-1">
                    <div class="flex items-center gap-1"><span class="text-[9px] uppercase font-bold text-slate-400">Start:</span><input type="date" value="${row.startDate || ''}" onchange="updatePlanField(${idx}, 'startDate', this.value)" class="flex-1 bg-slate-50 dark:bg-[#0d0e10] border border-outline-variant/40 dark:border-slate-700 text-[11px] rounded-lg p-1"></div>
                    <div class="flex items-center gap-1"><span class="text-[9px] uppercase font-bold text-slate-400">End:</span><input type="date" value="${row.endDate || ''}" onchange="updatePlanField(${idx}, 'endDate', this.value)" class="flex-1 bg-slate-50 dark:bg-[#0d0e10] border border-outline-variant/40 dark:border-slate-700 text-[11px] rounded-lg p-1"></div>
                </div>
            </td>
            
            <!-- 8. Audit resources (Split) -->
            <td class="p-2 space-y-2">
                <div class="space-y-1">
                    <label class="block text-[9px] font-black uppercase text-slate-400">Budget (KES)</label>
                    <input type="number" min="0" step="100" value="${row.budgetKsh || 0}" onchange="handleBudgetFieldModification(${idx}, this.value)" placeholder="Ksh" class="w-full bg-slate-50 dark:bg-[#0d0e10] border border-outline-variant/40 dark:border-slate-700 text-xs font-bold text-emerald-600 rounded-lg p-1.5">
                </div>
                <div class="space-y-1">
                    <label class="block text-[9px] font-black uppercase text-slate-400">No. of Auditors</label>
                    <input type="number" min="1" value="${row.noOfAuditors || 1}" onchange="updatePlanNumericField(${idx}, 'noOfAuditors', this.value)" class="w-full bg-slate-50 dark:bg-[#0d0e10] border border-outline-variant/40 dark:border-slate-700 text-xs rounded-lg p-1.5 text-center">
                </div>
                <div class="space-y-1">
                    <label class="block text-[9px] font-black uppercase text-slate-400">Physical Resources</label>
                    <input type="text" value="${window.escapeAttr(row.physicalItResources || '')}" onchange="updatePlanField(${idx}, 'physicalItResources', this.value)" placeholder="e.g. Laptops, Scanners" class="w-full bg-slate-50 dark:bg-[#0d0e10] border border-outline-variant/40 dark:border-slate-700 text-xs rounded-lg p-1.5">
                </div>
            </td>
            
            <!-- 9. Assignment of Auditors (Role-based Mapping) -->
            <td class="p-2 space-y-1.5">
                <div><span class="block text-[9px] uppercase font-bold text-slate-400 pl-0.5">Input</span><input type="text" value="${window.escapeAttr(row.auditorInput || '')}" onchange="updatePlanField(${idx}, 'auditorInput', this.value)" placeholder="Name" class="w-full bg-slate-50 dark:bg-[#0d0e10] border border-outline-variant/40 dark:border-slate-700 text-xs rounded-lg p-1"></div>
                <div><span class="block text-[9px] uppercase font-bold text-slate-400 pl-0.5">Lead</span><input type="text" value="${window.escapeAttr(row.leadAuditor || '')}" onchange="updatePlanField(${idx}, 'leadAuditor', this.value)" placeholder="Name" class="w-full bg-slate-50 dark:bg-[#0d0e10] border border-outline-variant/40 dark:border-slate-700 text-xs rounded-lg p-1"></div>
                <div><span class="block text-[9px] uppercase font-bold text-slate-400 pl-0.5">Reviewer 1</span><input type="text" value="${window.escapeAttr(row.auditor1 || '')}" onchange="updatePlanField(${idx}, 'auditor1', this.value)" placeholder="Name" class="w-full bg-slate-50 dark:bg-[#0d0e10] border border-outline-variant/40 dark:border-slate-700 text-xs rounded-lg p-1"></div>
                <div><span class="block text-[9px] uppercase font-bold text-slate-400 pl-0.5">Reviewer 2</span><input type="text" value="${window.escapeAttr(row.auditor2 || '')}" onchange="updatePlanField(${idx}, 'auditor2', this.value)" placeholder="Name" class="w-full bg-slate-50 dark:bg-[#0d0e10] border border-outline-variant/40 dark:border-slate-700 text-xs rounded-lg p-1"></div>
                <div><span class="block text-[9px] uppercase font-bold text-slate-400 pl-0.5">Reviewer 3</span><input type="text" value="${window.escapeAttr(row.auditor3 || '')}" onchange="updatePlanField(${idx}, 'auditor3', this.value)" placeholder="Name" class="w-full bg-slate-50 dark:bg-[#0d0e10] border border-outline-variant/40 dark:border-slate-700 text-xs rounded-lg p-1"></div>
                <div><span class="block text-[9px] uppercase font-bold text-slate-400 pl-0.5">Approver</span><input type="text" value="${window.escapeAttr(row.approver || '')}" onchange="updatePlanField(${idx}, 'approver', this.value)" placeholder="Name" class="w-full bg-slate-50 dark:bg-[#0d0e10] border border-outline-variant/40 dark:border-slate-700 text-xs rounded-lg p-1"></div>
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


function updatePlanField(idx, fieldKey, val) {
    const store = window.AuditStore;
    if (!store || !store.current) return;
    store.current.phase1_planning.workPlan[idx][fieldKey] = val;
}

function updatePlanNumericField(idx, fieldKey, val) {
    const store = window.AuditStore;
    if (!store || !store.current) return;
    store.current.phase1_planning.workPlan[idx][fieldKey] = parseInt(val) || 0;
}

function handleBudgetFieldModification(idx, numericValueValue) {
    const store = window.AuditStore;
    if (!store || !store.current) return;
    
    store.current.phase1_planning.workPlan[idx].budgetKsh = parseFloat(numericValueValue) || 0;
    calculateRunningBudgetTotal(store.current.phase1_planning.workPlan);
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

    const rows = store.current.phase1_planning.workPlan;
    let computedSum = 0;
    rows.forEach(r => computedSum += parseFloat(r.budgetKsh || 0));

    const minutes = document.getElementById("txt-minutes").value;
    const approvalDate = document.getElementById("txt-approval-date").value;

    try {
        await store.updateWorkPlan(rows, computedSum, minutes, approvalDate);
        alert("Internal Audit Work Plan configurations committed successfully to corporate cloud persistence layers! 🔒");
    } catch (err) {
        alert("Cloud communication exception encountered. Progress save aborted.");
    }
}

/**
 * Transitions into Phase 2, Stage 1 (Performing Phase Blueprint)
 */
async function finalizePlanningAndAdvancePhase() {
    const store = window.AuditStore;
    if (!store || !store.current) return;

    // Check if verification items exist
    if ((store.current.phase1_planning.workPlan || []).length === 0) {
        alert("Cannot advance phase with an empty scheduling track matrix.");
        return;
    }

    try {
        // Sync final values before shifting workspace routes
        const rows = store.current.phase1_planning.workPlan;
        let computedSum = 0;
        rows.forEach(r => computedSum += parseFloat(r.budgetKsh || 0));
        
        const minutes = document.getElementById("txt-minutes").value;
        const approvalDate = document.getElementById("txt-approval-date").value;
        
        await store.updateWorkPlan(rows, computedSum, minutes, approvalDate);
        
        // Initialize Phase 2 Program baseline arrays mapping triggers
        store.carryToDraft(); 
        window.location.href = "Audit_Plan&Program.html";
    } catch (err) {
        alert("Pipeline error. Secure handoff context failed to save.");
    }
}
