from decimal import Decimal, InvalidOperation

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .models import Cart, CartItem
from .serializers import CartSerializer
from .permissions import IsCustomer
from products.models import Product

class CartView(APIView):

    permission_classes = [IsCustomer]

    def get(self, request):

        cart, created = Cart.objects.get_or_create(
            customer=request.user
        )

        serializer = CartSerializer(
            cart,
            context={
                "request": request
            }
        )
        return Response(serializer.data)


class CartItemCreateView(APIView):

    permission_classes = [IsCustomer]

    def post(self, request):

        product_id = request.data.get("product")
        quantity = request.data.get("quantity")

        if product_id is None or quantity is None:
            return Response(
                {
                    "detail": "Product and quantity are required."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            product = Product.objects.get(
                id=product_id
            )
        except Product.DoesNotExist:
            return Response(
                {
                    "detail": "Product not found."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        if not product.is_available:
            return Response(
                {
                    "detail": "This product is currently unavailable."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            quantity = Decimal(str(quantity))
        except (InvalidOperation, TypeError, ValueError):
            return Response(
                {
                    "detail": "Quantity must be a valid number."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if quantity <= Decimal("0"):
            return Response(
                {
                    "detail": "Quantity must be greater than 0."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if quantity > product.available_quantity:
            return Response(
                {
                    "detail": "Requested quantity is greater than available quantity."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        cart, created = Cart.objects.get_or_create(
            customer=request.user
        )

        cart_item, item_created = CartItem.objects.get_or_create(
            cart=cart,
            product=product,
            defaults={
                "quantity": quantity
            }
        )

        if not item_created:

            new_quantity = cart_item.quantity + quantity

            if new_quantity > product.available_quantity:
                return Response(
                    {
                        "detail": "Total cart quantity is greater than available quantity."
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            cart_item.quantity = new_quantity
            cart_item.save()

        serializer = CartSerializer(
            cart,
            context={
                "request": request
            }
        )
        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED
        )

class CartItemUpdateView(APIView):

    permission_classes = [IsCustomer]

    def put(self, request, pk):

        try:
            cart = Cart.objects.get(
                customer=request.user
            )
        except Cart.DoesNotExist:
            return Response(
                {"detail": "Cart not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        try:
            cart_item = CartItem.objects.select_related(
                "product"
            ).get(
                id=pk,
                cart=cart
            )
        except CartItem.DoesNotExist:
            return Response(
                {"detail": "Cart item not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        quantity = request.data.get("quantity")

        if quantity is None:
            return Response(
                {"detail": "Quantity is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            quantity = float(quantity)
        except (TypeError, ValueError):
            return Response(
                {"detail": "Quantity must be a valid number."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if quantity <= 0:
            return Response(
                {"detail": "Quantity must be greater than 0."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if quantity > float(cart_item.product.available_quantity):
            return Response(
                {
                    "detail": "Requested quantity is greater than available quantity."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        cart_item.quantity = quantity
        cart_item.save()

        serializer = CartSerializer(
            cart,
            context={
                "request": request
            }
        )
        return Response(serializer.data)
    
    def delete(self, request, pk):

        try:
            cart = Cart.objects.get(
                customer=request.user
            )
        except Cart.DoesNotExist:
            return Response(
                {"detail": "Cart not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        try:
            cart_item = CartItem.objects.get(
                id=pk,
                cart=cart
            )
        except CartItem.DoesNotExist:
            return Response(
                {"detail": "Cart item not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        cart_item.delete()

        return Response(
            {"detail": "Cart item removed successfully."},
            status=status.HTTP_200_OK
        )
