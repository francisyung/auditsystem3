/**
 * Sentinel Core Draft Audit Report Controller Module
 * Governs report synthesis narratives, findings tables, appendix items, and cloud streams for Phase 2 Stage 2.
 * PART 1 OF 5: DUAL-GATE WORKSPACE ISOLATION, HEADERS & AUTHENTICATION BADGES
 */

// Track index targeting the specific active audit line row from Phase 1
let activeTargetIndex = 0; 

document.addEventListener("DOMContentLoaded", () => {
    if (window.Theme) window.Theme.init();
    
    if (window.AuditStore) {
        window.AuditStore.subscribeToAudit((snapshotData) => {
            let cloudIndex = snapshotData?.phase1_planning?.selectedExecutionId;
            if (cloudIndex !== undefined && cloudIndex !== null) {
                activeTargetIndex = parseInt(cloudIndex);
            }
            renderDraftReportWorkspace(snapshotData);
        });
    }
});

/**
 * Parses cloud snapshots to load isolated variables and metrics safely without data blending
 */
function renderDraftReportWorkspace(data) {
    const workPlanList = data?.phase1_planning?.workPlan || [];
    const universeList = data?.phase1_planning?.universe || [];
    const planProgram = data?.phase2_performing?.planProgram || {};
    const draftReport = data?.phase2_performing?.draftReport || {};
    
    if (workPlanList.length === 0) {
        document.getElementById("empty-draft-state")?.classList.remove("hidden");
        document.getElementById("active-draft-workspace")?.classList.add("hidden");
        return;
    }

    document.getElementById("empty-draft-state")?.classList.add("hidden");
    document.getElementById("active-draft-workspace")?.classList.remove("hidden");

    populateTargetRiskSelector(workPlanList);

    const targetRow = workPlanList[activeTargetIndex] || workPlanList[0];
    const refNum = targetRow.refNumber;

    if (!draftReport.audits) draftReport.audits = {};
    if (!draftReport.audits[refNum]) {
        draftReport.audits[refNum] = {
            executiveSummarySegments: { introduction: "", objectives: "", findings: "", conclusion: "" },
            findings: [],
            appendices: []
        };
    }
    const draftState = draftReport.audits[refNum];

    // Establish linear gate loops matching required architectural constraints if blank on boot
    if (!draftState.trackingState) {
        draftState.trackingState = { status: "Draft", currentHolder: "officer", historyLogs: [] };
    }

    const tState = draftState.trackingState;
    const activeUserRole = localStorage.getItem("sentinel_active_role") || "officer";

    // Enforce dual-gate isolation parameters
    const isInternalAuditLocked = (activeUserRole !== tState.currentHolder || tState.status === "Approved" || tState.status === "Pending_Management_Response");
    const isManagementResponseUnlocked = (tState.status === "Pending_Management_Response" && activeUserRole === "management");

    const previousProgramState = planProgram.audits?.[refNum] || {};
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

    const segments = draftState.executiveSummarySegments || {};
    
   
    // 🛡️ DYNAMIC INHERITANCE PROFILE PIPELINE MAPPINGS
    const draftPrepBy = draftState.reviewer1Name || targetRow.leadAuditor || ""; // LEAD AUDITOR
    const draftRevBy  = draftState.reviewer2Name || targetRow.auditor1 || "";    // AUDIT MANAGER
    const draftAppBy  = draftState.authorizerName || targetRow.approver || "";   // APPROVER AUTHORITY

    setInputValWithoutFocusLoss("sign-rev1-name", draftPrepBy);
    setInputValWithoutFocusLoss("sign-rev1-date", draftState.reviewer1Date || targetRow.approvalDate || "");
    setInputValWithoutFocusLoss("sign-rev2-name", draftRevBy);
    setInputValWithoutFocusLoss("sign-rev2-date", draftState.reviewer2Date || "");
    setInputValWithoutFocusLoss("sign-auth-name", draftAppBy);
    setInputValWithoutFocusLoss("sign-auth-date", draftState.authorizerDate || targetRow.approvalDate || "");

    
    
    setTextAreaValWithoutFocusLoss("txt-exec-intro",      segments.introduction || "");
    setTextAreaValWithoutFocusLoss("txt-exec-objectives", segments.objectives || "");
    setTextAreaValWithoutFocusLoss("txt-exec-findings",   segments.findings || "");
    setTextAreaValWithoutFocusLoss("txt-exec-conclusion", segments.conclusion || "");

    // Freeze or activate narrative boxes based on explicit workflow permission grids
    document.querySelectorAll("#txt-exec-intro, #txt-exec-objectives, #txt-exec-findings, #txt-exec-conclusion, .sign-block input").forEach(el => {
        if (isInternalAuditLocked) {
            el.setAttribute("disabled", "true");
            el.classList.add("opacity-60", "bg-slate-50", "dark:bg-slate-900/40", "pointer-events-none");
        } else {
            el.removeAttribute("disabled");
            el.classList.remove("opacity-60", "bg-slate-50", "dark:bg-slate-900/40", "pointer-events-none");
        }
    });

    renderFindingsMatrixTable(draftState.findings || [], targetRow, isInternalAuditLocked, isManagementResponseUnlocked);
    renderAppendicesMatrixTable(draftState.appendices || [], isInternalAuditLocked);
    renderDraftReportWorkflowPanelConsole(tState, activeUserRole, refNum);
}
/**
 * Sentinel Core Draft Audit Report Controller Module
 * PART 2 OF 5: FOCUS-SAFE UTILITIES, RISK LOOKUPS & FINDINGS GRID HEADINGS
 */

