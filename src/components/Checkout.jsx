import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Info, 
  Tag,
  MapPin,
  User,
  Phone,
  CreditCard,
  Package
} from "@phosphor-icons/react";
import { toast } from "react-toastify"; 

const formatCurrency = (amount) => {
  if (typeof amount !== "number") {
    return amount;
  }
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
};

export default function Checkout() {
  const [cartItems, setCartItems] = useState([]);
  const [cartTotal, setCartTotal] = useState(0);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null); 

  // State cho địa chỉ
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [loadingProvinces, setLoadingProvinces] = useState(true);
  const [loadingDistricts, setLoadingDistricts] = useState(false);

  // State cho giảm giá
  const [discountCodes, setDiscountCodes] = useState([]);
  const [selectedDiscountId, setSelectedDiscountId] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [loadingDiscount, setLoadingDiscount] = useState(false);
  const [loadingDiscountCodes, setLoadingDiscountCodes] = useState(false);

  const [formData, setFormData] = useState({
    hoTen: "",
    sdt: "",
    tinhId: "",
    tinhTen: "",
    quanId: "",
    quanTen: "",
    phuong: "",
    diaChi: "",
    paymentMethod: "Tiền mặt",
  });

  // Load danh sách tỉnh/thành phố và mã giảm giá khi component mount
  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        const response = await fetch("http://localhost:8080/api/dia-chi/tinh-thanh");
        if (!response.ok) {
          throw new Error("Không thể tải danh sách tỉnh/thành phố");
        }
        const data = await response.json();
        setProvinces(data);
      } catch (error) {
        console.error("Lỗi khi tải tỉnh/thành phố:", error);
        toast.error("Không thể tải danh sách tỉnh/thành phố");
      } finally {
        setLoadingProvinces(false);
      }
    };

    const fetchDiscountCodes = async () => {
      try {
        const loggedInUser = JSON.parse(localStorage.getItem("currentUser"));
        
        if (!loggedInUser || !loggedInUser.id) {
          console.log("👤 User not logged in - no discount codes available");
          setDiscountCodes([]);
          return;
        }
        
        console.log("🔍 Loading discount codes for customer ID:", loggedInUser.id);
        setLoadingDiscountCodes(true);
        
        const response = await fetch(
          `http://localhost:8080/api/giam-gia-khach-hang/khach-hang/${loggedInUser.id}`
        );
        
        if (!response.ok) {
          throw new Error("Không thể tải danh sách mã giảm giá");
        }
        
        const result = await response.json();
        console.log("✅ Discount codes response:", result);
        
        const codes = result.data || [];
        setDiscountCodes(codes);
        
        if (codes.length === 0) {
          console.log("⚠️ No discount codes found for this customer");
        } else {
          console.log(`✅ Found ${codes.length} discount codes`);
        }
        
      } catch (error) {
        console.error("❌ Error loading discount codes:", error);
        setDiscountCodes([]);
        toast.error("Không thể tải danh sách mã giảm giá");
      } finally {
        setLoadingDiscountCodes(false);
      }
    };

    fetchProvinces();
    fetchDiscountCodes();
  }, []);

  useEffect(() => {
    const fetchDistricts = async () => {
      if (!formData.tinhId) {
        setDistricts([]);
        return;
      }

      setLoadingDistricts(true);
      try {
        const response = await fetch(
          `http://localhost:8080/api/dia-chi/quan-huyen?idTinh=${formData.tinhId}`
        );
        if (!response.ok) {
          throw new Error("Không thể tải danh sách quận/huyện");
        }
        const data = await response.json();
        setDistricts(data);
      } catch (error) {
        console.error("Lỗi khi tải quận/huyện:", error);
        toast.error("Không thể tải danh sách quận/huyện");
      } finally {
        setLoadingDistricts(false);
      }
    };

    fetchDistricts();
  }, [formData.tinhId]);

  useEffect(() => {
    const calculateDiscount = async () => {
      if (!appliedDiscount || !appliedDiscount.phieuGiamGiaId) {
        setDiscountAmount(0);
        return;
      }

      try {
        const response = await fetch(
          `http://localhost:8080/api/phieu-giam-gia/detail/${appliedDiscount.phieuGiamGiaId}`
        );
        
        if (!response.ok) {
          throw new Error("Không thể tải thông tin mã giảm giá");
        }
        
        const result = await response.json();
        const phieuDetail = result.data;
        
        console.log("💰 Calculating discount with:", phieuDetail);
        
        let discount = 0;
        if (phieuDetail.loaiGiamGia === false || phieuDetail.loaiGiamGia === 0) {
          discount = (cartTotal * phieuDetail.giaTriGiamGia) / 100;
          if (phieuDetail.mucGiaGiamToiDa && discount > phieuDetail.mucGiaGiamToiDa) {
            discount = phieuDetail.mucGiaGiamToiDa;
          }
        } else {
          discount = phieuDetail.giaTriGiamGia;
        }
        
        if (discount > cartTotal) {
          discount = cartTotal;
        }
        
        setDiscountAmount(discount);
        console.log("✅ Discount amount:", discount);
      } catch (error) {
        console.error("❌ Error calculating discount:", error);
        setDiscountAmount(0);
      }
    };

    calculateDiscount();
  }, [appliedDiscount, cartTotal]);

  useEffect(() => {
    const storedCart = JSON.parse(localStorage.getItem("cart") || "[]");
    if (storedCart.length === 0) {
      if (!window.location.pathname.includes('order-success')) {
          toast.error("Giỏ hàng trống, đang chuyển về trang chủ...");
          setTimeout(() => navigate("/"), 2000);
      }
      return;
    }
    setCartItems(storedCart);
    const subtotal = storedCart.reduce(
      (acc, item) => acc + item.gia * item.quantity,
      0
    );
    setCartTotal(subtotal);

    const loggedInUser = JSON.parse(localStorage.getItem("currentUser"));
    if (loggedInUser && loggedInUser.id) {
      setCurrentUser(loggedInUser);
      setFormData((prev) => ({
        ...prev,
        hoTen: loggedInUser.hoTen || "", 
        sdt: loggedInUser.sdt || "",   
      }));
    }
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProvinceChange = (e) => {
    const selectedId = e.target.value;
    const selectedProvince = provinces.find(p => p.id === parseInt(selectedId));
    
    setFormData((prev) => ({
      ...prev,
      tinhId: selectedId,
      tinhTen: selectedProvince ? selectedProvince.tenTinh : "",
      quanId: "",
      quanTen: ""
    }));
  };

  const handleDistrictChange = (e) => {
    const selectedId = e.target.value;
    const selectedDistrict = districts.find(d => d.id === parseInt(selectedId));
    
    setFormData((prev) => ({
      ...prev,
      quanId: selectedId,
      quanTen: selectedDistrict ? selectedDistrict.tenQuan : ""
    }));
  };

  const handleApplyDiscount = async () => {
    if (!selectedDiscountId) {
      toast.warning("Vui lòng chọn mã giảm giá");
      return;
    }

    setLoadingDiscount(true);

    const foundDiscount = discountCodes.find(
      (dc) => dc.phieuGiamGiaId === parseInt(selectedDiscountId)
    );

    if (!foundDiscount) {
      toast.error("Mã giảm giá không tồn tại");
      setLoadingDiscount(false);
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:8080/api/phieu-giam-gia/detail/${foundDiscount.phieuGiamGiaId}`
      );
      
      if (!response.ok) {
        throw new Error("Không thể tải thông tin mã giảm giá");
      }
      
      const result = await response.json();
      const phieuDetail = result.data;
      
      console.log("🔍 Validating discount:", phieuDetail);

      if (phieuDetail.trangThai !== 1) {
        toast.error("Mã giảm giá không còn hiệu lực");
        setLoadingDiscount(false);
        return;
      }

      if (phieuDetail.soLuongDung <= 0) {
        toast.error("Mã giảm giá đã hết số lượng");
        setLoadingDiscount(false);
        return;
      }

      const now = new Date();
      const startDate = new Date(phieuDetail.ngayBatDau);
      const endDate = new Date(phieuDetail.ngayKetThuc);
      
      if (now < startDate) {
        toast.error("Mã giảm giá chưa đến thời gian áp dụng");
        setLoadingDiscount(false);
        return;
      }
      
      if (now > endDate) {
        toast.error("Mã giảm giá đã hết hạn");
        setLoadingDiscount(false);
        return;
      }

      if (phieuDetail.giaTriDonHangToiThieu && cartTotal < phieuDetail.giaTriDonHangToiThieu) {
        toast.error(
          `Đơn hàng tối thiểu ${formatCurrency(phieuDetail.giaTriDonHangToiThieu)} để áp dụng mã này`
        );
        setLoadingDiscount(false);
        return;
      }

      setAppliedDiscount(foundDiscount);
      toast.success(`Áp dụng mã "${foundDiscount.tenChuongTrinh}" thành công!`);
      setLoadingDiscount(false);
    } catch (error) {
      console.error("❌ Error applying discount:", error);
      toast.error("Không thể áp dụng mã giảm giá");
      setLoadingDiscount(false);
    }
  };

  const handleRemoveDiscount = () => {
    setAppliedDiscount(null);
    setSelectedDiscountId("");
    setDiscountAmount(0);
    toast.info("Đã xóa mã giảm giá");
  };
  
  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!formData.hoTen || !formData.sdt || !formData.diaChi || 
        !formData.tinhId || !formData.quanId || !formData.phuong) {
      toast.error("Vui lòng điền đầy đủ thông tin địa chỉ.");
      setLoading(false);
      return;
    }

    const fullAddress = `${formData.diaChi}, ${formData.phuong}, ${formData.quanTen}, ${formData.tinhTen}`;

    // ⭐⭐⭐ SỬA: tongTien = cartTotal (GIÁ GỐC - chưa giảm) ⭐⭐⭐
    const orderData = {
      khachHangId: currentUser ? currentUser.id : null, 
      hoTen: formData.hoTen,
      sdt: formData.sdt,
      diaChiKhachHang: fullAddress,
      tinhId: parseInt(formData.tinhId),   
      quanId: parseInt(formData.quanId),      
      phuong: formData.phuong,                
      diaChiChiTiet: formData.diaChi,
      paymentMethod: formData.paymentMethod,
      phiVanChuyen: 0, 
      tongTien: cartTotal,  // ⭐ Tạm tính (537,000đ - chưa giảm)
      phieuGiamGiaId: appliedDiscount ? appliedDiscount.phieuGiamGiaId : null,
      tienGiam: discountAmount,  // ⭐ Số tiền giảm (60,000đ)
      items: cartItems.map(item => ({
        id: item.id, 
        quantity: item.quantity
      }))
    };

    console.log("📦 Submitting order:", orderData);
    console.log("💰 Tạm tính (cartTotal):", cartTotal);
    console.log("💸 Giảm giá (discountAmount):", discountAmount);
    console.log("💵 Tổng cộng (cartTotal - discountAmount):", cartTotal - discountAmount);

    try {
      const response = await fetch("http://localhost:8080/api/orders/place-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });

      const result = await response.json(); 

      if (!response.ok) {
        throw new Error(result.message || "Đặt hàng thất bại");
      }

      console.log("✅ Order placed successfully:", result);

      const responseData = result.data; 

      if (responseData && responseData.paymentUrl) {
        toast.success(result.message || "Đang chuyển hướng đến VNPAY...");
        sessionStorage.setItem('checkoutCustomerName', formData.hoTen);
        
        if (responseData.hoaDon && responseData.hoaDon.maHoaDon) {
          const maHoaDon = responseData.hoaDon.maHoaDon;
          const guestOrders = JSON.parse(localStorage.getItem("guestOrderCodes") || "[]");
          
          if (!guestOrders.includes(maHoaDon)) {
            guestOrders.push(maHoaDon);
          }
          localStorage.setItem("guestOrderCodes", JSON.stringify(guestOrders));
        }
        
        window.location.href = responseData.paymentUrl;
      } else if (responseData && responseData.hoaDon && responseData.hoaDon.maHoaDon) {
        const maHoaDon = responseData.hoaDon.maHoaDon;

        toast.success(result.message || "Đặt hàng thành công!");
        sessionStorage.setItem('checkoutCustomerName', formData.hoTen);
 
        const guestOrders = JSON.parse(localStorage.getItem("guestOrderCodes") || "[]");
        if (!guestOrders.includes(maHoaDon)) {
          guestOrders.push(maHoaDon);
        }
        localStorage.setItem("guestOrderCodes", JSON.stringify(guestOrders));
      
        setTimeout(() => {
          navigate(`/order-success/${maHoaDon}`); 
        }, 1500);

      } else {
        localStorage.removeItem("cart");
        throw new Error("Đặt hàng thành công nhưng không nhận được mã đơn hàng.");
      }

    } catch (error) {
      console.error("❌ Order error:", error);
      toast.error(error.message || "Đã xảy ra lỗi, vui lòng thử lại.");
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-orange-50/30 via-white to-orange-50/30 min-h-screen">
      <form onSubmit={handlePlaceOrder} className="container mx-auto max-w-6xl p-4 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
              
              {!currentUser ? (
                <div className="mb-6 p-4 bg-orange-50 border border-orange-100 rounded-lg">
                  <p className="text-sm text-gray-700">
                    Đã có tài khoản? 
                    <Link to="/login" className="font-semibold text-orange-600 hover:text-orange-700 ml-1 underline">
                      Đăng nhập ngay
                    </Link>
                  </p>
                </div>
              ) : (
                <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-center gap-2 text-gray-700">
                    <User size={18} weight="duotone" className="text-orange-500" />
                    <span className="text-sm">
                      Đặt hàng với tài khoản: <strong className="text-orange-600">{currentUser.hoTen || currentUser.email}</strong>
                    </span>
                  </div>
                </div>
              )}

              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin size={20} weight="duotone" className="text-orange-500" />
                  <h2 className="text-lg font-semibold text-gray-800">Địa chỉ giao hàng</h2>
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                      <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input 
                        type="text" 
                        placeholder="Họ và tên" 
                        name="hoTen"
                        value={formData.hoTen} 
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all outline-none" 
                        required
                      />
                    </div>
                    
                    <div className="relative">
                      <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input 
                        type="text" 
                        placeholder="Số điện thoại" 
                        name="sdt"
                        value={formData.sdt} 
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all outline-none" 
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <select
                      name="tinhId"
                      value={formData.tinhId}
                      onChange={handleProvinceChange}
                      disabled={loadingProvinces}
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all outline-none bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                      required
                    >
                      <option value="">
                        {loadingProvinces ? "Đang tải..." : "Chọn Tỉnh/Thành phố"}
                      </option>
                      {provinces.map((province) => (
                        <option key={province.id} value={province.id}>
                          {province.tenTinh}
                        </option>
                      ))}
                    </select>

                    <select
                      name="quanId"
                      value={formData.quanId}
                      onChange={handleDistrictChange}
                      disabled={!formData.tinhId || loadingDistricts}
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all outline-none bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                      required
                    >
                      <option value="">
                        {!formData.tinhId 
                          ? "Chọn Tỉnh trước" 
                          : loadingDistricts 
                          ? "Đang tải..." 
                          : "Chọn Quận/Huyện"}
                      </option>
                      {districts.map((district) => (
                        <option key={district.id} value={district.id}>
                          {district.tenQuan}
                        </option>
                      ))}
                    </select>

                    <input 
                      type="text" 
                      placeholder="Phường/Xã" 
                      name="phuong"
                      value={formData.phuong} 
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all outline-none" 
                      required
                    />
                  </div>
                  <input 
                    type="text" 
                    placeholder="Địa chỉ chi tiết (Số nhà, tên đường...)" 
                    name="diaChi"
                    value={formData.diaChi} 
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all outline-none" 
                    required
                  />
                </div>
              </div>

              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Package size={20} weight="duotone" className="text-orange-500" />
                  <h2 className="text-lg font-semibold text-gray-800">Phương thức giao hàng</h2>
                </div>
                
                <label className="flex items-center gap-3 p-4 rounded-lg border-2 border-orange-200 bg-orange-50/50 cursor-pointer">
                  <input 
                    type="radio" 
                    name="delivery_method" 
                    defaultChecked 
                    className="w-4 h-4 text-orange-500 focus:ring-orange-400"
                  />
                  <span className="font-medium text-gray-700">Chuyển phát nhanh</span>
                  <span className="ml-auto text-sm text-gray-500">Miễn phí</span>
                </label>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-4">
                  <CreditCard size={20} weight="duotone" className="text-orange-500" />
                  <h2 className="text-lg font-semibold text-gray-800">Phương thức thanh toán</h2>
                </div>
                
                <div className="space-y-3">
                  <label className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    formData.paymentMethod === "Tiền mặt" 
                      ? "border-orange-400 bg-orange-50" 
                      : "border-gray-200 hover:border-gray-300"
                  }`}>
                    <input 
                      type="radio" 
                      name="paymentMethod" 
                      value="Tiền mặt"
                      checked={formData.paymentMethod === "Tiền mặt"}
                      onChange={handleInputChange} 
                      className="w-4 h-4 text-orange-500 focus:ring-orange-400"
                    />
                    <div className="flex-grow">
                      <span className="font-medium text-gray-700">Thanh toán khi nhận hàng</span>
                      <span className="block text-xs text-gray-500 mt-0.5">Thanh toán bằng tiền mặt khi nhận hàng</span>
                    </div>
                  </label>
                  
                  <label className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    formData.paymentMethod === "Chuyển khoản" 
                      ? "border-orange-400 bg-orange-50" 
                      : "border-gray-200 hover:border-gray-300"
                  }`}>
                    <input 
                      type="radio" 
                      name="paymentMethod" 
                      value="Chuyển khoản"
                      checked={formData.paymentMethod === "Chuyển khoản"}
                      onChange={handleInputChange} 
                      className="w-4 h-4 text-orange-500 focus:ring-orange-400"
                    />
                    <div className="flex-grow">
                      <span className="font-medium text-gray-700">Chuyển khoản ngân hàng</span>
                      <span className="block text-xs text-gray-500 mt-0.5">Thanh toán qua cổng VNPAY</span>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="sticky top-24 space-y-4">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Package size={18} weight="duotone" className="text-orange-500" />
                  Đơn hàng ({cartItems.length} sản phẩm)
                </h3>
                
                <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                  {cartItems.map(item => (
                    <div key={item.id} className="flex gap-3 pb-3 border-b border-gray-100 last:border-0">
                      <img 
                        src={item.hinhAnh} 
                        alt={item.tenSanPham} 
                        className="w-14 h-16 object-cover rounded-lg flex-shrink-0"
                      />
                      <div className="flex-grow min-w-0">
                        <p className="font-medium text-sm text-gray-800 truncate">{item.tenSanPham}</p>
                        <p className="text-xs text-gray-500">Size: {item.size} • SL: {item.quantity}</p>
                        <p className="text-sm font-semibold text-orange-600 mt-1">
                          {formatCurrency(item.gia * item.quantity)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-base font-semibold text-gray-800 mb-4">Chi tiết thanh toán</h3>
                
                <div className="mb-6">
                  {!currentUser ? (
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
                      <Tag size={20} className="mx-auto mb-2 text-gray-400" />
                      <p className="text-sm text-gray-600 mb-2">
                        Đăng nhập để sử dụng mã giảm giá
                      </p>
                      <Link 
                        to="/login" 
                        className="text-sm font-semibold text-orange-600 hover:text-orange-700 underline"
                      >
                        Đăng nhập ngay
                      </Link>
                    </div>
                  ) : loadingDiscountCodes ? (
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
                      <p className="text-sm text-gray-600">Đang tải mã giảm giá...</p>
                    </div>
                  ) : !appliedDiscount ? (
                    <div className="flex gap-2">
                      <div className="relative flex-grow">
                        <Tag size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10"/>
                        <select
                          value={selectedDiscountId}
                          onChange={(e) => setSelectedDiscountId(e.target.value)}
                          disabled={loadingDiscount || discountCodes.length === 0}
                          className="w-full pl-9 pr-10 py-2.5 rounded-lg border border-gray-200 text-sm focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all outline-none disabled:bg-gray-50 appearance-none bg-white"
                        >
                          <option value="">
                            {discountCodes.length === 0 ? "Bạn chưa có mã giảm giá" : "Chọn mã giảm giá"}
                          </option>
                          {discountCodes.map((code) => (
                            <option key={code.phieuGiamGiaId} value={code.phieuGiamGiaId}>
                              {code.tenChuongTrinh}
                            </option>
                          ))}
                        </select>
                      </div>
                      <button 
                        type="button"
                        onClick={handleApplyDiscount}
                        disabled={loadingDiscount || !selectedDiscountId}
                        className="px-4 py-2.5 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                      >
                        {loadingDiscount ? "..." : "Áp dụng"}
                      </button>
                    </div>
                  ) : (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Tag size={18} weight="fill" className="text-green-600" />
                          <div>
                            <p className="font-semibold text-green-800 text-sm">
                              {appliedDiscount.tenChuongTrinh}
                            </p>
                            <p className="text-xs text-green-600">
                              Giảm {formatCurrency(discountAmount)}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveDiscount}
                          className="text-xs text-red-600 hover:text-red-700 font-medium"
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-3 pt-4 border-t border-gray-100">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Tạm tính</span>
                    <span className="font-medium text-gray-800">{formatCurrency(cartTotal)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Phí vận chuyển</span>
                    <span className="font-medium text-green-600">Miễn phí</span>
                  </div>
                  
                  {appliedDiscount && discountAmount > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Giảm giá</span>
                      <span className="font-medium text-green-600">-{formatCurrency(discountAmount)}</span>
                    </div>
                  )}
                  
                  <div className="pt-3 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-gray-700">Tổng cộng</span>
                      <span className="text-2xl font-bold text-orange-600">
                        {formatCurrency(cartTotal - discountAmount)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-3 bg-orange-50 border border-orange-100 rounded-lg">
                  <div className="flex gap-2 text-xs text-gray-600">
                    <Info size={16} weight="fill" className="flex-shrink-0 text-orange-500 mt-0.5" />
                    <p className="leading-relaxed">
                      Sản phẩm giảm giá trên 50% không hỗ trợ đổi trả. 
                      <span className="font-semibold text-orange-700"> KHÔNG thanh toán</span> khi chưa nhận hàng.
                    </p>
                  </div>
                </div>

                <button
                  type="submit" 
                  disabled={loading || cartItems.length === 0}
                  className="w-full mt-6 bg-orange-500 text-white py-3.5 rounded-lg font-semibold hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                  {loading ? "ĐANG XỬ LÝ..." : "HOÀN THÀNH ĐẶT HÀNG"}
                </button>
                
                <p className="text-center text-xs text-gray-500 mt-3">
                  Bằng việc đặt hàng, bạn đồng ý với điều khoản sử dụng
                </p>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}