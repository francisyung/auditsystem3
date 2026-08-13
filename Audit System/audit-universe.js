document.addEventListener("DOMContentLoaded", () => {  
    // ============================================================  
    // 1. DOM Element Selectors  
    // ============================================================  
    const tableBody = document.getElementById("audit-table-body");  
    const emptyState = document.getElementById("empty-state");  
    const selectAllVisible = document.getElementById("select-all-visible");  
    const btnProceed = document.getElementById("btn-proceed");  
    const btnAddEntry = document.getElementById("btn-add-entry");  
    const btnClearFilters = document.getElementById("btn-clear-filters");  

    const filterSearch = document.getElementById("filter-search");  
    const filterAudited = document.getElementById("filter-audited");  
    const filterOwner = document.getElementById("filter-owner");  
    const filterRef = document.getElementById("filter-ref");  

    const resultCount = document.getElementById("result-count");  
    const totalCount = document.getElementById("total-count");  
    const selectedCount = document.getElementById("selected-count");  

    // Exit early if the table body is missing (wrong page)  
    if (!tableBody) return;  

    // ============================================================  
    // 2. Dummy Data (seeded in-memory — replaced by Firebase later)  
    // ============================================================  
    const owners = [  
        "Director IT", "Head of Network Engineering", "Head of HR",  
        "CFO", "Head of Procurement", "Head of Operations",  
        "Chief Risk Officer", "Head of Compliance", "Data Protection Officer"  
    ];  

    const areas = [  
        "Core Banking Infrastructure", "Retail Banking Channels", "Corporate Lending Platform",  
        "HR Payroll System", "Supplier Procurement Process", "Network Security Operations",  
        "Disaster Recovery Framework", "Regulatory Reporting", "Customer Data Privacy",  
        "Treasury and Liquidity Management", "Internal Fraud Detection", "Third-Party Vendor Risk",  
        "Mobile Banking Application", "Trade Finance Operations", "Financial Statement Close",  
        "Access Management / IAM", "IT Change Management", "Business Continuity Planning",  
        "Fixed Asset Management", "Budget & Expense Control", "Email & Collaboration Security",  
        "Payment Gateways & Switches", "AML / KYC Compliance", "Physical Branch Security",  
        "Cloud Infrastructure & Hosting"  
    ];  

    // Generate 100 dummy audit entries  
    const dummyData = [];  
    for (let i = 1; i <= 100; i++) {  
        const audited = i % 3 !== 0; // ~2/3 marked as "previously audited"  
        const refCount = audited ? (i % 3) + 1 : 0;  

        const references = [];  
        for (let r = 1; r <= refCount; r++) {  
            references.push(`IA-202${r}-REF-${String(i).padStart(2, "0")}`);  
        }  

        dummyData.push({  
            serial: `AU-2026-${String(i).padStart(3, "0")}`,  
            area: areas[(i - 1) % areas.length],  
            owner: owners[(i - 1) % owners.length],  
            audited: audited,  
            references: references,  
            remarks: audited  
                ? "Previously assessed; follow-up observations pending."  
                : "Newly registered focus area; first-time assessment required."  
        });  
    }  

    // Master copy of all entries (filters work on this)  
    let allEntries = [...dummyData];  
    // Currently selected serials  
    let selectedSerials = new Set();  

        // ============================================================  
    // 3. State & Rendering Helpers  
    // ============================================================  
    const getFilteredEntries = () => {  
        const searchTerm = filterSearch.value.trim().toLowerCase();  
        const auditedFilter = filterAudited.value;  
        const ownerFilter = filterOwner.value;  
        const refTerm = filterRef.value.trim().toLowerCase();  

        return allEntries.filter((entry) => {  
            // Search: match serial number OR area name  
            if (searchTerm) {  
                const matchesSearch =  
                    entry.serial.toLowerCase().includes(searchTerm) ||  
                    entry.area.toLowerCase().includes(searchTerm);  
                if (!matchesSearch) return false;  
            }  

            // Audited before: All / Yes / No  
            if (auditedFilter === "yes" && !entry.audited) return false;  
            if (auditedFilter === "no" && entry.audited) return false;  

            // Process owner filter  
            if (ownerFilter !== "all" && entry.owner !== ownerFilter) return false;  

            // Reference number filter  
            if (refTerm) {  
                const matchesRef = entry.references.some((ref) =>  
                    ref.toLowerCase().includes(refTerm)  
                );  
                if (!matchesRef) return false;  
            }  

            return true;  
        });  
    };  

    // Escape HTML to prevent injection in rendered cells  
    const escapeHtml = (value) =>  
        value.replace(/[&<>"']/g, (char) => ({  
            "&": "&amp;",  
            "<": "&lt;",  
            ">": "&gt;",  
            '"': "&quot;",  
            "'": "&#39;",  
        }[char]));  

    const renderTable = (entries) => {  
        tableBody.innerHTML = "";  

        // Toggle empty state  
        if (entries.length === 0) {  
            emptyState?.classList.remove("hidden");  
            emptyState?.classList.add("flex");  
        } else {  
            emptyState?.classList.add("hidden");  
            emptyState?.classList.remove("flex");  
        }  

        // Build rows  
        const fragment = document.createDocumentFragment();  
        entries.forEach((entry) => {  
            const tr = document.createElement("tr");  
            tr.classList.add("hover:bg-surface-container-low", "transition-colors");  

            const isChecked = selectedSerials.has(entry.serial);  

            const auditedBadge = entry.audited  
                ? `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">Yes</span>`  
                : `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">No</span>`;  

            const refsHtml = entry.references.length  
                ? escapeHtml(entry.references.join(", "))  
                : `<span class="text-on-surface-variant">—</span>`;  

            tr.innerHTML = `  
                <td class="px-4 py-3 text-center">  
                    <input type="checkbox" class="row-checkbox text-primary focus:ring-primary border-outline-variant rounded"  
                           value="${escapeHtml(entry.serial)}" ${isChecked ? "checked" : ""}>  
                </td>  
                <td class="px-4 py-3 font-semibold text-primary whitespace-nowrap">${escapeHtml(entry.serial)}</td>  
                <td class="px-4 py-3">${escapeHtml(entry.area)}</td>  
                <td class="px-4 py-3">${escapeHtml(entry.owner)}</td>  
                <td class="px-4 py-3">${auditedBadge}</td>  
                <td class="px-4 py-3">${refsHtml}</td>  
                <td class="px-4 py-3 text-on-surface-variant">${escapeHtml(entry.remarks)}</td>  
            `;  

            fragment.appendChild(tr);  
        });  

        tableBody.appendChild(fragment);  

        // Update counts + select-all checkbox state  
        resultCount.textContent = entries.length;  
        syncSelectAllState(entries);  
        syncSelectedCount();  
    };  

       // ============================================================  
    // 4. Selection Logic  
    // ============================================================  
    const syncSelectedCount = () => {  
        selectedCount.textContent = selectedSerials.size;  
        btnProceed.disabled = selectedSerials.size === 0;  
    };  

    // Sync the "select all visible" checkbox based on current rows  
    const syncSelectAllState = (entries) => {  
        if (!selectAllVisible || entries.length === 0) {  
            if (selectAllVisible) selectAllVisible.checked = false;  
            return;  
        }  

        const visibleSerials = entries.map((e) => e.serial);  
        const allVisibleSelected = visibleSerials.every((s) =>  
            selectedSerials.has(s)  
        );  
        const someVisibleSelected = visibleSerials.some((s) =>  
            selectedSerials.has(s)  
        );  

        selectAllVisible.checked = allVisibleSelected;  
        selectAllVisible.indeterminate = someVisibleSelected && !allVisibleSelected;  
    };  

    // Toggle selection for a given serial (and re-render to refresh row states)  
    const toggleSelection = (serial, isChecked) => {  
        if (isChecked) {  
            selectedSerials.add(serial);  
        } else {  
            selectedSerials.delete(serial);  
        }  
        syncSelectedCount();  
    };  

    // ============================================================  
    // 5. Filtering Trigger  
    // ============================================================  
    const applyFilters = () => {  
        const filtered = getFilteredEntries();  
        renderTable(filtered);  
    };  

    // ============================================================  
    // 6. Populate Owner Filter Options from Data  
    // ============================================================  
    const populateOwnerFilter = () => {  
        const uniqueOwners = [...new Set(allEntries.map((e) => e.owner))].sort();  
        filterOwner.innerHTML = '<option value="all">All Owners</option>';  
        uniqueOwners.forEach((owner) => {  
            const option = document.createElement("option");  
            option.value = owner;  
            option.textContent = owner;  
            filterOwner.appendChild(option);  
        });  
    };  

    // ============================================================  
    // 7. Event Listeners  
    // ============================================================  

    // Live filtering on any input/change  
    filterSearch?.addEventListener("input", applyFilters);  
    filterAudited?.addEventListener("change", applyFilters);  
    filterOwner?.addEventListener("change", applyFilters);  
    filterRef?.addEventListener("input", applyFilters);  

    // Clear all filters  
    btnClearFilters?.addEventListener("click", () => {  
        filterSearch.value = "";  
        filterAudited.value = "all";  
        filterOwner.value = "all";  
        filterRef.value = "";  
        applyFilters();  
    });  

    // Row checkbox delegation (table body is re-rendered often)  
    tableBody.addEventListener("change", (event) => {  
        const checkbox = event.target;  
        if (checkbox.classList.contains("row-checkbox")) {  
            toggleSelection(checkbox.value, checkbox.checked);  
        }  
    });  

    // Select-all-visible toggle  
    selectAllVisible?.addEventListener("change", () => {  
        const filtered = getFilteredEntries();  
        const visibleSerials = filtered.map((e) => e.serial);  

        if (selectAllVisible.checked) {  
            visibleSerials.forEach((s) => selectedSerials.add(s));  
        } else {  
            visibleSerials.forEach((s) => selectedSerials.delete(s));  
        }  

        // Re-render so checkboxes reflect updated state  
        renderTable(filtered);  
    });  

    // ============================================================  
    // 8. Add New Entry Affordance (illusion — not persisted yet)  
    // ============================================================  
    btnAddEntry?.addEventListener("click", () => {  
        // Build an in-memory serial for the new entry  
        const nextNumber = allEntries.length + 1;  
        const newSerial = `AU-2026-${String(nextNumber).padStart(3, "0")}`;  
        const newEntry = {  
            serial: newSerial,  
            area: "Unassigned / Draft Area",  
            owner: "Unassigned",  
            audited: false,  
            references: [],  
            remarks: "Newly added draft entry (not yet persisted).",  
        };  

        allEntries.unshift(newEntry);  
        populateOwnerFilter();  
        applyFilters();  

               // Briefly flash a confirmation
        if (btnAddEntry) {
            const originalHTML = btnAddEntry.innerHTML;
            btnAddEntry.innerHTML =
                '<span class="material-symbols-outlined text-sm">check</span> Entry Added (draft)';

            // Restore original button label after a short delay
            setTimeout(() => {
                btnAddEntry.innerHTML = originalHTML;
            }, 2000);
        }
    });

    // ============================================================
    // 9. Proceed to Risk Assessment (placeholder — wired later)
    // ============================================================
   btnProceed?.addEventListener("click", () => {
    const selectedSerialsArray = [...selectedSerials];

    // Nothing selected — should not happen (button is disabled), but guard anyway
    if (selectedSerialsArray.length === 0) {
        return;
    }

    // Construct payload with the selected entries for the next page / Firebase
    const selectedEntries = allEntries.filter((e) =>
        selectedSerialsArray.includes(e.serial) // Fixed: using selectedSerialsArray for checking
    );

    console.info("Proceeding to Risk Assessment with:", selectedEntries);

    // 1. Save data so the next page can read it
    sessionStorage.setItem("selectedAudits", JSON.stringify(selectedEntries));

    // 2. Redirect to the risk assessment page
    window.location.href = "risk-assessment.html";
});


    // ============================================================
    // 10. Initialization
    // ============================================================
    const init = () => {
        totalCount.textContent = allEntries.length;
        populateOwnerFilter();
        applyFilters();
        syncSelectedCount();
    };

    init();
});