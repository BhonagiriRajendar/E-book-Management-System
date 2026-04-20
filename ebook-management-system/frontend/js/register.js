// register.js - Handles new user registration

const API_BASE = 'http://localhost:5000';

function showAlert(message, type = 'error') {
  const box  = document.getElementById('alert-box');
  const icon = type === 'error' ? '⚠️' : type === 'success' ? '✅' : 'ℹ️';
  box.innerHTML = `<div class="alert alert-${type}">${icon} ${message}</div>`;
  if (type !== 'success') {
    setTimeout(() => { box.innerHTML = ''; }, 5000);
  }
}

// ── Form submission ───────────────────────────────────────────────────────────
document.getElementById('register-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const username        = document.getElementById('username').value.trim();
  const email           = document.getElementById('email').value.trim();
  const password        = document.getElementById('password').value.trim();
  const confirmPassword = document.getElementById('confirm-password').value.trim();
  const btn             = document.getElementById('register-btn');

  // ── Client-side validations ───────────────────────────────────────────────
  if (!username || !email || !password || !confirmPassword) {
    showAlert('All fields are required.');
    return;
  }

  if (username.length < 2) {
    showAlert('Name must be at least 2 characters.');
    return;
  }

  // Basic email format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showAlert('Please enter a valid email address.');
    return;
  }

  if (password.length < 6) {
    showAlert('Password must be at least 6 characters.');
    return;
  }

  if (password !== confirmPassword) {
    showAlert('Passwords do not match. Please try again.');
    return;
  }

  // Disable button
  btn.disabled    = true;
  btn.textContent = 'Creating account…';

  try {
    const response = await fetch(`${API_BASE}/register`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ username, email, password })
    });

    const data = await response.json();

    if (data.success) {
      showAlert('Account created successfully! Redirecting to login…', 'success');
      // Clear form
      document.getElementById('register-form').reset();
      // Redirect after short delay
      setTimeout(() => { window.location.href = 'login.html'; }, 1800);
    } else {
      showAlert(data.message || 'Registration failed. Please try again.');
    }
  } catch (err) {
    showAlert('Cannot connect to the server. Make sure the backend is running.');
    console.error(err);
  } finally {
    btn.disabled    = false;
    btn.textContent = 'Create Account';
  }
});

// ── Redirect if already logged in ────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  const role  = localStorage.getItem('role');
  if (token) {
    window.location.href = role === 'admin' ? 'admin.html' : 'dashboard.html';
  }
});
