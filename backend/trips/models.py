import uuid

from django.db import models
from django.utils import timezone


class DutyStatus(models.TextChoices):
    OFF_DUTY = "off_duty", "Off Duty"
    SLEEPER = "sleeper", "Sleeper Berth"
    DRIVING = "driving", "Driving"
    ON_DUTY = "on_duty", "On Duty (Not Driving)"


class StopType(models.TextChoices):
    START = "start", "Start"
    PICKUP = "pickup", "Pickup"
    DROPOFF = "dropoff", "Dropoff"
    FUEL = "fuel", "Fuel"
    BREAK = "break", "Break"
    REST = "rest", "Rest"
    OTHER = "other", "Other"


class CarrierInfo(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    carrier_name = models.CharField(max_length=255)
    carrier_address = models.TextField(blank=True)
    driver_name = models.CharField(max_length=255, default="Driver")
    co_driver_name = models.CharField(max_length=255, default="NA")
    truck_number = models.CharField(max_length=64, blank=True)
    trailer_number = models.CharField(max_length=64, blank=True)
    time_zone = models.CharField(max_length=64, default="UTC")
    shipping_docs = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:
        return f"{self.carrier_name} ({self.truck_number or 'truck'})"


class Trip(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    carrier = models.ForeignKey(
        CarrierInfo, on_delete=models.CASCADE, related_name="trips"
    )
    current_location = models.CharField(max_length=255)
    pickup_location = models.CharField(max_length=255)
    dropoff_location = models.CharField(max_length=255)
    planned_start = models.DateTimeField(default=timezone.now)
    cycle_used_hours = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    use_34h_restart = models.BooleanField(default=False)
    time_base = models.CharField(max_length=64, default="UTC")
    total_distance_miles = models.DecimalField(
        max_digits=9, decimal_places=2, default=0
    )
    total_drive_hours = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    total_on_duty_hours = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    status = models.CharField(max_length=32, default="planned")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:
        return f"Trip {self.id}"


class Stop(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name="stops")
    kind = models.CharField(max_length=24, choices=StopType.choices)
    name = models.CharField(max_length=255)
    sequence = models.PositiveIntegerField(default=0)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    planned_start = models.DateTimeField(null=True, blank=True)
    duration_minutes = models.PositiveIntegerField(default=0)
    remarks = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["sequence", "created_at"]

    def __str__(self) -> str:
        return f"{self.get_kind_display()} ({self.name})"


class DutySegment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name="segments")
    stop = models.ForeignKey(
        Stop, on_delete=models.SET_NULL, related_name="segments", null=True, blank=True
    )
    status = models.CharField(max_length=24, choices=DutyStatus.choices)
    activity = models.CharField(max_length=255, blank=True)
    location = models.CharField(max_length=255, blank=True)
    remarks = models.TextField(blank=True)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    day_index = models.PositiveIntegerField(default=1)
    distance_miles = models.DecimalField(max_digits=9, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["start_time"]

    @property
    def duration_minutes(self) -> int:
        return int((self.end_time - self.start_time).total_seconds() // 60)

    def __str__(self) -> str:
        return f"{self.get_status_display()} ({self.start_time} → {self.end_time})"


class Recap(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name="recaps")
    day_index = models.PositiveIntegerField()
    date = models.DateField()
    driving_hours = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    on_duty_hours = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    off_duty_hours = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    sleeper_hours = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    cycle_used_hours = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    cycle_remaining_hours = models.DecimalField(
        max_digits=6, decimal_places=2, default=70
    )
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["day_index"]
        unique_together = ("trip", "day_index")

    def __str__(self) -> str:
        return f"Recap day {self.day_index} ({self.date})"
