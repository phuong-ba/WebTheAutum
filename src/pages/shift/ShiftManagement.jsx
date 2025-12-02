import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Tag,
  Modal,
  Input,
  Select,
  DatePicker,
  TimePicker,
  message,
  Tooltip,
  Segmented,
  Calendar,
  Badge,
  Card,
  Space,
  Breadcrumb,
} from "antd";
import {
  ClockCircleOutlined,
  PlusOutlined,
  DeleteOutlined,
  CalendarOutlined,
  TeamOutlined,
  UnorderedListOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  ExclamationCircleOutlined,
  SearchOutlined,
  ReloadOutlined,
  FileExcelOutlined,
  LeftOutlined,
  RightOutlined,
} from "@ant-design/icons";

// Đã cập nhật theo yêu cầu trước đó
import { PencilLine } from "@phosphor-icons/react";

import { Link } from "react-router-dom";
import dayjs from "dayjs";
import "dayjs/locale/vi";

dayjs.locale("vi");

const { TextArea } = Input;
const { Option } = Select;

// Màu chủ đạo - đồng bộ với trang quản lý hóa đơn
const PRIMARY_COLOR = "#ff8c42"; // Màu cam cho nút và header bảng
const TITLE_COLOR = "#E67E22"; // Màu cam cho tiêu đề

// --- CẤU HÌNH API ---
const API_BASE = "http://localhost:8080/api";

