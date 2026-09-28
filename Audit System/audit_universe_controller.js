/**
 * Sentinel Core Audit Universe Controller Module
 * Handles all real-time asynchronous data flow operations for Phase 1, Stage 1.
 * PART 1 OF 2: WORKSPACE RENDERERS, SEGREGATION BADGES & CONDITIONAL INTERACTION GATES
 */

document.addEventListener("DOMContentLoaded", () => {
    if (window.Theme) window.Theme.init();
    
    if (window.AuditStore) {
        window.AuditStore.subscribeToAudit((snapshotData) => {
            renderUniverseWorkspace(snapshotData);
        });
    }

    document.getElementById("txt-search")?.addEventListener("input", filterUniverseTable);
    document.getElementById("sel-audited")?.addEventListener("input", filterUniverseTable);
    document.getElementById("sel-owner")?.addEventListener("input", filterUniverseTable);
});

let selectedUniverseKeys = new Set();

/**
 * Loops through the active cloud snapshot state document data mapping fields
 */
function renderUniverseWorkspace(data) {
    const universeList = data?.phase1_planning?.universe || [];
    const tbody = document.getElementById("tbl-universe-body");
    if (!tbody) return;

    tbody.innerHTML = "";
    const ownersList = new Set();

    if (universeList.length === 0) {
        document.getElementById("empty-state-row").classList.remove("hidden");
        updateWorkspaceSummaryMetrics(0, 0);
        return;
    }

    document.getElementById("empty-state-row").classList.add("hidden");
    const activeUserRole = localStorage.getItem("sentinel_active_role") || "officer";

    universeList.forEach((row, idx) => {
        if (row.processOwner) ownersList.add(row.processOwner);
        
        // Initialize structural tracking state parameters if absent on incoming records
        if (!row.trackingState) {
            row.trackingState = { status: "Draft", currentHolder: "officer", requestType: "Addition", historyLogs: [] };
        }

        const tr = document.createElement("tr");
        tr.className = "border-b border-outline-variant/30 dark:border-slate-800 last:border-0 hover:bg-surface-container-low dark:hover:bg-slate-900/40 align-middle transition-colors";
        
        const rowId = row.serialNo || `UNIV-${idx}`;
        const isChecked = selectedUniverseKeys.has(rowId);
        
        // Determine execution permissions and tracking text tokens
        const tState = row.trackingState;
        const badgeColorMap = {
            "Draft": "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400",
            "Pending_Lead": "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300",
            "Pending_Reviewer": "bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300",
            "Pending_Approver": "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300",
            "Approved": "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300",
            "Returned_To_Officer": "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300"
        };
        const statusBadgeStyle = badgeColorMap[tState.status] || "bg-slate-100 text-slate-800";

        // Generate dynamic gateway action panels or comment rows based on active context holders
        let actionCellControlsHtml = "";
        
        if (activeUserRole === tState.currentHolder && tState.status !== "Approved") {
            if (activeUserRole === "officer") {
                actionCellControlsHtml = `
                    <div class="flex items-center gap-1.5 justify-center">
                        <button onclick="dispatchGateStateChange('${idx}', 'Pending_Lead', 'Submitted to Lead Auditor')" class="px-2 py-1 text-[10px] font-black uppercase bg-sky-600 hover:bg-sky-700 text-white rounded transition-all">Submit</button>
                        <button onclick="requestRecordPurgeGate('${idx}')" class="px-2 py-1 text-[10px] font-black uppercase bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white rounded transition-all">Delete</button>
                    </div>`;
            } else {
                // Interactive action console for Reviewers, Lead Auditors, and Approvers
                actionCellControlsHtml = buildGatekeeperConsoleInterface(idx, tState, activeUserRole);
            }
        } else {
            // Read-only indicator status layout for profiles waiting on authorization layers
            const displayHolderLabel = tState.status === "Approved" ? "Registry Verified" : `Held by [${tState.currentHolder.toUpperCase()}]`;
            actionCellControlsHtml = `
                <div class="text-center font-mono text-[9px] uppercase tracking-wider text-slate-500 font-bold">
                    ${displayHolderLabel}
                </div>`;
        }

        // Lock checkbox selecting functions out entirely unless the asset is fully approved by the signature authority
        const isCheckboxDisabled = tState.status !== "Approved" ? "disabled opacity-20 pointer-events-none" : "";

                tr.innerHTML = `
            <td class="p-4 text-center">
                <input type="checkbox" value="${window.escapeAttr(rowId)}" ${isChecked ? 'checked' : ''} ${isCheckboxDisabled}
                       onchange="handleRowSelectionToggle(this)" 
                       class="rounded border-outline-variant/40 text-primary focus:ring-primary h-4 w-4 bg-transparent cursor-pointer">
            </td>
            <td class="p-4 text-xs font-mono font-bold text-on-surface-variant dark:text-slate-400">${window.escapeAttr(rowId)}</td>
            <td class="p-4 text-xs font-semibold text-on-surface dark:text-slate-200">
                <div class="font-bold">${window.escapeAttr(row.auditArea || '—')}</div>
                ${tState.requestType === 'Deletion' ? '<div class="text-[9px] font-black tracking-widest text-red-500 uppercase mt-0.5 animate-pulse">⚠️ Requesting Deletion</div>' : ''}
            </td>
            <td class="p-4 text-xs font-medium text-slate-600 dark:text-slate-400">${window.escapeAttr(row.processOwner || '—')}</td>
            <td class="p-4 text-center">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${row.auditedBefore === 'Yes' ? 'bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300' : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400'}">
                    ${window.escapeAttr(row.auditedBefore || 'No')}
                </span>
            </td>
            <!-- 1. FIXED REFERENCE NUMBERS CELL (Displays prior record or AUD codes) -->
            <td class="p-4 text-center text-xs font-mono font-semibold text-slate-600 dark:text-slate-400">
                ${window.escapeAttr(row.referenceNumbers || 'No Prior Record')}
            </td>
            <!-- 2. FIXED SECURITY WORKFLOW STATUS CELL (Aligns with your new header configuration) -->
            <td class="p-4 text-center">
                <span class="inline-flex items-center px-2 py-0.5 rounded font-mono text-[9px] font-black uppercase tracking-wider ${statusBadgeStyle}">
                    ${tState.status.replace(/_/g, ' ')}
                </span>
            </td>
            <td class="p-4 text-xs font-medium text-on-surface-variant dark:text-slate-400 max-w-xs truncate" title="${window.escapeAttr(row.remarks || '')}">
                ${window.escapeAttr(row.remarks || '—')}
            </td>
            <!-- 3. FIXED ACTION BUTTON CELL WITH FLEXIBLE WIDTH CONTROL -->
            <td class="p-4 min-w-[160px]">${actionCellControlsHtml}</td>
        `;

        tbody.appendChild(tr);
    });

    populateFilterDropdowns(Array.from(ownersList));
    updateWorkspaceSummaryMetrics(universeList.length, selectedUniverseKeys.size);
}
/**
 * Sentinel Core Audit Universe Controller Module
 * PART 2 OF 2: GATEKEEPER COMPONENT BUILDERS, COMMENT HANDLERS & ASYNC PIPELINE CONTROLS
 */

