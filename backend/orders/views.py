from django.shortcuts import render

# Create your views here.
from decimal import Decimal

from django.db import transaction

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .models import Order, OrderItem
from .serializers import OrderSerializer
from .permissions import IsCustomer

from cart.models import Cart
from products.models import Product


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

        # Re-check stock before creating the order
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

        # Create order
        order = Order.objects.create(
            customer=request.user,
            status=Order.Status.PENDING,
            total_amount=Decimal("0.00")
        )

        total_amount = Decimal("0.00")

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

        order.total_amount = total_amount

        order.save(
            update_fields=[
                "total_amount",
                "updated_at"
            ]
        )

        # Clear cart after successful order creation
        cart.items.all().delete()

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