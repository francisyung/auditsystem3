/**
 * Sentinel Core Audit Plan & Program Controller Module
 * Handles real-time cloud tracking and single-audit risk target parsing for Phase 2 Stage 1.
 * PART 1 OF 2: PER-AUDIT ISOLATION, DATA RETRIEVAL & FIELD LOCKDOWN SHIELDS
 */

let activeTargetIndex = 0; 

document.addEventListener("DOMContentLoaded", () => {
    if (window.Theme) window.Theme.init();
    
    if (window.AuditStore) {
        window.AuditStore.subscribeToAudit((snapshotData) => {
            let cloudIndex = snapshotData?.phase1_planning?.selectedExecutionId;
            if (cloudIndex !== undefined && cloudIndex !== null) {
                activeTargetIndex = parseInt(cloudIndex);
            }
            renderPlanProgramWorkspace(snapshotData);
            initializePhase2ProgramCanvas(snapshotData);
        });
    }
});

/**
 * Parses cloud snapshots to load metrics cards and checklist steps safely
 */
/**
 * Parses cloud snapshots to load metrics cards and checklist steps safely
 * UPDATED: Injected async decryption intercepts to automatically decode cipher strings before rendering.
 */
async function renderPlanProgramWorkspace(data) { // 👈 Changed function to 'async'
    const workPlanList = data?.phase1_planning?.workPlan || [];
    const meta = data?.phase1_planning?.workPlanMetadata || {};
    const planProgram = data?.phase2_performing?.planProgram || {};
    
    if (workPlanList.length === 0) {
        document.getElementById("empty-program-state")?.classList.remove("hidden");
        document.getElementById("active-program-workspace")?.classList.add("hidden");
        return;
    }

    document.getElementById("empty-program-state")?.classList.add("hidden");
    document.getElementById("active-program-workspace")?.classList.remove("hidden");

    populateTargetRiskSelector(workPlanList);

    const rawTargetRow = workPlanList[activeTargetIndex] || workPlanList[0];
    if (!rawTargetRow) return;
    
    // =========================================================================
    // 🛡️ RE-ALIGNED DECRYPTION INTERCEPTOR OBJECT CLONE
    // Automatically decrypts inherited data variables to clear cipher values on screen
    // =========================================================================
    const targetRow = { ...rawTargetRow };
    try {
        if (targetRow.auditObjectives && targetRow.auditObjectives.startsWith("SENTINEL_CIPHER:")) {
            const cipherText = targetRow.auditObjectives.replace("SENTINEL_CIPHER:", "");
            targetRow.auditObjectives = await window.SentinelCrypto.decryptDataField(cipherText);
        }
        if (targetRow.auditScopeBoundaries && targetRow.auditScopeBoundaries.startsWith("SENTINEL_CIPHER:")) {
            const cipherText = targetRow.auditScopeBoundaries.replace("SENTINEL_CIPHER:", "");
            targetRow.auditScopeBoundaries = await window.SentinelCrypto.decryptDataField(cipherText);
        }
        if (targetRow.riskDescription && targetRow.riskDescription.startsWith("SENTINEL_CIPHER:")) {
            const cipherText = targetRow.riskDescription.replace("SENTINEL_CIPHER:", "");
            targetRow.riskDescription = await window.SentinelCrypto.decryptDataField(cipherText);
        }
    } catch (cryptoErr) {
        console.error("🔒 Cryptographic Exception: Failed to decode plan program inheritance vectors.", cryptoErr);
    }

    const refNum = targetRow.refNumber;

    if (!planProgram.audits) planProgram.audits = {};
    if (!planProgram.audits[refNum]) planProgram.audits[refNum] = {};
    const programState = planProgram.audits[refNum];

    // Initialize group validation wrappers if absent from the audit node block
    if (!programState.trackingState) {
        programState.trackingState = { status: "Draft", currentHolder: "officer", remarks: "" };
    }

    // =========================================================================
    // From here downwards, the rest of your original rendering code runs 100% the same,
    // but reads 'targetRow' containing clean plain text definitions!
    // =========================================================================
    const tState = programState.trackingState;

    const activeUserRole = localStorage.getItem("sentinel_active_role") || "officer";
    const isStageLocked = (activeUserRole !== tState.currentHolder || tState.status === "Approved");

    // Populate data parameters pulled from Phase 1
    const elTitle = document.getElementById("lbl-pull-title");
    const elDept = document.getElementById("lbl-pull-department");
    const elPeriod = document.getElementById("lbl-pull-period");
    const elDuration = document.getElementById("lbl-pull-duration");

    if (elTitle) elTitle.textContent = targetRow.auditAreaReplica || "—";
    if (elDept) elDept.textContent = targetRow.physicalItResources || "Operations / Infrastructure";
    if (elPeriod) elPeriod.textContent = `${targetRow.startDate || '—'} to ${targetRow.endDate || '—'}`;
    if (elDuration) elDuration.textContent = `${targetRow.durationValue || 4} ${targetRow.scale || 'Weeks'}`;

    const riskContent = programState.risksAdditions || targetRow.riskDescription || "";
    const objectiveContent = programState.auditObjectivesAdditions || targetRow.auditObjectives || "";
    const scopeContent = programState.auditScopeAdditions || targetRow.auditScopeBoundaries || "";

    // 🛡️ RE-ALIGNED AUDITOR SEGREGATION DATA CORRELATION FIELDS
    const fallbackPreparedBy = programState.prepName || targetRow.leadAuditor || ""; // LEAD
    const fallbackReviewedBy = programState.revName  || targetRow.auditor1 || "";    // REVIEWER 1 (Audit Manager)
    const fallbackApprovedBy = programState.appName  || targetRow.approver || "";    // APPROVER

    
    setInputValWithoutFocusLoss("sign-prep-date", programState.prepDate || targetRow.approvalDate || "");
   
    
    
    setInputValWithoutFocusLoss("sign-app-date", programState.appDate || targetRow.approvalDate || "");

    setInputValWithoutFocusLoss("sign-prep-name", fallbackPreparedBy);
    setInputValWithoutFocusLoss("sign-prep-date", programState.prepName ? (programState.prepDate || "") : (targetRow.approvalDate || ""));
    setInputValWithoutFocusLoss("sign-rev-name", fallbackReviewedBy);
    setInputValWithoutFocusLoss("sign-rev-date", programState.revDate || "");
    setInputValWithoutFocusLoss("sign-app-name", fallbackApprovedBy);
    setInputValWithoutFocusLoss("sign-app-date", programState.appName ? (programState.appDate || "") : (targetRow.approvalDate || ""));

    setTextAreaValWithoutFocusLoss("txt-add-risks", riskContent);
    setTextAreaValWithoutFocusLoss("txt-add-objectives", objectiveContent);
    setTextAreaValWithoutFocusLoss("txt-add-scope", scopeContent);
    
    setTextAreaValWithoutFocusLoss("txt-intro-bg", programState.introductionBackground || "");
    setTextAreaValWithoutFocusLoss("txt-methodology", programState.methodology || "");
    setTextAreaValWithoutFocusLoss("txt-benchmarks", programState.evaluationCriteria || "");

    const elBudget = document.getElementById("card-lock-budget");
    const elHeadcount = document.getElementById("card-lock-headcount");
    const elLead = document.getElementById("card-lock-lead");
    const elTeam = document.getElementById("card-lock-team");
    const elMinute = document.getElementById("card-lock-minute");

    if (elBudget) elBudget.textContent = new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(targetRow.budgetKsh || 0);
    if (elHeadcount) elHeadcount.textContent = `${targetRow.noOfAuditors || 1} Professional(s)`;
    if (elLead) elLead.textContent = targetRow.leadAuditor || "—";
    if (elTeam) elTeam.textContent = [targetRow.auditor1, targetRow.auditor2].filter(Boolean).join(", ") || "—";
    if (elMinute) elMinute.textContent = meta.minuteNumberRef || "—";

    // Enforce DOM field locks on narrative components dynamically based on validation states
    document.querySelectorAll("textarea, #active-program-workspace input:not([id='txt-stage-remarks']), #active-program-workspace select:not([id='sel-audit-target'])").forEach(el => {
        if (isStageLocked) {
            el.setAttribute("disabled", "true");
            el.classList.add("opacity-60", "bg-slate-100", "dark:bg-slate-900/50", "pointer-events-none");
        } else {
            el.removeAttribute("disabled");
            el.classList.remove("opacity-60", "bg-slate-100", "dark:bg-slate-900/50", "pointer-events-none");
        }
    });

    // Control structural addition visibility components
    const btnAddRow = document.querySelector("button[onclick='addChecklistStepRow()']");
    if (btnAddRow) {
        if (isStageLocked) btnAddRow.classList.add("hidden");
        else btnAddRow.classList.remove("hidden");
    }

    renderProgramChecklistStepsTable(programState.steps || [], targetRow, isStageLocked);
    renderProgramWorkflowGatingControls(tState, activeUserRole, refNum);
}
/**
 * Sentinel Core Audit Plan & Program Controller Module
 * PART 2 OF 5: CANVAS RUNTIME INITIALIZATIONS, DECRYPTION INTERCEPTORS & CHECKSLIST RENDERING
 */

