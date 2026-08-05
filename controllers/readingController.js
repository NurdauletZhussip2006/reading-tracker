const { validateReadingPlanInput } = require('../validators/readingValidator');
const { buildReadingPlan } = require('../utils/readingCalculator');
const { formatDate } = require('../utils/dateUtils');
const { SUPPORTED_LANGUAGES } = require('../config/constants');

function showHomePage(req, res) {
  res.render('index', { errors: null, result: null, formData: null });
}

function calculateReadingPlan(req, res) {
  const validation = validateReadingPlanInput(req.body);

  if (!validation.isValid) {
    return res.status(400).render('index', {
      errors: validation.errors,
      result: null,
      formData: req.body,
    });
  }

  const plan = buildReadingPlan(validation.data);

  res.render('index', {
    errors: null,
    result: {
      remainingPages: plan.remainingPages,
      totalHours: plan.totalHours,
      daysNeeded: plan.daysNeeded,
      completionDate: formatDate(plan.completionDate),
      progressPercent: plan.progressPercent,
    },
    formData: req.body,
  });
}

function showReadingTips(req, res) {
  res.render('readingTips');
}

function showSearchPage(req, res) {
  res.render('search', { SUPPORTED_LANGUAGES });
}

function showBooksSearchPage(req, res) {
  res.render('books-search', { SUPPORTED_LANGUAGES });
}
function showAuthorsSearchPage(req, res) {
  res.render('authors-search', { SUPPORTED_LANGUAGES });
}
function showDictionarySearchPage(req, res) {
  res.render('dictionary-search', { SUPPORTED_LANGUAGES });
}
function showLibrariesSearchPage(req, res) {
  res.render('libraries-search', { SUPPORTED_LANGUAGES });
}
function showBestSellersPage(req, res) {
  res.render('best-sellers');
}
function showBookDetailsPage(req, res) {
  res.render('book-details');
}
function showAdminBooksPage(req, res) {
  res.render('admin-books');
}
function showAdminReadingLogsPage(req, res) {
  res.render('admin-reading-logs');
}
function showDashboardPage(req, res) {
  res.render('dashboard');
}
function showRegisterPage(req, res) {
  res.render('register');
}
function showLoginPage(req, res) {
  res.render('login');
}
function showAdminReviewsPage(req, res) {
  res.render('admin-reviews');
}
function showAdminShelvesPage(req, res) {
  res.render('admin-shelves');
}

module.exports = { showHomePage, calculateReadingPlan, showReadingTips, showSearchPage, showBooksSearchPage, showAuthorsSearchPage, showDictionarySearchPage, showLibrariesSearchPage, showBestSellersPage, showAdminShelvesPage, showBookDetailsPage, showAdminBooksPage, showAdminReadingLogsPage, showDashboardPage, showLoginPage, showRegisterPage, showAdminReviewsPage};