/**
 * Builds the interactive review template container for verification nodes
 * Generates specific workflow buttons and comment inputs depending on the role profile
 */
function buildGatekeeperConsoleInterface(rowIndex, trackingState, activeUserRole) {
    const isDeletionRequest = trackingState.requestType === "Deletion";
    
    // Core comment template container layout
    let htmlOutput = `<div class="flex flex-col gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-800/60 rounded border border-slate-700/30 max-w-[240px] mx-auto">
        <input type="text" id="txt-gate-comment-${rowIndex}" placeholder="Enter audit review remarks..." 
               class="w-full bg-[#1e293b] border border-slate-700/50 p-1 text-[10px] rounded text-white focus:outline-none">`;

    if (isDeletionRequest) {
        // Deletions are resolved completely inside the Lead Auditor profile gate
        if (activeUserRole === "leadauditor") {
            htmlOutput += `
                <div class="flex items-center gap-1 justify-between mt-1">
                    <button onclick="resolvePurgeDecision('${rowIndex}', true)" class="w-1/2 px-1.5 py-0.5 text-[9px] font-black uppercase bg-rose-600 hover:bg-rose-700 text-white rounded transition-all">Confirm Delete</button>
                    <button onclick="resolvePurgeDecision('${rowIndex}', false)" class="w-1/2 px-1.5 py-0.5 text-[9px] font-black uppercase bg-slate-600 hover:bg-slate-700 text-white rounded transition-all">Reject Del</button>
                </div>`;
        } else {
            htmlOutput += `<div class="text-[9px] text-center text-slate-400 font-bold uppercase tracking-wider italic pt-0.5">Awaiting Lead Purge Decision</div>`;
        }
    } else {
        // Standard addition gate routing mappings
        if (activeUserRole === "leadauditor") {
            htmlOutput += `
                <div class="flex items-center gap-1 justify-between mt-1">
                    <button onclick="dispatchGateStateChange('${rowIndex}', 'Pending_Reviewer')" class="w-1/2 px-1.5 py-0.5 text-[9px] font-black uppercase bg-sky-600 hover:bg-sky-700 text-white rounded transition-all">To Reviewer</button>
                    <button onclick="dispatchGateStateChange('${rowIndex}', 'Returned_To_Officer')" class="w-1/2 px-1.5 py-0.5 text-[9px] font-black uppercase bg-amber-600 hover:bg-amber-700 text-white rounded transition-all">Return Offr</button>
                </div>`;
        } else if (activeUserRole === "reviewer") {
            htmlOutput += `
                <div class="flex items-center gap-1 justify-between mt-1">
                    <button onclick="dispatchGateStateChange('${rowIndex}', 'Pending_Approver')" class="w-1/2 px-1.5 py-0.5 text-[9px] font-black uppercase bg-indigo-600 hover:bg-indigo-700 text-white rounded transition-all">To Approver</button>
                    <button onclick="dispatchGateStateChange('${rowIndex}', 'Returned_To_Lead')" class="w-1/2 px-1.5 py-0.5 text-[9px] font-black uppercase bg-amber-600 hover:bg-amber-700 text-white rounded transition-all">Return Lead</button>
                </div>`;
        } else if (activeUserRole === "approver") {
            htmlOutput += `
                <div class="flex items-center gap-1 justify-between mt-1">
                    <button onclick="dispatchGateStateChange('${rowIndex}', 'Approved')" class="w-1/2 px-1.5 py-0.5 text-[9px] font-black uppercase bg-emerald-600 hover:bg-emerald-700 text-white rounded transition-all">Approve Risk</button>
                    <button onclick="dispatchGateStateChange('${rowIndex}', 'Returned_To_Officer')" class="w-1/2 px-1.5 py-0.5 text-[9px] font-black uppercase bg-rose-600 hover:bg-rose-700 text-white rounded transition-all">Reject Offr</button>
                </div>`;
        }
    }

    htmlOutput += `</div>`;
    return htmlOutput;
}

