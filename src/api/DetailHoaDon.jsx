import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import hoaDonApi from "../../api/HoaDonAPI";

const DetailHoaDon = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [canEdit, setCanEdit] = useState(false);

  useEffect(() => {
    fetchInvoiceDetail();
    checkCanEdit(); // ⭐ Thêm dòng này
  }, [id]);

  useEffect(() => {
    if (location.state?.refreshData) {
      fetchInvoiceDetail();
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [location.state?.refreshData]);

  const fetchInvoiceDetail = async () => {
    try {
      setLoading(true);

      const response = await hoaDonApi.getDetail(id);

      const invoiceData = response.data?.data || response.data;

      if (!invoiceData || !invoiceData.id) {
        throw new Error("Dữ liệu hóa đơn không hợp lệ");
      }

      setInvoice(invoiceData);
      setError(null);
    } catch (err) {
      console.error("❌ Lỗi tải chi tiết hóa đơn:", err);
      console.error("❌ Error response:", err.response);
      console.error("❌ Error message:", err.message);
      setError("Không thể tải thông tin hóa đơn");
    } finally {
      setLoading(false);
    }
  };

  const checkCanEdit = async () => {
    try {
      const res = await hoaDonApi.canEdit(id);
      setCanEdit(res.data?.canEdit || false);
    } catch (error) {
      console.error("Error checking edit permission:", error);
      setCanEdit(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleEdit = () => {
    navigate(`/bill/edit/${id}`);
  };

  useEffect(() => {
    fetchInvoiceDetail();
  }, [id]);

  const formatMoney = (amount) => {
    if (!amount && amount !== 0) return "0 ₫";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case 0:
        return {
          label: "⏳ Chờ xác nhận",
          color: "bg-yellow-100 text-yellow-700 ring-yellow-600/20",
        };
      case 1:
        return {
          label: "💳 Chờ thanh toán",
          color: "bg-blue-100 text-blue-700 ring-blue-600/20",
        };
      case 2:
        return {
          label: "✅ Đã thanh toán",
          color: "bg-green-100 text-green-700 ring-green-600/20",
        };
      case 3:
        return {
          label: "❌ Đã hủy",
          color: "bg-red-100 text-red-700 ring-red-600/20",
        };
      default:
        return {
          label: "❓ Không xác định",
          color: "bg-gray-100 text-gray-700 ring-gray-600/20",
        };
    }
  };

  const getLoaiHoaDonInfo = (loaiHoaDon) => {
    if (loaiHoaDon === null || loaiHoaDon === undefined) {
      return {
        label: "—",
        color: "bg-gray-100 text-gray-700 ring-gray-600/20",
      };
    }
    if (typeof loaiHoaDon === "boolean" || typeof loaiHoaDon === "number") {
      const isOnline = Boolean(loaiHoaDon);
      return isOnline
        ? {
            label: "💻 Online",
            color: "bg-purple-100 text-purple-700 ring-purple-600/20",
          }
        : {
            label: "🏪 Tại quầy",
            color: "bg-green-100 text-green-700 ring-green-600/20",
          };
    }
    switch (loaiHoaDon) {
      case "Hóa đơn online":
      case "Online":
        return {
          label: "💻 Online",
          color: "bg-purple-100 text-purple-700 ring-purple-600/20",
        };
      case "Hóa đơn tại cửa hàng":
      case "Tại quầy":
        return {
          label: "🏪 Tại quầy",
          color: "bg-green-100 text-green-700 ring-green-600/20",
        };
      case "Hóa đơn bán lẻ":
        return {
          label: "🛒 Bán lẻ",
          color: "bg-blue-100 text-blue-700 ring-blue-600/20",
        };
      case "Hóa đơn bán sỉ":
        return {
          label: "📦 Bán sỉ",
          color: "bg-orange-100 text-orange-700 ring-orange-600/20",
        };
      default:
        return {
          label: String(loaiHoaDon),
          color: "bg-gray-100 text-gray-700 ring-gray-600/20",
        };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
          <p className="text-gray-600 font-medium">
            Đang tải thông tin hóa đơn...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
          <div className="text-center">
            <span className="text-6xl">⚠️</span>
            <p className="text-red-600 font-semibold text-lg mt-4">{error}</p>
            <button
              onClick={() => navigate(-1)}
              className="mt-6 px-6 py-3 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition-all"
            >
              ← Quay lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!invoice) return null;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header với nút action */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6 no-print">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 mb-1">
                Chi tiết đơn hàng
              </h1>
              <p className="text-sm text-gray-500">
                Mã đơn hàng: {invoice.maHoaDon}
              </p>
            </div>
            <div className="flex gap-3">
              {canEdit && (
                <button
                  onClick={handleEdit}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg flex items-center gap-2 hover:bg-blue-600 transition-all font-medium"
                >
                  <span>✏️</span>
                  Chỉnh sửa
                </button>
              )}

              {!canEdit && (
                <div className="px-4 py-2 bg-gray-300 text-gray-600 rounded-lg flex items-center gap-2 cursor-not-allowed">
                  <span>🔒</span>
                  Không thể sửa
                </div>
              )}
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-purple-500 text-white rounded-lg flex items-center gap-2 hover:bg-purple-600 transition-all font-medium"
              >
                <span>🖨️</span>
                In đơn hàng
              </button>
              <button
                onClick={() => {
                  /* Thêm logic gửi email nếu cần */
                }}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg flex items-center gap-2 hover:bg-orange-600 transition-all font-medium"
              >
                <span>📧</span>
                Gửi email
              </button>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          {/* Trạng thái và Tóm tắt */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            {/* Trạng thái đơn hàng */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-3 text-gray-700">
                Trạng thái đơn hàng
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Trạng thái:</span>
                  {(() => {
                    const statusInfo = getStatusInfo(invoice.trangThai);
                    return (
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ring-1 ${statusInfo.color}`}
                      >
                        {statusInfo.label}
                      </span>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Tóm tắt đơn hàng */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-3 text-gray-700">
                Tóm tắt đơn hàng
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Tạm tính:</span>
                  <span className="font-medium">
                    {formatMoney(invoice.tongTien)}
                  </span>
                </div>
                {invoice.phiVanChuyen && invoice.phiVanChuyen > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Phí vận chuyển:</span>
                    <span className="font-medium">
                      {formatMoney(invoice.phiVanChuyen)}
                    </span>
                  </div>
                )}
                {invoice.tongTienSauGiam &&
                  invoice.tongTienSauGiam !== invoice.tongTien && (
                    <div className="flex justify-between text-red-600">
                      <span>Giảm giá:</span>
                      <span className="font-medium">
                        -
                        {formatMoney(
                          invoice.tongTien - invoice.tongTienSauGiam
                        )}
                      </span>
                    </div>
                  )}
                <div className="flex justify-between pt-2 border-t border-gray-200">
                  <span className="font-bold text-gray-800">Tổng cộng:</span>
                  <span className="font-bold text-orange-600 text-lg">
                    {formatMoney(invoice.tongTienSauGiam || invoice.tongTien)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Thông tin khách hàng và vận chuyển */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            {/* Thông tin khách hàng */}
            <div>
              <h3 className="font-semibold mb-3 text-gray-700">
                Thông tin khách hàng
              </h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-600">Tên khách hàng:</span>
                  <p className="font-medium text-gray-800">
                    {invoice.tenKhachHang || "Khách lẻ"}
                  </p>
                </div>
                {invoice.emailKhachHang && invoice.emailKhachHang !== "N/A" && (
                  <div>
                    <span className="text-gray-600">Email:</span>
                    <p className="font-medium text-gray-800">
                      {invoice.emailKhachHang}
                    </p>
                  </div>
                )}
                <div>
                  <span className="text-gray-600">Số điện thoại:</span>
                  <p className="font-medium text-gray-800">
                    {invoice.sdtKhachHang || "N/A"}
                  </p>
                </div>
                {invoice.diaChiKhachHang && (
                  <div>
                    <span className="text-gray-600">Địa chỉ giao hàng:</span>
                    <p className="font-medium text-gray-800">
                      {invoice.diaChiKhachHang}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Thông tin vận chuyển và thanh toán */}
            <div>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-600">Nhân viên phục vụ:</span>
                  <p className="font-medium text-gray-800">
                    {invoice.tenNhanVien || "N/A"}
                  </p>
                </div>

                <div className="pt-3 border-t border-gray-200">
                  <h4 className="font-semibold mb-2 text-gray-700">
                    Thông tin thanh toán
                  </h4>
                  <div className="space-y-1">
                    <div>
                      <span className="text-gray-600">
                        Phương thức thanh toán:
                      </span>
                      <p className="font-medium text-gray-800">
                        {invoice.hinhThucThanhToan || "N/A"}
                      </p>
                    </div>
                    {invoice.tongTienSauGiam && (
                      <div>
                        <span className="text-gray-600">
                          Số tiền thanh toán:
                        </span>
                        <p className="font-medium text-gray-800">
                          {formatMoney(invoice.tongTienSauGiam)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Danh sách sản phẩm */}
          <div className="mb-6">
            <h3 className="font-semibold mb-3 text-gray-700">
              Danh sách sản phẩm
            </h3>
            {invoice.chiTietSanPhams && invoice.chiTietSanPhams.length > 0 ? (
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        Sản phẩm
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                        Đơn giá
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                        Số lượng
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                        Thành tiền
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {invoice.chiTietSanPhams.map((item, index) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-orange-100 rounded flex items-center justify-center text-orange-600 font-bold flex-shrink-0">
                              {index + 1}
                            </div>
                            <div>
                              <p className="font-medium text-gray-800">
                                {item.tenSanPham || "—"}
                              </p>
                              <p className="text-sm text-gray-500">
                                <span className="inline-flex items-center">
                                  <span className="w-3 h-3 bg-blue-500 border border-gray-300 rounded-full mr-1"></span>
                                  Màu: {item.mauSac || "—"}
                                </span>
                                <span className="mx-2">|</span>
                                Size: {item.kichThuoc || "—"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-right text-gray-700">
                          {formatMoney(item.giaBan)}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="inline-block bg-blue-100 text-blue-700 font-semibold px-3 py-1 rounded">
                            {item.soLuong}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right font-bold text-orange-600">
                          {formatMoney(item.thanhTien)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-8 text-center">
                <p className="text-gray-500">Không có sản phẩm</p>
              </div>
            )}
          </div>

          {/* Lịch sử đơn hàng */}
          <div className="mb-6">
            <h3 className="font-semibold mb-3 text-gray-700">
              Lịch sử đơn hàng
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-3 text-sm text-gray-700">
                <span>📅</span>
                <span>{formatDate(invoice.ngayTao)}</span>
                <span>-</span>
                <span>Đơn hàng được tạo thành công</span>
              </div>
            </div>
          </div>

          {/* Ghi chú */}
          <div>
            <h3 className="font-semibold mb-3 text-gray-700">
              Ghi chú của khách
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">{invoice.ghiChu || "N/A"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body {
            background: white;
          }
          .no-print {
            display: none !important;
          }
          .max-w-6xl {
            max-width: 100%;
          }
          .shadow-sm {
            box-shadow: none;
          }
          .rounded-lg {
            border-radius: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default DetailHoaDon;
