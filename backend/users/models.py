from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    class Role(models.TextChoices):
        ADMIN = "admin", "مدیر کل"
        LIBRARIAN = "librarian", "کتابدار"
        USER = "user", "کاربر عادی"

    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.USER)

    # وضعیت حساب با فیلد is_active خود جنگو مدیریت می‌شود

    def __str__(self):
        return self.username