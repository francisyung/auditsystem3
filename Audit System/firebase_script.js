// firebase_script.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-analytics.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
import { getFirestore, collection, getDocs, doc, setDoc, getDoc, updateDoc, query, where, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDsHxFMMHy2qYsLaYjAUTqMeQKwC4zNDbQ",
  authDomain: "audit-system-76e00.firebaseapp.com",
  projectId: "audit-system-76e00",
  storageBucket: "audit-system-76e00.firebasestorage.app",
  messagingSenderId: "874863390026",
  appId: "1:874863390026:web:1d4783557663fb0468a5b3",
  measurementId: "G-EXNH41C2E0"
};




const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const auth = getAuth(app);
export const db = getFirestore(app);

export { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, getDoc, doc };

window.auth = auth;
window.db = db;
window.onAuthStateChanged = onAuthStateChanged;

// Helper to push security alerts to the central telemetry log stream [3]
async function pushSecurityTelemetryLog(message) {
  if (window.AuditStore && typeof window.AuditStore.writeSystemAuditLog === "function") {
    await window.AuditStore.writeSystemAuditLog(message, "SECURITY_GATEWAY");
  } else {
    console.log(`[TELEMETRY FALLBACK]: ${message}`);
  }
}

// =========================================================================
// 🛡️ SECURITY ASSURANCE UTILITIES: PASSWORD VALIDATION & INJECTION FILTERS
// =========================================================================

function verifyPasswordStrength(password) {
  // Enforces at least 8 characters, 1 uppercase, 1 lowercase, 1 digit, and 1 special symbol
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return regex.test(password);
}

