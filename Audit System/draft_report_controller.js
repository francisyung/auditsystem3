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
            // Read selection context tracker pointer key from previous page
            let cloudIndex = snapshotData?.phase1_planning?.selectedExecutionId;
            if (cloudIndex !== undefined && cloudIndex !== null) {
                activeTargetIndex = parseInt(cloudIndex);
            }
            renderDraftReportWorkspace(snapshotData);
        });
    }
});

/**
 * Parses cloud snapshots to load baseline variables and interactive lists
 */
function renderDraftReportWorkspace(data) {
    const workPlanList = data?.phase1_planning?.workPlan || [];
    const universeList = data?.phase1_planning?.universe || [];
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

    // --- ENHANCED PIPELINE INHERITANCE: RESOLVE DYNAMIC HEADER BANNERS ---
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

    // Dynamic Header Label Canvas Population
    const lblTitle = document.getElementById("lbl-pull-title");
    if (lblTitle) lblTitle.textContent = auditTitle.toUpperCase();

    const lblDept = document.getElementById("lbl-pull-department");
    if (lblDept) lblDept.textContent = resolvedDepartment.toUpperCase();

    const lblPeriod = document.getElementById("lbl-pull-period");
    if (lblPeriod) lblPeriod.textContent = resolvedPeriodTimeline;

    // --- READ-ONLY READOUT TILES MATRIX DECK ---
    const lblBg = document.getElementById("lbl-pull-bg");
    if (lblBg) lblBg.textContent = data?.phase2_performing?.planProgram?.introductionBackground || "—";
    
    const lblRisks = document.getElementById("lbl-pull-risks");
    if (lblRisks) lblRisks.textContent = targetRow.riskDescription || "—";
    
    const lblObjProfile = document.getElementById("lbl-pull-objectives");
    if (lblObjProfile) lblObjProfile.textContent = targetRow.auditObjectives || "—";
    
    const lblScope = document.getElementById("lbl-pull-scope");
    if (lblScope) lblScope.textContent = targetRow.auditScopeBoundaries || "—";
    
    const lblMethodology = document.getElementById("lbl-pull-methodology");
    if (lblMethodology) lblMethodology.textContent = data?.phase2_performing?.planProgram?.methodology || "—";
    
    const lblCriteria = document.getElementById("lbl-pull-criteria");
    if (lblCriteria) lblCriteria.textContent = data?.phase2_performing?.planProgram?.evaluationCriteria || "—";
    
    const lblDuration = document.getElementById("lbl-pull-duration");
    if (lblDuration) lblDuration.textContent = `${targetRow.durationValue || 4} ${targetRow.scale || 'Weeks'}`;

    // --- POPULATE EXECUTIVE SUMMARY SEGMENTS CANVAS AREAS ---
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

    // --- RENDER DYNAMIC RESTURCTURED TABLES ---
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

function populateTargetRiskSelector(workPlanList) {
    const select = document.getElementById("sel-audit-target");
    if (!select) return;
    
    // Select dynamic values while preserving user inputs focus elements state
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
        renderDraftReportWorkspace(store.current);
    }
}

/**
 * Renders the restructured One-to-Many Objective -> Observations Findings Grid Table Layout
 */
