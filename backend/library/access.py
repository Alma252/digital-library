from .models import Resource

ADMIN_ROLES = ("admin", "librarian")
P = Resource.AccessPolicy


def role_of(user):
    return user.effective_role if user.is_authenticated else None


def visible_policies(user):
    """None یعنی همه سیاستها قابل مشاهدهاند."""
    role = role_of(user)
    if role in ADMIN_ROLES:
        return None
    if role is None:
        return [P.PUBLIC]
    return [P.PUBLIC, P.REGISTERED, P.SUBSCRIPTION]


def get_permissions(user, resource):
    """preview در اسپرینت ۱ همیشه false است."""
    role = role_of(user)
    if role in ADMIN_ROLES:
        allowed = True
    elif resource.access_policy == P.PUBLIC:
        allowed = True
    elif resource.access_policy == P.REGISTERED and role is not None:
        allowed = True
    else:
        # subscription / restricted / confidential:
        # تا ادغام مدلهای اشتراک و مجوز اختصاصی false
        allowed = False
    return {"preview": False, "read": allowed, "download": allowed}


def get_access_status(perms):
    ops = (perms["read"], perms["download"])
    if all(ops):
        return "full"
    if any(ops):
        return "partial"
    return "none"