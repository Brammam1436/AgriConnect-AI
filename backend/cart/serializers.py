from decimal import Decimal

from rest_framework import serializers

from .models import Cart, CartItem


class CartItemSerializer(serializers.ModelSerializer):

    product_name = serializers.CharField(
        source="product.name",
        read_only=True
    )

    price_per_kg = serializers.DecimalField(
        source="product.price_per_kg",
        max_digits=10,
        decimal_places=2,
        read_only=True
    )

    subtotal = serializers.SerializerMethodField()

    class Meta:
        model = CartItem
        fields = [
            "id",
            "product",
            "product_name",
            "price_per_kg",
            "quantity",
            "subtotal",
        ]

    def validate_quantity(self, value):

        if value <= Decimal("0"):
            raise serializers.ValidationError(
                "Quantity must be greater than 0."
            )

        return value

    def get_subtotal(self, obj):

        return obj.product.price_per_kg * obj.quantity


class CartSerializer(serializers.ModelSerializer):

    items = CartItemSerializer(
        many=True,
        read_only=True
    )

    total = serializers.SerializerMethodField()

    class Meta:
        model = Cart
        fields = [
            "id",
            "items",
            "total",
            "created_at",
            "updated_at",
        ]

    def get_total(self, obj):

        total = Decimal("0")

        for item in obj.items.all():
            total += item.product.price_per_kg * item.quantity

        return total