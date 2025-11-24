// ==================== BASE CONFIG ====================
const API_URL = 'http://localhost:5000/api';

// ==================== LOAD USER FROM LOCALSTORAGE ====================
let user = null;
try {
    const storedUser = localStorage.getItem('user');
    if (storedUser) user = JSON.parse(storedUser);
} catch (err) {
    console.error("Error loading user:", err);
}

// ======================================================
//                    AUTH CHECK FLOW
// ======================================================
async function checkAuth() {
    if (!user) {
        window.location.href = '../login.html';
        return false;
    }

    try {
        const res = await fetch(`${API_URL}/reporters/profile`, {
            method: 'GET',
            credentials: 'include'
        });

        if (!res.ok && res.status === 401) {
            localStorage.removeItem('user');
            localStorage.removeItem('role');
            window.location.href = '../login.html';
            return false;
        }

        return true;
    } catch (err) {
        console.warn("Auth check failed:", err);
        return true;
    }
}

// Skip auth check if fresh login
const justLoggedIn = sessionStorage.getItem("justLoggedIn");
if (justLoggedIn) {
    sessionStorage.removeItem("justLoggedIn");
    console.log("Fresh login detected — skipping auth validation");
} else {
    // Normal load: check with a delay so UI doesn't freeze
    setTimeout(async () => {
        if (!user) {
            window.location.href = '../login.html';
            return;
        }

        try {
            const res = await fetch(`${API_URL}/reporters/profile`, {
                method: 'GET',
                credentials: 'include'
            });

            if (!res.ok && res.status === 401) {
                localStorage.removeItem('user');
                localStorage.removeItem('role');
                window.location.href = '../login.html';
            }
        } catch (err) {
            console.warn("Background auth check error:", err);
        }
    }, 1500);
}

// Display user name in dashboard
const userNameElement = document.getElementById("userName");
if (userNameElement && user?.name) {
    userNameElement.textContent = user.name;
}

// ========================== LOGOUT =============================
window.logout = function () {
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    showToast("Logged out successfully", "success");
    setTimeout(() => {
        window.location.href = '../login.html';
    }, 1000);
};

// ======================================================
//                 REPORT INCIDENT FORM
// ======================================================
const reportForm = document.getElementById('reportForm');

if (reportForm) {
    reportForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(reportForm);

        const submitBtn = reportForm.querySelector("button[type='submit']");
        const original = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
        submitBtn.disabled = true;

        try {
            const res = await fetch(`${API_URL}/reports/submit-authenticated`, {
                method: 'POST',
                body: formData,
                credentials: 'include'
            });

            const data = await res.json();

            if (res.ok) {
                showToast(`Report Submitted! Tracking ID: ${data.trackingId}`, 'success');
                setTimeout(() => {
                    window.location.href = 'my-reports.html';
                }, 1500);
            } else {
                if (res.status === 401) {
                    localStorage.clear();
                    showToast("Session expired. Login again.", "error");
                    window.location.href = '../login.html';
                    return;
                }
                throw new Error(data.message || "Submission failed");
            }
        } catch (err) {
            showToast(err.message, "error");
        } finally {
            submitBtn.innerHTML = original;
            submitBtn.disabled = false;
        }
    });
}

// ======================================================
//               LOAD USER PROFILE (Profile Page)
// ======================================================
const profileForm = document.getElementById("profileForm");

