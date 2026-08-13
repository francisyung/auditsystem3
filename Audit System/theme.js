(function () {
  var KEY = 'sentinelSettingsV1';

  function readDark() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return false;
      var s = JSON.parse(raw);
      return !!s.darkMode;
    } catch (e) {
      return false;
    }
  }

  function apply() {
    var root = document.documentElement;
    if (readDark()) {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }
  }

  function injectDarkModeCSS() {
    if (document.getElementById('sentinel-dark-mode-css')) return;
    
    var style = document.createElement('style');
    style.id = 'sentinel-dark-mode-css';
    style.textContent = `
      .dark {
        --tw-bg-opacity: 1;
      }
      
      /* Dark mode improvements for visibility */
      .dark .bg-surface-container-low {
        background-color: rgb(30, 41, 59) !important;
      }
      
      .dark .bg-surface-container-lowest {
        background-color: rgb(15, 23, 42) !important;
      }
      
      .dark .bg-surface-container {
        background-color: rgb(30, 41, 59) !important;
      }
      
      .dark .bg-surface-container-high {
        background-color: rgb(51, 65, 85) !important;
      }
      
      .dark .bg-surface-container-highest {
        background-color: rgb(71, 85, 105) !important;
      }
      
      .dark .text-on-surface {
        color: rgb(248, 250, 252) !important;
      }
      
      .dark .text-on-surface-variant {
        color: rgb(203, 213, 225) !important;
      }
      
      .dark .text-primary {
        color: rgb(147, 197, 253) !important;
      }
      
      .dark .text-secondary {
        color: rgb(134, 239, 172) !important;
      }
      
      .dark .text-tertiary {
        color: rgb(252, 165, 165) !important;
      }
      
      .dark .border-outline-variant {
        border-color: rgb(71, 85, 105) !important;
      }
      
      .dark .bg-primary-container {
        background-color: #f59e0b(30, 58, 138) !important;
      }
      
      .dark .bg-secondary-container {
        background-color: rgb(34, 197, 94) !important;
      }
      
      .dark .bg-tertiary-container {
        background-color: #ef4444(185, 28, 28) !important;
      }
      
      .dark .bg-slate-100 {
        background-color: rgb(15, 23, 42) !important;
      }
      
      .dark .bg-slate-50 {
        background-color: rgb(30, 41, 59) !important;
      }
      
      .dark .bg-slate-900 {
        background-color: rgb(3, 7, 18) !important;
      }
      
      .dark .text-slate-900 {
        color: rgb(248, 250, 252) !important;
      }
      
      .dark .text-slate-500 {
        color: rgb(148, 163, 184) !important;
      }
      
      .dark .text-slate-400 {
        color: rgb(148, 163, 184) !important;
      }
      
      .dark .border-slate-200 {
        border-color: rgb(51, 65, 85) !important;
      }
      
      .dark .border-slate-800 {
        border-color: rgb(30, 41, 59) !important;
      }
      
      .dark .hover\\:bg-slate-200\\/50:hover {
        background-color: rgb(71, 85, 105) !important;
      }
      
      .dark .hover\\:bg-slate-800\\/50:hover {
        background-color: rgb(30, 41, 59) !important;
      }
      
      .dark .glass-panel {
        background: rgba(15, 23, 42, 0.95) !important;
        border: 1px solid rgba(71, 85, 105, 0.3) !important;
      }
      
      /* Input field improvements */
      .dark input, .dark textarea, .dark select {
        background-color: rgb(30, 41, 59) !important;
        color: rgb(248, 250, 252) !important;
        border-color: rgb(71, 85, 105) !important;
      }
      
      .dark input::placeholder, .dark textarea::placeholder {
        color: rgb(148, 163, 184) !important;
      }
      
      /* Button improvements */
      .dark button {
        color: rgb(248, 250, 252) !important;
      }
      
      /* Table improvements */
      .dark table {
        background-color: rgb(15, 23, 42) !important;
      }
      
      .dark th, .dark td {
        border-color: rgb(51, 65, 85) !important;
      }
      
      /* Sidebar improvements */
      .dark #app-sidebar {
        background-color: rgb(15, 23, 42) !important;
        border-right: 1px solid rgb(51, 65, 85) !important;
      }
      
      /* Mobile navigation */
      .dark .bg-slate-50 {
        background-color: rgb(30, 41, 59) !important;
      }
    `;
    
    document.head.appendChild(style);
  }

  apply();
  injectDarkModeCSS();

  window.addEventListener('storage', function (e) {
    if (e.key === KEY || e.key === null) apply();
  });

  window.SentinelTheme = {
    apply: apply,
    isDark: function () {
      return readDark();
    },
    setDark: function (on) {
      try {
        var raw = localStorage.getItem(KEY);
        var s = raw ? JSON.parse(raw) : {};
        if (typeof s !== 'object' || s === null) s = {};
        s.darkMode = !!on;
        localStorage.setItem(KEY, JSON.stringify(s));
      } catch (e) {
        localStorage.setItem(KEY, JSON.stringify({ darkMode: !!on }));
      }
      apply();
    },
    toggle: function () {
      window.SentinelTheme.setDark(!readDark());
    },
  };
})();
