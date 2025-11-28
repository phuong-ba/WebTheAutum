import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import hoaDonApi from "@/api/HoaDonAPI";
import { message, Modal, QRCode, Button, Space, Divider } from "antd";
import { useNavigate } from "react-router";
import { getCurrentUserId } from "@/utils/authHelper";
import {
  QrcodeOutlined,
  CopyOutlined,
  CheckOutlined,
  BankOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import {
  tinhPhiVanChuyen,
  fetchDonViVanChuyen,
} from "@/services/vanChuyenService";
import {
  setSelectedShipping,
  resetShippingFee,
} from "@/redux/slices/vanChuyenSlice";

export default function SellPay({
  cartTotal,
  appliedDiscount,
  selectedCustomer,
  onRemoveDiscount,
  cartItems,
  selectedBillId,
  onClearCart,
  isDelivery,
  addressForm,
  tinhList,
  localQuanList,
  removeCustomerFromDiscount,
  discountAmount: propDiscountAmount,
  finalAmount: propFinalAmount,
  triggerShippingCalculation,
  onClearTemporaryData,
}) {
  const dispatch = useDispatch();
  const {
    phiVanChuyen,
    donViVanChuyen,
    loading: shippingLoading,
    selectedShipping,
    error: shippingError,
  } = useSelector((state) => state.vanChuyen);

  const [paymentMethod, setPaymentMethod] = useState(null);
  const [loading, setLoading] = useState(false);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [qrData, setQrData] = useState(null);
  const [copied, setCopied] = useState(false);
  const [pendingHoaDonData, setPendingHoaDonData] = useState(null);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [pendingConfirmData, setPendingConfirmData] = useState(null);

  const discountAmount =
    propDiscountAmount !== undefined
      ? propDiscountAmount
      : appliedDiscount?.discountAmount || 0;
  const actualDiscountAmount = Math.min(discountAmount, cartTotal);
  const finalAmount =
    propFinalAmount !== undefined
      ? propFinalAmount
      : Math.max(cartTotal - actualDiscountAmount, 0);

  const shippingFee = Number(phiVanChuyen) || 0;
  const totalWithShipping = finalAmount + shippingFee;

  const [messageApi, contextHolder] = message.useMessage();
  const navigate = useNavigate();

  // Ref để theo dõi lần tính phí cuối
  const lastShippingCalculationRef = useRef({
    tinh: null,
    quan: null,
    diaChiCuThe: null,
    cartItemsHash: null,
    selectedShipping: null,
  });

  // 1. Lấy danh sách đơn vị vận chuyển
  useEffect(() => {
    dispatch(fetchDonViVanChuyen());
  }, [dispatch]);

  // 2. Chọn GHN làm mặc định khi có danh sách đơn vị
  useEffect(() => {
    if (donViVanChuyen.length > 0 && !selectedShipping) {
      console.log("🔄 Tự động chọn GHN làm đơn vị vận chuyển mặc định");
      dispatch(setSelectedShipping("GHN"));
    }
  }, [donViVanChuyen, selectedShipping, dispatch]);

  // 3. Tự động tính phí khi có đủ điều kiện
  useEffect(() => {
    const shouldCalculateShipping =
      isDelivery && cartItems.length > 0 && selectedShipping && addressForm;

    console.log("🔄 Kiểm tra tính phí tự động:", {
      isDelivery,
      cartItemsCount: cartItems.length,
      selectedShipping,
      shouldCalculateShipping,
    });

    if (shouldCalculateShipping) {
      const timer = setTimeout(() => {
        calculateShippingFee();
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      dispatch(resetShippingFee());
    }
  }, [isDelivery, cartItems, selectedShipping, addressForm]);

  // 4. Tính phí khi địa chỉ thay đổi
  useEffect(() => {
    if (isDelivery && selectedShipping && cartItems.length > 0) {
      const formValues = addressForm?.getFieldsValue();
      if (formValues?.thanhPho && formValues?.quan && formValues?.diaChiCuThe) {
        console.log("📍 Địa chỉ đã đầy đủ, kiểm tra tính phí tự động");

        const currentHash = JSON.stringify({
          tinh: formValues.thanhPho,
          quan: formValues.quan,
          diaChiCuThe: formValues.diaChiCuThe,
          selectedShipping: selectedShipping,
          cartItems: cartItems.map((item) => ({
            id: item.idChiTietSanPham,
            quantity: item.quantity,
          })),
        });

        if (lastShippingCalculationRef.current.cartItemsHash !== currentHash) {
          console.log("🔄 Có thay đổi, tính phí mới");
          lastShippingCalculationRef.current.cartItemsHash = currentHash;

          const timer = setTimeout(() => {
            calculateShippingFee();
          }, 800);
          return () => clearTimeout(timer);
        }
      }
    }
  }, [addressForm, cartItems, isDelivery, selectedShipping]);

  // 5. Tính phí khi component mount
  useEffect(() => {
    // Đặt hàm calculateShippingFee vào global để component cha có thể gọi
    window.SellPayComponent = {
      calculateShippingFee: calculateShippingFee,
    };

    // Tính phí ngay khi component mount nếu có đủ điều kiện
    if (isDelivery && selectedShipping && cartItems.length > 0) {
      const timer = setTimeout(() => {
        calculateShippingFee();
      }, 1500);
      return () => clearTimeout(timer);
    }

    return () => {
      // Cleanup
      window.SellPayComponent = null;
    };
  }, []);

  const parseProductValue = (value, defaultValue = 200) => {
    if (value === null || value === undefined) {
      return defaultValue;
    }

    if (typeof value === "number") {
      return value;
    }

    if (typeof value === "string") {
      const numericString = value.replace(/[^\d]/g, "");
      const parsed = parseInt(numericString, 10);
      return isNaN(parsed) ? defaultValue : parsed;
    }

    return defaultValue;
  };

  // Hàm tính phí vận chuyển
  const calculateShippingFee = async () => {
    console.log("🚀 Bắt đầu tính phí vận chuyển...");

    if (!isDelivery || !addressForm || !selectedShipping) {
      console.log("❌ Thiếu điều kiện tính phí");
      return;
    }

    try {
      const formValues = addressForm.getFieldsValue();

      if (!formValues.thanhPho || !formValues.quan || !formValues.diaChiCuThe) {
        console.log("❌ Thiếu thông tin địa chỉ");
        messageApi.warning(
          "Vui lòng nhập đầy đủ thông tin địa chỉ để tính phí vận chuyển"
        );
        return;
      }

      // Cập nhật thông tin tính phí cuối cùng
      lastShippingCalculationRef.current = {
        tinh: formValues.thanhPho,
        quan: formValues.quan,
        diaChiCuThe: formValues.diaChiCuThe,
        selectedShipping: selectedShipping,
        cartItemsHash: JSON.stringify(
          cartItems.map((item) => ({
            id: item.idChiTietSanPham,
            quantity: item.quantity,
          }))
        ),
      };

      const shippingItems = cartItems.map((item) => {
        const weight = parseProductValue(item.weight, 250);
        const length = parseProductValue(item.length, 30);
        const width = parseProductValue(item.width, 20);
        const height = parseProductValue(item.height, 2);

        return {
          idChiTietSanPham: item.idChiTietSanPham,
          soLuong: item.quantity || 1,
          giaBan: item.unitPrice || item.price || item.giaBan || 0,
          khoiLuong: weight,
          chieuDai: length,
          chieuRong: width,
          chieuCao: height,
        };
      });

      const requestData = {
        donViVanChuyen: selectedShipping,
        idTinhGui: 1,
        idQuanGui: 1442,
        idTinhNhan: formValues.thanhPho,
        idQuanNhan: formValues.quan,
        idPhuongNhan: null,
        diaChiCuThe: formValues.diaChiCuThe,
        items: shippingItems,
      };

      console.log("🚚 Gửi yêu cầu tính phí:", requestData);
      await dispatch(tinhPhiVanChuyen(requestData)).unwrap();
    } catch (error) {
      console.error("❌ Lỗi tính phí vận chuyển:", error);
      messageApi.error("Không thể tính phí vận chuyển. Vui lòng thử lại!");
    }
  };

  const handleSelectShipping = (provider) => {
    console.log(`🔄 Chọn đơn vị vận chuyển: ${provider}`);
    dispatch(setSelectedShipping(provider));

    // Tính phí ngay sau khi chọn đơn vị vận chuyển
    setTimeout(() => {
      calculateShippingFee();
    }, 500);
  };

  const handleRemovePersonalDiscountAfterPayment = async () => {
    if (appliedDiscount?.isPersonal && appliedDiscount?.customerId) {
      try {
        await removeCustomerFromDiscount(
          appliedDiscount.id,
          appliedDiscount.customerId
        );
      } catch (error) {
        console.error("❌ Lỗi khi xoá phiếu giảm giá cá nhân:", error);
      }
    }
  };

  // QUAN TRỌNG: Sửa hàm prepareHoaDonData để lưu đúng thông tin từ form
  const prepareHoaDonData = (paymentInfo = {}) => {
    let shippingAddress = null;
    let formCustomerInfo = null;

    // Lấy giá trị từ form - SỬA LỖI QUAN TRỌNG: sử dụng đúng tên field
    const formValues = addressForm?.getFieldsValue() || {};

    console.log("🔍 DEBUG - Form values:", formValues);
    console.log("🔍 DEBUG - Selected customer:", selectedCustomer);

    // Xác định xem có phải khách hàng tạm không
    const isTemporaryCustomer = selectedCustomer?.isTemporary;

    if (isDelivery && addressForm) {
      try {
        if (formValues.thanhPho && formValues.quan && formValues.diaChiCuThe) {
          const tinhName =
            tinhList?.find((t) => t.id === formValues.thanhPho)?.tenTinh || "";
          const quanName =
            localQuanList?.find((q) => q.id === formValues.quan)?.tenQuan || "";

          // QUAN TRỌNG: Sửa lỗi - sử dụng đúng tên field từ form (HoTen, SoDienThoai)
          formCustomerInfo = {
            hoTen: formValues.HoTen || "Khách lẻ", // Sửa từ formValues.hoTen -> formValues.HoTen
            sdt: formValues.SoDienThoai || "", // Sửa từ formValues.sdt -> formValues.SoDienThoai
            isTemporary: isTemporaryCustomer,
          };

          shippingAddress = {
            fullAddress: `${formValues.diaChiCuThe}, ${quanName}, ${tinhName}`,
            idTinh: formValues.thanhPho,
            idQuan: formValues.quan,
            diaChiCuThe: formValues.diaChiCuThe,
            hoTen: formCustomerInfo.hoTen,
            sdt: formCustomerInfo.sdt,
          };
        }
      } catch (error) {
        console.error("❌ Lỗi khi lấy giá trị form:", error);
      }
    }

    let chiTietList = [];
    if (cartItems && cartItems.length > 0) {
      chiTietList = cartItems.map((item) => ({
        idChiTietSanPham: item.idChiTietSanPham,
        soLuong: item.quantity || 1,
        giaBan: item.unitPrice || item.price || item.giaBan || 0,
        ghiChu: item.ghiChu || "",
        trangThai: 0,
      }));
    }

    if (chiTietList.length === 0) {
      return null;
    }

    const currentUserId = getCurrentUserId();

    let diaChiKhachHang = "Chưa có địa chỉ";
    let idTinh = null;
    let idQuan = null;
    let diaChiCuThe = "";

    if (shippingAddress) {
      diaChiKhachHang = shippingAddress.fullAddress;
      idTinh = shippingAddress.idTinh;
      idQuan = shippingAddress.idQuan;
      diaChiCuThe = shippingAddress.diaChiCuThe;
    } else if (selectedCustomer?.diaChi && !isTemporaryCustomer) {
      const customerAddress = selectedCustomer.diaChi;
      diaChiKhachHang =
        customerAddress.dia_chi_cu_the ||
        customerAddress.diaChiCuThe ||
        "Chưa có địa chỉ";
      idTinh =
        customerAddress.tinhThanhId ||
        customerAddress.id_tinh ||
        customerAddress.idTinh;
      idQuan =
        customerAddress.quanHuyenId ||
        customerAddress.id_quan ||
        customerAddress.idQuan;
      diaChiCuThe =
        customerAddress.dia_chi_cu_the || customerAddress.diaChiCuThe || "";
    }

    let idPhuongThucThanhToan;
    let paymentNote = "";

    switch (paymentMethod) {
      case "Tiền mặt":
        idPhuongThucThanhToan = 1;
        paymentNote = "Thanh toán bằng tiền mặt";
        break;
      case "Chuyển khoản":
        idPhuongThucThanhToan = 2;
        paymentNote = "Thanh toán bằng chuyển khoản QR";
        break;
      case "Cả hai":
        idPhuongThucThanhToan = 3;
        paymentNote = "Thanh toán kết hợp: Tiền mặt + Chuyển khoản QR";
        break;
      default:
        idPhuongThucThanhToan = 3;
    }

    const customerName =
      formValues.HoTen || selectedCustomer?.hoTen || "Khách lẻ";
    const customerPhone = formValues.SoDienThoai || selectedCustomer?.sdt || "";

    const customerType = isTemporaryCustomer
      ? "Khách hàng tạm"
      : selectedCustomer
      ? "Khách hàng"
      : "Khách lẻ";

    const customerNote =
      customerName !== "Khách lẻ"
        ? ` - ${customerName}${customerPhone ? ` - ${customerPhone}` : ""}`
        : "";

    const shippingNote = isDelivery
      ? ` - Phí vận chuyển ${selectedShipping}: ${shippingFee.toLocaleString()} VND`
      : "";

    // Tạo đối tượng request data
    const requestData = {
      loaiHoaDon: true,
      phiVanChuyen: isDelivery ? shippingFee : 0,
      tongTien: cartTotal,
      tongTienSauGiam: finalAmount,
      ghiChu: `${
        isDelivery ? "Bán giao hàng - " : "Bán tại quầy - "
      }${customerType}${customerNote} - ${paymentNote}${
        appliedDiscount?.code ? `, mã giảm ${appliedDiscount.code}` : ""
      }${shippingNote}`,
      diaChiKhachHang,
      ngayThanhToan: new Date().toISOString(),
      trangThai: isDelivery ? 1 : 3,
      idNhanVien: currentUserId,
      idPhieuGiamGia: appliedDiscount?.id || null,
      nguoiTao: currentUserId,
      chiTietList,
      idPhuongThucThanhToan,
      soTienThanhToan: totalWithShipping,
      idTinh,
      idQuan,
      diaChiCuThe,
      hoTen: customerName, // QUAN TRỌNG: Gửi tên khách hàng từ form
      sdt: customerPhone, // QUAN TRỌNG: Gửi số điện thoại từ form
      donViVanChuyen: isDelivery ? selectedShipping : null,
      tongTienHang: cartTotal,
      tienGiamGia: actualDiscountAmount,
      phiVanChuyen: isDelivery ? shippingFee : 0,
      ...paymentInfo,
    };

    // QUAN TRỌNG: Xử lý trường hợp khách hàng tạm - KHÔNG gửi idKhachHang
    if (
      isTemporaryCustomer ||
      !selectedCustomer ||
      selectedCustomer?.isTemporary
    ) {
      // Khách hàng tạm hoặc khách lẻ - KHÔNG gửi idKhachHang để backend không gán vào khách lẻ mặc định
      console.log("🆕 Tạo hóa đơn cho khách hàng tạm/khách lẻ:", {
        hoTen: customerName,
        sdt: customerPhone,
        idKhachHang: "KHÔNG GỬI",
      });
    } else {
      // Khách hàng đã có trong hệ thống
      requestData.idKhachHang = selectedCustomer.id;
      console.log("👤 Tạo hóa đơn cho khách hàng có sẵn:", selectedCustomer.id);
    }

    console.log("📦 Dữ liệu gửi lên server:", requestData);
    return requestData;
  };

  // Hàm xử lý thanh toán thành công - bao gồm xóa dữ liệu tạm
  const handlePaymentSuccess = () => {
    // Xóa dữ liệu tạm
    if (onClearTemporaryData) {
      onClearTemporaryData();
    }

    if (selectedBillId) {
      const bills = JSON.parse(localStorage.getItem("pendingBills")) || [];
      const updatedBills = bills.filter((bill) => bill.id !== selectedBillId);
      localStorage.setItem("pendingBills", JSON.stringify(updatedBills));
      window.dispatchEvent(new Event("billsUpdated"));
    }

    if (onRemoveDiscount) onRemoveDiscount();
    if (onClearCart) onClearCart();

    if (appliedDiscount?.isPersonal) {
      handleRemovePersonalDiscountAfterPayment();
    }
  };

  const renderShippingOptions = () => {
    if (!isDelivery) return null;

    return (
      <div className="mb-4">
        <div className="font-bold mb-2">Chọn đơn vị vận chuyển:</div>
        <div className="flex gap-4">
          {donViVanChuyen.map((provider) => (
            <div
              key={provider}
              className={`cursor-pointer p-3 border rounded-lg flex-1 text-center transition-all ${
                selectedShipping === provider
                  ? "border-amber-600 bg-amber-50 text-amber-700 shadow-md"
                  : "border-gray-300 hover:border-amber-400 hover:shadow-sm"
              }`}
              onClick={() => handleSelectShipping(provider)}
            >
              <div className="font-semibold">{provider}</div>
              <div className="text-sm text-gray-600">
                {provider === "GHN"
                  ? "Nhanh chóng, tin cậy"
                  : "Tiết kiệm chi phí"}
              </div>
            </div>
          ))}
        </div>

        {shippingError && (
          <div className="mt-2 text-red-600 text-sm">{shippingError}</div>
        )}

        {shippingLoading && (
          <div className="mt-2 text-amber-600 text-sm">
            Đang tính phí vận chuyển {selectedShipping}...
          </div>
        )}

        {/* Nút tính lại phí thủ công */}
        <div className="mt-3 flex justify-end">
          <Button
            size="small"
            icon={<ReloadOutlined />}
            onClick={calculateShippingFee}
            loading={shippingLoading}
            className="flex items-center gap-1"
          >
            Tính lại phí vận chuyển
          </Button>
        </div>
      </div>
    );
  };

  const renderShippingInfo = () => {
    if (!isDelivery) return null;

    return (
      <div className="flex justify-between font-bold">
        <span>Phí vận chuyển ({selectedShipping || "Chưa chọn"}):</span>
        <span>
          {shippingLoading ? (
            <span className="text-gray-500">Đang tính...</span>
          ) : shippingError ? (
            <span className="text-red-600">Lỗi: {shippingError}</span>
          ) : shippingFee === 0 ? (
            <span className="text-green-600">Miễn phí</span>
          ) : (
            <span>{shippingFee.toLocaleString()} vnd</span>
          )}
        </span>
      </div>
    );
  };

  const showQRModal = (hoaDonMoi) => {
    setPendingHoaDonData(hoaDonMoi);

    setQrData({
      amount: totalWithShipping,
      billCode: `HD${Date.now()}`,
      bankInfo: {
        bankName: "Ngân hàng ABC",
        accountNumber: "19037689713019",
        accountHolder: "THE AUTUMN STORE",
        branch: "HÀ NỘI",
        content: `Thanh toan don hang ${Date.now()}`,
      },
    });
    setQrModalVisible(true);
  };

  const handleConfirmTransfer = async () => {
    if (!pendingHoaDonData) {
      messageApi.error("❌ Không tìm thấy thông tin hóa đơn!");
      return;
    }

    try {
      setLoading(true);
      const res = await hoaDonApi.create({
        ...pendingHoaDonData,
        trangThai: isDelivery ? 1 : 3,
        daThanhToan: true,
      });

      if (res.data?.isSuccess) {
        const successMessage = isDelivery
          ? "✅ Thanh toán thành công! Đơn hàng đang chờ giao hàng."
          : "✅ Thanh toán thành công! Đơn hàng đã hoàn tất.";

        messageApi.success(successMessage);

        handlePaymentSuccess();

        setQrModalVisible(false);

        const newBillId = res.data.data?.id || res.data.data;
        if (newBillId) {
          navigate(`/admin/detail-bill/${newBillId}`);
        }
      } else {
        messageApi.error(
          "❌ Lỗi khi lưu hóa đơn: " + (res.data?.message || "")
        );
      }
    } catch (error) {
      console.error("❌ Lỗi khi xác nhận chuyển khoản:", error);
      messageApi.error("❌ Lỗi khi xác nhận thanh toán!");
    } finally {
      setLoading(false);
    }
  };

  const handleBothPayment = async (hoaDonMoi) => {
    try {
      setLoading(true);
      const res = await hoaDonApi.create({
        ...hoaDonMoi,
        trangThai: isDelivery ? 1 : 3,
        daThanhToan: true,
      });

      if (res.data?.isSuccess) {
        const successMessage = isDelivery
          ? "✅ Đặt hàng thành công! Đơn hàng đang chờ giao hàng."
          : "✅ Thanh toán thành công! Đơn hàng đã hoàn tất.";

        messageApi.success(successMessage);

        handlePaymentSuccess();

        const newBillId = res.data.data?.id || res.data.data;
        if (newBillId) {
          navigate(`/admin/detail-bill/${newBillId}`);
        }
      } else {
        messageApi.error(
          "❌ Lỗi khi lưu hóa đơn: " + (res.data?.message || "")
        );
      }
    } catch (error) {
      console.error(error);
      messageApi.error("❌ Lỗi khi thanh toán!");
    } finally {
      setLoading(false);
    }
  };

  const handleCashPayment = async (hoaDonMoi) => {
    try {
      setLoading(true);
      const res = await hoaDonApi.create(hoaDonMoi);

      if (res.data?.isSuccess) {
        const successMessage = isDelivery
          ? "✅ Đặt hàng thành công! Đơn hàng đang chờ giao hàng."
          : "✅ Thanh toán thành công! Đơn hàng đã hoàn tất.";

        messageApi.success(successMessage);

        handlePaymentSuccess();

        const newBillId = res.data.data?.id || res.data.data;
        if (newBillId) {
          navigate(`/admin/detail-bill/${newBillId}`);
        }
      } else {
        messageApi.error(
          "❌ Lỗi khi lưu hóa đơn: " + (res.data?.message || "")
        );
      }
    } catch (error) {
      console.error(error);
      messageApi.error("❌ Lỗi khi thanh toán!");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      messageApi.success("✅ Đã sao chép vào clipboard!");
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handlePayment = async () => {
    if (cartTotal === 0) {
      messageApi.warning(
        "Giỏ hàng đang trống! Vui lòng thêm sản phẩm trước khi thanh toán."
      );
      return;
    }

    if (!paymentMethod) {
      messageApi.warning("Vui lòng chọn phương thức thanh toán!");
      return;
    }

    if (isDelivery && addressForm) {
      const formValues = addressForm.getFieldsValue();
      if (!formValues.thanhPho || !formValues.quan || !formValues.diaChiCuThe) {
        messageApi.warning("Vui lòng nhập đầy đủ thông tin địa chỉ giao hàng!");
        return;
      }
    }

    if (isDelivery && shippingLoading) {
      messageApi.warning("Vui lòng chờ tính phí vận chuyển hoàn tất!");
      return;
    }

    const hoaDonMoi = prepareHoaDonData();
    if (!hoaDonMoi || !hoaDonMoi.chiTietList?.length) {
      messageApi.error("❌ Không có sản phẩm trong giỏ hàng!");
      return;
    }

    const formValues = addressForm?.getFieldsValue() || {};
    const customerName =
      formValues.HoTen || selectedCustomer?.hoTen || "Khách lẻ";
    const customerPhone = formValues.SoDienThoai || selectedCustomer?.sdt || "";

    setPendingConfirmData({
      customerName: customerName, // Sửa: Ưu tiên lấy từ form
      customerPhone: customerPhone, // Sửa: Ưu tiên lấy từ form
      isDelivery,
      cartTotal,
      discountAmount: actualDiscountAmount,
      shippingFee: shippingFee,
      totalWithShipping,
      appliedDiscountCode: appliedDiscount?.code,
      paymentMethod,
      shippingProvider: selectedShipping,
      hoaDonMoi,
    });
    setConfirmModalVisible(true);
  };

  const paymentOptions = ["Chuyển khoản", "Tiền mặt", "Cả hai"];

  return (
    <>
      {contextHolder}

      {renderShippingOptions()}

      <div className="bg-gray-50 p-5 rounded-lg border-l-4 border border-amber-700 shadow-sm">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <div className="flex justify-between font-bold text-gray-700">
              <span>Tổng tiền hàng:</span>
              <span>{cartTotal.toLocaleString()} vnd</span>
            </div>
            <div className="flex justify-between font-bold text-gray-700">
              <span>Giảm giá:</span>
              <span className="text-red-600">
                -{actualDiscountAmount.toLocaleString()} vnd
              </span>
            </div>
            {isDelivery && renderShippingInfo()}
          </div>
          <div className="border-t border-gray-300 pt-3">
            <div className="flex justify-between font-bold text-lg text-amber-700">
              <span>Tổng thanh toán:</span>
              <span className="text-amber-600">
                {totalWithShipping.toLocaleString()} vnd
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 mt-4">
        <div className="font-bold text-gray-700">Phương thức thanh toán:</div>
        <div className="flex gap-2">
          {paymentOptions.map((option) => (
            <div
              key={option}
              onClick={() => setPaymentMethod(option)}
              className={`cursor-pointer select-none text-center py-2 px-6 rounded-xl font-bold border shadow transition-all ${
                paymentMethod === option
                  ? "bg-amber-600 text-white border-amber-600 shadow-md"
                  : "text-amber-600 hover:text-white hover:bg-amber-500 border-gray-300 hover:shadow-sm"
              }`}
            >
              {option}
            </div>
          ))}
        </div>
      </div>

      <div
        onClick={handlePayment}
        className={`cursor-pointer select-none text-center py-3 rounded-xl font-bold text-white shadow mt-4 transition-all ${
          loading || shippingLoading
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-[#E67E22] hover:bg-amber-600 active:bg-amber-700 hover:shadow-md"
        }`}
      >
        {loading || shippingLoading
          ? "Đang xử lý..."
          : isDelivery
          ? "Đặt hàng"
          : "Thanh toán"}
      </div>

      {/* Modal QR Code */}
      <Modal
        title={
          <Space>
            <QrcodeOutlined />
            <span className="font-bold">Thanh toán bằng QR Code</span>
          </Space>
        }
        open={qrModalVisible}
        onCancel={() => setQrModalVisible(false)}
        footer={null}
        width={500}
        centered
        className="qr-modal"
      >
        {qrData && (
          <div className="text-center">
            <div className="mb-4">
              <span className="font-bold text-lg text-gray-800">
                Số tiền: {qrData.amount.toLocaleString()} VND
              </span>
            </div>

            <div className="flex justify-center mb-4">
              <QRCode
                value={`${qrData.bankInfo.accountNumber}|${qrData.amount}|${qrData.bankInfo.content}`}
                size={200}
                className="border rounded-lg p-2 bg-white"
              />
            </div>

            <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <span className="text-blue-700 text-sm">
                Quét mã QR để lấy thông tin chuyển khoản hoặc chuyển khoản thủ
                công theo thông tin bên dưới
              </span>
            </div>

            <Divider className="my-4">Thông tin chuyển khoản</Divider>

            <div className="text-left mb-4">
              <Space
                direction="vertical"
                size="small"
                style={{ width: "100%" }}
              >
                <div className="flex justify-between items-center py-1">
                  <span className="font-bold text-gray-700">Ngân hàng:</span>
                  <span>{qrData.bankInfo.bankName}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="font-bold text-gray-700">Số tài khoản:</span>
                  <Space>
                    <span className="font-mono">
                      {qrData.bankInfo.accountNumber}
                    </span>
                    <Button
                      size="small"
                      icon={copied ? <CheckOutlined /> : <CopyOutlined />}
                      onClick={() =>
                        copyToClipboard(qrData.bankInfo.accountNumber)
                      }
                      className="flex items-center"
                    >
                      {copied ? "Đã copy" : "Copy"}
                    </Button>
                  </Space>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="font-bold text-gray-700">
                    Chủ tài khoản:
                  </span>
                  <span className="font-semibold">
                    {qrData.bankInfo.accountHolder}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="font-bold text-gray-700">Chi nhánh:</span>
                  <span>{qrData.bankInfo.branch}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="font-bold text-gray-700">Nội dung:</span>
                  <Space>
                    <span className="text-sm">{qrData.bankInfo.content}</span>
                    <Button
                      size="small"
                      icon={copied ? <CheckOutlined /> : <CopyOutlined />}
                      onClick={() => copyToClipboard(qrData.bankInfo.content)}
                      className="flex items-center"
                    >
                      {copied ? "Đã copy" : "Copy"}
                    </Button>
                  </Space>
                </div>
                <div className="flex justify-between items-center py-1 border-t border-gray-200 mt-2 pt-2">
                  <span className="font-bold text-gray-700">Số tiền:</span>
                  <span className="font-bold text-red-600 text-lg">
                    {qrData.amount.toLocaleString()} VND
                  </span>
                </div>
              </Space>
            </div>

            <div className="flex gap-2 justify-center pt-2">
              <Button onClick={() => setQrModalVisible(false)} className="px-6">
                Hủy
              </Button>
              <Button
                type="primary"
                icon={<BankOutlined />}
                loading={loading}
                onClick={handleConfirmTransfer}
                className="px-6 bg-green-600 hover:bg-green-700"
              >
                Đã chuyển khoản
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal xác nhận thanh toán */}
      <Modal
        title={
          <div className="text-xl font-bold text-gray-800">
            Xác nhận thanh toán
          </div>
        }
        open={confirmModalVisible}
        onCancel={() => setConfirmModalVisible(false)}
        footer={null}
        width={600}
        centered
      >
        {pendingConfirmData && (
          <div className="space-y-4">
            <div className="border rounded-lg p-4 bg-gray-50 space-y-3 shadow-sm">
              <div className="flex justify-between">
                <span className="font-medium text-gray-700">Khách hàng:</span>
                <span className="font-bold text-gray-900">
                  {pendingConfirmData.customerName}
                  {selectedCustomer?.isTemporary}
                </span>
              </div>
              {pendingConfirmData.customerPhone && (
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700">
                    Số điện thoại:
                  </span>
                  <span className="text-gray-900">
                    {pendingConfirmData.customerPhone}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="font-medium text-gray-700">
                  Hình thức mua:
                </span>
                <span className="font-bold text-amber-600">
                  {pendingConfirmData.isDelivery ? "Giao hàng" : "Mua tại quầy"}
                </span>
              </div>
              {pendingConfirmData.isDelivery && (
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700">
                    Đơn vị vận chuyển:
                  </span>
                  <span className="font-semibold text-blue-600">
                    {pendingConfirmData.shippingProvider}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="font-medium text-gray-700">
                  Tổng tiền hàng:
                </span>
                <span className="font-bold text-gray-900">
                  {pendingConfirmData.cartTotal.toLocaleString()} VND
                </span>
              </div>
              <div className="flex justify-between text-red-600">
                <span className="font-medium">Giảm giá:</span>
                <span className="font-semibold">
                  -{pendingConfirmData.discountAmount.toLocaleString()} VND
                </span>
              </div>
              {pendingConfirmData.isDelivery && (
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700">
                    Phí vận chuyển:
                  </span>
                  <span className="font-semibold text-green-600">
                    {pendingConfirmData.shippingFee.toLocaleString()} VND
                  </span>
                </div>
              )}
              <div className="flex justify-between font-bold text-amber-600 text-lg border-t border-gray-300 pt-2">
                <span>Thành tiền:</span>
                <span>
                  {pendingConfirmData.totalWithShipping.toLocaleString()} VND
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-700">Mã giảm giá:</span>
                <span
                  className={
                    pendingConfirmData.appliedDiscountCode
                      ? "text-green-600 font-semibold"
                      : "text-gray-500"
                  }
                >
                  {pendingConfirmData.appliedDiscountCode || "Không áp dụng"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-700">
                  Phương thức thanh toán:
                </span>
                <span className="font-semibold text-purple-600">
                  {pendingConfirmData.paymentMethod}
                </span>
              </div>
            </div>
            <div className="text-center text-red-600 font-semibold text-lg">
              Bạn có chắc chắn muốn thanh toán?
            </div>
            <div className="flex justify-center gap-6 w-full pt-2">
              <div
                className="w-40 cursor-pointer select-none text-center py-3 rounded-xl bg-gray-400 font-bold text-white hover:bg-red-500 active:bg-red-700 border shadow transition-all"
                onClick={() => setConfirmModalVisible(false)}
              >
                Hủy
              </div>
              <div
                className="w-40 cursor-pointer select-none text-center py-3 rounded-xl bg-[#E67E22] font-bold text-white hover:bg-amber-600 active:bg-amber-700 border shadow transition-all"
                onClick={async () => {
                  setConfirmModalVisible(false);
                  const { hoaDonMoi } = pendingConfirmData;
                  if (!hoaDonMoi) return;

                  if (paymentMethod === "Chuyển khoản") {
                    showQRModal(hoaDonMoi);
                  } else if (paymentMethod === "Cả hai") {
                    await handleBothPayment(hoaDonMoi);
                  } else {
                    await handleCashPayment(hoaDonMoi);
                  }
                }}
              >
                Xác nhận
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
