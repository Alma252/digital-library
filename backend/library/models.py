import uuid
from django.conf import settings
from django.db import models


class Author(models.Model):
    name = models.CharField(max_length=255, unique=True)

    def __str__(self):
        return self.name


class Category(models.Model):
    name = models.CharField(max_length=255, unique=True)
    parent = models.ForeignKey(
        "self", null=True, blank=True, on_delete=models.SET_NULL, related_name="children"
    )

    def __str__(self):
        return self.name


class Resource(models.Model):
    class Status(models.TextChoices):
        DRAFT = "draft", "پیش‌نویس"
        PUBLISHED = "published", "منتشرشده"
        ARCHIVED = "archived", "بایگانی‌شده"

    class AccessPolicy(models.TextChoices):
        PUBLIC = "public", "عمومی"
        REGISTERED = "registered", "کاربران ثبت‌نام‌شده"
        SUBSCRIPTION = "subscription", "طرح اشتراک"
        RESTRICTED = "restricted", "اختصاصی"
        CONFIDENTIAL = "confidential", "محرمانه"

    class Calendar(models.TextChoices):
        SHAMSI = "shamsi", "شمسی"
        GREGORIAN = "gregorian", "میلادی"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=500)
    authors = models.ManyToManyField(Author, blank=True, related_name="resources")
    publisher = models.CharField(max_length=255, blank=True)
    publication_year = models.PositiveIntegerField(null=True, blank=True)
    calendar = models.CharField(
        max_length=10, choices=Calendar.choices, blank=True
    )
    language = models.CharField(max_length=10, blank=True)
    categories = models.ManyToManyField(Category, blank=True, related_name="resources")
    keywords = models.CharField(max_length=500, blank=True)
    description = models.TextField(blank=True)
    isbn = models.CharField(max_length=20, blank=True)
    cover_image = models.CharField(max_length=500, blank=True)

    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    access_policy = models.CharField(
        max_length=20, choices=AccessPolicy.choices, blank=True
    )

    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL, related_name="created_resources"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.title

class ResourceFile(models.Model):
    resource = models.ForeignKey(Resource, on_delete=models.CASCADE, related_name="files")
    file_type = models.CharField(max_length=10, choices=[("pdf", "PDF"), ("epub", "EPUB")])
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.resource_id} ({self.file_type})"


class FileVersion(models.Model):
    file = models.ForeignKey(ResourceFile, on_delete=models.CASCADE, related_name="versions")
    stored_path = models.CharField(max_length=500)
    original_name = models.CharField(max_length=255)
    size = models.PositiveBigIntegerField()
    sha256 = models.CharField(max_length=64, db_index=True)
    is_current = models.BooleanField(default=True)
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL, related_name="uploaded_versions"
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.original_name} ({self.sha256[:8]})"