/**
 * Safe text update routine preventing cursor reset focus issues during typing inputs [1]
 */
function setTextAreaValWithoutFocusLoss(elementId, textValue) {
    const el = document.getElementById(elementId);
    if (el && !el.matches(':focus')) {
        el.value = (textValue !== undefined && textValue !== null) ? textValue : "";
    }
}

/**
 * Safe single-line input field update routine matching focus boundary criteria [1]
 */
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
        renderDraftReportWorkspace(store.current);
    }
}

/**
 * Renders the restructured One-to-Many Objective -> Observations Findings Grid Table Layout [1]
 * Enforces dual-gate permission parameters to block unauthorized field updates [1]
 */
function renderFindingsMatrixTable(findingsArray, targetRow, isInternalAuditLocked, isManagementResponseUnlocked) {
    const tbody = document.getElementById("tbl-findings-body");
    if (!tbody) return;
    tbody.innerHTML = "";

    const refNum = targetRow.refNumber;

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
                        mgmtResponsible: "",
                        attachedFileName: "",
                        attachedFileDataBase64: ""
                    }
                ]
            }
        ];
        const store = window.AuditStore?.current;
        if (store && store.phase2_performing?.draftReport?.audits?.[refNum]) {
            store.phase2_performing.draftReport.audits[refNum].findings = findingsArray;
        }
    }

    // Hide or un-gray Add Row buttons matching workflow control bounds [1]
    const btnAddFinding = document.querySelector("button[onclick='window.addFindingMatrixRow()']");
    if (btnAddFinding) {
        if (isInternalAuditLocked) btnAddFinding.classList.add("hidden");
        else btnAddFinding.classList.remove("hidden");
    }
