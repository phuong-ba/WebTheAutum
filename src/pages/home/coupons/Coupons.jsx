import React, { useEffect } from "react";
import ClientBreadcrumb from "../ClientBreadcrumb";
import logo from "/src/assets/login/logo.png";
import { useDispatch, useSelector } from "react-redux";
import { fetchPhieuGiamGia } from "@/services/phieuGiamGiaService";

export default function Coupons() {
  const dispatch = useDispatch();
  const { data } = useSelector((state) => state.phieuGiamGia);
  useEffect(() => {
    dispatch(fetchPhieuGiamGia());
  }, [dispatch]);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  return (
    <div className="px-10 py-6">
      <div className="mb-6">
        <div className="text-3xl font-bold">Nhận ưu đãi tốt nhất</div>
        <ClientBreadcrumb />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {data
          .filter((item) => item.trangThai !== 2)
          .map((item) => (
            <div
              key={item.id}
              className="flex bg-white shadow rounded-xl border overflow-hidden relative"
            >
              <div className="flex p-5 gap-5 flex-[7] items-center min-w-0">
                <img
                  src={logo}
                  alt={item.title}
                  className="w-28 h-28 object-contain flex-shrink-0"
                />
                <div className="min-w-0 flex flex-col gap-4">
                  <div className="font-bold text-lg truncate">{item.title}</div>
                  <div className="font-semibold text-red-500 text-xl">
                    {item.tenChuongTrinh}
                  </div>

                  <div className="flex flex-col gap-1 text-xs text-gray-500">
                    <div>
                      Ngày bắt đầu: <span>{item.ngayBatDau}</span>
                    </div>
                    <div>
                      Ngày kết thúc: <span>{item.ngayKetThuc}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute left-[60%] top-0 bottom-0 border-l border-dashed border-gray-300"></div>

              <div className="flex flex-col justify-center flex-[3] px-6">
                <div className="text-sm text-gray-600 mb-2">
                  Coupon:{" "}
                  <span
                    className={`font-semibold ${
                      item.trangThai === 0
                        ? "text-orange-500"
                        : "text-green-600"
                    }`}
                  >
                    {item.trangThai === 0 ? "Sắp diễn ra" : "Đang diễn ra"}
                  </span>
                </div>
                <div className="border border-dashed px-5 py-3 rounded-md font-bold text-green-700 tracking-widest cursor-pointer bg-green-50 hover:bg-green-100 truncate">
                  {item.maGiamGia}
                </div>
              </div>

              <div className="absolute left-[60%] -translate-x-1/2 -top-3 w-6 h-6 rounded-full bg-white border border-gray-300"></div>
              <div className="absolute left-[60%] -translate-x-1/2 -bottom-3 w-6 h-6 rounded-full bg-white border border-gray-300"></div>
            </div>
          ))}
      </div>
    </div>
  );
}
