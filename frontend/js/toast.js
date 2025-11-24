// ====================== TOAST NOTIFICATION SYSTEM ======================
const Toast = {
    init() {
        if (!document.getElementById("toast-container")) {
            const container = document.createElement("div");
            container.id = "toast-container";

            // Mobile-friendly container
            container.style.position = "fixed";
            container.style.top = "20px";
            container.style.right = "20px";
            container.style.zIndex = "999999";
            container.style.display = "flex";
            container.style.flexDirection = "column";
            container.style.gap = "12px";

            document.body.appendChild(container);
        }
    },

    show(message, type = "success") {
        this.init();

        const container = document.getElementById("toast-container");
        const toast = document.createElement("div");
        toast.className = `toast toast-${type}`;
        toast.setAttribute("role", "alert");

        const icons = {
            success: "fa-check-circle",
            error: "fa-times-circle",
            warning: "fa-exclamation-triangle",
            info: "fa-info-circle"
        };

        toast.innerHTML = `
            <i class="fas ${icons[type] || icons.info}"></i>
            <span>${message}</span>
        `;

        // Toast styling
        Object.assign(toast.style, {
            padding: "12px 18px",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontSize: "15px",
            color: "white",
            background: type === "success"
                ? "#16a34a"
                : type === "error"
                ? "#dc2626"
                : type === "warning"
                ? "#d97706"
                : "#2563eb",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            opacity: "0",
            transform: "translateX(40px)",
            transition: "all .35s ease",
            cursor: "pointer"
        });

        // Click to dismiss
        toast.addEventListener("click", () => {
            toast.classList.remove("show");
            setTimeout(() => container.removeChild(toast), 300);
        });

        container.appendChild(toast);

        // Trigger animation
        requestAnimationFrame(() => {
            toast.style.opacity = "1";
            toast.style.transform = "translateX(0)";
        });

        // Auto remove
        setTimeout(() => {
            toast.style.opacity = "0";
            toast.style.transform = "translateX(40px)";
            setTimeout(() => {
                if (container.contains(toast)) container.removeChild(toast);
            }, 300);
        }, 3000);
    }
};

// Global function
window.showToast = (message, type = "success") => Toast.show(message, type);
