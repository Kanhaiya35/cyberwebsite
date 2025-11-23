const API_URL = 'http://localhost:5000/api';

// Check if user is logged in (using localStorage for UI state, but cookies for auth)
let user = null;
try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
        user = JSON.parse(userStr);
    }
} catch (e) {
    console.error('Error parsing user from localStorage:', e);
}

// Verify authentication with server before redirecting
async function checkAdminAuth() {
    const role = localStorage.getItem('role');
    if (!user || role !== 'admin') {
        window.location.href = '../login.html';
        return false;
    }
    
    try {
        const response = await fetch(`${API_URL}/admin/profile`, {
            credentials: 'include',
            method: 'GET'
        });
        
        if (!response.ok && response.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('user');
            localStorage.removeItem('role');
            window.location.href = '../login.html';
            return false;
        }
        return true;
    } catch (error) {
        console.error('Auth check failed:', error);
        // Don't redirect on network errors, let the page load
        return true;
    }
}

// Verify authentication asynchronously (don't block page load)
// Add delay to ensure cookies are set after login redirect
setTimeout(async () => {
    const role = localStorage.getItem('role');
    if (!user || role !== 'admin') {
        // No user or not admin, redirect immediately
        window.location.href = '../login.html';
        return;
    }
    
    // Verify token is still valid with server
    try {
        const response = await fetch(`${API_URL}/admin/profile`, {
            credentials: 'include',
            method: 'GET'
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                // Only redirect on clear 401 Unauthorized
                try {
                    const errorData = await response.json();
                    console.error('Admin auth failed:', errorData.message || 'Unauthorized');
                } catch (e) {
                    console.error('Admin auth failed: Unauthorized');
                }
                localStorage.removeItem('user');
                localStorage.removeItem('role');
                window.location.href = '../login.html';
            } else {
                // Other errors (500, 404, etc.) - don't redirect, just log
                console.warn('Admin profile check returned status:', response.status);
            }
        }
    } catch (error) {
        // Network error - don't redirect, let the page load
        // This could be a temporary network issue
        console.warn('Auth verification network error (non-critical):', error.message);
    }
}, 1000); // 1 second delay to ensure cookies are fully set after redirect

// Logout Function
window.logout = function () {
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    showToast('Logged out successfully', 'success');
    setTimeout(() => {
        window.location.href = '../login.html';
    }, 1000);
};

