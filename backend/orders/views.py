from django.shortcuts import render

# Create your views here.
from decimal import Decimal

from django.db import transaction

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from .models import Order, OrderItem
from .serializers import OrderSerializer,FarmerOrderSerializer
from .permissions import IsCustomer, IsAdmin

from cart.models import Cart
from products.models import Product

from notifications.models import Notification

from accounts.models import CustomerAddress


class OrderListCreateView(APIView):

    permission_classes = [IsCustomer]

    def get(self, request):

        orders = Order.objects.filter(
            customer=request.user
        ).prefetch_related(
            "items__product"
        ).order_by(
            "-created_at"
        )

        serializer = OrderSerializer(
            orders,
            many=True
        )

        return Response(serializer.data)

    @transaction.atomic
    def post(self, request):

        # ---------------------------------------------------------
        # Get and validate selected delivery address
        # ---------------------------------------------------------

        address_id = request.data.get("address_id")

        if not address_id:

            return Response(
                {
                    "detail": "Please select a delivery address."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        try:

            # Important:
            # The address must belong to the logged-in customer.
            # This prevents one customer from using another
            # customer's address.
            address = CustomerAddress.objects.get(
                id=address_id,
                customer=request.user
            )

        except CustomerAddress.DoesNotExist:

            return Response(
                {
                    "detail": "Selected delivery address not found."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # ---------------------------------------------------------
        # Get customer's cart
        # ---------------------------------------------------------

        try:

            cart = Cart.objects.prefetch_related(
                "items__product"
            ).get(
                customer=request.user
            )

        except Cart.DoesNotExist:

            return Response(
                {
                    "detail": "Cart is empty."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        cart_items = list(
            cart.items.all()
        )

        if not cart_items:

            return Response(
                {
                    "detail": "Cart is empty."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # ---------------------------------------------------------
        # Re-check stock before creating the order
        # ---------------------------------------------------------

        for cart_item in cart_items:

            product = Product.objects.select_for_update().get(
                id=cart_item.product.id
            )

            if not product.is_available:

                return Response(
                    {
                        "detail":
                        f"{product.name} is currently unavailable."
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            if cart_item.quantity > product.available_quantity:

                return Response(
                    {
                        "detail":
                        f"Insufficient stock for {product.name}."
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

        # ---------------------------------------------------------
        # Create order
        # ---------------------------------------------------------
        # We store a snapshot of the delivery address.
        #
        # This is important because the customer may later edit
        # or delete their saved address. The old order should still
        # contain the address used when the order was placed.
        # ---------------------------------------------------------

        order = Order.objects.create(
            customer=request.user,
            status=Order.Status.PENDING,
            total_amount=Decimal("0.00"),

            delivery_name=address.full_name,
            delivery_phone=address.phone,
            delivery_address_line1=address.address_line1,
            delivery_address_line2=address.address_line2,
            delivery_city=address.city,
            delivery_state=address.state,
            delivery_postal_code=address.postal_code,
            delivery_country=address.country,
        )

        total_amount = Decimal("0.00")

        # ---------------------------------------------------------
        # Create order items and reduce stock
        # ---------------------------------------------------------

        for cart_item in cart_items:

            product = Product.objects.select_for_update().get(
                id=cart_item.product.id
            )

            quantity = cart_item.quantity
            price = product.price_per_kg

            subtotal = quantity * price

            OrderItem.objects.create(
                order=order,
                product=product,
                quantity=quantity,
                price_per_kg=price,
                subtotal=subtotal
            )

            product.available_quantity -= quantity

            product.save(
                update_fields=[
                    "available_quantity",
                    "updated_at"
                ]
            )

            if product.available_quantity == Decimal("0.00"):

                product.is_available = False

                product.save(
                    update_fields=[
                        "is_available",
                        "updated_at"
                    ]
                )

            total_amount += subtotal

        # ---------------------------------------------------------
        # Update order total
        # ---------------------------------------------------------

        order.total_amount = total_amount

        order.save(
            update_fields=[
                "total_amount",
                "updated_at"
            ]
        )

        # ---------------------------------------------------------
        # Clear cart after successful order creation
        # ---------------------------------------------------------

        cart.items.all().delete()

        # ---------------------------------------------------------
        # Create order-created notification for customer
        # ---------------------------------------------------------

        Notification.objects.create(
            user=request.user,
            notification_type=Notification.NotificationType.ORDER_CREATED,
            title="Order Created",
            message=(
                f"Your order #{order.id} has been "
                f"created successfully."
            )
        )

        # ---------------------------------------------------------
        # Notify farmers whose products are included in the order
        # ---------------------------------------------------------

        farmer_users = set()

        for item in order.items.select_related(
            "product__farmer__user"
        ):

            farmer_users.add(
                item.product.farmer.user
            )

        for farmer_user in farmer_users:

            Notification.objects.create(
                user=farmer_user,
                notification_type=Notification.NotificationType.ORDER_CREATED,
                title="New Order Received",
                message=(
                    f"A new order #{order.id} contains "
                    f"your product."
                )
            )

        # ---------------------------------------------------------
        # Return created order
        # ---------------------------------------------------------

        serializer = OrderSerializer(order)

        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED
        )


class OrderDetailView(APIView):

    permission_classes = [IsCustomer]

    def get(self, request, pk):

        try:

            order = Order.objects.prefetch_related(
                "items__product"
            ).get(
                id=pk,
                customer=request.user
            )

        except Order.DoesNotExist:

            return Response(
                {
                    "detail": "Order not found."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = OrderSerializer(order)

        return Response(serializer.data)


class OrderCancelView(APIView):

    permission_classes = [IsCustomer]

    @transaction.atomic
    def post(self, request, pk):

        try:

            order = Order.objects.prefetch_related(
                "items"
            ).get(
                id=pk,
                customer=request.user
            )

        except Order.DoesNotExist:

            return Response(
                {
                    "detail": "Order not found."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        if order.status == Order.Status.CANCELLED:

            return Response(
                {
                    "detail": "Order is already cancelled."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if order.status not in [
            Order.Status.PENDING,
            Order.Status.CONFIRMED
        ]:

            return Response(
                {
                    "detail":
                    "This order cannot be cancelled at its current status."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # ---------------------------------------------------------
        # Restore stock
        # ---------------------------------------------------------

        for item in order.items.all():

            product = Product.objects.select_for_update().get(
                id=item.product_id
            )

            product.available_quantity += item.quantity

            product.is_available = True

            product.save(
                update_fields=[
                    "available_quantity",
                    "is_available",
                    "updated_at"
                ]
            )

        # ---------------------------------------------------------
        # Update order status
        # ---------------------------------------------------------

        order.status = Order.Status.CANCELLED

        order.save(
            update_fields=[
                "status",
                "updated_at"
            ]
        )

        # ---------------------------------------------------------
        # Create cancellation notification
        # ---------------------------------------------------------

        Notification.objects.create(
            user=request.user,
            notification_type=Notification.NotificationType.ORDER_CANCELLED,
            title="Order Cancelled",
            message=(
                f"Your order #{order.id} has been cancelled successfully."
            )
        )

        serializer = OrderSerializer(order)

        return Response(serializer.data)


class OrderStatusUpdateView(APIView):

    permission_classes = [IsAdmin]

    @transaction.atomic
    def put(self, request, pk):

        try:

            order = Order.objects.get(
                id=pk
            )

        except Order.DoesNotExist:

            return Response(
                {
                    "detail": "Order not found."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        new_status = request.data.get("status")

        if not new_status:

            return Response(
                {
                    "detail": "Status is required."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        valid_statuses = [
            Order.Status.PENDING,
            Order.Status.CONFIRMED,
            Order.Status.PROCESSING,
            Order.Status.SHIPPED,
            Order.Status.DELIVERED,
            Order.Status.CANCELLED,
        ]

        if new_status not in valid_statuses:

            return Response(
                {
                    "detail": "Invalid order status."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        current_status = order.status

        allowed_transitions = {

            Order.Status.PENDING: [
                Order.Status.CONFIRMED,
                Order.Status.CANCELLED,
            ],

            Order.Status.CONFIRMED: [
                Order.Status.PROCESSING,
                Order.Status.CANCELLED,
            ],

            Order.Status.PROCESSING: [
                Order.Status.SHIPPED,
            ],

            Order.Status.SHIPPED: [
                Order.Status.DELIVERED,
            ],

            Order.Status.DELIVERED: [],

            Order.Status.CANCELLED: [],
        }

        if new_status not in allowed_transitions[current_status]:

            return Response(
                {
                    "detail":
                    f"Cannot change order status from "
                    f"{current_status} to {new_status}."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # ---------------------------------------------------------
        # If admin cancels the order, restore stock
        # ---------------------------------------------------------

        if new_status == Order.Status.CANCELLED:

            order_items = OrderItem.objects.filter(
                order=order
            )

            for item in order_items:

                product = Product.objects.select_for_update().get(
                    id=item.product_id
                )

                product.available_quantity += item.quantity

                product.is_available = True

                product.save(
                    update_fields=[
                        "available_quantity",
                        "is_available",
                        "updated_at"
                    ]
                )

        # ---------------------------------------------------------
        # Update order status
        # ---------------------------------------------------------

        order.status = new_status

        order.save(
            update_fields=[
                "status",
                "updated_at"
            ]
        )

        # ---------------------------------------------------------
        # Status notification map
        # ---------------------------------------------------------

        status_notification_map = {

            Order.Status.CONFIRMED: (
                Notification.NotificationType.ORDER_CONFIRMED,
                "Order Confirmed",
                f"Your order #{order.id} has been confirmed."
            ),

            Order.Status.PROCESSING: (
                Notification.NotificationType.ORDER_PROCESSING,
                "Order Processing",
                f"Your order #{order.id} is now being processed."
            ),

            Order.Status.SHIPPED: (
                Notification.NotificationType.ORDER_SHIPPED,
                "Order Shipped",
                f"Your order #{order.id} has been shipped."
            ),

            Order.Status.DELIVERED: (
                Notification.NotificationType.ORDER_DELIVERED,
                "Order Delivered",
                f"Your order #{order.id} has been delivered."
            ),

            Order.Status.CANCELLED: (
                Notification.NotificationType.ORDER_CANCELLED,
                "Order Cancelled",
                f"Your order #{order.id} has been cancelled."
            ),
        }

        notification_data = status_notification_map.get(
            new_status
        )

        if notification_data:

            notification_type, title, message = notification_data

            # -------------------------------------------------
            # Notify customer
            # -------------------------------------------------

            Notification.objects.create(
                user=order.customer,
                notification_type=notification_type,
                title=title,
                message=message
            )

            # -------------------------------------------------
            # Notify farmers whose products are in this order
            # -------------------------------------------------

            farmer_users = set()

            for item in OrderItem.objects.select_related(
                "product__farmer__user"
            ).filter(
                order=order
            ):

                farmer_users.add(
                    item.product.farmer.user
                )

            for farmer_user in farmer_users:

                Notification.objects.create(
                    user=farmer_user,
                    notification_type=notification_type,
                    title=title,
                    message=(
                        f"Order #{order.id} containing "
                        f"your product is now "
                        f"{new_status.lower()}."
                    )
                )
        # ---------------------------------------------------------
        # Return updated order
        # ---------------------------------------------------------

        serializer = OrderSerializer(order)

        return Response(serializer.data)
    

# =========================================================
# FARMER ORDER LIST
# =========================================================

class FarmerOrderListView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        # ---------------------------------------------------------
        # Only farmers can access this endpoint
        # ---------------------------------------------------------

        if request.user.role != "FARMER":

            return Response(
                {
                    "detail": "Only farmers can access farmer orders."
                },
                status=status.HTTP_403_FORBIDDEN
            )

        # ---------------------------------------------------------
        # Get farmer profile
        # ---------------------------------------------------------

        try:

            farmer = request.user.farmer_profile

        except Exception:

            return Response(
                {
                    "detail": "Farmer profile not found."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        # ---------------------------------------------------------
        # Get orders containing this farmer's products
        # ---------------------------------------------------------

        orders = (
            Order.objects
            .filter(
                items__product__farmer=farmer
            )
            .select_related(
                "customer"
            )
            .prefetch_related(
                "items__product"
            )
            .distinct()
            .order_by(
                "-created_at"
            )
        )

        # ---------------------------------------------------------
        # Serialize
        # ---------------------------------------------------------

        serializer = FarmerOrderSerializer(
            orders,
            many=True,
            context={
                "farmer": farmer
            }
        )

        return Response(
            serializer.data
        )