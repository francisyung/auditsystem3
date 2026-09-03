/**
 * Sentinel Core Draft Audit Report Controller Module
 * Governs report synthesis narratives, findings tables, appendix items, and cloud streams for Phase 2 Stage 2.
 */

// Track index targeting the specific active audit line row from Phase 1
let activeTargetIndex = 0; 

document.addEventListener("DOMContentLoaded", () => {
    if (window.Theme) window.Theme.init();
    
    // Connect live cloud listener subscription hook
    if (window.AuditStore) {
        window.AuditStore.subscribeToAudit((snapshotData) => {
            renderDraftReportWorkspace(snapshotData);
        });
    }
});

/**
 * Parses cloud snapshots to load baseline variables and interactive lists
 */
function renderDraftReportWorkspace(data) {
    const workPlanList = data?.phase1_planning?.workPlan || [];
    const draftState = data?.phase2_performing?.draftReport || {};
    
    if (workPlanList.length === 0) {
        document.getElementById("empty-draft-state")?.classList.remove("hidden");
        document.getElementById("active-draft-workspace")?.classList.add("hidden");
        return;
    }

    document.getElementById("empty-draft-state")?.classList.add("hidden");
    document.getElementById("active-draft-workspace")?.classList.remove("hidden");

    // Populate targeted selectable risk lines in the dropdown filter
    populateTargetRiskSelector(workPlanList);

    // Isolate active target row parameters
    const targetRow = workPlanList[activeTargetIndex] || workPlanList[0];

    // --- PIPELINE INHERITANCE: READ-ONLY BASELINE CARRIED FROM PLAN ---
    document.getElementById("lbl-pull-title").textContent = targetRow.auditAreaReplica || "—";
    document.getElementById("lbl-pull-bg").textContent = data?.phase2_performing?.planProgram?.introductionBackground || "—";
    document.getElementById("lbl-pull-risks").textContent = targetRow.riskDescription || "—";
    document.getElementById("lbl-pull-objectives").textContent = targetRow.auditObjectives || "—";
    document.getElementById("lbl-pull-scope").textContent = targetRow.auditScopeBoundaries || "—";
    document.getElementById("lbl-pull-methodology").textContent = data?.phase2_performing?.planProgram?.methodology || "—";
    document.getElementById("lbl-pull-criteria").textContent = data?.phase2_performing?.planProgram?.evaluationCriteria || "—";
    document.getElementById("lbl-pull-duration").textContent = `${targetRow.durationValue || 4} ${targetRow.scale || 'Weeks'}`;

    // --- POPULATE EXECUTIVE SUMMARY SEGMENTS CANVAS AREAS WITHOUT FOCUS HIJACKING ---
    const segments = draftState.executiveSummarySegments || {};
    setTextAreaValWithoutFocusLoss("txt-exec-intro",      segments.introduction || "");
    setTextAreaValWithoutFocusLoss("txt-exec-objectives", segments.objectives || "");
    setTextAreaValWithoutFocusLoss("txt-exec-findings",   segments.findings || "");
    setTextAreaValWithoutFocusLoss("txt-exec-conclusion", segments.conclusion || "");

    // --- REVIEW AND SIGN-OFF INPUT LINES ---
    setInputValWithoutFocusLoss("sign-rev1-name", draftState.reviewer1Name || "");
    setInputValWithoutFocusLoss("sign-rev1-date", draftState.reviewer1Date || "");
    setInputValWithoutFocusLoss("sign-rev2-name", draftState.reviewer2Name || "");
    setInputValWithoutFocusLoss("sign-rev2-date", draftState.reviewer2Date || "");
    setInputValWithoutFocusLoss("sign-auth-name", draftState.authorizerName || "");
    setInputValWithoutFocusLoss("sign-auth-date", draftState.authorizerDate || "");

    // --- RENDER DYNAMIC TABLES ---
    renderFindingsMatrixTable(draftState.findings || [], targetRow);
    renderAppendicesMatrixTable(draftState.appendices || []);
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
 * Dynamically builds selection target options matching open plans
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
        renderDraftReportWorkspace(window.AuditStore.current);
    }
}

/**
 * Renders the dense Audit Findings, Recommendations & Responses sub-table
 */
