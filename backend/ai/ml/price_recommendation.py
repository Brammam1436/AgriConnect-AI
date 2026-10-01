from decimal import Decimal

from products.models import Product
from orders.models import OrderItem


def get_historical_average_price(product_id):
    """
    Calculate the average price per kg
    from delivered orders for a product.
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

    total_price = Decimal("0.00")
    item_count = 0

    for item in items:
        total_price += item.price_per_kg
        item_count += 1

    if item_count == 0:
        return None

    average_price = (
        total_price / item_count
    )

    return average_price.quantize(
        Decimal("0.01")
    )


def recommend_price(product_id):
    """
    Generate a recommended selling price
    using the current product price and
    historical delivered order prices.
    """

    # --------------------------------
    # 1. Get product
    # --------------------------------

    try:
        product = Product.objects.get(
            id=product_id
        )
    except Product.DoesNotExist:
        return {
            "success": False,
            "message": "Product not found."
        }

    # --------------------------------
    # 2. Get current price
    # --------------------------------

    current_price = product.price_per_kg

    # --------------------------------
    # 3. Get historical average price
    # --------------------------------

    historical_average = (
        get_historical_average_price(
            product_id
        )
    )

    # --------------------------------
    # 4. Check historical data
    # --------------------------------

    if historical_average is None:
        return {
            "success": False,
            "message": (
                "Price recommendation is not "
                "available because no historical "
                "delivered order price was found "
                "for this product."
            ),
            "product_id": product.id,
            "product_name": product.name,
            "current_price_per_kg": float(
                current_price
            ),
            "historical_average_price": None,
            "recommended_price_per_kg": None
        }

    # --------------------------------
    # 5. Calculate recommended price
    # --------------------------------

    recommended_price = (
        current_price +
        historical_average
    ) / Decimal("2")

    recommended_price = (
        recommended_price.quantize(
            Decimal("0.01")
        )
    )

    # --------------------------------
    # 6. Return result
    # --------------------------------

    return {
        "success": True,
        "message": (
            "Price recommendation generated "
            "using the current product price "
            "and historical delivered order prices."
        ),
        "product_id": product.id,
        "product_name": product.name,
        "product_category": product.category,
        "current_price_per_kg": float(
            current_price
        ),
        "historical_average_price": float(
            historical_average
        ),
        "recommended_price_per_kg": float(
            recommended_price
        )
    }