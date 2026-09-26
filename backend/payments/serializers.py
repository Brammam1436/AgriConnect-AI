from rest_framework import serializers

from .models import Payment


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = [
            "id",
            "order",
            "amount",
            "razorpay_order_id",
            "razorpay_payment_id",
            "status",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "amount",
            "razorpay_order_id",
            "razorpay_payment_id",
            "status",
            "created_at",
            "updated_at",
        ]

class AdminPaymentSerializer(serializers.ModelSerializer):

    customer_username = serializers.CharField(
        source="customer.username",
        read_only=True
    )

    class Meta:
        model = Payment

        fields = [
            "id",
            "order",
            "customer_username",
            "amount",
            "razorpay_order_id",
            "razorpay_payment_id",
            "status",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "order",
            "customer_username",
            "amount",
            "razorpay_order_id",
            "razorpay_payment_id",
            "status",
            "created_at",
            "updated_at",
        ]