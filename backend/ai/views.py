from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .ml.predict_demand import predict_demand


class DemandPredictionView(APIView):
    """
    API endpoint for product demand prediction.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request, product_id):

        # ------------------------------------------
        # Get year parameter
        # ------------------------------------------

        year = request.query_params.get("year")

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

        # ------------------------------------------
        # Validate year
        # ------------------------------------------

        if year < 2000:
            return Response(
                {
                    "error": "year must be 2000 or later."
                },
                status=400
            )

        # ------------------------------------------
        # Get month parameter
        # ------------------------------------------

        month = request.query_params.get("month")

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

        # ------------------------------------------
        # Validate month
        # ------------------------------------------

        if month < 1 or month > 12:
            return Response(
                {
                    "error": "month must be between 1 and 12."
                },
                status=400
            )

        # ------------------------------------------
        # Generate prediction
        # ------------------------------------------

        result = predict_demand(
            product_id,
            year,
            month
        )

        return Response(result)