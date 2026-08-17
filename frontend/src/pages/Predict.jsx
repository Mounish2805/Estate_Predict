import React, { useEffect, useRef, useState } from 'react';
import Icon from '../components/Icon';
import { Field, Select, Stepper } from '../components/FormControls';
import ValuationReportView from '../components/ValuationReportView';
import { localities, types, furnished, locationProfiles } from '../utils/constants';
import { predictionService } from '../services/api';

export default function Predict({ formState, setFormField, onExploreWhatIf }) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [submittedData, setSubmittedData] = useState(null);
  const resultRef = useRef(null);

  const f = formState;
  const set = setFormField;

  useEffect(() => {
    if (result && resultRef.current) {
      resultRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  }, [result]);

  const predict = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);
    if (!f.locality || !f.area || !f.furnished || !f.age) {
      setError('Please complete the required property details.');
      return;
    }
    setBusy(true);
    const profile = locationProfiles[f.locality] || {
      Latitude: 17.385,
      Longitude: 78.4867,
      Distance_Metro_km: 3,
      Distance_School_km: 2,
      Distance_Hospital_km: 2
    };

    const payload = {
      Locality: f.locality,
      Property_Type: f.propertyType,
      Area_sqft: Number(f.area),
      Bedrooms: Number(f.bedrooms),
      Bathrooms: Number(f.bathrooms),
      Balconies: Number(f.balconies),
      Floor: Number(f.floor),
      Total_Floors: Number(f.totalFloors),
      Property_Age: Number(f.age),
      Furnished: f.furnished,
      Parking: f.parking ? 1 : 0,
      Facing: 'East',
      Water_Supply: '24x7',
      Lift: f.lift ? 'Yes' : 'No',
      Power_Backup: f.powerBackup ? 'Yes' : 'No',
      Security: f.security ? 'Yes' : 'No',
      Gym: f.gym ? 'Yes' : 'No',
      Swimming_Pool: f.swimmingPool ? 'Yes' : 'No',
      Latitude: profile.Latitude,
      Longitude: profile.Longitude,
      Distance_Metro_km: profile.Distance_Metro_km,
      Distance_School_km: profile.Distance_School_km,
      Distance_Hospital_km: profile.Distance_Hospital_km
    };

    try {
      const data = await predictionService.predictPrice(payload);
      setResult(data);
      setSubmittedData({ ...f });
    } catch (err) {
      setError(err.message || 'Prediction failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="form-hero">
      <div className="cinema-hero-bg"></div>
      <div className="cinema-hero-overlay"></div>
      <div className="form-wrapper">
        <form id="predict-card" className="predict-card" onSubmit={predict}>
          <div className="card-head">
            <div className="house-circle">
              <Icon name="home" size={28} />
            </div>
            <div>
              <h2>PROPERTY DETAILS</h2>
              <p>Enter accurate property information for the best prediction</p>
            </div>
          </div>
          <div className="fields-grid">
            <Field icon="home" label="Locality">
              <Select
                value={f.locality}
                onChange={(v) => set('locality', v)}
                options={localities}
                placeholder="Select Locality"
              />
            </Field>
            <Field icon="home" label="Property Type">
              <Select
                value={f.propertyType}
                onChange={(v) => set('propertyType', v)}
                options={types}
                placeholder="Select Type"
              />
            </Field>
            <Field icon="ruler" label="Area (sq.ft)">
              <div className="text-input">
                <input
                  type="number"
                  value={f.area}
                  onChange={(e) => set('area', e.target.value)}
                  placeholder="e.g. 1,650"
                  required
                  min="100"
                />
                <span>sq ft</span>
              </div>
            </Field>
            <Field icon="bed" label="Bedrooms">
              <Stepper
                value={f.bedrooms}
                setValue={(v) => set('bedrooms', v)}
                min={1}
              />
            </Field>
            <Field icon="bath" label="Bathrooms">
              <Stepper
                value={f.bathrooms}
                setValue={(v) => set('bathrooms', v)}
                min={1}
              />
            </Field>
            <Field icon="building" label="Balconies">
              <Stepper
                value={f.balconies}
                setValue={(v) => set('balconies', v)}
                min={0}
              />
            </Field>
            <Field icon="building" label="Floor Number">
              <Stepper
                value={f.floor}
                setValue={(v) => set('floor', v)}
                min={0}
              />
            </Field>
            <Field icon="building" label="Total Floors">
              <Stepper
                value={f.totalFloors}
                setValue={(v) => set('totalFloors', v)}
                min={1}
              />
            </Field>
            <Field icon="car" label="Furnishing Status">
              <Select
                value={f.furnished}
                onChange={(v) => set('furnished', v)}
                options={furnished}
                placeholder="Select Furnishing"
              />
            </Field>
            <Field icon="calendar" label="Property Age (Years)">
              <div className="text-input">
                <input
                  type="number"
                  value={f.age}
                  onChange={(e) => set('age', e.target.value)}
                  placeholder="e.g. 5"
                  min="0"
                  required
                />
                <span>Years</span>
              </div>
            </Field>
          </div>
          <div className="amenities">
            <div className="amenities-title">Amenities</div>
            <div className="amenity-grid">
              {[
                ['parking', 'Parking'],
                ['lift', 'Lift'],
                ['powerBackup', 'Power Backup'],
                ['security', 'Security'],
                ['gym', 'Gym'],
                ['swimmingPool', 'Swimming Pool']
              ].map(([k, label]) => (
                <label className={`amenity ${f[k] ? 'active' : ''}`} key={k}>
                  <input
                    type="checkbox"
                    checked={f[k]}
                    onChange={(e) => set(k, e.target.checked)}
                  />
                  <span></span>
                  {label}
                </label>
              ))}
            </div>
          </div>
          {error && <div className="form-error">{error}</div>}
          <button type="submit" className="predict-btn" disabled={busy}>
            <Icon name="chart" size={18} />
            {busy ? 'Predicting Market Value…' : 'PREDICT PROPERTY PRICE'}
          </button>

          {result && submittedData && (
            <div ref={resultRef} style={{ marginTop: 24 }}>
              <ValuationReportView
                record={{
                  ...submittedData,
                  ...result,
                  id: result.prediction_id || result.id,
                  prediction_id: result.prediction_id || result.id,
                  locality: submittedData.locality,
                  property_type: submittedData.propertyType,
                  area_sqft: submittedData.area,
                  bedrooms: submittedData.bedrooms,
                  bathrooms: submittedData.bathrooms,
                  balconies: submittedData.balconies,
                  floor: submittedData.floor,
                  total_floors: submittedData.totalFloors,
                  furnished: submittedData.furnished,
                  property_age: submittedData.age,
                  parking: submittedData.parking ? 1 : 0,
                  lift: submittedData.lift ? 'Yes' : 'No',
                  power_backup: submittedData.powerBackup ? 'Yes' : 'No',
                  security: submittedData.security ? 'Yes' : 'No',
                  gym: submittedData.gym ? 'Yes' : 'No',
                  swimming_pool: submittedData.swimmingPool ? 'Yes' : 'No',
                  predicted_price_lakhs: result.predicted_price_lakhs,
                  predicted_price_inr: result.predicted_price_inr,
                  created_at: new Date().toISOString()
                }}
                onExploreWhatIf={(rec) => onExploreWhatIf && onExploreWhatIf(rec)}
              />
            </div>
          )}
        </form>
      </div>
    </section>
  );
}
