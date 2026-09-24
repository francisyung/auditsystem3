/**
 * Sentinel Core Risk Assessment Matrix Controller
 * Manages calculations, color logic, and cloud data streams for Stage 2.
 */

document.addEventListener("DOMContentLoaded", () => {
    if (window.Theme) window.Theme.init();
    
    // Connect live cloud listener subscription hook
    if (window.AuditStore) {
        window.AuditStore.subscribeToAudit((snapshotData) => {
            renderRiskAssessmentWorkspace(snapshotData);
        });
    }
});
let riskFieldSaveTimeout = null;
/**
 * Loops and builds matrix rows using current cloud data collections
 */
/**
 * Loops and builds matrix rows using current cloud data collections
 */
function renderRiskAssessmentWorkspace(data) {
    const riskRows = data?.phase1_planning?.riskRegister || [];
    const universeList = data?.phase1_planning?.universe || [];
    const tbody = document.getElementById("tbl-risk-body");
    if (!tbody) return;

    tbody.innerHTML = "";

    if (riskRows.length === 0) {
        document.getElementById("empty-risk-row")?.classList.remove("hidden");
        return;
    }

    document.getElementById("empty-risk-row")?.classList.add("hidden");

    // --- AUTOMATIC SORTING & INDEX PRESERVATION LOGIC ---
    const mappedRisks = riskRows.map((row) => {
        const L = parseInt(row.likelihood || 1);
        const I = parseInt(row.impact || 1);
        return {
            row,
            score: L * I
        };
    });

    mappedRisks.sort((a, b) => b.score - a.score);

    mappedRisks.forEach(({ row, score }) => {
        const tr = document.createElement("tr");
        tr.className = "border-b border-outline-variant/30 dark:border-slate-800 last:border-0 hover:bg-surface-container-low dark:hover:bg-slate-900/40 align-top transition-colors";
        
        const L = parseInt(row.likelihood || 1);
        const I = parseInt(row.impact || 1);
        
        let scoreBadgeClass = "";
        let ratingText = "";
        
        if (score < 4) {
            scoreBadgeClass = "bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300";
            ratingText = "LOW";
        } else if (score < 8) {
            scoreBadgeClass = "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300";
            ratingText = "MODERATE";
        } else {
            scoreBadgeClass = "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300";
            ratingText = "HIGH";
        }

        // --- ENHANCED AUDIT AREA EXTRACTION LOGIC ---
        let derivedAuditArea = "Unmapped Area";
        
        // Strategy A: Direct matching via universe index keys
        const riskIdSuffix = row.riskId ? row.riskId.split('-').pop() : "";
        const matchedUniverseItem = universeList.find(u => u.serialNo && u.serialNo.split('-').pop() === riskIdSuffix);
        
        if (matchedUniverseItem && matchedUniverseItem.auditArea) {
            derivedAuditArea = matchedUniverseItem.auditArea;
        } else if (row.riskDescription && row.riskDescription.includes("scope item:")) {
            // Strategy B: Parse text out of existing description field string
            derivedAuditArea = row.riskDescription.split("scope item:").pop().trim();
        }

        // Escaped safe version of the risk ID string for use inside HTML inline attributes
        const safeRiskId = window.escapeAttr(row.riskId);

        tr.innerHTML = `
            <!-- Selection Checkbox Column -->
            <td class="p-3 text-center align-middle">
                <input type="checkbox" 
                       onchange="toggleRiskInclusion('${safeRiskId}', this.checked)" 
                       ${row.isCommittedToPlan ? 'checked' : ''} 
                       class="rounded border-outline-variant/40 text-primary focus:ring-primary h-4 w-4 bg-transparent cursor-pointer">
            </td>

            <!-- 1. Risk ID -->
            <td class="p-3 text-xs font-mono font-bold text-on-surface-variant dark:text-slate-400 align-middle">${window.escapeAttr(row.riskId)}</td>
            
            <!-- 2. Audit Area -->
            <td class="p-3 text-xs font-semibold text-on-surface dark:text-slate-200 align-middle" data-audit-area="${window.escapeAttr(derivedAuditArea)}">
                ${window.escapeAttr(derivedAuditArea)}
            </td>

            <!-- 3. Risk Identification -->
            <td class="p-2">
                <input type="text" value="${window.escapeAttr(row.riskIdentification || '')}" onchange="updateRiskField('${safeRiskId}', 'riskIdentification', this.value)" placeholder="e.g. Data Breach Vector" class="w-full bg-slate-50 dark:bg-[#0d0e10] border border-outline-variant/40 dark:border-slate-700 text-xs font-bold rounded-lg p-1.5 focus:outline-none">
            </td>
            
            <!-- 4. Risk Description -->
            <td class="p-2">
                <textarea onchange="updateRiskField('${safeRiskId}', 'riskDescription', this.value)" rows="2" placeholder="Risk impacts statement..." class="w-full bg-slate-50 dark:bg-[#0d0e10] border border-outline-variant/40 dark:border-slate-700 text-xs rounded-lg p-1.5 focus:outline-none">${window.escapeAttr(row.riskDescription || '')}</textarea>
            </td>
            
            <!-- 5. Risk Causes/Triggers -->
            <td class="p-2">
                <textarea onchange="updateRiskField('${safeRiskId}', 'riskCauses', this.value)" rows="2" placeholder="Triggers or root vectors..." class="w-full bg-slate-50 dark:bg-[#0d0e10] border border-outline-variant/40 dark:border-slate-700 text-xs rounded-lg p-1.5 focus:outline-none">${window.escapeAttr(row.riskCauses || '')}</textarea>
            </td>
            
            <!-- 5. Risk Category -->
            <td class="p-2">
                <select onchange="updateRiskField('${safeRiskId}', 'riskCategory', this.value)" class="w-full text-xs bg-slate-50 dark:bg-[#0d0e10] border-outline-variant/40 dark:border-slate-700 rounded-lg p-1.5 focus:ring-primary">
                    <option value="IT" ${row.riskCategory === 'IT' ? 'selected' : ''}>IT / Cyber</option>
                    <option value="Financial" ${row.riskCategory === 'Financial' ? 'selected' : ''}>Financial</option>
                    <option value="Operational" ${row.riskCategory === 'Operational' ? 'selected' : ''}>Operational</option>
                    <option value="Compliance" ${row.riskCategory === 'Compliance' ? 'selected' : ''}>Compliance</option>
                    <option value="Strategic" ${row.riskCategory === 'Strategic' ? 'selected' : ''}>Strategic</option>
                    <option value="Reputational" ${row.riskCategory === 'Reputational' ? 'selected' : ''}>Reputational</option>
                </select>
            </td>
            
            <!-- 6. Type of Existing Controls -->
            <td class="p-2">
                <textarea onchange="updateRiskField('${safeRiskId}', 'existingControls', this.value)" rows="2" placeholder="Current mitigating controls..." class="w-full bg-slate-50 dark:bg-[#0d0e10] border border-outline-variant/40 dark:border-slate-700 text-xs rounded-lg p-1.5 focus:outline-none">${window.escapeAttr(row.existingControls || '')}</textarea>
            </td>
            
            <!-- 7. Likelihood -->
            <td class="p-2 w-24">
                <select onchange="updateRiskMetrics('${safeRiskId}', 'likelihood', this.value)" class="w-full text-xs bg-slate-50 dark:bg-[#0d0e10] border-outline-variant/40 dark:border-slate-700 rounded-lg p-1.5">
                    <option value="1" ${L === 1 ? 'selected' : ''}>Low (1)</option>
                    <option value="2" ${L === 2 ? 'selected' : ''}>Mod (2)</option>
                    <option value="3" ${L === 3 ? 'selected' : ''}>High (3)</option>
                </select>
            </td>
            
            <!-- 8. Impact -->
            <td class="p-2 w-24">
                <select onchange="updateRiskMetrics('${safeRiskId}', 'impact', this.value)" class="w-full text-xs bg-slate-50 dark:bg-[#0d0e10] border-outline-variant/40 dark:border-slate-700 rounded-lg p-1.5">
                    <option value="1" ${I === 1 ? 'selected' : ''}>Low (1)</option>
                    <option value="2" ${I === 2 ? 'selected' : ''}>Mod (2)</option>
                    <option value="3" ${I === 3 ? 'selected' : ''}>High (3)</option>
                </select>
            </td>
            
            <!-- 9 & 10. Risk Rating/Score & Colour Code -->
            <td class="p-3 text-center align-middle">
                <span class="inline-flex items-center px-3 py-1 rounded text-xs font-black uppercase tracking-wider ${scoreBadgeClass}">
                    ${score}
                </span>
            </td>
            
            <!-- 11. Risk Owner -->
            <td class="p-2">
                <input type="text" value="${window.escapeAttr(row.riskOwner || '')}" onchange="updateRiskField('${safeRiskId}', 'riskOwner', this.value)" placeholder="e.g. Director IT" class="w-full bg-slate-50 dark:bg-[#0d0e10] border border-outline-variant/40 dark:border-slate-700 text-xs rounded-lg p-1.5 focus:outline-none">
            </td>
            
            <!-- 12. Directorate/Department -->
            <td class="p-2">
                <input type="text" value="${window.escapeAttr(row.department || '')}" onchange="updateRiskField('${safeRiskId}', 'department', this.value)" placeholder="e.g. Technology Infrastructure" class="w-full bg-slate-50 dark:bg-[#0d0e10] border border-outline-variant/40 dark:border-slate-700 text-xs rounded-lg p-1.5 focus:outline-none">
            </td>
            
            <!-- 13. Risk Ranking -->
            <td class="p-3 text-center align-middle">
                <span class="inline-flex items-center px-3 py-1 rounded text-xs font-black uppercase tracking-wider ${scoreBadgeClass}">
                    ${ratingText}
                </span>
            </td>
        `;
        tbody.appendChild(tr);
    });

    updateRiskSelectionCounter(riskRows);
}



