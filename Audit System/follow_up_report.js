/**
 * Sentinel Core Follow-up Audit Report Controller Module
 * Governs tracking metrics calculations, conditional file triggers, and lifecycle closure maps.
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
            renderFollowUpWorkspace(snapshotData);
        });
    }
});

function renderFollowUpWorkspace(data) {
    // FIX: Fallback tracking checks both the nested and direct document properties roots
    const workPlanList = data?.phase1_planning?.workPlan || data?.workPlan || [];
    const universeList = data?.phase1_planning?.universe || data?.universe || [];
    
    // Fallback checks both nested properties maps positions
    const draftState = data?.phase2_performing?.draftReport || data?.draftReport || {};
    const followUpState = data?.phase2_performing?.followUpReport || data?.followUpReport || {};

    const tbody = document.getElementById("tbl-followup-body");

    // Clear empty state layouts if items are safely matched
    if (workPlanList.length === 0) {
        document.getElementById("empty-followup-state")?.classList.remove("hidden");
        document.getElementById("active-followup-workspace")?.classList.add("hidden");
        return;
    }

    document.getElementById("empty-followup-state")?.classList.add("hidden");
    document.getElementById("active-followup-workspace")?.classList.remove("hidden");

    const targetRow = workPlanList[activeTargetIndex] || workPlanList[0];
    if (!targetRow) return;

    // --- PIPELINE INHERITANCE: RESOLVE DYNAMIC HEADER BANNERS ---
    const auditTitle = targetRow.auditAreaReplica || "Untitled Scope Area Assignment";
    let resolvedDepartment = "Operations / General Management";
    const rowRefSuffix = targetRow.refNumber ? targetRow.refNumber.split('-').pop() : "";
    const matchedUniverseItem = universeList.find(u => u.serialNo && u.serialNo.split('-').pop() === rowRefSuffix);
    if (matchedUniverseItem && matchedUniverseItem.processOwner) {
        resolvedDepartment = matchedUniverseItem.processOwner;
    }

    const resolvedPeriodTimeline = `${targetRow.startDate || '—'} to ${targetRow.endDate || '—'} (${targetRow.durationValue || 4} ${targetRow.scale || 'Weeks'})`;

    document.getElementById("lbl-pull-title").textContent = auditTitle.toUpperCase();
    document.getElementById("lbl-pull-department").textContent = resolvedDepartment.toUpperCase();
    document.getElementById("lbl-pull-period").textContent = resolvedPeriodTimeline;

    // --- SECURE AUTHORIZATION SIGN-OFF PARAMETERS ---
    setInputValWithoutFocusLoss("txt-follow-officer", followUpState.authorizerName || "");
    setInputValWithoutFocusLoss("txt-follow-title", followUpState.authorizerTitle || "Head of Internal Audit");
    setInputValWithoutFocusLoss("txt-follow-token", followUpState.secureToken || "");
    setInputValWithoutFocusLoss("txt-follow-timestamp", followUpState.timestamp || "");

    // --- RENDER DYNAMIC FOLLOW-UP TRACKING MATRIX CONTAINER ---
    renderFollowUpMatrixTable(draftState.findings || [], followUpState.remediationMetrics || {});
}

function setInputValWithoutFocusLoss(elementId, textValue) {
    const el = document.getElementById(elementId);
    if (el && !el.matches(':focus')) el.value = textValue;
}

/**
 * Renders the dense follow-up compliance evaluation grid matrix layout spreadsheet
 */
