import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Card,
  Tag,
  Modal,
  Input,
  InputNumber,
  Tooltip,
  Row,
  Col,
  Typography,
  Dropdown,
  Menu,
  Segmented,
  Space
} from "antd";
import {
  ClockCircleOutlined,
  PlayCircleOutlined,
  StopOutlined,
  DeleteOutlined,
  DollarOutlined,
  UserOutlined,
  RiseOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  ExclamationCircleOutlined,
  MoreOutlined,
  WalletOutlined,
  FormOutlined,
  AppstoreOutlined,
  CheckCircleFilled,
  CloseCircleFilled
} from "@ant-design/icons";

const { TextArea } = Input;
const { Title, Text } = Typography;
const { confirm } = Modal;

// --- CẤU HÌNH API ---
const API_BASE = "http://localhost:8080/api";

// --- FORMAT HELPER ---
const formatMoney = (value) => {
  if (value === null || value === undefined) return "—";
  if (value === 0) return "0 ₫";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(Number(value));
};

const formatDateTime = (dateString) => {
  if (!dateString) return "—";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return String(dateString);
  return date.toLocaleDateString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

// --- CONFIG TRẠNG THÁI (Google Style - Cam Nhẹ) ---
const getStatusConfig = (isCompleted) => {
  if (!isCompleted) {
    return {
      label: "Đang hoạt động",
      color: "#fa8c16", // Cam đậm
      bg: "#fff7e6",    // Cam rất nhạt
      icon: <SyncOutlined spin />,
    };
  }
  return {
    label: "Đã hoàn thành",
    color: "#52c41a", // Xanh lá
    bg: "#f6ffed",    // Xanh nhạt
    icon: <CheckCircleOutlined />,
  };
};

export default function GiaoCaManagement() {
  // --- STATE DỮ LIỆU ---
  const [giaoCaList, setGiaoCaList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("active");

  // --- STATE MODAL ---
  const [isStartModalVisible, setIsStartModalVisible] = useState(false);
  const [isEndModalVisible, setIsEndModalVisible] = useState(false);
  const [selectedGiaoCa, setSelectedGiaoCa] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  // --- STATE FORM ---
  const [startForm, setStartForm] = useState({ soTienBatDau: "", ghiChu: "" });
  const [endForm, setEndForm] = useState({ ghiChu: "" });

  const [currentUser, setCurrentUser] = useState(null);

  // --- STATE THÔNG BÁO (NOTIFICATION TÙY CHỈNH) ---
  const [notification, setNotification] = useState({
    type: "",
    message: "",
  });

  const showNotification = (type, message) => {
    setNotification({ type, message });
    // Tự động tắt sau 3 giây
    setTimeout(() => {
      setNotification({ type: "", message: "" });
    }, 3000);
  };

  // --- INIT ---
  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchGiaoCa();
    }
  }, [currentUser]);

  const getCurrentUser = () => {
    try {
      const userId = localStorage.getItem("user_id");
      const userName = localStorage.getItem("user_name");
      const userEmail = localStorage.getItem("user_email");
      if (userId) {
        return {
          id: parseInt(userId, 10),
          hoTen: userName || "Nhân viên",
          username: userEmail || "",
        };
      }
      return null;
    } catch (e) {
      return null;
    }
  };

  // --- API FUNCTIONS ---
  const fetchGiaoCa = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/giao-ca`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        const fullList = Array.isArray(data) ? data : [];
        if (currentUser?.id) {
          const sortedList = fullList
            .filter((gc) => gc.idNhanVien === currentUser.id)
            .sort((a, b) => new Date(b.thoiGianBatDau) - new Date(a.thoiGianBatDau));
          setGiaoCaList(sortedList);
        } else {
          setGiaoCaList([]);
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        showNotification("error", errorData.error || "Không tải được danh sách giao ca");
      }
    } catch (error) {
      showNotification("error", "Lỗi kết nối server: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStartShift = async () => {
    if (!currentUser || !currentUser.id) {
      showNotification("error", "Không xác định được thông tin nhân viên.");
      return;
    }

    if (startForm.soTienBatDau === "" || startForm.soTienBatDau === null) {
      showNotification("error", "Vui lòng nhập số tiền bắt đầu.");
      return;
    }

    setSubmitLoading(true);
    try {
      const payload = {
        idNhanVien: currentUser.id,
        soTienBatDau: parseFloat(startForm.soTienBatDau),
        ghiChu: startForm.ghiChu || "",
      };

      const response = await fetch(`${API_BASE}/giao-ca/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        showNotification("success", "Bắt đầu giao ca thành công");
        setStartForm({ soTienBatDau: "", ghiChu: "" });
        setIsStartModalVisible(false);
        fetchGiaoCa();
        setActiveTab("active");
      } else {
        const errorData = await response.json().catch(() => ({}));
        showNotification(
          "error",
          errorData.error || errorData.message || "Bắt đầu giao ca thất bại."
        );
      }
    } catch (error) {
      showNotification("error", "Lỗi kết nối: " + error.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleEndShift = async () => {
    if (!selectedGiaoCa) return;
    
    setSubmitLoading(true);
    try {
      const payload = {
        idNhanVien: currentUser.id, // Bắt buộc gửi kèm idNhanVien
        ghiChu: endForm.ghiChu || ""
      };

      const response = await fetch(
        `${API_BASE}/giao-ca/${selectedGiaoCa.id}/end`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (response.ok) {
        showNotification("success", "Kết thúc giao ca thành công");
        setEndForm({ ghiChu: "" });
        setIsEndModalVisible(false);
        setSelectedGiaoCa(null);
        fetchGiaoCa();
      } else {
        const errorData = await response.json().catch(() => ({}));
        showNotification(
          "error",
          errorData.error || errorData.message || "Kết thúc giao ca thất bại."
        );
      }
    } catch (error) {
      showNotification("error", "Lỗi: " + error.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = (id) => {
    confirm({
      title: "Xác nhận xóa giao ca",
      icon: <ExclamationCircleOutlined style={{ color: "#ff4d4f" }} />,
      content: "Bạn có chắc chắn muốn xóa giao ca này? Hành động này không thể hoàn tác.",
      okText: "Xóa",
      okType: "danger",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          const response = await fetch(`${API_BASE}/giao-ca/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${localStorage.getItem("auth_token")}` },
          });
          if (response.ok) {
            showNotification("success", "Xóa giao ca thành công");
            fetchGiaoCa();
          } else {
            const errorData = await response.json().catch(() => ({}));
            showNotification("error", errorData.error || "Xóa giao ca thất bại");
          }
        } catch (error) {
          showNotification("error", "Lỗi: " + error.message);
        }
      },
    });
  };

  // --- LỌC DỮ LIỆU ---
  const getFilteredData = () => {
    if (activeTab === 'active') {
      return giaoCaList.filter(gc => !gc.thoiGianKetThuc);
    }
    if (activeTab === 'completed') {
      return giaoCaList.filter(gc => !!gc.thoiGianKetThuc);
    }
    return giaoCaList; 
  };

  const filteredData = getFilteredData();
  const activeCount = giaoCaList.filter((gc) => !gc.thoiGianKetThuc).length;
  const completedCount = giaoCaList.filter((gc) => !!gc.thoiGianKetThuc).length;
  const totalCount = giaoCaList.length;
  const currentActiveShift = giaoCaList.find((gc) => !gc.thoiGianKetThuc);

  // --- CẤU HÌNH CỘT BẢNG ---
  const columns = [
    {
      title: <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Mã Ca</span>,
      dataIndex: "id",
      key: "id",
      width: 70,
      align: "center",
      render: (text) => (
        <span className="font-mono font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded text-xs border border-gray-200">
          #{text}
        </span>
      ),
    },
    {
      title: <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Thời Gian</span>,
      key: "time",
      width: 250,
      render: (_, record) => (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-sm text-gray-800">
            <PlayCircleOutlined className="text-orange-500 text-xs" />
            <span className="font-medium">{formatDateTime(record.thoiGianBatDau)}</span>
          </div>
          {record.thoiGianKetThuc && (
            <div className="flex items-center gap-2 text-xs text-gray-400">
               <StopOutlined className="text-gray-400 text-xs" />
               <span>{formatDateTime(record.thoiGianKetThuc)}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      title: <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Tiền Đầu Ca</span>,
      dataIndex: "soTienBatDau",
      key: "soTienBatDau",
      align: "right",
      width: 140,
      render: (val) => <span className="text-gray-600 font-medium">{formatMoney(val)}</span>,
    },
    {
      title: <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Tiền Cuối Ca</span>,
      dataIndex: "soTienKetThuc",
      key: "soTienKetThuc",
      align: "right",
      width: 140,
      render: (val, record) =>
        record.thoiGianKetThuc ? (
          <span className="font-bold text-[#fa8c16] font-mono">{formatMoney(val)}</span>
        ) : (
          <span className="text-gray-300 text-xs italic">--</span>
        ),
    },
    {
      title: <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Doanh Thu</span>,
      dataIndex: "tongDoanhThu",
      key: "tongDoanhThu",
      align: "right",
      width: 140,
      render: (val, record) => {
        if (!record.thoiGianKetThuc) return <span className="text-gray-300 text-xs italic">--</span>;
        const isPositive = Number(val) >= 0;
        return (
          <span className={`font-mono font-bold text-sm ${isPositive ? "text-green-600" : "text-red-500"}`}>
            {isPositive ? "+" : ""}{formatMoney(val)}
          </span>
        );
      }
    },
    {
      title: <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Trạng Thái</span>,
      key: "status",
      align: "center",
      width: 150,
      render: (_, record) => {
        const isCompleted = !!record.thoiGianKetThuc;
        const config = getStatusConfig(isCompleted);
        return (
            <Tag
              className="border-0 rounded-full px-3 py-1 flex items-center justify-center gap-1.5 w-fit mx-auto transition-all shadow-sm"
              style={{
                color: config.color,
                backgroundColor: config.bg,
                fontSize: "12px",
                fontWeight: 600,
              }}
            >
              {config.icon}
              {config.label}
            </Tag>
        );
      },
    },
    {
      key: "action",
      align: "center",
      width: 60,
      render: (_, record) => {
        const menuItems = [
            !record.thoiGianKetThuc && {
                key: 'end',
                label: 'Kết thúc ca',
                icon: <StopOutlined className="text-red-500"/>,
                onClick: () => {
                    setSelectedGiaoCa(record);
                    setIsEndModalVisible(true);
                    setFormEnd({ ghiChu: "" });
                }
            },
            {
                key: 'note',
                label: 'Xem ghi chú',
                icon: <FormOutlined />,
                disabled: !record.ghiChu,
                title: record.ghiChu,
                onClick: () => {} 
            },
            { type: 'divider' },
            {
                key: 'delete',
                label: 'Xóa',
                icon: <DeleteOutlined />,
                danger: true,
                onClick: () => handleDelete(record.id)
            }
        ].filter(Boolean);

        return (
            <Dropdown menu={{ items: menuItems }} trigger={['click']} placement="bottomRight" arrow>
                <Button type="text" shape="circle" icon={<MoreOutlined className="text-gray-400 hover:text-orange-500 text-lg" />} />
            </Dropdown>
        );
      },
    },
  ];

  return (
    <div className="min-h-screen bg-[#f8f9fa] p-6 font-sans relative">
      
      {/* --- CUSTOM NOTIFICATION TOAST (Giống code gốc) --- */}
      {notification.message && (
        <div className="fixed top-6 right-6 z-[9999] animate-bounce-in">
          <div
            className={`px-5 py-3.5 rounded-xl shadow-2xl text-sm font-semibold flex items-center gap-3 border ${
              notification.type === "success"
                ? "bg-emerald-50 text-emerald-700 border-emerald-200 shadow-emerald-100"
                : "bg-red-50 text-red-700 border-red-200 shadow-red-100"
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

      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* --- HEADER --- */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-2xl bg-[#fff7e6] flex items-center justify-center border border-orange-100 shadow-sm">
                <ClockCircleOutlined className="text-2xl text-[#fa8c16]" />
             </div>
             <div>
                <Title level={4} style={{ margin: 0, color: '#262626' }}>Quản Lý Giao Ca</Title>
                <Text type="secondary" className="text-sm">
                    Nhân viên: <strong className="text-[#fa8c16]">{currentUser?.hoTen}</strong>
                </Text>
             </div>
          </div>

          <Button
            type="primary"
            size="large"
            icon={<PlayCircleOutlined />}
            onClick={() => setIsStartModalVisible(true)}
            disabled={!!currentActiveShift}
            className={`h-11 px-6 rounded-xl border-none shadow-lg font-semibold transition-all transform hover:scale-105 ${
                currentActiveShift 
                ? "bg-gray-200 text-gray-400 shadow-none cursor-not-allowed" 
                : "bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 shadow-orange-200"
            }`}
          >
            {currentActiveShift ? "Đang Trong Ca" : "Bắt Đầu Ca Mới"}
          </Button>
        </div>

        {/* --- STATS & FILTER --- */}
        <Row gutter={[16, 16]} align="middle">
            <Col xs={24} md={16}>
                <div className="bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm inline-block">
                    <Segmented
                        options={[
                            { label: `Đang hoạt động (${activeCount})`, value: 'active', icon: <SyncOutlined spin className={activeTab === 'active' ? "text-orange-500" : ""} /> },
                            { label: `Đã hoàn thành (${completedCount})`, value: 'completed', icon: <CheckCircleOutlined className={activeTab === 'completed' ? "text-green-500" : ""} /> },
                            { label: `Tất cả (${totalCount})`, value: 'all', icon: <AppstoreOutlined /> },
                        ]}
                        value={activeTab}
                        onChange={setActiveTab}
                        size="large"
                        className="font-medium text-gray-600"
                    />
                </div>
            </Col>
            
            <Col xs={24} md={8} className="flex justify-end">
                 {currentActiveShift && (
                     <Tag color="#fff7e6" className="border border-orange-200 px-3 py-1.5 rounded-xl text-orange-600 font-medium flex items-center gap-2">
                         <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
                         Ca hiện tại: {formatDateTime(currentActiveShift.thoiGianBatDau)}
                     </Tag>
                 )}
            </Col>
        </Row>

        {/* --- TABLE --- */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <Table
                columns={columns}
                dataSource={filteredData}
                rowKey="id"
                loading={loading}
                pagination={{
                    pageSize: 5,
                    showSizeChanger: true,
                    position: ["bottomCenter"],
                    className: "py-6",
                    showTotal: (total) => <span className="text-gray-400 text-xs">Tổng {total} bản ghi</span>
                }}
                components={{
                    header: {
                        cell: (props) => (
                        <th {...props} className="bg-white border-b border-gray-100 py-4" style={{ backgroundColor: "white", padding: "16px 16px" }} />
                        ),
                    },
                }}
                rowClassName={(record, index) =>
                    `hover:bg-orange-50/30 transition-colors cursor-pointer group ${index % 2 === 0 ? "bg-white" : "bg-slate-50/30"}`
                }
                locale={{ emptyText: "Không có dữ liệu ca làm việc phù hợp" }}
            />
        </div>
      </div>

      {/* --- MODAL BẮT ĐẦU CA --- */}
      <Modal
        title={<div className="flex items-center gap-2 text-lg font-bold text-gray-800 pb-3 border-b border-gray-100"><PlayCircleOutlined className="text-[#fa8c16]"/> Bắt Đầu Ca</div>}
        open={isStartModalVisible}
        onCancel={() => setIsStartModalVisible(false)}
        footer={null}
        centered
        width={420}
        className="rounded-2xl"
      >
        <div className="pt-5 space-y-5">
            <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 flex gap-3">
                <WalletOutlined className="text-[#fa8c16] text-xl" />
                <div>
                    <div className="text-xs font-bold text-gray-700 uppercase">Thông tin bàn giao</div>
                    <div className="text-xs text-gray-600 mt-1">Số tiền đầu ca thường bằng số tiền thực tế trong két lúc nhận bàn giao.</div>
                </div>
            </div>
            
            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Tiền đầu ca (VNĐ) <span className="text-red-500">*</span></label>
                <InputNumber
                    className="w-full rounded-xl py-2 text-base shadow-sm border-gray-200 focus:border-orange-400 hover:border-orange-300"
                    size="large"
                    placeholder="0"
                    formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                    parser={(value) => value?.replace(/\$\s?|(,*)/g, "")}
                    prefix={<span className="text-gray-400 mr-1">₫</span>}
                    value={startForm.soTienBatDau}
                    onChange={(val) => setStartForm({ ...startForm, soTienBatDau: val })}
                />
            </div>
            
            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Ghi chú</label>
                <TextArea className="rounded-xl border-gray-200 focus:border-orange-400 hover:border-orange-300" rows={3} placeholder="Nhập ghi chú..." value={startForm.ghiChu} onChange={(e) => setStartForm({ ...startForm, ghiChu: e.target.value })} />
            </div>

            <div className="flex justify-end gap-3 pt-2">
                <Button size="large" className="rounded-xl border-none bg-gray-100 hover:bg-gray-200 text-gray-600 font-medium" onClick={() => setIsStartModalVisible(false)}>Hủy</Button>
                <Button 
                    type="primary" 
                    size="large" 
                    className="rounded-xl bg-[#fa8c16] hover:bg-orange-500 border-none font-bold shadow-md shadow-orange-200" 
                    onClick={handleStartShift} 
                    loading={submitLoading}
                >
                    Xác Nhận
                </Button>
            </div>
        </div>
      </Modal>

      {/* --- MODAL KẾT THÚC CA --- */}
      <Modal
        title={<div className="flex items-center gap-2 text-lg font-bold text-gray-800 pb-3 border-b border-gray-100"><StopOutlined className="text-red-500"/> Kết Thúc Ca</div>}
        open={isEndModalVisible}
        onCancel={() => setIsEndModalVisible(false)}
        footer={null}
        centered
        width={420}
        className="rounded-2xl"
      >
        <div className="pt-5 space-y-5">
            {selectedGiaoCa && (
                 <div className="grid grid-cols-2 gap-px bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
                    <div className="bg-white p-3">
                        <div className="text-[10px] text-gray-400 uppercase font-bold">Bắt đầu</div>
                        <div className="text-sm font-semibold text-gray-800 mt-1">{formatDateTime(selectedGiaoCa.thoiGianBatDau).split(" - ")[0]}</div>
                    </div>
                    <div className="bg-white p-3">
                        <div className="text-[10px] text-gray-400 uppercase font-bold text-right">Tiền đầu ca</div>
                        <div className="text-sm font-bold text-[#fa8c16] text-right mt-1">{formatMoney(selectedGiaoCa.soTienBatDau)}</div>
                    </div>
                 </div>
            )}

            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Ghi chú kết thúc</label>
                <TextArea className="rounded-xl border-red-200 focus:border-red-400 hover:border-red-300" rows={4} placeholder="Nhập lý do chênh lệch tiền..." value={endForm.ghiChu} onChange={(e) => setEndForm({ ...endForm, ghiChu: e.target.value })} />
            </div>

            <div className="text-xs text-[#fa8c16] bg-[#fff7e6] p-3 rounded-xl flex gap-2 border border-orange-100">
                <RiseOutlined className="mt-0.5"/>
                <span>Hệ thống tự động tính doanh thu & tiền mặt cuối ca.</span>
            </div>

            <div className="flex justify-end gap-3 pt-2">
                <Button size="large" className="rounded-xl border-none bg-gray-100 hover:bg-gray-200 text-gray-600 font-medium" onClick={() => setIsEndModalVisible(false)}>Hủy</Button>
                <Button type="primary" danger size="large" className="rounded-xl font-bold shadow-md shadow-red-200 border-none" onClick={handleEndShift} loading={submitLoading}>Kết Thúc Ngay</Button>
            </div>
        </div>
      </Modal>
    </div>
  );
}