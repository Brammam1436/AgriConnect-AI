from django.db import models

# Create your models here.
from django.conf import settings
from django.db import models


class Notification(models.Model):

    class NotificationType(models.TextChoices):
        ORDER_CREATED = "ORDER_CREATED", "Order Created"
        PAYMENT_SUCCESS = "PAYMENT_SUCCESS", "Payment Success"
        PAYMENT_FAILED = "PAYMENT_FAILED", "Payment Failed"
        ORDER_CONFIRMED = "ORDER_CONFIRMED", "Order Confirmed"
        ORDER_PROCESSING = "ORDER_PROCESSING", "Order Processing"
        ORDER_SHIPPED = "ORDER_SHIPPED", "Order Shipped"
        ORDER_DELIVERED = "ORDER_DELIVERED", "Order Delivered"
        ORDER_CANCELLED = "ORDER_CANCELLED", "Order Cancelled"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications"
    )

    notification_type = models.CharField(
        max_length=30,
        choices=NotificationType.choices
    )

    title = models.CharField(
        max_length=200
    )

    message = models.TextField()

    is_read = models.BooleanField(
        default=False
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.title} - {self.user.username}"