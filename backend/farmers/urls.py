from django.urls import path

from .views import (
    FarmerProfileView,
    FarmListCreateView,
    FarmDetailView,
    AdminFarmerVerificationListView,
    AdminFarmerVerificationUpdateView,
)


urlpatterns = [
    path(
        "profile/",
        FarmerProfileView.as_view(),
        name="farmer-profile",
    ),

    path(
        "farms/",
        FarmListCreateView.as_view(),
        name="farm-list-create",
    ),

    path(
        "farms/<int:pk>/",
        FarmDetailView.as_view(),
        name="farm-detail",
    ),

    path(
        "admin/verification/",
        AdminFarmerVerificationListView.as_view(),
        name="admin-farmer-verification-list",
    ),

    path(
        "admin/verification/<int:pk>/",
        AdminFarmerVerificationUpdateView.as_view(),
        name="admin-farmer-verification-update",
    ),
]