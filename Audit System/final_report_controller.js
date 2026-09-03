/**
 * Sentinel Core Final Audit Report Controller Module
 * Governs read-only executive narratives, corrective action evaluation checks, 
 * adequacy flag validation logic, and secure report circulation workflows for Phase 2 Stage 3.
 */

// Track index targeting the specific active audit line row from Phase 1
let activeTargetIndex = 0; 

document.addEventListener("DOMContentLoaded", () => {
    if (window.Theme) window.Theme.init();
    
    // Connect live cloud listener subscription hook
    if (window.AuditStore) {
        window.AuditStore.subscribeToAudit((snapshotData) => {
            renderFinalReportWorkspace(snapshotData);
        });
    }
});

/**
 * Parses cloud snapshots to load baseline data metrics and corporate verification states
 */
function renderFinalReportWorkspace(data) {
    const workPlanList = data?.phase1_planning?.workPlan || [];
    const planState = data?.phase2_performing?.planProgram || {};
    const draftState = data?.phase2_performing?.draftReport || {};
    const finalState = data?.phase2_performing?.finalReport || {};
    
    if (workPlanList.length === 0) {
        document.getElementById("empty-final-state")?.classList.remove("hidden");
        document.getElementById("active-final-workspace")?.classList.add("hidden");
        return;
    }

    document.getElementById("empty-final-state")?.classList.add("hidden");
    document.getElementById("active-final-workspace")?.classList.remove("hidden");

    // Populate targeted selectable risk lines in the dropdown filter
    populateTargetRiskSelector(workPlanList);

    // Isolate active target row parameters
    const targetRow = workPlanList[activeTargetIndex] || workPlanList;

    // --- PIPELINE INHERITANCE: DATA INITIALIZATION CARRIED FROM PLAN & DRAFT ---
    document.getElementById("lbl-pull-title").textContent = targetRow.auditAreaReplica || "—";
    document.getElementById("lbl-pull-department").textContent = targetRow.physicalItResources || "Operations / Infrastructure";
    document.getElementById("lbl-pull-period").textContent = `${targetRow.startDate || '—'} to ${targetRow.endDate || '—'}`;
    
    // Core Read-Only Narrative Synthesis Boards
    document.getElementById("lbl-pull-summary").textContent = draftState.executiveSummary || "—";
    document.getElementById("lbl-pull-bg").textContent = planState.introductionBackground || "—";
    document.getElementById("lbl-pull-risks").textContent = targetRow.riskDescription || "—";
    document.getElementById("lbl-pull-objectives").textContent = targetRow.auditObjectives || "—";
    document.getElementById("lbl-pull-scope").textContent = targetRow.auditScopeBoundaries || "—";
    document.getElementById("lbl-pull-methodology").textContent = planState.methodology || "—";
    document.getElementById("lbl-pull-criteria").textContent = planState.evaluationCriteria || "—";
    document.getElementById("lbl-pull-duration").textContent = `${targetRow.durationValue || 4} ${targetRow.scale || 'Weeks'}`;

    // --- SECURE AUTHORIZATION SIGN-OFF PARAMETERS ---
    setInputValWithoutFocusLoss("txt-auth-officer", finalState.authorizerName || "");
    setInputValWithoutFocusLoss("txt-auth-title", finalState.authorizerTitle || "Head of Internal Audit");
    setInputValWithoutFocusLoss("txt-auth-token", finalState.secureToken || "");
    setInputValWithoutFocusLoss("txt-auth-timestamp", finalState.timestamp || "");

    // --- RENDER DYNAMIC VERIFICATION GRID AND APPENDICES ---
    renderFindingsVerificationGrid(draftState.findings || [], finalState.verificationFlags || []);
    renderAppendicesReferenceGrid(draftState.appendices || []);
}

function setInputValWithoutFocusLoss(elementId, textValue) {
    const el = document.getElementById(elementId);
    if (el && !el.matches(':focus')) el.value = textValue;
}

