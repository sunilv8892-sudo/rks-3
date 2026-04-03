const page = document.body.dataset.page || 'home';
const navbar = document.querySelector('.navbar');
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');
const defaultImage = 'assets/WhatsApp%20Image%202026-03-23%20at%207.51.36%20PM.jpeg';

const pageContentMap = {
    home: 'content/home.md',
    about: 'content/about.md',
    facilities: 'content/facilities.md',
    terms: 'content/terms.md',
    contact: 'content/contact.md'
};

const githubBackend = {
    repo: 'sunilv8892-sudo/rks-3',
    branch: 'main'
};

const contactRecipient = 'gardentennisclubmysore@gmail.com';

function routeIdentityTokenToAdmin() {
    const hash = window.location.hash || '';
    const search = window.location.search || '';
    const tokenPattern = /(invite_token|recovery_token|confirmation_token|email_change_token)/;
    const hasIdentityToken = tokenPattern.test(hash) || tokenPattern.test(search);

    if (!hasIdentityToken) return;
    if (window.location.pathname === '/admin/index.html') return;

    const suffix = `${search}${hash}`;
    window.location.replace(`/admin/index.html${suffix}`);
}

function setNavbarState() {
    if (!navbar) return;
    navbar.classList.toggle('scrolled', window.scrollY > 24);
}

function initNavbar() {
    setNavbarState();
    window.addEventListener('scroll', setNavbarState, { passive: true });

    if (!hamburger || !navLinks) return;

    const setNavOpen = (isOpen) => {
        navLinks.classList.toggle('is-open', isOpen);
        hamburger.classList.toggle('is-active', isOpen);
        hamburger.setAttribute('aria-expanded', String(isOpen));
        document.body.classList.toggle('nav-open', isOpen);
    };

    hamburger.addEventListener('click', () => {
        const isOpen = !navLinks.classList.contains('is-open');
        setNavOpen(isOpen);
    });

    document.querySelectorAll('.nav-link').forEach((link) => {
        if (link.getAttribute('href') === `${page}.html`) {
            link.classList.add('active');
        }

        link.addEventListener('click', () => {
            setNavOpen(false);
        });
    });

    document.addEventListener('click', (event) => {
        if (!navLinks.classList.contains('is-open')) return;
        const target = event.target;
        if (!(target instanceof Node)) return;

        const clickedNav = navLinks.contains(target);
        const clickedButton = hamburger.contains(target);
        if (!clickedNav && !clickedButton) {
            setNavOpen(false);
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            setNavOpen(false);
        }
    });
}

function initReveal() {
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
}

function initHeroVideo() {
    const mobileQuery = window.matchMedia('(max-width: 768px)');
    const heroVideoDesktop = document.querySelector('.hero-video-desktop');
    const heroVideoMobile = document.querySelector('.hero-video-mobile');
    if (!heroVideoDesktop || !heroVideoMobile) return;

    const syncHeroVideo = () => {
        const activeVideo = mobileQuery.matches ? heroVideoMobile : heroVideoDesktop;
        const inactiveVideo = mobileQuery.matches ? heroVideoDesktop : heroVideoMobile;

        [heroVideoDesktop, heroVideoMobile].forEach((video) => video.pause());
        inactiveVideo.currentTime = 0;

        const playPromise = activeVideo.play();
        if (playPromise && playPromise.catch) playPromise.catch(() => {});
    };

    syncHeroVideo();
    if (mobileQuery.addEventListener) {
        mobileQuery.addEventListener('change', syncHeroVideo);
    } else {
        mobileQuery.addListener(syncHeroVideo);
    }
}

function markdownInline(input) {
    return input
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>');
}

function markdownToHtml(markdown) {
    const lines = markdown.replace(/\r/g, '').split('\n');
    const html = [];
    let listOpen = false;

    const closeList = () => {
        if (listOpen) {
            html.push('</ul>');
            listOpen = false;
        }
    };

    lines.forEach((line) => {
        const trimmed = line.trim();

        if (!trimmed) {
            closeList();
            return;
        }

        if (trimmed.startsWith('### ')) {
            closeList();
            html.push(`<h3>${markdownInline(trimmed.slice(4))}</h3>`);
            return;
        }

        if (trimmed.startsWith('## ')) {
            closeList();
            html.push(`<h2>${markdownInline(trimmed.slice(3))}</h2>`);
            return;
        }

        if (trimmed.startsWith('# ')) {
            closeList();
            html.push(`<h1>${markdownInline(trimmed.slice(2))}</h1>`);
            return;
        }

        if (trimmed.startsWith('- ')) {
            if (!listOpen) {
                html.push('<ul>');
                listOpen = true;
            }
            html.push(`<li>${markdownInline(trimmed.slice(2))}</li>`);
            return;
        }

        closeList();
        html.push(`<p>${markdownInline(trimmed)}</p>`);
    });

    closeList();
    return html.join('');
}

