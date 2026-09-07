from django.db import models
from farmers.models import FarmerProfile, Farm


class Product(models.Model):

    class Category(models.TextChoices):
        VEGETABLE = "VEGETABLE", "Vegetable"
        FRUIT = "FRUIT", "Fruit"
        GRAIN = "GRAIN", "Grain"
        PULSE = "PULSE", "Pulse"
        SPICE = "SPICE", "Spice"
        OTHER = "OTHER", "Other"

    farmer = models.ForeignKey(
        FarmerProfile,
        on_delete=models.CASCADE,
        related_name="products",
    )

    farm = models.ForeignKey(
        Farm,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="products",
    )

    name = models.CharField(max_length=200)

    category = models.CharField(
        max_length=20,
        choices=Category.choices
    )

    description = models.TextField(blank=True)

    image = models.ImageField(
        upload_to="products/",
        null=True,
        blank=True
    )

    price_per_kg = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )

    available_quantity = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )

    unit = models.CharField(
        max_length=20,
        default="kg"
    )

    is_available = models.BooleanField(
        default=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    def __str__(self):
        return self.name