function renderFindingsMatrixTable(findingsArray, targetRow) {
    const tbody = document.getElementById("tbl-findings-body");
    if (!tbody) return;
    tbody.innerHTML = "";

    // If completely empty, seed a baseline structural object containing a sub-observation card block
    if (findingsArray.length === 0) {
        findingsArray = [
            { 
                objective: targetRow.auditObjectives || "Evaluate core system security controls mandate context.", 
                observations: [
                    {
                        observation: "",
                        standard: "",
                        practice: "",
                        rootCause: "",
                        implications: "",
                        recommendations: "", 
                        mgmtAction: "",
                        mgmtTimeline: "",
                        mgmtResponsible: ""
                    }
                ]
            }
        ];
        if (window.AuditStore?.current) {
            window.AuditStore.current.phase2_performing.draftReport.findings = findingsArray;
        }
    }

       findingsArray.forEach((findingBlock, objIdx) => {
        const subObsArray = findingBlock.observations || [];
        const rowspanTotalCount = subObsArray.length || 1;

        subObsArray.forEach((obsNode, obsIdx) => {
            const tr = document.createElement("tr");
            tr.className = "border-b border-outline-variant/30 dark:border-slate-800 hover:bg-surface-container-low/20 align-top transition-colors";
            
            let objectiveCellMarkup = "";

            // Inject Objective column spanning cells only on the very first sub-observation row definition block
            if (obsIdx === 0) {
                objectiveCellMarkup = `
                    <td class="p-3 text-center text-xs font-mono font-bold text-on-surface-variant bg-surface-container-low/40 align-middle" rowspan="${rowspanTotalCount}">
                        ${objIdx + 1}
                    </td>
                    <td class="p-2 border-r border-outline-variant/20 max-w-xs" rowspan="${rowspanTotalCount}">
                        <textarea class="w-full bg-transparent border-0 focus:ring-0 text-xs font-bold p-1 min-h-[10rem] resize-y focus:outline-none" 
                                  placeholder="Objective..." 
                                  onchange="window.updateObjectiveBlockText(${objIdx}, this.value)">${window.escapeAttr(findingBlock.objective || "")}</textarea>
                        <div class="mt-2 no-print text-center px-1">
                            <button onclick="window.addObservationSubNodeRow(${objIdx})" class="px-2 py-1 bg-primary dark:bg-sky-500 text-white font-black text-[9px] uppercase tracking-wider rounded shadow hover:opacity-90 transition-all flex items-center gap-0.5 mx-auto">
                                <span class="material-symbols-outlined text-[10px]">add_circle</span> Add Finding
                            </button>
                        </div>
                    </td>
                `;
            }

            tr.innerHTML = `
                ${objectiveCellMarkup}
                
                <!-- Audit Findings Nested Breakdown Structure Fields -->
                <div class="space-y-1">
                        <!-- Flex header housing Title row text along with Evidence File Upload Elements -->
                        <div class="flex justify-between items-center mb-1">
                            <div class="flex items-center gap-2">
                                <label class="block text-[11px] font-black text-primary dark:text-sky-400">• Observation ${obsIdx + 1}:</label>
                                
                                <!-- Hidden Native Computer Local Storage File Input Field Component -->
                                <input type="file" id="file-upload-${objIdx}-${obsIdx}" class="hidden" onchange="window.handleObservationFileAttachment(${objIdx}, ${obsIdx}, this)">
                                
                                <!-- Evidence Attachment Trigger Click Label Badge -->
                                <button onclick="document.getElementById('file-upload-${objIdx}-${obsIdx}').click()" 
                                        class="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[10px] font-bold rounded text-slate-600 dark:text-slate-300 transition no-print focus:outline-none"
                                        title="${obsNode.attachedFileName ? 'Replace attached working paper reference' : 'Attach supporting files evidence'}">
                                    <span class="material-symbols-outlined text-[12px]">attach_file</span> 
                                    <span id="lbl-file-${objIdx}-${obsIdx}">${obsNode.attachedFileName ? window.escapeAttr(obsNode.attachedFileName) : 'Attach Paper'}</span>
                                </button>
                            </div>
                            ${subObsArray.length > 1 ? `<button onclick="window.removeObservationSubNodeRow(${objIdx}, ${obsIdx})" class="text-[10px] font-black text-red-500 uppercase tracking-widest no-print hover:underline focus:outline-none">Delete</button>` : ''}
                        </div>

                        <!-- Core Observation Descriptive Gap Narrative Input Text Area (PRESERVED) -->
                        <textarea class="w-full bg-white dark:bg-[#0d0e10] border border-outline-variant/40 dark:border-slate-700 rounded p-1.5 text-xs focus:ring-1 focus:ring-primary focus:outline-none" 
                                  rows="2" 
                                  placeholder="Describe the core observation/gap..."
                                  onchange="window.updateObservationSubNodeField(${objIdx}, ${obsIdx}, 'observation', this.value)">${window.escapeAttr(obsNode.observation || "")}</textarea>
                    </div>
                    <div class="space-y-1">
                        <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Criteria / Standard:</label>
                        <textarea class="w-full bg-white dark:bg-[#0d0e10] border border-outline-variant/40 dark:border-slate-700 rounded p-1.5 text-xs focus:ring-1 focus:ring-primary focus:outline-none" rows="1" placeholder="What should be the benchmark?"
                                  onchange="window.updateObservationSubNodeField(${objIdx}, ${obsIdx}, 'standard', this.value)">${window.escapeAttr(obsNode.standard || "")}</textarea>
                    </div>
                    <div class="space-y-1">
                        <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Actual Practice:</label>
                        <textarea class="w-full bg-white dark:bg-[#0d0e10] border border-outline-variant/40 dark:border-slate-700 rounded p-1.5 text-xs focus:ring-1 focus:ring-primary focus:outline-none" rows="1" placeholder="What is the actual state?"
                                  onchange="window.updateObservationSubNodeField(${objIdx}, ${obsIdx}, 'practice', this.value)">${window.escapeAttr(obsNode.practice || "")}</textarea>
                    </div>
                    <div class="space-y-1">
                        <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Root-Cause Vector:</label>
                        <textarea class="w-full bg-white dark:bg-[#0d0e10] border border-outline-variant/40 dark:border-slate-700 rounded p-1.5 text-xs focus:ring-1 focus:ring-primary focus:outline-none" rows="1" placeholder="Why did this occur?"
                                  onchange="window.updateObservationSubNodeField(${objIdx}, ${obsIdx}, 'rootCause', this.value)">${window.escapeAttr(obsNode.rootCause || "")}</textarea>
                    </div>
                    <div class="space-y-1">
                        <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Risk Implications / Impact:</label>
                        <textarea class="w-full bg-white dark:bg-[#0d0e10] border border-outline-variant/40 dark:border-slate-700 rounded p-1.5 text-xs focus:ring-1 focus:ring-primary focus:outline-none" rows="1" placeholder="What is the exposure level?"
                                  onchange="window.updateObservationSubNodeField(${objIdx}, ${obsIdx}, 'implications', this.value)">${window.escapeAttr(obsNode.implications || "")}</textarea>
                    </div>
                </td>
                
                <!-- Dynamic Audit Recommendations Field -->
                <td class="p-2 border-r border-outline-variant/20 max-w-xs">
                    <textarea class="w-full bg-transparent border-0 focus:ring-0 text-xs p-1 text-sky-700 dark:text-sky-400 min-h-[8rem] resize-y focus:outline-none" placeholder="Action directives..."
                              onchange="window.updateObservationSubNodeField(${objIdx}, ${obsIdx}, 'recommendations', this.value)">${window.escapeAttr(obsNode.recommendations || "")}</textarea>
                </td>
                
                <!-- Dynamic Management Responses Sub-Fields (Isolated Per Observation Row Node) -->
                <td class="p-3 space-y-3 bg-emerald-50/20 dark:bg-emerald-950/10">
                    <div class="space-y-1">
                        <label class="block text-[11px] font-bold text-emerald-800 dark:text-emerald-400">• Management Action Plan Response:</label>
                        <textarea class="w-full bg-white dark:bg-[#0d0e10] border border-outline-variant/40 dark:border-slate-700 rounded p-1.5 text-xs focus:ring-1 focus:ring-primary focus:outline-none" rows="2" placeholder="Enter corrective actions response plan..."
                                  onchange="window.updateObservationSubNodeField(${objIdx}, ${obsIdx}, 'mgmtAction', this.value)">${window.escapeAttr(obsNode.mgmtAction || "")}</textarea>
                    </div>
                    <div class="space-y-1">
                        <label class="block text-[10px] font-bold text-emerald-700 dark:text-emerald-500 uppercase tracking-wider">Implementation Timeline:</label>
                        <input type="text" value="${window.escapeAttr(obsNode.mgmtTimeline || "")}" placeholder="e.g., By Q4 2026 or Dec 31"
                               class="w-full bg-white dark:bg-[#0d0e10] border border-outline-variant/40 dark:border-slate-700 rounded p-1.5 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                               onchange="window.updateObservationSubNodeField(${objIdx}, ${obsIdx}, 'mgmtTimeline', this.value)" />
                    </div>
                    <div class="space-y-1">
                        <label class="block text-[10px] font-bold text-emerald-700 dark:text-emerald-500 uppercase tracking-wider">Responsible Person / Title Owner:</label>
                        <input type="text" value="${window.escapeAttr(obsNode.mgmtResponsible || "")}" placeholder="Name / Title of Action Owner..."
                               class="w-full bg-white dark:bg-[#0d0e10] border border-outline-variant/40 dark:border-slate-700 rounded p-1.5 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                               onchange="window.updateObservationSubNodeField(${objIdx}, ${obsIdx}, 'mgmtResponsible', this.value)" />
                    </div>
                </td>
                
                <!-- Action Row Controls Section -->
                <td class="p-3 text-center align-middle no-print">
                    ${obsIdx === 0 ? `<button onclick="window.removeWholeObjectiveBlockRow(${objIdx})" class="text-red-500 hover:text-red-700 font-extrabold text-[10px] uppercase tracking-wider transition hover:underline focus:outline-none">Remove Obj</button>` : '—'}
                </td>
            `;

            tbody.appendChild(tr);
        });
    });
}

