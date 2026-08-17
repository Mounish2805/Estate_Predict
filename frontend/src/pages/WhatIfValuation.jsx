import React, { useRef, useState } from 'react';
import Icon from '../components/Icon';
import PropertyBaseline from '../components/PropertyBaseline';
import ScenarioControls from '../components/ScenarioControls';
import ScenarioResult from '../components/ScenarioResult';
import { locationProfiles } from '../utils/constants';
import { predictionService } from '../services/api';

export default function WhatIfValuation({ record, onBack }) {
  const locality = record.locality || record.Locality || 'Hyderabad';
  const propertyType = record.property_type || record.Property_Type || record.propertyType || 'Apartment';
  const area = Number(record.area_sqft || record.Area_sqft || record.area || 1000);
  const bedrooms = record.bedrooms || record.Bedrooms || 3;
  const bathrooms = record.bathrooms || record.Bathrooms || 2;
  const floor = record.floor !== undefined ? record.floor : (record.Floor !== undefined ? record.Floor : 1);
  const totalFloors = record.total_floors !== undefined ? record.total_floors : (record.Total_Floors !== undefined ? record.Total_Floors : 5);
  const propertyAge = record.property_age !== undefined
    ? record.property_age
    : (record.Property_Age !== undefined ? record.Property_Age : (record.age !== undefined ? record.age : 0));
  const balconies = record.balconies !== undefined ? record.balconies : (record.Balconies !== undefined ? record.Balconies : 1);

  const originalFurnished = record.furnished || record.Furnished || 'Semi-Furnished';
  const originalParking = record.parking !== undefined ? (Number(record.parking) === 1 || record.parking === true) : true;
  const originalLift = record.lift === 'Yes' || record.lift === true;
  const originalPowerBackup = record.power_backup === 'Yes' || record.Power_Backup === 'Yes' || record.powerBackup === true;
  const originalSecurity = record.security === 'Yes' || record.Security === 'Yes' || record.security === true;
  const originalGym = record.gym === 'Yes' || record.Gym === 'Yes' || record.gym === true;
  const originalSwimmingPool = record.swimming_pool === 'Yes' || record.Swimming_Pool === 'Yes' || record.swimmingPool === true;

  const originalLakhs = Number(record.predicted_price_lakhs);
  const originalInr = Number(record.predicted_price_inr);

  const [furnished, setFurnished] = useState(originalFurnished);
  const [amenities, setAmenities] = useState({
    parking: originalParking,
    lift: originalLift,
    powerBackup: originalPowerBackup,
    security: originalSecurity,
    gym: originalGym,
    swimmingPool: originalSwimmingPool
  });

  const [calculating, setCalculating] = useState(false);
  const [scenarioResult, setScenarioResult] = useState(null);
  const [error, setError] = useState('');
  const [noChangeNotice, setNoChangeNotice] = useState('');
  const resultRef = useRef(null);

  const toggleAmenity = (key) => {
    setAmenities((prev) => ({ ...prev, [key]: !prev[key] }));
    setNoChangeNotice('');
  };

  const handleFurnishedChange = (val) => {
    setFurnished(val);
    setNoChangeNotice('');
  };

  const handleReset = () => {
    setFurnished(originalFurnished);
    setAmenities({
      parking: originalParking,
      lift: originalLift,
      powerBackup: originalPowerBackup,
      security: originalSecurity,
      gym: originalGym,
      swimmingPool: originalSwimmingPool
    });
    setScenarioResult(null);
    setError('');
    setNoChangeNotice('');
  };

  const calculateScenario = async () => {
    setError('');
    setNoChangeNotice('');

    const hasFurnishingChanged = furnished !== originalFurnished;
    const hasParkingChanged = amenities.parking !== originalParking;
    const hasLiftChanged = amenities.lift !== originalLift;
    const hasPowerBackupChanged = amenities.powerBackup !== originalPowerBackup;
    const hasSecurityChanged = amenities.security !== originalSecurity;
    const hasGymChanged = amenities.gym !== originalGym;
    const hasSwimmingPoolChanged = amenities.swimmingPool !== originalSwimmingPool;

    const hasAnyChange =
      hasFurnishingChanged ||
      hasParkingChanged ||
      hasLiftChanged ||
      hasPowerBackupChanged ||
      hasSecurityChanged ||
      hasGymChanged ||
      hasSwimmingPoolChanged;

    if (!hasAnyChange) {
      setNoChangeNotice('No scenario modifications detected. Adjust furnishing or amenities to evaluate what-if impact.');
      return;
    }

    setCalculating(true);
    const profile = locationProfiles[locality] || {
      Latitude: 17.385,
      Longitude: 78.4867,
      Distance_Metro_km: 3,
      Distance_School_km: 2,
      Distance_Hospital_km: 2
    };

    const payload = {
      Locality: locality,
      Property_Type: propertyType,
      Area_sqft: Number(area),
      Bedrooms: Number(bedrooms),
      Bathrooms: Number(bathrooms),
      Balconies: Number(balconies),
      Floor: Number(floor),
      Total_Floors: Number(totalFloors),
      Property_Age: Number(propertyAge),
      Furnished: furnished,
      Parking: amenities.parking ? 1 : 0,
      Facing: record.facing || 'East',
      Water_Supply: record.water_supply || '24x7',
      Lift: amenities.lift ? 'Yes' : 'No',
      Power_Backup: amenities.powerBackup ? 'Yes' : 'No',
      Security: amenities.security ? 'Yes' : 'No',
      Gym: amenities.gym ? 'Yes' : 'No',
      Swimming_Pool: amenities.swimmingPool ? 'Yes' : 'No',
      Latitude: profile.Latitude,
      Longitude: profile.Longitude,
      Distance_Metro_km: profile.Distance_Metro_km,
      Distance_School_km: profile.Distance_School_km,
      Distance_Hospital_km: profile.Distance_Hospital_km,
      is_scenario: true
    };

    try {
      const data = await predictionService.predictPrice(payload);

      const scenarioLakhs = Number(data.predicted_price_lakhs);
      const scenarioInr = Number(data.predicted_price_inr);
      const diffLakhs = scenarioLakhs - originalLakhs;
      const diffInr = scenarioInr - originalInr;
      const diffPercent = originalInr > 0 ? (diffInr / originalInr) * 100 : 0;

      const changesList = [];
      if (hasFurnishingChanged) {
        changesList.push({
          label: 'Furnishing Status',
          detail: `${originalFurnished} → ${furnished}`,
          type: 'furnishing'
        });
      }
      const amenityKeys = [
        ['parking', 'Parking', originalParking],
        ['lift', 'Lift', originalLift],
        ['powerBackup', 'Power Backup', originalPowerBackup],
        ['security', 'Security', originalSecurity],
        ['gym', 'Gym', originalGym],
        ['swimmingPool', 'Swimming Pool', originalSwimmingPool]
      ];
      amenityKeys.forEach(([key, name, origVal]) => {
        if (amenities[key] !== origVal) {
          changesList.push({
            label: name,
            detail: amenities[key] ? '+ Added' : '− Removed',
            type: amenities[key] ? 'amenity_add' : 'amenity_remove'
          });
        }
      });

      setScenarioResult({
        scenarioLakhs,
        scenarioInr,
        diffLakhs,
        diffInr,
        diffPercent,
        changesList
      });

      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err) {
      setError(err.message || 'Unable to calculate valuation scenario.');
    } finally {
      setCalculating(false);
    }
  };

  return (
    <div className="whatif-workspace">
      <div className="whatif-container">
        {/* Top bar */}
        <div className="whatif-top-bar">
          <button type="button" className="whatif-back-btn" onClick={onBack}>
            <Icon name="arrowLeft" size={16} />
            <span>Back to Valuation</span>
          </button>
        </div>

        {/* Header */}
        <div className="whatif-header">
          <div className="whatif-eyebrow">
            <Icon name="sliders" size={14} />
            <span>WHAT-IF VALUATION</span>
          </div>
          <h1 className="whatif-title">Valuation Scenarios</h1>
          <p className="whatif-subtitle">
            Explore how different furnishing and amenity configurations may affect the estimated listing value.
          </p>
        </div>

        {/* Two-Column Interactive Workspace */}
        <div className="whatif-layout">
          {/* Left Column: Fixed Baseline & Controls */}
          <div className="whatif-card">
            {/* Current Property Fixed Baseline */}
            <PropertyBaseline
              locality={locality}
              propertyType={propertyType}
              area={area}
              bedrooms={bedrooms}
              bathrooms={bathrooms}
              floor={floor}
              totalFloors={totalFloors}
              propertyAge={propertyAge}
            />

            {/* Scenario Controls */}
            <ScenarioControls
              furnished={furnished}
              originalFurnished={originalFurnished}
              onFurnishedChange={handleFurnishedChange}
              amenities={amenities}
              onToggleAmenity={toggleAmenity}
              onCalculate={calculateScenario}
              onReset={handleReset}
              calculating={calculating}
              noChangeNotice={noChangeNotice}
              error={error}
            />
          </div>

          {/* Right Column: Scenario Result or Placeholder */}
          <div>
            <ScenarioResult
              scenarioResult={scenarioResult}
              originalLakhs={originalLakhs}
              originalInr={originalInr}
              resultRef={resultRef}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
