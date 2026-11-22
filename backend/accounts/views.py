from django.shortcuts import render

# Create your views here.
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import RegisterSerializer, UserSerializer,ProfileUpdateSerializer,CustomerAddressSerializer,DeliveryPartnerRegisterSerializer,AdminDeliveryPartnerSerializer
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
from django.db.models import Sum
from .models import (
    User,
    CustomerAddress,
    DeliveryPartnerProfile,
)
from notifications.models import Notification

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

class DeliveryPartnerRegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = DeliveryPartnerRegisterSerializer(
            data=request.data
        )

        if serializer.is_valid():
            user = serializer.save()

            return Response(
                {
                    "message": (
                        "Delivery partner registration submitted "
                        "successfully. Your application is pending "
                        "admin approval."
                    ),
                    "user": UserSerializer(user).data,
                    "approval_status": "PENDING",
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

        # ---------------------------------------------------------
        # User statistics
        # ---------------------------------------------------------

        total_users = User.objects.count()

        total_customers = User.objects.filter(
            role=User.Role.CUSTOMER
        ).count()

        total_farmers = User.objects.filter(
            role=User.Role.FARMER
        ).count()

        active_users = User.objects.filter(
            is_active=True
        ).count()

        # ---------------------------------------------------------
        # Delivery Partner statistics
        # ---------------------------------------------------------

        total_delivery_partners = User.objects.filter(
            role=User.Role.DELIVERY_PARTNER
        ).count()

        active_delivery_partners = User.objects.filter(
            role=User.Role.DELIVERY_PARTNER,
            is_active=True
        ).count()

        inactive_delivery_partners = User.objects.filter(
            role=User.Role.DELIVERY_PARTNER,
            is_active=False
        ).count()

        # ---------------------------------------------------------
        # Farmer verification statistics
        # ---------------------------------------------------------

        verified_farmers = FarmerProfile.objects.filter(
            is_verified=True
        ).count()

        pending_farmers = FarmerProfile.objects.filter(
            is_verified=False
        ).count()

        # ---------------------------------------------------------
        # Product statistics
        # ---------------------------------------------------------

        total_products = Product.objects.count()

        # ---------------------------------------------------------
        # Order statistics
        # ---------------------------------------------------------

        total_orders = Order.objects.count()

        pending_orders = Order.objects.filter(
            status=Order.Status.PENDING
        ).count()

        delivered_orders = Order.objects.filter(
            status=Order.Status.DELIVERED
        ).count()

        # ---------------------------------------------------------
        # Payment statistics
        # ---------------------------------------------------------

        total_payments = Payment.objects.count()

        successful_payments = Payment.objects.filter(
            status=Payment.Status.SUCCESS
        ).count()

        total_revenue = (
            Payment.objects.filter(
                status=Payment.Status.SUCCESS
            ).aggregate(
                total=Sum("amount")
            )["total"]
            or 0
        )

        # ---------------------------------------------------------
        # Dashboard response
        # ---------------------------------------------------------

        return Response(
            {
                # Existing statistics
                "total_users": total_users,
                "total_farmers": total_farmers,
                "total_customers": total_customers,
                "total_products": total_products,
                "total_orders": total_orders,
                "total_payments": total_payments,

                # User statistics
                "active_users": active_users,

                # Delivery Partner statistics
                "total_delivery_partners": total_delivery_partners,
                "active_delivery_partners": active_delivery_partners,
                "inactive_delivery_partners": inactive_delivery_partners,

                # Farmer statistics
                "verified_farmers": verified_farmers,
                "pending_farmers": pending_farmers,

                # Order statistics
                "pending_orders": pending_orders,
                "delivered_orders": delivered_orders,

                # Payment statistics
                "successful_payments": successful_payments,
                "total_revenue": str(total_revenue),
            },
            status=status.HTTP_200_OK,
        )

class AdminUserListView(APIView):
    permission_classes = [IsAdminOnly]

    def get(self, request):
        users = User.objects.all().order_by("id")

        serializer = UserSerializer(users, many=True)
        user_data = serializer.data

        for item, user in zip(user_data, users):
            item["is_active"] = user.is_active

        return Response(
            {
                "users": user_data
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
        user_data = serializer.data
        user_data["is_active"] = user.is_active

        return Response(
            {
                "user": user_data
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

        is_active = request.data.get("is_active", None)

        if is_active is not None:
            if not isinstance(is_active, bool):
                return Response(
                    {"error": "is_active must be true or false"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if user == request.user and is_active is False:
                return Response(
                    {"error": "Admin cannot deactivate their own account"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        update_data = request.data.copy()
        if "is_active" in update_data:
            update_data.pop("is_active")

        serializer = UserSerializer(
            user,
            data=update_data,
            partial=True
        )

        if serializer.is_valid():
            serializer.save()

            if is_active is not None:
                user.is_active = is_active
                user.save(update_fields=["is_active"])

            user_data = UserSerializer(user).data
            user_data["is_active"] = user.is_active

            return Response(
                {
                    "message": "User updated successfully",
                    "user": user_data,
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

class AdminDeliveryPartnerListView(APIView):
    permission_classes = [IsAdminOnly]

    def get(self, request):
        delivery_partners = (
            DeliveryPartnerProfile.objects
            .select_related("user")
            .all()
            .order_by("-created_at")
        )

        serializer = AdminDeliveryPartnerSerializer(
            delivery_partners,
            many=True
        )

        return Response(
            {
                "delivery_partners": serializer.data
            },
            status=status.HTTP_200_OK
        )


class AdminDeliveryPartnerApproveView(APIView):
    permission_classes = [IsAdminOnly]

    def put(self, request, pk):
        try:
            profile = DeliveryPartnerProfile.objects.select_related(
                "user"
            ).get(pk=pk)
        except DeliveryPartnerProfile.DoesNotExist:
            return Response(
                {
                    "error": "Delivery partner not found."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        if profile.approval_status == DeliveryPartnerProfile.ApprovalStatus.APPROVED:
            return Response(
                {
                    "message": "Delivery partner is already approved.",
                    "delivery_partner": AdminDeliveryPartnerSerializer(
                        profile
                    ).data,
                },
                status=status.HTTP_200_OK
            )

        profile.approval_status = (
            DeliveryPartnerProfile.ApprovalStatus.APPROVED
        )
        profile.rejection_reason = ""
        profile.save(
            update_fields=[
                "approval_status",
                "rejection_reason",
                "updated_at",
            ]
        )

        profile.user.is_active = True
        profile.user.save(update_fields=["is_active"])

        Notification.objects.create(
            user=profile.user,
            notification_type=Notification.NotificationType.DELIVERY_ASSIGNED,
            title="Delivery Partner Application Approved",
            message=(
                "Your delivery partner application has been approved. "
                "You can now log in and start accepting deliveries."
            ),
        )

        return Response(
            {
                "message": "Delivery partner approved successfully.",
                "delivery_partner": AdminDeliveryPartnerSerializer(
                    profile
                ).data,
            },
            status=status.HTTP_200_OK
        )


class AdminDeliveryPartnerRejectView(APIView):
    permission_classes = [IsAdminOnly]

    def put(self, request, pk):
        try:
            profile = DeliveryPartnerProfile.objects.select_related(
                "user"
            ).get(pk=pk)
        except DeliveryPartnerProfile.DoesNotExist:
            return Response(
                {
                    "error": "Delivery partner not found."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        rejection_reason = request.data.get(
            "rejection_reason",
            ""
        ).strip()

        if not rejection_reason:
            return Response(
                {
                    "rejection_reason": [
                        "Rejection reason is required."
                    ]
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        profile.approval_status = (
            DeliveryPartnerProfile.ApprovalStatus.REJECTED
        )
        profile.rejection_reason = rejection_reason
        profile.save(
            update_fields=[
                "approval_status",
                "rejection_reason",
                "updated_at",
            ]
        )

        profile.user.is_active = False
        profile.user.save(update_fields=["is_active"])

        Notification.objects.create(
            user=profile.user,
            notification_type=Notification.NotificationType.FARMER_REJECTED,
            title="Delivery Partner Application Rejected",
            message=(
                f"Your delivery partner application was rejected. "
                f"Reason: {rejection_reason}"
            ),
        )

        return Response(
            {
                "message": "Delivery partner rejected successfully.",
                "delivery_partner": AdminDeliveryPartnerSerializer(
                    profile
                ).data,
            },
            status=status.HTTP_200_OK
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