async function initializePhase2ProgramCanvas(data) {
    const planRows = data?.phase1_planning?.workPlan || [];
    const universeList = data?.phase1_planning?.universe || [];
    const planProgram = data?.phase2_performing?.planProgram || {};
    
    let activeIdx = data?.phase1_planning?.selectedExecutionId;
    if (activeIdx === undefined || activeIdx === null) {
        activeIdx = 0;
    }
    
    if (planRows.length === 0) {
        document.getElementById("empty-program-state")?.classList.remove("hidden");
        document.getElementById("active-program-workspace")?.classList.add("hidden");
        return;
    }

    document.getElementById("empty-program-state")?.classList.add("hidden");
    document.getElementById("active-program-workspace")?.classList.remove("hidden");

    const selectTarget = document.getElementById("sel-audit-target");
    if (selectTarget) {
        selectTarget.innerHTML = planRows.map((r, i) => `
            <option value="${i}" ${Number(i) === Number(activeIdx) ? 'selected' : ''}>
                ${window.escapeAttr(r.refNumber || 'UNTITLED')} - ${window.escapeAttr(r.auditAreaReplica || 'Unnamed Area')}
            </option>
        `).join('');
    }

    const activeRow = planRows[activeIdx];
    if (!activeRow) return;

    const refNum = activeRow.refNumber;
    const auditTitle = activeRow.auditAreaReplica || "Untitled Scope Area Assignment";

    let resolvedDepartment = "Operations / General Management";
    const rowRefSuffix = activeRow.refNumber ? activeRow.refNumber.split('-').pop() : "";
    const matchedUniverseItem = universeList.find(u => u.serialNo && u.serialNo.split('-').pop() === rowRefSuffix);
    
    if (matchedUniverseItem && matchedUniverseItem.processOwner) {
        resolvedDepartment = matchedUniverseItem.processOwner;
    }

    const startStr = activeRow.startDate || "Not Scheduled";
    const endStr = activeRow.endDate || "Not Scheduled";
    const durationVal = activeRow.durationValue || 4;
    const durationScale = activeRow.scale || 'Weeks';
    const resolvedPeriodTimeline = `${startStr} to ${endStr} (${durationVal} ${durationScale})`;

    const lblTitle = document.getElementById("lbl-pull-title");
    if (lblTitle) lblTitle.textContent = auditTitle.toUpperCase();

    const lblDept = document.getElementById("lbl-pull-department");
    if (lblDept) lblDept.textContent = resolvedDepartment.toUpperCase();

    const lblPeriod = document.getElementById("lbl-pull-period");
    if (lblPeriod) lblPeriod.textContent = resolvedPeriodTimeline.toUpperCase();

   let plainObjectives = activeRow.auditObjectives || "";
    let plainScope = activeRow.auditScopeBoundaries || "";
    let plainRisks = activeRow.riskDescription || "";

    // =========================================================================
    // 🛡️ RE-SYNCHRONIZED CANVAS DECRYPTION ENGINES (PREVENTS OVERWRITE)
    // =========================================================================
    try {
        if (plainObjectives.startsWith("SENTINEL_CIPHER:")) {
            const cipherText = plainObjectives.replace("SENTINEL_CIPHER:", "");
            plainObjectives = await window.SentinelCrypto.decryptDataField(cipherText);
        }
        if (plainScope.startsWith("SENTINEL_CIPHER:")) {
            const cipherText = plainScope.replace("SENTINEL_CIPHER:", "");
            plainScope = await window.SentinelCrypto.decryptDataField(cipherText);
        }
        if (plainRisks.startsWith("SENTINEL_CIPHER:")) {
            const cipherText = plainRisks.replace("SENTINEL_CIPHER:", "");
            plainRisks = await window.SentinelCrypto.decryptDataField(cipherText);
        }
    } catch (cryptoErr) {
        console.error("🔒 Cryptographic Exception: Canvas layer decode failed.", cryptoErr);
    }

     // Target your DOM elements accurately using their explicit layout IDs
    const txtObjectives = document.getElementById("txt-add-objectives") || document.getElementById("txt-intro-bg"); 
    const txtScope = document.getElementById("txt-add-scope") || document.querySelector("[placeholder*='boundaries']");
    const txtRisks = document.getElementById("txt-add-risks") || document.getElementById("lbl-pull-risks");

    // Force injection of pure, clean plain text strings into the inputs
    if (txtObjectives && !txtObjectives.matches(':focus')) {
        txtObjectives.value = plainObjectives;
    }
    if (txtScope && !txtScope.matches(':focus')) {
        txtScope.value = plainScope;
    }
    if (txtRisks) {
        if (txtRisks.tagName === "TEXTAREA" || txtRisks.tagName === "INPUT") {
            if (!txtRisks.matches(':focus')) txtRisks.value = plainRisks;
        } else {
            txtRisks.textContent = plainRisks;
        }
    }

    if (!planProgram.audits) planProgram.audits = {};
    if (!planProgram.audits[refNum]) planProgram.audits[refNum] = {};
    const programState = planProgram.audits[refNum];

    const finalPreparedBy = programState.prepName || activeRow.leadAuditor || activeRow.auditorInput || "";
    const finalReviewedBy = programState.revName  || activeRow.auditor1 || activeRow.auditor2 || "";
    const finalApprovedBy = programState.appName  || activeRow.approver || "Head of Internal Audit";

    setInputValWithoutFocusLoss("sign-prep-name", finalPreparedBy);
    setInputValWithoutFocusLoss("sign-prep-date", programState.prepName ? (programState.prepDate || "") : (activeRow.approvalDate || ""));
    
    setInputValWithoutFocusLoss("sign-rev-name", finalReviewedBy);
    setInputValWithoutFocusLoss("sign-rev-date", programState.revDate || "");
    
    setInputValWithoutFocusLoss("sign-app-name", finalApprovedBy);
    setInputValWithoutFocusLoss("sign-app-date", programState.appName ? (programState.appDate || "") : (activeRow.approvalDate || ""));
}

