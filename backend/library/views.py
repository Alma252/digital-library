from rest_framework import filters, mixins, viewsets
from rest_framework.pagination import PageNumberPagination
from rest_framework.exceptions import ValidationError

from users.models import User

from .models import Resource
from .serializers import ResourceListSerializer ,  ResourceDetailSerializer


class ResourcePagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = "page_size"
    max_page_size = 50


class ResourceViewSet(mixins.ListModelMixin,mixins.RetrieveModelMixin,viewsets.GenericViewSet,
):
    serializer_class = ResourceListSerializer
    pagination_class = ResourcePagination
    filter_backends = [filters.SearchFilter]
    search_fields = ["title", "authors__name"]

    def get_queryset(self):
        queryset = Resource.objects.filter(is_deleted=False)
        user = self.request.user

        if not (
            user.is_authenticated
            and user.role in (User.Role.ADMIN, User.Role.LIBRARIAN)
        ):
            queryset = queryset.filter(status=Resource.Status.PUBLISHED)

        category_values = self.request.query_params.getlist("category")
        if category_values:
            try:
                category_ids = [int(value) for value in category_values]
            except ValueError:
                raise ValidationError(
                    {"category": "شناسهٔ هر دسته باید عدد صحیح باشد."}
                )

            queryset = queryset.filter(categories__id__in=category_ids).distinct()
        language = self.request.query_params.get("language")
        if language:
            queryset = queryset.filter(language=language)

        file_type = self.request.query_params.get("file_type")
        if file_type:
            queryset = queryset.filter(files__file_type=file_type).distinct()
        return queryset


    def get_serializer_class(self):
        if self.action == "retrieve":
            return ResourceDetailSerializer
        return ResourceListSerializer

