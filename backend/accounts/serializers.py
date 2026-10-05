from rest_framework import serializers
from .models import User, CustomerAddress
from django.contrib.auth import password_validation
from django.db import transaction
from farmers.models import FarmerProfile


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