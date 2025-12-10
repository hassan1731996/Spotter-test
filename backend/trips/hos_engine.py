from django.db import transaction
from .models import Trip, Stop, DutySegment, Recap, DutyStatus, StopType
from .services.route_planner_service import RoutePlannerService
from .services.hos_compliance_service import HOSComplianceService
from .services.log_renderer_service import LogRendererService

class HOSEngine:
    """
    Facade that coordinates the Backend Services to plan and simulate a trip.
    Maintains the interface expected by the generic ViewSet.
    """
    def __init__(self, trip: Trip):
        self.trip = trip
        
    def run(self):
        # 1. Plan Route
        planner = RoutePlannerService()
        plan = planner.plan_route(
            self.trip.current_location,
            self.trip.pickup_location,
            self.trip.dropoff_location
        )
        
        self.trip.total_distance_miles = plan["total_distance_miles"]
        
        # 2. Simulate Compliance
        engine = HOSComplianceService()
        simulation = engine.simulate_trip(
            plan, 
            self.trip.planned_start, 
            initial_cycle_used=float(self.trip.cycle_used_hours)
        )
        
        segments_data = simulation["segments"]
        stops_data = simulation["stops"]
        final_state = simulation["final_state"]
        
        # 3. Render / Persist
        renderer = LogRendererService()
        recaps_data = renderer.calculate_recaps(
            segments_data, 
            float(self.trip.cycle_used_hours),
            self.trip.planned_start
        )
        
        # --- Persistence Transaction ---
        with transaction.atomic():
            # Clear old
            self.trip.segments.all().delete()
            self.trip.recaps.all().delete()
            self.trip.stops.all().delete()
            
            # Save Stops
            stops_objs = []
            for i, s_data in enumerate(stops_data):
                stops_objs.append(Stop(
                    trip=self.trip,
                    kind=s_data["kind"],
                    name=s_data["name"],
                    sequence=i+1,
                    latitude=s_data["latitude"],
                    longitude=s_data["longitude"],
                    planned_start=s_data["planned_start"],
                    duration_minutes=s_data["duration_minutes"]
                ))
            Stop.objects.bulk_create(stops_objs)
            # We need stop IDs for segments? 
            # Ideally segments link to stops. But simpler to not link if not required.
            # The current model DutySegment has a 'stop' FK. 
            # If we want to link them, we need to save stops, get IDs, then link.
            # For this Phase, we'll strip the strict FK requirement or just do it right.
            # Doing it right: save stops, mapping 'name' or index? 
            # Let's save stops and fetch them back or rely on basic matching if needed.
            # Actually, the original engine didn't strictly link every segment to a stop object, 
            # only if explicitly passed.
            # Since DutySegment has `stop` field, let's leave it null for now unless critical.
            
            # Save Segments
            seg_objs = []
            for seg in segments_data:
                seg_objs.append(DutySegment(
                    trip=self.trip,
                    status=seg["status"],
                    activity=seg["activity"],
                    location=seg["location"],
                    start_time=seg["start_time"],
                    end_time=seg["end_time"],
                    day_index=seg["day_index"],
                    distance_miles=seg["distance_miles"]
                ))
            DutySegment.objects.bulk_create(seg_objs)
            
            # Save Recaps
            recap_objs = []
            for r in recaps_data:
                recap_objs.append(Recap(
                    trip=self.trip,
                    day_index=r["day_index"],
                    date=r["date"],
                    driving_hours=r["driving_hours"],
                    on_duty_hours=r["on_duty_hours"],
                    off_duty_hours=r["off_duty_hours"],
                    sleeper_hours=r["sleeper_hours"],
                    cycle_used_hours=r["cycle_used_hours"],
                    cycle_remaining_hours=r["cycle_remaining_hours"]
                ))
            Recap.objects.bulk_create(recap_objs)
            
            # Update Trip Stats
            self.trip.status = "completed"
            
            # Calc totals from recaps (or final state)
            # Sum of all recaps might double count if we have rolling? 
            # Trip totals:
            self.trip.total_drive_hours = final_state["drive_time_today"] # This is just today?
            # We should sum from all segments
            self.trip.total_drive_hours = sum(s["duration_minutes"] for s in segments_data if s["status"] == DutyStatus.DRIVING) / 60.0
            self.trip.total_on_duty_hours = sum(s["duration_minutes"] for s in segments_data if s["status"] == DutyStatus.ON_DUTY) / 60.0
            
            self.trip.save()
