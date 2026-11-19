# قرارداد API (نسخه ۱)

آدرس پایه: `/api/` | فرمت: JSON | احراز هویت: هدر `Authorization: Bearer <access>`

## فرمت خطا
```json
{ "code": "validation_error", "message": "پیام فارسی", "errors": { "title": ["این فیلد الزامی است."] } }
```
کدهای رایج: `validation_error` (400)، `unauthorized` (401)، `forbidden` (403)، `not_found` (404)، `duplicate_file` (409)

## احراز هویت
| متد | آدرس | بدنه | پاسخ |
|---|---|---|---|
| POST | `/auth/register/` | `{username, email, password}` | 201 `{id, username, email, role}` |
| POST | `/auth/login/` | `{username, password}` | 200 `{access, refresh, user:{id, username, role}}` |
| POST | `/auth/logout/` | `{refresh}` | 204 |
| POST | `/auth/change-password/` | `{old_password, new_password}` | 204 |
| GET | `/auth/me/` | — | `{id, username, email, role}` |

نقش‌ها: `admin`، `librarian`، `user`

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
`?page=1&search=متن&category=<id>&language=fa&file_type=pdf`

### نمونه پاسخ فهرست
```json
{
  "count": 25,
  "next": "/api/resources/?page=2",
  "previous": null,
  "results": [
    {
      "id": "3f1c...-uuid",
      "title": "تاریخ معاصر ایران",
      "authors": [{ "id": 1, "name": "نام نویسنده" }],
      "publication_year": 1395,
      "calendar": "shamsi",
      "language": "fa",
      "category": { "id": 2, "name": "تاریخ" },
      "file_type": "pdf",
      "status": "published",
      "access_policy": "public"
    }
  ]
}
```

### بدنه ایجاد
```json
{
  "title": "عنوان",
  "author_ids": [1],
  "category": 2,
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
{ "id": 5, "original_name": "book.pdf", "file_type": "pdf", "size": 1048576 }
```

### خطای فایل تکراری (409)
```json
{ "code": "duplicate_file", "message": "این فایل قبلاً در سامانه ثبت شده است.", "existing_resource_id": "uuid" }
```