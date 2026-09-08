from rest_framework import serializers

from .models import Order, OrderItem


class OrderItemSerializer(serializers.ModelSerializer):

    product_name = serializers.CharField(
        source="product.name",
        read_only=True
    )

    class Meta:
        model = OrderItem

        fields = [
            "id",
            "product",
            "product_name",
            "quantity",
            "price_per_kg",
            "subtotal",
        ]

        read_only_fields = [
            "id",
            "product_name",
            "price_per_kg",
            "subtotal",
        ]


class OrderSerializer(serializers.ModelSerializer):

    items = OrderItemSerializer(
        many=True,
        read_only=True
    )

    class Meta:
        model = Order

        fields = [
            "id",
            "status",
            "total_amount",
            "items",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "status",
            "total_amount",
            "items",
            "created_at",
            "updated_at",
        ]