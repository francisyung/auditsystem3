/**
 * Sentinel Core Final Audit Report Controller Module
 * Governs read-only executive narratives, corrective action evaluation checks, 
 * adequacy flag validation logic, and secure report circulation workflows for Phase 2 Stage 3.
 * PART 1 OF 4: ISOLATION OBJECT LAYERS, CORE PIPELINES & ACCESSIBILITY LOCKS
 */

// Track index targeting the specific active audit line row from Phase 1
let activeTargetIndex = 0; 

document.addEventListener("DOMContentLoaded", () => {
    if (window.Theme) window.Theme.init();
    
    // Connect live cloud listener subscription hook
    if (window.AuditStore) {
        window.AuditStore.subscribeToAudit((snapshotData) => {
            let cloudIndex = snapshotData?.phase1_planning?.selectedExecutionId;
            if (cloudIndex !== undefined && cloudIndex !== null) {
                activeTargetIndex = parseInt(cloudIndex);
            }
            renderFinalReportWorkspace(snapshotData);
        });
    }
});

/**
 * Parses cloud snapshots to load baseline data metrics and corporate verification states safely without data blending
 */
/**
 * Parses cloud snapshots to load baseline data metrics and corporate verification states safely without data blending
 * UPDATED: Injected asynchronous AES-GCM decryption interceptors to convert cipher strings back to human plain text.
 */
