// login.js - Handles user authentication via the login form

const API_BASE = 'http://localhost:5000';

// ── Utility: display alert message ───────────────────────────────────────────
function showAlert(message, type = 'error') {
  const box = document.getElementById('alert-box');
  const icon = type === 'error' ? '⚠️' : type === 'success' ? '✅' : 'ℹ️';
  box.innerHTML = `<div class="alert alert-${type}">${icon} ${message}</div>`;

  // Auto-dismiss after 5 seconds
  setTimeout(() => { box.innerHTML = ''; }, 5000);
}

// ── Form submission ───────────────────────────────────────────────────────────
document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const email    = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();
  const btn      = document.getElementById('login-btn');

  // Client-side validation
  if (!email || !password) {
    showAlert('Please enter your email and password.');
    return;
  }

  // Disable button and show loading state
  btn.disabled    = true;
  btn.textContent = 'Signing in…';

  try {
    const response = await fetch(`${API_BASE}/login`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (data.success) {
      // Store JWT token and user info in localStorage
      localStorage.setItem('token',    data.token);
      localStorage.setItem('role',     data.role);
      localStorage.setItem('username', data.username);
      localStorage.setItem('user_id',  data.user_id);

      showAlert('Login successful! Redirecting…', 'success');

      // Redirect based on role
      setTimeout(() => {
        if (data.role === 'admin') {
          window.location.href = 'admin.html';
        } else {
          window.location.href = 'dashboard.html';
        }
      }, 800);
    } else {
      showAlert(data.message || 'Invalid credentials. Please try again.');
    }
  } catch (err) {
    showAlert('Cannot connect to the server. Make sure the backend is running.');
    console.error(err);
  } finally {
    btn.disabled    = false;
    btn.textContent = 'Sign In';
  }
});

// ── Auto-redirect if already logged in ───────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  const role  = localStorage.getItem('role');
  if (token) {
    window.location.href = role === 'admin' ? 'admin.html' : 'dashboard.html';
  }
});
