import React from 'react';
import Icon from './Icon';

export function Stepper({ value, setValue, min = 0 }) {
  return (
    <div className="stepper">
      <button type="button" onClick={() => setValue(Math.max(min, Number(value) - 1))}>
        −
      </button>
      <strong>{value}</strong>
      <button type="button" onClick={() => setValue(Number(value) + 1)}>
        +
      </button>
    </div>
  );
}

export function Field({ icon, label, children }) {
  return (
    <label className="field">
      <span className="field-label">
        <Icon name={icon} size={16} />
        {label}
      </span>
      {children}
    </label>
  );
}

export function Select({ value, onChange, options, placeholder }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">{placeholder}</option>
      {options.map((x) => (
        <option key={x} value={x}>
          {x}
        </option>
      ))}
    </select>
  );
}
