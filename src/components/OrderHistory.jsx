import React, { useState, useEffect, useMemo } from 'react';
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
  Tag,
  Funnel,
  X,
  CalendarBlank,
  CurrencyDollar,
  MagnifyingGlass,
  Phone,
  Trash,
  Warning
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
  const [showFilters, setShowFilters] = useState(false);

  // Filter states
  const [priceRange, setPriceRange] = useState({ min: 0, max: 10000000 });
  const [tempPriceRange, setTempPriceRange] = useState({ min: 0, max: 10000000 });
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Phone search states
  const [phoneSearch, setPhoneSearch] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Cancel order modal states
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  // Calculate actual min/max prices from orders
  const actualPriceRange = useMemo(() => {
    if (orders.length === 0) return { min: 0, max: 10000000 };
    
    const prices = orders.map(order => 
      order.tongTienHienThi || order.tongTienSauGiam || order.tongTien || 0
    );
    
    const min = Math.floor(Math.min(...prices) / 100000) * 100000;
    const max = Math.ceil(Math.max(...prices) / 100000) * 100000;
    
    return { min, max };
  }, [orders]);

  // Update price range when orders change
  useEffect(() => {
    if (orders.length > 0 && actualPriceRange.max > 0) {
      setPriceRange(actualPriceRange);
      setTempPriceRange(actualPriceRange);
    }
  }, [actualPriceRange, orders.length]);

  // Filter orders based on criteria
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const orderPrice = order.tongTienHienThi || order.tongTienSauGiam || order.tongTien || 0;
      const orderDate = new Date(order.ngayTao);

      // Price filter
      if (orderPrice < priceRange.min || orderPrice > priceRange.max) {
        return false;
      }

      // Date filter
      if (dateRange.start) {
        const startDate = new Date(dateRange.start);
        startDate.setHours(0, 0, 0, 0);
        if (orderDate < startDate) return false;
      }
      if (dateRange.end) {
        const endDate = new Date(dateRange.end);
        endDate.setHours(23, 59, 59, 999);
        if (orderDate > endDate) return false;
      }

      // Status filter
      if (selectedStatus !== 'all' && order.trangThai !== parseInt(selectedStatus)) {
        return false;
      }

      return true;
    });
  }, [orders, priceRange, dateRange, selectedStatus]);

  const handleResetFilters = () => {
    setPriceRange(actualPriceRange);
    setTempPriceRange(actualPriceRange);
    setDateRange({ start: '', end: '' });
    setSelectedStatus('all');
    toast.info('Đã đặt lại bộ lọc');
  };

  const handlePhoneSearch = async () => {
    if (!phoneSearch.trim()) {
      toast.warning('Vui lòng nhập số điện thoại');
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`http://localhost:8080/api/orders/by-phone/${phoneSearch}`);
      
      if (!response.ok) {
        throw new Error('Không tìm thấy đơn hàng với số điện thoại này');
      }

      const result = await response.json();
      const foundOrders = result.data || [];

      if (foundOrders.length === 0) {
        toast.info('Không tìm thấy đơn hàng nào');
        setOrders([]);
      } else {
        foundOrders.sort((a, b) => new Date(b.ngayTao || 0) - new Date(a.ngayTao || 0));
        setOrders(foundOrders);
        toast.success(`Tìm thấy ${foundOrders.length} đơn hàng`);
      }
    } catch (error) {
      console.error('❌ Search error:', error);
      toast.error(error.message || 'Không thể tra cứu đơn hàng');
      setOrders([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!orderToCancel) return;

    if (!cancelReason.trim()) {
      toast.warning('Vui lòng nhập lý do hủy đơn');
      return;
    }

    setIsCancelling(true);
    try {
      const response = await fetch(`http://localhost:8080/api/orders/${orderToCancel.maHoaDon}/cancel`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: cancelReason })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Không thể hủy đơn hàng');
      }

      const result = await response.json();
      
      // Update orders list
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.maHoaDon === orderToCancel.maHoaDon 
            ? { ...order, trangThai: 4 } 
            : order
        )
      );

      toast.success('Đã hủy đơn hàng thành công');
      setShowCancelModal(false);
      setOrderToCancel(null);
      setCancelReason('');
    } catch (error) {
      console.error('❌ Cancel error:', error);
      toast.error(error.message || 'Không thể hủy đơn hàng');
    } finally {
      setIsCancelling(false);
    }
  };

  const openCancelModal = (order) => {
    setOrderToCancel(order);
    setShowCancelModal(true);
  };

  const closeCancelModal = () => {
    setShowCancelModal(false);
    setOrderToCancel(null);
    setCancelReason('');
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (priceRange.min !== actualPriceRange.min || priceRange.max !== actualPriceRange.max) count++;
    if (dateRange.start || dateRange.end) count++;
    if (selectedStatus !== 'all') count++;
    return count;
  }, [priceRange, actualPriceRange, dateRange, selectedStatus]);

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
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                <ClockCounterClockwise size={24} weight="bold" className="text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-800">Lịch sử đơn hàng</h1>
            </div>
            
            {orders.length > 0 && (
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-orange-200 text-orange-600 rounded-lg font-medium hover:bg-orange-50 transition-colors relative"
              >
                <Funnel size={18} weight="bold" />
                <span>Bộ lọc</span>
                {activeFiltersCount > 0 && (
                  <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {activeFiltersCount}
                  </span>
                )}
              </button>
            )}
          </div>
          <p className="text-gray-600 ml-13">
            {filteredOrders.length === orders.length 
              ? `Quản lý và theo dõi tất cả ${orders.length} đơn hàng của bạn`
              : `Hiển thị ${filteredOrders.length} / ${orders.length} đơn hàng`
            }
          </p>
        </div>

        {/* Phone Search Section */}
        <div className="mb-6 bg-white rounded-xl shadow-sm border border-orange-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Phone size={20} weight="duotone" className="text-orange-500" />
            <h3 className="text-lg font-semibold text-gray-800">Tra cứu đơn hàng</h3>
          </div>
          
          <div className="flex gap-3">
            <div className="relative flex-grow">
              <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Nhập số điện thoại để tra cứu đơn hàng"
                value={phoneSearch}
                onChange={(e) => setPhoneSearch(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handlePhoneSearch()}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all outline-none"
              />
            </div>
            <button
              onClick={handlePhoneSearch}
              disabled={isSearching}
              className="px-6 py-3 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2 shadow-sm"
            >
              <MagnifyingGlass size={20} weight="bold" />
              {isSearching ? 'Đang tìm...' : 'Tra cứu'}
            </button>
          </div>
          
          <p className="text-xs text-gray-500 mt-2">
            💡 Nhập số điện thoại đã dùng để đặt hàng để tra cứu tất cả đơn hàng
          </p>
        </div>

        {/* Filter Panel */}
        {showFilters && orders.length > 0 && (
          <div className="mb-6 bg-white rounded-xl shadow-sm border border-orange-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Funnel size={20} weight="duotone" className="text-orange-500" />
                Bộ lọc đơn hàng
              </h3>
              <button
                onClick={handleResetFilters}
                className="text-sm text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1"
              >
                <X size={16} weight="bold" />
                Đặt lại
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Price Range Filter */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <CurrencyDollar size={18} weight="duotone" className="text-orange-500" />
                  Khoảng giá
                </label>
                
                <div className="space-y-4">
                  {/* Range Slider */}
                  <div className="px-2">
                    <div className="relative h-2 bg-gray-200 rounded-full">
                      <div 
                        className="absolute h-2 bg-orange-500 rounded-full"
                        style={{
                          left: `${((tempPriceRange.min - actualPriceRange.min) / (actualPriceRange.max - actualPriceRange.min)) * 100}%`,
                          right: `${100 - ((tempPriceRange.max - actualPriceRange.min) / (actualPriceRange.max - actualPriceRange.min)) * 100}%`
                        }}
                      />
                    </div>
                    <input
                      type="range"
                      min={actualPriceRange.min}
                      max={actualPriceRange.max}
                      step={100000}
                      value={tempPriceRange.min}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        if (value <= tempPriceRange.max) {
                          setTempPriceRange(prev => ({ ...prev, min: value }));
                        }
                      }}
                      onMouseUp={() => setPriceRange(tempPriceRange)}
                      onTouchEnd={() => setPriceRange(tempPriceRange)}
                      className="absolute w-full h-2 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-orange-500 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-orange-500 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:shadow-md"
                    />
                    <input
                      type="range"
                      min={actualPriceRange.min}
                      max={actualPriceRange.max}
                      step={100000}
                      value={tempPriceRange.max}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        if (value >= tempPriceRange.min) {
                          setTempPriceRange(prev => ({ ...prev, max: value }));
                        }
                      }}
                      onMouseUp={() => setPriceRange(tempPriceRange)}
                      onTouchEnd={() => setPriceRange(tempPriceRange)}
                      className="absolute w-full h-2 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-orange-500 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-orange-500 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:shadow-md"
                    />
                  </div>

                  {/* Price Display */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="px-3 py-2 bg-orange-50 border border-orange-200 rounded-lg">
                      <span className="text-orange-600 font-semibold">
                        {formatCurrency(tempPriceRange.min)}
                      </span>
                    </div>
                    <div className="text-gray-400">-</div>
                    <div className="px-3 py-2 bg-orange-50 border border-orange-200 rounded-lg">
                      <span className="text-orange-600 font-semibold">
                        {formatCurrency(tempPriceRange.max)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Date Range Filter */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <CalendarBlank size={18} weight="duotone" className="text-orange-500" />
                  Khoảng thời gian
                </label>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">Từ ngày</label>
                    <input
                      type="date"
                      value={dateRange.start}
                      onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                      max={dateRange.end || undefined}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all outline-none text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">Đến ngày</label>
                    <input
                      type="date"
                      value={dateRange.end}
                      onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                      min={dateRange.start || undefined}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all outline-none text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Status Filter */}
            <div className="mt-6 pt-6 border-t border-gray-100">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                <Package size={18} weight="duotone" className="text-orange-500" />
                Trạng thái đơn hàng
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedStatus('all')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedStatus === 'all'
                      ? 'bg-orange-500 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Tất cả
                </button>
                {[
                  { value: '0', label: 'Chờ xác nhận', color: 'amber' },
                  { value: '1', label: 'Chờ giao hàng', color: 'blue' },
                  { value: '2', label: 'Đang vận chuyển', color: 'purple' },
                  { value: '3', label: 'Hoàn thành', color: 'green' },
                  { value: '4', label: 'Đã hủy', color: 'red' }
                ].map(status => (
                  <button
                    key={status.value}
                    onClick={() => setSelectedStatus(status.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedStatus === status.value
                        ? `bg-${status.color}-500 text-white shadow-sm`
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {status.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

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
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-12 text-center">
            <div className="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Funnel size={48} weight="duotone" className="text-orange-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">Không tìm thấy đơn hàng</h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Không có đơn hàng nào phù hợp với bộ lọc của bạn. Hãy thử điều chỉnh bộ lọc!
            </p>
            <button 
              onClick={handleResetFilters}
              className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition-colors shadow-sm"
            >
              <X size={20} weight="bold" />
              Đặt lại bộ lọc
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const statusConfig = getOrderStatusConfig(order.trangThai);
              const StatusIcon = statusConfig.icon;
              
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
                      
                      <div className="flex gap-2">
                        <Link
                          to={`/orders/${order.maHoaDon}`}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-orange-50 text-orange-600 rounded-lg font-medium hover:bg-orange-100 transition-colors text-sm"
                        >
                          Xem chi tiết
                          <ArrowRight size={16} weight="bold" />
                        </Link>
                        
                        {/* Cancel button - only show for pending orders */}
                        {order.trangThai === 0 && (
                          <button
                            onClick={() => openCancelModal(order)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100 transition-colors text-sm"
                          >
                            <Trash size={16} weight="bold" />
                            Hủy đơn
                          </button>
                        )}
                      </div>
                    </div>

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
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
                          <CreditCard size={20} weight="duotone" className="text-orange-500" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-0.5">Tổng tiền</p>
                          
                          {hasVoucher && tienDaGiam > 0 && (
                            <p className="text-sm text-gray-400 line-through">
                              {formatCurrency(order.tongTien)}
                            </p>
                          )}
                          
                          <p className="text-xl font-bold text-gray-800">
                            {formatCurrency(order.tongTienHienThi || order.tongTienSauGiam || order.tongTien)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${statusConfig.color}`}>
                          <StatusIcon size={18} weight="bold" className={statusConfig.iconColor} />
                          <span className="font-semibold text-sm">{statusConfig.text}</span>
                        </div>
                      </div>
                    </div>
                  </div>
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
        {filteredOrders.length > 0 && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
              <p className="text-2xl font-bold text-orange-600">{filteredOrders.length}</p>
              <p className="text-sm text-gray-600 mt-1">
                {activeFiltersCount > 0 ? 'Đơn lọc được' : 'Tổng đơn hàng'}
              </p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
              <p className="text-2xl font-bold text-green-600">
                {filteredOrders.filter(o => o.trangThai === 3).length}
              </p>
              <p className="text-sm text-gray-600 mt-1">Đã hoàn thành</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
              <p className="text-2xl font-bold text-amber-600">
                {filteredOrders.filter(o => o.trangThai === 0 || o.trangThai === 1 || o.trangThai === 2).length}
              </p>
              <p className="text-sm text-gray-600 mt-1">Đang xử lý</p>
            </div>
          </div>
        )}
      </div>
      {/* Cancel Order Modal */}
      {showCancelModal && orderToCancel && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <Warning size={24} weight="fill" className="text-red-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Hủy đơn hàng</h3>
                  <p className="text-sm text-gray-600">Mã: {orderToCancel.maHoaDon}</p>
                </div>
              </div>
              <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800 flex items-start gap-2">
                  <Warning size={16} weight="bold" className="flex-shrink-0 mt-0.5" />
                  <span>
                    Bạn có chắc chắn muốn hủy đơn hàng này? 
                    Hành động này không thể hoàn tác.
                  </span>
                </p>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Lý do hủy đơn <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Vui lòng cho chúng tôi biết lý do bạn muốn hủy đơn hàng..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all outline-none resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Thông tin này giúp chúng tôi cải thiện dịch vụ tốt hơn
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={closeCancelModal}
                  disabled={isCancelling}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Quay lại
                </button>
                <button
                  onClick={handleCancelOrder}
                  disabled={isCancelling || !cancelReason.trim()}
                  className="flex-1 px-4 py-3 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {isCancelling ? 'Đang xử lý...' : 'Xác nhận hủy'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
