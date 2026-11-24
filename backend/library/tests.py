from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APITestCase

from .models import Author, Category, Resource, ResourceFile
class ResourceSearchTests(APITestCase):
    def test_guest_can_search_by_title_and_author(self):
        author = Author.objects.create(name="مریم بهرامی")

        book = Resource.objects.create(
            title="تاریخ ایران",
            status=Resource.Status.PUBLISHED,
            access_policy=Resource.AccessPolicy.PUBLIC,
        )
        book.authors.add(author)

        Resource.objects.create(
            title="مبانی ریاضی",
            status=Resource.Status.PUBLISHED,
            access_policy=Resource.AccessPolicy.PUBLIC,
        )

        for term in ("تاریخ", "بهرامی"):
            with self.subTest(term=term):
                response = self.client.get(reverse("resource-list"), {"search": term})

                self.assertEqual(response.status_code, 200)
                self.assertEqual(response.data["count"], 1)
                self.assertEqual(response.data["results"][0]["id"], str(book.id))

class ResourceListTests(APITestCase):
    def test_category_filter_matches_either_category_without_duplicates(self):
        history = Category.objects.create(name="تاریخ")
        science = Category.objects.create(name="علوم")

        def published_book(title):
            return Resource.objects.create(
                title=title,
                status=Resource.Status.PUBLISHED,
                access_policy=Resource.AccessPolicy.PUBLIC,
            )

        history_book = published_book("تاریخ ایران")
        history_book.categories.add(history)

        science_book = published_book("مبانی علوم")
        science_book.categories.add(science)

        shared_book = published_book("تاریخ علم")
        shared_book.categories.add(history, science)

        published_book("کتاب بدون دسته")

        response = self.client.get(
            reverse("resource-list"),
            {"category": [history.pk, science.pk]},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 3)
        result_ids = [item["id"] for item in response.data["results"]]
        self.assertCountEqual(
            result_ids,
            [str(history_book.pk), str(science_book.pk), str(shared_book.pk)],
        )

    def test_guest_and_regular_user_only_see_published_non_deleted_resources(self):
        visible_book = Resource.objects.create(
            title="کتاب منتشرشده",
            status=Resource.Status.PUBLISHED,
            access_policy=Resource.AccessPolicy.PUBLIC,
        )
        Resource.objects.create(
            title="کتاب پیش‌نویس",
            status=Resource.Status.DRAFT,
            access_policy=Resource.AccessPolicy.PUBLIC,
        )
        Resource.objects.create(
            title="کتاب منتشرشده ولی حذف‌شده",
            status=Resource.Status.PUBLISHED,
            access_policy=Resource.AccessPolicy.PUBLIC,
            is_deleted=True,
        )

        User = get_user_model()
        regular_user = User()
        self.assertNotIn(regular_user.role, (User.Role.ADMIN, User.Role.LIBRARIAN))

        for role, user in (("guest", None), ("regular_user", regular_user)):
            with self.subTest(role=role):
                self.client.force_authenticate(user=user)
                response = self.client.get(reverse("resource-list"))

                self.assertEqual(response.status_code, 200)
                self.assertEqual(response.data["count"], 1)
                result_ids = [item["id"] for item in response.data["results"]]
                self.assertEqual(result_ids, [str(visible_book.pk)])


    def test_language_and_file_type_filters(self):
        def make_book(title, language, file_type):
            book = Resource.objects.create(
                title=title,
                language=language,
                status=Resource.Status.PUBLISHED,
                access_policy=Resource.AccessPolicy.PUBLIC,
            )
            ResourceFile.objects.create(resource=book, file_type=file_type)
            return book

        fa_pdf = make_book("تاریخ ایران", "fa", "pdf")
        fa_epub = make_book("ادبیات فارسی", "fa", "epub")
        en_pdf = make_book("English Grammar", "en", "pdf")

        # یک منبع با دو فایل PDF باید فقط یک بار در نتیجه دیده شود.
        ResourceFile.objects.create(resource=fa_pdf, file_type="pdf")

        cases = [
            ({"language": "fa"}, [fa_pdf, fa_epub]),
            ({"file_type": "pdf"}, [fa_pdf, en_pdf]),
            ({"language": "fa", "file_type": "pdf"}, [fa_pdf]),
        ]

        for params, expected_books in cases:
            with self.subTest(params=params):
                response = self.client.get(reverse("resource-list"), params)

                self.assertEqual(response.status_code, 200)
                self.assertEqual(response.data["count"], len(expected_books))
                result_ids = [item["id"] for item in response.data["results"]]
                self.assertCountEqual(
                    result_ids,
                    [str(book.pk) for book in expected_books],
                )


    def test_default_pagination_returns_ten_resources_on_first_page(self):
        expected_ids = []
        for number in range(1, 12):
            book = Resource.objects.create(
                title=f"کتاب شماره {number}",
                status=Resource.Status.PUBLISHED,
                access_policy=Resource.AccessPolicy.PUBLIC,
            )
            expected_ids.append(str(book.pk))

        url = reverse("resource-list")
        first_page = self.client.get(url)
        second_page = self.client.get(url, {"page": 2})

        self.assertEqual(first_page.status_code, 200)
        self.assertEqual(second_page.status_code, 200)
        self.assertEqual(first_page.data["count"], 11)
        self.assertEqual(len(first_page.data["results"]), 10)
        self.assertEqual(len(second_page.data["results"]), 1)

        all_results = first_page.data["results"] + second_page.data["results"]
        self.assertCountEqual([item["id"] for item in all_results], expected_ids)

    def test_guest_can_retrieve_published_resource_detail(self):
        book = Resource.objects.create(
            title="تاریخ ایران",
            publisher="انتشارات نمونه",
            description="توضیح کتاب",
            status=Resource.Status.PUBLISHED,
            access_policy=Resource.AccessPolicy.PUBLIC,
        )

        response = self.client.get(
            reverse("resource-detail", kwargs={"pk": str(book.pk)})
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["id"], str(book.pk))
        self.assertEqual(response.data["title"], "تاریخ ایران")
        self.assertEqual(response.data["publisher"], "انتشارات نمونه")
        self.assertEqual(response.data["description"], "توضیح کتاب")

    def test_guest_cannot_retrieve_draft_or_deleted_resource(self):
        draft = Resource.objects.create(
            title="پیش‌نویس",
            status=Resource.Status.DRAFT,
            access_policy=Resource.AccessPolicy.PUBLIC,
        )
        deleted = Resource.objects.create(
            title="منبع حذف‌شده",
            status=Resource.Status.PUBLISHED,
            access_policy=Resource.AccessPolicy.PUBLIC,
            is_deleted=True,
        )

        for book in (draft, deleted):
            with self.subTest(book=book.title):
                response = self.client.get(
                    reverse("resource-detail", kwargs={"pk": str(book.pk)})
                )
                self.assertEqual(response.status_code, 404)