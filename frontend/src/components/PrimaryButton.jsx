const PrimaryButton = ({ children, type = 'button', disabled, onClick }) => {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold text-white transition ${
        disabled
          ? 'cursor-not-allowed bg-ink-700/60'
          : 'bg-sea-600 shadow-float hover:translate-y-[-1px] hover:bg-sea-700'
      }`}
    >
      {children}
    </button>
  )
}

export default PrimaryButton
