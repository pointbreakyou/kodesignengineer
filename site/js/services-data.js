/* services-data.js — реєстр ассетів сторінки послуг.
   Вантажиться ПЕРЕД main.js, щоб лайтбокс бачив галереї.
   Додав нові скріни в assets/services/ — допиши їх сюди, і вони підхопляться. */
(() => {
    'use strict';

    const SW = 'assets/services/solidworks/';
    const FEA = 'assets/services/fea/';

    /* Галереї для лайтбокса (той самий формат, що gallery-data.js) */
    const gallery = {
        'sw-inside': {
            title: 'Робоче вікно SolidWorks',
            cat: 'ЗА ЛАШТУНКАМИ',
            images: [
                SW + 'sw-01-case-assembly.webp',
                SW + 'sw-02-cabinet-assembly.webp',
                SW + 'sw-03-console-table.webp',
                FEA + 'fea-01-navis-stress.webp',
                FEA + 'fea-02-navis-frame.webp',
                FEA + 'fea-03-node-detail.webp'
            ]
        },
        'reel': {
            title: 'Showreel · візуалізація KeyShot',
            cat: 'РЕНДЕРИ',
            images: [
                'assets/services/reel/susp.webp',
                'assets/services/reel/case.webp',
                'assets/services/reel/carport.webp',
                'assets/services/reel/ses.webp',
                'assets/services/reel/tz8.webp',
                'assets/services/reel/lw30.webp',
                'assets/services/reel/gate.webp',
                'assets/services/reel/vishka.webp',
                'assets/services/reel/zmiyka.webp',
                'assets/services/reel/mayatnyk.webp',
                'assets/services/reel/turnik.webp',
                'assets/services/reel/stinka.webp',
                'assets/services/reel/trx.webp',
                'assets/services/reel/upory.webp',
                'assets/services/reel/verstak.webp',
                'assets/services/reel/dveri.webp',
                'assets/services/reel/traktor.webp',
                'assets/services/reel/truba.webp'
            ]
        },
        'fea-study': {
            title: 'Розрахунок навантаження · SolidWorks Simulation',
            cat: 'МКЕ',
            images: [
                FEA + 'fea-01-navis-stress.webp',
                FEA + 'fea-02-navis-frame.webp',
                FEA + 'fea-03-node-detail.webp'
            ]
        }
    };

    /* Комплект КД: паспорт + складальне + деталювання (з 32-аркушевого набору) */
    const DOC = 'assets/services/drawings/';
    gallery['doc-set'] = {
        title: 'Комплект робочої документації',
        cat: 'КРЕСЛЕННЯ',
        images: [DOC + 'ses-sheet-general.webp', DOC + 'ses-sheet-nodes.webp',
                 DOC + 'doc-03-details.webp', DOC + 'doc-01-passport.webp',
                 DOC + 'doc-02-assembly.webp']
    };

    window.PORTFOLIO_GALLERY = Object.assign({}, window.PORTFOLIO_GALLERY || {}, gallery);

})();