// --- HELPERS (Giữ nguyên) ---
const exportToCSV = (filename, data, columns) => {
  if (!data || !data.length) {
    message.warning("Không có dữ liệu để xuất");
    return;
  }

  const headers = data.length > 0 ? Object.keys(data[0]) : [];
  const csvContent = [
    headers.join(","),
    ...data.map((row) =>
      headers
        .map((fieldName) =>
          JSON.stringify(row[fieldName], (key, value) =>
            value === null ? "" : value
          )
        )
        .join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// --- COMPONENT LỊCH (Giữ nguyên) ---
const AssignmentsCalendar = ({
  phanCa,
  calendarDate,
  onPrev,
  onNext,
  onDayClick,
  onEventClick,
}) => {
  const getListData = (value) => {
    const listData = phanCa.filter(
      (pc) =>
        dayjs(pc.ngayPhanCa).format("YYYY-MM-DD") === value.format("YYYY-MM-DD")
    );
    return listData || [];
  };

  const dateCellRender = (value) => {
    const listData = getListData(value);
    return (
      <ul className="events list-none p-0 m-0">
        {listData.map((item) => (
          <li
            key={item.id}
            onClick={(e) => {
              e.stopPropagation();
              onEventClick(item);
            }}
          >
            <Badge
              status="warning"
              text={
                <span className="text-xs text-gray-600">
                  {item.hoTenNhanVien} ({item.gioBatDau})
                </span>
              }
            />
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="calendar-wrapper">
      <div className="flex justify-between items-center mb-4 px-4">
        <Button icon={<LeftOutlined />} onClick={onPrev} />
        <span className="font-bold text-lg capitalize">
          {dayjs(calendarDate).format("MMMM YYYY")}
        </span>
        <Button icon={<RightOutlined />} onClick={onNext} />
      </div>
      <Calendar
        value={dayjs(calendarDate)}
        cellRender={dateCellRender}
        onSelect={(date) => {
          if (date.format("MM") !== dayjs(calendarDate).format("MM")) {
            // Chuyển tháng
          } else {
            onDayClick(date.format("YYYY-MM-DD"));
          }
        }}
        headerRender={() => null} // Ẩn header mặc định để dùng header tùy chỉnh
      />
    </div>
  );
};

// --- COMPONENT CHÍNH ---
export default function ShiftManagement() {
  // 💡 SỬA LỖI CONFIRM MODAL: Dùng hook useModal
  const [modal, contextHolder] = Modal.useModal();

  // --- STATE ---
  const [activeTab, setActiveTab] = useState("assignments");
  const [caLamViec, setCaLamViec] = useState([]);
  const [phanCa, setPhanCa] = useState([]);
  const [nhanVien, setNhanVien] = useState([]);
  const [loading, setLoading] = useState(false);
  const [assignmentsView, setAssignmentsView] = useState("list");
  const [calendarDate, setCalendarDate] = useState(new Date());

  // Filter States
  const [filters, setFilters] = useState({
    search: "",
    caLamViecId: null,
    ngayPhanCa: null,
  });

  // Modal State
  const [isCaModalVisible, setIsCaModalVisible] = useState(false);
  const [isPhanCaModalVisible, setIsPhanCaModalVisible] = useState(false);
  const [editingCa, setEditingCa] = useState(null);
  const [editingPhanCa, setEditingPhanCa] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Forms
  const [formCa, setFormCa] = useState({
    tenCa: "",
    gioBatDau: "07:00",
    gioKetThuc: "12:00",
    moTa: "",
  });

  const [formPhanCa, setFormPhanCa] = useState({
    idNhanVien: null,
    idCaLamViec: null,
    ngayPhanCa: dayjs().format("YYYY-MM-DD"),
    ghiChu: "",
  });

  // Custom Notification
  const [notification, setNotification] = useState({ type: "", message: "" });

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification({ type: "", message: "" }), 3000);
  };

  // --- INIT ---
  useEffect(() => {
    fetchCaLamViec();
    fetchNhanVien();
  }, []);

  useEffect(() => {
    if (activeTab === "assignments") {
      fetchPhanCa();
    }
  }, [activeTab]);

  // --- API CALLS (Giữ nguyên) ---
  const fetchCaLamViec = async () => {
    try {
      const response = await fetch(`${API_BASE}/ca-lam-viec`);
      if (response.ok) {
        const data = await response.json();
        setCaLamViec(Array.isArray(data) ? data : []);
      } else {
        message.error("Không tải được danh sách ca");
      }
    } catch (error) {
      message.error("Lỗi kết nối server");
    }
  };

  const fetchPhanCa = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/phan-ca`);
      if (response.ok) {
        const data = await response.json();
        setPhanCa(Array.isArray(data) ? data : []);
      } else {
        message.error("Không tải được danh sách phân ca");
      }
    } catch (error) {
      message.error("Lỗi kết nối server");
    } finally {
      setLoading(false);
    }
  };

  const fetchNhanVien = async () => {
    try {
      const response = await fetch(`${API_BASE}/nhan-vien/phan-ca-nhan-vien`);
      if (response.ok) {
        const data = await response.json();
        setNhanVien(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Lỗi tải nhân viên:", error);
    }
  };

  // --- ACTIONS: CA LÀM VIỆC (Giữ nguyên) ---
  const handleSaveCa = async () => {
    if (!formCa.tenCa || !formCa.gioBatDau || !formCa.gioKetThuc) {
      showNotification("error", "Vui lòng nhập đầy đủ tên và giờ");
      return;
    }
    setSubmitLoading(true);
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
          editingCa ? "Cập nhật thành công" : "Thêm mới thành công"
        );
        setFormCa({
          tenCa: "",
          gioBatDau: "07:00",
          gioKetThuc: "12:00",
          moTa: "",
        });
        setEditingCa(null);
        setIsCaModalVisible(false);
        fetchCaLamViec();
      } else {
        showNotification("error", "Lưu thất bại");
      }
    } catch (error) {
      showNotification("error", "Lỗi hệ thống");
    } finally {
      setSubmitLoading(false);
    }
  };

  // 🔴 HÀM XÓA CA (Giữ nguyên)
  const handleDeleteCa = (id) => {
    modal.confirm({
      title: "Xác nhận xóa ca làm việc?",
      icon: <ExclamationCircleOutlined style={{ color: "#ff4d4f" }} />,
      content: "Hành động này không thể hoàn tác.",
      okText: "Xóa",
      okType: "danger",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          const response = await fetch(`${API_BASE}/ca-lam-viec/${id}`, {
            method: "DELETE",
          });
          if (response.ok) {
            showNotification("success", "Đã xóa thành công");
            fetchCaLamViec();
          } else {
            let errorMessage = "Xóa thất bại (Lỗi không xác định).";
            if (response.status === 404) {
              errorMessage = "Xóa thất bại: Không tìm thấy ca làm việc này.";
            } else if (response.status === 409) {
              errorMessage =
                "Xóa thất bại: Ca này đang được phân công cho nhân viên.";
            } else {
              try {
                const err = await response.json();
                errorMessage = err.message || errorMessage;
              } catch {
                errorMessage = `Xóa thất bại. Mã lỗi: ${response.status}.`;
              }
            }
            showNotification("error", errorMessage);
          }
        } catch (error) {
          showNotification("error", "Lỗi kết nối hệ thống.");
        }
      },
    });
  };

  // --- ACTIONS: PHÂN CA (Giữ nguyên) ---
  const handleSavePhanCa = async () => {
    if (
      !formPhanCa.idNhanVien ||
      !formPhanCa.idCaLamViec ||
      !formPhanCa.ngayPhanCa
    ) {
      showNotification("error", "Vui lòng chọn nhân viên, ca và ngày");
      return;
    }
    setSubmitLoading(true);
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
          editingPhanCa ? "Cập nhật phân ca thành công" : "Phân ca thành công"
        );
        setEditingPhanCa(null);
        setIsPhanCaModalVisible(false);
        fetchPhanCa();
      } else {
        const err = await response.json();
        showNotification("error", err.message || "Lưu thất bại");
      }
    } catch (error) {
      showNotification("error", "Lỗi hệ thống");
    } finally {
      setSubmitLoading(false);
    }
  };

  // 🔴 HÀM XÓA PHÂN CA (Giữ nguyên)
  const handleDeletePhanCa = (id) => {
    modal.confirm({
      title: "Xác nhận xóa phân ca?",
      icon: <ExclamationCircleOutlined style={{ color: "#ff4d4f" }} />,
      content: "Nhân viên sẽ bị gỡ khỏi lịch làm việc này.",
      okText: "Xóa",
      okType: "danger",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          const response = await fetch(`${API_BASE}/phan-ca/${id}`, {
            method: "DELETE",
          });
          if (response.ok) {
            showNotification("success", "Đã xóa phân ca");
            fetchPhanCa();
          } else {
            let errorMessage = "Xóa thất bại (Lỗi không xác định).";
            if (response.status === 404) {
              errorMessage = "Xóa thất bại: Không tìm thấy phân ca này.";
            } else {
              try {
                const err = await response.json();
                errorMessage =
                  err.message || `Xóa thất bại. Mã lỗi: ${response.status}.`;
              } catch {
                errorMessage = `Xóa thất bại. Mã lỗi: ${response.status}.`;
              }
            }
            showNotification("error", errorMessage);
          }
        } catch (error) {
          showNotification("error", "Lỗi kết nối hệ thống.");
        }
      },
    });
  };

  // --- HELPER HANDLERS (Giữ nguyên) ---
  const openEditCa = (record) => {
    setEditingCa(record);
    setFormCa({ ...record });
    setIsCaModalVisible(true);
  };

  const openEditPhanCa = (record) => {
    setEditingPhanCa(record);
    setFormPhanCa({
      idNhanVien: record.idNhanVien,
      idCaLamViec: record.idCaLamViec,
      ngayPhanCa: record.ngayPhanCa,
      ghiChu: record.ghiChu,
    });
    setIsPhanCaModalVisible(true);
  };

  const handleResetFilters = () => {
    setFilters({ search: "", caLamViecId: null, ngayPhanCa: null });
    fetchPhanCa();
  };

  // Lọc dữ liệu hiển thị (tạm thời lọc trên client)
  const filteredPhanCa = phanCa.filter((pc) => {
    let matches = true;
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      matches =
        pc.hoTenNhanVien.toLowerCase().includes(searchLower) ||
        pc.tenCa.toLowerCase().includes(searchLower);
    }
    if (filters.caLamViecId) {
      matches = matches && pc.idCaLamViec === filters.caLamViecId;
    }
    if (filters.ngayPhanCa) {
      matches =
        matches &&
        dayjs(pc.ngayPhanCa).format("YYYY-MM-DD") ===
          dayjs(filters.ngayPhanCa).format("YYYY-MM-DD");
    }
    return matches;
  });

  // --- EXPORT PREPARATION (Giữ nguyên) ---
  const prepareShiftData = () =>
    caLamViec.map((c) => ({
      "Tên ca": c.tenCa,
      "Bắt đầu": c.gioBatDau,
      "Kết thúc": c.gioKetThuc,
      "Mô tả": c.moTa,
    }));
  const prepareAssignmentData = () =>
    filteredPhanCa.map((p) => ({
      "Nhân viên": p.hoTenNhanVien,
      Ca: p.tenCa,
      Ngày: p.ngayPhanCa,
      Giờ: `${p.gioBatDau}-${p.gioKetThuc}`,
      "Ghi chú": p.ghiChu,
    }));

  // --- TABLE COLUMNS (ĐÃ CẬP NHẬT ICON SỬA SANG PencilLine VÀ CÂN CHỈNH LẠI) ---
  const shiftColumns = [
    {
      title: "STT",
      key: "stt",
      align: "center",
      width: 50,
      render: (_, __, index) => index + 1,
      className: "column-centered",
    },
    {
      title: "MÃ CA",
      dataIndex: "id",
      key: "id",
      align: "center",
      width: 80,
      render: (text) => `CA${text}`,
      className: "column-centered",
    },
    {
      title: "TÊN CA",
      dataIndex: "tenCa",
      key: "tenCa",
      align: "left",
      width: 150,
      render: (text) => text || "—",
    },
    {
      title: "GIỜ BẮT ĐẦU",
      dataIndex: "gioBatDau",
      key: "gioBatDau",
      align: "center",
      width: 120,
      render: (text) => text || "—",
      className: "column-centered",
    },
    {
      title: "GIỜ KẾT THÚC",
      dataIndex: "gioKetThuc",
      key: "gioKetThuc",
      align: "center",
      width: 120,
      render: (text) => text || "—",
      className: "column-centered",
    },
    {
      title: "MÔ TẢ",
      dataIndex: "moTa",
      key: "moTa",
      align: "left",
      ellipsis: true,
      width: 300,
      render: (text) => text || "—",
    },
    {
      title: "HÀNH ĐỘNG",
      key: "action",
      align: "center",
      width: 100,
      render: (_, record) => (
        <Space size="middle">
          <Tooltip title="Chỉnh sửa">
            <Button
              type="text"
              icon={<PencilLine size={18} color={PRIMARY_COLOR} weight="bold" />}
              onClick={() => openEditCa(record)}
            />
          </Tooltip>
          <Tooltip title="Xóa">
            <Button
              type="text"
              icon={<DeleteOutlined />}
              danger
              onClick={() => handleDeleteCa(record.id)}
            />
          </Tooltip>
        </Space>
      ),
      className: "column-centered",
    },
  ];

  const assignmentColumns = [
    {
      title: "STT",
      key: "stt",
      align: "center",
      width: 50,
      render: (_, __, index) => index + 1,
      className: "column-centered",
    },
    {
      title: "MÃ PC",
      dataIndex: "id",
      key: "id",
      align: "center",
      width: 80,
      render: (text) => `PC${text}`,
      className: "column-centered",
    },
    {
      title: "NHÂN VIÊN",
      dataIndex: "hoTenNhanVien",
      key: "hoTenNhanVien",
      align: "left",
      width: 150,
      render: (text) => text || "—",
    },
    {
      title: "CA LÀM VIỆC",
      dataIndex: "tenCa",
      key: "tenCa",
      align: "center",
      width: 120,
      render: (text) => text || "—",
      className: "column-centered",
    },
    {
      title: "NGÀY PHÂN CA",
      dataIndex: "ngayPhanCa",
      key: "ngayPhanCa",
      align: "center",
      width: 130,
      render: (date) => dayjs(date).format("DD/MM/YYYY"),
      className: "column-centered",
    },
    {
      title: "GIỜ LÀM VIỆC",
      key: "time",
      align: "center",
      width: 130,
      render: (_, record) =>
        record.gioBatDau && record.gioKetThuc
          ? `${record.gioBatDau} - ${record.gioKetThuc}`
          : "—",
      className: "column-centered",
    },
    {
      title: "GHI CHÚ",
      dataIndex: "ghiChu",
      key: "ghiChu",
      align: "left",
      ellipsis: true,
      width: 150,
      render: (text) => text || "—",
    },
    {
      title: "TRẠNG THÁI",
      dataIndex: "trangThai",
      key: "trangThai",
      align: "center",
      width: 150,
      render: (trangThai) => {
        const isActive = trangThai;
        const color = isActive ? "#52C41A" : "#FF4D4F";
        const label = isActive ? "Đang hoạt động" : "Ngừng hoạt động";
        return (
          <Tag
            style={{
              border: `1px solid ${color}`,
              backgroundColor: `${color}15`,
            }}
          >
            <span style={{ color: color }}>{label}</span>
          </Tag>
        );
      },
      className: "column-centered",
    },
    {
      title: "HÀNH ĐỘNG",
      key: "action",
      align: "center",
      width: 100,
      render: (_, record) => (
        <Space size="middle">
          <Tooltip title="Chỉnh sửa">
            <Button
              type="text"
              icon={<PencilLine size={18} color={PRIMARY_COLOR} weight="bold" />}
              onClick={() => openEditPhanCa(record)}
            />
          </Tooltip>
          <Tooltip title="Xóa">
            <Button
              type="text"
              icon={<DeleteOutlined />}
              danger
              onClick={() => handleDeletePhanCa(record.id)}
            />
          </Tooltip>
        </Space>
      ),
      className: "column-centered",
    },
  ];

  // --- RENDER ---
  return (
    <div
      style={{
        padding: "24px",
        backgroundColor: "#f5f5f5",
        minHeight: "100vh",
      }}
    >
      {/* 🔴 CONTEXT HOLDER: PHẢI ĐƯỢC ĐẶT Ở ĐÂY */}
      {contextHolder}

      {/* CUSTOM TOAST NOTIFICATION */}
      {notification.message && (
        <div className="fixed top-6 right-6 z-[9999] animate-bounce-in">
          <div
            className={`px-5 py-3.5 rounded-xl shadow-2xl text-sm font-semibold flex items-center gap-3 border ${
              notification.type === "success"
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-red-50 text-red-700 border-red-200"
            }`}
          >
            {notification.type === "success" ? (
              <CheckCircleFilled className="text-xl text-emerald-500" />
            ) : (
              <CloseCircleFilled className="text-xl text-red-500" />
            )}
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="bg-white flex flex-col gap-3 px-4 py-[20px] rounded-lg shadow overflow-hidden">
        <div className="font-bold text-4xl text-[#E67E22]">
          Quản lý Ca làm việc & Phân ca
        </div>
        <div className="mb-4">
          <Breadcrumb
            items={[
              { title: <Link to="/admin">Trang chủ</Link> },
              { title: "Quản lý Ca làm việc" },
            ]}
          />
        </div>
      </div>

      {/* HEADER TABS & ACTIONS */}
      <div
        style={{
          marginTop: 24,
          marginBottom: 16,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          backgroundColor: "#fff",
          padding: "16px 24px",
          borderRadius: "8px",
          boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
        }}
      >
        <div className="bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm inline-block">
          <Segmented
            options={[
              {
                label: "Danh sách ca",
                value: "shifts",
                icon: <ClockCircleOutlined />,
              },
              {
                label: "Lịch phân ca",
                value: "assignments",
                icon: <TeamOutlined />,
              },
            ]}
            value={activeTab}
            onChange={setActiveTab}
            size="large"
            className="font-medium text-gray-600"
            style={{ "--ant-color-primary": PRIMARY_COLOR }}
          />
        </div>
        <Button
          type="primary"
          size="large"
          icon={<PlusOutlined />}
          style={{
            backgroundColor: PRIMARY_COLOR,
            borderColor: PRIMARY_COLOR,
          }}
          onClick={() => {
            if (activeTab === "shifts") {
              setEditingCa(null);
              setFormCa({
                tenCa: "",
                gioBatDau: "07:00",
                gioKetThuc: "12:00",
                moTa: "",
              });
              setIsCaModalVisible(true);
            } else {
              setEditingPhanCa(null);
              setFormPhanCa({
                idNhanVien: null,
                idCaLamViec: null,
                ngayPhanCa: dayjs().format("YYYY-MM-DD"),
                ghiChu: "",
              });
              setIsPhanCaModalVisible(true);
            }
          }}
        >
          {activeTab === "shifts" ? "Thêm Ca Mới" : "Phân Ca Mới"}
        </Button>
      </div>

      {/* SEARCH & FILTER */}
      {/* --- Tiêu đề bộ lọc --- */}
      <div
        className="text-white px-6 py-2 rounded-t-lg shadow"
        style={{
          backgroundColor: "#E67E22",
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
        }}
      >
        <div className="font-bold text-2xl text-white">
          {activeTab === "shifts" ? "Bộ lọc Ca làm việc" : "Bộ lọc Phân ca"}
        </div>
      </div>

      <Card
        style={{
          marginBottom: 16,
          backgroundColor: "#fff",
          boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
        }}
        bodyStyle={{ padding: "20px" }}
      >
        {/* --- Hàng trên: 3 ô --- */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 12,
            marginBottom: 12,
          }}
        >
          {/* Từ khóa tìm kiếm */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label className="font-medium text-gray-600">
              Từ khóa tìm kiếm
            </label>
            <Input
              placeholder={
                activeTab === "shifts"
                  ? "Tìm kiếm Tên ca, Giờ..."
                  : "Tìm kiếm Nhân viên, Tên ca..."
              }
              value={filters.search}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value })
              }
              style={{ height: 40 }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label className="font-medium text-gray-600">Ca làm việc</label>
            <Select
              placeholder="Chọn ca làm việc"
              value={filters.caLamViecId}
              onChange={(val) => setFilters({ ...filters, caLamViecId: val })}
              allowClear
              style={{ height: 40 }}
            >
              {caLamViec.map((ca) => (
                <Option key={ca.id} value={ca.id}>
                  {ca.tenCa}
                </Option>
              ))}
            </Select>
          </div>

          {/* Ngày phân ca */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label className="font-medium text-gray-600">Ngày phân ca</label>
            <DatePicker
              placeholder="Chọn ngày phân ca"
              format="DD/MM/YYYY"
              value={filters.ngayPhanCa ? dayjs(filters.ngayPhanCa) : null}
              onChange={(date) =>
                setFilters({
                  ...filters,
                  ngayPhanCa: date ? date.format("YYYY-MM-DD") : null,
                })
              }
              allowClear
              style={{ width: "100%", height: 40 }}
            />
          </div>
        </div>

        {/* --- Nút hành động --- */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 12,
            marginTop: 20,
          }}
        >
          <Button
            icon={<ReloadOutlined />}
            onClick={handleResetFilters}
            className="!bg-white !text-[#ff8c42] hover:!bg-amber-800 hover:!text-white font-medium transition-all duration-200"
          >
            Nhập lại
          </Button>

          <Button
            type="primary"
            icon={<SearchOutlined />}
            onClick={activeTab === "shifts" ? fetchCaLamViec : fetchPhanCa}
            className="!bg-[#ff8c42] !border-[#ff8c42] hover:!bg-amber-800 hover:!text-white font-medium transition-all duration-200"
          >
            Tìm kiếm
          </Button>
        </div>
      </Card>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-[#ff8c42] px-4 py-3 flex flex-wrap gap-3 justify-between items-center text-white">
          <h3 className="text-lg font-semibold m-0">
            {activeTab === "shifts"
              ? `Danh sách Ca Làm Việc (${caLamViec.length} ca)`
              : `Danh sách Phân Ca (${filteredPhanCa.length} phân công)`}
          </h3>
          <Space>
            {activeTab === "assignments" && (
              <Segmented
                options={[
                  { value: "list", icon: <UnorderedListOutlined /> },
                  { value: "calendar", icon: <CalendarOutlined /> },
                ]}
                value={assignmentsView}
                onChange={setAssignmentsView}
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.2)",
                  border: "none",
                }}
              />
            )}
            <Button
              icon={<FileExcelOutlined />}
              onClick={() =>
                exportToCSV(
                  activeTab === "shifts" ? "ca-lam-viec.csv" : "phan-ca.csv",
                  activeTab === "shifts" ? prepareShiftData() : prepareAssignmentData()
                )
              }
              className="!bg-white !border-white !text-[#ff8c42] font-medium hover:!bg-amber-800 hover:!text-white"
            >
              Xuất Excel
            </Button>
          </Space>
        </div>

        <div className="p-4">
          {activeTab === "shifts" ? (
            <Table
              // Bổ sung custom class để thêm đường kẻ dọc, giống như bảng Hóa đơn
              className="shift-table custom-striped-table"
              columns={shiftColumns}
              dataSource={caLamViec}
              rowKey="id"
              loading={loading}
              pagination={{
                pageSize: 5,
                showSizeChanger: true,
                showTotal: (total) => (
                  <span className="text-gray-400 text-sm">Tổng {total} ca</span>
                ),
                pageSizeOptions: ["5", "10", "20", "50"],
              }}
              rowClassName={() =>
                "hover:bg-orange-50/40 transition-colors cursor-pointer"
              }
              scroll={{ x: 1000 }}
            />
          ) : assignmentsView === "list" ? (
            <Table
              // Bổ sung custom class để thêm đường kẻ dọc, giống như bảng Hóa đơn
              className="shift-table custom-striped-table"
              columns={assignmentColumns}
              dataSource={filteredPhanCa}
              rowKey="id"
              loading={loading}
              pagination={{
                pageSize: 5,
                showSizeChanger: true,
                showTotal: (total) => (
                  <span className="text-gray-400 text-sm">
                    Tổng {total} phân công
                  </span>
                ),
                pageSizeOptions: ["5", "10", "20", "50"],
              }}
              rowClassName={() =>
                "hover:bg-orange-50/40 transition-colors cursor-pointer"
              }
              scroll={{ x: 1200 }}
            />
          ) : (
            <div style={{ padding: 16 }}>
              <AssignmentsCalendar
                phanCa={phanCa}
                calendarDate={calendarDate}
                onPrev={() =>
                  setCalendarDate(
                    (d) => new Date(d.getFullYear(), d.getMonth() - 1, 1)
                  )
                }
                onNext={() =>
                  setCalendarDate(
                    (d) => new Date(d.getFullYear(), d.getMonth() + 1, 1)
                  )
                }
                onDayClick={(ymd) => {
                  setEditingPhanCa(null);
                  setFormPhanCa({
                    idNhanVien: null,
                    idCaLamViec: null,
                    ngayPhanCa: ymd,
                    ghiChu: "",
                  });
                  setIsPhanCaModalVisible(true);
                }}
                onEventClick={(pc) => {
                  setEditingPhanCa(pc);
                  setFormPhanCa(pc);
                  setIsPhanCaModalVisible(true);
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* MODALS: Áp dụng màu cam cho nút chính */}
      {/* --- MODAL: THÊM/SỬA CA --- */}
      <Modal
        title={
          <div className="flex items-center gap-2 text-xl font-bold text-gray-800 pb-2 border-b border-gray-100">
            <ClockCircleOutlined style={{ color: PRIMARY_COLOR }} />{" "}
            {editingCa ? "Cập Nhật Ca Làm Việc" : "Thêm Ca Làm Việc Mới"}
          </div>
        }
        open={isCaModalVisible}
        onCancel={() => setIsCaModalVisible(false)}
        footer={null}
        centered
        className="rounded-xl"
      >
        <div className="pt-4 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">
              Tên ca <span className="text-red-500">*</span>
            </label>
            <Input
              size="large"
              className="rounded-lg"
              placeholder="Ví dụ: Ca Sáng 1"
              value={formCa.tenCa}
              onChange={(e) => setFormCa({ ...formCa, tenCa: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">
                Bắt đầu <span className="text-red-500">*</span>
              </label>
              <TimePicker
                size="large"
                className="w-full rounded-lg"
                format="HH:mm"
                placeholder="HH:MM"
                value={
                  formCa.gioBatDau ? dayjs(formCa.gioBatDau, "HH:mm") : null
                }
                onChange={(time, timeString) =>
                  setFormCa({ ...formCa, gioBatDau: timeString })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">
                Kết thúc <span className="text-red-500">*</span>
              </label>
              <TimePicker
                size="large"
                className="w-full rounded-lg"
                format="HH:mm"
                placeholder="HH:MM"
                value={
                  formCa.gioKetThuc ? dayjs(formCa.gioKetThuc, "HH:mm") : null
                }
                onChange={(time, timeString) =>
                  setFormCa({ ...formCa, gioKetThuc: timeString })
                }
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">
              Mô tả
            </label>
            <TextArea
              className="rounded-lg"
              rows={3}
              placeholder="Ghi chú thêm về ca làm việc..."
              value={formCa.moTa}
              onChange={(e) => setFormCa({ ...formCa, moTa: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              className="rounded-lg border-gray-300 bg-white text-gray-600 font-medium h-10 px-4"
              onClick={() => setIsCaModalVisible(false)}
            >
              Hủy
            </Button>
            <Button
              type="primary"
              className="rounded-lg font-bold h-10 px-6 shadow-md shadow-orange-200 border-none text-white"
              style={{
                backgroundColor: PRIMARY_COLOR,
                borderColor: PRIMARY_COLOR,
              }}
              onClick={handleSaveCa}
              loading={submitLoading}
            >
              Lưu lại
            </Button>
          </div>
        </div>
      </Modal>

      {/* --- MODAL: PHÂN CA --- */}
      <Modal
        title={
          <div className="flex items-center gap-2 text-xl font-bold text-gray-800 pb-2 border-b border-gray-100">
            <TeamOutlined style={{ color: PRIMARY_COLOR }} />{" "}
            {editingPhanCa ? "Cập Nhật Phân Ca" : "Phân Ca Mới"}
          </div>
        }
        open={isPhanCaModalVisible}
        onCancel={() => setIsPhanCaModalVisible(false)}
        footer={null}
        centered
        className="rounded-xl"
      >
        <div className="pt-4 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">
              Nhân viên <span className="text-red-500">*</span>
            </label>
            <Select
              size="large"
              className="w-full"
              placeholder="Chọn nhân viên"
              value={formPhanCa.idNhanVien}
              onChange={(val) =>
                setFormPhanCa({ ...formPhanCa, idNhanVien: val })
              }
            >
              {nhanVien.map((nv) => (
                <Option key={nv.id} value={nv.id}>
                  {nv.hoTen}
                </Option>
              ))}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">
                Ca làm việc <span className="text-red-500">*</span>
              </label>
              <Select
                size="large"
                className="w-full"
                placeholder="Chọn ca"
                value={formPhanCa.idCaLamViec}
                onChange={(val) =>
                  setFormPhanCa({ ...formPhanCa, idCaLamViec: val })
                }
              >
                {caLamViec.map((ca) => (
                  <Option key={ca.id} value={ca.id}>
                    {ca.tenCa} ({ca.gioBatDau}-{ca.gioKetThuc})
                  </Option>
                ))}
              </Select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">
                Ngày làm <span className="text-red-500">*</span>
              </label>
              <DatePicker
                size="large"
                className="w-full rounded-lg"
                format="DD/MM/YYYY"
                value={
                  formPhanCa.ngayPhanCa ? dayjs(formPhanCa.ngayPhanCa) : null
                }
                onChange={(date, dateString) =>
                  setFormPhanCa({
                    ...formPhanCa,
                    ngayPhanCa: date ? date.format("YYYY-MM-DD") : null,
                  })
                }
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">
              Ghi chú
            </label>
            <TextArea
              className="rounded-lg"
              rows={2}
              placeholder="Ghi chú phân công..."
              value={formPhanCa.ghiChu}
              onChange={(e) =>
                setFormPhanCa({ ...formPhanCa, ghiChu: e.target.value })
              }
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              className="rounded-lg border-gray-300 bg-white text-gray-600 font-medium h-10 px-4"
              onClick={() => setIsPhanCaModalVisible(false)}
            >
              Hủy
            </Button>
            <Button
              type="primary"
              className="rounded-lg font-bold h-10 px-6 shadow-md shadow-orange-200 border-none text-white"
              style={{
                backgroundColor: PRIMARY_COLOR,
                borderColor: PRIMARY_COLOR,
              }}
              onClick={handleSavePhanCa}
              loading={submitLoading}
            >
              Lưu phân ca
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}