function renderProgramChecklistStepsTable(stepsArray, targetRow, isStageLocked) {
    const tbody = document.getElementById("program-body");
    if (!tbody) {
        console.warn("⚠️ HTML target element container '#program-body' was not found on the DOM layout tree.");
        return;
    }
    tbody.innerHTML = "";
    const refNum = targetRow.refNumber;

    if (stepsArray.length === 0) {
        stepsArray = [{ 
            obj: "Verify structural perimeter rule update timestamps.", 
            risk: "Configuration lags", 
            activity: "Inspection", 
            instructions: "Examine firewall change log records across historical deployment pools.", 
            lead: targetRow?.leadAuditor || "—", 
            status: "Pending" 
        }];
        
        const store = window.AuditStore?.current;
        if (store) {
            if (!store.phase2_performing.planProgram.audits) store.phase2_performing.planProgram.audits = {};
            if (!store.phase2_performing.planProgram.audits[refNum]) store.phase2_performing.planProgram.audits[refNum] = {};
            store.phase2_performing.planProgram.audits[refNum].steps = stepsArray;
        }
    }
/**
 * Sentinel Core Audit Plan & Program Controller Module
 * PART 3 OF 5: DYNAMIC FIELD RENDERERS & INLINE INJECTION COMPONENT LOOPS
 */

    stepsArray.forEach((step, index) => {
        const tr = document.createElement("tr");
        tr.className = "border-b border-slate-200 dark:border-slate-800/60 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-900/40 align-middle transition-colors";
        
        // Conditional locking rule matching active tracking matrix permissions
        const isElementLocked = isStageLocked ? "disabled readonly opacity-50" : "";
        
        tr.innerHTML = `
            <!-- 1. Serial Number Label Row -->
            <td class="p-3 text-center text-xs font-mono font-bold text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-slate-900/20 w-12">${index + 1}</td>
            
            <!-- 2. Targeted Goal Objective Field Box -->
            <td class="p-2 min-w-[180px] max-w-[220px]">
                <div class="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0d0e10] p-1 shadow-sm focus-within:border-sky-500 transition-colors">
                    <input type="text" name="step-${index}-obj" value="${window.escapeAttr(step.obj || '')}" placeholder="Target Objective" ${isElementLocked} class="px-2 py-1 bg-transparent border-0 focus:ring-0 text-xs w-full text-on-surface dark:text-slate-200">
                </div>
            </td>
            
            <!-- 3. Associated Vectors Risk Box -->
            <td class="p-2 min-w-[180px] max-w-[220px]">
                <div class="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0d0e10] p-1 shadow-sm focus-within:border-sky-500 transition-colors">
                    <input type="text" name="step-${index}-risk" value="${window.escapeAttr(step.risk || '')}" placeholder="Risk Association" ${isElementLocked} class="px-2 py-1 bg-transparent border-0 focus:ring-0 text-xs w-full text-on-surface dark:text-slate-200">
                </div>
            </td>
            
            <!-- 4. Core Substantive Audit Activities -->
            <td class="p-2 min-w-[180px] max-w-[220px]">
                <div class="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0d0e10] p-1 shadow-sm focus-within:border-sky-500 transition-colors">
                    <input type="text" name="step-${index}-activity" value="${window.escapeAttr(step.activity || '')}" placeholder="Core Activity" ${isElementLocked} class="px-2 py-1 bg-transparent border-0 focus:ring-0 text-xs w-full text-on-surface dark:text-slate-200">
                </div>
            </td>
            
            <!-- 5. Multi-line Instructions Area Box -->
            <td class="p-2 min-w-[260px] flex-1">
                <textarea 
                    name="step-${index}-instructions" 
                    rows="2" 
                    placeholder="Instructions..." 
                    ${isElementLocked}
                    class="w-full bg-white dark:bg-[#0d0e10] border border-slate-200 dark:border-slate-700 text-xs rounded-lg p-2 focus:outline-none focus:border-sky-500 shadow-sm transition-colors resize-y min-h-[42px] text-on-surface dark:text-slate-200"
                >${window.escapeAttr(step.instructions || "")}</textarea>
            </td>
            
            <!-- 6. Status Selection -->
            <td class="p-2 w-40">
                <select 
                    name="step-${index}-status" 
                    ${isElementLocked}
                    class="w-full text-xs font-semibold bg-white dark:bg-[#0d0e10] border border-slate-200 dark:border-slate-700 rounded-lg p-2 shadow-sm focus:outline-none focus:border-sky-500 cursor-pointer text-on-surface dark:text-slate-200"
                >
                    <option value="Pending" ${step.status === 'Pending' ? 'selected' : ''}>⏳ Pending</option>
                    <option value="In Progress" ${step.status === 'In Progress' ? 'selected' : ''}>⚡ In Progress</option>
                    <option value="Completed" ${step.status === 'Completed' ? 'selected' : ''}>✅ Completed</option>
                </select>
            </td>
            
            <!-- 7. Interactive Actions Command Row -->
            <td class="p-3 text-center w-24 no-print">
                <button 
                    onclick="removeChecklistStepRow(${index})" 
                    ${isStageLocked ? "disabled" : ""}
                    class="px-2 py-1.5 text-[10px] font-black uppercase tracking-wider text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-md transition-colors ${isStageLocked ? 'hidden' : ''}"
                >
                    Remove
                </button>
            </td>
        `;
        
        tr.querySelectorAll("input, select, textarea").forEach(inputElement => {
            inputElement.addEventListener("change", () => saveChecklistStepRowInlineData(index, tr));
        });

        tbody.appendChild(tr);
    });
}
/**
 * Sentinel Core Audit Plan & Program Controller Module
 * PART 4 OF 5: CHECKLIST ROW CRUD HANDLERS & INLINE FIELD PERSISTENCE ENGINES
 */

