from rest_framework.permissions import BasePermission


class IsAdminOnly(BasePermission):
    """
    Allows access only to authenticated users
    whose role is ADMIN.
    """

    message = "Only admin users are allowed to access this resource."

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == "ADMIN"
        )