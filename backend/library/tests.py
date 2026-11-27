from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APITestCase

from .models import Author, Category, Resource, ResourceFile ,  FileVersion
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
            resource_file = ResourceFile.objects.create(
                resource=book,
                file_type=file_type,
            )
            FileVersion.objects.create(
                file=resource_file,
                stored_path=f"test/{title}.{file_type}",
                original_name=f"{title}.{file_type}",
                size=1,
                sha256="a" * 64,
                is_current=True,
            )
            return book

        fa_pdf = make_book("تاریخ ایران", "fa", "pdf")
        fa_epub = make_book("ادبیات فارسی", "fa", "epub")
        en_pdf = make_book("English Grammar", "en", "pdf")

        # یک منبع با دو فایل PDF باید فقط یک بار در نتیجه دیده شود.
        duplicate_file = ResourceFile.objects.create(
                resource=fa_pdf,
                file_type="pdf",
            )
        FileVersion.objects.create(
                file=duplicate_file,
                stored_path="test/duplicate.pdf",
                original_name="duplicate.pdf",
                size=1,
                sha256="b" * 64,
                is_current=True,
            )

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


class ResourceAccessTests(APITestCase):


    def create_resource(self, title, policy, status=Resource.Status.PUBLISHED):
        return Resource.objects.create(
            title=title,
            status=status,
            access_policy=policy,
        )

    def result_ids(self, response):
        return [item["id"] for item in response.data["results"]]

    def test_guest_and_regular_user_visibility_follow_access_policy(self):
        public_book = self.create_resource(
            "کتاب عمومی",
            Resource.AccessPolicy.PUBLIC,
        )
        registered_book = self.create_resource(
            "کتاب اعضا",
            Resource.AccessPolicy.REGISTERED,
        )
        subscription_book = self.create_resource(
            "کتاب اشتراکی",
            Resource.AccessPolicy.SUBSCRIPTION,
        )
        restricted_book = self.create_resource(
            "کتاب محدود",
            Resource.AccessPolicy.RESTRICTED,
        )
        confidential_book = self.create_resource(
            "کتاب محرمانه",
            Resource.AccessPolicy.CONFIDENTIAL,
        )
        self.create_resource("کتاب بدون سیاست", "")

        User = get_user_model()
        regular_user = User(username="regular", role=User.Role.USER)

        cases = [
            ("guest", None, [public_book]),
            (
                "regular user",
                regular_user,
                [public_book, registered_book, subscription_book],
            ),
        ]

        for label, user, expected_books in cases:
            with self.subTest(user=label):
                self.client.force_authenticate(user=user)
                response = self.client.get(reverse("resource-list"))

                self.assertEqual(response.status_code, 200)
                self.assertEqual(response.data["count"], len(expected_books))
                self.assertCountEqual(
                    self.result_ids(response),
                    [str(book.pk) for book in expected_books],
                )

        self.client.force_authenticate(user=None)

        for book in (restricted_book, confidential_book):
            with self.subTest(hidden_detail=book.title):
                detail = self.client.get(
                    reverse("resource-detail", kwargs={"pk": str(book.pk)})
                )
                self.assertEqual(detail.status_code, 404)

        hidden_search = self.client.get(
            reverse("resource-list"),
            {"search": "کتاب محرمانه"},
        )
        self.assertEqual(hidden_search.status_code, 200)
        self.assertEqual(hidden_search.data["count"], 0)

    def test_librarian_and_admin_can_see_drafts_and_all_policies(self):
        draft = self.create_resource(
            "پیش‌نویس محرمانه",
            Resource.AccessPolicy.CONFIDENTIAL,
            status=Resource.Status.DRAFT,
        )
        archived = self.create_resource(
            "منبع بایگانی‌شده",
            Resource.AccessPolicy.RESTRICTED,
            status=Resource.Status.ARCHIVED,
        )

        User = get_user_model()
        cases = [
            ("guest", None, []),
            ("regular user", User(username="regular", role=User.Role.USER), []),
            (
                "librarian",
                User(username="librarian", role=User.Role.LIBRARIAN),
                [draft, archived],
            ),
            (
                "admin",
                User(username="admin", role=User.Role.ADMIN),
                [draft, archived],
            ),
        ]

        for label, user, expected_books in cases:
            with self.subTest(user=label):
                self.client.force_authenticate(user=user)
                response = self.client.get(reverse("resource-list"))

                self.assertEqual(response.status_code, 200)
                self.assertEqual(response.data["count"], len(expected_books))
                self.assertCountEqual(
                    self.result_ids(response),
                    [str(book.pk) for book in expected_books],
                )

    def test_superuser_with_regular_role_acts_as_admin(self):
        draft = self.create_resource(
            "پیش‌نویس محرمانه",
            Resource.AccessPolicy.CONFIDENTIAL,
            status=Resource.Status.DRAFT,
        )

        User = get_user_model()
        superuser = User(
            username="superuser",
            role=User.Role.USER,
            is_superuser=True,
        )
        self.client.force_authenticate(user=superuser)

        response = self.client.get(reverse("resource-list"))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(self.result_ids(response), [str(draft.pk)])


