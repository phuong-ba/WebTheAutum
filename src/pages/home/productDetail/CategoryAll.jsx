import React, { useState } from "react";
import logo from "/src/assets/login/logo.png";
import {
  IconFillter,
  IconLove,
  IconShoping,
  IconView,
} from "@/assets/svg/externalIcon";
import { Pagination, Tooltip } from "antd";
import { NavLink } from "react-router";
import ClientBreadcrumb from "../ClientBreadcrumb";
import FliterProductAll from "./FliterProductAll";

export default function CategoryAll() {
  const [showFilter, setShowFilter] = useState(false);

  const products = [
    {
      id: 1,
      name: "Áo thun mặc ấm cho mùa đông",
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
      <div className="flex flex-col gap-10">
        <div>
          <div className="text-3xl font-bold">Danh mục sản phẩm</div>
          <ClientBreadcrumb />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 px-30">
          {products.map((product) => (
            <div key={product.id} className="flex flex-col gap-4">
              <div className="p-12 bg-gray-100 min-w-[416px] max-w-[416px] min-h-[420px] max-h-[420px] flex flex-col gap-4 items-center justify-center rounded-2xl relative group cursor-pointer">
                <img
                  src={product.image}
                  alt={product.name}
                  className=" object-center transform transition-transform duration-500 ease-in-out group-hover:scale-110 rounded-2xl"
                />
                <div className="flex flex-col gap-2 items-center">
                  <div className="flex flex-col gap-1">
                    <NavLink className="text-lg hover:text-orange-600 font-bold">
                      {product.name}
                    </NavLink>
                  </div>
                  <div className="flex gap-2 items-center">
                    <div className="font-semibold text-sm text-orange-800">
                      11 sản phẩm
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="py-10">
        <Pagination align="center" defaultCurrent={1} total={50} />
      </div>
    </>
  );
}
