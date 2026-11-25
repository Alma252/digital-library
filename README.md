# کتابخانه دیجیتال

سامانهٔ تحت وب برای بایگانی، مدیریت، دسته‌بندی و جست‌وجوی منابع دیجیتال (PDF و EPUB).

پروژهٔ درس مهندسی نرم‌افزار — دانشگاه شهید چمران اهواز — استاد ادیب‌فر — پاییز ۱۴۰۵

## تیم

| نام | نقش |
|---|---|
| شیدا عسکری | Scrum Master / Backend |
| آقای صحاف‌پور | Backend |
| آقای عامری | Frontend |

## فناوری‌ها

| بخش | ابزار |
|---|---|
| Backend | Django، Django REST Framework، JWT |
| پایگاه داده | PostgreSQL |
| Frontend | React 19، Vite، React Router |
| تست | Vitest (Frontend)، Django Test (Backend) |

## پیش‌نیازها

| ابزار | نسخه |
|---|---|
| Python | ۳.۱۱ یا بالاتر |
| PostgreSQL | ۱۴ یا بالاتر |
| Node.js | ‎^22.22.2 یا ‎^24.15.0 |
| npm | ۱۰ یا بالاتر |

> نسخهٔ Node را با `node -v` بررسی کنید. در نسخه‌های قدیمی‌تر، `npm test` با خطای `undici` اجرا نمی‌شود.
> نسخهٔ تست‌شدهٔ تیم: Node 24.18 و npm 11.16.

## اجرای Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # ویندوز: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env            # مقادیر را تنظیم کنید
python manage.py migrate
python manage.py runserver
```

تست‌ها: `python manage.py test`

## اجرای Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

برنامه روی آدرسی که Vite چاپ می‌کند باز می‌شود (معمولاً `http://localhost:5173`).

| دستور | کار |
|---|---|
| `npm run dev` | اجرای محیط توسعه |
| `npm test` | اجرای تست‌ها |
| `npm run lint` | بررسی کد (باید بدون هشدار باشد) |
| `npm run build` | ساخت نسخهٔ تولید |

### حالت mock (بدون Backend)

تا زمانی که API واقعی آماده نیست، Frontend با داده‌های ساختگی کار می‌کند. در `frontend/.env`:

```env
VITE_API_URL=/api
VITE_USE_MOCK=true
```

برای اتصال به Backend واقعی، `VITE_USE_MOCK=false` بگذارید و Backend را اجرا کنید.

**کاربران آزمایشی:**

| نقش | نام کاربری | رمز عبور |
|---|---|---|
| مدیر | `admin` | `admin1234` |
| کتابدار | `librarian` | `lib12345` |
| کاربر عادی | `user` | `user1234` |

**دیدن حالت‌های خطا (فقط در mock):**

- فهرست: در کادر جست‌وجو بنویسید `__error__`، `__forbidden__` یا `__offline__`
- جزئیات: آدرس `/resources/__error__`، `/resources/__forbidden__` یا `/resources/__offline__`

## ساختار پروژه

```text
backend/     پروژهٔ Django
frontend/    پروژهٔ React
  src/api/        لایهٔ API و mock
  src/context/    احراز هویت
  src/pages/      صفحه‌ها
  src/components/ اجزای مشترک
  src/hooks/      هوک‌ها
  src/utils/      ابزارها
docs/        مستندات
```

قرارداد API در `docs/api-contract.md` است و مرجع مشترک Frontend و Backend محسوب می‌شود.

## قرارداد کار با Git

- شاخه‌ها: `main`، `develop` و `feature/<name>`
- ادغام فقط با Pull Request به `develop` و Approve یک عضو دیگر تیم
- هر نفر برای کد خودش تست می‌نویسد. قبل از PR، تست‌ها و `npm run lint` باید پاس شوند.
- تغییر قرارداد API فقط در یک PR جدا و با تأیید هر دو طرف (Frontend و Backend)
- پیام کامیت: `feat:` ، `fix:` ، `docs:` ، `chore:`
