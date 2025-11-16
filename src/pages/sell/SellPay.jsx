import React, { useState } from "react";
import hoaDonApi from "@/api/HoaDonAPI";
import {
  message,
  Modal,
  QRCode,
  Button,
  Space,
  Divider,
  Card,
  Row,
  Col,
  InputNumber,
  Form,
} from "antd";
import { useNavigate } from "react-router";
import { getCurrentUserId } from "@/utils/authHelper";
import {
  QrcodeOutlined,
  CopyOutlined,
  CheckOutlined,
  BankOutlined,
  GlobalOutlined,
  ArrowRightOutlined,
  DollarOutlined,
} from "@ant-design/icons";

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
}) {
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [loading, setLoading] = useState(false);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [transferMethodModalVisible, setTransferMethodModalVisible] =
    useState(false);
  const [bothPaymentModalVisible, setBothPaymentModalVisible] = useState(false);
  const [qrData, setQrData] = useState(null);
  const [copied, setCopied] = useState(false);
  const [pendingHoaDonData, setPendingHoaDonData] = useState(null);
  const [cashAmount, setCashAmount] = useState(0);
  const [transferAmount, setTransferAmount] = useState(0);
  const discountAmount = appliedDiscount?.discountAmount || 0;
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [pendingConfirmData, setPendingConfirmData] = useState(null);
  const actualDiscountAmount = Math.min(discountAmount, cartTotal);
  const finalAmount = Math.max(cartTotal - actualDiscountAmount, 0);
  const shippingFee = 0;
  const [messageApi, contextHolder] = message.useMessage();
  const navigate = useNavigate();

  const totalWithShipping = finalAmount + shippingFee;

  // HÀM QUAN TRỌNG: Xoá phiếu giảm giá cá nhân sau khi thanh toán thành công
  const handleRemovePersonalDiscountAfterPayment = async () => {
    if (appliedDiscount?.isPersonal && appliedDiscount?.customerId) {
      try {
        console.log(
          "🔄 Đang xoá phiếu giảm giá cá nhân sau khi thanh toán...",
          appliedDiscount
        );
        await removeCustomerFromDiscount(
          appliedDiscount.id,
          appliedDiscount.customerId
        );
        console.log("✅ Đã xoá phiếu giảm giá cá nhân sau khi thanh toán");
      } catch (error) {
        console.error("❌ Lỗi khi xoá phiếu giảm giá cá nhân:", error);
      }
    }
  };

  // Hàm chuẩn bị dữ liệu hóa đơn (KHÔNG gọi API)
  const prepareHoaDonData = (paymentInfo = {}) => {
    let shippingAddress = null;
    let formCustomerInfo = null;

    if (isDelivery && addressForm) {
      try {
        const formValues = addressForm.getFieldsValue();
        console.log("📝 Form values từ SellInformation:", formValues);

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
            tenTinh: tinhName,
            tenQuan: quanName,
          };
        }
      } catch (error) {
        console.error("❌ Lỗi khi lấy giá trị form:", error);
      }
    }

    let chiTietList = [];

    if (cartItems && cartItems.length > 0) {
      chiTietList = cartItems.map((item) => ({
        idChiTietSanPham: item.idChiTietSanPham || item.id,
        soLuong: item.quantity || item.soLuong,
        giaBan: item.price || item.giaBan,
        ghiChu: typeof item.ghiChu === "string" ? item.ghiChu : "",
        trangThai: 0,
      }));
    } else if (selectedBillId) {
      const bills = JSON.parse(localStorage.getItem("pendingBills")) || [];
      const currentBill = bills.find((bill) => bill.id === selectedBillId);

      if (currentBill && currentBill.items && currentBill.items.length > 0) {
        chiTietList = currentBill.items.map((item) => ({
          idChiTietSanPham: item.idChiTietSanPham || item.id,
          soLuong: item.quantity || item.soLuong,
          giaBan: item.price || item.giaBan,
          ghiChu: typeof item.ghiChu === "string" ? item.ghiChu : "",
          trangThai: 0,
        }));
      }
    }

    // Kiểm tra nếu không có sản phẩm
    if (chiTietList.length === 0) {
      return null;
    }

    const currentUserId = getCurrentUserId();

    let diaChiKhachHang = "Chưa có địa chỉ";
    let idTinh = null;
    let idQuan = null;
    let diaChiCuThe = "";

    let customerType = selectedCustomer ? "Khách hàng" : "Khách lẻ";
    let customerNote = "";

    if (shippingAddress) {
      diaChiKhachHang = shippingAddress.fullAddress;
      idTinh = shippingAddress.idTinh;
      idQuan = shippingAddress.idQuan;
      diaChiCuThe = shippingAddress.diaChiCuThe;

      if (formCustomerInfo && !selectedCustomer) {
        customerType = "Khách lẻ";
        customerNote = ` - ${formCustomerInfo.hoTen}`;
        if (formCustomerInfo.sdt) {
          customerNote += ` - ${formCustomerInfo.sdt}`;
        }
      }
    } else if (selectedCustomer) {
      const bills = JSON.parse(localStorage.getItem("pendingBills")) || [];
      const currentBill = bills.find((bill) => bill.id === selectedBillId);
      const savedShippingAddress = currentBill?.shippingAddress;

      if (
        savedShippingAddress &&
        savedShippingAddress.idTinh &&
        savedShippingAddress.idQuan
      ) {
        diaChiKhachHang = savedShippingAddress.fullAddress;
        idTinh = savedShippingAddress.idTinh;
        idQuan = savedShippingAddress.idQuan;
        diaChiCuThe = savedShippingAddress.diaChiCuThe || "";
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
    }

    let trangThai;
    if (isDelivery) {
      trangThai = 1;
    } else {
      trangThai = 3;
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
        paymentNote = "Thanh toán bằng chuyển khoản";
        break;
      case "Cả hai":
        idPhuongThucThanhToan = 3;
        paymentNote = `Thanh toán kết hợp: Tiền mặt ${cashAmount.toLocaleString()} VND + Chuyển khoản ${transferAmount.toLocaleString()} VND`;
        break;
      default:
        idPhuongThucThanhToan = 3;
    }

    const hoaDonMoi = {
      loaiHoaDon: true,
      phiVanChuyen: isDelivery ? shippingFee : 0,
      tongTien: cartTotal,
      tongTienSauGiam: finalAmount,
      ghiChu: `${
        isDelivery ? "Bán giao hàng - " : "Bán tại quầy - "
      }${customerType}${customerNote} - ${paymentNote}${
        appliedDiscount?.code ? `, mã giảm ${appliedDiscount.code}` : ""
      }`,
      diaChiKhachHang: diaChiKhachHang,
      ngayThanhToan: new Date().toISOString(),
      trangThai: isDelivery ? 1 : 3,
      idKhachHang: selectedCustomer?.id || null,
      idNhanVien: currentUserId,
      idPhieuGiamGia: appliedDiscount?.id || null,
      nguoiTao: currentUserId,
      chiTietList: chiTietList,
      idPhuongThucThanhToan: idPhuongThucThanhToan,
      soTienThanhToan: totalWithShipping,
      ghiChuThanhToan: `${
        isDelivery ? "Bán giao hàng - " : "Bán tại quầy - "
      }${customerType}${customerNote} - ${paymentNote}`,
      idTinh: idTinh,
      idQuan: idQuan,
      diaChiCuThe: diaChiCuThe,
      hoTen: formCustomerInfo?.hoTen || null,
      sdt: formCustomerInfo?.sdt || null,
      // Thêm thông tin thanh toán kết hợp
      ...paymentInfo,
    };

    return hoaDonMoi;
  };

  // Hàm hiển thị modal chọn phương thức chuyển khoản
  const showTransferMethodModal = (hoaDonMoi) => {
    setPendingHoaDonData(hoaDonMoi);
    setTransferMethodModalVisible(true);
  };

  // Hàm hiển thị modal thanh toán kết hợp
  const showBothPaymentModal = (hoaDonMoi) => {
    setPendingHoaDonData(hoaDonMoi);
    setCashAmount(0);
    setTransferAmount(totalWithShipping);
    setBothPaymentModalVisible(true);
  };

  // Hàm chọn VNPay (chuyển hướng đến trang thanh toán)
  const handleVNPayRedirect = async () => {
    if (!pendingHoaDonData) return;

    try {
      setLoading(true);
      // CHỈ tạo payment URL, KHÔNG tạo hóa đơn
      const res = await hoaDonApi.createAndPayWithVNPAY({
        ...pendingHoaDonData,
        soTienThanhToan: transferAmount, // Sử dụng số tiền chuyển khoản
      });

      if (res.data?.isSuccess) {
        const paymentUrl = res.data.data?.paymentUrl;

        if (paymentUrl) {
          messageApi.success(
            "✅ Đang chuyển hướng đến trang thanh toán VNPAY..."
          );
          setTransferMethodModalVisible(false);
          setBothPaymentModalVisible(false);

          setTimeout(() => {
            window.location.href = paymentUrl;
          }, 1000);
        } else {
          messageApi.error("❌ Không thể tạo URL thanh toán VNPAY");
        }
      } else {
        messageApi.error(
          "❌ Lỗi khi tạo thanh toán VNPAY: " + (res.data?.message || "")
        );
      }
    } catch (error) {
      console.error("❌ Lỗi khi tạo VNPay:", error);
      messageApi.error("❌ Lỗi khi kết nối VNPay!");
    } finally {
      setLoading(false);
    }
  };

  // Hàm tạo và hiển thị QR Code VNPay
  const generateVNPayQR = async () => {
    if (!pendingHoaDonData) return;

    try {
      setLoading(true);
      // CHỈ tạo payment URL, KHÔNG tạo hóa đơn
      const res = await hoaDonApi.createAndPayWithVNPAY({
        ...pendingHoaDonData,
        soTienThanhToan: transferAmount, // Sử dụng số tiền chuyển khoản
      });

      if (res.data?.isSuccess) {
        const paymentUrl = res.data.data?.paymentUrl;

        if (paymentUrl) {
          // Tạo dữ liệu QR code từ payment URL
          setQrData({
            url: paymentUrl,
            amount: transferAmount,
            billCode: `HD${Date.now()}`,
            bankInfo: {
              bankName: "VNPAY QR",
              accountNumber: "19037689713019",
              accountHolder: "CONG TY TNHH AUTUMN STORE",
              branch: "TP.HCM",
            },
          });
          setTransferMethodModalVisible(false);
          setBothPaymentModalVisible(false);
          setQrModalVisible(true);
          messageApi.success("✅ Đã tạo mã QR thanh toán VNPay!");
          return true;
        } else {
          messageApi.error("❌ Không thể tạo URL thanh toán VNPAY");
          return false;
        }
      } else {
        messageApi.error(
          "❌ Lỗi khi tạo thanh toán VNPAY: " + (res.data?.message || "")
        );
        return false;
      }
    } catch (error) {
      console.error("❌ Lỗi khi tạo QR VNPay:", error);
      messageApi.error("❌ Lỗi khi tạo mã QR thanh toán!");
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Hàm xác nhận đã chuyển khoản và lưu hóa đơn
  const handleConfirmTransfer = async () => {
    if (!pendingHoaDonData) return;

    try {
      setLoading(true);

      // Gọi API để lưu hóa đơn với trạng thái đã thanh toán
      const res = await hoaDonApi.create({
        ...pendingHoaDonData,
        trangThai: isDelivery ? 1 : 3, // 1: Chờ giao hàng, 3: Đã hoàn thành
        daThanhToan: true,
      });

      if (res.data?.isSuccess) {
        const successMessage = isDelivery
          ? "✅ Đặt hàng thành công! Đơn hàng đang chờ giao hàng."
          : "✅ Thanh toán thành công! Đơn hàng đã hoàn tất.";

        messageApi.success(successMessage);

        // Xử lý cleanup
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

        // Xoá phiếu giảm giá cá nhân nếu có
        if (appliedDiscount?.isPersonal) {
          await handleRemovePersonalDiscountAfterPayment();
        }

        // Đóng modal QR
        setQrModalVisible(false);

        // Chuyển hướng đến trang chi tiết hóa đơn
        const newBillId = res.data.data?.id || res.data.data;
        if (newBillId) {
          navigate(`/admin/detail-bill/${newBillId}`);
        }

        return true;
      } else {
        messageApi.error(
          "❌ Lỗi khi lưu hóa đơn: " + (res.data?.message || "")
        );
        return false;
      }
    } catch (error) {
      console.error("❌ Lỗi khi xác nhận chuyển khoản:", error);
      messageApi.error("❌ Lỗi khi xác nhận thanh toán!");
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Hàm xác nhận thanh toán kết hợp
  const handleConfirmBothPayment = async () => {
    if (!pendingHoaDonData) return;

    // Kiểm tra số tiền
    if (cashAmount + transferAmount !== totalWithShipping) {
      messageApi.error(
        "❌ Tổng số tiền thanh toán không khớp với tổng hóa đơn!"
      );
      return;
    }

    try {
      setLoading(true);

      // Chuẩn bị dữ liệu thanh toán kết hợp với thông tin số tiền cụ thể
      const paymentInfo = {
        tienMat: cashAmount,
        chuyenKhoan: transferAmount,
        soTienThanhToan: totalWithShipping,
      };

      // Tạo hóa đơn mới với thông tin thanh toán kết hợp
      const hoaDonWithBothPayment = {
        ...pendingHoaDonData,
        tienMat: cashAmount,
        chuyenKhoan: transferAmount,
        soTienThanhToan: totalWithShipping,
        ghiChu: `${isDelivery ? "Bán giao hàng - " : "Bán tại quầy - "}${
          pendingHoaDonData.idKhachHang ? "Khách hàng" : "Khách lẻ"
        } - Thanh toán kết hợp: Tiền mặt ${cashAmount.toLocaleString()} VND + Chuyển khoản ${transferAmount.toLocaleString()} VND${
          appliedDiscount?.code ? `, mã giảm ${appliedDiscount.code}` : ""
        }`,
        ghiChuThanhToan: `${
          isDelivery ? "Bán giao hàng - " : "Bán tại quầy - "
        }${
          pendingHoaDonData.idKhachHang ? "Khách hàng" : "Khách lẻ"
        } - Thanh toán kết hợp: Tiền mặt ${cashAmount.toLocaleString()} VND + Chuyển khoản ${transferAmount.toLocaleString()} VND`,
        idPhuongThucThanhToan: 3, // Cả hai
      };

      // Gọi API để lưu hóa đơn
      const res = await hoaDonApi.create({
        ...hoaDonWithBothPayment,
        trangThai: isDelivery ? 1 : 3,
        daThanhToan: true,
      });

      if (res.data?.isSuccess) {
        const successMessage = isDelivery
          ? "✅ Đặt hàng thành công! Đơn hàng đang chờ giao hàng."
          : "✅ Thanh toán thành công! Đơn hàng đã hoàn tất.";

        messageApi.success(successMessage);

        // Xử lý cleanup
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

        // Xoá phiếu giảm giá cá nhân nếu có
        if (appliedDiscount?.isPersonal) {
          await handleRemovePersonalDiscountAfterPayment();
        }

        // Đóng modal
        setBothPaymentModalVisible(false);

        // Chuyển hướng đến trang chi tiết hóa đơn
        const newBillId = res.data.data?.id || res.data.data;
        if (newBillId) {
          navigate(`/admin/detail-bill/${newBillId}`);
        }

        return true;
      } else {
        messageApi.error(
          "❌ Lỗi khi lưu hóa đơn: " + (res.data?.message || "")
        );
        return false;
      }
    } catch (error) {
      console.error("❌ Lỗi khi xác nhận thanh toán kết hợp:", error);
      messageApi.error("❌ Lỗi khi xác nhận thanh toán!");
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Hàm sao chép thông tin chuyển khoản
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      messageApi.success("✅ Đã sao chép vào clipboard!");
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Hàm xử lý thay đổi số tiền
  const handleCashAmountChange = (value) => {
    setCashAmount(value || 0);
    setTransferAmount(totalWithShipping - (value || 0));
  };

  const handleTransferAmountChange = (value) => {
    setTransferAmount(value || 0);
    setCashAmount(totalWithShipping - (value || 0));
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

    if (isDelivery) {
      if (!addressForm) {
        messageApi.warning("Vui lòng nhập địa chỉ giao hàng!");
        return;
      }

      const formValues = addressForm.getFieldsValue();
      if (!formValues.thanhPho || !formValues.quan || !formValues.diaChiCuThe) {
        messageApi.warning("Vui lòng nhập đầy đủ thông tin địa chỉ giao hàng!");
        return;
      }
    }

    const displayCustomerName = selectedCustomer?.hoTen || "Khách lẻ";
    const displayCustomerPhone = selectedCustomer?.sdt || "";

    // Chuẩn bị dữ liệu hóa đơn
    const hoaDonMoi = prepareHoaDonData();
    if (!hoaDonMoi || !hoaDonMoi.chiTietList?.length) {
      messageApi.error("❌ Không có sản phẩm trong giỏ hàng!");
      return;
    }

    setPendingConfirmData({
      customerName: displayCustomerName,
      customerPhone: displayCustomerPhone,
      isDelivery,
      cartTotal,
      discountAmount,
      shippingFee,
      totalWithShipping,
      appliedDiscountCode: appliedDiscount?.code,
      paymentMethod,
      hoaDonMoi,
    });

    setConfirmModalVisible(true);
  };

  const paymentOptions = ["Chuyển khoản", "Tiền mặt", "Cả hai"];

  return (
    <>
      {contextHolder}

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
                {actualDiscountAmount.toLocaleString()} vnd
              </span>
            </div>
            {isDelivery && (
              <div className="flex justify-between font-bold">
                <span>Phí vận chuyển:</span>
                <span>{shippingFee.toLocaleString()} vnd</span>
              </div>
            )}
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
          loading
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-[#E67E22] hover:bg-amber-600 active:bg-cyan-800"
        }`}
      >
        {loading ? "Đang xử lý..." : isDelivery ? "Đặt hàng" : "Thanh toán"}
      </div>

      {/* Modal chọn phương thức chuyển khoản */}
      <Modal
        title={
          <Space>
            <BankOutlined />
            <span>Chọn phương thức chuyển khoản</span>
          </Space>
        }
        open={transferMethodModalVisible}
        onCancel={() => setTransferMethodModalVisible(false)}
        footer={null}
        width={600}
        centered
      >
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Card
              hoverable
              className="text-center h-full"
              onClick={handleVNPayRedirect}
            >
              <div className="flex flex-col items-center gap-3">
                <GlobalOutlined
                  style={{ fontSize: "48px", color: "#1890ff" }}
                />
                <h3 className="font-bold text-lg">VNPay Website</h3>
                <p className="text-gray-600">
                  Chuyển hướng đến trang thanh toán VNPay
                </p>
                <Button type="primary" icon={<ArrowRightOutlined />}>
                  Chọn
                </Button>
              </div>
            </Card>
          </Col>
          <Col span={12}>
            <Card
              hoverable
              className="text-center h-full"
              onClick={generateVNPayQR}
            >
              <div className="flex flex-col items-center gap-3">
                <QrcodeOutlined
                  style={{ fontSize: "48px", color: "#52c41a" }}
                />
                <h3 className="font-bold text-lg">Quét QR VNPay</h3>
                <p className="text-gray-600">
                  Quét mã QR để thanh toán bằng ứng dụng ngân hàng
                </p>
                <Button type="primary" icon={<QrcodeOutlined />}>
                  Chọn
                </Button>
              </div>
            </Card>
          </Col>
        </Row>

        <Divider />

        <div className="text-center">
          <span className="text-gray-500">
            Số tiền thanh toán:{" "}
            <strong>{totalWithShipping.toLocaleString()} VND</strong>
          </span>
        </div>
      </Modal>

      {/* Modal thanh toán kết hợp */}
      <Modal
        title={
          <Space>
            <DollarOutlined />
            <span>Thanh toán kết hợp</span>
          </Space>
        }
        open={bothPaymentModalVisible}
        onCancel={() => setBothPaymentModalVisible(false)}
        footer={null}
        width={500}
        centered
      >
        <div className="space-y-4">
          <div className="text-center mb-4">
            <span className="font-bold text-lg">
              Tổng tiền: {totalWithShipping.toLocaleString()} VND
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="font-bold block mb-2">Tiền mặt:</label>
              <InputNumber
                style={{ width: "100%" }}
                size="large"
                placeholder="Nhập số tiền mặt"
                value={cashAmount}
                onChange={handleCashAmountChange}
                formatter={(value) =>
                  `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                }
                parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
                min={0}
                max={totalWithShipping}
              />
            </div>

            <div>
              <label className="font-bold block mb-2">Chuyển khoản:</label>
              <InputNumber
                style={{ width: "100%" }}
                size="large"
                placeholder="Nhập số tiền chuyển khoản"
                value={transferAmount}
                onChange={handleTransferAmountChange}
                formatter={(value) =>
                  `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                }
                parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
                min={0}
                max={totalWithShipping}
              />
            </div>

            <Divider />

            <div className="flex justify-between font-bold">
              <span>Tổng cộng:</span>
              <span>{(cashAmount + transferAmount).toLocaleString()} VND</span>
            </div>

            <div
              className={`text-center ${
                cashAmount + transferAmount !== totalWithShipping
                  ? "text-red-500"
                  : "text-green-500"
              }`}
            >
              {cashAmount + transferAmount === totalWithShipping
                ? "✅ Số tiền khớp với tổng hóa đơn"
                : "❌ Số tiền không khớp với tổng hóa đơn"}
            </div>
          </div>

          <div className="flex gap-2 justify-center mt-6">
            <Button onClick={() => setBothPaymentModalVisible(false)}>
              Hủy
            </Button>
            <Button
              type="primary"
              icon={<DollarOutlined />}
              loading={loading}
              onClick={handleConfirmBothPayment}
              disabled={cashAmount + transferAmount !== totalWithShipping}
            >
              Xác nhận thanh toán
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal hiển thị QR Code VNPay */}
      <Modal
        title={
          <Space>
            <QrcodeOutlined />
            <span>Thanh toán qua VNPay QR</span>
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
              <QRCode value={qrData.url} size={200} icon="/vnpay-logo.png" />
            </div>

            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-500">
                Quét mã QR bằng ứng dụng ngân hàng hỗ trợ VNPay QR để thanh toán
              </span>
            </div>

            <Divider>Hoặc chuyển khoản thủ công</Divider>

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
              <div className="flex justify-between">
                <span className="font-medium">Tổng tiền hàng:</span>
                <span className="font-bold">
                  {pendingConfirmData.cartTotal.toLocaleString()} VND
                </span>
              </div>
              <div className="flex justify-between text-red-600">
                <span className="font-medium">Giảm giá:</span>
                <span className="font-semibold">
                  {pendingConfirmData.discountAmount.toLocaleString()} VND
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
            <div className="flex justify-center gap-6  w-full">
              <div
                className="w-40 cursor-pointer select-none  text-center py-2 rounded-xl bg-[#b8b8b8] font-bold text-white   hover:bg-red-600 active:bg-rose-900 border  active:border-[#808080] shadow "
                onClick={() => setConfirmModalVisible(false)}
              >
                Hủy
              </div>
              <div
                className="w-40 cursor-pointer select-none  text-center py-2 rounded-xl bg-[#E67E22] font-bold text-white   hover:bg-cyan-800 active:bg-cyan-800 border  active:border-[#808080] shadow"
                onClick={async () => {
                  setConfirmModalVisible(false);
                  const { hoaDonMoi } = pendingConfirmData;
                  if (!hoaDonMoi) return;

                  if (paymentMethod === "Chuyển khoản") {
                    showTransferMethodModal(hoaDonMoi);
                  } else if (paymentMethod === "Cả hai") {
                    showBothPaymentModal(hoaDonMoi);
                  } else {
                    setLoading(true);
                    try {
                      const res = await hoaDonApi.create(hoaDonMoi);
                      if (res.data?.isSuccess) {
                        messageApi.success(
                          isDelivery
                            ? " Đặt hàng thành công! Đơn hàng đang chờ giao hàng."
                            : " Thanh toán thành công! Đơn hàng đã hoàn tất."
                        );

                        if (selectedBillId) {
                          const bills =
                            JSON.parse(localStorage.getItem("pendingBills")) ||
                            [];
                          const updatedBills = bills.filter(
                            (bill) => bill.id !== selectedBillId
                          );
                          localStorage.setItem(
                            "pendingBills",
                            JSON.stringify(updatedBills)
                          );
                          window.dispatchEvent(new Event("billsUpdated"));
                        }

                        if (onRemoveDiscount) onRemoveDiscount();
                        if (onClearCart) onClearCart();

                        const newBillId = res.data.data?.id || res.data.data;
                        if (newBillId)
                          navigate(`/admin/detail-bill/${newBillId}`);
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
