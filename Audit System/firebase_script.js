// firebase_script.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-analytics.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
import { getFirestore, collection, getDocs, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

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

// =========================================================================
// 🔐 INTEGRATED AUTHENTICATION STATE TRACKER & SECURE CLEAN-ROUTE GUARD WALL
// =========================================================================
onAuthStateChanged(auth, async (user) => {
  // FIXED: Standardize path extraction to cleanly capture raw folders or explicit file names
  const cleanPathName = window.location.pathname.toLowerCase();
  
  // Evaluates clean server paths (/login) alongside explicit local filesystem files (/login.html)
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
    localStorage.removeItem(`login_fails_${user.email}`);

    // =========================================================================
    // 🛡️ CRITICAL REAL-TIME ACCOUNT STATUS & RESTRICTION MATRIX CHECK
    // =========================================================================
    try {
        const userDocRef = doc(db, "organizations", "demo_corporation_kra", "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            const accountStatus = userData.accountStatus || (userData.isApproved ? "Active" : "Pending_Approval");

            // 1. HARD SUSPENSION BLOCK
            if (accountStatus === "Disabled") {
                alert("Access Suspended: This user workspace account has been explicitly deactivated by an administrator.");
                await signOut(auth);
                window.location.href = "login.html";
                return;
            }

            // 2. NEW REGISTRATION WALL
            if (accountStatus === "Pending_Approval" || userData.isApproved === false) {
                alert("Access Restricted: Your registration is currently awaiting administrative sign-off from a Database Administrator.");
                await signOut(auth);
                window.location.href = "login.html";
                return;
            }

            // Sync user role dynamically to localStorage on success
            if (userData.assignedRole) {
                localStorage.setItem("sentinel_active_role", userData.assignedRole);
            }

            // 3. PUBLIC ESCAPE REDIRECT
            if (isPublicPage) {
                window.location.href = "audit-universe.html";
                return;
            }
        } else {
            console.warn("🔒 Identity mismatch: Profile record missing from tenant track registry.");
            await signOut(auth);
            window.location.href = "login.html";
            return;
        }
    } catch (err) {
        console.error("Gateway Validation Failure: Unable to verify account permissions layout.", err);
    }

    // ACTIVATE SUPER MASTER MODE FLAG AUTOMATICALLY FOR TESTING CREDENTIALS
    if (user.email.endsWith("@sentinel.test") || user.email === "admin@test.com") {
        localStorage.setItem("sentinel_super_master", "true");
        console.warn("⚠️ SECURITY NOTICE: Super Testing Master session bypass initialized.");
    } else {
        localStorage.removeItem("sentinel_super_master");
    }
  } else {
    console.log("Sentinel Auth: Active user session terminated.");
    localStorage.removeItem("sentinel_active_user_email");
    localStorage.removeItem("sentinel_super_master");
    localStorage.removeItem("sentinel_active_role");

    // =========================================================================
    // 🚧 UNIVERSAL ROUTE EXCLUSION WALL
    // =========================================================================
    if (!isPublicPage) {
        console.warn("🚨 Route Guard Intercept: Unauthorized traversal attempt blocked. Redirecting to entry gate...");
        window.location.href = "login.html";
    }
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
          assignedRole: chosenRole,
          createdAt: new Date(),
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
window.handleLogin = async function (event) {
    event.preventDefault();

    const btn = document.getElementById('login-submit');
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    if (!email || !password) {
        alert('Please enter both email and password.');
        return;
    }

    // 1. INJECTION SCANNING
    if (analyzeForSqlInjection(email)) {
        await pushSecurityTelemetryLog(`🚨 SQL INJECTION DETECTED AT LOGIN GATE: String payload intercept processed for input entry: [${email}].`);
        alert("Security Alert: Injection parameters detected. Operation blocked.");
        return;
    }

    // 2. HARD BRUTE-FORCE COUNTER EVALUATION
    const failTrackerKey = `login_fails_${email}`;
    let activeFailCount = parseInt(localStorage.getItem(failTrackerKey) || "0", 10);

    if (activeFailCount >= 3) {
        await pushSecurityTelemetryLog(`🔒 ACCOUNT LOCKED: Brute-force threshold breached for target user account: [${email}]. Input frozen.`);
        alert("Account Temporarily Locked: Exceeded 3 failed login attempts. Contact your Administrator.");
        return;
    }

    if (btn) btn.disabled = true;
    if (window.SentinelAuthUI) window.SentinelAuthUI.setLoading(btn, true);

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        console.log("🛡️ Master Session Initialized:", user.email, user.uid);
        await pushSecurityTelemetryLog(`🔑 USER LOGIN SUCCESSFUL: Authenticated identity handshake completed for session: [${user.email}].`);
        
        alert('Login successful! Welcome to the testing master workspace canvas dashboard.');
        window.location.href = "audit-universe.html";

    } catch (error) {
        console.error("Error during login:", error.code, error.message);
        
        // Increment threat matrix indicators on auth failures
        activeFailCount += 1;
        localStorage.setItem(failTrackerKey, activeFailCount.toString());

        let errorMessage = "Login failed. Please check your credentials and try again.";
        
        if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
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
