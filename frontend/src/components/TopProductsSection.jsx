import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getTopProductsApi } from "../services/productApi";

const typeOptions = [
  {
    key: "best-seller",
    label: "Bán chạy nhất",
    description: "10 món ăn bán chạy được yêu thích nhất",
  },
  {
    key: "most-viewed",
    label: "Xem nhiều nhất",
    description: "10 món ngon thu hút lượt xem nhiều nhất",
  },
];

const formatCurrency = (value) => {
  if (!Number.isFinite(value)) return "0";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
};

const TopProductsSection = () => {
  const [type, setType] = useState("best-seller");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const fetchTopProducts = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await getTopProductsApi({
          type,
          page,
          limit: 10,
        });
        if (!active) return;
        setItems(response?.data || []);
        setPagination(
          response?.pagination || { page, limit: 10, total: 0, totalPages: 0 },
        );
      } catch (err) {
        if (!active) return;
        setItems([]);
        setPagination({ page, limit: 10, total: 0, totalPages: 0 });
        setError(err?.message || "Khong the tai danh sach cong thuc luc nay.");
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchTopProducts();

    return () => {
      active = false;
    };
  }, [page, type]);

  const headerText = useMemo(() => {
    const current = typeOptions.find((option) => option.key === type);
    return current?.description || "Danh sach cong thuc noi bat";
  }, [type]);

  const totalPages = pagination?.totalPages || 0;
  const canPrev = page > 1;
  const canNext = totalPages ? page < totalPages : items.length === 10;

  return (
    <div className="mt-12 rounded-3xl border border-[#2a2326] bg-[#141217] p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[#cbd5e1]/60">
            Nổi bật
          </p>
          <h3 className="mt-2 font-display text-2xl">Công thức nổi bật</h3>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {typeOptions.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => {
                setType(option.key);
                setPage(1);
              }}
              className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${
                type === option.key
                  ? "border-[#f59e0b] bg-[#1b1410] text-[#f59e0b]"
                  : "border-[#3a2e32] text-[#e5e7eb] hover:border-[#f59e0b]/60"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-[#cbd5e1]/70">
        <span>
          Trang {pagination?.page || page}
          {totalPages ? ` / ${totalPages}` : ""}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            disabled={!canPrev}
            className="rounded-full border border-[#3a2e32] px-3 py-1 text-xs font-semibold text-[#e5e7eb] transition disabled:cursor-not-allowed disabled:opacity-50"
          >
            Truoc
          </button>
          <button
            type="button"
            onClick={() => setPage((prev) => prev + 1)}
            disabled={!canNext}
            className="rounded-full border border-[#3a2e32] px-3 py-1 text-xs font-semibold text-[#e5e7eb] transition disabled:cursor-not-allowed disabled:opacity-50"
          >
            Tiep
          </button>
        </div>
      </div>

      <div className="mt-6">
        {loading ? (
          <div className="rounded-2xl border border-dashed border-[#3a2e32] bg-[#1b181f] px-6 py-8 text-center text-sm text-[#cbd5e1]/70">
            Dang tai danh sach cong thuc...
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-[#40211a] bg-[#24110f] px-6 py-8 text-center text-sm text-[#fca5a5]">
            {error}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#3a2e32] bg-[#1b181f] px-6 py-8 text-center text-sm text-[#cbd5e1]/70">
            Chua co cong thuc phu hop.
          </div>
        ) : (
          <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4">
            {items.map((item) => {
              const image = item?.images?.[0];
              const metric =
                type === "most-viewed"
                  ? `${Number(item.rating || 0).toFixed(1)} ★`
                  : `${item.sold || 0} đã bán`;

              return (
                <Link
                  key={item.id}
                  to={`/product/${item.id}`}
                  className="min-w-[240px] snap-start rounded-3xl border border-[#2a2326] bg-[#1b181f] p-4 shadow-sm hover:border-[#f59e0b]/40 hover:-translate-y-0.5 transition block"
                >
                  <div
                    className="h-36 w-full rounded-2xl bg-gradient-to-br from-[#1f1b1c] to-[#2a2326] bg-cover bg-center"
                    style={
                      image
                        ? {
                            backgroundImage: `url(${image})`,
                          }
                        : undefined
                    }
                  />
                  <div className="mt-4 flex items-center justify-between text-xs text-[#cbd5e1]/60">
                    <span>{item.category}</span>
                    <span>{metric}</span>
                  </div>
                  <h4 className="mt-3 font-display text-lg text-[#f3f4f6] hover:text-[#f59e0b] transition">
                    {item.name}
                  </h4>
                  <p className="mt-2 line-clamp-2 text-xs text-[#cbd5e1]/70">
                    {item.description}
                  </p>
                  <div className="mt-4 flex items-center justify-between text-xs text-[#cbd5e1]/70">
                    <span>{formatCurrency(Number(item.price))}</span>
                    {item.isBestSeller ? (
                      <span className="rounded-full bg-[#1b1410] px-2 py-1 text-[10px] font-semibold text-[#f59e0b]">
                        Best seller
                      </span>
                    ) : null}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default TopProductsSection;
