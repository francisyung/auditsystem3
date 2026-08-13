document.addEventListener("DOMContentLoaded", () => {
    // 1. DOM Element Selectors
    const form = document.getElementById("audit-plan-form");
    const alertBanner = document.getElementById("form-alert");
    const container = document.getElementById("audit-plan-rows-container");
    const totalDisplay = document.getElementById("running-total-budget");

    // Exit early if essential layout tracking indicators do not exist
    if (!container || !totalDisplay) return;

    // 2. State & Format Configuration (Using localized en-KE KES parameters)
    const formatToCurrencyKsh = (numericValue) => {
        return new Intl.NumberFormat("en-KE", {
            style: "currency",
            currency: "KES"
        }).format(numericValue);
    };

    // 3. Multi-Row Dynamic Cumulative Budget Summation Loop
    const calculateCumulativeBudgetMatrix = () => {
        let cumulativeTotalSum = 0;
        
        // Query all inline spreadsheet line-item budget input allocations
        const activeBudgetInputs = container.querySelectorAll(".budget-row-input");
        
        activeBudgetInputs.forEach((inputField) => {
            const numericValue = parseFloat(inputField.value) || 0;
            cumulativeTotalSum += numericValue;
        });

        totalDisplay.textContent = formatToCurrencyKsh(cumulativeTotalSum);
    };

    // 4. Delegated Row Event Listeners Interceptor
    container.addEventListener("input", (e) => {
        // Recalculate anytime any line-item budget changes inside any row
        if (e.target && e.target.classList.contains("budget-row-input")) {
            calculateCumulativeBudgetMatrix();
        }
    });

    container.addEventListener("change", (e) => {
        // Enforce localized structural timeline bounds row-by-row
        if (e.target && e.target.name && e.target.name.includes("[start_time]")) {
            const tr = e.target.closest("tr");
            const endInput = tr ? tr.querySelector('input[name*="[end_time]"]') : null;
            
            if (endInput && e.target.value) {
                endInput.min = e.target.value;
                // Wipe data selection instantly if it violates retrospective rules
                if (endInput.value && endInput.value < e.target.value) {
                    endInput.value = ""; 
                }
            }
        }
    });

    // Initial load-time valuation adjustment to sync existing placeholders
    calculateCumulativeBudgetMatrix();

    // 5. Form Submission Handling
    if (form) {
        form.addEventListener("submit", (e) => {
            e.preventDefault();

            // Display success alert banner and scroll layout viewport up smoothly
            alertBanner?.classList.remove("hidden");
            window.scrollTo({ top: 0, behavior: "smooth" });

            // Redirect to audit-report.html after a brief delay so the user sees the success banner
            setTimeout(() => {
                window.location.href = "audit-report.html";
            }, 1000); 
        });

        // Ensure resetting the form updates the banner back to KES 0.00
        form.addEventListener("reset", () => {
            setTimeout(calculateCumulativeBudgetMatrix, 0);
        });
    }

});
