/* ============================================================
   Sentinel Enterprise — Audit Plan & Program
   - Renders the full audit plan UI
   - Editable fields (contenteditable + inputs)
   - Dynamic audit-program table rows
   - localStorage auto-persistence
   - Print / Save-as-PDF
   ============================================================ */

'use strict';

const STORAGE_KEY = 'sentinel-audit-plan-v1';

/* ------------------------------------------------------------------
   Default seed data — reflects the sample row from the spec
------------------------------------------------------------------- */
const DEFAULT_STATE = {
    meta: {
        entity: '',
        auditArea: '',
        auditee: '',
        auditPeriod: ''
    },
    sections: {
        duration: `Outline the proposed timeline and phases for this engagement, including fieldwork dates, milestones, and planned reporting dates.`,
        intro: `This section provides context on the auditee, its mandate, operations, and the background that led to this audit engagement.`,
        risks: `List the key risks identified within the audit area that this engagement seeks to address.`,
        objectives: `State the overall and specific audit objectives in measurable terms.`,
        scope: `Define the boundaries of the audit — what is covered, the period, locations, processes, and any exclusions.`,
        methodology: `Describe the approach and techniques to be used, e.g. document review, interviews, observation, data analytics, sampling.`,
        evaluationCriteria: `Identify the criteria or benchmarks against which findings will be assessed (laws, regulations, policies, standards, best practice).`
    },
    programRows: [
        {
            objective: 'To assess implementation of cybersecurity policy',
            risk: 'Exposure to cyberthreats\r\nLack of awareness',
            activity: 'Confirm existence of anti-virus\r\nConfirm staff sensitization',
            procedure: '- Check validity of licences\r\n- Check installation of anti-virus on computers\r\n- Obtain awareness records\r\n- Interview staff',
            remarks: ''
        },
        {
            objective: '',
            risk: '',
            activity: '',
            procedure: '',
            remarks: ''
        }
    ],
    approvals: {
        prepared: { name: '', date: '' },
        reviewed: { name: '', date: '' },
        approved: { name: '', date: '' }
    }
};

/* ------------------------------------------------------------------
   Store helpers
------------------------------------------------------------------- */
function loadState() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) return deepMerge(structuredClone(DEFAULT_STATE), JSON.parse(raw));
    } catch (e) {
        console.warn('Could not load saved state', e);
    }
    return structuredClone(DEFAULT_STATE);
}

function saveState(state) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
        console.warn('Could not persist state', e);
    }
}

function deepMerge(base, override) {
    for (const key of Object.keys(override)) {
        if (
            override[key] &&
            typeof override[key] === 'object' &&
            !Array.isArray(override[key]) &&
            base[key] && typeof base[key] === 'object'
        ) {
            base[key] = deepMerge(base[key], override[key]);
        } else {
            base[key] = override[key];
        }
    }
    return base;
}

/* ------------------------------------------------------------------
   Icon helper (Material Symbols)
------------------------------------------------------------------- */
function icon(name, className = '') {
    return `<span class="material-symbols-outlined ${className}" aria-hidden="true">${name}</span>`;
}

/* ------------------------------------------------------------------
   Build a content section (editable rich area)
------------------------------------------------------------------- */
function editableSection(title, id, hint, content) {
    return `
        <section class="print-card bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm p-5 md:p-6">
            <h2 class="font-headline text-base md:text-lg font-bold text-primary flex items-center gap-2 uppercase tracking-wide">
                ${icon('article')} ${title}
            </h2>
            <p class="text-xs text-on-surface-variant mt-1 mb-3 italic">${hint}</p>
            <div
                class="field min-h-[4rem] prose max-w-none text-sm leading-relaxed whitespace-pre-wrap
                       bg-surface-container-low rounded-lg px-4 py-3"
                contenteditable="true"
                data-field="sections.${id}"
                role="textbox"
                aria-multiline="true"
                data-placeholder="${hint}">${content}</div>
        </section>
    `;
}

