from django.urls import path

from .views import (
    ProductListCreateView,
    ProductDetailView,
    ProductReviewListCreateView,
    FarmerReviewListView,
    ReviewDetailView,
)


urlpatterns = [

    # Product APIs
    path(
        "",
        ProductListCreateView.as_view(),
        name="product-list-create"
    ),

    path(
        "<int:pk>/",
        ProductDetailView.as_view(),
        name="product-detail"
    ),

    # Customer product review APIs
    path(
        "<int:pk>/reviews/",
        ProductReviewListCreateView.as_view(),
        name="product-review-list-create"
    ),

    # Farmer reviews
    path(
        "farmer-reviews/",
        FarmerReviewListView.as_view(),
        name="farmer-review-list"
    ),

    # Review edit/delete
    path(
        "reviews/<int:pk>/",
        ReviewDetailView.as_view(),
        name="review-detail"
    ),
]