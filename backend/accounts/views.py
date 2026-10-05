from django.shortcuts import render

# Create your views here.
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import RegisterSerializer, UserSerializer,ProfileUpdateSerializer,CustomerAddressSerializer
from django.contrib.auth import authenticate
from rest_framework.permissions import IsAuthenticated
from accounts.permissions import IsAdminOnly
from accounts.models import User,CustomerAddress
from farmers.models import FarmerProfile
from products.models import Product
from orders.models import Order
from payments.models import Payment

from products.models import Product
from products.serializers import ProductSerializer

from orders.serializers import OrderSerializer
from payments.serializers import AdminPaymentSerializer
from .serializers import ChangePasswordSerializer

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

    def put(self, request):
        serializer = ProfileUpdateSerializer(
            request.user,
            data=request.data,
            partial=True,
        )

        if serializer.is_valid():
            serializer.save()

            return Response(
                {
                    "message": "Profile updated successfully",
                    "user": UserSerializer(
                        request.user
                    ).data,
                },
                status=status.HTTP_200_OK,
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST,
        )

class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(
            data=request.data,
            context={"request": request}
        )

        if serializer.is_valid():
            user = request.user

            user.set_password(
                serializer.validated_data["new_password"]
            )

            user.save()

            return Response(
                {
                    "message": "Password changed successfully."
                },
                status=status.HTTP_200_OK
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

class CustomerAddressListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        addresses = CustomerAddress.objects.filter(
            customer=request.user
        ).order_by("-is_default", "-id")

        serializer = CustomerAddressSerializer(
            addresses,
            many=True
        )

        return Response(
            {
                "addresses": serializer.data
            },
            status=status.HTTP_200_OK
        )

    def post(self, request):
        serializer = CustomerAddressSerializer(
            data=request.data,
            context={"request": request}
        )

        if serializer.is_valid():
            address = serializer.save()

            return Response(
                {
                    "message": "Address added successfully",
                    "address": CustomerAddressSerializer(
                        address
                    ).data,
                },
                status=status.HTTP_201_CREATED
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

class CustomerAddressDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, request, pk):
        try:
            return CustomerAddress.objects.get(
                pk=pk,
                customer=request.user
            )
        except CustomerAddress.DoesNotExist:
            return None

    def get(self, request, pk):
        address = self.get_object(request, pk)

        if address is None:
            return Response(
                {"error": "Address not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = CustomerAddressSerializer(address)

        return Response(
            {
                "address": serializer.data
            },
            status=status.HTTP_200_OK
        )

    def put(self, request, pk):
        address = self.get_object(request, pk)

        if address is None:
            return Response(
                {"error": "Address not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = CustomerAddressSerializer(
            address,
            data=request.data,
            partial=True
        )

        if serializer.is_valid():
            serializer.save()

            return Response(
                {
                    "message": "Address updated successfully",
                    "address": serializer.data
                },
                status=status.HTTP_200_OK
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

    def delete(self, request, pk):
        address = self.get_object(request, pk)

        if address is None:
            return Response(
                {"error": "Address not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        address.delete()

        return Response(
            {
                "message": "Address deleted successfully"
            },
            status=status.HTTP_200_OK
        )

class AdminDashboardView(APIView):
    permission_classes = [IsAdminOnly]

    def get(self, request):
        total_users = User.objects.count()
        total_customers = User.objects.filter(role="CUSTOMER").count()
        total_farmers = User.objects.filter(role="FARMER").count()
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