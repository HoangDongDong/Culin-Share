const InputField = ({
  label,
  type = 'text',
  name,
  value,
  onChange,
  placeholder,
  autoComplete,
  error,
  helperText,
  required,
}) => {
  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-ink-700" htmlFor={name}>
        {label}
      </label>
      <div
        className={`flex items-center rounded-2xl border bg-white/80 px-4 py-3 shadow-sm backdrop-blur transition focus-within:ring-2 ${
          error
            ? 'border-rose-400 ring-rose-200'
            : 'border-clay-200 focus-within:ring-sea-600/30'
        }`}
      >
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          className="w-full bg-transparent text-sm text-ink-900 placeholder:text-ink-700/45 focus:outline-none"
        />
      </div>
      {error ? (
        <p className="text-xs font-medium text-rose-600">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-ink-700/70">{helperText}</p>
      ) : null}
    </div>
  )
}

export default InputField
