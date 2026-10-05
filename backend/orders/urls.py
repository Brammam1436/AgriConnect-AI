from django.urls import path

from .views import (
    OrderListCreateView,
    OrderDetailView,
    OrderCancelView,
    OrderStatusUpdateView,
    FarmerOrderListView,
)


urlpatterns = [

    # =========================================================
    # CUSTOMER ORDERS
    # =========================================================

    path(
        "",
        OrderListCreateView.as_view(),
        name="order-list-create"
    ),

    path(
        "<int:pk>/",
        OrderDetailView.as_view(),
        name="order-detail"
    ),

    path(
        "<int:pk>/cancel/",
        OrderCancelView.as_view(),
        name="order-cancel"
    ),

    # =========================================================
    # ADMIN ORDER STATUS
    # =========================================================

    path(
        "<int:pk>/status/",
        OrderStatusUpdateView.as_view(),
        name="order-status-update"
    ),

    # =========================================================
    # FARMER ORDERS
    # =========================================================

    path(
        "farmer/",
        FarmerOrderListView.as_view(),
        name="farmer-order-list"
    ),

]