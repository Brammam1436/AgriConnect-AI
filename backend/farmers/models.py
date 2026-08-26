from django.db import models

# Create your models here.
from django.conf import settings
from django.db import models


class FarmerProfile(models.Model):

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="farmer_profile",
    )

    farm_name = models.CharField(max_length=200)

    phone = models.CharField(max_length=15)

    address = models.TextField()

    village = models.CharField(max_length=100)

    district = models.CharField(max_length=100)

    state = models.CharField(max_length=100)

    pincode = models.CharField(max_length=10)

    is_verified = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.farm_name

class Farm(models.Model):

    farmer = models.ForeignKey(
        FarmerProfile,
        on_delete=models.CASCADE,
        related_name="farms",
    )

    name = models.CharField(max_length=200)

    location = models.CharField(max_length=255)

    area_acres = models.DecimalField(
        max_digits=10,
        decimal_places=2,
    )

    soil_type = models.CharField(
        max_length=100,
        blank=True,
    )

    description = models.TextField(
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    def __str__(self):
        return self.name