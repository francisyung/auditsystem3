/* =========================================================================
   shared_store.js — Sentinel Enterprise Audit
   SHARED DATA LAYER for the "Performing & Reporting Phase"
   -------------------------------------------------------------------------
   This single file powers all 3 HTML pages:
     plan_program.html  → Stage 1 (Audit Plan & Program)
     draft_report.html  → Stage 2 (Draft Audit Report)
     final_report.html  → Stage 3 (Final Audit Report)

   It uses localStorage so that whatever is entered on one page is
   automatically carried forward to the next page (no retyping).
   ========================================================================= */

/* -------------------------------------------------------------------------
   NAMESPACED STORAGE KEYS
   ------------------------------------------------------------------------- */
const STORE = {
  PLANNING: "sentinel_planning_selected_risk", // data pulled from Planning Phase
  PROGRAM:  "sentinel_stage1_plan_program",    // Stage 1 saved state
  DRAFT:    "sentinel_stage2_draft_report",    // Stage 2 saved state
  FINAL:    "sentinel_stage3_final_report",    // Stage 3 saved state
  THEME:    "sentinel_theme",                  // dark/light preference
};

/* -------------------------------------------------------------------------
   DEFAULT / INITIAL STATE
   -------------------------------------------------------------------------
   programming keeps read-only pulled values separate from editable textboxes.
   The "pulled" values come from the Planning Phase (Stage 0) and are locked.
   ------------------------------------------------------------------------- */
const DEFAULT_STATE = {
  // ---- pulled from Planning Phase (read-only) --------------------------
  planning: {
    entityName: "",
    auditRefNumber: "AUD-2026-000",
    riskLevel: "LOW (L)",
    auditArea: "",
    riskDescription: "",
    auditeeDepartment: "",
    auditStartDate: "",
    auditEndDate: "",
    budgetKsh: "0",
    numberOfAuditors: "1",
    physicalItResources: "",
    leadAuditor: "",
    auditor1: "",
    auditor2: "",
    approvalDate: "",
    minuteNumberRef: "",
  },

  // ---- editable text fields (Stage 1) ----------------------------------
  program: {
    introductionBackground: "",  // "Textbox"
    risksAdditions: "",          // pulled + textbox for addition
    auditObjectivesAdditions: "",// pulled + textbox for addition
    auditScopeAdditions: "",     // pulled + textbox for addition
    methodology: "",             // "Textbox"
    evaluationCriteria: "",      // "Textbox"
    auditDuration: "",           // "Textbox"
  },

  // ---- Audit Program table (interactive rows) --------------------------
  auditProgramRows: [
    {
      auditObjective: "",
      risks: "",
      activity: "",
      auditProcedure: "",
      auditor: "",
      remarksStatus: "",
    },
  ],

  // ---- Audit Resources sub-table (read-only pulled) ---------------------
  // (budget/auditors kept locked per your instruction, but structures kept)

  // ---- Preparation & Approval (Stage 1) ----------------------------------
  prepApproval: {
    prepared:   { name: "", designation: "", sign: "", date: "" },
    reviewed:   { name: "", designation: "", sign: "", date: "" },
    approved:   { name: "", designation: "", sign: "", date: "" },
  },

  // ---- Draft Audit Report (Stage 2) --------------------------------------
  draft: {
    executiveSummary: "", // textbox w/ intro, objectives, findings, conclusion
    findingsRows: [],     // { objective, findings, recommendations, managementResponse }
  },
  draftApproval: {
    reviewer1: { name: "", designation: "", sign: "", date: "" },
    reviewer2: { name: "", designation: "", sign: "", date: "" },
    approver:  { name: "", designation: "", sign: "", date: "" },
  },
  appendices: ["Appendix 1: "], // dynamic list of textboxes

  // ---- Final Audit Report (Stage 3) ---------------------------------------
  final: {
    // management responses filled into findings rows by Auditee/Management
    managementResponseRows: [], // copies of findings w/ filled mgmt response
    responseStatus: "Inadequate — Return", // "Adequate — Approve"
  },
  finalApproval: {
    name: "",
    designation: "",
    sign: "",
    date: "",
  },
};