async function addChecklistStepRow() {
    const store = getAuditStore();
    if (!store) return;
    
    const workPlanList = store.phase1_planning?.workPlan || [];
    const targetRow = workPlanList[activeTargetIndex] || workPlanList[0];
    if (!targetRow) return;

    const refNum = targetRow.refNumber;

    if (!store.phase2_performing.planProgram.audits) store.phase2_performing.planProgram.audits = {};
    if (!store.phase2_performing.planProgram.audits[refNum]) store.phase2_performing.planProgram.audits[refNum] = {};
    
    const steps = store.phase2_performing.planProgram.audits[refNum].steps || [];
    
    steps.push({
        obj: "", 
        risk: "", 
        activity: "", 
        instructions: "", 
        lead: targetRow.leadAuditor || "", 
        status: "Pending"
    });
    
    store.phase2_performing.planProgram.audits[refNum].steps = steps;

    try {
        await window.AuditStore.save();
    } catch(err) {
        console.error("Failed to commit newly added step to cloud layer.", err);
    }
}

async function removeChecklistStepRow(index) {
    const store = getAuditStore();
    if (!store) return;
    
    const workPlanList = store.phase1_planning?.workPlan || [];
    const targetRow = workPlanList[activeTargetIndex] || workPlanList[0];
    if (!targetRow) return;

    const steps = store.phase2_performing.planProgram.audits?.[targetRow.refNumber]?.steps || [];
    steps.splice(index, 1);
    
    try {
        await window.AuditStore.save();
    } catch (err) {
        alert("Cloud deletion error.");
    }
}

