const reviewForm = document.getElementById('reviewForm');
const reviewFormId = document.getElementById('reviewFormId');
const reviewBookId = document.getElementById('reviewBookId');
const reviewRating = document.getElementById('reviewRating');
const reviewText = document.getElementById('reviewText');
const reviewFormSubmit = document.getElementById('reviewFormSubmit');
const reviewFormCancel = document.getElementById('reviewFormCancel');
const reviewFormTitle = document.getElementById('reviewFormTitle');
const adminReviewsList = document.getElementById('adminReviewsList');
const reviewRatingFilter = document.getElementById('reviewRatingFilter');

let currentReviews = [];

function setStatus(elementId, message, type) {
  const el = document.getElementById(elementId);
  el.textContent = message || '';
  el.className = 'status-area' + (type ? ` ${type}` : '');
}

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || `Request failed with status ${response.status}`);
  return data;
}

async function authFetchJson(url, options) {
  const response = await authFetch(url, options);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || `Request failed with status ${response.status}`);
  return data;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

function resetForm() {
  reviewForm.reset();
  reviewFormId.value = '';
  reviewFormTitle.textContent = 'Write a Review';
  reviewFormSubmit.textContent = 'Submit Review';
  reviewFormCancel.style.display = 'none';
}

async function loadBookOptions() {
  const data = await fetchJson('/api/library/books?limit=100');
  reviewBookId.innerHTML =
    '<option value="">Select a book...</option>' +
    data.books.map((b) => `<option value="${b._id}">${escapeHtml(b.title)}</option>`).join('');
}

async function loadReviews() {
  setStatus('adminReviewsStatus', 'Loading…', 'loading');
  try {
    const rating = reviewRatingFilter.value;
    const qs = rating !== '' ? `?rating=${rating}&limit=100` : '?limit=100';
    const data = await fetchJson(`/api/library/reviews${qs}`);
    currentReviews = data.reviews;
    renderReviewList(currentReviews);
    setStatus('adminReviewsStatus', `${data.total} review(s)`, null);
  } catch (err) {
    setStatus('adminReviewsStatus', err.message, 'error');
  }
}

function renderReviewList(reviews) {
  if (reviews.length === 0) {
    adminReviewsList.innerHTML = '';
    setStatus('adminReviewsStatus', 'No reviews match your filter.', 'empty');
    return;
  }

  adminReviewsList.innerHTML = reviews.map((r) => `
    <div class="admin-row">
      <div class="admin-row-info">
        <div class="admin-row-title">${r.bookId ? escapeHtml(r.bookId.title) : 'Unknown book'} — ⭐ ${r.rating}</div>
        <div class="admin-row-meta">${escapeHtml(r.text) || '<em>No written review</em>'}</div>
      </div>
      <div class="admin-row-actions">
        <button class="admin-btn admin-btn-edit" data-edit-id="${r._id}">Edit</button>
        <button class="admin-btn admin-btn-delete" data-delete-id="${r._id}">Delete</button>
      </div>
    </div>
  `).join('');
}

reviewRatingFilter.addEventListener('change', loadReviews);

reviewForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const payload = {
    bookId: reviewBookId.value,
    rating: Number(reviewRating.value),
    text: reviewText.value.trim(),
  };

  const editingId = reviewFormId.value;
  const url = editingId ? `/api/library/reviews/${editingId}` : '/api/library/reviews';
  const method = editingId ? 'PUT' : 'POST';

  setStatus('reviewFormStatus', editingId ? 'Updating…' : 'Submitting…', 'loading');

  try {
    await authFetchJson(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    setStatus('reviewFormStatus', editingId ? 'Review updated.' : 'Review submitted.', null);
    resetForm();
    loadReviews();
  } catch (err) {
    setStatus('reviewFormStatus', err.message, 'error');
  }
});

reviewFormCancel.addEventListener('click', resetForm);

adminReviewsList.addEventListener('click', async (event) => {
  const editBtn = event.target.closest('[data-edit-id]');
  const deleteBtn = event.target.closest('[data-delete-id]');

  if (editBtn) {
    const review = currentReviews.find((r) => r._id === editBtn.dataset.editId);
    if (!review || !review.bookId) return;

    reviewFormId.value = review._id;
    reviewBookId.value = review.bookId._id;
    reviewRating.value = review.rating;
    reviewText.value = review.text || '';

    reviewFormTitle.textContent = `Editing review for: ${review.bookId.title}`;
    reviewFormSubmit.textContent = 'Save Changes';
    reviewFormCancel.style.display = 'inline-block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (deleteBtn) {
    const confirmed = confirm('Delete this review? This cannot be undone.');
    if (!confirmed) return;

    try {
      await authFetch(`/api/library/reviews/${deleteBtn.dataset.deleteId}`, { method: 'DELETE' });
      loadReviews();
    } catch (err) {
      setStatus('adminReviewsStatus', err.message, 'error');
    }
  }
});

async function init() {
  await loadBookOptions();
  await loadReviews();
}

init();