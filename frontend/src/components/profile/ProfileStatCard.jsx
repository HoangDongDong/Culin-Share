const toneStyles = {
  sea: "from-sea-600/25 to-sea-600/5 text-sea-700 border-sea-600/15",
  sunset:
    "from-sunset-400/25 to-sunset-400/5 text-sunset-500 border-sunset-400/15",
  ink: "from-ink-700/20 to-ink-700/5 text-ink-700 border-ink-700/15",
}

const ProfileStatCard = ({ label, value, note, tone = "ink" }) => {
  return (
    <div
      className={`rounded-3xl border bg-gradient-to-br p-5 shadow-sm ${toneStyles[tone]}`}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-inherit/70">
        {label}
      </p>
      <div className="mt-3 flex items-end justify-between gap-4">
        <span className="font-display text-3xl leading-none text-inherit">
          {value}
        </span>
        {note ? (
          <span className="rounded-full border border-current/10 bg-white/40 px-3 py-1 text-xs font-semibold text-inherit/80 backdrop-blur">
            {note}
          </span>
        ) : null}
      </div>
    </div>
  )
}

export default ProfileStatCard