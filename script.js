// Register GSAP ScrollTrigger
gsap.registerPlugin(ScrollTrigger);

// --- Custom Cursor ---
const cursor = document.querySelector('.cursor');
const follower = document.querySelector('.cursor-follower');
const linksAndButtons = document.querySelectorAll('a, button');

let mouseX = 0, mouseY = 0;
let cursorX = 0, cursorY = 0;
let followerX = 0, followerY = 0;

document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
});

gsap.ticker.add(() => {
    // Smoother interpolation for cursor
    cursorX += (mouseX - cursorX) * 0.2;
    cursorY += (mouseY - cursorY) * 0.2;
    followerX += (mouseX - followerX) * 0.1;
    followerY += (mouseY - followerY) * 0.1;

    gsap.set(cursor, { x: cursorX, y: cursorY });
    gsap.set(follower, { x: followerX, y: followerY });
});

linksAndButtons.forEach(el => {
    el.addEventListener('mouseenter', () => cursor.classList.add('hovered'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('hovered'));
});

// Disable custom cursor on touch devices (fallback)
if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
    document.body.classList.add('touch');
    if (cursor) cursor.style.display = 'none';
    if (follower) follower.style.display = 'none';
}

// --- Magnetic Buttons ---
const magneticBtns = document.querySelectorAll('.magnetic-btn');

magneticBtns.forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        
        gsap.to(btn, {
            x: x * 0.4,
            y: y * 0.4,
            duration: 0.4,
            ease: "power3.out"
        });
    });

    btn.addEventListener('mouseleave', () => {
        gsap.to(btn, {
            x: 0,
            y: 0,
            duration: 0.7,
            ease: "elastic.out(1, 0.3)"
        });
    });
});

// --- Hero Entrance Animation ---
const tl = gsap.timeline();

tl.from(".navbar", {
    y: -100,
    opacity: 0,
    duration: 1,
    ease: "power4.out"
})
.from(".glitch", {
    y: 100,
    opacity: 0,
    duration: 1.2,
    stagger: 0.2,
    ease: "power4.out",
    clipPath: "polygon(0 0, 100% 0, 100% 0, 0 0)"
}, "-=0.5")
.to(".glitch", {
    clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)",
    duration: 0.5
}, "-=1.2")
.to(".hero-subtext", {
    opacity: 1,
    y: -20,
    duration: 1,
    ease: "power3.out"
}, "-=0.8")
.from(".hero .cta-btn", {
    scale: 0,
    opacity: 0,
    duration: 0.8,
    ease: "back.out(1.7)"
}, "-=0.6");

// --- Scroll Animations ---

// Text Reveal
gsap.utils.toArray(".reveal-text").forEach(text => {
    gsap.from(text, {
        scrollTrigger: {
            trigger: text,
            start: "top 80%",
        },
        y: 100,
        opacity: 0,
        rotationX: -90,
        transformOrigin: "bottom center",
        duration: 1,
        ease: "power4.out"
    });
});

// Staggered Cards
gsap.from(".stagger-card", {
    scrollTrigger: {
        trigger: ".about-grid",
        start: "top 70%",
    },
    y: 100,
    opacity: 0,
    stagger: 0.2,
    duration: 1,
    ease: "power4.out"
});

// Parallax Text
gsap.to(".parallax-text", {
    scrollTrigger: {
        trigger: ".parallax-section",
        start: "top bottom",
        end: "bottom top",
        scrub: 1,
    },
    xPercent: -50,
    ease: "none"
});

// Background Color Shift on Scroll
gsap.to("body", {
    scrollTrigger: {
        trigger: ".join-section",
        start: "top 50%",
        end: "bottom bottom",
        scrub: 1,
    },
    backgroundColor: "#050806", // Darker shift
    ease: "none"
});

// --- Responsive Nav Toggle ---
const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');

if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
        navLinks.classList.toggle('open');
        navToggle.classList.toggle('active');
    });
    // Close menu when clicking a link (mobile)
    navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
        navLinks.classList.remove('open');
        navToggle.classList.remove('active');
    }));
}