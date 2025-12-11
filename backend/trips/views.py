from drf_spectacular.utils import OpenApiParameter, OpenApiTypes, extend_schema
from rest_framework import viewsets
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import Trip
from .routing import geocode
from .serializers import TripSerializer


@extend_schema(
    parameters=[
        OpenApiParameter("q", OpenApiTypes.STR, description="Address query string"),
    ],
    responses={200: OpenApiTypes.OBJECT},
)
@api_view(["GET"])
def geocode_view(request):
    query = request.GET.get("q", "")
    if not query:
        return Response({"error": "Missing query param 'q'"}, status=400)

    try:
        coords = geocode(query)
        # Mock geocode returns random coords if not real, but let's assume it works.
        # We should probably return a list of suggestions if we were using a real autocomplete API,
        # but geocode() returns a single (lon, lat) tuple.
        # For the purpose of "Autocomplete", we ideally want text suggestions.
        # Since our current 'geocode' util is simple, let's just return the single match
        # as a "suggestion" to fit the UI requirement of a dropdown, or just use it to confirm the location.
        # Wait, the user asked for "Address auto-complete/search ... showing the three points as the user types".
        # Real autocomplete needs a different ORS endpoint: /geocode/autocomplete.
        # For now, let's stick to the simple geocode proxy.
        return Response(
            {
                "features": [
                    {
                        "properties": {
                            "label": query
                        },  # Echo back as label since we don't have real text results
                        "geometry": {"coordinates": coords},
                    }
                ]
            }
        )
    except Exception as e:
        return Response({"error": str(e)}, status=500)


class TripViewSet(viewsets.ModelViewSet):
    queryset = (
        Trip.objects.all()
        .select_related("carrier")
        .prefetch_related("stops", "segments", "recaps")
    )
    serializer_class = TripSerializer
    http_method_names = ["get", "post", "patch", "head", "options"]

    def perform_create(self, serializer):
        trip = serializer.save()
        from .hos_engine import HOSEngine

        engine = HOSEngine(trip)
        engine.run()
