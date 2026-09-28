const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, isSubmitting }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#1b1c1c]/40 backdrop-blur-sm animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl p-lg max-w-md w-full mx-margin-mobile shadow-soft border border-outline-variant/10 transform scale-100 transition-transform duration-300 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-error-container flex items-center justify-center mb-md">
            <span className="material-symbols-outlined text-error text-4xl font-bold">warning</span>
          </div>
          <h3 className="font-headline-sm text-headline-sm text-on-surface mb-sm font-bold">
            Bạn có chắc muốn xóa bài viết này không?
          </h3>
          <p className="text-body-md text-on-surface-variant mb-lg">
            Hành động này không thể hoàn tác. Toàn bộ thông tin công thức và hình ảnh sẽ bị xóa khỏi hệ thống.
          </p>
          <div className="flex flex-col sm:flex-row gap-sm w-full font-label-md">
            <button 
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="flex-1 px-lg py-sm rounded-lg font-label-md text-label-md text-on-surface-variant bg-surface-container hover:bg-surface-container-high transition-colors disabled:opacity-50"
            >
              Hủy
            </button>
            <button 
              type="button"
              disabled={isSubmitting}
              onClick={onConfirm}
              className="flex-1 px-lg py-sm rounded-lg font-label-md text-label-md text-white bg-error hover:opacity-90 transition-all active:scale-95 shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                  Đang xóa...
                </>
              ) : (
                "Xóa bài"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
