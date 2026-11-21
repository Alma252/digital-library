# قرارداد API (نسخه ۱.۲)

آدرس پایه: `/api/` | فرمت: JSON | احراز هویت: هدر `Authorization: Bearer <access>`

## توکن‌ها
- `access`: اعتبار ۳۰ دقیقه
- `refresh`: اعتبار ۷ روز
- وقتی `access` منقضی شد (پاسخ 401)، فرانت از `/auth/refresh/` توکن جدید می‌گیرد. اگر refresh هم منقضی یا باطل بود، کاربر باید دوباره وارد شود.

### رفتار بعد از تغییر رمز
- همه refreshهای قبلی باطل می‌شوند و کاربر باید دوباره وارد شود.
- access فعلی تا زمان انقضا (حداکثر ۳۰ دقیقه) معتبر می‌ماند.
- فرانت بعد از موفقیت `change-password` باید توکن‌ها را پاک کند و کاربر را به صفحه ورود ببرد.

## فرمت خطا
```json
{
  "code": "validation_error",
  "message": "پیام فارسی",
  "errors": { "title": ["این فیلد الزامی است."] }
}
```

خطای غیرمرتبط با یک فیلد خاص زیر کلید `non_field_errors` می‌آید:
```json
{
  "code": "validation_error",
  "message": "ورودی نامعتبر است.",
  "errors": { "non_field_errors": ["نام کاربری یا رمز عبور اشتباه است."] }
}
```

### کدهای خطا
| کد | HTTP | شرح |
|---|---|---|
| `validation_error` | 400 | ورودی نامعتبر |
| `unauthorized` | 401 | توکن نامعتبر یا منقضی |
| `forbidden` | 403 | نبود مجوز |
| `not_found` | 404 | یافت نشد |
| `duplicate_file` | 409 | فایل تکراری |
| `file_too_large` | 413 | فایل بزرگ‌تر از سقف مجاز |
| `unsupported_file_type` | 415 | نوع فایل پشتیبانی نمی‌شود (فقط PDF و EPUB) |
| `throttled` | 429 | تعداد درخواست بیش از حد |

نمونه 429:
```json
{ "code": "throttled", "message": "تعداد درخواست‌ها زیاد است. کمی بعد تلاش کنید.", "retry_after": 30 }
```
`retry_after` بر حسب ثانیه است.

نمونه 413:
```json
{ "code": "file_too_large", "message": "حجم فایل از حد مجاز بیشتر است.", "max_size_bytes": 52428800 }
```

نمونه 415:
```json
{ "code": "unsupported_file_type", "message": "فقط فایل PDF و EPUB پذیرفته می‌شود." }
```

## احراز هویت
| متد | آدرس | بدنه | پاسخ |
|---|---|---|---|
| POST | `/auth/register/` | `{username, email, password}` | 201 `{id, username, email, role}` |
| POST | `/auth/login/` | `{username, password}` | 200 `{access, refresh, user:{id, username, role}}` |
| POST | `/auth/refresh/` | `{refresh}` | 200 `{access}` |
| POST | `/auth/logout/` | `{refresh}` | 204 |
| POST | `/auth/change-password/` | `{old_password, new_password}` | 204 |
| GET | `/auth/me/` | — | `{id, username, email, role}` |

نقش‌ها: `admin`، `librarian`، `user`
قوانین ثبت‌نام: نام کاربری حداقل ۳ نویسه. رمز حداقل ۸ نویسه و رمز خیلی رایج یا فقط‌عددی پذیرفته نمی‌شود. خطاها زیر کلید همان فیلد برمی‌گردند.

## منابع
| متد | آدرس | دسترسی | شرح |
|---|---|---|---|
| GET | `/resources/` | همه | فهرست (فقط `published` برای غیرکتابدار) |
| GET | `/resources/{id}/` | همه (طبق سیاست) | جزئیات |
| POST | `/resources/` | کتابدار/مدیر | ایجاد (فقط `title` الزامی) |
| PATCH | `/resources/{id}/` | کتابدار/مدیر | ویرایش |
| DELETE | `/resources/{id}/` | مدیر | حذف منطقی |
| POST | `/resources/{id}/publish/` | کتابدار/مدیر | انتشار |
| POST | `/resources/{id}/archive/` | کتابدار/مدیر | بایگانی |
| POST | `/resources/{id}/files/` | کتابدار/مدیر | آپلود (`multipart`, فیلد `file`) |
| GET | `/categories/` | همه | فهرست دسته‌بندی‌ها |
| GET | `/authors/` | همه | فهرست نویسندگان |

