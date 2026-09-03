/**
 * Sentinel Core Audit Storage Engine — Central Cloud Brain (Firebase Firestore Orchestrator)
 * Architected for real-time secure multi-tenant synchronization across all phases.
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { 
    getFirestore, 
    doc, 
    onSnapshot, 
    updateDoc, 
    setDoc, 
    getDoc 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// =========================================================================
// 1. UNIVERSAL SECURE DATA UTILITIES & INPUT HANDLERS
// =========================================================================

window.escapeAttr = function(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
};

window.cellInput = function(name, placeholder, value, type = 'text', customClass = '') {
    return `<input type="${type}" name="${name}" value="${window.escapeAttr(value || '')}" placeholder="${placeholder}" class="w-full bg-transparent border-0 focus:ring-0 text-xs p-1 p-3 transition-all ${customClass}">`;
};

// =========================================================================
// 2. GLOBAL THEME ENGINE STATE MANAGER
// =========================================================================

window.Theme = {
    init: function() {
        const hasDarkPreference = localStorage.getItem('theme') === 'dark' || 
            (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
            
        if (hasDarkPreference) {
            document.documentElement.classList.add('dark');
            this.updateIcon('dark');
        } else {
            document.documentElement.classList.remove('dark');
            this.updateIcon('light');
        }
    },
    
    toggle: function() {
        const isDark = document.documentElement.classList.contains('dark');
        if (isDark) {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
            this.updateIcon('light');
        } else {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
            this.updateIcon('dark');
        }
    },
    
    updateIcon: function(mode) {
        const icon = document.querySelector('[data-theme-icon]');
        if (!icon) return;
        icon.textContent = mode === 'dark' ? 'light_mode' : 'dark_mode';
    }
};

// =========================================================================
// 3. CENTRALIZED MULTI-PHASE CLOUD STORAGE ENGINE
// =========================================================================

class CloudAuditStoreManager {
     constructor() {
        // --- FIXED: Linked directly to your authentic project environment variables ---
        this.firebaseConfig = {
            apiKey: "AIzaSyDsHxFMMHy2qYsLaYjAUTqMeQKwC4zNDbQ",
            authDomain: "audit-system-76e00.firebaseapp.com",
            projectId: "audit-system-76e00",
            storageBucket: "audit-system-76e00.firebasestorage.app",
            messagingSenderId: "874863390026",
            appId: "1:874863390026:web:1d4783557663fb0468a5b3",
            measurementId: "G-EXNH41C2E0"
        };
        
        // Boot up the native instance connection mapping arrays safely
        this.app = initializeApp(this.firebaseConfig);
        this.db = getFirestore(this.app);
        
        // Multi-Tenant Session Path Boundaries
        this.orgId = "demo_corporation_kra";
        this.auditId = "AUD-2026-MASTER";
        
        this.current = null;
        this.unsubscribe = null;
        
        localStorage.setItem("sentinel_org_id", this.orgId);
        localStorage.setItem("sentinel_active_audit_id", this.auditId);
    }


    /**
     * Obtains target document pointer path references securely
     */
     getDocRef() {
        return doc(this.db, "organizations", this.orgId, "audits", this.auditId);
    }

    /**
     * Connects a real-time reactive pipeline stream from Firestore.
     */
    subscribeToAudit(uiRenderCallback) {
        const docRef = this.getDocRef();
        
        if (this.unsubscribe) {
            this.unsubscribe();
        }

        this.unsubscribe = onSnapshot(docRef, (snapshot) => {
            if (snapshot.exists()) {
                this.current = snapshot.data();
            } else {
                // If the target document path is completely blank inside your 
                // new project, this automatically builds the base schema tree framework
                this.current = this.getInitialSchemaBlueprint();
                setDoc(docRef, this.current);
            }
            if (typeof uiRenderCallback === "function") {
                uiRenderCallback(this.current);
            }
        }, (error) => {
            console.error("Critical Cloud Matrix Synchronization Exception Raised:", error);
        });
    }
    /**
     * Commits localized state modifications directly up to Firestore node.
     */
       async save() {
        if (!this.current) return;
        const docRef = this.getDocRef();
        try {
            // Decouple internal live reference bindings using structural cloning serialization
            const uploadPayload = JSON.parse(JSON.stringify(this.current));
            await setDoc(docRef, uploadPayload, { merge: true });
            console.log("🔥 Success! Record package committed into audit-system-76e00 database node.");
        } catch (err) {
            console.error("Cloud Mutator Operation Aborted:", err);
            throw err;
        }
    }



    combinePulled(baselineText, userAdditions) {
        if (!userAdditions || userAdditions.trim() === "") return baselineText;
        return `${baselineText}\n\n[Additional Program Scope Context Entered]:\n${userAdditions}`;
    }

    // --- PHASE 1: PLANNING LINE MUTATORS ---

    async updateUniverse(universeRowsArray) {
        if (!this.current) return;
        
        if (!this.current.phase1_planning) {
            this.current.phase1_planning = {};
        }
        
        this.current.phase1_planning.universe = universeRowsArray;
        await this.save();
    }


    async updateRiskRegister(riskRowsArray) {
        if (!this.current) return;
        this.current.phase1_planning.riskRegister = riskRowsArray;
        await this.save();
    }

    async updateWorkPlan(workPlanRowsArray, runningBudgetTotal, approvalMinutes, approvalDate) {
        if (!this.current) return;
        this.current.phase1_planning.workPlan = workPlanRowsArray;
        this.current.phase1_planning.workPlanMetadata = {
            cumulativeBudget: runningBudgetTotal,
            minuteNumberRef: approvalMinutes,
            approvalDate: approvalDate
        };
        await this.save();
    }

    // --- PHASE 2: PERFORMING / EXECUTION INTER-OPERABILITY PIPELINES ---

    carryToDraft() {
        if (!this.current.phase2_performing.draftReport.findingsRows || this.current.phase2_performing.draftReport.findingsRows.length === 0) {
            this.current.phase2_performing.draftReport.findingsRows = [{
                objective: "Verify operational adherence to core firewall update timelines.",
                findings: "Observation: Firewall rules updates are lagging behind standard vulnerability patches. Standard: Rules must be verified within 7 days. Practice: Updates currently take up to 28 days. Root-cause: Absence of automated compliance scripts. Implications: Increased perimeter vulnerability windows.",
                obs: "Firewall rules updates are lagging behind standard vulnerability patches.",
                std: "Rules must be verified within 7 days.",
                prac: "Updates currently take up to 28 days.",
                root: "Absence of automated compliance scripts.",
                imp: "Increased perimeter vulnerability windows.",
                recommendations: "Deploy systematic patch routines instantly and activate configuration alerting parameters.",
                managementResponse: ""
            }];
            this.save();
        }
    }

    carryToFinal() {
        const draftRows = this.current.phase2_performing.draftReport.findingsRows || [];
        const existingFinalRows = this.current.phase2_performing.finalReport.managementResponseRows || [];

        this.current.phase2_performing.finalReport.managementResponseRows = draftRows.map((draftRow, index) => {
            const existingRow = existingFinalRows[index] || {};
            return {
                objective: draftRow.objective || "—",
                findings: draftRow.findings || "—",
                recommendations: draftRow.recommendations || "—",
                managementAction: existingRow.managementAction || "",
                implementationTimeline: existingRow.implementationTimeline || "",
                responsiblePerson: existingRow.responsiblePerson || "",
                status: existingRow.status || "Inadequate" 
            };
        });

        this.evaluateGlobalResponseAdequacy();
        this.save();
    }

    markResponseStatus(rowIndex, statusString) {
        const targetRow = this.current.phase2_performing.finalReport.managementResponseRows[rowIndex];
        if (targetRow) {
            targetRow.status = statusString;
            this.evaluateGlobalResponseAdequacy();
            this.save();
        }
    }

    evaluateGlobalResponseAdequacy() {
        const rows = this.current.phase2_performing.finalReport.managementResponseRows || [];
        if (rows.length === 0) {
            this.current.phase2_performing.finalReport.responseStatus = "Inadequate — Return";
            return;
        }
        const hasInadequate = rows.some(row => row.status === "Inadequate");
        this.current.phase2_performing.finalReport.responseStatus = hasInadequate ? "Inadequate — Return" : "Adequate — Approve";
    }

        // --- PHASE 3: FOLLOW UP ARCHITECTURE ROUTERS ---

    carryToFollowUp() {
        const finalRows = this.current.phase2_performing.finalReport.managementResponseRows || [];
        const existingFollowUpRows = this.current.phase3_followup.rows || [];

        this.current.phase3_followup.rows = finalRows.map((finalRow, index) => {
            const existingFuRow = existingFollowUpRows[index] || {};
            return {
                objective: finalRow.objective || "—",
                findings: finalRow.findings || "—",
                recommendations: finalRow.recommendations || "—",
                managementAction: finalRow.managementAction || "—",
                implementationTimeline: finalRow.implementationTimeline || "—",
                responsiblePerson: finalRow.responsiblePerson || "—",
                statusOfImplementation: existingFuRow.statusOfImplementation || "Not Implemented",
                evidenceAttachmentName: existingFuRow.evidenceAttachmentName || "",
                justificationText: existingFuRow.justificationText || "",
                auditRemarks: existingFuRow.auditRemarks || "Open",
                extendedTimeline: existingFuRow.extendedTimeline || ""
            };
        });

        this.save();
    }

    async updateFollowUpRowInline(rowIndex, fieldName, updatedValue) {
        if (!this.current?.phase3_followup?.rows[rowIndex]) return;
        this.current.phase3_followup.rows[rowIndex][fieldName] = updatedValue;
        await this.save();
    }

    async finalizeFollowUpPhase(approvalSignatureData) {
        if (!this.current) return;
        this.current.phase3_followup.approval = {
            name: approvalSignatureData.name || "",
            designation: approvalSignatureData.designation || "",
            sign: approvalSignatureData.sign || "",
            date: new Date().toISOString().split('T')[0]
        };
        await this.save();
    }

    // =========================================================================
    // 4. SYSTEM INITIALIZATION BLUEPRINT & SCHEMA SPECIFICATION
    // =========================================================================

    getInitialSchemaBlueprint() {
        return {
            id: this.auditId,
            phase1_planning: {
                universe: [],
                riskRegister: [],
                workPlan: [],
                workPlanMetadata: { cumulativeBudget: 0, minuteNumberRef: "", approvalDate: "" }
            },
            phase2_performing: {
                planProgram: {
                    introductionBackground: "The Kenya Revenue Authority operates distributed database networks. Ensuring uniform perimeter configurations across these nodes is critical to national revenue protection.",
                    methodology: "1. Automated asset configuration compliance scanning.\n2. Technical inspection of core change authorization logs.\n3. Sample evaluation of system rule update timestamps.",
                    evaluationCriteria: "ISO/IEC 27001:2022 Control A.8.20 (Network Security) and National Cybersecurity Compliance Regulatory Directives.",
                    auditDuration: "6 Weeks (Est. 240 Professional Hours)",
                    risksAdditions: "", auditObjectivesAdditions: "", auditScopeAdditions: ""
                },
                draftReport: { executiveSummary: "", findingsRows: [] },
                draftApproval: {
                    reviewer1: { name: "", designation: "", sign: "", date: "" },
                    reviewer2: { name: "", designation: "", sign: "", date: "" },
                    approver: { name: "", designation: "", sign: "", date: "" }
                },
                finalReport: { responseStatus: "Inadequate — Return", managementResponseRows: [] },
                finalApproval: { name: "", designation: "", sign: "", date: "" }
            },
            phase3_followup: {
                rows: [],
                approval: { name: "", designation: "", sign: "", date: "" }
            },
            appendices: [
                "Appendix 1: Core Network Topology Blueprint Log", 
                "Appendix 2: Firewall Security Rule Review Metadata Matrix Document"
            ]
        };
    }
}

// =========================================================================
// 5. GLOBAL SERVICE INSTANTIATION
// =========================================================================
window.AuditStore = new CloudAuditStoreManager();
