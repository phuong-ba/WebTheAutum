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
  console.log("🚀 ~ ProductList ~ data:", data);
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [availableColors, setAvailableColors] = useState([]);
  const [selectedColor, setSelectedColor] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndexes, setCurrentImageIndexes] = useState({});

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
    setSelectedProduct(product);
    setModalVisible(true);
    setSelectedSize(null);
    setSelectedColor(null);
    setAvailableColors([]);
    setQuantity(1);
  };

  const selectedDetail =
    selectedProduct?.chiTietSanPhams.find(
      (ct) => ct.tenKichThuoc === selectedSize && ct.tenMauSac === selectedColor
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
  return (
    <>
      {contextHolder}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {data.map((product) => (
          <div key={product.id} className="flex flex-col gap-4">
            <div className="p-12 bg-gray-100 min-w-[306px] max-w-[306px] min-h-[325px] max-h-[325px] flex items-center justify-center rounded-2xl relative group cursor-pointer">
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
              <div className="flex gap-2 items-center">
                <div className="font-semibold text-orange-800">
                  {formatVND(product.chiTietSanPhams[0].giaSauGiam)}
                </div>
                <div className="text-sm line-through text-gray-500">
                  {formatVND(product.chiTietSanPhams[0].giaBan)}
                </div>
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
            disabled={!selectedSize || !selectedColor || quantity < 1}
            onClick={() =>
              addToCart({ product: selectedProduct, selectedDetail })
            }
          >
            Thêm vào giỏ hàng
          </Button>,
        ]}
      >
        {selectedProduct && (
          <>
            <div className="mb-4">
              <div className="mb-2 font-semibold">Chọn size:</div>
              <div className="flex gap-2 flex-wrap ">
                {Array.from(
                  new Set(
                    selectedProduct.chiTietSanPhams.map((ct) => ct.tenKichThuoc)
                  )
                ).map((size) => (
                  <div
                    key={size}
                    className={`px-4 py-2 border rounded cursor-pointer ${
                      selectedSize === size
                        ? "bg-orange-600 text-white border border-black "
                        : "bg-white   "
                    }`}
                    onClick={() => {
                      setSelectedSize(size);
                      const colors = selectedProduct.chiTietSanPhams
                        .filter((ct) => ct.tenKichThuoc === size)
                        .map((ct) => ct.tenMauSac);
                      setAvailableColors(colors);
                      setSelectedColor(null);
                    }}
                  >
                    {size}
                  </div>
                ))}
              </div>
            </div>

            {availableColors.length > 0 && (
              <div className="mb-4">
                <div className="mb-2 font-semibold">Chọn màu:</div>
                <div className="flex gap-2 flex-wrap">
                  {availableColors.map((color) => (
                    <div
                      key={color}
                      className={`px-4 py-2 border rounded cursor-pointer ${
                        selectedColor === color
                          ? "bg-orange-600 text-white border border-black"
                          : "bg-white"
                      }`}
                      onClick={() => setSelectedColor(color)}
                    >
                      {color}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-4">
              <div className="mb-2 font-semibold">Số lượng:</div>
              <InputNumber
                min={1}
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
