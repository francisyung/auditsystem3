/**
 * Sentinel Core Audit Plan & Program Controller Module
 * Handles real-time cloud tracking and single-audit risk target parsing for Phase 2 Stage 1.
 */

// Volatile track index targeting the specific active audit line row from Phase 1
let activeTargetIndex = 0; 

document.addEventListener("DOMContentLoaded", () => {
    if (window.Theme) window.Theme.init();
    
    // Connect live cloud listener subscription hook
    if (window.AuditStore) {
        window.AuditStore.subscribeToAudit((snapshotData) => {
            // Read selection context tracker pointer key from master cloud planning layer
            let cloudIndex = snapshotData?.phase1_planning?.selectedExecutionId;
            if (cloudIndex !== undefined && cloudIndex !== null) {
                activeTargetIndex = parseInt(cloudIndex);
            }
            renderPlanProgramWorkspace(snapshotData);
        });
    }
});


/**
 * Parses cloud snapshots to load metrics cards and checklist steps
 */
/**
 * Parses cloud snapshots to load metrics cards and checklist steps safely
 */
function renderPlanProgramWorkspace(data) {
    const workPlanList = data?.phase1_planning?.workPlan || [];
    const meta = data?.phase1_planning?.workPlanMetadata || {};
    const planProgram = data?.phase2_performing?.planProgram || {};
    
    // Fallback protection if no planning models are committed
    if (workPlanList.length === 0) {
        document.getElementById("empty-program-state")?.classList.remove("hidden");
        document.getElementById("active-program-workspace")?.classList.add("hidden");
        return;
    }

    document.getElementById("empty-program-state")?.classList.add("hidden");
    document.getElementById("active-program-workspace")?.classList.remove("hidden");

    // Populate targeted selectable risk lines in the dropdown filter
    populateTargetRiskSelector(workPlanList);

    // Isolate active target row parameters safely
    const targetRow = workPlanList[activeTargetIndex] || workPlanList[0];
    if (!targetRow) return;
    
    const refNum = targetRow.refNumber;

    // --- PER-AUDIT ISOLATION LAYER ---
    // Extract workspace state specifically linked to this audit area's unique ref number
    if (!planProgram.audits) planProgram.audits = {};
    if (!planProgram.audits[refNum]) planProgram.audits[refNum] = {};
    const programState = planProgram.audits[refNum];

    // --- PIPELINE INHERITANCE: DATA FIELDS PULLED FROM PHASE 1 (WITH CRASH PROTECTION) ---
    const elTitle = document.getElementById("lbl-pull-title");
    const elDept = document.getElementById("lbl-pull-department");
    const elPeriod = document.getElementById("lbl-pull-period");
    const elDuration = document.getElementById("lbl-pull-duration");

    if (elTitle) elTitle.textContent = targetRow.auditAreaReplica || "—";
    if (elDept) elDept.textContent = targetRow.physicalItResources || "Operations / Infrastructure";
    if (elPeriod) elPeriod.textContent = `${targetRow.startDate || '—'} to ${targetRow.endDate || '—'}`;
    if (elDuration) elDuration.textContent = `${targetRow.durationValue || 4} ${targetRow.scale || 'Weeks'}`;

    // --- CONSOLIDATED EDITABLE LOGIC ---
    // If the user has saved an addition, use it. Otherwise, populate the textarea with the inherited Phase 1 value as default fallback text.
    const riskContent = programState.risksAdditions || targetRow.riskDescription || "";
    const objectiveContent = programState.auditObjectivesAdditions || targetRow.auditObjectives || "";
    const scopeContent = programState.auditScopeAdditions || targetRow.auditScopeBoundaries || "";

    setTextAreaValWithoutFocusLoss("txt-add-risks", riskContent);
    setTextAreaValWithoutFocusLoss("txt-add-objectives", objectiveContent);
    setTextAreaValWithoutFocusLoss("txt-add-scope", scopeContent);
    
    setTextAreaValWithoutFocusLoss("txt-intro-bg", programState.introductionBackground || "");
    setTextAreaValWithoutFocusLoss("txt-methodology", programState.methodology || "");
    setTextAreaValWithoutFocusLoss("txt-benchmarks", programState.evaluationCriteria || "");

    // Populate Baseline Resource Lock Parameter Cards (Safely checked)
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

    // --- AUTHENTICATION SIGN-OFF BLOCKS PATHS ---
    setInputValWithoutFocusLoss("sign-prep-name", programState.prepName || "");
    setInputValWithoutFocusLoss("sign-prep-date", programState.prepDate || "");
    setInputValWithoutFocusLoss("sign-rev-name", programState.revName || "");
    setInputValWithoutFocusLoss("sign-rev-date", programState.revDate || "");
    setInputValWithoutFocusLoss("sign-app-name", programState.appName || "");
    setInputValWithoutFocusLoss("sign-app-date", programState.appDate || "");

    // --- RENDER EXECUTION CHECKLIST SUB-TABLE ---
    renderProgramChecklistStepsTable(programState.steps || [], targetRow);
}


