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
            // Read selection context tracker pointer key from master cloud planning layer
            let cloudIndex = snapshotData?.phase1_planning?.selectedExecutionId;
            if (cloudIndex !== undefined && cloudIndex !== null) {
                activeTargetIndex = parseInt(cloudIndex);
            }
            renderFinalReportWorkspace(snapshotData);
        });
    }
});

/**
 * Parses cloud snapshots to load baseline data metrics and corporate verification states
 */
function renderFinalReportWorkspace(data) {
    const workPlanList = data?.phase1_planning?.workPlan || [];
    const universeList = data?.phase1_planning?.universe || [];
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
    const targetRow = workPlanList[activeTargetIndex] || workPlanList[0];
    if (!targetRow) return;

    // --- PIPELINE INHERITANCE: RESOLVE DYNAMIC HEADER BANNERS ---
    const auditTitle = targetRow.auditAreaReplica || "Untitled Scope Area Assignment";
    
    // Cross-reference department from universe using row index suffix matching
    let resolvedDepartment = "Operations / General Management";
    const rowRefSuffix = targetRow.refNumber ? targetRow.refNumber.split('-').pop() : "";
    const matchedUniverseItem = universeList.find(u => u.serialNo && u.serialNo.split('-').pop() === rowRefSuffix);
    if (matchedUniverseItem && matchedUniverseItem.processOwner) {
        resolvedDepartment = matchedUniverseItem.processOwner;
    }

    // Generate period timeline string representation
    const startStr = targetRow.startDate || "Not Scheduled";
    const endStr = targetRow.endDate || "Not Scheduled";
    const resolvedPeriodTimeline = `${startStr} to ${endStr} (${targetRow.durationValue || 4} ${targetRow.scale || 'Weeks'})`;

    // Force DOM Insertion on matching elements using context values
    const lblTitle = document.getElementById("lbl-pull-title");
    if (lblTitle) lblTitle.textContent = auditTitle.toUpperCase();

    const lblDept = document.getElementById("lbl-pull-department");
    if (lblDept) lblDept.textContent = resolvedDepartment.toUpperCase();

    const lblPeriod = document.getElementById("lbl-pull-period");
    if (lblPeriod) lblPeriod.textContent = resolvedPeriodTimeline;
    
    // Core Read-Only Narrative Synthesis Boards
    const execSummaryIntro = draftState.executiveSummarySegments?.introduction || draftState.executiveSummary || "";
    document.getElementById("lbl-pull-summary").textContent = execSummaryIntro || "No executive summary overview introduction declarations recorded.";
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
    renderFindingsVerificationGrid(draftState.findings || [], finalState.verificationFlags || {}, targetRow);
    renderAppendicesReferenceGrid(draftState.appendices || []);
}

function setInputValWithoutFocusLoss(elementId, textValue) {
    const el = document.getElementById(elementId);
    if (el && !el.matches(':focus')) el.value = textValue;
}

function populateTargetRiskSelector(workPlanList) {
    const select = document.getElementById("sel-audit-target");
    if (!select) return;
    
    const currentVal = select.value;
    select.innerHTML = ""; 

    workPlanList.forEach((row, index) => {
        const opt = document.createElement("option");
        opt.value = index;
        opt.textContent = `[${row.refNumber}] ${row.auditAreaReplica}`;
        if (Number(index) === Number(activeTargetIndex)) opt.selected = true;
        select.appendChild(opt);
    });
}

function handleTargetRiskSwitch(selectedDropdownValueIndex) {
    activeTargetIndex = parseInt(selectedDropdownValueIndex);
    const store = window.AuditStore;
    if (store && store.current) {
        if (!store.current.phase1_planning) store.current.phase1_planning = {};
        store.current.phase1_planning.selectedExecutionId = activeTargetIndex;
        renderFinalReportWorkspace(store.current);
    }
}

/**
 * Generates the executive tracking layout list mapping detailed nested management entries
 */