function renderFindingsMatrixTable(findingsArray, targetRow) {
    const tbody = document.getElementById("tbl-findings-body");
    if (!tbody) return;
    tbody.innerHTML = "";

    // If empty, initialize an item structure with empty sub-leads properties
    if (findingsArray.length === 0) {
        findingsArray = [
            { 
                SN: 1, 
                objective: targetRow.auditObjectives || "", 
                // Audit Findings Breakdown leads
                observation: "",
                standard: "",
                practice: "",
                rootCause: "",
                implications: "",
                // Recommendations
                recommendations: "", 
                // Management Responses leads
                mgmtAction: "",
                mgmtTimeline: "",
                mgmtResponsible: ""
            }
        ];
        if (window.AuditStore?.current) window.AuditStore.current.phase2_performing.draftReport.findings = findingsArray;
    }

    findingsArray.forEach((finding, index) => {
        const tr = document.createElement("tr");
        tr.className = "border-b border-outline-variant/30 dark:border-slate-800 last:border-0 hover:bg-surface-container-low dark:hover:bg-slate-900/40 align-top transition-colors";
        
        tr.innerHTML = `
            <!-- S/No -->
            <td class="p-3 text-center text-xs font-mono font-bold text-on-surface-variant align-middle">${index + 1}</td>
            
            <!-- Objective -->
            <td class="p-2">
                <textarea name="find-${index}-obj" class="w-full bg-transparent border-0 focus:ring-0 text-xs p-1 min-h-[8rem] resize-y" placeholder="Objective...">${window.escapeAttr(finding.objective || "")}</textarea>
            </td>
            
            <!-- Audit Findings Breakdown Structure Fields -->
            <td class="p-3 space-y-3 bg-slate-50/40 dark:bg-slate-900/20">
                <div class="space-y-1">
                    <label class="block text-[11px] font-bold text-slate-700 dark:text-slate-400">• Observation:</label>
                    <textarea data-field="observation" class="w-full bg-white dark:bg-[#0d0e10] border border-outline-variant/40 dark:border-slate-700 rounded p-1.5 text-xs focus:ring-1 focus:ring-primary" rows="2" placeholder="Describe the core observation/gap...">${window.escapeAttr(finding.observation || "")}</textarea>
                </div>
                <div class="space-y-1">
                    <label class="block text-[11px] font-bold text-slate-700 dark:text-slate-400">• Standard:</label>
                    <textarea data-field="standard" class="w-full bg-white dark:bg-[#0d0e10] border border-outline-variant/40 dark:border-slate-700 rounded p-1.5 text-xs focus:ring-1 focus:ring-primary" rows="1" placeholder="What should be the standard or criteria?">${window.escapeAttr(finding.standard || "")}</textarea>
                </div>
                <div class="space-y-1">
                    <label class="block text-[11px] font-bold text-slate-700 dark:text-slate-400">• Practice:</label>
                    <textarea data-field="practice" class="w-full bg-white dark:bg-[#0d0e10] border border-outline-variant/40 dark:border-slate-700 rounded p-1.5 text-xs focus:ring-1 focus:ring-primary" rows="1" placeholder="What is the actual practice?">${window.escapeAttr(finding.practice || "")}</textarea>
                </div>
                <div class="space-y-1">
                    <label class="block text-[11px] font-bold text-slate-700 dark:text-slate-400">• Root-cause:</label>
                    <textarea data-field="rootCause" class="w-full bg-white dark:bg-[#0d0e10] border border-outline-variant/40 dark:border-slate-700 rounded p-1.5 text-xs focus:ring-1 focus:ring-primary" rows="1" placeholder="Why did this anomaly occur?">${window.escapeAttr(finding.rootCause || "")}</textarea>
                </div>
                <div class="space-y-1">
                    <label class="block text-[11px] font-bold text-slate-700 dark:text-slate-400">• Implications:</label>
                    <textarea data-field="implications" class="w-full bg-white dark:bg-[#0d0e10] border border-outline-variant/40 dark:border-slate-700 rounded p-1.5 text-xs focus:ring-1 focus:ring-primary" rows="1" placeholder="What is the exposure or risk risk impact?">${window.escapeAttr(finding.implications || "")}</textarea>
                </div>
            </td>
            
            <!-- Audit Recommendations -->
            <td class="p-2">
                <textarea name="find-${index}-rec" class="w-full bg-transparent border-0 focus:ring-0 text-xs p-1 text-sky-700 dark:text-sky-400 min-h-[8rem] resize-y" placeholder="Action directives...">${window.escapeAttr(finding.recommendations || "")}</textarea>
            </td>
            
            <!-- Management Responses Sub-Fields -->
            <td class="p-3 space-y-3 bg-emerald-50/20 dark:bg-emerald-950/10">
                <div class="space-y-1">
                    <label class="block text-[11px] font-bold text-emerald-800 dark:text-emerald-400">• Management Action:</label>
                    <textarea data-field="mgmtAction" class="w-full bg-white dark:bg-[#0d0e10] border border-outline-variant/40 dark:border-slate-700 rounded p-1.5 text-xs focus:ring-1 focus:ring-primary" rows="2" placeholder="Enter corrective actions response plan...">${window.escapeAttr(finding.mgmtAction || "")}</textarea>
                </div>
                <div class="space-y-1">
                    <label class="block text-[11px] font-bold text-emerald-800 dark:text-emerald-400">• Implementation timeline:</label>
                    <textarea data-field="mgmtTimeline" class="w-full bg-white dark:bg-[#0d0e10] border border-outline-variant/40 dark:border-slate-700 rounded p-1.5 text-xs focus:ring-1 focus:ring-primary" rows="1" placeholder="e.g., By Q4 2026 or Dec 31">${window.escapeAttr(finding.mgmtTimeline || "")}</textarea>
                </div>
                <div class="space-y-1">
                    <label class="block text-[11px] font-bold text-emerald-800 dark:text-emerald-400">• Responsible person:</label>
                    <textarea data-field="mgmtResponsible" class="w-full bg-white dark:bg-[#0d0e10] border border-outline-variant/40 dark:border-slate-700 rounded p-1.5 text-xs focus:ring-1 focus:ring-primary" rows="1" placeholder="Name / Title of Action Owner...">${window.escapeAttr(finding.mgmtResponsible || "")}</textarea>
                </div>
            </td>
            
            <!-- Actions Column -->
            <td class="p-3 text-center align-middle no-print">
                <button onclick="removeFindingMatrixRow(${index})" class="text-red-500 hover:text-red-700 font-bold text-xs uppercase tracking-wider transition">Remove</button>
            </td>
        `;
        
        // Setup change event triggers across all native & sub-lead components
        tr.querySelectorAll("textarea").forEach(tx => {
            tx.addEventListener("change", () => {
                // Ensure state saves correctly whether running via custom or standard attributes
                if (tx.hasAttribute('data-field')) {
                    const fieldName = tx.getAttribute('data-field');
                    findingsArray[index][fieldName] = tx.value;
                    // Trigger your parent save routine
                    if (typeof saveFindingsInlineData === 'function') {
                        saveFindingsInlineData(index, tr);
                    }
                } else {
                    // Fallback to name match for objective and recommendations columns
                    if (tx.name.includes("-obj")) findingsArray[index].objective = tx.value;
                    if (tx.name.includes("-rec")) findingsArray[index].recommendations = tx.value;
                    if (typeof saveFindingsInlineData === 'function') {
                        saveFindingsInlineData(index, tr);
                    }
                }
            });
        });

        tbody.appendChild(tr);
    });
}