/**
 * UI Rendering
 * Builds table checklists matching individual program execution steps.
 */
/**
 * UI Rendering
 * Builds table checklists matching individual program execution steps.
 */
function renderProgramChecklistStepsTable(stepsArray, targetRow) {
    // FIXED: Changed from "tbl-program-steps-body" to match your HTML "program-body"
    const tbody = document.getElementById("program-body");
    if (!tbody) {
        console.warn("⚠️ HTML target element container '#program-body' was not found on the DOM layout tree.");
        return;
    }
    tbody.innerHTML = "";

    const refNum = targetRow.refNumber;

    // Seed initial fallback row templates matching design rules if empty
    if (stepsArray.length === 0) {
        stepsArray = [{ 
            obj: "Verify structural perimeter rule update timestamps.", 
            risk: "Configuration lags", 
            activity: "Inspection", 
            instructions: "Examine firewall change log records across historical deployment pools.", 
            lead: targetRow?.leadAuditor || "—", 
            status: "Pending" 
        }];
        
        const store = getAuditStore();
        if (store) {
            if (!store.phase2_performing.planProgram.audits) store.phase2_performing.planProgram.audits = {};
            if (!store.phase2_performing.planProgram.audits[refNum]) store.phase2_performing.planProgram.audits[refNum] = {};
            store.phase2_performing.planProgram.audits[refNum].steps = stepsArray;
        }
    }

        stepsArray.forEach((step, index) => {
        const tr = document.createElement("tr");
        tr.className = "border-b border-slate-200 dark:border-slate-800/60 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-900/40 align-middle transition-colors";
        
        tr.innerHTML = `
            <!-- 1. Serial Number Label Row -->
            <td class="p-3 text-center text-xs font-mono font-bold text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-slate-900/20 w-12">${index + 1}</td>
            
            <!-- 2. Targeted Goal Objective Field Box -->
            <td class="p-2 min-w-[180px] max-w-[220px]">
                <div class="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0d0e10] p-1 shadow-sm focus-within:border-sky-500 transition-colors">
                    ${window.cellInput(`step-\${index}-obj`, "Target Objective", step.obj || "", "text", "px-2 py-1 bg-transparent border-0 focus:ring-0 text-xs w-full")}
                </div>
            </td>
            
            <!-- 3. Associated Vectors Risk Box -->
            <td class="p-2 min-w-[180px] max-w-[220px]">
                <div class="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0d0e10] p-1 shadow-sm focus-within:border-sky-500 transition-colors">
                    ${window.cellInput(`step-\${index}-risk`, "Risk Association", step.risk || "", "text", "px-2 py-1 bg-transparent border-0 focus:ring-0 text-xs w-full")}
                </div>
            </td>
            
            <!-- 4. Core Substantive Audit Activities -->
            <td class="p-2 min-w-[180px] max-w-[220px]">
                <div class="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0d0e10] p-1 shadow-sm focus-within:border-sky-500 transition-colors">
                    ${window.cellInput(`step-\${index}-activity`, "Core Activity", step.activity || "", "text", "px-2 py-1 bg-transparent border-0 focus:ring-0 text-xs w-full")}
                </div>
            </td>
            
            <!-- 5. Multi-line Instructions Area Box -->
            <td class="p-2 min-w-[260px] flex-1">
                <textarea 
                    name="step-${index}-instructions" 
                    rows="2" 
                    placeholder="Instructions..." 
                    class="w-full bg-white dark:bg-[#0d0e10] border border-slate-200 dark:border-slate-700 text-xs rounded-lg p-2 focus:outline-none focus:border-sky-500 shadow-sm transition-colors resize-y min-h-[42px]"
                >${window.escapeAttr(step.instructions || "")}</textarea>
            </td>
            
            <!-- 6. Status Selection (Now cleanly placed under the Status / Remarks Column) -->
            <td class="p-2 w-40">
                <select 
                    name="step-${index}-status" 
                    class="w-full text-xs font-semibold bg-white dark:bg-[#0d0e10] border border-slate-200 dark:border-slate-700 rounded-lg p-2 shadow-sm focus:outline-none focus:border-sky-500 cursor-pointer"
                >
                    <option value="Pending" ${step.status === 'Pending' ? 'selected' : ''}>⏳ Pending</option>
                    <option value="In Progress" ${step.status === 'In Progress' ? 'selected' : ''}>⚡ In Progress</option>
                    <option value="Completed" ${step.status === 'Completed' ? 'selected' : ''}>✅ Completed</option>
                </select>
            </td>
            
            <!-- 7. Interactive Actions Command Row (Now directly above REMOVE button) -->
            <td class="p-3 text-center w-24 no-print">
                <button 
                    onclick="removeChecklistStepRow(${index})" 
                    class="px-2 py-1.5 text-[10px] font-black uppercase tracking-wider text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-md transition-colors"
                >
                    Remove
                </button>
            </td>
        `;
        
        // Attach change listeners to cells to track inline input entries
        tr.querySelectorAll("input, select, textarea").forEach(inputElement => {
            inputElement.addEventListener("change", () => saveChecklistStepRowInlineData(index, tr));
        });

        tbody.appendChild(tr);
    });

}