/**
 * Fires the state mutations upstream to the centralized store engine core
 */
async function dispatchGateStateChange(rowIndex, targetStatus, fallbackComment = "") {
    const commentInput = document.getElementById(`txt-gate-comment-${rowIndex}`);
    const actualComment = commentInput ? commentInput.value.trim() : "";

    if (!actualComment && (targetStatus.startsWith("Returned") || targetStatus === "Returned_To_Officer")) {
        alert("Action Required: Please input a descriptive review comment clarifying your reason for returning this record asset.");
        return;
    }

    const compiledComment = actualComment || fallbackComment || `Passed review verification parameters into state ${targetStatus}`;

    try {
        if (window.AuditStore) {
            await window.AuditStore.routeWorkflowStateChange("universe", parseInt(rowIndex), targetStatus, compiledComment);
        }
    } catch (err) {
        console.error("Workflow transmission failure context trace:", err);
    }
}

/**
 * Handles the initial deletion request raised by system Drivers (Officers)
 */
async function requestRecordPurgeGate(rowIndex) {
    if (!confirm("Are you sure you want to request the complete deletion of this scope asset record from the global register index?")) return;
    
    try {
        if (window.AuditStore) {
            await window.AuditStore.executeOrRequestDeletion("universe", parseInt(rowIndex));
        }
    } catch (err) {
        console.error("Failed to commit deletion request parameters downstream.", err);
    }
}

