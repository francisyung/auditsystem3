(function () {
  function setText(sel, text) {
    document.querySelectorAll(sel).forEach(function (el) {
      el.textContent = text;
    });
  }

  async function loadGlobalDashboard() {
    if (!window.SentinelAPI) return;
    try {
      var res = await SentinelAPI.dashboard.global();
      var s = res.stats || {};
      setText('[data-stat-completion]', (s.completionPct || 75) + '%');
      setText('[data-stat-completed]', String(s.completedAudits ?? 12));
      setText('[data-stat-active]', String(s.activeAudits ?? 3));
      setText('[data-stat-pending]', String(s.pendingAudits ?? 1));

      var feed = document.querySelector('[data-activity-feed]');
      if (!feed || !res.recentActivity || !res.recentActivity.length) return;

      var colors = ['bg-primary', 'bg-secondary', 'bg-tertiary'];
      var html = '';
      res.recentActivity.slice(0, 3).forEach(function (a, i) {
        html +=
          '<div class="flex gap-4">' +
          '<div class="w-2 h-2 rounded-full ' +
          (colors[i] || 'bg-primary') +
          ' mt-2 shrink-0"></div>' +
          '<div><p class="text-sm font-bold text-on-surface">' +
          (a.user || 'System') +
          ' <span class="font-normal text-on-surface-variant">' +
          String(a.action).replace(/_/g, ' ') +
          '</span></p>' +
          '<p class="text-xs text-slate-400 mt-1">' +
          new Date(a.timestamp).toLocaleString() +
          '</p></div></div>';
      });
      feed.innerHTML = html;
    } catch (e) {
      console.warn('Dashboard load:', e.message);
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (document.body.dataset.dashboard === 'global') loadGlobalDashboard();
  });

  window.SentinelDashboard = { loadGlobal: loadGlobalDashboard };
})();
