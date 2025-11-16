import { ClockCountdownIcon } from "@phosphor-icons/react";
import React, { useState, useEffect } from "react";
import hoaDonApi from "../../api/HoaDonAPI";
import { useParams, useLocation } from "react-router-dom";

export default function BillInvoiceHistory() {
  const { id } = useParams();
  const location = useLocation();
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (id) {
      fetchPaymentHistory();
    }
  }, [id]);

  useEffect(() => {
    if (location.state?.refreshData) {
      console.log("🔄 Refreshing payment history...");
      fetchPaymentHistory();
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [location.state?.refreshData]);



  const fetchPaymentHistory = async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);

      const response = await hoaDonApi.getDetail(id);
      console.log("📦 Payment history data:", response.data);

      const invoiceData = response.data;
      const history = [];


      const getStatusLabel = (trangThai) => {
        const statusMap = {
          0: "Chờ xác nhận",
          1: "Chờ giao hàng",
          2: "Đang giao hàng",
          3: "Đã hoàn thành",
          4: "Đã hủy"
        };
        return statusMap[trangThai] || "Không xác định";
      };

      if (invoiceData.ngayThanhToan && invoiceData.soTien) {
        history.push({
          id: invoiceData.id,
          action: "Thanh toán hóa đơn",
          maNhanVien: invoiceData.maNhanVien || "Hệ thống",
          employeeName: invoiceData.tenNhanVien || "Hệ thống",
          timestamp: invoiceData.ngayThanhToan,
          amount: invoiceData.soTien,
          paymentMethod: invoiceData.hinhThucThanhToan,
          note: invoiceData.ghiChuThanhToan || invoiceData.ghiChu,
          maGiaoDich: invoiceData.maGiaoDich,
          status: getStatusLabel(invoiceData.trangThai),
        });
      }

      history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      setPaymentHistory(history);
    } catch (err) {
      console.error("❌ Lỗi tải lịch sử thanh toán:", err);
      setError("Không thể tải lịch sử thanh toán");
    } finally {
      setLoading(false);
    }
  };


  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
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
                className="border-l-2 rounded-lg border-amber-600 px-3 flex flex-col gap-2"
              >
                <div className="font-semibold text-sm">{item.action}</div>

                {item.maGiaoDich && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-sm">Mã giao dịch:</span>
                    <span className="font-mono text-sm">{item.maGiaoDich}</span>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm">Nhân viên:</span>
                  <span className="font-mono text-sm">{item.employeeName}</span>
                </div>

                {item.paymentMethod && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-sm">Phương thức:</span>
                    <span className="font-semibold text-sm">
                      {item.paymentMethod}
                    </span>
                  </div>
                )}

                {item.amount && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-sm">Số tiền:</span>
                    <span className="font-bold text-sm text-green-600">
                      {formatCurrency(item.amount)}
                    </span>
                  </div>
                )}

                {item.status && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-sm">Trạng thái:</span>
                    <span className="font-semibold text-sm">{item.status}</span>
                  </div>
                )}

                {item.timestamp && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-sm">
                      Ngày thanh toán:
                    </span>
                    <span className="font-mono text-sm">
                      {formatDate(item.timestamp)}
                    </span>
                  </div>
                )}

                {item.note && (
                  <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                    📝 {item.note}
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
