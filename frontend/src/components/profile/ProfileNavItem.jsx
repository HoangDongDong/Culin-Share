const ProfileNavItem = ({ icon, label, active = false, onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors ${
        active
          ? "bg-primary-fixed/50 text-primary shadow-sm"
          : "text-secondary hover:bg-surface-container-low"
      }`}
    >
      <span className="material-symbols-outlined text-[20px]">{icon}</span>
      <span className="min-w-0 flex-1 break-words font-medium text-sm leading-5">{label}</span>
    </button>
  )
}

export default ProfileNavItem