function analyzeForSqlInjection(inputString) {
  if (!inputString) return false;
  // Inspects fields for malicious SQL tautologies, escape bounds, or structural code appending phrases
  const maliciousPatterns = [
    /(\%27)|(\')|(\-\-)|(\%23)|(#)/i,
    /(union|select|insert|update|delete|drop|alter|where|or\s+1\s*=\s*1)/i
  ];
  return maliciousPatterns.some(pattern => pattern.test(inputString));
}
// Helper: find user doc by email when UID doc is missing (old docs, manual docs, auto-ID docs)


function getLockedUntilMs(data) {
  const v = data?.lockedUntil;
  if (!v) return 0;
  if (typeof v.toMillis === "function") return v.toMillis();
  if (typeof v.seconds === "number") return v.seconds * 1000;
  if (v instanceof Date) return v.getTime();
  if (typeof v === "number") return v;
  return 0;
}

onAuthStateChanged(auth, async (user) => {
  const cleanPathName = window.location.pathname.toLowerCase();

  const isPublicPage =
    cleanPathName === "" ||
    cleanPathName === "/" ||
    cleanPathName.endsWith("login") ||
    cleanPathName.endsWith("login.html") ||
    cleanPathName.endsWith("signup") ||
    cleanPathName.endsWith("signup.html");

  if (user) {
    console.log("🛡️ Sentinel Auth: User logged into workspace:", user.email, user.uid);
    localStorage.setItem("sentinel_active_user_email", user.email);
    // FIX: do NOT clear login_fails_* here. handleLogin clears it only AFTER Firestore gate passes.
    // Clearing it here let a correct password instantly wipe a 3-fail lock.

    // NOTE: testing bypass REMOVED. Your old bypass let @sentinel.test / admin@test.com
    // skip Disabled/Locked/Pending checks entirely. Re-add only behind a dev flag if you must.

    // =========================================================================
    // 🛡️ CRITICAL REAL-TIME ACCOUNT STATUS & RESTRICTION MATRIX CHECK
    // =========================================================================
    try {
        let userDocRef = doc(db, "organizations", "demo_corporation_kra", "users", user.uid);
        let userDocSnap = await getDoc(userDocRef);
        let userData = null;

        // ---- SELF-HEAL: UID doc missing (your yung67443@gmail.com case) ----
        if (!userDocSnap.exists()) {
          const emailLower = (user.email || "").toLowerCase();
          console.warn("🔒 UID doc missing for", user.email, user.uid, "- trying email lookup...");
          const emailDoc = await findUserDocByEmail(emailLower);

          if (emailDoc) {
            console.warn(`UID mismatch! Auth UID [${user.uid}] but Firestore doc is [${emailDoc.id}]. Migrating to UID doc.`);
            const src = emailDoc.data();
            // Create/repair the correct UID-keyed doc so all future logins + admin writes hit one place
            await setDoc(userDocRef, {
              ...src,
              email: user.email,
              emailLower: emailLower,
              fullName: src.fullName || src.displayName || src.preferredName || user.email,
              assignedRole: src.assignedRole || "officer",
              // Preserve a real Disabled/Locked state if source had it, else default sensibly
              isApproved: src.isApproved !== undefined ? src.isApproved : true,
              accountStatus: src.accountStatus || (src.isApproved === false ? "Pending_Approval" : "Active"),
              failedAttempts: src.failedAttempts || 0,
              lockedUntil: src.lockedUntil || null,
            }, { merge: true });

            await pushSecurityTelemetryLog(`🔧 UID SELF-HEAL: Migrated Firestore profile for [${user.email}] from doc [${emailDoc.id}] to Auth UID [${user.uid}].`);

            userDocSnap = await getDoc(userDocRef);
          }

          if (!userDocSnap.exists()) {
            // Truly orphan Auth user with no profile anywhere: do NOT bypass — kick to login.
            // If you want open testing, change this to allow + redirect to universe.
            console.warn("🔒 Sandbox Mode: No profile found by UID or email, denying access.");
            await pushSecurityTelemetryLog(`⛔ ORPHAN SESSION BLOCKED: No Firestore profile for [${user.email}] UID [${user.uid}].`);
            alert("Access Restricted: No workspace profile found. Contact your administrator.");
            await signOut(auth);
            window.location.href = "login.html";
            return;
          }
        }

        userData = userDocSnap.data();
        const accountStatus = userData.accountStatus || (userData.isApproved ? "Active" : "Pending_Approval");
        const lockedUntilMs = getLockedUntilMs(userData);
        const isBruteLocked = accountStatus === "Locked" || (userData.failedAttempts || 0) >= 3 || (lockedUntilMs && lockedUntilMs > Date.now());

        if (accountStatus === "Disabled" || isBruteLocked) {
            await pushSecurityTelemetryLog(`🔒 SESSION TERMINATED: ${accountStatus === "Disabled" ? "Disabled" : "Locked"} account [${user.email}] kicked by auth guard (status=${accountStatus}, fails=${userData.failedAttempts || 0}).`);
            alert(accountStatus === "Disabled" ? "Access Suspended: Workspace account has been deactivated." : "Account Locked: Too many failed attempts. Contact your administrator.");
            await signOut(auth);
            window.location.href = "login.html";
            return;
        }

        if (accountStatus === "Pending_Approval" || userData.isApproved === false) {
            alert("Access Restricted: Awaiting administrative database sign-off.");
            await signOut(auth);
            window.location.href = "login.html";
            return;
        }

        if (userData.assignedRole) {
            localStorage.setItem("sentinel_active_role", userData.assignedRole);
        }

        if (isPublicPage) {
            window.location.href = "audit-universe.html";
            return;
        }
    } catch (err) {
        console.error("Gateway Validation Failure:", err);
    }

  } else {
    // 🚧 UNIVERSAL ROUTE WALL (DISABLED REDIRECTS FOR UNINTERRUPTED TESTING)
    console.log("Sentinel Auth: Active user session terminated.");

    // Completely cleared out window.location.href from this section!
    // This allows Firebase to calmly initialize without throwing an infinite kick-out loop.
    localStorage.removeItem("sentinel_active_user_email");
    localStorage.removeItem("sentinel_super_master");
    localStorage.removeItem("sentinel_active_role");
  }
});

// =========================================================================
// 👤 HIGH-HARDENING REGISTRATION GATEWAY HANDLER
// =========================================================================
window.handleSignup = async function (event) {
  event.preventDefault();

  const btn = document.getElementById('signup-submit');
  const fullName = document.getElementById('full_name').value.trim();
  const email = document.getElementById('work_email').value.trim();
  const company = document.getElementById('company_name').value.trim();
  const password = document.getElementById('password').value;
  const chosenRole = document.getElementById('user_testing_role').value;
  const departmentId = document.getElementById('department_id').value;

  // 1. INJECTION PATTERN SCREENING
  if (analyzeForSqlInjection(fullName) || analyzeForSqlInjection(email) || analyzeForSqlInjection(company)) {
    await pushSecurityTelemetryLog(`🚨 SQL INJECTION ATTEMPT DETECTED: Malicious characters rejected on signup fields for email: [${email || 'unknown'}].`);
    alert("Security Alert: Malicious character inputs detected and rejected by Sentinel Guard.");
    return;
  }

  // 2. STRENGTH REQUIREMENTS RULE ENFORCEMENT
  if (!verifyPasswordStrength(password)) {
    alert("Weak Password! Requirements: Minimum 8 characters, at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character.");
    return;
  }

  if (btn) btn.disabled = true;
  if (window.SentinelAuthUI) SentinelAuthUI.setLoading(btn, true);

  try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userDocRef = doc(db, "organizations", "demo_corporation_kra", "users", user.uid);
      await setDoc(userDocRef, {
          fullName: fullName,
          company: company,
          departmentId: departmentId,
          email: email,
          emailLower: email.toLowerCase(),
          assignedRole: chosenRole,
          createdAt: new Date(),
          // --- FIX: fields the admin panel + lock logic depend on ---
          isApproved: false,
          accountStatus: "Pending_Approval",
          failedAttempts: 0,
          lastLoginAt: null,
          lastFailedAt: null,
          lockedUntil: null,
      });

      localStorage.setItem("sentinel_active_role", chosenRole);
      
      await pushSecurityTelemetryLog(`👤 USER REGISTRATION SUCCESSFUL: New tenant created [${email}] assigned to role profile [${chosenRole.toUpperCase()}].`);
      alert('Account registered successfully as ' + chosenRole.toUpperCase() + '!');
      window.location.href = "audit-universe.html";

  } catch (error) {
      console.error(error);
      await pushSecurityTelemetryLog(`❌ USER REGISTRATION FAILED: Error event triggered during profile creation for [${email}]. Reason: ${error.message}`);
  } finally {
      if (btn) btn.disabled = false;
  }
};