async function renderFinalReportWorkspace(data) { // 👈 Changed function definition to 'async'
    const workPlanList = data?.phase1_planning?.workPlan || [];
    const universeList = data?.phase1_planning?.universe || [];
    const planProgram = data?.phase2_performing?.planProgram || {};
    const draftReport = data?.phase2_performing?.draftReport || {};
    const finalReport = data?.phase2_performing?.finalReport || {};
    
    if (workPlanList.length === 0) {
        document.getElementById("empty-final-state")?.classList.remove("hidden");
        document.getElementById("active-final-workspace")?.classList.add("hidden");
        return;
    }

    document.getElementById("empty-final-state")?.classList.add("hidden");
    document.getElementById("active-final-workspace")?.classList.remove("hidden");

    populateTargetRiskSelector(workPlanList);

    const rawTargetRow = workPlanList[activeTargetIndex] || workPlanList[0];
    if (!rawTargetRow) return;
    
    // =========================================================================
    // 🛡️ CENTRAL PIPELINE AES-GCM DECRYPTION INTERCEPTOR OBJECT
    // Decodes encrypted database rows on the fly before they map onto your UI
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
        console.error("🔒 Cryptographic Exception: Failed to decode final report background fields.", cryptoErr);
    }

    const refNum = targetRow.refNumber;

    const previousProgramState = planProgram.audits?.[refNum] || {};
    const previousDraftState   = draftReport.audits?.[refNum] || {};

    // =========================================================================
    // From here downwards, the rest of your original layout code remains exactly the same,
    // but reads 'targetRow' containing beautiful, clear plain text definitions!
    // =========================================================================
    if (!finalReport.audits) finalReport.audits = {};

    if (!finalReport.audits[refNum]) {
        finalReport.audits[refNum] = { verificationFlags: {} };
    }
    const finalState = finalReport.audits[refNum];

    // Establish linear gate loops matching required architectural constraints if blank on boot
    if (!finalState.trackingState) {
        finalState.trackingState = { status: "Draft", currentHolder: "officer", remarks: "" };
    }

    const tState = finalState.trackingState;
    const activeUserRole = localStorage.getItem("sentinel_active_role") || "officer";
    const isStageLocked = (activeUserRole !== tState.currentHolder || tState.status === "Approved");

    // Pipeline Inheritance: Resolve dynamic header banners
    const auditTitle = targetRow.auditAreaReplica || "Untitled Scope Area Assignment";
    
    let resolvedDepartment = "Operations / General Management";
    const rowRefSuffix = targetRow.refNumber ? targetRow.refNumber.split('-').pop() : "";
    const matchedUniverseItem = universeList.find(u => u.serialNo && u.serialNo.split('-').pop() === rowRefSuffix);
    if (matchedUniverseItem && matchedUniverseItem.processOwner) {
        resolvedDepartment = matchedUniverseItem.processOwner;
    }

    const startStr = targetRow.startDate || "Not Scheduled";
    const endStr = targetRow.endDate || "Not Scheduled";
    const resolvedPeriodTimeline = `${startStr} to ${endStr} (${targetRow.durationValue || 4} ${targetRow.scale || 'Weeks'})`;

    const lblTitle = document.getElementById("lbl-pull-title");
    if (lblTitle) lblTitle.textContent = auditTitle.toUpperCase();

    const lblDept = document.getElementById("lbl-pull-department");
    if (lblDept) lblDept.textContent = resolvedDepartment.toUpperCase();

    const lblPeriod = document.getElementById("lbl-pull-period");
    if (lblPeriod) lblPeriod.textContent = resolvedPeriodTimeline;
    
    const execSummaryIntro = previousDraftState.executiveSummarySegments?.introduction || "—";
    
    const lblSummary = document.getElementById("lbl-pull-summary");
    if (lblSummary) lblSummary.textContent = execSummaryIntro;

    const lblBg = document.getElementById("lbl-pull-bg");
    if (lblBg) lblBg.textContent = previousProgramState.introductionBackground || "—";

    const lblRisks = document.getElementById("lbl-pull-risks");
    if (lblRisks) lblRisks.textContent = previousProgramState.risksAdditions || targetRow.riskDescription || "—";

    const lblObjProfile = document.getElementById("lbl-pull-objectives");
    if (lblObjProfile) lblObjProfile.textContent = previousProgramState.auditObjectivesAdditions || targetRow.auditObjectives || "—";

    const lblScope = document.getElementById("lbl-pull-scope");
    if (lblScope) lblScope.textContent = previousProgramState.auditScopeAdditions || targetRow.auditScopeBoundaries || "—";

    const lblMethodology = document.getElementById("lbl-pull-methodology");
    if (lblMethodology) lblMethodology.textContent = previousProgramState.methodology || "—";

    const lblCriteria = document.getElementById("lbl-pull-criteria");
    if (lblCriteria) lblCriteria.textContent = previousProgramState.evaluationCriteria || "—";

    const lblDuration = document.getElementById("lbl-pull-duration");
    if (lblDuration) lblDuration.textContent = `${targetRow.durationValue || 4} ${targetRow.scale || 'Weeks'}`;

    
    // 🛡️ RE-ORIENTED CERTIFICATION PATH SIGN-OFF LOGS
    const finalAuthorizedOfficer = finalState.authorizerName || targetRow.approver || "";

    setInputValWithoutFocusLoss("txt-auth-officer", finalAuthorizedOfficer);
    setInputValWithoutFocusLoss("txt-auth-title", finalState.authorizerTitle || "Head of Internal Audit");

    setInputValWithoutFocusLoss("txt-auth-officer", finalAuthorizedOfficer);
    setInputValWithoutFocusLoss("txt-auth-title", finalState.authorizerTitle || "Head of Internal Audit");
    setInputValWithoutFocusLoss("txt-auth-token", finalState.secureToken || "");
    setInputValWithoutFocusLoss("txt-auth-timestamp", finalState.timestamp || "");

    // Enforce dynamic read-only locks across input blocks based on active workflow role matching profiles
    document.querySelectorAll("#active-final-workspace select, #active-final-workspace input:not([id='txt-stage-remarks'])").forEach(el => {
        if (isStageLocked) {
            el.setAttribute("disabled", "true");
            el.classList.add("opacity-60", "bg-slate-100", "dark:bg-slate-900/50", "pointer-events-none");
        } else {
            el.removeAttribute("disabled");
            el.classList.remove("opacity-60", "bg-slate-100", "dark:bg-slate-900/50", "pointer-events-none");
        }
    });

    // Control core sign-off button visibility wrappers
    const btnGenHash = document.querySelector("button[onclick='window.generateSecureAuthorizationHash()']");
    if (btnGenHash) {
        if (isStageLocked) btnGenHash.classList.add("hidden");
        else btnGenHash.classList.remove("hidden");
    }

    renderFindingsVerificationGrid(previousDraftState.findings || [], finalState.verificationFlags || {}, targetRow, isStageLocked);
    renderAppendicesReferenceGrid(previousDraftState.appendices || []);
    renderFinalReportWorkflowGateBarPanel(tState, activeUserRole, refNum);
}
/**
 * Sentinel Core Final Audit Report Controller Module
 * PART 2 OF 4: FOCUS-SAFE LOGIC, ACCESSIBILITY UTILITIES & VERIFICATION GRID LOOPS
 */

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

