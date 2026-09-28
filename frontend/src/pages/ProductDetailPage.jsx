import { useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";

const ProductDetailPage = () => {
  const [mainImage, setMainImage] = useState(
    "https://lh3.googleusercontent.com/aida-public/AB6AXuBzlEGUhapaAw4y93C2fwvUbI_D_i6gaF9GHd1DuWLg8-IDrPacSa2cbCVuR6BVoJ3cmijxz1TIAhv_ewjDiIwj47Y1G2MoP7m7B3qXRLH6nYN8-PX0spV4N_LzSCWO47jTuJne-5DAP0H8Tsnsq2gDai0em_D_SHwUAkRvvrUW3QcpwIeHilckKsvCzidzsjvG1CVfadqd551IvGSW41TWLMB3HRD-HpUF7dMvZsWoaLc47eSJQmheoUxsGrpkXu4cgbCkFlarHA"
  );
  const [qty, setQty] = useState(1);
  const [activeTab, setActiveTab] = useState("description");

  const images = [
    "https://lh3.googleusercontent.com/aida-public/AB6AXuBzlEGUhapaAw4y93C2fwvUbI_D_i6gaF9GHd1DuWLg8-IDrPacSa2cbCVuR6BVoJ3cmijxz1TIAhv_ewjDiIwj47Y1G2MoP7m7B3qXRLH6nYN8-PX0spV4N_LzSCWO47jTuJne-5DAP0H8Tsnsq2gDai0em_D_SHwUAkRvvrUW3QcpwIeHilckKsvCzidzsjvG1CVfadqd551IvGSW41TWLMB3HRD-HpUF7dMvZsWoaLc47eSJQmheoUxsGrpkXu4cgbCkFlarHA",
    "https://lh3.googleusercontent.com/aida-public/AB6AXuBBUb3k7t7NXFvy4FoKR5mzGwKEhDXppxlvFu3Sq7WVAsSTtioVRaQzuAcDkls9auvRYYwjeoNfloPGKMzoCQ3JxBU1FyV2cjxMI0BSEB5yfnomNKLVM8X6cyfPk6E3WgG1TPYn6IxwTamt87xmKN93yBushbdzz8Gc2S6nVK9h13QeY0c3pntqkgPl0Ph0Zct6uSu5q52J4y_xj5G6QEGi4rOEKRhH7s92Z7ZUeGVuwjUYg-0elvFeO7bec-X6MEhRqPmv859UpA",
    "https://lh3.googleusercontent.com/aida-public/AB6AXuCuoYfSVmwIKrpAjl99MdEgGZ4E0dr419ysnGCxXhT1HQ6Dqg8Z_zXYwtC2Gl7xovvExYj1_Nlv8UTZNkHH4fB0ksIhZniZeZJnoOB1V-jRozzVqP84sjplxd9DilAKpAeIa9FT1HEOTCEOD6RueoObWaE8wnY5CwXXD5q4Hkfct_CydTItkKRSEoAn5qbQskOeVrla8vI29vx42UOG5QptKo5jekXPFJzrn0JMQzJnpXmPRqelRkfbJ92qDDtHOWC2wB1tPJR_wA"
  ];

  const relatedProducts = [
    {
      id: 1,
      name: "Bộ Dao Đầu Bếp",
      price: "1.250.000đ",
      rating: "4.8",
      category: "Dụng cụ",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDCOkJKhbNizdcpAcvN6_toQjSaq2bw6wannRuy8iOFZEtlEsEmWwC9ndv25NKjNZbWjIo8bV5C5a-DUSYS4cuWr2DzlYXXZLIgM5U6NA-9rpD-gB0e_apnk4sEgaxbVXuVhgGFK_R4-wjEdHNmUSYVCXakgk3j269y9wqi5AbYUpaoXj5UAiAUzTEJqA04dnd7EemjXT1RuPaZ8bWIoTsKArBtGmUH4lRVIfv9mBUANfO2V1RojpMEfi6JvcP1EkUjydGoDUOqCg"
    },
    {
      id: 2,
      name: "Nước Mắm Truyền Thống",
      price: "185.000đ",
      rating: "5.0",
      category: "Gia vị lỏng",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAuL4Si5gBwhGM2hN62N9AKgqWjP-JNy2a3Z0swrNRd_npl_StAtJGxVTiJ8NFAAjqt-lLVoZo2jbC0lJcPMh0n7RgKjnXB8VS4cDDjFwLgcZnIEnduShJmcteUuFgyHQzbyjA6b0Z56kNv_yA1t-sg4IS6578N0XT0h_uhymXJo_mHhQjVbAOODmx7BcWS-TQovO6hX-vO3mBQSSBXvyIT80P_VYG_7jYuCEZzhup4iCUwqr-bmAdRqIBvq7fVOFbzbPuNEHU_8Q"
    },
    {
      id: 3,
      name: "Thớt Gỗ Nghiến",
      price: "320.000đ",
      rating: "4.7",
      category: "Gia dụng",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDqkCyZm_ibvenqgAAqEnoiRq3K5N3L0qEPlaeqQWaKNWBG2dZG3YhnK-Bo-4dB-1RmEA4nW_XfbHxfU5RVGot98r-SfpPoB71GcSoFLQma5NtnyJqCsKYauSSmwnQlWL2AeOLq_ZtQiGMenl4EZX2pkM151RL25Q-sbVozMeoZqIiNavdaGzupE9PzlAEIOYygf3QEYMb61n_ayas9gi6OS2Vb7VgbroZCgwPIR7HYhwFoVqS4Q1lqyu8BClSv76B6CJSHWSvzag"
    },
    {
      id: 4,
      name: "Cối Đá Marble",
      price: "550.000đ",
      rating: "4.9",
      category: "Dụng cụ",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBph_Q14GKad9Tw-w5Xg8kKgeLaiL6AhQY5khwBB1L4-GtMQ1fnJbjkinCHuFxeeM20EH7G3pjqjcJibSlFVK5lpkqSnVRwm6meMfPWrBV5SzdgbQbXi8-TA3xbKSnYhnM6wqOvMHXaCwggj3hyDpCkfbRji_qWEBvYgojl4k0aU8CBJzj8HHDFv16vBOWJ5KNrMETwLDu8M41Qt5XWj9z01eyiAnj6xtVHeErERXoDxKCl65CI0FOrIMimh87kLBvSs3kBn4zOMQ"
    }
  ];

  return (
    <div className="bg-surface text-on-surface font-body-md min-h-screen flex flex-col">
      <Header />
      
      <main className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop py-md flex-grow w-full">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-xs text-label-sm font-label-sm text-on-surface-variant mb-md select-none">
          <a href="#" className="hover:text-primary">Home</a>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <a href="#" className="hover:text-primary">Cửa hàng</a>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-primary font-semibold">Gia vị & Thảo mộc</span>
        </nav>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-xl">
          {/* Left Column: Image Gallery */}
          <div className="md:col-span-7 space-y-md">
            <div className="aspect-[4/3] w-full bg-white rounded-xl overflow-hidden shadow-soft border border-outline-variant/15 flex items-center justify-center">
              <img
                alt="Main spice set"
                className="w-full h-full object-cover transition-all duration-300"
                src={mainImage}
              />
            </div>
            
            <div className="grid grid-cols-4 md:grid-cols-5 gap-sm select-none">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setMainImage(img)}
                  className={`aspect-square bg-white rounded-lg overflow-hidden border-2 transition-all ${
                    mainImage === img ? "border-primary shadow-sm" : "border-transparent hover:border-outline-variant/50"
                  }`}
                >
                  <img alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" src={img} />
                </button>
              ))}
              
              <div className="aspect-square bg-surface-container flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-outline-variant text-on-surface-variant cursor-pointer hover:bg-surface-variant/30 transition-all">
                <span className="material-symbols-outlined">video_library</span>
                <span className="text-[10px] font-bold">VIDEO</span>
              </div>
            </div>
          </div>
          
          {/* Right Column: Product Info */}
          <div className="md:col-span-5 flex flex-col">
            <div className="mb-sm select-none">
              <span className="inline-block px-3 py-1 bg-tertiary-container/20 text-tertiary font-label-md text-label-sm rounded-full mb-base">
                Sản phẩm đặc tuyển
              </span>
              <h2 className="font-headline-md text-headline-md text-on-surface leading-tight mb-xs font-bold">
                Bộ Gia Vị Việt Cao Cấp - Hương Vị Truyền Thống
              </h2>
              <div className="flex items-center gap-md py-xs">
                <div className="flex items-center gap-xs">
                  <div className="flex text-primary">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <span key={i} className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    ))}
                    <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>star_half</span>
                  </div>
                  <span className="font-label-md text-label-md text-on-surface-variant">4.9 (120 đánh giá)</span>
                </div>
                <div className="w-px h-4 bg-outline-variant/50"></div>
                <span className="font-label-md text-label-md text-on-surface-variant">450 đã bán</span>
              </div>
            </div>
            
            <div className="py-md border-y border-outline-variant/10 mb-md select-none">
              <span className="font-display-lg text-display-lg text-primary font-bold">450.000đ</span>
              <p className="text-label-md text-tertiary mt-base flex items-center gap-xs font-bold">
                <span className="material-symbols-outlined scale-75">inventory_2</span>
                Còn 25 sản phẩm trong kho
              </p>
            </div>
            
            <p className="font-body-md text-body-md text-on-surface-variant mb-xl leading-relaxed">
              Bộ gia vị gồm 8 loại thảo mộc đặc trưng, được tuyển chọn kỹ lưỡng để mang lại hương vị chuẩn nhất cho món ăn Việt. Từ hạt tiêu Phú Quốc đến quế thanh Yên Bái, mỗi thành phần đều mang hơi thở của đất trời Việt Nam.
            </p>
            
            <div className="space-y-lg select-none">
              <div className="flex items-center gap-lg">
                <span className="font-label-md text-label-md text-secondary font-bold">Số lượng:</span>
                <div className="flex items-center border border-outline-variant rounded-lg overflow-hidden bg-white">
                  <button
                    onClick={() => qty > 1 && setQty(qty - 1)}
                    className="px-4 py-2 hover:bg-surface-variant/20 transition-colors text-secondary"
                  >
                    <span className="material-symbols-outlined text-[20px] font-bold">remove</span>
                  </button>
                  <span className="w-12 text-center font-label-md font-bold text-on-surface">{qty}</span>
                  <button
                    onClick={() => setQty(qty + 1)}
                    className="px-4 py-2 hover:bg-surface-variant/20 transition-colors text-secondary"
                  >
                    <span className="material-symbols-outlined text-[20px] font-bold">add</span>
                  </button>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-md">
                <button className="flex-1 py-4 bg-white border border-primary text-primary font-label-md font-bold rounded-lg hover:bg-primary/5 transition-all shadow-sm active:scale-95">
                  Thêm vào giỏ hàng
                </button>
                <button className="flex-1 py-4 bg-primary text-on-primary font-label-md font-bold rounded-lg hover:opacity-90 transition-all shadow-lg active:scale-95">
                  Mua ngay
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-md pt-lg border-t border-outline-variant/10">
                <div className="flex items-center gap-sm">
                  <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center">
                    <span className="material-symbols-outlined text-on-secondary-container">local_shipping</span>
                  </div>
                  <span className="text-label-sm font-label-sm font-bold text-on-surface">Giao hàng toàn quốc</span>
                </div>
                <div className="flex items-center gap-sm">
                  <div className="w-10 h-10 rounded-full bg-tertiary-fixed flex items-center justify-center">
                    <span className="material-symbols-outlined text-on-tertiary-fixed">verified_user</span>
                  </div>
                  <span className="text-label-sm font-label-sm font-bold text-on-surface">Bảo hành 12 tháng</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <section className="mt-xl border-t border-outline-variant/10 pt-xl">
          <div className="flex gap-xl border-b border-outline-variant/10 mb-lg select-none">
            <button
              onClick={() => setActiveTab("description")}
              className={`pb-md font-label-md font-bold ${
                activeTab === "description" ? "border-b-2 border-primary text-primary" : "text-secondary hover:text-primary"
              }`}
            >
              Mô tả chi tiết
            </button>
            <button
              onClick={() => setActiveTab("usage")}
              className={`pb-md font-label-md font-bold ${
                activeTab === "usage" ? "border-b-2 border-primary text-primary" : "text-secondary hover:text-primary"
              }`}
            >
              Hướng dẫn sử dụng
            </button>
            <button
              onClick={() => setActiveTab("reviews")}
              className={`pb-md font-label-md font-bold ${
                activeTab === "reviews" ? "border-b-2 border-primary text-primary" : "text-secondary hover:text-primary"
              }`}
            >
              Đánh giá (120)
            </button>
          </div>
          
          <div className="grid md:grid-cols-2 gap-xl">
            {activeTab === "description" && (
              <div className="space-y-md text-on-surface-variant animate-in fade-in duration-300">
                <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">Khởi nguồn từ gian bếp Việt</h3>
                <p className="text-body-md leading-relaxed">
                  Hương vị Việt không chỉ nằm ở kỹ thuật chế biến mà còn ở sự kết hợp tinh tế của các loại thảo mộc tự nhiên. Bộ gia vị cao cấp của CulinShare là kết tinh của quá trình tìm kiếm và tuyển chọn khắt khe tại các vùng nguyên liệu trứ danh.
                </p>
                <ul className="space-y-sm select-none">
                  <li className="flex items-start gap-sm">
                    <span className="material-symbols-outlined text-primary text-[20px] mt-1 font-bold">check_circle</span>
                    <span><strong>Hạt tiêu Phú Quốc:</strong> Cay nồng, thơm đậm đặc trưng.</span>
                  </li>
                  <li className="flex items-start gap-sm">
                    <span className="material-symbols-outlined text-primary text-[20px] mt-1 font-bold">check_circle</span>
                    <span><strong>Quế thanh Yên Bái:</strong> Vị ngọt hậu, mùi thơm ấm áp.</span>
                  </li>
                  <li className="flex items-start gap-sm">
                    <span className="material-symbols-outlined text-primary text-[20px] mt-1 font-bold">check_circle</span>
                    <span><strong>Hồi Lạng Sơn:</strong> Cánh to, hương nồng nàn.</span>
                  </li>
                </ul>
              </div>
            )}
            
            {activeTab === "usage" && (
              <div className="space-y-md text-on-surface-variant animate-in fade-in duration-300">
                <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">Nâng tầm mọi món ăn</h3>
                <p className="text-body-md leading-relaxed">
                  Sử dụng rất đơn giản: lấy một lượng gia vị nhỏ ướp trực tiếp vào các loại thịt trước khi nấu từ 15-30 phút hoặc thả hồi/quế vào nồi nước dùng phở, nước lẩu để hầm chiết xuất hương vị thơm ngon nhất.
                </p>
              </div>
            )}

            {activeTab === "reviews" && (
              <div className="space-y-md text-on-surface-variant animate-in fade-in duration-300">
                <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">Ý kiến từ những người yêu bếp</h3>
                <p className="text-body-md leading-relaxed">
                  Đánh giá trung bình đạt <strong>4.9 / 5 sao</strong> dựa trên 120 bình chọn chất lượng thực tế. Khách hàng hài lòng vì hương vị mộc mạc tự nhiên không chất bảo quản.
                </p>
              </div>
            )}
            
            <div className="rounded-xl overflow-hidden shadow-soft border border-outline-variant/10">
              <img
                className="w-full h-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBM04e0c-R3rF_JOg5NaHmJ_3Ag7SC0Qn8FDaTLX9VrEdLUAjMR7RAIa-786G264BN4KQPXzMBkwpLLd3dT3meiOTSyTy3Bu1GhDENWCiQpjRHsfao1TbFdYD3g0Ff14AtphAQZP6dER1I1as5fwdz5eEkger-QLAMKRxrXRZMNDiEJRKEVn8uR7BcU9gpx5oMokvj9xf7irCJfGyE6yArKO8R1CwTKX9YX-GHpzLPLME1thViC42uDqzCsw5II0n_AbUj1oYDfZg"
                alt="Spices context"
              />
            </div>
          </div>
        </section>

        {/* Related Products Section */}
        <section className="mt-xl mb-xl">
          <div className="flex items-center justify-between mb-lg select-none">
            <h3 className="font-headline-sm text-headline-sm font-bold">Sản phẩm tương tự</h3>
            <a href="#" className="text-label-md text-primary flex items-center gap-xs hover:underline decoration-primary font-bold">
              Xem tất cả <span className="material-symbols-outlined scale-75 text-sm">arrow_forward</span>
            </a>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-gutter">
            {relatedProducts.map((p) => (
              <div
                key={p.id}
                className="bg-white rounded-xl overflow-hidden shadow-soft border border-outline-variant/10 group hover:-translate-y-1 transition-all duration-300 cursor-pointer"
              >
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    src={p.image}
                    alt={p.name}
                  />
                </div>
                <div className="p-md">
                  <span className="text-label-sm font-label-sm font-bold text-tertiary bg-tertiary-fixed-dim/20 px-2 py-0.5 rounded-full select-none">
                    {p.category}
                  </span>
                  <h4 className="font-headline-sm text-[18px] mt-sm mb-xs font-bold text-on-surface group-hover:text-primary transition-colors">
                    {p.name}
                  </h4>
                  <div className="flex items-center justify-between select-none">
                    <span className="font-bold text-primary">{p.price}</span>
                    <span className="text-label-sm text-on-surface-variant font-bold">{p.rating} ★</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default ProductDetailPage;