class ResourceContractTests(APITestCase):
    def test_pagination_response_shape_and_max_page_size(self):
        for number in range(51):
            Resource.objects.create(
                title=f"منبع شماره {number}",
                status=Resource.Status.PUBLISHED,
                access_policy=Resource.AccessPolicy.PUBLIC,
            )

        url = reverse("resource-list")
        first_page = self.client.get(url, {"page_size": 100})
        second_page = self.client.get(url, {"page": 2, "page_size": 100})

        expected_fields = {
            "count",
            "page",
            "page_size",
            "total_pages",
            "next",
            "previous",
            "results",
        }

        self.assertEqual(first_page.status_code, 200)
        self.assertEqual(set(first_page.data.keys()), expected_fields)
        self.assertEqual(first_page.data["count"], 51)
        self.assertEqual(first_page.data["page"], 1)
        self.assertEqual(first_page.data["page_size"], 50)
        self.assertEqual(first_page.data["total_pages"], 2)
        self.assertEqual(len(first_page.data["results"]), 50)
        self.assertTrue(first_page.data["next"].startswith("/"))
        self.assertNotIn("://", first_page.data["next"])
        self.assertIsNone(first_page.data["previous"])

        self.assertEqual(second_page.status_code, 200)
        self.assertEqual(second_page.data["page"], 2)
        self.assertEqual(len(second_page.data["results"]), 1)
        self.assertTrue(second_page.data["previous"].startswith("/"))
        self.assertNotIn("://", second_page.data["previous"])

    def test_invalid_category_returns_contract_error_shape(self):
        response = self.client.get(
            reverse("resource-list"),
            {"category": "abc"},
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.data["errors"]["category"],
            ["شناسهٔ هر دسته باید عدد صحیح باشد."],
        )
    def test_detail_returns_permissions_and_only_current_file_version(self):
        book = Resource.objects.create(
            title="کتاب آزمایشی",
            status=Resource.Status.PUBLISHED,
            access_policy=Resource.AccessPolicy.PUBLIC,
        )
        resource_file = ResourceFile.objects.create(
            resource=book,
            file_type="pdf",
        )

        FileVersion.objects.create(
            file=resource_file,
            stored_path="test/old.pdf",
            original_name="old.pdf",
            size=100,
            sha256="a" * 64,
            is_current=False,
        )
        FileVersion.objects.create(
            file=resource_file,
            stored_path="test/current.pdf",
            original_name="current.pdf",
            size=200,
            sha256="b" * 64,
            is_current=True,
        )

        response = self.client.get(
            reverse("resource-detail", kwargs={"pk": str(book.pk)})
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.data["permissions"],
            {"preview": False, "read": True, "download": True},
        )
        self.assertEqual(response.data["access_status"], "full")
        self.assertEqual(len(response.data["files"]), 1)
        self.assertEqual(response.data["files"][0]["original_name"], "current.pdf")
        self.assertEqual(response.data["files"][0]["file_type"], "pdf")
        self.assertEqual(response.data["files"][0]["size"], 200)
        self.assertEqual(response.data["files"][0]["processing_status"], "ready")
        self.assertNotIn("cover_image", response.data)
        self.assertIn("created_at", response.data)
        self.assertIn("updated_at", response.data)



    def test_list_includes_access_status_for_regular_user(self):
        User = get_user_model()
        regular_user = User()

        public_book = Resource.objects.create(
            title="منبع عمومی",
            status=Resource.Status.PUBLISHED,
            access_policy=Resource.AccessPolicy.PUBLIC,
        )
        registered_book = Resource.objects.create(
            title="منبع کاربران ثبت‌نام‌شده",
            status=Resource.Status.PUBLISHED,
            access_policy=Resource.AccessPolicy.REGISTERED,
        )
        subscription_book = Resource.objects.create(
            title="منبع اشتراکی",
            status=Resource.Status.PUBLISHED,
            access_policy=Resource.AccessPolicy.SUBSCRIPTION,
        )

        self.client.force_authenticate(user=regular_user)
        response = self.client.get(reverse("resource-list"))

        self.assertEqual(response.status_code, 200)
        statuses = {
            item["title"]: item["access_status"]
            for item in response.data["results"]
        }
        self.assertEqual(statuses[public_book.title], "full")
        self.assertEqual(statuses[registered_book.title], "full")
        self.assertEqual(statuses[subscription_book.title], "none")