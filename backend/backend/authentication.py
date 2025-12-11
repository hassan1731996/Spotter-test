from django.conf import settings
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed


class ServiceUser:
    def __init__(self, name="service"):
        self.name = name
        self.is_authenticated = True

    def __str__(self):
        return self.name

class ApiKeyAuthentication(BaseAuthentication):
    def authenticate(self, request):
        api_key = request.META.get("HTTP_X_API_KEY")
        if not api_key:
            return None

        if api_key != settings.API_KEY:
            raise AuthenticationFailed("Invalid API Key")

        return (ServiceUser(), None)
