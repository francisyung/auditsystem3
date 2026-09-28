/**
 * Sentinel Core Administrative User Management Controller Module
 * Handles system user directory lookups, role mutations, and secure profile persistence.
 * PART 1 OF 2: MANAGEMENT INTERFACE INITIALIZATIONS & SECURITY ACCESS SHIELDS
 */

import { auth, db } from "./firebase_script.js";
import { collection, getDocs, doc, updateDoc } from "https://gstatic.com";

document.addEventListener("DOMContentLoaded", () => {
    if (window.Theme) window.Theme.init();
    
    // SECURE ENTRY GATE: Verify that the current user has the correct clearance level to view this module
    const currentActiveRole = localStorage.getItem("sentinel_active_role") || "officer";
    if (currentActiveRole !== "db_admin") {
        console.error("⛔ Security Access Exception: Unauthorized path traversal intercepted. Directing to universe.");
        alert("Access Denied: The User Management Console is reserved exclusively for the Database Admin (db_admin) role.");
        window.location.href = "audit-universe.html";
        return;
    }

    // Initialize data streaming layer
    loadOrganizationalUsersDirectory();
});

/**
 * Queries the multi-tenant users subcollection to build the administration grid workspace
 */
async function loadOrganizationalUsersDirectory() {
    const tbody = document.getElementById("tbl-users-management-body");
    const loaderContainer = document.getElementById("lbl-users-loading");
    
    if (!tbody) return;
    tbody.innerHTML = "";
    if (loaderContainer) loaderContainer.classList.remove("hidden");

    try {
        // Query users directly from the isolated tenant directory track path
        const usersSnapshot = await getDocs(collection(db, "organizations", "demo_corporation_kra", "users"));
        const usersList = [];
        
        usersSnapshot.forEach((docSnap) => {
            usersList.push({ uid: docSnap.id, ...docSnap.data() });
        });

        if (loaderContainer) loaderContainer.classList.add("hidden");

        if (usersList.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-xs text-slate-400 italic">No registered user workspace accounts found in this organization.</td></tr>`;
            return;
        }

        // Render data matching metrics rows
        usersList.forEach((user, index) => {
            const tr = document.createElement("tr");
            tr.className = "border-b border-slate-200 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-900/40 align-middle text-xs transition-colors";
            
            const activeRole = user.assignedRole || "officer";
            const safeUid = window.escapeAttr(user.uid);
            
            tr.innerHTML = `
                <!-- 1. Row Index -->
                <td class="p-3 text-center font-mono font-bold text-slate-400 w-12 bg-slate-50/50 dark:bg-slate-900/10">${index + 1}</td>
                
                
                <td class="p-3 font-semibold text-on-surface dark:text-slate-200">
                    <div class="font-bold text-xs">${window.escapeAttr(user.fullName || "Unnamed User")}</div>
                    <div class="text-[10px] text-slate-400 font-mono mt-0.5">${safeUid}</div>
                </td>
                
                <!-- 3. Corporate Email Mappings -->
                <td class="p-3 font-mono font-medium text-slate-500 dark:text-slate-400">${window.escapeAttr(user.email || "—")}</td>
                
                <!-- 4. Assigned Security Clearance Profile Tier -->
                <td class="p-2 w-52">
                    <select onchange="executeAdministrativeRoleMutation('${safeUid}', this.value, '${window.escapeAttr(user.fullName)}')"
                            class="w-full text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0d0e10] p-1.5 focus:outline-none focus:border-sky-500 cursor-pointer text-on-surface dark:text-slate-200">
                        <option value="officer" ${activeRole === 'officer' ? 'selected' : ''}>👤 Officer (System Driver)</option>
                        <option value="leadauditor" ${activeRole === 'leadauditor' ? 'selected' : ''}>📝 Lead Auditor (1st Gate)</option>
                        <option value="reviewer" ${activeRole === 'reviewer' ? 'selected' : ''}>🛡️ Reviewer (Audit Manager)</option>
                        <option value="approver" ${activeRole === 'approver' ? 'selected' : ''}>👑 Approver (Sign-Off Authority)</option>
                        <option value="management" ${activeRole === 'management' ? 'selected' : ''}>🏢 Management (Dept Owner)</option>
                        <option value="db_admin" ${activeRole === 'db_admin' ? 'selected' : ''}>⚙️ Database Admin (Logs Only)</option>
                    </select>
                </td>
                
                <!-- 5. Metadata Creation Timestamps -->
                <td class="p-3 text-slate-400 font-mono text-[11px]">
                    ${user.createdAt ? new Date(user.createdAt.seconds * 1000).toLocaleDateString('en-KE') : "Legacy Member"}
                </td>
            `;
            tbody.appendChild(tr);
        });

    } catch (err) {
        console.error("💥 UI Layer Failure: Failed to stream account nodes list.", err);
        if (loaderContainer) loaderContainer.classList.add("hidden");
        tbody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-xs text-red-400">Failed to load user directories due to cloud access timeouts.</td></tr>`;
    }
}
/**
 * Sentinel Core Administrative User Management Controller Module
 * PART 2 OF 2: DATABASE MUTATOR EXECUTORS & APPEND-ONLY TELEMETRY INTEGRATIONS
 */

/**
 * Executes a live database role reassignment mutation on a user document node
 */
window.executeAdministrativeRoleMutation = async function(targetUid, selectedNewRole, targetUserName) {
    if (!confirm(`CRITICAL IDENTITY WARNING: You are modifying the active clearance level for user [${targetUserName}]. Do you want to authorize this assignment change?`)) {
        // Force reload workspace list from database to discard uncommitted change adjustments inside select drop elements
        loadOrganizationalUsersDirectory();
        return;
    }

    try {
        const userDocRef = doc(db, "organizations", "demo_corporation_kra", "users", targetUid);
        
        // 1. Commit the new clearance identity tag downstream directly to the user profile
        await updateDoc(userDocRef, {
            assignedRole: selectedNewRole
        });

        console.log(`⚙️ Administrative Rule Executed: Account UID [${targetUid}] context role switched to [${selectedNewRole}].`);

        // 2. Append an irreversible transactional tracking record into your immutable logging collection via window.AuditStore
        if (window.AuditStore) {
            await window.AuditStore.writeSystemAuditLog(
                `ADMIN OPERATOR REASSIGNED ROLE CLEARANCE FOR MEMBER [${targetUserName}] (UID: ${targetUid}) TO TIER [${selectedNewRole.toUpperCase()}]`,
                "db_admin"
            );
        }

        alert(`Security clearance re-profiled successfully! Member [${targetUserName}] is now registered as [${selectedNewRole.toUpperCase()}].`);
        
        // Refresh the list view layout display
        loadOrganizationalUsersDirectory();

    } catch (err) {
        console.error("⛔ Administrative Exception: Failed to modify data-at-rest profile node parameters.", err);
        alert("Critical Failure: Security permission denied by database rules. Verification rule failed to update user.");
        loadOrganizationalUsersDirectory();
    }
};

window.routeBackToDashboardUniverse = function() {
    window.location.href = "audit-universe.html";
};
