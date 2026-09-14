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
            renderPlanProgramWorkspace(snapshotData);
        });
    }
});

/**
 * Parses cloud snapshots to load metrics cards and checklist steps
 */
function renderPlanProgramWorkspace(data) {
    const workPlanList = data?.phase1_planning?.workPlan || [];
    const meta = data?.phase1_planning?.workPlanMetadata || {};
    const programState = data?.phase2_performing?.planProgram || {};
    
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

    // Isolate active target row parameters
    const targetRow = workPlanList[activeTargetIndex] || workPlanList[0];

    // --- PIPELINE INHERITANCE: DATA FIELDS PULLED FROM PHASE 1 ---
    document.getElementById("lbl-pull-title").textContent = targetRow.auditAreaReplica || "—";
    document.getElementById("lbl-pull-department").textContent = targetRow.physicalItResources || "Operations / Infrastructure";
    document.getElementById("lbl-pull-period").textContent = `${targetRow.startDate || '—'} to ${targetRow.endDate || '—'}`;
    document.getElementById("lbl-pull-duration").textContent = `${targetRow.durationValue || 4} ${targetRow.scale || 'Weeks'}`;

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

    // Populate Baseline Resource Lock Parameter Cards
    document.getElementById("card-lock-budget").textContent = new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(targetRow.budgetKsh || 0);
    document.getElementById("card-lock-headcount").textContent = `${targetRow.noOfAuditors || 1} Professional(s)`;
    document.getElementById("card-lock-lead").textContent = targetRow.leadAuditor || "—";
    document.getElementById("card-lock-team").textContent = [targetRow.auditor1, targetRow.auditor2].filter(Boolean).join(", ") || "—";
    document.getElementById("card-lock-minute").textContent = meta.minuteNumberRef || "—";

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

function setTextAreaValWithoutFocusLoss(elementId, textValue) {
    const el = document.getElementById(elementId);
    if (el && !el.matches(':focus')) el.value = textValue;
}

function setInputValWithoutFocusLoss(elementId, textValue) {
    const el = document.getElementById(elementId);
    if (el && !el.matches(':focus')) el.value = textValue;
}

/**
 * Dynamically builds row target links based on available options
 */
function populateTargetRiskSelector(workPlanList) {
    const select = document.getElementById("sel-audit-target");
    if (!select || select.options.length > 0) return; 

    workPlanList.forEach((row, index) => {
        const opt = document.createElement("option");
        opt.value = index;
        opt.textContent = `[${row.refNumber}] ${row.auditAreaReplica}`;
        select.appendChild(opt);
    });
}

function handleTargetRiskSwitch(selectedDropdownValueIndex) {
    activeTargetIndex = parseInt(selectedDropdownValueIndex);
    if (window.AuditStore && window.AuditStore.current) {
        renderPlanProgramWorkspace(window.AuditStore.current);
    }
}
/**
 * Global Store Helper
 * Ensures safe, unified access to the application state.
 */
const getAuditStore = () => window.AuditStore?.current;

/**
 * UI Rendering
 * Builds table checklists matching individual program execution steps.
 */
function renderProgramChecklistStepsTable(stepsArray, targetRow) {
    const tbody = document.getElementById("tbl-program-steps-body");
    if (!tbody) return;
    tbody.innerHTML = "";

    // Seed initial fallback row templates matching design rules
    if (stepsArray.length === 0) {
        stepsArray = [{ 
            SN: 1, 
            obj: "Verify structural perimeter rule update timestamps.", 
            risk: "Configuration lags", 
            activity: "Inspection", 
            instructions: "Examine firewall change log records across historical deployment pools.", 
            lead: targetRow?.leadAuditor || "—", 
            status: "Pending" 
        }];
        
        const store = getAuditStore();
        if (store) store.phase2_performing.planProgram.steps = stepsArray;
    }

    stepsArray.forEach((step, index) => {
        const tr = document.createElement("tr");
        tr.className = "border-b border-outline-variant/30 dark:border-slate-800 last:border-0 hover:bg-surface-container-low dark:hover:bg-slate-900/40 align-middle transition-colors";
        
        tr.innerHTML = `
            <td class="p-3 text-center text-xs font-mono font-bold text-on-surface-variant">${index + 1}</td>
            <td class="p-2">${window.cellInput(`step-${index}-obj`, "Target Objective", step.obj || "")}</td>
            <td class="p-2">${window.cellInput(`step-${index}-risk`, "Risk Association", step.risk || "")}</td>
            <td class="p-2">${window.cellInput(`step-${index}-activity`, "Core Activity", step.activity || "")}</td>
            <td class="p-2">
                <textarea name="step-${index}-instructions" rows="2" placeholder="Instructions..." class="w-full bg-transparent border-0 focus:ring-0 text-xs p-1">${window.escapeAttr(step.instructions || "")}</textarea>
            </td>
            <td class="p-2">${window.cellInput(`step-${index}-lead`, "Lead Officer", step.lead || "")}</td>
            <td class="p-2">
                <select name="step-${index}-status" class="w-full text-xs bg-transparent border-0 focus:ring-0">
                    <option value="Pending" ${step.status === 'Pending' ? 'selected' : ''}>Pending</option>
                    <option value="In Progress" ${step.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                    <option value="Completed" ${step.status === 'Completed' ? 'selected' : ''}>Completed</option>
                </select>
            </td>
            <td class="p-3 text-center">
                <button onclick="removeChecklistStepRow(${index})" class="text-red-500 hover:text-red-700 font-bold text-xs uppercase tracking-wider">Remove</button>
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
 */
function addChecklistStepRow() {
    const store = getAuditStore();
    if (!store) return;
    
    // Fallback context handling for active indices
    const activeIndex = window.activeTargetIndex ?? 0; 
    const steps = store.phase2_performing.planProgram.steps || [];
    const targetRow = store.phase1_planning.workPlan?.[activeIndex] || {};
    
    steps.push({
        obj: "", 
        risk: "", 
        activity: "", 
        instructions: "", 
        lead: targetRow.leadAuditor || "", 
        status: "Pending"
    });
    
    renderProgramChecklistStepsTable(steps, targetRow);
}

async function removeChecklistStepRow(index) {
    const store = getAuditStore();
    if (!store) return;
    
    const steps = store.phase2_performing.planProgram.steps;
    steps.splice(index, 1);
    
    try {
        await window.AuditStore.save();
        // Refresh the layout after dynamic remote deletion
        const targetRow = store.phase1_planning.workPlan?.[window.activeTargetIndex ?? 0] || {};
        renderProgramChecklistStepsTable(steps, targetRow);
    } catch (err) {
        alert("Cloud deletion error.");
    }
}



function saveChecklistStepRowInlineData(index, trElement) {
    const store = getAuditStore();
    if (!store) return;

    const step = store.phase2_performing.planProgram.steps[index];
    if (!step) return;

    // Direct assignment via element lookup strategies
    step.obj = trElement.querySelector(`[name="step-${index}-obj"]`)?.value || "";
    step.risk = trElement.querySelector(`[name="step-${index}-risk"]`)?.value || "";
    step.activity = trElement.querySelector(`[name="step-${index}-activity"]`)?.value || "";
    step.instructions = trElement.querySelector(`[name="step-${index}-instructions"]`)?.value || "";
    step.lead = trElement.querySelector(`[name="step-${index}-lead"]`)?.value || "";
    step.status = trElement.querySelector(`[name="step-${index}-status"]`)?.value || "";
}


/**
 * Pushes general context narrative field sets to the active database structure model
 */
async function commitProgramWorkspaceState() {
    const store = window.AuditStore;
    if (!store || !store.current) return;

    const programState = store.current.phase2_performing.planProgram;
    
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
        store.carryToDraft();
        window.location.href = "Draft_Audit_Report.html";
    } catch(err) {
        alert("Error advancing pipeline state.");
    }
}

function triggerWorkspaceReset() {
    if (confirm("Are you sure you want to reset Phase 2 local configurations? All checklist entries will be wiped out.")) {
        if (window.AuditStore) {
            window.AuditStore.current.phase2_performing.planProgram = window.AuditStore.getInitialSchemaBlueprint().phase2_performing.planProgram;
            window.AuditStore.save();
        }
    }
}
