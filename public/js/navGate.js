// Hides site-nav links that require a logged-in user (Reading Logs, Reviews,
// Dashboard) when nobody is signed in. Reading Tips, Discover, Book
// Catalogue, and Shelves stay visible either way since they don't need auth
// to view. Depends on getAuthData() from authFetch.js, so this script must
// be loaded after it.
(function () {
  var LOGIN_REQUIRED_PATHS = ['/admin/reading-logs', '/admin/reviews', '/dashboard'];

  function applyNavGate() {
    var auth = typeof getAuthData === 'function' ? getAuthData() : null;
    var isLoggedIn = !!(auth && auth.accessToken);

    document.querySelectorAll('nav.site-nav a[href]').forEach(function (link) {
      if (LOGIN_REQUIRED_PATHS.indexOf(link.getAttribute('href')) !== -1) {
        link.style.display = isLoggedIn ? '' : 'none';
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyNavGate);
  } else {
    applyNavGate();
  }
})();