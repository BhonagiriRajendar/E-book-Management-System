// admin.js - Admin panel: upload, edit, delete books + stats

const API_BASE = 'http://localhost:5000';

// ── Auth guard: only admins allowed ──────────────────────────────────────────
const token = localStorage.getItem('token');
const role  = localStorage.getItem('role');

if (!token) { window.location.href = 'login.html'; }
if (role !== 'admin') { window.location.href = 'dashboard.html'; }

// ── Logout ────────────────────────────────────────────────────────────────────
function logout() {
  localStorage.clear();
  window.location.href = 'login.html';
}

// ── Alert helper ─────────────────────────────────────────────────────────────
function showAlert(message, type = 'error') {
  const box  = document.getElementById('alert-box');
  const icon = type === 'error' ? '⚠️' : type === 'success' ? '✅' : 'ℹ️';
  box.innerHTML = `<div class="alert alert-${type}">${icon} ${message}</div>`;
  // Auto-dismiss non-error alerts
  if (type !== 'error') setTimeout(() => { box.innerHTML = ''; }, 4000);
  // Scroll to top so user sees it
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── Auth headers helper ───────────────────────────────────────────────────────
function authHeaders() {
  return { Authorization: `Bearer ${token}` };
}

// ── Load stats ────────────────────────────────────────────────────────────────
async function loadStats() {
  try {
    const res  = await fetch(`${API_BASE}/admin/stats`, { headers: authHeaders() });
    const data = await res.json();
    if (data.success) {
      document.getElementById('stat-books').textContent     = data.total_books;
      document.getElementById('stat-users').textContent     = data.total_users;
      document.getElementById('stat-downloads').textContent = data.total_downloads;
    }
  } catch (err) {
    console.error('Stats error:', err);
  }
}

// ── Load & render books table ─────────────────────────────────────────────────
async function loadBooks() {
  const container = document.getElementById('table-container');
  container.innerHTML = `
    <div class="spinner-wrapper">
      <div class="spinner"></div><span>Loading books…</span>
    </div>`;

  try {
    const res  = await fetch(`${API_BASE}/books`);
    const data = await res.json();

    if (!data.success || data.books.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📭</div>
          <h3>No books yet</h3>
          <p>Upload your first book using the form on the left.</p>
        </div>`;
      document.getElementById('table-count').textContent = '';
      return;
    }

    document.getElementById('table-count').textContent =
      `${data.books.length} book${data.books.length !== 1 ? 's' : ''}`;

    const rows = data.books.map(book => `
      <tr>
        <td class="td-title">${escHtml(book.title)}</td>
        <td>${escHtml(book.author)}</td>
        <td><span class="td-badge">${escHtml(book.category || 'General')}</span></td>
        <td style="max-width:220px; color:var(--gray-600); font-size:0.82rem;">
          ${escHtml((book.description || '').slice(0, 80))}${book.description && book.description.length > 80 ? '…' : ''}
        </td>
        <td style="white-space:nowrap;">
          <button class="btn btn-outline btn-sm" onclick="openEditModal(${book.id})">✏️ Edit</button>
          &nbsp;
          <button class="btn btn-danger btn-sm" onclick="openDeleteModal(${book.id}, '${escAttr(book.title)}')">🗑️</button>
        </td>
      </tr>`).join('');

    container.innerHTML = `
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Author</th>
              <th>Category</th>
              <th>Description</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  } catch (err) {
    container.innerHTML = `<div class="alert alert-error">⚠️ Cannot connect to server.</div>`;
    console.error(err);
  }
}

// ── Upload book ───────────────────────────────────────────────────────────────
document.getElementById('upload-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const title       = document.getElementById('book-title').value.trim();
  const author      = document.getElementById('book-author').value.trim();
  const category    = document.getElementById('book-category').value;
  const description = document.getElementById('book-description').value.trim();
  const fileInput   = document.getElementById('book-file');
  const btn         = document.getElementById('upload-btn');

  if (!title || !author) {
    showAlert('Title and Author are required fields.');
    return;
  }

  if (!fileInput.files.length) {
    showAlert('Please select a PDF file to upload.');
    return;
  }

  const file = fileInput.files[0];
  if (!file.name.toLowerCase().endsWith('.pdf')) {
    showAlert('Only PDF files are allowed.');
    return;
  }

  const formData = new FormData();
  formData.append('title',       title);
  formData.append('author',      author);
  formData.append('category',    category);
  formData.append('description', description);
  formData.append('file',        file);

  btn.disabled    = true;
  btn.textContent = '⏳ Uploading…';

  try {
    const res  = await fetch(`${API_BASE}/upload-book`, {
      method:  'POST',
      headers: authHeaders(),   // No Content-Type; browser sets multipart boundary
      body:    formData
    });
    const data = await res.json();

    if (data.success) {
      showAlert(`✅ "${title}" uploaded successfully!`, 'success');
      document.getElementById('upload-form').reset();
      document.getElementById('file-name-display').textContent = '';
      loadBooks();
      loadStats();
    } else {
      showAlert(data.message || 'Upload failed. Please try again.');
    }
  } catch (err) {
    showAlert('Cannot connect to server. Make sure the backend is running.');
    console.error(err);
  } finally {
    btn.disabled    = false;
    btn.textContent = '📤 Upload Book';
  }
});

// ── File drop zone ────────────────────────────────────────────────────────────
const dropZone  = document.getElementById('drop-zone');
const fileInput = document.getElementById('book-file');
const fileLabel = document.getElementById('file-name-display');

fileInput.addEventListener('change', () => {
  const f = fileInput.files[0];
  fileLabel.textContent = f ? `📄 ${f.name}` : '';
});

dropZone.addEventListener('dragover',  (e) => { e.preventDefault(); dropZone.classList.add('drag-over'); });
dropZone.addEventListener('dragleave', ()  => dropZone.classList.remove('drag-over'));
dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('drag-over');
  const f = e.dataTransfer.files[0];
  if (f && f.name.toLowerCase().endsWith('.pdf')) {
    // Manually assign to the file input
    const dt  = new DataTransfer();
    dt.items.add(f);
    fileInput.files = dt.files;
    fileLabel.textContent = `📄 ${f.name}`;
  } else {
    showAlert('Only PDF files are accepted.');
  }
});