/**
 * Sentinel Core Draft Audit Report Controller Module
 * PART 3 OF 5: NESTED FINDINGS SUB-NODES LOOP, FILE INJECTORS & FIELD ACCESSIBILITY LOCKS
 */

    findingsArray.forEach((findingBlock, objIdx) => {
        const subObsArray = findingBlock.observations || [];
        const rowspanTotalCount = subObsArray.length || 1;

        subObsArray.forEach((obsNode, obsIdx) => {
            const tr = document.createElement("tr");
            tr.className = "border-b border-outline-variant/30 dark:border-slate-800 hover:bg-surface-container-low/20 align-top transition-colors";
            
            let objectiveCellMarkup = "";

            // Inject Objective column spanning cells only on the very first sub-observation row definition block
            if (obsIdx === 0) {
                const isObjLockedAttr = isInternalAuditLocked ? "disabled readonly opacity-60" : "";
                objectiveCellMarkup = `
                    <td class="p-3 text-center text-xs font-mono font-bold text-on-surface-variant bg-surface-container-low/40 align-middle" rowspan="${rowspanTotalCount}">
                        ${objIdx + 1}
                    </td>
                    <td class="p-2 border-r border-outline-variant/20 max-w-xs" rowspan="${rowspanTotalCount}">
                        <textarea ${isObjLockedAttr} class="w-full bg-white dark:bg-[#0d0e10] border border-outline-variant/40 dark:border-slate-700 rounded text-xs font-bold p-1.5 focus:outline-none focus:ring-1 focus:ring-primary min-h-[10rem] resize-y" 
                                  placeholder="Objective..." 
                                  onchange="window.updateObjectiveBlockText(${objIdx}, this.value)">${window.escapeAttr(findingBlock.objective || "")}</textarea>
                        <div class="mt-2 no-print text-center px-1 ${isInternalAuditLocked ? 'hidden' : ''}">
                            <button onclick="window.addObservationSubNodeRow(${objIdx})" class="px-2 py-1 bg-primary dark:bg-sky-500 text-white font-black text-[9px] uppercase tracking-wider rounded shadow hover:opacity-90 transition-all flex items-center gap-0.5 mx-auto">
                                <span class="material-symbols-outlined text-[10px]">add_circle</span> Add Finding
                            </button>
                        </div>
                    </td>
                `;
            }

            // Evaluation matrices for cell-level input lockers
            const auditFieldLockAttr = isInternalAuditLocked ? "disabled readonly opacity-60 bg-slate-50 dark:bg-slate-900/20" : "";
            const mgmtFieldLockAttr = !isManagementResponseUnlocked ? "disabled readonly opacity-60 bg-slate-50 dark:bg-slate-900/20" : "";

            tr.innerHTML = `
                ${objectiveCellMarkup}
                
                <!-- Audit Findings Nested Breakdown Structure Fields -->
                <td class="p-2 border-r border-outline-variant/20 space-y-3 min-w-[280px]">
                    <div class="space-y-1">
                        <div class="flex justify-between items-center mb-1">
                            <div class="flex items-center gap-2">
                                <label class="block text-[11px] font-black text-primary dark:text-sky-400">• Observation ${obsIdx + 1}:</label>
                                <input type="file" id="file-upload-${objIdx}-${obsIdx}" class="hidden" ${isInternalAuditLocked ? 'disabled' : ''} onchange="window.handleObservationFileAttachment(${objIdx}, ${obsIdx}, this)">
                                <button onclick="document.getElementById('file-upload-${objIdx}-${obsIdx}').click()" 
                                        ${isInternalAuditLocked ? 'disabled' : ''}
                                        class="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[10px] font-bold rounded text-slate-600 dark:text-slate-300 transition no-print focus:outline-none ${isInternalAuditLocked ? 'opacity-40 pointer-events-none' : ''}"
                                        title="${obsNode.attachedFileName ? 'Replace attached working paper reference' : 'Attach supporting files evidence'}">
                                    <span class="material-symbols-outlined text-[12px]">attach_file</span> 
                                    <span id="lbl-file-${objIdx}-${obsIdx}">${obsNode.attachedFileName ? window.escapeAttr(obsNode.attachedFileName) : 'Attach Paper'}</span>
                                </button>
                            </div>
                            ${(subObsArray.length > 1 && !isInternalAuditLocked) ? `<button onclick="window.removeObservationSubNodeRow(${objIdx}, ${obsIdx})" class="text-[10px] font-black text-red-500 uppercase tracking-widest no-print hover:underline focus:outline-none">Delete</button>` : ''}
                        </div>
                        <textarea ${auditFieldLockAttr} class="w-full bg-white dark:bg-[#0d0e10] border border-outline-variant/40 dark:border-slate-700 rounded p-1.5 text-xs focus:ring-1 focus:ring-primary focus:outline-none" 
                                  rows="2" placeholder="Describe the core observation/gap..."
                                  onchange="window.updateObservationSubNodeField(${objIdx}, ${obsIdx}, 'observation', this.value)">${window.escapeAttr(obsNode.observation || "")}</textarea>
                    </div>
                    <div class="space-y-1">
                        <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Criteria / Standard:</label>
                        <textarea ${auditFieldLockAttr} class="w-full bg-white dark:bg-[#0d0e10] border border-outline-variant/40 dark:border-slate-700 rounded p-1.5 text-xs focus:ring-1 focus:ring-primary focus:outline-none" rows="1" placeholder="What should be the benchmark?"
                                  onchange="window.updateObservationSubNodeField(${objIdx}, ${obsIdx}, 'standard', this.value)">${window.escapeAttr(obsNode.standard || "")}</textarea>
                    </div>
                    <div class="space-y-1">
                        <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Actual Practice:</label>
                        <textarea ${auditFieldLockAttr} class="w-full bg-white dark:bg-[#0d0e10] border border-outline-variant/40 dark:border-slate-700 rounded p-1.5 text-xs focus:ring-1 focus:ring-primary focus:outline-none" rows="1" placeholder="What is the actual state?"
                                  onchange="window.updateObservationSubNodeField(${objIdx}, ${obsIdx}, 'practice', this.value)">${window.escapeAttr(obsNode.practice || "")}</textarea>
                    </div>
                    <div class="space-y-1">
                        <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Root-Cause Vector:</label>
                        <textarea ${auditFieldLockAttr} class="w-full bg-white dark:bg-[#0d0e10] border border-outline-variant/40 dark:border-slate-700 rounded p-1.5 text-xs focus:ring-1 focus:ring-primary focus:outline-none" rows="1" placeholder="Why did this occur?"
                                  onchange="window.updateObservationSubNodeField(${objIdx}, ${obsIdx}, 'rootCause', this.value)">${window.escapeAttr(obsNode.rootCause || "")}</textarea>
                    </div>
                    <div class="space-y-1">
                        <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Risk Implications / Impact:</label>
                        <textarea ${auditFieldLockAttr} class="w-full bg-white dark:bg-[#0d0e10] border border-outline-variant/40 dark:border-slate-700 rounded p-1.5 text-xs focus:ring-1 focus:ring-primary focus:outline-none" rows="1" placeholder="What is the exposure level?"
                                  onchange="window.updateObservationSubNodeField(${objIdx}, ${obsIdx}, 'implications', this.value)">${window.escapeAttr(obsNode.implications || "")}</textarea>
                    </div>
                </td>
                
                <!-- Dynamic Audit Recommendations Field -->
                <td class="p-2 border-r border-outline-variant/20 max-w-xs">
                    <textarea ${auditFieldLockAttr} class="w-full bg-transparent border-0 focus:ring-0 text-xs p-1 text-sky-700 dark:text-sky-400 min-h-[8rem] resize-y focus:outline-none" placeholder="Action directives..."
                              onchange="window.updateObservationSubNodeField(${objIdx}, ${obsIdx}, 'recommendations', this.value)">${window.escapeAttr(obsNode.recommendations || "")}</textarea>
                </td>
                
                <!-- Dynamic Management Responses Sub-Fields -->
                <td class="p-3 space-y-3 bg-emerald-50/20 dark:bg-emerald-950/10 min-w-[260px]">
                    <div class="space-y-1">
                        <label class="block text-[11px] font-black text-emerald-800 dark:text-emerald-400">• Management Action Plan Response:</label>
                        <textarea ${mgmtFieldLockAttr} class="w-full bg-white dark:bg-[#0d0e10] border border-slate-300 dark:border-slate-700 rounded p-1.5 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none font-medium" rows="2" placeholder="IT / Finance response corrective plans..."
                                  onchange="window.updateObservationSubNodeField(${objIdx}, ${obsIdx}, 'mgmtAction', this.value)">${window.escapeAttr(obsNode.mgmtAction || "")}</textarea>
                    </div>
                                        <div class="space-y-1">
                        <label class="block text-[10px] font-bold text-emerald-700 dark:text-emerald-500 uppercase tracking-wider">Implementation Timeline:</label>
                        <input type="text" ${mgmtFieldLockAttr} value="${window.escapeAttr(obsNode.mgmtTimeline || "")}" placeholder="e.g., By Q4 2026 or Dec 31"
                               class="w-full bg-white dark:bg-[#0d0e10] border border-slate-300 dark:border-slate-700 rounded p-1.5 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                               onchange="window.updateObservationSubNodeField(${objIdx}, ${obsIdx}, 'mgmtTimeline', this.value)" />
                    </div>
                    <div class="space-y-1">
                        <label class="block text-[10px] font-bold text-emerald-700 dark:text-emerald-500 uppercase tracking-wider">Responsible Person / Title Owner:</label>
                        <input type="text" ${mgmtFieldLockAttr} value="${window.escapeAttr(obsNode.mgmtResponsible || "")}" placeholder="Name / Title of Action Owner..."
                               class="w-full bg-white dark:bg-[#0d0e10] border border-slate-300 dark:border-slate-700 rounded p-1.5 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                               onchange="window.updateObservationSubNodeField(${objIdx}, ${obsIdx}, 'mgmtResponsible', this.value)" />
                    </div>
                </td>
                
                <td class="p-3 text-center align-middle no-print">
                    ${(obsIdx === 0 && !isInternalAuditLocked) ? `<button onclick="window.removeWholeObjectiveBlockRow(\${objIdx})" class="text-red-500 hover:text-red-700 font-extrabold text-[10px] uppercase tracking-wider transition hover:underline focus:outline-none">Remove Obj</button>` : '—'}
                </td>
            `;

            tbody.appendChild(tr);
        });
    });
}

