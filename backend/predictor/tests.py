import json
from django.test import TestCase, Client
from django.contrib.auth.models import User
from .models import Prediction, SavedProperty


class PredictorAPITests(TestCase):
    def setUp(self):
        self.client = Client()
        self.sample_payload = {
            "Locality": "Gachibowli",
            "Property_Type": "Apartment",
            "Area_sqft": 1850,
            "Bedrooms": 3,
            "Bathrooms": 3,
            "Balconies": 2,
            "Floor": 8,
            "Total_Floors": 18,
            "Property_Age": 2,
            "Furnished": "Semi-Furnished",
            "Parking": 2,
            "Facing": "East",
            "Water_Supply": "24x7",
            "Lift": "Yes",
            "Power_Backup": "Yes",
            "Security": "Yes",
            "Gym": "Yes",
            "Swimming_Pool": "Yes",
            "Latitude": 17.4401,
            "Longitude": 78.3489,
            "Distance_Metro_km": 1.8,
            "Distance_School_km": 1.2,
            "Distance_Hospital_km": 1.5,
        }

    # --------------------------------------------------------------------------
    # 1. PREDICTION ENDPOINT TESTS
    # --------------------------------------------------------------------------
    def test_predict_price_success(self):
        """Verify that POST /api/predict/ returns accurate price in Lakhs and INR."""
        response = self.client.post(
            "/api/predict/",
            data=json.dumps(self.sample_payload),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("predicted_price_lakhs", data)
        self.assertIn("predicted_price_inr", data)
        self.assertIn("prediction_id", data)
        self.assertGreater(data["predicted_price_lakhs"], 0)
        self.assertAlmostEqual(data["predicted_price_inr"] / 100000, data["predicted_price_lakhs"], places=2)

        # Ensure prediction record is logged in the database
        self.assertTrue(Prediction.objects.filter(id=data["prediction_id"]).exists())

    def test_predict_price_disallows_get(self):
        """Verify that GET /api/predict/ is rejected with 405 Method Not Allowed."""
        response = self.client.get("/api/predict/")
        self.assertEqual(response.status_code, 405)

    def test_predict_price_handles_invalid_json(self):
        """Verify that malformed JSON is rejected with 400 Bad Request."""
        response = self.client.post(
            "/api/predict/",
            data="INVALID_JSON_PAYLOAD",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 400)

    # --------------------------------------------------------------------------
    # 2. AUTHENTICATION ENDPOINTS TESTS (Email-Only Login & Registration)
    # --------------------------------------------------------------------------
    def test_user_registration_and_login_flow(self):
        """Test registration with name+email+password, login by email, session check, and logout."""
        # 1. Register
        reg_payload = {
            "name": "Hyderabad Investor",
            "email": "investor@example.com",
            "password": "SecurePassword123",
        }
        reg_resp = self.client.post(
            "/api/auth/register/",
            data=json.dumps(reg_payload),
            content_type="application/json",
        )
        self.assertEqual(reg_resp.status_code, 201)
        self.assertTrue(reg_resp.json().get("authenticated"))
        self.assertEqual(reg_resp.json()["user"]["username"], "Hyderabad Investor")
        self.assertEqual(reg_resp.json()["user"]["email"], "investor@example.com")

        # 2. Verify Session Auth via /api/auth/user/
        user_resp = self.client.get("/api/auth/user/")
        self.assertEqual(user_resp.status_code, 200)
        self.assertTrue(user_resp.json().get("authenticated"))
        self.assertEqual(user_resp.json()["user"]["username"], "Hyderabad Investor")

        # 3. Logout
        logout_resp = self.client.post("/api/auth/logout/")
        self.assertEqual(logout_resp.status_code, 200)
        self.assertFalse(logout_resp.json().get("authenticated"))

        # 4. Login by Email
        login_payload = {
            "email": "investor@example.com",
            "password": "SecurePassword123",
        }
        login_resp = self.client.post(
            "/api/auth/login/",
            data=json.dumps(login_payload),
            content_type="application/json",
        )
        self.assertEqual(login_resp.status_code, 200)
        self.assertTrue(login_resp.json().get("authenticated"))
        self.assertEqual(login_resp.json()["user"]["username"], "Hyderabad Investor")

    def test_registration_validation(self):
        """Verify registration validations: required fields, email format, duplicate email."""
        # Missing email
        resp1 = self.client.post(
            "/api/auth/register/",
            data=json.dumps({"name": "TestUser", "password": "Password123"}),
            content_type="application/json",
        )
        self.assertEqual(resp1.status_code, 400)
        self.assertIn("Please complete all required fields", resp1.json()["error"])

        # Invalid email format
        resp2 = self.client.post(
            "/api/auth/register/",
            data=json.dumps({"name": "TestUser2", "email": "not-an-email", "password": "Password123"}),
            content_type="application/json",
        )
        self.assertEqual(resp2.status_code, 400)
        self.assertIn("valid email address", resp2.json()["error"])

        # Duplicate email check (case-insensitive)
        User.objects.create_user(username="ExistingUser", email="dup@example.com", password="Password123")
        resp3 = self.client.post(
            "/api/auth/register/",
            data=json.dumps({"name": "NewUser", "email": "DUP@Example.com", "password": "Password123"}),
            content_type="application/json",
        )
        self.assertEqual(resp3.status_code, 400)
        self.assertIn("account with this email already exists", resp3.json()["error"].lower())

    def test_login_rejects_username_and_requires_email(self):
        """Verify that login strictly requires email and rejects username."""
        User.objects.create_user(username="MounishDisplay", email="mounish@estate.com", password="SecurePassword123")

        # 1. Attempt login using username instead of email -> MUST FAIL
        fail_resp = self.client.post(
            "/api/auth/login/",
            data=json.dumps({"email": "MounishDisplay", "password": "SecurePassword123"}),
            content_type="application/json",
        )
        self.assertEqual(fail_resp.status_code, 401)
        self.assertEqual(fail_resp.json()["error"], "Account doesn't exist or the email/password is incorrect.")

        # 2. Attempt login using correct email -> MUST SUCCEED
        success_resp = self.client.post(
            "/api/auth/login/",
            data=json.dumps({"email": "mounish@estate.com", "password": "SecurePassword123"}),
            content_type="application/json",
        )
        self.assertEqual(success_resp.status_code, 200)
        self.assertTrue(success_resp.json()["authenticated"])
        self.assertEqual(success_resp.json()["user"]["username"], "MounishDisplay")

    def test_login_invalid_password_and_unknown_email(self):
        """Verify login rejection with incorrect credentials and safe user message."""
        User.objects.create_user(username="agent_bob", email="bob@example.com", password="ValidPassword123")
        
        # Wrong password
        resp1 = self.client.post(
            "/api/auth/login/",
            data=json.dumps({"email": "bob@example.com", "password": "WrongPassword"}),
            content_type="application/json",
        )
        self.assertEqual(resp1.status_code, 401)
        self.assertEqual(resp1.json()["error"], "Account doesn't exist or the email/password is incorrect.")

        # Unknown email
        resp2 = self.client.post(
            "/api/auth/login/",
            data=json.dumps({"email": "unknown@example.com", "password": "AnyPassword"}),
            content_type="application/json",
        )
        self.assertEqual(resp2.status_code, 401)
        self.assertEqual(resp2.json()["error"], "Account doesn't exist or the email/password is incorrect.")

    def test_admin_access_control(self):
        """Verify admin check endpoint RBAC permissions."""
        normal_user = User.objects.create_user(username="normal_user", email="normal@test.com", password="Password123")
        admin_user = User.objects.create_user(username="admin_user", email="admin@test.com", password="Password123", is_staff=True)

        # Unauthenticated -> 401
        self.assertEqual(self.client.get("/api/admin/check/").status_code, 401)

        # Normal user -> 403 Forbidden
        self.client.force_login(normal_user)
        self.assertEqual(self.client.get("/api/admin/check/").status_code, 403)

        # Admin user -> 200 OK
        self.client.force_login(admin_user)
        self.assertEqual(self.client.get("/api/admin/check/").status_code, 200)

    # --------------------------------------------------------------------------
    # 3. PREDICTION HISTORY & SAVED PROPERTIES TESTS
    # --------------------------------------------------------------------------
    def test_prediction_history_and_saved_properties(self):
        """Test authenticated user prediction persistence and saved favorites."""
        user = User.objects.create_user(username="test_user", password="Password123")
        self.client.force_login(user)

        # Run a prediction under this authenticated session
        pred_resp = self.client.post(
            "/api/predict/",
            data=json.dumps(self.sample_payload),
            content_type="application/json",
        )
        self.assertEqual(pred_resp.status_code, 200)
        prediction_id = pred_resp.json()["prediction_id"]

        # Fetch predictions history
        hist_resp = self.client.get("/api/predictions/")
        self.assertEqual(hist_resp.status_code, 200)
        predictions = hist_resp.json().get("predictions", [])
        self.assertEqual(len(predictions), 1)
        self.assertEqual(predictions[0]["id"], prediction_id)

        # Save to favorites
        save_resp = self.client.post(
            "/api/saved-properties/",
            data=json.dumps({"prediction_id": prediction_id, "notes": "Great 3BHK option"}),
            content_type="application/json",
        )
        self.assertEqual(save_resp.status_code, 201)
        saved_id = save_resp.json()["saved_property"]["id"]

        # Retrieve saved properties
        saved_list_resp = self.client.get("/api/saved-properties/")
        self.assertEqual(saved_list_resp.status_code, 200)
        saved_items = saved_list_resp.json().get("saved_properties", [])
        self.assertEqual(len(saved_items), 1)

        # Delete saved property
        del_saved_resp = self.client.delete(f"/api/saved-properties/{saved_id}/")
        self.assertEqual(del_saved_resp.status_code, 200)
        self.assertEqual(SavedProperty.objects.filter(id=saved_id).count(), 0)

        # Delete prediction
        del_pred_resp = self.client.delete(f"/api/predictions/{prediction_id}/")
        self.assertEqual(del_pred_resp.status_code, 200)
        self.assertEqual(Prediction.objects.filter(id=prediction_id).count(), 0)

    # --------------------------------------------------------------------------
    # 4. DOWNLOAD & EMAIL PREDICTION TESTS (Security, Ownership, Error Handling)
    # --------------------------------------------------------------------------
    def test_authenticated_user_can_download_own_prediction(self):
        """Verify authenticated user can download their own prediction PDF."""
        user = User.objects.create_user(username="owner_user", email="owner@example.com", password="Password123")
        prediction = Prediction.objects.create(
            user=user,
            locality="Hitech City",
            property_type="Apartment",
            area_sqft=1500,
            bedrooms=3,
            bathrooms=2,
            predicted_price_lakhs=120.0,
            predicted_price_inr=12000000.0,
        )
        self.client.force_login(user)

        response = self.client.get(f"/api/predictions/{prediction.id}/download/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["Content-Type"], "application/pdf")
        self.assertIn(f'filename="EstatePredict_Prediction_{prediction.id}.pdf"', response["Content-Disposition"])
        self.assertGreater(len(response.content), 100)

    def test_authenticated_user_can_email_own_prediction(self):
        """Verify authenticated user can trigger email sending of their prediction."""
        from django.core import mail
        user = User.objects.create_user(username="mail_user", email="mailuser@example.com", password="Password123")
        prediction = Prediction.objects.create(
            user=user,
            locality="Banjara Hills",
            property_type="Apartment",
            area_sqft=2200,
            bedrooms=3,
            bathrooms=3,
            predicted_price_lakhs=250.0,
            predicted_price_inr=25000000.0,
        )
        self.client.force_login(user)

        response = self.client.post(f"/api/predictions/{prediction.id}/email/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data.get("success"))
        self.assertEqual(data.get("email"), "mailuser@example.com")

        # Verify email was dispatched with PDF attachment
        self.assertEqual(len(mail.outbox), 1)
        sent_mail = mail.outbox[0]
        self.assertEqual(sent_mail.to, ["mailuser@example.com"])
        self.assertIn("Banjara Hills", sent_mail.subject)
        self.assertEqual(len(sent_mail.attachments), 1)
        self.assertEqual(sent_mail.attachments[0][0], f"EstatePredict_Prediction_{prediction.id}.pdf")

    def test_unauthenticated_user_cannot_download_prediction(self):
        """Verify unauthenticated user receives HTTP 401 when attempting to download."""
        user = User.objects.create_user(username="some_user", password="Password123")
        prediction = Prediction.objects.create(
            user=user,
            locality="Kondapur",
            property_type="Apartment",
            area_sqft=1200,
            bedrooms=2,
            bathrooms=2,
            predicted_price_lakhs=80.0,
            predicted_price_inr=8000000.0,
        )
        response = self.client.get(f"/api/predictions/{prediction.id}/download/")
        self.assertEqual(response.status_code, 401)

    def test_unauthenticated_user_cannot_email_prediction(self):
        """Verify unauthenticated user receives HTTP 401 when attempting to email."""
        user = User.objects.create_user(username="some_user_2", email="user2@example.com", password="Password123")
        prediction = Prediction.objects.create(
            user=user,
            locality="Kondapur",
            property_type="Apartment",
            area_sqft=1200,
            bedrooms=2,
            bathrooms=2,
            predicted_price_lakhs=80.0,
            predicted_price_inr=8000000.0,
        )
        response = self.client.post(f"/api/predictions/{prediction.id}/email/")
        self.assertEqual(response.status_code, 401)

    def test_user_cannot_download_another_users_prediction(self):
        """Verify User A cannot download User B's prediction (HTTP 404 IDOR protection)."""
        user_a = User.objects.create_user(username="user_a", password="Password123")
        user_b = User.objects.create_user(username="user_b", password="Password123")
        prediction_b = Prediction.objects.create(
            user=user_b,
            locality="Jubilee Hills",
            property_type="Villa",
            area_sqft=3500,
            bedrooms=4,
            bathrooms=4,
            predicted_price_lakhs=500.0,
            predicted_price_inr=50000000.0,
        )
        # Log in as user_a and attempt to download prediction_b
        self.client.force_login(user_a)
        response = self.client.get(f"/api/predictions/{prediction_b.id}/download/")
        self.assertEqual(response.status_code, 404)

    def test_user_cannot_email_another_users_prediction(self):
        """Verify User A cannot email User B's prediction (HTTP 404 IDOR protection)."""
        user_a = User.objects.create_user(username="user_a2", email="usera2@example.com", password="Password123")
        user_b = User.objects.create_user(username="user_b2", email="userb2@example.com", password="Password123")
        prediction_b = Prediction.objects.create(
            user=user_b,
            locality="Jubilee Hills",
            property_type="Villa",
            area_sqft=3500,
            bedrooms=4,
            bathrooms=4,
            predicted_price_lakhs=500.0,
            predicted_price_inr=50000000.0,
        )
        # Log in as user_a and attempt to email prediction_b
        self.client.force_login(user_a)
        response = self.client.post(f"/api/predictions/{prediction_b.id}/email/")
        self.assertEqual(response.status_code, 404)

    def test_user_without_email_receives_clear_error(self):
        """Verify user without an email address receives clear 400 error."""
        user = User.objects.create_user(username="no_email_user", email="", password="Password123")
        prediction = Prediction.objects.create(
            user=user,
            locality="Madhapur",
            property_type="Apartment",
            area_sqft=1400,
            bedrooms=2,
            bathrooms=2,
            predicted_price_lakhs=95.0,
            predicted_price_inr=9500000.0,
        )
        self.client.force_login(user)
        response = self.client.post(f"/api/predictions/{prediction.id}/email/")
        self.assertEqual(response.status_code, 400)
        self.assertIn("registered email address", response.json().get("error", "").lower())
