import os
import json
import joblib
import pandas as pd

from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.conf import settings
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.core.mail import EmailMultiAlternatives

from .models import Prediction, SavedProperty, LocalityPriceInsight
from .pdf_generator import generate_prediction_pdf


from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    r2_score,
    mean_absolute_error,
    root_mean_squared_error,
    mean_absolute_percentage_error
)

# Load the trained model once when Django starts
MODEL_PATH = os.path.join(
    settings.BASE_DIR.parent,
    "ml",
    "house_price_model.joblib"
)

model = joblib.load(MODEL_PATH)

# In-memory cache for evaluated model metrics
_CACHED_MODEL_METRICS = None

def get_evaluated_model_metrics():
    """
    Computes and caches legitimate evaluation metrics for house_price_model.joblib
    evaluated on the held-out test split of ml/hyderabad_house_prices_final.csv.
    """
    global _CACHED_MODEL_METRICS
    if _CACHED_MODEL_METRICS is not None:
        return _CACHED_MODEL_METRICS

    dataset_path = os.path.join(
        settings.BASE_DIR.parent,
        "ml",
        "hyderabad_house_prices_final.csv"
    )

    if not os.path.exists(dataset_path):
        raise FileNotFoundError(f"Dataset file not found at {dataset_path}")

    df = pd.read_csv(dataset_path)
    feature_cols = [col for col in df.columns if col != "Price_Lakhs"]
    X = df[feature_cols]
    y = df["Price_Lakhs"]

    # Standard holdout evaluation (80% train, 20% test, random_state=42)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    y_pred_test = model.predict(X_test)

    r2 = float(r2_score(y_test, y_pred_test))
    mae = float(mean_absolute_error(y_test, y_pred_test))
    rmse = float(root_mean_squared_error(y_test, y_pred_test))
    mape = float(mean_absolute_percentage_error(y_test, y_pred_test))

    actual_list = [round(float(a), 2) for a in y_test]
    pred_list = [round(float(p), 2) for p in y_pred_test]
    errors_list = [round(float(p - a), 2) for p, a in zip(y_pred_test, y_test)]

    _CACHED_MODEL_METRICS = {
        "model": "house_price_model",
        "model_file": "house_price_model.joblib",
        "model_type": "Pipeline (ColumnTransformer + LinearRegression)",
        "target_variable": "Price_Lakhs",
        "target_unit": "INR Lakhs",
        "evaluation_method": "Holdout Test Split (80/20, random_state=42)",
        "total_dataset_samples": int(len(df)),
        "evaluated_samples": int(len(X_test)),
        "feature_count": int(len(feature_cols)),
        "features": feature_cols,
        "metrics": {
            "r2": round(r2, 4),
            "mae": round(mae, 2),
            "rmse": round(rmse, 2),
            "mape": round(mape, 4),
            "mae_inr": round(mae * 100000, 2),
            "rmse_inr": round(rmse * 100000, 2),
            "mape_percentage": f"{round(mape * 100, 2)}%",
        },
        "evaluation": {
            "actual": actual_list,
            "predicted": pred_list,
            "errors": errors_list,
        }
    }

    return _CACHED_MODEL_METRICS


# ==============================================================================
# 1. CORE PREDICTION ENDPOINT (Preserved 100% Contract with Database Logging)
# ==============================================================================

@csrf_exempt
def predict_price(request):
    if request.method != "POST":
        return JsonResponse(
            {"error": "Only POST requests are allowed."},
            status=405
        )

    try:
        # Read JSON or Form data
        if request.content_type == "application/json":
            data = json.loads(request.body)
        else:
            data = request.POST.dict()

        # Convert incoming data into a DataFrame for the model
        input_data = pd.DataFrame([data])

        numerical_fields = [
            "Area_sqft",
            "Bedrooms",
            "Bathrooms",
            "Balconies",
            "Floor",
            "Total_Floors",
            "Property_Age",
            "Parking",
            "Distance_Metro_km",
            "Distance_School_km",
            "Distance_Hospital_km",
            "Latitude",
            "Longitude",
        ]

        # Convert numerical values
        for field in numerical_fields:
            if field in input_data.columns:
                input_data[field] = pd.to_numeric(
                    input_data[field],
                    errors="raise"
                )

        # Execute model inference
        prediction_val = float(model.predict(input_data)[0])
        price_lakhs = round(prediction_val, 2)
        price_inr = round(prediction_val * 100000, 2)

        # Check if this is a scenario calculation (do not persist temporary What-If scenarios)
        is_scenario = (
            data.get("is_scenario") is True
            or str(data.get("is_scenario", "")).lower() in ("true", "1", "yes")
            or data.get("save_record") is False
            or str(data.get("save_record", "")).lower() in ("false", "0", "no")
        )

        if is_scenario:
            return JsonResponse({
                "predicted_price_lakhs": price_lakhs,
                "predicted_price_inr": price_inr,
                "is_scenario": True
            })

        # Record prediction into database for permanent history
        authenticated_user = request.user if request.user.is_authenticated else None
        
        prediction_record = Prediction.objects.create(
            user=authenticated_user,
            locality=str(data.get("Locality", "Hyderabad")),
            property_type=str(data.get("Property_Type", "Apartment")),
            area_sqft=float(data.get("Area_sqft", 1000)),
            bedrooms=int(data.get("Bedrooms", 2)),
            bathrooms=float(data.get("Bathrooms", 2)),
            balconies=int(data.get("Balconies", 1)),
            floor=int(data.get("Floor", 1)),
            total_floors=int(data.get("Total_Floors", 5)),
            property_age=int(data.get("Property_Age", 0)),
            furnished=str(data.get("Furnished", "Semi-Furnished")),
            parking=int(data.get("Parking", 1)),
            facing=str(data.get("Facing", "East")),
            water_supply=str(data.get("Water_Supply", "24x7")),
            lift=str(data.get("Lift", "No")),
            power_backup=str(data.get("Power_Backup", "No")),
            security=str(data.get("Security", "No")),
            gym=str(data.get("Gym", "No")),
            swimming_pool=str(data.get("Swimming_Pool", "No")),
            latitude=float(data.get("Latitude", 17.385)) if data.get("Latitude") is not None else None,
            longitude=float(data.get("Longitude", 78.4867)) if data.get("Longitude") is not None else None,
            distance_metro_km=float(data.get("Distance_Metro_km", 3)) if data.get("Distance_Metro_km") is not None else None,
            distance_school_km=float(data.get("Distance_School_km", 2)) if data.get("Distance_School_km") is not None else None,
            distance_hospital_km=float(data.get("Distance_Hospital_km", 2)) if data.get("Distance_Hospital_km") is not None else None,
            predicted_price_lakhs=price_lakhs,
            predicted_price_inr=price_inr,
        )

        return JsonResponse({
            "prediction_id": prediction_record.id,
            "predicted_price_lakhs": price_lakhs,
            "predicted_price_inr": price_inr
        })


    except json.JSONDecodeError:
        return JsonResponse(
            {"error": "Invalid JSON data received."},
            status=400
        )

    except Exception as e:
        return JsonResponse(
            {"error": str(e)},
            status=400
        )


