from django.shortcuts import render

# Create your views here.
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Notification
from .serializers import NotificationSerializer


class NotificationListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):

        notifications = Notification.objects.filter(
            user=request.user
        )

        serializer = NotificationSerializer(
            notifications,
            many=True
        )

        unread_count = notifications.filter(
            is_read=False
        ).count()

        return Response({
            "notifications": serializer.data,
            "unread_count": unread_count
        })


class NotificationReadView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, pk):

        try:
            notification = Notification.objects.get(
                id=pk,
                user=request.user
            )
        except Notification.DoesNotExist:
            return Response(
                {
                    "error": "Notification not found."
                },
                status=404
            )

        notification.is_read = True
        notification.save(
            update_fields=["is_read"]
        )

        serializer = NotificationSerializer(
            notification
        )

        return Response({
            "message": "Notification marked as read.",
            "notification": serializer.data
        })


class NotificationReadAllView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request):

        updated_count = Notification.objects.filter(
            user=request.user,
            is_read=False
        ).update(
            is_read=True
        )

        return Response({
            "message": "All notifications marked as read.",
            "updated_count": updated_count
        })