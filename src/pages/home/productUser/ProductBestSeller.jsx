import React, { useEffect, useState, useMemo, useCallback } from "react";
import logo from "/src/assets/login/logo.png";
import { NavLink, useNavigate } from "react-router-dom";
import { Pagination, Radio, Spin } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { fetchBanChay } from "@/services/sanPhamService";
import { formatVND } from "@/api/formatVND";

export default function ProductBestSeller() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Lấy data từ Redux - sửa selector
  const { dataBanChay, loading, status } = useSelector(
    (state) => state.sanPham
  );

  // Debug
  console.log("Redux State - dataBanChay:", dataBanChay);
  console.log("Redux State - Type:", typeof dataBanChay);
  console.log("Redux State - Is Array?", Array.isArray(dataBanChay));
  console.log("Redux State - Loading:", loading);
  console.log("Redux State - Status:", status);

  const [currentImageIndexes, setCurrentImageIndexes] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [timeRange, setTimeRange] = useState("week");
  const pageSize = 9;

  // Fetch dữ liệu khi thay đổi timeRange
  useEffect(() => {
    console.log("Dispatching fetchBanChay với timeRange:", timeRange);
    dispatch(fetchBanChay(timeRange));
  }, [dispatch, timeRange]);

  // Interval chuyển ảnh - chỉ chạy khi có dữ liệu hợp lệ
  useEffect(() => {
    // Sửa: Đảm bảo dataBanChay là mảng
    const safeData = Array.isArray(dataBanChay) ? dataBanChay : [];

    if (safeData.length === 0) {
      return;
    }

    const interval = setInterval(() => {
      setCurrentImageIndexes((prev) => {
        const newIndexes = { ...prev };
        safeData.forEach((product) => {
          if (product && product.id) {
            const images = product.hinhAnhSanPham;
            const len = Array.isArray(images) ? images.length : 1;
            if (len > 0) {
              newIndexes[product.id] =
                (prev[product.id] || 0) + 1 < len
                  ? (prev[product.id] || 0) + 1
                  : 0;
            }
          }
        });
        return newIndexes;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [dataBanChay]);

  // Chuyển đến trang chi tiết sản phẩm
  const onProductDetail = useCallback(
    (id) => {
      if (id) {
        navigate(`/productDetail/${id}`);
      }
    },
    [navigate]
  );

  // Kiểm tra sản phẩm có giảm giá không
  const hasDiscount = useCallback((product) => {
    if (
      !product ||
      !Array.isArray(product.chiTietSanPhams) ||
      product.chiTietSanPhams.length === 0
    ) {
      return false;
    }

    const firstDetail = product.chiTietSanPhams[0];
    return (
      firstDetail &&
      firstDetail.giaSauGiam &&
      firstDetail.giaBan &&
      firstDetail.giaSauGiam < firstDetail.giaBan
    );
  }, []);

  // Tính phần trăm giảm giá
  const calculateDiscountPercentage = useCallback(
    (product) => {
      if (!hasDiscount(product)) return 0;

      const firstDetail = product.chiTietSanPhams[0];
      const discount = firstDetail.giaBan - firstDetail.giaSauGiam;
      return Math.round((discount / firstDetail.giaBan) * 100);
    },
    [hasDiscount]
  );

  // Lọc và xử lý dữ liệu sản phẩm - SỬA LẠI ĐỂ AN TOÀN
  const filteredBanChay = useMemo(() => {
    try {
      // Đảm bảo dataBanChay là mảng
      const data = Array.isArray(dataBanChay) ? dataBanChay : [];

      console.log("Filtering data, length:", data.length);

      return data
        .filter((product) => product && product.trangThai === true)
        .map((product) => ({
          ...product,
          chiTietSanPhams: Array.isArray(product.chiTietSanPhams)
            ? product.chiTietSanPhams.filter(
                (ct) => ct && ct.trangThai === true
              )
            : [],
        }))
        .filter(
          (product) =>
            product.chiTietSanPhams &&
            Array.isArray(product.chiTietSanPhams) &&
            product.chiTietSanPhams.length > 0
        );
    } catch (error) {
      console.error("Error filtering dataBanChay:", error);
      return [];
    }
  }, [dataBanChay]);

  console.log("Filtered data length:", filteredBanChay.length);

  // Phân trang dữ liệu
  const total = filteredBanChay.length;
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredBanChay.slice(startIndex, endIndex);
  }, [filteredBanChay, currentPage]);

  // Xử lý thay đổi timeRange
  const handleTimeRangeChange = useCallback((e) => {
    const value = e.target.value;
    setTimeRange(value);
    setCurrentPage(1);
    setCurrentImageIndexes({});
  }, []);

  // Lấy tên hiển thị cho timeRange
  const getTimeRangeLabel = useCallback(() => {
    switch (timeRange) {
      case "day":
        return "Hôm nay";
      case "week":
        return "Tuần này";
      case "month":
        return "Tháng này";
      case "year":
        return "Năm nay";
      default:
        return "Tuần này";
    }
  }, [timeRange]);

  // Lấy giá hiển thị
  const getDisplayPrice = useCallback(
    (product) => {
      if (
        !product ||
        !Array.isArray(product.chiTietSanPhams) ||
        product.chiTietSanPhams.length === 0
      ) {
        return { price: 0, originalPrice: 0, hasDiscount: false };
      }

      const firstDetail = product.chiTietSanPhams[0];
      if (!firstDetail) {
        return { price: 0, originalPrice: 0, hasDiscount: false };
      }

      const isDiscount = hasDiscount(product);
      return {
        price: isDiscount ? firstDetail.giaSauGiam : firstDetail.giaBan,
        originalPrice: firstDetail.giaBan,
        hasDiscount: isDiscount,
      };
    },
    [hasDiscount]
  );

  // Hiển thị loading dựa trên Redux state
  const isLoading = loading || status === "pending";

  return (
    <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">
      {/* LEFT - Banner */}
      <div className="lg:min-w-[360px] bg-amber-100 max-h-[575px] flex flex-col gap-8 lg:gap-20 items-center justify-between py-8 lg:py-16 rounded-2xl">
        <div className="flex flex-col gap-4 lg:gap-5 items-center px-4">
          <div className="text-lg lg:text-xl font-mono text-orange-600">
            Sản phẩm
          </div>
          <div className="max-w-[280px] text-xl lg:text-2xl text-center font-bold">
            Bán chạy nhất
          </div>

          {/* Radio chọn thời gian */}
          <div className="flex flex-col gap-2 mt-2 lg:mt-4">
            <div className="font-medium text-sm">Thời gian:</div>
            <Radio.Group
              value={timeRange}
              onChange={handleTimeRangeChange}
              buttonStyle="solid"
              size="small"
              className="flex flex-wrap justify-center gap-2"
            >
              <Radio.Button value="day">Hôm nay</Radio.Button>
              <Radio.Button value="week">Tuần này</Radio.Button>
              <Radio.Button value="month">Tháng này</Radio.Button>
              <Radio.Button value="year">Năm nay</Radio.Button>
            </Radio.Group>
          </div>
        </div>

        <img
          src={logo}
          alt="Logo"
          className="w-[280px] lg:w-[320px] px-4 lg:px-0"
          loading="lazy"
        />
      </div>

      {/* RIGHT - Best Seller */}
      <div className="flex-1 flex flex-col gap-6 lg:gap-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="text-xl lg:text-2xl font-bold">Sản phẩm bán chạy</div>
          <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            {getTimeRangeLabel()}
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Spin size="large" tip="Đang tải sản phẩm..." />
          </div>
        ) : total === 0 ? (
          <div className="text-center py-10 lg:py-16 text-gray-500 bg-gray-50 rounded-lg">
            <div className="text-lg font-medium mb-2">
              {!dataBanChay ? "Không có dữ liệu" : "Không có sản phẩm bán chạy"}
            </div>
            <div className="text-sm">
              {!dataBanChay
                ? "Dữ liệu chưa được tải hoặc có lỗi xảy ra"
                : `Không tìm thấy sản phẩm bán chạy trong khoảng thời gian "${getTimeRangeLabel()}"`}
            </div>
          </div>
        ) : (
          <>
            {/* GRID sản phẩm */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
              {paginatedData.map((product) => {
                if (!product || !product.id) return null;

                const displayPrice = getDisplayPrice(product);
                const discountPercent = calculateDiscountPercentage(product);
                const soldCount = product.tongSoLuongDaMua || 0;
                const imageIndex = currentImageIndexes[product.id] || 0;
                const images = product.hinhAnhSanPham;
                const imageUrl =
                  Array.isArray(images) && images.length > 0
                    ? images[imageIndex]
                    : logo;

                return (
                  <div
                    key={product.id}
                    className="border border-gray-300 rounded-lg p-3 lg:p-4 flex flex-col gap-3 lg:gap-4 hover:border-amber-700 hover:shadow-md transition-all duration-300 group relative bg-white"
                  >
                    {displayPrice.hasDiscount && (
                      <div className="absolute top-2 right-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded z-10 shadow-sm">
                        -{discountPercent}%
                      </div>
                    )}

                    <div className="flex items-start lg:items-center gap-3 lg:gap-5">
                      {/* Ảnh sản phẩm */}
                      <div
                        className="p-3 bg-gray-50 rounded-md flex items-center justify-center min-w-[120px] min-h-[120px] lg:min-w-[140px] lg:min-h-[140px] cursor-pointer relative overflow-hidden"
                        onClick={() => onProductDetail(product.id)}
                      >
                        <img
                          src={imageUrl}
                          alt={product.tenSanPham || "Sản phẩm"}
                          className="w-[80px] lg:w-[90px] object-contain transform transition-transform duration-500 ease-in-out group-hover:scale-110"
                          loading="lazy"
                          onError={(e) => {
                            e.target.src = logo;
                          }}
                        />
                      </div>

                      {/* Thông tin sản phẩm */}
                      <div className="flex-1 flex flex-col gap-1 lg:gap-2 min-w-0">
                        <NavLink
                          className="font-medium text-base lg:text-lg hover:text-orange-600 line-clamp-2"
                          onClick={() => onProductDetail(product.id)}
                        >
                          {product.tenSanPham || "Không có tên"}
                        </NavLink>

                        <div className="text-xs text-blue-600 font-semibold">
                          Đã bán: {soldCount.toLocaleString()}
                        </div>

                        <div className="flex flex-col gap-1">
                          <div className="font-semibold text-orange-800 text-base lg:text-lg">
                            {formatVND(displayPrice.price)}
                          </div>
                          {displayPrice.hasDiscount && (
                            <div className="text-sm line-through text-gray-500">
                              {formatVND(displayPrice.originalPrice)}
                            </div>
                          )}
                        </div>

                        <div className="text-xs lg:text-sm text-gray-500">
                          {product.tenChatLieu || "Chất liệu cao cấp"}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {total > pageSize && (
              <div className="mt-6 lg:mt-8">
                <Pagination
                  align="center"
                  current={currentPage}
                  pageSize={pageSize}
                  total={total}
                  onChange={(page) => setCurrentPage(page)}
                  showSizeChanger={false}
                  showQuickJumper
                  showTotal={(total, range) =>
                    `${range[0]}-${range[1]} của ${total} sản phẩm`
                  }
                  className="custom-pagination"
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