/**
 * Persists general text updates to the local state model context
 */
function updateRiskField(riskId, fieldKey, val) {
    const store = window.AuditStore;
    if (!store || !store.current) return;
    
    const riskRegister = store.current.phase1_planning.riskRegister || [];
    const targetRow = riskRegister.find(r => r.riskId === riskId);
    
    if (!targetRow) return;
    
    // 1. Instantly update the local memory state so UI modifications aren't lost
    targetRow[fieldKey] = val;
    
    // 2. Clear any previous pending cloud save timer to reset the countdown
    if (riskFieldSaveTimeout) {
        clearTimeout(riskFieldSaveTimeout);
    }
    
    // 3. Queue up a new cloud database write that runs 500ms after the last edit activity
    riskFieldSaveTimeout = setTimeout(async () => {
        try {
            await store.updateRiskRegister(riskRegister);
            console.log("Debounced text updates successfully saved to cloud.");
        } catch(err) {
            console.error("Failed to commit debounced text updates up to cloud layer.", err);
        }
    }, 500);
}

/**
 * Fires score calculations on dropdown modifications and updates Firestore
 */
async function updateRiskMetrics(riskId, weightKey, numericStringValue) {
    const store = window.AuditStore;
    if (!store || !store.current) return;

    const riskRegister = store.current.phase1_planning.riskRegister || [];
    const targetRow = riskRegister.find(r => r.riskId === riskId);
    
    if (!targetRow) return;

    targetRow[weightKey] = numericStringValue;
    
    // Compute total score metrics inline
    targetRow.riskScore = parseInt(targetRow.likelihood || 1) * parseInt(targetRow.impact || 1);
    
    try {
        await store.updateRiskRegister(riskRegister);
    } catch(err) {
        console.error("Failed to commit metrics updates up to cloud layer.");
    }
}