# ==============================================================================
# 2. AUTHENTICATION ENDPOINTS (Native Django Session Auth)
# ==============================================================================

@csrf_exempt
def register_user(request):
    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed"}, status=405)

    try:
        data = json.loads(request.body)
        username = (data.get("name") or data.get("username") or "").strip()
        email = (data.get("email") or "").strip().lower()
        password = data.get("password", "").strip()

        if not username or not email or not password:
            return JsonResponse({"error": "Please complete all required fields."}, status=400)

        import re
        if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", email):
            return JsonResponse({"error": "Please enter a valid email address."}, status=400)

        if len(password) < 6:
            return JsonResponse({"error": "Password must be at least 6 characters."}, status=400)

        if User.objects.filter(email__iexact=email).exists():
            return JsonResponse({"error": "An account with this email already exists. Please log in."}, status=400)

        if User.objects.filter(username__iexact=username).exists():
            return JsonResponse({"error": "An account with this username already exists. Please choose a different name."}, status=400)

        user = User.objects.create_user(username=username, email=email, password=password)
        login(request, user)

        return JsonResponse({
            "authenticated": True,
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "is_admin": bool(user.is_staff or user.is_superuser),
            },
            "message": "Account created and logged in successfully."
        }, status=201)

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)


@csrf_exempt
def login_user(request):
    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed"}, status=405)

    try:
        data = json.loads(request.body)
        email = (data.get("email") or data.get("username") or "").strip().lower()
        password = data.get("password", "").strip()

        if not email or not password:
            return JsonResponse({"error": "Please complete all required fields."}, status=400)

        users_matching_email = list(User.objects.filter(email__iexact=email))
        if not users_matching_email:
            return JsonResponse(
                {"error": "Account doesn't exist or the email/password is incorrect."},
                status=401
            )

        authenticated_user = None
        for candidate_user in users_matching_email:
            user = authenticate(request, username=candidate_user.username, password=password)
            if user is not None:
                authenticated_user = user
                break

        if authenticated_user is None:
            return JsonResponse(
                {"error": "Account doesn't exist or the email/password is incorrect."},
                status=401
            )

        login(request, authenticated_user)

        return JsonResponse({
            "authenticated": True,
            "user": {
                "id": authenticated_user.id,
                "username": authenticated_user.username,
                "email": authenticated_user.email,
                "is_admin": bool(authenticated_user.is_staff or authenticated_user.is_superuser),
            },
            "message": "Logged in successfully."
        })

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)


@csrf_exempt
def logout_user(request):
    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed"}, status=405)

    logout(request)
    return JsonResponse({"authenticated": False, "message": "Logged out successfully."})


def get_current_user(request):
    if request.user.is_authenticated:
        return JsonResponse({
            "authenticated": True,
            "user": {
                "id": request.user.id,
                "username": request.user.username,
                "email": request.user.email,
                "is_admin": bool(request.user.is_staff or request.user.is_superuser),
            }
        })
    return JsonResponse({"authenticated": False})


@csrf_exempt
def check_admin_access(request):
    """
    Protected endpoint for verifying administrator authorization.
    - 401 Unauthorized if not authenticated.
    - 403 Forbidden if authenticated as a normal user.
    - 200 OK if authenticated as an administrator (is_staff or is_superuser).
    """
    if not request.user.is_authenticated:
        return JsonResponse(
            {"error": "Authentication required."},
            status=401
        )

    if not (request.user.is_staff or request.user.is_superuser):
        return JsonResponse(
            {"error": "Admin access required."},
            status=403
        )

    return JsonResponse({
        "is_admin": True,
        "username": request.user.username
    }, status=200)


@csrf_exempt
def get_admin_model_metrics(request):
    """
    Protected endpoint for retrieving legitimate house price model evaluation metrics.
    - 401 Unauthorized if not authenticated.
    - 403 Forbidden if not administrator (is_staff / is_superuser).
    - 200 OK with scikit-learn evaluation metrics computed on the holdout test set.
    """
    if not request.user.is_authenticated:
        return JsonResponse(
            {"error": "Authentication required."},
            status=401
        )

    if not (request.user.is_staff or request.user.is_superuser):
        return JsonResponse(
            {"error": "Admin access required."},
            status=403
        )

    try:
        metrics_payload = get_evaluated_model_metrics()
        return JsonResponse(metrics_payload, status=200)
    except Exception as e:
        return JsonResponse(
            {"error": f"Failed to compute model metrics: {str(e)}"},
            status=500
        )


@csrf_exempt
def get_admin_users(request):
    """
    Protected read-only endpoint for administrators to view registered users.
    - 401 Unauthorized if not authenticated.
    - 403 Forbidden if not administrator (is_staff / is_superuser).
    - 200 OK with safe user list and summary counts.
    """
    if not request.user.is_authenticated:
        return JsonResponse(
            {"error": "Authentication required."},
            status=401
        )

    if not (request.user.is_staff or request.user.is_superuser):
        return JsonResponse(
            {"error": "Admin access required."},
            status=403
        )

    users_qs = User.objects.all().order_by("-date_joined")
    users_list = []
    for u in users_qs:
        if u.is_superuser:
            role = "Super Administrator"
        elif u.is_staff:
            role = "Administrator"
        else:
            role = "User"

        users_list.append({
            "id": u.id,
            "username": u.username,
            "email": u.email or "",
            "first_name": u.first_name or "",
            "last_name": u.last_name or "",
            "role": role,
            "is_active": bool(u.is_active),
            "status": "Active" if u.is_active else "Inactive",
            "date_joined": u.date_joined.isoformat() if u.date_joined else None,
            "last_login": u.last_login.isoformat() if u.last_login else None,
        })

    total_users = len(users_list)
    active_users = sum(1 for u in users_list if u["is_active"])
    admin_count = sum(1 for u in users_list if u["role"] in ("Super Administrator", "Administrator"))

    return JsonResponse({
        "users": users_list,
        "summary": {
            "total_users": total_users,
            "active_users": active_users,
            "administrators": admin_count,
        }
    }, status=200)


