from rest_framework import viewsets

from .models import Trip
from .serializers import TripSerializer


class TripViewSet(viewsets.ModelViewSet):
    queryset = Trip.objects.all().select_related("carrier").prefetch_related(
        "stops", "segments", "recaps"
    )
    serializer_class = TripSerializer
    http_method_names = ["get", "post", "patch", "head", "options"]

    def perform_create(self, serializer):
        trip = serializer.save()
        from .hos_engine import HOSEngine
        engine = HOSEngine(trip)
        engine.run()

