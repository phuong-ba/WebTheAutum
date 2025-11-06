import {
  HeartIcon,
  ShoppingBagIcon,
  CaretLeft,
  CaretRight,
} from "@phosphor-icons/react";
import React, { useRef, useState, useEffect } from "react";

export default function ProductNew() {
  const scrollRef = useRef(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(true);

  const handleScroll = (direction) => {
    if (scrollRef.current) {
      const firstChild = scrollRef.current.children[0];
      if (!firstChild) return;
      const itemWidth = firstChild.getBoundingClientRect().width + 20;
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
  }, []);

  const products = [
    { id: 1, name: "Áo thun nam", price: "800.000₫", color: ["red", "blue"] },
    { id: 2, name: "Quần jean", price: "1.200.000₫", color: ["black", "gray"] },
    { id: 3, name: "Áo khoác", price: "950.000₫", color: ["green", "brown"] },
    { id: 4, name: "Váy nữ", price: "700.000₫", color: ["pink", "white"] },
    {
      id: 5,
      name: "Giày thể thao",
      price: "1.500.000₫",
      color: ["blue", "white"],
    },
    { id: 6, name: "Áo sơ mi", price: "650.000₫", color: ["gray", "blue"] },
    { id: 6, name: "Áo sơ mi", price: "650.000₫", color: ["gray", "blue"] },
    { id: 6, name: "Áo sơ mi", price: "650.000₫", color: ["gray", "blue"] },
    { id: 6, name: "Áo sơ mi", price: "650.000₫", color: ["gray", "blue"] },
    { id: 6, name: "Áo sơ mi", price: "650.000₫", color: ["gray", "blue"] },
    { id: 6, name: "Áo sơ mi", price: "650.000₫", color: ["gray", "blue"] },
    { id: 6, name: "Áo sơ mi", price: "650.000₫", color: ["gray", "blue"] },
    { id: 6, name: "Áo sơ mi", price: "650.000₫", color: ["gray", "blue"] },
  ];

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="flex flex-col items-center gap-8">
        <div className="font-bold text-2xl">NEW ARRIVAL</div>
        <div className="flex gap-10">
          <div>Danh Mục 1</div>
          <div>Danh Mục 2</div>
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
          className="flex gap-5 overflow-x-auto scroll-smooth p-4 scrollbar-none "
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          {products.map((item) => (
            <div
              key={item.id}
              className="relative flex-shrink-0 w-[330px] flex flex-col gap-5"
            >
              <div className="absolute -top-2 -left-2">
                <div className="rounded-tr-2xl min-w-[64px] p-1 text-center font-bold bg-[#e7973e] text-sm">
                  NEW
                </div>
                <div className="max-w-2 h-5 border-t-[20px] border-l-[9px] border-t-[#a23a38] border-l-transparent"></div>
              </div>

              <div className="min-w-[330px] bg-amber-200 max-h-[500px] min-h-[500px] rounded-xl"></div>

              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <div className="flex gap-3">
                    {item.color.map((c, i) => (
                      <div
                        key={i}
                        className="rounded-full w-4 h-4 cursor-pointer"
                        style={{ backgroundColor: c }}
                      ></div>
                    ))}
                  </div>
                  <HeartIcon size={24} />
                </div>
                <div className="font-medium text-gray-500">{item.name}</div>
                <div className="flex justify-between items-center">
                  <div className="text-md font-bold text-gray-700">
                    {item.price}
                  </div>
                  <div className="bg-amber-500 p-2 rounded-br-xl rounded-tl-xl hover:bg-amber-100 border border-amber-500">
                    <ShoppingBagIcon size={24} />
                  </div>
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

      <div className="border-r border-t border-b rounded-b-4xl  rounded-l-4xl border-gray-300">
        <div className="items-center flex justify-center gap-8 mr-1 -mt-1 rounded-br-3xl rounded-tl-3xl bg-white hover:bg-amber-700 border  shadow  border-black hover:border-amber-700 text-gray-700 hover:text-white  active:bg-blue-950 active:border-blue-950 active::text-white  overflow-hidden  hover:mr-0 transition-all duration-300 cursor-pointer">
          <div className="px-8 py-4">Xem tất cả</div>
        </div>
      </div>
    </div>
  );
}