function renderFindingsVerificationGrid(findingsArray, savedFlagsMap, targetRow) {
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

    findingsArray.forEach((findingBlock, objIdx) => {
        const subObsArray = findingBlock.observations || [];
        const rowspanTotalCount = subObsArray.length || 1;

        subObsArray.forEach((obsNode, obsIdx) => {
            const tr = document.createElement("tr");
            tr.className = "border-b border-outline-variant/30 dark:border-slate-800 last:border-0 hover:bg-surface-container-low/40 align-top transition-colors";
            
            // Build the dynamic target composite storage identifier key path (e.g. "0_1")
            const compositeFlagKey = `${objIdx}_${obsIdx}`;
            const currentFlagValue = savedFlagsMap[compositeFlagKey] || "Adequate";
            
            if (currentFlagValue === "Inadequate") {
                hasInadequateFlag = true;
            }

            let objectiveCellMarkup = "";
            if (obsIdx === 0) {
                objectiveCellMarkup = `
                    <td class="p-3 text-center text-xs font-mono font-bold text-on-surface-variant bg-surface-container-low/40 align-middle font-extrabold" rowspan="${rowspanTotalCount}">
                        ${objIdx + 1}
                    </td>
                    <td class="p-3 text-xs text-on-surface dark:text-slate-300 font-bold border-r border-outline-variant/20 max-w-xs" rowspan="${rowspanTotalCount}">
                        ${window.escapeAttr(findingBlock.objective || "—")}
                    </td>
                `;
            }

            // Construct read-only attached papers evidence metadata asset row tag if matched
            let evidenceBadgeMarkup = "";
            if (obsNode.attachedFileName) {
                evidenceBadgeMarkup = `
                    <div class="mt-2 flex items-center gap-1 text-[10px] font-black text-primary dark:text-sky-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded w-fit">
                        <span class="material-symbols-outlined text-[12px]">attachment</span>
                        EVIDENCE: ${window.escapeAttr(obsNode.attachedFileName)}
                    </div>
                `;
            }

                       tr.innerHTML = `
                ${objectiveCellMarkup}
                
                <!-- Observations breakdown leads cell column -->
                <td class="p-3 text-xs space-y-2 border-r border-outline-variant/20 bg-slate-50/20 dark:bg-slate-900/10">
                    <div><strong class="text-slate-500 text-[10px] uppercase tracking-wider block">Observation Gap:</strong> <span class="text-on-surface dark:text-slate-300 font-medium">${window.escapeAttr(obsNode.observation || "—")}</span></div>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1 border-t border-dashed border-outline-variant/30">
                        <div><span class="text-slate-400 font-medium">Criteria:</span> ${window.escapeAttr(obsNode.standard || "—")}</div>
                        <div><span class="text-slate-400 font-medium">Practice:</span> ${window.escapeAttr(obsNode.practice || "—")}</div>
                        <div><span class="text-slate-400 font-medium">Root Cause:</span> ${window.escapeAttr(obsNode.rootCause || "—")}</div>
                        <div><span class="text-slate-400 font-medium">Implication:</span> ${window.escapeAttr(obsNode.implications || "—")}</div>
                    </div>
                    ${evidenceBadgeMarkup}
                </td>
                
                <td class="p-3 text-xs text-sky-700 dark:text-sky-400 font-semibold border-r border-outline-variant/20 max-w-xs">
                    ${window.escapeAttr(obsNode.recommendations || "—")}
                </td>
                
                <td class="p-3 text-xs space-y-1.5 bg-emerald-50/10 dark:bg-emerald-950/5 border-r border-outline-variant/20">
                    <div><strong class="text-emerald-800 dark:text-emerald-400 text-[10px] uppercase tracking-wider block">Action Response:</strong> <span class="text-on-surface dark:text-slate-300 font-medium">${window.escapeAttr(obsNode.mgmtAction || "—")}</span></div>
                    <div class="flex flex-wrap gap-x-4 gap-y-0.5 text-[11px] border-t border-dashed border-outline-variant/30 pt-1 text-slate-500">
                        <div><span class="text-slate-400">Timeline:</span> <strong>${window.escapeAttr(obsNode.mgmtTimeline || "—")}</strong></div>
                        <div><span class="text-slate-400">Owner:</span> <strong>${window.escapeAttr(obsNode.mgmtResponsible || "—")}</strong></div>
                    </div>
                </td>
                
                <td class="p-2 align-middle">
                    <select name="flag-${compositeFlagKey}-adequacy" 
                            onchange="window.updateFindingAdequacyFlagInline('${compositeFlagKey}', this.value)"
                            class="w-full text-xs font-bold rounded-lg border-0 bg-slate-50 dark:bg-[#0d0e10] p-1.5 focus:ring-1 focus:ring-primary focus:outline-none cursor-pointer">
                        <option value="Adequate" ${currentFlagValue === 'Adequate' ? 'selected' : ''}>Adequate ✅</option>
                        <option value="Inadequate" ${currentFlagValue === 'Inadequate' ? 'selected' : ''}>Inadequate ❌</option>
                    </select>
                </td>
            `;

            tbody.appendChild(tr);
        });
    });

    updateGlobalValidationStatusBanner(hasInadequateFlag);
}

