export default function InputField({ label, helper, suffix, value, placeholder, onChange }) {
  return (
    <label className="input-field">
      <span className="input-label">{label}</span>
      <small>{helper}</small>
      <div className="input-frame">
        <input
          type="number"
          inputMode="decimal"
          step="0.0001"
          value={value}
          placeholder={placeholder}
          onFocus={(event) => event.target.select()}
          onChange={(event) => onChange(event.target.value)}
        />
        {value && (
          <button className="input-clear" type="button" aria-label={`נקה ${label}`} onClick={() => onChange('')}>
            ×
          </button>
        )}
        <em>{suffix}</em>
      </div>
    </label>
  );
}
