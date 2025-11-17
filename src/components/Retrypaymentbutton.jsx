import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { CreditCard, ArrowClockwise, Warning } from "@phosphor-icons/react";

/**
 * Component nút thanh toán lại
 * Sử dụng trong trang chi tiết đơn hàng
 * 
 * Props:
 * - maHoaDon: Mã đơn hàng cần thanh toán
 * - onPaymentInitiated: Callback khi bắt đầu thanh toán
 */
export default function RetryPaymentButton({ maHoaDon, onPaymentInitiated }) {
  const [canRetry, setCanRetry] = useState(false);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const [orderInfo, setOrderInfo] = useState(null);

  useEffect(() => {
    if (maHoaDon) {
      checkRetryStatus();
    }
  }, [maHoaDon]);

  const checkRetryStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost:8080/api/payment/check-retry/${maHoaDon}`
      );
      
      if (!response.ok) {
        throw new Error("Không thể kiểm tra trạng thái thanh toán");
      }

      const result = await response.json();
      
      setCanRetry(result.canRetry);
      if (result.canRetry && result.hoaDon) {
        setOrderInfo(result.hoaDon);
      }
      
      console.log("✅ Retry status:", result);
    } catch (error) {
      console.error("❌ Error checking retry status:", error);
      setCanRetry(false);
    } finally {
      setLoading(false);
    }
  };

  const handleRetryPayment = async () => {
    try {
      setRetrying(true);
      
      if (onPaymentInitiated) {
        onPaymentInitiated();
      }

      const response = await fetch(
        `http://localhost:8080/api/payment/retry/${maHoaDon}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          }
        }
      );

      if (!response.ok) {
        throw new Error("Không thể tạo link thanh toán");
      }

      const result = await response.json();

      if (result.success && result.paymentUrl) {
        toast.success("Đang chuyển đến trang thanh toán...");
        
        // Lưu mã đơn hàng để tracking
        const guestOrders = JSON.parse(localStorage.getItem("guestOrderCodes") || "[]");
        if (!guestOrders.includes(maHoaDon)) {
          guestOrders.push(maHoaDon);
          localStorage.setItem("guestOrderCodes", JSON.stringify(guestOrders));
        }
        
        // Delay nhỏ để user thấy thông báo
        setTimeout(() => {
          window.location.href = result.paymentUrl;
        }, 500);
      } else {
        toast.error(result.message || "Không thể tạo link thanh toán");
        setRetrying(false);
      }
    } catch (error) {
      console.error("❌ Error retrying payment:", error);
      toast.error("Lỗi khi thanh toán. Vui lòng thử lại sau.");
      setRetrying(false);
    }
  };

  // Đang load
  if (loading) {
    return (
      <div className="animate-pulse bg-gray-100 rounded-lg p-4">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    );
  }

  // Không thể thanh toán lại
  if (!canRetry) {
    return null;
  }

  // Có thể thanh toán lại
  return (
    <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border-2 border-orange-200 rounded-xl p-5 shadow-sm">
      <div className="flex items-start gap-3 mb-4">
        <div className="flex-shrink-0 w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
          <Warning size={24} weight="fill" className="text-orange-600" />
        </div>
        <div className="flex-grow">
          <h3 className="font-bold text-gray-800 mb-1">
            Đơn hàng chưa thanh toán
          </h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            Bạn chưa hoàn tất thanh toán cho đơn hàng này. 
            Vui lòng thanh toán để đơn hàng được xử lý.
          </p>
        </div>
      </div>

      {orderInfo && (
        <div className="bg-white rounded-lg p-4 mb-4 border border-orange-100">
          <div className="flex justify-between items-center text-sm mb-2">
            <span className="text-gray-600">Trạng thái:</span>
            <span className="font-semibold text-orange-600">
              {orderInfo.trangThai === 0 ? "Chờ thanh toán" : "Thanh toán thất bại"}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-700 font-medium">Số tiền cần thanh toán:</span>
            <span className="text-lg font-bold text-orange-600">
              {new Intl.NumberFormat("vi-VN", {
                style: "currency",
                currency: "VND",
              }).format(orderInfo.tongTienSauGiam)}
            </span>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={handleRetryPayment}
          disabled={retrying}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-bold hover:from-orange-600 hover:to-orange-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
        >
          {retrying ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
              <span>Đang xử lý...</span>
            </>
          ) : (
            <>
              <CreditCard size={22} weight="fill" />
              <span>Thanh toán ngay</span>
            </>
          )}
        </button>
        
        <button
          onClick={checkRetryStatus}
          disabled={retrying}
          className="px-4 py-3.5 border-2 border-orange-300 text-orange-700 rounded-lg font-medium hover:bg-orange-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Làm mới trạng thái"
        >
          <ArrowClockwise size={20} weight="bold" />
        </button>
      </div>

      <p className="text-xs text-gray-500 text-center mt-3">
        💡 Đơn hàng sẽ tự động hủy sau 24 giờ nếu không thanh toán
      </p>
    </div>
  );
}

/**
 * Cách sử dụng trong OrderDetail component:
 * 
 * import RetryPaymentButton from './RetryPaymentButton';
 * 
 * function OrderDetail() {
 *   const { maHoaDon } = useParams();
 *   
 *   return (
 *     <div>
 *       <h1>Chi tiết đơn hàng {maHoaDon}</h1>
 *       
 *       <RetryPaymentButton 
 *         maHoaDon={maHoaDon}
 *         onPaymentInitiated={() => {
 *           console.log("Payment initiated");
 *         }}
 *       />
 *       
 *       {/* ... Các thông tin khác của đơn hàng ... *\/}
 *     </div>
 *   );
 * }
 */