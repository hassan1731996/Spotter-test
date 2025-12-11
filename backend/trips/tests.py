from datetime import timedelta

from django.test import TestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from .hos_rules import HOSRules
from .models import DutyStatus, Trip
from .services.hos_compliance_service import HOSComplianceService
from .services.log_renderer_service import LogRendererService


class HOSComplianceServiceTestCase(TestCase):
    def setUp(self):
        self.service = HOSComplianceService()
        self.rules = HOSRules()

    def test_drive_limit_enforcement(self):
        """Test rule calculation via HOSRules (used by service)"""
        # Testing logic explicitly through rules since Service is an orchestrator
        available = self.rules.get_available_drive_time(
            drive_time_today=6.0,
            shift_start_time=timezone.now() - timedelta(hours=6),
            current_time=timezone.now(),
        )
        self.assertEqual(available, 5.0)

    def test_simulation_break_insertion(self):
        """Test that simulation inserts breaks"""
        # Create a mock route plan that requires a break
        # 8 hours driving leg
        start_time = timezone.now()
        route_plan = {
            "locations": {
                "start": {"address": "A", "coords": (0, 0)},
                "pickup": {"address": "B", "coords": (0, 0)},
                "dropoff": {"address": "C", "coords": (0, 0)},
            },
            "sequence": [
                {
                    "type": "drive",
                    "origin_name": "A",
                    "dest_name": "Pickup",
                    "distance_miles": 600,  # ~10 hours at 60mph
                    "data": {},
                }
            ],
        }

        result = self.service.simulate_trip(
            route_plan, start_time, initial_cycle_used=0.0
        )
        segments = result["segments"]

        # Should have: Start stop, Pre-trip, Drive (part 1), Break, Drive (part 2)
        # Check for break segment
        break_segs = [s for s in segments if s["activity"] == "30m Break"]
        self.assertTrue(len(break_segs) >= 1)
        self.assertEqual(break_segs[0]["duration_minutes"], 30)

    def test_simulation_rest_insertion(self):
        """Test that simulation inserts 10h rest if limits hit"""
        # Mock huge drive
        start_time = timezone.now()
        route_plan = {
            "locations": {
                "start": {"address": "A", "coords": (0, 0)},
                "pickup": {"address": "B", "coords": (0, 0)},
                "dropoff": {"address": "C", "coords": (0, 0)},
            },
            "sequence": [
                {
                    "type": "drive",
                    "origin_name": "A",
                    "dest_name": "Pickup",
                    "distance_miles": 900,  # ~15 hours
                    "data": {},
                }
            ],
        }

        result = self.service.simulate_trip(route_plan, start_time)
        segments = result["segments"]

        rest_segs = [
            s for s in segments if s["activity"] == "10h Rest Break (HOS Limit)"
        ]
        self.assertTrue(len(rest_segs) >= 1)
        self.assertEqual(rest_segs[0]["duration_minutes"], 600)


class LogRendererServiceTestCase(TestCase):
    def test_recap_calculation(self):
        """Test arithmetic for recap summaries"""
        renderer = LogRendererService()
        segments = [
            {
                "day_index": 1,
                "status": DutyStatus.DRIVING,
                "duration_minutes": 300,
            },  # 5h
            {
                "day_index": 1,
                "status": DutyStatus.ON_DUTY,
                "duration_minutes": 60,
            },  # 1h
            {
                "day_index": 2,
                "status": DutyStatus.DRIVING,
                "duration_minutes": 120,
            },  # 2h
        ]
        start_time = timezone.now()
        recaps = renderer.calculate_recaps(
            segments, initial_cycle_used=10.0, trip_instance_time=start_time
        )

        self.assertEqual(len(recaps), 2)
        r1 = recaps[0]
        self.assertEqual(r1["driving_hours"], 5.0)
        self.assertEqual(r1["cycle_used_hours"], 16.0)  # 10 + 5 + 1

        r2 = recaps[1]
        self.assertEqual(r2["driving_hours"], 2.0)
        self.assertEqual(r2["cycle_used_hours"], 18.0)  # 16 + 2


class TripApiIntegrationTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.trip_data = {
            "current_location": "New York, NY",
            "pickup_location": "Newark, NJ",
            "dropoff_location": "Trenton, NJ",
            "carrier": {
                "carrier_name": "Integration Express",
                "truck_number": "INT-9000",
            },
            "cycle_used_hours": 0.0,
        }

    def test_create_trip_triggers_engine(self):
        """Test valid trip creation generates segments and stops"""
        response = self.client.post("/api/trips/", self.trip_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        trip_id = response.data["id"]
        trip = Trip.objects.get(id=trip_id)

        # Check if engine ran (should have segments)
        self.assertTrue(trip.segments.exists())
        self.assertTrue(trip.stops.exists())
        self.assertTrue(trip.recaps.exists())

        # Verify carrier created
        self.assertEqual(trip.carrier.carrier_name, "Integration Express")

    def test_get_trip_details(self):
        """Test retrieving full trip details"""
        # Create first
        create_resp = self.client.post("/api/trips/", self.trip_data, format="json")
        trip_id = create_resp.data["id"]

        # Get
        response = self.client.get(f"/api/trips/{trip_id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("segments", response.data)
        self.assertIn("recaps", response.data)
