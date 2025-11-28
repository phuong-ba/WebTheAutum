import React, { useEffect, useState } from "react";

import payment from "/src/assets/img/footer-pay.png";

import { NavLink, useNavigate, useParams } from "react-router";
import ClientBreadcrumb from "../ClientBreadcrumb";
import { MinusIcon, PlusIcon, SealCheckIcon } from "@phosphor-icons/react";
import {
  IconFaceBook,
  IconLinkerIn,
  IconTwitter,
  IconVimeo,
} from "@/assets/svg/externalIcon";
import { message, Tabs } from "antd";
import InformationProduct from "./InformationProduct";
import { useDispatch, useSelector } from "react-redux";
import { getChiTietSanPhamBySanPham } from "@/services/chiTietSanPhamService";
import { formatVND } from "@/api/formatVND";

export default function ProductDetail() {
  const [messageApi, messageContextHolder] = message.useMessage();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedDetail, setSelectedDetail] = useState(null);
  const dispatch = useDispatch();
  const dataDetail = useSelector((state) => state.chiTietSanPham.dataDetail);
  const { id } = useParams();
  useEffect(() => {
    if (id) {
      dispatch(getChiTietSanPhamBySanPham(id));
    }
  }, [dispatch, id]);
  useEffect(() => {
    if (dataDetail && dataDetail.length > 0) {
      setSelectedImage(dataDetail[0]?.anhs[0]?.duongDanAnh);
    }
  }, [dataDetail]);
  const onChange = (key) => {
    console.log(key);
  };

  const handleDecrease = () => {
    if (quantity > 1) setQuantity(quantity - 1);
  };
  const handleSelectSize = (size) => {
    const found = dataDetail.find((d) => d.tenKichThuoc === size);
    setSelectedDetail(found);
    setSelectedImage(found?.anhs?.[0]?.duongDanAnh);
    setQuantity(1);
  };

  const handleIncrease = () => {
    if (quantity < (detail?.soLuongTon || Infinity)) {
      setQuantity(quantity + 1);
    } else {
      messageApi.warning("Số lượng đã đạt tối đa ");
    }
  };

  const handleChange = (e) => {
    let value = Number(e.target.value);
    const maxQuantity = detail?.soLuongTon || 0;

    if (!value || value < 1) value = 1;
    if (value > maxQuantity) {
      value = maxQuantity;
      messageApi.warning("Số lượng đã đạt tối đa");
    }

    setQuantity(value);
  };
  const addToCart = ({ product, selectedDetail }) => {
    if (!selectedDetail) {
      messageApi.error("Vui lòng chọn size trước khi thêm vào giỏ hàng");
      return;
    }

    const maxQuantity = selectedDetail.soLuongTon || 0;
    const CART_KEY = "cart";
    const cart = JSON.parse(localStorage.getItem(CART_KEY)) || [];

    const existingIndex = cart.findIndex(
      (item) =>
        item.id === product.id &&
        item.tenKichThuoc === selectedDetail.tenKichThuoc &&
        item.maHex === selectedDetail.maHex
    );

    const duongDanAnh = selectedDetail.anhs?.[0]?.duongDanAnh;

    if (existingIndex >= 0) {
      // Nếu đã đủ số lượng tồn, không tăng nữa
      if (cart[existingIndex].quantity >= maxQuantity) {
        messageApi.warning("Đã thêm đủ số lượng sản phẩm này trong giỏ hàng");
        setQuantity(maxQuantity);
        return;
      }

      // Tăng quantity nhưng không vượt quá tồn kho
      const newQuantity = Math.min(
        cart[existingIndex].quantity + quantity,
        maxQuantity
      );
      cart[existingIndex].quantity = newQuantity;
    } else {
      cart.push({
        id: product.id,
        tenSanPham: product.tenSanPham,
        tenKichThuoc: selectedDetail.tenKichThuoc,
        maHex: selectedDetail.maHex,
        giaBan: product.giaBan,
        giaSauGiam: product.giaSauGiam,
        soLuongTon: selectedDetail.soLuongTon,
        quantity: Math.min(quantity, maxQuantity),
        duongDanAnh,
      });
    }

    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    messageApi.success("Đã thêm sản phẩm vào giỏ hàng!");
    window.dispatchEvent(new Event("cartUpdated"));
  };

  const handleAddToCart = () => {
    if (!selectedDetail) {
      messageApi.error("Vui lòng chọn size trước khi thêm vào giỏ hàng");
      return;
    }

    addToCart({ product: detail, selectedDetail });
    setTimeout(() => {
      navigate("/cart");
    }, 1200);
  };
  const detail = selectedDetail || dataDetail[0];
  const items = [
    {
      key: "1",
      label: "Thông tin bổ sung",
      children: <InformationProduct detail={detail} />,
    },
  ];

  return (
    <>
      {messageContextHolder}
      <div className="flex flex-col gap-10">
        <div>
          <ClientBreadcrumb />
        </div>
        {detail && (
          <div className="flex justify-between gap-40 ">
            <div className="flex gap-3">
              <div className="flex flex-col gap-3">
                {detail.anhs?.map((img, index) => (
                  <div
                    key={index}
                    onClick={() => {
                      setSelectedImage(img.duongDanAnh);
                      setSelectedIndex(index);
                    }}
                    className={`min-w-[78px] max-w-[78px] max-h-[100px] min-h-[100px] 
              bg-gray-100 border flex items-center justify-center p-2 cursor-pointer 
              ${
                selectedIndex === index ? "border-2 border-amber-600" : "border"
              }`}
                  >
                    <img src={img.duongDanAnh} className="w-[60px]" />
                  </div>
                ))}
              </div>

              <div>
                <div className="min-w-[580px] max-w-[580px] min-h-[670px] bg-gray-100 flex items-center justify-center">
                  <img src={selectedImage} className="w-full" />
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-4 flex-1  border-b">
              <div className="flex flex-col gap-2 items-start">
                <div className="text-3xl font-bold"> {detail.tenSanPham}</div>
                <div className="text-blue-800 text-xs font-bold px-3 py-1 bg-blue-200 rounded-md">
                  Còn hàng
                </div>
              </div>{" "}
              <div className="text-blue-800 text-xs font-bold   rounded-md">
                Số lượng còn: <span>{detail.soLuongTon}</span>
              </div>
              <div className="text-base max-w-[600px] text-gray-600">
                {detail.moTa}
              </div>
              <div className="flex gap-1 items-center">
                <div className="text-sm line-through text-gray-500">
                  {formatVND(detail.giaBan)}
                </div>
                <div className="font-semibold text-orange-800 text-2xl">
                  {formatVND(detail.giaSauGiam)}
                </div>
              </div>
              <div className="flex gap-2 items-center">
                <div className="text-sm font-bold">Size:</div>

                <div className="flex gap-2">
                  {dataDetail.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleSelectSize(item.tenKichThuoc)}
                      className={`w-10 h-10 flex items-center justify-center rounded cursor-pointer font-semibold text-sm border
                ${
                  selectedDetail?.tenKichThuoc === item.tenKichThuoc
                    ? "border-black text-black"
                    : "border-gray-300 text-gray-500 hover:border-black hover:text-black"
                }
              `}
                    >
                      {item.tenKichThuoc}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 items-center">
                <div className="text-sm font-bold">Màu sắc:</div>

                <div className="flex gap-2">
                  {selectedDetail?.maHex && (
                    <div
                      className={`
        w-6 h-6 rounded-full border-2 cursor-pointer
        ${
          selectedColor === selectedDetail.id
            ? "border-black scale-110"
            : "border-gray-300"
        }
      `}
                      style={{ backgroundColor: selectedDetail.maHex }}
                      onClick={() => setSelectedColor(selectedDetail.id)}
                    ></div>
                  )}
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
                <div
                  className="flex flex-1 items-center justify-center border border-gray-400 px-6 py-4 font-bold select-none cursor-pointer hover:text-white hover:bg-amber-700 active:bg-blue-900"
                  onClick={() =>
                    addToCart({
                      product: detail,
                      selectedDetail,
                      quantity,
                      selectedImage,
                    })
                  }
                >
                  <div>Thêm vào giỏ hàng</div>
                </div>
              </div>
              <div
                className="flex items-center justify-center bg-amber-800 text-white px-6 py-4 font-bold select-none cursor-pointer hover:bg-amber-700 active:bg-blue-900"
                onClick={handleAddToCart}
              >
                <div>Mua Ngay</div>
              </div>
              <div className="flex gap-2 items-center">
                <div className="text-sm font-bold">SKU:</div>
                <div className="text-base text-gray-600">
                  {detail?.maVach || "Chưa có mã vạch"}
                </div>
              </div>
              <div className="flex gap-2 items-center">
                <div className="text-sm font-bold">Trọng lượng:</div>
                <div className="flex gap-2 items-center">
                  <div className="border border-amber-600 text-sm px-4 font-bold rounded">
                    {detail?.tenTrongLuong || "Chưa có mã vạch"}
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
                  Đảm bảo thanh toán an toàn và bảo mật
                </div>
                <img src={payment} alt="" />
              </div>
            </div>
          </div>
        )}
        <Tabs defaultActiveKey="1" items={items} onChange={onChange} />
      </div>
    </>
  );
}
