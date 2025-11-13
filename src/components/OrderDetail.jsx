import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  Package, 
  ArrowLeft, 
  ShoppingCart,
  Truck,
  MapPin,
  Phone,
  User,
  CreditCard,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  Tag  // ⭐ Thêm icon Tag
} from '@phosphor-icons/react';

const formatCurrency = (amount) => {
  const numericAmount = Number(amount) || 0;
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(numericAmount);
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
  return d.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export default function OrderDetail() {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const { maHoaDon } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (!maHoaDon) {
      toast.error("Không tìm thấy mã hóa đơn.");
      setLoading(false);
      return;
    }

    const fetchOrderDetail = async () => {
      setLoading(true);
      try {
        console.log('🔍 Đang tải chi tiết đơn hàng:', maHoaDon);
        
        const response = await fetch(`http://localhost:8080/api/orders/${maHoaDon}`);
        
        if (!response.ok) {
          throw new Error("Không thể tải chi tiết đơn hàng.");
        }
        
        const result = await response.json();
        const orderData = result.data || result;
        
        console.log('✅ Chi tiết đơn hàng:', orderData);
        console.log('📦 Số sản phẩm:', orderData.hoaDonChiTiets?.length || 0);
        console.log('🎫 Voucher:', orderData.tenVoucher);
        console.log('💰 Tổng tiền:', orderData.tongTien);
        console.log('💵 Sau giảm:', orderData.tongTienSauGiam);
        
        setOrder(orderData);

      } catch (error) {
        console.error('❌ Lỗi:', error);
        toast.error(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetail();
  }, [maHoaDon]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50/30 via-white to-orange-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-200 border-t-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Đang tải chi tiết đơn hàng...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50/30 via-white to-orange-50/30 flex items-center justify-center p-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center max-w-md">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Package size={40} className="text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Không tìm thấy đơn hàng</h2>
          <p className="text-gray-600 mb-6">Vui lòng kiểm tra lại mã đơn hàng</p>
          <button 
            onClick={() => navigate('/orders')}
            className="px-6 py-3 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition-colors"
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  const statusConfig = getOrderStatusConfig(order.trangThai);
  const StatusIcon = statusConfig.icon;
  
  // ⭐ LOGIC VOUCHER
  const hasVoucher = order.idPhieuGiamGia || order.phieuGiamGiaId;
  const tienDaGiam = hasVoucher && order.tongTien && order.tongTienSauGiam
    ? order.tongTien - order.tongTienSauGiam
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50/30 via-white to-orange-50/30 py-8">
      <div className="container mx-auto max-w-6xl px-4">
        
        {/* Back button */}
        <button 
          onClick={() => navigate('/orders')}
          className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 font-medium mb-6 transition-colors"
        >
          <ArrowLeft size={20} weight="bold" />
          Quay lại lịch sử đơn hàng
        </button>
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                Đơn hàng <span className="text-orange-600">#{order.maHoaDon}</span>
              </h1>
              <div className="flex items-center gap-2 text-gray-600 mt-2">
                <Calendar size={16} weight="bold" />
                <span className="text-sm">Đặt lúc: {safeDate(order.ngayTao)}</span>
              </div>
            </div>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${statusConfig.color}`}>
              <StatusIcon size={20} weight="bold" className={statusConfig.iconColor} />
              <span className="font-semibold">{statusConfig.text}</span>
            </div>
          </div>
          
          {/* ⭐ VOUCHER BANNER - Hiển thị khi có voucher */}
          {hasVoucher && order.tenVoucher && tienDaGiam > 0 && (
            <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Tag size={20} weight="fill" className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Đã áp dụng mã giảm giá</p>
                    <p className="font-bold text-green-800">{order.tenVoucher}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Tiết kiệm</p>
                  <p className="text-xl font-bold text-green-600">
                    -{formatCurrency(tienDaGiam)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* CỘT TRÁI: CHI TIẾT */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Danh sách sản phẩm */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-800">
                <Package size={20} weight="duotone" className="text-orange-500" />
                Sản phẩm đã đặt ({order.hoaDonChiTiets?.length || 0})
              </h3>
              
              <div className="divide-y divide-gray-100">
                {order.hoaDonChiTiets && order.hoaDonChiTiets.length > 0 ? (
                  order.hoaDonChiTiets.map((item) => (
                    <div key={item.id} className="flex gap-4 items-start py-4 first:pt-0 last:pb-0">
                      {/* Hình ảnh */}
                      <img 
                        src={item.chiTietSanPham?.anhs?.[0] || 'https://via.placeholder.com/150'} 
                        alt={item.chiTietSanPham?.tenSanPham} 
                        className="w-20 h-24 object-cover rounded-lg flex-shrink-0"
                      />
                      
                      {/* Thông tin */}
                      <div className="flex-grow">
                        <p className="font-semibold text-gray-800 mb-1">
                          {item.chiTietSanPham?.tenSanPham || 'Sản phẩm không xác định'}
                        </p>
                        <div className="flex gap-3 text-sm text-gray-500 mb-2">
                          <span>Màu: {item.chiTietSanPham?.tenMauSac || 'N/A'}</span>
                          <span>•</span>
                          <span>Size: {item.chiTietSanPham?.tenKichThuoc || 'N/A'}</span>
                        </div>
                        <p className="text-sm text-gray-600">Số lượng: {item.soLuong || 0}</p>
                      </div>
                      
                      {/* Giá */}
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-orange-600">{formatCurrency(item.giaBan)}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Tổng: {formatCurrency(item.thanhTien)}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-8">Không có sản phẩm nào</p>
                )}
              </div>
            </div>

            {/* Thông tin giao hàng */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-800">
                <MapPin size={20} weight="duotone" className="text-orange-500" />
                Thông tin giao hàng
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <User size={18} className="text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Người nhận</p>
                    <p className="font-medium text-gray-800">{order.khachHang?.hoTen || 'Khách vãng lai'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone size={18} className="text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Số điện thoại</p>
                    <p className="font-medium text-gray-800">{order.khachHang?.sdt || 'Chưa cập nhật'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin size={18} className="text-gray-400 flex-shrink-0 mt-1" />
                  <div>
                    <p className="text-xs text-gray-500">Địa chỉ giao hàng</p>
                    <p className="font-medium text-gray-800">{order.diaChiKhachHang || 'Chưa cập nhật'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CỘT PHẢI: TÓM TẮT */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-24">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">Tóm tắt đơn hàng</h3>
              
              <div className="space-y-3 pb-4 border-b border-gray-200">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tạm tính</span>
                  <span className="font-medium text-gray-800">{formatCurrency(order.tongTien)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Phí vận chuyển</span>
                  <span className="font-medium text-gray-800">{formatCurrency(order.phiVanChuyen || 0)}</span>
                </div>
                
                {/* ⭐ Hiển thị giảm giá khi có voucher */}
                {hasVoucher && tienDaGiam > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Giảm giá</span>
                    <span className="font-medium text-green-600">-{formatCurrency(tienDaGiam)}</span>
                  </div>
                )}
              </div>

              <div className="py-4 border-b border-gray-200">
                <div className="flex justify-between items-baseline">
                  <span className="font-semibold text-gray-800">Tổng cộng</span>
                  <span className="text-2xl font-bold text-orange-600">
                    {formatCurrency(order.tongTienHienThi || order.tongTienSauGiam || order.tongTien)}
                  </span>
                </div>
              </div>

              <div className="pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard size={18} weight="duotone" className="text-orange-500" />
                  <p className="text-sm font-medium text-gray-700">Phương thức thanh toán</p>
                </div>
                <p className="text-sm text-gray-600 pl-6">
                  {order.loaiHoaDon === false ? 'Thanh toán khi nhận hàng (COD)' : 'Chuyển khoản'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}