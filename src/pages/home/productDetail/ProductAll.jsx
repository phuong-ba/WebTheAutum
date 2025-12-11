import React, { useEffect, useMemo, useState } from "react";
import logo from "/src/assets/login/logo.png";
import { IconFillter, IconShoping, IconView } from "@/assets/svg/externalIcon";
import { Pagination, Tooltip, Modal, Button, InputNumber, message } from "antd";
import { NavLink, useNavigate, useSearchParams } from "react-router";
import ClientBreadcrumb from "../ClientBreadcrumb";
import FliterProductAll from "./FliterProductAll";
import { useDispatch, useSelector } from "react-redux";
import { fetchSanPham } from "@/services/sanPhamService";
import { formatVND } from "@/api/formatVND";

export default function ProductAll() {
  const dispatch = useDispatch();
  const { data } = useSelector((state) => state.sanPham);
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 14;
  const [showFilter, setShowFilter] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndexes, setCurrentImageIndexes] = useState({});
  const [availableSizes, setAvailableSizes] = useState([]);
  const [filterValues, setFilterValues] = useState({});

  const [searchParams] = useSearchParams();
  const keyword = searchParams.get("search");
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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

  // 1. Khi mở modal, reset lại
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
    setSelectedColor(null);
    setSelectedSize(null);
    setQuantity(1);
    setAvailableSizes([]); // reset
  };

  // 2. Lấy danh sách màu duy nhất (có hàng)
  const availableColorList = Array.from(
    new Map(
      selectedProduct?.chiTietSanPhams
        .filter((ct) => ct.soLuongTon > 0) // chỉ lấy cái còn hàng
        .map((ct) => [ct.tenMauSac, ct])
    ).values()
  ).map((ct) => ({
    tenMauSac: ct.tenMauSac,
    maHex: ct.maHex,
  }));

  // 3. Khi chọn màu → lọc size có hàng của màu đó
  const handleColorClick = (color) => {
    setSelectedColor(color);
    setSelectedSize(null);
    setQuantity(1);

    const sizesOfColor = selectedProduct.chiTietSanPhams
      .filter((ct) => ct.tenMauSac === color && ct.soLuongTon > 0)
      .map((ct) => ct.tenKichThuoc);

    setAvailableSizes([...new Set(sizesOfColor)]);
  };

  // 4. Lấy chính xác chi tiết sản phẩm (ưu tiên cái còn hàng nhiều nhất)
  // THAY TOÀN BỘ ĐOẠN NÀY TRONG ProductAll
  const selectedDetail = useMemo(() => {
    if (!selectedProduct || !selectedColor || !selectedSize) return null;

    // Lấy tất cả các variant trùng màu + size
    const candidates = selectedProduct.chiTietSanPhams.filter(
      (ct) =>
        ct.tenMauSac === selectedColor &&
        ct.tenKichThuoc === selectedSize &&
        ct.trangThai === true
    );

    if (candidates.length === 0) return null;

    // ƯU TIÊN: còn hàng + giá rẻ nhất (giaSauGiam)
    const inStock = candidates
      .filter((c) => c.soLuongTon > 0)
      .sort((a, b) => {
        const priceA = a.giaSauGiam ?? a.giaBan;
        const priceB = b.giaSauGiam ?? b.giaBan;
        return priceA - priceB; // giá rẻ lên trước
      });

    // Nếu có hàng → lấy cái rẻ nhất còn hàng
    if (inStock.length > 0) {
      return inStock[0];
    }

    // Nếu hết hàng → vẫn trả về cái rẻ nhất để hiển thị giá (không cho mua)
    const cheapest = candidates.reduce((best, curr) => {
      const pBest = best.giaSauGiam ?? best.giaBan;
      const pCurr = curr.giaSauGiam ?? curr.giaBan;
      return pCurr < pBest ? curr : best;
    });

    return cheapest;
  }, [selectedProduct, selectedColor, selectedSize]);

  const addToCart = () => {
    if (!selectedDetail) {
      messageApi.error("Vui lòng chọn màu và size!");
      return;
    }

    if (selectedDetail.soLuongTon === 0) {
      messageApi.error("Sản phẩm này đã hết hàng!");
      return;
    }

    const CART_KEY = "cart";
    const cart = JSON.parse(localStorage.getItem(CART_KEY)) || [];
    const img = selectedDetail.anhs?.[0]?.duongDanAnh || "";

    // Dùng ID chi tiết để phân biệt chính xác các lô hàng khác nhau
    const existingIndex = cart.findIndex(
      (item) => item.id === selectedDetail.id
    );

    if (existingIndex >= 0) {
      const newQty = cart[existingIndex].quantity + quantity;
      if (newQty > selectedDetail.soLuongTon) {
        messageApi.warning("Đã đạt tối đa số lượng tồn kho!");
        cart[existingIndex].quantity = selectedDetail.soLuongTon;
      } else {
        cart[existingIndex].quantity = newQty;
        messageApi.success("Cộng dồn số lượng thành công!");
      }
    } else {
      cart.push({
        id: selectedDetail.id,
        tenSanPham: selectedProduct.tenSanPham,
        tenMauSac: selectedDetail.tenMauSac,
        maHex: selectedDetail.maHex,
        tenKichThuoc: selectedDetail.tenKichThuoc,
        maVach: selectedDetail.maVach,
        giaBan: selectedDetail.giaBan,
        giaSauGiam: selectedDetail.giaSauGiam || selectedDetail.giaBan,
        soLuongTon: selectedDetail.soLuongTon,
        quantity: Math.min(quantity, selectedDetail.soLuongTon),
        duongDanAnh: img,
      });
      messageApi.success("Đã thêm vào giỏ hàng!");
    }

    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    setModalVisible(false);
    window.dispatchEvent(new Event("cartUpdated"));
  };

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
    ?.filter((product) => product.chiTietSanPhams.length > 0)
    // ÁP DỤNG BỘ LỌC
    ?.filter((product) => {
      if (
        filterValues.tenNhaSanXuat &&
        product.tenNhaSanXuat !== filterValues.tenNhaSanXuat
      )
        return false;
      if (
        filterValues.tenChatLieu &&
        product.tenChatLieu !== filterValues.tenChatLieu
      )
        return false;
      if (
        filterValues.tenKieuDang &&
        product.tenKieuDang !== filterValues.tenKieuDang
      )
        return false;
      if (
        filterValues.tenXuatXu &&
        product.tenXuatXu !== filterValues.tenXuatXu
      )
        return false;
      return true;
    });
  const filteredKeywordData = filteredData.filter((product) =>
    keyword
      ? product.tenSanPham.toLowerCase().includes(keyword.toLowerCase())
      : true
  );
  const totalProducts = filteredKeywordData.length;
  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalProducts);
  return (
    <>
      {contextHolder}
      <div className="flex flex-col gap-10">
        <div>
          <div className="text-3xl font-bold">Danh sách sản phẩm</div>
          <ClientBreadcrumb />
        </div>
        <div className="flex justify-between items-center">
          <div className="text-gray-500">
            Hiển thị {start}–{end} trong số {totalProducts} kết quả
          </div>
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
            <FliterProductAll onFilter={setFilterValues} />
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {filteredKeywordData.map((product) => (
            <div key={product.id} className="flex flex-col gap-4">
              <div className="p-12 bg-gray-100 min-w-[306px] max-w-[306px] min-h-[325px] max-h-[325px] flex items-center justify-center rounded-2xl relative group cursor-pointer">
                {/* Hiển thị badge giảm giá nếu có */}
                {hasDiscount(product) && (
                  <div className="absolute top-3 right-3 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded z-10">
                    -{calculateDiscountPercentage(product)}%
                  </div>
                )}

                <img
                  onClick={() => onProductDetail(product.id)}
                  src={
                    product.hinhAnhSanPham?.[
                      currentImageIndexes[product.id] || 0
                    ] || logo
                  }
                  alt={product.tenSanPham}
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
              <div className="flex gap-2 text-xs ">
                <div className="bg-orange-200 hover:text-orange-600  px-3 py-1  rounded-md">
                  {product.tenChatLieu}
                </div>
                <div className="bg-orange-200 hover:text-orange-600  px-3 py-1  rounded-md">
                  {product.tenKieuDang}
                </div>
                <div className="bg-orange-200 hover:text-orange-600  px-3 py-1  rounded-md">
                  {product.tenXuatXu}
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
      </div>

      <div className="py-10">
        <Pagination
          align="end"
          current={currentPage}
          pageSize={pageSize}
          total={totalProducts}
          onChange={(page) => setCurrentPage(page)}
        />
      </div>

      {/* MODAL THÊM GIỎ HÀNG */}
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
            disabled={!selectedDetail || selectedDetail.soLuongTon === 0}
            onClick={addToCart}
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
              <div className="flex gap-3 flex-wrap">
                {availableColorList.map((item) => (
                  <div
                    key={item.tenMauSac}
                    onClick={() => handleColorClick(item.tenMauSac)}
                    className={`relative cursor-pointer border-2 rounded-lg overflow-hidden ${
                      selectedColor === item.tenMauSac
                        ? "border-orange-600 shadow-lg"
                        : "border-gray-300"
                    }`}
                  >
                    <div
                      className="w-16 h-16"
                      style={{ backgroundColor: item.maHex || "#ccc" }}
                      title={item.tenMauSac}
                    />
                    <div className="text-xs text-center mt-1">
                      {item.tenMauSac}
                    </div>
                    {selectedColor === item.tenMauSac && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-white text-xl font-bold">✓</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* CHỌN SIZE */}
            {availableSizes.length > 0 && (
              <div className="mb-4">
                <div className="mb-2 font-semibold">Chọn size:</div>
                <div className="flex gap-2 flex-wrap">
                  {availableSizes.map((size) => (
                    <div
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-5 py-3 border rounded-lg cursor-pointer text-center min-w-12 ${
                        selectedSize === size
                          ? "bg-orange-600 text-white border-orange-600"
                          : "border-gray-400 hover:border-gray-600"
                      }`}
                    >
                      {size}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {selectedDetail && (
              <div className="mb-4">
                <div className="mb-2 font-semibold">Giá:</div>
                <div className="flex gap-2 items-center">
                  {selectedDetail.giaSauGiam &&
                  selectedDetail.giaSauGiam < selectedDetail.giaBan ? (
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
                    <div className="font-bold text-lg text-orange-800">
                      {formatVND(selectedDetail.giaBan)}
                    </div>
                  )}
                </div>
              </div>
            )}
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
