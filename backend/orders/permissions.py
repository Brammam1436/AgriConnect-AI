from rest_framework.permissions import BasePermission


class IsCustomer(BasePermission):

    message = "Only customers can access orders."

    def has_permission(self, request, view):

        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == "CUSTOMER"
        )


class IsAdmin(BasePermission):

    message = "Only admins can change order status."

    def has_permission(self, request, view):

        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == "ADMIN"
        )


class IsDeliveryPartner(BasePermission):

    message = "Only delivery partners can access delivery orders."

    def has_permission(self, request, view):

        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == "DELIVERY_PARTNER"
        )