function populateTargetRiskSelector(workPlanList) {
    const select = document.getElementById("sel-audit-target");
    if (!select) return;
    
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
function renderFindingsVerificationGrid(findingsArray, savedFlagsMap, targetRow, isStageLocked) {
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

            let evidenceBadgeMarkup = "";
            if (obsNode.attachedFileName) {
                evidenceBadgeMarkup = `
                    <div class="mt-2 flex items-center gap-1 text-[10px] font-black text-primary dark:text-sky-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded w-fit">
                        <span class="material-symbols-outlined text-[12px]">attachment</span>
                        EVIDENCE: ${window.escapeAttr(obsNode.attachedFileName)}
                    </div>
                `;
            }

            const isSelectLockedAttr = isStageLocked ? "disabled readonly opacity-60 pointer-events-none" : "";

            tr.innerHTML = `
                ${objectiveCellMarkup}
                
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
                            ${isSelectLockedAttr}
                            onchange="window.updateFindingAdequacyFlagInline('${compositeFlagKey}', this.value)"
                            class="w-full text-xs font-bold rounded-lg border-0 bg-slate-50 dark:bg-[#0d0e10] p-1.5 focus:ring-1 focus:ring-primary focus:outline-none cursor-pointer text-on-surface dark:text-slate-200">
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
 * Sentinel Core Final Audit Report Controller Module
 * PART 3 OF 4: REACTIVE FLAG INTERCEPTORS, WARNING BANNERS & STATE COMMITMENTS
 */

window.updateFindingAdequacyFlagInline = function(compositeFlagKey, selectedFlagValue) {
    const store = window.AuditStore;
    if (!store || !store.current) return;

    const targetRow = store.current.phase1_planning?.workPlan?.[activeTargetIndex];
    if (!targetRow) return;

    const finalReport = store.current.phase2_performing.finalReport;
    if (!finalReport.audits) finalReport.audits = {};
    if (!finalReport.audits[targetRow.refNumber]) {
        finalReport.audits[targetRow.refNumber] = { verificationFlags: {} };
    }
    
    finalReport.audits[targetRow.refNumber].verificationFlags[compositeFlagKey] = selectedFlagValue;
    
    const previousDraftState = store.current.phase2_performing.draftReport.audits?.[targetRow.refNumber] || {};
    const findings = previousDraftState.findings || [];
    const flagsMap = finalReport.audits[targetRow.refNumber].verificationFlags;
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
    store.save(); 
};

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
            <td class="p-3 text-center text-slate-400">${index + 1}</td>
            <td class="p-3 font-mono font-bold text-primary dark:text-sky-400">${window.escapeAttr(app.ref || '')}</td>
            <td class="p-3 font-medium">${window.escapeAttr(app.title || '—')}</td>
            <td class="p-3 font-mono text-slate-500 truncate max-w-md">${window.escapeAttr(app.hash || '—')}</td>
        `;
        tbody.appendChild(tr);
    });
}

async function commitFinalWorkspaceState() {
    const store = window.AuditStore;
    if (!store || !store.current) return;

    const targetRow = store.current.phase1_planning?.workPlan?.[activeTargetIndex];
    if (!targetRow) return;

    const finalReport = store.current.phase2_performing.finalReport;
    if (!finalReport.audits) finalReport.audits = {};
    if (!finalReport.audits[targetRow.refNumber]) {
        finalReport.audits[targetRow.refNumber] = { verificationFlags: {} };
    }
    
    const finalState = finalReport.audits[targetRow.refNumber];
    
    // Read local input elements safely
    const inputOfficer = document.getElementById("txt-auth-officer")?.value || "";
    const inputTitle = document.getElementById("txt-auth-title")?.value || "";

    // Persistence Check: Fallback to targetRow values if the form fields were left completely blank
    finalState.authorizerName = inputOfficer || finalState.authorizerName || targetRow.approver || "";
    finalState.authorizerTitle = inputTitle || finalState.authorizerTitle || "Head of Internal Audit";
    
    finalState.secureToken = document.getElementById("txt-auth-token")?.value || "";
    finalState.timestamp = document.getElementById("txt-auth-timestamp")?.value || "";

    try {
        await store.save();
    } catch (err) {
        console.error("Failed to sync structural final report data fields.", err);
    }
}

/**
 * Sentinel Core Final Audit Report Controller Module
 * PART 4 OF 4: AUDIT COMPLIANCE GATING TOOLBARS, CRYPTO SIGNATURES & MOVEMENT FILTERS
 */

