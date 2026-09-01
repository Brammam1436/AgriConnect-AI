from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .models import Product
from .serializers import ProductSerializer
from .permissions import IsFarmerOrReadOnly

from farmers.models import FarmerProfile


class ProductListCreateView(APIView):

    permission_classes = [IsFarmerOrReadOnly]

    def get(self, request):

        if request.user.role == "FARMER":

            farmer = FarmerProfile.objects.get(
                user=request.user
            )

            products = Product.objects.filter(
                farmer=farmer
            ).order_by("-created_at")

        else:

            products = Product.objects.filter(
                is_available=True
            ).order_by("-created_at")

        serializer = ProductSerializer(
            products,
            many=True
        )

        return Response(serializer.data)

    def post(self, request):

        farmer = FarmerProfile.objects.get(
            user=request.user
        )

        serializer = ProductSerializer(
            data=request.data
        )

        if serializer.is_valid():

            product = serializer.save(
                farmer=farmer
            )

            return Response(
                ProductSerializer(product).data,
                status=status.HTTP_201_CREATED
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


class ProductDetailView(APIView):

    permission_classes = [IsFarmerOrReadOnly]

    def get_product(self, request, pk):

        try:
            return Product.objects.get(id=pk)

        except Product.DoesNotExist:
            return None

    def get(self, request, pk):

        product = self.get_product(request, pk)

        if product is None:
            return Response(
                {"detail": "Product not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = ProductSerializer(product)

        return Response(serializer.data)

    def put(self, request, pk):

        product = self.get_product(request, pk)

        if product is None:
            return Response(
                {"detail": "Product not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        if product.farmer.user != request.user:
            return Response(
                {"detail": "You can only update your own products."},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = ProductSerializer(
            product,
            data=request.data,
            partial=True
        )

        if serializer.is_valid():
            serializer.save()

            return Response(serializer.data)

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

    def delete(self, request, pk):

        product = self.get_product(request, pk)

        if product is None:
            return Response(
                {"detail": "Product not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        if product.farmer.user != request.user:
            return Response(
                {"detail": "You can only delete your own products."},
                status=status.HTTP_403_FORBIDDEN
            )

        product.delete()

        return Response(
            status=status.HTTP_204_NO_CONTENT
        )