from django.urls import path

from .views import DemandPredictionView


urlpatterns = [
    path(
        "demand/<int:product_id>/",
        DemandPredictionView.as_view(),
        name="demand-prediction"
    ),
]