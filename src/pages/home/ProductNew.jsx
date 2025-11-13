import {
  HeartIcon,
  ShoppingBagIcon,
  CaretLeft,
  CaretRight,
  ArrowLeft,
} from "@phosphor-icons/react";
import React, { useRef, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

const formatCurrency = (amount) => {
  if (typeof amount !== "number") return amount;
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
};

export default function ProductNew() {
  const scrollRef = useRef(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(true);
  const [products, setProducts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://localhost:8080/api/san-pham/trang-chu") 
      .then((res) => res.json())
      .then((data) => {
        setProducts(data.data || []);
      })
      .catch((err) => console.error("Lỗi khi fetch sản phẩm:", err));
  }, []);

  const handleScroll = (direction) => {
    if (scrollRef.current) {
      const firstChild = scrollRef.current.children[0];
      if (!firstChild) return;
      const itemWidth = firstChild.getBoundingClientRect().width + 20; // 20 = gap
      const { scrollLeft } = scrollRef.current;
      const scrollTo =
        direction === "left" ? scrollLeft - itemWidth : scrollLeft + itemWidth;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: "smooth" });
    }
  };

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const atStart = el.scrollLeft <= 0;
    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 5;
    setShowLeft(!atStart);
    setShowRight(!atEnd);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener("scroll", checkScroll);
    return () => el.removeEventListener("scroll", checkScroll);
  }, [products]);

  return (
    <div className="flex flex-col items-center gap-8">
      {/* Back Button */}
      

      {/* Header */}
      <div className="flex flex-col items-center gap-8">
        <div className="font-bold text-2xl">NEW ARRIVAL</div>
        <div className="flex gap-10">
          <div className="cursor-pointer hover:text-orange-500 transition-colors">Danh Mục 1</div>
          <div className="cursor-pointer hover:text-orange-500 transition-colors">Danh Mục 2</div>
        </div>
      </div>

      <div className="relative w-full max-w-full">
        {showLeft && (
          <button
            onClick={() => handleScroll("left")}
            className="absolute left-6 top-64 z-10 -translate-y-1/2 bg-white shadow p-2 rounded-full hover:bg-gray-100 transition"
          >
            <CaretLeft size={28} />
          </button>
        )}

        <div
          ref={scrollRef}
          className="flex gap-5 overflow-x-auto scroll-smooth p-4 scrollbar-none"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          {products.map((item) => (
            <div
              key={item.idSanPham}
              className="relative flex-shrink-0 w-[330px] flex flex-col gap-5"
            >
              {/* Badge Best Seller */}
              <div className="absolute -top-2 -left-2 z-10">
                <div className="rounded-tr-2xl min-w-[64px] p-1 text-center font-bold bg-[#e7973e] text-sm text-white">
                  Best Seller
                </div>
                <div className="max-w-2 h-5 border-t-[20px] border-l-[9px] border-t-[#a23a38] border-l-transparent"></div>
              </div>

              {/* Product Image - Clickable */}
              <Link to={`/product/${item.idSanPham}`}>
                <div className="min-w-[330px] max-h-[500px] min-h-[500px] rounded-xl overflow-hidden">
                  <img
                    src={item.anhDaiDien || 'https://via.placeholder.com/330x500'}
                    alt={item.tenSanPham}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
              </Link>

              {/* Product Info */}
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <div className="flex gap-3">
                    {/* Color dots - có thể thêm logic map màu nếu có */}
                    <div className="rounded-full w-4 h-4 cursor-pointer bg-black"></div>
                    <div className="rounded-full w-4 h-4 cursor-pointer bg-gray-400"></div>
                  </div>
                  <HeartIcon size={24} className="cursor-pointer hover:text-red-500 transition-colors" />
                </div>
                
                <Link to={`/product/${item.idSanPham}`}>
                  <div className="font-medium text-gray-500 hover:text-gray-800 transition-colors">
                    {item.tenSanPham}
                  </div>
                </Link>
                
                <div className="flex justify-between items-center">
                  <div className="flex gap-1 items-center justify-center">
                    <div className="text-md font-bold text-gray-700">
                      {formatCurrency(item.giaHienThi)}
                    </div>
                    {item.giaGoc && item.giaGoc > item.giaHienThi && (
                      <div className="text-sm font-bold text-gray-400 line-through">
                        {formatCurrency(item.giaGoc)}
                      </div>
                    )}
                  </div>
                  <Link to={`/product/${item.idSanPham}`}>
                    <div className="bg-amber-500 p-2 rounded-br-xl rounded-tl-xl hover:bg-amber-100 border border-amber-500 cursor-pointer transition-colors">
                      <ShoppingBagIcon size={24} />
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {showRight && (
          <button
            onClick={() => handleScroll("right")}
            className="absolute right-3 top-64 z-10 -translate-y-1/2 bg-white shadow p-2 rounded-full hover:bg-gray-100 transition"
          >
            <CaretRight size={28} />
          </button>
        )}
      </div>

      {/* View All Button */}
      <div className="border-r border-t border-b rounded-b-3xl rounded-l-3xl border-gray-300">
        <Link to="/products">
          <div className="items-center flex justify-center gap-8 rounded-br-3xl rounded-tl-3xl bg-white hover:bg-amber-500 border border-black hover:border-amber-500 text-gray-700 hover:text-white overflow-hidden mr-1 hover:mr-0 transition-all duration-300 cursor-pointer">
            <div className="px-8 py-4">Xem tất cả</div>
          </div>
        </Link>
      </div>

      <style jsx>{`
        .scrollbar-none::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}