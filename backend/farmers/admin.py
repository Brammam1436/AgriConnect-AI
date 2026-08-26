# Register your models here.
from django.contrib import admin

from .models import FarmerProfile, Farm


@admin.register(FarmerProfile)
class FarmerProfileAdmin(admin.ModelAdmin):
    list_display = (
        "farm_name",
        "user",
        "village",
        "district",
        "state",
        "is_verified",
    )

    list_filter = (
        "is_verified",
        "state",
    )

    search_fields = (
        "farm_name",
        "village",
        "district",
    )


@admin.register(Farm)
class FarmAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "farmer",
        "area_acres",
        "soil_type",
    )

    search_fields = (
        "name",
        "location",
    )