/**
 * Dynamically builds selector dropdown listings matching inherited parameters
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
        renderFinalReportWorkspace(window.AuditStore.current);
    }
}

/**
 * Generates the executive tracking layout list mapping detailed management entries
 */
function renderFindingsVerificationGrid(findingsArray, savedFlags) {
    const tbody = document.getElementById("tbl-final-findings-body");
    if (!tbody) return;
    tbody.innerHTML = "";

    let hasInadequateFlag = false;

    if (findingsArray.length === 0) {
        document.getElementById("empty-verification-row")?.classList.remove("hidden");
        updateGlobalValidationStatusBanner(false);
        return;
    }

    document.getElementById("empty-verification-row")?.classList.add("hidden");

    findingsArray.forEach((finding, index) => {
        const tr = document.createElement("tr");
        tr.className = "border-b border-outline-variant/30 dark:border-slate-800 last:border-0 hover:bg-surface-container-low dark:hover:bg-slate-900/40 align-top transition-colors";
        
        // Match or resolve default status adequacy selection tracking keys
        const currentFlagValue = savedFlags[index] || "Adequate";
        if (currentFlagValue === "Inadequate") {
            hasInadequateFlag = true;
        }

        tr.innerHTML = `
            <td class="p-3 text-center text-xs font-mono font-bold text-on-surface-variant align-middle">${index + 1}</td>
            <td class="p-3 text-xs text-on-surface dark:text-slate-300 font-medium">${window.escapeAttr(finding.objective || "—")}</td>
            <td class="p-3 text-xs text-on-surface-variant dark:text-slate-400 italic">${window.escapeAttr(finding.breakdown || "—")}</td>
            <td class="p-3 text-xs text-sky-700 dark:text-sky-400 font-semibold">${window.escapeAttr(finding.recommendations || "—")}</td>
            <td class="p-3 text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50/20 dark:bg-emerald-950/10 font-medium">${window.escapeAttr(finding.response || "—")}</td>
            <td class="p-2 align-middle">
                <select name="flag-${index}-adequacy" class="w-full text-xs font-bold rounded-lg border-0 bg-slate-50 dark:bg-[#0d0e10] p-1.5 focus:ring-1 focus:ring-primary">
                    <option value="Adequate" ${currentFlagValue === 'Adequate' ? 'selected' : ''}>Adequate ✅</option>
                    <option value="Inadequate" ${currentFlagValue === 'Inadequate' ? 'selected' : ''}>Inadequate ❌</option>
                </select>
            </td>
        `;
        
        tr.querySelector(`[name="flag-${index}-adequacy"]`).addEventListener("change", (e) => {
            updateFindingAdequacyFlagInline(index, e.target.value);
        });

        tbody.appendChild(tr);
    });

    updateGlobalValidationStatusBanner(hasInadequateFlag);
}

/**
 * Handles inline validation adjustments and updates status configurations reactively
 */
function updateFindingAdequacyFlagInline(index, selectedFlagValue) {
    const store = window.AuditStore;
    if (!store || !store.current) return;

    if (!store.current.phase2_performing.finalReport.verificationFlags) {
        store.current.phase2_performing.finalReport.verificationFlags = [];
    }
    
    store.current.phase2_performing.finalReport.verificationFlags[index] = selectedFlagValue;
    
    // Re-evaluate the dataset array loops to toggle authorization sign-off blocks
    const findings = store.current.phase2_performing.draftReport.findings || [];
    const flags = store.current.phase2_performing.finalReport.verificationFlags;
    let hasInadequateFlag = false;
    
    findings.forEach((_, idx) => {
        if ((flags[idx] || "Adequate") === "Inadequate") {
            hasInadequateFlag = true;
        }
    });

    updateGlobalValidationStatusBanner(hasInadequateFlag);
}

/**
 * Toggles status banner elements and locks signature controls dynamically
 */