function addFindingMatrixRow() {
    const store = window.AuditStore;
    if (!store || !store.current) return;
    
    const findings = store.current.phase2_performing.draftReport.findings || [];
    const targetRow = store.current.phase1_planning.workPlan[activeTargetIndex] || {};
    
    findings.push({
        objective: targetRow.auditObjectives || "", breakdown: "", recommendations: "", response: ""
    });
    
    renderFindingsMatrixTable(findings, targetRow);
}

async function removeFindingMatrixRow(index) {
    const store = window.AuditStore;
    if (!store || !store.current) return;
    
    store.current.phase2_performing.draftReport.findings.splice(index, 1);
    try {
        await store.save();
    } catch(err) {
        alert("Cloud deletion transaction error.");
    }
}

function saveFindingsInlineData(index, trElement) {
    const store = window.AuditStore;
    if (!store || !store.current) return;

    const finding = store.current.phase2_performing.draftReport.findings[index];
    if (!finding) return;

    finding.objective = trElement.querySelector(`[name="find-${index}-obj"]`).value;
    finding.breakdown = trElement.querySelector(`[name="find-${index}-breakdown"]`).value;
    finding.recommendations = trElement.querySelector(`[name="find-${index}-rec"]`).value;
    finding.response = trElement.querySelector(`[name="find-${index}-resp"]`).value;
}

/**
 * Renders the Document Appendices Matrix sub-table
 */
