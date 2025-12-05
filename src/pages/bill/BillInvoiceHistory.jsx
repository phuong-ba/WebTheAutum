import { ClockCountdownIcon } from "@phosphor-icons/react";
import React, { useState, useEffect } from "react";
import hoaDonApi from "../../api/HoaDonAPI";
import { useParams, useLocation } from "react-router-dom";

export default function BillInvoiceHistory() {
  const { id } = useParams();
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (id) {
      fetchPaymentHistory();
    }
  }, [id]);

  const fetchPaymentHistory = async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);

      // SỬA: Lấy từ API lịch sử thanh toán thực tế
      const response = await hoaDonApi.getLichSuThanhToan(id);
      const historyData = response.data;

      // Chuyển đổi dữ liệu để hiển thị
      const history = historyData.map((item, index) => ({
        id: item.id || index,
        action: item.ghiChu?.includes("[HOÀN TIỀN]")
          ? "Hoàn tiền"
          : item.trangThai
          ? "Thanh toán thành công"
          : "Thanh toán chờ xử lý",
        employeeName: "Hệ thống", // Có thể thêm logic lấy nhân viên nếu có
        timestamp: item.ngayThanhToan,
        amount: item.soTien,
        paymentMethod:
          item.phuongThucThanhToan?.tenPhuongThucThanhToan ||
          item.phuongThucThanhToan?.ten ||
          "Không xác định",
        note: item.ghiChu,
        maGiaoDich: item.maGiaoDich,
        status: item.trangThai ? "Đã thanh toán" : "Chưa thanh toán",
        isRefund: item.ghiChu?.includes("[HOÀN TIỀN]"),
      }));

      // Sắp xếp theo ngày giảm dần
      history.sort(
        (a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0)
      );

      setPaymentHistory(history);
    } catch (err) {
      console.error("❌ Lỗi tải lịch sử thanh toán:", err);
      setError("Không thể tải lịch sử thanh toán");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return "0 ₫";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "Chưa xác định";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="bg-white flex flex-col rounded-lg shadow overflow-hidden my-5">
        <div className="flex justify-between items-center py-3 px-6 bg-gray-200">
          <div className="text-sm font-semibold flex gap-2 items-center">
            <ClockCountdownIcon size={20} />
            Lịch sử thanh toán
          </div>
        </div>
        <div className="px-3 py-6 text-center">
          <div className="text-gray-500">Đang tải...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white flex flex-col rounded-lg shadow overflow-hidden my-5">
        <div className="flex justify-between items-center py-3 px-6 bg-gray-200">
          <div className="text-sm font-semibold flex gap-2 items-center">
            <ClockCountdownIcon size={20} />
            Lịch sử thanh toán
          </div>
        </div>
        <div className="px-3 py-6 text-center">
          <div className="text-red-500">{error}</div>
          <button
            onClick={fetchPaymentHistory}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white flex flex-col rounded-lg shadow overflow-hidden my-5">
      <div className="flex justify-between items-center py-3 px-6 bg-gray-200">
        <div className="text-sm font-semibold flex gap-2 items-center">
          <ClockCountdownIcon size={20} />
          Lịch sử thanh toán
        </div>
        <div className="text-xs text-gray-600">
          {paymentHistory.length} giao dịch
        </div>
      </div>

      <div className="px-3 py-3">
        {paymentHistory.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            Không có lịch sử thanh toán
          </div>
        ) : (
          <div className="space-y-4">
            {paymentHistory.map((item, index) => (
              <div
                key={item.id}
                className={`border-l-4 rounded-lg px-3 py-2 flex flex-col gap-2 ${
                  item.isRefund
                    ? "border-red-500 bg-red-50"
                    : item.status === "Đã thanh toán"
                    ? "border-green-500 bg-green-50"
                    : "border-yellow-500 bg-yellow-50"
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-semibold text-sm">{item.action}</div>
                    {item.note && (
                      <div className="text-xs text-gray-600 mt-1">
                        {item.note}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-sm">
                      {formatCurrency(item.amount)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatDateTime(item.timestamp)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-600">Phương thức:</span>
                    <span className="font-semibold ml-1">
                      {item.paymentMethod}
                    </span>
                  </div>
                  <div className="text-right">
                    <span
                      className={`px-2 py-1 rounded ${
                        item.status === "Đã thanh toán"
                          ? "bg-green-100 text-green-800"
                          : item.isRefund
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                </div>

                {item.maGiaoDich && (
                  <div className="text-xs font-mono bg-gray-100 p-1 rounded">
                    Mã GD: {item.maGiaoDich}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
