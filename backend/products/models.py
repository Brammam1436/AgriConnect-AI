from django.db import models
from django.conf import settings
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


class Review(models.Model):

    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="reviews"
    )

    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="product_reviews"
    )

    rating = models.PositiveSmallIntegerField()

    comment = models.TextField(blank=True)

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["product", "customer"],
                name="unique_customer_product_review"
            )
        ]

    def __str__(self):
        return f"{self.product.name} - {self.customer.username} - {self.rating}/5"