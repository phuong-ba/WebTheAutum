/**
 * Service đồng bộ dữ liệu giữa màn hình Bán hàng (POS) và Màn hình Khách (Display)
 * Sử dụng WebSocket để truyền dữ liệu real-time
 *
 * File: src/services/posSync.js
 * VERSION: DEBUG - Với log chi tiết
 */

import SockJS from "sockjs-client";
import { Stomp } from "@stomp/stompjs";

let stompClient = null;
let isConnected = false;


const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

export const initializeWebSocket = () => {
  if (stompClient && isConnected) {
    console.log("⚠️ WebSocket đã được kết nối");
    return stompClient;
  }

  console.log("🔄 Đang khởi tạo WebSocket...");
  const socket = new SockJS(apiBaseUrl);
  stompClient = Stomp.over(socket);
  // BẬT DEBUG ĐẦY ĐỦ
  stompClient.debug = (str) => {
    console.log("🔵 STOMP:", str);
  };

  stompClient.connect(
    {},
    () => {
      console.log("✅✅✅ POS Sync: ĐÃ KẾT NỐI WEBSOCKET THÀNH CÔNG ✅✅✅");
      isConnected = true;
    },
    (err) => {
      console.error("❌❌❌ POS Sync: LỖI KẾT NỐI SOCKET ❌❌❌", err);
      isConnected = false;
    }
  );

  return stompClient;
};

/**
 * Đồng bộ dữ liệu hóa đơn sang màn hình khách
 * @param {Object} billData - Dữ liệu hóa đơn cần đồng bộ
 */
export const syncToDisplay = (billData) => {
  console.log("🔔 syncToDisplay được gọi với data:", billData);
  // Nếu không có dữ liệu, gửi lệnh reset
  if (!billData) {
    console.log("⚠️ Không có billData, gửi reset");
    sendResetPayload();
    return;
  }

  if (!stompClient || !isConnected) {
    console.warn("⚠️ WebSocket chưa kết nối, đang khởi tạo...");
    initializeWebSocket();

    // Retry sau 1 giây
    setTimeout(() => {
      if (stompClient && isConnected) {
        console.log("✅ Retry thành công, gửi data");
        sendDisplayData(billData);
      } else {
        console.error("❌ Retry thất bại, vẫn chưa kết nối");
      }
    }, 1000);
    return;
  }

  sendDisplayData(billData);
};

/**
 * Gửi lệnh reset màn hình khách về trạng thái IDLE
 */
const sendResetPayload = () => {
  console.log("🔄 sendResetPayload được gọi");
  if (!stompClient || !isConnected) {
    console.warn("⚠️ WebSocket chưa kết nối, không thể reset");
    return;
  }

  const resetPayload = {
    trangThai: 0, // 0 = IDLE
    maHoaDon: null,
    items: [],
    tongTien: 0,
  };
  try {
    console.log("📤 ĐANG GỬI RESET:", resetPayload);
    stompClient.send("/topic/display", {}, JSON.stringify(resetPayload));
    console.log("✅ ĐÃ GỬI RESET THÀNH CÔNG");
  } catch (error) {
    console.error("❌ LỖI KHI GỬI RESET:", error);
  }
};

/**
 * Gửi dữ liệu hóa đơn lên server
 * @param {Object} billData - Dữ liệu hóa đơn
 */
const sendDisplayData = (billData) => {
  console.log("📦 sendDisplayData được gọi với:", billData);
  try {
    const {
      cart,
      totalAmount,
      customer,
      name,
      id,
      appliedDiscount,
      isDelivery,
      shippingFee,
      paymentMethod,
      qrCodeString,
    } = billData;

    // Tính toán số tiền
    const discountAmount = appliedDiscount?.discountAmount || 0;
    let finalAmount =
      appliedDiscount?.finalAmount !== undefined
        ? appliedDiscount.finalAmount
        : totalAmount || 0;

    if (isDelivery && shippingFee) {
      finalAmount += shippingFee;
    }

    // Chuẩn hóa dữ liệu payload
    const payload = {
      maHoaDon: name || `Đơn #${id}`,
      tenKhachHang: customer?.hoTen || "Khách lẻ",
      sdtKhachHang: customer?.sdt || "",

      // Thông tin giá
      tongTien: totalAmount || 0,
      tienGiam: discountAmount,
      phiVanChuyen: isDelivery ? shippingFee || 0 : 0,
      tongTienSauGiam: finalAmount,

      // Mã giảm giá
      maGiamGia: appliedDiscount?.code || null,

      // Thông tin thanh toán
      hinhThucThanhToan: paymentMethod || "Chưa chọn",
      qrCodeString: qrCodeString || null,

      // Ghi chú
      ghiChu: isDelivery ? "Giao hàng tận nơi" : "Mua tại quầy",

      // Danh sách sản phẩm
      items: (cart || []).map((item) => ({
        id: item.idChiTietSanPham || item.id,
        tenSanPham: item.name || item.tenSanPham || "Sản phẩm",
        soLuong: item.quantity || 1,
        donGia: item.unitPrice || item.price || 0,
        thanhTien: item.totalPrice || item.unitPrice * item.quantity,
        mauSac: item.color || item.mauSac || "",
        kichThuoc: item.size || item.kichThuoc || "",
        anhUrls: item.imageUrl ? [item.imageUrl] : [],
      })),

      // Trạng thái: 1 = Đang giao dịch
      trangThai: 1,
    };

    console.log("📤📤📤 ĐANG GỬI PAYLOAD:", JSON.stringify(payload, null, 2));
    console.log("🎯 Destination: /topic/display");
    console.log("🔌 Connected:", stompClient.connected);

    stompClient.send("/topic/display", {}, JSON.stringify(payload));
    console.log("✅✅✅ ĐÃ GỬI THÀNH CÔNG ✅✅✅");
  } catch (error) {
    console.error("❌❌❌ LỖI KHI GỬI DỮ LIỆU:", error);
    console.error("Stack trace:", error.stack);
  }
};