/**
 * Input Mutation Handlers updates nested properties inside live memory data structures
 */
window.updateObjectiveBlockText = function(objIdx, valueText) {
    const store = window.AuditStore;
    if (!store?.current) return;
    const targetRow = store.current.phase1_planning?.workPlan?.[activeTargetIndex];
    if (!targetRow) return;

    const findings = store.current.phase2_performing?.draftReport?.audits?.[targetRow.refNumber]?.findings;
    if (findings?.[objIdx]) {
        findings[objIdx].objective = valueText;
        store.save(); // Continuous real-time synchronization save
    }
};

window.updateObservationSubNodeField = function(objIdx, obsIdx, fieldKey, valText) {
    const store = window.AuditStore;
    if (!store?.current) return;
    const targetRow = store.current.phase1_planning?.workPlan?.[activeTargetIndex];
    if (!targetRow) return;

    const findings = store.current.phase2_performing?.draftReport?.audits?.[targetRow.refNumber]?.findings;
    if (findings?.[objIdx]?.observations?.[obsIdx]) {
        findings[objIdx].observations[obsIdx][fieldKey] = valText;
        store.save();
    }
};

window.addObservationSubNodeRow = function(objIdx) {
    const store = window.AuditStore;
    if (!store?.current) return;
    const targetRow = store.current.phase1_planning?.workPlan?.[activeTargetIndex];
    if (!targetRow) return;

    const findings = store.current.phase2_performing?.draftReport?.audits?.[targetRow.refNumber]?.findings;
    if (findings?.[objIdx]) {
        if (!findings[objIdx].observations) findings[objIdx].observations = [];
        findings[objIdx].observations.push({
            observation: "", standard: "", practice: "", rootCause: "", implications: "", recommendations: "", 
            mgmtAction: "", mgmtTimeline: "", mgmtResponsible: "", attachedFileName: "", attachedFileDataBase64: ""
        });
        store.save();
        renderDraftReportWorkspace(store.current);
    }
};

