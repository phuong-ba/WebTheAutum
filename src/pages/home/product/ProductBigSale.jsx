import { ArrowLeftIcon, ArrowRightIcon } from "@phosphor-icons/react";
import React, { useRef, useEffect, useState } from "react";

export default function ProductBigSale() {
  const scrollRef = useRef(null);
  const [index, setIndex] = useState(0);

  const products = [
    { id: 1, name: "Áo thun nam", price: "800.000₫", color: ["red", "blue"] },
    { id: 2, name: "Quần jean", price: "1.200.000₫", color: ["black", "gray"] },
    { id: 3, name: "Áo khoác", price: "950.000₫", color: ["green", "white"] },
    { id: 4, name: "Giày sneaker", price: "1.500.000₫", color: ["black"] },
  ];

  const itemWidth = 880;
  const total = products.length;

  const scrollToIndex = (i) => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        left: i * itemWidth,
        behavior: "smooth",
      });
    }
  };

  const handleScroll = (direction) => {
    let newIndex =
      direction === "left" ? (index - 1 + total) % total : (index + 1) % total;
    setIndex(newIndex);
    scrollToIndex(newIndex);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      handleScroll("right");
    }, 5000);
    return () => clearInterval(interval);
  }, [index]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex flex-col items-center gap-8">
        <div className="font-bold text-2xl">BIG SALE OUTLET TỪ 150K</div>
      </div>

      <div className="relative w-full max-w-full flex flex-col gap-4">
        <div
          ref={scrollRef}
          className="flex gap-5 overflow-x-hidden scroll-smooth no-scrollbar"
        >
          {products.map((item) => (
            <div
              key={item.id}
              className="relative flex-shrink-0 w-[860px] flex flex-col gap-5"
            >
              <div className="min-w-[860px] bg-amber-200 max-h-[500px] min-h-[350px] rounded-xl flex items-center justify-center">
                <span className="text-xl font-semibold">{item.name}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center gap-30">
          <ArrowLeftIcon
            size={64}
            weight="thin"
            className="text-gray-400 hover:text-black cursor-pointer"
            onClick={() => handleScroll("left")}
          />
          <div className="border flex-1 text-gray-400"></div>
          <ArrowRightIcon
            size={64}
            weight="thin"
            className="text-gray-400 hover:text-black cursor-pointer"
            onClick={() => handleScroll("right")}
          />
        </div>
      </div>
    </div>
  );
}