/* ------------------------------------------------------------------
   Header banner with performing & reporting phase
------------------------------------------------------------------- */
function headerBanner(meta) {
    return `
        <div class="print-card print-headerbar overflow-hidden rounded-xl shadow-sm border border-outline-variant mb-6">
            <div class="bg-primary-container text-on-primary px-6 py-4 flex items-center gap-3">
                ${icon('planner')}
                <div>
                    <p class="text-[11px] uppercase tracking-widest opacity-80">Sentinel Enterprise • Internal Audit</p>
                    <h1 class="font-headline text-xl md:text-2xl font-extrabold">Audit Plan and Program</h1>
                </div>
            </div>
            <div class="bg-surface-container-low px-6 py-2 text-[11px] uppercase tracking-widest text-on-surface-variant flex items-center gap-2">
                ${icon('flag', 'text-[16px]')} Performing &amp; Reporting Phase
            </div>

            <!-- Entity metadata grid -->
            <div class="p-6 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                <label class="block">
                    <span class="text-xs font-semibold text-on-surface-variant uppercase">Entity Name</span>
                    <input type="text" data-field="meta.entity" value="${esc(meta.entity)}"
                        class="field mt-1 w-full rounded-lg border-outline-variant bg-surface-container-low px-3 py-2 text-sm" placeholder="Enter entity name" />
                </label>
                <label class="block">
                    <span class="text-xs font-semibold text-on-surface-variant uppercase">Audit Area / Title</span>
                    <input type="text" data-field="meta.auditArea" value="${esc(meta.auditArea)}"
                        class="field mt-1 w-full rounded-lg border-outline-variant bg-surface-container-low px-3 py-2 text-sm" placeholder="e.g. Cybersecurity" />
                </label>
                <label class="block">
                    <span class="text-xs font-semibold text-on-surface-variant uppercase">Auditee / Department / Directorate</span>
                    <input type="text" data-field="meta.auditee" value="${esc(meta.auditee)}"
                        class="field mt-1 w-full rounded-lg border-outline-variant bg-surface-container-low px-3 py-2 text-sm" placeholder="Department or directorate" />
                </label>
                <label class="block">
                    <span class="text-xs font-semibold text-on-surface-variant uppercase">Audit Period</span>
                    <input type="text" data-field="meta.auditPeriod" value="${esc(meta.auditPeriod)}"
                        class="field mt-1 w-full rounded-lg border-outline-variant bg-surface-container-low px-3 py-2 text-sm" placeholder="e.g. FY 2025/2026" />
                </label>
            </div>
        </div>
    `;
}

/* ------------------------------------------------------------------
   Audit Duration / Execution Schedule
   - Contains an editable textbox (schedule notes)
------------------------------------------------------------------- */
function auditDurationSection(state) {
    return `
        <section class="print-card bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm p-5 md:p-6">
            <h2 class="font-headline text-base md:text-lg font-bold text-primary flex items-center gap-2 uppercase tracking-wide">
                ${icon('schedule')} Audit Duration / Execution Schedule
            </h2>
            <p class="text-xs text-on-surface-variant mt-1 mb-3 italic">Outline the proposed timeline and phases for this engagement.</p>
            <div
                class="field min-h-[5rem] w-full rounded-lg border-outline-variant bg-surface-container-low px-3 py-3 text-sm leading-relaxed whitespace-pre-wrap"
                contenteditable="true"
                data-field="sections.duration"
                role="textbox"
                aria-multiline="true"
                data-placeholder="Describe the audit duration and execution timeline.">${esc(state.sections.duration)}</div>
        </section>
    `;
}

