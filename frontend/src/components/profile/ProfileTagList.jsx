const ProfileTagList = ({ items }) => {
  if (!items?.length) {
    return null
  }

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span
          key={item}
          className="rounded-full border border-clay-200 bg-clay-50 px-3 py-1 text-xs font-semibold text-ink-700"
        >
          {item}
        </span>
      ))}
    </div>
  )
}

export default ProfileTagList