/**
 * Injects a stage-wide floating validation bar to route the whole Final Report collection at once
 * FIXED: Removed character escaping backslashes so variables parse cleanly into HTML bindings
 */
function renderFinalReportWorkflowGateBarPanel(trackingState, activeUserRole, refNum) {
    let panel = document.getElementById("sentinel-finalreport-workflow-panel");
    if (!panel) {
        panel = document.createElement("div");
        panel.id = "sentinel-finalreport-workflow-panel";
        panel.className = "p-4 my-6 bg-slate-50 dark:bg-[#111315] border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4 max-w-[1600px] mx-auto no-print shadow-sm";
        const mainWorkspace = document.getElementById("active-final-workspace");
        if (mainWorkspace) mainWorkspace.appendChild(panel);
    }

    const badgeColorMap = {
        "Draft": "bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-400",
        "Pending_Lead": "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
        "Pending_Reviewer": "bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-300",
        "Pending_Approver": "bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300",
        "Approved": "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
        "Returned_To_Officer": "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300"
    };

    const statusStyle = badgeColorMap[trackingState.status] || "bg-slate-100 text-slate-800";
    let interfaceActionsHtml = "";
    const isHolder = activeUserRole === trackingState.currentHolder;

    if (isHolder && trackingState.status !== "Approved") {
        let buttonsHtml = "";

        if (activeUserRole === "officer") {
            buttonsHtml = "<button onclick=\"commitFinalReportStageTransition('" + refNum + "', 'Pending_Lead')\" class=\"px-3 py-2 text-xs font-black uppercase tracking-wider bg-sky-600 hover:bg-sky-700 text-white rounded\">Submit Report</button>";
        } else if (activeUserRole === "leadauditor") {
            buttonsHtml = "<button onclick=\"commitFinalReportStageTransition('" + refNum + "', 'Pending_Reviewer')\" class=\"px-3 py-2 text-xs font-black uppercase tracking-wider bg-sky-600 hover:bg-sky-700 text-white rounded mr-2\">To Reviewer</button>" +
                          "<button onclick=\"commitFinalReportStageTransition('" + refNum + "', 'Returned_To_Officer')\" class=\"px-3 py-2 text-xs font-black uppercase tracking-wider bg-amber-600 hover:bg-amber-700 text-white rounded\">Return</button>";
        } else if (activeUserRole === "reviewer") {
            buttonsHtml = "<button onclick=\"commitFinalReportStageTransition('" + refNum + "', 'Pending_Approver')\" class=\"px-3 py-2 text-xs font-black uppercase tracking-wider bg-indigo-600 hover:bg-indigo-700 text-white rounded mr-2\">To Approver</button>" +
                          "<button onclick=\"commitFinalReportStageTransition('" + refNum + "', 'Returned_To_Lead')\" class=\"px-3 py-2 text-xs font-black uppercase tracking-wider bg-amber-600 hover:bg-amber-700 text-white rounded\">Return</button>";
        } else if (activeUserRole === "approver") {
            buttonsHtml = "<button onclick=\"commitFinalReportStageTransition('" + refNum + "', 'Approved')\" class=\"px-3 py-2 text-xs font-black uppercase tracking-wider bg-emerald-600 hover:bg-emerald-700 text-white rounded mr-2\">Authorize & Sign</button>" +
                          "<button onclick=\"commitFinalReportStageTransition('" + refNum + "', 'Returned_To_Officer')\" class=\"px-3 py-2 text-xs font-black uppercase tracking-wider bg-rose-600 hover:bg-rose-700 text-white rounded\">Reject</button>";
        }

        interfaceActionsHtml = `
            <div class="flex items-center gap-2">
                <input type="text" id="txt-stage-remarks" placeholder="Enter review remarks..." class="bg-[#1e293b] border border-slate-700/50 p-2 text-xs rounded text-white focus:outline-none w-56">
                ${buttonsHtml}
            </div>`;
    } else {
        let displayMessage = "Awaiting verification by role [" + trackingState.currentHolder.toUpperCase() + "]";
        if (trackingState.status === "Approved") {
            displayMessage = "✓ Final Audit Report Authorized & Certified";
        }
        interfaceActionsHtml = `<div class="text-xs text-slate-500 font-bold uppercase tracking-wider">${displayMessage}</div>`;
    }

    const visibleStatusText = trackingState.status.replace(/_/g, ' ');

    panel.innerHTML = `
        <div class="flex items-center gap-3">
            <span class="text-xs font-black uppercase tracking-widest text-slate-400">Final Report Status Gate:</span>
            <span class="px-2.5 py-1 rounded text-xs font-black font-mono uppercase tracking-wider ${statusStyle}">
                ${visibleStatusText}
            </span>
        </div>
        ${interfaceActionsHtml}
    `;
}