function saveChecklistStepRowInlineData(index, trElement) {
    const store = getAuditStore();
    if (!store) return;

    const workPlanList = store.phase1_planning?.workPlan || [];
    const targetRow = workPlanList[activeTargetIndex] || workPlanList[0];
    if (!targetRow) return;

    const step = store.phase2_performing?.planProgram?.audits?.[targetRow.refNumber]?.steps?.[index];
    if (!step) return;

    step.obj = trElement.querySelector(`input[name*="obj"]`)?.value || "";
    step.risk = trElement.querySelector(`input[name*="risk"]`)?.value || "";
    step.activity = trElement.querySelector(`input[name*="activity"]`)?.value || "";
    step.instructions = trElement.querySelector(`textarea[name*="instructions"]`)?.value || "";
    step.status = trElement.querySelector(`select`)?.value || "Pending";
    
    window.AuditStore.save();
}

async function commitProgramWorkspaceState() {
    const store = window.AuditStore;
    if (!store || !store.current) return;

    const workPlanList = store.current.phase1_planning?.workPlan || [];
    const targetRow = workPlanList[activeTargetIndex] || workPlanList[0];
    if (!targetRow) return;

    const meta = store.current.phase1_planning?.workPlanMetadata || {};
    const refNum = targetRow.refNumber;
    const planProgram = store.current.phase2_performing.planProgram;

    if (!planProgram.audits) planProgram.audits = {};
    if (!planProgram.audits[refNum]) planProgram.audits[refNum] = {};
    
    const programState = planProgram.audits[refNum];
    
    programState.risksAdditions = document.getElementById("txt-add-risks")?.value || "";
    programState.auditObjectivesAdditions = document.getElementById("txt-add-objectives")?.value || "";
    programState.auditScopeAdditions = document.getElementById("txt-add-scope")?.value || "";
    
    programState.introductionBackground = document.getElementById("txt-intro-bg")?.value || "";
    programState.methodology = document.getElementById("txt-methodology")?.value || "";
    programState.evaluationCriteria = document.getElementById("txt-benchmarks")?.value || "";

    // Read current input data values safely
    const inputPrepName = document.getElementById("sign-prep-name")?.value || "";
    const inputPrepDate = document.getElementById("sign-prep-date")?.value || "";
    const inputRevName = document.getElementById("sign-rev-name")?.value || "";
    const inputRevDate = document.getElementById("sign-rev-date")?.value || "";
    const inputAppName = document.getElementById("sign-app-name")?.value || "";
    const inputAppDate = document.getElementById("sign-app-date")?.value || "";

    // Resolve structural inheritance date from metadata configurations layer
    const targetApprovalDate = meta.approvalDate || "";

    // Persistence Check: Keep existing data or merge Phase 1 vectors safely if empty
    programState.prepName = inputPrepName || programState.prepName || targetRow.leadAuditor || "";
    programState.prepDate = inputPrepDate || programState.prepDate || (programState.prepName ? targetApprovalDate : "");
    
    programState.revName = inputRevName || programState.revName || targetRow.auditor1 || "";
    programState.revDate = inputRevDate || programState.revDate || "";
    
    programState.appName = inputAppName || programState.appName || targetRow.approver || "";
    programState.appDate = inputAppDate || programState.appDate || (programState.appName ? targetApprovalDate : "");

    try {
        await store.save();
    } catch (err) {
        console.error("Failed to sync structural program data fields.", err);
    }
}