/* -------------------------------------------------------------------------
   CORE HELPERS  (DOM + JSON + date utilities)
   ------------------------------------------------------------------------- */
const AuditStore = {
  current: null, // the live in-memory state object

  /* ---- deep clone helper to avoid reference issues --------------------- */
  clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  },

  /* ---- truthy value guard ---------------------------------------------- */
  val(v, fallback = "") {
    return v === undefined || v === null ? fallback : v;
  },

  /* ---- today's date in DD/MM/YYYY format ------------------------------- */
  today() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  },

  /* ---- format a number as currency (e.g. 10,000.00) --------------------- */
  currency(n) {
    const num = Number(n) || 0;
    return "Ksh " + num.toLocaleString("en-KE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  },

  /* ==== PERSISTENCE ====================================================== */

  /* load state from localStorage (Stage sets it first) ------------------ */
  load() {
    try {
      const raw = localStorage.getItem("sentinel_workspace");
      this.current = raw ? JSON.parse(raw) : this.clone(DEFAULT_STATE);
    } catch (e) {
      console.warn("No saved workspace found, using defaults.", e);
      this.current = this.clone(DEFAULT_STATE);
    }
    // ensure all default keys exist (in case of older saved data)
    this.current.planning = merge(this.clone(DEFAULT_STATE.planning), this.current.planning);
    this.current.program = merge(this.clone(DEFAULT_STATE.program), this.current.program);
    return this.current;
  },

  /* persist current state to localStorage -------------------------------- */
  save() {
    localStorage.setItem("sentinel_workspace", JSON.stringify(this.current));
  },

  /* clear all workspace data (reset button) ------------------------------ */
  reset() {
    localStorage.removeItem("sentinel_workspace");
    this.current = this.clone(DEFAULT_STATE);
    this.save();
  },

  /* ==== DATA SYNC (pulling across stages) ================================ */

  /*
     Pull a single planning-phase field. Since we want the value to survive
     even if the planning source changes, we allow the source to be provided
     at first run, then it is stored and treated as read-only in state.
  */
  pullPlanning(key, sourceValue) {
    const stored = this.current.planning[key];
    // if not yet set and a source value is provided, adopt it (pulled once)
    if (!stored && sourceValue !== undefined && sourceValue !== null && sourceValue !== "") {
      this.current.planning[key] = sourceValue;
      this.save();
    }
    return this.current.planning[key];
  },

  /* ---- return combined value: pulled base + editable addition ---------- */
  combinePulled(base, addition) {
    const b = String(base || "").trim();
    const a = String(addition || "").trim();
    if (b && a) return b + (b.endsWith(".") ? " " : ". ") + a;
    return b || a;
  },

  /* ---- transfer Stage 1 → Stage 2 (plan_program → draft_report) -------- */
  carryToDraft() {
    const cur = this.current;
    // preload editable fields in draft that are pulled from program
    // (they are already merged because they share the same editable strings)
    this.save();
    return cur;
  },

  /* ---- transfer Stage 2 → Stage 3 (draft → final) ---------------------- */
  carryToFinal() {
    const cur = this.current;
    // seed final management-response rows with draft findings, blanking the
    // management response so the Auditee/Directorate can fill them in
    cur.final.managementResponseRows = cur.draft.findingsRows.map((row) => ({
      objective: row.objective,
      findings: row.findings,
      recommendations: row.recommendations,
      managementAction: "",   // filled by management
      implementationTimeline: "",
      responsiblePerson: "",
      status: "Pending",      // "Adequate" / "Inadequate"
    }));
    cur.final.responseStatus = "Inadequate — Return";
    this.save();
    return cur;
  },

  /* ---- mark a management response adequate / inadequate ---------------- */
  markResponseStatus(idx, status) {
    if (this.current.final.managementResponseRows[idx]) {
      this.current.final.managementResponseRows[idx].status = status;
      // if all adequate → approve, else return
      const allAdequate = this.current.final.managementResponseRows.every(
        (r) => r.status === "Adequate"
      );
      this.current.final.responseStatus = allAdequate
        ? "Adequate — Approve"
        : "Inadequate — Return";
      this.save();
    }
    return this.current.final.responseStatus;
  },
};

/* ---- small merge helper (deep-ish, object-to-object) --------------------- */
function merge(defaults, incoming) {
  const result = { ...defaults };
  for (const key in incoming) {
    if (incoming[key] && typeof incoming[key] === "object" && !Array.isArray(incoming[key])) {
      result[key] = merge(defaults[key] || {}, incoming[key]);
    } else {
      result[key] = incoming[key];
    }
  }
  return result;
}

/* -------------------------------------------------------------------------
   THEME (dark / light) — matches your Tailwind config darkMode:"class"
   ------------------------------------------------------------------------- */
const ThemeController = {
  init() {
    const saved = localStorage.getItem(STORE.THEME);
    if (saved === "dark") {
      document.documentElement.classList.add("dark");
      this.setIcon("dark");
    } else {
      this.setIcon("light");
    }
  },
  toggle() {
    const isDark = document.documentElement.classList.toggle("dark");
    localStorage.setItem(STORE.THEME, isDark ? "dark" : "light");
    this.setIcon(isDark ? "dark" : "light");
  },
  setIcon(mode) {
    // Toggle material symbol icon if present in DOM
    document.querySelectorAll("[data-theme-icon]").forEach((el) => {
      el.textContent = mode === "dark" ? "light_mode" : "dark_mode";
    });
  },
};

/* -------------------------------------------------------------------------
   TABLE ROW MANAGER (interactive add/delete rows for all tables)
   ------------------------------------------------------------------------- */
const RowManager = {
  /* generic: given a tbody and a template row string, appends a new row. */
  addRow(tbodyId, templateFn) {
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return;
    const row = document.createElement("tr");
    row.className =
      "border-b border-outline-variant last:border-0 hover:bg-surface-container-low transition";
    row.innerHTML = templateFn(tbody.rows.length + 1);
    tbody.appendChild(row);
  },

  /* remove a row (only if there is more than one) */
  deleteRow(btn) {
    const row = btn.closest("tr");
    const tbody = row.parentElement;
    if (tbody.rows.length > 1) {
      row.remove();
      renumber(tbody);
    } else {
      alert("At least one row must remain.");
    }
  },

  /* re-number the S/No column after deletes */
  renumber(tbody) {
    Array.from(tbody.rows).forEach((row, i) => {
      const sn = row.querySelector("[data-sno]");
      if (sn) sn.textContent = i + 1;
    });
  },
};

/* helper used inside template functions to build an editable cell input */
function cellInput(name, placeholder, value, type = "text", extraClasses = "") {
  const val = value === undefined ? "" : value;
  return `<input type="${type}" name="${name}" value="${escapeAttr(val)}" ` +
         `placeholder="${placeholder}" ` +
         `class="w-full bg-transparent text-on-surface placeholder:text-on-surface-variant px-2 py-1 text-sm focus:outline-none ${extraClasses}">`;
}

/* helper to escape attribute values to avoid breaking markup */
function escapeAttr(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/* helper to build a read-only pulled cell (locked) */
function pulledCell(value) {
  return `<div class="px-2 py-1 text-sm text-on-surface-variant bg-surface-container-lowest">${escapeAttr(value || "—")}</div>`;
}

/* -------------------------------------------------------------------------
   EXPOSE GLOBALS (so HTML pages can use AuditStore, ThemeController, etc.)
   ------------------------------------------------------------------------- */
window.AuditStore = AuditStore;
window.Theme = ThemeController;
window.RowManager = RowManager;
window.cellInput = cellInput;
window.pulledCell = pulledCell;
window.escapeAttr = escapeAttr;

/* auto-load state on script load */
AuditStore.load();