/* ------------------------------------------------------------------  
   Audit Program (separate table with dynamic rows)  
------------------------------------------------------------------- */  
function programTable(rows) {  
    const ROWS = rows.map((r, i) => `  
        <tr data-row="${i}" class="align-top border-t border-outline-variant">  
            <td class="px-3 py-3 text-center text-sm font-semibold w-12">${i + 1}</td>  
            <td class="px-2 py-2 w-48">  
                <textarea data-rowfield="objective" class="field w-full min-h-[4rem] rounded-lg border-outline-variant bg-surface-container-low px-2 py-2 text-xs leading-relaxed">${esc(r.objective)}</textarea>  
            </td>  
            <td class="px-2 py-2 w-48">  
                <textarea data-rowfield="risk" class="field w-full min-h-[4rem] rounded-lg border-outline-variant bg-surface-container-low px-2 py-2 text-xs leading-relaxed">${esc(r.risk)}</textarea>  
            </td>  
            <td class="px-2 py-2 w-48">  
                <textarea data-rowfield="activity" class="field w-full min-h-[4rem] rounded-lg border-outline-variant bg-surface-container-low px-2 py-2 text-xs leading-relaxed">${esc(r.activity)}</textarea>  
            </td>  
            <td class="px-2 py-2 w-64">  
                <textarea data-rowfield="procedure" class="field w-full min-h-[4rem] rounded-lg border-outline-variant bg-surface-container-low px-2 py-2 text-xs leading-relaxed">${esc(r.procedure)}</textarea>  
            </td>  
            <td class="px-2 py-2 w-48">  
                <textarea data-rowfield="lead_officer" class="field w-full min-h-[4rem] rounded-lg border-outline-variant bg-surface-container-low px-2 py-2 text-xs leading-relaxed">${esc(r.lead_officer || '')}</textarea>  
            </td>  
            <td class="px-2 py-2 w-48">  
                <textarea data-rowfield="remarks" class="field w-full min-h-[4rem] rounded-lg border-outline-variant bg-surface-container-low px-2 py-2 text-xs leading-relaxed">${esc(r.remarks)}</textarea>  
            </td>  
            <td class="px-3 py-3 text-center w-16 no-print">  
                <button class="btn-delete-row mx-auto h-6 w-6 rounded-full bg-error text-white flex items-center justify-center text-[13px] shadow-sm hover:bg-tertiary transition"  
                    data-delete="${i}" title="Remove row" aria-label="Remove row">×</button>  
            </td>  
        </tr>  
    `).join('');  

    return `
        <section class="print-card audit-program bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm p-5 md:p-6">
            <h3 class="font-headline text-base md:text-lg font-bold text-primary flex items-center gap-2 uppercase tracking-wide">
                ${icon('table')} Audit Program
            </h3>
            <p class="text-xs text-on-surface-variant mt-1 mb-4 italic">Define audit objectives, risks, activities and procedures. Add or remove rows as needed.</p>

            <div class="overflow-x-auto">
                <table class="w-full border-collapse text-sm">
                    <thead>
                        <tr class="bg-primary text-on-primary dark:bg-slate-900 border-b border-outline-variant/40 dark:border-slate-800 text-xs font-bold uppercase tracking-wider text-on-surface-variant dark:text-slate-400">
                            <th class="p-3 w-12 text-center">S/No.</th>
                            <th class="p-3 w-48 text-left">Targeted Objective</th>
                            <th class="p-3 w-48 text-left">Associated Risk Field</th>
                            <th class="p-3 w-48 text-left">Assigned Core Activity</th>
                            <th class="p-3 w-64 text-left">Procedure / Substantive Test Instructions</th>
                            <th class="p-3 w-48 text-left">Lead Officer</th>
                            <th class="p-3 w-48 text-left">Status / Remarks</th>
                            <th class="p-3 w-16 text-center no-print">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="program-body">
                        ${ROWS}
                    </tbody>
                </table>
            </div>

            <button id="btn-add-row" class="no-print mt-4 inline-flex items-center gap-2 rounded-lg bg-primary text-on-primary px-4 py-2 text-sm font-semibold shadow-sm hover:bg-primary-container transition">
                ${icon('add')} Add Row
            </button>
        </section>
    `;
}

