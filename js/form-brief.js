/* form-brief.js — brief form submission via Web3Forms */
(() => {
    'use strict';

    const form = document.getElementById('briefForm');
    if (!form) return;

    const status = document.getElementById('briefStatus');
    const submitBtn = document.getElementById('briefSubmit');

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
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!form.checkValidity()) {
            setStatus('Заповніть обов\'язкові поля (ім\'я, контакт, опис).', 'err');
            return;
        }

        const data = Object.fromEntries(new FormData(form));
        if (data.botcheck) return; // honeypot

        // Detect if access_key is the placeholder — fall back to mailto/Telegram
        const key = (data.access_key || '').trim();
        if (!key || key === 'YOUR_WEB3FORMS_KEY') {
            // Fallback: open Telegram and prefill mailto in a new tab
            const summary = `Бриф з kodesignengineer.com\n\nІм'я: ${data.name}\nКонтакт: ${data.contact}\nБюджет: ${data.budget || '—'}\nТип: ${data.projectType || '—'}\nОбсяг: ${data.scope || '—'}\n\nОпис:\n${data.message}`;
            const tgUrl = `https://t.me/overchenkoooo?text=${encodeURIComponent(summary)}`;
            window.open(tgUrl, '_blank');
            setStatus('Відкрито Telegram із готовим повідомленням. Залишилось натиснути «Send».', 'ok');
            return;
        }

        const original = submitBtn?.innerHTML;
        if (submitBtn) { submitBtn.disabled = true; submitBtn.querySelector('span').textContent = 'НАДСИЛАННЯ...'; }
        setStatus('Надсилаю бриф...', null);
        status?.classList.remove('is-err', 'is-ok');
        status.style.display = 'block';

        try {
            const res = await fetch('https://api.web3forms.com/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify(data),
            });
            const json = await res.json();
            if (json.success) {
                setStatus('✓ Бриф отримано. Відповім протягом 24 годин на вказаний контакт.', 'ok');
                form.reset();
                form.querySelectorAll('.brief__chip.is-active').forEach(c => c.classList.remove('is-active'));
            } else {
                setStatus('Помилка надсилання. Напишіть, будь ласка, у Telegram @overchenkoooo.', 'err');
            }
        } catch (err) {
            setStatus('Збій звʼязку. Напишіть у Telegram @overchenkoooo або на email.', 'err');
        } finally {
            if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = original; }
        }
    });
})();
