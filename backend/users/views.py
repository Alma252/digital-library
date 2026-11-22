from django.contrib.auth import authenticate
from rest_framework import serializers, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken

from .serializers import (ChangePasswordSerializer, LoginSerializer, MeSerializer, RegisterSerializer)


class RegisterView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "register"

    def post(self, request):
        s = RegisterSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        user = s.save()
        return Response(MeSerializer(user).data, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "login"

    def post(self, request):
        s = LoginSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        user = authenticate(username=s.validated_data["username"], password=s.validated_data["password"])
        if user is None:
            raise serializers.ValidationError({"non_field_errors": ["نام کاربری یا رمز عبور اشتباه است."]})
        refresh = RefreshToken.for_user(user)
        return Response({
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": {"id": user.id, "username": user.username, "role": user.role},
        })


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            RefreshToken(request.data.get("refresh", "")).blacklist()
        except TokenError:
            raise serializers.ValidationError({"refresh": ["توکن نامعتبر است."]})
        return Response(status=status.HTTP_204_NO_CONTENT)


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        s = ChangePasswordSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        user = request.user
        if not user.check_password(s.validated_data["old_password"]):
            raise serializers.ValidationError({"old_password": ["رمز فعلی اشتباه است."]})
        user.set_password(s.validated_data["new_password"])
        user.save()
        # باطل‌کردن همه نشست‌های قبلی بعد از تغییر رمز
        for t in OutstandingToken.objects.filter(user=user):
            BlacklistedToken.objects.get_or_create(token=t)
        return Response(status=status.HTTP_204_NO_CONTENT)


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(MeSerializer(request.user).data)