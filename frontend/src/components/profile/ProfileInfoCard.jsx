const ProfileInfoCard = ({ title, description, children, className = "" }) => {
  return (
    <section
      className={`rounded-3xl border border-white/70 bg-white/90 p-6 shadow-float backdrop-blur ${className}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sea-700">
            {title}
          </p>
          {description ? (
            <p className="mt-2 text-sm text-ink-700/70">{description}</p>
          ) : null}
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  )
}

export default ProfileInfoCard