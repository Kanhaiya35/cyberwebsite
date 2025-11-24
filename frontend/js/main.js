// ==================== CONFIG ====================
const STATS_API_URL = '/data/stats.json'; // place a data/stats.json file OR point to a real API endpoint

// ==================== MOBILE MENU TOGGLE ====================
const mobileMenu = document.getElementById('mobile-menu');
const navLinks = document.querySelector('.nav-links');

if (mobileMenu) {
    mobileMenu.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        const icon = mobileMenu.querySelector('i');
        if (icon) icon.classList.toggle('fa-times');
    });
}

// ==================== SMOOTH SCROLL ====================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        // allow links to other pages
        if (this.getAttribute('href') === '#') return;
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// ==================== STATS FETCH (with fallback) ====================
async function fetchStats() {
    try {
        const resp = await fetch(STATS_API_URL, { cache: 'no-store' });
        if (!resp.ok) throw new Error('Network response was not ok');
        const json = await resp.json();
        return {
            users: Number(json.users || json.registered || 0),
            reported: Number(json.reported || json.cases_reported || 0),
            resolved: Number(json.resolved || json.cases_resolved || 0),
            response_hours: Number(json.response_hours || json.avg_response || 0)
        };
    } catch (err) {
        console.warn('Stats fetch failed, using fallback values.', err);
        return {
            users: 15420,
            reported: 8754,
            resolved: 6892,
            response_hours: 48
        };
    }
}

// ==================== COUNTER ANIMATION (observer-driven) ====================
const counters = document.querySelectorAll('.counter');

const speed = 200;

const animateCounterValue = (counter, target) => {
    const stepTime = Math.max(10, Math.floor(1400 / Math.max(1, target)));
    let current = 0;
    const inc = Math.ceil(target / (1400 / stepTime));
    const timer = setInterval(() => {
        current += inc;
        if (current >= target) {
            counter.innerText = target.toLocaleString();
            clearInterval(timer);
        } else {
            counter.innerText = current.toLocaleString();
        }
    }, stepTime);
};

const observerOptions = { threshold: 0.4, rootMargin: '0px' };

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const counter = entry.target;
            const target = Number(counter.getAttribute('data-target')) || 0;
            animateCounterValue(counter, target);
            observer.unobserve(counter);
        }
    });
}, observerOptions);

// attach observer to counters AFTER we set their data-targets
function observeCounters() {
    document.querySelectorAll('.counter').forEach(c => {
        // reset text to 0 before animating
        c.innerText = '0';
        observer.observe(c);
    });
}

// ==================== NAVBAR SCROLL EFFECT ====================
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;
    if (window.scrollY > 50) {
        navbar.style.boxShadow = '0 8px 30px rgba(0, 0, 0, 0.12)';
    } else {
        navbar.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
    }
});

// ==================== INIT: load stats THEN observe counters ====================
document.addEventListener('DOMContentLoaded', async () => {
    // set initial counters to 0 in DOM
    document.querySelectorAll('.counter').forEach(c => c.innerText = '0');

    const stats = await fetchStats();

    // pick counters in order (Registered Users, Cases Reported, Cases Resolved, Avg Response)
    const counterEls = document.querySelectorAll('.counter');
    if (counterEls.length >= 4) {
        counterEls[0].setAttribute('data-target', stats.users);
        counterEls[1].setAttribute('data-target', stats.reported);
        counterEls[2].setAttribute('data-target', stats.resolved);
        counterEls[3].setAttribute('data-target', stats.response_hours);
    } else {
        // generic fill: assign best-effort
        if (counterEls[0]) counterEls[0].setAttribute('data-target', stats.users || 0);
    }

    // now start observing/animating
    observeCounters();
});
