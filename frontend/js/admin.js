const API_URL = 'http://localhost:5000/api';

// Load user from localStorage
let user = null;
try {
    const userStr = localStorage.getItem('user');
    if (userStr) user = JSON.parse(userStr);
} catch (e) {
    console.error('Error parsing user:', e);
}

// ============================ AUTH CHECK ============================
async function checkAdminAuth() {
    const role = localStorage.getItem('role');

    if (!user || role !== 'admin') {
        window.location.href = '../login.html';
        return false;
    }

    try {
        const response = await fetch(`${API_URL}/admin/profile`, {
            credentials: 'include'
        });

        if (response.status === 401) {
            localStorage.removeItem('user');
            localStorage.removeItem('role');
            window.location.href = '../login.html';
            return false;
        }

        return true;
    } catch (error) {
        console.warn("Auth check failed:", error);
        return true;
    }
}

// Immediate check
checkAdminAuth();

// ============================ LOGOUT ============================
window.logout = async function () {
    try {
        await fetch(`${API_URL}/admin/logout`, {
            method: 'POST',
            credentials: 'include'
        });
    } catch (e) {
        console.warn("Logout request failed:", e);
    }

    localStorage.removeItem('user');
    localStorage.removeItem('role');

    showToast('Logged out successfully', 'success');

    setTimeout(() => {
        window.location.href = '../login.html';
    }, 800);
};

// ============================ DASHBOARD ============================
async function loadDashboard() {
    try {
        const response = await fetch(`${API_URL}/reports`, {
            credentials: 'include'
        });

        if (response.status === 401) {
            window.location.href = '../login.html';
            return;
        }

        const reports = await response.json();

        const newCol = document.getElementById('col-new');
        const progressCol = document.getElementById('col-in-progress');
        const completedCol = document.getElementById('col-completed');

        newCol.innerHTML = '<h3>New / Pending</h3>';
        progressCol.innerHTML = '<h3>In Progress</h3>';
        completedCol.innerHTML = '<h3>Completed</h3>';

        reports.forEach(report => {
            const card = createCaseCard(report);
            const withdrawn = report.withdrawn || report.status === 'Withdrawn';

            if (withdrawn) {
                card.style.opacity = '0.6';
                card.style.borderLeft = '4px solid #6b7280';
                completedCol.appendChild(card);
            } else if (report.status === 'Pending') {
                newCol.appendChild(card);
            } else if (report.status === 'In Progress') {
                progressCol.appendChild(card);
            } else if (report.status === 'Resolved' || report.status === 'Closed') {
                completedCol.appendChild(card);
            }
        });

    } catch (error) {
        console.error('Dashboard load error:', error);
        showToast('Failed to load dashboard', 'error');
    }
}

// Create Kanban card
function createCaseCard(report) {
    const div = document.createElement('div');
    div.className = 'case-card';
    div.setAttribute('data-id', report._id);

    const withdrawn = report.withdrawn || report.status === 'Withdrawn';

    div.innerHTML = `
        <div class="card-header">
            <span class="token">${report.trackingId}</span>
            <div class="actions">
                ${
                    withdrawn
                    ? `<span class="badge badge-withdrawn">Withdrawn</span>`
                    : `
                        <select onchange="updateStatus('${report._id}', this.value)">
                            <option value="Pending" ${report.status === 'Pending' ? 'selected' : ''}>Pending</option>
                            <option value="In Progress" ${report.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                            <option value="Resolved" ${report.status === 'Resolved' ? 'selected' : ''}>Resolved</option>
                            <option value="Closed" ${report.status === 'Closed' ? 'selected' : ''}>Closed</option>
                        </select>
                    `
                }
            </div>
        </div>
        <div class="type">${report.type}</div>
        <div class="reporter">${report.reporter ? report.reporter.name : 'Unknown'}</div>
        <small>${new Date(report.date).toLocaleDateString()}</small>
    `;

    return div;
}

// Update status
async function updateStatus(id, status) {
    try {
        const response = await fetch(`${API_URL}/reports/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ status })
        });

        if (response.ok) {
            loadDashboard();
            showToast('Status updated', 'success');
        } else {
            showToast('Update failed', 'error');
        }
    } catch (error) {
        console.error('Update error:', error);
    }
}

// Load dashboard if page contains kanban table
if (document.querySelector('.kanban-table')) loadDashboard();

// ========================== ADMIN PROFILE ==========================
const adminProfileForm = document.getElementById('adminProfileForm');

if (adminProfileForm) {
    // Load profile
    async function loadAdminProfile() {
        try {
            const response = await fetch(`${API_URL}/admin/profile`, {
                credentials: 'include'
            });

            if (response.status === 401) {
                localStorage.removeItem('user');
                localStorage.removeItem('role');
                window.location.href = '../login.html';
                return;
            }

            let data = {};
            try {
                data = await response.json();
            } catch (e) {
                console.warn("Invalid JSON");
            }

            document.getElementById('name').value = data.name || '';
            document.getElementById('email').value = data.email || '';
            document.getElementById('phone').value = data.phone || '';
            document.getElementById('address').value = data.address || '';

            // Profile photo
            const preview = document.getElementById('profilePhotoPreview');
            const placeholder = document.getElementById('profilePhotoPlaceholder');

            if (data.profilePhoto) {
                preview.src = `http://localhost:5000/${data.profilePhoto.replace(/\\/g, '/')}`;
                preview.style.display = 'block';
                placeholder.style.display = 'none';
            } else {
                preview.style.display = 'none';
                placeholder.style.display = 'flex';
            }

        } catch (error) {
            console.error('Profile load error:', error);
        }
    }

    loadAdminProfile();

    // Photo preview
    const photoInput = document.getElementById('profilePhoto');
    if (photoInput) {
        photoInput.addEventListener('change', function (e) {
            const file = e.target.files[0];
            if (!file) return;

            if (file.size > 5 * 1024 * 1024) {
                showToast('Max 5MB allowed', 'error');
                e.target.value = '';
                return;
            }

            const reader = new FileReader();
            reader.onload = function (ev) {
                const preview = document.getElementById('profilePhotoPreview');
                const placeholder = document.getElementById('profilePhotoPlaceholder');
                preview.src = ev.target.result;
                preview.style.display = 'block';
                placeholder.style.display = 'none';
            };
            reader.readAsDataURL(file);
        });
    }

    // Submit profile update
    let isSubmitting = false;
    adminProfileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (isSubmitting) return;

        const formData = new FormData();
        formData.append('name', document.getElementById('name').value);
        formData.append('phone', document.getElementById('phone').value);
        formData.append('address', document.getElementById('address').value);

        const file = document.getElementById('profilePhoto').files[0];
        if (file) formData.append('profilePhoto', file);

        const btn = adminProfileForm.querySelector('button[type="submit"]');
        const oldText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        btn.disabled = true;
        isSubmitting = true;

        try {
            const response = await fetch(`${API_URL}/admin/profile`, {
                method: 'PUT',
                credentials: 'include',
                body: formData
            });

            let data = {};
            try {
                data = await response.json();
            } catch (e) {}

            if (response.ok) {
                showToast('Profile updated!', 'success');
                loadAdminProfile();
            } else {
                showToast(data.message || 'Update failed', 'error');
            }

        } catch (error) {
            console.error('Update error:', error);
            showToast('Update failed', 'error');
        } finally {
            btn.innerHTML = oldText;
            btn.disabled = false;
            isSubmitting = false;
            document.getElementById('profilePhoto').value = '';
        }
    });
}
