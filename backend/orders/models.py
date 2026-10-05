from decimal import Decimal

from django.db import models
from django.conf import settings

from products.models import Product


class Order(models.Model):

    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        CONFIRMED = "CONFIRMED", "Confirmed"
        PROCESSING = "PROCESSING", "Processing"
        SHIPPED = "SHIPPED", "Shipped"
        DELIVERED = "DELIVERED", "Delivered"
        CANCELLED = "CANCELLED", "Cancelled"

    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="orders"
    )

    # Delivery address snapshot
    # These values are copied from the customer's selected address
    # when the order is created.

    delivery_name = models.CharField(
        max_length=100,
        blank=True
    )

    delivery_phone = models.CharField(
        max_length=15,
        blank=True
    )

    delivery_address_line1 = models.CharField(
        max_length=255,
        blank=True
    )

    delivery_address_line2 = models.CharField(
        max_length=255,
        blank=True
    )

    delivery_city = models.CharField(
        max_length=100,
        blank=True
    )

    delivery_state = models.CharField(
        max_length=100,
        blank=True
    )

    delivery_postal_code = models.CharField(
        max_length=10,
        blank=True
    )

    delivery_country = models.CharField(
        max_length=100,
        default="India",
        blank=True
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING
    )

    total_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00")
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    def __str__(self):
        return f"Order #{self.id} - {self.customer.username}"


class OrderItem(models.Model):

    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name="items"
    )

    product = models.ForeignKey(
        Product,
        on_delete=models.PROTECT,
        related_name="order_items"
    )

    quantity = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )

    price_per_kg = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )

    subtotal = models.DecimalField(
        max_digits=12,
        decimal_places=2
    )

    def __str__(self):
        return f"{self.product.name} - {self.quantity}"