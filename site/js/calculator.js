/* calculator.js — interactive project configurator (no pricing, brief pre-fill) */
(() => {
    'use strict';

    const wrap = document.getElementById('calculator');
    if (!wrap) return;

    const typeChips = wrap.querySelectorAll('#calcType .calc__chip');
    const scopeChips = wrap.querySelectorAll('#calcScope .calc__chip');
    const complexity = document.getElementById('calcComplexity');
    const urgency = document.getElementById('calcUrgency');

    const daysOut = document.getElementById('calcDays');
    const typeOut = document.getElementById('calcTypeOut');
    const compOut = document.getElementById('calcCompOut');
    const scopeOut = document.getElementById('calcScopeOut');
    const urgOut = document.getElementById('calcUrgOut');

    const typeLabel = document.getElementById('calcTypeLabel');
    const compLabel = document.getElementById('calcComplexityLabel');
    const scopeLabel = document.getElementById('calcScopeLabel');
    const urgLabel = document.getElementById('calcUrgencyLabel');

    const state = {
        type: 'sport', typeLabel: 'Спорт', typeMult: 1.0,
        complexity: 3,
        scope: 'full', scopeLabel: 'Модель + КД', scopeMult: 2.6,
        urgency: 1,
    };

    const compNames = ['', 'Дуже проста', 'Проста', 'Середня', 'Складна', 'Дуже складна'];
    const urgData = [
        null,
        { label: 'Стандарт', days: '7-14 ДНІВ' },
        { label: 'Пріоритет', days: '3-5 ДНІВ' },
        { label: 'Терміново', days: '24-48 ГОД' },
    ];

    function setActive(group, btn) {
        group.forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');
    }

    function compute() {
        const urg = urgData[state.urgency];
        return { days: urg.days, urgLabel: urg.label };
    }

    function render() {
        const r = compute();
        if (daysOut) daysOut.textContent = r.days;
        if (typeOut) typeOut.textContent = state.typeLabel;
        if (compOut) compOut.textContent = `${state.complexity}/5`;
        if (scopeOut) scopeOut.textContent = state.scopeLabel;
        if (urgOut) urgOut.textContent = r.urgLabel;
        if (typeLabel) typeLabel.textContent = state.typeLabel;
        if (compLabel) compLabel.textContent = `${compNames[state.complexity]} (${state.complexity}/5)`;
        if (scopeLabel) scopeLabel.textContent = state.scopeLabel;
        if (urgLabel) urgLabel.textContent = r.urgLabel;
    }

    typeChips.forEach(btn => {
        btn.addEventListener('click', () => {
            setActive(typeChips, btn);
            state.type = btn.dataset.value;
            state.typeLabel = btn.firstChild.textContent.trim();
            state.typeMult = parseFloat(btn.dataset.mult);
            render();
        });
    });

    scopeChips.forEach(btn => {
        btn.addEventListener('click', () => {
            setActive(scopeChips, btn);
            state.scope = btn.dataset.value;
            state.scopeLabel = btn.firstChild.textContent.trim();
            state.scopeMult = parseFloat(btn.dataset.mult);
            render();
        });
    });

    complexity?.addEventListener('input', (e) => {
        state.complexity = parseInt(e.target.value, 10);
        render();
    });

    urgency?.addEventListener('input', (e) => {
        state.urgency = parseInt(e.target.value, 10);
        render();
    });

    /* Pre-fill brief form when scrolling to it after using calc */
    document.querySelector('#calcCta, #calc .btn--primary')?.addEventListener('click', () => {
        const r = compute();
        const msg = document.getElementById('brief-msg');
        if (msg && !msg.value.trim()) {
            msg.value = `Параметри з конфігуратора:\n— Тип: ${state.typeLabel}\n— Складність: ${state.complexity}/5\n— Обсяг: ${state.scopeLabel}\n— Терміновість: ${r.urgLabel}\n\nДеталі проєкту: `;
        }
    });

    render();
})();
