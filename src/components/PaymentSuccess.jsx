import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle } from '@phosphor-icons/react';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [orderCode, setOrderCode] = useState('');
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const code = searchParams.get('orderCode');
    
    console.log('🔍 Full URL:', window.location.href);
    console.log('🔍 Order code:', code);
    
    if (code && code !== 'UNKNOWN') {
      setOrderCode(code);
      console.log('✅ Payment success for order:', code);
    } else {
      console.warn('⚠️ No valid orderCode in URL');
      setOrderCode('N/A');
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/orders');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-10 text-center">
        <div className="mb-6">
          <CheckCircle size={100} weight="fill" className="text-green-500 mx-auto animate-bounce" />
        </div>
        
        <h1 className="text-3xl font-bold text-gray-800 mb-3">
          Thanh toán thành công! 🎉
        </h1>
        
        <p className="text-gray-600 mb-6">
          Đơn hàng <span className="font-bold text-green-600 text-xl">{orderCode || 'N/A'}</span> đã được thanh toán thành công.
        </p>

        <div className="bg-green-50 border-2 border-green-200 rounded-xl p-5 mb-6">
          <p className="text-green-700 font-medium">
            ✅ Chúng tôi đã nhận được thanh toán của bạn
          </p>
          <p className="text-green-600 text-sm mt-2">
            Đơn hàng sẽ được xử lý trong thời gian sớm nhất
          </p>
        </div>

        <p className="text-center text-xs text-gray-500 mb-6">
          Tự động chuyển về trang đơn hàng sau <span className="font-bold text-orange-600">{countdown}</span> giây...
        </p>

        <button
          onClick={() => navigate('/orders')}
          className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl mb-3"
        >
          Xem đơn hàng ngay →
        </button>

        <button
          onClick={() => navigate('/')}
          className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-xl transition-colors"
        >
          Về trang chủ
        </button>
      </div>
    </div>
  );
}