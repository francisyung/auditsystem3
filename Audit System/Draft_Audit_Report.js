document.addEventListener("DOMContentLoaded", () => {
    // DOM Elements
    const btnAddStep = document.getElementById("btn-add-step");
    const stepsTbody = document.getElementById("audit-steps-tbody");
    const programForm = document.getElementById("audit-program-form");
    const formAlert = document.getElementById("form-alert");

    // Add a new row to the table
    const appendNewRow = () => {
        const row = document.createElement("tr");
        row.className = "transition-colors hover:bg-surface/30";
        
        row.innerHTML = `
            <td class="p-2">
                <input type="text" name="step_area[]" placeholder="Sub-focus area..." required class="w-full text-xs rounded border-outline-variant focus:border-primary focus:ring-0 p-1.5 bg-surface">
            </td>
            <td class="p-2">
                <input type="text" name="step_protocol[]" placeholder="Execution testing procedure..." required class="w-full text-xs rounded border-outline-variant focus:border-primary focus:ring-0 p-1.5 bg-surface">
            </td>
            <td class="p-2">
                <select name="step_method[]" required class="w-full text-xs rounded border-outline-variant focus:border-primary focus:ring-0 p-1.5 bg-surface">
                    <option value="Inspection">Inspection</option>
                    <option value="Observation">Observation</option>
                    <option value="Inquiry">Inquiry</option>
                    <option value="Analytical Procedures">Analytical</option>
                    <option value="Reperformance">Reperformance</option>
                </select>
            </td>
            <td class="p-2">
                <input type="text" name="step_wpref[]" placeholder="WP-Ref" required class="w-full text-xs rounded border-outline-variant focus:border-primary focus:ring-0 p-1.5 bg-surface">
            </td>
            <td class="p-2">
                <input type="text" name="step_notes[]" placeholder="Observations noted..." class="w-full text-xs rounded border-outline-variant focus:border-primary focus:ring-0 p-1.5 bg-surface">
            </td>
            <td class="p-2">
                <select name="step_status[]" required class="w-full text-xs font-bold rounded border-outline-variant focus:border-primary focus:ring-0 p-1.5 bg-surface">
                    <option value="Pending" class="text-slate-600">Pending</option>
                    <option value="In Progress" class="text-blue-600">In Progress</option>
                    <option value="Completed" class="text-emerald-600">Completed</option>
                    <option value="Exception Raised" class="text-rose-600">Exception Raised</option>
                </select>
            </td>
            <td class="p-2 text-center">
                <button type="button" class="btn-delete-row text-error hover:text-rose-800 opacity-60 hover:opacity-100 transition-opacity">
                    <span class="material-symbols-outlined text-base">delete</span>
                </button>
            </td>
        `;

        // Bind delete action to the new row
        row.querySelector(".btn-delete-row").addEventListener("click", () => {
            row.remove();
            updateDeleteButtonsVisibility();
        });

        stepsTbody.appendChild(row);
        updateDeleteButtonsVisibility();
    };

    // Hide delete buttons if only one row remains
    const updateDeleteButtonsVisibility = () => {
        const rows = stepsTbody.querySelectorAll("tr");
        rows.forEach(row => {
            const deleteBtn = row.querySelector(".btn-delete-row");
            if (deleteBtn) {
                if (rows.length <= 1) {
                    deleteBtn.classList.add("hidden");
                } else {
                    deleteBtn.classList.remove("hidden");
                }
            }
        });
    };

    // Add button click listener
    btnAddStep.addEventListener("click", appendNewRow);

    // Initial setup for existing row delete buttons
    stepsTbody.querySelectorAll(".btn-delete-row").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.currentTarget.closest("tr").remove();
            updateDeleteButtonsVisibility();
        });
    });

    // Form Submission Handling
    programForm.addEventListener("submit", (e) => {
        e.preventDefault();
        
        // Show success alert and scroll to top
        formAlert.classList.remove("hidden");
        window.scrollTo({ top: 0, behavior: "smooth" });

        // Simulate API save delay (3 seconds)
        setTimeout(() => {
            programForm.reset();
            
            // Keep only the first row and clear out the rest
            const rows = stepsTbody.querySelectorAll("tr");
            rows.forEach((row, index) => {
                if (index > 0) row.remove();
            });

            updateDeleteButtonsVisibility();
            formAlert.classList.add("hidden");
        }, 3000);
    });

    // Run initial visibility check on load
    updateDeleteButtonsVisibility();
});