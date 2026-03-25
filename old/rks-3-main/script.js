const navbar = document.querySelector('.navbar');
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');
const contactForm = document.querySelector('.contact-form');

const setNavbarState = () => {
    if (!navbar) return;
    navbar.classList.toggle('scrolled', window.scrollY > 24);
};

setNavbarState();
window.addEventListener('scroll', setNavbarState, { passive: true });

if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
        const isOpen = navLinks.classList.toggle('is-open');
        hamburger.classList.toggle('is-active', isOpen);
        hamburger.setAttribute('aria-expanded', String(isOpen));
    });

    document.querySelectorAll('.nav-link').forEach((link) => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('is-open');
            hamburger.classList.remove('is-active');
            hamburger.setAttribute('aria-expanded', 'false');
        });
    });
}

const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            revealObserver.unobserve(entry.target);
        }
    });
}, {
    threshold: 0.16,
    rootMargin: '0px 0px -40px 0px'
});

document.querySelectorAll('.reveal').forEach((element) => {
    revealObserver.observe(element);
});

const mobileQuery = window.matchMedia('(max-width: 768px)');
const heroVideoDesktop = document.querySelector('.hero-video-desktop');
const heroVideoMobile = document.querySelector('.hero-video-mobile');

const syncHeroVideo = () => {
    const activeVideo = mobileQuery.matches ? heroVideoMobile : heroVideoDesktop;
    const inactiveVideo = mobileQuery.matches ? heroVideoDesktop : heroVideoMobile;

    [heroVideoDesktop, heroVideoMobile].forEach((video) => {
        if (!video) return;
        video.pause();
    });

    if (inactiveVideo) {
        inactiveVideo.currentTime = 0;
    }

    if (activeVideo) {
        const playPromise = activeVideo.play();
        if (playPromise && playPromise.catch) {
            playPromise.catch(() => {});
        }
    }
};

syncHeroVideo();
if (mobileQuery.addEventListener) {
    mobileQuery.addEventListener('change', syncHeroVideo);
} else {
    mobileQuery.addListener(syncHeroVideo);
}

if (contactForm) {
    contactForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const button = contactForm.querySelector('button');
        if (!button) return;

        const originalText = button.textContent;
        button.textContent = 'Enquiry Sent';
        button.disabled = true;

        window.setTimeout(() => {
            contactForm.reset();
            button.textContent = originalText;
            button.disabled = false;
        }, 1800);
    });
}
