from rest_framework import serializers
from . import access
from .models import Author, Category, FileVersion, Resource

class AuthorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Author
        fields = ["id", "name"]


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name"]



class ResourceListSerializer(serializers.ModelSerializer):
    authors = AuthorSerializer(many=True, read_only=True)
    categories = CategorySerializer(many=True, read_only=True)
    file_type = serializers.SerializerMethodField()
    access_status = serializers.SerializerMethodField()

    class Meta:
        model = Resource
        fields = [
            "id",
            "title",
            "authors",
            "publication_year",
            "calendar",
            "language",
            "categories",
            "file_type",
            "access_status",
            "status",
            "access_policy",
        ]

    def get_file_type(self, resource):
        return (
            FileVersion.objects
            .filter(file__resource=resource, is_current=True)
            .order_by("-uploaded_at", "-pk")
            .values_list("file__file_type", flat=True)
            .first()
        )
    def get_access_status(self, resource):
        user = self.context["request"].user
        permissions = access.get_permissions(user, resource)
        return access.get_access_status(permissions)


class ResourceDetailSerializer(ResourceListSerializer):
    permissions = serializers.SerializerMethodField()
    files = serializers.SerializerMethodField()
    class Meta(ResourceListSerializer.Meta):
        fields = ResourceListSerializer.Meta.fields + [
            "publisher",
            "description",
            "keywords",
            "isbn",
            "permissions",
            "files",
            "created_at",
            "updated_at",
        ]
    def get_permissions(self, resource):
        user = self.context["request"].user
        return access.get_permissions(user, resource)

    def get_files(self, resource):
        versions = (
            FileVersion.objects
            .filter(file__resource=resource, is_current=True)
            .select_related("file")
            .order_by("file_id")
        )

        return [
            {
                "id": version.file_id,
                "original_name": version.original_name,
                "file_type": version.file.file_type,
                "size": version.size,
                "processing_status": "ready",
            }
            for version in versions
        ]


class ResourceWriteSerializer(serializers.ModelSerializer):
    author_ids = serializers.PrimaryKeyRelatedField(
        source="authors",
        queryset=Author.objects.all(),
        many=True,
        required=False,
        write_only=True,
    )
    category_ids = serializers.PrimaryKeyRelatedField(
        source="categories",
        queryset=Category.objects.all(),
        many=True,
        required=False,
        write_only=True,
    )

    class Meta:
        model = Resource
        fields = [
            "title",
            "author_ids",
            "category_ids",
            "publisher",
            "publication_year",
            "calendar",
            "language",
            "description",
            "keywords",
            "isbn",
            "cover_image",
            "access_policy",
        ]



    