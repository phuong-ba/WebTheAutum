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
} from "lucide-react";
import { ClockIcon, CreditCardIcon, PackageIcon, XCircleIcon } from "@phosphor-icons/react";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { orderDetail } from "@/services/orderService";
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
  const [messageApi, contextHolder] = message.useMessage();
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  useEffect(() => {
    if (id) {
      dispatch(orderDetail(id));
    }
  }, [dispatch, id]);

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
  const handleCancelOrder = () => {
    if (data.trangThai !== 0) {
      messageApi.warning("Chỉ có thể hủy đơn hàng ở trạng thái Chờ xác nhận!");
      return;
    }
    setIsCancelModalOpen(true);
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

      // Tải lại dữ liệu đơn hàng để cập nhật trạng thái
      dispatch(orderDetail(id));
    } catch (error) {
      console.error("Lỗi hủy đơn:", error);
      messageApi.error("Hủy đơn hàng thất bại! Vui lòng thử lại.");
    } finally {
      setIsCancelModalOpen(false);
    }
  };
  // Lấy địa chỉ mặc định (địa chỉ đầu tiên trong mảng)
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
          {data.trangThai === 0 && (
            <button
              onClick={handleCancelOrder}
              className="px-6 py-3 rounded-full bg-white text-orange-600 hover:bg-orange-100 transition-all font-bold text-sm shadow-md"
            >
              Hủy đơn hàng
            </button>
          )}
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
                      <Clock className="w-4 h-4 text-gray-400" /> Tạm tính
                    </span>

                    <span>{formatVND(data.tongTien || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-gray-400" /> Phí vận chuyển
                    </span>
                    <span>{formatVND(data.phiVanChuyen || 0)}</span>
                  </div>

                  {data.giaTriGiamGia > 0 && (
                    <div className="flex justify-between items-center text-green-600 font-semibold">
                      <span className="flex items-center gap-2">
                        <PackageIcon className="w-4 h-4" />
                        Giảm giá ({data.maGiamGia || "Mã giảm giá"})
                      </span>
                      <span>-{formatVND(data.giaTriGiamGia)}</span>
                    </div>
                  )}

                  <div className="border-t pt-3">
                    <div className="flex justify-between text-lg font-bold text-gray-900">
                      <span>Tổng cộng</span>
                      <span className="text-orange-500">
                        {formatVND(data.tongTienSauGiam)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t">
                  <div className="flex items-center gap-2 text-gray-600 mb-3">
                    <CreditCardIcon className="w-5 h-5" />
                    <span className="font-medium">Phương thức thanh toán</span>
                  </div>
                  <div className="bg-orange-50 text-orange-700 font-medium px-4 py-3 rounded-lg border border-orange-200 flex items-center gap-2">
                    <CreditCardIcon size={16} /> {data.hinhThucThanhToan} (COD)
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
    </>
  );
}
