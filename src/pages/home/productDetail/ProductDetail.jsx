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

  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [activeDetails, setActiveDetails] = useState([]);
  const dispatch = useDispatch();
  const dataDetail = useSelector((state) => state.chiTietSanPham.dataDetail);

  const { id } = useParams();

  useEffect(() => {
    if (dataDetail && dataDetail.length > 0) {
      const active = dataDetail.filter((item) => item.trangThai === true);
      setActiveDetails(active);

      if (active.length > 0) {
        const defaultColor = active[0].maHex || active[0].tenMauSac || null;
        setSelectedColor(defaultColor);
        setSelectedDetail(active[0]);
        setSelectedImage(active[0]?.anhs?.[0]?.duongDanAnh);
      } else {
        setSelectedColor(null);
        setSelectedDetail(null);
      }
    }
  }, [dataDetail]);

  useEffect(() => {
    if (id) dispatch(getChiTietSanPhamBySanPham(id));
  }, [dispatch, id]);

  // Hàm kiểm tra sản phẩm có giảm giá không
  const hasDiscount = (product) => {
    if (!product) return false;
    return product.giaSauGiam && product.giaSauGiam < product.giaBan;
  };

  // Hàm tính phần trăm giảm giá
  const calculateDiscountPercentage = (product) => {
    if (!hasDiscount(product)) return 0;

    const discount = product.giaBan - product.giaSauGiam;
    return Math.round((discount / product.giaBan) * 100);
  };

  const detail = selectedDetail || dataDetail?.[0];

  const onChange = (key) => console.log(key);

  // -------------------------------------------------
  // HANDLE CHỌN MÀU
  // -------------------------------------------------
  const handleSelectColor = (colorValue) => {
    setSelectedColor(colorValue);
    setSelectedSize(null);
    setQuantity(1);

    const variant = activeDetails.find(
      (d) => (d.maHex || d.tenMauSac) === colorValue
    );

    setSelectedDetail(variant);
    setSelectedImage(variant?.anhs?.[0]?.duongDanAnh);
  };

  // -------------------------------------------------
  // HANDLE CHỌN SIZE
  // -------------------------------------------------
  const handleSelectSize = (size) => {
    if (!selectedColor) {
      messageApi.error("Vui lòng chọn màu trước!");
      return;
    }

    const found = activeDetails.find(
      (d) =>
        d.tenKichThuoc === size && (d.maHex || d.tenMauSac) === selectedColor
    );

    if (!found) return messageApi.warning("Size không có cho màu này");

    if (found.soLuongTon === 0)
      return messageApi.warning("Size này đã hết hàng");

    setSelectedSize(size);
    setSelectedDetail(found);
    setSelectedImage(found?.anhs?.[0]?.duongDanAnh);
    setQuantity(1);
  };

  // -------------------------------------------------
  // QUANTITY
  // -------------------------------------------------
  const handleDecrease = () => {
    if (quantity > 1) setQuantity(quantity - 1);
  };

  const handleIncrease = () => {
    if (quantity < (selectedDetail?.soLuongTon || 0)) {
      setQuantity(quantity + 1);
    } else {
      messageApi.warning("Số lượng đã đạt tối đa theo tồn kho");
    }
  };

  const handleChange = (e) => {
    let value = Number(e.target.value);
    const max = selectedDetail?.soLuongTon || 0;

    if (!value || value < 1) value = 1;
    if (value > max) {
      value = max;
      messageApi.warning("Số lượng vượt quá tồn kho");
    }
    setQuantity(value);
  };

  // -------------------------------------------------
  // ADD TO CART
  // -------------------------------------------------
  const addToCart = ({ product, selectedDetail, quantity }) => {
    if (!selectedDetail)
      return messageApi.error("Vui lòng chọn biến thể trước!");

    const maxQuantity = selectedDetail.soLuongTon;
    const CART_KEY = "cart";

    const cart = JSON.parse(localStorage.getItem(CART_KEY)) || [];

    const existingIndex = cart.findIndex(
      (item) =>
        item.id === product.id &&
        item.tenKichThuoc === selectedDetail.tenKichThuoc &&
        (item.maHex || item.tenMauSac) ===
          (selectedDetail.maHex || selectedDetail.tenMauSac)
    );

    const duongDanAnh = selectedDetail.anhs?.[0]?.duongDanAnh;

    if (existingIndex >= 0) {
      if (cart[existingIndex].quantity >= maxQuantity) {
        messageApi.warning("Đã thêm đủ số lượng sản phẩm này trong giỏ hàng");
        return;
      }

      cart[existingIndex].quantity = Math.min(
        cart[existingIndex].quantity + quantity,
        maxQuantity
      );
    } else {
      cart.push({
        id: product.id,
        tenSanPham: product.tenSanPham,
        tenKichThuoc: selectedDetail.tenKichThuoc,
        maHex: selectedDetail.maHex,
        tenMauSac: selectedDetail.tenMauSac,
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
    if (!selectedColor) return messageApi.error("Vui lòng chọn màu sản phẩm");

    if (!selectedSize)
      return messageApi.error("Vui lòng chọn màu/size hợp lệ trước khi mua!");

    if (!selectedDetail || selectedDetail.trangThai === false)
      return messageApi.error("Biến thể này không khả dụng");

    if (selectedDetail.soLuongTon === 0)
      return messageApi.error("Sản phẩm đã hết hàng");

    addToCart({ product: detail, selectedDetail, quantity });
    setTimeout(() => navigate("/cart"), 1000);
  };

  // -------------------------------------------------
  // UI DATA
  // -------------------------------------------------
  const items = [
    {
      key: "1",
      label: "Thông tin bổ sung",
      children: <InformationProduct detail={detail} />,
    },
  ];

  const isDisabledAddToCart =
    !selectedDetail ||
    !selectedDetail.trangThai ||
    selectedDetail.soLuongTon === 0;

  return (
    <>
      {messageContextHolder}
      <div className="flex flex-col gap-10">
        <ClientBreadcrumb />

        {detail && (
          <div className="flex justify-between gap-40">
            {/* LEFT IMAGE */}
            <div className="flex gap-3">
              <div className="flex flex-col gap-3">
                {detail.anhs?.map((img, index) => (
                  <div
                    key={index}
                    onClick={() => setSelectedImage(img.duongDanAnh)}
                    className="min-w-[78px] max-w-[78px] max-h-[100px] min-h-[100px] 
                    bg-gray-100 border flex items-center justify-center p-2 cursor-pointer"
                  >
                    <img src={img.duongDanAnh} className="w-[60px]" />
                  </div>
                ))}
              </div>

              <div className="min-w-[580px] max-w-[580px] min-h-[670px] bg-gray-100 flex items-center justify-center">
                <img src={selectedImage} className="w-full" />
              </div>
            </div>

            {/* RIGHT SECTION */}
            <div className="flex flex-col gap-4 flex-1 border-b">
              <div className="flex flex-col gap-2 items-start">
                <div className="text-3xl font-bold">{detail.tenSanPham}</div>

                {/* Hiển thị badge giảm giá nếu có */}
                {hasDiscount(detail) && (
                  <div className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
                    -{calculateDiscountPercentage(detail)}%
                  </div>
                )}

                <div
                  className={`text-xs font-bold px-3 py-1 rounded-md ${
                    detail.soLuongTon > 0
                      ? "text-blue-800 bg-blue-200"
                      : "text-red-800 bg-red-200"
                  }`}
                >
                  {detail.soLuongTon > 0 ? "Còn hàng" : "Hết hàng"}
                </div>
              </div>

              {/* STOCK INFO */}
              <div className="text-blue-800 text-xs font-bold">
                Số lượng còn: <span>{detail.soLuongTon}</span>
              </div>

              {/* DESCRIPTION */}
              <div className="text-base max-w-[600px] text-gray-600">
                {detail.moTa}
              </div>

              {/* PRICE - Hiển thị theo điều kiện có giảm giá */}
              <div className="flex gap-1 items-center flex-wrap">
                {hasDiscount(detail) ? (
                  // Hiển thị khi có giảm giá
                  <>
                    <div className="text-sm line-through text-gray-500">
                      {formatVND(detail.giaBan)}
                    </div>
                    <div className="font-semibold text-orange-800 text-2xl">
                      {formatVND(detail.giaSauGiam)}
                    </div>
                    <div className="text-sm text-red-600 font-semibold ml-2">
                      (Giảm {calculateDiscountPercentage(detail)}%)
                    </div>
                  </>
                ) : (
                  // Hiển thị khi không có giảm giá
                  <div className="font-semibold text-orange-800 text-2xl">
                    {formatVND(detail.giaBan)}
                  </div>
                )}
              </div>

              {/* MÀU SẮC */}
              <div className="flex gap-2 items-center">
                <div className="text-sm font-bold">Màu sắc:</div>

                <div className="flex gap-3 flex-wrap">
                  {activeDetails.map((item) => {
                    const colorValue = item.maHex || item.tenMauSac;

                    return item.maHex ? (
                      // Nếu có maHex → hiển thị vòng tròn màu
                      <div
                        key={item.id}
                        className={`w-6 h-6 rounded-full border-2 cursor-pointer 
                          ${
                            selectedColor === colorValue
                              ? "border-black scale-110"
                              : "border-gray-300"
                          }`}
                        style={{ backgroundColor: item.maHex }}
                        onClick={() => handleSelectColor(colorValue)}
                      ></div>
                    ) : (
                      // Nếu không có maHex → hiển thị tên màu
                      <div
                        key={item.id}
                        onClick={() => handleSelectColor(colorValue)}
                        className={`px-3 py-1 border rounded text-sm cursor-pointer 
                          ${
                            selectedColor === colorValue
                              ? "border-black font-semibold"
                              : "border-gray-400 text-gray-600"
                          }`}
                      >
                        {item.tenMauSac}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SIZE */}
              <div className="flex gap-2 items-center">
                <div className="text-sm font-bold">Size:</div>

                <div className="flex gap-2 flex-wrap">
                  {activeDetails
                    .filter((x) => (x.maHex || x.tenMauSac) === selectedColor)
                    .map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleSelectSize(item.tenKichThuoc)}
                        className={`w-10 h-10 flex items-center justify-center rounded cursor-pointer font-semibold text-sm border
                          ${
                            selectedSize === item.tenKichThuoc
                              ? "border-black text-black"
                              : "border-gray-300 text-gray-500 hover:border-black hover:text-black"
                          }`}
                      >
                        {item.tenKichThuoc}
                      </div>
                    ))}
                </div>
              </div>

              {/* QUANTITY */}
              <div className="flex gap-5">
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
                      className="w-10 text-center bg-transparent outline-none mx-2"
                    />

                    <div
                      onClick={handleIncrease}
                      className="p-1 hover:text-green-600 cursor-pointer select-none"
                    >
                      <PlusIcon size={20} weight="bold" />
                    </div>
                  </div>
                </div>

                {/* ADD TO CART */}
                <div
                  className={`flex flex-1 items-center justify-center border px-6 py-4 font-bold select-none 
    ${
      isDisabledAddToCart
        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
        : "cursor-pointer hover:text-white hover:bg-amber-700"
    }`}
                  onClick={() => {
                    if (isDisabledAddToCart) {
                      messageApi.error(
                        "Vui lòng chọn màu/size hợp lệ trước khi mua!"
                      );
                      return;
                    }

                    addToCart({ product: detail, selectedDetail, quantity });
                  }}
                >
                  {isDisabledAddToCart ? "Không khả dụng" : "Thêm vào giỏ hàng"}
                </div>
              </div>

              {/* BUY NOW */}
              <div
                className="flex items-center justify-center bg-amber-800 text-white px-6 py-4 font-bold cursor-pointer hover:bg-amber-700"
                onClick={handleAddToCart}
              >
                Mua Ngay
              </div>

              {/* SKU */}
              <div className="flex gap-2 items-center">
                <div className="text-sm font-bold">SKU:</div>
                <div className="text-base text-gray-600">
                  {detail?.maVach || "Chưa có mã vạch"}
                </div>
              </div>

              {/* WEIGHT */}
              <div className="flex gap-2 items-center">
                <div className="text-sm font-bold">Trọng lượng:</div>
                <div className="border border-amber-600 text-sm px-4 font-bold rounded">
                  {detail?.tenTrongLuong || "Chưa có trọng lượng"}
                </div>
              </div>

              {/* SHARE */}
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
                <SealCheckIcon size={20} />
                <div className="text-sm">Đổi trả dễ dàng trong 30 ngày</div>
              </div>

              <div className="flex gap-2 items-center text-gray-500">
                <SealCheckIcon size={20} />
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