/**
 * Input Mutation Handlers updates nested properties inside live memory data structures
 */
/**
 * Input Mutation Handlers updates nested properties inside live memory data structures
 */
window.updateObjectiveBlockText = function(objIdx, valueText) {
    const store = window.AuditStore;
    if (store?.current?.phase2_performing?.draftReport?.findings?.[objIdx]) {
        store.current.phase2_performing.draftReport.findings[objIdx].objective = valueText;
    }
};

window.updateObservationSubNodeField = function(objIdx, obsIdx, fieldKey, valText) {
    const store = window.AuditStore;
    const findings = store?.current?.phase2_performing?.draftReport?.findings;
    if (findings?.[objIdx]?.observations?.[obsIdx]) {
        findings[objIdx].observations[obsIdx][fieldKey] = valText;
    }
};

window.addObservationSubNodeRow = function(objIdx) {
    const store = window.AuditStore;
    const findings = store?.current?.phase2_performing?.draftReport?.findings;
    if (findings?.[objIdx]) {
        if (!findings[objIdx].observations) findings[objIdx].observations = [];
        findings[objIdx].observations.push({
            observation: "", 
            standard: "", 
            practice: "", 
            rootCause: "", 
            implications: "",
            recommendations: "", 
            mgmtAction: "", 
            mgmtTimeline: "", 
            mgmtResponsible: "",
            attachedFileName: "", 
            attachedFileDataBase64: ""
        });
        renderDraftReportWorkspace(store.current);
    }
};

