# ESTATEPREDICT — Final UI Integration

This package keeps the supplied Django backend and adds a React/Vite frontend styled to match the supplied ESTATEPREDICT login and Hyderabad prediction reference screens.

## Run backend

```powershell
cd backend
pip install -r requirements.txt
python manage.py runserver
```

The supplied backend expects the trained model at:

`ml/house_price_model.joblib`

The uploaded project did not contain that model file, so place the existing trained model at that path before running predictions.

## Run frontend

```powershell
cd frontend
npm install
npm run dev
```

The frontend defaults to `http://127.0.0.1:8000/api`. To change it, copy `.env.example` to `.env` and set `VITE_API_BASE`.

## Connected flows

- Django session login/register
- Logout
- Property prediction POST to `/api/predict/`
- Prediction result displayed in the new UI
- Existing Django prediction database logging is preserved

The UI supplies the additional model fields that are not shown in the reference form using the same Hyderabad defaults already used by the supplied backend.