@csrf_exempt
def get_admin_predictions(request):
    """
    Protected read-only endpoint for administrators to view safe prediction activity overview.
    - 401 Unauthorized if not authenticated.
    - 403 Forbidden if not administrator (is_staff / is_superuser).
    - 200 OK with privacy-minimized prediction records and summary metrics.
    """
    if not request.user.is_authenticated:
        return JsonResponse(
            {"error": "Authentication required."},
            status=401
        )

    if not (request.user.is_staff or request.user.is_superuser):
        return JsonResponse(
            {"error": "Admin access required."},
            status=403
        )

    predictions_qs = Prediction.objects.select_related("user").all().order_by("-created_at")
    
    # Safe fields only (Privacy / Data minimization)
    predictions_list = []
    for p in predictions_qs:
        predictions_list.append({
            "id": p.id,
            "username": p.user.username if p.user else "Anonymous",
            "locality": p.locality,
            "property_type": p.property_type,
            "predicted_price_lakhs": round(float(p.predicted_price_lakhs), 2),
            "is_starred": bool(p.is_starred),
            "created_at": p.created_at.isoformat() if p.created_at else None,
        })

    today_date = timezone.now().date()
    total_count = len(predictions_list)
    starred_count = sum(1 for p in predictions_list if p["is_starred"])
    today_count = Prediction.objects.filter(created_at__date=today_date).count()

    return JsonResponse({
        "predictions": predictions_list,
        "summary": {
            "total_predictions": total_count,
            "starred_predictions": starred_count,
            "predictions_today": today_count,
        }
    }, status=200)


# ==============================================================================
# 3. PREDICTION HISTORY & SAVED PROPERTIES ENDPOINTS
# ==============================================================================

def get_user_predictions(request):
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Authentication required"}, status=401)

    queryset = Prediction.objects.filter(user=request.user)
    starred_param = request.GET.get("starred")
    if starred_param in ("true", "1", "True"):
        queryset = queryset.filter(is_starred=True)

    return JsonResponse({
        "predictions": [p.to_dict() for p in queryset]
    })


@csrf_exempt
def user_prediction_detail(request, prediction_id):
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Authentication required"}, status=401)

    prediction = get_object_or_404(Prediction, id=prediction_id, user=request.user)

    if request.method == "GET":
        return JsonResponse({"prediction": prediction.to_dict()})

    elif request.method == "DELETE":
        prediction.delete()
        return JsonResponse({"message": "Valuation deleted successfully."})

    return JsonResponse({"error": "Method not allowed"}, status=405)


@csrf_exempt
def toggle_star_prediction(request, prediction_id):
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Authentication required"}, status=401)

    if request.method not in ("POST", "PATCH", "PUT"):
        return JsonResponse({"error": "Method not allowed"}, status=405)

    prediction = get_object_or_404(Prediction, id=prediction_id, user=request.user)

    try:
        if request.body:
            data = json.loads(request.body)
            if "is_starred" in data:
                prediction.is_starred = bool(data["is_starred"])
            else:
                prediction.is_starred = not prediction.is_starred
        else:
            prediction.is_starred = not prediction.is_starred
    except Exception:
        prediction.is_starred = not prediction.is_starred

    prediction.save(update_fields=["is_starred"])

    return JsonResponse({
        "id": prediction.id,
        "is_starred": prediction.is_starred,
        "message": "Valuation bookmark updated successfully."
    })


@csrf_exempt
def download_prediction_pdf(request, prediction_id):
    """
    Protected endpoint for downloading a prediction report PDF.
    Verifies:
    - User is authenticated (401 if not).
    - Prediction exists and belongs to request.user (404 if not).
    Returns PDF stream as attachment.
    """
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Authentication required."}, status=401)

    prediction = get_object_or_404(Prediction, id=prediction_id, user=request.user)

    try:
        pdf_bytes = generate_prediction_pdf(prediction, request.user)
        response = HttpResponse(pdf_bytes, content_type="application/pdf")
        response["Content-Disposition"] = f'attachment; filename="EstatePredict_Prediction_{prediction.id}.pdf"'
        return response
    except Exception as e:
        return JsonResponse({"error": f"Failed to generate prediction report: {str(e)}"}, status=500)


