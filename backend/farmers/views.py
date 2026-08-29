from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import FarmerProfile, Farm
from .permissions import IsFarmer
from .serializers import FarmerProfileSerializer, FarmSerializer


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
