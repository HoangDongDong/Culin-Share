import { Link } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";

const ErrorPage = () => {
  return (
    <div className="bg-background text-on-background font-body-md min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow flex flex-col justify-center py-xl">
        {/* 404 Section */}
        <section className="px-margin-mobile md:px-margin-desktop bg-background select-none">
          <div className="max-w-max-width mx-auto flex flex-col items-center text-center">
            <div className="relative w-full max-w-lg mb-lg">
              <div className="aspect-square rounded-full bg-secondary-container opacity-20 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md blur-3xl"></div>
              <img
                alt="Empty Plate Illustration"
                className="relative z-10 w-full max-w-sm mx-auto object-contain mix-blend-multiply"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBRtbp3sWvMY8piC0vsuKHeKZC0Gpt1FCUzu2NzNeMv6h8Qc5uHfHNu8RlW-nBM1SWDH5_Ans_0q8xYLSVJrxH0F3et3V7uwpMEk3-0RAiNWnUrvDtXmiENLZN2mjad4DW_-BqUoQzR_yQT0cDVd0DPkKEuLh9JRlSf2pUehLv4gO8l3ywO5GBqixzoXwe_rqJxBX01z_S8CPBkmliITdn9u8Gpsmyv9CG4OgmGvyfdTdLEuZ8tWPeAVh4CaJOHSg_StbyphvFYzQ"
              />
            </div>
            
            <h1 className="font-display-lg-mobile md:font-display-lg text-display-lg-mobile md:text-display-lg text-on-surface mb-sm font-bold">
              Ồ! Công thức này đã bay mất...
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-xl mb-md">
              Có vẻ như món ăn bạn đang tìm kiếm đã được dọn khỏi thực đơn. Đừng lo, vẫn còn rất nhiều công thức ngon khác đang chờ bạn khám phá.
            </p>
            
            <Link
              to="/"
              className="bg-primary text-on-primary px-lg py-4 rounded-lg font-label-md text-label-md hover:bg-opacity-90 transition-all active:scale-95 shadow-md flex items-center gap-base font-bold"
            >
              <span className="material-symbols-outlined font-bold">home</span>
              Quay về trang chủ
            </Link>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default ErrorPage;
