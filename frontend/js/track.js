const API_URL = 'http://localhost:5000/api';

const trackForm = document.getElementById('trackForm');

if (trackForm) {
    trackForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const input = trackForm.querySelector('input');
        const trackingId = input.value.trim().toUpperCase();
        const btn = trackForm.querySelector('button');

        // Basic validation
        if (!trackingId) {
            showToast("Please enter a tracking ID", "error");
            return;
        }

        // Optional: format check (CYB-YYYYMMDD-XXXX)
        const pattern = /^CYB-\d{8}-\d{4}$/;
        if (!pattern.test(trackingId)) {
            showToast("Invalid Tracking ID format", "warning");
        }

        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Searching...';
        btn.disabled = true;

        try {
            const response = await fetch(`${API_URL}/reports/track/${trackingId}`);

            let data;
            try {
                data = await response.json();
            } catch (e) {
                throw new Error("Invalid server response");
            }

            const resultBox = document.getElementById('trackResult');

            if (response.ok) {
                // Show result box
                resultBox.style.display = "block";

                // Fill data
                document.getElementById('statusBadge').textContent = data.status;
                document.getElementById('statusBadge').className =
                    `badge badge-${data.status.toLowerCase().replace(' ', '-')}`;

                document.getElementById('resultId').textContent = data.trackingId;
                document.getElementById('resultType').textContent = data.type;
                document.getElementById('resultDate').textContent =
                    new Date(data.date).toLocaleDateString();

                document.getElementById('resultUpdated').textContent =
                    new Date(data.updatedAt).toLocaleDateString();

                // Auto-scroll to result
                resultBox.scrollIntoView({ behavior: "smooth", block: "start" });

            } else {
                showToast("Report not found. Please check the Tracking ID.", "error");
                resultBox.style.display = "none";
            }

        } catch (error) {
            console.error(error);
            showToast("Something went wrong while tracking the case.", "error");
        } finally {
            btn.innerHTML = 'Track';
            btn.disabled = false;
        }
    });
}
