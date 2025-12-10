from django.contrib import admin

from .models import CarrierInfo, DutySegment, Recap, Stop, Trip


@admin.register(CarrierInfo)
class CarrierInfoAdmin(admin.ModelAdmin):
    list_display = ("carrier_name", "driver_name", "truck_number", "time_zone")


class StopInline(admin.TabularInline):
    model = Stop
    extra = 0


class DutySegmentInline(admin.TabularInline):
    model = DutySegment
    extra = 0


@admin.register(Trip)
class TripAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "carrier",
        "current_location",
        "pickup_location",
        "dropoff_location",
        "cycle_used_hours",
        "status",
        "planned_start",
    )
    search_fields = ("id", "carrier__carrier_name", "current_location")
    inlines = [StopInline, DutySegmentInline]


@admin.register(Stop)
class StopAdmin(admin.ModelAdmin):
    list_display = ("trip", "kind", "name", "sequence", "planned_start")
    list_filter = ("kind",)
    search_fields = ("name",)


@admin.register(DutySegment)
class DutySegmentAdmin(admin.ModelAdmin):
    list_display = ("trip", "status", "activity", "start_time", "end_time", "day_index")
    list_filter = ("status", "day_index")


@admin.register(Recap)
class RecapAdmin(admin.ModelAdmin):
    list_display = ("trip", "day_index", "date", "cycle_remaining_hours")
    list_filter = ("day_index",)
