// file1: Refactored to use Firebase Authentication
//Abdulhere iv changed most or ur fetching logic to syc with the new firebase_script.jsi created earlier
// auth-guard.js
import { auth, db, onAuthStateChanged, getDoc, doc } from './firebase_script.js'; // Added 'doc' here

(function () {
  var PUBLIC_PAGES = ['login.html', 'signup.html'];
  var DEPT_USER_HOME = 'audit-universe.html';
  var AUDITOR_HOME = 'audit-universe.html';

  function currentPage() {
    var path = window.location.pathname;
    return path.substring(path.lastIndexOf('/') + 1) || 'login.html';
  }

  function isPublicPage() {
    return PUBLIC_PAGES.some(function (p) {
      return currentPage() === p || window.location.href.includes(p);
    });
  }

  function homeForRole(role) {
    if (role === 'DEPT_USER' || role === 'VIEWER') return DEPT_USER_HOME;
    return AUDITOR_HOME;
  }

  function applyNavForRole(user) {
    if (!user) return;
    
    var role = user.role || 'DEPT_USER'; 

    var hideForDeptUser = ['newRisk', 'riskMatrix'];
    document.querySelectorAll('[data-nav]').forEach(function (el) {
      var key = el.getAttribute('data-nav');
      if (role === 'DEPT_USER' && hideForDeptUser.indexOf(key) !== -1) {
        el.style.display = 'none';
      }
      if (key === 'deptDashboard' && role !== 'DEPT_USER') {
        el.style.display = 'none';
      }
      if (key === 'dashboard' && role === 'DEPT_USER') {
        el.style.display = 'none';
      }
    });
    var dashLink = document.querySelector('[data-nav="deptDashboard"]');
    if (role === 'DEPT_USER' && dashLink) dashLink.style.display = '';
  }

  function roleIsDeptUser(role) {
    return role === 'DEPT_USER';
  }

  
  if (typeof auth !== 'undefined') {
    onAuthStateChanged(auth, async (user) => {
      var page = currentPage();

      if (isPublicPage()) {
        if (user && (page === 'login.html' || page === 'signup.html')) {
          
          window.location.href = DEPT_USER_HOME; 
        }
        return;
      }

      if (user) {
       
        console.log("User is signed in:", user.email, user.uid);

        
        let userRole = 'DEFAULT_ROLE'; 
        try {
          
          // 'db' is now imported, so you can use it directly
          if (db) { // Check if db is defined after import
            const userDoc = await getDoc(doc(db, "users", user.uid)); // 'doc' is now imported
            if (userDoc.exists()) {
              userRole = userDoc.data().role || userRole; 
              user.role = userRole; 
              user.fullName = userDoc.data().fullName || user.displayName || user.email; 
            }
          }
        } catch (e) {
          console.error("Error fetching user role from Firestore:", e);
        }
        

        applyNavForRole(user);

        if (roleIsDeptUser(user.role) && page === 'audit-universe.html') {
          window.location.href = DEPT_USER_HOME;
          return;
        }
        if (!roleIsDeptUser(user.role) && page === DEPT_USER_HOME) {
          window.location.href = AUDITOR_HOME;
          return;
        }

        document.querySelectorAll('[data-user-name]').forEach(function (el) {
          el.textContent = user.fullName || user.email;
        });

      } else {
        // User is signed out.
        console.log("User is signed out.");
        if (!isPublicPage()) {
          window.location.href = 'login.html';
          return;
        }
      }
    });
  } else {
    console.error("Firebase 'auth' object not found. Ensure Firebase is initialized and 'auth' is globally accessible.");
  }


  window.SentinelAuth = {
    homeForRole: homeForRole,
  
    ensureAuth: function() {
      console.warn("SentinelAuth.ensureAuth() is deprecated. Authentication is now handled by Firebase's onAuthStateChanged.");
    },
    applyNavForRole: applyNavForRole,
  };

  

})();