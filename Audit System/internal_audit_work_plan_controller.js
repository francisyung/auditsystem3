/**
 * Sentinel Core Internal Audit Work Plan Controller
 * Governs scheduler matrices, dynamic role assignments, budget summation math, and cloud flows.
 * PART 1 OF 2: CONDITIONAL INTERFACE RENDERERS & WORKFLOW ACCESS LOCKS
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
/**
 * Loops and builds scheduling rows using inherited risk database vectors
 * UPDATED: Enforces item-by-item isolated status tracking bars per individual audit record.
 */
function renderWorkPlanWorkspace(data) {
    const planRows = data?.phase1_planning?.workPlan || [];
    const meta = data?.phase1_planning?.workPlanMetadata || {};
    const tbody = document.getElementById("tbl-plan-body");
    if (!tbody) return;

    tbody.innerHTML = "";

    const activeUserRole = localStorage.getItem("sentinel_active_role") || "officer";

    if (planRows.length === 0) {
        document.getElementById("empty-plan-row")?.classList.remove("hidden");
        updateBudgetSummarySummaryTotals(0);
        return;
    }

    document.getElementById("empty-plan-row")?.classList.add("hidden");

    planRows.forEach((row, idx) => {
        // 🛡️ ITEM-ISOLATED INITIALIZATION: Assign a unique status tracking state per individual row if missing
        if (!row.trackingState) {
            row.trackingState = { status: "Draft", currentHolder: "officer", remarks: "" };
        }Z

        const itemState = row.trackingState;
        const safeRefNum = window.escapeAttr(row.refNumber);

        // Enforce field-level lockdowns strictly aligned to the specific item's owner and authorization state
       const isItemLocked = (activeUserRole === "officer" && itemState.status === "Draft") ? "" : "disabled readonly opacity-60 pointer-events-none";

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

        // Limit launch capability exclusively to line entries that are individually 'Approved'
        const isLaunchButtonDisabled = itemState.status !== "Approved" ? "opacity-30 pointer-events-none filter grayscale" : "";

        // Build item isolated inline badge maps
        const badgeColorMap = {
            "Draft": "bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-400",
            "Pending_Lead": "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
            "Pending_Reviewer": "bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-300",
            "Pending_Approver": "bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300",
            "Approved": "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 font-bold",
            "Returned_To_Officer": "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300"
        };
        const itemStatusStyle = badgeColorMap[itemState.status] || "bg-slate-100 text-slate-800";

        // Build item-by-item actions control blocks dynamically
        let itemWorkflowActionsHtml = "";
        if (activeUserRole === itemState.currentHolder && itemState.status !== "Approved") {
            itemWorkflowActionsHtml = `
                <div class="mt-2 space-y-1.5 no-print">
                    <input type="text" id="txt-remarks-${idx}" placeholder="Routing remarks..." class="w-full bg-[#1e293b] border border-slate-700/50 p-1 text-[10px] rounded text-white focus:outline-none placeholder-slate-500">
                    <div class="flex flex-wrap gap-1 justify-center">
                        ${activeUserRole === "officer" ? `
                            <button onclick="commitItemWorkflowTransition(${idx}, 'Pending_Lead')" class="px-2 py-1 text-[9px] font-black uppercase bg-sky-600 hover:bg-sky-700 text-white rounded">Submit</button>
                        ` : activeUserRole === "leadauditor" ? `
                            <button onclick="commitItemWorkflowTransition(${idx}, 'Pending_Reviewer')" class="px-2 py-1 text-[9px] font-black uppercase bg-sky-600 hover:bg-sky-700 text-white rounded">Verify</button>
                            <button onclick="commitItemWorkflowTransition(${idx}, 'Returned_To_Officer')" class="px-2 py-1 text-[9px] font-black uppercase bg-amber-600 hover:bg-amber-700 text-white rounded">Return</button>
                        ` : activeUserRole === "reviewer" ? `
                            <button onclick="commitItemWorkflowTransition(${idx}, 'Pending_Approver')" class="px-2 py-1 text-[9px] font-black uppercase bg-indigo-600 hover:bg-indigo-700 text-white rounded">Review</button>
                            <button onclick="commitItemWorkflowTransition(${idx}, 'Returned_To_Lead')" class="px-2 py-1 text-[9px] font-black uppercase bg-amber-600 hover:bg-amber-700 text-white rounded">Return</button>
                        ` : activeUserRole === "approver" ? `
                            <button onclick="commitItemWorkflowTransition(${idx}, 'Approved')" class="px-2 py-1 text-[9px] font-black uppercase bg-emerald-600 hover:bg-emerald-700 text-white rounded">Authorize</button>
                            <button onclick="commitItemWorkflowTransition(${idx}, 'Returned_To_Officer')" class="px-2 py-1 text-[9px] font-black uppercase bg-rose-600 hover:bg-rose-700 text-white rounded">Reject</button>
                        ` : ""}
                    </div>
                </div>`;
        } else {
            itemWorkflowActionsHtml = `
                <div class="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-1 text-center">
                    ${itemState.status === "Approved" ? "✓ Authorized" : `⏳ Hold: [${itemState.currentHolder.toUpperCase()}]`}
                </div>`;
        }

        tr.innerHTML = `
            <!-- 1. S/number -->
            <td class="p-3 text-center text-xs font-bold text-on-surface-variant dark:text-slate-400 bg-surface-container-low/40 dark:bg-slate-900/20 align-middle">${idx + 1}</td>
            
            <!-- 2. Reference number -->
            <td class="p-3 text-xs font-mono font-bold text-primary dark:text-sky-400 align-middle">${safeRefNum}</td>
            
            <!-- 3. Audit Area Particulars -->
            <td class="p-3 text-xs font-bold text-on-surface dark:text-slate-200 align-middle max-w-xs truncate" title="${window.escapeAttr(row.auditAreaReplica || '')}">
                ${window.escapeAttr(row.auditAreaReplica || '—')}
            </td>

            <!-- 4. Risk Description -->
            <td class="p-3 text-xs text-on-surface-variant dark:text-slate-400 italic align-middle max-w-xs">
                ${window.escapeAttr(processedRiskDesc)}
            </td>

            <!-- Level of Risk -->
            <td class="p-3 text-center align-middle">
                <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${riskBadgeClass}">
                    ${displayLevel}
                </span>
            </td>
            
            <!-- 5. Audit Objectives -->
            <td class="p-2">
                <textarea onchange="updatePlanField('${safeRefNum}', 'auditObjectives', this.value)" ${isItemLocked} rows="3" placeholder="Enter objectives..." class="w-full bg-slate-50 dark:bg-[#0d0e10] border border-outline-variant/40 dark:border-slate-700 text-xs rounded-lg p-1.5 focus:outline-none focus:ring-1 focus:ring-primary">${window.escapeAttr(row.auditObjectives || '')}</textarea>
            </td>
            
            <!-- 6. Audit Scope -->
            <td class="p-2">
                <textarea onchange="updatePlanField('${safeRefNum}', 'auditScopeBoundaries', this.value)" ${isItemLocked} rows="3" placeholder="Define boundaries..." class="w-full bg-slate-50 dark:bg-[#0d0e10] border border-outline-variant/40 dark:border-slate-700 text-xs rounded-lg p-1.5 focus:outline-none focus:ring-1 focus:ring-primary">${window.escapeAttr(row.auditScopeBoundaries || '')}</textarea>
            </td>
                        <!-- 7. Audit Duration Calendar (Restructured for Clear Visibility) -->
            <td class="p-2 space-y-3 min-w-[180px] bg-slate-50/10 dark:bg-slate-900/5">
                <!-- Duration Value & Scale Line Stack -->
                <div class="space-y-1">
                    <label class="block text-[9px] font-black uppercase text-slate-400">Project Duration:</label>
                    <div class="grid grid-cols-2 gap-1">
                        <input type="number" min="1" value="${row.durationValue || 4}" ${isItemLocked} 
                               onchange="updatePlanNumericField('${safeRefNum}', 'durationValue', this.value)" 
                               class="w-full bg-white dark:bg-[#0d0e10] border border-outline-variant/40 dark:border-slate-700 text-xs rounded-lg p-1.5 text-center font-bold">
                        <select onchange="updatePlanField('${safeRefNum}', 'scale', this.value)" ${isItemLocked} 
                                class="w-full text-xs font-semibold bg-white dark:bg-[#0d0e10] border border-outline-variant/40 dark:border-slate-700 rounded-lg p-1.5 cursor-pointer">
                            <option value="Weeks" ${row.scale === 'Weeks' ? 'selected' : ''}>Weeks</option>
                            <option value="Months" ${row.scale === 'Months' ? 'selected' : ''}>Months</option>
                        </select>
                    </div>
                </div>

                <!-- Calendar Timestamps Section -->
                <div class="space-y-1.5 border-t border-dashed border-outline-variant/30 pt-1.5">
                    <div class="flex items-center gap-1.5">
                        <span class="text-[9px] uppercase font-black text-slate-400 w-10">Start:</span>
                        <input type="date" value="${row.startDate || ''}" ${isItemLocked} 
                               onchange="updatePlanField('${safeRefNum}', 'startDate', this.value)" 
                               class="flex-1 bg-white dark:bg-[#0d0e10] border border-outline-variant/40 dark:border-slate-700 text-[11px] rounded-lg p-1 font-medium">
                    </div>
                    <div class="flex items-center gap-1.5">
                        <span class="text-[9px] uppercase font-black text-slate-400 w-10">End:</span>
                        <input type="date" value="${row.endDate || ''}" 
                               class="flex-1 bg-slate-50 dark:bg-slate-900/40 border border-outline-variant/40 dark:border-slate-700 text-[11px] rounded-lg p-1 text-slate-500 font-bold" 
                               readonly disabled>
                    </div>
                </div>
            </td>

            
            <!-- 8. Audit resources -->
            <td class="p-2 space-y-2">
                <div class="space-y-1">
                    <label class="block text-[9px] font-black uppercase text-slate-400">Budget (KES)</label>
                    <input type="number" min="0" step="100" value="${row.budgetKsh || 0}" ${isItemLocked} onchange="handleBudgetFieldModification('${safeRefNum}', this.value)" placeholder="Ksh" class="w-full bg-slate-50 dark:bg-[#0d0e10] border border-outline-variant/40 dark:border-slate-700 text-xs font-bold text-emerald-600 rounded-lg p-1.5">
                </div>
                <div class="space-y-1">
                    <label class="block text-[9px] font-black uppercase text-slate-400">No. of Auditors</label>
                    <input type="number" min="1" value="${row.noOfAuditors || 1}" ${isItemLocked} onchange="updatePlanNumericField('${safeRefNum}', 'noOfAuditors', this.value)" class="w-full bg-slate-50 dark:bg-[#0d0e10] border border-outline-variant/40 dark:border-slate-700 text-xs rounded-lg p-1.5 text-center">
                </div>
                <div class="space-y-1">
                    <label class="block text-[9px] font-black uppercase text-slate-400">Physical Resources</label>
                    <input type="text" value="${window.escapeAttr(row.physicalItResources || '')}" ${isItemLocked} onchange="updatePlanField('${safeRefNum}', 'physicalItResources', this.value)" placeholder="e.g. Laptops" class="w-full bg-slate-50 dark:bg-[#0d0e10] border border-outline-variant/40 dark:border-slate-700 text-xs rounded-lg p-1.5">
                </div>
            </td>
            
            <!-- 9. Assignment of Auditors -->
            <td class="p-2 space-y-1.5">
                <div><span class="block text-[9px] uppercase font-bold text-slate-400 pl-0.5">Lead</span><input type="text" value="${window.escapeAttr(row.leadAuditor || '')}" ${isItemLocked} onchange="updatePlanField('${safeRefNum}', 'leadAuditor', this.value)" placeholder="Name" class="w-full bg-slate-50 dark:bg-[#0d0e10] border border-outline-variant/40 dark:border-slate-700 text-xs rounded-lg p-1"></div>
                <div><span class="block text-[9px] uppercase font-bold text-slate-400 pl-0.5">Reviewer 1</span><input type="text" value="${window.escapeAttr(row.auditor1 || '')}" ${isItemLocked} onchange="updatePlanField('${safeRefNum}', 'auditor1', this.value)" placeholder="Name" class="w-full bg-slate-50 dark:bg-[#0d0e10] border border-outline-variant/40 dark:border-slate-700 text-xs rounded-lg p-1"></div>
                <div><span class="block text-[9px] uppercase font-bold text-slate-400 pl-0.5">Reviewer 2</span><input type="text" value="${window.escapeAttr(row.auditor2 || '')}" ${isItemLocked} onchange="updatePlanField('${safeRefNum}', 'auditor2', this.value)" placeholder="Name" class="w-full bg-slate-50 dark:bg-[#0d0e10] border border-outline-variant/40 dark:border-slate-700 text-xs rounded-lg p-1"></div>
                <div><span class="block text-[9px] uppercase font-bold text-slate-400 pl-0.5">Approver</span><input type="text" value="${window.escapeAttr(row.approver || '')}" ${isItemLocked} onchange="updatePlanField('${safeRefNum}', 'approver', this.value)" placeholder="Name" class="w-full bg-slate-50 dark:bg-[#0d0e10] border border-outline-variant/40 dark:border-slate-700 text-xs rounded-lg p-1"></div>
            </td>

            <!-- 10. NEW ITEM-ISOLATED STATUS CONTROL PANEL CELL -->
            <td class="p-3 text-center align-middle bg-slate-50/20 dark:bg-slate-900/10 min-w-[150px] border-l border-outline-variant/20 shadow-inner">
                <span class="inline-block px-2 py-1 rounded text-[10px] font-mono font-black uppercase tracking-wider ${itemStatusStyle}">
                    ${itemState.status.replace(/_/g, ' ')}
                </span>
                ${itemWorkflowActionsHtml}
            </td>

            <!-- 11. PIPELINE ACTION CELL: Launch Isolated Program Execution Stage -->
            <td class="p-3 text-center align-middle">
                <button onclick="launchExecutionProgram(${idx})" class="${isLaunchButtonDisabled} px-3 py-2 text-[10px] font-black uppercase tracking-wider bg-primary dark:bg-sky-500 hover:opacity-90 text-white rounded-lg transition-all shadow flex items-center gap-1 mx-auto">
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
    
    // Clean out old legacy layout panel container nodes if present on screen
    document.getElementById("sentinel-workplan-workflow-panel")?.remove();
}
/**
 * Executes item-isolated workflow state changes per row index record
 */
async function commitItemWorkflowTransition(rowIndex, targetStatus) {
    const store = window.AuditStore;
    if (!store || !store.current) return;

    // Fetch the row-specific remarks textbox container element safely
    const remarksInput = document.getElementById(`txt-remarks-${rowIndex}`);
    const actualRemarks = remarksInput ? remarksInput.value.trim() : "";

    // Validation: enforce review remarks when rejecting or returning an item package
    if (!actualRemarks && targetStatus.startsWith("Returned")) {
        alert("Action Required: Please provide review remarks explaining the reason for returning this scheduling record.");
        return;
    }

    const planRows = store.current.phase1_planning?.workPlan || [];
    const targetRow = planRows[rowIndex];
    if (!targetRow) return;

    const actingUserRole = localStorage.getItem("sentinel_active_role") || "officer";
    let nextHolder = actingUserRole;

    // Linear Gate Architecture Policy Rules mapping per row item profile
    if (targetStatus === "Pending_Lead") nextHolder = "leadauditor";
    else if (targetStatus === "Pending_Reviewer") nextHolder = "reviewer";
    else if (targetStatus === "Pending_Approver") nextHolder = "approver";
    else if (targetStatus === "Approved" || targetStatus.startsWith("Returned")) nextHolder = "officer";

    // Update the row-isolated tracking metrics state block node safely
    targetRow.trackingState = {
        status: targetStatus,
        currentHolder: nextHolder,
        remarks: actualRemarks || `Item transition passed safely to ${targetStatus}`
    };

    try {
        // Calculate current plan totals to pass down to update mutator streams cleanly
        let computedSum = 0;
        planRows.forEach(r => computedSum += parseFloat(r.budgetKsh || 0));
        
        const minutes = document.getElementById("txt-minutes")?.value || "";
        const approvalDate = document.getElementById("txt-approval-date")?.value || "";

        // Force complete re-serialization to clear implicit pointer references
        store.current = JSON.parse(JSON.stringify(store.current));

        // Push structural modifications directly to centralized cloud persistence layers
        await store.updateWorkPlan(planRows, computedSum, minutes, approvalDate);
        await store.writeSystemAuditLog(`Transitioned Work Plan item row ref [${targetRow.refNumber}] safely to status [${targetStatus}] held by [${nextHolder}].`);
        
        alert(`Audit item ${targetRow.refNumber} state moved to: ${targetStatus.replace(/_/g, ' ')}`);
        
        // Force instant interface re-render using snapshot update pipelines
        renderWorkPlanWorkspace(store.current);
    } catch (err) {
        console.error("🔒 Shield Error: Row transition fault trace context catch block:", err);
        alert("Failed to commit item stage parameters up to cloud node layers due to database timeouts.");
    }
}

// Attach the transition utility method straight onto window global scopes safely
window.commitItemWorkflowTransition = commitItemWorkflowTransition;


/**
 * Injects a stage-wide floating validation bar to route the whole Work Plan collection at once
 */
function renderStageWorkflowControlPanel(stageTrackingState, activeUserRole) {
    let panel = document.getElementById("sentinel-workplan-workflow-panel");
    if (!panel) {
        panel = document.createElement("div");
        panel.id = "sentinel-workplan-workflow-panel";
        panel.className = "p-4 my-6 bg-slate-50 dark:bg-[#111315] border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4 max-w-[1600px] mx-auto no-print shadow-sm";
        const tableContainer = document.querySelector("table")?.parentElement;
        if (tableContainer) tableContainer.after(panel);
    }

    const badgeColorMap = {
        "Draft": "bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-400",
        "Pending_Lead": "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
        "Pending_Reviewer": "bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-300",
        "Pending_Approver": "bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300",
        "Approved": "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
        "Returned_To_Officer": "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300"
    };

    const statusStyle = badgeColorMap[stageTrackingState.status] || "bg-slate-100 text-slate-800";
    
    let interfaceActionsHtml = "";
    const isHolder = activeUserRole === stageTrackingState.currentHolder;

    if (isHolder && stageTrackingState.status !== "Approved") {
        interfaceActionsHtml = `
            <div class="flex items-center gap-2">
                <input type="text" id="txt-stage-remarks" placeholder="Enter workflow stage observations..." class="bg-[#1e293b] border border-slate-700/50 p-2 text-xs rounded text-white focus:outline-none w-56">
                ${activeUserRole === "officer" ? `
                    <button onclick="commitStageStateTransition('Pending_Lead')" class="px-3 py-2 text-xs font-black uppercase tracking-wider bg-sky-600 hover:bg-sky-700 text-white rounded">Submit Plan</button>
                ` : activeUserRole === "leadauditor" ? `
                    <button onclick="commitStageStateTransition('Pending_Reviewer')" class="px-3 py-2 text-xs font-black uppercase tracking-wider bg-sky-600 hover:bg-sky-700 text-white rounded">To Reviewer</button>
                    <button onclick="commitStageStateTransition('Returned_To_Officer')" class="px-3 py-2 text-xs font-black uppercase tracking-wider bg-amber-600 hover:bg-amber-700 text-white rounded">Return</button>
                ` : activeUserRole === "reviewer" ? `
                    <button onclick="commitStageStateTransition('Pending_Approver')" class="px-3 py-2 text-xs font-black uppercase tracking-wider bg-indigo-600 hover:bg-indigo-700 text-white rounded">To Approver</button>
                    <button onclick="commitStageStateTransition('Returned_To_Lead')" class="px-3 py-2 text-xs font-black uppercase tracking-wider bg-amber-600 hover:bg-amber-700 text-white rounded">Return</button>
                ` : activeUserRole === "approver" ? `
                    <button onclick="commitStageStateTransition('Approved')" class="px-3 py-2 text-xs font-black uppercase tracking-wider bg-emerald-600 hover:bg-emerald-700 text-white rounded">Authorize Plan</button>
                    <button onclick="commitStageStateTransition('Returned_To_Officer')" class="px-3 py-2 text-xs font-black uppercase tracking-wider bg-rose-600 hover:bg-rose-700 text-white rounded">Reject</button>
                ` : ""}
            </div>`;
    } else {
        interfaceActionsHtml = `<div class="text-xs text-slate-500 font-bold uppercase tracking-wider">
            ${stageTrackingState.status === "Approved" ? "✓ Operational Plan Authorized & Active" : `⏳ Awaiting tracking verification by role [${stageTrackingState.currentHolder.toUpperCase()}]`}
        </div>`;
    }

    panel.innerHTML = `
        <div class="flex items-center gap-3">
            <span class="text-xs font-black uppercase tracking-widest text-slate-400">Stage Status Gate:</span>
            <span class="px-2.5 py-1 rounded text-xs font-black font-mono uppercase tracking-wider ${statusStyle}">
                ${stageTrackingState.status.replace(/_/g, ' ')}
            </span>
        </div>
        ${interfaceActionsHtml}
    `;
}

/**
 * Transitions the entire collection stage upstream
 */
async function commitStageStateTransition(targetStatus) {
    const store = window.AuditStore;
    if (!store || !store.current) return;

    const remarksInput = document.getElementById("txt-stage-remarks");
    const actualRemarks = remarksInput ? remarksInput.value.trim() : "";

    if (!actualRemarks && targetStatus.startsWith("Returned")) {
        alert("Action Required: Please provide an explanatory remark detailing the reason for returning the stage design package.");
        return;
    }

    const actingUserRole = localStorage.getItem("sentinel_active_role") || "officer";
    let nextHolder = actingUserRole;

    if (targetStatus === "Pending_Lead") nextHolder = "leadauditor";
    else if (targetStatus === "Pending_Reviewer") nextHolder = "reviewer";
    else if (targetStatus === "Pending_Approver") nextHolder = "approver";
    else if (targetStatus === "Approved" || targetStatus.startsWith("Returned")) nextHolder = "officer";

    store.current.phase1_planning.stageTrackingState = {
        status: targetStatus,
        currentHolder: nextHolder,
        remarks: actualRemarks || `Stage transition processed cleanly to ${targetStatus}`
    };

    try {
        const rows = store.current.phase1_planning.workPlan || [];
        let computedSum = 0;
        rows.forEach(r => computedSum += parseFloat(r.budgetKsh || 0));
        const minutes = document.getElementById("txt-minutes")?.value || "";
        const approvalDate = document.getElementById("txt-approval-date")?.value || "";

                await store.updateWorkPlan(rows, computedSum, minutes, approvalDate);
        await store.writeSystemAuditLog(`Transitioned Internal Work Plan stage-wide scope package to status [${targetStatus}] held by [${nextHolder}].`);
        alert(`Stage state moved to ${targetStatus.replace(/_/g, ' ')} successfully.`);
    } catch (err) {
        alert("Failed to commit stage parameters up to cloud node layers.");
    }
}

function updatePlanField(refNumber, fieldKey, val) {
    const store = window.AuditStore;
    if (!store || !store.current) return;
    
    const workPlan = store.current.phase1_planning.workPlan || [];
    let targetRow = workPlan.find(w => w.refNumber === refNumber);
    
    if (!targetRow) {
        const indexIdx = parseInt(refNumber.split('-').pop()) - 1;
        if (workPlan[indexIdx]) targetRow = workPlan[indexIdx];
    }

    if (!targetRow) return;
    targetRow[fieldKey] = val;

    if (fieldKey === 'startDate' || fieldKey === 'scale') {
        performAutomatedCalendarMath(targetRow);
    }
}

function updatePlanNumericField(refNumber, fieldKey, val) {
    const store = window.AuditStore;
    if (!store || !store.current) return;
    
    const workPlan = store.current.phase1_planning.workPlan || [];
    let targetRow = workPlan.find(w => w.refNumber === refNumber);
    
    if (!targetRow) {
        const indexIdx = parseInt(refNumber.split('-').pop()) - 1;
        if (workPlan[indexIdx]) targetRow = workPlan[indexIdx];
    }

    if (!targetRow) return;
    targetRow[fieldKey] = parseInt(val) || 0;

    if (fieldKey === 'durationValue') {
        performAutomatedCalendarMath(targetRow);
    }
}

function handleBudgetFieldModification(refNumber, numericValueValue) {
    const store = window.AuditStore;
    if (!store || !store.current) return;
    
    const workPlan = store.current.phase1_planning.workPlan || [];
    let targetRow = workPlan.find(w => w.refNumber === refNumber);
    
    if (!targetRow) {
        const indexIdx = parseInt(refNumber.split('-').pop()) - 1;
        if (workPlan[indexIdx]) targetRow = workPlan[indexIdx];
    }

    if (!targetRow) return;
    targetRow.budgetKsh = parseFloat(numericValueValue) || 0;
    calculateRunningBudgetTotal(workPlan);
}

function performAutomatedCalendarMath(row) {
    if (!row.startDate || !row.durationValue) return;

    const baseDate = new Date(row.startDate);
    if (isNaN(baseDate.getTime())) return;

    const scalarAmount = parseInt(row.durationValue) || 0;
    const measurementScale = row.scale || "Weeks";

    if (measurementScale === "Weeks") {
        baseDate.setDate(baseDate.getDate() + (scalarAmount * 7));
    } else if (measurementScale === "Months") {
        baseDate.setMonth(baseDate.getMonth() + scalarAmount);
    }

    const computedYear = baseDate.getFullYear();
    const computedMonth = String(baseDate.getMonth() + 1).padStart(2, '0');
    const computedDay = String(baseDate.getDate()).padStart(2, '0');

    row.endDate = `${computedYear}-${computedMonth}-${computedDay}`;

    const store = window.AuditStore;
    if (store && typeof renderWorkPlanWorkspace === 'function') {
        renderWorkPlanWorkspace(store.current);
    }
}

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
        alert("Work Plan progress configuration committed successfully to corporate cloud persistence layers! 🔒");
    } catch (err) {
        alert("Cloud communication exception encountered. Save aborted.");
    }
}

async function launchExecutionProgram(selectedIdx) {
    const store = window.AuditStore;
    if (!store || !store.current) return;

    const rows = store.current.phase1_planning.workPlan || [];
    let computedSum = 0;
    rows.forEach(r => computedSum += parseFloat(r.budgetKsh || 0));
    
    const minutes = document.getElementById("txt-minutes")?.value || "";
    const approvalDate = document.getElementById("txt-approval-date")?.value || "";

    try {
        if (!store.current.phase1_planning) store.current.phase1_planning = {};
        store.current.phase1_planning.selectedExecutionId = selectedIdx;

        await store.updateWorkPlan(rows, computedSum, minutes, approvalDate);
        if (typeof store.carryToDraft === 'function') store.carryToDraft();
        
        window.location.href = "Audit_Plan&Program.html";
    } catch (err) {
        alert("Cloud pipeline tracking error: Failed to initialize selected audit execution line context.");
    }
}

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
