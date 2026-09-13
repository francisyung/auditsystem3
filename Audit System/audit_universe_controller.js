/**
 * Sentinel Core Audit Universe Controller Module
 * Handles all real-time asynchronous data flow operations for Phase 1, Stage 1.
 */

document.addEventListener("DOMContentLoaded", () => {
    // 1. Initialize core system modules
    if (window.Theme) window.Theme.init();
    
    // 2. Establish continuous cloud pipeline streaming connection
    if (window.AuditStore) {
        window.AuditStore.subscribeToAudit((snapshotData) => {
            renderUniverseWorkspace(snapshotData);
        });
    }

    // 3. Bind interactive search and filter event listeners
    document.getElementById("txt-search")?.addEventListener("input", filterUniverseTable);
    document.getElementById("sel-audited")?.addEventListener("input", filterUniverseTable);
    document.getElementById("sel-owner")?.addEventListener("input", filterUniverseTable);
});

// Track selected item reference string keys in volatile view memory state
let selectedUniverseKeys = new Set();

/**
 * Loops through the active cloud snapshot state document data mapping fields
 */
function renderUniverseWorkspace(data) {
    const universeList = data?.phase1_planning?.universe || [];
    const tbody = document.getElementById("tbl-universe-body");
    if (!tbody) return;

    tbody.innerHTML = "";
    
    // Track unique process owners to populate filter components dynamically
    const ownersList = new Set();

    if (universeList.length === 0) {
        document.getElementById("empty-state-row").classList.remove("hidden");
        updateWorkspaceSummaryMetrics(0, 0);
        return;
    }

    document.getElementById("empty-state-row").classList.add("hidden");

    universeList.forEach((row, idx) => {
        if (row.processOwner) ownersList.add(row.processOwner);
        
        const tr = document.createElement("tr");
        tr.className = "border-b border-outline-variant/30 dark:border-slate-800 last:border-0 hover:bg-surface-container-low dark:hover:bg-slate-900/40 align-middle transition-colors";
        
        const rowId = row.serialNo || `UNIV-${idx}`;
        const isChecked = selectedUniverseKeys.has(rowId);

        tr.innerHTML = `
            <td class="p-4 text-center">
                <input type="checkbox" value="${window.escapeAttr(rowId)}" ${isChecked ? 'checked' : ''} 
                       onchange="handleRowSelectionToggle(this)" 
                       class="rounded border-outline-variant/40 text-primary focus:ring-primary h-4 w-4 bg-transparent cursor-pointer">
            </td>
            <td class="p-4 text-xs font-mono font-bold text-on-surface-variant dark:text-slate-400">${window.escapeAttr(rowId)}</td>
            <td class="p-4 text-xs font-semibold text-on-surface dark:text-slate-200">${window.escapeAttr(row.auditArea || '—')}</td>
            <td class="p-4 text-xs font-medium text-slate-600 dark:text-slate-400">${window.escapeAttr(row.processOwner || '—')}</td>
            <td class="p-4 text-center">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${row.auditedBefore === 'Yes' ? 'bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300' : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400'}">
                    ${window.escapeAttr(row.auditedBefore || 'No')}
                </span>
            </td>
            <td class="p-4 text-xs font-mono font-medium text-primary dark:text-sky-400">${window.escapeAttr(row.referenceNumbers || '—')}</td>
            <td class="p-4 text-xs font-medium text-on-surface-variant dark:text-slate-400 max-w-xs truncate" title="${window.escapeAttr(row.remarks || '')}">${window.escapeAttr(row.remarks || '—')}</td>
        `;
        tbody.appendChild(tr);
    });

    populateFilterDropdowns(Array.from(ownersList));
    updateWorkspaceSummaryMetrics(universeList.length, selectedUniverseKeys.size);
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
        cb.checked = masterCheckbox.checked;
        if (masterCheckbox.checked) {
            selectedUniverseKeys.add(cb.value);
        } else {
            selectedUniverseKeys.delete(cb.value);
        }
    });
    
    const totalCount = window.AuditStore?.current?.phase1_planning?.universe?.length || 0;
    updateWorkspaceSummaryMetrics(totalCount, selectedUniverseKeys.size);
}

/**
 * Dynamically builds structural options lists for the selection filters
 */
function populateFilterDropdowns(ownersArray) {
    const select = document.getElementById("sel-owner");
    if (!select || select.options.length > 1) return; // Prevent loop redundancy rewrites

    ownersArray.forEach(owner => {
        const opt = document.createElement("option");
        opt.value = owner;
        opt.textContent = owner;
        select.appendChild(opt);
    });
}

/**
 * Processes interface filter operations instantly across columns
 */
