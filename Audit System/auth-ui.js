(function () {
  function apiErrorMessage(err) {
    if (!err) return 'Something went wrong. Please try again.';
    if (err.data && err.data.errors && err.data.errors.length) {
      return err.data.errors.map(function (e) {
        return e.msg || e.message;
      }).join('\n');
    }
    if (err.message === 'Failed to fetch' || err.message === 'NetworkError when attempting to fetch resource.') {
      return 'Cannot reach the server. Start the backend with: cd backend && npm run dev\nThen open http://localhost:3000/login.html';
    }
    return err.message || 'Request failed';
  }

  function setLoading(btn, loading) {
    if (!btn) return;
    btn.disabled = loading;
    btn.dataset.originalText = btn.dataset.originalText || btn.textContent;
    btn.textContent = loading ? 'Please wait…' : btn.dataset.originalText;
    btn.classList.toggle('opacity-70', loading);
  }

  window.SentinelAuthUI = {
    apiErrorMessage: apiErrorMessage,
    setLoading: setLoading,
  };
})();
