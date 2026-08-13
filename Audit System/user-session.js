// User Session Management — works with Sentinel API + JWT
class UserSession {
  constructor() {
    this.currentUser = null;
    this.init();
  }

  init() {
    var saved = sessionStorage.getItem('currentUser');
    if (saved) {
      try {
        this.currentUser = JSON.parse(saved);
      } catch (e) {
        sessionStorage.removeItem('currentUser');
      }
    }
  }

  login(userData, options) {
    options = options || {};
    this.currentUser = userData;
    sessionStorage.setItem('currentUser', JSON.stringify(userData));
    if (!options.skipRedirect) {
      var home =
        window.SentinelAuth && SentinelAuth.homeForRole
          ? SentinelAuth.homeForRole(userData.role)
          : userData.role === 'DEPT_USER'
            ? 'audit-universe.html'
            : 'audit-universe.html';
      window.location.href = home;
    }
    this.updateUserInterface();
  }

  async logout() {
    var user = this.currentUser;
    try {
      if (window.SentinelAPI) {
        await SentinelAPI.auth.logout({
          userId: user && user.id,
          email: user && user.email,
        });
        SentinelAPI.setToken(null);
      }
    } catch (e) {
      /* ignore */
    }
    this.currentUser = null;
    sessionStorage.removeItem('currentUser');
    window.location.href = 'login.html';
  }

  getCurrentUser() {
    return this.currentUser;
  }

  isLoggedIn() {
    return this.currentUser !== null || (window.SentinelAPI && !!SentinelAPI.getToken());
  }

  updateProfile(updates) {
    if (!this.currentUser) return;
    Object.assign(this.currentUser, updates);
    sessionStorage.setItem('currentUser', JSON.stringify(this.currentUser));
    this.updateUserInterface();
  }

  getUserDisplayName() {
    if (!this.currentUser) return 'Guest';
    return this.currentUser.fullName || this.currentUser.name || 'User';
  }

  getUserInitials() {
    if (!this.currentUser) return 'GU';
    var name = this.getUserDisplayName();
    return name
      .split(' ')
      .map(function (n) {
        return n[0];
      })
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  getUserRole() {
    if (!this.currentUser) return 'Not Assigned';
    return this.currentUser.jobTitle || this.currentUser.role || 'Staff';
  }

  updateUserInterface() {
    this.updateUserProfileDisplays();
  }

  updateUserProfileDisplays() {
    var self = this;
    document.querySelectorAll('[data-user-name]').forEach(function (el) {
      el.textContent = self.getUserDisplayName();
    });
    document.querySelectorAll('.user-name').forEach(function (el) {
      el.textContent = self.getUserDisplayName();
    });
    document.querySelectorAll('.user-initials').forEach(function (el) {
      el.textContent = self.getUserInitials();
    });
    document.querySelectorAll('.user-role').forEach(function (el) {
      el.textContent = self.getUserRole();
    });
  }
}

window.userSession = new UserSession();

// Public pages skip guard; app pages use auth-guard.js
document.addEventListener('DOMContentLoaded', function () {
  var path = window.location.pathname;
  var isGuest =
    path.includes('login.html') ||
    path.includes('signup.html');
  if (!isGuest && window.userSession.getCurrentUser()) {
    window.userSession.updateUserInterface();
  }
});
