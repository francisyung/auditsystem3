/**
 * Sentinel Core Administrative User Management Controller Module
 * Handles system user directory lookups, role mutations, secure profile persistence,
 * account status overrides, and user registration approvals.
 */

import { auth, db } from "./firebase_script.js";
import { getFirestore, collection, getDocs, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";


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
// Local safety fallback helper to prevent out-of-order execution script crashes
const safeEscape = function(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
};

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
            tbody.innerHTML = `<tr><td colspan="7" class="p-4 text-center text-xs text-slate-400 italic">No registered user workspace accounts found in this organization.</td></tr>`;
            return;
        }

               // Render data matching metrics rows
        usersList.forEach((user, index) => {
            const tr = document.createElement("tr");
            tr.className = "border-b border-slate-200 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-900/40 align-middle text-xs transition-colors";
            
            const activeRole = user.assignedRole || "officer";
            const safeUid = safeEscape(user.uid);
            const safeName = safeEscape(user.fullName || "Unnamed User");
            const safeEmail = safeEscape(user.email || "—");
            
            // Set fallback operational defaults for status tracking fields
            const accountStatus = user.accountStatus || (user.isApproved ? "Active" : "Pending_Approval");
            const isApproved = user.isApproved === true;

            // Generate contextual color badges based on state variables
            let statusBadge = '';
            if (accountStatus === "Active") {
                statusBadge = `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">ACTIVE</span>`;
            } else if (accountStatus === "Disabled") {
                statusBadge = `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40">DISABLED</span>`;
            } else {
                statusBadge = `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40">PENDING APPROVAL</span>`;
            }

            // Build structural operational command buttons dynamically
            let actionControlsHtml = '';
            
            if (!isApproved) {
                actionControlsHtml += `
                    <button onclick="executeAdministrativeApproval('${safeUid}', '${safeName}', '${safeEmail}')" class="px-2 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded font-bold text-[10px] tracking-wide uppercase transition-all shadow-sm">
                        Approve
                    </button>
                `;
            } else {
                if (accountStatus === "Active") {
                    actionControlsHtml += `
                        <button onclick="executeAdministrativeStatusToggle('${safeUid}', 'Disabled', '${safeName}', '${safeEmail}')" class="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded font-bold text-[10px] tracking-wide uppercase transition-all shadow-sm">
                            Disable Account
                        </button>
                    `;
                } else {
                    actionControlsHtml += `
                        <button onclick="executeAdministrativeStatusToggle('${safeUid}', 'Active', '${safeName}', '${safeEmail}')" class="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-[10px] tracking-wide uppercase transition-all shadow-sm">
                            Enable Account
                        </button>
                    `;
                }
            }
            
            tr.innerHTML = `
                <td class="p-3 text-center font-mono font-bold text-slate-400 w-12 bg-slate-50/50 dark:bg-slate-900/10">${index + 1}</td>
                <td class="p-3 font-semibold text-on-surface dark:text-slate-200">
                    <div class="font-bold text-xs">${safeName}</div>
                    <div class="text-[10px] text-slate-400 font-mono mt-0.5">${safeUid}</div>
                </td>
                <td class="p-3 font-mono font-medium text-slate-500 dark:text-slate-400">${safeEmail}</td>
                <td class="p-2 w-52">
                    <select onchange="executeAdministrativeRoleMutation('${safeUid}', this.value, '${safeName}')"
                            class="w-full text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0d0e10] p-1.5 focus:outline-none focus:border-sky-500 cursor-pointer text-on-surface dark:text-slate-200">
                        <option value="officer" ${activeRole === 'officer' ? 'selected' : ''}>👤 Officer (System Driver)</option>
                        <option value="leadauditor" ${activeRole === 'leadauditor' ? 'selected' : ''}>📝 Lead Auditor (1st Gate)</option>
                        <option value="reviewer" ${activeRole === 'reviewer' ? 'selected' : ''}>🛡️ Reviewer (Audit Manager)</option>
                        <option value="approver" ${activeRole === 'approver' ? 'selected' : ''}>👑 Approver (Sign-Off Authority)</option>
                        <option value="management" ${activeRole === 'management' ? 'selected' : ''}>🏢 Management (Dept Owner)</option>
                        <option value="db_admin" ${activeRole === 'db_admin' ? 'selected' : ''}>⚙️ Database Admin (Logs Only)</option>
                    </select>
                </td>
                <td class="p-3 text-center">${statusBadge}</td>
                <td class="p-3 text-center w-36">${actionControlsHtml}</td>
                <td class="p-3 text-slate-400 font-mono text-[11px]">
                    ${user.createdAt ? new Date(user.createdAt.seconds * 1000).toLocaleDateString('en-KE') : "Legacy Member"}
                </td>
            `;
            tbody.appendChild(tr);
        });


    } catch (err) {
        console.error("💥 UI Layer Failure: Failed to stream account nodes list.", err);
        if (loaderContainer) loaderContainer.classList.add("hidden");
        tbody.innerHTML = `<tr><td colspan="7" class="p-4 text-center text-xs text-red-400">Failed to load user directories due to cloud access timeouts.</td></tr>`;
    }
}