window.removeObservationSubNodeRow = function(objIdx, obsIdx) {
    const store = window.AuditStore;
    if (!store?.current) return;
    const targetRow = store.current.phase1_planning?.workPlan?.[activeTargetIndex];
    if (!targetRow) return;

    const findings = store.current.phase2_performing?.draftReport?.audits?.[targetRow.refNumber]?.findings;
    if (findings?.[objIdx]?.observations) {
        findings[objIdx].observations.splice(obsIdx, 1);
        store.save();
        renderDraftReportWorkspace(store.current);
    }
};
/**
 * Sentinel Core Draft Audit Report Controller Module
 * PART 4 OF 5: STRUCTURED ACTION TRIGGERS & APPENDIX LAYOUT MATRIX PERSISTENCE
 */

window.addFindingMatrixRow = function() {
    const store = window.AuditStore;
    if (!store || !store.current) return;
    
    const targetRow = store.current.phase1_planning.workPlan[activeTargetIndex];
    if (!targetRow) return;

    const refNum = targetRow.refNumber;
    const draftReport = store.current.phase2_performing.draftReport;
    
    if (!draftReport.audits) draftReport.audits = {};
    if (!draftReport.audits[refNum]) draftReport.audits[refNum] = { findings: [], appendices: [] };
    
    const findings = draftReport.audits[refNum].findings || [];
    
    findings.push({
        objective: targetRow.auditObjectives || "New Target Objective Mandate Track Statement",
        observations: [
            {
                observation: "", standard: "", practice: "", rootCause: "", implications: "", recommendations: "", 
                mgmtAction: "", mgmtTimeline: "", mgmtResponsible: "", attachedFileName: "", attachedFileDataBase64: ""
            }
        ]
    });
    
    draftReport.audits[refNum].findings = findings;
    store.save();
    renderDraftReportWorkspace(store.current);
};

window.removeWholeObjectiveBlockRow = async function(objIdx) {
    const store = window.AuditStore;
    if (!store || !store.current) return;
    
    const targetRow = store.current.phase1_planning.workPlan[activeTargetIndex];
    if (!targetRow) return;

    const findings = store.current.phase2_performing.draftReport.audits?.[targetRow.refNumber]?.findings;
    if (findings) {
        findings.splice(objIdx, 1);
        store.save();
        renderDraftReportWorkspace(store.current);
    }
};

function saveAppendicesInlineData(index, trElement) {
    const store = window.AuditStore;
    if (!store || !store.current) return;

    const targetRow = store.current.phase1_planning.workPlan[activeTargetIndex];
    if (!targetRow) return;

    const app = store.current.phase2_performing.draftReport.audits?.[targetRow.refNumber]?.appendices?.[index];
    if (!app) return;

    app.ref = trElement.querySelector(`[name="app-${index}-ref"]`).value;
    app.title = trElement.querySelector(`[name="app-${index}-title"]`).value;
    app.hash = trElement.querySelector(`[name="app-${index}-hash"]`).value;
    
    store.save();
}

/**
 * Renders the Document Appendices Reference Matrix sub-table
 */