window.removeObservationSubNodeRow = function(objIdx, obsIdx) {
    const store = window.AuditStore;
    const findings = store?.current?.phase2_performing?.draftReport?.findings;
    if (findings?.[objIdx]?.observations) {
        findings[objIdx].observations.splice(obsIdx, 1);
        renderDraftReportWorkspace(store.current);
    }
};

window.addFindingMatrixRow = function() {
    const store = window.AuditStore;
    if (!store || !store.current) return;
    
    if (!store.current.phase2_performing) store.current.phase2_performing = {};
    if (!store.current.phase2_performing.draftReport) store.current.phase2_performing.draftReport = {};
    
    const findings = store.current.phase2_performing.draftReport.findings || [];
    const targetRow = store.current.phase1_planning.workPlan[activeTargetIndex] || {};
    
    findings.push({
        objective: targetRow.auditObjectives || "New Target Objective Mandate Track Statement",
        observations: [
            {
                observation: "", 
                standard: "", 
                practice: "", 
                rootCause: "", 
                implications: "",
                recommendations: "", 
                mgmtAction: "", 
                mgmtTimeline: "", 
                mgmtResponsible: ""
            }
        ]
    });
    
    store.current.phase2_performing.draftReport.findings = findings;
    renderDraftReportWorkspace(store.current);
};

window.removeWholeObjectiveBlockRow = async function(objIdx) {
    const store = window.AuditStore;
    if (!store || !store.current) return;
    
    store.current.phase2_performing.draftReport.findings.splice(objIdx, 1);
    renderDraftReportWorkspace(store.current);
};

