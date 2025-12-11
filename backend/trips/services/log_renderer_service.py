from datetime import timedelta

from ..models import DutyStatus


class LogRendererService:
    """
    Responsible for transforming chronological duty segments into
    daily recap summaries and preparing data for display.
    """

    def calculate_recaps(
        self, segments: list, initial_cycle_used: float, trip_instance_time
    ) -> list:
        """
        Groups segments by day and calculates totals.
        Returns a list of Recap dictionaries (or objects).
        """
        from collections import defaultdict

        days = defaultdict(list)

        # Group
        for seg in segments:
            days[seg["day_index"]].append(seg)

        recaps_data = []
        cycle_used = initial_cycle_used

        # Trip Start Date
        start_date = trip_instance_time.date()

        for day_idx in sorted(days.keys()):
            segs = days[day_idx]

            # Tally hours
            # Note: Using minutes from segments for precision
            driving = (
                sum(
                    s["duration_minutes"]
                    for s in segs
                    if s["status"] == DutyStatus.DRIVING
                )
                / 60.0
            )
            on_duty = (
                sum(
                    s["duration_minutes"]
                    for s in segs
                    if s["status"] == DutyStatus.ON_DUTY
                )
                / 60.0
            )
            off_duty = (
                sum(
                    s["duration_minutes"]
                    for s in segs
                    if s["status"] == DutyStatus.OFF_DUTY
                )
                / 60.0
            )
            sleeper = (
                sum(
                    s["duration_minutes"]
                    for s in segs
                    if s["status"] == DutyStatus.SLEEPER
                )
                / 60.0
            )

            # Cycle Calc
            # Today's contribution to cycle: Driving + On Duty
            today_cycle_add = driving + on_duty

            # Rolling window logic would go here if we had history.
            # For this simplified trip simulation, we just accumulate.
            cycle_used += today_cycle_add
            cycle_remaining = max(0, 70.0 - cycle_used)

            recap = {
                "day_index": day_idx,
                "date": start_date + timedelta(days=day_idx - 1),
                "driving_hours": driving,
                "on_duty_hours": on_duty,
                "off_duty_hours": off_duty,
                "sleeper_hours": sleeper,
                "cycle_used_hours": cycle_used,
                "cycle_remaining_hours": cycle_remaining,
            }
            recaps_data.append(recap)

        return recaps_data
