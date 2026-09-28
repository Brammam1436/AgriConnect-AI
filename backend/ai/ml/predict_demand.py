import os

import joblib

from orders.models import OrderItem


# --------------------------------------------------
# Model path
# --------------------------------------------------

MODEL_PATH = os.path.join(
    os.path.dirname(
        os.path.abspath(__file__)
    ),
    "demand_model.pkl"
)


# --------------------------------------------------
# Historical average demand
# --------------------------------------------------

def get_historical_average(product_id):
    """
    Calculate the average delivered demand
    for a product using real order data.
    """

    items = (
        OrderItem.objects
        .filter(
            product_id=product_id,
            order__status="DELIVERED"
        )
    )

    if not items.exists():
        return None

    total_quantity = sum(
        float(item.quantity)
        for item in items
    )

    order_count = items.count()

    if order_count == 0:
        return None

    average_demand = (
        total_quantity / order_count
    )

    return round(
        average_demand,
        2
    )


# --------------------------------------------------
# Demand prediction
# --------------------------------------------------

def predict_demand(
    product_id,
    year,
    month
):
    """
    Predict product demand.

    Uses the trained ML model when available.
    Otherwise, uses historical average demand.
    """

    # ----------------------------------------------
    # ML model available
    # ----------------------------------------------

    if os.path.exists(MODEL_PATH):

        model = joblib.load(
            MODEL_PATH
        )

        prediction = model.predict([
            [
                product_id,
                year,
                month
            ]
        ])

        predicted_demand = max(
            0,
            float(prediction[0])
        )

        return {
            "success": True,
            "prediction_method": "machine_learning",
            "message": (
                "Demand prediction generated "
                "using the machine learning model."
            ),
            "product_id": product_id,
            "year": year,
            "month": month,
            "predicted_demand": round(
                predicted_demand,
                2
            )
        }

    # ----------------------------------------------
    # ML model unavailable
    # ----------------------------------------------

    historical_average = (
        get_historical_average(
            product_id
        )
    )

    if historical_average is not None:

        return {
            "success": True,
            "prediction_method": "historical_average",
            "message": (
                "ML model is not available yet. "
                "Historical average demand is being "
                "used as a fallback."
            ),
            "product_id": product_id,
            "year": year,
            "month": month,
            "predicted_demand": historical_average
        }

    # ----------------------------------------------
    # No historical data
    # ----------------------------------------------

    return {
        "success": False,
        "prediction_method": None,
        "message": (
            "Demand prediction is not available. "
            "No historical delivered order data "
            "was found for this product."
        ),
        "product_id": product_id,
        "year": year,
        "month": month,
        "predicted_demand": None
    }