const DeleteSuccessModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#1b1c1c]/40 backdrop-blur-sm animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl p-lg max-w-md w-full mx-margin-mobile shadow-soft border border-outline-variant/10 transform scale-100 transition-transform duration-300 animate-in zoom-in-95 duration-200"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-tertiary-container flex items-center justify-center mb-md">
            <span className="material-symbols-outlined text-tertiary text-4xl font-bold">
              check_circle
            </span>
          </div>
          <h3 className="font-headline-sm text-headline-sm text-on-surface mb-sm font-bold">
            Xóa công thức thành công!
          </h3>
          <p className="text-body-md text-on-surface-variant mb-lg">
            Công thức đã được xóa khỏi hệ thống.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="w-full px-lg py-sm rounded-lg font-label-md text-label-md text-white bg-primary hover:bg-primary/90 transition-all active:scale-95 shadow-sm font-bold"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteSuccessModal;
