from django.shortcuts import render

# Create your views here.
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from .serializers import RegisterSerializer, UserSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from rest_framework.permissions import IsAuthenticated
from accounts.permissions import IsAdminOnly
from accounts.models import User
from farmers.models import FarmerProfile
from products.models import Product
from orders.models import Order
from payments.models import Payment

from products.models import Product
from products.serializers import ProductSerializer

from orders.serializers import OrderSerializer
from payments.serializers import AdminPaymentSerializer

class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)

        if serializer.is_valid():
            user = serializer.save()

            return Response(
                {
                    "message": "User registered successfully",
                    "user": UserSerializer(user).data,
                },
                status=status.HTTP_201_CREATED,
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST,
        )

class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")

        user = authenticate(
            username=username,
            password=password
        )

        if user is None:
            return Response(
                {
                    "error": "Invalid username or password"
                },
                status=status.HTTP_401_UNAUTHORIZED,
            )

        refresh = RefreshToken.for_user(user)

        return Response(
            {
                "message": "Login successful",
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": UserSerializer(user).data,
            },
            status=status.HTTP_200_OK,
        )


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)

        return Response(
            {
                "user": serializer.data
            },
            status=status.HTTP_200_OK,
        )

class AdminDashboardView(APIView):
    permission_classes = [IsAdminOnly]

    def get(self, request):
        total_users = User.objects.count()
        total_farmers = FarmerProfile.objects.count()
        total_customers = User.objects.filter(role="CUSTOMER").count()
        total_products = Product.objects.count()
        total_orders = Order.objects.count()
        total_payments = Payment.objects.count()

        return Response({
            "total_users": total_users,
            "total_farmers": total_farmers,
            "total_customers": total_customers,
            "total_products": total_products,
            "total_orders": total_orders,
            "total_payments": total_payments,
        })

class AdminUserListView(APIView):
    permission_classes = [IsAdminOnly]

    def get(self, request):
        users = User.objects.all().order_by("id")

        serializer = UserSerializer(users, many=True)

        return Response(
            {
                "users": serializer.data
            },
            status=status.HTTP_200_OK,
        )

class AdminUserDetailView(APIView):
    permission_classes = [IsAdminOnly]

    def get(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response(
                {"error": "User not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = UserSerializer(user)

        return Response(
            {
                "user": serializer.data
            },
            status=status.HTTP_200_OK,
        )

    
    def put(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response(
                {"error": "User not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = UserSerializer(
            user,
            data=request.data,
            partial=True
        )

        if serializer.is_valid():
            serializer.save()

            return Response(
                {
                    "message": "User updated successfully",
                    "user": serializer.data,
                },
                status=status.HTTP_200_OK,
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST,
        )

    def delete(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response(
                {"error": "User not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        if user == request.user:
            return Response(
                {"error": "Admin cannot delete their own account"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.delete()

        return Response(
            {"message": "User deleted successfully"},
            status=status.HTTP_200_OK,
        )

class AdminProductListView(APIView):
    permission_classes = [IsAdminOnly]

    def get(self, request):
        products = Product.objects.all().order_by("id")

        serializer = ProductSerializer(
            products,
            many=True,
            context={"request": request},
        )

        return Response(
            {
                "products": serializer.data
            },
            status=status.HTTP_200_OK,
        )

class AdminProductDetailView(APIView):
    permission_classes = [IsAdminOnly]

    def get(self, request, pk):
        try:
            product = Product.objects.get(pk=pk)
        except Product.DoesNotExist:
            return Response(
                {"error": "Product not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = ProductSerializer(
            product,
            context={"request": request},
        )

        return Response(
            {
                "product": serializer.data
            },
            status=status.HTTP_200_OK,
        )

    def put(self, request, pk):
        try:
            product = Product.objects.get(pk=pk)
        except Product.DoesNotExist:
            return Response(
                {"error": "Product not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = ProductSerializer(
            product,
            data=request.data,
            partial=True,
            context={"request": request},
        )

        if serializer.is_valid():
            serializer.save()

            return Response(
                {
                    "message": "Product updated successfully",
                    "product": serializer.data,
                },
                status=status.HTTP_200_OK,
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST,
        )
    
    def delete(self, request, pk):
        try:
            product = Product.objects.get(pk=pk)
        except Product.DoesNotExist:
            return Response(
                {"error": "Product not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        product.delete()

        return Response(
            {"message": "Product deleted successfully"},
            status=status.HTTP_200_OK,
        )

class AdminOrderListView(APIView):
    permission_classes = [IsAdminOnly]

    def get(self, request):
        orders = Order.objects.all().order_by("-id")

        serializer = OrderSerializer(
            orders,
            many=True,
            context={"request": request},
        )

        return Response(
            {
                "orders": serializer.data
            },
            status=status.HTTP_200_OK,
        )

class AdminOrderDetailView(APIView):
    permission_classes = [IsAdminOnly]

    def get(self, request, pk):
        try:
            order = Order.objects.get(pk=pk)
        except Order.DoesNotExist:
            return Response(
                {"error": "Order not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = OrderSerializer(
            order,
            context={"request": request},
        )

        return Response(
            {
                "order": serializer.data
            },
            status=status.HTTP_200_OK,
        )

class AdminPaymentListView(APIView):
    permission_classes = [IsAdminOnly]

    def get(self, request):
        payments = Payment.objects.all().order_by("-id")

        serializer = AdminPaymentSerializer(
            payments,
            many=True,
            context={"request": request},
        )

        return Response(
            {"payments": serializer.data},
            status=status.HTTP_200_OK,
        )