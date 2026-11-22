import hmac
import hashlib
import razorpay

from django.conf import settings
from django.shortcuts import get_object_or_404

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from orders.models import Order
from notifications.models import Notification
from .models import Payment
from .serializers import PaymentSerializer
from accounts.models import User


class CreatePaymentOrderView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, order_id):
        if request.user.role != "CUSTOMER":
            return Response(
                {"detail": "Only customers can create payments."},
                status=status.HTTP_403_FORBIDDEN
            )

        order = get_object_or_404(
            Order,
            id=order_id,
            customer=request.user
        )

        if order.status == Order.Status.CANCELLED:
            return Response(
                {"detail": "Cannot pay for a cancelled order."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if order.status == Order.Status.DELIVERED:
            return Response(
                {"detail": "Order is already delivered."},
                status=status.HTTP_400_BAD_REQUEST
            )
        if order.status in [
            Order.Status.CONFIRMED,
            Order.Status.PROCESSING,
            Order.Status.SHIPPED,
        ]:
            return Response(
                {"detail": "Order has already been paid or processed."},
                status=status.HTTP_400_BAD_REQUEST
            )

        existing_payment = Payment.objects.filter(order=order).first()

        if existing_payment:
            return Response(
                PaymentSerializer(existing_payment).data,
                status=status.HTTP_200_OK
            )

        client = razorpay.Client(
            auth=(
                settings.RAZORPAY_KEY_ID,
                settings.RAZORPAY_KEY_SECRET
            )
        )

        amount_in_paise = int(order.total_amount * 100)

        razorpay_order = client.order.create({
            "amount": amount_in_paise,
            "currency": "INR",
            "receipt": f"order_{order.id}",
        })

        payment = Payment.objects.create(
            order=order,
            customer=request.user,
            amount=order.total_amount,
            razorpay_order_id=razorpay_order["id"],
        )

        return Response(
            PaymentSerializer(payment).data,
            status=status.HTTP_201_CREATED
        )


class VerifyPaymentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, order_id):
        if request.user.role != "CUSTOMER":
            return Response(
                {"detail": "Only customers can verify payments."},
                status=status.HTTP_403_FORBIDDEN
            )

        order = get_object_or_404(
            Order,
            id=order_id,
            customer=request.user
        )

        payment = get_object_or_404(
            Payment,
            order=order,
            customer=request.user
        )

        if payment.status == Payment.Status.SUCCESS:
            return Response(
                {
                    "detail": "Payment has already been successfully verified.",
                    "payment": PaymentSerializer(payment).data,
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        razorpay_payment_id = request.data.get("razorpay_payment_id")
        razorpay_order_id = request.data.get("razorpay_order_id")
        razorpay_signature = request.data.get("razorpay_signature")

        if (
            not razorpay_payment_id
            or not razorpay_order_id
            or not razorpay_signature
        ):
            return Response(
                {"detail": "Payment verification data is incomplete."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Always compare the Razorpay order ID
        # with the order ID stored on our server.
        if razorpay_order_id != payment.razorpay_order_id:
            return Response(
                {"detail": "Invalid Razorpay order ID."},
                status=status.HTTP_400_BAD_REQUEST
            )

        message = (
            f"{payment.razorpay_order_id}|"
            f"{razorpay_payment_id}"
        )

        expected_signature = hmac.new(
            settings.RAZORPAY_KEY_SECRET.encode(),
            message.encode(),
            hashlib.sha256
        ).hexdigest()

        # =========================================================
        # PAYMENT FAILED
        # =========================================================

        if not hmac.compare_digest(
            expected_signature,
            razorpay_signature
        ):
            payment.status = Payment.Status.FAILED

            payment.save(
                update_fields=[
                    "status",
                    "updated_at"
                ]
            )

            # -----------------------------------------------------
            # Customer notification
            # -----------------------------------------------------

            Notification.objects.create(
                user=request.user,
                notification_type=(
                    Notification.NotificationType.PAYMENT_FAILED
                ),
                title="Payment Failed",
                message=(
                    f"Payment for order #{order.id} "
                    f"could not be verified."
                )
            )

            # -----------------------------------------------------
            # Admin notification
            # -----------------------------------------------------

            admin_users = User.objects.filter(
                role=User.Role.ADMIN,
                is_active=True
            )

            for admin_user in admin_users:

                Notification.objects.create(
                    user=admin_user,
                    notification_type=(
                        Notification.NotificationType.PAYMENT_FAILED
                    ),
                    title="Payment Failed",
                    message=(
                        f"Payment verification failed for "
                        f"order #{order.id} from customer "
                        f"{request.user.username}."
                    )
                )

            return Response(
                {
                    "detail": (
                        "Payment signature verification failed."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # =========================================================
        # PAYMENT SUCCESS
        # =========================================================

        payment.razorpay_payment_id = razorpay_payment_id
        payment.razorpay_signature = razorpay_signature
        payment.status = Payment.Status.SUCCESS

        payment.save()

        # ---------------------------------------------------------
        # Customer notification
        # ---------------------------------------------------------

        Notification.objects.create(
            user=request.user,
            notification_type=(
                Notification.NotificationType.PAYMENT_SUCCESS
            ),
            title="Payment Successful",
            message=(
                f"Payment for order #{order.id} "
                f"was completed successfully."
            )
        )

        # ---------------------------------------------------------
        # Admin notification
        # ---------------------------------------------------------

        admin_users = User.objects.filter(
            role=User.Role.ADMIN,
            is_active=True
        )

        for admin_user in admin_users:

            Notification.objects.create(
                user=admin_user,
                notification_type=(
                    Notification.NotificationType.PAYMENT_SUCCESS
                ),
                title="Payment Successful",
                message=(
                    f"Payment for order #{order.id} "
                    f"was successfully received from "
                    f"customer {request.user.username}."
                )
            )

        # ---------------------------------------------------------
        # Confirm order after successful payment
        # ---------------------------------------------------------

        if order.status == Order.Status.PENDING:

            order.status = Order.Status.CONFIRMED

            order.save(
                update_fields=[
                    "status",
                    "updated_at"
                ]
            )

        return Response(
            {
                "message": "Payment verified successfully.",
                "payment": PaymentSerializer(payment).data,
                "order_status": order.status
            },
            status=status.HTTP_200_OK
        )

class PaymentDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, order_id):
        if request.user.role != "CUSTOMER":
            return Response(
                {"detail": "Only customers can view payment details."},
                status=status.HTTP_403_FORBIDDEN
            )

        order = get_object_or_404(
            Order,
            id=order_id,
            customer=request.user
        )

        payment = get_object_or_404(
            Payment,
            order=order,
            customer=request.user
        )

        return Response(
            PaymentSerializer(payment).data,
            status=status.HTTP_200_OK
        )

class PaymentHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != "CUSTOMER":
            return Response(
                {"detail": "Only customers can view payment history."},
                status=status.HTTP_403_FORBIDDEN
            )

        payments = Payment.objects.filter(
            customer=request.user
        ).order_by("-created_at")

        return Response(
            PaymentSerializer(payments, many=True).data,
            status=status.HTTP_200_OK
        )