/**
 * Renders the Document Appendices Reference Matrix sub-table
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
            <td class="p-2"><input type="text" name="app-${index}-ref" value="${window.escapeAttr(app.ref || '')}" placeholder="e.g. APP-01" class="w-full bg-transparent border-0 focus:ring-0 text-xs p-1 font-mono font-bold focus:outline-none"></td>
            <td class="p-2"><input type="text" name="app-${index}-title" value="${window.escapeAttr(app.title || '')}" placeholder="Document Title..." class="w-full bg-transparent border-0 focus:ring-0 text-xs p-1 focus:outline-none"></td>
            <td class="p-2"><input type="text" name="app-${index}-hash" value="${window.escapeAttr(app.hash || '')}" placeholder="Secure storage link reference..." class="w-full bg-transparent border-0 focus:ring-0 text-xs p-1 text-slate-500 font-mono focus:outline-none"></td>
            <td class="p-3 text-center">
                <button onclick="window.removeAppendixRow(${index})" class="text-red-500 hover:text-red-700 font-bold text-xs uppercase tracking-wider focus:outline-none">Remove</button>
            </td>
        `;
        
        tr.querySelectorAll("input").forEach(ip => {
            ip.addEventListener("change", () => saveAppendicesInlineData(index, tr));
        });

        tbody.appendChild(tr);
    });
}

window.addAppendixMatrixRow = function() {
    const store = window.AuditStore;
    if (!store || !store.current) return;
    
    if (!store.current.phase2_performing.draftReport.appendices) {
        store.current.phase2_performing.draftReport.appendices = [];
    }
    const appendices = store.current.phase2_performing.draftReport.appendices;
    appendices.push({ ref: `APP-0${appendices.length + 1}`, title: "", hash: "" });
    
    renderAppendicesMatrixTable(appendices);
};

window.removeAppendixRow = async function(index) {
    const store = window.AuditStore;
    if (!store || !store.current) return;
    
    store.current.phase2_performing.draftReport.appendices.splice(index, 1);
    renderDraftReportWorkspace(store.current);
};

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
    if (!draftState.executiveSummarySegments) {
        draftState.executiveSummarySegments = {};
    }
    
    draftState.executiveSummarySegments.introduction = document.getElementById("txt-exec-intro").value;
    draftState.executiveSummarySegments.objectives   = document.getElementById("txt-exec-objectives").value;
    draftState.executiveSummarySegments.findings     = document.getElementById("txt-exec-findings").value;
    draftState.executiveSummarySegments.conclusion   = document.getElementById("txt-exec-conclusion").value;
    
    draftState.reviewer1Name = document.getElementById("sign-rev1-name").value;
    draftState.reviewer1Date = document.getElementById("sign-rev1-date").value;
    draftState.reviewer2Name = document.getElementById("sign-rev2-name").value;
    draftState.reviewer2Date = document.getElementById("sign-rev2-date").value;
    draftState.authorizerName = document.getElementById("sign-auth-name").value;
    draftState.authorizerDate = document.getElementById("sign-auth-date").value;

    try {
        await store.save();
        alert("Draft report configurations synchronized up to Firestore nodes! 💾");
    } catch (err) {
        alert("Failed to sync structural draft report fields.");
    }
}

async function finalizeDraftAndProceedToFinalReport() {
    const store = window.AuditStore;
    if (!store || !store.current) return;

    try {
        await commitDraftWorkspaceState();
        if (typeof store.carryToFinal === 'function') store.carryToFinal();
        window.location.href = "Final_Audit_Report.html";
    } catch(err) {
        alert("Error advancing pipeline stage.");
    }
}
/**
 * Processes local computer file uploads, transforming payload instances into database strings
 */
window.handleObservationFileAttachment = function(objIdx, obsIdx, inputElement) {
    const file = inputElement.files[0];
    if (!file) return;

    // Optional Safety Barrier: Restrict payload footprint blocks from exceeding 2.5 Megabytes
    if (file.size > 2500000) {
        alert("Attached evidence working document item exceeds the structural database constraint footprint allocation (2.5MB max size limit).");
        inputElement.value = "";
        return;
    }

    const reader = new FileReader();
    
    // Trigger visual text feedback mutation live on screen
    const displayLabel = document.getElementById(`lbl-file-${objIdx}-${obsIdx}`);
    if (displayLabel) displayLabel.textContent = "Loading...";

    reader.onload = function(event) {
        const store = window.AuditStore;
        const findings = store?.current?.phase2_performing?.draftReport?.findings;
        
        if (findings?.[objIdx]?.observations?.[obsIdx]) {
            // Write properties onto the targeted data structure array model block instance
            findings[objIdx].observations[obsIdx].attachedFileName = file.name;
            findings[objIdx].observations[obsIdx].attachedFileDataBase64 = event.target.result;
            
            // Visual feedback update to display name parameters
            if (displayLabel) displayLabel.textContent = file.name;
            console.log(`📎 Operational asset [${file.name}] successfully encoded to observation index allocation row block.`);
        }
    };

    reader.onerror = function() {
        alert("Failed to read parameters from targeted system storage sector.");
        if (displayLabel) displayLabel.textContent = "Attach Paper";
    };

    // Initialize encoding conversion pass
    reader.readAsDataURL(file);
};

window.routeBackToAuditProgram = function() {
    window.location.href = "Audit_Plan&Program.html";
};
