from rest_framework.permissions import BasePermission


def _role(user):
    if not user.is_authenticated:
        return None
    return user.effective_role


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return _role(request.user) == "admin"


class IsLibrarianOrAdmin(BasePermission):
    def has_permission(self, request, view):
        return _role(request.user) in ("admin", "librarian")