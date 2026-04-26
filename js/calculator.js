/* calculator.js — interactive price estimator */
(() => {
    'use strict';

    const wrap = document.getElementById('calculator');
    if (!wrap) return;

    const BASE_MIN = 80;     // base USD floor for "model only, simple, sport"
    const BASE_MAX = 180;    // base USD ceiling

    const typeChips = wrap.querySelectorAll('#calcType .calc__chip');
    const scopeChips = wrap.querySelectorAll('#calcScope .calc__chip');
    const complexity = document.getElementById('calcComplexity');
    const urgency = document.getElementById('calcUrgency');

    const minOut = document.getElementById('calcMin');
    const maxOut = document.getElementById('calcMax');
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
        { label: 'Стандарт', mult: 1.0, days: '7-14 ДНІВ' },
        { label: 'Пріоритет', mult: 1.3, days: '3-5 ДНІВ' },
        { label: 'Терміново', mult: 1.6, days: '24-48 ГОД' },
    ];

    function setActive(group, btn) {
        group.forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');
    }

    function compute() {
        const compFactor = 0.6 + (state.complexity - 1) * 0.45; // 0.6 .. 2.4
        const urg = urgData[state.urgency];
        const min = Math.round(BASE_MIN * state.typeMult * compFactor * state.scopeMult * urg.mult);
        const max = Math.round(BASE_MAX * state.typeMult * compFactor * state.scopeMult * urg.mult);
        return { min, max, days: urg.days, urgMult: urg.mult, urgLabel: urg.label, compFactor };
    }

    function render() {
        const r = compute();
        if (minOut) minOut.textContent = r.min;
        if (maxOut) maxOut.textContent = r.max;
        if (daysOut) daysOut.textContent = r.days;
        if (typeOut) typeOut.textContent = state.typeLabel;
        if (compOut) compOut.textContent = `${state.complexity}/5`;
        if (scopeOut) scopeOut.textContent = state.scopeLabel;
        if (urgOut) urgOut.textContent = `×${r.urgMult.toFixed(1)}`;
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
            msg.value = `Прорахунок з калькулятора:\n— Тип: ${state.typeLabel}\n— Складність: ${state.complexity}/5\n— Обсяг: ${state.scopeLabel}\n— Терміновість: ${r.urgLabel}\n— Орієнтовна вартість: $${r.min}-${r.max}\n\nДеталі проєкту: `;
        }
    });

    render();
})();
