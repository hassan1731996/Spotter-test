from datetime import timedelta

from ..hos_rules import HOSRules
from ..models import DutyStatus, StopType


class HOSComplianceService:
    """
    Stateless engine to apply FMCSA rules to a sequence of logistical events.
    Inputs: Route Plan (from RoutePlannerService), Initial State (cycle used, start time).
    Outputs: Chronological List of Duty Segments and Stops.
    """

    def __init__(self):
        self.rules = HOSRules()

    def simulate_trip(self, route_plan, start_time, initial_cycle_used=0.0):
        """
        Run the simulation.

        :param route_plan: Dict returned by RoutePlannerService.plan_route
        :param start_time: datetime object for planned start
        :param initial_cycle_used: float, hours used in current cycle
        :return: dict containing 'segments' (list of dicts) and 'stops' (list of dicts)
        """

        # Simulation State
        state = {
            "current_time": start_time,
            "cycle_used": float(initial_cycle_used),
            "drive_time_today": 0.0,
            "on_duty_time_today": 0.0,
            "drive_time_since_break": 0.0,
            "shift_start_time": None,
            "day_index": 1,
        }

        # Output Buffers (using dicts to be framework-agnostic initially, or helpful for bulk_create)
        segments_log = []
        stops_log = []

        # Helper to record segment
        def add_segment(status, activity, location, duration_hours, distance=0):
            start = state["current_time"]
            end = start + timedelta(hours=duration_hours)

            # Update Clocks
            if status == DutyStatus.DRIVING:
                state["drive_time_today"] += duration_hours
                state["drive_time_since_break"] += duration_hours
                state["on_duty_time_today"] += duration_hours
            elif status == DutyStatus.ON_DUTY:
                state["on_duty_time_today"] += duration_hours

            # Shift Start
            if (
                status in [DutyStatus.DRIVING, DutyStatus.ON_DUTY]
                and state["shift_start_time"] is None
            ):
                state["shift_start_time"] = start

            seg = {
                "status": status,
                "activity": activity,
                "location": location,
                "start_time": start,
                "end_time": end,
                "day_index": state["day_index"],
                "distance_miles": distance,
                "duration_minutes": int(duration_hours * 60),
            }
            segments_log.append(seg)
            state["current_time"] = end

            # Simple Day Increment Logic (if crossing midnight, handling strictly by start time for now
            # or relying on LogRenderer to split. For simulation validity, we care about absolute time).
            # If we want to track 'day_index' accurately for the 70/8 rule, we might need cleaner day boundaries.
            # For now, we'll keep the simplified logic but maybe verify if we cross days?
            # Actually, HOS rules reset counters on days, but 14/11 rules are shift based.

            # Let's verify day boundaries in a more complex pass if needed.
            # For now, we trust the flow, but update day_index if we cross a large threshold?
            # Or just calc day_index from start_time relative to trip start.
            days_passed = (state["current_time"].date() - start_time.date()).days
            state["day_index"] = days_passed + 1

        # Helper to record stop
        def add_stop(kind, name, location_name, coords=None, duration_minutes=0):
            # Planned start is usually the simulation current time (which matches start of this stop event)
            # But wait, add_segment advances time.
            # If a stop corresponds to a segment (like Pickup), we want the stop marker generally at the start.
            # We'll use the time BEFORE the segment associated with this stop was added?
            # Or just use current_time if we call this BEFORE add_segment.

            stop = {
                "kind": kind,
                "name": name,
                "latitude": coords[1] if coords else None,
                "longitude": coords[0] if coords else None,
                "planned_start": state[
                    "current_time"
                ],  # Capture time before or during?
                "duration_minutes": duration_minutes,
            }
            stops_log.append(stop)

        # --- Execution Flow ---

        locations = route_plan["locations"]

        # 1. Pre-Trip
        add_stop(
            StopType.START,
            "Start Location",
            locations["start"]["address"],
            locations["start"]["coords"],
            int(self.rules.PRE_POST_TRIP_DURATION_HOURS * 60),
        )
        add_segment(
            DutyStatus.ON_DUTY,
            "Pre-trip Inspection",
            locations["start"]["address"],
            self.rules.PRE_POST_TRIP_DURATION_HOURS,
        )

        # 2. Process Sequence
        for item in route_plan["sequence"]:
            if item["type"] == "drive":
                dest_alias = item["dest_name"].lower()
                # Fallback for 'Pickup' -> 'pickup', 'Start Location' -> 'start'
                if "start" in dest_alias:
                    dest_alias = "start"
                elif "pickup" in dest_alias:
                    dest_alias = "pickup"
                elif "dropoff" in dest_alias:
                    dest_alias = "dropoff"

                # We need coordinates?
                # Actually _drive_leg doesn't need coords, it just needs names.
                # But we might want them for inserted stops?
                self._drive_leg(state, item, item["dest_name"], add_segment, add_stop)

            elif item["type"] == "stop":
                loc_alias = item["location_name"]
                addr = locations[loc_alias]["address"]
                coords = locations[loc_alias]["coords"]
                duration = item["duration_hours"]

                add_stop(item["kind"], item["name"], addr, coords, int(duration * 60))
                add_segment(DutyStatus.ON_DUTY, item["name"], addr, duration)

        # 3. Post-Trip
        add_segment(
            DutyStatus.ON_DUTY,
            "Post-trip Inspection",
            locations["dropoff"]["address"],
            self.rules.PRE_POST_TRIP_DURATION_HOURS,
        )

        return {"segments": segments_log, "stops": stops_log, "final_state": state}

    def _drive_leg(self, state, leg, dest_name, add_segment_fn, add_stop_fn):
        """
        Simulates driving a specific leg, inserting breaks and rests as needed.
        """
        remaining_miles = leg["distance_miles"]
        activity_name = f"Drive to {dest_name}"

        while remaining_miles > 0:
            # Calculate availability
            drive_avail = self.rules.get_available_drive_time(
                state["drive_time_today"],
                state["shift_start_time"],
                state["current_time"],
            )

            # Case: No Drive Time (14h or 11h limit hit) -> 10h Rest
            if drive_avail <= 0.01:
                reason = "10h Rest Break (HOS Limit)"
                duration = self.rules.REST_DURATION_HOURS

                add_stop_fn(
                    StopType.REST, reason, "Rest Area", None, int(duration * 60)
                )
                add_segment_fn(DutyStatus.OFF_DUTY, reason, "Rest Area", duration)

                # Reset Clocks manually since we are outside the class state manager
                state["drive_time_today"] = 0
                state["on_duty_time_today"] = 0
                state["drive_time_since_break"] = 0
                state["shift_start_time"] = None
                continue

            # Calculate Distance Possible
            dist_possible = drive_avail * self.rules.AVG_SPEED_MPH
            step_dist = min(remaining_miles, dist_possible)
            step_time = step_dist / self.rules.AVG_SPEED_MPH

            # Check 8h Break (30 min required)
            if self.rules.is_break_required(state["drive_time_since_break"], step_time):
                # Drive until break
                time_to_break = self.rules.get_time_until_break(
                    state["drive_time_since_break"]
                )

                if time_to_break > 0:
                    dist_to_break = time_to_break * self.rules.AVG_SPEED_MPH
                    add_segment_fn(
                        DutyStatus.DRIVING,
                        activity_name,
                        "En route",
                        time_to_break,
                        dist_to_break,
                    )
                    remaining_miles -= dist_to_break

                # Take Break
                add_stop_fn(StopType.BREAK, "30m Break", "Rest Area", None, 30)
                add_segment_fn(
                    DutyStatus.OFF_DUTY,
                    "30m Break",
                    "Rest Area",
                    self.rules.BREAK_DURATION_MINUTES / 60.0,
                )
                state["drive_time_since_break"] = 0
                continue

            # Drive the Step
            add_segment_fn(
                DutyStatus.DRIVING, activity_name, "En route", step_time, step_dist
            )
            remaining_miles -= step_dist
