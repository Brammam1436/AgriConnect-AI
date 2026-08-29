from rest_framework import serializers

from .models import FarmerProfile, Farm


class FarmerProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = FarmerProfile
        fields = [
            "id",
            "user",
            "farm_name",
            "phone",
            "address",
            "village",
            "district",
            "state",
            "pincode",
            "is_verified",
            "created_at",
        ]

        read_only_fields = [
            "id",
            "user",
            "is_verified",
            "created_at",
        ]


class FarmSerializer(serializers.ModelSerializer):
    class Meta:
        model = Farm
        fields = [
            "id",
            "farmer",
            "name",
            "location",
            "area_acres",
            "soil_type",
            "description",
            "created_at",
        ]

        read_only_fields = [
            "id",
            "farmer",
            "created_at",
        ]