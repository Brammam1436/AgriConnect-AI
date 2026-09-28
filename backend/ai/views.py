from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from products.models import Product
from .ml.predict_demand import predict_demand


class DemandPredictionView(APIView):
    """
    API endpoint for product demand prediction.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request, product_id):

        # --------------------------------
        # 1. Check product
        # --------------------------------

        try:
            product = Product.objects.get(
                id=product_id
            )
        except Product.DoesNotExist:
            return Response(
                {
                    "error": "Product not found."
                },
                status=404
            )

        # --------------------------------
        # 2. Check farmer ownership
        # --------------------------------

        if request.user.role == "FARMER":
            if product.farmer.user != request.user:
                return Response(
                    {
                        "error": (
                            "You can only request "
                            "demand predictions for "
                            "your own products."
                        )
                    },
                    status=403
                )

        # --------------------------------
        # 3. Check year
        # --------------------------------

        year = request.query_params.get(
            "year"
        )

        if not year:
            return Response(
                {
                    "error": "year parameter is required."
                },
                status=400
            )

        try:
            year = int(year)
        except ValueError:
            return Response(
                {
                    "error": "year must be a number."
                },
                status=400
            )

        if year < 2000:
            return Response(
                {
                    "error": "year must be 2000 or later."
                },
                status=400
            )

        # --------------------------------
        # 4. Check month
        # --------------------------------

        month = request.query_params.get(
            "month"
        )

        if not month:
            return Response(
                {
                    "error": "month parameter is required."
                },
                status=400
            )

        try:
            month = int(month)
        except ValueError:
            return Response(
                {
                    "error": "month must be a number."
                },
                status=400
            )

        if month < 1 or month > 12:
            return Response(
                {
                    "error": "month must be between 1 and 12."
                },
                status=400
            )

        # --------------------------------
        # 5. Generate prediction
        # --------------------------------

        result = predict_demand(
            product_id,
            year,
            month
        )

        # --------------------------------
        # 6. Add product information
        # --------------------------------

        result["product_name"] = product.name
        result["product_category"] = product.category

        return Response(
            result
        )