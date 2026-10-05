from decimal import Decimal

from rest_framework import serializers

from .models import Cart, CartItem


class CartItemSerializer(serializers.ModelSerializer):

    product = serializers.SerializerMethodField()

    class Meta:
        model = CartItem
        fields = [
            "id",
            "product",
            "quantity",
            "created_at",
            "updated_at",
        ]

    def get_product(self, obj):

        product = obj.product

        request = self.context.get("request")

        image_url = None

        if product.image:
            image_url = product.image.url

            if request:
                image_url = request.build_absolute_uri(
                    image_url
                )

        return {
            "id": product.id,
            "name": product.name,
            "category": product.category,
            "description": product.description,
            "price_per_kg": str(
                product.price_per_kg
            ),
            "available_quantity": str(
                product.available_quantity
            ),
            "unit": product.unit,
            "is_available": product.is_available,
            "image": image_url,
        }


class CartSerializer(serializers.ModelSerializer):

    items = CartItemSerializer(
        many=True,
        read_only=True
    )

    total_amount = serializers.SerializerMethodField()

    class Meta:
        model = Cart
        fields = [
            "id",
            "items",
            "total_amount",
            "created_at",
            "updated_at",
        ]

    def get_total_amount(self, obj):

        total = 0

        for item in obj.items.all():

            total += (
                item.quantity *
                item.product.price_per_kg
            )

        return str(total)