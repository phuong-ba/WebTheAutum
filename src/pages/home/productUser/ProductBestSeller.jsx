import React, { useEffect, useState } from "react";
import logo from "/src/assets/login/logo.png";
import { NavLink, useNavigate } from "react-router";
import { Pagination, Radio, Spin } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { fetchBanChay } from "@/services/sanPhamService";
import { formatVND } from "@/api/formatVND";

export default function ProductBestSeller() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { dataBanChay, loading } = useSelector((state) => state.sanPham);

  const [currentImageIndexes, setCurrentImageIndexes] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [timeRange, setTimeRange] = useState("week");
  const pageSize = 9;

  useEffect(() => {
    dispatch(fetchBanChay(timeRange));
  }, [dispatch, timeRange]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndexes((prev) => {
        const newIndexes = { ...prev };
        (dataBanChay || []).forEach((product) => {
          const len = product.hinhAnhSanPham?.length || 1;
          newIndexes[product.id] =
            prev[product.id] + 1 < len ? (prev[product.id] || 0) + 1 : 0;
        });
        return newIndexes;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [dataBanChay]);

  const onProductDetail = (id) => {
    navigate(`/productDetail/${id}`);
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

  const calculateDiscountPercentage = (product) => {
    if (!hasDiscount(product)) return 0;
    const firstDetail = product.chiTietSanPhams[0];
    const discount = firstDetail.giaBan - firstDetail.giaSauGiam;
    return Math.round((discount / firstDetail.giaBan) * 100);
  };

  // Lọc sản phẩm
  const filteredBanChay = (dataBanChay || [])
    ?.filter((product) => product.trangThai === true)
    ?.map((product) => ({
      ...product,
      chiTietSanPhams:
        product.chiTietSanPhams?.filter((ct) => ct.trangThai === true) || [],
    }))
    ?.filter((product) => product.chiTietSanPhams.length > 0);

  const total = filteredBanChay.length;
  const paginatedData = filteredBanChay.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <>
      <div className="flex gap-10">
        {/* LEFT - Banner */}
        <div className="min-w-[360px] bg-amber-100 max-h-[575px] flex flex-col gap-20 items-center justify-between py-16 rounded-2xl">
          <div className="flex flex-col gap-5 items-center">
            <div className="text-xl font-mono text-orange-600">Sản phẩm</div>
            <div className="max-w-[280px] text-2xl text-center font-bold">
              Bán chạy nhất
            </div>

            {/* Radio chọn thời gian */}
            <div className="flex flex-col gap-2 mt-4">
              <div className="font-medium text-sm">Thời gian:</div>
              <Radio.Group
                value={timeRange}
                onChange={(e) => {
                  setTimeRange(e.target.value);
                  setCurrentPage(1);
                }}
                buttonStyle="solid"
              >
                <Radio.Button value="day">Hôm nay</Radio.Button>
                <Radio.Button value="week">Tuần này</Radio.Button>
                <Radio.Button value="month">Tháng này</Radio.Button>
                <Radio.Button value="year">Năm nay</Radio.Button>
              </Radio.Group>
            </div>
          </div>
          <img src={logo} alt="" className="w-[320px]" />
        </div>

        {/* RIGHT - Best Seller */}
        <div className="flex-1 flex flex-col gap-8">
          <div className="flex justify-between items-center">
            <div className="text-2xl font-bold">Sản phẩm bán chạy</div>
            <div className="text-sm text-gray-500">
              {timeRange === "day" && "Hôm nay"}
              {timeRange === "week" && "Tuần này"}
              {timeRange === "month" && "Tháng này"}
              {timeRange === "year" && "Năm nay"}
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Spin size="large" />
            </div>
          ) : total === 0 ? (
            <div className="text-center py-10 text-gray-500">
              Không có sản phẩm bán chạy trong khoảng thời gian này
            </div>
          ) : (
            <>
              {/* GRID sản phẩm */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {paginatedData.map((product) => (
                  <div
                    key={product.id}
                    className="border border-gray-300 rounded-md p-2 flex flex-col gap-4 hover:border-amber-700 group relative"
                  >
                    {hasDiscount(product) && (
                      <div className="absolute top-2 right-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded z-10">
                        -{calculateDiscountPercentage(product)}%
                      </div>
                    )}

                    <div className="flex items-center gap-5">
                      <div
                        className="p-4 bg-gray-100 rounded-md flex items-center justify-center min-w-[140px] min-h-[140px] max-h-[140px] max-w-[140px] cursor-pointer relative"
                        onClick={() => onProductDetail(product.id)}
                      >
                        <img
                          src={
                            product.hinhAnhSanPham?.[
                              currentImageIndexes[product.id] || 0
                            ] || logo
                          }
                          alt={product.tenSanPham}
                          className="w-[80px] object-center transform transition-transform duration-500 ease-in-out group-hover:scale-110"
                        />
                      </div>

                      <div className="flex flex-col gap-2">
                        <NavLink
                          className="font-medium text-lg hover:text-orange-600 max-w-[200px] block truncate-multiline"
                          onClick={() => onProductDetail(product.id)}
                        >
                          {product.tenSanPham}
                        </NavLink>

                        <div className="text-xs text-blue-600 font-semibold">
                          Đã bán: {product.tongSoLuongDaMua || 0}
                        </div>

                        <div className="flex gap-2 items-center flex-wrap">
                          {hasDiscount(product) ? (
                            <>
                              <div className="font-semibold text-orange-800">
                                {formatVND(
                                  product.chiTietSanPhams?.[0]?.giaSauGiam
                                )}
                              </div>
                              <div className="text-sm line-through text-gray-500">
                                {formatVND(
                                  product.chiTietSanPhams?.[0]?.giaBan
                                )}
                              </div>
                            </>
                          ) : (
                            <div className="font-semibold text-orange-800">
                              {formatVND(product.chiTietSanPhams?.[0]?.giaBan)}
                            </div>
                          )}
                        </div>

                        <div className="text-sm text-gray-500">
                          {product.tenChatLieu || "Cotton 100%"}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {total > pageSize && (
                <Pagination
                  align="center"
                  current={currentPage}
                  pageSize={pageSize}
                  total={total}
                  onChange={(page) => setCurrentPage(page)}
                />
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
