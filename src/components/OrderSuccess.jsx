import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Package, ShoppingBag, ClipboardText } from '@phosphor-icons/react';

export default function OrderSuccess() {
  const { maHoaDon: maHoaDonFromPath } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [customerName, setCustomerName] = useState('bạn');
  const [finalMaHoaDon, setFinalMaHoaDon] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const name = sessionStorage.getItem('checkoutCustomerName');
    setCustomerName(name || 'bạn');

    let maHoaDon = maHoaDonFromPath || searchParams.get('vnp_OrderInfo') || '';
    
    if (maHoaDon) {
      setFinalMaHoaDon(maHoaDon);
      
      const guestOrders = JSON.parse(localStorage.getItem('guestOrderCodes') || '[]');
      if (!guestOrders.includes(maHoaDon)) {
        guestOrders.push(maHoaDon);
        localStorage.setItem('guestOrderCodes', JSON.stringify(guestOrders));
        console.log('✅ Đã lưu mã đơn hàng vào localStorage:', maHoaDon);
      }
    }

    sessionStorage.removeItem('checkoutCustomerName');
    localStorage.removeItem('cart');
    setLoading(false);
  }, [maHoaDonFromPath, searchParams]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-orange-50/30 via-white to-orange-50/30">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-200 border-t-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Đang xử lý...</p>
        </div>
      </div>
    );
  }

  if (!finalMaHoaDon) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-red-50/50 via-white to-red-50/50 p-6">
        <div className="bg-white shadow-lg rounded-2xl p-10 max-w-lg w-full text-center border border-red-100">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle size={48} weight="duotone" className="text-red-500"/>
          </div>
          
          <h2 className="text-3xl font-bold text-gray-800 mb-3">Không tìm thấy đơn hàng</h2>
          <p className="text-gray-600 mb-8">
            Rất tiếc, chúng tôi không thể tìm thấy thông tin đơn hàng của bạn. Vui lòng thử lại.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button 
              onClick={() => navigate('/')} 
              className="px-6 py-3 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition-colors"
            >
              Về trang chủ
            </button>
            <button 
              onClick={() => navigate('/orders')} 
              className="px-6 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Xem đơn hàng
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-orange-50/30 via-white to-orange-50/30 p-6">
      <div className="bg-white shadow-xl rounded-2xl p-10 max-w-2xl w-full border border-orange-100">
        
        {/* Icon thành công */}
        <div className="relative mb-8">
          <div className="w-24 h-24 bg-gradient-to-br from-orange-100 to-orange-50 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle size={56} weight="duotone" className="text-orange-500"/>
          </div>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-orange-100/30 rounded-full -z-10 animate-ping"></div>
        </div>
        
        {/* Tiêu đề */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-3">
            Đặt hàng thành công!
          </h1>
          <p className="text-gray-600 text-lg">
            Cảm ơn <span className="font-semibold text-orange-600">{customerName}</span> đã tin tưởng và mua sắm tại cửa hàng
          </p>
        </div>
        
        {/* Thông tin đơn hàng */}
        <div className="bg-gradient-to-br from-orange-50 to-orange-50/50 rounded-xl p-6 mb-8 border border-orange-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
              <Package size={20} weight="duotone" className="text-orange-500"/>
            </div>
            <h3 className="text-lg font-semibold text-gray-800">Thông tin đơn hàng</h3>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-orange-100">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 font-medium">Mã đơn hàng:</span>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-orange-600">{finalMaHoaDon}</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(finalMaHoaDon);
                    // Có thể thêm toast thông báo đã copy
                  }}
                  className="p-1.5 hover:bg-orange-50 rounded transition-colors"
                  title="Sao chép mã"
                >
                  <ClipboardText size={18} className="text-orange-500"/>
                </button>
              </div>
            </div>
          </div>
          
          <p className="text-sm text-gray-600 mt-4 leading-relaxed">
            Đơn hàng của bạn đang được xử lý. Chúng tôi sẽ liên hệ với bạn sớm nhất để xác nhận và giao hàng.
          </p>
        </div>
        
        {/* Timeline */}
        <div className="mb-8 px-2">
          <h3 className="text-base font-semibold text-gray-800 mb-4">Các bước tiếp theo</h3>
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-sm font-bold">1</span>
                </div>
                <div className="w-0.5 h-full bg-orange-200 mt-2"></div>
              </div>
              <div className="pb-4">
                <p className="font-medium text-gray-800">Xác nhận đơn hàng</p>
                <p className="text-sm text-gray-500 mt-1">Chúng tôi sẽ gọi điện xác nhận trong vòng 24h</p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                  <span className="text-gray-500 text-sm font-bold">2</span>
                </div>
                <div className="w-0.5 h-full bg-gray-200 mt-2"></div>
              </div>
              <div className="pb-4">
                <p className="font-medium text-gray-600">Chuẩn bị hàng</p>
                <p className="text-sm text-gray-500 mt-1">Đóng gói và chuẩn bị giao hàng</p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                  <span className="text-gray-500 text-sm font-bold">3</span>
                </div>
              </div>
              <div>
                <p className="font-medium text-gray-600">Giao hàng</p>
                <p className="text-sm text-gray-500 mt-1">Nhận hàng tại địa chỉ của bạn</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button 
            onClick={() => navigate('/')} 
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition-colors shadow-sm"
          >
            <ShoppingBag size={20} weight="bold"/>
            Tiếp tục mua sắm
          </button>
          <button 
            onClick={() => navigate('/orders')} 
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-white border-2 border-orange-200 text-orange-600 rounded-lg font-semibold hover:bg-orange-50 transition-colors"
          >
            <Package size={20} weight="bold"/>
            Theo dõi đơn hàng
          </button>
        </div>
        
        {/* Footer note */}
        <div className="mt-6 p-4 bg-orange-50 border border-orange-100 rounded-lg">
          <p className="text-sm text-gray-600 text-center leading-relaxed">
            💡 <strong>Lưu ý:</strong> Vui lòng giữ mã đơn hàng để tra cứu và hỗ trợ
          </p>
        </div>
      </div>
    </div>
  );
}