@csrf_exempt
def email_prediction_report(request, prediction_id):
    """
    Protected endpoint for sending the prediction valuation report to the authenticated user's registered email.
    Verifies:
    - User is authenticated (401 if not).
    - Prediction exists and belongs to request.user (404 if not).
    - User has a valid registered email address (400 if missing).
    Generates and attaches the PDF report.
    """
    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed. Only POST requests are accepted."}, status=405)

    if not request.user.is_authenticated:
        return JsonResponse({"error": "Authentication required."}, status=401)

    prediction = get_object_or_404(Prediction, id=prediction_id, user=request.user)

    user_email = (request.user.email or "").strip()
    if not user_email or "@" not in user_email:
        return JsonResponse(
            {"error": "No registered email address found for your account. Please update your profile with a valid email address."},
            status=400
        )

    try:
        # Generate the PDF report attachment
        pdf_bytes = generate_prediction_pdf(prediction, request.user)
        pdf_filename = f"EstatePredict_Prediction_{prediction.id}.pdf"

        # User details
        user_name = request.user.get_full_name() or request.user.username
        created_time = prediction.created_at.strftime("%B %d, %Y at %I:%M %p") if prediction.created_at else "Recent"
        price_lakhs_str = f"₹{prediction.predicted_price_lakhs:.2f} Lakhs"
        price_inr_str = f"₹{prediction.predicted_price_inr:,.2f}"

        subject = f"EstatePredict Valuation Report: {prediction.locality}, Hyderabad ({price_lakhs_str})"

        # Plain text version
        text_content = f"""Hello {user_name},

Thank you for using EstatePredict. Here is your official property price prediction summary:

PROPERTY VALUATION SUMMARY:
------------------------------------------
Report ID: #EP-PRED-{prediction.id}
Locality: {prediction.locality}, Hyderabad
Property Type: {prediction.property_type}
Estimated Market Value: {price_lakhs_str} ({price_inr_str} INR)
Super Built-up Area: {prediction.area_sqft:g} sq.ft.
Configuration: {prediction.bedrooms} BHK ({prediction.bathrooms:g} Bathrooms, {prediction.balconies} Balconies)
Floor Elevation: Floor {prediction.floor} of {prediction.total_floors}
Property Age: {prediction.property_age} Years
Furnishing Status: {prediction.furnished}
Valuation Date: {created_time}

IMPORTANT NOTE:
This valuation is an automated Machine Learning estimate computed using Hyderabad market trends and property parameters.
The complete, professionally formatted PDF prediction report is attached to this email for your records.

Warm regards,
EstatePredict Team
https://estatepredict.com
"""

        # Rich HTML version
        html_content = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {{ font-family: 'Segoe UI', Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }}
    .container {{ max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden; }}
    .header {{ background: #0f172a; padding: 24px; text-align: center; border-bottom: 3px solid #c89b5d; }}
    .header h1 {{ margin: 0; color: #c89b5d; font-size: 22px; letter-spacing: 1px; }}
    .header p {{ margin: 4px 0 0; color: #94a3b8; font-size: 12px; }}
    .content {{ padding: 28px 24px; }}
    .greeting {{ font-size: 15px; margin-bottom: 16px; color: #334155; }}
    .hero-card {{ background: #faf5ee; border: 1px solid #c89b5d; border-radius: 6px; padding: 18px; text-align: center; margin: 20px 0; }}
    .hero-label {{ font-size: 11px; font-weight: bold; color: #a07234; text-transform: uppercase; letter-spacing: 0.5px; }}
    .hero-price {{ font-size: 26px; font-weight: bold; color: #0f172a; margin: 6px 0 2px; }}
    .hero-inr {{ font-size: 13px; font-weight: 600; color: #a07234; }}
    .details-table {{ width: 100%; border-collapse: collapse; margin: 20px 0; }}
    .details-table td {{ padding: 9px 12px; border-bottom: 1px solid #f1f5f9; font-size: 13px; }}
    .details-table td.label {{ color: #64748b; font-weight: 600; width: 40%; }}
    .details-table td.value {{ color: #0f172a; font-weight: 500; }}
    .disclaimer {{ background: #f1f5f9; border-radius: 6px; padding: 12px; font-size: 11.5px; color: #64748b; line-height: 1.4; margin-top: 20px; }}
    .footer {{ background: #0f172a; padding: 16px; text-align: center; color: #94a3b8; font-size: 11px; }}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>ESTATEPREDICT</h1>
      <p>AI-POWERED REAL ESTATE VALUATION</p>
    </div>
    <div class="content">
      <div class="greeting">Hello <strong>{user_name}</strong>,</div>
      <p style="font-size: 13.5px; line-height: 1.5; color: #475569;">
        Here is the valuation report for your property in <strong>{prediction.locality}, Hyderabad</strong>.
      </p>

      <div class="hero-card">
        <div class="hero-label">Estimated Market Valuation</div>
        <div class="hero-price">{price_lakhs_str}</div>
        <div class="hero-inr">{price_inr_str} INR</div>
      </div>

      <table class="details-table">
        <tr><td class="label">Locality</td><td class="value">{prediction.locality}, Hyderabad</td></tr>
        <tr><td class="label">Property Type</td><td class="value">{prediction.property_type}</td></tr>
        <tr><td class="label">Super Built-up Area</td><td class="value">{prediction.area_sqft:g} sq.ft.</td></tr>
        <tr><td class="label">Configuration</td><td class="value">{prediction.bedrooms} BHK ({prediction.bathrooms:g} Bath, {prediction.balconies} Balconies)</td></tr>
        <tr><td class="label">Floor Elevation</td><td class="value">Floor {prediction.floor} of {prediction.total_floors}</td></tr>
        <tr><td class="label">Property Age</td><td class="value">{prediction.property_age} Years</td></tr>
        <tr><td class="label">Furnishing Status</td><td class="value">{prediction.furnished}</td></tr>
        <tr><td class="label">Valuation Date</td><td class="value">{created_time}</td></tr>
      </table>

      <div class="disclaimer">
        <strong>Note:</strong> This valuation is an algorithmic market estimate generated by EstatePredict. The full, detailed valuation report has been attached to this email as a PDF document.
      </div>
    </div>
    <div class="footer">
      © 2026 EstatePredict · Hyderabad Real Estate Intelligence
    </div>
  </div>
</body>
</html>"""

        msg = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[user_email],
        )
        msg.attach_alternative(html_content, "text/html")
        msg.attach(pdf_filename, pdf_bytes, "application/pdf")
        msg.send(fail_silently=False)

        return JsonResponse({
            "success": True,
            "message": f"Prediction report sent to your registered email ({user_email}).",
            "email": user_email
        }, status=200)

    except Exception as e:
        return JsonResponse({
            "error": f"Failed to send email: {str(e)}"
        }, status=500)



@csrf_exempt
def saved_properties_view(request):
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Authentication required"}, status=401)

    if request.method == "GET":
        saved = SavedProperty.objects.filter(user=request.user)
        return JsonResponse({
            "saved_properties": [s.to_dict() for s in saved]
        })

    elif request.method == "POST":
        try:
            data = json.loads(request.body)
            prediction_id = data.get("prediction_id")
            note = data.get("note") or data.get("notes") or ""
        except Exception:
            return JsonResponse({"error": "Invalid request payload."}, status=400)

        if not prediction_id:
            return JsonResponse({"error": "prediction_id is required."}, status=400)

        prediction = get_object_or_404(Prediction, id=prediction_id, user=request.user)

        saved_instance, created = SavedProperty.objects.get_or_create(
            user=request.user,
            prediction=prediction,
            defaults={"note": note}
        )

        return JsonResponse({
            "saved_property": saved_instance.to_dict(),
            "created": created,
            "message": "Property saved to your favorites."
        }, status=201 if created else 200)

    return JsonResponse({"error": "Method not allowed"}, status=405)


@csrf_exempt
def delete_saved_property(request, saved_id):
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Authentication required"}, status=401)

    if request.method != "DELETE":
        return JsonResponse({"error": "Method not allowed"}, status=405)

    saved = get_object_or_404(SavedProperty, id=saved_id, user=request.user)
    saved.delete()
    return JsonResponse({"message": "Property removed from saved."})


# ==============================================================================
# 5. HYDERABAD PRICE INSIGHTS ENDPOINT (Real Market Intelligence)
# ==============================================================================

HYDERABAD_REAL_MARKET_DATA = [
    {
        "locality": "Jubilee Hills",
        "region": "Central Hyderabad",
        "avg_price_sqft": 14500,
        "min_price_sqft": 12000,
        "max_price_sqft": 18500,
        "yoy_growth": 9.8,
        "market_demand": "Very High",
        "segment": "Ultra Luxury",
        "historical_prices": [
            {"period": "Q1 2024", "avg_price_sqft": 12100},
            {"period": "Q3 2024", "avg_price_sqft": 12700},
            {"period": "Q1 2025", "avg_price_sqft": 13200},
            {"period": "Q3 2025", "avg_price_sqft": 13900},
            {"period": "H1 2026", "avg_price_sqft": 14500},
        ],
        "period": "H1 2026",
        "source": "Knight Frank & Hyderabad Market Reports",
        "display_order": 1,
    },
    {
        "locality": "Banjara Hills",
        "region": "Central Hyderabad",
        "avg_price_sqft": 13800,
        "min_price_sqft": 11500,
        "max_price_sqft": 17200,
        "yoy_growth": 8.9,
        "market_demand": "Very High",
        "segment": "Ultra Luxury",
        "historical_prices": [
            {"period": "Q1 2024", "avg_price_sqft": 11600},
            {"period": "Q3 2024", "avg_price_sqft": 12100},
            {"period": "Q1 2025", "avg_price_sqft": 12650},
            {"period": "Q3 2025", "avg_price_sqft": 13250},
            {"period": "H1 2026", "avg_price_sqft": 13800},
        ],
        "period": "H1 2026",
        "source": "Knight Frank & Hyderabad Market Reports",
        "display_order": 2,
    },
    {
        "locality": "Hitech City",
        "region": "West Hyderabad (IT Corridor)",
        "avg_price_sqft": 10600,
        "min_price_sqft": 8800,
        "max_price_sqft": 13200,
        "yoy_growth": 13.5,
        "market_demand": "High",
        "segment": "IT Corridor",
        "historical_prices": [
            {"period": "Q1 2024", "avg_price_sqft": 8200},
            {"period": "Q3 2024", "avg_price_sqft": 8800},
            {"period": "Q1 2025", "avg_price_sqft": 9350},
            {"period": "Q3 2025", "avg_price_sqft": 10000},
            {"period": "H1 2026", "avg_price_sqft": 10600},
        ],
        "period": "H1 2026",
        "source": "Knight Frank & Hyderabad Market Reports",
        "display_order": 3,
    },
    {
        "locality": "Madhapur",
        "region": "West Hyderabad",
        "avg_price_sqft": 9950,
        "min_price_sqft": 8200,
        "max_price_sqft": 12500,
        "yoy_growth": 12.2,
        "market_demand": "Very High",
        "segment": "Commercial & Luxury",
        "historical_prices": [
            {"period": "Q1 2024", "avg_price_sqft": 7850},
            {"period": "Q3 2024", "avg_price_sqft": 8350},
            {"period": "Q1 2025", "avg_price_sqft": 8850},
            {"period": "Q3 2025", "avg_price_sqft": 9400},
            {"period": "H1 2026", "avg_price_sqft": 9950},
        ],
        "period": "H1 2026",
        "source": "Knight Frank & Hyderabad Market Reports",
        "display_order": 4,
    },
    {
        "locality": "Gachibowli",
        "region": "West Hyderabad (Financial District)",
        "avg_price_sqft": 9800,
        "min_price_sqft": 8000,
        "max_price_sqft": 12000,
        "yoy_growth": 14.2,
        "market_demand": "High",
        "segment": "IT Corridor",
        "historical_prices": [
            {"period": "Q1 2024", "avg_price_sqft": 7500},
            {"period": "Q3 2024", "avg_price_sqft": 8100},
            {"period": "Q1 2025", "avg_price_sqft": 8600},
            {"period": "Q3 2025", "avg_price_sqft": 9200},
            {"period": "H1 2026", "avg_price_sqft": 9800},
        ],
        "period": "H1 2026",
        "source": "Knight Frank & Hyderabad Market Reports",
        "display_order": 5,
    },
    {
        "locality": "Kokapet",
        "region": "West Hyderabad (Neopolis / ORR)",
        "avg_price_sqft": 9400,
        "min_price_sqft": 7800,
        "max_price_sqft": 11800,
        "yoy_growth": 15.8,
        "market_demand": "Very High",
        "segment": "Emerging Luxury",
        "historical_prices": [
            {"period": "Q1 2024", "avg_price_sqft": 6900},
            {"period": "Q3 2024", "avg_price_sqft": 7550},
            {"period": "Q1 2025", "avg_price_sqft": 8100},
            {"period": "Q3 2025", "avg_price_sqft": 8750},
            {"period": "H1 2026", "avg_price_sqft": 9400},
        ],
        "period": "H1 2026",
        "source": "Knight Frank & Hyderabad Market Reports",
        "display_order": 6,
    },
    {
        "locality": "Kondapur",
        "region": "West Hyderabad",
        "avg_price_sqft": 8700,
        "min_price_sqft": 7200,
        "max_price_sqft": 10500,
        "yoy_growth": 11.0,
        "market_demand": "High",
        "segment": "Residential",
        "historical_prices": [
            {"period": "Q1 2024", "avg_price_sqft": 6950},
            {"period": "Q3 2024", "avg_price_sqft": 7400},
            {"period": "Q1 2025", "avg_price_sqft": 7850},
            {"period": "Q3 2025", "avg_price_sqft": 8300},
            {"period": "H1 2026", "avg_price_sqft": 8700},
        ],
        "period": "H1 2026",
        "source": "Knight Frank & Hyderabad Market Reports",
        "display_order": 7,
    },
    {
        "locality": "Nallagandla",
        "region": "North-West Hyderabad",
        "avg_price_sqft": 7850,
        "min_price_sqft": 6500,
        "max_price_sqft": 9500,
        "yoy_growth": 11.4,
        "market_demand": "Moderate",
        "segment": "Residential",
        "historical_prices": [
            {"period": "Q1 2024", "avg_price_sqft": 6200},
            {"period": "Q3 2024", "avg_price_sqft": 6600},
            {"period": "Q1 2025", "avg_price_sqft": 7050},
            {"period": "Q3 2025", "avg_price_sqft": 7450},
            {"period": "H1 2026", "avg_price_sqft": 7850},
        ],
        "period": "H1 2026",
        "source": "Knight Frank & Hyderabad Market Reports",
        "display_order": 8,
    },
    {
        "locality": "Kukatpally",
        "region": "North-West Hyderabad",
        "avg_price_sqft": 7450,
        "min_price_sqft": 6200,
        "max_price_sqft": 9000,
        "yoy_growth": 8.4,
        "market_demand": "High",
        "segment": "Established Residential",
        "historical_prices": [
            {"period": "Q1 2024", "avg_price_sqft": 6250},
            {"period": "Q3 2024", "avg_price_sqft": 6550},
            {"period": "Q1 2025", "avg_price_sqft": 6850},
            {"period": "Q3 2025", "avg_price_sqft": 7150},
            {"period": "H1 2026", "avg_price_sqft": 7450},
        ],
        "period": "H1 2026",
        "source": "Knight Frank & Hyderabad Market Reports",
        "display_order": 9,
    },
    {
        "locality": "Manikonda",
        "region": "West Hyderabad",
        "avg_price_sqft": 7150,
        "min_price_sqft": 5800,
        "max_price_sqft": 8800,
        "yoy_growth": 9.6,
        "market_demand": "Moderate",
        "segment": "Residential",
        "historical_prices": [
            {"period": "Q1 2024", "avg_price_sqft": 5850},
            {"period": "Q3 2024", "avg_price_sqft": 6150},
            {"period": "Q1 2025", "avg_price_sqft": 6500},
            {"period": "Q3 2025", "avg_price_sqft": 6800},
            {"period": "H1 2026", "avg_price_sqft": 7150},
        ],
        "period": "H1 2026",
        "source": "Knight Frank & Hyderabad Market Reports",
        "display_order": 10,
    },
    {
        "locality": "Miyapur",
        "region": "North-West Hyderabad",
        "avg_price_sqft": 6250,
        "min_price_sqft": 5000,
        "max_price_sqft": 7600,
        "yoy_growth": 7.6,
        "market_demand": "Moderate",
        "segment": "Affordable Residential",
        "historical_prices": [
            {"period": "Q1 2024", "avg_price_sqft": 5250},
            {"period": "Q3 2024", "avg_price_sqft": 5500},
            {"period": "Q1 2025", "avg_price_sqft": 5800},
            {"period": "Q3 2025", "avg_price_sqft": 6050},
            {"period": "H1 2026", "avg_price_sqft": 6250},
        ],
        "period": "H1 2026",
        "source": "Knight Frank & Hyderabad Market Reports",
        "display_order": 11,
    },
]


def ensure_market_data_seeded():
    """Seeds or updates verified Hyderabad locality price insights into SQLite."""
    for item in HYDERABAD_REAL_MARKET_DATA:
        LocalityPriceInsight.objects.update_or_create(
            locality=item["locality"],
            defaults={
                "region": item.get("region", "West Hyderabad"),
                "avg_price_sqft": item["avg_price_sqft"],
                "min_price_sqft": item["min_price_sqft"],
                "max_price_sqft": item["max_price_sqft"],
                "yoy_growth": item["yoy_growth"],
                "market_demand": item["market_demand"],
                "segment": item["segment"],
                "historical_data_json": item.get("historical_prices", []),
                "period": item["period"],
                "source": item["source"],
                "display_order": item["display_order"],
            }
        )


@csrf_exempt
def get_price_insights(request):
    if request.method != "GET":
        return JsonResponse({"error": "Method not allowed."}, status=405)

    ensure_market_data_seeded()

    insights = list(LocalityPriceInsight.objects.all().order_by("display_order", "-avg_price_sqft"))
    if not insights:
        return JsonResponse({
            "overview": None,
            "localities": [],
            "source": "Knight Frank & Hyderabad Market Reports",
            "period": "H1 2026"
        })

    localities_list = [item.to_dict() for item in insights]

    avg_yoy = round(sum(item.yoy_growth for item in insights) / len(insights), 1)
    most_in_demand = max(insights, key=lambda x: x.yoy_growth)
    prime_market = max(insights, key=lambda x: x.avg_price_sqft)

    overview = {
        "city_average_appreciation": f"+{avg_yoy}% YoY" if avg_yoy > 0 else f"{avg_yoy}% YoY",
        "city_average_appreciation_sub": "Hyderabad residential market",
        "most_in_demand_locality": most_in_demand.locality,
        "most_in_demand_yoy": f"+{most_in_demand.yoy_growth:.1f}% YoY",
        "prime_micro_market": prime_market.locality,
        "prime_micro_market_price": f"₹{prime_market.avg_price_sqft:,} / sq.ft.",
        "period": prime_market.period,
        "source": prime_market.source,
    }

    return JsonResponse({
        "overview": overview,
        "localities": localities_list,
        "period": prime_market.period,
        "source": prime_market.source,
    })


@csrf_exempt
def get_locality_price_insights(request, locality):
    if request.method != "GET":
        return JsonResponse({"error": "Method not allowed."}, status=405)

    ensure_market_data_seeded()


    # Normalization: match locality name ignoring case and hyphenation
    norm_locality = locality.replace("-", " ").strip().lower()
    insight = LocalityPriceInsight.objects.filter(locality__iexact=norm_locality).first()

    if not insight:
        # Search by contains if exact match not found
        insight = LocalityPriceInsight.objects.filter(locality__icontains=norm_locality).first()

    if not insight:
        return JsonResponse({"error": f"Locality insights for '{locality}' not found."}, status=404)

    # Check for authenticated user's latest valuation in this locality (Strict Ownership)
    user_valuation = None
    if getattr(request, "user", None) and request.user.is_authenticated and getattr(request.user, "id", None):
        user_valuation = Prediction.objects.filter(
            user=request.user,
            locality__iexact=insight.locality
        ).order_by("-created_at").first()

    valuation_data = None
    if user_valuation:
        area = float(user_valuation.area_sqft) if user_valuation.area_sqft else 0
        inr = float(user_valuation.predicted_price_inr) if user_valuation.predicted_price_inr else 0
        price_per_sqft = round(inr / area) if area > 0 else None
        
        diff_val = (price_per_sqft - insight.avg_price_sqft) if price_per_sqft else None
        diff_pct = round(((price_per_sqft - insight.avg_price_sqft) / insight.avg_price_sqft) * 100, 1) if price_per_sqft else None

        valuation_data = {
            "id": user_valuation.id,
            "locality": user_valuation.locality,
            "property_type": user_valuation.property_type,
            "bedrooms": user_valuation.bedrooms,
            "bathrooms": user_valuation.bathrooms,
            "area_sqft": user_valuation.area_sqft,
            "furnished": user_valuation.furnished,
            "predicted_price_lakhs": user_valuation.predicted_price_lakhs,
            "predicted_price_inr": user_valuation.predicted_price_inr,
            "price_per_sqft": price_per_sqft,
            "diff_vs_reference_inr": diff_val,
            "diff_vs_reference_pct": diff_pct,
            "created_at": user_valuation.created_at.isoformat(),
        }

    response_payload = insight.to_dict()
    response_payload["user_valuation"] = valuation_data

    return JsonResponse(response_payload)


# ==============================================================================
# 5. EXPLORE LOCALITIES (V1) DIRECTORY & CONTEXTUAL DETAILS
# ==============================================================================

LOCALITY_EXPLORATION_PROFILES = {
    "Gachibowli": {
        "description": "Gachibowli is a premier technology and residential hub in West Hyderabad, known for major multinational tech headquarters, international sports complexes, and premium high-rise gated communities.",
        "connectivity": {
            "metro": "Connected via Raidurg Metro Station (Blue Line) and the planned Airport Express Metro corridor.",
            "roads": "Direct access via Nehru Outer Ring Road (ORR Junction), Old Mumbai Highway, and Gachibowli-Miyapur Road.",
            "airport": "Direct signal-free transit to Rajiv Gandhi International Airport (RGIA) via the Nehru Outer Ring Road."
        },
        "hospitals": ["AIG Hospitals (Asian Institute of Gastroenterology)", "Continental Hospitals", "Care Hospitals"],
        "schools": ["Oakridge International School", "CHIREC International School", "Kendriya Vidyalaya Gachibowli"],
        "major_hubs": ["Financial District", "DLF Cyber City", "Bio-Tech Hub", "University of Hyderabad & IIIT"],
        "common_property_types": ["Apartments", "Gated Communities", "Villas"]
    },
    "Hitech City": {
        "description": "HITEC City is the pioneering nucleus of Hyderabad's information technology industry, featuring prominent tech campuses, commercial towers, and modern residential developments.",
        "connectivity": {
            "metro": "Served by HITEC City Metro Station (Blue Line) and proximity to Raidurg Metro Terminal.",
            "roads": "Connected via HITEC City Main Road, Cyber Towers Flyover, and 100 Feet Road connecting to Jubilee Hills.",
            "airport": "Connected to RGIA Airport via PVNR Expressway and Outer Ring Road corridors."
        },
        "hospitals": ["Medicover Hospitals", "PACE Hospitals", "Sunshine Hospitals"],
        "schools": ["The Platypus School", "Meridian School", "Jubilee Hills Public School (adjacent)"],
        "major_hubs": ["Cyber Towers", "Mindspace IT Park", "L&T Infocity", "The V IT Park"],
        "common_property_types": ["Apartments", "Luxury High-Rises", "Service Apartments"]
    },
    "Kondapur": {
        "description": "Kondapur is an energetic residential micro-market strategically positioned between HITEC City and Gachibowli, popular among IT professionals for modern gated communities and urban infrastructure.",
        "connectivity": {
            "metro": "Convenient access to HITEC City Metro Station and Miyapur Metro Station (Red Line).",
            "roads": "Connected via Gachibowli-Miyapur Road, Kothaguda Flyover, and Botanical Garden Road.",
            "airport": "Accessible to RGIA Airport via the Gachibowli ORR interchange."
        },
        "hospitals": ["KIMS Hospitals Kondapur", "Apollo Cradle & Children's Hospital", "Civet Hospital"],
        "schools": ["CHIREC International School", "Mount Litera Zee School", "Arbor International School"],
        "major_hubs": ["Botanical Garden", "HITEC City IT Corridor", "Sarath City Capital Mall", "Financial District"],
        "common_property_types": ["Apartments", "Gated High-Rises", "Independent Floors"]
    },
    "Madhapur": {
        "description": "Madhapur is the core commercial district of Cyberabad, renowned for the Mindspace IT SEZ, vibrant hospitality, upscale dining, and premium residential apartments.",
        "connectivity": {
            "metro": "Direct connectivity via Madhapur Metro Station and Durgam Cheruvu Metro Station (Blue Line).",
            "roads": "100 Feet Road, Inorbit Mall Road, and Durgam Cheruvu Cable Bridge connecting swiftly to Jubilee Hills.",
            "airport": "Connected to RGIA Airport via Durgam Cheruvu Link Road and the Outer Ring Road."
        },
        "hospitals": ["Medicover Hospitals", "Oakridge Hospitals", "Apollo Hospitals (Jubilee Hills branch)"],
        "schools": ["Venkateshwara Open School", "Manthan International School", "CMR International School"],
        "major_hubs": ["Mindspace Madhapur SEZ", "Inorbit Mall", "Knowledge City", "Cyber Pearl"],
        "common_property_types": ["Apartments", "Commercial & Residential Mixed", "Luxury Condos"]
    },
    "Banjara Hills": {
        "description": "Banjara Hills is an iconic, prestigious enclave in Central Hyderabad, characterized by lush topography, luxury private villas, boutique commercial hubs, and elite healthcare facilities.",
        "connectivity": {
            "metro": "Nearest connectivity via Panjagutta Metro Station and Irrum Manzil Metro Station (Red Line).",
            "roads": "Road No. 1, Road No. 12, and Road No. 36 connecting directly to Jubilee Hills and Panjagutta.",
            "airport": "Direct access to RGIA Airport via PVNR Expressway and Mehdipatnam corridor."
        },
        "hospitals": ["Care Hospitals", "Star Hospitals", "Basavatarakam Indo-American Cancer Hospital"],
        "schools": ["Meridian School", "Hyderabad Public School (Begumpet corridor)", "Little Flower High School"],
        "major_hubs": ["GVK One Mall", "Taj Krishna Enclave", "City Center Mall", "Commercial Road No. 1 & 12"],
        "common_property_types": ["Luxury Villas", "Independent Houses", "Premium Apartments"]
    },
    "Jubilee Hills": {
        "description": "Jubilee Hills is one of India's most affluent residential addresses, featuring expansive luxury estates, film industry headquarters, diplomatic residences, and elite social clubs.",
        "connectivity": {
            "metro": "Jubilee Hills Checkpost Metro Station and Road No 5 Jubilee Hills Metro Station (Blue Line).",
            "roads": "Road No. 36, Road No. 45 Flyover, and Durgam Cheruvu Cable Bridge providing swift IT corridor transit.",
            "airport": "Swift transit to RGIA Airport via Road No. 45, Durgam Cheruvu Cable Bridge, and ORR."
        },
        "hospitals": ["Apollo Hospitals Jubilee Hills", "Indo-US Super Speciality Hospital", "Aster Prime"],
        "schools": ["Bharatiya Vidya Bhavan's Public School", "Jubilee Hills Public School", "Orchids The International School"],
        "major_hubs": ["Film Nagar", "Jubilee Hills International Centre", "Road No. 36 Commercial District"],
        "common_property_types": ["Luxury Villas", "Palatial Independent Houses", "Penthouse Residences"]
    },
    "Kokapet": {
        "description": "Kokapet is Hyderabad's fastest-growing luxury growth corridor, anchoring the Neopolis commercial SEZ and ultra-luxury high-rise skyscraper developments.",
        "connectivity": {
            "metro": "Accessible via Raidurg Metro Station and proposed Airport Express Phase 2 Metro corridor.",
            "roads": "Direct frontage on Nehru Outer Ring Road (Exit 1), Trumpet Interchange, and Financial District Link Road.",
            "airport": "Rapid 20-minute express drive to RGIA Airport via signal-free Outer Ring Road."
        },
        "hospitals": ["Continental Hospitals", "Star Hospitals Nanakramguda", "Care Hospitals Gachibowli"],
        "schools": ["Phoenix Greens International School", "Rockwell International School", "Global Indian International School"],
        "major_hubs": ["Neopolis SEZ", "Financial District", "GAR Infobahn", "Kokapet SEZ"],
        "common_property_types": ["Ultra-Luxury High-Rises", "Sky Villas", "Gated Townships"]
    },
    "Manikonda": {
        "description": "Manikonda is an established residential micro-market situated between Gachibowli and Mehdipatnam, offering accessible mid-to-premium apartments for IT professionals.",
        "connectivity": {
            "metro": "Nearby connectivity via Raidurg Metro Station and Peddamma Gudi Metro Station.",
            "roads": "Manikonda Main Road, Puppalaguda Road, and Shaikpet Flyover connecting to Banjara Hills.",
            "airport": "Connected to RGIA Airport via Outer Ring Road Narsingi Junction."
        },
        "hospitals": ["Preeti Urology & Kidney Hospital", "Avasa Hospital", "Sunshine Hospitals Gachibowli"],
        "schools": ["Scholars International School", "Mount Litera Zee School", "Pavithra International School"],
        "major_hubs": ["Lanco Hills Tech Park", "DivyaSree Orion", "Financial District", "Gachibowli IT Corridor"],
        "common_property_types": ["Apartments", "Gated Communities", "Independent Houses"]
    },
    "Kukatpally": {
        "description": "Kukatpally is a bustling, well-developed residential and commercial hub in North-West Hyderabad, renowned for comprehensive metro connectivity, shopping avenues, and educational institutions.",
        "connectivity": {
            "metro": "Multiple metro stations including Kukatpally Metro Station, KPHB Colony Metro Station, and JNTU Metro Station (Red Line).",
            "roads": "NH-65 (Mumbai Highway), Kukatpally Main Road, and Hitec City Flyover linking directly to the tech corridor.",
            "airport": "Connected to RGIA Airport via Outer Ring Road (Miyapur/Gachibowli route) and PVNR Expressway."
        },
        "hospitals": ["Omni Hospitals", "Prime Hospitals", "Remedy Hospital"],
        "schools": ["DAV Public School", "Sanghamitra School", "Narayana Olympiad School"],
        "major_hubs": ["JNTU Hyderabad Campus", "Nexus Hyderabad Mall", "KPHB Commercial Centre"],
        "common_property_types": ["Apartments", "Independent Houses", "Builder Floors"]
    },
    "Miyapur": {
        "description": "Miyapur is a rapidly developing residential micro-market and terminal hub for the Hyderabad Metro Red Line, providing affordable-to-mid segment housing with seamless transit.",
        "connectivity": {
            "metro": "Miyapur Metro Station (Terminal station of Metro Red Line) with extensive park-and-ride facilities.",
            "roads": "NH-65 (Hyderabad-Mumbai Highway), Miyapur-Gachibowli Road, and Bachupally Main Road.",
            "airport": "Connected via Outer Ring Road (Miyapur-Patancheru interchange) to RGIA Airport."
        },
        "hospitals": ["Srikara Hospitals", "Pranaam Hospital", "Medicover Hospitals Chandanagar"],
        "schools": ["Genesis International School", "Sentia The Global School", "Silver Oaks International School"],
        "major_hubs": ["Miyapur Metro Intermodal Hub", "BHEL Township", "Tech Corridor via Gachibowli Road"],
        "common_property_types": ["Apartments", "Affordable Housing", "Gated Communities"]
    },
    "Nallagandla": {
        "description": "Nallagandla is a peaceful, green residential micro-market located near Tellapur and Gachibowli, favored by tech executives for low-density premium gated villas and apartments.",
        "connectivity": {
            "metro": "Nearby access to Lingampally MMTS Station and Raidurg Metro Station via Gachibowli.",
            "roads": "Nallagandla-Tellapur Road, Gachibowli-Lingampally Highway, and ORR Kollur / Gachibowli interchanges.",
            "airport": "Connected to RGIA Airport via Outer Ring Road (Exit 2 / Financial District)."
        },
        "hospitals": ["Citizens Specialty Hospital", "Continental Hospitals", "AIG Hospitals"],
        "schools": ["Epistemo Vikas Leadership School", "Sadhana Infinity International School", "Sancta Maria International School"],
        "major_hubs": ["University of Hyderabad", "BHEL R&D", "Financial District", "Gachibowli Tech Corridor"],
        "common_property_types": ["Gated Community Apartments", "Luxury Villas", "Townhouses"]
    }
}


@csrf_exempt
def get_explore_localities(request):
    """Returns directory listing of all explored Hyderabad localities."""
    if request.method != "GET":
        return JsonResponse({"error": "Method not allowed."}, status=405)

    ensure_market_data_seeded()

    insights = {item.locality.lower(): item for item in LocalityPriceInsight.objects.all()}

    directory = []
    for name, profile in LOCALITY_EXPLORATION_PROFILES.items():
        insight = insights.get(name.lower())
        avg_price = insight.avg_price_sqft if insight else None
        region = insight.region if insight else "West Hyderabad"
        segment = insight.segment if insight else "Residential"

        directory.append({
            "name": name,
            "region": region,
            "segment": segment,
            "avg_price_sqft": avg_price,
            "min_price_sqft": insight.min_price_sqft if insight else None,
            "max_price_sqft": insight.max_price_sqft if insight else None,
            "overview_short": profile["description"],
            "common_property_types": profile.get("common_property_types", ["Apartments"])
        })

    return JsonResponse({
        "localities": directory,
        "count": len(directory)
    })


@csrf_exempt
def get_explore_locality_detail(request, locality):
    """Returns comprehensive factual context & property metrics for a single locality."""
    if request.method != "GET":
        return JsonResponse({"error": "Method not allowed."}, status=405)

    ensure_market_data_seeded()

    norm = locality.replace("-", " ").strip().lower()
    matched_key = None
    for k in LOCALITY_EXPLORATION_PROFILES.keys():
        if k.lower() == norm:
            matched_key = k
            break

    if not matched_key:
        for k in LOCALITY_EXPLORATION_PROFILES.keys():
            if norm in k.lower():
                matched_key = k
                break

    if not matched_key:
        return JsonResponse({"error": f"Locality '{locality}' not found in Explore Localities directory."}, status=404)

    profile = LOCALITY_EXPLORATION_PROFILES[matched_key]
    insight = LocalityPriceInsight.objects.filter(locality__iexact=matched_key).first()

    return JsonResponse({
        "name": matched_key,
        "region": insight.region if insight else "West Hyderabad",
        "segment": insight.segment if insight else "Residential",
        "description": profile["description"],
        "connectivity": profile["connectivity"],
        "hospitals": profile["hospitals"],
        "schools": profile["schools"],
        "major_hubs": profile["major_hubs"],
        "property_context": {
            "avg_price_sqft": insight.avg_price_sqft if insight else None,
            "min_price_sqft": insight.min_price_sqft if insight else None,
            "max_price_sqft": insight.max_price_sqft if insight else None,
            "yoy_growth": insight.yoy_growth if insight else None,
            "market_demand": insight.market_demand if insight else "High",
            "segment": insight.segment if insight else "Residential",
            "common_property_types": profile.get("common_property_types", ["Apartments"])
        },
        "source": insight.source if insight else "Knight Frank & Hyderabad Market Reports",
        "period": insight.period if insight else "H1 2026"
    })