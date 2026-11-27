from rest_framework import filters, mixins, viewsets
from rest_framework.pagination import PageNumberPagination
from rest_framework.exceptions import ValidationError
from . import access
from urllib.parse import urlsplit

from rest_framework.response import Response
from .models import Resource
from .serializers import ResourceListSerializer ,  ResourceDetailSerializer


def _relative_url(url):
    if not url:
        return None

    parts = urlsplit(url)
    if parts.query:
        return f"{parts.path}?{parts.query}"

    return parts.path


class ResourcePagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = "page_size"
    max_page_size = 50

    def get_paginated_response(self, data):
        paginator = self.page.paginator

        return Response(
            {
                "count": paginator.count,
                "page": self.page.number,
                "page_size": paginator.per_page,
                "total_pages": paginator.num_pages,
                "next": _relative_url(self.get_next_link()),
                "previous": _relative_url(self.get_previous_link()),
                "results": data,
            }
        )


class ResourceViewSet(mixins.ListModelMixin,mixins.RetrieveModelMixin,viewsets.GenericViewSet,
):
    serializer_class = ResourceListSerializer
    pagination_class = ResourcePagination
    filter_backends = [filters.SearchFilter]
    search_fields = ["title", "authors__name"]

    def get_queryset(self):
        queryset = Resource.objects.filter(is_deleted=False)
        user = self.request.user

        role = access.role_of(user)

        if role not in access.ADMIN_ROLES:
            queryset = queryset.filter(status=Resource.Status.PUBLISHED)

        policies = access.visible_policies(user)
        if policies is not None:
            queryset = queryset.filter(access_policy__in=policies)

        queryset = queryset.order_by("-created_at", "id")

        category_values = self.request.query_params.getlist("category")
        if category_values:
            try:
                category_ids = [int(value) for value in category_values]
            except ValueError:
                raise ValidationError(
                        {"category": ["شناسهٔ هر دسته باید عدد صحیح باشد."]}
                )

            queryset = queryset.filter(categories__id__in=category_ids).distinct()
        language = self.request.query_params.get("language")
        if language:
            queryset = queryset.filter(language=language)

        file_type = self.request.query_params.get("file_type")
        if file_type:
            queryset = queryset.filter(
                files__versions__is_current=True,
                files__versions__file__file_type=file_type,
                ).distinct()
        return queryset


    def get_serializer_class(self):
        if self.action == "retrieve":
            return ResourceDetailSerializer
        return ResourceListSerializer

