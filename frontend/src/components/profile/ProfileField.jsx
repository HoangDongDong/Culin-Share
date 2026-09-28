const baseFieldClass =
  "w-full rounded-lg border border-outline-variant/30 bg-white px-4 py-3 text-sm text-on-surface outline-none transition-all placeholder:text-on-surface-variant/40 focus:border-primary focus:ring-2 focus:ring-primary/20"

const ProfileField = ({
  label,
  name,
  value,
  onChange,
  type = "text",
  placeholder,
  rows,
  as = "input",
}) => {
  const inputElement =
    as === "textarea" ? (
      <textarea
        id={name}
        name={name}
        rows={rows ?? 4}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={baseFieldClass}
      />
    ) : (
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={baseFieldClass}
      />
    )

  return (
    <div className="flex flex-col gap-2">
      <label className="px-1 font-medium text-sm text-on-surface-variant" htmlFor={name}>
        {label}
      </label>
      {inputElement}
    </div>
  )
}

export default ProfileField