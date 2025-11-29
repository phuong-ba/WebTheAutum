import React, { useState, useEffect } from "react";
import {
  Play,
  Square,
  Trash2,
  Clock,
  DollarSign,
  TrendingUp,
  User,
  X,
  Save,
} from "lucide-react";

export default function GiaoCaManagement() {
  const API_BASE =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

  const [giaoCaList, setGiaoCaList] = useState([]);
  const [nhanVien, setNhanVien] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("active");

  const [showStartForm, setShowStartForm] = useState(false);
  const [showEndForm, setShowEndForm] = useState(false);
  const [selectedGiaoCa, setSelectedGiaoCa] = useState(null);

  const [formStart, setFormStart] = useState({
    idNhanVien: "",
    soTienBatDau: "",
    ghiChu: "",
  });

  const [formEnd, setFormEnd] = useState({
    ghiChu: "",
  });npm 

  // Toast thông báo
  const [notification, setNotification] = useState({
    type: "", // "success" | "error"
    message: "",
  });

  // Dialog xác nhận
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: "",
    message: "",
    onConfirm: null,
  });

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification({ type: "", message: "" });
    }, 3000);
  };

  const openConfirm = ({ title, message, onConfirm }) => {
    setConfirmDialog({
      open: true,
      title,
      message,
      onConfirm,
    });
  };

  const handleConfirmCancel = () => {
    setConfirmDialog((prev) => ({ ...prev, open: false, onConfirm: null }));
  };

  const handleConfirmOk = async () => {
    if (confirmDialog.onConfirm) {
      await confirmDialog.onConfirm();
    }
    setConfirmDialog((prev) => ({ ...prev, open: false, onConfirm: null }));
  };

  useEffect(() => {
    fetchGiaoCa();
    fetchNhanVien();
  }, []);

  const fetchGiaoCa = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/giao-ca`);
      if (response.ok) {
        const data = await response.json();
        setGiaoCaList(Array.isArray(data) ? data : []);
      } else {
        setGiaoCaList([]);
        showNotification("error", "Không tải được danh sách giao ca");
      }
    } catch (error) {
      console.error("Lỗi fetch giao ca:", error);
      setGiaoCaList([]);
      showNotification("error", "Lỗi khi tải danh sách giao ca");
    } finally {
      setLoading(false);
    }
  };

  const fetchNhanVien = async () => {
    try {
      const response = await fetch(`${API_BASE}/nhan-vien/phan-ca-nhan-vien`);
      if (response.ok) {
        const data = await response.json();
        const nhanVienArray = Array.isArray(data)
          ? data
          : data?.content
          ? data.content
          : [];
        setNhanVien(nhanVienArray);
      } else {
        setNhanVien([]);
        showNotification("error", "Không tải được danh sách nhân viên");
      }
    } catch (error) {
      console.error("Lỗi fetch nhanVien:", error);
      setNhanVien([]);
      showNotification("error", "Lỗi khi tải danh sách nhân viên");
    }
  };

  // ================== BẮT ĐẦU GIAO CA ==================

  const handleStartShift = async () => {
    if (!formStart.idNhanVien || !formStart.soTienBatDau) {
      showNotification(
        "error",
        "Vui lòng chọn nhân viên và nhập số tiền bắt đầu."
      );
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/giao-ca/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idNhanVien: parseInt(formStart.idNhanVien, 10),
          soTienBatDau: parseFloat(formStart.soTienBatDau),
          ghiChu: formStart.ghiChu,
        }),
      });

      if (response.ok) {
        showNotification("success", "Bắt đầu giao ca thành công");
        setFormStart({ idNhanVien: "", soTienBatDau: "", ghiChu: "" });
        setShowStartForm(false);
        fetchGiaoCa();
      } else {
        const errorText = await response.text();
        showNotification(
          "error",
          errorText || "Bắt đầu giao ca thất bại, vui lòng kiểm tra lại."
        );
      }
    } catch (error) {
      showNotification("error", "Lỗi: " + error.message);
    }
  };

  const handleClickStartShift = () => {
    openConfirm({
      title: "Xác nhận bắt đầu giao ca",
      message:
        "Bạn có chắc chắn muốn bắt đầu giao ca với thông tin đã nhập? Hãy đảm bảo bạn chọn đúng nhân viên đăng nhập và số tiền đầu ca hợp lệ.",
      onConfirm: handleStartShift,
    });
  };

  // ================== KẾT THÚC GIAO CA ==================

  const handleEndShift = async () => {
    if (!selectedGiaoCa) {
      showNotification("error", "Không tìm thấy giao ca để kết thúc");
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE}/giao-ca/${selectedGiaoCa.id}/end`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ghiChu: formEnd.ghiChu,
          }),
        }
      );

      if (response.ok) {
        showNotification("success", "Kết thúc giao ca thành công");
        setFormEnd({ ghiChu: "" });
        setShowEndForm(false);
        setSelectedGiaoCa(null);
        fetchGiaoCa();
      } else {
        const errorText = await response.text();
        showNotification(
          "error",
          errorText ||
            "Kết thúc giao ca thất bại. Vui lòng đảm bảo ca đã hết giờ làm."
        );
      }
    } catch (error) {
      showNotification("error", "Lỗi: " + error.message);
    }
  };

  const handleClickEndShift = () => {
    openConfirm({
      title: "Xác nhận kết thúc giao ca",
      message:
        "Hệ thống sẽ tự động tính doanh thu ca này và số tiền kết thúc. Chỉ nên kết thúc khi ca đã thực sự hết giờ.",
      onConfirm: handleEndShift,
    });
  };

  // ================== XOÁ GIAO CA ==================

  const performDeleteGiaoCa = async (id) => {
    try {
      const response = await fetch(`${API_BASE}/giao-ca/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        showNotification("success", "Xóa giao ca thành công");
        fetchGiaoCa();
      } else {
        const errorText = await response.text();
        showNotification("error", errorText || "Xóa giao ca thất bại");
      }
    } catch (error) {
      showNotification("error", "Lỗi: " + error.message);
    }
  };

  const handleDeleteGiaoCa = (id) => {
    openConfirm({
      title: "Xác nhận xóa giao ca",
      message:
        "Bạn có chắc chắn muốn xóa giao ca này? Hành động này không thể hoàn tác.",
      onConfirm: () => performDeleteGiaoCa(id),
    });
  };

  // ================== FORMAT & FILTER ==================

  const formatDateTime = (dateTime) => {
    if (!dateTime) return "Chưa kết thúc";
    const date = new Date(dateTime);
    if (Number.isNaN(date.getTime())) return String(dateTime);
    return date.toLocaleString("vi-VN");
  };

  const formatCurrency = (value) => {
    if (value === null || value === undefined) return "0 ₫";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(Number(value));
  };

  const getFilteredData = () => {
    if (activeTab === "active") {
      return giaoCaList.filter((gc) => !gc.thoiGianKetThuc);
    }
    if (activeTab === "completed") {
      return giaoCaList.filter((gc) => !!gc.thoiGianKetThuc);
    }
    return giaoCaList;
  };

  const filteredData = getFilteredData();
  const activeCount = giaoCaList.filter((gc) => !gc.thoiGianKetThuc).length;
  const completedCount = giaoCaList.filter((gc) => !!gc.thoiGianKetThuc).length;
  const totalShifts = giaoCaList.length;

  // ================== JSX ==================

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Toast Notification */}
        {notification.message && (
          <div className="fixed top-4 right-4 z-50">
            <div
              className={`px-4 py-3 rounded-xl shadow-xl text-sm font-semibold flex items-center gap-2 ${
                notification.type === "success"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {notification.type === "success" ? "✅" : "⚠️"}
              <span>{notification.message}</span>
            </div>
          </div>
        )}

        {/* Confirm Dialog */}
        {confirmDialog.open && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-40">
            <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
              <h4 className="text-lg font-bold text-gray-900 mb-2">
                {confirmDialog.title || "Xác nhận"}
              </h4>
              <p className="text-gray-600 mb-5">{confirmDialog.message}</p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={handleConfirmCancel}
                  className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold text-sm"
                >
                  Hủy
                </button>
                <button
                  onClick={handleConfirmOk}
                  className="px-4 py-2 rounded-xl bg-[#ED7014] hover:bg-[#D6621B] text-white font-semibold text-sm shadow-sm"
                >
                  Đồng ý
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Wrapper card */}
        <div className="bg-[#F7F7FB] border border-slate-100 rounded-3xl shadow-sm p-6 md:p-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl flex items-center justify-center bg-gradient-to-br from-[#ED7014] to-[#FF8C3A] shadow-md">
                <Clock className="text-white" size={26} />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
                  Quản Lý Giao Ca
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                  Theo dõi thời gian làm việc và doanh thu theo từng ca.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowStartForm((prev) => !prev)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#ED7014] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#D6621B] transition-colors"
            >
              <Play size={18} />
              <span>Bắt Đầu Giao Ca</span>
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Tổng Giao Ca
                </p>
                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {totalShifts}
                </p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-orange-50 flex items-center justify-center">
                <Clock className="text-[#ED7014]" size={20} />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Đang Hoạt Động
                </p>
                <p className="mt-2 text-3xl font-bold text-emerald-600">
                  {activeCount}
                </p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                <Play className="text-emerald-600" size={20} />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Đã Hoàn Thành
                </p>
                <p className="mt-2 text-3xl font-bold text-indigo-600">
                  {completedCount}
                </p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                <Square className="text-indigo-600" size={20} />
              </div>
            </div>
          </div>

          {/* Start Form */}
          {showStartForm && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900">
                  Bắt Đầu Giao Ca
                </h3>
                <button
                  onClick={() => setShowStartForm(false)}
                  className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500"
                >
                  <X size={16} />
                </button>
              </div>

              {/* NOTE: Thông báo rule giao ca */}
              <div className="mb-4 rounded-2xl border border-orange-100 bg-orange-50 px-4 py-3 text-xs text-slate-700">
                <div className="font-semibold text-[#D6621B] mb-1 flex items-center gap-1.5">
                  <span>⚠️</span>
                  <span>Quy tắc khi bắt đầu giao ca</span>
                </div>
                <ul className="list-disc list-inside space-y-1">
                  <li>
                    Ca đầu tiên của nhân viên có thể{" "}
                    <span className="font-semibold">nhập số tiền bắt đầu = 0</span>.
                  </li>
                  <li>
                    Nếu nhân viên đã có giao ca trước đó,{" "}
                    <span className="font-semibold">
                      số tiền bắt đầu phải đúng bằng số tiền kết thúc ca trước
                    </span>
                    .
                  </li>
                  <li>
                    Chỉ được bắt đầu giao ca{" "}
                    <span className="font-semibold">
                      trong khung giờ ca làm việc được phân trên hệ thống
                    </span>
                    .
                  </li>
                </ul>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">
                    Nhân Viên
                  </label>
                  <select
                    value={formStart.idNhanVien}
                    onChange={(e) =>
                      setFormStart({ ...formStart, idNhanVien: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-[#ED7014]"
                  >
                    <option value="">-- Chọn Nhân Viên --</option>
                    {nhanVien && nhanVien.length > 0 ? (
                      nhanVien.map((nv) => (
                        <option key={nv.id} value={nv.id}>
                          {nv.hoTen}
                        </option>
                      ))
                    ) : (
                      <option disabled>Không có nhân viên nào</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">
                    Số Tiền Bắt Đầu
                  </label>
                  <input
                    type="number"
                    placeholder="Nhập số tiền đầu ca"
                    value={formStart.soTienBatDau}
                    onChange={(e) =>
                      setFormStart({
                        ...formStart,
                        soTienBatDau: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-[#ED7014]"
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    * Nếu nhân viên đã có ca trước đó, số tiền này phải bằng{" "}
                    <span className="font-semibold">số tiền kết thúc ca trước</span>.
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">
                  Ghi Chú
                </label>
                <textarea
                  placeholder="Nhập ghi chú (tuỳ chọn)"
                  value={formStart.ghiChu}
                  onChange={(e) =>
                    setFormStart({ ...formStart, ghiChu: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-[#ED7014] h-24 resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 mt-5">
                <button
                  onClick={() => setShowStartForm(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-sm font-semibold text-slate-700"
                >
                  Hủy
                </button>
                <button
                  onClick={handleClickStartShift}
                  className="px-4 py-2.5 rounded-xl bg-[#ED7014] hover:bg-[#D6621B] text-sm font-semibold text-white flex items-center gap-2"
                >
                  <Save size={16} />
                  <span>Bắt Đầu</span>
                </button>
              </div>
            </div>
          )}

          {/* End Form */}
          {showEndForm && selectedGiaoCa && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900">
                  Kết Thúc Giao Ca
                </h3>
                <button
                  onClick={() => {
                    setShowEndForm(false);
                    setSelectedGiaoCa(null);
                    setFormEnd({ ghiChu: "" });
                  }}
                  className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500"
                >
                  <X size={16} />
                </button>
              </div>

              {/* NOTE: Thông báo rule kết thúc ca */}
              <div className="mb-4 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-xs text-slate-700">
                <div className="font-semibold text-[#B45309] mb-1 flex items-center gap-1.5">
                  <span>⏱️</span>
                  <span>Lưu ý trước khi kết thúc giao ca</span>
                </div>
                <ul className="list-disc list-inside space-y-1">
                  <li>
                    Chỉ kết thúc ca khi{" "}
                    <span className="font-semibold">
                      đã hết giờ ca làm việc được phân
                    </span>
                    .
                  </li>
                  <li>
                    Sau khi kết thúc, hệ thống sẽ tự tính{" "}
                    <span className="font-semibold">tổng doanh thu</span> và{" "}
                    <span className="font-semibold">số tiền kết thúc</span> cho ca.
                  </li>
                  <li>
                    Nếu kết thúc <span className="font-semibold">trước giờ</span>,{" "}
                    hệ thống có thể báo lỗi và không cho kết thúc ca.
                  </li>
                </ul>
              </div>

              <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 mb-4">
                <p className="text-sm text-slate-800">
                  <span className="font-semibold">Nhân viên:</span>{" "}
                  {selectedGiaoCa.hoTenNhanVien}
                </p>
                <p className="text-sm text-slate-800 mt-1">
                  <span className="font-semibold">Bắt đầu:</span>{" "}
                  {formatDateTime(selectedGiaoCa.thoiGianBatDau)}
                </p>
                <p className="text-sm text-slate-800 mt-1">
                  <span className="font-semibold">Tiền bắt đầu:</span>{" "}
                  {formatCurrency(selectedGiaoCa.soTienBatDau)}
                </p>
                <p className="text-xs text-slate-600 mt-2">
                  * Khi bấm <span className="font-semibold">Kết Thúc</span>, hệ
                  thống sẽ tính <span className="font-semibold">tổng doanh thu</span>{" "}
                  từ hoá đơn bán tại quầy trong ca và{" "}
                  <span className="font-semibold">số tiền kết thúc</span> =
                  tiền đầu ca + doanh thu.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">
                  Ghi Chú
                </label>
                <textarea
                  placeholder="Nhập ghi chú (tuỳ chọn)"
                  value={formEnd.ghiChu}
                  onChange={(e) =>
                    setFormEnd({ ...formEnd, ghiChu: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-red-500 h-20 resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 mt-5">
                <button
                  onClick={() => {
                    setShowEndForm(false);
                    setSelectedGiaoCa(null);
                    setFormEnd({ ghiChu: "" });
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-sm font-semibold text-slate-700"
                >
                  Hủy
                </button>
                <button
                  onClick={handleClickEndShift}
                  className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-sm font-semibold text-white flex items-center gap-2"
                >
                  <Square size={16} />
                  <span>Kết Thúc</span>
                </button>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-2 mb-6 flex-wrap">
            {[
              { key: "active", label: `Đang Hoạt Động (${activeCount})` },
              { key: "completed", label: `Đã Hoàn Thành (${completedCount})` },
              { key: "all", label: `Tất Cả (${totalShifts})` },
            ].map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-6 py-2.5 rounded-full text-sm font-semibold border transition-colors ${
                    isActive
                      ? "border-[#ED7014] text-[#ED7014] bg-orange-50"
                      : "border-slate-200 text-slate-700 bg-white hover:border-[#ED7014] hover:text-[#ED7014]"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Giao Ca List */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin">
                <Clock className="text-[#ED7014]" size={40} />
              </div>
              <p className="text-slate-500 mt-4 text-sm">Đang tải dữ liệu...</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredData.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-10 text-center">
                  <Clock className="text-[#FFD4A3] mx-auto mb-3" size={42} />
                  <p className="text-slate-600 text-sm">
                    Không có giao ca nào phù hợp bộ lọc hiện tại.
                  </p>
                </div>
              ) : (
                filteredData.map((gc) => (
                  <div
                    key={gc.id}
                    className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-4">
                      {/* Thông tin chính */}
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Nhân viên */}
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <div className="h-8 w-8 rounded-xl bg-orange-50 flex items-center justify-center">
                              <User className="text-[#ED7014]" size={16} />
                            </div>
                            <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                              Nhân Viên
                            </span>
                          </div>
                          <p className="text-base font-semibold text-slate-900">
                            {gc.hoTenNhanVien}
                          </p>
                          <span
                            className={`inline-flex items-center mt-2 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                              gc.thoiGianKetThuc
                                ? "bg-indigo-50 text-indigo-700"
                                : "bg-emerald-50 text-emerald-700"
                            }`}
                          >
                            <span
                              className={`mr-1 h-1.5 w-1.5 rounded-full ${
                                gc.thoiGianKetThuc
                                  ? "bg-indigo-500"
                                  : "bg-emerald-500"
                              }`}
                            />
                            {gc.thoiGianKetThuc
                              ? "Đã hoàn thành"
                              : "Đang hoạt động"}
                          </span>
                        </div>

                        {/* Thời gian */}
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <div className="h-8 w-8 rounded-xl bg-orange-50 flex items-center justify-center">
                              <Clock className="text-[#ED7014]" size={16} />
                            </div>
                            <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                              Thời Gian
                            </span>
                          </div>
                          <p className="text-xs text-slate-600">
                            Bắt đầu:
                            <span className="font-semibold block">
                              {formatDateTime(gc.thoiGianBatDau)}
                            </span>
                          </p>
                          {gc.thoiGianKetThuc && (
                            <p className="text-xs text-slate-600 mt-1">
                              Kết thúc:
                              <span className="font-semibold block">
                                {formatDateTime(gc.thoiGianKetThuc)}
                              </span>
                            </p>
                          )}
                        </div>

                        {/* Tiền */}
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <div className="h-8 w-8 rounded-xl bg-orange-50 flex items-center justify-center">
                              <DollarSign
                                className="text-[#ED7014]"
                                size={16}
                              />
                            </div>
                            <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                              Tiền
                            </span>
                          </div>
                          <p className="text-xs text-slate-600">
                            Bắt đầu:
                            <span className="font-semibold block text-blue-700">
                              {formatCurrency(gc.soTienBatDau)}
                            </span>
                          </p>
                          {gc.soTienKetThuc !== null &&
                            gc.soTienKetThuc !== undefined && (
                              <p className="text-xs text-slate-600 mt-1">
                                Kết thúc:
                                <span className="font-semibold block text-blue-700">
                                  {formatCurrency(gc.soTienKetThuc)}
                                </span>
                              </p>
                            )}
                        </div>

                        {/* Doanh thu */}
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <div className="h-8 w-8 rounded-xl bg-emerald-50 flex items-center justify-center">
                              <TrendingUp
                                className="text-emerald-600"
                                size={16}
                              />
                            </div>
                            <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                              Doanh Thu
                            </span>
                          </div>
                          {gc.tongDoanhThu !== null &&
                            gc.tongDoanhThu !== undefined && (
                              <p
                                className={`text-base font-bold mt-1 ${
                                  Number(gc.tongDoanhThu) >= 0
                                    ? "text-emerald-600"
                                    : "text-red-600"
                                }`}
                              >
                                {formatCurrency(gc.tongDoanhThu)}
                              </p>
                            )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2 w-32">
                        {!gc.thoiGianKetThuc && (
                          <button
                            onClick={() => {
                              setSelectedGiaoCa(gc);
                              setShowEndForm(true);
                              setFormEnd({ ghiChu: "" });
                            }}
                            className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-red-500 px-3 py-2 text-xs font-semibold text-white hover:bg-red-600"
                          >
                            <Square size={14} />
                            Kết Thúc
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteGiaoCa(gc.id)}
                          className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                        >
                          <Trash2 size={14} />
                          Xóa
                        </button>
                      </div>
                    </div>

                    {gc.ghiChu && (
                      <div className="mt-4 pt-3 border-t border-slate-100">
                        <p className="text-xs text-slate-600">
                          <span className="font-semibold">Ghi chú:</span>{" "}
                          {gc.ghiChu}
                        </p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
