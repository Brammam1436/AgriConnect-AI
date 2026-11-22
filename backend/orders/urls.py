from django.urls import path

from .views import (
    OrderListCreateView,
    OrderDetailView,
    OrderCancelView,
    OrderStatusUpdateView,
    FarmerOrderListView,
    DeliveryPartnerOrderListView,
    DeliveryPartnerOrderDetailView,
    DeliveryPartnerOrderStatusView,
    AssignDeliveryPartnerView
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

    # =========================================================
    # DELIVERY PARTNER ORDERS
    # =========================================================

    path(
        "delivery/",
        DeliveryPartnerOrderListView.as_view(),
        name="delivery-order-list"
    ),

    path(
        "delivery/<int:pk>/",
        DeliveryPartnerOrderDetailView.as_view(),
        name="delivery-order-detail"
    ),

    path(
        "delivery/<int:pk>/status/",
        DeliveryPartnerOrderStatusView.as_view(),
        name="delivery-order-status"
    ),
    path(
        "<int:pk>/assign-delivery/",
        AssignDeliveryPartnerView.as_view(),
        name="assign-delivery-partner",
    ),

]