/**
 * Resolves the final confirmation or rollback of a deletion request by the Lead Auditor profile gate
 */
async function resolvePurgeDecision(rowIndex, isConfirmedTrue) {
    const commentInput = document.getElementById(`txt-gate-comment-${rowIndex}`);
    const actualComment = commentInput ? commentInput.value.trim() : "";

    if (isConfirmedTrue) {
        if (!confirm("CRITICAL AUDIT NOTICE: Confirming this action permanently deletes this record subject. Continue?")) return;
        try {
            await window.AuditStore.executeOrRequestDeletion("universe", parseInt(rowIndex), "APPROVED_DELETE");
        } catch (err) {
            console.error("Purge failure trace:", err);
        }
    } else {
        if (!actualComment) {
            alert("Action Required: Please enter your reason for rejecting this deletion request into the remarks comment input field.");
            return;
        }
        try {
            await window.AuditStore.executeOrRequestDeletion("universe", parseInt(rowIndex), actualComment);
        } catch (err) {
            console.error("Purge fallback execution tracking exception:", err);
        }
    }
}

/**
 * Handles selective row picking actions
 */
function handleRowSelectionToggle(checkboxElement) {
    const val = checkboxElement.value;
    if (checkboxElement.checked) {
        selectedUniverseKeys.add(val);
    } else {
        selectedUniverseKeys.delete(val);
    }
    
    const totalCount = window.AuditStore?.current?.phase1_planning?.universe?.length || 0;
    updateWorkspaceSummaryMetrics(totalCount, selectedUniverseKeys.size);
}

function toggleSelectAllVisible(masterCheckbox) {
    const visibleCheckboxes = document.querySelectorAll("#tbl-universe-body input[type='checkbox']");
    visibleCheckboxes.forEach(cb => {
        if (!cb.disabled) { // Respect segregation controls
            cb.checked = masterCheckbox.checked;
            if (masterCheckbox.checked) {
                selectedUniverseKeys.add(cb.value);
            } else {
                selectedUniverseKeys.delete(cb.value);
            }
        }
    });
    
    const totalCount = window.AuditStore?.current?.phase1_planning?.universe?.length || 0;
    updateWorkspaceSummaryMetrics(totalCount, selectedUniverseKeys.size);
}

function populateFilterDropdowns(ownersArray) {
    const select = document.getElementById("sel-owner");
    if (!select || select.options.length > 1) return;

    ownersArray.forEach(owner => {
        const opt = document.createElement("option");
        opt.value = owner;
        opt.textContent = owner;
        select.appendChild(opt);
    });
}

function filterUniverseTable() {
    const txt = document.getElementById("txt-search").value.toLowerCase();
    const audited = document.getElementById("sel-audited").value;
    const owner = document.getElementById("sel-owner").value;
    
    const rows = document.querySelectorAll("#tbl-universe-body tr");
    let matchCount = 0;

    rows.forEach(row => {
        const areaText = row.children[2]?.textContent.toLowerCase() || "";
        const refText = row.children[1]?.textContent.toLowerCase() || "";
        const ownerText = row.children[3]?.textContent || "";
        const auditedText = row.children[4]?.textContent.trim() || "";

        const matchesTxt = areaText.includes(txt) || refText.includes(txt);
        const matchesAudited = audited === "All" || auditedText === audited;
        const matchesOwner = owner === "All Owners" || ownerText === owner;

        if (matchesTxt && matchesAudited && matchesOwner) {
            row.classList.remove("hidden");
            matchCount++;
        } else {
            row.classList.add("hidden");
        }
    });

    document.getElementById("lbl-entries-count").textContent = `Showing ${matchCount} of ${window.AuditStore?.current?.phase1_planning?.universe?.length || 0} entries`;
}

