from datetime import timedelta
from django.utils import timezone
from .models import Trip, Stop, DutySegment, Recap, DutyStatus, StopType
from .routing import get_route, geocode

class HOSEngine:
    def __init__(self, trip: Trip):
        self.trip = trip
        self.current_time = trip.planned_start
        self.cycle_used = float(trip.cycle_used_hours)
        self.drive_time_since_break = 0.0
        self.drive_time_today = 0.0
        self.on_duty_time_today = 0.0
        self.shift_start_time = None
        self.last_break_end = None
        self.day_index = 1
        self.segments = []
        self.recaps = []
        
        # Constants
        self.MAX_DRIVE_PER_SHIFT = 11.0
        self.MAX_SHIFT_WINDOW = 14.0
        self.MAX_DRIVE_BEFORE_BREAK = 8.0
        self.BREAK_DURATION = 0.5 # 30 mins
        self.REST_DURATION = 10.0
        self.FUEL_INTERVAL_MILES = 1000.0
        self.FUEL_DURATION = 0.25 # 15 mins
        self.PICKUP_DROPOFF_DURATION = 1.0 # 1 hour
        self.AVG_SPEED_MPH = 60.0 # simplified
        
    def run(self):
        # Clear existing
        self.trip.segments.all().delete()
        self.trip.recaps.all().delete()
        self.trip.stops.all().delete() # Re-generate stops? Or use existing? 
        # For now, let's assume we generate stops based on route.
        
        # 1. Geocode locations
        start_coords = geocode(self.trip.current_location)
        pickup_coords = geocode(self.trip.pickup_location)
        dropoff_coords = geocode(self.trip.dropoff_location)
        
        # 2. Get Route Legs
        # Leg 1: Current -> Pickup
        leg1 = get_route(start_coords, pickup_coords)
        # Leg 2: Pickup -> Dropoff
        leg2 = get_route(pickup_coords, dropoff_coords)
        
        total_dist = leg1["distance_meters"] + leg2["distance_meters"]
        self.trip.total_distance_miles = total_dist * 0.000621371
        
        # 3. Simulate
        
        # Initial Pre-trip
        self.add_segment(DutyStatus.ON_DUTY, "Pre-trip Inspection", self.trip.current_location, 0.25)
        self.create_stop(StopType.START, "Start Location", self.trip.current_location, start_coords)
        
        # Drive to Pickup
        self.drive_leg(leg1, self.trip.pickup_location, "Deadhead to Pickup")
        
        # Pickup
        self.add_segment(DutyStatus.ON_DUTY, "Pickup", self.trip.pickup_location, self.PICKUP_DROPOFF_DURATION)
        self.create_stop(StopType.PICKUP, "Pickup", self.trip.pickup_location, pickup_coords)
        
        # Drive to Dropoff
        self.drive_leg(leg2, self.trip.dropoff_location, "Haul to Dropoff")
        
        # Dropoff
        self.add_segment(DutyStatus.ON_DUTY, "Dropoff", self.trip.dropoff_location, self.PICKUP_DROPOFF_DURATION)
        self.create_stop(StopType.DROPOFF, "Dropoff", self.trip.dropoff_location, dropoff_coords)
        
        # Post-trip
        self.add_segment(DutyStatus.ON_DUTY, "Post-trip Inspection", self.trip.dropoff_location, 0.25)
        
        # Finalize
        self.trip.status = "completed"
        self.trip.save()
        
        # Save segments
        DutySegment.objects.bulk_create(self.segments)
        
        # Generate Recaps (simplified)
        self.generate_recaps()
        
    def drive_leg(self, leg_data, dest_name, activity_name):
        distance_miles = leg_data["distance_meters"] * 0.000621371
        remaining_miles = distance_miles
        
        while remaining_miles > 0:
            # Check for fuel
            # (Simplified: just check if we drove enough, but for now let's just drive)
            
            # Max drive possible based on HOS
            drive_avail = self.get_available_drive_time()
            
            if drive_avail <= 0:
                self.take_rest_break("10h Rest Break (HOS Limit)")
                continue
                
            # Distance we can cover in available time
            dist_possible = drive_avail * self.AVG_SPEED_MPH
            
            # Distance to next fuel stop (simplified logic)
            # ...
            
            step_dist = min(remaining_miles, dist_possible)
            step_time = step_dist / self.AVG_SPEED_MPH
            
            # Check 8h break
            if self.drive_time_since_break + step_time > self.MAX_DRIVE_BEFORE_BREAK:
                # Drive until break needed
                time_to_break = self.MAX_DRIVE_BEFORE_BREAK - self.drive_time_since_break
                if time_to_break > 0:
                    dist_to_break = time_to_break * self.AVG_SPEED_MPH
                    self.add_segment(DutyStatus.DRIVING, activity_name, "En route", time_to_break, dist_to_break)
                    remaining_miles -= dist_to_break
                
                self.take_30m_break()
                continue
                
            # Drive the step
            self.add_segment(DutyStatus.DRIVING, activity_name, "En route", step_time, step_dist)
            remaining_miles -= step_dist
            
    def get_available_drive_time(self):
        # 1. 11h limit
        limit_11 = self.MAX_DRIVE_PER_SHIFT - self.drive_time_today
        
        # 2. 14h window
        if self.shift_start_time:
            elapsed = (self.current_time - self.shift_start_time).total_seconds() / 3600.0
            remaining_window = self.MAX_SHIFT_WINDOW - elapsed
        else:
            remaining_window = self.MAX_SHIFT_WINDOW
            
        return max(0, min(limit_11, remaining_window))

    def take_rest_break(self, reason):
        self.add_segment(DutyStatus.OFF_DUTY, reason, "Rest Area", self.REST_DURATION)
        # Reset clocks
        self.drive_time_today = 0
        self.on_duty_time_today = 0
        self.drive_time_since_break = 0
        self.shift_start_time = None # Will reset on next on-duty
        self.create_stop(StopType.REST, reason, "Rest Area")

    def take_30m_break(self):
        self.add_segment(DutyStatus.OFF_DUTY, "30m Break", "Rest Area", self.BREAK_DURATION)
        self.drive_time_since_break = 0
        self.create_stop(StopType.BREAK, "30m Break", "Rest Area")

    def add_segment(self, status, activity, location, duration_hours, distance=0):
        start = self.current_time
        end = start + timedelta(hours=duration_hours)
        
        # Update clocks
        if status == DutyStatus.DRIVING:
            self.drive_time_today += duration_hours
            self.drive_time_since_break += duration_hours
            self.on_duty_time_today += duration_hours
        elif status == DutyStatus.ON_DUTY:
            self.on_duty_time_today += duration_hours
        
        # Start shift clock if not started and status is ON_DUTY or DRIVING
        if status in [DutyStatus.DRIVING, DutyStatus.ON_DUTY] and self.shift_start_time is None:
            self.shift_start_time = start
            
        seg = DutySegment(
            trip=self.trip,
            status=status,
            activity=activity,
            location=location,
            start_time=start,
            end_time=end,
            day_index=self.day_index, # simplified
            distance_miles=distance
        )
        self.segments.append(seg)
        self.current_time = end
        
    def create_stop(self, kind, name, location, coords=None):
        stop = Stop.objects.create(
            trip=self.trip,
            kind=kind,
            name=name,
            sequence=len(self.trip.stops.all()) + 1,
            latitude=coords[1] if coords else None,
            longitude=coords[0] if coords else None,
            planned_start=self.current_time
        )
        # Link stop to last segment?
        
    def generate_recaps(self):
        # Group segments by day
        from collections import defaultdict
        days = defaultdict(list)
        for seg in self.segments:
            days[seg.day_index].append(seg)
            
        # Create Recap for each day
        # Simplified: Assume day 1 is today, day 2 tomorrow, etc.
        # In reality, we need to handle date boundaries properly.
        
        current_date = self.trip.planned_start.date()
        
        for day_idx in sorted(days.keys()):
            segs = days[day_idx]
            driving = sum(s.duration_minutes for s in segs if s.status == DutyStatus.DRIVING) / 60.0
            on_duty = sum(s.duration_minutes for s in segs if s.status == DutyStatus.ON_DUTY) / 60.0
            off_duty = sum(s.duration_minutes for s in segs if s.status == DutyStatus.OFF_DUTY) / 60.0
            sleeper = sum(s.duration_minutes for s in segs if s.status == DutyStatus.SLEEPER) / 60.0
            
            # Cycle calc (simplified)
            cycle_used = self.cycle_used + driving + on_duty
            cycle_remaining = 70.0 - cycle_used
            
            recap = Recap(
                trip=self.trip,
                day_index=day_idx,
                date=current_date + timedelta(days=day_idx-1),
                driving_hours=driving,
                on_duty_hours=on_duty,
                off_duty_hours=off_duty,
                sleeper_hours=sleeper,
                cycle_used_hours=cycle_used,
                cycle_remaining_hours=cycle_remaining
            )
            self.recaps.append(recap)
            
            # Update running cycle used
            self.cycle_used = cycle_used
            
        Recap.objects.bulk_create(self.recaps)
