from rest_framework import serializers
from .models import Product, Review
from django.db.models import Avg

class ProductSerializer(serializers.ModelSerializer):
    average_rating = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()

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
            "average_rating",
            "review_count",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "farmer",
            "average_rating",
            "review_count",
            "created_at",
            "updated_at",
        ]

    def get_average_rating(self, obj):
        average = obj.reviews.aggregate(
            average=Avg("rating")
        )["average"]

        if average is None:
            return 0

        return round(float(average), 1)

    def get_review_count(self, obj):
        return obj.reviews.count()

class ReviewSerializer(serializers.ModelSerializer):

    customer_name = serializers.CharField(
        source="customer.username",
        read_only=True
    )

    product_name = serializers.CharField(
        source="product.name",
        read_only=True
    )

    class Meta:
        model = Review

        fields = [
            "id",
            "product",
            "product_name",
            "customer",
            "customer_name",
            "rating",
            "comment",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "product",
            "customer",
            "customer_name",
            "product_name",
            "created_at",
            "updated_at",
        ]

    def validate_rating(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError(
                "Rating must be between 1 and 5."
            )

        return value