/**
 * Sentinel Core Audit Plan & Program Controller Module
 * PART 5 OF 5: TARGETED STAGE WORKFLOW CONTROLS & UTILITY LOOKUP HOOKS
 */

/**
 * Injects a floating validation bar at the bottom to transition the specific audit program through gates
 */
function renderProgramWorkflowGatingControls(trackingState, activeUserRole, refNum) {
    let panel = document.getElementById("sentinel-program-workflow-panel");
    if (!panel) {
        panel = document.createElement("div");
        panel.id = "sentinel-program-workflow-panel";
        panel.className = "p-4 my-6 bg-slate-50 dark:bg-[#111315] border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4 max-w-[1600px] mx-auto no-print shadow-sm";
        const mainWorkspace = document.getElementById("active-program-workspace");
        if (mainWorkspace) mainWorkspace.appendChild(panel);
    }

    const badgeColorMap = {
        "Draft": "bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-400",
        "Pending_Lead": "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
        "Pending_Reviewer": "bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-300",
        "Pending_Approver": "bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300",
        "Approved": "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
        "Returned_To_Officer": "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300",
        "Returned_To_Lead": "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
    };

    const statusStyle = badgeColorMap[trackingState.status] || "bg-slate-100 text-slate-800";
    let interfaceActionsHtml = "";
    const isHolder = activeUserRole === trackingState.currentHolder;

    if (isHolder && trackingState.status !== "Approved") {
        interfaceActionsHtml = `
            <div class="flex items-center gap-2">
                <input type="text" id="txt-stage-remarks" placeholder="Enter review remarks..." class="bg-[#1e293b] border border-slate-700/50 p-2 text-xs rounded text-white focus:outline-none w-56">
                ${activeUserRole === "officer" ? `
                    <button onclick="commitProgramStageTransition('${refNum}', 'Pending_Lead')" class="px-3 py-2 text-xs font-black uppercase tracking-wider bg-sky-600 hover:bg-sky-700 text-white rounded">Submit Program</button>
                ` : activeUserRole === "leadauditor" ? `
                    <button onclick="commitProgramStageTransition('${refNum}', 'Pending_Reviewer')" class="px-3 py-2 text-xs font-black uppercase tracking-wider bg-sky-600 hover:bg-sky-700 text-white rounded">To Reviewer</button>
                    <button onclick="commitProgramStageTransition('${refNum}', 'Returned_To_Officer')" class="px-3 py-2 text-xs font-black uppercase tracking-wider bg-amber-600 hover:bg-amber-700 text-white rounded">Return</button>
                ` : activeUserRole === "reviewer" ? `
                    <button onclick="commitProgramStageTransition('${refNum}', 'Pending_Approver')" class="px-3 py-2 text-xs font-black uppercase tracking-wider bg-indigo-600 hover:bg-indigo-700 text-white rounded">To Approver</button>
                    <button onclick="commitProgramStageTransition('${refNum}', 'Returned_To_Lead')" class="px-3 py-2 text-xs font-black uppercase tracking-wider bg-amber-600 hover:bg-amber-700 text-white rounded">Return</button>
                ` : activeUserRole === "approver" ? `
                    <button onclick="commitProgramStageTransition('${refNum}', 'Approved')" class="px-3 py-2 text-xs font-black uppercase tracking-wider bg-emerald-600 hover:bg-emerald-700 text-white rounded">Approve & Sign</button>
                    <button onclick="commitProgramStageTransition('${refNum}', 'Returned_To_Officer')" class="px-3 py-2 text-xs font-black uppercase tracking-wider bg-rose-600 hover:bg-rose-700 text-white rounded">Reject</button>
                ` : ""}
            </div>`;
    } else {
        interfaceActionsHtml = `<div class="text-xs text-slate-500 font-bold uppercase tracking-wider">
            ${trackingState.status === "Approved" ? "✓ Execution Program Signed & Authorized" : `⏳ Awaiting verification by role [${trackingState.currentHolder.toUpperCase()}]`}
        </div>`;
    }

    panel.innerHTML = `
        <div class="flex items-center gap-3">
            <span class="text-xs font-black uppercase tracking-widest text-slate-400">Program Status Gate:</span>
            <span class="px-2.5 py-1 rounded text-xs font-black font-mono uppercase tracking-wider ${statusStyle}">
                ${trackingState.status.replace(/_/g, ' ')}
            </span>
        </div>
        ${interfaceActionsHtml}
    `;
}

