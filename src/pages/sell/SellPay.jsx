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

// --- [FIX] Imports cho WebSocket ---
import SockJS from "sockjs-client";
import { Stomp } from "@stomp/stompjs";

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

  // --- Socket States ---
  const socketRef = useRef(null); // Dùng Ref để lưu trữ client và tránh lặp
  const [stompClient, setStompClient] = useState(null);
  const [isPaid, setIsPaid] = useState(false);

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

  const lastShippingCalculationRef = useRef({
    tinh: null,
    quan: null,
    diaChiCuThe: null,
    cartItemsHash: null,
    selectedShipping: null,
  });
  const showQRModal = (hoaDonMoi) => {
    if (!hoaDonMoi) return;
    const amount =
      hoaDonMoi.soTienThanhToan ||
      hoaDonMoi.totalWithShipping ||
      hoaDonMoi.tongTienSauGiam ||
      totalWithShipping ||
      cartTotal ||
      0;

    const bankInfoFromHoaDon = hoaDonMoi.bankInfo || hoaDonMoi.qrBankInfo;
    const bankInfo = bankInfoFromHoaDon || {
      bankName: "Ngân hàng ABC",
      accountNumber: "0123456789",
      accountHolder: "CỬA HÀNG",
      branch: "Chi nhánh chính",
      content:
        hoaDonMoi.ghiChu ||
        `Thanh toán ${hoaDonMoi.loaiHoaDon ? "hóa đơn" : "đơn hàng"}`,
    };

    setPendingHoaDonData(hoaDonMoi);
    setQrData({ amount, bankInfo });
    setQrModalVisible(true);
  };
  const copyToClipboard = async (text) => {
      try {
        if (!text) return;
        await navigator.clipboard.writeText(String(text));
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      } catch (err) {
        console.error("❌ copyToClipboard error:", err);
        messageApi.error("Không thể copy nội dung");
      }
    };
  // --- [FIX LỖI LẶP] Kết nối Socket chỉ chạy 1 LẦN DÙ COMPONENT RE-RENDER ---
  useEffect(() => {
    // Show QR modal with prepared bank info and amount

    // Clipboard copy helper used by QR modal
    
    // Chỉ khởi tạo nếu Ref chưa có client
    if (socketRef.current) return;

    const socket = new SockJS("http://localhost:8080/ws");
    const client = Stomp.over(socket);
    client.debug = () => {};

    client.connect(
      {},
      () => {
        console.log("✅ SellPay: Đã kết nối WebSocket");
        socketRef.current = client; // Lưu client vào Ref
        setStompClient(client);
      },
      (err) => {
        console.error("❌ SellPay: Lỗi kết nối Socket", err);
      }
    );

    return () => {
      // Cleanup chỉ chạy khi component unmount
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []); // Dependency rỗng

  // --- Gửi dữ liệu đồng bộ (Chạy khi data thay đổi) ---
  useEffect(() => {
    // Chỉ gửi khi có client và đang kết nối VÀ chưa chuyển sang trạng thái đã thanh toán
    if (stompClient && stompClient.connected && !isPaid) {
      const qrCodeString =
        qrModalVisible && qrData
          ? `${qrData.bankInfo.accountNumber}|${qrData.amount}|${qrData.bankInfo.content}`
          : null;

      // Mapping dữ liệu sản phẩm
      const mappedItems = cartItems.map((item) => ({
        id: item.idChiTietSanPham || item.id,
        tenSanPham: item.tenSanPham || item.name || item.ten || "Sản phẩm",
        soLuong: item.quantity || item.soLuong || 1,
        donGia: item.unitPrice || item.price || item.giaBan || item.gia || 0,
        thanhTien:
          (item.unitPrice || item.price || item.giaBan || 0) *
          (item.quantity || item.soLuong || 1),
        mauSac: item.mauSac || item.color || "",
        kichThuoc: item.kichThuoc || item.size || "",
        anhUrls:
          item.anhUrls ||
          (item.imageUrl ? [item.imageUrl] : []) ||
          (item.image ? [item.image] : []) ||
          [],
      }));

      const payload = {
        maHoaDon: selectedBillId
          ? `Đơn hàng #${selectedBillId}`
          : "Đang giao dịch",
        tenKhachHang: selectedCustomer?.hoTen || "Khách lẻ",
        sdtKhachHang: selectedCustomer?.sdt || "",
        diemTichLuy: selectedCustomer?.diemTichLuy || 0,
        tongTien: cartTotal,
        tienGiam: actualDiscountAmount,
        maGiamGia: appliedDiscount?.code || null,
        phiVanChuyen: shippingFee,
        tongTienSauGiam: totalWithShipping,
        hinhThucThanhToan: paymentMethod || "Chưa chọn",
        qrCodeString: qrCodeString,
        items: mappedItems,
        trangThai: 1, // 1: Active
      };

      stompClient.send("/topic/display", {}, JSON.stringify(payload));
    }
  }, [
    stompClient,
    cartItems,
    cartTotal,
    actualDiscountAmount,
    shippingFee,
    totalWithShipping,
    paymentMethod,
    qrModalVisible,
    qrData,
    selectedCustomer,
    appliedDiscount,
    selectedBillId,
    isPaid,
    isDelivery,
    selectedShipping,
  ]);

  // Các useEffect và hàm khác giữ nguyên...
  // (Tôi chỉ giữ lại các phần liên quan đến state và hàm chính)

  useEffect(() => {
    dispatch(fetchDonViVanChuyen());
  }, [dispatch]);

  useEffect(() => {
    if (donViVanChuyen.length > 0 && !selectedShipping) {
      dispatch(setSelectedShipping("GHN"));
    }
  }, [donViVanChuyen, selectedShipping, dispatch]);

  useEffect(() => {
    const shouldCalculateShipping =
      isDelivery && cartItems.length > 0 && selectedShipping && addressForm;
    if (shouldCalculateShipping) {
      const timer = setTimeout(() => {
        calculateShippingFee();
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      dispatch(resetShippingFee());
    }
  }, [isDelivery, cartItems, selectedShipping, addressForm]);

  useEffect(() => {
    if (isDelivery && selectedShipping && cartItems.length > 0) {
      const formValues = addressForm?.getFieldsValue();
      if (formValues?.thanhPho && formValues?.quan && formValues?.diaChiCuThe) {
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
          lastShippingCalculationRef.current.cartItemsHash = currentHash;
          const timer = setTimeout(() => {
            calculateShippingFee();
          }, 800);
          return () => clearTimeout(timer);
        }
      }
    }
  }, [addressForm, cartItems, isDelivery, selectedShipping]);

  useEffect(() => {
    window.SellPayComponent = { calculateShippingFee: calculateShippingFee };
    if (isDelivery && selectedShipping && cartItems.length > 0) {
      const timer = setTimeout(() => {
        calculateShippingFee();
      }, 1500);
      return () => clearTimeout(timer);
    }
    return () => {
      window.SellPayComponent = null;
    };
  }, []);

  const parseProductValue = (value, defaultValue = 200) => {
    if (value === null || value === undefined) return defaultValue;
    if (typeof value === "number") return value;
    if (typeof value === "string")
      return parseInt(value.replace(/[^\d]/g, ""), 10) || defaultValue;
    return defaultValue;
  };

  const calculateShippingFee = async () => {
    if (!isDelivery || !addressForm || !selectedShipping) return;
    try {
      const formValues = addressForm.getFieldsValue();
      if (!formValues.thanhPho || !formValues.quan || !formValues.diaChiCuThe) {
        messageApi.warning(
          "Vui lòng nhập đầy đủ thông tin địa chỉ để tính phí vận chuyển"
        );
        return;
      }

      lastShippingCalculationRef.current.cartItemsHash = JSON.stringify(
        cartItems.map((item) => ({
          id: item.idChiTietSanPham,
          quantity: item.quantity,
        }))
      );

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

      await dispatch(tinhPhiVanChuyen(requestData)).unwrap();
    } catch (error) {
      console.error("❌ Lỗi tính phí vận chuyển:", error);
      messageApi.error("Không thể tính phí vận chuyển. Vui lòng thử lại!");
    }
  };

  const handleSelectShipping = (provider) => {
    dispatch(setSelectedShipping(provider));
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
            hoTen: formValues.HoTen || "Khách lẻ",
            sdt: formValues.SoDienThoai || "",
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

    let chiTietList = cartItems.map((item) => ({
      idChiTietSanPham: item.idChiTietSanPham,
      soLuong: item.quantity || 1,
      giaBan: item.unitPrice || item.price || item.giaBan || 0,
      ghiChu: item.ghiChu || "",
      trangThai: 0,
    }));
    if (chiTietList.length === 0) return null;

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
      }${shippingNote}`,
      diaChiKhachHang,
      ngayThanhToan: new Date().toISOString(),
      trangThai: isDelivery ? 1 : 3,
      idKhachHang: selectedCustomer?.id || null,
      idNhanVien: getCurrentUserId(),
      idPhieuGiamGia: appliedDiscount?.id || null,
      nguoiTao: getCurrentUserId(),
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

  const sendSuccessPayload = () => {
    if (stompClient && stompClient.connected) {
      const finalPayload = {
        maHoaDon: selectedBillId
          ? `Đơn hàng #${selectedBillId}`
          : "Đã thanh toán",
        tenKhachHang: pendingConfirmData?.customerName || "Khách lẻ",
        sdtKhachHang: pendingConfirmData?.sdtKhachHang || "",
        maGiamGia: appliedDiscount?.code || null,
        tongTien: cartTotal,
        tienGiam: actualDiscountAmount,
        phiVanChuyen: shippingFee,
        tongTienSauGiam: totalWithShipping,
        hinhThucThanhToan: paymentMethod || "Chưa chọn",
        qrCodeString: null,
        items: cartItems.map((item) => ({
          id: item.idChiTietSanPham || item.id,
          tenSanPham: item.tenSanPham || item.name || item.ten || "Sản phẩm",
          soLuong: item.quantity || item.soLuong || 1,
          donGia: item.unitPrice || item.price || item.giaBan || 0,
          thanhTien:
            (item.unitPrice || item.price || item.giaBan || 0) *
            (item.quantity || 1),
          mauSac: item.mauSac || item.color || "",
          kichThuoc: item.kichThuoc || item.size || "",
          anhUrls: item.anhUrls || (item.imageUrl ? [item.imageUrl] : []) || [],
        })),
        ghiChu: isDelivery ? `Giao hàng - ${selectedShipping}` : "Mua tại quầy",
        trangThai: 3, // 3 = Hoàn thành
      };

      stompClient.send("/topic/display", {}, JSON.stringify(finalPayload));
      console.log("✅ Đã gửi trạng thái SUCCESS sang màn hình khách");
    }
  };

  const handlePostPaymentSuccess = async (newBillId) => {
    if (selectedBillId) {
      const bills = JSON.parse(localStorage.getItem("pendingBills")) || [];
      const updatedBills = bills.filter((bill) => bill.id !== selectedBillId);
      localStorage.setItem("pendingBills", JSON.stringify(updatedBills));
      window.dispatchEvent(new Event("billsUpdated"));
    }

    if (onRemoveDiscount) onRemoveDiscount();
    if (onClearCart) onClearCart();

    if (appliedDiscount?.isPersonal) {
      await handleRemovePersonalDiscountAfterPayment();
    }

    const newBillIdFinal = newBillId || selectedBillId;
    if (newBillIdFinal) {
      navigate(`/admin/detail-bill/${newBillIdFinal}`);
    }
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
        sendSuccessPayload(); // Gửi payload SUCCESS
        setIsPaid(true); // Ngăn useEffect gửi payload ACTIVE sau này
        messageApi.success(
          isDelivery
            ? "✅ Thanh toán thành công! Đơn hàng đang chờ giao hàng."
            : "✅ Thanh toán thành công! Đơn hàng đã hoàn tất."
        );
        handlePostPaymentSuccess(res.data.data?.id || res.data.data);
        setQrModalVisible(false);
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
        sendSuccessPayload(); // Gửi payload SUCCESS
        setIsPaid(true);
        messageApi.success(
          isDelivery
            ? "✅ Đặt hàng thành công! Đơn hàng đang chờ giao hàng."
            : "✅ Thanh toán thành công! Đơn hàng đã hoàn tất."
        );
        handlePostPaymentSuccess(res.data.data?.id || res.data.data);
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
        sendSuccessPayload(); // Gửi payload SUCCESS
        setIsPaid(true);
        messageApi.success(
          isDelivery
            ? "✅ Đặt hàng thành công! Đơn hàng đang chờ giao hàng."
            : "✅ Thanh toán thành công! Đơn hàng đã hoàn tất."
        );
        handlePostPaymentSuccess(res.data.data?.id || res.data.data);
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

    setPendingConfirmData({
      customerName: selectedCustomer?.hoTen || "Khách lẻ",
      sdtKhachHang: selectedCustomer?.sdt || "",
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

  // Render selectable shipping provider options and status
  const renderShippingOptions = () => {
    if (!isDelivery) return null;

    return (
      <div className="mb-4">
        <div className="font-bold text-gray-700 mb-2">Đơn vị vận chuyển:</div>
        <div className="flex gap-2 flex-wrap">
          {donViVanChuyen && donViVanChuyen.length > 0 ? (
            donViVanChuyen.map((p) => {
              const value = p.code || p.ma || p.id || p.value || p;
              const label =
                p.tenDonVi ||
                p.name ||
                p.ten ||
                p.label ||
                p.code ||
                p.ma ||
                String(value);
              const key = `${value}`;
              return (
                <div
                  key={key}
                  onClick={() => handleSelectShipping(value)}
                  className={`cursor-pointer select-none px-3 py-2 rounded-lg border shadow-sm text-sm font-semibold ${
                    selectedShipping === value
                      ? "bg-amber-600 text-white border-amber-600"
                      : "bg-white text-amber-600 border-gray-200 hover:bg-amber-50"
                  }`}
                >
                  {label}
                </div>
              );
            })
          ) : (
            <div className="text-sm text-gray-500">
              Không có đơn vị vận chuyển
            </div>
          )}
        </div>

        <div className="mt-2 text-sm text-gray-600">
          {shippingLoading
            ? "Đang tính phí vận chuyển..."
            : shippingFee
            ? `Phí vận chuyển: ${shippingFee.toLocaleString()} VND`
            : "Chưa có phí vận chuyển"}
        </div>
      </div>
    );
  };

  // Small helper to render shipping line used inside totals box
  const renderShippingInfo = () => {
    if (!isDelivery) return null;
    return (
      <div className="flex justify-between font-bold text-gray-700">
        <span>Phí vận chuyển:</span>
        <span className="text-green-600">
          {shippingLoading
            ? "Đang tính..."
            : shippingFee
            ? `${shippingFee.toLocaleString()} vnd`
            : "0 vnd"}
        </span>
      </div>
    );
  };

  const paymentOptions = ["Chuyển khoản", "Tiền mặt", "Cả hai"];

  return (
    <>
      {contextHolder}

      {/* Render các phần còn lại */}
      {/* ... */}

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
              className={`cursor-pointer select-none text-center py-2 px-6 rounded-xl bg-white font-bold border shadow transition-all ${
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
