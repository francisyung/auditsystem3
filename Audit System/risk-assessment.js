document.addEventListener("DOMContentLoaded", () => {
    // ============================================================
    // 1. Reference Key DOM Elements
    // ============================================================
    const storedData = sessionStorage.getItem("selectedAudits");
    const container = document.getElementById("audit-rows-container");
    const form = document.getElementById("risk-assessment-form");
    const alertBanner = document.getElementById("form-alert");
    const sortBtn = document.getElementById("sort-trigger");
    const counterBadge = document.getElementById("selection-counter");

    // Safety check: bail out early if the container is missing
    if (!container) return;

    // ============================================================
    // 2. Parse Stored Selection Data (robust handling)
    // ============================================================
    let selectedEntries = null;

    if (storedData) {
        try {
            const parsed = JSON.parse(storedData);
            if (Array.isArray(parsed) && parsed.length > 0) {
                selectedEntries = parsed;
            }
        } catch (err) {
            console.warn("Invalid selectedAudits payload:", err);
        }
    }

    // ============================================================
    // 3. Apply Enterprise Risk-Matrix Color Ranking for a Score
    // ============================================================
    const applyRanking = (badge, score, scoreText) => {
        const base = "ranking-badge text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide border";

        if (score >= 7) {
            badge.textContent = "HIGH";
            badge.className = `${base} bg-rose-50 text-rose-700 border-rose-200`;
            scoreText.className = "score-display font-black text-sm text-red-700";
        } else if (score >= 4) {
            badge.textContent = "MOD";
            badge.className = `${base} bg-amber-50 text-amber-700 border-amber-200`;
            scoreText.className = "score-display font-black text-sm text-amber-700";
        } else {
            badge.textContent = "LOW";
            badge.className = `${base} bg-emerald-50 text-emerald-700 border-emerald-200`;
            scoreText.className = "score-display font-black text-sm text-emerald-700";
        }
    };

    // ============================================================
    // 4. Wire up Live Score Calculation for One Row's Selectors
    // ============================================================
    const bindRowScoring = (row) => {
        const lSelect = row.querySelector(".likelihood-selector");
        const iSelect = row.querySelector(".impact-selector");
        const scoreText = row.querySelector(".score-display");
        const badge = row.querySelector(".ranking-badge");
        const scoreWrapper = scoreText?.closest(".score-container");

        if (!lSelect || !iSelect || !scoreText || !badge) return;

        const computeRowScore = () => {
            const L = parseInt(lSelect.value, 10);
            const I = parseInt(iSelect.value, 10);
            const score = L * I;

            scoreText.textContent = score;
            scoreWrapper?.setAttribute("data-score", score);
            applyRanking(badge, score, scoreText);
        };

        lSelect.addEventListener("change", computeRowScore);
        iSelect.addEventListener("change", computeRowScore);

        computeRowScore();
    };

    // ============================================================
    // 5. Row Builder — Create a Single Editable Table Row
    // ============================================================
    const buildDynamicRow = (entry, index) => {
        const tr = document.createElement("tr");
        tr.className = "audit-row border-b border-outline-variant/10 bg-white hover:bg-slate-50/50 transition-colors";

        const derivedRiskId = `RISK-${entry.serial || `GEN-${index + 1}`}`;
        const dynamicTitle = entry.title || entry.name || "Unnamed Audit Item Target";
        const entryCategory = entry.category || "IT";
        const entryOwner = entry.owner || "Unassigned Owner";
        const entryDept = entry.department || "Unassigned Dept";

        tr.innerHTML = `
            <td class="p-3 text-center">
                <input type="checkbox" name="rows[${index}][selected]" class="row-selector rounded text-primary focus:ring-primary w-4 h-4 cursor-pointer" checked>
            </td>
            <td class="p-3">
                <input type="text" name="rows[${index}][risk_id]" value="${derivedRiskId}" required
                    class="w-full text-xs font-bold text-slate-700 border border-outline-variant/40 rounded bg-surface px-2 py-1.5 focus:ring-1 focus:ring-primary outline-none">
            </td>
            <td class="p-3">
                <select name="rows[${index}][category]" required class="w-full rounded border border-outline-variant/40 bg-surface px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary">
                    <option value="IT" ${entryCategory === 'IT' ? 'selected' : ''}>IT</option>
                    <option value="Financial" ${entryCategory === 'Financial' ? 'selected' : ''}>Financial</option>
                    <option value="Operational" ${entryCategory === 'Operational' ? 'selected' : ''}>Operational</option>
                    <option value="Compliance" ${entryCategory === 'Compliance' ? 'selected' : ''}>Compliance</option>
                </select>
            </td>
            <td class="p-3">
                <input type="text" name="rows[${index}][owner]" value="${entryOwner}" required 
                    class="w-full text-xs border border-outline-variant/40 rounded bg-surface px-2 py-1.5 focus:ring-1 focus:ring-primary outline-none">
            </td>
            <td class="p-3">
                <input type="text" name="rows[${index}][department]" value="${entryDept}" required 
                    class="w-full text-xs border border-outline-variant/40 rounded bg-surface px-2 py-1.5 focus:ring-1 focus:ring-primary outline-none">
            </td>
            <td class="p-3">
                <input type="text" name="rows[${index}][title]" value="${dynamicTitle}" required
                    class="w-full text-xs font-semibold text-primary border border-outline-variant/40 rounded bg-surface px-2 py-1.5 focus:ring-1 focus:ring-primary outline-none">
            </td>
            <td class="p-3">
                <textarea name="rows[${index}][description]" rows="2" required placeholder="Vulnerability specs..."
                    class="w-full text-xs rounded border border-outline-variant/40 bg-surface px-2 py-1.5 outline-none resize-y">${entry.description || ''}</textarea>
            </td>
            <td class="p-3">
                <textarea name="rows[${index}][triggers]" rows="2" required placeholder="Triggers..."
                    class="w-full text-xs rounded border border-outline-variant/40 bg-surface px-2 py-1.5 outline-none resize-y">${entry.triggers || ''}</textarea>
            </td>
            <td class="p-3">
                <textarea name="rows[${index}][controls]" rows="2" required placeholder="Existing internal defenses..."
                    class="w-full text-xs rounded border border-outline-variant/40 bg-surface px-2 py-1.5 outline-none resize-y">${entry.controls || ''}</textarea>
            </td>
            <td class="p-3">
                <select name="rows[${index}][likelihood]" class="likelihood-selector w-full text-xs text-slate-700 rounded border border-outline-variant/40 bg-surface py-1.5 outline-none">
                    <option value="1">Low (1)</option>
                    <option value="2" selected>Mod (2)</option>
                    <option value="3">High (3)</option>
                </select>
            </td>
            <td class="p-3">
                <select name="rows[${index}][impact]" class="impact-selector w-full text-xs text-slate-700 rounded border border-outline-variant/40 bg-surface py-1.5 outline-none">
                    <option value="1">Low (1)</option>
                    <option value="2" selected>Mod (2)</option>
                    <option value="3">High (3)</option>
                </select>
            </td>
            <td class="p-3 text-center">
                <div class="score-container flex items-center justify-center gap-2" data-score="4">
                    <span class="score-display font-black text-sm text-amber-700">4</span>
                    <span class="ranking-badge text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 uppercase tracking-wide">MOD</span>
                </div>
            </td>
        `;

        container.appendChild(tr);
        bindRowScoring(tr);
    };

        // ============================================================
    // 6. Render Rows & Listeners Implementation
    // ============================================================
    const updateSelectionCount = () => {
        const selectedCount = container.querySelectorAll(".row-selector:checked").length;
        if (counterBadge) {
            counterBadge.textContent = `${selectedCount} Selected`;
        }
    };

    container.addEventListener("change", (e) => {
        if (e.target.classList.contains("row-selector")) {
            updateSelectionCount();
        }
    });

    if (selectedEntries) {
        container.innerHTML = ""; // Wipe default fallback placeholder rows
        selectedEntries.forEach((entry, index) => {
            buildDynamicRow(entry, index);
        });
    } else {
        // Wire up live scoring loop on whatever static rows already exist in markup
        document.querySelectorAll("#audit-rows-container tr").forEach((row) => {
            bindRowScoring(row);
        });

        if (container.querySelector("tr")) {
            const hint = document.createElement("div");
            hint.className = "mt-3 text-xs font-medium text-amber-600 flex items-center gap-1.5";
            hint.innerHTML = `
                <span class="material-symbols-outlined text-sm">info</span>
                Demo rows shown — no real audit entities were passed from the selection screen.
            `;
            container.closest(".overflow-x-auto")?.after(hint);
        }
    }

    // ============================================================
    // 7. Descending Score Sorter Realignment
    // ============================================================
    if (sortBtn) {
        sortBtn.addEventListener("click", () => {
            const rows = Array.from(container.querySelectorAll(".audit-row, tr.border-b"));
            if (rows.length === 0) return;

            rows.sort((rowA, rowB) => {
                const scoreA = parseInt(rowA.querySelector(".score-container")?.getAttribute("data-score"), 10) || 0;
                const scoreB = parseInt(rowB.querySelector(".score-container")?.getAttribute("data-score"), 10) || 0;
                return scoreB - scoreA; // Sort high to low
            });

            container.innerHTML = "";
            rows.forEach(row => container.appendChild(row));
        });
    }

       // ============================================================
    // 8. Final Submission Interceptor
    // ============================================================
    form?.addEventListener("submit", (e) => {
        e.preventDefault();

        const selectedRows = container.querySelectorAll(".row-selector:checked");
        if (selectedRows.length === 0) {
            alert("Please select at least one risk entry row before submitting configuration data streams!");
            return;
        }

        if (alertBanner) {
            alertBanner.classList.remove("hidden");
        }
        window.scrollTo({ top: 0, behavior: "smooth" });

        // Compile payload datasets array for downstream database targets
        const structuredPayload = Array.from(selectedRows).map((checkbox) => {
            const targetRow = checkbox.closest("tr");
            return {
                riskId: targetRow.querySelector('input[name*="[risk_id]"]')?.value,
                category: targetRow.querySelector('select[name*="[category]"]')?.value,
                owner: targetRow.querySelector('input[name*="[owner]"]')?.value,
                department: targetRow.querySelector('input[name*="[department]"]')?.value,
                title: targetRow.querySelector('input[name*="[title]"]')?.value,
                likelihood: targetRow.querySelector('.likelihood-selector')?.value,
                impact: targetRow.querySelector('.impact-selector')?.value,
                calculatedScore: targetRow.querySelector('.score-container')?.getAttribute('data-score')
            };
        });

        console.log("Proceeding to Audit Plan with payload:", structuredPayload);

        // 1. Persist payload dataset for the next page
        sessionStorage.setItem("riskAssessmentPayload", JSON.stringify(structuredPayload));

        // 2. Redirect to audit-plan.html
        window.location.href = "audit-plan.html";
    });

    updateSelectionCount();
});
