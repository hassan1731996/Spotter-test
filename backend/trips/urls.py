from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import TripViewSet, geocode_view

router = DefaultRouter()
router.register(r"trips", TripViewSet, basename="trip")

urlpatterns = router.urls + [
    path("geocode/", geocode_view, name="geocode"),
]