/**
 * NEW: Executes Administrative Registration Approvals for brand-new users
 */
window.executeAdministrativeApproval = async function(targetUid, targetUserName, targetEmail) {
    if (!confirm(`CONFIRM MEMBERSHIP APPROVAL: Are you sure you want to authorize and activate the registration request for [${targetUserName}] (${targetEmail})?`)) {
        return;
    }

    try {
        const userDocRef = doc(db, "organizations", "demo_corporation_kra", "users", targetUid);
        
        await updateDoc(userDocRef, {
            isApproved: true,
            accountStatus: "Active"
        });

        console.log(`⚙️ Registration Authorized: Account UID [${targetUid}] successfully whitelisted by db_admin.`);

               // Append irreversible audit trail entry to streaming telemetry logs
        if (window.AuditStore) {
            await window.AuditStore.writeSystemAuditLog(
                `SECURITY OVERRIDE: DB_ADMIN FORMALLY APPROVED REGISTRATION AND ACTIVATED ACCOUNT FOR MEMBER [${targetUserName}] (EMAIL: ${targetEmail} | UID: ${targetUid})`,
                "db_admin"
            );
        }

        alert(`Account activated! Member [${targetUserName}] has been successfully approved into the organizational workspace.`);
        loadOrganizationalUsersDirectory();

    } catch (err) {
        console.error("⛔ Administrative Exception: Failed to modify profile registration fields.", err);
        alert("Critical Failure: Security permission denied by database rules.");
    }
};

/**
 * Disables or Enables accounts dynamically to block or restore access instantly
 */
window.executeAdministrativeStatusToggle = async function(targetUid, targetTargetStatus, targetUserName, targetEmail) {
    const actionPhrase = targetTargetStatus === "Active" ? "ENABLE and RESTORE ACCESSIBILITY" : "DISABLE and BLOCK ALL ACCESS";
    
    if (!confirm(`CRITICAL SYSTEM TOGGLE: Are you sure you want to ${actionPhrase} for user [${targetUserName}] (${targetEmail})?`)) {
        return;
    }

    try {
        const userDocRef = doc(db, "organizations", "demo_corporation_kra", "users", targetUid);
        
        // Update user state variables on database
        await updateDoc(userDocRef, {
            accountStatus: targetTargetStatus
        });

        console.log(`⚙️ Account Status Altered: Account UID [${targetUid}] explicitly modified to status [${targetTargetStatus}].`);

        // Log transaction history to your central logging engine
        if (window.AuditStore) {
            await window.AuditStore.writeSystemAuditLog(
                `SECURITY PROFILE OPERATION: DB_ADMIN EXPLICITLY MODIFIED ACCOUNT ACCESS LEVEL FOR MEMBER [${targetUserName}] (EMAIL: ${targetEmail}) TO TIER STATE [${targetTargetStatus.toUpperCase()}]`,
                "db_admin"
            );
            
            // Clean local brute-force memory lock variables if the account is being explicitly enabled
            if (targetTargetStatus === "Active") {
                localStorage.removeItem(`login_fails_${targetEmail}`);
                await window.AuditStore.writeSystemAuditLog(
                    `SECURITY PROFILE RESET: BRUTE-FORCE COUNTER CACHES PURGED BY DB_ADMIN FOR ACCOUNT KEY: [${targetEmail}]`,
                    "db_admin"
                );
            }
        }

        alert(`Account access profile adjusted successfully! Target user session parameters are now configured to: ${targetTargetStatus.toUpperCase()}.`);
        loadOrganizationalUsersDirectory();

    } catch (err) {
        console.error("⛔ Administrative Exception: Status alteration update rejected.", err);
        alert("Critical Failure: Security restriction rules prevented the alteration of user records.");
    }
};

/**
 * Executes a live database role reassignment mutation on a user document node
 */
window.executeAdministrativeRoleMutation = async function(targetUid, selectedNewRole, targetUserName) {
    if (!confirm(`CRITICAL IDENTITY WARNING: You are modifying the active clearance level for user [${targetUserName}]. Do you want to authorize this assignment change?`)) {
        loadOrganizationalUsersDirectory();
        return;
    }

    try {
        const userDocRef = doc(db, "organizations", "demo_corporation_kra", "users", targetUid);
        
        await updateDoc(userDocRef, {
            assignedRole: selectedNewRole
        });

        console.log(`⚙️ Administrative Rule Executed: Account UID [${targetUid}] context role switched to [${selectedNewRole}].`);

        if (window.AuditStore) {
            await window.AuditStore.writeSystemAuditLog(
                `ADMIN OPERATOR REASSIGNED ROLE CLEARANCE FOR MEMBER [${targetUserName}] (UID: ${targetUid}) TO TIER [${selectedNewRole.toUpperCase()}]`,
                "db_admin"
            );
        }

        alert(`Security clearance re-profiled successfully! Member [${targetUserName}] is now registered as [${selectedNewRole.toUpperCase()}].`);
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
