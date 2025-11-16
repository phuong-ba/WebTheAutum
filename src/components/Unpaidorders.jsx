import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { 
  CreditCard, 
  Clock, 
  ArrowClockwise,
  Warning,
  CheckCircle,
  XCircle
} from "@phosphor-icons/react";

const formatCurrency = (amount) => {
  if (typeof amount !== "number") return amount;
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
};

const getStatusText = (status) => {
  switch (status) {
    case 0: return "Chờ xử lý";
    case 5: return "Thanh toán thất bại";
    default: return "Không xác định";
  }
};

const getStatusColor = (status) => {
  switch (status) {
    case 0: return "bg-yellow-100 text-yellow-800 border-yellow-300";
    case 5: return "bg-red-100 text-red-800 border-red-300";
    default: return "bg-gray-100 text-gray-800 border-gray-300";
  }
};

export default function UnpaidOrders() {
  const [unpaidOrders, setUnpaidOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [retryingOrder, setRetryingOrder] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUnpaidOrders();
  }, []);

  const fetchUnpaidOrders = async () => {
    try {
      const currentUser = JSON.parse(localStorage.getItem("currentUser"));
      
      if (!currentUser || !currentUser.id) {
        toast.error("Vui lòng đăng nhập để xem đơn hàng");
        navigate("/login");
        return;
      }

      const response = await fetch(
        `http://localhost:8080/api/payment/unpaid-orders/${currentUser.id}`
      );
      
      if (!response.ok) {
        throw new Error("Không thể tải danh sách đơn hàng");
      }

      const result = await response.json();
      
      if (result.success) {
        setUnpaidOrders(result.data);
        console.log("✅ Loaded unpaid orders:", result.data);
      } else {
        toast.error(result.message || "Không thể tải đơn hàng");
      }
    } catch (error) {
      console.error("❌ Error loading unpaid orders:", error);
      toast.error("Lỗi khi tải danh sách đơn hàng");
    } finally {
      setLoading(false);
    }
  };

  const handleRetryPayment = async (maHoaDon) => {
    try {
      setRetryingOrder(maHoaDon);
      
      // Kiểm tra xem có thể thanh toán lại không
      const checkResponse = await fetch(
        `http://localhost:8080/api/payment/check-retry/${maHoaDon}`
      );
      
      const checkResult = await checkResponse.json();
      
      if (!checkResult.canRetry) {
        toast.error(checkResult.message || "Không thể thanh toán lại đơn hàng này");
        setRetryingOrder(null);
        return;
      }

      // Tạo payment URL mới
      const retryResponse = await fetch(
        `http://localhost:8080/api/payment/retry/${maHoaDon}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          }
        }
      );

      const retryResult = await retryResponse.json();

      if (retryResult.success && retryResult.paymentUrl) {
        toast.success("Đang chuyển đến trang thanh toán...");
        
        // Lưu mã đơn hàng để tracking
        const guestOrders = JSON.parse(localStorage.getItem("guestOrderCodes") || "[]");
        if (!guestOrders.includes(maHoaDon)) {
          guestOrders.push(maHoaDon);
          localStorage.setItem("guestOrderCodes", JSON.stringify(guestOrders));
        }
        
        // Chuyển hướng đến VNPAY
        window.location.href = retryResult.paymentUrl;
      } else {
        toast.error(retryResult.message || "Không thể tạo link thanh toán");
        setRetryingOrder(null);
      }
    } catch (error) {
      console.error("❌ Error retrying payment:", error);
      toast.error("Lỗi khi thanh toán lại");
      setRetryingOrder(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50/30 via-white to-orange-50/30 py-8">
      <div className="container mx-auto max-w-4xl px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6">
            <div className="flex items-center gap-3 text-white">
              <Clock size={28} weight="fill" />
              <div>
                <h1 className="text-2xl font-bold">Đơn hàng chưa thanh toán</h1>
                <p className="text-orange-100 text-sm mt-1">
                  Hoàn tất thanh toán để đơn hàng được xử lý
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {unpaidOrders.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle size={64} weight="duotone" className="mx-auto text-green-500 mb-4" />
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  Tất cả đơn hàng đã thanh toán!
                </h3>
                <p className="text-gray-600 mb-6">
                  Bạn không có đơn hàng nào đang chờ thanh toán
                </p>
                <button
                  onClick={() => navigate("/orders")}
                  className="px-6 py-2.5 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors"
                >
                  Xem tất cả đơn hàng
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Info banner */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
                  <Warning size={20} weight="fill" className="text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-semibold mb-1">Lưu ý quan trọng</p>
                    <p>
                      Các đơn hàng chưa thanh toán sẽ bị hủy sau 24 giờ. 
                      Vui lòng hoàn tất thanh toán để đơn hàng được xử lý.
                    </p>
                  </div>
                </div>

                {/* Orders list */}
                {unpaidOrders.map((order) => (
                  <div
                    key={order.maHoaDon}
                    className="border border-gray-200 rounded-xl p-5 hover:border-orange-300 transition-all"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-semibold text-gray-800 text-lg">
                            {order.maHoaDon}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full border font-medium ${getStatusColor(order.trangThai)}`}>
                            {getStatusText(order.trangThai)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          Ngày tạo: {new Date(order.ngayTao).toLocaleString('vi-VN')}
                        </p>
                        {order.paymentAttempts > 0 && (
                          <p className="text-xs text-gray-500 mt-1">
                            Đã thử thanh toán {order.paymentAttempts} lần
                          </p>
                        )}
                      </div>
                      
                      {order.trangThai === 5 && (
                        <div className="flex items-center gap-2 text-red-600">
                          <XCircle size={20} weight="fill" />
                          <span className="text-sm font-medium">Thanh toán thất bại</span>
                        </div>
                      )}
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">Tổng tiền:</span>
                          <span className="font-medium text-gray-800">
                            {formatCurrency(order.tongTien)}
                          </span>
                        </div>
                        {order.tongTien !== order.tongTienSauGiam && (
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600">Đã giảm:</span>
                            <span className="font-medium text-green-600">
                              -{formatCurrency(order.tongTien - order.tongTienSauGiam)}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                          <span className="font-semibold text-gray-700">Cần thanh toán:</span>
                          <span className="text-xl font-bold text-orange-600">
                            {formatCurrency(order.tongTienSauGiam)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => handleRetryPayment(order.maHoaDon)}
                        disabled={retryingOrder === order.maHoaDon}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                      >
                        {retryingOrder === order.maHoaDon ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                            <span>Đang xử lý...</span>
                          </>
                        ) : (
                          <>
                            <CreditCard size={20} weight="fill" />
                            <span>Thanh toán ngay</span>
                          </>
                        )}
                      </button>
                      
                      <button
                        onClick={() => navigate(`/order-detail/${order.maHoaDon}`)}
                        className="px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:border-orange-400 hover:text-orange-600 transition-colors"
                      >
                        Chi tiết
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Help section */}
        {unpaidOrders.length > 0 && (
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
            <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <ArrowClockwise size={18} weight="bold" />
              Cần hỗ trợ?
            </h3>
            <p className="text-sm text-blue-800 mb-2">
              Nếu gặp vấn đề khi thanh toán, vui lòng liên hệ:
            </p>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>📞 Hotline: 1900-xxxx</li>
              <li>✉️ Email: support@shop.com</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}