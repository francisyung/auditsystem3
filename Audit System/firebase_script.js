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

// Locate this block inside your firebase_script.js file and update it:
onAuthStateChanged(auth, async (user) => {
  if (user) {
    console.log("🛡️ Sentinel Auth: User logged into workspace:", user.email, user.uid);
    
    // Save email coordinate to local cache for lookups inside shared_store.js
    localStorage.setItem("sentinel_active_user_email", user.email);

    // =========================================================================
    // ACTIVATE SUPER MASTER MODE FLAG AUTOMATICALLY FOR TESTING CREDENTIALS
    // =========================================================================
    if (user.email.endsWith("@sentinel.test") || user.email === "admin@test.com") {
        localStorage.setItem("sentinel_super_master", "true");
        console.warn("⚠️ SECURITY NOTICE: Super Testing Master session bypass initialized. All field boundaries deactivated.");
    } else {
        localStorage.removeItem("sentinel_super_master");
    }
  } else {
    console.log("Sentinel Auth: Active user session terminated.");
    localStorage.removeItem("sentinel_active_user_email");
    localStorage.removeItem("sentinel_super_master");
  }
});


/**
 * Handles account creation while establishing the correct multi-tenant profile fields
 */
window.handleSignup = async function (event) {
  event.preventDefault();

  const btn = document.getElementById('signup-submit');
  const fullName = document.getElementById('full_name').value.trim();
  const email = document.getElementById('work_email').value.trim();
  const company = document.getElementById('company_name').value.trim();
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirm_password').value;
  const departmentId = document.getElementById('department_id').value;
  const chosenRole = document.getElementById('user_testing_role').value; // <--- CATCH CHOSEN ROLE
  const terms = document.getElementById('terms').checked;

  // ... [Keep your validation checks here] ...

  if (btn) btn.disabled = true;
  if (window.SentinelAuthUI) SentinelAuthUI.setLoading(btn, true);

  try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Save user profiles cleanly under the structural multi-tenant organizational folder
      const userDocRef = doc(db, "organizations", "demo_corporation_kra", "users", user.uid);
      await setDoc(userDocRef, {
          fullName: fullName,
          company: company,
          departmentId: departmentId,
          email: email,
          assignedRole: chosenRole, // <--- SAVES EXPLICIT WORKFLOW ROLE VALUE 
          createdAt: new Date(),
      });

      // Synchronize the current session instantly to make testing simple
      localStorage.setItem("sentinel_active_role", chosenRole);

      alert('Account registered successfully as ' + chosenRole.toUpperCase() + '!');
      window.location.href = "audit-universe.html";

  } catch (error) {
      console.error(error);
  } finally {
      if (btn) btn.disabled = false;
  }
};

/**
 * Sentinel Core Firebase Authentication Script Asset Module
 * PART 2 OF 2: CLIENT USER LOGINS, FIELD LOOKUPS & THEME SIGN-OFF SWITCHES
 */

// --- handleLogin function using Firebase Authentication ---
window.handleLogin = async function (event) {
    event.preventDefault();

    const btn = document.getElementById('login-submit');
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    if (!email || !password) {
        alert('Please enter both email and password.');
        return;
    }

    if (btn) btn.disabled = true;
    if (window.SentinelAuthUI) window.SentinelAuthUI.setLoading(btn, true);

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        console.log("🛡️ Master Session Initialized:", user.email, user.uid);
        alert('Login successful! Welcome to the testing master workspace canvas dashboard.');
        window.location.href = "audit-universe.html";

    } catch (error) {
        console.error("Error during login:", error.code, error.message);
        let errorMessage = "Login failed. Please check your credentials and try again.";
        if (error.code === 'auth/invalid-credential') {
            errorMessage = 'Invalid email or password. Please verify your entries.';
        }
        alert(errorMessage);
    } finally {
        if (btn) btn.disabled = false;
        if (window.SentinelAuthUI) window.SentinelAuthUI.setLoading(btn, false);
    }
};

// --- handleLogout function ---
window.handleLogout = async function () {
    try {
        await signOut(auth);
        console.log("User logged out successfully.");
        alert("You have been signed out from the testing master session.");
        window.location.href = "login.html";
    } catch (error) {
        console.error("Error during logout:", error.message);
        alert("Error logging out. Please try again.");
    }
};

// --- DOMContentLoaded listener to populate registration department select elements ---
document.addEventListener('DOMContentLoaded', async function () {
  var sel = document.getElementById('department_id');
  if (!sel) return; // Only run on signup pages containing this select component

  try {
      // Pull options down cleanly from your master organizations path collection
      const querySnapshot = await getDocs(collection(db, "organizations", "demo_corporation_kra", "departments"));
      const list = [];
      querySnapshot.forEach((doc) => {
          list.push({ id: doc.id, name: doc.data().name });
      });

      if (!list.length) {
          // Seeding fallback options implicitly if your Firestore cluster collections are empty on first boot
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
      console.error('Error fetching departments from Firestore, loading safety dropdown options:', e.message);
      sel.innerHTML = `
          <option value="">Select your department (Safety Mode)</option>
          <option value="IT_DEPT">ICT Department</option>
          <option value="FIN_DEPT">Finance & Accounts</option>
          <option value="OPS_DEPT">Operations Department</option>
      `;
  }
});

// Toggle password text entry visibility fields
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

// Theme toggle panel logic
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