function renderAppendicesMatrixTable(appendicesArray, isInternalAuditLocked) {
    const tbody = document.getElementById("tbl-appendices-body");
    if (!tbody) return;
    tbody.innerHTML = "";

    const btnAddApp = document.querySelector("button[onclick='window.addAppendixMatrixRow()']");
    if (btnAddApp) {
        if (isInternalAuditLocked) btnAddApp.classList.add("hidden");
        else btnAddApp.classList.remove("hidden");
    }

    appendicesArray.forEach((app, index) => {
        const tr = document.createElement("tr");
        tr.className = "border-b border-outline-variant/30 dark:border-slate-800 last:border-0 hover:bg-surface-container-low dark:hover:bg-slate-900/40 align-middle transition-colors";
        
        const isAppLockedAttr = isInternalAuditLocked ? "disabled readonly opacity-60 bg-slate-50 dark:bg-slate-900/20" : "";

        tr.innerHTML = `
            <td class="p-3 text-center text-xs font-mono font-bold text-on-surface-variant">${index + 1}</td>
            <td class="p-2"><input type="text" name="app-${index}-ref" value="${window.escapeAttr(app.ref || '')}" ${isAppLockedAttr} placeholder="e.g. APP-01" class="w-full bg-transparent border-0 focus:ring-0 text-xs p-1 font-mono font-bold focus:outline-none text-on-surface dark:text-slate-200"></td>
            <td class="p-2"><input type="text" name="app-${index}-title" value="${window.escapeAttr(app.title || '')}" ${isAppLockedAttr} placeholder="Document Title..." class="w-full bg-transparent border-0 focus:ring-0 text-xs p-1 focus:outline-none text-on-surface dark:text-slate-200"></td>
            <td class="p-2"><input type="text" name="app-${index}-hash" value="${window.escapeAttr(app.hash || '')}" ${isAppLockedAttr} placeholder="Secure storage link reference..." class="w-full bg-transparent border-0 focus:ring-0 text-xs p-1 text-slate-500 font-mono focus:outline-none"></td>
            <td class="p-3 text-center">
                <button onclick="window.removeAppendixRow(${index})" class="text-red-500 hover:text-red-700 font-bold text-xs uppercase tracking-wider focus:outline-none ${isInternalAuditLocked ? 'hidden' : ''}">Remove</button>
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
    
    const targetRow = store.current.phase1_planning.workPlan[activeTargetIndex];
    if (!targetRow) return;

    const refNum = targetRow.refNumber;
    const draftReport = store.current.phase2_performing.draftReport;

    if (!draftReport.audits) draftReport.audits = {};
    if (!draftReport.audits[refNum]) draftReport.audits[refNum] = { findings: [], appendices: [] };
    if (!draftReport.audits[refNum].appendices) draftReport.audits[refNum].appendices = [];

    const appendices = draftReport.audits[refNum].appendices;
    appendices.push({ ref: `APP-0${appendices.length + 1}`, title: "", hash: "" });
    
    store.save();
    renderDraftReportWorkspace(store.current);
};

window.removeAppendixRow = async function(index) {
    const store = window.AuditStore;
    if (!store || !store.current) return;
    
    const targetRow = store.current.phase1_planning.workPlan[activeTargetIndex];
    if (!targetRow) return;

    const appendices = store.current.phase2_performing.draftReport.audits?.[targetRow.refNumber]?.appendices;
    if (appendices) {
        appendices.splice(index, 1);
        store.save();
        renderDraftReportWorkspace(store.current);
    }
};

async function commitDraftWorkspaceState(explicitRefNum) {
    const store = window.AuditStore;
    if (!store || !store.current) return;

    const targetRow = store.current.phase1_planning.workPlan[activeTargetIndex];
    if (!targetRow) return;

    const targetKey = explicitRefNum || targetRow.refNumber;
    const draftReport = store.current.phase2_performing.draftReport;
    const draftState = draftReport.audits?.[targetKey];
    
    if (!draftState) return;
    if (!draftState.executiveSummarySegments) {
        draftState.executiveSummarySegments = {};
    }
    
    draftState.executiveSummarySegments.introduction = document.getElementById("txt-exec-intro")?.value || "";
    draftState.executiveSummarySegments.objectives   = document.getElementById("txt-exec-objectives")?.value || "";
    draftState.executiveSummarySegments.findings     = document.getElementById("txt-exec-findings")?.value || "";
    draftState.executiveSummarySegments.conclusion   = document.getElementById("txt-exec-conclusion")?.value || "";
    
    draftState.reviewer1Name = document.getElementById("sign-rev1-name")?.value || "";
    draftState.reviewer1Date = document.getElementById("sign-rev1-date")?.value || "";
    draftState.reviewer2Name = document.getElementById("sign-rev2-name")?.value || "";
    draftState.reviewer2Date = document.getElementById("sign-rev2-date")?.value || "";
    draftState.authorizerName = document.getElementById("sign-auth-name")?.value || "";
    draftState.authorizerDate = document.getElementById("sign-auth-date")?.value || "";

    try {
        await store.save();
    } catch (err) {
        console.error("Failed to sync structural draft report fields.", err);
    }
}
/**
 * Sentinel Core Draft Audit Report Controller Module
 * PART 5 OF 5: DUAL-GATE STAGE GATING CONSOLE & PIPELINE NAVIGATORS
 */

/**
 * Injects the advanced dual-tier review control panel toolbar matching the active audit code
 */
/**
 * Injects the advanced dual-tier review control panel toolbar matching the active audit code
 */
function renderDraftReportWorkflowPanelConsole(trackingState, activeUserRole, refNum) {
    let panel = document.getElementById("sentinel-draft-workflow-panel");
    if (!panel) {
        panel = document.createElement("div");
        panel.id = "sentinel-draft-workflow-panel";
        panel.className = "p-4 my-6 bg-slate-50 dark:bg-[#111315] border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4 max-w-[1600px] mx-auto no-print shadow-sm";
        const mainCanvas = document.getElementById("active-draft-workspace");
        if (mainCanvas) mainCanvas.appendChild(panel);
    }

    const badgeColorMap = {
        "Draft": "bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-400",
        "Pending_Lead": "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
        "Pending_Reviewer": "bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-300",
        "Pending_Approver": "bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300",
        "Pending_Management_Response": "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 font-bold",
        "Response_Completed": "bg-sky-100 text-sky-800 dark:bg-sky-950/40 dark:text-sky-300 font-bold",
        "Returned_To_Officer": "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300",
        "Returned_To_Lead": "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
    };

    const statusStyle = badgeColorMap[trackingState.status] || "bg-slate-100 text-slate-800";
    let interfaceActionsHtml = "";
    const isHolder = activeUserRole === trackingState.currentHolder;

    if (isHolder && trackingState.status !== "Response_Completed") {
        let buttonsHtml = "";
        
        if (activeUserRole === "officer") {
            buttonsHtml = "<button onclick=\"commitDraftStageTransition('" + refNum + "', 'Pending_Lead')\" class=\"px-3 py-2 text-xs font-black uppercase tracking-wider bg-sky-600 hover:bg-sky-700 text-white rounded\">Submit Draft</button>";
        } else if (activeUserRole === "leadauditor") {
            buttonsHtml = "<button onclick=\"commitDraftStageTransition('" + refNum + "', 'Pending_Reviewer')\" class=\"px-3 py-2 text-xs font-black uppercase tracking-wider bg-sky-600 hover:bg-sky-700 text-white rounded mr-2\">To Reviewer</button>" +
                          "<button onclick=\"commitDraftStageTransition('" + refNum + "', 'Returned_To_Officer')\" class=\"px-3 py-2 text-xs font-black uppercase tracking-wider bg-amber-600 hover:bg-amber-700 text-white rounded\">Return</button>";
        } else if (activeUserRole === "reviewer") {
            buttonsHtml = "<button onclick=\"commitDraftStageTransition('" + refNum + "', 'Pending_Approver')\" class=\"px-3 py-2 text-xs font-black uppercase tracking-wider bg-indigo-600 hover:bg-indigo-700 text-white rounded mr-2\">To Approver</button>" +
                          "<button onclick=\"commitDraftStageTransition('" + refNum + "', 'Returned_To_Lead')\" class=\"px-3 py-2 text-xs font-black uppercase tracking-wider bg-amber-600 hover:bg-amber-700 text-white rounded\">Return</button>";
        } else if (activeUserRole === "approver") {
            buttonsHtml = "<button onclick=\"commitDraftStageTransition('" + refNum + "', 'Pending_Management_Response')\" class=\"px-3 py-2 text-xs font-black uppercase tracking-wider bg-emerald-600 hover:bg-emerald-700 text-white rounded mr-2\">Release to Auditee Dept</button>" +
                          "<button onclick=\"commitDraftStageTransition('" + refNum + "', 'Returned_To_Officer')\" class=\"px-3 py-2 text-xs font-black uppercase tracking-wider bg-rose-600 hover:bg-rose-700 text-white rounded\">Reject</button>";
        } else if (activeUserRole === "management") {
            buttonsHtml = "<button onclick=\"commitDraftStageTransition('" + refNum + "', 'Response_Completed')\" class=\"px-3 py-2 text-xs font-black uppercase tracking-wider bg-emerald-600 hover:bg-emerald-700 text-white rounded shadow-md\">Submit Management Response</button>";
        }

        interfaceActionsHtml = `
            <div class="flex items-center gap-2">
                <input type="text" id="txt-stage-remarks" placeholder="Enter routing remarks..." class="bg-[#1e293b] border border-slate-700/50 p-2 text-xs rounded text-white focus:outline-none w-56">
                ${buttonsHtml}
            </div>`;
    } else {
        let displayMessage = "⏳ Waiting on role profile [" + trackingState.currentHolder.toUpperCase() + "] verification...";
        if (trackingState.status === "Response_Completed") {
            displayMessage = "✓ Management Responses Logged. Locked & Ready for Final Report Framework Initialization.";
        }
        interfaceActionsHtml = `<div class="text-xs text-slate-500 font-bold uppercase tracking-wider">${displayMessage}</div>`;
    }

    const visibleStatusText = trackingState.status.replace(/_/g, ' ');

    panel.innerHTML = `
        <div class="flex items-center gap-3">
            <span class="text-xs font-black uppercase tracking-widest text-slate-400">Report Cycle Status:</span>
            <span class="px-2.5 py-1 rounded text-xs font-black font-mono uppercase tracking-wider ${statusStyle}">
                ${visibleStatusText}
            </span>
        </div>
        ${interfaceActionsHtml}
    `;
}




/**
 * Dispatches tracking mutations up to central database orchestrator nodes
 */
/**
 * Dispatches tracking mutations directly to clear deep reference block issues
 * SAFELY Initialized: Prevents 'trackingState' undefined read exceptions on blank document nodes
 */
async function commitDraftStageTransition(refNum, targetStatus) {
    const store = window.AuditStore;
    if (!store || !store.current) return;

    // Direct sanity filter mapping: extract clean strings to bypass text injection failures
    const activeRefKey = String(refNum).trim();

    const remarksInput = document.getElementById("txt-stage-remarks");
    const actualRemarks = remarksInput ? remarksInput.value.trim() : "";

    if (!actualRemarks && targetStatus.startsWith("Returned")) {
        alert("Action Required: Please input explicit review comments clarifying your reasons for returning this package.");
        return;
    }

    if (!actualRemarks && targetStatus === "Pending_Management_Response") {
        alert("Action Required: Please provide baseline guidance instructions for the Auditee Department response process.");
        return;
    }

    const actingUserRole = localStorage.getItem("sentinel_active_role") || "officer";
    let nextHolder = actingUserRole;

    if (targetStatus === "Pending_Lead") nextHolder = "leadauditor";
    else if (targetStatus === "Pending_Reviewer") nextHolder = "reviewer";
    else if (targetStatus === "Pending_Approver") nextHolder = "approver";
    else if (targetStatus === "Pending_Management_Response") nextHolder = "management"; 
    else if (targetStatus === "Response_Completed") nextHolder = "officer"; 
    else if (targetStatus === "Returned_To_Officer") nextHolder = "officer";
    else if (targetStatus === "Returned_To_Lead") nextHolder = "leadauditor";

    if (!store.current.phase2_performing) store.current.phase2_performing = {};
    if (!store.current.phase2_performing.draftReport) store.current.phase2_performing.draftReport = { audits: {} };
    if (!store.current.phase2_performing.draftReport.audits) store.current.phase2_performing.draftReport.audits = {};
    
    if (!store.current.phase2_performing.draftReport.audits[activeRefKey]) {
        if (typeof store.carryToDraft === 'function') {
            store.carryToDraft();
        }
    }

    if (!store.current.phase2_performing.draftReport.audits[activeRefKey]) {
        store.current.phase2_performing.draftReport.audits[activeRefKey] = {
            executiveSummarySegments: { introduction: "", objectives: "", findings: "", conclusion: "" },
            findings: [],
            appendices: []
        };
    }

    const targetAudit = store.current.phase2_performing.draftReport.audits[activeRefKey];
    
    if (!targetAudit.trackingState) {
        targetAudit.trackingState = { status: "Draft", currentHolder: "officer", historyLogs: [] };
    }

    targetAudit.trackingState.status = targetStatus;
    targetAudit.trackingState.currentHolder = nextHolder;
    
    targetAudit.trackingState.historyLogs.push({
        role: actingUserRole,
        action: `Draft Workflow: Transitioned to [${targetStatus}]`,
        comment: actualRemarks || "No custom remarks entered.",
        timestamp: new Date().toISOString()
    });

    const activeWorkPlanRow = store.current.phase1_planning?.workPlan?.[activeTargetIndex];
    if (activeWorkPlanRow) {
        if (!activeWorkPlanRow.trackingState) activeWorkPlanRow.trackingState = {};
        activeWorkPlanRow.trackingState.status = targetStatus;
        activeWorkPlanRow.trackingState.currentHolder = nextHolder;
    }

    try {
        // Pass the explicit key directly into workspace payload save call step
        await commitDraftWorkspaceState(activeRefKey);
        
        store.current = JSON.parse(JSON.stringify(store.current));
        await store.save();
        
        await store.writeSystemAuditLog(`Transitioned Draft Report [${activeRefKey}] safely inline to status [${targetStatus}] held by [${nextHolder}].`);
        alert(`Report loop transitioned to status context: ${targetStatus.replace(/_/g, ' ')}`);
    } catch (err) {
        console.error("Draft state submission error loop catch trace:", err);
        alert("Inline save failed due to database connectivity issues.");
    }
}

async function finalizeDraftAndProceedToFinalReport() {
    const store = window.AuditStore;
    if (!store || !store.current) return;

    const targetRow = store.current.phase1_planning.workPlan[activeTargetIndex];
    if (!targetRow) return;

    const draftState = store.current.phase2_performing?.draftReport?.audits?.[targetRow.refNumber];
    if (draftState?.trackingState?.status !== "Response_Completed") {
        alert("Pipeline Constraint: Access Denied. You cannot advance to the Final Report generation phase until the Auditee Department has completed and submitted their management feedback action loop.");
        return;
    }

    try {
        await commitDraftWorkspaceState();
        if (typeof store.carryToFinal === 'function') store.carryToFinal();
        window.location.href = "Final_Audit_Report.html";
    } catch(err) {
        alert("Error advancing pipeline stage.");
    }
}

window.handleObservationFileAttachment = function(objIdx, obsIdx, inputElement) {
    const file = inputElement.files[0];
    if (!file) return;

    if (file.size > 2500000) {
        alert("Attached evidence working document item exceeds the structural footprint allocation constraint (2.5MB max size limit).");
        inputElement.value = "";
        return;
    }

    const reader = new FileReader();
    const displayLabel = document.getElementById(`lbl-file-${objIdx}-${obsIdx}`);
    if (displayLabel) displayLabel.textContent = "Loading Paper...";

    reader.onload = function(event) {
        const store = window.AuditStore;
        const targetRow = store?.current?.phase1_planning?.workPlan?.[activeTargetIndex];
        if (!targetRow) return;

        const findings = store?.current?.phase2_performing?.draftReport?.audits?.[targetRow.refNumber]?.findings;
        
        if (findings?.[objIdx]?.observations?.[obsIdx]) {
            findings[objIdx].observations[obsIdx].attachedFileName = file.name;
            findings[objIdx].observations[obsIdx].attachedFileDataBase64 = event.target.result;
            
            if (displayLabel) displayLabel.textContent = file.name;
            store.save();
            console.log(`📎 Operational asset [${file.name}] successfully encoded to observation index row block.`);
        }
    };

    reader.onerror = function() {
        alert("Failed to read parameters from system storage sector.");
        if (displayLabel) displayLabel.textContent = "Attach Paper";
    };

    reader.readAsDataURL(file);
};

window.routeBackToAuditProgram = function() {
    window.location.href = "Audit_Plan&Program.html";
};
