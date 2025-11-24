// Base API URL
const API_URL = 'http://localhost:5000/api';

// ==================== PASSWORD TOGGLE ====================
const togglePassword = document.getElementById('togglePassword');
const passwordInput = document.getElementById('password');

if (togglePassword && passwordInput) {
    togglePassword.addEventListener('click', () => {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);

        const icon = togglePassword.querySelector('i');
        icon.classList.toggle('fa-eye');
        icon.classList.toggle('fa-eye-slash');
    });
}

// ==================== LOGIN LOGIC ====================
const loginForm = document.getElementById('loginForm');

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('email').value.trim().toLowerCase();
        const password = document.getElementById('password').value;
        const roleRadio = document.querySelector('input[name="role"]:checked');
        
        if (!roleRadio) {
            showToast('Please select a role (User or Admin)', 'error');
            return;
        }

        const role = roleRadio.value;

        // Clear errors
        document.getElementById('emailError').textContent = '';
        document.getElementById('passwordError').textContent = '';

        // Button loading state
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
        submitBtn.disabled = true;

        try {
            const endpoint = role === 'admin' ? '/admin/login' : '/reporters/login';

            const response = await fetch(`${API_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ email, password })
            });

            let data = {};
            try {
                data = await response.json();
            } catch (e) {
                throw new Error('Invalid server response');
            }

            if (response.ok) {
                // Store user info
                localStorage.setItem('user', JSON.stringify(data));
                localStorage.setItem('role', role);

                // Prevent immediate re-check
                sessionStorage.setItem('justLoggedIn', 'true');

                showToast('Login successful!', 'success');

                setTimeout(() => {
                    if (role === 'admin') {
                        window.location.href = 'admin/dashboard.html';
                    } else {
                        window.location.href = 'user/dashboard.html';
                    }
                }, 1000);

            } else {
                throw new Error(data.message || 'Login failed');
            }
        } catch (error) {
            showToast(error.message, 'error');
            document.getElementById('passwordError').textContent = error.message;
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });
}

// ==================== SIGNUP LOGIC ====================
const signupForm = document.getElementById('signupForm');

if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim().toLowerCase();
        const phone = document.getElementById('phone').value.trim();
        const address = document.getElementById('address').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const profilePhoto = document.getElementById('profilePhoto').files[0];

        const passwordError = document.getElementById('passwordError');
        passwordError.textContent = '';

        // Validations
        if (password.length < 6) {
            passwordError.textContent = 'Password must be at least 6 characters';
            return;
        }

        if (password !== confirmPassword) {
            passwordError.textContent = 'Passwords do not match';
            return;
        }

        if (profilePhoto && profilePhoto.size > 5 * 1024 * 1024) {
            passwordError.textContent = 'Profile photo must be less than 5MB';
            return;
        }

        const submitBtn = signupForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Account...';
        submitBtn.disabled = true;

        try {
            const formData = new FormData();
            formData.append('name', name);
            formData.append('email', email);
            formData.append('phone', phone);
            formData.append('password', password);
            if (address) formData.append('address', address);
            if (profilePhoto) formData.append('profilePhoto', profilePhoto);

            const response = await fetch(`${API_URL}/reporters/register`, {
                method: 'POST',
                credentials: 'include',
                body: formData
            });

            let data = {};
            try {
                data = await response.json();
            } catch (e) {
                throw new Error('Invalid server response');
            }

            if (response.ok) {
                localStorage.setItem('user', JSON.stringify(data));
                localStorage.setItem('role', 'user');

                showToast('Registration successful!', 'success');

                setTimeout(() => {
                    window.location.href = 'user/dashboard.html';
                }, 1000);
            } else {
                if (data.errors) {
                    throw new Error(data.errors[0].msg);
                }
                throw new Error(data.message || 'Registration failed');
            }
        } catch (error) {
            showToast(error.message, 'error');
            passwordError.textContent = error.message;
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });
}

// ==================== ROLE UI HIGHLIGHT ====================
const roleOptions = document.querySelectorAll('.role-option');
roleOptions.forEach(option => {
    option.addEventListener('click', () => {
        roleOptions.forEach(opt => opt.classList.remove('selected'));
        option.classList.add('selected');
    });
});
