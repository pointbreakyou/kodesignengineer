/* lead-magnet.js — modal + email gate for PDF download */
(() => {
    'use strict';

    const modal = document.getElementById('leadModal');
    if (!modal) return;

    const openBtn = document.getElementById('openLeadModal');
    const closeBtn = document.getElementById('leadModalClose');
    const form = document.getElementById('leadForm');
    const status = document.getElementById('leadStatus');

    const PDF_URL = 'assets/lead-magnets/10-errors-metal-design.html';
    const STORAGE_KEY = 'ko_lead_seen_v1';

    function open() {
        modal.classList.add('is-open');
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        modal.querySelector('input[type=email]')?.focus();
    }
    function close() {
        modal.classList.remove('is-open');
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }

    openBtn?.addEventListener('click', open);
    closeBtn?.addEventListener('click', close);
    modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });

    /* Auto-trigger heuristics */
    let triggered = false;
    function trigger(reason) {
        if (triggered || sessionStorage.getItem(STORAGE_KEY)) return;
        triggered = true;
        sessionStorage.setItem(STORAGE_KEY, '1');
        open();
    }
    // 60% scroll
    document.addEventListener('scroll', () => {
        const sp = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
        if (sp > 0.55) trigger('scroll');
    }, { passive: true });
    // exit-intent (desktop)
    document.addEventListener('mouseleave', (e) => {
        if (e.clientY <= 0) trigger('exit');
    });
    // 45s on page
    setTimeout(() => trigger('time'), 45000);

    /* Submit */
    form?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = form.querySelector('input[type=email]').value.trim();
        if (!email || !email.includes('@')) {
            status.className = 'brief__status is-err';
            status.style.display = 'block';
            status.textContent = 'Вкажіть коректний email.';
            return;
        }
        const data = Object.fromEntries(new FormData(form));
        const key = (data.access_key || '').trim();

        // Always offer the PDF, even if Web3Forms not configured
        if (key && key !== 'YOUR_WEB3FORMS_KEY') {
            try {
                await fetch('https://api.web3forms.com/submit', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                    body: JSON.stringify(data),
                });
            } catch (err) { /* non-blocking */ }
        }

        status.className = 'brief__status is-ok';
        status.style.display = 'block';
        status.textContent = '✓ Дякую! Відкриваю PDF у новій вкладці...';
        setTimeout(() => {
            window.open(PDF_URL, '_blank');
            close();
        }, 800);
    });
})();
