from django.urls import path

from .views import (
    DemandPredictionView,
    PriceRecommendationView
)


urlpatterns = [

    path(
        "demand/<int:product_id>/",
        DemandPredictionView.as_view(),
        name="demand-prediction"
    ),

    path(
        "price/<int:product_id>/",
        PriceRecommendationView.as_view(),
        name="price-recommendation"
    ),

]