if (profileForm) {
    (async function loadProfile() {
        try {
            const res = await fetch(`${API_URL}/reporters/profile`, {
                credentials: 'include'
            });

            if (res.status === 401) {
                localStorage.clear();
                window.location.href = '../login.html';
                return;
            }

            const data = await res.json();

            document.getElementById("name").value = data.name || '';
            document.getElementById("email").value = data.email || '';
            document.getElementById("phone").value = data.phone || '';
            document.getElementById("address").value = data.address || '';

            const preview = document.getElementById("profilePhotoPreview");
            const placeholder = document.getElementById("profilePhotoPlaceholder");

            if (data.profilePhoto) {
                preview.src = `http://localhost:5000/${data.profilePhoto}`;
                preview.style.display = 'block';
                placeholder.style.display = 'none';
            } else {
                preview.style.display = 'none';
                placeholder.style.display = 'flex';
            }

        } catch (err) {
            console.error("Profile load error:", err);
        }
    })();

    // Profile photo preview
    const profilePhotoInput = document.getElementById("profilePhoto");
    if (profilePhotoInput) {
        profilePhotoInput.addEventListener('change', function (e) {
            const file = e.target.files[0];
            if (file) {
                if (file.size > 5 * 1024 * 1024) {
                    showToast('Max 5MB allowed', 'error');
                    e.target.value = '';
                    return;
                }
                const reader = new FileReader();
                reader.onload = ev => {
                    const preview = document.getElementById("profilePhotoPreview");
                    const placeholder = document.getElementById("profilePhotoPlaceholder");
                    preview.src = ev.target.result;
                    preview.style.display = "block";
                    placeholder.style.display = "none";
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // Update Profile
    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(profileForm);

        const button = profileForm.querySelector("button[type='submit']");
        const original = button.innerHTML;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        button.disabled = true;

        try {
            const res = await fetch(`${API_URL}/reporters/profile`, {
                method: 'PUT',
                body: formData,
                credentials: 'include'
            });

            const data = await res.json();

            if (res.ok) {
                showToast("Profile updated successfully!", "success");
            } else {
                throw new Error(data.message || "Failed to update profile");
            }
        } catch (err) {
            showToast(err.message, "error");
        } finally {
            button.innerHTML = original;
            button.disabled = false;
        }
    });
}

// ======================================================
//                 LOAD MY REPORTS PAGE
// ======================================================
if (window.location.pathname.includes("my-reports.html")) {
    async function loadMyReports() {
        try {
            const res = await fetch(`${API_URL}/reports/my-reports`, {
                credentials: 'include'
            });

            if (res.status === 401) {
                localStorage.clear();
                window.location.href = '../login.html';
                return;
            }

            const reports = await res.json();
            const container = document.querySelector(".reports-grid");

            if (!container) return;

            container.innerHTML = "";

            if (reports.length === 0) {
                container.innerHTML = "<p>No reports submitted yet.</p>";
                return;
            }

            reports.forEach(report => {
                const isWithdrawn = report.withdrawn || report.status === "Withdrawn";

                container.innerHTML += `
                    <div class="report-card" style="${isWithdrawn ? "opacity:0.6" : ""}">
                        <div class="report-header">
                            <span class="report-id">${report.trackingId}</span>
                            <span class="badge badge-${isWithdrawn ? "withdrawn" : report.status.toLowerCase()}">
                                ${isWithdrawn ? "Withdrawn" : report.status}
                            </span>
                        </div>

                        <strong><i class="fas fa-tag"></i> ${report.type}</strong>
                        <small><i class="far fa-calendar-alt"></i> 
                            ${new Date(report.date).toLocaleDateString()}
                        </small>

                        <p>${report.description.substring(0, 150)}${
                            report.description.length > 150 ? "..." : ""
                        }</p>

                        ${!isWithdrawn ? `
                            <button onclick="withdrawReport('${report._id}')" class="btn btn-outline">
                                <i class="fas fa-times-circle"></i> Withdraw
                            </button>
                        ` : ""}
                    </div>
                `;
            });

        } catch (err) {
            console.error("My reports load error:", err);
        }
    }

    loadMyReports();
}

// ======================================================
//                   WITHDRAW REPORT
// ======================================================
window.withdrawReport = async function (id) {
    if (!confirm("Are you sure you want to withdraw this report?")) return;

    try {
        const res = await fetch(`${API_URL}/reports/${id}/withdraw`, {
            method: 'PUT',
            credentials: 'include'
        });

        const data = await res.json();

        if (res.ok) {
            showToast("Report withdrawn", "success");
            setTimeout(() => window.location.reload(), 800);
        } else {
            throw new Error(data.message || "Withdraw failed");
        }
    } catch (err) {
        showToast(err.message, "error");
    }
};
