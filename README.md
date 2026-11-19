# کتابخانه دیجیتال
سامانه تحت وب برای بایگانی، مدیریت، دسته‌بندی و جست‌وجوی منابع دیجیتال (PDF و EPUB).
پروژه درس مهندسی نرم‌افزار، دانشگاه شهید چمران اهواز، استاد ادیب‌فر، پاییز ۱۴۰۵.

## اعضای تیم
- شیدا عسکری — Scrum Master / Backend
- آقای صحاف‌پور — Backend
- آقای عامری — Frontend

## فناوری‌ها
- Backend: Django + Django REST Framework
- Database: PostgreSQL
- Frontend: React (Vite)

## پیش‌نیازها
- Python 3.11+
- Node.js 18+
- PostgreSQL 14+

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

## اجرای Frontend
```bash
cd frontend
npm install
npm run dev
```

## ساختار پروژه
- `backend/` — پروژه Django
- `frontend/` — پروژه React
- `docs/` — مستندات (نیازمندی‌ها، مدل داده، ERD)

## قرارداد کار با Git
- شاخه‌ها: `main`، `develop` و `feature/<name>`
- ادغام فقط با Pull Request و بازبینی یک نفر
- پیام کامیت: `feat:` ، `fix:` ، `docs:` ، `chore:`
