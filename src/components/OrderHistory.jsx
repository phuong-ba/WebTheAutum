import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  Package, 
  Calendar, 
  CreditCard, 
  ClockCounterClockwise,
  ShoppingBag,
  ArrowRight,
  CheckCircle,
  Clock,
  XCircle,
  Truck,
  Tag  // ⭐ Thêm icon Tag
} from '@phosphor-icons/react';

const formatCurrency = (amount) => {
  if (!amount || isNaN(amount)) return "0₫";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
};

const getOrderStatusConfig = (status) => {
  const statusConfig = {
    0: { 
      text: 'Chờ xác nhận', 
      color: 'bg-amber-100 text-amber-700 border-amber-200',
      icon: Clock,
      iconColor: 'text-amber-500'
    },
    1: { 
      text: 'Chờ giao hàng', 
      color: 'bg-blue-100 text-blue-700 border-blue-200',
      icon: Package,
      iconColor: 'text-blue-500'
    },
    2: { 
      text: 'Đang vận chuyển', 
      color: 'bg-purple-100 text-purple-700 border-purple-200',
      icon: Truck,
      iconColor: 'text-purple-500'
    },
    3: { 
      text: 'Đã hoàn thành', 
      color: 'bg-green-100 text-green-700 border-green-200',
      icon: CheckCircle,
      iconColor: 'text-green-500'
    },
    4: { 
      text: 'Đã hủy', 
      color: 'bg-red-100 text-red-700 border-red-200',
      icon: XCircle,
      iconColor: 'text-red-500'
    }
  };
  return statusConfig[status] || { 
    text: 'Không xác định', 
    color: 'bg-gray-100 text-gray-700 border-gray-200',
    icon: Clock,
    iconColor: 'text-gray-500'
  };
};