/**
 * Handles inline validation adjustments and updates status configurations reactively per observation node
 */
window.updateFindingAdequacyFlagInline = function(compositeFlagKey, selectedFlagValue) {
    const store = window.AuditStore;
    if (!store || !store.current) return;

    if (!store.current.phase2_performing.finalReport.verificationFlags) {
        store.current.phase2_performing.finalReport.verificationFlags = {};
    }
    
    // Set adequacy tracking data inside the dynamic map context identifier
    store.current.phase2_performing.finalReport.verificationFlags[compositeFlagKey] = selectedFlagValue;
    
    // Loop verification loops map layers to toggle lock switches reactively
    const findings = store.current.phase2_performing.draftReport.findings || [];
    const flagsMap = store.current.phase2_performing.finalReport.verificationFlags;
    let hasInadequateFlag = false;
    
    findings.forEach((findingBlock, objIdx) => {
        const subObsArray = findingBlock.observations || [];
        subObsArray.forEach((_, obsIdx) => {
            const key = `${objIdx}_${obsIdx}`;
            if ((flagsMap[key] || "Adequate") === "Inadequate") {
                hasInadequateFlag = true;
            }
        });
    });

    updateGlobalValidationStatusBanner(hasInadequateFlag);
};

/**
 * Toggles status banner elements and locks signature controls dynamically
 */
function updateGlobalValidationStatusBanner(isBlockedByInadequacy) {
    const banner = document.getElementById("banner-validation-status");
    const signOffSection = document.getElementById("block-signoff-controls");
    const warningNotice = document.getElementById("lbl-signoff-warning");

    if (isBlockedByInadequacy) {
        if (banner) {
            banner.textContent = "Inadequate Responses Flagged — Return to Draft Mode Required";
            banner.className = "px-4 py-2 bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 rounded-lg text-xs font-black uppercase tracking-wider text-center shadow-inner animate-pulse";
        }
        if (signOffSection) signOffSection.classList.add("opacity-40", "pointer-events-none");
        if (warningNotice) warningNotice.classList.remove("hidden");
    } else {
        if (banner) {
            banner.textContent = "All Responses Verified — Adequate Report Certified";
            banner.className = "px-4 py-2 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 rounded-lg text-xs font-black uppercase tracking-wider text-center shadow-inner";
        }
        if (signOffSection) signOffSection.classList.remove("opacity-40", "pointer-events-none");
        if (warningNotice) warningNotice.classList.add("hidden");
    }
}

/**
 * Simple data injection helper mapping appendix lines
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

    if (!store.current.phase2_performing.finalReport) {
        store.current.phase2_performing.finalReport = {};
    }
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
 * Validates adequacy choices, syncs memory blocks, and routes forward into the Remediation Follow-up Stage
 */
async function finalizeFinalReportAndProceedToFollowUp() {
    const store = window.AuditStore;
    if (!store || !store.current) return;

    try {
        // 1. Force a final database write synchronization pass to secure all verification select flags
        await commitFinalWorkspaceState();
        
        // 2. Dispatch a safe data-copy pipeline trigger to mirror information downstream if required
        if (typeof store.carryToFollowUp === 'function') {
            store.carryToFollowUp();
        }
        
        // 3. Navigate the browser directly forward to your Follow-up workspace sheet module
        window.location.href = "follow_up_report.html";
    } catch(err) {
        console.error("Pipeline handoff routing exception hit:", err);
        alert("Pipeline error: Failed to safely synchronize report configurations before routing.");
    }
}

// Ensure the new handler function variable is bound to the window global sandbox container element
window.finalizeFinalReportAndProceedToFollowUp = finalizeFinalReportAndProceedToFollowUp;

/**
 * Advanced integration layer: Generates a secure authorization sign-off token
 */
window.generateSecureAuthorizationHash = function() {
    const name = document.getElementById("txt-auth-officer").value;
    if (!name) {
        alert("Please provide the Authorizing Officer's name to generate an audit hash signature.");
        return;
    }
    
    const randomHashToken = "SENTINEL-SIG-" + Math.random().toString(36).substring(2, 10).toUpperCase() + "-" + new Date().getFullYear();
    const currentISOString = new Date().toLocaleDateString('en-KE', { hour: '2-digit', minute: '2-digit' });

    document.getElementById("txt-auth-token").value = randomHashToken;
    document.getElementById("txt-auth-timestamp").value = currentISOString;
    
    commitFinalWorkspaceState();
};

window.routeBackToDraftWorkspace = function() {
    window.location.href = "Draft_Audit_Report.html";
};

window.triggerSystemPrintLayout = function() {
    window.print();
};
