import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { XCircle, ArrowCounterClockwise } from '@phosphor-icons/react';

const ERROR_MESSAGES = {
  '07': 'Giao dịch bị nghi ngờ gian lận',
  '09': 'Thẻ/Tài khoản chưa đăng ký dịch vụ',
  '10': 'Xác thực thông tin không đúng quá 3 lần',
  '11': 'Hết thời gian thanh toán (timeout)',
  '12': 'Thẻ/Tài khoản bị khóa',
  '13': 'Sai mật khẩu xác thực OTP',
  '24': 'Khách hàng hủy giao dịch',
  '51': 'Tài khoản không đủ số dư',
  '65': 'Tài khoản vượt quá hạn mức giao dịch',
  '75': 'Ngân hàng thanh toán đang bảo trì',
  '79': 'Nhập sai mật khẩu quá số lần quy định',
  '99': 'Lỗi không xác định',
  'default': 'Giao dịch thất bại'
};

export default function PaymentFailed() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [orderCode, setOrderCode] = useState('');
  const [errorCode, setErrorCode] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const code = searchParams.get('orderCode');
    const error = searchParams.get('errorCode');
    
    console.log('🔍 Full URL:', window.location.href);
    console.log('🔍 Order code:', code);
    console.log('🔍 Error code:', error);
    
    if (code && code !== 'UNKNOWN') {
      setOrderCode(code);
    } else {
      setOrderCode('N/A');
    }
    
    if (error) {
      setErrorCode(error);
      setErrorMessage(ERROR_MESSAGES[error] || ERROR_MESSAGES['default']);
      console.log('❌ Payment failed - Order:', code, 'Error:', error);
    } else {
      setErrorCode('99');
      setErrorMessage(ERROR_MESSAGES['default']);
    }
  }, [searchParams]);

  const handleRetry = () => {
    navigate('/cart');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-10 text-center">
        <div className="mb-6">
          <XCircle size={100} weight="fill" className="text-red-500 mx-auto animate-pulse" />
        </div>
        
        <h1 className="text-3xl font-bold text-gray-800 mb-3">
          Thanh toán thất bại
        </h1>
        
        <p className="text-gray-600 mb-2">
          Đơn hàng <span className="font-bold text-xl">{orderCode || 'N/A'}</span>
        </p>

        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-5 mb-6">
          <p className="text-red-700 font-bold mb-2">
            ❌ {errorMessage || 'Giao dịch thất bại'}
          </p>
          {errorCode && (
            <p className="text-red-600 text-sm">
              Mã lỗi: <span className="font-mono font-bold">{errorCode}</span>
            </p>
          )}
        </div>

        <p className="text-gray-500 text-sm mb-6">
          Đơn hàng của bạn đã bị hủy. Vui lòng thử lại hoặc chọn phương thức thanh toán khác.
        </p>

        <button
          onClick={handleRetry}
          className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl mb-3 flex items-center justify-center gap-2"
        >
          <ArrowCounterClockwise size={24} weight="bold" />
          Thử lại thanh toán
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