const safeDate = (dateString) => {
  if (!dateString) return "Không xác định";
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return "Không xác định";
  return d.toLocaleDateString("vi-VN", {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      const loggedInUser = JSON.parse(localStorage.getItem("currentUser"));

      try {
        let data = [];

        if (loggedInUser && loggedInUser.id) {
          console.log('👤 Lấy đơn hàng theo ID khách hàng:', loggedInUser.id);
          
          const response = await fetch(`http://localhost:8080/api/orders/customer/${loggedInUser.id}`);

          if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
              toast.error("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
              localStorage.removeItem("currentUser");
            } else {
              throw new Error("Không thể tải lịch sử đơn hàng.");
            }
          } else {
            const responseData = await response.json();
            data = responseData.data || [];
            console.log(`✅ Tìm thấy ${data.length} đơn hàng của khách đã đăng nhập`);
          }

        } else {
          const guestOrderCodes = JSON.parse(localStorage.getItem("guestOrderCodes") || "[]")
            .filter(code => code && code.trim() !== "");

          console.log('📋 Mã đơn hàng trong localStorage:', guestOrderCodes);

          if (guestOrderCodes.length === 0) {
            console.log('⚠️ Không có đơn hàng nào');
            setOrders([]);
            setLoading(false);
            return;
          }

          const response = await fetch(`http://localhost:8080/api/orders/by-codes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(guestOrderCodes)
          });

          if (!response.ok) {
            throw new Error("Không thể tải đơn hàng.");
          }

          const responseData = await response.json();
          data = responseData.data || [];
          console.log(`✅ Tìm thấy ${data.length} đơn hàng vãng lai`);
        }

        console.log('📦 Dữ liệu từ backend:', data);

        const filteredData = data.filter(order => order && order.maHoaDon);
        filteredData.sort((a, b) => new Date(b.ngayTao || 0) - new Date(a.ngayTao || 0));

        setOrders(filteredData);

      } catch (error) {
        console.error('❌ Lỗi:', error);
        toast.error(error.message);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50/30 via-white to-orange-50/30 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-orange-200 border-t-orange-500 mb-4"></div>
          <p className="text-gray-600 font-medium">Đang tải đơn hàng của bạn...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50/30 via-white to-orange-50/30 py-8">
      <div className="container mx-auto max-w-5xl px-4">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
              <ClockCounterClockwise size={24} weight="bold" className="text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800">Lịch sử đơn hàng</h1>
          </div>
          <p className="text-gray-600 ml-13">Quản lý và theo dõi tất cả đơn hàng của bạn</p>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-12 text-center">
            <div className="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingBag size={48} weight="duotone" className="text-orange-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">Chưa có đơn hàng nào</h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Bạn chưa có đơn hàng nào. Hãy khám phá các sản phẩm tuyệt vời của chúng tôi!
            </p>
            <Link 
              to="/" 
              className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition-colors shadow-sm"
            >
              <ShoppingBag size={20} weight="bold" />
              Bắt đầu mua sắm
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const statusConfig = getOrderStatusConfig(order.trangThai);
              const StatusIcon = statusConfig.icon;
              
              // ⭐ LOGIC HIỂN THỊ VOUCHER
              const hasVoucher = order.idPhieuGiamGia || order.phieuGiamGiaId;
              const tienDaGiam = hasVoucher && order.tongTien && order.tongTienSauGiam
                ? order.tongTien - order.tongTienSauGiam
                : 0;
              
              return (
                <div 
                  key={order.id} 
                  className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-orange-200 transition-all duration-300"
                >
                  <div className="p-6">
                    {/* Header của order card */}
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4 pb-4 border-b border-gray-100">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Package size={24} weight="duotone" className="text-orange-500" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm text-gray-500 font-medium">Mã đơn hàng:</span>
                            <span className="text-base font-bold text-orange-600">{order.maHoaDon}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-sm text-gray-500">
                            <Calendar size={14} weight="bold" />
                            <span>{safeDate(order.ngayTao)}</span>
                          </div>
                        </div>
                      </div>
                      
                      <Link
                        to={`/orders/${order.maHoaDon}`}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-orange-50 text-orange-600 rounded-lg font-medium hover:bg-orange-100 transition-colors text-sm"
                      >
                        Xem chi tiết
                        <ArrowRight size={16} weight="bold" />
                      </Link>
                    </div>

                    {/* ⭐ VOUCHER TAG - Chỉ hiển thị khi có voucher */}
                    {hasVoucher && order.tenVoucher && tienDaGiam > 0 && (
                      <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Tag size={16} weight="fill" className="text-green-600" />
                          <span className="text-sm font-medium text-green-800">
                            {order.tenVoucher}
                          </span>
                          <span className="ml-auto text-sm text-green-600 font-semibold">
                            -{formatCurrency(tienDaGiam)}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Body của order card */}
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      {/* Tổng tiền */}
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
                          <CreditCard size={20} weight="duotone" className="text-orange-500" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-0.5">Tổng tiền</p>
                          
                          {/* ⭐ Hiển thị giá gạch khi có voucher */}
                          {hasVoucher && tienDaGiam > 0 && (
                            <p className="text-sm text-gray-400 line-through">
                              {formatCurrency(order.tongTien)}
                            </p>
                          )}
                          
                          {/* ⭐ Giá chính - dùng tongTienHienThi */}
                          <p className="text-xl font-bold text-gray-800">
                            {formatCurrency(order.tongTienHienThi || order.tongTienSauGiam || order.tongTien)}
                          </p>
                        </div>
                      </div>

                      {/* Trạng thái */}
                      <div className="flex items-center gap-2">
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${statusConfig.color}`}>
                          <StatusIcon size={18} weight="bold" className={statusConfig.iconColor} />
                          <span className="font-semibold text-sm">{statusConfig.text}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  {order.trangThai === 0 && (
                    <div className="px-6 py-3 bg-amber-50 border-t border-amber-100">
                      <p className="text-xs text-amber-700 flex items-center gap-2">
                        <Clock size={14} weight="bold" />
                        Đơn hàng đang chờ xác nhận. Chúng tôi sẽ liên hệ với bạn trong 24h.
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Summary statistics */}
        {orders.length > 0 && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
              <p className="text-2xl font-bold text-orange-600">{orders.length}</p>
              <p className="text-sm text-gray-600 mt-1">Tổng đơn hàng</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
              <p className="text-2xl font-bold text-green-600">
                {orders.filter(o => o.trangThai === 3).length}
              </p>
              <p className="text-sm text-gray-600 mt-1">Đã hoàn thành</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
              <p className="text-2xl font-bold text-amber-600">
                {orders.filter(o => o.trangThai === 0 || o.trangThai === 1 || o.trangThai === 2).length}
              </p>
              <p className="text-sm text-gray-600 mt-1">Đang xử lý</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}