/**
 * Executes secure tracking transitions upstream linked to specific audit entries
 */
async function commitProgramStageTransition(refNum, targetStatus) {
    const store = window.AuditStore;
    if (!store || !store.current) return;

    const remarksInput = document.getElementById("txt-stage-remarks");
    const actualRemarks = remarksInput ? remarksInput.value.trim() : "";

    if (!actualRemarks && targetStatus.startsWith("Returned")) {
        alert("Action Required: Please provide explanatory remarks detailing your reason for rejecting or returning this configuration.");
        return;
    }

    const actingUserRole = localStorage.getItem("sentinel_active_role") || "officer";
    let nextHolder = actingUserRole;

    if (targetStatus === "Pending_Lead") nextHolder = "leadauditor";
    else if (targetStatus === "Pending_Reviewer") nextHolder = "reviewer";
    else if (targetStatus === "Pending_Approver") nextHolder = "approver";
    else if (targetStatus === "Approved") nextHolder = "officer";
    else if (targetStatus === "Returned_To_Officer") nextHolder = "officer";
    else if (targetStatus === "Returned_To_Lead") nextHolder = "leadauditor";

    const programState = store.current.phase2_performing.planProgram.audits[refNum];
    if (programState) {
        programState.trackingState = {
            status: targetStatus,
            currentHolder: nextHolder,
            remarks: actualRemarks || `Program validation passed cleanly to ${targetStatus}`
        };
    }

    try {
        await commitProgramWorkspaceState();
        await store.writeSystemAuditLog(`Transitioned Program [${refNum}] state matrix to status [${targetStatus}] held by [${nextHolder}].`);
        alert(`Audit Program status successfully updated to: ${targetStatus.replace(/_/g, ' ')}`);
    } catch (err) {
        alert("Failed to sync validation variables up to firestore collections.");
    }
}

