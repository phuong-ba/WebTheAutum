import React, { useEffect, useState } from "react";
import logo from "/src/assets/login/logo.png";
import { ArrowRightIcon } from "@phosphor-icons/react";
import { NavLink, useNavigate } from "react-router";
import { message, Pagination } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { fetchDotGiamGia } from "@/services/dotGiamGiaService";
import { fetchBanChay } from "@/services/sanPhamService";
import { formatVND } from "@/api/formatVND";

export default function ProductSale() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { data } = useSelector((state) => state.dotGiamGia);
  const dataBanChay = useSelector((state) => state.sanPham.dataBanChay) || [];

  const [currentImageIndexes, setCurrentImageIndexes] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 9;

  useEffect(() => {
    dispatch(fetchDotGiamGia());
    dispatch(fetchBanChay());
  }, [dispatch]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndexes((prev) => {
        const newIndexes = { ...prev };
        dataBanChay.forEach((product) => {
          const len = product.hinhAnhSanPham?.length || 1;
          newIndexes[product.id] =
            prev[product.id] + 1 < len ? prev[product.id] + 1 : 0;
        });
        return newIndexes;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [dataBanChay]);

  const onProductDetail = (id) => {
    navigate(`/productDetail/${id}`);
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

  // Lọc chỉ những sản phẩm CÓ GIẢM GIÁ
  const getDiscountedProducts = () => {
    return dataBanChay
      ?.filter((product) => product.trangThai === true) // chỉ lấy sản phẩm active
      ?.map((product) => ({
        ...product,
        chiTietSanPhams:
          product.chiTietSanPhams?.filter((ct) => ct.trangThai === true) || [],
      }))
      ?.filter((product) => product.chiTietSanPhams.length > 0)
      ?.filter(hasDiscount); // CHỈ LẤY SẢN PHẨM CÓ GIẢM GIÁ
  };

  const discountedProducts = getDiscountedProducts();
  const total = discountedProducts.length;

  const paginatedData = discountedProducts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <>
      <div className="flex gap-10">
        {/* LEFT - Banner */}
        {data && data.length > 0 && data[0]?.trangThai === 1 && (
          <div className="min-w-[360px] bg-amber-100 max-h-[575px] flex flex-col gap-20 items-center justify-between py-16 rounded-2xl">
            <div className="flex flex-col gap-5 items-center">
              <div className="text-xl font-mono text-orange-600">Giảm giá</div>
              <div className="max-w-[280px] text-2xl text-center font-bold">
                {data[0]?.tenDot} {data[0]?.giaTriGiam}%
              </div>

              <div
                className="flex items-center gap-1 bg-amber-800 rounded-2xl px-4 py-1 text-white hover:bg-amber-700 cursor-pointer"
                onClick={() => navigate("/product")}
              >
                <div className="text-sm font-semibold">Mua ngay</div>
                <ArrowRightIcon size={24} />
              </div>
            </div>

            <img src={logo} alt="" className="w-[320px]" />
          </div>
        )}

        {/* RIGHT - Sản phẩm giảm giá */}
        <div className="flex-1 flex flex-col gap-8">
          <div className="text-2xl font-bold">Sản phẩm giảm giá</div>

          {/* Kiểm tra nếu không có sản phẩm giảm giá */}
          {total === 0 ? (
            <div className="text-center py-10 text-gray-500">
              Hiện tại không có sản phẩm nào đang giảm giá
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
                    {/* Hiển thị badge giảm giá */}
                    <div className="absolute top-2 right-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded z-10">
                      -{calculateDiscountPercentage(product)}%
                    </div>

                    <div className="flex items-center gap-5">
                      <div
                        className="p-4 bg-gray-100 rounded-md flex items-center justify-center min-w-[140px] min-h-[140px] max-h-[140px] max-w-[140px] cursor-pointer"
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

                        {/* Hiển thị giá cho sản phẩm giảm giá */}
                        <div className="flex gap-2 items-center">
                          <div className="font-semibold text-orange-800">
                            {formatVND(
                              product.chiTietSanPhams?.[0]?.giaSauGiam
                            )}
                          </div>
                          <div className="text-sm line-through text-gray-500">
                            {formatVND(product.chiTietSanPhams?.[0]?.giaBan)}
                          </div>
                        </div>

                        {/* Hiển thị phần trăm giảm giá */}
                        <div className="text-xs text-red-600 font-semibold">
                          Tiết kiệm{" "}
                          {formatVND(
                            product.chiTietSanPhams?.[0]?.giaBan -
                              product.chiTietSanPhams?.[0]?.giaSauGiam
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination Antd */}
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
