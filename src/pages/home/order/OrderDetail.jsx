import React, { useEffect } from "react";
import {
  Package,
  Truck,
  MapPin,
  Phone,
  User,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { ClockIcon, CreditCardIcon, PackageIcon } from "@phosphor-icons/react";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { orderDetail } from "@/services/orderService";
import { formatVND } from "@/api/formatVND";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

// Hàm format ngày an toàn 100%
const safeFormatDate = (dateString) => {
  if (!dateString) return "Chưa có thông tin";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "Ngày không hợp lệ";
  return format(date, "HH:mm dd/MM/yyyy", { locale: vi });
};

const safeFormatHeader = (dateString) => {
  if (!dateString) return "Chưa có thông tin";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "Ngày không hợp lệ";
  return format(date, "HH:mm - dd 'tháng' MM, yyyy", { locale: vi });
};

export default function OrderDetailPage() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const data = useSelector((state) => state.order.dataDetail);
  const loading = useSelector((state) => state.order.loading);

  useEffect(() => {
    if (id) {
      dispatch(orderDetail(id));
    }
  }, [dispatch, id]);

  if (loading) {
    return (
      <div className="flex justify-center py-20 text-lg">
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
      <div className="bg-white rounded-2xl shadow-sm p-8 mb-8">
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
                  className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-500 shadow-lg ${
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
                  {/* {isCurrent && (
                    <p className="text-xs text-gray-500 mt-1">
                      {safeFormatDate(data.ngayTao)}
                    </p>
                  )} */}
                </div>
              </div>
            );
          })}

          <div className="absolute top-8 left-16 right-16 h-0.5 bg-gray-300 -z-10">
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-start gap-4">
            <div className="bg-orange-500 rounded-xl p-4">
              <ClockIcon size={40} weight="bold" className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Chi tiết đơn hàng #{data.maHoaDon}
              </h1>
              <p className="text-gray-500 mt-1">
                Đặt ngày {safeFormatHeader(data.ngayTao)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <OrderStatusTimeline />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm p-6">
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
                    className="flex gap-4 p-4 bg-gray-50 rounded-xl"
                  >
                    <div className="w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden bg-gray-100">
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
                      <h4 className="font-medium text-gray-900 line-clamp-2">
                        {item.tenSanPham}
                      </h4>
                      <div className="text-sm text-gray-500 mt-1">
                        Màu: {item.mauSac} • Size: {item.kichThuoc}
                      </div>
                      <div className="flex justify-between items-end mt-4">
                        <span className="text-sm text-gray-600">
                          x{item.soLuong}
                        </span>
                        <span className="font-semibold text-orange-600">
                          {formatVND(
                            item.thanhTien || item.giaBan * item.soLuong
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Thông tin giao hàng */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
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
                  <span>{data.diaChiKhachHang || "Chưa cập nhật địa chỉ"}</span>
                </div>
              </div>
            </div>

            {/* Tóm tắt thanh toán */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h3 className="font-semibold text-lg mb-4">Tóm tắt đơn hàng</h3>
              <div className="space-y-3 text-gray-600">
                <div className="flex justify-between">
                  <span>Tạm tính</span>
                  <span>{formatVND(data.soTien || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Phí vận chuyển</span>
                  <span>{formatVND(data.phiVanChuyen || 0)}</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between text-lg font-bold text-gray-900">
                    <span>Tổng cộng</span>
                    <span className="text-orange-500">
                      {formatVND(data.tongTienSauGiam + data.phiVanChuyen)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t">
                <div className="flex items-center gap-2 text-gray-600 mb-3">
                  <CreditCardIcon className="w-5 h-5" />
                  <span className="font-medium">Phương thức thanh toán</span>
                </div>
                <div className="bg-orange-50 text-orange-700 font-medium px-4 py-3 rounded-lg border border-orange-200">
                  {data.hinhThucThanhToan} (COD)
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
  );
}