// =========================================================================
// 🔑 CORE LOGIN GATEWAY WITH FLOOD-PROTECTION BRUTE FORCE SHIELDS
// =========================================================================
// =========================================================================
// 🔑 CORE LOGIN GATEWAY WITH FLOOD-PROTECTION BRUTE FORCE SHIELDS (FIXED)
// Real lock is enforced in Firestore (failedAttempts / accountStatus / lockedUntil).
// localStorage is only a UX helper, key is normalized to lowercase.
// =========================================================================
async function findUserDocByEmail(emailLower) {
  try {
    const q = query(
      collection(db, "organizations", "demo_corporation_kra", "users"),
      where("emailLower", "==", emailLower)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      // Fallback: older docs may not have emailLower, try plain email match
      return snap.docs[0];
    }
    const q2 = query(
      collection(db, "organizations", "demo_corporation_kra", "users"),
      where("email", "==", emailLower)
    );
    const snap2 = await getDocs(q2);
    // case-insensitive fallback scan
    let found = null;
    snap2.forEach((d) => {
      const data = d.data();
      if ((data.email || "").toLowerCase() === emailLower) found = d;
    });
    return found;
  } catch (e) {
    console.warn("findUserDocByEmail blocked by Firestore rules:", e?.message);
    return null;
  }
}

