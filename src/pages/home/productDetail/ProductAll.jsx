import React, { useState } from "react";
import logo from "/src/assets/login/logo.png";
import {
  IconFillter,
  IconLove,
  IconShoping,
  IconView,
} from "@/assets/svg/externalIcon";
import { Pagination, Tooltip } from "antd";
import { NavLink, useNavigate } from "react-router";
import ClientBreadcrumb from "../ClientBreadcrumb";
import FliterProductAll from "./FliterProductAll";

export default function ProductAll() {
  const [showFilter, setShowFilter] = useState(false);
  const navigate = useNavigate();
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
  const onProductDetail = () => {
    navigate(`/productdetail`);
  };
  return (
    <>
      <div className="flex flex-col gap-10">
        <div>
          <div className="text-3xl font-bold">Danh sách sản phẩm</div>
          <ClientBreadcrumb />
        </div>
        <div className="flex justify-between items-center">
          <div className="text-gray-500">Hiển thị 1–14 trong số 26 kết quả</div>
          <div
            className="bg-gray-900 text-white py-3 px-6 border cursor-pointer flex gap-1 hover:border hover:bg-white hover:text-gray-900 transition-colors duration-200 font-semibold items-center"
            onClick={() => setShowFilter(!showFilter)}
          >
            <IconFillter />
            Bộ lọc
          </div>
        </div>

        {showFilter && (
          <div className="transition-all duration-300">
            <FliterProductAll />
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6 ">
          {products.map((product) => (
            <div key={product.id} className="flex flex-col gap-4">
              <div className="p-12 bg-gray-100 min-w-[306px] max-w-[306px] min-h-[325px] max-h-[325px] flex items-center justify-center rounded-2xl relative group cursor-pointer">
                <img
                  onClick={() => onProductDetail()}
                  src={product.image}
                  alt={product.name}
                  className=" object-center transform transition-transform duration-500 ease-in-out group-hover:scale-110 rounded-2xl"
                />
                <div className="absolute top-2 left-2 flex flex-col gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Tooltip title="Thêm vào giỏ hàng" placement="right">
                    <div className="p-3 bg-white rounded-full shadow cursor-pointer hover:bg-amber-700 hover:text-white">
                      <IconShoping />
                    </div>
                  </Tooltip>
                  <Tooltip title="Xem chi tiết" placement="right">
                    <div className="p-3 bg-white rounded-full shadow cursor-pointer hover:bg-amber-700 hover:text-white">
                      <IconView />
                    </div>
                  </Tooltip>
                  <Tooltip title="Thêm vào yêu thích" placement="right">
                    <div className="p-3 bg-white rounded-full shadow cursor-pointer hover:bg-amber-700 hover:text-white">
                      <IconLove />
                    </div>
                  </Tooltip>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex flex-col gap-1">
                  <div className="flex gap-2">
                    {product.category.map((cat, idx) => (
                      <NavLink key={idx} className="text-xs">
                        {cat}
                      </NavLink>
                    ))}
                  </div>
                  <div
                    onClick={() => onProductDetail()}
                    className="font-medium text-lg hover:text-orange-600"
                  >
                    {product.name}
                  </div>
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
          ))}
        </div>
      </div>
      <div className="py-10">
        <Pagination align="end" defaultCurrent={1} total={50} />
      </div>
    </>
  );
}
