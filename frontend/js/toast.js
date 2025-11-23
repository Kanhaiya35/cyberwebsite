// Toast Notification System
const Toast = {
    init() {
        if (!document.getElementById('toast-container')) {
            const container = document.createElement('div');
            container.id = 'toast-container';
            document.body.appendChild(container);
        }
    },

    show(message, type = 'success') {
        this.init();

        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        const icon = type === 'success' ? 'fa-check-circle' : 'fa-times-circle';

        toast.innerHTML = `
            <i class="fas ${icon}"></i>
            <span>${message}</span>
        `;

        container.appendChild(toast);

        // Trigger reflow
        toast.offsetHeight;

        // Show
        setTimeout(() => toast.classList.add('show'), 10);

        // Remove after 3 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                container.removeChild(toast);
            }, 300);
        }, 3000);
    }
};

// Expose globally
window.showToast = (message, type) => Toast.show(message, type);