/**
 * Commits checkbox inclusion states using row IDs
 */
async function toggleRiskInclusion(riskId, booleanIsChecked) {
    const store = window.AuditStore;
    if (!store || !store.current) return;

    const riskRegister = store.current.phase1_planning.riskRegister || [];
    const targetRow = riskRegister.find(r => r.riskId === riskId);
    
    if (!targetRow) return;

    targetRow.isCommittedToPlan = booleanIsChecked;
    
    try {
        await store.updateRiskRegister(riskRegister);
    } catch(err) {
        console.error("Cloud synchronization timeout on row check mutation.");
    }
}


function updateRiskSelectionCounter(rowsArray) {
    const selectedCount = rowsArray.filter(r => r.isCommittedToPlan).length;
    const badge = document.getElementById("lbl-risk-selected-badge");
    if (badge) badge.textContent = `${selectedCount} Risk Asset(s) Selected for Plan`;

    const btn = document.getElementById("btn-commit-risks");
    if (btn) {
        if (selectedCount > 0) {
            btn.classList.remove("opacity-40", "pointer-events-none");
        } else {
            btn.classList.add("opacity-40", "pointer-events-none");
        }
    }
}

/**
 * Sorts array order matching parameters from High to Low scores
 */
async function triggerRiskMatrixSort() {
    const store = window.AuditStore;
    if (!store || !store.current) return;

    const currentArray = store.current.phase1_planning.riskRegister || [];
    currentArray.sort((a, b) => {
        const scoreA = parseInt(a.likelihood || 1) * parseInt(a.impact || 1);
        const scoreB = parseInt(b.likelihood || 1) * parseInt(b.impact || 1);
        return scoreB - scoreA;
    });

    try {
        await store.updateRiskRegister(currentArray);
    } catch (err) {
        alert("Failed to commit sorting arrays matrix up to cloud database.");
    }
}

