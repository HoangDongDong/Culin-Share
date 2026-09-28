const statusStyles = {
  done: "border-emerald-200 bg-emerald-50 text-emerald-700",
  pending: "border-amber-200 bg-amber-50 text-amber-700",
  info: "border-clay-200 bg-clay-50 text-ink-700",
}

const ProfileActivityList = ({ items }) => {
  if (!items?.length) {
    return null
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <article
          key={`${item.title}-${item.time}`}
          className="rounded-2xl border border-clay-200 bg-clay-50/70 p-4"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="font-semibold text-ink-900">{item.title}</h3>
              <p className="mt-1 text-sm text-ink-700/70">{item.description}</p>
            </div>
            <span
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusStyles[item.status] ?? statusStyles.info}`}
            >
              {item.time}
            </span>
          </div>
        </article>
      ))}
    </div>
  )
}

export default ProfileActivityList