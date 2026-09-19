# DEPLOY.md — інструкція з публікації kodesignengineer

Цей документ — крок за кроком запуск нового сайту в інтернет із **безкоштовним хостингом, безкоштовним SSL та безкоштовним справжнім доменом**.

> 🚀 **Рекомендований шлях для тебе зараз — Netlify** (нижче, Спосіб A). Там простіше: drag-and-drop ZIP, домен `*.netlify.app` за хвилину, пізніше — кастомний `is-a.dev` чи власний.

---

## TL;DR (5 хвилин до живого сайту через Netlify)

1. Зайти на https://app.netlify.com/drop
2. Перетягнути всю папку `Design Engineer Website Portfolio` у браузер
3. Через ~30 секунд — сайт живий на `https://random-name-12345.netlify.app/`
4. У панелі змінити subdomain → `kodesignengineer.netlify.app`
5. (Опційно) додати кастомний домен через `is-a.dev` або купити власний

Все — безкоштовне. Ніяких карток на старті.

---

## Спосіб A · Netlify (рекомендовано для першого запуску)

Netlify дає 100 GB трафіку/міс, безкоштовний SSL, автодеплой із Git, форми, аналітику. Найпростіший варіант — без терміналу.

### A.1 — Drag-and-drop за 30 секунд (без GitHub)

1. Зайди на https://app.netlify.com/drop (потрібен акаунт — реєстрація через GitHub або email).
2. Перетягни папку `d:\Claude\Design Engineer Website Portfolio\` (всю!) на сторінку.
3. Через 30-60 сек побачиш зелену галочку та URL типу `https://playful-otter-a1b2c3.netlify.app/`.
4. **Site settings → Domain management → Options → Edit site name** → вкажи `kodesignengineer`.
5. Сайт тепер на `https://kodesignengineer.netlify.app/`. SSL — авто, нічого робити не треба.

### A.2 — Через GitHub (краще для оновлень)

```bash
cd "d:/Claude/Design Engineer Website Portfolio"
git init
git add -A
git commit -m "feat: initial deploy"
git branch -M main
git remote add origin https://github.com/<your-username>/kodesignengineer.git
git push -u origin main
```

Далі в Netlify:
1. **Add new site → Import from Git → GitHub** → авторизуй → обери репо `kodesignengineer`.
2. Build settings (вже описані у `netlify.toml`):
   - **Build command:** *(порожнє)*
   - **Publish directory:** `.`
3. **Deploy site.** Кожен `git push` тепер тригерить автодеплой.

### A.3 — Кастомний домен на Netlify

**Варіант 1: безкоштовний `is-a.dev`** (рекомендовано — більш презентабельно):

1. Fork репо https://github.com/is-a-dev/register.
2. Створи файл `domains/konstantin-overchenko.json`:

   ```json
   {
     "owner": { "username": "<your-github-username>", "email": "kostik.bk.ua@gmail.com" },
     "record": { "CNAME": "kodesignengineer.netlify.app" },
     "proxied": false
   }
   ```

3. Pull Request у репо `is-a-dev/register`. Чекай ~1-3 дні модерації.
4. Після злиття: у Netlify → **Domain management → Add custom domain** → введи `konstantin-overchenko.is-a.dev` → Netlify сам випустить SSL за 1-5 хв.

**Варіант 2: купити власний** (~$10/рік на Namecheap, GoDaddy):
- Купив `kodesignengineer.com` → у налаштуваннях DNS постав CNAME `www → kodesignengineer.netlify.app` + ALIAS/A для apex (Netlify дасть інструкції).
- У Netlify → **Add custom domain** → `kodesignengineer.com` → SSL випуститься автоматично.

### A.4 — Форми через Netlify Forms (бонус — можна відмовитись від Web3Forms)

Netlify має вбудоване зберігання форм. Якщо хочеш — у `index.html` у формі брифу заміни:

```html
<form id="briefForm" data-form="brief"
      action="https://api.web3forms.com/submit" method="POST">
```

на:

```html
<form id="briefForm" data-form="brief"
      name="brief" method="POST" data-netlify="true" netlify-honeypot="bot-field">
  <input type="hidden" name="form-name" value="brief">
  <input type="hidden" name="bot-field" style="display:none">
```

Заявки приходитимуть у Netlify dashboard → Forms (100 заявок/міс безкоштовно), email-сповіщення налаштовуються там же. Працює без access_key, без зовнішніх сервісів.

---

## Спосіб B · Cloudflare Pages (альтернатива)

Якщо потрібен необмежений трафік — Cloudflare Pages дає unlimited bandwidth (Netlify обмежений 100 GB/міс на free).

---

### B.1 — GitHub-репозиторій

```bash
cd "d:/Claude/Design Engineer Website Portfolio"
git init
git add -A
git commit -m "feat: complete v2 rebuild with conversion funnel"
```

Створіть репо на github.com (назва `kodesignengineer`, публічне, без README/license — ви вже маєте файли):

```bash
git branch -M main
git remote add origin https://github.com/<your-username>/kodesignengineer.git
git push -u origin main
```

---

### B.2 — Cloudflare Pages

1. Зайдіть на https://dash.cloudflare.com/ (зареєструйтеся, безкоштовно).
2. Ліворуч → **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**.
3. Авторизуйте Cloudflare у вашому GitHub-акаунті, оберіть репо `kodesignengineer`.
4. **Build settings:**
   - **Framework preset:** None
   - **Build command:** *(порожнє)*
   - **Build output directory:** `/` (тобто корінь репо)
   - **Root directory:** *(порожнє)*