window.handleLogin = async function (event) {
    event.preventDefault();

    const btn = document.getElementById('login-submit');
    const emailRaw = document.getElementById('email').value.trim();
    const email = emailRaw.toLowerCase(); // FIX: normalize so Test@X vs test@x share one counter
    const password = document.getElementById('password').value;

    if (!email || !password) {
        alert('Please enter both email and password.');
        return;
    }

    // 1. INJECTION SCANNING
    if (analyzeForSqlInjection(emailRaw)) {
        await pushSecurityTelemetryLog(`🚨 SQL INJECTION DETECTED AT LOGIN GATE: String payload intercept processed for input entry: [${email}].`);
        alert("Security Alert: Injection parameters detected. Operation blocked.");
        return;
    }

    // 2a. UX pre-check (localStorage only — NOT security). Real check happens in Firestore after signIn.
    const failTrackerKey = `login_fails_${email}`;
    let activeFailCount = parseInt(localStorage.getItem(failTrackerKey) || "0", 10);

    if (activeFailCount >= 3) {
        // FIX: also consult Firestore before calling Auth, when rules allow it
        const preDoc = await findUserDocByEmail(email);
        if (preDoc) {
          const d = preDoc.data();
          const lockedUntil = d.lockedUntil?.toMillis ? d.lockedUntil.toMillis() : (d.lockedUntil?.seconds ? d.lockedUntil.seconds * 1000 : 0);
          if (d.accountStatus === "Disabled" || d.accountStatus === "Locked" || (d.failedAttempts || 0) >= 3 || (lockedUntil && lockedUntil > Date.now())) {
            await pushSecurityTelemetryLog(`🔒 ACCOUNT LOCKED (server-confirmed): blocked pre-auth attempt for: [${email}].`);
            alert("Account Temporarily Locked: Exceeded 3 failed login attempts or disabled by admin. Contact your Administrator.");
            return;
          }
          // If Firestore says the account was unlocked by admin, respect it and clear stale local block
          if ((d.failedAttempts || 0) < 3 && d.accountStatus === "Active") {
            localStorage.removeItem(failTrackerKey);
            activeFailCount = 0;
          } else {
            await pushSecurityTelemetryLog(`🔒 ACCOUNT LOCKED: Brute-force threshold breached for target user account: [${email}]. Input frozen.`);
            alert("Account Temporarily Locked: Exceeded 3 failed login attempts. Contact your Administrator.");
            return;
          }
        } else {
            await pushSecurityTelemetryLog(`🔒 ACCOUNT LOCKED (local): Brute-force threshold breached for target user account: [${email}]. Input frozen.`);
            alert("Account Temporarily Locked: Exceeded 3 failed login attempts. Contact your Administrator.");
            return;
        }
    }

    if (btn) btn.disabled = true;
    if (window.SentinelAuthUI) window.SentinelAuthUI.setLoading(btn, true);

    try {
        const userCredential = await signInWithEmailAndPassword(auth, emailRaw, password);
        const user = userCredential.user;

        // 2b. FIX — server-side gate AFTER Firebase Auth succeeds, BEFORE redirect:
        // Firebase Auth does NOT know about your Firestore accountStatus, so you must enforce it here.
        try {
          const userDocRef = doc(db, "organizations", "demo_corporation_kra", "users", user.uid);
          const snap = await getDoc(userDocRef);
          if (snap.exists()) {
            const ud = snap.data();
            const lockedUntilMs = ud.lockedUntil?.toMillis ? ud.lockedUntil.toMillis() : (ud.lockedUntil?.seconds ? ud.lockedUntil.seconds * 1000 : 0);
            const isLocked = ud.accountStatus === "Locked" || (ud.failedAttempts || 0) >= 3 || (lockedUntilMs && lockedUntilMs > Date.now());
            if (ud.accountStatus === "Disabled" || isLocked) {
              await pushSecurityTelemetryLog(`🔒 BLOCKED LOGIN ON DISABLED/LOCKED ACCOUNT: [${user.email}] signed in to Firebase but rejected by Firestore gate (status=${ud.accountStatus}, fails=${ud.failedAttempts || 0}).`);
              await signOut(auth);
              localStorage.setItem(failTrackerKey, "3");
              alert(ud.accountStatus === "Disabled"
                ? "Access Suspended: Workspace account has been deactivated. Contact your administrator."
                : "Account Temporarily Locked: Exceeded 3 failed login attempts. Contact your Administrator.");
              window.location.href = "login.html";
              return;
            }
            if (ud.accountStatus === "Pending_Approval" || ud.isApproved === false) {
              await pushSecurityTelemetryLog(`⛔ BLOCKED LOGIN PENDING APPROVAL: [${user.email}].`);
              await signOut(auth);
              alert("Access Restricted: Awaiting administrative database sign-off.");
              window.location.href = "login.html";
              return;
            }
            // Success: reset counters + record visible login activity for the admin panel
            await updateDoc(userDocRef, {
              failedAttempts: 0,
              lockedUntil: null,
              lastLoginAt: serverTimestamp(),
              lastLoginEmail: user.email,
            }).catch(() => {});
            localStorage.removeItem(failTrackerKey);
          }
        } catch (gateErr) {
          console.warn("Post-auth gate check failed (rules?):", gateErr?.message);
        }

        console.log("🛡️ Master Session Initialized:", user.email, user.uid);
        await pushSecurityTelemetryLog(`🔑 USER LOGIN SUCCESSFUL: Authenticated identity handshake completed for session: [${user.email}].`);

        alert('Login successful! Welcome to the testing master workspace canvas dashboard.');
        window.location.href = "audit-universe.html";

    } catch (error) {
        console.error("Error during login:", error.code, error.message);

        // Increment threat matrix indicators on auth failures
        activeFailCount += 1;
        localStorage.setItem(failTrackerKey, activeFailCount.toString());

        // FIX: mirror the failure into Firestore so the ADMIN PANEL can see it
        try {
          const fdoc = await findUserDocByEmail(email);
          if (fdoc) {
            const prev = fdoc.data().failedAttempts || 0;
            const next = prev + 1;
            const patch = { failedAttempts: next, lastFailedAt: serverTimestamp(), lastFailedEmail: email };
            if (next >= 3) {
              patch.accountStatus = "Locked";
              // lock for 30 minutes (adjust to taste; admin unlock sets it back to Active)
              patch.lockedUntil = new Date(Date.now() + 30 * 60 * 1000);
            }
            await updateDoc(fdoc.ref, patch).catch(() => {});
          }
        } catch (e) { console.warn("Failed to mirror fail-count to Firestore:", e?.message); }

        let errorMessage = "Login failed. Please check your credentials and try again.";

        if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-login-credentials') {
            errorMessage = `Invalid email or password. Warning: Attempt ${activeFailCount} of 3 before account freeze.`;

            if (activeFailCount >= 3) {
                await pushSecurityTelemetryLog(`🚨 BRUTE-FORCE ALARM: Account [${email}] has been flagged as LOCKED due to consecutive credential failures.`);
                errorMessage = "Account locked due to multiple incorrect password entries.";
            } else {
                await pushSecurityTelemetryLog(`⚠️ AUTHENTICATION FAILURE: Password error matching credentials for index [${email}]. Attempt count: ${activeFailCount}.`);
            }
        } else {
            await pushSecurityTelemetryLog(`❌ AUTHENTICATION ERROR: Network validation drop for [${email}]. Reference code: ${error.code}`);
        }

        alert(errorMessage);
    } finally {
        if (btn) btn.disabled = false;
        if (window.SentinelAuthUI) window.SentinelAuthUI.setLoading(btn, false);
    }
};

