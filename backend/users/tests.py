from rest_framework.test import APITestCase
from .models import User


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