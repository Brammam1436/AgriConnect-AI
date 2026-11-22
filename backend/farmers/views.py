from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import FarmerProfile, Farm
from .permissions import IsFarmer, IsAdmin
from .serializers import FarmerProfileSerializer, FarmSerializer
from notifications.models import Notification


class FarmerProfileView(APIView):
    permission_classes = [IsAuthenticated, IsFarmer]

    def get(self, request):
        try:
            profile = FarmerProfile.objects.get(user=request.user)
        except FarmerProfile.DoesNotExist:
            return Response(
                {
                    "message": "Farmer profile not found."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = FarmerProfileSerializer(profile)

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )

    def post(self, request):
        if FarmerProfile.objects.filter(user=request.user).exists():
            return Response(
                {
                    "message": "Farmer profile already exists."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = FarmerProfileSerializer(data=request.data)

        if serializer.is_valid():
            profile = serializer.save(user=request.user)

            return Response(
                FarmerProfileSerializer(profile).data,
                status=status.HTTP_201_CREATED,
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST,
        )

    def put(self, request):
        try:
            profile = FarmerProfile.objects.get(user=request.user)
        except FarmerProfile.DoesNotExist:
            return Response(
                {
                    "message": "Farmer profile not found."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = FarmerProfileSerializer(
            profile,
            data=request.data,
            partial=True,
        )

        if serializer.is_valid():
            profile = serializer.save()

            return Response(
                FarmerProfileSerializer(profile).data,
                status=status.HTTP_200_OK,
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST,
        )


class FarmListCreateView(APIView):
    permission_classes = [IsAuthenticated, IsFarmer]

    def get(self, request):
        try:
            profile = FarmerProfile.objects.get(user=request.user)
        except FarmerProfile.DoesNotExist:
            return Response(
                {
                    "message": "Create your farmer profile first."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        farms = Farm.objects.filter(farmer=profile)

        serializer = FarmSerializer(farms, many=True)

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )

    def post(self, request):
        try:
            profile = FarmerProfile.objects.get(user=request.user)
        except FarmerProfile.DoesNotExist:
            return Response(
                {
                    "message": "Create your farmer profile first."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = FarmSerializer(data=request.data)

        if serializer.is_valid():
            farm = serializer.save(farmer=profile)

            return Response(
                FarmSerializer(farm).data,
                status=status.HTTP_201_CREATED,
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST,
        )


class FarmDetailView(APIView):
    permission_classes = [IsAuthenticated, IsFarmer]

    def get_farm(self, request, pk):
        try:
            profile = FarmerProfile.objects.get(user=request.user)
            return Farm.objects.get(
                id=pk,
                farmer=profile,
            )
        except FarmerProfile.DoesNotExist:
            return None
        except Farm.DoesNotExist:
            return None

    def get(self, request, pk):
        farm = self.get_farm(request, pk)

        if farm is None:
            return Response(
                {
                    "message": "Farm not found."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = FarmSerializer(farm)

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )

    def put(self, request, pk):
        farm = self.get_farm(request, pk)

        if farm is None:
            return Response(
                {
                    "message": "Farm not found."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = FarmSerializer(
            farm,
            data=request.data,
            partial=True,
        )

        if serializer.is_valid():
            farm = serializer.save()

            return Response(
                FarmSerializer(farm).data,
                status=status.HTTP_200_OK,
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST,
        )

    def delete(self, request, pk):
        farm = self.get_farm(request, pk)

        if farm is None:
            return Response(
                {
                    "message": "Farm not found."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        farm.delete()

        return Response(
            {
                "message": "Farm deleted successfully."
            },
            status=status.HTTP_204_NO_CONTENT,
        )

class AdminFarmerVerificationListView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        profiles = (
            FarmerProfile.objects
            .select_related("user")
            .prefetch_related("farms")
            .order_by("-created_at")
        )

        serializer = FarmerProfileSerializer(
            profiles,
            many=True,
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )


class AdminFarmerVerificationUpdateView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def put(self, request, pk):
        try:
            profile = FarmerProfile.objects.select_related("user").get(
                id=pk
            )
        except FarmerProfile.DoesNotExist:
            return Response(
                {
                    "message": "Farmer profile not found."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        is_verified = request.data.get("is_verified")

        if is_verified is None:
            return Response(
                {
                    "message": "is_verified field is required."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not isinstance(is_verified, bool):
            return Response(
                {
                    "message": "is_verified must be true or false."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Store the previous verification status
        previous_status = profile.is_verified

        # Update farmer verification status
        profile.is_verified = is_verified
        profile.save(update_fields=["is_verified"])

        # ---------------------------------------------------------
        # Notify farmer about verification status
        # ---------------------------------------------------------

        # Farmer approved
        if is_verified and not previous_status:
            Notification.objects.create(
                user=profile.user,
                notification_type=(
                    Notification.NotificationType.FARMER_VERIFIED
                ),
                title="Farmer Verification Successful",
                message=(
                    "Your farmer profile has been verified by the "
                    "administrator. You can now start selling your "
                    "agricultural products."
                ),
            )

        # Farmer rejected
        elif not is_verified and previous_status:
            Notification.objects.create(
                user=profile.user,
                notification_type=(
                    Notification.NotificationType.FARMER_REJECTED
                ),
                title="Farmer Verification Rejected",
                message=(
                    "Your farmer verification has been rejected by "
                    "the administrator. Please review your farm "
                    "information and contact the administrator "
                    "if you need assistance."
                ),
            )

        serializer = FarmerProfileSerializer(profile)

        return Response(
            {
                "message": (
                    "Farmer verified successfully."
                    if is_verified
                    else "Farmer verification rejected."
                ),
                "farmer": serializer.data,
            },
            status=status.HTTP_200_OK,
        )