/**
 * Gửi thông báo thanh toán thành công
 * @param {Object} billData - Dữ liệu hóa đơn đã thanh toán
 */
export const sendPaymentSuccess = (billData) => {
  console.log("💰💰💰 sendPaymentSuccess ĐƯỢC GỌI 💰💰💰");
  console.log("📦 Dữ liệu nhận được:", billData);
  if (!stompClient || !isConnected) {
    console.error("❌ WebSocket chưa kết nối, KHÔNG THỂ GỬI");
    console.log("stompClient:", stompClient);
    console.log("isConnected:", isConnected);
    return;
  }

  const successPayload = {
    maHoaDon: billData.maHoaDon || billData.name || `Đơn #${billData.id}`,
    tenKhachHang:
      billData.tenKhachHang || billData.customer?.hoTen || "Khách lẻ",
    sdtKhachHang: billData.sdtKhachHang || billData.customer?.sdt || "",

    tongTien: billData.tongTien || billData.totalAmount || 0,
    tienGiam:
      billData.tienGiam || billData.appliedDiscount?.discountAmount || 0,
    tongTienSauGiam: billData.tongTienSauGiam || billData.finalAmount || 0,
    phiVanChuyen: billData.phiVanChuyen || 0,

    items: billData.items || billData.cart || [],

    trangThai: 3, // 3 = Hoàn thành
  };

  try {
    console.log("✅✅✅ ĐANG GỬI TRẠNG THÁI SUCCESS (3) ✅✅✅");
    console.log("📤 Payload:", JSON.stringify(successPayload, null, 2));
    console.log("🎯 Destination: /topic/display");
    console.log("🔌 Connected:", stompClient.connected);

    stompClient.send("/topic/display", {}, JSON.stringify(successPayload));

    console.log("🎉🎉🎉 ĐÃ GỬI THÀNH CÔNG TRẠNG THÁI 3 🎉🎉🎉");
  } catch (error) {
    console.error("❌❌❌ LỖI KHI GỬI PAYMENT SUCCESS:", error);
    console.error("Stack trace:", error.stack);
  }
};

/**
 * Gửi thông báo hủy đơn hàng
 * @param {Object} billData - Dữ liệu hóa đơn bị hủy
 */
export const sendPaymentCancelled = (billData) => {
  console.log("🚫🚫🚫 sendPaymentCancelled ĐƯỢC GỌI 🚫🚫🚫");
  console.log("📦 Dữ liệu nhận được:", billData);
  if (!stompClient || !isConnected) {
    console.error("❌ WebSocket chưa kết nối, KHÔNG THỂ GỬI");
    return;
  }

  const cancelPayload = {
    maHoaDon: billData.maHoaDon || billData.name || `Đơn #${billData.id}`,
    tenKhachHang:
      billData.tenKhachHang || billData.customer?.hoTen || "Khách lẻ",
    sdtKhachHang: billData.sdtKhachHang || billData.customer?.sdt || "",

    tongTien: billData.tongTien || billData.totalAmount || 0,
    items: billData.items || billData.cart || [],

    trangThai: 4, // 4 = Đã hủy
  };

  try {
    console.log("❌❌❌ ĐANG GỬI TRẠNG THÁI CANCELLED (4) ❌❌❌");
    console.log("📤 Payload:", JSON.stringify(cancelPayload, null, 2));
    console.log("🎯 Destination: /topic/display");
    console.log("🔌 Connected:", stompClient.connected);

    stompClient.send("/topic/display", {}, JSON.stringify(cancelPayload));

    console.log("🚫🚫🚫 ĐÃ GỬI THÀNH CÔNG TRẠNG THÁI 4 🚫🚫🚫");
  } catch (error) {
    console.error("❌❌❌ LỖI KHI GỬI PAYMENT CANCELLED:", error);
    console.error("Stack trace:", error.stack);
  }
};

/**
 * Ngắt kết nối WebSocket
 */
export const disconnectWebSocket = () => {
  if (stompClient && isConnected) {
    stompClient.disconnect();
    console.log("👋 Đã ngắt kết nối WebSocket");
    isConnected = false;
    stompClient = null;
  }
};

/**
 * Kiểm tra trạng thái kết nối
 * @returns {boolean} True nếu đã kết nối
 */
export const isWebSocketConnected = () => {
  const status = isConnected && stompClient && stompClient.connected;
  console.log("🔍 Kiểm tra kết nối:", status);
  return status;
};
