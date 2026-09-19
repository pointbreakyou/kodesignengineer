/* form-brief.js — brief form submission via FormSubmit (delivers to kostik.bk.ua@gmail.com) */
(() => {
    'use strict';

    const form = document.getElementById('briefForm');
    if (!form) return;

    const status = document.getElementById('briefStatus');
    const submitBtn = document.getElementById('briefSubmit');
    const ENDPOINT = 'https://formsubmit.co/ajax/kostik.bk.ua@gmail.com';

    /* Multi-select chips */
    form.querySelectorAll('[data-chips]').forEach(group => {
        const name = group.dataset.chips;
        const hidden = form.querySelector(`#brief-${name === 'projectType' ? 'type' : 'scope'}`);
        const selected = new Set();
        group.querySelectorAll('.brief__chip').forEach(chip => {
            chip.addEventListener('click', () => {
                const val = chip.dataset.value;
                if (selected.has(val)) { selected.delete(val); chip.classList.remove('is-active'); }
                else { selected.add(val); chip.classList.add('is-active'); }
                if (hidden) hidden.value = [...selected].join(', ');
            });
        });
    });

    function setStatus(msg, kind) {
        if (!status) return;
        status.textContent = msg;
        status.className = 'brief__status';
        if (kind) status.classList.add(`is-${kind}`);
        status.style.display = 'block';
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!form.checkValidity()) {
            setStatus('Заповніть обов\'язкові поля (ім\'я, контакт, опис).', 'err');
            return;
        }

        const data = Object.fromEntries(new FormData(form));
        if (data._honey) return; // honeypot

        const payload = {
            _subject: `Новий бриф з overchenko.engineering · ${data.name || 'без імені'}`,
            _template: 'table',
            _captcha: 'false',
            'Імʼя': data.name || '',
            'Контакт': data.contact || '',
            'Бюджет': data.budget || '—',
            'Тип виробу': data.projectType || '—',
            'Що потрібно': data.scope || '—',
            'Опис проєкту': data.message || '',
            'Джерело': 'overchenko.engineering / brief form',
        };

        const original = submitBtn?.innerHTML;
        if (submitBtn) {
            submitBtn.disabled = true;
            const lbl = submitBtn.querySelector('span');
            if (lbl) lbl.textContent = 'НАДСИЛАННЯ...';
        }
        setStatus('Надсилаю бриф...', null);

        try {
            const res = await fetch(ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify(payload),
            });
            const json = await res.json().catch(() => ({}));
            if (res.ok && (json.success === 'true' || json.success === true)) {
                setStatus('✓ Бриф отримано. Відповім протягом 24 годин на вказаний контакт.', 'ok');
                form.reset();
                form.querySelectorAll('.brief__chip.is-active').forEach(c => c.classList.remove('is-active'));
            } else if (res.ok) {
                setStatus('✓ Бриф надіслано. Якщо це перший лист — підтвердіть активацію в листі від FormSubmit (одноразово).', 'ok');
                form.reset();
                form.querySelectorAll('.brief__chip.is-active').forEach(c => c.classList.remove('is-active'));
            } else {
                throw new Error('HTTP ' + res.status);
            }
        } catch (err) {
            // Fallback: open Telegram with prefilled message
            const summary = `Бриф з overchenko.engineering\n\nІмʼя: ${data.name}\nКонтакт: ${data.contact}\nБюджет: ${data.budget || '—'}\nТип: ${data.projectType || '—'}\nОбсяг: ${data.scope || '—'}\n\nОпис:\n${data.message}`;
            const tgUrl = `https://t.me/overchenkoooo?text=${encodeURIComponent(summary)}`;
            window.open(tgUrl, '_blank');
            setStatus('Збій звʼязку. Відкрив Telegram з готовим повідомленням — або напишіть на kostik.bk.ua@gmail.com.', 'err');
        } finally {
            if (submitBtn) { submitBtn.disabled = false; if (original) submitBtn.innerHTML = original; }
        }
    });
})();
