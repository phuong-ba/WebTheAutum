import { ClockCountdownIcon, CurrencyCircleDollarIcon } from "@phosphor-icons/react";
import React, { useState, useEffect } from "react";
import hoaDonApi from "../../api/HoaDonAPI";
import { useParams } from "react-router-dom";

export default function BillInvoiceHistory({ paymentData }) {
  const { id } = useParams();
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Sử dụng dữ liệu từ props hoặc fetch từ API
  const displaySummary = {
    // Số tiền đã thanh toán từ props hoặc từ API
    soTienThanhToan: paymentData?.soTienThanhToan || 0,
    
    // Số tiền cần thanh toán từ props hoặc từ API
    soTienCanThanhToan: paymentData?.soTienCanThanhToan || 0,
    
    // Tổng tiền sau giảm giá từ props hoặc từ API
    tongTienSauGiam: paymentData?.tongTienSauGiam || 0,
    
    // Tính toán số tiền còn lại
    soTienConLai: Math.max(
      0, 
      (paymentData?.tongTienSauGiam || 0) - (paymentData?.soTienThanhToan || 0)
    )
  };

  useEffect(() => {
    if (id) {
      fetchPaymentHistory();
      // Nếu không có paymentData từ props, fetch từ API
      if (!paymentData) {
        fetchPaymentSummary();
      }
    }
  }, [id, paymentData]);

  // Lấy thông tin tổng quan thanh toán từ API (nếu không có từ props)
  const fetchPaymentSummary = async () => {
    if (!id || paymentData) return;

    try {
      const response = await hoaDonApi.getHoaDonDetail(id);
      if (response) {
        // Cập nhật state nếu cần
      }
    } catch (err) {
      console.error("❌ Lỗi tải thông tin thanh toán:", err);
    }
  };

  // Lấy lịch sử thanh toán
  const fetchPaymentHistory = async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);

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
        employeeName: "Hệ thống",
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
    if (amount === null || amount === undefined) return "0 ₫";
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

  // Tính phần trăm đã thanh toán
  const calculatePaymentPercentage = () => {
    if (displaySummary.tongTienSauGiam <= 0) return 0;
    return (displaySummary.soTienThanhToan / displaySummary.tongTienSauGiam) * 100;
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

  return (
    <div className="bg-white flex flex-col rounded-lg shadow overflow-hidden my-5">
      {/* Header */}
      <div className="flex justify-between items-center py-3 px-6 bg-gray-200">
        <div className="text-sm font-semibold flex gap-2 items-center">
          <ClockCountdownIcon size={20} />
          Lịch sử thanh toán
        </div>
        <div className="text-xs text-gray-600">
          {paymentHistory.length} giao dịch
        </div>
      </div>

      {/* Phần thông tin thanh toán tổng quan */}
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2 mb-3">
          <CurrencyCircleDollarIcon size={18} className="text-gray-600" />
          <div className="text-sm font-semibold text-gray-700">Tổng quan thanh toán</div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Tổng tiền phải thanh toán */}
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
            <div className="text-xs text-gray-600 mb-1">Tổng tiền</div>
            <div className="text-lg font-bold text-blue-600">
              {formatCurrency(displaySummary.tongTienSauGiam)}
            </div>
            <div className="text-xs text-gray-500 mt-1">Sau giảm giá</div>
          </div>
          
          {/* Đã thanh toán */}
          <div className="bg-green-50 p-3 rounded-lg border border-green-100">
            <div className="text-xs text-gray-600 mb-1">Đã thanh toán</div>
            <div className="text-lg font-bold text-green-600">
              {formatCurrency(displaySummary.soTienThanhToan)}
            </div>
            <div className="mt-1">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 transition-all duration-500"
                  style={{ 
                    width: `${calculatePaymentPercentage()}%` 
                  }}
                ></div>
              </div>
              <div className="text-xs text-gray-500 mt-1 text-right">
                {calculatePaymentPercentage().toFixed(1)}%
              </div>
            </div>
          </div>
          
          {/* Cần thanh toán thêm */}
          <div className={`p-3 rounded-lg border ${
            displaySummary.soTienCanThanhToan > 0 
              ? "bg-amber-50 border-amber-100" 
              : "bg-gray-50 border-gray-100"
          }`}>
            <div className="text-xs text-gray-600 mb-1">
              {displaySummary.soTienCanThanhToan > 0 
                ? "Cần thanh toán thêm" 
                : "Đã thanh toán đủ"
              }
            </div>
            <div className={`text-lg font-bold ${
              displaySummary.soTienCanThanhToan > 0 
                ? "text-amber-600" 
                : "text-gray-600"
            }`}>
              {formatCurrency(displaySummary.soTienCanThanhToan)}
            </div>
            
            {/* Hiển thị thông báo */}
            {displaySummary.soTienCanThanhToan > 0 ? (
              <div className="text-xs text-amber-500 mt-1">
                Còn thiếu {formatCurrency(displaySummary.soTienCanThanhToan)}
              </div>
            ) : (
              <div className="text-xs text-green-500 mt-1">
                Đã thanh toán đủ
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Phần lịch sử chi tiết */}
      <div className="px-3 py-3">
        {error ? (
          <div className="text-center py-4">
            <div className="text-red-500">{error}</div>
            <button
              onClick={fetchPaymentHistory}
              className="mt-2 px-4 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
            >
              Thử lại
            </button>
          </div>
        ) : paymentHistory.length === 0 ? (
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
                    <div className={`font-bold text-sm ${
                      item.isRefund ? "text-red-600" : "text-green-600"
                    }`}>
                      {item.isRefund ? "-" : ""}  {formatCurrency(displaySummary.soTienThanhToan)}
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