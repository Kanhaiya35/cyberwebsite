// ==================== CONFIG ====================
const API_STATS = 'http://localhost:5000/api/reports/stats';

// ==================== MOBILE MENU TOGGLE ====================
const mobileMenu = document.getElementById('mobile-menu');
const navLinks = document.querySelector('.nav-links');

if (mobileMenu && navLinks) {
    mobileMenu.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        const icon = mobileMenu.querySelector('i');
        if (icon) icon.classList.toggle('fa-times');
    });
}

// ==================== SMOOTH SCROLL ====================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href === '#' || !document.querySelector(href)) return;
        e.preventDefault();
        document.querySelector(href).scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    });
});

// ==================== STATS FETCH ====================
async function fetchStats() {
    try {
        const resp = await fetch(API_STATS, { cache: 'no-store' });
        if (!resp.ok) throw new Error("Stats API failed");

        const data = await resp.json();
        return {
            users: 12000, // static because backend doesn't return users
            reported: data.total || 0,
            resolved: data.resolved || 0,
            response_hours: data.avgResponseTime || 48
        };
    } catch (err) {
        console.warn('Stats fetch failed. Using defaults.', err);
        return {
            users: 15420,
            reported: 8754,
            resolved: 6892,
            response_hours: 48
        };
    }
}

// ==================== COUNTER ANIMATION ====================
const counters = document.querySelectorAll('.counter');

function animateCounter(counter, target) {
    let start = 0;
    const duration = 1500;
    const step = Math.max(10, Math.floor(duration / target));

    const interval = setInterval(() => {
        start += Math.ceil(target / (duration / step));
        if (start >= target) {
            counter.innerText = target.toLocaleString();
            clearInterval(interval);
        } else {
            counter.innerText = start.toLocaleString();
        }
    }, step);
}

const counterObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const counter = entry.target;
            const target = Number(counter.dataset.target) || 0;
            animateCounter(counter, target);

            counterObserver.unobserve(counter);
        }
    });
}, { threshold: 0.4 });

function observeCounters() {
    counters.forEach(c => {
        c.innerText = "0";
        counterObserver.observe(c);
    });
}

// ==================== NAVBAR SHADOW EFFECT ====================
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;

    navbar.style.boxShadow = window.scrollY > 50
        ? '0 8px 30px rgba(0, 0, 0, 0.12)'
        : '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
});

// ==================== INIT ====================
document.addEventListener('DOMContentLoaded', async () => {
    const stats = await fetchStats();

    const counterList = document.querySelectorAll('.counter');

    if (counterList.length >= 4) {
        counterList[0].setAttribute('data-target', stats.users);
        counterList[1].setAttribute('data-target', stats.reported);
        counterList[2].setAttribute('data-target', stats.resolved);
        counterList[3].setAttribute('data-target', stats.response_hours);
    }

    observeCounters();
});
