from rest_framework import serializers
from .models import User, CustomerAddress,DeliveryPartnerProfile
from django.contrib.auth import password_validation
from django.db import transaction
from farmers.models import FarmerProfile
from notifications.models import Notification

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "phone",
            "role",
        ]


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        min_length=8
    )

    # Farmer profile fields
    farm_name = serializers.CharField(
        required=False,
        allow_blank=True
    )

    address = serializers.CharField(
        required=False,
        allow_blank=True
    )

    village = serializers.CharField(
        required=False,
        allow_blank=True
    )

    district = serializers.CharField(
        required=False,
        allow_blank=True
    )

    state = serializers.CharField(
        required=False,
        allow_blank=True
    )

    pincode = serializers.CharField(
        required=False,
        allow_blank=True
    )

    class Meta:
        model = User
        fields = [
            "username",
            "email",
            "phone",
            "role",
            "password",

            # Farmer profile fields
            "farm_name",
            "address",
            "village",
            "district",
            "state",
            "pincode",
        ]

    def validate(self, attrs):
        role = attrs.get("role", "CUSTOMER")

        # Farmer profile information is required
        # when registering as a farmer.
        if role == "FARMER":

            required_farmer_fields = [
                "farm_name",
                "address",
                "village",
                "district",
                "state",
                "pincode",
            ]

            errors = {}

            for field in required_farmer_fields:
                value = attrs.get(field, "")

                if not value or not str(value).strip():
                    errors[field] = "This field is required for farmers."

            if errors:
                raise serializers.ValidationError(errors)

        return attrs

    @transaction.atomic
    def create(self, validated_data):

        # Remove farmer-specific fields before
        # creating the User object.
        farm_name = validated_data.pop("farm_name", "")
        address = validated_data.pop("address", "")
        village = validated_data.pop("village", "")
        district = validated_data.pop("district", "")
        state = validated_data.pop("state", "")
        pincode = validated_data.pop("pincode", "")

        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            phone=validated_data.get("phone", ""),
            role=validated_data.get("role", "CUSTOMER"),
            password=validated_data["password"],
        )

        # Automatically create FarmerProfile
        # for farmer accounts.
        if user.role == "FARMER":

            FarmerProfile.objects.create(
                user=user,
                farm_name=farm_name,
                phone=validated_data.get("phone", ""),
                address=address,
                village=village,
                district=district,
                state=state,
                pincode=pincode,
            )

            # ---------------------------------------------------------
            # Notify active admins about new farmer registration
            # ---------------------------------------------------------

            admin_users = User.objects.filter(
                role=User.Role.ADMIN,
                is_active=True
            )

            for admin_user in admin_users:

                Notification.objects.create(
                    user=admin_user,
                    notification_type=(
                        Notification.NotificationType.ORDER_CREATED
                    ),
                    title="New Farmer Registration",
                    message=(
                        f"Farmer {user.username} has registered "
                        f"with farm '{farm_name}' and is waiting "
                        f"for verification."
                    )
                )

        return user

class DeliveryPartnerRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        min_length=8
    )

    confirm_password = serializers.CharField(
        write_only=True
    )

    full_name = serializers.CharField(
        max_length=100
    )

    phone = serializers.CharField(
        max_length=15
    )

    address_line1 = serializers.CharField(
        max_length=255
    )

    address_line2 = serializers.CharField(
        max_length=255,
        required=False,
        allow_blank=True
    )

    city = serializers.CharField(
        max_length=100
    )

    district = serializers.CharField(
        max_length=100
    )

    state = serializers.CharField(
        max_length=100
    )

    postal_code = serializers.CharField(
        max_length=10
    )

    vehicle_type = serializers.ChoiceField(
        choices=DeliveryPartnerProfile.VehicleType.choices
    )

    vehicle_number = serializers.CharField(
        max_length=30
    )

    driving_license_number = serializers.CharField(
        max_length=50
    )

    class Meta:
        model = User
        fields = [
            "username",
            "email",
            "phone",
            "password",
            "confirm_password",

            "full_name",

            "address_line1",
            "address_line2",
            "city",
            "district",
            "state",
            "postal_code",

            "vehicle_type",
            "vehicle_number",
            "driving_license_number",
        ]

    def validate_username(self, value):
        if User.objects.filter(
            username=value
        ).exists():
            raise serializers.ValidationError(
                "This username is already taken."
            )

        return value

    def validate_email(self, value):
        if User.objects.filter(
            email=value
        ).exists():
            raise serializers.ValidationError(
                "This email is already registered."
            )

        return value

    def validate_phone(self, value):
        if not value.isdigit():
            raise serializers.ValidationError(
                "Phone number must contain only digits."
            )

        if len(value) < 10 or len(value) > 15:
            raise serializers.ValidationError(
                "Phone number must be between 10 and 15 digits."
            )

        return value

    def validate_vehicle_number(self, value):
        value = value.strip().upper()

        if DeliveryPartnerProfile.objects.filter(
            vehicle_number__iexact=value
        ).exists():
            raise serializers.ValidationError(
                "This vehicle number is already registered."
            )

        return value

    def validate_driving_license_number(self, value):
        value = value.strip().upper()

        if DeliveryPartnerProfile.objects.filter(
            driving_license_number__iexact=value
        ).exists():
            raise serializers.ValidationError(
                "This driving licence number is already registered."
            )

        return value

    def validate(self, attrs):
        password = attrs.get("password")
        confirm_password = attrs.get("confirm_password")

        if password != confirm_password:
            raise serializers.ValidationError({
                "confirm_password": "Passwords do not match."
            })

        try:
            password_validation.validate_password(
                password
            )
        except serializers.ValidationError as error:
            raise serializers.ValidationError({
                "password": error.messages
            })

        return attrs

    @transaction.atomic
    def create(self, validated_data):

        validated_data.pop("confirm_password")

        username = validated_data.pop("username")
        email = validated_data.pop("email")
        phone = validated_data.pop("phone")
        password = validated_data.pop("password")

        user = User.objects.create_user(
            username=username,
            email=email,
            phone=phone,
            role=User.Role.DELIVERY_PARTNER,
            password=password,
            is_active=False,
        )

        DeliveryPartnerProfile.objects.create(
            user=user,
            full_name=validated_data["full_name"],
            phone=phone,
            address_line1=validated_data["address_line1"],
            address_line2=validated_data.get(
                "address_line2",
                ""
            ),
            city=validated_data["city"],
            district=validated_data["district"],
            state=validated_data["state"],
            postal_code=validated_data["postal_code"],
            vehicle_type=validated_data["vehicle_type"],
            vehicle_number=validated_data["vehicle_number"],
            driving_license_number=validated_data[
                "driving_license_number"
            ],
            approval_status=(
                DeliveryPartnerProfile
                .ApprovalStatus
                .PENDING
            ),
        )

        return user


class ProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "username",
            "email",
            "phone",
        ]

    def validate_username(self, value):
        user = self.instance

        if User.objects.filter(
            username=value
        ).exclude(
            pk=user.pk
        ).exists():
            raise serializers.ValidationError(
                "This username is already taken."
            )

        return value


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(
        write_only=True,
        required=True
    )

    new_password = serializers.CharField(
        write_only=True,
        required=True
    )

    confirm_password = serializers.CharField(
        write_only=True,
        required=True
    )

    def validate_current_password(self, value):
        user = self.context["request"].user

        if not user.check_password(value):
            raise serializers.ValidationError(
                "Current password is incorrect."
            )

        return value

    def validate(self, attrs):
        new_password = attrs["new_password"]
        confirm_password = attrs["confirm_password"]

        if new_password != confirm_password:
            raise serializers.ValidationError({
                "confirm_password": "New passwords do not match."
            })

        user = self.context["request"].user

        try:
            password_validation.validate_password(
                new_password,
                user
            )
        except serializers.ValidationError as error:
            raise serializers.ValidationError({
                "new_password": error.messages
            })

        return attrs


class CustomerAddressSerializer(serializers.ModelSerializer):

    class Meta:
        model = CustomerAddress
        fields = [
            "id",
            "address_type",
            "full_name",
            "phone",
            "address_line1",
            "address_line2",
            "city",
            "state",
            "postal_code",
            "country",
            "is_default",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]

    def create(self, validated_data):
        customer = self.context["request"].user

        # If this address is marked as default,
        # remove default status from existing addresses.
        if validated_data.get("is_default", False):
            CustomerAddress.objects.filter(
                customer=customer,
                is_default=True
            ).update(is_default=False)

        return CustomerAddress.objects.create(
            customer=customer,
            **validated_data
        )

    def update(self, instance, validated_data):

        if validated_data.get("is_default", False):
            CustomerAddress.objects.filter(
                customer=instance.customer,
                is_default=True
            ).exclude(
                pk=instance.pk
            ).update(is_default=False)

        return super().update(
            instance,
            validated_data
        )

class AdminDeliveryPartnerSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)
    user_id = serializers.IntegerField(source="user.id", read_only=True)
    is_active = serializers.BooleanField(source="user.is_active", read_only=True)

    class Meta:
        model = DeliveryPartnerProfile
        fields = [
            "id",
            "user_id",
            "username",
            "email",
            "full_name",
            "phone",
            "address_line1",
            "address_line2",
            "city",
            "district",
            "state",
            "postal_code",
            "vehicle_type",
            "vehicle_number",
            "driving_license_number",
            "approval_status",
            "rejection_reason",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "user_id",
            "username",
            "email",
            "is_active",
            "created_at",
            "updated_at",
        ]