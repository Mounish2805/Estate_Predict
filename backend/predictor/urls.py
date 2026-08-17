from django.urls import path
from .views import (
    predict_price,
    register_user,
    login_user,
    logout_user,
    get_current_user,
    get_user_predictions,
    user_prediction_detail,
    toggle_star_prediction,
    download_prediction_pdf,
    email_prediction_report,
    saved_properties_view,
    delete_saved_property,
    get_price_insights,
    get_locality_price_insights,
    get_explore_localities,
    get_explore_locality_detail,
    check_admin_access,
    get_admin_model_metrics,
    get_admin_users,
    get_admin_predictions,
)


urlpatterns = [
    # Core Model Inference
    path("predict/", predict_price, name="predict_price"),
    
    # Admin Authorization, Telemetry, User & Prediction Auditing
    path("admin/check/", check_admin_access, name="check_admin_access"),
    path("admin/model-metrics/", get_admin_model_metrics, name="admin_model_metrics"),
    path("admin/users/", get_admin_users, name="admin_users"),
    path("admin/predictions/", get_admin_predictions, name="admin_predictions"),
    
    # Native Authentication
    path("auth/register/", register_user, name="register_user"),
    path("auth/login/", login_user, name="login_user"),
    path("auth/logout/", logout_user, name="logout_user"),
    path("auth/user/", get_current_user, name="get_current_user"),
    
    # Prediction History & Starred Valuations
    path("predictions/", get_user_predictions, name="get_user_predictions"),
    path("predictions/<int:prediction_id>/", user_prediction_detail, name="user_prediction_detail"),
    path("predictions/<int:prediction_id>/star/", toggle_star_prediction, name="toggle_star_prediction"),
    path("predictions/<int:prediction_id>/download/", download_prediction_pdf, name="download_prediction_pdf"),
    path("predictions/<int:prediction_id>/email/", email_prediction_report, name="email_prediction_report"),
    
    # Saved Properties
    path("saved-properties/", saved_properties_view, name="saved_properties_view"),
    path("saved-properties/<int:saved_id>/", delete_saved_property, name="delete_saved_property"),
    
    # Hyderabad Price Insights & Market Intelligence
    path("price-insights/", get_price_insights, name="get_price_insights"),
    path("price-insights/<str:locality>/", get_locality_price_insights, name="get_locality_price_insights"),
    
    # Explore Localities V1 (Directory & Detailed Context)
    path("localities/", get_explore_localities, name="get_explore_localities"),
    path("localities/<str:locality>/", get_explore_locality_detail, name="get_explore_locality_detail"),
]