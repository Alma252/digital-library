from rest_framework.test import APITestCase
from .models import User
from rest_framework_simplejwt.tokens import RefreshToken

class AuthTests(APITestCase):
    def setUp(self):
        User.objects.create_user("ali", "ali@example.com", "Str0ng-Pass-123")

    def test_register_cannot_set_role(self):
        r = self.client.post("/api/auth/register/", {
            "username": "new", "email": "n@example.com",
            "password": "Str0ng-Pass-123", "role": "admin"})
        self.assertEqual(r.status_code, 201)
        self.assertEqual(User.objects.get(username="new").role, "user")

    def test_login_wrong_password(self):
        r = self.client.post("/api/auth/login/", {"username": "ali", "password": "bad"})
        self.assertEqual(r.status_code, 400)
        self.assertIn("non_field_errors", r.data["errors"])

    def test_login_and_me(self):
        r = self.client.post("/api/auth/login/", {"username": "ali", "password": "Str0ng-Pass-123"})
        self.assertEqual(r.status_code, 200)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {r.data['access']}")
        self.assertEqual(self.client.get("/api/auth/me/").status_code, 200)

    def test_me_requires_auth(self):
        self.assertEqual(self.client.get("/api/auth/me/").status_code, 401)

    def test_register_short_username(self):
        r = self.client.post("/api/auth/register/", {
            "username": "ab", "email": "a@example.com",
            "password": "Str0ng-Pass-123"})
        self.assertEqual(r.status_code, 400)
        self.assertIn("username", r.data["errors"])

    def test_logout_with_other_users_refresh_is_rejected(self):
        ali = User.objects.get(username="ali")
        bob = User.objects.create_user("bob", "bob@example.com", "Str0ng-Pass-123")
        ali_access = str(RefreshToken.for_user(ali).access_token)
        bob_refresh = RefreshToken.for_user(bob)

        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {ali_access}")
        r = self.client.post("/api/auth/logout/", {"refresh": str(bob_refresh)})
        self.assertEqual(r.status_code, 400)

        # refresh بوب نباید باطل شده باشد
        self.client.credentials()
        r = self.client.post("/api/auth/refresh/", {"refresh": str(bob_refresh)})
        self.assertEqual(r.status_code, 200)

    def test_logout_own_refresh(self):
        ali = User.objects.get(username="ali")
        refresh = RefreshToken.for_user(ali)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")
        r = self.client.post("/api/auth/logout/", {"refresh": str(refresh)})
        self.assertEqual(r.status_code, 204)

    def test_register_password_similar_to_username(self):
        r = self.client.post("/api/auth/register/", {
            "username": "mohammad", "email": "m@example.com",
            "password": "mohammad1234"})
        self.assertEqual(r.status_code, 400)
        self.assertIn("password", r.data["errors"])

    def test_change_password_similar_to_username(self):
        ali = User.objects.create_user("alireza", "alireza@example.com", "Str0ng-Pass-123")
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {RefreshToken.for_user(ali).access_token}")
        r = self.client.post("/api/auth/change-password/", {
            "old_password": "Str0ng-Pass-123", "new_password": "alireza1234"})
        self.assertEqual(r.status_code, 400)
        self.assertIn("new_password", r.data["errors"])

    def test_superuser_role_is_admin_in_me(self):
        root = User.objects.create_superuser("root", "root@example.com", "Str0ng-Pass-123")
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {RefreshToken.for_user(root).access_token}")
        r = self.client.get("/api/auth/me/")
        self.assertEqual(r.data["role"], "admin")

    def test_register_short_username(self):
        r = self.client.post("/api/auth/register/", {
            "username": "ab", "email": "a@example.com",
            "password": "Str0ng-Pass-123"})
        self.assertEqual(r.status_code, 400)
        self.assertIn("username", r.data["errors"])