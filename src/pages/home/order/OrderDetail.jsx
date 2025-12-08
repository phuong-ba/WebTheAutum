import React, { useEffect, useState } from "react";
import {
  Package,
  Truck,
  MapPin,
  Phone,
  User,
  Clock,
  CheckCircle,
  XCircle,
  QrCode,
} from "lucide-react";
import {
  ClockIcon,
  CreditCardIcon,
  PackageIcon,
  XCircleIcon,
  Copy,
  Check,
} from "@phosphor-icons/react";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  orderDetail,
  taoVietQR,
  checkTrangThaiThanhToan,
  updateThanhToan,
} from "@/services/orderService";
import { formatVND } from "@/api/formatVND";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { message, Modal } from "antd";
import hoaDonApi from "@/api/HoaDonAPI";

const safeFormatHeader = (dateString) => {
  if (!dateString) return "Chưa có thông tin";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "Ngày không hợp lệ";
  return format(date, "HH:mm - dd 'tháng' MM, yyyy", { locale: vi });
};

const safeFormatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";
  return format(date, "dd/MM/yyyy HH:mm", { locale: vi });
};

export default function OrderDetailPage() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const data = useSelector((state) => state.order.dataDetail);
  const loading = useSelector((state) => state.order.loading);
  const qrLoading = useSelector((state) => state.order.loadingQR);
  const qrData = useSelector((state) => state.order.qrData);

  const [messageApi, contextHolder] = message.useMessage();
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [customerId, setCustomerId] = useState(null);
  const [copied, setCopied] = useState(false);
  const [qrGenerated, setQrGenerated] = useState(false);
  const [currentQrUrl, setCurrentQrUrl] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const storedCustomerId = localStorage.getItem("customer_id");
    setCustomerId(storedCustomerId);
    setIsLoggedIn(!!storedCustomerId);

    if (!id) return;

    dispatch(orderDetail(id));

    const interval = setInterval(() => {
      dispatch(orderDetail(id));
    }, 15000);

    return () => clearInterval(interval);
  }, [id, dispatch]);

  useEffect(() => {
    if (isQRModalOpen && id && qrGenerated) {
      const interval = setInterval(() => {
        dispatch(checkTrangThaiThanhToan(id)).then((res) => {
          if (
            res.payload?.daThanhToan ||
            res.payload?.soTienCanThanhToan === 0
          ) {
            messageApi.success("Hệ thống phát hiện đã thanh toán!");
            setIsQRModalOpen(false);
            dispatch(orderDetail(id));
          }
        });
      }, 15000);

      return () => clearInterval(interval);
    }
  }, [isQRModalOpen, id, qrGenerated, dispatch, messageApi]);

  if (loading) {
    return (
      <div className="flex justify-center py-20 text-lg text-orange-500 animate-pulse">
        Đang tải chi tiết đơn hàng...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-20 text-gray-500">
        Không tìm thấy đơn hàng
      </div>
    );
  }

  const handleTransferClick = () => {
    if (!isLoggedIn) {
      messageApi.warning(
        "Vui lòng đăng nhập để sử dụng tính năng chuyển khoản!"
      );
      return;
    }

    if (!data.soTienCanThanhToan || data.soTienCanThanhToan <= 0) {
      messageApi.info("Đơn hàng đã được thanh toán đủ!");
      return;
    }

    const qrRequest = {
      amount: data.soTienCanThanhToan ?? 0,
      noiDung: data.maHoaDon ? `TTDH${data.maHoaDon}` : "TTDH",
      orderId: data.id ?? "",
      tenKhachHang: data.khachHang?.hoTen || "Khách hàng",
    };

    dispatch(taoVietQR(qrRequest))
      .unwrap()
      .then((result) => {
        const qrUrl = result.qrImageUrl || result.paymentUrl;

        if (qrUrl) {
          setCurrentQrUrl(qrUrl);
          setQrGenerated(true);
          setIsQRModalOpen(true);
          messageApi.success("Đã tạo mã QR thanh toán!");
        } else {
          messageApi.error("Không nhận được mã QR từ server!");
        }
      })
      .catch((err) => {
        console.error("Lỗi tạo QR:", err);
        messageApi.error("Lỗi tạo mã QR! Vui lòng thử lại.");
      });
  };

  const handleCancelOrder = () => {
    if (data.trangThai !== 0) {
      messageApi.warning("Chỉ có thể hủy đơn hàng ở trạng thái Chờ xác nhận!");
      return;
    }
    setIsCancelModalOpen(true);
  };

  const shouldShowCancelButton = () => {
    const isStatusZero = data.trangThai === 0;
    const isCustomerMatch =
      customerId &&
      data.khachHang?.id &&
      customerId.toString() === data.khachHang.id.toString();
    return isStatusZero && isCustomerMatch;
  };

  const shouldShowTransferButton = () => {
    const allowedStatusForPayment = [0];

    return (
      isLoggedIn &&
      data.soTienCanThanhToan > 0 &&
      data.trangThai !== 4 &&
      data.soTienThanhToan < data.tongTienSauGiam &&
      allowedStatusForPayment.includes(data.trangThai)
    );
  };

  const confirmCancelOrder = async () => {
    try {
      await hoaDonApi.updateHoaDon(id, {
        trangThai: 4,
      });

      messageApi.success({
        content: "Đơn hàng đã được hủy thành công!",
        icon: <XCircleIcon size={20} weight="fill" className="text-red-500" />,
        duration: 4,
      });

      dispatch(orderDetail(id));
    } catch (error) {
      console.error("Lỗi hủy đơn:", error);
      messageApi.error("Hủy đơn hàng thất bại! Vui lòng thử lại.");
    } finally {
      setIsCancelModalOpen(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopied(true);
        messageApi.success("Đã sao chép!");
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {
        messageApi.error("Lỗi sao chép!");
      });
  };

  const defaultAddress = data.khachHang?.diaChi?.[0] || null;
  const addressText = defaultAddress
    ? `${defaultAddress.diaChiCuThe}, ${defaultAddress.tenQuan || ""}, ${
        defaultAddress.tenTinh || ""
      }`
    : "Chưa cập nhật địa chỉ";

  const OrderStatusTimeline = () => {
    const steps = [
      { status: 0, label: "Chờ xác nhận", icon: Clock, color: "bg-green-500" },
      {
        status: 1,
        label: "Chờ giao hàng",
        icon: Package,
        color: "bg-gray-400",
      },
      { status: 2, label: "Đang giao hàng", icon: Truck, color: "bg-gray-400" },
      {
        status: 3,
        label: "Đã hoàn thành",
        icon: CheckCircle,
        color: "bg-gray-400",
      },
      { status: 4, label: "Đã hủy", icon: XCircle, color: "bg-red-500" },
    ];

    const currentStatus = data.trangThai || 0;
    const isCanceled = currentStatus === 4;

    return (
      <div className="bg-gradient-to-r from-white to-gray-50 rounded-2xl shadow-md p-8 mb-8">
        <div className="relative flex items-center justify-between">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = isCanceled
              ? index === 4
              : currentStatus >= step.status;
            const isCurrent = currentStatus === step.status;

            return (
              <div key={index} className="flex flex-col items-center flex-1">
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-500 shadow-md ${
                    isActive
                      ? isCanceled && index === 4
                        ? "bg-red-500 text-white"
                        : "bg-green-500 text-white"
                      : "bg-gray-200 text-gray-400"
                  }`}
                >
                  <Icon size={32} weight={isActive ? "fill" : "regular"} />
                </div>
                <div className="mt-4 text-center">
                  <p
                    className={`font-medium text-sm ${
                      isActive
                        ? isCanceled && index === 4
                          ? "text-red-600"
                          : "text-green-600"
                        : "text-gray-500"
                    }`}
                  >
                    {step.label}
                  </p>
                  {isCurrent && (
                    <p className="text-xs text-gray-500 mt-1">
                      {safeFormatDate(
                        isCanceled ? data.ngayThanhToan : data.ngayTao
                      )}
                    </p>
                  )}
                </div>
              </div>
            );
          })}

          <div className="absolute top-8 left-16 right-16 h-0.5 bg-gray-200 -z-10">
            <div
              className={`h-full transition-all duration-700 ${
                isCanceled ? "bg-red-500" : "bg-green-500"
              }`}
              style={{
                width: isCanceled
                  ? "100%"
                  : `${(currentStatus / (steps.length - 1)) * 100}%`,
              }}
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {contextHolder}
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 border-b flex justify-between items-center px-6 py-6 shadow-md">
          <div className="flex items-start gap-4">
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <ClockIcon size={40} weight="bold" className="text-orange-500" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">
                Chi tiết đơn hàng #{data.maHoaDon}
              </h1>
              <p className="text-orange-100 mt-1">
                Đặt ngày {safeFormatHeader(data.ngayTao)}
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            {shouldShowTransferButton() && (
              <button
                onClick={handleTransferClick}
                disabled={qrLoading}
                className={`px-6 py-3 rounded-full font-bold text-sm shadow-md text-center transition-all flex items-center gap-2 ${
                  qrLoading
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-white text-orange-600 hover:bg-orange-100"
                }`}
              >
                <QrCode size={16} />
                {qrLoading ? "Đang tạo QR..." : "Chuyển khoản"}
              </button>
            )}

            {!isLoggedIn &&
              data.soTienCanThanhToan > 0 &&
              data.trangThai === 0 && (
                <div className="px-4 py-2 bg-amber-100 text-amber-800 rounded-lg flex items-center gap-2">
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-sm font-medium">
                    Đăng nhập để thanh toán
                  </span>
                </div>
              )}

            {isLoggedIn &&
              data.soTienCanThanhToan > 0 &&
              data.trangThai > 0 &&
              data.trangThai < 4 && (
                <div className="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg flex items-center gap-2">
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-sm font-medium">
                    Đơn hàng đã xác nhận, liên hệ hỗ trợ nếu cần thanh toán
                  </span>
                </div>
              )}

            {shouldShowCancelButton() && (
              <button
                onClick={handleCancelOrder}
                className="px-6 py-3 rounded-full bg-white text-orange-600 hover:bg-orange-100 transition-all font-bold text-sm shadow-md text-center"
              >
                Hủy đơn hàng
              </button>
            )}
          </div>
        </div>

        <div className="px-4 py-8">
          <OrderStatusTimeline />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-3 mb-6">
                  <PackageIcon size={28} className="text-orange-500" />
                  <h2 className="text-xl font-semibold">
                    Sản phẩm đã đặt ({data.chiTietSanPhams?.length || 0})
                  </h2>
                </div>
                <div className="space-y-4">
                  {data.chiTietSanPhams?.map((item, index) => (
                    <div
                      key={index}
                      className="flex gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all"
                    >
                      <div className="w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden bg-gray-100 shadow-sm">
                        {item.anhUrls?.[0] ? (
                          <img
                            src={item.anhUrls[0]}
                            alt={item.tenSanPham}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full border-2 border-dashed border-gray-300 rounded-xl" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 line-clamp-2 hover:text-orange-600 transition-colors">
                          {item.tenSanPham}
                        </h4>
                        <div className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                          <span className="inline-block w-3 h-3 rounded-full bg-orange-300"></span>{" "}
                          Màu: {item.mauSac}
                          <span className="ml-2">•</span>
                          <span className="inline-block w-3 h-3 rounded-full bg-gray-300"></span>{" "}
                          Size: {item.kichThuoc}
                        </div>
                        <div className="flex justify-between items-end mt-4">
                          <span className="text-sm text-gray-600">
                            x{item.soLuong}
                          </span>
                          <span className="font-semibold text-orange-600">
                            {formatVND(item.giaSauGiam)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <Truck className="w-6 h-6 text-orange-500" />
                  <h3 className="text-lg font-semibold">Thông tin giao hàng</h3>
                </div>
                <div className="space-y-4 text-gray-700">
                  <div className="flex items-start gap-3">
                    <User className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <div className="font-medium">
                        {data.khachHang?.hoTen || "Khách vãng lai"}
                      </div>
                      {data.khachHang?.maKhachHang && (
                        <div className="text-sm text-gray-500">
                          Mã KH: {data.khachHang.maKhachHang}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <span>{data.khachHang?.sdt || "Chưa cập nhật"}</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                    <span className="leading-relaxed">{addressText}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-md p-6 hover:shadow-lg transition-shadow animate-fadeIn">
                <h3 className="font-semibold text-lg mb-4">Tóm tắt đơn hàng</h3>
                <div className="space-y-3 text-gray-600">
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-gray-400" /> Tạm tính
                    </span>
                    <span>{formatVND(data.tongTien || 0)}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-gray-400" /> Phí vận chuyển
                    </span>
                    <span>
                      {data.phiVanChuyen > 0
                        ? formatVND(data.phiVanChuyen)
                        : "Miễn phí"}
                    </span>
                  </div>

                  {data.giaTriGiamGia > 0 && (
                    <div className="flex justify-between items-center text-green-600 font-semibold">
                      <span className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Giảm giá {data.maGiamGia ? `(${data.maGiamGia})` : ""}
                      </span>
                      <span>-{formatVND(data.giaTriGiamGia)}</span>
                    </div>
                  )}

                  {(data.phiPhu > 0 || data.phiPhuMoi > 0) && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-amber-600 font-semibold">
                        <span className="flex items-center gap-2">
                          <svg
                            className="w-4 h-4"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 2a8 8 0 100 16 8 8 0 000-16zM9 9a1 1 0 012 0v3a1 1 0 11-2 0V9zm1-5a1 1 0 00-1 1v1a1 1 0 002 0V5a1 1 0 00-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Phụ phí
                        </span>
                        <span>
                          +
                          {formatVND(
                            (data.phiPhu || 0) + (data.phiPhuMoi || 0)
                          )}
                        </span>
                      </div>

                      {data.phiPhuDetails && data.phiPhuDetails.length > 0 && (
                        <div className="ml-6 space-y-1 text-sm">
                          {data.phiPhuDetails.map((detail, index) => (
                            <div
                              key={index}
                              className="flex justify-between text-amber-700"
                            >
                              <span className="text-xs">
                                • {detail.ten || detail.loai}
                              </span>
                              <span className="text-xs">
                                +{formatVND(detail.soTien || 0)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="border-t pt-3 mt-2">
                    <div className="flex justify-between text-lg font-bold text-gray-900">
                      <span>Tổng cộng</span>
                      <span className="text-orange-500">
                        {formatVND(data.tongTienSauGiam || 0)}
                      </span>
                    </div>
                  </div>

                  {data.soTienThanhToan > 0 && (
                    <div className="flex justify-between items-center pt-3 border-t border-dashed">
                      <span className="flex items-center gap-2 text-gray-700 font-medium">
                        <CreditCardIcon className="w-4 h-4 text-green-500" />
                        Đã thanh toán
                      </span>
                      <span className="text-green-600 font-bold">
                        {formatVND(data.soTienThanhToan)}
                      </span>
                    </div>
                  )}

                  {data.soTienCanThanhToan > 0 && (
                    <div className="flex justify-between items-center pt-3 border-t border-dashed">
                      <span className="flex items-center gap-2 text-gray-700 font-medium">
                        <svg
                          className="w-4 h-4 text-blue-500"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Cần thanh toán
                      </span>
                      <span className="text-blue-600 font-bold">
                        {formatVND(data.soTienCanThanhToan)}
                      </span>
                    </div>
                  )}

                  {data.phiPhuDetails && data.phiPhuDetails.length > 0 && (
                    <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-sm text-amber-800 font-medium mb-1">
                        📝 Ghi chú phụ phí:
                      </p>
                      <ul className="text-xs text-amber-700 space-y-1">
                        {data.phiPhuDetails.map((detail, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 bg-amber-400 rounded-full mt-1.5 flex-shrink-0"></span>
                            <span>
                              {detail.ghiChu || detail.ten} -
                              <span className="font-semibold ml-1">
                                +{formatVND(detail.soTien || 0)}
                              </span>
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">
                        Trạng thái thanh toán:
                      </span>
                      <span
                        className={`font-semibold ${
                          data.soTienCanThanhToan === 0
                            ? "text-green-600"
                            : "text-orange-600"
                        }`}
                      >
                        {data.soTienCanThanhToan === 0
                          ? "Đã thanh toán đủ"
                          : "Chưa thanh toán đủ"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t">
                  <div className="flex items-center gap-2 text-gray-600 mb-3">
                    <CreditCardIcon className="w-5 h-5" />
                    <span className="font-medium">Phương thức thanh toán</span>
                  </div>
                  <div className="bg-orange-50 text-orange-700 font-medium px-4 py-3 rounded-lg border border-orange-200 flex items-center gap-2 mb-2">
                    <CreditCardIcon size={16} /> {data.hinhThucThanhToan}
                  </div>
                  {data.ghiChuThanhToan && (
                    <p className="text-sm text-gray-500 mt-2 italic">
                      {data.ghiChuThanhToan}
                    </p>
                  )}
                </div>

                <div className="mt-6 space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Mã giao dịch</span>
                    <span className="font-medium">{data.maGiaoDich}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Nhân viên tạo</span>
                    <span className="font-medium">{data.tenNhanVien}</span>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="flex gap-2 text-orange-700 text-sm">
                    <svg
                      className="w-5 h-5 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <p>
                      Vui lòng kiểm tra kỹ thông tin trước khi nhận hàng.
                      <br />
                      Liên hệ hotline nếu cần hỗ trợ.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Modal
        open={isCancelModalOpen}
        onCancel={() => setIsCancelModalOpen(false)}
        footer={null}
        centered
        width={520}
      >
        <div className="text-center py-6">
          <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <XCircleIcon size={48} weight="fill" className="text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Xác nhận hủy đơn hàng?
          </h2>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Bạn có chắc chắn muốn{" "}
            <strong className="text-red-600">
              hủy đơn hàng #{data.maHoaDon}
            </strong>{" "}
            này không? Hành động này <strong>không thể hoàn tác</strong>.
          </p>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-left">
            <ul className="text-sm text-yellow-800 space-y-2">
              <li>
                • Đơn hàng sẽ chuyển sang trạng thái <strong>ĐÃ HỦY</strong>
              </li>
              <li>• Tất cả sản phẩm sẽ được hoàn lại tồn kho</li>
              <li>• Khách hàng sẽ được thông báo (nếu có)</li>
              <li>• Không thể khôi phục sau khi hủy</li>
            </ul>
          </div>

          <div className="flex justify-center gap-4">
            <button
              onClick={() => setIsCancelModalOpen(false)}
              className="px-6 py-3 rounded-lg border border-gray-300 hover:bg-gray-50 font-semibold text-gray-700 transition"
            >
              Quay lại
            </button>
            <button
              onClick={confirmCancelOrder}
              className="px-8 py-3 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700 active:bg-red-800 transition shadow-lg"
            >
              Xác nhận hủy đơn
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        open={isQRModalOpen}
        onCancel={() => setIsQRModalOpen(false)}
        footer={null}
        centered
        width={520}
      >
        <div className="text-center py-6">
          <div className="mx-auto w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <QrCode size={48} className="text-blue-600" />
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Thanh toán chuyển khoản
          </h2>
          <p className="text-gray-600 mb-6">
            Quét mã QR hoặc chuyển khoản theo thông tin bên dưới
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <div className="flex justify-between items-center">
              <span className="text-gray-700 font-medium">
                Số tiền cần chuyển:
              </span>
              <span className="text-2xl font-bold text-blue-600">
                {formatVND(data.soTienCanThanhToan)}
              </span>
            </div>
            <div className="mt-2 text-sm text-gray-500">
              Đơn hàng: <span className="font-semibold">#{data.maHoaDon}</span>
            </div>
          </div>
          {currentQrUrl ? (
            <div className="mb-6">
              <div className="bg-white p-4 rounded-lg inline-block border shadow-lg">
                <img
                  src={currentQrUrl}
                  alt="Mã QR thanh toán"
                  className="w-64 h-64 mx-auto"
                />
              </div>
              <p className="text-sm text-gray-500 mt-3">
                Quét mã QR để thanh toán nhanh
              </p>
            </div>
          ) : (
            <div className="mb-6">
              <div className="bg-gray-100 w-64 h-64 mx-auto rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-3"></div>
                  <p className="text-gray-500">Đang tạo mã QR...</p>
                </div>
              </div>
            </div>
          )}

          {qrData?.bankInfo && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left space-y-3">
              <h3 className="font-semibold text-gray-900 mb-2">
                Thông tin ngân hàng:
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-sm text-gray-500">Ngân hàng</div>
                  <div className="font-medium">{qrData.bankInfo.bankName}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Số tài khoản</div>
                  <div className="font-medium">
                    {qrData.bankInfo.accountNumber}
                  </div>
                </div>
                <div className="col-span-2">
                  <div className="text-sm text-gray-500">Chủ tài khoản</div>
                  <div className="font-medium">
                    {qrData.bankInfo.accountHolder}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-500">
                Nội dung chuyển khoản:
              </span>
              <button
                onClick={() => copyToClipboard(`TTDH${data.maHoaDon}`)}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? "Đã copy" : "Copy"}
              </button>
            </div>
            <div className="bg-white border rounded p-3 font-mono text-center text-gray-900 font-semibold">
              TTDH{data.maHoaDon}
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-left">
            <h4 className="font-semibold text-yellow-800 mb-2">
              📌 Hướng dẫn:
            </h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>1. Quét mã QR bằng ứng dụng ngân hàng</li>
              <li>2. Hoặc chuyển khoản với nội dung chính xác như trên</li>
              <li>3. Thanh toán sẽ được xác nhận tự động trong 5-10 phút</li>
              <li>4. Nếu có vấn đề, vui lòng liên hệ hotline</li>
            </ul>
          </div>

          <div className="flex justify-center gap-4">
            <button
              onClick={() => setIsQRModalOpen(false)}
              className="px-6 py-3 rounded-lg border border-gray-300 hover:bg-gray-50 font-semibold text-gray-700 transition"
            >
              Đóng
            </button>
            <button
              onClick={() => {
                const thanhToanRequest = {
                  idHoaDon: data.id,
                  soTienThanhToan: data.soTienCanThanhToan,
                  idPhuongThucThanhToan: 2,
                  ghiChu: `Thanh toán chuyển khoản QR - Khách xác nhận tự động lúc ${new Date().toLocaleString(
                    "vi-VN"
                  )}`,
                  maGiaoDich: `TTDH${data.maHoaDon}`,
                };

                dispatch(updateThanhToan(thanhToanRequest))
                  .unwrap()
                  .then((result) => {
                    if (result.success) {
                      messageApi.success({
                        content: result.message || "Thanh toán thành công!",
                        duration: 5,
                      });
                      setIsQRModalOpen(false);
                      dispatch(orderDetail(id));
                    } else {
                      messageApi.error(
                        result.message || "Thanh toán không thành công!"
                      );
                    }
                  })
                  .catch((err) => {
                    console.error("Lỗi xác nhận thanh toán:", err);
                    const errorMsg =
                      err?.message ||
                      "Không thể xác nhận thanh toán. Vui lòng thử lại!";
                    messageApi.error(errorMsg);
                  });
              }}
              disabled={qrLoading}
              className={`px-8 py-3 rounded-lg font-bold transition ${
                qrLoading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
              }`}
            >
              {qrLoading ? "Đang xử lý..." : "Xác nhận đã nhận tiền"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
