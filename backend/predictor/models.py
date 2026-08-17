from django.db import models
from django.contrib.auth.models import User


class Prediction(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="predictions",
    )
    
    # Visible property features
    locality = models.CharField(max_length=120)
    property_type = models.CharField(max_length=60)
    area_sqft = models.FloatField()
    bedrooms = models.IntegerField()
    bathrooms = models.FloatField()
    balconies = models.IntegerField(default=0)
    floor = models.IntegerField(default=0)
    total_floors = models.IntegerField(default=1)
    property_age = models.IntegerField(default=0)
    furnished = models.CharField(max_length=60)
    parking = models.IntegerField(default=1)
    facing = models.CharField(max_length=60)
    water_supply = models.CharField(max_length=60)
    
    # Amenities
    lift = models.CharField(max_length=10, default="No")
    power_backup = models.CharField(max_length=10, default="No")
    security = models.CharField(max_length=10, default="No")
    gym = models.CharField(max_length=10, default="No")
    swimming_pool = models.CharField(max_length=10, default="No")
    
    # Derived location features
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    distance_metro_km = models.FloatField(null=True, blank=True)
    distance_school_km = models.FloatField(null=True, blank=True)
    distance_hospital_km = models.FloatField(null=True, blank=True)
    
    # Model output results
    predicted_price_lakhs = models.FloatField()
    predicted_price_inr = models.FloatField()
    
    is_starred = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.locality} {self.property_type} - ₹{self.predicted_price_lakhs:.2f}L ({self.created_at.strftime('%Y-%m-%d')})"

    def to_dict(self):
        return {
            "id": self.id,
            "locality": self.locality,
            "property_type": self.property_type,
            "area_sqft": self.area_sqft,
            "bedrooms": self.bedrooms,
            "bathrooms": self.bathrooms,
            "balconies": self.balconies,
            "floor": self.floor,
            "total_floors": self.total_floors,
            "property_age": self.property_age,
            "furnished": self.furnished,
            "parking": self.parking,
            "facing": self.facing,
            "water_supply": self.water_supply,
            "lift": self.lift,
            "power_backup": self.power_backup,
            "security": self.security,
            "gym": self.gym,
            "swimming_pool": self.swimming_pool,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "distance_metro_km": self.distance_metro_km,
            "distance_school_km": self.distance_school_km,
            "distance_hospital_km": self.distance_hospital_km,
            "predicted_price_lakhs": self.predicted_price_lakhs,
            "predicted_price_inr": self.predicted_price_inr,
            "is_starred": self.is_starred,
            "created_at": self.created_at.isoformat(),
        }



class SavedProperty(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="saved_properties",
    )
    prediction = models.ForeignKey(
        Prediction,
        on_delete=models.CASCADE,
        related_name="saved_instances",
    )
    note = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user.username} saved {self.prediction.locality} ({self.created_at.strftime('%Y-%m-%d')})"

    def to_dict(self):
        return {
            "id": self.id,
            "prediction": self.prediction.to_dict(),
            "note": self.note,
            "created_at": self.created_at.isoformat(),
        }


class LocalityPriceInsight(models.Model):
    locality = models.CharField(max_length=120, unique=True)
    region = models.CharField(max_length=100, default="West Hyderabad")
    avg_price_sqft = models.IntegerField()
    min_price_sqft = models.IntegerField(null=True, blank=True)
    max_price_sqft = models.IntegerField(null=True, blank=True)
    yoy_growth = models.FloatField(help_text="Year over Year growth in %")
    market_demand = models.CharField(max_length=60, help_text="e.g. Very High, High, Moderate")
    segment = models.CharField(max_length=100, help_text="e.g. Ultra Luxury, IT Corridor, Residential")
    historical_data_json = models.JSONField(default=list, blank=True)
    period = models.CharField(max_length=60, default="H1 2026")
    source = models.CharField(max_length=120, default="Knight Frank & Hyderabad Market Reports")
    display_order = models.IntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["display_order", "locality"]

    def __str__(self):
        return f"{self.locality} - ₹{self.avg_price_sqft}/sq.ft ({self.yoy_growth:+0.1f}%)"

    def to_dict(self):
        return {
            "id": self.id,
            "locality": self.locality,
            "region": self.region,
            "avg_price_sqft": self.avg_price_sqft,
            "min_price_sqft": self.min_price_sqft,
            "max_price_sqft": self.max_price_sqft,
            "yoy_growth": self.yoy_growth,
            "market_demand": self.market_demand,
            "segment": self.segment,
            "historical_prices": self.historical_data_json,
            "period": self.period,
            "source": self.source,
        }

