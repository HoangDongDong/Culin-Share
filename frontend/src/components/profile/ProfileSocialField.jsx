const ProfileSocialField = ({ icon, placeholder, value, onChange, name }) => {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-container-high text-secondary">
        <span className="material-symbols-outlined text-[20px]">{icon}</span>
      </div>
      <input
        className="w-full rounded-lg border border-outline-variant/30 bg-white px-4 py-3 text-sm text-on-surface outline-none transition-all placeholder:text-on-surface-variant/40 focus:border-primary focus:ring-2 focus:ring-primary/20"
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
      />
    </div>
  )
}

export default ProfileSocialField