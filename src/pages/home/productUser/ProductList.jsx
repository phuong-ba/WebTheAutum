import React, { useEffect, useState } from "react";
import logo from "/src/assets/login/logo.png";
import { IconShoping, IconView } from "@/assets/svg/externalIcon";
import { Tooltip, Modal, Button, InputNumber, message } from "antd";
import { NavLink, useNavigate } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import { fetchSanPham } from "@/services/sanPhamService";
import { formatVND } from "@/api/formatVND";

export default function ProductList() {
  const dispatch = useDispatch();
  const { data } = useSelector((state) => state.sanPham);
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [availableColors, setAvailableColors] = useState([]);
  const [selectedColor, setSelectedColor] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndexes, setCurrentImageIndexes] = useState({});
  const [availableSizes, setAvailableSizes] = useState([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndexes((prev) => {
        const newIndexes = { ...prev };
        data.forEach((product) => {
          const len = product.hinhAnhSanPham?.length || 1;
          newIndexes[product.id] =
            prev[product.id] + 1 < len ? prev[product.id] + 1 : 0;
        });
        return newIndexes;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [data]);

  useEffect(() => {
    dispatch(fetchSanPham());
  }, [dispatch]);

  const onProductDetail = (id) => {
    navigate(`/productDetail/${id}`);
  };

  const onAddToCartClick = (product) => {
    const isOutOfStock = product.chiTietSanPhams.every(
      (ct) => ct.soLuongTon === 0
    );

    if (isOutOfStock) {
      messageApi.warning("Sản phẩm đã hết hàng!");
      return;
    }

    setSelectedProduct(product);
    setModalVisible(true);
    setSelectedSize(null);
    setSelectedColor(null);
    setAvailableColors([]);
    setQuantity(1);
  };

  const selectedDetail =
    selectedProduct?.chiTietSanPhams.find(
      (ct) => ct.tenMauSac === selectedColor && ct.tenKichThuoc === selectedSize
    ) || null;

  const addToCart = ({ product, selectedDetail }) => {
    if (!selectedDetail) {
      messageApi.error("Vui lòng chọn size và màu trước khi thêm vào giỏ hàng");
      return;
    }

    const CART_KEY = "cart";
    const cart = JSON.parse(localStorage.getItem(CART_KEY)) || [];

    const existingIndex = cart.findIndex(
      (item) =>
        item.id === selectedDetail.id &&
        item.tenKichThuoc === selectedDetail.tenKichThuoc &&
        item.tenMauSac === selectedDetail.tenMauSac
    );

    const duongDanAnh = selectedDetail.anhs?.[0]?.duongDanAnh;

    if (existingIndex >= 0) {
      if (cart[existingIndex].quantity >= selectedDetail.soLuongTon) {
        messageApi.warning("Đã thêm đủ số lượng sản phẩm này trong giỏ hàng");
        setQuantity(selectedDetail.soLuongTon);
        return;
      }

      const totalQuantity = cart[existingIndex].quantity + quantity;
      cart[existingIndex].quantity =
        totalQuantity > selectedDetail.soLuongTon
          ? selectedDetail.soLuongTon
          : totalQuantity;

      messageApi.success("Đã cộng dồn số lượng sản phẩm trong giỏ hàng!");
    } else {
      const finalQuantity = Math.min(quantity, selectedDetail.soLuongTon);
      cart.push({
        id: selectedDetail.id,
        tenSanPham: product.tenSanPham,
        tenKichThuoc: selectedDetail.tenKichThuoc,
        maVach: selectedDetail.maVach,
        maHex: selectedDetail.maHex,
        tenMauSac: selectedDetail.tenMauSac,
        giaBan: selectedDetail.giaBan,
        giaSauGiam: selectedDetail.giaSauGiam || selectedDetail.giaBan,
        soLuongTon: selectedDetail.soLuongTon,
        quantity: finalQuantity,
        duongDanAnh,
      });
      messageApi.success("Đã thêm sản phẩm vào giỏ hàng!");
    }

    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    setModalVisible(false);
    window.dispatchEvent(new Event("cartUpdated"));
  };

  // Hàm kiểm tra sản phẩm có giảm giá không
  const hasDiscount = (product) => {
    if (!product.chiTietSanPhams || product.chiTietSanPhams.length === 0) {
      return false;
    }

    const firstDetail = product.chiTietSanPhams[0];
    return (
      firstDetail.giaSauGiam && firstDetail.giaSauGiam < firstDetail.giaBan
    );
  };

  // Hàm tính phần trăm giảm giá
  const calculateDiscountPercentage = (product) => {
    if (!hasDiscount(product)) return 0;

    const firstDetail = product.chiTietSanPhams[0];
    const discount = firstDetail.giaBan - firstDetail.giaSauGiam;
    return Math.round((discount / firstDetail.giaBan) * 100);
  };

  const filteredData = data
    ?.filter((product) => product.trangThai === true)
    ?.map((product) => ({
      ...product,
      chiTietSanPhams: product.chiTietSanPhams.filter(
        (ct) => ct.trangThai === true
      ),
    }))
    ?.filter((product) => product.chiTietSanPhams.length > 0);

  return (
    <>
      {contextHolder}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {filteredData.map((product) => (
          <div key={product.id} className="flex flex-col gap-4">
            <div className="p-12 bg-gray-100 min-w-[306px] max-w-[306px] min-h-[325px] max-h-[325px] flex items-center justify-center rounded-2xl relative group cursor-pointer">
              {/* Hiển thị badge giảm giá nếu có */}
              {hasDiscount(product) && (
                <div className="absolute top-3 right-3 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded z-10">
                  -{calculateDiscountPercentage(product)}%
                </div>
              )}

              <img
                src={
                  product.hinhAnhSanPham?.[
                    currentImageIndexes[product.id] || 0
                  ] || logo
                }
                alt={product.tenSanPham}
                onClick={() => onProductDetail(product.id)}
                className="w-[200px] object-center transform transition-transform duration-500 ease-in-out group-hover:scale-110 rounded-2xl"
              />
              <div className="absolute top-2 left-2 flex flex-col gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <Tooltip title="Thêm vào giỏ hàng" placement="right">
                  <div
                    className="p-3 bg-white rounded-full shadow cursor-pointer hover:bg-amber-700 hover:text-white"
                    onClick={() => onAddToCartClick(product)}
                  >
                    <IconShoping />
                  </div>
                </Tooltip>
                <Tooltip title="Xem chi tiết" placement="right">
                  <div
                    className="p-3 bg-white rounded-full shadow cursor-pointer hover:bg-amber-700 hover:text-white"
                    onClick={() => onProductDetail(product.id)}
                  >
                    <IconView />
                  </div>
                </Tooltip>
              </div>
            </div>
            <div className="flex gap-2 text-sm ">
              <div className="border px-2 rounded-md">
                {product.tenChatLieu}
              </div>
              <div className="border px-2 rounded-md">
                {product.tenKieuDang}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <NavLink
                className="font-medium text-lg hover:text-orange-600"
                onClick={() => onProductDetail(product.id)}
              >
                {product.tenSanPham}
              </NavLink>
              <div className="flex gap-2 items-center flex-wrap">
                {hasDiscount(product) ? (
                  // Hiển thị khi có giảm giá
                  <>
                    <div className="font-semibold text-orange-800 text-lg">
                      {formatVND(product.chiTietSanPhams[0].giaSauGiam)}
                    </div>
                    <div className="text-sm line-through text-gray-500">
                      {formatVND(product.chiTietSanPhams[0].giaBan)}
                    </div>
                  </>
                ) : (
                  // Hiển thị khi không có giảm giá
                  <div className="font-semibold text-orange-800 text-lg">
                    {formatVND(product.chiTietSanPhams[0]?.giaBan)}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal
        title="Thêm sản phẩm vào giỏ hàng"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setModalVisible(false)}>
            Hủy
          </Button>,
          <Button
            key="confirm"
            type="primary"
            disabled={
              !selectedColor ||
              !selectedSize ||
              quantity < 1 ||
              selectedDetail?.soLuongTon === 0
            }
            onClick={() =>
              addToCart({ product: selectedProduct, selectedDetail })
            }
          >
            {selectedDetail?.soLuongTon === 0
              ? "Hết hàng"
              : "Thêm vào giỏ hàng"}
          </Button>,
        ]}
      >
        {selectedProduct && (
          <>
            {/* CHỌN MÀU TRƯỚC */}
            <div className="mb-4">
              <div className="mb-2 font-semibold">Chọn màu:</div>
              <div className="flex gap-2 flex-wrap">
                {Array.from(
                  new Set(
                    selectedProduct.chiTietSanPhams.map((ct) => ct.tenMauSac)
                  )
                ).map((color) => (
                  <div
                    key={color}
                    className={`px-4 py-2 border rounded cursor-pointer ${
                      selectedColor === color
                        ? "bg-orange-600 text-white border-black"
                        : "bg-white"
                    }`}
                    onClick={() => {
                      setSelectedColor(color);
                      // LỌC SIZE THEO MÀU
                      const sizes = selectedProduct.chiTietSanPhams
                        .filter((ct) => ct.tenMauSac === color)
                        .map((ct) => ct.tenKichThuoc);
                      setAvailableColors([]);
                      setAvailableSizes(sizes);
                      setSelectedSize(null);
                    }}
                  >
                    {color}
                  </div>
                ))}
              </div>
            </div>

            {/* SAU KHI CHỌN MÀU MỚI CHO CHỌN SIZE */}
            {availableSizes?.length > 0 && (
              <div className="mb-4">
                <div className="mb-2 font-semibold">Chọn size:</div>
                <div className="flex gap-2 flex-wrap">
                  {availableSizes.map((size) => (
                    <div
                      key={size}
                      className={`px-4 py-2 border rounded cursor-pointer ${
                        selectedSize === size
                          ? "bg-orange-600 text-white border-black"
                          : "bg-white"
                      }`}
                      onClick={() => {
                        setSelectedSize(size);
                      }}
                    >
                      {size}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* THÔNG TIN GIÁ */}
            {selectedDetail && (
              <div className="mb-4">
                <div className="mb-2 font-semibold">Giá:</div>
                <div className="flex gap-2 items-center flex-wrap">
                  {selectedDetail.giaSauGiam &&
                  selectedDetail.giaSauGiam < selectedDetail.giaBan ? (
                    // Hiển thị khi có giảm giá
                    <>
                      <div className="font-bold text-lg text-orange-800">
                        {formatVND(selectedDetail.giaSauGiam)}
                      </div>
                      <div className="text-sm line-through text-gray-500">
                        {formatVND(selectedDetail.giaBan)}
                      </div>
                      <div className="text-sm text-red-600 font-semibold">
                        (Giảm{" "}
                        {Math.round(
                          ((selectedDetail.giaBan - selectedDetail.giaSauGiam) /
                            selectedDetail.giaBan) *
                            100
                        )}
                        %)
                      </div>
                    </>
                  ) : (
                    // Hiển thị khi không có giảm giá
                    <div className="font-bold text-lg text-orange-800">
                      {formatVND(selectedDetail.giaBan)}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SỐ LƯỢNG */}
            <div className="mb-4">
              <div className="mb-2 font-semibold">Số lượng:</div>
              <InputNumber
                min={1}
                max={selectedDetail?.soLuongTon || 1}
                value={quantity}
                onChange={(value) => {
                  if (!value || value < 1) value = 1;
                  if (selectedDetail && value > selectedDetail.soLuongTon)
                    value = selectedDetail.soLuongTon;
                  setQuantity(value);
                }}
              />
              {selectedDetail && (
                <div className="text-sm text-gray-500 mt-1">
                  Tối đa: {selectedDetail.soLuongTon}
                </div>
              )}
            </div>
          </>
        )}
      </Modal>
    </>
  );
}