// ==================== ADMIN DASHBOARD ====================
async function loadDashboard() {
    try {
        const response = await fetch(`${API_URL}/reports`, {
            credentials: 'include'
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                window.location.href = '../login.html';
                return;
            }
            throw new Error('Failed to load reports');
        }
        
        const reports = await response.json();

        const newCol = document.getElementById('col-new');
        const progressCol = document.getElementById('col-in-progress');
        const completedCol = document.getElementById('col-completed');

        // Clear existing
        newCol.innerHTML = '<h3>New / Pending</h3>';
        progressCol.innerHTML = '<h3>In Progress</h3>';
        completedCol.innerHTML = '<h3>Completed</h3>';

        reports.forEach(report => {
            const card = createCaseCard(report);
            const isWithdrawn = report.withdrawn || report.status === 'Withdrawn';

            // Show withdrawn reports in completed column with special styling
            if (isWithdrawn) {
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
        console.error('Error loading dashboard:', error);
        showToast('Failed to load dashboard. Please try again.', 'error');
    }
}

function createCaseCard(report) {
    const div = document.createElement('div');
    div.className = 'case-card';
    div.setAttribute('data-id', report._id);

    const isWithdrawn = report.withdrawn || report.status === 'Withdrawn';
    
    div.innerHTML = `
        <div class="card-header">
            <span class="token">${report.trackingId}</span>
            <div class="actions">
                ${isWithdrawn ? '<span class="badge badge-withdrawn">Withdrawn</span>' : `
                <select onchange="updateStatus('${report._id}', this.value)">
                    <option value="Pending" ${report.status === 'Pending' ? 'selected' : ''}>Pending</option>
                    <option value="In Progress" ${report.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                    <option value="Resolved" ${report.status === 'Resolved' ? 'selected' : ''}>Resolved</option>
                </select>
                `}
            </div>
        </div>
        <div class="type">${report.type}</div>
        <div class="reporter">${report.reporter ? report.reporter.name : 'Unknown'}</div>
        <small>${new Date(report.date).toLocaleDateString()}</small>
    `;

    return div;
}

async function updateStatus(id, status) {
    try {
        const response = await fetch(`${API_URL}/reports/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ status })
        });

        if (response.ok) {
            loadDashboard(); // Reload to move card
            showToast('Status updated successfully', 'success');
        } else {
            showToast('Failed to update status', 'error');
        }
    } catch (error) {
        console.error(error);
    }
}

// Initial Load
if (document.querySelector('.kanban-table')) {
    loadDashboard();
}

// ==================== ADMIN PROFILE MANAGEMENT ====================
const adminProfileForm = document.getElementById('adminProfileForm');

if (adminProfileForm) {
    // Load Profile Data
    async function loadAdminProfile() {
        try {
            const response = await fetch(`${API_URL}/admin/profile`, {
                credentials: 'include'
            });
            
            if (!response.ok) {
                if (response.status === 401) {
                    // Clear invalid session
                    localStorage.removeItem('user');
                    localStorage.removeItem('role');
                    // Only redirect if we're on a protected page
                    if (window.location.pathname.includes('profile.html') || 
                        window.location.pathname.includes('dashboard.html')) {
                        window.location.href = '../login.html';
                    }
                    return;
                }
                throw new Error('Failed to load profile');
            }
            
            let data;
            try {
                data = await response.json();
            } catch (e) {
                throw new Error('Invalid response from server');
            }

            if (response.ok) {
                document.getElementById('name').value = data.name || '';
                document.getElementById('email').value = data.email || '';
                document.getElementById('phone').value = data.phone || '';
                document.getElementById('address').value = data.address || '';
                
                // Handle profile photo
                const photoPreview = document.getElementById('profilePhotoPreview');
                const photoPlaceholder = document.getElementById('profilePhotoPlaceholder');
                if (data.profilePhoto) {
                    photoPreview.src = `http://localhost:5000/${data.profilePhoto}`;
                    photoPreview.style.display = 'block';
                    photoPlaceholder.style.display = 'none';
                } else {
                    photoPreview.style.display = 'none';
                    photoPlaceholder.style.display = 'flex';
                }
            }
        } catch (error) {
            console.error('Error loading profile:', error);
        }
    }
    loadAdminProfile();

    // Profile photo preview
    const profilePhotoInput = document.getElementById('profilePhoto');
    if (profilePhotoInput) {
        profilePhotoInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                if (file.size > 5 * 1024 * 1024) {
                    showToast('File size must be less than 5MB', 'error');
                    e.target.value = '';
                    return;
                }
                const reader = new FileReader();
                reader.onload = function(e) {
                    const photoPreview = document.getElementById('profilePhotoPreview');
                    const photoPlaceholder = document.getElementById('profilePhotoPlaceholder');
                    photoPreview.src = e.target.result;
                    photoPreview.style.display = 'block';
                    photoPlaceholder.style.display = 'none';
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // Update Profile
    let isSubmitting = false;
    adminProfileForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Prevent multiple submissions
        if (isSubmitting) {
            return;
        }

        const name = document.getElementById('name').value;
        const phone = document.getElementById('phone').value;
        const address = document.getElementById('address').value;
        const profilePhoto = document.getElementById('profilePhoto').files[0];

        const formData = new FormData();
        formData.append('name', name);
        formData.append('phone', phone);
        formData.append('address', address);
        if (profilePhoto) {
            formData.append('profilePhoto', profilePhoto);
        }

        const submitBtn = adminProfileForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        submitBtn.disabled = true;
        isSubmitting = true;

        try {
            const response = await fetch(`${API_URL}/admin/profile`, {
                method: 'PUT',
                credentials: 'include',
                body: formData
            });

            let data;
            try {
                data = await response.json();
            } catch (e) {
                throw new Error('Invalid response from server');
            }

            if (response.ok) {
                showToast('Profile updated successfully!', 'success');
                
                // Update profile photo preview if a new photo was uploaded
                if (profilePhoto) {
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        const photoPreview = document.getElementById('profilePhotoPreview');
                        const photoPlaceholder = document.getElementById('profilePhotoPlaceholder');
                        photoPreview.src = e.target.result;
                        photoPreview.style.display = 'block';
                        photoPlaceholder.style.display = 'none';
                    };
                    reader.readAsDataURL(profilePhoto);
                }
                
                // Clear file input
                document.getElementById('profilePhoto').value = '';
                
                // Prevent form resubmission warning
                if (window.history.replaceState) {
                    window.history.replaceState(null, '', window.location.href);
                }
                
                // Reload profile data from server to get updated photo URL
                await loadAdminProfile();
            } else {
                throw new Error(data.message || 'Update failed');
            }
        } catch (error) {
            showToast(error.message, 'error');
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
            isSubmitting = false;
        }
    });
}
