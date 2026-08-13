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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Get Firebase Authentication and Firestore instances AND EXPORT THEM
export const auth = getAuth(app);
export const db = getFirestore(app);

// Export other functions if you need them directly in other modules
export { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, getDoc, doc }; // Added 'doc' here

// Make auth and db globally accessible (optional, if you're fully committed to module imports, you can remove these)
window.auth = auth;
window.db = db;
window.onAuthStateChanged = onAuthStateChanged;
// --- Firebase Authentication State Change Listener ---
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("User is signed in:", user.email, user.uid);
    // You can redirect to a dashboard or update UI here based on auth state
    // For example, if on login.html and user is logged in, redirect to dashboard
    // if (window.location.pathname.endsWith('login.html')) {
    //     window.location.href = '/dashboard.html'; // Or wherever your main app page is
    // }
  } else {
    console.log("User is signed out.");
    // If on a protected page and user is signed out, redirect to login
    // if (!window.location.pathname.endsWith('login.html') && !window.location.pathname.endsWith('signup.html')) {
    //     window.location.href = '/login.html';
    // }
  }
});

// --- handleSignup function using Firebase Authentication ---
// Make handleSignup globally accessible by attaching it to the window object
window.handleSignup = async function (event) {
  event.preventDefault();

  const btn = document.getElementById('signup-submit');
  const fullName = document.getElementById('full_name').value.trim();
  const email = document.getElementById('work_email').value.trim();
  const company = document.getElementById('company_name').value.trim();
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirm_password').value;
  const departmentId = document.getElementById('department_id').value;
  const terms = document.getElementById('terms').checked;

  if (!fullName || !email || !company || !password || !departmentId) {
      alert('Please fill in all required fields.');
      return;
  }
  if (!terms) { alert('Please accept the terms and conditions.'); return; }
  if (password !== confirmPassword) { alert('Passwords do not match.'); return; }
  if (password.length < 6) { alert('Password must be at least 6 characters.'); return; }

  if (btn) btn.disabled = true;
  if (window.SentinelAuthUI) SentinelAuthUI.setLoading(btn, true);

  try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      console.log("User registered successfully:", user);

      // Save additional user details to Firestore
      const userDocRef = doc(db, "users", user.uid);
      await setDoc(userDocRef, {
          fullName: fullName,
          company: company,
          departmentId: departmentId,
          email: email,
          createdAt: new Date(),
      });
      console.log("User profile saved to Firestore with UID:", user.uid);

      alert('Registration successful! You can now log in.');
      window.location.href = "/audit-universe.html"; // Redirect to login page after successful signup

  } catch (error) {
      console.error("Error during registration:", error.code, error.message);
      let errorMessage = "Registration failed. Please try again.";
      if (error.code === 'auth/email-already-in-use') {
          errorMessage = 'The email address is already in use by another account.';
      } else if (error.code === 'auth/invalid-email') {
          errorMessage = 'The email address is not valid.';
      } else if (error.code === 'auth/weak-password') {
          errorMessage = 'The password is too weak. Please use a stronger password.';
      } else if (error.code === 'permission-denied' || error.code === 'firestore/permission-denied') {
          errorMessage = 'Firestore permission denied when saving user profile. Check your rules.';
      }
      alert(errorMessage);
  } finally {
      if (btn) btn.disabled = false;
      if (window.SentinelAuthUI) SentinelAuthUI.setLoading(btn, false);
  }
};


// --- handleLogin function using Firebase Authentication ---
window.handleLogin = async function (event) {
    event.preventDefault();

    const btn = document.getElementById('login-submit');
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const rememberMe = document.getElementById('remember-me')?.checked || false; // Check for existence and default to false

    if (!email || !password) {
        alert('Please enter both email and password.');
        return;
    }

    if (btn) btn.disabled = true;
    if (window.SentinelAuthUI) SentinelAuthUI.setLoading(btn, true); // Assuming SentinelAuthUI has setLoading

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        console.log("User logged in successfully:", user.email, user.uid);
        alert('Login successful!');
        window.location.href = "/audit-universe.html"; // Redirect to your main application page

    } catch (error) {
        console.error("Error during login:", error.code, error.message);
        let errorMessage = "Login failed. Please try again.";
        if (error.code === 'auth/invalid-credential') { // Firebase v9 uses 'invalid-credential' for wrong email/password
            errorMessage = 'Invalid email or password. Please check your credentials.';
        } else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
            // Older codes, but good to include for backward compatibility or clarity
            errorMessage = 'Invalid email or password.';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'The email address is not valid.';
        }
        alert(errorMessage);
    } finally {
        if (btn) btn.disabled = false;
        if (window.SentinelAuthUI) SentinelAuthUI.setLoading(btn, false);
    }
};

// --- handleLogout function (optional, but good to have) ---
window.handleLogout = async function () {
    try {
        await signOut(auth);
        console.log("User logged out successfully.");
        alert("You have been logged out.");
        window.location.href = "/login.html"; // Redirect to login page after logout
    } catch (error) {
        console.error("Error during logout:", error.message);
        alert("Error logging out. Please try again.");
    }
};


// --- DOMContentLoaded listener using Firestore ---
document.addEventListener('DOMContentLoaded', async function () {
  var sel = document.getElementById('department_id');
  if (!sel) return; // Only run if department_id exists (i.e., on signup page)

  try {
      const querySnapshot = await getDocs(collection(db, "departments"));
      const list = [];
      querySnapshot.forEach((doc) => {
          list.push({ id: doc.id, name: doc.data().name });
      });

      if (!list.length) {
          console.warn('No departments found in Firestore. Using built-in list (if any) or showing empty select.');
          if (sel.options.length <= 1) {
              console.log("Firestore is empty, consider adding some default departments in your Firestore 'departments' collection.");
          }
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
      console.error('Error fetching departments from Firestore:', e.message);
      console.warn('Falling back to built-in department list (if any).');
  }
});

// Toggle password visibility - Make it globally accessible too for `onclick`
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

// Theme toggle logic (if this is also part of your main script)
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