/**
 * Pushes selected risks down the pipeline into Phase 1, Stage 3
 */
/**
 * Pushes selected risks down the pipeline into Phase 1, Stage 3 without erasing old entries
 */
async function commitRisksAndAdvanceStage() {
    const store = window.AuditStore;
    if (!store || !store.current) return;

    const fullRegister = store.current.phase1_planning.riskRegister || [];
    const universeList = store.current.phase1_planning.universe || [];
    
    // Retrieve any pre-existing rows from your work plan collection to protect them
    const existingWorkPlan = store.current.phase1_planning.workPlan || [];
    
    const selectedRisks = fullRegister.filter(r => r.isCommittedToPlan);

    if (selectedRisks.length === 0) {
        alert("Please select at least 1 risk from the assessment matrix to schedule.");
        return;
    }

    // Map checked items into scheduling array entities
    const updatedWorkPlanRows = selectedRisks.map(risk => {
        const riskIdSuffix = risk.riskId ? risk.riskId.split('-').pop() : "";
        const targetRefNumber = `AUD-2026-${riskIdSuffix}`;
        
        // If this work plan record has already been built and edited before, preserve it!
        const preExistingRecord = existingWorkPlan.find(w => w.refNumber === targetRefNumber);
        if (preExistingRecord) {
            return preExistingRecord;
        }

        const matchedUniverseItem = universeList.find(u => u.serialNo && u.serialNo.split('-').pop() === riskIdSuffix);
        const resolvedAuditArea = matchedUniverseItem ? matchedUniverseItem.auditArea : "Untitled Mapped Title";

        return {
            refNumber: targetRefNumber,
            riskLevel: risk.riskScore >= 7 ? "HIGH (H)" : (risk.riskScore >= 4 ? "MEDIUM (M)" : "LOW (L)"),
            auditAreaReplica: resolvedAuditArea,
            riskDescription: risk.riskDescription || "—",
            auditObjectives: "",
            auditScopeBoundaries: "",
            durationValue: 4,
            scale: "Weeks",
            startDate: "",
            endDate: "",
            budgetKsh: 0,
            noOfAuditors: 1,
            physicalItResources: "",
            leadAuditor: "",
            auditor1: "",
            auditor2: "",
            approvalDate: "",
            minuteNumberRef: ""
        };
    });

    try {
        let computedSum = 0;
        updatedWorkPlanRows.forEach(r => computedSum += parseFloat(r.budgetKsh || 0));
        
        const existingMeta = store.current.phase1_planning.workPlanMetadata || {};

        await store.updateWorkPlan(
            updatedWorkPlanRows, 
            computedSum, 
            existingMeta.minuteNumberRef || "", 
            existingMeta.approvalDate || ""
        );
        window.location.href = "internal_Audit_Work_Plan.html";
    } catch (err) {
        alert("Pipeline error. Failed to commit data mappings to cloud workspace scheduler.");
    }
}


