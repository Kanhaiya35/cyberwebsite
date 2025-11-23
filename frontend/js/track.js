const API_URL = 'http://localhost:5000/api';

const trackForm = document.getElementById('trackForm');

if (trackForm) {
    trackForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const input = trackForm.querySelector('input');
        const trackingId = input.value.trim();
        const btn = trackForm.querySelector('button');

        if (!trackingId) return;

        btn.textContent = 'Searching...';
        btn.disabled = true;

        try {
            const response = await fetch(`${API_URL}/reports/track/${trackingId}`);
            
            let data;
            try {
                data = await response.json();
            } catch (e) {
                throw new Error('Invalid response from server');
            }

            if (response.ok) {
                document.getElementById('trackResult').style.display = 'block';
                document.getElementById('statusBadge').textContent = data.status;
                document.getElementById('statusBadge').className = `badge badge-${data.status.toLowerCase().replace(' ', '-')}`;
                document.getElementById('resultId').textContent = data.trackingId;
                document.getElementById('resultType').textContent = data.type;
                document.getElementById('resultDate').textContent = new Date(data.date).toLocaleDateString();
                document.getElementById('resultUpdated').textContent = new Date(data.updatedAt).toLocaleDateString();
            } else {
                alert('Report not found. Please check the ID.');
                document.getElementById('trackResult').style.display = 'none';
            }
        } catch (error) {
            console.error(error);
            alert('Error tracking case');
        } finally {
            btn.textContent = 'Track';
            btn.disabled = false;
        }
    });
}