function filterUniverseTable() {
    const txt = document.getElementById("txt-search").value.toLowerCase();
    const audited = document.getElementById("sel-audited").value;
    const owner = document.getElementById("sel-owner").value;
    
    const rows = document.querySelectorAll("#tbl-universe-body tr");
    let matchCount = 0;

    rows.forEach(row => {
        const areaText = row.children[2].textContent.toLowerCase();
        const refText = row.children[1].textContent.toLowerCase();
        const ownerText = row.children[3].textContent;
        const auditedText = row.children[4].textContent.trim();

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
    const targetModal = document.getElementById("modal-universe-asset");
    if (targetModal) {
        targetModal.classList.remove("hidden");
    } else {
        console.error("💥 UI Layer Error: The modal component wrapper could not be loaded into memory.");
    }
}

/**
 * Injects input dialog modal popups directly onto viewport trees context
 */
function openNewEntryModal() {
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
            
                       <!-- Locate the form inside your modal and update it to this exact code: -->
<form onsubmit="commitNewUniverseAsset(event)" class="space-y-4">
    
    <!-- 1. FIXED: Added the missing input box for Audit Area -->
    <div class="space-y-1">
        <label class="block text-[10px] font-black uppercase text-slate-400 tracking-wider">Audit Area / Scope Subject</label>
        <input type="text" id="txt-new-area" placeholder="e.g. Core Customs System (iCMS)" class="w-full bg-[#1e293b] border border-slate-700/50 p-2.5 text-xs rounded-lg text-white focus:outline-none focus:border-sky-500" required>
    </div>

    <!-- 2. Process Owner Official Title Field -->
    <div class="space-y-1">
        <label class="block text-[10px] font-black uppercase text-slate-400 tracking-wider">Process Owner Official Title</label>
        <input type="text" id="txt-new-owner-title" placeholder="e.g. ICT Department" class="w-full bg-[#1e293b] border border-slate-700/50 p-2.5 text-xs rounded-lg text-white focus:outline-none focus:border-sky-500" required>
    </div>

    <!-- 3. Historical and Ref Parameters Row -->
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

    <!-- 4. Strategic Narrative Remarks Field -->
    <div class="space-y-1">
        <label class="block text-[10px] font-black uppercase text-slate-400 tracking-wider">Strategic Narrative Remarks</label>
        <textarea id="txt-new-remarks" rows="3" placeholder="Enter baseline description observations..." class="w-full bg-[#1e293b] border border-slate-700/50 p-2.5 text-xs rounded-lg text-white focus:outline-none focus:border-sky-500" required></textarea>
    </div>

    <!-- Actions Control Buttons Row -->
    <div class="flex justify-end items-center gap-4 pt-4 border-t border-slate-800">
        <button type="button" onclick="document.getElementById('modal-universe-asset').classList.add('hidden')" class="text-xs font-bold text-slate-400 hover:text-white transition-colors">Cancel</button>
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
    if (!activeForm) {
        alert("System error: Form submission target could not be resolved.");
        return;
    }

    // Safely pull the values using robust selectors
    const elAreaName   = activeForm.querySelector("#txt-new-area");
    const elOwnerTitle = activeForm.querySelector("#txt-new-owner-title");
    const elRemarks    = activeForm.querySelector("#txt-new-remarks");
    const elAuditedPrior = activeForm.querySelector("#sel-new-audited-prior");
    const elPriorRefCode = activeForm.querySelector("#txt-new-prior-ref");

    const areaName   = elAreaName ? elAreaName.value.trim() : "";
    const ownerTitle = elOwnerTitle ? elOwnerTitle.value.trim() : "";
    const remarks    = elRemarks ? elRemarks.value.trim() : "";
    const auditedPrior = elAuditedPrior ? elAuditedPrior.value : "No";
    const priorRefCode = elPriorRefCode ? elPriorRefCode.value.trim() : "";

    if (!areaName || !ownerTitle || !remarks) {
        alert("Please complete all required parameters (Audit Area, Process Owner Title, and Remarks).");
        return;
    }

    // --- FIX: Create an isolated clone of the existing universe array ---
    // This breaks the link to store.current and avoids snapshots clearing data mid-execution
    const baseUniverse = store.current?.phase1_planning?.universe || [];
    const decoupledUniverseClone = JSON.parse(JSON.stringify(baseUniverse));
    
    const generatedId = `UNIV-${decoupledUniverseClone.length + 1}`;

    const newAssetRecord = {
        serialNo: generatedId,          
        auditArea: areaName,            
        processOwner: ownerTitle,       
        auditedBefore: auditedPrior,    
        referenceNumbers: priorRefCode || "No Prior Record", 
        remarks: remarks                
    };

    // Push into the isolated copy
    decoupledUniverseClone.push(newAssetRecord);

    console.log("💾 Dispatching structural pipeline artifact package to central cloud store node...", newAssetRecord);

    try {
        // Send the complete decoupled data array upstream directly
        await store.updateUniverse(decoupledUniverseClone);
        
        // Reset form controls
        activeForm.reset();
        
        // Dismiss UI wrappers and overlay backdrops
        document.getElementById("universe-modal")?.remove();
        document.getElementById("modal-universe-asset")?.classList.add("hidden");
        document.querySelectorAll(".fixed.inset-0").forEach(overlay => overlay.classList.add("hidden"));
        
        alert("New evaluation framework asset registered successfully to cloud registry! 🌌");
    } catch (err) {
        console.error("💥 Cloud transmission error trace:", err);
        alert("Failed to synchronize asset data entries up to cloud database.");
    }
}
/**
 * Pipelines selected data keys into Phase 1, Stage 2
 */
async function commitSelectionAndProceed() {
    const store = window.AuditStore;
    if (!store || !store.current || selectedUniverseKeys.size === 0) return;

    const fullUniverse = store.current.phase1_planning.universe || [];
    
    // Filter matching data structures out of inventory
    const filteredSelection = fullUniverse.filter(item => selectedUniverseKeys.has(item.serialNo));

    // Map selection items into Risk Assessment placeholder rows structure
    const initialRiskRows = filteredSelection.map(item => ({
        riskId: `RISK-${item.serialNo.split('-').pop()}`,
        riskIdentification: "",
        riskDescription: `Vulnerability audit mapped for scope item: ${item.auditArea}`,
        riskCauses: "",
        riskCategory: "IT",
        existingControls: "",
        likelihood: "1",
        impact: "1",
        riskScore: 1,
        riskOwner: item.processOwner,
        department: "Operations",
        isCommittedToPlan: false
    }));

    try {
        await store.updateRiskRegister(initialRiskRows);
        window.location.href = "risk-assessment.html";
    } catch(err) {
        alert("Failed to advance stages due to secure cloud connection timeouts.");
    }
}
