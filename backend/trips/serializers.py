from rest_framework import serializers

from .models import CarrierInfo, DutySegment, Recap, Stop, Trip


class CarrierInfoSerializer(serializers.ModelSerializer):
    class Meta:
        model = CarrierInfo
        fields = [
            "id",
            "carrier_name",
            "carrier_address",
            "driver_name",
            "co_driver_name",
            "truck_number",
            "trailer_number",
            "time_zone",
            "shipping_docs",
            "created_at",
            "updated_at",
        ]
        extra_kwargs = {
            'carrier_name': {'required': True, 'allow_blank': False},
            'truck_number': {'required': True, 'allow_blank': False},
        }


class StopSerializer(serializers.ModelSerializer):
    class Meta:
        model = Stop
        fields = [
            "id",
            "trip",
            "kind",
            "name",
            "sequence",
            "latitude",
            "longitude",
            "planned_start",
            "duration_minutes",
            "remarks",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["trip", "created_at", "updated_at"]


class DutySegmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = DutySegment
        fields = [
            "id",
            "trip",
            "stop",
            "status",
            "activity",
            "location",
            "remarks",
            "start_time",
            "end_time",
            "day_index",
            "distance_miles",
            "duration_minutes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "trip",
            "duration_minutes",
            "created_at",
            "updated_at",
        ]


class RecapSerializer(serializers.ModelSerializer):
    class Meta:
        model = Recap
        fields = [
            "id",
            "trip",
            "day_index",
            "date",
            "driving_hours",
            "on_duty_hours",
            "off_duty_hours",
            "sleeper_hours",
            "cycle_used_hours",
            "cycle_remaining_hours",
            "notes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["trip", "created_at", "updated_at"]


class TripSerializer(serializers.ModelSerializer):
    carrier = CarrierInfoSerializer()
    stops = StopSerializer(many=True, read_only=True)
    segments = DutySegmentSerializer(many=True, read_only=True)
    recaps = RecapSerializer(many=True, read_only=True)

    def validate_cycle_used_hours(self, value):
        """Ensure cycle used hours is non-negative and within limit."""
        if value < 0:
            raise serializers.ValidationError("Cycle used hours cannot be negative.")
        if value > 70:
             raise serializers.ValidationError("Cycle used hours cannot exceed 70 hours.")
        return value

    def validate(self, data):
        """Cross-field validation."""
        if data.get('current_location') == data.get('pickup_location'):
             raise serializers.ValidationError("Current location and pickup location cannot be the same.")
        return data

    class Meta:
        model = Trip
        fields = [
            "id",
            "carrier",
            "current_location",
            "pickup_location",
            "dropoff_location",
            "planned_start",
            "cycle_used_hours",
            "use_34h_restart",
            "time_base",
            "total_distance_miles",
            "total_drive_hours",
            "total_on_duty_hours",
            "status",
            "stops",
            "segments",
            "recaps",
            "created_at",
            "updated_at",
        ]
        extra_kwargs = {
            'current_location': {'required': True, 'allow_blank': False},
            'pickup_location': {'required': True, 'allow_blank': False},
            'dropoff_location': {'required': True, 'allow_blank': False},
            'cycle_used_hours': {'required': True},
        }
        read_only_fields = [
            "status",
            "total_distance_miles",
            "total_drive_hours",
            "total_on_duty_hours",
            "stops",
            "segments",
            "recaps",
            "created_at",
            "updated_at",
        ]

    def create(self, validated_data):
        carrier_data = validated_data.pop("carrier")
        carrier = CarrierInfo.objects.create(**carrier_data)
        trip = Trip.objects.create(carrier=carrier, **validated_data)
        return trip

    def update(self, instance, validated_data):
        carrier_data = validated_data.pop("carrier", None)
        if carrier_data:
            for attr, value in carrier_data.items():
                setattr(instance.carrier, attr, value)
            instance.carrier.save(update_fields=list(carrier_data.keys()))

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance
