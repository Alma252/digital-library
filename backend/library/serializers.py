from rest_framework import serializers

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



class ResourceDetailSerializer(ResourceListSerializer):
    class Meta(ResourceListSerializer.Meta):
        fields = ResourceListSerializer.Meta.fields + [
            "publisher",
            "description",
            "keywords",
            "isbn",
            "cover_image",
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



    