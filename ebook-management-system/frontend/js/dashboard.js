// dashboard.js - User dashboard: browse, search, and download books

const API_BASE = 'http://localhost:5000';

// ── Auth guard: redirect unauthenticated users to login ─────────────────────
const token    = localStorage.getItem('token');
const role     = localStorage.getItem('role');
const username = localStorage.getItem('username');

if (!token) {
  window.location.href = 'login.html';
}

// Admins should be on admin.html
if (role === 'admin') {
  window.location.href = 'admin.html';
}

// ── Set username in navbar ───────────────────────────────────────────────────
document.getElementById('username-display').textContent = `Hello, ${username || 'User'} 👋`;

// ── Logout ───────────────────────────────────────────────────────────────────
function logout() {
  localStorage.clear();
  window.location.href = 'login.html';
}

// ── Category → CSS class + emoji mapping ────────────────────────────────────
function getCategoryStyle(category) {
  const map = {
    'programming':         { cls: 'cat-programming',  emoji: '💻' },
    'software engineering':{ cls: 'cat-engineering',  emoji: '⚙️' },
    'data science':        { cls: 'cat-data',         emoji: '📊' },
    'artificial intelligence': { cls: 'cat-data',     emoji: '🤖' },
    'fiction':             { cls: 'cat-fiction',      emoji: '📖' },
    'science':             { cls: 'cat-science',      emoji: '🔬' },
    'productivity':        { cls: 'cat-productivity', emoji: '⚡' },
    'business':            { cls: 'cat-productivity', emoji: '💼' },
  };
  const key = (category || '').toLowerCase();
  return map[key] || { cls: 'cat-default', emoji: '📚' };
}

// ── Build a book card HTML string ────────────────────────────────────────────
function createBookCard(book) {
  const { cls, emoji } = getCategoryStyle(book.category);
  const cat  = book.category || 'General';
  const desc = book.description || 'No description available.';

  return `
    <div class="book-card">
      <div class="book-cover ${cls}">
        <span class="book-cover-emoji">${emoji}</span>
      </div>
      <div class="book-body">
        <div class="book-category">${cat}</div>
        <div class="book-title">${book.title}</div>
        <div class="book-author">by ${book.author}</div>
        <div class="book-description">${desc}</div>
      </div>
      <div class="book-footer">
        <button class="btn btn-primary btn-sm" style="flex:1"
                onclick="downloadBook(${book.id}, '${book.title.replace(/'/g,"\\'")}')">
          ⬇️ Download PDF
        </button>
      </div>
    </div>`;
}

// ── Render books grid ─────────────────────────────────────────────────────────
function renderBooks(books) {
  const container = document.getElementById('books-container');
  const countEl   = document.getElementById('books-count');

  if (!books || books.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📭</div>
        <h3>No books found</h3>
        <p>Try a different search term or browse all books.</p>
      </div>`;
    countEl.textContent = '';
    return;
  }

  countEl.textContent = `${books.length} book${books.length !== 1 ? 's' : ''} found`;
  container.innerHTML = `<div class="books-grid">${books.map(createBookCard).join('')}</div>`;
}

// ── Fetch all books ───────────────────────────────────────────────────────────
async function loadBooks() {
  showSpinner();
  try {
    const res  = await fetch(`${API_BASE}/books`);
    const data = await res.json();
    if (data.success) {
      renderBooks(data.books);
    } else {
      showAlert('Failed to load books.');
    }
  } catch (err) {
    showAlert('Cannot connect to the server. Make sure the backend is running.');
    console.error(err);
  }
}

// ── Search books ──────────────────────────────────────────────────────────────
async function searchBooks(query) {
  showSpinner();
  try {
    const res  = await fetch(`${API_BASE}/search?query=${encodeURIComponent(query)}`);
    const data = await res.json();
    if (data.success) {
      renderBooks(data.books);
    } else {
      showAlert(data.message || 'Search failed.');
    }
  } catch (err) {
    showAlert('Cannot connect to the server.');
    console.error(err);
  }
}

// ── Download a book ───────────────────────────────────────────────────────────
async function downloadBook(bookId, bookTitle) {
  try {
    showAlert(`⬇️ Downloading "${bookTitle}"…`, 'info');

    const res = await fetch(`${API_BASE}/download/${bookId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      showAlert(err.message || 'Download failed. Please try again.');
      return;
    }

    // Stream the file as a blob and trigger browser download
    const blob = await res.blob();
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `${bookTitle}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showAlert(`✅ "${bookTitle}" downloaded successfully!`, 'success');
  } catch (err) {
    showAlert('Download failed. Please try again.');
    console.error(err);
  }
}

// ── Spinner ───────────────────────────────────────────────────────────────────
function showSpinner() {
  document.getElementById('books-container').innerHTML = `
    <div class="spinner-wrapper">
      <div class="spinner"></div>
      <span>Loading books…</span>
    </div>`;
  document.getElementById('books-count').textContent = '';
}

// ── Alert ─────────────────────────────────────────────────────────────────────
function showAlert(message, type = 'error') {
  const box  = document.getElementById('alert-box');
  const icon = type === 'error' ? '⚠️' : type === 'success' ? '✅' : 'ℹ️';
  box.innerHTML = `<div class="alert alert-${type}">${icon} ${message}</div>`;
  setTimeout(() => { box.innerHTML = ''; }, 4000);
}

// ── Event listeners ───────────────────────────────────────────────────────────
document.getElementById('search-btn').addEventListener('click', () => {
  const query = document.getElementById('search-input').value.trim();
  if (query) searchBooks(query);
  else loadBooks();
});

document.getElementById('clear-btn').addEventListener('click', () => {
  document.getElementById('search-input').value = '';
  loadBooks();
});

// Search on Enter key
document.getElementById('search-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') document.getElementById('search-btn').click();
});

// ── Init ──────────────────────────────────────────────────────────────────────
loadBooks();
