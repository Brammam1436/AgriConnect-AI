from rest_framework import serializers
from .models import Product


class ProductSerializer(serializers.ModelSerializer):

    class Meta:
        model = Product

        fields = [
            "id",
            "farmer",
            "farm",
            "name",
            "category",
            "description",
            "image",
            "price_per_kg",
            "available_quantity",
            "unit",
            "is_available",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "farmer",
            "created_at",
            "updated_at",
        ]