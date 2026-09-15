from django.urls import path

from .views import (
    CreatePaymentOrderView,
    VerifyPaymentView,
)


urlpatterns = [
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
]