import os

import requests

ORS_API_KEY = os.getenv("ORS_API_KEY")
ORS_BASE_URL = "https://api.openrouteservice.org/v2/directions/driving-hgv"


def get_route(start_coords, end_coords):
    """
    Fetch route from OpenRouteService.
    start_coords: (lon, lat) tuple
    end_coords: (lon, lat) tuple
    Returns: dict with distance (meters), duration (seconds), geometry (encoded polyline)
    """
    if not ORS_API_KEY:
        print("Warning: No ORS_API_KEY found. Using mock route data.")
        return get_mock_route(start_coords, end_coords)

    headers = {"Authorization": ORS_API_KEY, "Content-Type": "application/json"}
    body = {
        "coordinates": [start_coords, end_coords],
        "instructions": False,
        "maneuvers": False,
    }

    try:
        response = requests.post(ORS_BASE_URL, json=body, headers=headers)
        response.raise_for_status()
        data = response.json()

        route = data["routes"][0]
        summary = route["summary"]

        return {
            "distance_meters": summary["distance"],
            "duration_seconds": summary["duration"],
            "geometry": route["geometry"],  # Encoded polyline
        }
    except Exception as e:
        print(f"Error fetching route from ORS: {e}. Falling back to mock data.")
        return get_mock_route(start_coords, end_coords)


def get_mock_route(start_coords, end_coords):
    """
    Simple mock route calculation based on Euclidean distance (very rough approximation).
    """
    # Rough estimate: 1 degree lat/lon ~ 111km ~ 69 miles
    # This is just for fallback testing
    dx = end_coords[0] - start_coords[0]
    dy = end_coords[1] - start_coords[1]
    dist_deg = (dx**2 + dy**2) ** 0.5
    dist_km = dist_deg * 111
    dist_meters = dist_km * 1000

    # Assume 80 km/h average speed
    duration_seconds = (dist_km / 80) * 3600

    return {
        "distance_meters": dist_meters,
        "duration_seconds": duration_seconds,
        "geometry": "",  # No polyline for mock
    }


def geocode(address):
    """
    Geocode an address string to (lon, lat).
    """
    if not ORS_API_KEY:
        # Mock geocoding
        # Return random US coordinates or specific ones for known cities
        if "New York" in address:
            return (-74.006, 40.7128)
        if "Los Angeles" in address:
            return (-118.2437, 34.0522)
        return (-98.5795, 39.8283)  # Center of US

    url = "https://api.openrouteservice.org/geocode/search"
    params = {"api_key": ORS_API_KEY, "text": address, "size": 1}

    try:
        response = requests.get(url, params=params)
        response.raise_for_status()
        data = response.json()
        if data["features"]:
            return data["features"][0]["geometry"]["coordinates"]  # [lon, lat]
    except Exception as e:
        print(f"Geocoding error: {e}")

    return (-98.5795, 39.8283)  # Fallback
