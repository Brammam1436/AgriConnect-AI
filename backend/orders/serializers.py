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

    customer_username = serializers.CharField(
        source="customer.username",
        read_only=True
    )

    items = OrderItemSerializer(
        many=True,
        read_only=True
    )

    class Meta:
        model = Order

        fields = [
            "id",
            "customer_username",
            "status",
            "total_amount",

            # Delivery address snapshot
            "delivery_name",
            "delivery_phone",
            "delivery_address_line1",
            "delivery_address_line2",
            "delivery_city",
            "delivery_state",
            "delivery_postal_code",
            "delivery_country",

            "items",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "customer_username",
            "status",
            "total_amount",

            "delivery_name",
            "delivery_phone",
            "delivery_address_line1",
            "delivery_address_line2",
            "delivery_city",
            "delivery_state",
            "delivery_postal_code",
            "delivery_country",

            "items",
            "created_at",
            "updated_at",
        ]


# =========================================================
# FARMER ORDER SERIALIZER
# =========================================================

class FarmerOrderSerializer(serializers.ModelSerializer):

    customer_username = serializers.CharField(
        source="customer.username",
        read_only=True
    )

    items = serializers.SerializerMethodField()

    farmer_total = serializers.SerializerMethodField()

    class Meta:
        model = Order

        fields = [
            "id",
            "customer_username",
            "status",

            # Complete customer order total
            "total_amount",

            # Only this farmer's products total
            "farmer_total",

            # Delivery address snapshot
            "delivery_name",
            "delivery_phone",
            "delivery_address_line1",
            "delivery_address_line2",
            "delivery_city",
            "delivery_state",
            "delivery_postal_code",
            "delivery_country",

            "items",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "customer_username",
            "status",
            "total_amount",
            "farmer_total",

            "delivery_name",
            "delivery_phone",
            "delivery_address_line1",
            "delivery_address_line2",
            "delivery_city",
            "delivery_state",
            "delivery_postal_code",
            "delivery_country",

            "items",
            "created_at",
            "updated_at",
        ]

    def get_items(self, obj):

        farmer = self.context.get("farmer")

        if not farmer:
            return []

        farmer_items = obj.items.filter(
            product__farmer=farmer
        ).select_related(
            "product"
        )

        return OrderItemSerializer(
            farmer_items,
            many=True
        ).data

    def get_farmer_total(self, obj):

        farmer = self.context.get("farmer")

        if not farmer:
            return "0.00"

        farmer_items = obj.items.filter(
            product__farmer=farmer
        )

        total = sum(
            item.subtotal
            for item in farmer_items
        )

        return f"{total:.2f}"