function renderAppendicesMatrixTable(appendicesArray) {
    const tbody = document.getElementById("tbl-appendices-body");
    if (!tbody) return;
    tbody.innerHTML = "";

    appendicesArray.forEach((app, index) => {
        const tr = document.createElement("tr");
        tr.className = "border-b border-outline-variant/30 dark:border-slate-800 last:border-0 hover:bg-surface-container-low dark:hover:bg-slate-900/40 align-middle transition-colors";
        
        tr.innerHTML = `
            <td class="p-3 text-center text-xs font-mono font-bold text-on-surface-variant">${index + 1}</td>
            <td class="p-2"><input type="text" name="app-${index}-ref" value="${window.escapeAttr(app.ref || '')}" placeholder="e.g. APP-01" class="w-full bg-transparent border-0 focus:ring-0 text-xs p-1 font-mono font-bold"></td>
            <td class="p-2"><input type="text" name="app-${index}-title" value="${window.escapeAttr(app.title || '')}" placeholder="Document Title..." class="w-full bg-transparent border-0 focus:ring-0 text-xs p-1"></td>
            <td class="p-2"><input type="text" name="app-${index}-hash" value="${window.escapeAttr(app.hash || '')}" placeholder="Secure storage link or hash identifier reference..." class="w-full bg-transparent border-0 focus:ring-0 text-xs p-1 text-slate-500 font-mono"></td>
            <td class="p-3 text-center">
                <button onclick="removeAppendixRow(${index})" class="text-red-500 hover:text-red-700 font-bold text-xs uppercase tracking-wider">Remove</button>
                       </td>
        `;
        
        tr.querySelectorAll("input").forEach(ip => {
            ip.addEventListener("change", () => saveAppendicesInlineData(index, tr));
        });

        tbody.appendChild(tr);
    });
}

function addAppendixMatrixRow() {
    const store = window.AuditStore;
    if (!store || !store.current) return;
    
    const appendices = store.current.phase2_performing.draftReport.appendices || [];
    appendices.push({ ref: `APP-0${appendices.length + 1}`, title: "", hash: "" });
    
    renderAppendicesMatrixTable(appendices);
}

async function removeAppendixRow(index) {
    const store = window.AuditStore;
    if (!store || !store.current) return;
    
    store.current.phase2_performing.draftReport.appendices.splice(index, 1);
    try {
        await store.save();
    } catch(err) {
        alert("Cloud deletion reference error.");
    }
}

function saveAppendicesInlineData(index, trElement) {
    const store = window.AuditStore;
    if (!store || !store.current) return;

    const app = store.current.phase2_performing.draftReport.appendices[index];
    if (!app) return;

    app.ref = trElement.querySelector(`[name="app-${index}-ref"]`).value;
    app.title = trElement.querySelector(`[name="app-${index}-title"]`).value;
    app.hash = trElement.querySelector(`[name="app-${index}-hash"]`).value;
}

/**
 * Syncs workspace inputs up to centralized Firestore schema collections
 */
async function commitDraftWorkspaceState() {
    const store = window.AuditStore;
    if (!store || !store.current) return;

    const draftState = store.current.phase2_performing.draftReport;
    
    // Safety check to ensure sub-object initialization
    if (!draftState.executiveSummarySegments) {
        draftState.executiveSummarySegments = {};
    }
    
    // Capture state values from individual segment textareas
    draftState.executiveSummarySegments.introduction = document.getElementById("txt-exec-intro").value;
    draftState.executiveSummarySegments.objectives   = document.getElementById("txt-exec-objectives").value;
    draftState.executiveSummarySegments.findings     = document.getElementById("txt-exec-findings").value;
    draftState.executiveSummarySegments.conclusion   = document.getElementById("txt-exec-conclusion").value;
    
    // --- REVIEW AND SIGN-OFF INPUT LINES ---
    draftState.reviewer1Name = document.getElementById("sign-rev1-name").value;
    draftState.reviewer1Date = document.getElementById("sign-rev1-date").value;
    draftState.reviewer2Name = document.getElementById("sign-rev2-name").value;
    draftState.reviewer2Date = document.getElementById("sign-rev2-date").value;
    draftState.authorizerName = document.getElementById("sign-auth-name").value;
    draftState.authorizerDate = document.getElementById("sign-auth-date").value;

    try {
        await store.save();
        alert("Draft report findings matrix and summary configurations synchronized up to Firestore nodes! 💾");
    } catch (err) {
        alert("Failed to sync structural draft report fields.");
    }
}

/**
 * Validates inputs and routes parameters directly into Stage 3 Final Reports
 */
async function finalizeDraftAndProceedToFinalReport() {
    const store = window.AuditStore;
    if (!store || !store.current) return;

    try {
        await commitDraftWorkspaceState();
        
        // Execute the internal pipeline step mirroring changes downstream
        store.carryToFinal();
        window.location.href = "Final_Audit_Report.html";
    } catch(err) {
        alert("Error advancing pipeline stage.");
    }
}

function routeBackToAuditProgram() {
    window.location.href = "Audit_Plan&Program.html";
}

        