// ── Edit modal ────────────────────────────────────────────────────────────────
async function openEditModal(bookId) {
  // Fetch fresh book data
  try {
    const res  = await fetch(`${API_BASE}/books`);
    const data = await res.json();
    const book = data.books.find(b => b.id === bookId);

    if (!book) { showAlert('Book not found.'); return; }

    document.getElementById('edit-book-id').value    = book.id;
    document.getElementById('edit-title').value      = book.title;
    document.getElementById('edit-author').value     = book.author;
    document.getElementById('edit-category').value   = book.category || '';
    document.getElementById('edit-description').value = book.description || '';
    document.getElementById('edit-file').value       = '';

    document.getElementById('edit-modal').style.display = 'flex';
  } catch (err) {
    showAlert('Failed to load book details.');
  }
}

function closeEditModal() {
  document.getElementById('edit-modal').style.display = 'none';
}

document.getElementById('edit-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const bookId      = document.getElementById('edit-book-id').value;
  const title       = document.getElementById('edit-title').value.trim();
  const author      = document.getElementById('edit-author').value.trim();
  const category    = document.getElementById('edit-category').value;
  const description = document.getElementById('edit-description').value.trim();
  const editFile    = document.getElementById('edit-file');
  const btn         = document.getElementById('save-btn');

  if (!title || !author) {
    showAlert('Title and Author are required.'); return;
  }

  btn.disabled    = true;
  btn.textContent = '⏳ Saving…';

  try {
    let res;
    if (editFile.files.length) {
      // Send as multipart if a new file is attached
      const formData = new FormData();
      formData.append('title',       title);
      formData.append('author',      author);
      formData.append('category',    category);
      formData.append('description', description);
      formData.append('file',        editFile.files[0]);

      res = await fetch(`${API_BASE}/update-book/${bookId}`, {
        method:  'PUT',
        headers: authHeaders(),
        body:    formData
      });
    } else {
      // JSON update for metadata-only change
      res = await fetch(`${API_BASE}/update-book/${bookId}`, {
        method:  'PUT',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body:    JSON.stringify({ title, author, category, description })
      });
    }

    const data = await res.json();
    if (data.success) {
      closeEditModal();
      showAlert('Book updated successfully!', 'success');
      loadBooks();
      loadStats();
    } else {
      showAlert(data.message || 'Update failed.');
    }
  } catch (err) {
    showAlert('Cannot connect to server.');
    console.error(err);
  } finally {
    btn.disabled    = false;
    btn.textContent = '💾 Save Changes';
  }
});

// Close modal when clicking overlay background
document.getElementById('edit-modal').addEventListener('click', (e) => {
  if (e.target === document.getElementById('edit-modal')) closeEditModal();
});

// ── Delete modal ──────────────────────────────────────────────────────────────
let pendingDeleteId = null;

function openDeleteModal(bookId, bookTitle) {
  pendingDeleteId = bookId;
  document.getElementById('delete-modal').style.display = 'flex';
}

function closeDeleteModal() {
  pendingDeleteId = null;
  document.getElementById('delete-modal').style.display = 'none';
}

document.getElementById('confirm-delete-btn').addEventListener('click', async () => {
  if (!pendingDeleteId) return;

  const btn = document.getElementById('confirm-delete-btn');
  btn.disabled    = true;
  btn.textContent = 'Deleting…';

  try {
    const res  = await fetch(`${API_BASE}/delete-book/${pendingDeleteId}`, {
      method:  'DELETE',
      headers: authHeaders()
    });
    const data = await res.json();

    if (data.success) {
      closeDeleteModal();
      showAlert('Book deleted successfully.', 'success');
      loadBooks();
      loadStats();
    } else {
      showAlert(data.message || 'Delete failed.');
    }
  } catch (err) {
    showAlert('Cannot connect to server.');
    console.error(err);
  } finally {
    btn.disabled    = false;
    btn.textContent = 'Delete';
  }
});

document.getElementById('delete-modal').addEventListener('click', (e) => {
  if (e.target === document.getElementById('delete-modal')) closeDeleteModal();
});

// ── Escape helpers (prevent XSS in innerHTML) ─────────────────────────────────
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escAttr(str) {
  return String(str).replace(/'/g, "\\'").replace(/"/g, '\\"');
}

// ── Init ──────────────────────────────────────────────────────────────────────
loadStats();
loadBooks();