### پارامترهای فهرست
`?page=1&page_size=10&search=متن&category=<id>&language=fa&file_type=pdf`

- `page_size`: پیش‌فرض ۱۰، حداکثر ۵۰
- تعداد صفحات = `ceil(count / page_size)`
- `category=<id>`: منابعی که این دسته را دارند
### نمونه پاسخ فهرست
```json
{
  "count": 25,
  "page": 1,
  "page_size": 10,
  "total_pages": 3,
  "next": "/api/resources/?page=2&page_size=10",
  "previous": null,
  "results": [
    {
      "id": "3f1c0a52-7b1e-4c1d-9a55-2b6f0e1d9c11",
      "title": "تاریخ معاصر ایران",
      "authors": [{ "id": 1, "name": "نام نویسنده" }],
      "publication_year": 1395,
      "calendar": "shamsi",
      "language": "fa",
      "categories": [{ "id": 2, "name": "تاریخ" }],
      "file_type": "pdf",
      "status": "published",
      "access_policy": "public",
      "access_status": "full"
    }
  ]
}
```

### مقادیر `access_status` (برای هر آیتم فهرست)
| مقدار | معنی |
|---|---|
| `full` | کاربر می‌تواند مطالعه و دانلود کند |
| `partial` | فقط بعضی عملیات مجاز است (جزئیات در `permissions` صفحه جزئیات) |
| `none` | فقط اطلاعات اولیه قابل مشاهده است و مجوز مطالعه یا دانلود ندارد |

### نمونه پاسخ جزئیات `GET /resources/{id}/`
```json
{
  "id": "3f1c0a52-7b1e-4c1d-9a55-2b6f0e1d9c11",
  "title": "تاریخ معاصر ایران",
  "authors": [{ "id": 1, "name": "نام نویسنده" }],
  "publisher": "نام ناشر",
  "publication_year": 1395,
  "calendar": "shamsi",
  "language": "fa",
  "categories": [{ "id": 2, "name": "تاریخ" }],
  "keywords": "تاریخ، ایران، معاصر",
  "description": "خلاصه محتوا",
  "isbn": "",
  "status": "published",
  "access_policy": "public",
  "access_status": "full",
  "permissions": { "preview": true, "read": true, "download": false },
  "files": [
    {
      "id": 5,
      "original_name": "book.pdf",
      "file_type": "pdf",
      "size": 1048576,
      "processing_status": "ready"
    }
  ],
  "created_at": "2026-11-20T10:30:00Z",
  "updated_at": "2026-11-20T10:30:00Z"
}
```

### `permissions`
سه عملیات جدا از هم و هرکدام با `true` یا `false`:
- `preview`: پیش‌نمایش
- `read`: مطالعه آنلاین
- `download`: دانلود

فرانت دکمه‌ها را فقط بر اساس این فیلد نشان می‌دهد، ولی کنترل نهایی همیشه با سرور است. اگر مجوز نباشد، درخواست مستقیم هم با 403 رد می‌شود.

### مقادیر `processing_status` (برای هر فایل)
- در اسپرینت ۱ همیشه `ready` است و فقط یعنی فایل ذخیره و اعتبارسنجی شده است.
- این مقدار به استخراج متن یا نمایه‌سازی جست‌وجو مربوط نیست.
- شکست ذخیره یا اعتبارسنجی با کدهای خطا اعلام می‌شود و رکورد فایل ساخته نمی‌شود.
- مقادیر `processing` و `failed` برای اسپرینت‌های بعد رزرو شده‌اند (استخراج متن).

### بدنه ایجاد
```json
{
  "title": "عنوان",
  "author_ids": [1],
  "category_ids": [2],
  "language": "fa",
  "publication_year": 1395,
  "calendar": "shamsi",
  "description": "",
  "keywords": "",
  "isbn": "",
  "access_policy": "public"
}
```

### پاسخ آپلود موفق (201)
```json
{ "id": 5, "original_name": "book.pdf", "file_type": "pdf", "size": 1048576, "processing_status": "ready" }
```

### خطای فایل تکراری (409)
```json
{ "code": "duplicate_file", "message": "این فایل قبلاً در سامانه ثبت شده است.", "existing_resource_id": "3f1c0a52-7b1e-4c1d-9a55-2b6f0e1d9c11" }
```