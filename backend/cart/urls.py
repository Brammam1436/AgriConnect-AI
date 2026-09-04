from django.urls import path

from .views import (
    CartView,
    CartItemCreateView,
    CartItemUpdateView,
)


urlpatterns = [
    path(
        "",
        CartView.as_view(),
        name="cart"
    ),

    path(
        "items/",
        CartItemCreateView.as_view(),
        name="cart-item-create"
    ),

    path(
        "items/<int:pk>/",
        CartItemUpdateView.as_view(),
        name="cart-item"
    ),
]