import {
  endGiaoCa,
  fetchCaDangHoatDong,
  startGiaoCa,
} from "@/services/giaoCaService";
import { message, Modal } from "antd";
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import ChangeShiftsBreadcrumb from "./ChangeShiftsBreadcrumb";

export default function ChangeShifts() {
  const dispatch = useDispatch();

  const currentShift = useSelector((state) => state.giaoCa?.currentShift);
  const loading = useSelector((state) => state.giaoCa?.loading);
  const [messageApi, messageContextHolder] = message.useMessage();

  const [initialCash, setInitialCash] = useState("");
  const [ghiChuBatDau, setGhiChuBatDau] = useState("");
  const [isEndModalOpen, setIsEndModalOpen] = useState(false);
  const [finalCash, setFinalCash] = useState("");
  const [ghiChuKetThuc, setGhiChuKetThuc] = useState("");

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const nhanVienId = user?.id || 7;
  const hoTen = localStorage.getItem("user_name");

  // Kiểm tra ca đang hoạt động
  useEffect(() => {
    dispatch(fetchCaDangHoatDong(nhanVienId));
  }, [dispatch, nhanVienId]);

  const formatCurrency = (value) => {
    if (!value) return "";
    return value.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const handleInputChange = (e, setter) => {
    let raw = e.target.value.replace(/,/g, "");
    if (raw === "" || !isNaN(raw)) {
      setter(formatCurrency(raw));
    }
  };

  const handleStartShift = async () => {
    const amount = initialCash.replace(/,/g, "");
    if (!amount || Number(amount) <= 0) {
      messageApi.error("Vui lòng nhập số tiền hợp lệ!", "error");
      return;
    }

    const result = await dispatch(
      startGiaoCa({
        nhanVienId,
        soTienBatDau: amount,
        ghiChu: ghiChuBatDau.trim(),
      })
    );

    if (startGiaoCa.fulfilled.match(result)) {
      setInitialCash("");
      setGhiChuBatDau("");
      dispatch(fetchCaDangHoatDong(nhanVienId));
      messageApi.success({
        content: "Bắt đầu ca thành công! Chúc một ca làm việc hiệu quả!",
        duration: 2,
      });
    } else {
      messageApi.error(result.payload?.message || "Lỗi khi bắt đầu ca");
    }
  };

  const handleEndShift = async () => {
    const amount = finalCash.replace(/,/g, "");
    if (amount === "" || Number(amount) < 0) {
      messageApi.error("Vui lòng nhập số tiền cuối ca hợp lệ!");
      return;
    }

    const result = await dispatch(
      endGiaoCa({
        nhanVienId,
        soTienKetThuc: amount,
        ghiChu: ghiChuKetThuc.trim(),
      })
    );

    if (endGiaoCa.fulfilled.match(result)) {
      setIsEndModalOpen(false);
      setFinalCash("");
      setGhiChuKetThuc("");
      dispatch(fetchCaDangHoatDong(nhanVienId));
      messageApi.success({
        content: "Kết thúc ca thành công! Cảm ơn bạn đã làm việc chăm chỉ!",
        duration: 2,
      });
    } else {
      messageApi.error(result.payload?.messageApi || "Lỗi khi kết thúc ca");
    }
  };

  const displayCash = (amount) =>
    amount || amount === 0 ? Number(amount).toLocaleString("vi-VN") : "0";

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-2xl font-medium text-gray-600">
          Đang tải thông tin ca làm việc...
        </div>
      </div>
    );
  }

  return (
    <>
      {messageContextHolder}
      <div className=" bg-gradient-to-br from-gray-50 to-gray-100 p-6 flex flex-col gap-5">
        <div className="bg-white flex flex-col gap-3 px-4 py-[20px] rounded-lg shadow overflow-hidden">
          <div className="font-bold text-4xl text-[#E67E22]">
            Quản lý giao ca
          </div>
          <ChangeShiftsBreadcrumb />
        </div>
        {!currentShift && (
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-200">
            <div className="bg-gradient-to-r from-teal-500 to-emerald-600 px-8 py-6 text-center">
              <h2 className="text-3xl font-bold text-white">
                Bắt Đầu Ca Làm Việc Mới
              </h2>
              <p className="text-teal-50 mt-2">Nhân viên: {hoTen}</p>
            </div>

            <div className="p-8 space-y-8">
              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-4">
                  Số tiền mặt ban đầu (VNĐ)
                </label>
                <input
                  type="text"
                  value={initialCash}
                  onChange={(e) => handleInputChange(e, setInitialCash)}
                  placeholder="0"
                  className="w-full px-6 py-4 border-2 border-teal-200 rounded-2xl focus:ring-4 focus:ring-teal-300 focus:border-teal-500 outline-none text-3xl  font-mono bg-teal-50/30"
                />
              </div>
              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-4">
                  Ghi chú (nếu có)
                </label>
                <textarea
                  value={ghiChuBatDau}
                  onChange={(e) => setGhiChuBatDau(e.target.value)}
                  rows={4}
                  placeholder="Ví dụ: Nhận ca từ ..., tiền lẻ đủ các mệnh giá..."
                  className="w-full p-5 border-2 border-gray-300 rounded-2xl focus:ring-4 focus:ring-teal-300 focus:border-teal-500 outline-none resize-none text-gray-700"
                />
              </div>

              <div
                onClick={handleStartShift}
                className="w-full text-center cursor-pointer bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 hover:text-white text-white font-bold py-6 rounded-2xl text-2xl transition-all shadow-2xl hover:shadow-teal-500/50 transform  duration-300"
              >
                Bắt Đầu Ca Ngay
              </div>
            </div>
          </div>
        )}

        {currentShift && (
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-200">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-8 py-6">
              <h2 className="text-2xl font-bold text-white text-center">
                Ca Làm Việc Đang Diễn Ra
              </h2>
            </div>

            <div className="p-8 space-y-8 bg-gray-50/50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-lg">
                <div>
                  <span className="font-medium text-gray-600">Nhân viên:</span>
                  <p className="font-bold text-xl text-gray-900">{hoTen}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">
                    Bắt đầu lúc:
                  </span>
                  <p className="font-bold text-xl">
                    {new Date(currentShift.thoiGianBatDau).toLocaleString(
                      "vi-VN"
                    )}
                  </p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-teal-50 to-emerald-50 p-8 rounded-2xl border-2 border-teal-200">
                <p className="font-medium text-gray-700 text-lg">
                  Tiền mặt ban đầu
                </p>
                <p className="text-4xl font-bold text-teal-600 mt-3">
                  {displayCash(currentShift.soTienBatDau)} ₫
                </p>
              </div>
              <div className="bg-white rounded-2xl p-8 shadow-inner border space-y-6">
                <h3 className="font-bold text-2xl text-gray-800">
                  Tổng kết tạm thời
                </h3>
                <div className="space-y-5 text-lg">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tổng doanh thu:</span>
                    <span className="font-bold text-green-600 text-xl">
                      {displayCash(currentShift.tongDoanhThu)} ₫
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tiền mặt dự kiến:</span>
                    <span className="font-bold text-blue-600 text-xl">
                      {displayCash(
                        Number(currentShift.soTienBatDau || 0) +
                          Number(currentShift.tongDoanhThu || 0)
                      )}{" "}
                      ₫
                    </span>
                  </div>
                </div>
              </div>
              <div
                onClick={() => setIsEndModalOpen(true)}
                className="w-full bg-gradient-to-r text-center cursor-pointer from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-bold py-6 rounded-2xl text-2xl transition-all shadow-2xl hover:shadow-red-500/40 transform hover:scale-105 duration-300"
              >
                Kết Thúc Ca Làm Việc
              </div>
            </div>
          </div>
        )}
      </div>
      <Modal
        open={isEndModalOpen}
        title={
          <div className="text-center text-3xl font-bold text-red-600">
            Kết Thúc Ca
          </div>
        }
        onCancel={() => setIsEndModalOpen(false)}
        footer={null}
        width={700}
        centered
      >
        <div className="space-y-8 py-6">
          <div className="text-center bg-red-50 py-5 rounded-2xl border-2 border-red-200">
            <div className="text-xl font-bold text-red-700">
              Bạn sắp kết thúc ca làm việc. Vui lòng kiểm tra kỹ tiền mặt!
            </div>
          </div>

          <div>
            <label className="block text-lg font-semibold mb-4">
              Tiền mặt thực tế cuối ca (VNĐ)
            </label>
            <input
              type="text"
              value={finalCash}
              onChange={(e) => handleInputChange(e, setFinalCash)}
              placeholder="0"
              className="w-full px-6 py-6 border-2 border-red-300 rounded-2xl focus:ring-4 focus:ring-red-300 focus:border-red-500 outline-none text-3xl  font-mono bg-red-50"
            />
          </div>

          <div>
            <label className="block text-lg font-semibold mb-4">
              Ghi chú bàn giao
            </label>
            <textarea
              value={ghiChuKetThuc}
              onChange={(e) => setGhiChuKetThuc(e.target.value)}
              rows={5}
              placeholder="Ví dụ: Đã kiểm đếm đủ, tiền lẻ còn lại 500k, không có sự cố..."
              className="w-full p-5 border-2 border-gray-300 rounded-2xl focus:ring-4 focus:ring-red-300 focus:border-red-500 outline-none resize-none"
            />
          </div>

          <div className="flex gap-4 pt-6">
            <div
              onClick={() => setIsEndModalOpen(false)}
              className="flex-1 py-5 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold text-center cursor-pointer rounded-2xl text-xl transition"
            >
              Hủy
            </div>
            <div
              onClick={handleEndShift}
              className="flex-1 py-5 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 text-center cursor-pointer hover:to-rose-700 text-white font-bold rounded-2xl text-xl transition shadow-xl"
            >
              Xác Nhận Kết Thúc
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
