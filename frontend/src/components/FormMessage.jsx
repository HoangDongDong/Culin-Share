const toneStyles = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  error: 'border-rose-200 bg-rose-50 text-rose-800',
  info: 'border-amber-200 bg-amber-50 text-amber-800',
}

const FormMessage = ({ tone = 'info', title, description }) => {
  return (
    <div
      className={`rounded-2xl border px-4 py-3 text-sm ${toneStyles[tone]}`}
    >
      <p className="font-semibold">{title}</p>
      {description ? <p className="text-xs opacity-80">{description}</p> : null}
    </div>
  )
}

export default FormMessage
