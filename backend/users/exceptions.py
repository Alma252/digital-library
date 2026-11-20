from rest_framework import exceptions
from rest_framework.views import exception_handler


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is None:
        return None

    if isinstance(exc, exceptions.ValidationError):
        errors = response.data
        if isinstance(errors, list):
            errors = {"non_field_errors": errors}
        response.data = {"code": "validation_error", "message": "ورودی نامعتبر است.", "errors": errors}
    elif isinstance(exc, exceptions.Throttled):
        response.data = {
            "code": "throttled",
            "message": "تعداد درخواست‌ها زیاد است. کمی بعد تلاش کنید.",
            "retry_after": int(exc.wait or 0),
        }
    elif isinstance(exc, (exceptions.NotAuthenticated, exceptions.AuthenticationFailed)):
        response.data = {"code": "unauthorized", "message": "احراز هویت نامعتبر است."}
    elif isinstance(exc, exceptions.PermissionDenied):
        response.data = {"code": "forbidden", "message": "شما مجوز این عملیات را ندارید."}
    elif isinstance(exc, exceptions.NotFound):
        response.data = {"code": "not_found", "message": "یافت نشد."}
    return response