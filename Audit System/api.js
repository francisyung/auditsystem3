(function () {
  function resolveApiBase() {
    if (window.SENTINEL_API_BASE) return window.SENTINEL_API_BASE;
    if (window.location.protocol === 'file:') return 'http://localhost:3000';
    if (
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1'
    ) {
      if (window.location.port && window.location.port !== '3000') {
        return 'http://localhost:3000';
      }
    }
    return '';
  }

  const API_BASE = resolveApiBase();

  function getToken() {
    return sessionStorage.getItem('authToken') || localStorage.getItem('authToken');
  }

  function setToken(token) {
    if (token) {
      sessionStorage.setItem('authToken', token);
      localStorage.setItem('authToken', token);
    } else {
      sessionStorage.removeItem('authToken');
      localStorage.removeItem('authToken');
    }
  }

  async function request(path, options = {}) {
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
    const token = getToken();
    if (token) headers.Authorization = 'Bearer ' + token;

    const res = await fetch(API_BASE + path, {
      ...options,
      headers,
      body: options.body != null ? JSON.stringify(options.body) : undefined,
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg =
        data.message ||
        (data.errors && data.errors[0] && (data.errors[0].msg || data.errors[0].message)) ||
        res.statusText ||
        'Request failed';
      const err = new Error(msg);
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  }

  window.SentinelAPI = {
    getToken,
    setToken,
    get: (path) => request(path),
    post: (path, body) => request(path, { method: 'POST', body }),
    put: (path, body) => request(path, { method: 'PUT', body }),
    patch: (path, body) => request(path, { method: 'PATCH', body }),
    delete: (path) => request(path, { method: 'DELETE' }),

    auth: {
      login: (email, password) =>
        request('/api/auth/login', { method: 'POST', body: { email, password } }),
      register: (payload) =>
        request('/api/auth/register', { method: 'POST', body: payload }),
      me: () => request('/api/auth/me'),
      logout: (body) => request('/api/auth/logout', { method: 'POST', body }),
      events: (q) => request('/api/auth/events' + (q ? '?' + new URLSearchParams(q) : '')),
    },
    departments: () => request('/api/departments'),
    departmentsPublic: () => request('/api/departments/public'),
    dashboard: {
      global: () => request('/api/dashboard/global'),
      department: (id) =>
        request('/api/dashboard/department' + (id ? '/' + id : '')),
    },
    assignments: {
      list: (q) => request('/api/assignments' + (q ? '?' + new URLSearchParams(q) : '')),
      create: (body) => request('/api/assignments', { method: 'POST', body }),
      remediate: (id, body) =>
        request('/api/assignments/' + id + '/remediation', { method: 'PATCH', body }),
    },
    audits: {
      list: () => request('/api/audits'),
      submit: (id, formData) =>
        request('/api/audits/' + id + '/submit', { method: 'POST', body: { formData } }),
    },
    risks: {
      list: () => request('/api/risks'),
      create: (body) => request('/api/risks', { method: 'POST', body }),
    },
    notifications: {
      list: (unread) =>
        request('/api/notifications' + (unread ? '?unread=true' : '')),
      markRead: (id) => request('/api/notifications/' + id + '/read', { method: 'PATCH' }),
      markAllRead: () => request('/api/notifications/read-all', { method: 'PATCH' }),
    },
    messages: {
      threads: () => request('/api/messages/threads'),
      thread: (id) => request('/api/messages/threads/' + id),
      createThread: (body) => request('/api/messages/threads', { method: 'POST', body }),
      send: (threadId, body) =>
        request('/api/messages/threads/' + threadId + '/messages', {
          method: 'POST',
          body: { body },
        }),
      searchUsers: (q) => request('/api/messages/users/search?q=' + encodeURIComponent(q)),
    },
    reports: {
      list: () => request('/api/reports'),
    },
  };
})();
