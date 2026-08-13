(function () {
  var ROUTES = {
    login: 'login.html',
    signup: 'signup.html',
    dashboard: 'Audit_Plan&Program.html',
    deptDashboard: 'Internal_Audit_Work_Plan.html',
    riskRegister: 'risk-assessment.html',

    settings: 'Final_Audit_Report.html',
    reports: 'Draft_Audit_Report.html',
    auditunivers: 'audit-universe.html',
  };

  function hrefFor(key) {
    return ROUTES[key] || '#';
  }

  function wireLinks() {
    document.querySelectorAll('[data-nav]').forEach(function (el) {
      var key = el.getAttribute('data-nav');
      if (!key || !ROUTES[key]) return;
      var target = hrefFor(key);
      if (el.tagName === 'A') {
        el.setAttribute('href', target);
      } else {
        el.style.cursor = 'pointer';
        el.addEventListener('click', function () {
          window.location.href = target;
        });
      }
    });
  }

  function go(key) {
    var url = hrefFor(key);
    if (url !== '#') window.location.href = url;
  }

  window.AuditNav = { routes: ROUTES, go: go };

  function injectShellCSS() {
    if (document.getElementById('sentinel-shell-css')) return;
    var style = document.createElement('style');
    style.id = 'sentinel-shell-css';
    style.textContent =
      '#app-sidebar{transition:transform .2s ease;will-change:transform}' +
      '#app-sidebar-backdrop{transition:opacity .2s ease}' +
      '@media (max-width:767px){' +
      'body[data-app-shell="md"] #app-sidebar{transform:translateX(-100%)}' +
      'body[data-app-shell="md"].nav-drawer-open #app-sidebar{transform:translateX(0)}' +
      'body[data-app-shell="md"].nav-drawer-open #app-sidebar-backdrop{opacity:1!important;pointer-events:auto!important}' +
      '}' +
      '@media (min-width:768px){' +
      'body[data-app-shell="md"] #app-sidebar-backdrop{opacity:0!important;pointer-events:none!important}' +
      'body[data-app-shell="md"]:not(.nav-desktop-collapsed) #app-sidebar{transform:translateX(0)}' +
      'body[data-app-shell="md"].nav-desktop-collapsed #app-sidebar{transform:translateX(-100%)}' +
      'body[data-app-shell="md"].nav-desktop-collapsed #app-main{margin-left:0!important}' +
      '}' +
      '@media (max-width:1023px){' +
      'body[data-app-shell="lg"] #app-sidebar{transform:translateX(-100%)}' +
      'body[data-app-shell="lg"].nav-drawer-open #app-sidebar{transform:translateX(0)}' +
      'body[data-app-shell="lg"].nav-drawer-open #app-sidebar-backdrop{opacity:1!important;pointer-events:auto!important}' +
      '}' +
      '@media (min-width:1024px){' +
      'body[data-app-shell="lg"] #app-sidebar-backdrop{opacity:0!important;pointer-events:none!important}' +
      'body[data-app-shell="lg"]:not(.nav-desktop-collapsed) #app-sidebar{transform:translateX(0)}' +
      'body[data-app-shell="lg"].nav-desktop-collapsed #app-sidebar{transform:translateX(-100%)}' +
      'body[data-app-shell="lg"].nav-desktop-collapsed #app-main{margin-left:0!important}' +
      '}';
    document.head.appendChild(style);
  }

  function isMobileShell() {
    var shell = document.body.getAttribute('data-app-shell') || 'md';
    return shell === 'lg'
      ? window.matchMedia('(max-width: 1023px)').matches
      : window.matchMedia('(max-width: 767px)').matches;
  }

  function closeDrawer() {
    document.body.classList.remove('nav-drawer-open');
  }

  function openDrawer() {
    document.body.classList.add('nav-drawer-open');
  }

  function initAppShell() {
    var sidebar = document.getElementById('app-sidebar');
    var main = document.getElementById('app-main');
    if (!sidebar || !main) return;

    injectShellCSS();

    if (localStorage.getItem('sentinelNavDesktopCollapsed') === '1') {
      document.body.classList.add('nav-desktop-collapsed');
    }

    function toggleSidebar() {
      if (isMobileShell()) {
        document.body.classList.toggle('nav-drawer-open');
      } else {
        document.body.classList.toggle('nav-desktop-collapsed');
        var c = document.body.classList.contains('nav-desktop-collapsed');
        localStorage.setItem('sentinelNavDesktopCollapsed', c ? '1' : '0');
        document.body.classList.remove('nav-drawer-open');
      }
    }

    document.querySelectorAll('[data-sidebar-toggle]').forEach(function (btn) {
      btn.addEventListener('click', toggleSidebar);
    });
    document.querySelectorAll('[data-sidebar-close]').forEach(function (btn) {
      btn.addEventListener('click', closeDrawer);
    });
    document.querySelectorAll('[data-sidebar-open]').forEach(function (btn) {
      btn.addEventListener('click', openDrawer);
    });

    var backdrop = document.getElementById('app-sidebar-backdrop');
    if (backdrop) backdrop.addEventListener('click', closeDrawer);

    sidebar.querySelectorAll('a[data-nav]').forEach(function (a) {
      a.addEventListener('click', function () {
        if (isMobileShell()) closeDrawer();
      });
    });

    window.SentinelShell = {
      closeDrawer: closeDrawer,
      openDrawer: openDrawer,
      toggleSidebar: toggleSidebar,
    };
  }

  function onReady(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  onReady(function () {
    wireLinks();
    initAppShell();
  });
})();
