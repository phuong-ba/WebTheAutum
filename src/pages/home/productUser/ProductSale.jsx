import React from "react";
import logo from "/src/assets/login/logo.png";
import { ArrowRightIcon } from "@phosphor-icons/react";
import { NavLink } from "react-router";
import { Tooltip } from "antd";

export default function ProductSale() {
  const products = [
    {
      id: 1,
      name: "Áo thun mặc ấm cho mùa đông asdasd asdasd",
      category: ["Áo thun", "Áo len"],
      price: 240000,
      oldPrice: 420000,
      image: logo,
    },
    {
      id: 2,
      name: "Áo khoác mùa thu",
      category: ["Áo khoác"],
      price: 500000,
      oldPrice: 700000,
      image: logo,
    },
    {
      id: 3,
      name: "Quần jean nam",
      category: ["Quần"],
      price: 300000,
      oldPrice: 450000,
      image: logo,
    },
    {
      id: 4,
      name: "Giày thể thao",
      category: ["Giày"],
      price: 600000,
      oldPrice: 800000,
      image: logo,
    },
    {
      id: 5,
      name: "Giày thể thao",
      category: ["Giày"],
      price: 600000,
      oldPrice: 800000,
      image: logo,
    },
  ];

  return (
    <>
      <div className="flex gap-10">
        {/* Banner giảm giá */}
        <div className="min-w-[360px] bg-amber-100 max-h-[575px] flex flex-col gap-20 items-center justify-between py-16 rounded-2xl">
          <div className="flex flex-col gap-5 items-center">
            <div className="flex flex-col gap-1 items-center">
              <div className="text-xl font-mono text-orange-600">Giảm giá</div>
              <div className="max-w-[280px] text-2xl text-center font-bold">
                Giảm giá lên đến 26%
              </div>
            </div>
            <div className="flex items-center gap-1 bg-amber-800 rounded-2xl px-4 py-1 text-white hover:bg-amber-700 cursor-pointer">
              <div className="text-sm font-semibold">Mua ngay</div>
              <ArrowRightIcon size={24} />
            </div>
          </div>
          <div>
            <img src={logo} alt="" className="w-[320px]" />
          </div>
        </div>

        {/* Grid sản phẩm bán chạy */}
        <div className="flex-1 flex flex-col gap-8">
          <div className="text-2xl font-bold">Sản phẩm giảm giá</div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {products.map((product) => (
              <div
                key={product.id}
                className="border border-gray-300 rounded-md p-2 flex flex-col gap-4 hover:border-amber-700 group"
              >
                <div className="flex items-center gap-5">
                  <div className="p-4 bg-gray-100 rounded-md flex items-center justify-center min-w-[140px] min-h-[140px] max-h-[140px] max-w-[140px] cursor-pointer">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-[120px] object-center transform transition-transform duration-500 ease-in-out group-hover:scale-110"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-col gap-1">
                      <div className="flex gap-2 flex-wrap">
                        {product.category.map((cat, idx) => (
                          <NavLink key={idx} className="text-xs">
                            {cat}
                          </NavLink>
                        ))}
                      </div>
                      <NavLink className="font-medium text-lg hover:text-orange-600 max-w-[200px] block truncate-multiline">
                        {product.name}
                      </NavLink>
                    </div>
                    <div className="flex gap-2 items-center">
                      <div className="font-semibold text-orange-800">
                        {product.price.toLocaleString()}đ
                      </div>
                      <div className="text-sm line-through text-gray-500">
                        {product.oldPrice.toLocaleString()}đ
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