async function finalizeProgramAndProceedToDraft() {
    const store = window.AuditStore;
    if (!store || !store.current) return;

    const workPlanList = store.current.phase1_planning?.workPlan || [];
    const targetRow = workPlanList[activeTargetIndex] || workPlanList[0];
    if (!targetRow) return;

    const programState = store.current.phase2_performing?.planProgram?.audits?.[targetRow.refNumber];
    if (programState?.trackingState?.status !== "Approved") {
        alert("Pipeline Constraint: You cannot advance to the Draft Report phase until this program has been fully 'Approved' and signed off by the authorization authority.");
        return;
    }

    try {
        await commitProgramWorkspaceState();
        if (typeof store.carryToDraft === 'function') store.carryToDraft();
        window.location.href = "Draft_Audit_Report.html";
    } catch(err) {
        alert("Error advancing pipeline state.");
    }
}

function triggerWorkspaceReset() {
    if (confirm("Are you sure you want to reset Phase 2 local configurations for this audit? All checklist entries will be wiped out.")) {
        const store = window.AuditStore;
        if (store && store.current) {
            const workPlanList = store.current.phase1_planning?.workPlan || [];
            const targetRow = workPlanList[activeTargetIndex] || workPlanList[0];
            if (!targetRow) return;

            const refNum = targetRow.refNumber;
            if (store.current.phase2_performing.planProgram.audits?.[refNum]) {
                delete store.current.phase2_performing.planProgram.audits[refNum];
                store.save();
            }
        }
    }
}

function populateTargetRiskSelector(workPlanList) {
    const select = document.getElementById("sel-audit-target");
    if (!select) return;
    
    if (select.options.length > 0) {
        if (parseInt(select.value) !== activeTargetIndex) {
            select.value = activeTargetIndex;
        }
        return;
    }

    select.innerHTML = "";
    workPlanList.forEach((row, index) => {
        const opt = document.createElement("option");
        opt.value = index;
        opt.textContent = `[${row.refNumber}] ${row.auditAreaReplica}`;
        if (index === activeTargetIndex) opt.selected = true;
        select.appendChild(opt);
    });
    
    select.value = activeTargetIndex;
}

function setTextAreaValWithoutFocusLoss(elementId, textValue) {
    const el = document.getElementById(elementId);
    if (el && !el.matches(':focus')) {
        el.value = (textValue !== undefined && textValue !== null) ? textValue : "";
    }
}

function setInputValWithoutFocusLoss(elementId, textValue) {
    const el = document.getElementById(elementId);
    if (el && !el.matches(':focus')) {
        el.value = (textValue !== undefined && textValue !== null) ? textValue : "";
    }
}

function handleTargetRiskSwitch(selectedDropdownValueIndex) {
    activeTargetIndex = parseInt(selectedDropdownValueIndex);
    if (window.AuditStore && window.AuditStore.current) {
        renderPlanProgramWorkspace(window.AuditStore.current);
    }
}

function getAuditStore() {
    return window.AuditStore?.current;
}