/**
 * Data Mutations / CRUD Operations
 * FIXED: Enabled automatic sync commit so the procedure addition populates immediately on screen
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
        // Direct commit ensures real-time UI synchronization without reset wipes
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

    // Use flexible, name-ending wildcards to bypass formatting issues from window.cellInput
    step.obj = trElement.querySelector(`input[name*="obj"], [name$="obj"]`)?.value || trElement.querySelector(`input:nth-child(1)`)?.value || "";
    step.risk = trElement.querySelector(`input[name*="risk"], [name$="risk"]`)?.value || "";
    step.activity = trElement.querySelector(`input[name*="activity"], [name$="activity"]`)?.value || "";
    step.instructions = trElement.querySelector(`textarea[name*="instructions"]`)?.value || "";
    step.status = trElement.querySelector(`select`)?.value || "Pending";
    
    // Automatically save text changes behind the scenes cleanly
    window.AuditStore.save();
}


/**
 * Pushes general context narrative field sets to the active database structure model
 */
async function commitProgramWorkspaceState() {
    const store = window.AuditStore;
    if (!store || !store.current) return;

    const workPlanList = store.current.phase1_planning?.workPlan || [];
    const targetRow = workPlanList[activeTargetIndex] || workPlanList[0];
    if (!targetRow) return;

    const refNum = targetRow.refNumber;
    const planProgram = store.current.phase2_performing.planProgram;

    if (!planProgram.audits) planProgram.audits = {};
    if (!planProgram.audits[refNum]) planProgram.audits[refNum] = {};
    
    const programState = planProgram.audits[refNum];
    
    programState.risksAdditions = document.getElementById("txt-add-risks").value;
    programState.auditObjectivesAdditions = document.getElementById("txt-add-objectives").value;
    programState.auditScopeAdditions = document.getElementById("txt-add-scope").value;
    
    programState.introductionBackground = document.getElementById("txt-intro-bg").value;
    programState.methodology = document.getElementById("txt-methodology").value;
    programState.evaluationCriteria = document.getElementById("txt-benchmarks").value;

    programState.prepName = document.getElementById("sign-prep-name").value;
    programState.prepDate = document.getElementById("sign-prep-date").value;
    programState.revName = document.getElementById("sign-rev-name").value;
    programState.revDate = document.getElementById("sign-rev-date").value;
    programState.appName = document.getElementById("sign-app-name").value;
    programState.appDate = document.getElementById("sign-app-date").value;

    try {
        await store.save();
        alert("Audit execution checkpoints and narrative modifications synchronized up to Firestore cloud nodes! 🌐");
    } catch (err) {
        alert("Failed to sync structural program data fields.");
    }
}

/**
 * Finalizes data entries and pipelines parameters directly into Stage 2 Draft Reports
 */
async function finalizeProgramAndProceedToDraft() {
    const store = window.AuditStore;
    if (!store || !store.current) return;

    try {
        await commitProgramWorkspaceState();
        
        // Trigger the internal relational cloud data routing inheritance logic
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
/**
 * Dynamically builds row target links based on available options inside the selector dropdown
 */
/**
 * Dynamically builds row target links based on available options inside the selector dropdown
 */
function populateTargetRiskSelector(workPlanList) {
    const select = document.getElementById("sel-audit-target");
    if (!select) return;
    
    // If options are already loaded, just sync the current selection value state
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
        if (index === activeTargetIndex) {
            opt.selected = true;
        }
        select.appendChild(opt);
    });
    
    // Explicit safety sync
    select.value = activeTargetIndex;
}

/**
 * Safe text update routine preventing cursor reset focus issues during typing inputs
 */
function setTextAreaValWithoutFocusLoss(elementId, textValue) {
    const el = document.getElementById(elementId);
    if (el && !el.matches(':focus')) el.value = textValue;
}

/**
 * Safe single-line input field update routine matching focus boundary criteria
 */
function setInputValWithoutFocusLoss(elementId, textValue) {
    const el = document.getElementById(elementId);
    if (el && !el.matches(':focus')) el.value = textValue;
}

/**
 * Event hook handler that swaps active context index spaces when choosing different audit metrics
 */
function handleTargetRiskSwitch(selectedDropdownValueIndex) {
    activeTargetIndex = parseInt(selectedDropdownValueIndex);
    if (window.AuditStore && window.AuditStore.current) {
        renderPlanProgramWorkspace(window.AuditStore.current);
    }
}

/**
 * Global Store Helper
 * Ensures safe, unified access to the application state memory payload.
 */
function getAuditStore() {
    return window.AuditStore?.current;
}
