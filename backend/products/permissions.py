from rest_framework.permissions import BasePermission


class IsFarmer(BasePermission):

    message = "Only farmers can access this resource."

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == "FARMER"
        )


class IsFarmerOrReadOnly(BasePermission):

    message = "Only farmers can create, update, or delete products."

    def has_permission(self, request, view):

        # Customers and farmers can read products
        if request.method in ["GET", "HEAD", "OPTIONS"]:
            return request.user.is_authenticated

        # Only farmers can create/update/delete
        return (
            request.user.is_authenticated
            and request.user.role == "FARMER"
        )