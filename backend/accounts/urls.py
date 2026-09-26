from django.urls import path

from .views import (
    LoginView,
    MeView,
    RegisterView,
    AdminDashboardView,
    AdminUserListView,
    AdminUserDetailView,
    AdminProductListView,
    AdminProductDetailView,
    AdminOrderListView,
    AdminOrderDetailView,
    AdminPaymentListView,
)

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", LoginView.as_view(), name="login"),
    path("me/", MeView.as_view(), name="me"),
    path("admin/dashboard/",AdminDashboardView.as_view(),name="admin-dashboard"),
    path("admin/users/",AdminUserListView.as_view(),name="admin-user-list"),
    path("admin/users/<int:pk>/",AdminUserDetailView.as_view(),name="admin-user-detail"),
    path("admin/products/",AdminProductListView.as_view(),name="admin-product-list"),
    path("admin/products/<int:pk>/",AdminProductDetailView.as_view(),name="admin-product-detail"),
    path("admin/orders/",AdminOrderListView.as_view(),name="admin-order-list"),
    path("admin/orders/<int:pk>/",AdminOrderDetailView.as_view(),name="admin-order-detail"),
    path("admin/payments/",AdminPaymentListView.as_view(),name="admin-payment-list"),
]
