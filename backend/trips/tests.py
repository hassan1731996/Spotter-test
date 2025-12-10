from datetime import timedelta
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status
from .models import Trip, CarrierInfo, DutyStatus, StopType, DutySegment, Recap
from .hos_engine import HOSEngine

class HOSEngineTestCase(TestCase):
    def setUp(self):
        self.carrier = CarrierInfo.objects.create(
            carrier_name="Test Carrier",
            truck_number="101"
        )
        self.trip = Trip.objects.create(
            carrier=self.carrier,
            current_location="New York, NY",
            pickup_location="Philadelphia, PA",
            dropoff_location="Washington, DC",
            cycle_used_hours=10.0
        )
        self.engine = HOSEngine(self.trip)

    def test_drive_limit_enforcement(self):
        """Test that driving is limited to 11 hours per shift"""
        # Mock available drive time to 5 hours to force a rest break
        self.engine.drive_time_today = 6.0 
        available = self.engine.get_available_drive_time()
        self.assertEqual(available, 5.0)

    def test_30m_break_requirement(self):
        """Test 30m break logic"""
        # Simulate 8 hours driving
        self.engine.drive_time_since_break = 8.0
        
        # Should trigger break logic if we try to drive more
        # This is implicitly tested in drive_leg, but let's check segment creation logic
        self.engine.take_30m_break()
        self.assertEqual(self.engine.drive_time_since_break, 0)
        self.assertEqual(len(self.engine.segments), 1)
        self.assertEqual(self.engine.segments[0].status, DutyStatus.OFF_DUTY)
        self.assertEqual(self.engine.segments[0].duration_minutes, 30)

    def test_rest_break_requirement(self):
        """Test 10h rest logic"""
        self.engine.drive_time_today = 11.0 # Maxed out
        self.engine.take_rest_break("10h Rest Break")
        self.assertEqual(self.engine.drive_time_today, 0)
        self.assertEqual(len(self.engine.segments), 1)
        self.assertEqual(self.engine.segments[0].duration_minutes, 600) # 10 hours

    def test_recap_generation(self):
        """Test that recaps are generated for segments"""
        # Create some segments manually
        self.engine.add_segment(DutyStatus.DRIVING, "Drive", "Loc", 5.0) # 5h drive
        self.engine.add_segment(DutyStatus.ON_DUTY, "Work", "Loc", 1.0) # 1h work
        self.engine.generate_recaps()
        
        self.assertEqual(len(self.engine.recaps), 1)
        recap = self.engine.recaps[0]
        self.assertEqual(float(recap.driving_hours), 5.0)
        self.assertEqual(float(recap.on_duty_hours), 1.0)
        # Cycle used was 10.0 initially + 6.0 new = 16.0
        self.assertEqual(float(recap.cycle_used_hours), 16.0)

class TripApiIntegrationTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.trip_data = {
            "current_location": "New York, NY",
            "pickup_location": "Newark, NJ",
            "dropoff_location": "Trenton, NJ",
            "carrier": {
                "carrier_name": "Integration Express",
                "truck_number": "INT-9000"
            }
        }

    def test_create_trip_triggers_engine(self):
        """Test valid trip creation generates segments and stops"""
        response = self.client.post('/api/trips/', self.trip_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        trip_id = response.data['id']
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
        create_resp = self.client.post('/api/trips/', self.trip_data, format='json')
        trip_id = create_resp.data['id']
        
        # Get
        response = self.client.get(f'/api/trips/{trip_id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('segments', response.data)
        self.assertIn('recaps', response.data)