function parseFrontmatter(rawContent) {
    const normalized = rawContent.replace(/\r/g, '');
    if (!normalized.startsWith('---\n')) {
        return { data: {}, body: normalized.trim() };
    }

    const parts = normalized.split('\n---\n');
    if (parts.length < 2) {
        return { data: {}, body: normalized.trim() };
    }

    const yaml = parts[0].replace(/^---\n/, '');
    const body = parts.slice(1).join('\n---\n').trim();
    const data = {};

    yaml.split('\n').forEach((line) => {
        const index = line.indexOf(':');
        if (index === -1) return;
        const key = line.slice(0, index).trim();
        let value = line.slice(index + 1).trim();
        value = value.replace(/^"|"$/g, '').replace(/^'|'$/g, '');
        data[key] = value;
    });

    return { data, body };
}

async function fetchText(path) {
    const response = await fetch(path, { cache: 'no-cache' });
    if (!response.ok) {
        throw new Error(`Failed to load ${path}`);
    }
    return response.text();
}

async function loadPageContent(pageKey) {
    const path = pageContentMap[pageKey];
    if (!path) return;

    const titleEl = document.getElementById('page-title') || document.getElementById('home-title');
    const contentEl = document.getElementById('page-content') || document.getElementById('home-content');

    try {
        const raw = await fetchText(path);
        const { data, body } = parseFrontmatter(raw);
        const bodyHtml = markdownToHtml(body);
        const plainBodyText = body
            .replace(/\r/g, '')
            .split('\n')
            .map((line) => line
                .replace(/^#{1,6}\s*/, '')
                .replace(/^\s*[-*]\s+/, '')
                .replace(/^\s*\d+\.\s+/, '')
                .trim())
            .filter(Boolean)
            .join(' ')
            .trim();

        const firstSentence = plainBodyText.split(/(?<=[.!?])\s+/)[0] || plainBodyText;
        const summaryText = (data.summary || firstSentence || '').trim();

        if (titleEl && data.title) titleEl.textContent = data.title;
        if (contentEl && bodyHtml) {
            if (contentEl.tagName === 'P') {
                contentEl.textContent = summaryText;
            } else {
                contentEl.innerHTML = bodyHtml;
            }
        }

        const termsEl = document.getElementById('terms-content');
        if (termsEl && bodyHtml) termsEl.innerHTML = bodyHtml;

        const aboutEl = document.getElementById('about-extra');
        if (aboutEl && bodyHtml) aboutEl.innerHTML = bodyHtml;

        const detailsEl = document.getElementById('contact-details');
        if (detailsEl && bodyHtml) detailsEl.innerHTML = bodyHtml;
    } catch (error) {
        console.error('Failed to load page content:', error);
    }
}

function renderFacilities(items) {
    const container = document.getElementById('facilities-grid');
    if (!container) return;

    if (!items.length) {
        container.innerHTML = '<div class="loading">No facilities cards yet.</div>';
        return;
    }

    container.innerHTML = items.map((item) => `
        <article class="content-card facility-card reveal">
            <img class="facility-media" src="${item.photo || defaultImage}" alt="${item.title || 'Facility'}">
            <h3>${item.title || 'Facility'}</h3>
            <p class="text-muted facility-text">${item.description || ''}</p>
        </article>
    `).join('');

    initReveal();
}

function renderCommittee(items) {
    const container = document.getElementById('committee-grid');
    if (!container) return;

    if (!items.length) {
        container.innerHTML = '<div class="loading">No committee members yet.</div>';
        return;
    }

    container.innerHTML = items.map((item) => {
        const details = item.bio || item.details || item.description || '';
        return `
        <article class="committee-card reveal">
            <img class="committee-photo" src="${item.photo || defaultImage}" alt="${item.name || 'Committee member'}">
            <div class="committee-footer">
                <span class="member-badge">Committee</span>
                <h3 class="member-name">${item.name || 'Member'}</h3>
                <p class="member-role">${item.role || ''}</p>
                ${details ? `<p class="member-bio">${details}</p>` : ''}
            </div>
        </article>
    `;
    }).join('');

    initReveal();
}

function renderGallery(items) {
    const container = document.getElementById('gallery-grid');
    if (!container) return;

    if (!items.length) {
        container.innerHTML = '<div class="loading">No gallery images yet.</div>';
        return;
    }

    container.innerHTML = items.map((item) => {
        const title = item.title || item.caption || 'Gallery entry';
        const summary = item.title ? (item.caption || '') : '';
        const detailsMarkdown = item.body || item.details || '';
        const detailsHtml = detailsMarkdown ? markdownToHtml(detailsMarkdown) : '';

        return `
        <article class="gallery-card reveal">
            <img class="gallery-media" src="${item.image || defaultImage}" alt="${title}">
            <h3 class="gallery-title">${title}</h3>
            ${summary ? `<p class="gallery-caption">${summary}</p>` : ''}
            ${detailsHtml ? `<div class="gallery-details">${detailsHtml}</div>` : ''}
        </article>
    `;
    }).join('');

    initReveal();
}

async function fetchGithubCollection(folder) {
    const url = `https://api.github.com/repos/${githubBackend.repo}/contents/${folder}?ref=${githubBackend.branch}`;
    const response = await fetch(url, { cache: 'no-cache' });
    if (!response.ok) {
        throw new Error(`Failed to list ${folder} from GitHub`);
    }

    const files = await response.json();
    const markdownFiles = files.filter((item) => item.type === 'file' && item.name.endsWith('.md'));
    const records = await Promise.all(markdownFiles.map(async (item) => {
        const raw = await fetch(item.download_url, { cache: 'no-cache' }).then((res) => res.text());
        const parsed = parseFrontmatter(raw);
        return { id: item.name, ...parsed.data, body: parsed.body };
    }));

    return records.sort((a, b) => a.id.localeCompare(b.id));
}

async function loadCommittee() {
    try {
        const items = await fetchGithubCollection('content/committee');
        renderCommittee(items);
    } catch (error) {
        console.error('Failed to load committee:', error);
        renderCommittee([]);
    }
}

async function loadGallery() {
    try {
        const items = await fetchGithubCollection('content/gallery');
        renderGallery(items);
    } catch (error) {
        console.error('Failed to load gallery:', error);
        renderGallery([]);
    }
}

async function loadFacilities() {
    try {
        const items = await fetchGithubCollection('content/facilities');
        renderFacilities(items);
    } catch (error) {
        console.error('Failed to load facilities:', error);
        renderFacilities([]);
    }
}

function limitItems(items, count) {
    if (!Number.isFinite(count) || count <= 0) return items;
    return items.slice(0, count);
}

function getContactStatusElement(form) {
    let statusEl = form.querySelector('.contact-status') || form.querySelector('#contact-message');
    if (!statusEl) {
        statusEl = document.createElement('p');
        statusEl.className = 'contact-status';
        statusEl.setAttribute('aria-live', 'polite');
        form.appendChild(statusEl);
    }
    return statusEl;
}

function setContactStatus(form, message, isError) {
    const statusEl = getContactStatusElement(form);
    statusEl.textContent = message;
    statusEl.classList.toggle('is-error', Boolean(isError));
}

function initContactForms() {
    const forms = Array.from(document.querySelectorAll('form.contact-form, form#contact-form'));
    if (!forms.length) return;

    forms.forEach((form) => {
        form.addEventListener('submit', async (event) => {
            event.preventDefault();

            const submitButton = form.querySelector('button[type="submit"]');
            const originalLabel = submitButton ? submitButton.textContent : '';

            const formData = new FormData(form);
            const name = String(formData.get('name') || '').trim();
            const email = String(formData.get('email') || '').trim();
            const message = String(formData.get('message') || '').trim();

            if (!name || !email || !message) {
                setContactStatus(form, 'Please fill in name, email, and message.', true);
                return;
            }

            formData.set('_subject', 'Garden Tennis Club Website Enquiry');
            formData.set('_captcha', 'false');
            formData.set('_template', 'table');

            if (submitButton) {
                submitButton.disabled = true;
                submitButton.textContent = 'Sending...';
            }

            try {
                const response = await fetch(`https://formsubmit.co/ajax/${contactRecipient}`, {
                    method: 'POST',
                    headers: {
                        Accept: 'application/json',
                    },
                    body: formData,
                });

                if (!response.ok) {
                    throw new Error(`Mail request failed (${response.status})`);
                }

                setContactStatus(form, 'Enquiry sent successfully. Our team will contact you shortly.', false);
                form.reset();
            } catch (error) {
                console.error('Failed to submit contact form:', error);
                setContactStatus(form, 'Unable to send enquiry right now. Please email gardentennisclubmysore@gmail.com directly.', true);
            } finally {
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.textContent = originalLabel;
                }
            }
        });
    });
}

async function loadCommitteePreview(count) {
    try {
        const items = await fetchGithubCollection('content/committee');
        renderCommittee(limitItems(items, count));
    } catch (error) {
        console.error('Failed to load committee preview:', error);
        renderCommittee([]);
    }
}

async function loadGalleryPreview(count) {
    try {
        const items = await fetchGithubCollection('content/gallery');
        renderGallery(limitItems(items, count));
    } catch (error) {
        console.error('Failed to load gallery preview:', error);
        renderGallery([]);
    }
}

async function boot() {
    routeIdentityTokenToAdmin();
    initNavbar();
    initReveal();
    initHeroVideo();
    initContactForms();

    await loadPageContent(page);
    if (page === 'committee') await loadCommittee();
    if (page === 'gallery') await loadGallery();
    if (page === 'facilities') await loadFacilities();
    if (page === 'home') {
        await Promise.all([
            loadGalleryPreview(6),
            loadCommitteePreview(4)
        ]);
    }
}

boot().catch((error) => {
    console.error('App initialization failed:', error);
});
