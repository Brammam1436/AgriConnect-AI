from django.urls import path

from .views import (
    CreatePaymentOrderView,
    VerifyPaymentView,
    PaymentDetailView,
    PaymentHistoryView,
)

urlpatterns = [
    path(
        "history/",
        PaymentHistoryView.as_view(),
        name="payment-history",
    ),
    path(
        "<int:order_id>/create/",
        CreatePaymentOrderView.as_view(),
        name="create-payment-order",
    ),
    path(
        "<int:order_id>/verify/",
        VerifyPaymentView.as_view(),
        name="verify-payment",
    ),
    path(
        "<int:order_id>/",
        PaymentDetailView.as_view(),
        name="payment-detail",
    ),
]