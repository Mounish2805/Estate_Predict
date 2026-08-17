"""
Django settings for EstatePredict project.

Configured for local SQLite development and Render/MySQL production deployment.
"""

from pathlib import Path
from dotenv import load_dotenv
import os

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Load local environment variables from .env if present
load_dotenv(BASE_DIR / ".env")


# ==============================================================================
# 1. CORE APPLICATION SECURITY & DEBUG
# ==============================================================================

# DEBUG: Defaults to True for local development; set DJANGO_DEBUG=False in production
DEBUG = os.getenv("DJANGO_DEBUG", "True").lower() in ("true", "1", "yes")

# SECRET_KEY: Uses development fallback when DEBUG=True; requires environment secret when DEBUG=False
SECRET_KEY = os.getenv(
    "DJANGO_SECRET_KEY",
    os.getenv("SECRET_KEY", "django-insecure-hyderabad-house-price-prediction-secret-key-2026" if DEBUG else "")
)

if not SECRET_KEY and not DEBUG:
    raise ValueError("DJANGO_SECRET_KEY environment variable is required in production (DEBUG=False).")

# ALLOWED_HOSTS: Defaults to localhost / 127.0.0.1 in local development; configurable for Render hostname in prod
default_hosts = "localhost,127.0.0.1,testserver" if DEBUG else ""
ALLOWED_HOSTS = [
    host.strip()
    for host in os.getenv("DJANGO_ALLOWED_HOSTS", default_hosts).split(",")
    if host.strip()
]


# ==============================================================================
# 2. APPLICATION DEFINITIONS
# ==============================================================================

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",

    "rest_framework",
    "corsheaders",
    "predictor",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"


# ==============================================================================
# 3. DATABASE CONFIGURATION (Local SQLite / Production MySQL)
# ==============================================================================

DB_ENGINE = os.getenv("DB_ENGINE", "django.db.backends.sqlite3")

if DB_ENGINE == "django.db.backends.mysql" or (os.getenv("DB_NAME") and DB_ENGINE != "django.db.backends.sqlite3"):
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.mysql",
            "NAME": os.getenv("DB_NAME", "estatepredict"),
            "USER": os.getenv("DB_USER", "root"),
            "PASSWORD": os.getenv("DB_PASSWORD", ""),
            "HOST": os.getenv("DB_HOST", "localhost"),
            "PORT": os.getenv("DB_PORT", "3306"),
            "OPTIONS": {
                "charset": "utf8mb4",
                "init_command": "SET sql_mode='STRICT_TRANS_TABLES'",
            },
        }
    }
else:
    # Default to local SQLite
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }


# ==============================================================================
# 4. PASSWORD VALIDATION
# ==============================================================================

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]


# ==============================================================================
# 5. INTERNATIONALIZATION
# ==============================================================================

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True


# ==============================================================================
# 6. STATIC FILES (CSS, JavaScript, Images)
# ==============================================================================

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"


# ==============================================================================
# 7. CORS & CSRF CONFIGURATION
# ==============================================================================

# CORS Allowed Origins: Defaults to localhost dev servers; accepts comma-separated origins from env for Vercel/prod
cors_env = os.getenv("CORS_ALLOWED_ORIGINS", "")
if cors_env.strip():
    CORS_ALLOWED_ORIGINS = [orig.strip() for orig in cors_env.split(",") if orig.strip()]
else:
    CORS_ALLOWED_ORIGINS = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:5175",
        "http://127.0.0.1:5175",
    ]

CORS_ALLOWED_ORIGIN_REGEXES = [
    r"^http://localhost:\d+$",
    r"^http://127\.0\.0\.1:\d+$",
]

CORS_ALLOW_CREDENTIALS = True

# CSRF Trusted Origins: Defaults to localhost; configurable via environment in production
csrf_env = os.getenv("CSRF_TRUSTED_ORIGINS", "")
if csrf_env.strip():
    CSRF_TRUSTED_ORIGINS = [orig.strip() for orig in csrf_env.split(",") if orig.strip()]
else:
    CSRF_TRUSTED_ORIGINS = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:5175",
        "http://127.0.0.1:5175",
    ]


# Expose headers for file downloads
CORS_EXPOSE_HEADERS = ["Content-Disposition"]


# ==============================================================================
# 8. SESSION & COOKIE CONFIGURATION (Credentialed Cross-Origin Support)
# ==============================================================================

# In local development across different ports/origins (e.g. localhost:5173 to 127.0.0.1:8000),
# SameSite=None with Secure=True allows modern browsers to store and send session cookies.
SESSION_COOKIE_SAMESITE = os.getenv("SESSION_COOKIE_SAMESITE", "None" if DEBUG else "Lax")
SESSION_COOKIE_SECURE = os.getenv(
    "SESSION_COOKIE_SECURE",
    "True" if (SESSION_COOKIE_SAMESITE == "None" or not DEBUG) else "False"
).lower() in ("true", "1", "yes")
SESSION_COOKIE_HTTPONLY = True
SESSION_SAVE_EVERY_REQUEST = True

CSRF_COOKIE_SAMESITE = os.getenv("CSRF_COOKIE_SAMESITE", "None" if DEBUG else "Lax")
CSRF_COOKIE_SECURE = os.getenv(
    "CSRF_COOKIE_SECURE",
    "True" if (CSRF_COOKIE_SAMESITE == "None" or not DEBUG) else "False"
).lower() in ("true", "1", "yes")
CSRF_COOKIE_HTTPONLY = False


# ==============================================================================
# 9. HTTPS & PRODUCTION SECURITY (Environment-Driven)
# ==============================================================================

SECURE_SSL_REDIRECT = os.getenv("SECURE_SSL_REDIRECT", "False").lower() in ("true", "1", "yes")

# HSTS settings (active in production when configured)
SECURE_HSTS_SECONDS = int(os.getenv("SECURE_HSTS_SECONDS", "0" if DEBUG else "31536000"))
SECURE_HSTS_INCLUDE_SUBDOMAINS = os.getenv("SECURE_HSTS_INCLUDE_SUBDOMAINS", "False" if DEBUG else "True").lower() in ("true", "1", "yes")
SECURE_HSTS_PRELOAD = os.getenv("SECURE_HSTS_PRELOAD", "False" if DEBUG else "True").lower() in ("true", "1", "yes")

# Reverse proxy SSL header for Render / HTTPS load balancers
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"


# ==============================================================================
# 9. EMAIL CONFIGURATION
# ==============================================================================

EMAIL_BACKEND = os.getenv(
    "EMAIL_BACKEND",
    "email_backend.backend.EmailBackend"
    if (os.getenv("EMAIL_HOST_USER") or os.getenv("EMAIL_HOST"))
    else "django.core.mail.backends.console.EmailBackend"
)
EMAIL_HOST = os.getenv("EMAIL_HOST", "smtp.gmail.com")
EMAIL_PORT = int(os.getenv("EMAIL_PORT", "587"))
EMAIL_HOST_USER = os.getenv("EMAIL_HOST_USER", "")
EMAIL_HOST_PASSWORD = os.getenv("EMAIL_HOST_PASSWORD", "")
EMAIL_USE_TLS = os.getenv("EMAIL_USE_TLS", "True").lower() in ("true", "1", "yes")
EMAIL_USE_SSL = os.getenv("EMAIL_USE_SSL", "False").lower() in ("true", "1", "yes")
DEFAULT_FROM_EMAIL = os.getenv("DEFAULT_FROM_EMAIL", "EstatePredict <noreply@estatepredict.com>")
EMAIL_TIMEOUT = int(os.getenv("EMAIL_TIMEOUT", "10"))