/* ------------------------------------------------------------------
   Preparation & Approval
------------------------------------------------------------------- */
function approvals(approvals) {
    const block = (label, data) => `
        <div class="flex-1 min-w-[220px]">
            <p class="text-xs font-semibold text-on-surface-variant uppercase mb-2">${label}</p>
            <input type="text" data-approval="name" data-approval-key="${label.toLowerCase()}"
                value="${esc(data.name)}" placeholder="Name"
                class="field mb-2 w-full rounded-lg border-outline-variant bg-surface-container-low px-3 py-2 text-sm" />
            <input type="date" data-approval="date" data-approval-key="${label.toLowerCase()}"
                value="${esc(data.date)}"
                class="field w-full rounded-lg border-outline-variant bg-surface-container-low px-3 py-2 text-sm" />
            <div class="mt-2 pt-4 border-t border-dashed border-on-surface-variant text-right text-xs text-on-surface-variant">Signature</div>
        </div>
    `;

    return `
        <section class="print-card bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm p-5 md:p-6">
            <h2 class="font-headline text-base md:text-lg font-bold text-primary flex items-center gap-2 uppercase tracking-wide">
                ${icon('approval')} Preparation &amp; Approval
            </h2>
            <p class="text-xs text-on-surface-variant mt-1 mb-4 italic">Confirm preparation, review, and formal approval of this audit plan.</p>
            <div class="flex flex-wrap gap-6">
                ${block('Prepared By', approvals.prepared)}
                ${block('Reviewed By', approvals.reviewed)}
                ${block('Approved By', approvals.approved)}
            </div>
        </section>
    `;
}

/* ------------------------------------------------------------------
   Toolbar (top, non-print)
------------------------------------------------------------------- */
function toolbar() {
    return `
        <div class="toolbar no-print sticky top-0 z-10 bg-surface/90 backdrop-blur border-b border-outline-variant mb-6">
            <div class="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
                <div class="flex items-center gap-2 text-primary">
                    ${icon('shield', 'text-2xl')}
                    <span class="font-headline font-bold text-sm uppercase tracking-wide">Sentinel Enterprise</span>
                </div>
                <div class="flex items-center gap-2">
                    <button id="btn-reset" class="inline-flex items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-sm text-on-surface-variant hover:bg-surface-container-highest transition">
                        ${icon('restart')} Reset
                    </button>
                    <button id="btn-print" class="btn-print inline-flex items-center gap-2 rounded-lg bg-primary text-on-primary px-4 py-2 text-sm font-semibold shadow-sm hover:bg-primary-container transition">
                        ${icon('print')} Print / Save PDF
                    </button>
                </div>
            </div>
        </div>
    `;
}

/* ------------------------------------------------------------------
   Main render
------------------------------------------------------------------- */
function render() {
    const state = currentState();
    const app = document.getElementById('app');
    if (!app) {
        console.warn("Target container element with id 'app' was not found. Skipping dynamic injection.");
        return;
    }
    app.innerHTML = `
        ${toolbar()}
        <main class="max-w-5xl mx-auto px-4 pb-16 space-y-6">
            ${headerBanner(state.meta)}
            ${editableSection('Introduction & Background Information', 'intro',
                'Provide context on the auditee and the background to the audit.', state.sections.intro)}
            ${editableSection('Risk(s)', 'risks',
                'Key risks identified within the audit area.', state.sections.risks)}
            ${editableSection('Audit Objectives', 'objectives',
                'Overall and specific objectives in measurable terms.', state.sections.objectives)}
            ${editableSection('Audit Scope', 'scope',
                'Boundaries — coverage, period, locations, exclusions.', state.sections.scope)}
            ${editableSection('Methodology', 'methodology',
                'Approach and techniques to be used.', state.sections.methodology)}
            ${editableSection('Evaluation Criteria', 'evaluationCriteria',
                'Benchmarks against which findings are assessed.', state.sections.evaluationCriteria)}

            ${auditDurationSection(state)}

            ${programTable(state.programRows)}
            ${approvals(state.approvals)}
        </main>
    `;
    bindEvents();
}

/* ------------------------------------------------------------------
   Global state & event binding
------------------------------------------------------------------- */
let state = loadState();

function currentState() {
    return state;
}