function renderFollowUpMatrixTable(findingsArray, savedRemediationMap) {
    const tbody = document.getElementById("tbl-followup-body");
    if (!tbody) return;
    tbody.innerHTML = "";

    let totalClosed = 0;
    let totalOpen = 0;

    if (findingsArray.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="p-4 text-center text-xs text-slate-400 italic">No historical audit findings records inherited to track follow-up metrics.</td></tr>`;
        updateImplementationPercentageSummaryCard(0);
        return;
    }

    findingsArray.forEach((findingBlock, objIdx) => {
        const subObsArray = findingBlock.observations || [];
        const rowspanTotalCount = subObsArray.length || 1;

        subObsArray.forEach((obsNode, obsIdx) => {
            const tr = document.createElement("tr");
            tr.className = "border-b border-outline-variant/30 dark:border-slate-800 last:border-0 hover:bg-surface-container-low/30 align-top transition-colors";
            
            const nodeKey = `${objIdx}_${obsIdx}`;
            const metricsNode = savedRemediationMap[nodeKey] || {
                status: "Not Implemented", justification: "", closureStatus: "Open", extendedDate: ""
            };

            // Calculate rolling score parameters counters
            if (metricsNode.closureStatus === "Closed") totalClosed++;
            else totalOpen++;

            let objectiveCellMarkup = "";
            if (obsIdx === 0) {
                objectiveCellMarkup = `
                    <td class="p-3 text-center text-xs font-mono font-bold text-on-surface-variant bg-surface-container-low/40 align-middle font-black" rowspan="${rowspanTotalCount}">
                        ${objIdx + 1}
                    </td>
                    <td class="p-3 text-xs text-on-surface dark:text-slate-300 font-bold border-r border-outline-variant/20 max-w-xs" rowspan="${rowspanTotalCount}">
                        ${window.escapeAttr(findingBlock.objective || "—")}
                    </td>
                `;
            }

            // Define conditional display CSS layer modifiers for inner components
            const isImplemented = metricsNode.status === "Implemented";
            const needsJustification = metricsNode.status === "Not Implemented" || metricsNode.status === "Partially Implemented";
            const isClosed = metricsNode.closureStatus === "Closed";

            tr.innerHTML = `
                ${objectiveCellMarkup}
                
                <!-- Inherited Audit Findings Details Deck -->
                <td class="p-3 text-xs space-y-1.5 border-r border-outline-variant/20 bg-slate-50/20 dark:bg-slate-900/10">
                    <div><span class="text-primary dark:text-sky-400 font-black block">Observation ${obsIdx + 1}:</span> ${window.escapeAttr(obsNode.observation || "—")}</div>
                    <div class="text-[11px] text-slate-400">Rec: <span class="text-sky-700 dark:text-sky-400 font-medium">${window.escapeAttr(obsNode.recommendations || "—")}</span></div>
                </td>
                
                <!-- Inherited Management Action Plan Context Elements -->
                <td class="p-3 text-xs space-y-1 bg-emerald-50/10 dark:bg-emerald-950/5 border-r border-outline-variant/20 max-w-xs">
                    <div class="font-medium text-on-surface dark:text-slate-300">${window.escapeAttr(obsNode.mgmtAction || "—")}</div>
                    <div class="text-[10px] text-slate-400 uppercase tracking-wider font-mono">Owner: ${window.escapeAttr(obsNode.mgmtResponsible || "—")} | Due: ${window.escapeAttr(obsNode.mgmtTimeline || "—")}</div>
                </td>
                
                <!-- Status of Implementation Evaluation Interface Cell -->
                <td class="p-3 space-y-2 border-r border-outline-variant/20 max-w-sm">
                    <select onchange="window.updateFollowUpMetricNode('${nodeKey}', 'status', this.value)"
                            class="w-full text-xs font-bold rounded-lg border-0 bg-slate-50 dark:bg-[#0d0e10] p-1.5 focus:ring-1 focus:ring-primary focus:outline-none cursor-pointer">
                        <option value="Implemented" ${metricsNode.status === 'Implemented' ? 'selected' : ''}>Implemented ✅</option>
                        <option value="Partially Implemented" ${metricsNode.status === 'Partially Implemented' ? 'selected' : ''}>Partially Implemented ⚠️</option>
                        <option value="Not Implemented" ${metricsNode.status === 'Not Implemented' ? 'selected' : ''}>Not Implemented ❌</option>
                    </select>

                    <!-- Conditional Evidence Upload Wrapper UI Element Trigger Block -->
                    <div class="${isImplemented ? '' : 'hidden'} no-print space-y-1">
                        <input type="file" id="follow-upload-${nodeKey}" class="hidden" onchange="window.handleFollowUpEvidenceUpload('${nodeKey}', this)">
                        <button onclick="document.getElementById('follow-upload-${nodeKey}').click()" class="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-[10px] font-black uppercase tracking-wider rounded border border-outline-variant/40 text-slate-600 dark:text-slate-300 transition">
                            <span class="material-symbols-outlined text-[12px]">upload_file</span>
                            <span id="lbl-follow-file-${nodeKey}">${metricsNode.evidenceName ? window.escapeAttr(metricsNode.evidenceName) : 'Upload Compliance Evidence'}</span>
                        </button>
                    </div>

                                       <!-- Conditional Justification Text Area Element Trigger Box Block -->
                    <div class="${needsJustification ? '' : 'hidden'} space-y-1">
                        <label class="block text-[10px] font-bold text-red-500 uppercase tracking-wider">Provide Non-Compliance Justification Narrative:</label>
                        <textarea class="w-full bg-white dark:bg-[#0d0e10] border border-outline-variant/40 dark:border-slate-700 rounded p-1.5 text-xs focus:ring-1 focus:ring-primary focus:outline-none" rows="1.5" placeholder="Enter justification details..."
                                  onchange="window.updateFollowUpMetricNode('${nodeKey}', 'justification', this.value)">${window.escapeAttr(metricsNode.justification || "")}</textarea>
                    </div>
                </td>
                
                <!-- Audit Remarks of Implementation Closure Interface Cell Column Block -->
                <td class="p-3 space-y-2 max-w-sm">
                    <select onchange="window.updateFollowUpMetricNode('${nodeKey}', 'closureStatus', this.value)"
                            class="w-full text-xs font-bold rounded-lg border-0 bg-slate-50 dark:bg-[#0d0e10] p-1.5 focus:ring-1 focus:ring-primary focus:outline-none cursor-pointer">
                        <option value="Open" ${metricsNode.closureStatus === 'Open' ? 'selected' : ''}>Keep Matter Open 🔓</option>
                        <option value="Closed" ${metricsNode.closureStatus === 'Closed' ? 'selected' : ''}>Mark as Closed 🔒</option>
                    </select>

                    <!-- Conditional Extended Remediation Deadline Input Component Wrapper -->
                    <div class="${isClosed ? 'hidden' : ''} flex items-center gap-1.5 pt-0.5 no-print">
                        <span class="text-[10px] font-black uppercase text-slate-400 tracking-wider">Extend Deadline:</span>
                        <input type="date" value="${metricsNode.extendedDate || ''}"
                               onchange="window.updateFollowUpMetricNode('${nodeKey}', 'extendedDate', this.value)"
                               class="bg-slate-50 dark:bg-[#0d0e10] border border-outline-variant/40 dark:border-slate-700 text-[11px] rounded p-1 focus:outline-none text-on-surface dark:text-slate-200 cursor-pointer" />
                    </div>
                    
                    <!-- Read-Only Date Display Cell Layer during Report Exports and Prints Layouts -->
                    <div class="${isClosed ? 'hidden' : ''} hidden print:block text-[11px] font-medium text-slate-500">
                        Extended Deadline Target: <strong class="font-mono">${metricsNode.extendedDate ? window.escapeAttr(metricsNode.extendedDate) : 'Unassigned'}</strong>
                    </div>
                </td>
            `;

            tbody.appendChild(tr);
        });
    });

    // --- AUTOMATED REMEDIATION PROGRESS RATE PERCENTAGE MATH EQUATIONS ---
    const totalChecksCount = totalClosed + totalOpen;
    const computedPercentageRate = totalChecksCount > 0 ? Math.round((totalClosed / totalChecksCount) * 100) : 0;
    updateImplementationPercentageSummaryCard(computedPercentageRate);
}

/**
 * Commits localized inline input edits into deep properties of the core state memory tree layout
 */
window.updateFollowUpMetricNode = function(nodeKey, propertyKey, valueText) {
    const store = window.AuditStore;
    if (!store || !store.current) return;

    if (!store.current.phase2_performing) store.current.phase2_performing = {};
    if (!store.current.phase2_performing.followUpReport) {
        store.current.phase2_performing.followUpReport = { remediationMetrics: {} };
    }
    if (!store.current.phase2_performing.followUpReport.remediationMetrics) {
        store.current.phase2_performing.followUpReport.remediationMetrics = {};
    }
    if (!store.current.phase2_performing.followUpReport.remediationMetrics[nodeKey]) {
        store.current.phase2_performing.followUpReport.remediationMetrics[nodeKey] = {};
    }

    store.current.phase2_performing.followUpReport.remediationMetrics[nodeKey][propertyKey] = valueText;
    
    // Force immediate localized canvas refreshes to draw visibility layout toggles dynamically
    renderFollowUpWorkspace(store.current);
};

/**
 * Handles incoming verification compliance documentation attachments, encoding properties to base64
 */
window.handleFollowUpEvidenceUpload = function(nodeKey, inputElement) {
    const file = inputElement.files[0];
    if (!file) return;

    // Safety Restriction: Stop file uploads exceeding database storage cell thresholds limits (2.5 Megabytes)
    if (file.size > 2500000) {
        alert("Attached remediation file item exceeds system constraint thresholds limitations (2.5MB maximum size block).");
        inputElement.value = "";
        return;
    }

    const reader = new FileReader();
    const lbl = document.getElementById(`lbl-follow-file-${nodeKey}`);
    if (lbl) lbl.textContent = "Uploading asset...";

    reader.onload = function(e) {
        const store = window.AuditStore;
        const metricsMap = store.current.phase2_performing.followUpReport.remediationMetrics[nodeKey];
        
        metricsMap.evidenceName = file.name;
        metricsMap.evidenceDataBase64 = e.target.result;

        if (lbl) lbl.textContent = file.name;
        console.log(`✅ Follow-up compliance document attachment artifact [${file.name}] synced to row memory storage node.`);
    };

    reader.onerror = function() {
        alert("Exception trace hit: Local file reader process terminal state failure.");
        if (lbl) lbl.textContent = "Upload Compliance Evidence";
    };

    reader.readAsDataURL(file);
};

function updateImplementationPercentageSummaryCard(percentageRate) {
    const cardText = document.getElementById("lbl-calc-percentage-summary");
    if (cardText) {
        cardText.textContent = `Status of Implementation Summary Rate Rate Calculations: ${percentageRate}% Complete`;
    }
}

/**
 * Dispatches active signature configurations and review selections forward upstream directly to Firestore
 */
async function commitFollowUpReportWorkspaceProgress() {
    const store = window.AuditStore;
    if (!store || !store.current) return;

    const followUpState = store.current.phase2_performing.followUpReport;
    
    followUpState.authorizerName = document.getElementById("txt-follow-officer").value;
    followUpState.authorizerTitle = document.getElementById("txt-follow-title").value;
    followUpState.secureToken = document.getElementById("txt-follow-token").value;
    followUpState.timestamp = document.getElementById("txt-follow-timestamp").value;

    try {
        await store.save();
        alert("Remediation execution follow-up dashboard parameters saved securely up to cloud persistence records! 🔒🌌");
    } catch(err) {
        console.error("Upstream document storage save exception trace context:", err);
        alert("Transmission fault: Failed to sync tracking rows state parameters to central cloud nodes.");
    }
}

/**
 * Finalizes remediation evaluations, locking authorization sign-off signatures tokens strings
 */
window.generateFollowUpAuthorizationSignatureHash = function() {
    const name = document.getElementById("txt-follow-officer").value;
    if (!name) {
        alert("Please provide the Authorizing Officer's Name parameters to execute legal signatures tokenization strings.");
        return;
    }
    
    // Build secure structural token representation masking administrative hash triggers
    const signatureToken = "SENTINEL-FOLLOW-" + Math.random().toString(36).substring(2, 10).toUpperCase() + "-" + new Date().getFullYear();
    
    document.getElementById("txt-follow-token").value = signatureToken;
    document.getElementById("txt-follow-timestamp").value = new Date().toLocaleDateString('en-KE', { hour: '2-digit', minute: '2-digit' });
    
    // Dispatch instant backup write synchronization patch operation
    commitFollowUpReportWorkspaceProgress();
};

window.triggerSystemPrintLayout = function() { 
    window.print(); 
};