/**
 * Transitions the entire collection stage upstream
 * FIXED: Updates both Phase 1 and Phase 2 nodes concurrently to eliminate cached interface locking bugs
 */
// 🛡️ PART 4 UPDATED: Enforce identical key parsing for Final Report stage routing structures
async function commitFinalReportStageTransition(refNum, targetStatus) {
    const store = window.AuditStore;
    if (!store || !store.current) return;

    const activeRefKey = String(refNum).trim();
    const remarksInput = document.getElementById("txt-stage-remarks");
    const actualRemarks = remarksInput ? remarksInput.value.trim() : "";

    if (!actualRemarks && targetStatus.startsWith("Returned")) {
        alert("Action Required: Please provide an explanatory remark detailing the reason for returning the report design package.");
        return;
    }

    const actingUserRole = localStorage.getItem("sentinel_active_role") || "officer";
    let nextHolder = actingUserRole;

    if (targetStatus === "Pending_Lead") nextHolder = "leadauditor";
    else if (targetStatus === "Pending_Reviewer") nextHolder = "reviewer";
    else if (targetStatus === "Pending_Approver") nextHolder = "approver";
    else if (targetStatus === "Approved" || targetStatus.startsWith("Returned")) nextHolder = "officer";

    if (!store.current.phase2_performing) store.current.phase2_performing = {};
    if (!store.current.phase2_performing.finalReport) store.current.phase2_performing.finalReport = { audits: {} };
    if (!store.current.phase2_performing.finalReport.audits) store.current.phase2_performing.finalReport.audits = {};
    
    if (!store.current.phase2_performing.finalReport.audits[activeRefKey]) {
        store.current.phase2_performing.finalReport.audits[activeRefKey] = { verificationFlags: {} };
    }

    const finalState = store.current.phase2_performing.finalReport.audits[activeRefKey];
    finalState.trackingState = {
        status: targetStatus,
        currentHolder: nextHolder,
        remarks: actualRemarks || `Stage transition processed cleanly to ${targetStatus}`
    };

    const activeWorkPlanRow = store.current.phase1_planning?.workPlan?.[activeTargetIndex];
    if (activeWorkPlanRow) {
        if (!activeWorkPlanRow.trackingState) activeWorkPlanRow.trackingState = {};
        activeWorkPlanRow.trackingState.status = targetStatus;
        activeWorkPlanRow.trackingState.currentHolder = nextHolder;
    }

    try {
        await commitFinalWorkspaceState();
        store.current = JSON.parse(JSON.stringify(store.current));
        await store.save();
        
        await store.writeSystemAuditLog(`Transitioned Final Report stage-wide package [${activeRefKey}] to status [${targetStatus}] held by [${nextHolder}].`);
        alert(`Stage state moved to ${targetStatus.replace(/_/g, ' ')} successfully.`);
        renderFinalReportWorkspace(store.current);
    } catch (err) {
        alert("Failed to commit stage parameters up to cloud node layers.");
    }
}



/**
 * Validates adequacy choices, syncs memory blocks, and routes forward into the Remediation Follow-up Stage
 */
async function finalizeFinalReportAndProceedToFollowUp() {
    const store = window.AuditStore;
    if (!store || !store.current) return;

    const targetRow = store.current.phase1_planning?.workPlan?.[activeTargetIndex];
    if (!targetRow) return;

    const finalState = store.current.phase2_performing?.finalReport?.audits?.[targetRow.refNumber];
    if (finalState?.trackingState?.status !== "Approved") {
        alert("Pipeline Constraint: Access Denied. You cannot advance to the Follow-up phase until this final certification report has been fully 'Approved' and signed off by the authorization authority.");
        return;
    }

    try {
        await commitFinalWorkspaceState();
        if (typeof store.carryToFollowUp === 'function') {
            store.carryToFollowUp();
        }
        window.location.href = "follow_up_report.html";
    } catch(err) {
        console.error("Pipeline handoff routing exception hit:", err);
        alert("Pipeline error: Failed to safely synchronize report configurations before routing.");
    }
}

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
    
    const randomHashToken = "FINAL-CERT-" + Math.random().toString(36).substring(2, 10).toUpperCase() + "-" + new Date().getFullYear();
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
