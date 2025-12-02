import React, { useState, useEffect } from "react";
import {
  QrCode,
  ShoppingCart,
  CheckCircle,
  Storefront,
  TShirt,
  Tag,
  Bag,
  XCircle,
  WifiHigh,
  WifiSlash,
  Ticket,
  Sparkle,
  Heart,
} from "@phosphor-icons/react";
import SockJS from "sockjs-client";
import { Stomp } from "@stomp/stompjs";
import { QRCode } from "antd";

const THEME = {
  primary: "#E67E22",
  primaryDark: "#D35400",
  secondary: "#FDF7F0",
  textDark: "#2C3E50",
  success: "#27AE60",
  danger: "#E74C3C",
  warning: "#F39C12",
};

const formatCurrency = (amount) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    amount || 0
  );

export default function CustomerDisplay() {
  const [currentOrder, setCurrentOrder] = useState(null);
  const [status, setStatus] = useState("IDLE");
  const [isConnected, setIsConnected] = useState(false);
  const [countdown, setCountdown] = useState(10);

  const normalizeOrderData = (data) => {
    const coreOrder = data.hoaDon || data.order || data;
    if (!coreOrder) {
      return null;
    }

    const displayCode =
      coreOrder.maHoaDon ||
      (coreOrder.id ? `Đơn #${coreOrder.id}` : "Đang chọn món...");
    const rawItems = coreOrder.chiTietSanPhams || coreOrder.items || [];

    const items = rawItems.map((item) => ({
      id: item.idChiTietSanPham || item.id,
      tenSanPham: item.tenSanPham || "Sản phẩm",
      soLuong: item.soLuong || 1,
      donGia: item.donGia || item.giaBan || 0,
      thanhTien:
        item.thanhTien ||
        (item.giaBan || item.donGia || 0) * (item.soLuong || 1),
      mauSac: item.mauSac || "",
      kichThuoc: item.kichThuoc || "",
      anhUrls: item.anhUrls || [],
    }));

    return { ...coreOrder, maHoaDon: displayCode, items };
  };

  useEffect(() => {
    const socketFactory = () => new SockJS("http://localhost:8080/ws");
    const stompClient = Stomp.over(socketFactory);

    stompClient.connect(
      {},
      () => {
        setIsConnected(true);

        stompClient.subscribe("/topic/display", (message) => {
          if (message.body) {
            try {
              const rawData = JSON.parse(message.body);

              const normalizedOrder = normalizeOrderData(rawData);

              if (!normalizedOrder) {
                return;
              }

              // Xử lý trạng thái

              if (normalizedOrder.trangThai === 0) {
                setStatus("IDLE");
                setCurrentOrder(null);
              } else if (normalizedOrder.trangThai === 3) {
                if (
                  normalizedOrder.hinhThucThanhToan === "Tiền mặt" ||
                  normalizedOrder.hinhThucThanhToan === "Cả hai"
                ) {
                  setStatus("IDLE");
                  setCurrentOrder(null);
                } else {
                  setStatus("SUCCESS");
                  setCountdown(3);
                }
              } else if (normalizedOrder.trangThai === 2) {
                setStatus("CANCELLED");
                setCurrentOrder(normalizedOrder);
                setCountdown(10);
              } else {
                setStatus("ACTIVE");
                setCurrentOrder(normalizedOrder);
              }
            } catch (error) {
              console.error("Parse error:", error);
            }
          }
        });
      },
      (error) => {
        setIsConnected(false);
      }
    );

    return () => {
      if (stompClient.connected) stompClient.disconnect();
    };
  }, []);

  // Countdown cho SUCCESS và CANCELLED
  useEffect(() => {
    if (status === "SUCCESS" || status === "CANCELLED") {
      if (countdown > 0) {
        const timer = setTimeout(() => {
          setCountdown(countdown - 1);
        }, 1000);
        return () => clearTimeout(timer);
      } else {
        setStatus("IDLE");
        setCurrentOrder(null);
      }
    }
  }, [status, countdown]);

  const renderPaymentInfo = () => {
    if (currentOrder?.qrCodeString) {
      return (
        <div className="flex flex-col items-center animate-fade-in">
          <div className="bg-white p-5 rounded-2xl shadow-lg mb-3 border-2 border-orange-100">
            <QRCode value={currentOrder.qrCodeString} size={180} />
          </div>
          <div className="text-center">
            <p className="text-orange-600 font-bold text-base uppercase mb-1 flex items-center gap-2 justify-center">
              <QrCode size={20} weight="fill" />
              Quét mã VietQR
            </p>
            <p className="text-gray-500 text-sm">Chờ thanh toán...</p>
          </div>
        </div>
      );
    }

    if (
      currentOrder?.hinhThucThanhToan === "Chuyển khoản" ||
      currentOrder?.hinhThucThanhToan === "Cả hai"
    ) {
      return (
        <div className="text-center animate-fade-in">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-2xl inline-block mb-3 shadow-sm">
            <QrCode size={56} className="text-blue-600" weight="duotone" />
          </div>
          <p className="font-bold text-gray-700 text-lg">
            Chuyển khoản Ngân hàng
          </p>
          <p className="text-sm text-gray-400 mt-1">Vui lòng đợi mã QR...</p>
        </div>
      );
    }

    return (
      <div className="text-center opacity-70 animate-fade-in">
        <Storefront
          size={90}
          className="mx-auto mb-3 text-gray-300"
          weight="light"
        />
        <p className="font-medium text-gray-400 text-base">
          {currentOrder?.hinhThucThanhToan === "Tiền mặt"
            ? "Thanh toán Tiền mặt"
            : "Vui lòng thanh toán tại quầy"}
        </p>
      </div>
    );
  };

  // --- RENDER STATES ---
  if (status === "IDLE") return <IdleScreen />;
  if (status === "CANCELLED")
    return <CancelledScreen order={currentOrder} countdown={countdown} />;
  if (status === "SUCCESS")
    return <SuccessScreen order={currentOrder} countdown={countdown} />;

  // --- MAIN SCREEN ---
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col md:flex-row font-sans text-gray-800">
      {/* CỘT TRÁI: SẢN PHẨM */}
      <div className="w-full md:w-[65%] h-full flex flex-col p-4 md:p-6 md:pr-3">
        <div className="rounded-t-2xl px-6 py-5 flex items-center justify-between text-white shadow-md bg-gradient-to-r from-orange-500 to-orange-600">
          <div className="flex items-center">
            <Bag size={28} weight="fill" className="mr-3" />
            <div>
              <h2 className="text-xl font-bold uppercase">Giỏ hàng</h2>
              <p className="text-sm opacity-90">
                {currentOrder.items.length} sản phẩm
              </p>
            </div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl">
            <p className="text-xs opacity-90">Mã đơn</p>
            <p className="font-bold">{currentOrder.maHoaDon}</p>
          </div>
        </div>

        <div className="bg-white flex-grow rounded-b-2xl shadow-xl overflow-y-auto p-5 space-y-3 border-t-4 border-orange-500 custom-scrollbar">
          {currentOrder.items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <ShoppingCart
                size={100}
                weight="duotone"
                className="mb-4 text-orange-200"
              />
              <p className="text-2xl font-light">Chưa có sản phẩm...</p>
            </div>
          ) : (
            currentOrder.items.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center gap-4 p-4 border-2 border-gray-100 rounded-2xl bg-gradient-to-r from-white to-gray-50 hover:shadow-md transition-all duration-300 animate-slide-in"
                style={{ animationDelay: `${idx * 0.05}s` }}
              >
                <div className="w-20 h-20 bg-gray-100 rounded-xl overflow-hidden border-2 border-gray-200 flex-shrink-0 shadow-sm">
                  {item.anhUrls[0] ? (
                    <img
                      src={item.anhUrls[0]}
                      className="w-full h-full object-cover"
                      alt={item.tenSanPham}
                    />
                  ) : (
                    <TShirt size={40} className="m-auto mt-5 text-gray-300" />
                  )}
                </div>

                <div className="flex-grow min-w-0">
                  <h3 className="font-bold text-gray-800 text-base line-clamp-1 mb-1">
                    {item.tenSanPham}
                  </h3>
                  <div className="flex gap-2 flex-wrap">
                    {item.mauSac && (
                      <span className="text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-orange-600 px-3 py-1 rounded-full shadow-sm">
                        {item.mauSac}
                      </span>
                    )}
                    {item.kichThuoc && (
                      <span className="text-xs font-bold text-white bg-gradient-to-r from-gray-600 to-gray-700 px-3 py-1 rounded-full shadow-sm">
                        {item.kichThuoc}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <p className="text-xl font-extrabold text-orange-600">
                    {formatCurrency(item.thanhTien)}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    <span className="font-semibold">{item.soLuong}</span> ×{" "}
                    {formatCurrency(item.donGia)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* CỘT PHẢI: THANH TOÁN */}
      <div className="w-full md:w-[35%] h-full flex flex-col p-4 md:p-6 md:pl-3 space-y-4">
        {/* Card Khách hàng */}
        <div className="bg-white rounded-2xl shadow-lg p-5 border-l-4 border-orange-500">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-orange-100 p-3 rounded-full">
              <Sparkle size={24} className="text-orange-600" weight="fill" />
            </div>
            <div className="flex-grow">
              <p className="text-xs text-gray-500 uppercase font-semibold">
                Khách hàng
              </p>
              <h3 className="font-bold text-gray-800 text-lg">
                {currentOrder.tenKhachHang}
              </h3>
            </div>
          </div>

          {currentOrder.sdtKhachHang && (
            <div className="bg-gradient-to-r from-orange-50 to-orange-100 px-4 py-3 rounded-xl border border-orange-200">
              <p className="text-xs text-gray-600 mb-1">Số điện thoại</p>
              <p className="font-bold text-orange-700">
                {currentOrder.sdtKhachHang}
              </p>
            </div>
          )}
        </div>

        {/* Card Thanh toán */}
        <div className="bg-white rounded-2xl shadow-xl flex-grow flex flex-col overflow-hidden border-l-4 border-orange-500">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-5 py-4 border-b-2 border-gray-200 flex items-center gap-3">
            <Ticket size={24} className="text-orange-600" weight="fill" />
            <h3 className="font-bold text-gray-800 uppercase">
              Chi tiết thanh toán
            </h3>
          </div>

          <div className="p-6 flex-grow flex flex-col">
            {/* Mã giảm giá */}
            {currentOrder.maGiamGia && (
              <div className="mb-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-4 flex items-center gap-3 shadow-sm animate-fade-in">
                <div className="bg-green-500 p-2 rounded-lg">
                  <Tag size={24} className="text-white" weight="fill" />
                </div>
                <div>
                  <p className="text-xs text-gray-600 uppercase font-semibold">
                    Mã giảm giá
                  </p>
                  <p className="font-bold text-green-700 text-lg">
                    {currentOrder.maGiamGia}
                  </p>
                </div>
              </div>
            )}

            {/* Khu vực QR / Trạng thái thanh toán */}
            <div className="flex-grow flex flex-col items-center justify-center mb-5 min-h-[200px]">
              {renderPaymentInfo()}
            </div>

            {/* Tính tiền */}
            <div className="border-t-2 border-dashed border-gray-300 pt-5 space-y-3">
              <div className="flex justify-between text-gray-700">
                <span className="font-medium">Tổng tiền hàng</span>
                <b className="text-lg">
                  {formatCurrency(currentOrder.tongTien)}
                </b>
              </div>

              {currentOrder.tienGiam > 0 && (
                <div className="flex justify-between text-green-600">
                  <span className="font-medium">Giảm giá</span>
                  <b className="text-lg">
                    -{formatCurrency(currentOrder.tienGiam)}
                  </b>
                </div>
              )}

              {currentOrder.phiVanChuyen > 0 && (
                <div className="flex justify-between text-blue-600">
                  <span className="font-medium">Phí vận chuyển</span>
                  <b className="text-lg">
                    +{formatCurrency(currentOrder.phiVanChuyen)}
                  </b>
                </div>
              )}

              <div className="bg-gradient-to-br from-orange-50 via-orange-100 to-amber-50 p-5 rounded-2xl border-2 border-orange-300 mt-4 shadow-md">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-800 text-base">
                    Khách phải trả
                  </span>
                  <span className="text-4xl font-black bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                    {formatCurrency(
                      currentOrder.tongTienSauGiam || currentOrder.tongTien
                    )}
                  </span>
                </div>
              </div>

              <div className="text-center mt-3">
                <span className="text-sm text-white bg-gradient-to-r from-gray-600 to-gray-700 px-4 py-2 rounded-full uppercase font-bold shadow-sm">
                  {currentOrder.hinhThucThanhToan || "Chưa chọn"}
                </span>
              </div>

              {currentOrder.ghiChu && (
                <div className="text-xs text-gray-500 text-center mt-3 italic bg-gray-50 p-3 rounded-lg border border-gray-200">
                  {currentOrder.ghiChu}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Trạng thái kết nối */}
      <div className="fixed top-5 right-5 z-50">
        {isConnected ? (
          <div className="bg-green-500 text-white px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 shadow-lg animate-fade-in">
            <WifiHigh size={18} weight="fill" />
            <span>Đã kết nối</span>
          </div>
        ) : (
          <div className="bg-red-500 text-white px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 shadow-lg animate-pulse">
            <WifiSlash size={18} weight="fill" />
            <span>Mất kết nối</span>
          </div>
        )}
      </div>
    </div>
  );
}

// --- IDLE SCREEN ---
const IdleScreen = () => (
  <div className="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
    <div className="animate-float">
      <div className="text-8xl font-serif text-orange-600 font-black border-8 border-orange-500 p-10 rounded-full mb-6 bg-white shadow-2xl">
        AT
      </div>
    </div>
    <h1 className="text-6xl text-gray-800 font-light uppercase tracking-[0.5em] mb-4">
      Autumn
    </h1>
    <p className="text-gray-500 text-xl flex items-center gap-2">
      <Heart size={24} weight="fill" className="text-orange-500" />
      Chào mừng quý khách
      <Heart size={24} weight="fill" className="text-orange-500" />
    </p>
  </div>
);

// --- SUCCESS SCREEN ---
const SuccessScreen = ({ order, countdown }) => (
  <div className="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50">
    <div className="animate-bounce-slow mb-6">
      <CheckCircle
        size={140}
        className="text-green-500 drop-shadow-2xl"
        weight="fill"
      />
    </div>
    <h1 className="text-5xl font-black text-gray-800 mb-3">
      Thanh toán thành công!
    </h1>
    <p className="text-gray-600 text-xl mb-2">Cảm ơn quý khách đã mua hàng</p>
    <div className="bg-white px-6 py-3 rounded-2xl shadow-lg mt-4 border-2 border-green-300">
      <p className="text-gray-500 text-sm">Mã đơn hàng</p>
      <p className="font-bold text-2xl text-green-600">{order?.maHoaDon}</p>
    </div>
    <p className="text-gray-400 text-sm mt-6">Tự động đóng sau {countdown}s</p>
  </div>
);

// --- CANCELLED SCREEN ---
const CancelledScreen = ({ order, countdown }) => (
  <div className="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
    <div className="animate-shake mb-6">
      <XCircle
        size={140}
        className="text-red-500 drop-shadow-2xl"
        weight="fill"
      />
    </div>
    <h1 className="text-5xl font-black text-gray-800 mb-3">Đơn hàng đã hủy</h1>
    <p className="text-gray-600 text-xl">Giao dịch không thành công</p>
    <div className="bg-white px-6 py-3 rounded-2xl shadow-lg mt-4 border-2 border-red-300">
      <p className="text-gray-500 text-sm">Mã đơn hàng</p>
      <p className="font-bold text-2xl text-red-600">{order?.maHoaDon}</p>
    </div>
    <p className="text-gray-400 text-sm mt-6">Tự động đóng sau {countdown}s</p>
  </div>
);

// Custom CSS
const style = document.createElement("style");
style.textContent = `
 .custom-scrollbar::-webkit-scrollbar {
   width: 10px;
 }
 .custom-scrollbar::-webkit-scrollbar-track {
   background: #f1f1f1;
   border-radius: 10px;
 }
 .custom-scrollbar::-webkit-scrollbar-thumb {
   background: linear-gradient(180deg, #E67E22, #D35400);
   border-radius: 10px;
 }
 .custom-scrollbar::-webkit-scrollbar-thumb:hover {
   background: linear-gradient(180deg, #D35400, #BA4A00);
 }
  @keyframes fadeIn {
   from { opacity: 0; }
   to { opacity: 1; }
 }
  @keyframes slideIn {
   from {
     opacity: 0;
     transform: translateX(-20px);
   }
   to {
     opacity: 1;
     transform: translateX(0);
   }
 }
  @keyframes float {
   0%, 100% { transform: translateY(0px); }
   50% { transform: translateY(-20px); }
 }
  @keyframes bounceSlow {
   0%, 100% { transform: translateY(0); }
   50% { transform: translateY(-30px); }
 }
  @keyframes shake {
   0%, 100% { transform: translateX(0); }
   25% { transform: translateX(-10px); }
   75% { transform: translateX(10px); }
 }
  .animate-fade-in {
   animation: fadeIn 0.4s ease-in;
 }
  .animate-slide-in {
   animation: slideIn 0.5s ease-out backwards;
 }
  .animate-float {
   animation: float 3s ease-in-out infinite;
 }
  .animate-bounce-slow {
   animation: bounceSlow 2s ease-in-out infinite;
 }
  .animate-shake {
   animation: shake 0.5s ease-in-out;
 }
`;
document.head.appendChild(style);
