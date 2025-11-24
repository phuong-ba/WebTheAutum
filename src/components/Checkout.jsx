import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Info,
  MapPin,
  User,
  Phone,
  CreditCard,
  Package,
  X,
  Check,
  Ticket,
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
  const [appliedDiscount, setAppliedDiscount] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [loadingDiscountCodes, setLoadingDiscountCodes] = useState(false);
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [voucherDetails, setVoucherDetails] = useState([]);

  const [formData, setFormData] = useState({
    hoTen: "",
    sdt: "",
    email: "",
    tinhId: "",
    tinhTen: "",
    quanId: "",
    quanTen: "",
    phuong: "",
    diaChi: "",
    paymentMethod: "Tiền mặt",
  });

  // Debug: Kiểm tra thông tin đăng nhập
  useEffect(() => {
    const customerId = localStorage.getItem("customer_id");
    const token = localStorage.getItem("customer_token");
    const name = localStorage.getItem("customer_name");
    const email = localStorage.getItem("customer_email");
    const phone = localStorage.getItem("customer_phone");

    console.log("🔍 DEBUG - Login Info:", {
      customerId,
      hasToken: !!token,
      name,
      email,
      phone,
    });
  }, []);

  // Load giỏ hàng và thông tin khách hàng
  useEffect(() => {
    // Load giỏ hàng
    const storedCart = JSON.parse(localStorage.getItem("cart") || "[]");
    if (storedCart.length === 0) {
      if (!window.location.pathname.includes("order-success")) {
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

    // Load thông tin khách hàng từ localStorage
    const token = localStorage.getItem("customer_token");
    const customerId = localStorage.getItem("customer_id");
    const customerName = localStorage.getItem("customer_name");
    const customerEmail = localStorage.getItem("customer_email");
    const customerPhone = localStorage.getItem("customer_phone");

    if (token && customerId) {
      console.log("✅ User logged in - Loading from localStorage");
      console.log("📞 Customer phone from localStorage:", customerPhone);
      
      const loggedInUser = {
        id: customerId,
        hoTen: customerName || "",
        email: customerEmail || "",
        sdt: customerPhone || "",
      };

      setCurrentUser(loggedInUser);

      // Auto-fill thông tin vào form
      setFormData((prev) => ({
        ...prev,
        hoTen: customerName || "",
        sdt: customerPhone || "",
        email: customerEmail || "",
      }));

      console.log("📝 Auto-filled form data:", {
        hoTen: customerName,
        sdt: customerPhone,
        email: customerEmail
      });

      // Gọi API để lấy địa chỉ đã lưu
      fetchCustomerInfo(customerId, token);
    } else {
      console.log("👤 No user logged in");
      setCurrentUser(null);
    }
  }, [navigate]);

  // Load danh sách tỉnh/thành phố
  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        const response = await fetch(
          "http://localhost:8080/api/dia-chi/tinh-thanh"
        );
        if (!response.ok) {
          throw new Error("Không thể tải danh sách tỉnh/thành phố");
        }
        const data = await response.json();
        setProvinces(data);
        console.log("✅ Loaded provinces:", data.length);
      } catch (error) {
        console.error("❌ Error loading provinces:", error);
        toast.error("Không thể tải danh sách tỉnh/thành phố");
      } finally {
        setLoadingProvinces(false);
      }
    };

    fetchProvinces();
  }, []);

  // Load mã giảm giá
  useEffect(() => {
    const fetchDiscountCodes = async () => {
      try {
        const customerId = localStorage.getItem("customer_id");
        const token = localStorage.getItem("customer_token");

        if (!customerId || !token) {
          console.log("👤 User not logged in - no discount codes available");
          setDiscountCodes([]);
          setAppliedDiscount(null);
          setDiscountAmount(0);
          return;
        }

        console.log("🔍 Loading discount codes for customer ID:", customerId);
        setLoadingDiscountCodes(true);

        const response = await fetch(
          `http://localhost:8080/api/giam-gia-khach-hang/khach-hang/${customerId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          console.error("❌ API Error:", response.status, response.statusText);
          throw new Error("Không thể tải danh sách mã giảm giá");
        }

        const result = await response.json();
        console.log("✅ Discount codes API response:", result);

        const codes = result.data || result || [];
        setDiscountCodes(codes);

        if (codes.length === 0) {
          console.log("⚠️ No discount codes found for this customer");
        } else {
          console.log(`✅ Found ${codes.length} discount codes`);
          toast.success(`Tìm thấy ${codes.length} mã giảm giá!`, {
            autoClose: 2000,
          });
        }
      } catch (error) {
        console.error("❌ Error loading discount codes:", error);
        setDiscountCodes([]);
      } finally {
        setLoadingDiscountCodes(false);
      }
    };

    fetchDiscountCodes();
  }, []);

  // Load quận/huyện khi chọn tỉnh
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
        console.log("✅ Loaded districts:", data.length);
      } catch (error) {
        console.error("❌ Error loading districts:", error);
        toast.error("Không thể tải danh sách quận/huyện");
      } finally {
        setLoadingDistricts(false);
      }
    };

    fetchDistricts();
  }, [formData.tinhId]);

  // Tự động tính toán và áp dụng voucher tốt nhất
  useEffect(() => {
    const calculateBestDiscount = async () => {
      if (discountCodes.length === 0 || cartTotal === 0) {
        console.log("⚠️ No discount codes or cart is empty");
        setAppliedDiscount(null);
        setDiscountAmount(0);
        setVoucherDetails([]);
        return;
      }

      console.log(
        "🔍 Calculating best discount from",
        discountCodes.length,
        "codes"
      );

      try {
        // Lấy chi tiết từng voucher
        const detailsPromises = discountCodes.map(async (code) => {
          try {
            const response = await fetch(
              `http://localhost:8080/api/phieu-giam-gia/detail/${code.phieuGiamGiaId}`
            );
            if (!response.ok) {
              console.error(
                "❌ Failed to load voucher details:",
                code.phieuGiamGiaId
              );
              return null;
            }
            const result = await response.json();
            return { ...code, detail: result.data };
          } catch (error) {
            console.error("❌ Error loading voucher detail:", error);
            return null;
          }
        });

        const details = (await Promise.all(detailsPromises)).filter(
          (d) => d !== null
        );

        console.log("✅ Loaded voucher details:", details.length);

        // Lọc voucher hợp lệ
        const now = new Date();
        const validVouchers = details.filter((voucher) => {
          const detail = voucher.detail;
          if (!detail) return false;

          const startDate = new Date(detail.ngayBatDau);
          const endDate = new Date(detail.ngayKetThuc);

          const isValid =
            detail.trangThai === 1 &&
            detail.soLuongDung > 0 &&
            now >= startDate &&
            now <= endDate &&
            (!detail.giaTriDonHangToiThieu ||
              cartTotal >= detail.giaTriDonHangToiThieu);

          console.log(`Voucher "${voucher.tenChuongTrinh}":`, {
            isValid,
            status: detail.trangThai,
            quantity: detail.soLuongDung,
            minOrder: detail.giaTriDonHangToiThieu,
            cartTotal,
          });

          return isValid;
        });

        console.log("✅ Valid vouchers:", validVouchers.length);

        // Tính toán số tiền giảm cho từng voucher
        const vouchersWithDiscount = validVouchers.map((voucher) => {
          const detail = voucher.detail;
          let discount = 0;

          // loaiGiamGia: false/0 = %, true/1 = VND
          if (detail.loaiGiamGia === false || detail.loaiGiamGia === 0) {
            // Giảm theo %
            discount = (cartTotal * detail.giaTriGiamGia) / 100;
            if (detail.mucGiaGiamToiDa && discount > detail.mucGiaGiamToiDa) {
              discount = detail.mucGiaGiamToiDa;
            }
          } else {
            // Giảm theo VND
            discount = detail.giaTriGiamGia;
          }

          // Không được giảm quá tổng giỏ hàng
          if (discount > cartTotal) {
            discount = cartTotal;
          }

          console.log(
            `💰 Discount for "${voucher.tenChuongTrinh}":`,
            formatCurrency(discount)
          );

          return { ...voucher, calculatedDiscount: discount };
        });

        setVoucherDetails(vouchersWithDiscount);

        // Tự động chọn voucher tốt nhất
        if (vouchersWithDiscount.length > 0) {
          const bestVoucher = vouchersWithDiscount.reduce((best, current) =>
            current.calculatedDiscount > best.calculatedDiscount
              ? current
              : best
          );

          setAppliedDiscount(bestVoucher);
          setDiscountAmount(bestVoucher.calculatedDiscount);
          console.log(
            "✅ Auto-applied best voucher:",
            bestVoucher.tenChuongTrinh,
            formatCurrency(bestVoucher.calculatedDiscount)
          );
          toast.success(
            `Đã tự động áp dụng voucher tốt nhất: ${bestVoucher.tenChuongTrinh}`,
            { autoClose: 3000 }
          );
        } else {
          setAppliedDiscount(null);
          setDiscountAmount(0);
          console.log("⚠️ No valid vouchers available");
        }
      } catch (error) {
        console.error("❌ Error calculating best discount:", error);
        setAppliedDiscount(null);
        setDiscountAmount(0);
      }
    };

    calculateBestDiscount();
  }, [discountCodes, cartTotal]);

  // Lấy địa chỉ đã lưu từ API (chỉ để lấy quanHuyens)
  const fetchCustomerInfo = async (customerId, token) => {
    try {
      const response = await fetch(
        `http://localhost:8080/api/khach-hang/${customerId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        console.log("⚠️ Could not load saved addresses");
        return;
      }

      const result = await response.json();
      console.log("✅ Customer addresses from API:", result);

      const customerData = result.data || result;

      // Cập nhật chỉ địa chỉ đã lưu, không ghi đè thông tin đã có
      if (customerData.quanHuyens && customerData.quanHuyens.length > 0) {
        setCurrentUser((prev) => ({
          ...prev,
          quanHuyens: customerData.quanHuyens || [],
        }));

        // Auto-fill địa chỉ từ QuanHuyen đầu tiên
        const firstAddress = customerData.quanHuyens[0];
        console.log("✅ Auto-filling address from:", firstAddress);

        if (firstAddress.tinhThanh?.id) {
          setFormData((prev) => ({
            ...prev,
            tinhId: firstAddress.tinhThanh.id.toString(),
            tinhTen: firstAddress.tinhThanh.tenTinh || "",
          }));

          // Đợi districts load xong
          setTimeout(() => {
            if (firstAddress.id) {
              setFormData((prev) => ({
                ...prev,
                quanId: firstAddress.id.toString(),
                quanTen: firstAddress.tenQuan || "",
              }));
            }
          }, 800);
        }

        toast.success("Đã tự động điền địa chỉ từ tài khoản của bạn");
      }
    } catch (error) {
      console.error("❌ Error loading customer addresses:", error);
    }
  };

  // Chọn địa chỉ đã lưu
  const handleSelectSavedAddress = (address) => {
    if (address.tinhThanh?.id) {
      setFormData((prev) => ({
        ...prev,
        tinhId: address.tinhThanh.id.toString(),
        tinhTen: address.tinhThanh.tenTinh || "",
        quanId: "",
        quanTen: "",
      }));

      setTimeout(() => {
        if (address.id) {
          setFormData((prev) => ({
            ...prev,
            quanId: address.id.toString(),
            quanTen: address.tenQuan || "",
          }));
        }
      }, 500);

      toast.success("Đã chọn địa chỉ đã lưu");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProvinceChange = (e) => {
    const selectedId = e.target.value;
    const selectedProvince = provinces.find(
      (p) => p.id === parseInt(selectedId)
    );

    setFormData((prev) => ({
      ...prev,
      tinhId: selectedId,
      tinhTen: selectedProvince ? selectedProvince.tenTinh : "",
      quanId: "",
      quanTen: "",
    }));
  };

  const handleDistrictChange = (e) => {
    const selectedId = e.target.value;
    const selectedDistrict = districts.find(
      (d) => d.id === parseInt(selectedId)
    );

    setFormData((prev) => ({
      ...prev,
      quanId: selectedId,
      quanTen: selectedDistrict ? selectedDistrict.tenQuan : "",
    }));
  };

  const handleSelectVoucher = (voucher) => {
    setAppliedDiscount(voucher);
    setDiscountAmount(voucher.calculatedDiscount);
    setShowVoucherModal(false);
    toast.success(`Đã chọn voucher "${voucher.tenChuongTrinh}"`);
    console.log("✅ Selected voucher:", voucher.tenChuongTrinh);
  };

  const handleRemoveDiscount = () => {
    const otherVouchers = voucherDetails.filter(
      (v) => v.phieuGiamGiaId !== appliedDiscount?.phieuGiamGiaId
    );

    if (otherVouchers.length > 0) {
      const nextBest = otherVouchers.reduce((best, current) =>
        current.calculatedDiscount > best.calculatedDiscount ? current : best
      );
      setAppliedDiscount(nextBest);
      setDiscountAmount(nextBest.calculatedDiscount);
      toast.info(`Đã chuyển sang voucher "${nextBest.tenChuongTrinh}"`);
    } else {
      setAppliedDiscount(null);
      setDiscountAmount(0);
      toast.info("Đã xóa voucher");
    }
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validate form
    if (
      !formData.hoTen ||
      !formData.sdt ||
      !formData.diaChi ||
      !formData.tinhId ||
      !formData.quanId ||
      !formData.phuong
    ) {
      toast.error("Vui lòng điền đầy đủ thông tin địa chỉ.");
      setLoading(false);
      return;
    }

    if (!currentUser && !formData.email) {
      toast.error("Vui lòng nhập email để nhận thông tin đơn hàng.");
      setLoading(false);
      return;
    }

    if (!currentUser && formData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        toast.error("Email không hợp lệ. Vui lòng kiểm tra lại.");
        setLoading(false);
        return;
      }
    }

    const fullAddress = `${formData.diaChi}, ${formData.phuong}, ${formData.quanTen}, ${formData.tinhTen}`;

    const orderData = {
      khachHangId: currentUser ? currentUser.id : null,
      hoTen: formData.hoTen,
      sdt: formData.sdt,
      email: currentUser ? currentUser.email : formData.email,
      diaChiKhachHang: fullAddress,
      tinhId: parseInt(formData.tinhId),
      quanId: parseInt(formData.quanId),
      phuong: formData.phuong,
      diaChiChiTiet: formData.diaChi,
      paymentMethod: formData.paymentMethod,
      phiVanChuyen: 0,
      tongTien: cartTotal,
      phieuGiamGiaId: appliedDiscount ? appliedDiscount.phieuGiamGiaId : null,
      tienGiam: discountAmount,
      items: cartItems.map((item) => ({
        id: item.id,
        quantity: item.quantity,
      })),
    };

    console.log("📦 Submitting order:", orderData);

    try {
      const response = await fetch(
        "http://localhost:8080/api/orders/place-order",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(orderData),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Đặt hàng thất bại");
      }

      console.log("✅ Order placed successfully:", result);

      const responseData = result.data;

      if (responseData && responseData.paymentUrl) {
        toast.success(result.message || "Đang chuyển hướng đến VNPAY...");
        sessionStorage.setItem("checkoutCustomerName", formData.hoTen);

        if (responseData.hoaDon && responseData.hoaDon.maHoaDon) {
          const maHoaDon = responseData.hoaDon.maHoaDon;
          const guestOrders = JSON.parse(
            localStorage.getItem("guestOrderCodes") || "[]"
          );

          if (!guestOrders.includes(maHoaDon)) {
            guestOrders.push(maHoaDon);
          }
          localStorage.setItem("guestOrderCodes", JSON.stringify(guestOrders));
        }

        localStorage.removeItem("cart");
        window.location.href = responseData.paymentUrl;
      } else if (
        responseData &&
        responseData.hoaDon &&
        responseData.hoaDon.maHoaDon
      ) {
        const maHoaDon = responseData.hoaDon.maHoaDon;

        toast.success(result.message || "Đặt hàng thành công!");
        sessionStorage.setItem("checkoutCustomerName", formData.hoTen);

        const guestOrders = JSON.parse(
          localStorage.getItem("guestOrderCodes") || "[]"
        );
        if (!guestOrders.includes(maHoaDon)) {
          guestOrders.push(maHoaDon);
        }
        localStorage.setItem("guestOrderCodes", JSON.stringify(guestOrders));

        localStorage.removeItem("cart");

        setTimeout(() => {
          navigate(`/order-success/${maHoaDon}`);
        }, 1500);
      } else {
        localStorage.removeItem("cart");
        throw new Error(
          "Đặt hàng thành công nhưng không nhận được mã đơn hàng."
        );
      }
    } catch (error) {
      console.error("❌ Order error:", error);
      toast.error(error.message || "Đã xảy ra lỗi, vui lòng thử lại.");
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-orange-50/30 via-white to-orange-50/30 min-h-screen">
      <form
        onSubmit={handlePlaceOrder}
        className="container mx-auto max-w-6xl p-4 md:py-12"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column - Form */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
              {!currentUser ? (
                <div className="mb-6 p-4 bg-orange-50 border border-orange-100 rounded-lg">
                  <p className="text-sm text-gray-700">
                    Đã có tài khoản?
                    <Link
                      to="/customer/login"
                      className="font-semibold text-orange-600 hover:text-orange-700 ml-1 underline"
                    >
                      Đăng nhập ngay
                    </Link>
                  </p>
                </div>
              ) : (
                <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-center gap-2 text-gray-700">
                    <User
                      size={18}
                      weight="duotone"
                      className="text-orange-500"
                    />
                    <span className="text-sm">
                      Đặt hàng với tài khoản:{" "}
                      <strong className="text-orange-600">
                        {currentUser.hoTen || currentUser.email}
                      </strong>
                    </span>
                  </div>
                </div>
              )}

              {/* Địa chỉ giao hàng */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin
                    size={20}
                    weight="duotone"
                    className="text-orange-500"
                  />
                  <h2 className="text-lg font-semibold text-gray-800">
                    Địa chỉ giao hàng
                  </h2>
                </div>

                {/* Địa chỉ đã lưu */}
                {currentUser &&
                  currentUser.quanHuyens &&
                  currentUser.quanHuyens.length > 0 && (
                    <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <MapPin
                          size={16}
                          weight="duotone"
                          className="text-blue-500"
                        />
                        Địa chỉ đã lưu ({currentUser.quanHuyens.length})
                      </p>
                      <div className="space-y-2">
                        {currentUser.quanHuyens.map((address, index) => (
                          <button
                            key={address.id || index}
                            type="button"
                            onClick={() => handleSelectSavedAddress(address)}
                            className={`w-full text-left p-3 rounded-lg border transition-all ${
                              formData.quanId === address.id?.toString()
                                ? "border-blue-500 bg-blue-100"
                                : "border-gray-200 hover:border-blue-300 bg-white"
                            }`}
                          >
                            <p className="text-sm font-medium text-gray-800">
                              {address.tenQuan},{" "}
                              {address.tinhThanh?.tenTinh || ""}
                            </p>
                            {formData.quanId === address.id?.toString() && (
                              <span className="text-xs text-blue-600 font-semibold mt-1 inline-block">
                                ✓ Đang sử dụng
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                      <User
                        size={18}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      />
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
                      <Phone
                        size={18}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      />
                      <input
                        type="tel"
                        placeholder="Số điện thoại"
                        name="sdt"
                        value={formData.sdt}
                        onChange={handleInputChange}
                        pattern="[0-9]{10,11}"
                        title="Vui lòng nhập số điện thoại hợp lệ (10-11 số)"
                        className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all outline-none"
                        required
                      />
                    </div>
                  </div>

                  {!currentUser && (
                    <div className="relative">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        fill="currentColor"
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        viewBox="0 0 256 256"
                      >
                        <path d="M224,48H32a8,8,0,0,0-8,8V192a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A8,8,0,0,0,224,48Zm-96,85.15L52.57,64H203.43ZM98.71,128,40,181.81V74.19Zm11.84,10.85,12,11.05a8,8,0,0,0,10.82,0l12-11.05,58,53.15H52.57ZM157.29,128,216,74.19V181.81Z"></path>
                      </svg>
                      <input
                        type="email"
                        placeholder="Email (để nhận thông tin đơn hàng)"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all outline-none"
                        required
                      />
                    </div>
                  )}

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
                        {loadingProvinces
                          ? "Đang tải..."
                          : "Chọn Tỉnh/Thành phố"}
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

              {/* Phương thức giao hàng */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Package
                    size={20}
                    weight="duotone"
                    className="text-orange-500"
                  />
                  <h2 className="text-lg font-semibold text-gray-800">
                    Phương thức giao hàng
                  </h2>
                </div>

                <label className="flex items-center gap-3 p-4 rounded-lg border-2 border-orange-200 bg-orange-50/50 cursor-pointer">
                  <input
                    type="radio"
                    name="delivery_method"
                    defaultChecked
                    className="w-4 h-4 text-orange-500 focus:ring-orange-400"
                  />
                  <span className="font-medium text-gray-700">
                    Chuyển phát nhanh
                  </span>
                  <span className="ml-auto text-sm text-gray-500">
                    Miễn phí
                  </span>
                </label>
              </div>

              {/* Phương thức thanh toán */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <CreditCard
                    size={20}
                    weight="duotone"
                    className="text-orange-500"
                  />
                  <h2 className="text-lg font-semibold text-gray-800">
                    Phương thức thanh toán
                  </h2>
                </div>

                <div className="space-y-3">
                  <label
                    className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      formData.paymentMethod === "Tiền mặt"
                        ? "border-orange-400 bg-orange-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="Tiền mặt"
                      checked={formData.paymentMethod === "Tiền mặt"}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-orange-500 focus:ring-orange-400"
                    />
                    <div className="flex-grow">
                      <span className="font-medium text-gray-700">
                        Thanh toán khi nhận hàng
                      </span>
                      <span className="block text-xs text-gray-500 mt-0.5">
                        Thanh toán bằng tiền mặt khi nhận hàng
                      </span>
                    </div>
                  </label>

                  <label
                    className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      formData.paymentMethod === "Chuyển khoản"
                        ? "border-orange-400 bg-orange-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="Chuyển khoản"
                      checked={formData.paymentMethod === "Chuyển khoản"}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-orange-500 focus:ring-orange-400"
                    />
                    <div className="flex-grow">
                      <span className="font-medium text-gray-700">
                        Chuyển khoản ngân hàng
                      </span>
                      <span className="block text-xs text-gray-500 mt-0.5">
                        Thanh toán qua cổng VNPAY
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-5">
            <div className="sticky top-24 space-y-4">
              {/* Đơn hàng */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Package
                    size={18}
                    weight="duotone"
                    className="text-orange-500"
                  />
                  Đơn hàng ({cartItems.length} sản phẩm)
                </h3>

                <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                  {cartItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex gap-3 pb-3 border-b border-gray-100 last:border-0"
                    >
                      <img
                        src={item.hinhAnh}
                        alt={item.tenSanPham}
                        className="w-14 h-16 object-cover rounded-lg flex-shrink-0"
                      />
                      <div className="flex-grow min-w-0">
                        <p className="font-medium text-sm text-gray-800 truncate">
                          {item.tenSanPham}
                        </p>
                        <p className="text-xs text-gray-500">
                          Size: {item.size} • SL: {item.quantity}
                        </p>
                        <p className="text-sm font-semibold text-orange-600 mt-1">
                          {formatCurrency(item.gia * item.quantity)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chi tiết thanh toán */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-base font-semibold text-gray-800 mb-4">
                  Chi tiết thanh toán
                </h3>

                {/* Mã giảm giá */}
                <div className="mb-6">
                  {!currentUser ? (
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
                      <Ticket
                        size={20}
                        className="mx-auto mb-2 text-gray-400"
                      />
                      <p className="text-sm text-gray-600 mb-2">
                        Đăng nhập để sử dụng mã giảm giá
                      </p>
                      <Link
                        to="/customer/login"
                        className="text-sm font-semibold text-orange-600 hover:text-orange-700 underline"
                      >
                        Đăng nhập ngay
                      </Link>
                    </div>
                  ) : loadingDiscountCodes ? (
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
                      <p className="text-sm text-gray-600">
                        Đang tải mã giảm giá...
                      </p>
                    </div>
                  ) : voucherDetails.length === 0 ? (
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
                      <Ticket
                        size={20}
                        className="mx-auto mb-2 text-gray-400"
                      />
                      <p className="text-sm text-gray-600">
                        Bạn chưa có mã giảm giá khả dụng
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {appliedDiscount ? (
                        <div className="p-4 bg-gradient-to-r from-orange-50 to-orange-100/50 border-2 border-orange-300 rounded-lg">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3 flex-grow">
                              <div className="mt-1">
                                <Ticket
                                  size={24}
                                  weight="fill"
                                  className="text-orange-600"
                                />
                              </div>
                              <div className="flex-grow">
                                <p className="font-semibold text-gray-800 text-sm mb-1">
                                  {appliedDiscount.tenChuongTrinh}
                                </p>
                                <p className="text-orange-600 font-bold text-base">
                                  -{" "}
                                  {formatCurrency(
                                    appliedDiscount.calculatedDiscount
                                  )}
                                </p>
                                {appliedDiscount.detail
                                  ?.giaTriDonHangToiThieu && (
                                  <p className="text-xs text-gray-600 mt-1">
                                    Đơn tối thiểu:{" "}
                                    {formatCurrency(
                                      appliedDiscount.detail
                                        .giaTriDonHangToiThieu
                                    )}
                                  </p>
                                )}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={handleRemoveDiscount}
                              className="ml-2 text-gray-400 hover:text-red-600 transition-colors"
                            >
                              <X size={18} weight="bold" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
                          <Ticket
                            size={20}
                            className="mx-auto mb-2 text-gray-400"
                          />
                          <p className="text-sm text-gray-600">
                            Chưa chọn voucher nào
                          </p>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => setShowVoucherModal(true)}
                        className="w-full py-2.5 border-2 border-dashed border-orange-300 rounded-lg text-orange-600 font-medium text-sm hover:bg-orange-50 transition-colors flex items-center justify-center gap-2"
                      >
                        <Ticket size={18} weight="bold" />
                        <span>
                          {appliedDiscount
                            ? `Chọn voucher khác (${voucherDetails.length})`
                            : `Chọn voucher (${voucherDetails.length})`}
                        </span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Tổng tiền */}
                <div className="space-y-3 pt-4 border-t border-gray-100">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Tạm tính</span>
                    <span className="font-medium text-gray-800">
                      {formatCurrency(cartTotal)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Phí vận chuyển</span>
                    <span className="font-medium text-green-600">Miễn phí</span>
                  </div>

                  {appliedDiscount && discountAmount > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Giảm giá</span>
                      <span className="font-medium text-green-600">
                        -{formatCurrency(discountAmount)}
                      </span>
                    </div>
                  )}

                  <div className="pt-3 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-gray-700">
                        Tổng cộng
                      </span>
                      <span className="text-2xl font-bold text-orange-600">
                        {formatCurrency(cartTotal - discountAmount)}
                      </span>
                    </div>
                    {appliedDiscount && (
                      <p className="text-xs text-green-600 text-right mt-1">
                        Tiết kiệm {formatCurrency(discountAmount)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Lưu ý */}
                <div className="mt-6 p-3 bg-orange-50 border border-orange-100 rounded-lg">
                  <div className="flex gap-2 text-xs text-gray-600">
                    <Info
                      size={16}
                      weight="fill"
                      className="flex-shrink-0 text-orange-500 mt-0.5"
                    />
                    <p className="leading-relaxed">
                      Sản phẩm giảm giá trên 50% không hỗ trợ đổi trả.
                      <span className="font-semibold text-orange-700">
                        {" "}
                        KHÔNG thanh toán
                      </span>{" "}
                      khi chưa nhận hàng.
                    </p>
                  </div>
                </div>

                {/* Button đặt hàng */}
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

      {/* Voucher Modal */}
      {showVoucherModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[80vh] overflow-hidden shadow-2xl">
            <div className="sticky top-0 bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Ticket size={24} weight="fill" />
                <h3 className="font-bold text-lg">Chọn Voucher</h3>
              </div>
              <button
                onClick={() => setShowVoucherModal(false)}
                className="p-1 hover:bg-white/20 rounded-full transition-colors"
              >
                <X size={24} weight="bold" />
              </button>
            </div>

            <div className="p-4 space-y-3 overflow-y-auto max-h-[calc(80vh-80px)]">
              {/* Không sử dụng voucher */}
              <button
                onClick={() => {
                  setAppliedDiscount(null);
                  setDiscountAmount(0);
                  setShowVoucherModal(false);
                  toast.info("Đã bỏ chọn voucher");
                }}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                  !appliedDiscount
                    ? "border-orange-500 bg-orange-50 shadow-md"
                    : "border-gray-200 hover:border-orange-300 hover:shadow-sm"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-7 h-7 rounded-full border-2 border-gray-300 flex items-center justify-center">
                    {!appliedDiscount && (
                      <Check
                        size={16}
                        weight="bold"
                        className="text-orange-600"
                      />
                    )}
                  </div>
                  <div className="flex-grow">
                    <p className="font-semibold text-gray-800 text-sm">
                      Không sử dụng voucher
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Thanh toán với giá gốc
                    </p>
                  </div>
                </div>
              </button>

              {/* Danh sách voucher */}
              {voucherDetails.map((voucher) => {
                const isSelected =
                  appliedDiscount?.phieuGiamGiaId === voucher.phieuGiamGiaId;
                const isBest =
                  voucher.calculatedDiscount ===
                  Math.max(...voucherDetails.map((v) => v.calculatedDiscount));

                return (
                  <button
                    key={voucher.phieuGiamGiaId}
                    onClick={() => handleSelectVoucher(voucher)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                      isSelected
                        ? "border-orange-500 bg-orange-50 shadow-md"
                        : "border-gray-200 hover:border-orange-300 hover:shadow-sm"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        <Ticket
                          size={28}
                          weight="fill"
                          className={
                            isSelected ? "text-orange-600" : "text-gray-400"
                          }
                        />
                      </div>
                      <div className="flex-grow">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <p className="font-semibold text-gray-800 text-sm leading-tight">
                            {voucher.tenChuongTrinh}
                          </p>
                          {isSelected && (
                            <div className="flex-shrink-0 bg-orange-500 text-white rounded-full p-1">
                              <Check size={14} weight="bold" />
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-orange-600 font-bold text-lg">
                            - {formatCurrency(voucher.calculatedDiscount)}
                          </span>
                          {isBest && (
                            <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded">
                              TỐT NHẤT
                            </span>
                          )}
                        </div>

                        {voucher.detail?.giaTriDonHangToiThieu && (
                          <p className="text-xs text-gray-600 mb-1">
                            📦 Đơn tối thiểu:{" "}
                            {formatCurrency(
                              voucher.detail.giaTriDonHangToiThieu
                            )}
                          </p>
                        )}

                        {voucher.detail?.ngayKetThuc && (
                          <p className="text-xs text-gray-500">
                            ⏰ HSD:{" "}
                            {new Date(
                              voucher.detail.ngayKetThuc
                            ).toLocaleDateString("vi-VN")}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}