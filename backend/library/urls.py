from rest_framework.routers import SimpleRouter

from .views import ResourceViewSet

router = SimpleRouter()
router.register("resources", ResourceViewSet, basename="resource")

urlpatterns = router.urls