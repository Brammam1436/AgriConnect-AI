from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from .models import Product, Review
from .serializers import ProductSerializer, ReviewSerializer
from .permissions import IsFarmerOrReadOnly
from .pagination import ProductPagination

from rest_framework.parsers import MultiPartParser, FormParser

from farmers.models import FarmerProfile
from orders.models import Order, OrderItem

from django.db.models import Avg, Count


class ProductListCreateView(APIView):

    permission_classes = [IsFarmerOrReadOnly]
    pagination_class = ProductPagination
    parser_classes = [MultiPartParser, FormParser]

    def get(self, request):

        if request.user.role == "FARMER":
            products = Product.objects.filter(
                farmer__user=request.user
            )
        else:
            products = Product.objects.all()

        # Search by product name
        search = request.query_params.get("search")

        if search:
            products = products.filter(
                name__icontains=search
            )

        # Filter by category
        category = request.query_params.get("category")

        if category:
            products = products.filter(
                category__iexact=category
            )

        # Filter by availability
        is_available = request.query_params.get("is_available")

        if is_available is not None:
            products = products.filter(
                is_available=is_available.lower() == "true"
            )

        # Sorting
        sort = request.query_params.get("sort")

        if sort == "price_low":
            products = products.order_by("price_per_kg")

        elif sort == "price_high":
            products = products.order_by("-price_per_kg")

        elif sort == "oldest":
            products = products.order_by("created_at")

        else:
            # Default: newest products first
            products = products.order_by("-created_at")

        # Pagination
        paginator = self.pagination_class()

        page = paginator.paginate_queryset(
            products,
            request
        )

        serializer = ProductSerializer(
            page,
            many=True
        )

        return paginator.get_paginated_response(
            serializer.data
        )

    def post(self, request):

        # Only farmers can create products
        if request.user.role != "FARMER":
            return Response(
                {
                    "detail": "Only farmers can create products."
                },
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            farmer = FarmerProfile.objects.get(
                user=request.user
            )
        except FarmerProfile.DoesNotExist:
            return Response(
                {
                    "detail": "Farmer profile not found."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = ProductSerializer(
            data=request.data
        )

        if serializer.is_valid():

            product = serializer.save(
                farmer=farmer
            )

            return Response(
                ProductSerializer(product).data,
                status=status.HTTP_201_CREATED
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


class ProductDetailView(APIView):

    permission_classes = [IsFarmerOrReadOnly]
    parser_classes = [MultiPartParser, FormParser]

    def get_product(self, request, pk):

        try:
            return Product.objects.get(id=pk)

        except Product.DoesNotExist:
            return None

    def get(self, request, pk):

        product = self.get_product(request, pk)

        if product is None:
            return Response(
                {
                    "detail": "Product not found."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = ProductSerializer(product)

        return Response(serializer.data)

    def put(self, request, pk):

        product = self.get_product(request, pk)

        if product is None:
            return Response(
                {
                    "detail": "Product not found."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        if product.farmer.user != request.user:
            return Response(
                {
                    "detail": (
                        "You can only update your own products."
                    )
                },
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = ProductSerializer(
            product,
            data=request.data,
            partial=True
        )

        if serializer.is_valid():

            serializer.save()

            return Response(
                serializer.data
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

    def delete(self, request, pk):

        product = self.get_product(request, pk)

        if product is None:
            return Response(
                {
                    "detail": "Product not found."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        if product.farmer.user != request.user:
            return Response(
                {
                    "detail": (
                        "You can only delete your own products."
                    )
                },
                status=status.HTTP_403_FORBIDDEN
            )

        product.delete()

        return Response(
            status=status.HTTP_204_NO_CONTENT
        )


# =========================================================
# CUSTOMER PRODUCT REVIEW API
# =========================================================

class ProductReviewListCreateView(APIView):

    permission_classes = [IsAuthenticated]

    def get_product(self, pk):

        try:
            return Product.objects.get(id=pk)

        except Product.DoesNotExist:
            return None

    def get(self, request, pk):

        product = self.get_product(pk)

        if product is None:
            return Response(
                {
                    "detail": "Product not found."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        reviews = Review.objects.filter(
            product=product
        ).select_related("customer")

        serializer = ReviewSerializer(
            reviews,
            many=True
        )

        # Find the logged-in customer's review
        my_review = reviews.filter(
            customer=request.user
        ).first()

        my_review_data = None

        if my_review:

            my_review_data = {
                "id": my_review.id,
                "rating": my_review.rating,
                "comment": my_review.comment,
                "created_at": my_review.created_at,
                "updated_at": my_review.updated_at,
            }

        return Response(
            {
                "product_id": product.id,
                "product_name": product.name,
                "total_reviews": reviews.count(),
                "my_review": my_review_data,
                "reviews": serializer.data,
            }
        )

    def post(self, request, pk):

        # Only customers can create reviews
        if request.user.role != "CUSTOMER":

            return Response(
                {
                    "detail": (
                        "Only customers can submit "
                        "product reviews."
                    )
                },
                status=status.HTTP_403_FORBIDDEN
            )

        product = self.get_product(pk)

        if product is None:

            return Response(
                {
                    "detail": "Product not found."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        # Check whether customer already reviewed
        existing_review = Review.objects.filter(
            product=product,
            customer=request.user
        ).first()

        if existing_review:

            return Response(
                {
                    "detail": (
                        "You have already reviewed "
                        "this product."
                    ),
                    "review_id": existing_review.id
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check whether customer purchased product
        purchased = OrderItem.objects.filter(
            product=product,
            order__customer=request.user,
            order__status=Order.Status.DELIVERED
        ).exists()

        if not purchased:

            return Response(
                {
                    "detail": (
                        "You can review this product only "
                        "after it has been delivered."
                    )
                },
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = ReviewSerializer(
            data=request.data
        )

        if serializer.is_valid():

            review = serializer.save(
                product=product,
                customer=request.user
            )

            return Response(
                ReviewSerializer(review).data,
                status=status.HTTP_201_CREATED
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


# =========================================================
# FARMER REVIEW API
# =========================================================

class FarmerReviewListView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        # Only farmers can access this endpoint
        if request.user.role != "FARMER":

            return Response(
                {
                    "detail": (
                        "Only farmers can view "
                        "their product reviews."
                    )
                },
                status=status.HTTP_403_FORBIDDEN
            )

        # Make sure farmer profile exists
        try:
            farmer = FarmerProfile.objects.get(
                user=request.user
            )
        except FarmerProfile.DoesNotExist:

            return Response(
                {
                    "detail": "Farmer profile not found."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        # Get only this farmer's products
        products = Product.objects.filter(
            farmer=farmer
        ).annotate(
            calculated_average_rating=Avg(
                "reviews__rating"
            ),
            calculated_review_count=Count(
                "reviews"
            )
        ).order_by("-created_at")

        product_data = []

        total_reviews = 0
        rating_sum = 0
        rated_products = 0

        for product in products:

            average_rating = (
                round(
                    float(
                        product.calculated_average_rating
                    ),
                    1
                )
                if product.calculated_average_rating
                is not None
                else 0
            )

            review_count = (
                product.calculated_review_count
                or 0
            )

            reviews = Review.objects.filter(
                product=product
            ).select_related(
                "customer"
            )

            review_serializer = ReviewSerializer(
                reviews,
                many=True
            )

            product_data.append(
                {
                    "product_id": product.id,
                    "product_name": product.name,
                    "average_rating": average_rating,
                    "review_count": review_count,
                    "reviews": review_serializer.data,
                }
            )

            total_reviews += review_count

            if review_count > 0:
                rating_sum += (
                    average_rating * review_count
                )
                rated_products += review_count

        # Overall farmer rating
        overall_rating = (
            round(
                rating_sum / rated_products,
                1
            )
            if rated_products > 0
            else 0
        )

        return Response(
            {
                "farmer_id": farmer.id,
                "farmer_username": request.user.username,
                "total_products": products.count(),
                "total_reviews": total_reviews,
                "overall_rating": overall_rating,
                "products": product_data,
            }
        )


# =========================================================
# REVIEW DETAIL API
# =========================================================

class ReviewDetailView(APIView):

    permission_classes = [IsAuthenticated]

    def get_review(self, pk):

        try:
            return Review.objects.select_related(
                "product",
                "customer"
            ).get(id=pk)

        except Review.DoesNotExist:
            return None

    def put(self, request, pk):

        review = self.get_review(pk)

        if review is None:

            return Response(
                {
                    "detail": "Review not found."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        # Only review owner can edit
        if review.customer != request.user:

            return Response(
                {
                    "detail": (
                        "You can only edit "
                        "your own review."
                    )
                },
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = ReviewSerializer(
            review,
            data=request.data,
            partial=True
        )

        if serializer.is_valid():

            serializer.save()

            return Response(
                serializer.data
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

    def delete(self, request, pk):

        review = self.get_review(pk)

        if review is None:

            return Response(
                {
                    "detail": "Review not found."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        # Only review owner can delete
        if review.customer != request.user:

            return Response(
                {
                    "detail": (
                        "You can only delete "
                        "your own review."
                    )
                },
                status=status.HTTP_403_FORBIDDEN
            )

        review.delete()

        return Response(
            status=status.HTTP_204_NO_CONTENT
        )