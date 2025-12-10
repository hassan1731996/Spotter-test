from dataclasses import dataclass
from datetime import timedelta

@dataclass
class HOSRules:
    """
    Encapsulates Hours of Service (HOS) rules and limits.
    """
    MAX_DRIVE_PER_SHIFT: float = 11.0
    MAX_SHIFT_WINDOW: float = 14.0
    MAX_DRIVE_BEFORE_BREAK: float = 8.0
    
    BREAK_DURATION_MINUTES: int = 30
    REST_DURATION_HOURS: float = 10.0
    
    FUEL_INTERVAL_MILES: float = 1000.0
    PICKUP_DROPOFF_DURATION_HOURS: float = 1.0
    PRE_POST_TRIP_DURATION_HOURS: float = 0.25
    
    AVG_SPEED_MPH: float = 60.0

    def get_available_drive_time(self, drive_time_today: float, shift_start_time, current_time) -> float:
        """
        Calculates available driving time based on 11h limit and 14h window.
        """
        # 1. 11h limit
        limit_11 = self.MAX_DRIVE_PER_SHIFT - drive_time_today
        
        # 2. 14h window
        if shift_start_time:
            elapsed = (current_time - shift_start_time).total_seconds() / 3600.0
            remaining_window = self.MAX_SHIFT_WINDOW - elapsed
        else:
            remaining_window = self.MAX_SHIFT_WINDOW
            
        return max(0.0, min(limit_11, remaining_window))

    def is_break_required(self, drive_time_since_break: float, planned_drive_time: float) -> bool:
        """
        Checks if a 30m break is required before or during the planned drive.
        """
        return (drive_time_since_break + planned_drive_time) > self.MAX_DRIVE_BEFORE_BREAK

    def get_time_until_break(self, drive_time_since_break: float) -> float:
        """
        Returns hours remaining until a mandatory 30m break.
        """
        return max(0.0, self.MAX_DRIVE_BEFORE_BREAK - drive_time_since_break)