function updateWorkspaceSummaryMetrics(total, selected) {
    document.getElementById("lbl-entries-count").textContent = `Showing ${total} of ${total} entries`;
    document.getElementById("lbl-selected-badge").textContent = `${selected} audit area(s) selected`;
    
        const btn = document.getElementById("btn-proceed");
    if (btn) {
        if (selected > 0) {
            btn.classList.remove("opacity-40", "pointer-events-none");
        } else {
            btn.classList.add("opacity-40", "pointer-events-none");
        }
    }
}

function openNewEntryModal() {
    // Structural layout wrapper template for registering items (forces starting state to 'Draft')
    const modal = document.createElement("div");
    modal.id = "universe-modal";
    modal.className = "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in";
    modal.innerHTML = `
        <div class="bg-white dark:bg-[#1a1c1e] rounded-2xl border border-outline-variant/30 max-w-lg w-full overflow-hidden shadow-2xl p-6 space-y-4 transform transition-all duration-300 scale-100">
            <div class="flex items-center justify-between border-b border-outline-variant/20 pb-3">
                <h3 class="text-base font-black text-primary dark:text-sky-400 uppercase tracking-wider flex items-center gap-2">
                    <span class="material-symbols-outlined">add_box</span> Register New Scope Asset
                </h3>
                <button onclick="closeNewEntryModal()" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                    <span class="material-symbols-outlined">close</span>
                </button>
            </div>
            <form onsubmit="commitNewUniverseAsset(event)" class="space-y-4">
                <div class="space-y-1">
                    <label class="block text-[10px] font-black uppercase text-slate-400 tracking-wider">Audit Area / Scope Subject</label>
                    <input type="text" id="txt-new-area" placeholder="e.g. Core Customs System (iCMS)" class="w-full bg-[#1e293b] border border-slate-700/50 p-2.5 text-xs rounded-lg text-white focus:outline-none focus:border-sky-500" required>
                </div>
                <div class="space-y-1">
                    <label class="block text-[10px] font-black uppercase text-slate-400 tracking-wider">Process Owner Official Title</label>
                    <input type="text" id="txt-new-owner-title" placeholder="e.g. ICT Department" class="w-full bg-[#1e293b] border border-slate-700/50 p-2.5 text-xs rounded-lg text-white focus:outline-none focus:border-sky-500" required>
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div class="space-y-1">
                        <label class="block text-[10px] font-black uppercase text-slate-400 tracking-wider">Audited Historically?</label>
                        <select id="sel-new-audited-prior" class="w-full bg-[#1e293b] border border-slate-700/50 p-2.5 text-xs rounded-lg text-white font-semibold focus:outline-none focus:border-sky-500">
                            <option value="No">No</option>
                            <option value="Yes">Yes</option>
                        </select>
                    </div>
                    <div class="space-y-1">
                        <label class="block text-[10px] font-black uppercase text-slate-400 tracking-wider">Prior Ref Identification Code</label>
                        <input type="text" id="txt-new-prior-ref" placeholder="e.g. AUD-001" class="w-full bg-[#1e293b] border border-slate-700/50 p-2.5 text-xs rounded-lg text-white focus:outline-none focus:border-sky-500">
                    </div>
                </div>
                <div class="space-y-1">
                    <label class="block text-[10px] font-black uppercase text-slate-400 tracking-wider">Strategic Narrative Remarks</label>
                    <textarea id="txt-new-remarks" rows="3" placeholder="Enter baseline description observations..." class="w-full bg-[#1e293b] border border-slate-700/50 p-2.5 text-xs rounded-lg text-white focus:outline-none focus:border-sky-500" required></textarea>
                </div>
                <div class="flex justify-end items-center gap-4 pt-4 border-t border-slate-800">
                    <button type="button" onclick="closeNewEntryModal()" class="text-xs font-bold text-slate-400 hover:text-white transition-colors">Cancel</button>
                    <button type="submit" class="px-5 py-2.5 text-xs font-black uppercase tracking-wide bg-sky-500 hover:bg-sky-600 text-white rounded-lg shadow-md transition-all">
                        Register Asset
                    </button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
}

function closeNewEntryModal() {
    document.getElementById("universe-modal")?.remove();
}

async function commitNewUniverseAsset(event) {
    if (event) event.preventDefault();

    const store = window.AuditStore;
    if (!store || !store.current) return;

    const activeForm = event.target;
    const elAreaName = activeForm.querySelector("#txt-new-area");
    const elOwnerTitle = activeForm.querySelector("#txt-new-owner-title");
    const elRemarks = activeForm.querySelector("#txt-new-remarks");
    const elAuditedPrior = activeForm.querySelector("#sel-new-audited-prior");
    const elPriorRefCode = activeForm.querySelector("#txt-new-prior-ref");

    const areaName = elAreaName ? elAreaName.value.trim() : "";
    const ownerTitle = elOwnerTitle ? elOwnerTitle.value.trim() : "";
    const remarks = elRemarks ? elRemarks.value.trim() : "";
    const auditedPrior = elAuditedPrior ? elAuditedPrior.value : "No";
    const priorRefCode = elPriorRefCode ? elPriorRefCode.value.trim() : "";

    if (!areaName || !ownerTitle || !remarks) {
        alert("Please complete all required parameters.");
        return;
    }

    const baseUniverse = store.current?.phase1_planning?.universe || [];
    const decoupledUniverseClone = JSON.parse(JSON.stringify(baseUniverse));
    const generatedId = `UNIV-${decoupledUniverseClone.length + 1}`;

    const newAssetRecord = {
        serialNo: generatedId,          
        auditArea: areaName,            
        processOwner: ownerTitle,       
        auditedBefore: auditedPrior,    
        referenceNumbers: priorRefCode || "No Prior Record", 
        remarks: remarks,
        // Establish baseline approval parameters instantly
        trackingState: { status: "Draft", currentHolder: "officer", requestType: "Addition", historyLogs: [] }
    };

    decoupledUniverseClone.push(newAssetRecord);

    try {
        await store.updateUniverse(decoupledUniverseClone);
        closeNewEntryModal();
        alert("New asset registered as 'Draft' for internal approval processing loops! 🌌");
    } catch (err) {
        alert("Failed to synchronize asset data entries.");
    }
}

async function commitSelectionAndProceed() {
    const store = window.AuditStore;
    if (!store || !store.current || selectedUniverseKeys.size === 0) return;

    const fullUniverse = store.current.phase1_planning.universe || [];
    const existingRiskRegister = store.current.phase1_planning.riskRegister || [];
    const filteredSelection = fullUniverse.filter(item => selectedUniverseKeys.has(item.serialNo));

    const updatedRiskRows = filteredSelection.map(item => {
        const targetRiskId = `RISK-${item.serialNo.split('-').pop()}`;
        const preExistingRecord = existingRiskRegister.find(r => r.riskId === targetRiskId);
        
        if (preExistingRecord) return preExistingRecord;

        return {
            riskId: targetRiskId,
            riskIdentification: "",
            riskDescription: `: ${item.auditArea}`,
            riskCauses: "",
            riskCategory: "IT",
            existingControls: "",
            likelihood: "1",
            impact: "1",
            riskScore: 1,
            riskOwner: item.processOwner,
            department: "Operations",
            isCommittedToPlan: false,
            // Track approval state loop variables for Risk Register stage independently
            trackingState: { status: "Draft", currentHolder: "officer", historyLogs: [] }
        };
    });

    try {
        await store.updateRiskRegister(updatedRiskRows);
        window.location.href = "risk-assessment.html";
    } catch(err) {
        alert("Failed to advance stages due to cloud timeouts.");
    }
}
