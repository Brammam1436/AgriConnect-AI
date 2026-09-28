import os
from collections import defaultdict

import django
import joblib
from sklearn.linear_model import LinearRegression


# --------------------------------------------------
# Django setup
# --------------------------------------------------

BASE_DIR = os.path.dirname(
    os.path.dirname(
        os.path.dirname(
            os.path.abspath(__file__)
        )
    )
)

import sys

sys.path.append(BASE_DIR)

os.environ.setdefault(
    "DJANGO_SETTINGS_MODULE",
    "config.settings"
)

django.setup()


# --------------------------------------------------
# Import Django model
# --------------------------------------------------

from orders.models import OrderItem


# --------------------------------------------------
# Train demand prediction model
# --------------------------------------------------

def train_demand_model():
    """
    Train a machine learning model using
    real delivered order data.
    """

    delivered_items = (
        OrderItem.objects
        .filter(order__status="DELIVERED")
        .select_related("order", "product")
        .order_by("order__created_at")
    )

    # ----------------------------------------------
    # Aggregate demand by product, year and month
    # ----------------------------------------------

    demand_data = defaultdict(float)

    for item in delivered_items:

        product_id = item.product.id
        year = item.order.created_at.year
        month = item.order.created_at.month

        key = (
            product_id,
            year,
            month
        )

        demand_data[key] += float(
            item.quantity
        )

    print("\nAggregated demand data:")

    # ----------------------------------------------
    # Prepare ML training data
    # ----------------------------------------------

    X = []
    y = []

    for (
        product_id,
        year,
        month
    ), demand in demand_data.items():

        print(
            "Product ID:", product_id,
            "| Year:", year,
            "| Month:", month,
            "| Demand:", demand
        )

        X.append([
            product_id,
            year,
            month
        ])

        y.append(demand)

    print("\nTraining features:", X)
    print("Training targets:", y)

    # ----------------------------------------------
    # Check minimum historical data
    # ----------------------------------------------

    if len(X) < 3:

        print(
            "\nNot enough historical data to train "
            "a reliable ML model."
        )

        print(
            "Current training records:",
            len(X)
        )

        return None

    # ----------------------------------------------
    # Train Linear Regression model
    # ----------------------------------------------

    model = LinearRegression()

    model.fit(
        X,
        y
    )

    print(
        "\nDemand prediction model trained successfully."
    )

    return model


# --------------------------------------------------
# Save trained model
# --------------------------------------------------

def save_model(model):
    """
    Save the trained model to a file.
    """

    model_path = os.path.join(
        os.path.dirname(
            os.path.abspath(__file__)
        ),
        "demand_model.pkl"
    )

    joblib.dump(
        model,
        model_path
    )

    print(
        "\nModel saved successfully at:",
        model_path
    )


# --------------------------------------------------
# Run training script
# --------------------------------------------------

if __name__ == "__main__":

    model = train_demand_model()

    if model is not None:

        save_model(model)

        prediction = model.predict([
            [5, 2026, 9]
        ])

        print(
            "\nPredicted demand:",
            prediction[0]
        )

    else:

        print(
            "\nPrediction skipped because there "
            "is not enough historical data."
        )