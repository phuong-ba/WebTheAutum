import React, { useState } from "react";
import logo from "/src/assets/login/logo.png";
import logo1 from "/src/assets/login/bglogin.jpg";
import logo2 from "/src/assets/login/logo.png";
import payment from "/src/assets/img/footer-pay.png";

import { NavLink, useNavigate } from "react-router";
import ClientBreadcrumb from "../ClientBreadcrumb";
import { MinusIcon, PlusIcon, SealCheckIcon } from "@phosphor-icons/react";
import {
  IconFaceBook,
  IconLinkerIn,
  IconTwitter,
  IconVimeo,
} from "@/assets/svg/externalIcon";
import { Tabs } from "antd";
import InformationProduct from "./InformationProduct";
const sizes = ["S", "M", "L", "XL", "2XL"];
const colors = [
  { id: 1, code: "#d97706" }, // amber-600
  { id: 2, code: "#000000" }, // black
  { id: 3, code: "#2563eb" }, // blue
];
export default function ProductDetail() {
  const onChange = (key) => {
    console.log(key);
  };
  const items = [
    {
      key: "1",
      label: "Thông tin bổ sung",
      children: <InformationProduct />,
    },
  ];
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const images = [logo, logo1, logo2];
  const [selectedImage, setSelectedImage] = useState(images[0]);

  const [selectedColor, setSelectedColor] = useState(colors[0].id);
  const [selectedSize, setSelectedSize] = useState(sizes[0]);

  const handleDecrease = () => {
    if (quantity > 1) setQuantity(quantity - 1);
  };

  const handleIncrease = () => {
    setQuantity(quantity + 1);
  };

  const handleChange = (e) => {
    const value = Number(e.target.value);
    if (value >= 1) setQuantity(value);
    if (value === 0 || e.target.value === "") setQuantity(1);
  };
  return (
    <>
      <div className="flex flex-col gap-10">
        <div>
          <ClientBreadcrumb />
        </div>
        <div className="flex justify-between gap-40 ">
          <div className="flex gap-3">
            <div className="flex flex-col gap-3">
              {images.map((img, index) => (
                <div
                  key={index}
                  onClick={() => {
                    setSelectedImage(img);
                    setSelectedIndex(index);
                  }}
                  className={`min-w-[78px] max-w-[78px] max-h-[100px] min-h-[100px] 
        bg-gray-100 border flex items-center justify-center p-2 cursor-pointer 
        ${selectedIndex === index ? "border-2 border-amber-600" : "border"}`}
                >
                  <img src={img} alt="" className="w-[60px]" />
                </div>
              ))}
            </div>
            <div>
              <div className="min-w-[580px] max-w-[580px] min-h-[670px] bg-gray-100 flex items-center justify-center ">
                <img src={selectedImage} alt="" className="w-full" />
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-4 flex-1  border-b">
            <div className="flex flex-col gap-2 items-start">
              <div className="flex gap-2 text-sm">
                <div>Áo thun</div>
                <div>Áo len</div>
              </div>
              <div className="text-3xl font-bold">Áo len rách 3 lỗ</div>
              <div className="text-blue-800 text-xs font-bold px-3 py-1 bg-blue-200 rounded-md">
                Còn hàng
              </div>
            </div>
            <div className="text-base max-w-[600px] text-gray-600">
              Lorem ipsum dolor sit amet consectetur adipisicing elit.
              Recusandae sunt doloremque ab tempora aliquam! Et, quod adipisci
              natus dolorem error dolorum nobis odit fugit, nisi culpa illum
              repellendus iste at!
            </div>
            <div className="flex gap-1 items-center">
              <div className="text-sm line-through text-gray-500">
                123123123123đ
              </div>
              <div className="font-semibold text-orange-800 text-2xl">
                1231231231đ
              </div>
            </div>
            <div className="flex gap-2 items-center">
              <div className="text-sm font-bold">Màu sắc:</div>

              <div className="flex gap-2">
                {colors.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => setSelectedColor(c.id)}
                    className={`
          w-6 h-6 rounded-full border-2 cursor-pointer
          ${
            selectedColor === c.id
              ? "border-black scale-110"
              : "border-gray-300"
          }
        `}
                    style={{ backgroundColor: c.code }}
                  ></div>
                ))}
              </div>
            </div>
            <div className="flex gap-2 items-center">
              <div className="text-sm font-bold">Size:</div>

              <div className="flex gap-2">
                {sizes.map((s) => (
                  <div
                    key={s}
                    onClick={() => setSelectedSize(s)}
                    className={`
          w-10 h-10 flex items-center justify-center rounded cursor-pointer font-semibold text-sm border
          ${
            selectedSize === s
              ? "border-black text-black"
              : "border-gray-300 text-gray-500 hover:border-black hover:text-black"
          }
        `}
                  >
                    {s}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-5 ">
              <div className="flex items-center">
                <div className="text-sm font-bold">Số lượng:</div>

                <div className="bg-gray-200 px-3 py-2 flex items-center rounded-md max-w-[120px]">
                  <div
                    onClick={handleDecrease}
                    className="p-1 hover:text-red-500 cursor-pointer select-none"
                  >
                    <MinusIcon size={20} weight="bold" />
                  </div>
                  <input
                    type="number"
                    value={quantity}
                    onChange={handleChange}
                    className="w-10 text-center bg-transparent outline-none mx-2 appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    min={1}
                  />
                  <div
                    onClick={handleIncrease}
                    className="p-1 hover:text-green-600 cursor-pointer select-none"
                  >
                    <PlusIcon size={20} weight="bold" />
                  </div>
                </div>
              </div>
              <div className="flex flex-1 items-center justify-center border border-gray-400 px-6 py-4 font-bold select-none cursor-pointer hover:text-white hover:bg-amber-700 active:bg-blue-900">
                <div>Thêm vào giỏ hàng</div>
              </div>
            </div>
            <div
              className="flex items-center justify-center bg-amber-800 text-white px-6 py-4 font-bold select-none cursor-pointer hover:bg-amber-700 active:bg-blue-900"
              onClick={() => navigate(`/cart`)}
            >
              <div>Mua Ngay</div>
            </div>
            <div className="flex gap-2 items-center">
              <div className="text-sm font-bold">SKU:</div>
              <div className="text-base text-gray-600">NTB7SDVX44</div>
            </div>
            <div className="flex gap-2 items-center">
              <div className="text-sm font-bold">Danh mục:</div>
              <div className="flex gap-2 items-center">
                <div className="border border-amber-600 text-sm px-4 font-bold rounded">
                  Áo thun
                </div>
                <div className="border border-amber-600 text-sm px-4 font-bold rounded">
                  Áo len
                </div>
              </div>
            </div>
            <div className="flex gap-2 items-center">
              <div className="text-sm font-bold">Share:</div>
              <div className="flex gap-2">
                <div className="group w-10 p-3 bg-white shadow rounded-md cursor-pointer hover:bg-blue-500">
                  <IconFaceBook className="text-gray-800 group-hover:text-white" />
                </div>

                <div className="group w-10 p-3 bg-white shadow rounded-md cursor-pointer hover:bg-blue-500">
                  <IconTwitter className="text-gray-800 group-hover:text-white" />
                </div>

                <div className="group w-10 p-3 bg-white shadow rounded-md cursor-pointer hover:bg-blue-500">
                  <IconLinkerIn className="text-gray-800 group-hover:text-white" />
                </div>

                <div className="group w-10 p-3 bg-white shadow rounded-md cursor-pointer hover:bg-blue-500">
                  <IconVimeo className="text-gray-800 group-hover:text-white" />
                </div>
              </div>
            </div>
            <div className="flex gap-2 items-center text-gray-500">
              <div>
                <SealCheckIcon size={20} />
              </div>
              <div className="text-sm">Đổi trả dễ dàng trong 30 ngày</div>
            </div>
            <div className="flex gap-2 items-center text-gray-500">
              <div>
                <SealCheckIcon size={20} />
              </div>
              <div className="text-sm">
                Đặt hàng trước 14:30 để được giao hàng trong ngày
              </div>
            </div>
            <div className="bg-gray-100 p-4 flex flex-row lg:flex-col xl:flex-row justify-between items-center">
              <div className="lg:max-w-36 xl:max-w-36 text-sm text-gray-500">
                Guaranteed safe & secure checkout
              </div>
              <img src={payment} alt="" />
            </div>
          </div>
        </div>{" "}
        <Tabs defaultActiveKey="1" items={items} onChange={onChange} />
      </div>
    </>
  );
}
