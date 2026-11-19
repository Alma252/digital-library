from django.contrib import admin
from .models import Author, Category, Resource, ResourceFile

admin.site.register(Author)
admin.site.register(Category)
admin.site.register(Resource)
admin.site.register(ResourceFile)