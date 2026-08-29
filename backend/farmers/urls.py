from django.urls import path

from .views import (
    FarmerProfileView,
    FarmListCreateView,
    FarmDetailView,
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
]