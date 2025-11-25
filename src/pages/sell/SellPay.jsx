import React, { useState, useEffect } from "react";
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

  // 1. Lấy danh sách đơn vị vận chuyển và chọn mặc định
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
      // Thêm debounce để tránh tính quá nhiều lần
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
        console.log("📍 Địa chỉ đã đầy đủ, tính phí tự động");
        const timer = setTimeout(() => {
          calculateShippingFee();
        }, 800);
        return () => clearTimeout(timer);
      }
    }
  }, [addressForm]);

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

  const calculateShippingFee = async () => {
    console.log("🚀 Bắt đầu tính phí vận chuyển tự động...");

    if (!isDelivery || !addressForm || !selectedShipping) {
      console.log("❌ Thiếu điều kiện tính phí");
      return;
    }

    try {
      const formValues = addressForm.getFieldsValue();

      if (!formValues.thanhPho || !formValues.quan || !formValues.diaChiCuThe) {
        console.log("❌ Thiếu thông tin địa chỉ");
        return;
      }

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

      console.log("🚚 Gửi yêu cầu tính phí tự động:", requestData);
      await dispatch(tinhPhiVanChuyen(requestData)).unwrap();
      console.log("✅ Tính phí tự động thành công");
    } catch (error) {
      console.error("❌ Lỗi tính phí vận chuyển tự động:", error);
    }
  };

  const handleSelectShipping = (provider) => {
    console.log(`🔄 Chọn đơn vị vận chuyển: ${provider}`);
    dispatch(setSelectedShipping(provider));
    // Không cần gọi calculateShippingFee() ở đây vì useEffect sẽ tự động tính
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

  const prepareHoaDonData = (paymentInfo = {}) => {
    let shippingAddress = null;
    let formCustomerInfo = null;

    if (isDelivery && addressForm) {
      try {
        const formValues = addressForm.getFieldsValue();
        if (formValues.thanhPho && formValues.quan && formValues.diaChiCuThe) {
          const tinhName =
            tinhList?.find((t) => t.id === formValues.thanhPho)?.tenTinh || "";
          const quanName =
            localQuanList?.find((q) => q.id === formValues.quan)?.tenQuan || "";

          formCustomerInfo = {
            hoTen: formValues.hoTen || "Khách lẻ",
            sdt: formValues.sdt || "",
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
    } else if (selectedCustomer?.diaChi) {
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

    const customerType = selectedCustomer ? "Khách hàng" : "Khách lẻ";
    const customerNote = formCustomerInfo
      ? ` - ${formCustomerInfo.hoTen}${
          formCustomerInfo.sdt ? ` - ${formCustomerInfo.sdt}` : ""
        }`
      : "";

    const shippingNote = isDelivery
      ? ` - Phí vận chuyển ${selectedShipping}: ${shippingFee.toLocaleString()} VND`
      : "";

    return {
      loaiHoaDon: true,
      phiVanChuyen: isDelivery ? shippingFee : 0,
      tongTien: cartTotal,
      tongTienSauGiam: finalAmount,
      ghiChu: `${
        isDelivery ? "Bán giao hàng - " : "Bán tại quầy - "
      }${customerType}${customerNote} - ${paymentNote}${
        appliedDiscount?.code ? `, mã giảm ${appliedDiscount.code}` : ""
      }${
        isDelivery
          ? ` - Phí vận chuyển ${selectedShipping}: ${shippingFee.toLocaleString()} VND`
          : ""
      }`,
      diaChiKhachHang,
      ngayThanhToan: new Date().toISOString(),
      trangThai: isDelivery ? 1 : 3,
      idKhachHang: selectedCustomer?.id || null,
      idNhanVien: currentUserId,
      idPhieuGiamGia: appliedDiscount?.id || null,
      nguoiTao: currentUserId,
      chiTietList,
      idPhuongThucThanhToan,
      soTienThanhToan: totalWithShipping,
      idTinh,
      idQuan,
      diaChiCuThe,
      hoTen: formCustomerInfo?.hoTen || null,
      sdt: formCustomerInfo?.sdt || null,
      donViVanChuyen: isDelivery ? selectedShipping : null,
      tongTienHang: cartTotal,
      tienGiamGia: actualDiscountAmount,
      phiVanChuyen: isDelivery ? shippingFee : 0,
      ...paymentInfo,
    };
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
              className={`cursor-pointer p-3 border rounded-lg flex-1 text-center ${
                selectedShipping === provider
                  ? "border-amber-600 bg-amber-50 text-amber-700"
                  : "border-gray-300 hover:border-amber-400"
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

        if (selectedBillId) {
          const bills = JSON.parse(localStorage.getItem("pendingBills")) || [];
          const updatedBills = bills.filter(
            (bill) => bill.id !== selectedBillId
          );
          localStorage.setItem("pendingBills", JSON.stringify(updatedBills));
          window.dispatchEvent(new Event("billsUpdated"));
        }

        if (onRemoveDiscount) onRemoveDiscount();
        if (onClearCart) onClearCart();

        if (appliedDiscount?.isPersonal) {
          await handleRemovePersonalDiscountAfterPayment();
        }

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

        if (selectedBillId) {
          const bills = JSON.parse(localStorage.getItem("pendingBills")) || [];
          const updatedBills = bills.filter(
            (bill) => bill.id !== selectedBillId
          );
          localStorage.setItem("pendingBills", JSON.stringify(updatedBills));
          window.dispatchEvent(new Event("billsUpdated"));
        }

        if (onRemoveDiscount) onRemoveDiscount();
        if (onClearCart) onClearCart();

        if (appliedDiscount?.isPersonal) {
          await handleRemovePersonalDiscountAfterPayment();
        }

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

        if (selectedBillId) {
          const bills = JSON.parse(localStorage.getItem("pendingBills")) || [];
          const updatedBills = bills.filter(
            (bill) => bill.id !== selectedBillId
          );
          localStorage.setItem("pendingBills", JSON.stringify(updatedBills));
          window.dispatchEvent(new Event("billsUpdated"));
        }

        if (onRemoveDiscount) onRemoveDiscount();
        if (onClearCart) onClearCart();

        if (appliedDiscount?.isPersonal) {
          await handleRemovePersonalDiscountAfterPayment();
        }

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

    // Đảm bảo phí vận chuyển đã được tính xong
    if (isDelivery && shippingLoading) {
      messageApi.warning("Vui lòng chờ tính phí vận chuyển hoàn tất!");
      return;
    }

    const hoaDonMoi = prepareHoaDonData();
    if (!hoaDonMoi || !hoaDonMoi.chiTietList?.length) {
      messageApi.error("❌ Không có sản phẩm trong giỏ hàng!");
      return;
    }

    setPendingConfirmData({
      customerName: selectedCustomer?.hoTen || "Khách lẻ",
      customerPhone: selectedCustomer?.sdt || "",
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

      <div className="bg-gray-50 p-5 rounded-lg border-l-4 border border-amber-700">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-4">
            <div className="flex justify-between font-bold">
              <span>Tổng tiền hàng:</span>
              <span>{cartTotal.toLocaleString()} vnd</span>
            </div>
            <div className="flex justify-between font-bold">
              <span>Giảm giá:</span>
              <span className="text-red-800">
                -{actualDiscountAmount.toLocaleString()} vnd
              </span>
            </div>
            {isDelivery && renderShippingInfo()}
          </div>
          <div className="flex justify-between font-bold text-lg">
            <span>Tổng thanh toán:</span>
            <span className="text-amber-600">
              {totalWithShipping.toLocaleString()} vnd
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="font-bold">Phương thức thanh toán:</div>
        <div className="flex gap-2">
          {paymentOptions.map((option) => (
            <div
              key={option}
              onClick={() => setPaymentMethod(option)}
              className={`cursor-pointer select-none text-center py-2 px-6 rounded-xl bg-[#FFF] font-bold border shadow ${
                paymentMethod === option
                  ? "bg-amber-600 text-white border-amber-600"
                  : "text-amber-600 hover:text-white hover:bg-amber-600 border-gray-300"
              }`}
            >
              {option}
            </div>
          ))}
        </div>
      </div>

      <div
        onClick={handlePayment}
        className={`cursor-pointer select-none text-center py-3 rounded-xl font-bold text-white shadow ${
          loading || shippingLoading
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-[#E67E22] hover:bg-amber-600 active:bg-cyan-800"
        }`}
      >
        {loading || shippingLoading
          ? "Đang xử lý..."
          : isDelivery
          ? "Đặt hàng"
          : "Thanh toán"}
      </div>

      <Modal
        title={
          <Space>
            <QrcodeOutlined />
            <span>Thanh toán bằng QR Code</span>
          </Space>
        }
        open={qrModalVisible}
        onCancel={() => setQrModalVisible(false)}
        footer={null}
        width={500}
        centered
      >
        {qrData && (
          <div className="text-center">
            <div className="mb-4">
              <span className="font-bold text-lg">
                Số tiền: {qrData.amount.toLocaleString()} VND
              </span>
            </div>

            <div className="flex justify-center mb-4">
              <QRCode
                value={`${qrData.bankInfo.accountNumber}|${qrData.amount}|${qrData.bankInfo.content}`}
                size={200}
              />
            </div>

            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-500">
                Quét mã QR để lấy thông tin chuyển khoản hoặc chuyển khoản thủ
                công theo thông tin bên dưới
              </span>
            </div>

            <Divider>Thông tin chuyển khoản</Divider>

            <div className="text-left mb-4">
              <Space
                direction="vertical"
                size="small"
                style={{ width: "100%" }}
              >
                <div className="flex justify-between">
                  <span className="font-bold">Ngân hàng:</span>
                  <span>{qrData.bankInfo.bankName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold">Số tài khoản:</span>
                  <Space>
                    <span>{qrData.bankInfo.accountNumber}</span>
                    <Button
                      size="small"
                      icon={copied ? <CheckOutlined /> : <CopyOutlined />}
                      onClick={() =>
                        copyToClipboard(qrData.bankInfo.accountNumber)
                      }
                    >
                      {copied ? "Đã copy" : "Copy"}
                    </Button>
                  </Space>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold">Chủ tài khoản:</span>
                  <span>{qrData.bankInfo.accountHolder}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold">Chi nhánh:</span>
                  <span>{qrData.bankInfo.branch}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold">Nội dung:</span>
                  <Space>
                    <span>{qrData.bankInfo.content}</span>
                    <Button
                      size="small"
                      icon={copied ? <CheckOutlined /> : <CopyOutlined />}
                      onClick={() => copyToClipboard(qrData.bankInfo.content)}
                    >
                      {copied ? "Đã copy" : "Copy"}
                    </Button>
                  </Space>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold">Số tiền:</span>
                  <span className="font-bold text-red-600">
                    {qrData.amount.toLocaleString()} VND
                  </span>
                </div>
              </Space>
            </div>

            <div className="flex gap-2 justify-center">
              <Button onClick={() => setQrModalVisible(false)}>Hủy</Button>
              <Button
                type="primary"
                icon={<BankOutlined />}
                loading={loading}
                onClick={handleConfirmTransfer}
              >
                Đã chuyển khoản
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        title="Xác nhận thanh toán"
        open={confirmModalVisible}
        onCancel={() => setConfirmModalVisible(false)}
        footer={null}
      >
        {pendingConfirmData && (
          <div className="space-y-4">
            <div className="border rounded-lg p-4 bg-gray-50 space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">Khách hàng:</span>
                <span className="font-bold">
                  {pendingConfirmData.customerName}
                </span>
              </div>
              {pendingConfirmData.customerPhone && (
                <div className="flex justify-between">
                  <span className="font-medium">Số điện thoại:</span>
                  <span>{pendingConfirmData.customerPhone}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="font-medium">Hình thức mua:</span>
                <span className="font-bold">
                  {pendingConfirmData.isDelivery ? "Giao hàng" : "Mua tại quầy"}
                </span>
              </div>
              {pendingConfirmData.isDelivery && (
                <div className="flex justify-between">
                  <span className="font-medium">Đơn vị vận chuyển:</span>
                  <span className="font-semibold">
                    {pendingConfirmData.shippingProvider}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="font-medium">Tổng tiền hàng:</span>
                <span className="font-bold">
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
                  <span className="font-medium">Phí vận chuyển:</span>
                  <span className="font-semibold">
                    {pendingConfirmData.shippingFee.toLocaleString()} VND
                  </span>
                </div>
              )}
              <div className="flex justify-between font-bold text-amber-600">
                <span>Thành tiền:</span>
                <span>
                  {pendingConfirmData.totalWithShipping.toLocaleString()} VND
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Mã giảm giá:</span>
                <span>
                  {pendingConfirmData.appliedDiscountCode || "Không áp dụng"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Phương thức thanh toán:</span>
                <span>{pendingConfirmData.paymentMethod}</span>
              </div>
            </div>
            <div className="text-center text-red-600 font-semibold">
              Bạn có chắc chắn muốn thanh toán?
            </div>
            <div className="flex justify-center gap-6 w-full">
              <div
                className="w-40 cursor-pointer select-none text-center py-2 rounded-xl bg-[#b8b8b8] font-bold text-white hover:bg-red-600 active:bg-rose-900 border active:border-[#808080] shadow"
                onClick={() => setConfirmModalVisible(false)}
              >
                Hủy
              </div>
              <div
                className="w-40 cursor-pointer select-none text-center py-2 rounded-xl bg-[#E67E22] font-bold text-white hover:bg-cyan-800 active:bg-cyan-800 border active:border-[#808080] shadow"
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
