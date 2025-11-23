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
async function checkAuth() {
    if (!user) {
        window.location.href = '../login.html';
        return false;
    }
    
    try {
        const response = await fetch(`${API_URL}/reporters/profile`, {
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
(async () => {
    if (!user) {
        // No user in localStorage, redirect immediately
        window.location.href = '../login.html';
        return;
    }
    
    // Verify token is still valid with server
    try {
        const response = await fetch(`${API_URL}/reporters/profile`, {
            credentials: 'include',
            method: 'GET'
        });
        
        if (!response.ok && response.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('user');
            localStorage.removeItem('role');
            window.location.href = '../login.html';
        }
    } catch (error) {
        // Network error - don't redirect, let page load
        console.error('Auth verification failed:', error);
    }
})();

// Display User Name
const userNameElement = document.getElementById('userName');
if (userNameElement && user.name) {
    userNameElement.textContent = user.name;
}

// Logout Function
window.logout = function () {
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    showToast('Logged out successfully', 'success');
    setTimeout(() => {
        window.location.href = '../login.html';
    }, 1000);
};

// ==================== REPORT INCIDENT ====================
const reportForm = document.getElementById('reportForm');

if (reportForm) {
    reportForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(reportForm);
        const submitBtn = reportForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;

        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
        submitBtn.disabled = true;

        try {
            const response = await fetch(`${API_URL}/reports/submit-authenticated`, {
                method: 'POST',
                credentials: 'include',
                body: formData
            });

            let data;
            try {
                data = await response.json();
            } catch (e) {
                if (response.status === 401) {
                    localStorage.removeItem('user');
                    localStorage.removeItem('role');
                    showToast('Session expired. Please login again.', 'error');
                    setTimeout(() => {
                        window.location.href = '../login.html';
                    }, 2000);
                    return;
                }
                throw new Error('Invalid response from server');
            }

            if (response.ok) {
                showToast(`Report Submitted Successfully! Tracking ID: ${data.trackingId}`, 'success');
                setTimeout(() => {
                    window.location.href = 'my-reports.html';
                }, 2000);
            } else {
                if (response.status === 401) {
                    localStorage.removeItem('user');
                    localStorage.removeItem('role');
                    showToast('Session expired. Please login again.', 'error');
                    setTimeout(() => {
                        window.location.href = '../login.html';
                    }, 2000);
                    return;
                }
                throw new Error(data.message || 'Submission failed');
            }
        } catch (error) {
            showToast(error.message, 'error');
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });
}

// ==================== PROFILE MANAGEMENT ====================
const profileForm = document.getElementById('profileForm');

if (profileForm) {
    // Load Profile Data
    async function loadProfile() {
        try {
            const response = await fetch(`${API_URL}/reporters/profile`, {
                credentials: 'include'
            });
            
            if (!response.ok) {
                if (response.status === 401) {
                    // Clear invalid session
                    localStorage.removeItem('user');
                    localStorage.removeItem('role');
                    // Only redirect if we're on a protected page
                    if (window.location.pathname.includes('profile.html') || 
                        window.location.pathname.includes('my-reports.html') ||
                        window.location.pathname.includes('report-incident.html')) {
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
    loadProfile();

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
    profileForm.addEventListener('submit', async (e) => {
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

        const submitBtn = profileForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        submitBtn.disabled = true;
        isSubmitting = true;

        try {
            const response = await fetch(`${API_URL}/reporters/profile`, {
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
                await loadProfile();
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

// ==================== MY REPORTS ====================
const reportsList = document.querySelector('.reports-list'); // Assuming a container exists or will be added

if (window.location.pathname.includes('my-reports.html')) {
    async function loadMyReports() {
        try {
            const response = await fetch(`${API_URL}/reports/my-reports`, {
                credentials: 'include'
            });
            
            if (!response.ok) {
                if (response.status === 401) {
                    // Clear invalid session
                    localStorage.removeItem('user');
                    localStorage.removeItem('role');
                    window.location.href = '../login.html';
                    return;
                }
                throw new Error('Failed to load reports');
            }
            
            let reports;
            try {
                reports = await response.json();
            } catch (e) {
                throw new Error('Invalid response from server');
            }

            const container = document.querySelector('main.container');
            // Clear existing dummy content if any, or append
            // For now, let's replace the content or create a list

            let html = '<h2>My Reports</h2><div class="reports-grid">';

            if (reports.length === 0) {
                html += '<p>No reports found.</p>';
            } else {
                reports.forEach(report => {
                    const isWithdrawn = report.withdrawn || report.status === 'Withdrawn';
                    html += `
                        <div class="report-card" style="${isWithdrawn ? 'opacity: 0.6;' : ''}">
                            <div class="report-header">
                                <span class="report-id">${report.trackingId}</span>
                                <span class="badge badge-${isWithdrawn ? 'withdrawn' : report.status.toLowerCase().replace(' ', '-')}">${isWithdrawn ? 'Withdrawn' : report.status}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                                <strong><i class="fas fa-tag" style="color: var(--primary-color);"></i> ${report.type}</strong>
                                <small style="color: var(--text-secondary);"><i class="far fa-calendar-alt"></i> ${new Date(report.date).toLocaleDateString()}</small>
                            </div>
                            <p style="color: var(--text-primary); line-height: 1.5;">${report.description.substring(0, 150)}${report.description.length > 150 ? '...' : ''}</p>
                            ${!isWithdrawn ? `
                            <div style="margin-top: 15px; text-align: right;">
                                <button onclick="withdrawReport('${report._id}')" class="btn btn-outline" style="font-size: 0.9em;">
                                    <i class="fas fa-times-circle"></i> Withdraw Report
                                </button>
                            </div>
                            ` : ''}
                        </div>
                    `;
                });
            }
            html += '</div>';

            // Insert after title
            const h1 = container.querySelector('h1');
            if (h1) h1.insertAdjacentHTML('afterend', html);

        } catch (error) {
            console.error('Error loading reports:', error);
        }
    }
    loadMyReports();
}

// ==================== WITHDRAW REPORT ====================
window.withdrawReport = async function(reportId) {
    if (!confirm('Are you sure you want to withdraw this report? This action cannot be undone, but the report will still be visible to admins.')) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/reports/${reportId}/withdraw`, {
            method: 'PUT',
            credentials: 'include'
        });

        let data;
        try {
            data = await response.json();
        } catch (e) {
            throw new Error('Invalid response from server');
        }

        if (response.ok) {
            showToast('Report withdrawn successfully', 'success');
            // Reload reports
            setTimeout(() => {
                if (window.location.pathname.includes('my-reports.html')) {
                    loadMyReports();
                } else {
                    window.location.reload();
                }
            }, 1000);
        } else {
            throw new Error(data.message || 'Failed to withdraw report');
        }
    } catch (error) {
        showToast(error.message, 'error');
    }
};