5. **Save and Deploy.**
6. Через 30-60 секунд сайт живий: `https://kodesignengineer.pages.dev/`.
7. У панелі проєкту увімкніть **Web Analytics** (one-click).

> **HTTPS** — увімкнений автоматично, нічого не треба робити.
> Кожен push у `main` буде автодеплоїти.

---

## Крок · Web3Forms (контактні форми — універсально для обох хостингів)

1. Зайдіть на https://web3forms.com.
2. Введіть свій email (`kostik.bk.ua@gmail.com`) → отримаєте **Access Key**.
3. Знайдіть у проєкті всі входження `YOUR_WEB3FORMS_KEY` (їх 4 у `index.html` + 1 у `en/index.html`):

```bash
grep -rn "YOUR_WEB3FORMS_KEY" .
```

4. Замініть на реальний ключ. Закомітьте, запуште — Cloudflare задеплоїть.
5. Тестова заявка — лист надійде на ваш email одразу.

> Безкоштовний tier — 250 заявок/міс. Якщо не вистачить — апгрейд $5/міс або міграція на Resend (3000/міс безкоштовно).

---

## Крок 4. Безкоштовний справжній домен через is-a.dev

Це безкоштовний субдомен, який видається розробникам/інженерам із публічним портфоліо. Виглядає як `konstantin-overchenko.is-a.dev` — респектабельно, не скидається на безкоштовний хост.

1. Зайдіть на https://github.com/is-a-dev/register та натисніть **Fork**.
2. У форку відкрийте папку `domains/` → **Add file → Create new file**.
3. Назва файлу: `konstantin-overchenko.json` (або `kostiantyn.json`, `ko-engineer.json` — будь-яке вільне імʼя).
4. Вміст:

```json
{
  "owner": {
    "username": "<your-github-username>",
    "email": "kostik.bk.ua@gmail.com"
  },
  "record": {
    "CNAME": "kodesignengineer.pages.dev"
  },
  "proxied": false
}
```

5. Commit → Pull Request у `is-a-dev/register`.
6. Заголовок PR: `Register konstantin-overchenko.is-a.dev`. У описі — посилання на ваш сайт `https://kodesignengineer.pages.dev/`.
7. Чекайте ~1-3 дні модерації. Після злиття:
   - У Cloudflare Pages → ваш проєкт → **Custom domains → Set up a custom domain** → введіть `konstantin-overchenko.is-a.dev`.
   - Cloudflare автоматично отримає сертифікат — за 1-5 хв сайт живий за новою адресою.

---

## Крок 5. Альтернатива/доповнення — eu.org (повноцінний TLD)

Хочете повноцінний TLD без `.is-a.dev` префіксу? Безкоштовний `*.eu.org` дається на 1 рік (з продовженням):

1. https://nic.eu.org → Register → виберіть домен (наприклад `kodesign.eu.org`).
2. Заповніть заявку, вкажіть Cloudflare Pages як CNAME.
3. Чекайте 2-4 тижні модерації (довше, ніж is-a.dev).

Поки чекаєте — сайт уже працює на `*.pages.dev` та `*.is-a.dev`.

---

## Крок 6. SEO-індексація

1. **Google Search Console** — https://search.google.com/search-console
   - Add property → URL prefix → `https://kodesignengineer.pages.dev/`
   - Verify через DNS або HTML-тег.
   - Submit sitemap: `https://kodesignengineer.pages.dev/sitemap.xml`
2. **Bing Webmaster Tools** — https://www.bing.com/webmasters
   - Імпортуйте з Google Search Console (1-клік).

Перші результати в індексі — за 3-7 днів.

---

## Крок 7. PWA / Service Worker (опційно)

Service worker уже є в репо (`service-worker.js`). Щоб увімкнути — додайте в кінець `index.html` перед `</body>`:

```html
<script>
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js').catch(() => {});
    });
}
</script>
```

> Робить сайт встановлюваним, працюючим offline.

---

## Чек-ліст перед публікацією

- [ ] Замінено всі `YOUR_WEB3FORMS_KEY` на реальний ключ
- [ ] Перевірено всі посилання (Telegram, телефон, email)
- [ ] Перевірено калькулятор — рахує правильно
- [ ] Надіслано тестовий бриф через форму — лист отримано
- [ ] Lighthouse: Mobile + Desktop ≥90 у всіх метриках
- [ ] Перевірено на 360px / 768px / 1280px
- [ ] Sitemap у Google Search Console
- [ ] (Якщо є мета) Замовлено справжню (платну) дотацію `kodesignengineer.com` → DNS на Cloudflare Pages

---

## Майбутні апгрейди

- **Конвертація зображень у WebP** — `cwebp -q 82 input.jpg -o output.webp` для всіх рендерів. Економія 60-80% розміру.
- **Формспрінг → email + Telegram bot webhook** — доставка одночасно у 2 канали.
- **Поповнення блогу** — стартова стаття вже є (`blog/kd-vs-3d.html`), 5 заплановано.
- **EN-версія портфоліо/сертифікатів/креслень** — створити дзеркало в `/en/portfolio.html` тощо.
- **Реальні case-study сторінки** з фото до/після, цифрами, цитатами замовників.

---

## Контакти підтримки

Якщо щось не працює — Telegram [@overchenkoooo](https://t.me/overchenkoooo) або email kostik.bk.ua@gmail.com.

— *KO Design Engineer · 2026*
