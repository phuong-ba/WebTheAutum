import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Card,
  Tag,
  Modal,
  Input,
  Select,
  DatePicker,
  TimePicker,
  message,
  Tooltip,
  Row,
  Col,
  Typography,
  Dropdown,
  Menu,
  Segmented,
  Space,
  Calendar,
  Badge
} from "antd";
import {
  ClockCircleOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CalendarOutlined,
  TeamOutlined,
  ExportOutlined,
  UnorderedListOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  ExclamationCircleOutlined,
  MoreOutlined,
  FileExcelOutlined,
  FileWordOutlined,
  LeftOutlined,
  RightOutlined
} from "@ant-design/icons";
import dayjs from "dayjs";

const { TextArea } = Input;
const { Option } = Select;
const { Title, Text } = Typography;
const { confirm } = Modal;

// --- CẤU HÌNH API (Fix lỗi import.meta) ---
const API_BASE = "http://localhost:8080/api";

// --- HELPERS (Tích hợp trực tiếp để tránh lỗi import) ---
const exportToCSV = (filename, data, columns) => {
  if (!data || !data.length) {
    message.warning("Không có dữ liệu để xuất");
    return;
  }
  
  // Lấy header từ keys của object đầu tiên nếu columns không được cung cấp, hoặc map từ columns
  const headers = data.length > 0 ? Object.keys(data[0]) : [];
  const csvContent = [
    headers.join(","),
    ...data.map(row => headers.map(fieldName => JSON.stringify(row[fieldName], (key, value) => value === null ? '' : value)).join(","))
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

const exportToWord = (filename, title, contentHtml) => {
  const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' " +
       "xmlns:w='urn:schemas-microsoft-com:office:word' " +
       "xmlns='http://www.w3.org/TR/REC-html40'>" +
       "<head><meta charset='utf-8'><title>" + title + "</title></head><body>";
  const footer = "</body></html>";
  const sourceHTML = header + contentHtml + footer;

  const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(sourceHTML);
  const fileDownload = document.createElement("a");
  document.body.appendChild(fileDownload);
  fileDownload.href = source;
  fileDownload.download = filename;
  fileDownload.click();
  document.body.removeChild(fileDownload);
};

// --- COMPONENT LỊCH (Tích hợp trực tiếp) ---
const AssignmentsCalendar = ({ phanCa, calendarDate, onPrev, onNext, onDayClick, onEventClick }) => {
  const getListData = (value) => {
    const listData = phanCa.filter(pc => 
      dayjs(pc.ngayPhanCa).format('YYYY-MM-DD') === value.format('YYYY-MM-DD')
    );
    return listData || [];
  };

  const dateCellRender = (value) => {
    const listData = getListData(value);
    return (
      <ul className="events list-none p-0 m-0">
        {listData.map((item) => (
          <li key={item.id} onClick={(e) => { e.stopPropagation(); onEventClick(item); }}>
            <Badge status="warning" text={<span className="text-xs text-gray-600">{item.hoTenNhanVien} ({item.gioBatDau})</span>} />
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="calendar-wrapper">
        <div className="flex justify-between items-center mb-4 px-4">
            <Button icon={<LeftOutlined />} onClick={onPrev} />
            <span className="font-bold text-lg capitalize">{dayjs(calendarDate).format("MMMM YYYY")}</span>
            <Button icon={<RightOutlined />} onClick={onNext} />
        </div>
        <Calendar 
            value={dayjs(calendarDate)}
            cellRender={dateCellRender} 
            onSelect={(date) => {
                if (date.format('MM') !== dayjs(calendarDate).format('MM')) {
                    // Nếu click vào ngày tháng khác thì không trigger form ngay mà chuyển tháng
                    // Logic tùy chỉnh
                } else {
                    onDayClick(date.format('YYYY-MM-DD'));
                }
            }}
            headerRender={() => null} // Ẩn header mặc định để dùng header tùy chỉnh
        />
    </div>
  );
};

export default function ShiftManagement() {
  // --- STATE ---
  const [activeTab, setActiveTab] = useState("shifts"); // 'shifts' | 'assignments'
  const [caLamViec, setCaLamViec] = useState([]);
  const [phanCa, setPhanCa] = useState([]);
  const [nhanVien, setNhanVien] = useState([]);
  const [loading, setLoading] = useState(false);
  const [assignmentsView, setAssignmentsView] = useState("list"); // 'list' | 'calendar'
  const [calendarDate, setCalendarDate] = useState(new Date());

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
    if (activeTab === "shifts") fetchCaLamViec();
    if (activeTab === "assignments") {
        fetchPhanCa();
        fetchNhanVien(); // Load nhân viên khi vào tab phân ca
    }
  }, [activeTab]);

  // --- API CALLS ---
  const fetchCaLamViec = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/ca-lam-viec`);
      if (response.ok) {
        const data = await response.json();
        setCaLamViec(Array.isArray(data) ? data : []);
      } else {
        showNotification("error", "Không tải được danh sách ca");
      }
    } catch (error) {
      showNotification("error", "Lỗi kết nối server");
    } finally {
      setLoading(false);
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
        showNotification("error", "Không tải được danh sách phân ca");
      }
    } catch (error) {
      showNotification("error", "Lỗi kết nối server");
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

  // --- ACTIONS: CA LÀM VIỆC ---
  const handleSaveCa = async () => {
    if (!formCa.tenCa || !formCa.gioBatDau || !formCa.gioKetThuc) {
      showNotification("error", "Vui lòng nhập đầy đủ tên và giờ");
      return;
    }
    setSubmitLoading(true);
    try {
      const url = editingCa ? `${API_BASE}/ca-lam-viec/${editingCa.id}` : `${API_BASE}/ca-lam-viec`;
      const method = editingCa ? "PUT" : "POST";
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formCa),
      });

      if (response.ok) {
        showNotification("success", editingCa ? "Cập nhật thành công" : "Thêm mới thành công");
        setFormCa({ tenCa: "", gioBatDau: "07:00", gioKetThuc: "12:00", moTa: "" });
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

  const handleDeleteCa = (id) => {
    confirm({
      title: "Xác nhận xóa ca làm việc?",
      icon: <ExclamationCircleOutlined style={{ color: "#ff4d4f" }} />,
      content: "Hành động này không thể hoàn tác.",
      okText: "Xóa",
      okType: "danger",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          const response = await fetch(`${API_BASE}/ca-lam-viec/${id}`, { method: "DELETE" });
          if (response.ok) {
            showNotification("success", "Đã xóa thành công");
            fetchCaLamViec();
          } else {
            showNotification("error", "Xóa thất bại (Ca có thể đang được sử dụng)");
          }
        } catch (error) {
          showNotification("error", "Lỗi hệ thống");
        }
      },
    });
  };

  // --- ACTIONS: PHÂN CA ---
  const handleSavePhanCa = async () => {
    if (!formPhanCa.idNhanVien || !formPhanCa.idCaLamViec || !formPhanCa.ngayPhanCa) {
      showNotification("error", "Vui lòng chọn nhân viên, ca và ngày");
      return;
    }
    setSubmitLoading(true);
    try {
      const url = editingPhanCa ? `${API_BASE}/phan-ca/${editingPhanCa.id}` : `${API_BASE}/phan-ca`;
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
        showNotification("success", editingPhanCa ? "Cập nhật phân ca thành công" : "Phân ca thành công");
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

  const handleDeletePhanCa = (id) => {
    confirm({
      title: "Xác nhận xóa phân ca?",
      icon: <ExclamationCircleOutlined style={{ color: "#ff4d4f" }} />,
      content: "Nhân viên sẽ bị gỡ khỏi lịch làm việc này.",
      okText: "Xóa",
      okType: "danger",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          const response = await fetch(`${API_BASE}/phan-ca/${id}`, { method: "DELETE" });
          if (response.ok) {
            showNotification("success", "Đã xóa phân ca");
            fetchPhanCa();
          } else {
            showNotification("error", "Xóa thất bại");
          }
        } catch (error) {
          showNotification("error", "Lỗi hệ thống");
        }
      },
    });
  };

  // --- HELPER HANDLERS ---
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

  // --- EXPORT PREPARATION ---
  const prepareShiftData = () => caLamViec.map(c => ({ "Tên ca": c.tenCa, "Bắt đầu": c.gioBatDau, "Kết thúc": c.gioKetThuc, "Mô tả": c.moTa }));
  const prepareAssignmentData = () => phanCa.map(p => ({ "Nhân viên": p.hoTenNhanVien, "Ca": p.tenCa, "Ngày": p.ngayPhanCa, "Giờ": `${p.gioBatDau}-${p.gioKetThuc}`, "Ghi chú": p.ghiChu }));

  const renderShiftsHtml = () => {
    const rows = caLamViec.map(s => `<tr><td>${s.tenCa}</td><td>${s.gioBatDau}</td><td>${s.gioKetThuc}</td><td>${s.moTa || ''}</td></tr>`).join('');
    return `<table border="1" style="width:100%;border-collapse:collapse"><thead><tr><th>Tên ca</th><th>Giờ bắt đầu</th><th>Giờ kết thúc</th><th>Mô tả</th></tr></thead><tbody>${rows}</tbody></table>`;
  };

  const renderAssignmentsHtml = () => {
    const rows = phanCa.map(a => `<tr><td>${a.hoTenNhanVien}</td><td>${a.tenCa}</td><td>${a.ngayPhanCa}</td><td>${a.gioBatDau || ''} - ${a.gioKetThuc || ''}</td><td>${a.ghiChu || ''}</td></tr>`).join('');
    return `<table border="1" style="width:100%;border-collapse:collapse"><thead><tr><th>Nhân viên</th><th>Ca</th><th>Ngày</th><th>Giờ</th><th>Ghi chú</th></tr></thead><tbody>${rows}</tbody></table>`;
  };

  // --- TABLE COLUMNS ---
  const shiftColumns = [
    { title: "Tên Ca", dataIndex: "tenCa", key: "tenCa", render: (text) => <span className="font-semibold text-slate-800">{text}</span> },
    {
        title: "Thời Gian",
        key: "time",
        render: (_, record) => (
            <Tag icon={<ClockCircleOutlined />} color="orange" className="border-0 bg-orange-50 text-orange-600">
                {record.gioBatDau} - {record.gioKetThuc}
            </Tag>
        )
    },
    { title: "Mô Tả", dataIndex: "moTa", key: "moTa", render: (text) => <span className="text-gray-500">{text || "—"}</span> },
    {
        key: "action",
        width: 80,
        align: "center",
        render: (_, record) => (
            <Dropdown
                menu={{
                    items: [
                        { key: 'edit', label: 'Chỉnh sửa', icon: <EditOutlined />, onClick: () => openEditCa(record) },
                        { key: 'delete', label: 'Xóa', icon: <DeleteOutlined />, danger: true, onClick: () => handleDeleteCa(record.id) }
                    ]
                }}
            >
                <Button type="text" icon={<MoreOutlined />} />
            </Dropdown>
        )
    }
  ];

  const assignmentColumns = [
    {
        title: "Nhân Viên",
        dataIndex: "hoTenNhanVien",
        key: "hoTenNhanVien",
        render: (text) => (
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                    <TeamOutlined />
                </div>
                <span className="font-medium">{text}</span>
            </div>
        )
    },
    { title: "Ca Làm Việc", dataIndex: "tenCa", key: "tenCa", render: (text) => <span className="font-medium text-orange-600">{text}</span> },
    {
        title: "Thời Gian",
        key: "time",
        render: (_, record) => (
            <div className="flex flex-col text-xs text-gray-500">
                <span className="font-medium text-gray-700"><CalendarOutlined className="mr-1"/>{dayjs(record.ngayPhanCa).format("DD/MM/YYYY")}</span>
                <span>{record.gioBatDau} - {record.gioKetThuc}</span>
            </div>
        )
    },
    { title: "Ghi Chú", dataIndex: "ghiChu", key: "ghiChu", ellipsis: true },
    {
        key: "action",
        width: 80,
        align: "center",
        render: (_, record) => (
            <Dropdown
                menu={{
                    items: [
                        { key: 'edit', label: 'Chỉnh sửa', icon: <EditOutlined />, onClick: () => openEditPhanCa(record) },
                        { key: 'delete', label: 'Xóa', icon: <DeleteOutlined />, danger: true, onClick: () => handleDeletePhanCa(record.id) }
                    ]
                }}
            >
                <Button type="text" icon={<MoreOutlined />} />
            </Dropdown>
        )
    }
  ];

  return (
    <div className="min-h-screen bg-[#f8f9fa] p-6 font-sans relative">
      {/* CUSTOM TOAST NOTIFICATION */}
      {notification.message && (
        <div className="fixed top-6 right-6 z-[9999] animate-bounce-in">
          <div className={`px-5 py-3.5 rounded-xl shadow-2xl text-sm font-semibold flex items-center gap-3 border ${
              notification.type === "success" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"
            }`}
          >
            {notification.type === "success" ? <CheckCircleFilled className="text-xl text-emerald-500" /> : <CloseCircleFilled className="text-xl text-red-500" />}
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-6">
        {/* HEADER */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-2xl bg-[#fff7e6] flex items-center justify-center border border-orange-100 shadow-sm">
                <CalendarOutlined className="text-2xl text-[#fa8c16]" />
             </div>
             <div>
                <Title level={4} style={{ margin: 0, color: '#262626' }}>Quản Lý Ca Làm Việc</Title>
                <Text type="secondary" className="text-sm">Thiết lập ca và phân công nhân sự</Text>
             </div>
          </div>

          <div className="flex items-center gap-3">
             {activeTab === "assignments" && (
                 <div className="hidden sm:flex bg-gray-100 p-1 rounded-xl">
                     <Button 
                        type={assignmentsView === "list" ? "text" : "text"} 
                        className={assignmentsView === "list" ? "bg-white shadow-sm font-semibold text-orange-600 rounded-lg" : "text-gray-500"}
                        icon={<UnorderedListOutlined />}
                        onClick={() => setAssignmentsView("list")}
                     >
                        Danh sách
                     </Button>
                     <Button 
                        type={assignmentsView === "calendar" ? "text" : "text"} 
                        className={assignmentsView === "calendar" ? "bg-white shadow-sm font-semibold text-orange-600 rounded-lg" : "text-gray-500"}
                        icon={<CalendarOutlined />}
                        onClick={() => setAssignmentsView("calendar")}
                     >
                        Lịch
                     </Button>
                 </div>
             )}
             <Button
                type="primary"
                size="large"
                icon={<PlusOutlined />}
                className="bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 border-none shadow-orange-200 shadow-lg rounded-xl h-11 px-6 font-semibold"
                onClick={() => activeTab === "shifts" ? setIsCaModalVisible(true) : setIsPhanCaModalVisible(true)}
             >
                {activeTab === "shifts" ? "Thêm Ca Mới" : "Phân Ca Mới"}
             </Button>
          </div>
        </div>

        {/* TABS & ACTIONS */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <Segmented
                options={[
                    { label: 'Danh sách ca', value: 'shifts', icon: <ClockCircleOutlined /> },
                    { label: 'Lịch phân ca', value: 'assignments', icon: <TeamOutlined /> },
                ]}
                value={activeTab}
                onChange={setActiveTab}
                size="large"
                className="bg-white p-1 border border-gray-100 shadow-sm rounded-xl"
            />
            
            <div className="flex gap-2">
                <Tooltip title="Xuất Excel">
                    <Button icon={<FileExcelOutlined className="text-green-600"/>} onClick={() => exportToCSV(activeTab === 'shifts' ? 'ca-lam-viec.csv' : 'phan-ca.csv', activeTab === 'shifts' ? caLamViec : phanCa, activeTab === 'shifts' ? prepareShiftData() : prepareAssignmentData())} className="rounded-xl border-gray-200 bg-white text-gray-600 hover:bg-green-50 hover:border-green-200">Excel</Button>
                </Tooltip>
                <Tooltip title="Xuất Word">
                    <Button icon={<FileWordOutlined className="text-blue-600"/>} onClick={() => exportToWord(activeTab === 'shifts' ? 'ca-lam-viec.doc' : 'phan-ca.doc', activeTab === 'shifts' ? 'Danh sách ca' : 'Danh sách phân ca', activeTab === 'shifts' ? renderShiftsHtml() : renderAssignmentsHtml())} className="rounded-xl border-gray-200 bg-white text-gray-600 hover:bg-blue-50 hover:border-blue-200">Word</Button>
                </Tooltip>
            </div>
        </div>

        {/* CONTENT AREA */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden min-h-[400px]">
            {activeTab === "shifts" ? (
                <Table
                    columns={shiftColumns}
                    dataSource={caLamViec}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 6, showTotal: (t) => `Tổng ${t} ca` }}
                    rowClassName="hover:bg-orange-50/30 cursor-pointer"
                />
            ) : (
                <>
                    {assignmentsView === "list" ? (
                        <Table
                            columns={assignmentColumns}
                            dataSource={phanCa}
                            rowKey="id"
                            loading={loading}
                            pagination={{ pageSize: 6, showTotal: (t) => `Tổng ${t} phân công` }}
                            rowClassName="hover:bg-orange-50/30 cursor-pointer"
                        />
                    ) : (
                        <div className="p-4">
                            <AssignmentsCalendar 
                                phanCa={phanCa} 
                                calendarDate={calendarDate} 
                                onPrev={() => setCalendarDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))} 
                                onNext={() => setCalendarDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
                                onDayClick={(ymd) => {
                                    setEditingPhanCa(null);
                                    setFormPhanCa({ ...formPhanCa, ngayPhanCa: ymd });
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
                </>
            )}
        </div>
      </div>

      {/* --- MODAL: THÊM/SỬA CA --- */}
      <Modal
        title={<div className="flex items-center gap-2 text-lg text-gray-800 pb-2 border-b border-gray-100"><ClockCircleOutlined className="text-[#fa8c16]"/> {editingCa ? "Cập Nhật Ca" : "Thêm Ca Mới"}</div>}
        open={isCaModalVisible}
        onCancel={() => setIsCaModalVisible(false)}
        footer={null}
        centered
        className="rounded-2xl"
      >
        <div className="pt-4 space-y-4">
            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tên ca</label>
                <Input size="large" className="rounded-xl" placeholder="Ví dụ: Ca Sáng" value={formCa.tenCa} onChange={e => setFormCa({...formCa, tenCa: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Bắt đầu</label>
                    <TimePicker size="large" className="w-full rounded-xl" format="HH:mm" value={formCa.gioBatDau ? dayjs(formCa.gioBatDau, "HH:mm") : null} onChange={(time, timeString) => setFormCa({...formCa, gioBatDau: timeString})} />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Kết thúc</label>
                    <TimePicker size="large" className="w-full rounded-xl" format="HH:mm" value={formCa.gioKetThuc ? dayjs(formCa.gioKetThuc, "HH:mm") : null} onChange={(time, timeString) => setFormCa({...formCa, gioKetThuc: timeString})} />
                </div>
            </div>
            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Mô tả</label>
                <TextArea className="rounded-xl" rows={3} placeholder="Ghi chú thêm..." value={formCa.moTa} onChange={e => setFormCa({...formCa, moTa: e.target.value})} />
            </div>
            <div className="flex justify-end gap-3 pt-2">
                <Button className="rounded-xl border-none bg-gray-100 text-gray-600 font-medium h-10" onClick={() => setIsCaModalVisible(false)}>Hủy</Button>
                <Button type="primary" className="rounded-xl bg-[#fa8c16] hover:bg-orange-500 border-none font-bold h-10 px-6" onClick={handleSaveCa} loading={submitLoading}>Lưu lại</Button>
            </div>
        </div>
      </Modal>

      {/* --- MODAL: PHÂN CA --- */}
      <Modal
        title={<div className="flex items-center gap-2 text-lg text-gray-800 pb-2 border-b border-gray-100"><TeamOutlined className="text-blue-500"/> {editingPhanCa ? "Cập Nhật Phân Ca" : "Phân Ca Mới"}</div>}
        open={isPhanCaModalVisible}
        onCancel={() => setIsPhanCaModalVisible(false)}
        footer={null}
        centered
        className="rounded-2xl"
      >
        <div className="pt-4 space-y-4">
            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nhân viên</label>
                <Select 
                    size="large" 
                    className="w-full" 
                    placeholder="Chọn nhân viên"
                    value={formPhanCa.idNhanVien}
                    onChange={val => setFormPhanCa({...formPhanCa, idNhanVien: val})}
                >
                    {nhanVien.map(nv => <Option key={nv.id} value={nv.id}>{nv.hoTen}</Option>)}
                </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Ca làm việc</label>
                    <Select 
                        size="large" 
                        className="w-full" 
                        placeholder="Chọn ca"
                        value={formPhanCa.idCaLamViec}
                        onChange={val => setFormPhanCa({...formPhanCa, idCaLamViec: val})}
                    >
                        {caLamViec.map(ca => <Option key={ca.id} value={ca.id}>{ca.tenCa} ({ca.gioBatDau}-{ca.gioKetThuc})</Option>)}
                    </Select>
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Ngày làm</label>
                    <DatePicker 
                        size="large" 
                        className="w-full rounded-xl" 
                        format="DD/MM/YYYY"
                        value={formPhanCa.ngayPhanCa ? dayjs(formPhanCa.ngayPhanCa) : null}
                        onChange={(date, dateString) => setFormPhanCa({...formPhanCa, ngayPhanCa: date ? date.format("YYYY-MM-DD") : null})}
                    />
                </div>
            </div>
            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Ghi chú</label>
                <TextArea className="rounded-xl" rows={2} placeholder="Ghi chú phân công..." value={formPhanCa.ghiChu} onChange={e => setFormPhanCa({...formPhanCa, ghiChu: e.target.value})} />
            </div>
            <div className="flex justify-end gap-3 pt-2">
                <Button className="rounded-xl border-none bg-gray-100 text-gray-600 font-medium h-10" onClick={() => setIsPhanCaModalVisible(false)}>Hủy</Button>
                <Button type="primary" className="rounded-xl bg-blue-500 hover:bg-blue-600 border-none font-bold h-10 px-6" onClick={handleSavePhanCa} loading={submitLoading}>Lưu phân ca</Button>
            </div>
        </div>
      </Modal>
    </div>
  );
}