// =========================================================================
// LOGOUT CONTROL LAYER
// =========================================================================
// =========================================================================
// LOGOUT CONTROL LAYER
// =========================================================================
window.handleLogout = async function () {
    const fallbackEmail = localStorage.getItem("sentinel_active_user_email") || "unknown_user";
    try {
        await signOut(auth);
        await pushSecurityTelemetryLog(`👋 USER LOGOUT: Terminated active identity session token cleanly for user context: [${fallbackEmail}].`);
        alert("You have been signed out from the testing master session.");
        window.location.href = "login.html";
    } catch (error) {
        console.error("Error during logout:", error.message);
        alert("Error logging out. Please try again.");
    }
};

// =========================================================================
// 🏢 DOM CONTENT LOADED - MASTER DEPARTMENT DROPDOWN DATA SYNCRONIZER
// =========================================================================
document.addEventListener('DOMContentLoaded', async function () {
  var sel = document.getElementById('department_id');
  if (!sel) return; // Only execute on registration pages featuring this exact component ID

  try {
      // Securely pull valid organizational structural paths down from Firestore cloud collections
      const querySnapshot = await getDocs(collection(db, "organizations", "demo_corporation_kra", "departments"));
      const list = [];
      querySnapshot.forEach((doc) => {
          list.push({ id: doc.id, name: doc.data().name });
      });

      if (!list.length) {
          // Seeding immediate fallback configurations if Firestore departments cluster is currently unpopulated
          sel.innerHTML = `
              <option value="">Select your department</option>
              <option value="IT_DEPT">ICT Department</option>
              <option value="FIN_DEPT">Finance & Accounts</option>
              <option value="OPS_DEPT">Operations Department</option>
          `;
          return;
      }

      sel.innerHTML = '<option value="">Select your department</option>';
      list.forEach(function (d) {
          var opt = document.createElement('option');
          opt.value = d.id;
          opt.textContent = d.name;
          sel.appendChild(opt);
      });
  } catch (e) {
      console.error('Error fetching departments from Firestore, falling back to local Safety Mode dropdown options:', e.message);
      sel.innerHTML = `
          <option value="">Select your department (Safety Mode)</option>
          <option value="IT_DEPT">ICT Department</option>
          <option value="FIN_DEPT">Finance & Accounts</option>
          <option value="OPS_DEPT">Operations Department</option>
      `;
  }
});

// =========================================================================
// 👁️ UI UTILITIES — TEXT VISIBILITY FIELD TOGGLES
// =========================================================================
window.togglePassword = function (inputId, button) {
    const input = document.getElementById(inputId);
    const icon = button.querySelector('.material-symbols-outlined');

    if (input.type === 'password') {
        input.type = 'text';
        icon.textContent = 'visibility_off';
    } else {
        input.type = 'password';
        icon.textContent = 'visibility';
    }
};

// =========================================================================
// 🌓 UI UTILITIES — THEME TOGGLE ALIGNMENT PANELS
// =========================================================================
(function () {
  function syncIcon() {
    var icon = document.getElementById('guestThemeIcon');
    if (!icon) return;
    icon.textContent = document.documentElement.classList.contains('dark') ? 'light_mode' : 'dark_mode';
  }
  document.getElementById('guestThemeToggle')?.addEventListener('click', function () {
    if (window.SentinelTheme) SentinelTheme.toggle();
    syncIcon();
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', syncIcon);
  else syncIcon();
})();