function updateGlobalValidationStatusBanner(isBlockedByInadequacy) {
    const banner = document.getElementById("banner-validation-status");
    const signOffSection = document.getElementById("block-signoff-controls");
    const warningNotice = document.getElementById("lbl-signoff-warning");

    if (isBlockedByInadequacy) {
        if (banner) {
            banner.textContent = "Inadequate — Return Plan Mode Required";
            banner.className = "px-4 py-2 bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 rounded-lg text-xs font-black uppercase tracking-wider text-center shadow-inner animate-pulse";
        }
        if (signOffSection) signOffSection.classList.add("opacity-40", "pointer-events-none");
        if (warningNotice) warningNotice.classList.remove("hidden");
    } else {
        if (banner) {
            banner.textContent = "All Responses Verified — Adequate";
            banner.className = "px-4 py-2 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 rounded-lg text-xs font-black uppercase tracking-wider text-center shadow-inner";
        }
        if (signOffSection) signOffSection.classList.remove("opacity-40", "pointer-events-none");
        if (warningNotice) warningNotice.classList.add("hidden");
    }
}

/**
 * Simple data injection helper mapping appendice lines
 */
function renderAppendicesReferenceGrid(appendicesArray) {
    const tbody = document.getElementById("tbl-final-appendices-body");
    if (!tbody) return;
    tbody.innerHTML = "";

    if (appendicesArray.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="p-4 text-center text-xs text-slate-400 italic">No supplemental attachments mapped.</td></tr>`;
        return;
    }

    appendicesArray.forEach((app, index) => {
        const tr = document.createElement("tr");
        tr.className = "border-b border-outline-variant/20 dark:border-slate-800 text-xs text-on-surface dark:text-slate-300";
        tr.innerHTML = `
            <td class="p-3 text-center font-mono text-slate-400">${index + 1}</td>
            <td class="p-3 font-mono font-bold text-primary dark:text-sky-400">${window.escapeAttr(app.ref || '')}</td>
            <td class="p-3 font-medium">${window.escapeAttr(app.title || '—')}</td>
            <td class="p-3 font-mono text-slate-500 truncate max-w-md">${window.escapeAttr(app.hash || '—')}</td>
        `;
        tbody.appendChild(tr);
    });
}

/**
 * Commits authorization elements up to cloud persistence nodes
 */
async function commitFinalWorkspaceState() {
    const store = window.AuditStore;
    if (!store || !store.current) return;

    const finalState = store.current.phase2_performing.finalReport;
    
    finalState.authorizerName = document.getElementById("txt-auth-officer").value;
    finalState.authorizerTitle = document.getElementById("txt-auth-title").value;
    finalState.secureToken = document.getElementById("txt-auth-token").value;
    finalState.timestamp = document.getElementById("txt-auth-timestamp").value;

    try {
        await store.save();
        alert("Official Executive validation states and signature metadata entries synced successfully! 🔒");
    } catch (err) {
        alert("Failed to sync structural final report data fields.");
    }
}

/**
 * Advanced integration layer: Generates a secure authorization sign-off token
 */
function generateSecureAuthorizationHash() {
    const name = document.getElementById("txt-auth-officer").value;
    if (!name) {
        alert("Please provide the Authorizing Officer's name to generate an audit hash signature.");
        return;
    }
    
    // Standard mock hash token masking corporate cryptography keys
    const randomHashToken = "SENTINEL-SIG-" + Math.random().toString(36).substring(2, 10).toUpperCase() + "-" + new Date().getFullYear();
    const currentISOString = new Date().toLocaleDateString('en-KE', { hour: '2-digit', minute: '2-digit' });

    document.getElementById("txt-auth-token").value = randomHashToken;
    document.getElementById("txt-auth-timestamp").value = currentISOString;
    
    commitFinalWorkspaceState();
}

function routeBackToDraftWorkspace() {
    window.location.href = "Draft_Audit_Report.html";
}

function triggerSystemPrintLayout() {
    window.print();
}