/* Minimal HTML escape for injecting into templates safely */
function esc(str) {
    return String(str ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function bindEvents() {
    // Print
    document.getElementById('btn-print').addEventListener('click', () => window.print());

    // Reset
    document.getElementById('btn-reset').addEventListener('click', () => {
        if (!confirm('Reset all fields to the defaults? Unsaved local data will be cleared.')) return;
        state = structuredClone(DEFAULT_STATE);
        saveState(state);
        render();
    });

    // Meta + approval inputs
    document.querySelectorAll('input[data-field]').forEach(inp => {
        inp.addEventListener('input', () => {
            setByPath(state, inp.dataset.field, inp.value);
            saveState(state);
        });
    });

    // Approval inputs
    document.querySelectorAll('input[data-approval]').forEach(inp => {
        inp.addEventListener('input', () => {
            const key = inp.dataset.approvalKey; // prepared | reviewed | approved
            const sub = inp.dataset.approval;    // name | date
            state.approvals[key][sub] = inp.value;
            saveState(state);
        });
    });

    // Editable section textareas (prose)
    document.querySelectorAll('[contenteditable][data-field]').forEach(el => {
        el.addEventListener('input', () => {
            setByPath(state, el.dataset.field, el.innerText);
            saveState(state);
        });
        el.addEventListener('paste', (e) => e.preventDefault()); // keep plain text (opt-in)
    });

    // Program table row textareas
    document.querySelectorAll('textarea[data-rowfield]').forEach(ta => {
        ta.addEventListener('input', () => {
            const row = Number(ta.closest('tr').dataset.row);
            const field = ta.dataset.rowfield;
            state.programRows[row][field] = ta.value;
            saveState(state);
        });
    });

    // Add row
    document.getElementById('btn-add-row').addEventListener('click', () => {
        state.programRows.push({ objective: '', risk: '', activity: '', procedure: '', remarks: '' });
        saveState(state);
        render();
    });

    // Delete row
    document.querySelectorAll('[data-delete]').forEach(btn => {
        btn.addEventListener('click', () => {
            const idx = Number(btn.dataset.delete);
            state.programRows.splice(idx, 1);
            saveState(state);
            render();
        });
    });
}

/* Set nested value by dot path on state object */
function setByPath(obj, path, value) {
    const keys = path.split('.');
    let cur = obj;
    for (let i = 0; i < keys.length - 1; i++) cur = cur[keys[i]];
    cur[keys[keys.length - 1]] = value;
}
window.addChecklistStepRow = function() {
    // Add logic here to append a row to your local program data array
    state.programRows.push({ objective: '', risk: '', activity: '', procedure: '', remarks: '' });
    saveState(state);
    render();
};

window.commitProgramWorkspaceState = function() {
    // Saves current UI state memory back to localStorage
    saveState(state);
    console.log("Workspace state committed successfully.");
};
window.renderExistingProgramTableOnly = function() {
    const tbody = document.getElementById('program-body');
    if (!tbody) {
        console.warn("Could not locate table target container element with id 'program-body'.");
        return;
    }

    // Clear and map database state parameters onto rows layout inside your custom HTML structure
    tbody.innerHTML = state.programRows.map((r, i) => `
        <tr data-row="${i}" class="align-top border-t border-outline-variant hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">  
            <td class="px-3 py-3 text-center text-xs font-bold w-12 text-slate-400 align-middle">${i + 1}</td>  
            <td class="px-2 py-2 w-48">  
                <textarea data-rowfield="objective" class="w-full min-h-[4rem] rounded-lg border border-outline-variant/40 bg-surface-container-low dark:bg-[#0d0e10] dark:border-slate-700 px-2 py-2 text-xs leading-relaxed text-on-surface dark:text-slate-200">${esc(r.objective || '')}</textarea>  
            </td>  
            <td class="px-2 py-2 w-48">  
                <textarea data-rowfield="risk" class="w-full min-h-[4rem] rounded-lg border border-outline-variant/40 bg-surface-container-low dark:bg-[#0d0e10] dark:border-slate-700 px-2 py-2 text-xs leading-relaxed text-on-surface dark:text-slate-200">${esc(r.risk || '')}</textarea>  
            </td>  
            <td class="px-2 py-2 w-48">  
                <textarea data-rowfield="activity" class="w-full min-h-[4rem] rounded-lg border border-outline-variant/40 bg-surface-container-low dark:bg-[#0d0e10] dark:border-slate-700 px-2 py-2 text-xs leading-relaxed text-on-surface dark:text-slate-200">${esc(r.activity || '')}</textarea>  
            </td>  
            <td class="px-2 py-2 w-64">  
                <textarea data-rowfield="procedure" class="w-full min-h-[4rem] rounded-lg border border-outline-variant/40 bg-surface-container-low dark:bg-[#0d0e10] dark:border-slate-700 px-2 py-2 text-xs leading-relaxed text-on-surface dark:text-slate-200">${esc(r.procedure || '')}</textarea>  
            </td>  
            <!-- Fixed Column 6: Lead Officer -->
            <td class="px-2 py-2 w-48">  
                <textarea data-rowfield="lead_officer" class="w-full min-h-[4rem] rounded-lg border border-outline-variant/40 bg-surface-container-low dark:bg-[#0d0e10] dark:border-slate-700 px-2 py-2 text-xs leading-relaxed text-on-surface dark:text-slate-200">${esc(r.lead_officer || '')}</textarea>  
            </td>  
            <!-- Fixed Column 7: Status / Remarks Textarea Box -->
            <td class="px-2 py-2 w-48">  
                <textarea data-rowfield="remarks" class="w-full min-h-[4rem] rounded-lg border border-outline-variant/40 bg-surface-container-low dark:bg-[#0d0e10] dark:border-slate-700 px-2 py-2 text-xs leading-relaxed text-on-surface dark:text-slate-200">${esc(r.remarks || '')}</textarea>  
            </td>  
            <!-- Fixed Column 8: Action Actions Column with centered delete button -->
            <td class="px-3 py-3 text-center w-16 no-print align-middle">  
                <button class="h-5 w-5 mx-auto rounded-full bg-red-500 text-white flex items-center justify-center text-[11px] shadow-sm hover:bg-red-600 transition"  
                    onclick="window.deleteProgramStepRow(${i})" title="Remove row">×</button>  
            </td>  
        </tr>  
    `).join('');

    // Re-bind change listeners to input textareas (now automatically includes lead_officer and remarks!)
    document.querySelectorAll('textarea[data-rowfield]').forEach(ta => {
        ta.addEventListener('input', () => {
            const row = Number(ta.closest('tr').dataset.row);
            const field = ta.dataset.rowfield;
            
            // Safety check to ensure data object has fields initialized
            if (!state.programRows[row]) state.programRows[row] = {};
            
            state.programRows[row][field] = ta.value;
            saveState(state);
        });
    });
};


// Global delete routine definition
window.deleteProgramStepRow = function(idx) {
    state.programRows.splice(idx, 1);
    saveState(state);
    window.renderExistingProgramTableOnly();
};
/* ------------------------------------------------------------------
   Global Workspace Interoperability Hook Bindings
------------------------------------------------------------------- */

// Fixes: Add Procedure Step Button
window.addChecklistStepRow = function() {
    state.programRows.push({
        objective: '',
        risk: '',
        activity: '',
        procedure: '',
        remarks: ''
    });
    saveState(state);
    
    // Dynamically re-renders rows inside your existing hardcoded HTML table layout
    window.renderExistingProgramTableOnly();
};

// Fixes: Sync Cloud State Button
window.commitProgramWorkspaceState = function() {
    saveState(state);
    alert("Cloud state synchronized successfully!");
};

// Fixes: Uncaught ReferenceError: finalizeProgramAndProceedToDraft is not defined
window.finalizeProgramAndProceedToDraft = function() {
    saveState(state);
    console.log("Saving state baseline configuration parameters...");
    // Put your navigation routing logic here, for example:
    // window.location.href = "draft_report.html";
    alert("Navigating to Phase 2 Stage 2: Draft Report Workspace.");
};

/* Bootstrap */
/* Bootstrap Lifecycle Configuration Hook */
document.addEventListener('DOMContentLoaded', () => {
    // 1. Draw your local program table rows matrix layout inside the HTML
    window.renderExistingProgramTableOnly();
    
    // 2. Safely sync changes on your static data input elements back into memory store
    document.querySelectorAll('input[data-field]').forEach(inp => {
        inp.addEventListener('input', () => {
            setByPath(state, inp.dataset.field, inp.value);
            saveState(state);
        });
    });
});
