import React, { useState, useEffect } from "react";
import {
  Clock,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  Users,
  Save,
  X,
} from "lucide-react";

export default function ShiftManagement() {
  const API_BASE =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

  const [activeTab, setActiveTab] = useState("shifts");
  const [caLamViec, setCaLamViec] = useState([]);
  const [phanCa, setPhanCa] = useState([]);
  const [nhanVien, setNhanVien] = useState([]);
  const [loading, setLoading] = useState(false);

  const [showCaForm, setShowCaForm] = useState(false);
  const [showPhanCaForm, setShowPhanCaForm] = useState(false);
  const [editingCa, setEditingCa] = useState(null);
  const [editingPhanCa, setEditingPhanCa] = useState(null);

  const [formCa, setFormCa] = useState({
    tenCa: "",
    gioBatDau: "07:00",
    gioKetThuc: "12:00",
    moTa: "",
  });

  const [formPhanCa, setFormPhanCa] = useState({
    idNhanVien: "",
    idCaLamViec: "",
    ngayPhanCa: new Date().toISOString().split("T")[0],
    ghiChu: "",
  });

  // Lưu message lỗi phân ca (ví dụ: ca đã tồn tại)
  const [errorPhanCa, setErrorPhanCa] = useState("");

  // Toast thông báo (success / error)
  const [notification, setNotification] = useState({
    type: "", // "success" | "error"
    message: "",
  });

  // Dialog xác nhận
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: "",
    message: "",
    onConfirm: null, // function async
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
    if (activeTab === "shifts") fetchCaLamViec();
    if (activeTab === "assignments") fetchPhanCa();
    fetchNhanVien();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const fetchCaLamViec = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/ca-lam-viec`);
      if (response.ok) {
        const data = await response.json();
        setCaLamViec(Array.isArray(data) ? data : []);
      } else {
        showNotification("error", "Không tải được danh sách ca làm việc");
      }
    } catch (error) {
      console.error("Lỗi:", error);
      showNotification("error", "Lỗi khi tải danh sách ca làm việc");
    }
    setLoading(false);
  };

  const fetchPhanCa = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/phan-ca`);
      if (response.ok) {
        const data = await response.json();
        setPhanCa(Array.isArray(data) ? data : []);
      } else {
        showNotification("error", "Không tải được danh sách phân ca");
      }
    } catch (error) {
      console.error("Lỗi:", error);
      showNotification("error", "Lỗi khi tải danh sách phân ca");
    }
    setLoading(false);
  };

  // ⚠️ Dùng API /phan-ca-nhan-vien: trả về List<NhanVienSelectDTO> {id, hoTen}
  const fetchNhanVien = async () => {
    try {
      const response = await fetch(`${API_BASE}/nhan-vien/phan-ca-nhan-vien`);
      if (response.ok) {
        const data = await response.json();
        const nhanVienArray = Array.isArray(data) ? data : [];
        setNhanVien(nhanVienArray);
      } else {
        showNotification("error", "Không tải được danh sách nhân viên");
      }
    } catch (error) {
      console.error("Lỗi:", error);
      showNotification("error", "Lỗi khi tải danh sách nhân viên");
    }
  };

  // ================== CA LÀM VIỆC ==================

  const handleSaveCa = async () => {
    if (!formCa.tenCa || !formCa.gioBatDau || !formCa.gioKetThuc) {
      showNotification("error", "Vui lòng điền đầy đủ thông tin ca làm việc");
      return;
    }

    try {
      const url = editingCa
        ? `${API_BASE}/ca-lam-viec/${editingCa.id}`
        : `${API_BASE}/ca-lam-viec`;
      const method = editingCa ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formCa),
      });

      if (response.ok) {
        showNotification(
          "success",
          editingCa
            ? "Cập nhật ca làm việc thành công"
            : "Thêm ca làm việc mới thành công"
        );
        setFormCa({
          tenCa: "",
          gioBatDau: "07:00",
          gioKetThuc: "12:00",
          moTa: "",
        });
        setEditingCa(null);
        setShowCaForm(false);
        fetchCaLamViec();
      } else {
        showNotification("error", "Lưu ca làm việc thất bại");
      }
    } catch (error) {
      showNotification("error", "Lỗi: " + error.message);
    }
  };

  const handleClickSaveCa = () => {
    openConfirm({
      title: editingCa ? "Xác nhận cập nhật" : "Xác nhận thêm ca làm việc",
      message: editingCa
        ? "Bạn có chắc chắn muốn cập nhật ca làm việc này?"
        : "Bạn có chắc chắn muốn thêm ca làm việc mới?",
      onConfirm: handleSaveCa,
    });
  };

  const handleEditCa = (ca) => {
    setEditingCa(ca);
    setFormCa({
      tenCa: ca.tenCa,
      gioBatDau: ca.gioBatDau,
      gioKetThuc: ca.gioKetThuc,
      moTa: ca.moTa,
    });
    setShowCaForm(true);
  };

  const performDeleteCa = async (id) => {
    try {
      const response = await fetch(`${API_BASE}/ca-lam-viec/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        showNotification("success", "Xóa ca làm việc thành công");
        fetchCaLamViec();
      } else {
        showNotification("error", "Xóa ca làm việc thất bại");
      }
    } catch (error) {
      showNotification("error", "Lỗi: " + error.message);
    }
  };

  const handleDeleteCa = (id) => {
    openConfirm({
      title: "Xác nhận xóa ca làm việc",
      message: "Bạn có chắc chắn muốn xóa ca làm việc này?",
      onConfirm: () => performDeleteCa(id),
    });
  };

  // ================== PHÂN CA ==================

  const handleSavePhanCa = async () => {
    if (
      !formPhanCa.idNhanVien ||
      !formPhanCa.idCaLamViec ||
      !formPhanCa.ngayPhanCa
    ) {
      showNotification("error", "Vui lòng điền đầy đủ thông tin phân ca");
      return;
    }

    setErrorPhanCa(""); // reset lỗi trước khi save

    try {
      const url = editingPhanCa
        ? `${API_BASE}/phan-ca/${editingPhanCa.id}`
        : `${API_BASE}/phan-ca`;
      const method = editingPhanCa ? "PUT" : "POST";

      const payload = {
        ...formPhanCa,
        idNhanVien: Number(formPhanCa.idNhanVien),
        idCaLamViec: Number(formPhanCa.idCaLamViec),
      };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        showNotification(
          "success",
          editingPhanCa
            ? "Cập nhật phân ca thành công"
            : "Thêm phân ca mới thành công"
        );
        setFormPhanCa({
          idNhanVien: "",
          idCaLamViec: "",
          ngayPhanCa: new Date().toISOString().split("T")[0],
          ghiChu: "",
        });
        setEditingPhanCa(null);
        setShowPhanCaForm(false);
        fetchPhanCa();
      } else {
        let msg = "Lưu phân ca thất bại";
        if (response.status === 409) {
          try {
            const data = await response.json();
            if (data?.message) {
              msg = data.message;
            } else {
              msg = "Ca này trong ngày này đã được phân cho nhân viên khác!";
            }
          } catch (e) {
            msg = "Ca này trong ngày này đã được phân cho nhân viên khác!";
          }
        }
        setErrorPhanCa(msg);
        showNotification("error", msg);
      }
    } catch (error) {
      const msg = "Lỗi: " + error.message;
      setErrorPhanCa(msg);
      showNotification("error", msg);
    }
  };

  const handleClickSavePhanCa = () => {
    openConfirm({
      title: editingPhanCa ? "Xác nhận cập nhật phân ca" : "Xác nhận thêm phân ca",
      message: editingPhanCa
        ? "Bạn có chắc chắn muốn cập nhật phân ca này?"
        : "Bạn có chắc chắn muốn thêm phân ca mới?",
      onConfirm: handleSavePhanCa,
    });
  };

  const handleEditPhanCa = (pc) => {
    setEditingPhanCa(pc);
    setFormPhanCa({
      idNhanVien: pc.idNhanVien,
      idCaLamViec: pc.idCaLamViec,
      ngayPhanCa: pc.ngayPhanCa,
      ghiChu: pc.ghiChu,
    });
    setShowPhanCaForm(true);
    setErrorPhanCa("");
  };

  const performDeletePhanCa = async (id) => {
    try {
      const response = await fetch(`${API_BASE}/phan-ca/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        showNotification("success", "Xóa phân ca thành công");
        fetchPhanCa();
      } else {
        showNotification("error", "Xóa phân ca thất bại");
      }
    } catch (error) {
      showNotification("error", "Lỗi: " + error.message);
    }
  };

  const handleDeletePhanCa = (id) => {
    openConfirm({
      title: "Xác nhận xóa phân ca",
      message: "Bạn có chắc chắn muốn xóa phân ca này?",
      onConfirm: () => performDeletePhanCa(id),
    });
  };

  // ====== Stats đơn giản cho header ======
  const totalShifts = caLamViec.length;
  const totalAssignments = phanCa.length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Toast Notification */}
        {notification.message && (
          <div className="fixed top-4 right-4 z-50">
            <div
              className={`px-4 py-3 rounded-2xl shadow-lg text-sm font-semibold flex items-center gap-2 ${
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
            <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full border border-slate-200">
              <h4 className="text-lg font-semibold text-slate-900 mb-2">
                {confirmDialog.title || "Xác nhận"}
              </h4>
              <p className="text-sm text-slate-600 mb-5">
                {confirmDialog.message}
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={handleConfirmCancel}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium text-sm"
                >
                  Hủy
                </button>
                <button
                  onClick={handleConfirmOk}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#ED7014] to-[#FF8C3A] text-white font-semibold text-sm shadow hover:shadow-md"
                >
                  Đồng ý
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm px-6 py-6 sm:px-8 sm:py-7">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-2xl bg-[#ED7014] flex items-center justify-center shadow-md shadow-orange-200">
                  <Clock className="text-white" size={26} />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">
                    Quản Lý Ca Làm Việc
                  </h1>
                  <p className="text-sm text-slate-500 mt-1">
                    Tạo ca làm việc và phân công nhân viên theo ca
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3 text-[11px] text-slate-600">
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 border border-slate-200 px-3 py-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#ED7014]" />
                      Số ca làm việc:{" "}
                      <span className="font-semibold">{totalShifts}</span>
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 border border-slate-200 px-3 py-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
                      Số phân ca:{" "}
                      <span className="font-semibold">{totalAssignments}</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab("shifts")}
                  className={`px-4 py-2 rounded-2xl text-xs font-semibold tracking-wide uppercase transition-all ${
                    activeTab === "shifts"
                      ? "bg-[#ED7014] text-white shadow-md"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  Ca làm việc
                </button>
                <button
                  onClick={() => setActiveTab("assignments")}
                  className={`px-4 py-2 rounded-2xl text-xs font-semibold tracking-wide uppercase transition-all ${
                    activeTab === "assignments"
                      ? "bg-[#ED7014] text-white shadow-md"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  Phân ca
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Ca Làm Việc Tab */}
        {activeTab === "shifts" && (
          <div>
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-semibold text-slate-900">
                Danh sách ca làm việc
              </h2>
              <button
                onClick={() => {
                  setEditingCa(null);
                  setFormCa({
                    tenCa: "",
                    gioBatDau: "07:00",
                    gioKetThuc: "12:00",
                    moTa: "",
                  });
                  setShowCaForm(!showCaForm);
                }}
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#ED7014] to-[#FF8C3A] px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all"
              >
                <Plus size={18} /> Thêm ca làm việc
              </button>
            </div>

            {showCaForm && (
              <div className="mb-8">
                <div className="bg-white border border-slate-200 rounded-3xl shadow-sm px-6 py-6 sm:px-7 sm:py-7">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">
                        {editingCa ? "Cập nhật ca làm việc" : "Thêm ca làm việc mới"}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        Nhập tên ca, giờ bắt đầu, giờ kết thúc và mô tả (nếu có)
                      </p>
                    </div>
                    <button
                      onClick={() => setShowCaForm(false)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-2">
                        Tên ca
                      </label>
                      <input
                        type="text"
                        placeholder="Ví dụ: Ca sáng, Ca chiều, Ca tối..."
                        value={formCa.tenCa}
                        onChange={(e) =>
                          setFormCa({ ...formCa, tenCa: e.target.value })
                        }
                        className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#ED7014] focus:border-transparent"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-2">
                          Giờ bắt đầu
                        </label>
                        <input
                          type="time"
                          value={formCa.gioBatDau}
                          onChange={(e) =>
                            setFormCa({ ...formCa, gioBatDau: e.target.value })
                          }
                          className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#ED7014] focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-2">
                          Giờ kết thúc
                        </label>
                        <input
                          type="time"
                          value={formCa.gioKetThuc}
                          onChange={(e) =>
                            setFormCa({
                              ...formCa,
                              gioKetThuc: e.target.value,
                            })
                          }
                          className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#ED7014] focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-2">
                        Mô tả (tuỳ chọn)
                      </label>
                      <textarea
                        placeholder="Nhập mô tả chi tiết ca làm việc..."
                        value={formCa.moTa}
                        onChange={(e) =>
                          setFormCa({ ...formCa, moTa: e.target.value })
                        }
                        className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#ED7014] focus:border-transparent h-24 resize-none"
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                      <button
                        onClick={handleClickSaveCa}
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#ED7014] to-[#FF8C3A] px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all"
                      >
                        <Save size={18} /> Lưu ca làm việc
                      </button>
                      <button
                        onClick={() => setShowCaForm(false)}
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-200 transition-colors"
                      >
                        <X size={16} /> Hủy
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {loading ? (
              <div className="text-center py-16">
                <div className="inline-block animate-spin">
                  <Clock className="text-slate-400" size={40} />
                </div>
                <p className="text-slate-500 mt-4 text-sm">
                  Đang tải danh sách ca làm việc...
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {caLamViec.length === 0 ? (
                  <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-10 text-center">
                    <Clock className="text-slate-300 mx-auto mb-3" size={42} />
                    <p className="text-slate-800 text-sm">
                      Chưa có ca làm việc nào
                    </p>
                    <p className="text-slate-500 text-xs mt-1">
                      Thêm ca làm việc mới để bắt đầu quản lý lịch làm
                    </p>
                  </div>
                ) : (
                  caLamViec.map((ca) => (
                    <div
                      key={ca.id}
                      className="bg-white border border-slate-200 rounded-3xl shadow-sm hover:shadow-md transition-all p-6"
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="inline-flex h-8 w-8 items-center justify-center rounded-2xl bg-slate-100">
                              <Clock size={18} className="text-[#ED7014]" />
                            </span>
                            <h4 className="font-semibold text-slate-900 text-lg">
                              {ca.tenCa}
                            </h4>
                          </div>
                          <p className="text-sm font-medium text-slate-800 mt-1">
                            {ca.gioBatDau} - {ca.gioKetThuc}
                          </p>
                          {ca.moTa && (
                            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                              {ca.moTa}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditCa(ca)}
                            className="inline-flex items-center justify-center rounded-2xl bg-slate-100 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-200 transition-colors"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteCa(ca.id)}
                            className="inline-flex items-center justify-center rounded-2xl bg-red-50 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-100 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* Phân Ca Tab */}
        {activeTab === "assignments" && (
          <div>
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-semibold text-slate-900">
                Danh sách phân ca
              </h2>
              <button
                onClick={() => {
                  setEditingPhanCa(null);
                  setFormPhanCa({
                    idNhanVien: "",
                    idCaLamViec: "",
                    ngayPhanCa: new Date().toISOString().split("T")[0],
                    ghiChu: "",
                  });
                  setErrorPhanCa("");
                  setShowPhanCaForm(!showPhanCaForm);
                }}
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#ED7014] to-[#FF8C3A] px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all"
              >
                <Plus size={18} /> Phân ca mới
              </button>
            </div>

            {showPhanCaForm && (
              <div className="mb-8">
                <div className="bg-white border border-slate-200 rounded-3xl shadow-sm px-6 py-6 sm:px-7 sm:py-7">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">
                        {editingPhanCa ? "Cập nhật phân ca" : "Thêm phân ca mới"}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        Chọn nhân viên, ca làm việc và ngày phân ca
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setShowPhanCaForm(false);
                        setErrorPhanCa("");
                      }}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-2">
                        Nhân viên
                      </label>
                      <select
                        value={formPhanCa.idNhanVien}
                        onChange={(e) =>
                          setFormPhanCa({
                            ...formPhanCa,
                            idNhanVien: e.target.value,
                          })
                        }
                        className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#ED7014] focus:border-transparent"
                      >
                        <option value="">-- Chọn Nhân Viên --</option>
                        {nhanVien.map((nv) => (
                          <option key={nv.id} value={nv.id}>
                            {nv.hoTen}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-2">
                        Ca làm việc
                      </label>
                      <select
                        value={formPhanCa.idCaLamViec}
                        onChange={(e) =>
                          setFormPhanCa({
                            ...formPhanCa,
                            idCaLamViec: e.target.value,
                          })
                        }
                        className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#ED7014] focus:border-transparent"
                      >
                        <option value="">-- Chọn Ca Làm Việc --</option>
                        {caLamViec.map((ca) => (
                          <option key={ca.id} value={ca.id}>
                            {ca.tenCa} ({ca.gioBatDau} - {ca.gioKetThuc})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-2">
                          Ngày phân ca
                        </label>
                        <input
                          type="date"
                          value={formPhanCa.ngayPhanCa}
                          onChange={(e) =>
                            setFormPhanCa({
                              ...formPhanCa,
                              ngayPhanCa: e.target.value,
                            })
                          }
                          className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#ED7014] focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-2">
                          Ghi chú (tuỳ chọn)
                        </label>
                        <textarea
                          placeholder="Nhập ghi chú thêm..."
                          value={formPhanCa.ghiChu}
                          onChange={(e) =>
                            setFormPhanCa({
                              ...formPhanCa,
                              ghiChu: e.target.value,
                            })
                          }
                          className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#ED7014] focus:border-transparent h-20 resize-none"
                        />
                      </div>
                    </div>

                    {errorPhanCa && (
                      <div className="mt-1 p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                        ⚠️ {errorPhanCa}
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                      <button
                        onClick={handleClickSavePhanCa}
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#ED7014] to-[#FF8C3A] px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all"
                      >
                        <Save size={18} /> Lưu phân ca
                      </button>
                      <button
                        onClick={() => {
                          setShowPhanCaForm(false);
                          setErrorPhanCa("");
                        }}
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-200 transition-colors"
                      >
                        <X size={16} /> Hủy
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {loading ? (
              <div className="text-center py-16">
                <div className="inline-block animate-spin">
                  <Users className="text-slate-400" size={40} />
                </div>
                <p className="text-slate-500 mt-4 text-sm">
                  Đang tải danh sách phân ca...
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {phanCa.length === 0 ? (
                  <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-10 text-center">
                    <Users className="text-slate-300 mx-auto mb-3" size={42} />
                    <p className="text-slate-800 text-sm">
                      Chưa có phân ca nào
                    </p>
                    <p className="text-slate-500 text-xs mt-1">
                      Tạo phân ca mới để gán ca cho nhân viên
                    </p>
                  </div>
                ) : (
                  phanCa.map((pc) => (
                    <div
                      key={pc.id}
                      className="bg-white border border-slate-200 rounded-3xl shadow-sm hover:shadow-md transition-all p-6"
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <h4 className="font-semibold text-slate-900 text-lg">
                            {pc.hoTenNhanVien}
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3 text-sm">
                            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 p-3 rounded-2xl">
                              <Clock size={16} className="text-[#ED7014]" />
                              <div>
                                <p className="text-[11px] text-slate-500 font-medium uppercase">
                                  Ca làm việc
                                </p>
                                <span className="font-semibold text-slate-800">
                                  {pc.tenCa}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 bg-sky-50 border border-sky-100 p-3 rounded-2xl">
                              <Calendar size={16} className="text-sky-600" />
                              <div>
                                <p className="text-[11px] text-slate-500 font-medium uppercase">
                                  Ngày phân ca
                                </p>
                                <span className="font-semibold text-slate-800">
                                  {pc.ngayPhanCa}
                                </span>
                              </div>
                            </div>
                          </div>
                          <p className="text-slate-700 text-xs font-semibold mt-3">
                            🕐 {pc.gioBatDau} - {pc.gioKetThuc}
                          </p>
                          {pc.ghiChu && (
                            <p className="text-[11px] text-slate-600 mt-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                              <span className="font-semibold text-slate-800">
                                Ghi chú:
                              </span>{" "}
                              {pc.ghiChu}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditPhanCa(pc)}
                            className="inline-flex items-center justify-center rounded-2xl bg-slate-100 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-200 transition-colors"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeletePhanCa(pc.id)}
                            className="inline-flex items-center justify-center rounded-2xl bg-red-50 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-100 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
