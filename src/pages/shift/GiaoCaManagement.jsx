import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Tag,
  Modal,
  Input,
  InputNumber,
  Tooltip,
  Dropdown,
  Menu,
  Segmented,
  Space,
  DatePicker,
  Select,
  message,
  Calendar,
  Badge,
} from "antd";
import {
  ClockCircleOutlined,
  PlayCircleOutlined,
  StopOutlined,
  DeleteOutlined,
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
  CloseCircleFilled,
  SearchOutlined,
  ReloadOutlined,
  FileExcelOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import "dayjs/locale/vi";

dayjs.locale("vi");

const { TextArea } = Input;
const { Option } = Select;

// Màu chủ đạo (đồng bộ với trang hóa đơn)
const PRIMARY_COLOR = "#ff8c42";
const PRIMARY_DARK = "#E67E22";

// --- CẤU HÌNH API ---
const API_BASE = "http://localhost:8080/api";

// --- FORMAT HELPER ---
const formatMoney = (value) => {
  if (value === null || value === undefined) return "—";
  if (value === 0) return "0 ₫";
  const formatted = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(Number(value));
  return formatted.replace("₫", "").trim() + " ₫";
};

const formatDateTime = (dateString) => {
  if (!dateString) return "—";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return String(dateString);
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

// --- CONFIG TRẠNG THÁI (Đồng nhất màu Cam/Xanh Lá) ---
const getStatusConfig = (isCompleted) => {
  if (!isCompleted) {
    return {
      label: "Đang hoạt động",
      color: PRIMARY_COLOR,
      bg: "#fff7e6", // Cam rất nhạt
      icon: <SyncOutlined spin style={{ color: PRIMARY_COLOR }} />,
      tagColor: PRIMARY_COLOR,
    };
  }
  return {
    label: "Đã hoàn thành",
    color: "#52c41a", // Xanh lá
    bg: "#f6ffed", // Xanh nhạt
    icon: <CheckCircleOutlined style={{ color: "#52c41a" }} />,
    tagColor: "green",
  };
};

export default function GiaoCaManagement() {
  // 💡 SỬA LỖI CONFIRM MODAL: Dùng hook useModal và Context Holder
  const [modal, contextHolder] = Modal.useModal();

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
  const [startForm, setStartForm] = useState({
    soTienBatDau: null,
    ghiChu: "",
  });
  const [endForm, setEndForm] = useState({ ghiChu: "" });

  const [currentUser, setCurrentUser] = useState(null);

  // --- STATE THÔNG BÁO (NOTIFICATION TÙY CHỈNH) ---
  const [notification, setNotification] = useState({
    type: "",
    message: "",
  });

  // --- STATE FILTER ---
  const [filterForm, setFilterForm] = useState({
    search: "",
    trangThai: null,
    ngayTao: null,
  });

  const showNotification = (type, message) => {
    setNotification({ type, message });
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

  // --- API FUNCTIONS (Giữ nguyên) ---
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
            .sort(
              (a, b) => new Date(b.thoiGianBatDau) - new Date(a.thoiGianBatDau)
            );
          setGiaoCaList(sortedList);
        } else {
          setGiaoCaList([]);
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        showNotification(
          "error",
          errorData.error || "Không tải được danh sách giao ca"
        );
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
        setStartForm({ soTienBatDau: null, ghiChu: "" });
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
        ghiChu: endForm.ghiChu || "",
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
    modal.confirm({
      title: "Xác nhận xóa giao ca",
      icon: <ExclamationCircleOutlined style={{ color: "#ff4d4f" }} />,
      content:
        "Bạn có chắc chắn muốn xóa giao ca này? Hành động này không thể hoàn tác.",
      okText: "Xóa",
      okType: "danger",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          const response = await fetch(`${API_BASE}/giao-ca/${id}`, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
            },
          });
          if (response.ok) {
            showNotification("success", "Xóa giao ca thành công");
            fetchGiaoCa();
          } else {
            const errorData = await response.json().catch(() => ({}));
            const errorMessage =
              errorData.error || errorData.message || "Xóa giao ca thất bại";
            showNotification("error", errorMessage);
          }
        } catch (error) {
          showNotification("error", "Lỗi kết nối hệ thống.");
        }
      },
    });
  };

  // --- LỌC DỮ LIỆU ---
  const getFilteredData = () => {
    let data = giaoCaList;

    if (activeTab === "active") {
      data = data.filter((gc) => !gc.thoiGianKetThuc);
    } else if (activeTab === "completed") {
      data = data.filter((gc) => !!gc.thoiGianKetThuc);
    }

    // Áp dụng bộ lọc từ Form
    if (filterForm.search) {
      const searchLower = filterForm.search.toLowerCase();
      data = data.filter(
        (gc) =>
          gc.hoTenNhanVien.toLowerCase().includes(searchLower) ||
          String(gc.id).includes(filterForm.search) ||
          (gc.ghiChu && gc.ghiChu.toLowerCase().includes(searchLower))
      );
    }

    // ... Thêm logic lọc TrangThai, NgayTao từ filterForm nếu cần

    return data;
  };

  const filteredData = getFilteredData();
  const activeCount = giaoCaList.filter((gc) => !gc.thoiGianKetThuc).length;
  const completedCount = giaoCaList.filter((gc) => !!gc.thoiGianKetThuc).length;
  const totalCount = giaoCaList.length;
  const currentActiveShift = giaoCaList.find((gc) => !gc.thoiGianKetThuc);

  // Xử lý nút Kết thúc ca trên header
  const handleHeaderEndShift = () => {
    if (currentActiveShift) {
      setSelectedGiaoCa(currentActiveShift);
      setIsEndModalVisible(true);
      setEndForm({ ghiChu: "" });
    }
  };

  const handleFilterSearch = () => {
    // Sau khi cập nhật filterForm, gọi lại fetchGiaoCa hoặc chỉ cần gọi getFilteredData nếu lọc là client-side
    // Giả sử gọi lại API để làm việc với filterForm
    fetchGiaoCa();
  };

  // --- CẤU HÌNH CỘT BẢNG (Đồng nhất với Hóa Đơn) ---
  const columns = [
    {
      title: (
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
          STT
        </span>
      ),
      key: "stt",
      width: 50,
      align: "center",
      render: (text, record, index) => (
        <span className="text-gray-700">{index + 1}</span>
      ),
    },
    {
      title: (
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
          Mã Giao Ca
        </span>
      ),
      dataIndex: "id",
      key: "id",
      width: 150,
      render: (text) => (
        <span className="font-semibold text-blue-600 text-sm">
          GC{String(text).padStart(5, "0")}
        </span>
      ),
    },
    {
      title: (
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
          Nhân Viên
        </span>
      ),
      key: "nhanVien",
      width: 200,
      render: (_, record) => (
        <div className="flex items-center gap-2 text-sm text-gray-800">
          <UserOutlined className="text-gray-400 text-xs" />
          <span className="font-medium">{record.hoTenNhanVien}</span>
        </div>
      ),
    },
    {
      title: (
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
          Trạng Thái
        </span>
      ),
      key: "status",
      align: "center",
      width: 150,
      render: (_, record) => {
        const isCompleted = !!record.thoiGianKetThuc;
        const config = getStatusConfig(isCompleted);
        return (
          <Tag
            color={config.tagColor}
            className="rounded-lg px-2.5 py-1 text-xs font-semibold"
            style={{ backgroundColor: isCompleted ? config.bg : "#fff7e6" }}
          >
            {config.label}
          </Tag>
        );
      },
    },
    {
      title: (
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
          Tiền Đầu Ca
        </span>
      ),
      dataIndex: "soTienBatDau",
      key: "soTienBatDau",
      align: "right",
      width: 140,
      render: (val) => (
        <span className="text-gray-600 font-medium">{formatMoney(val)}</span>
      ),
    },
    {
      title: (
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
          Tổng Doanh Thu
        </span>
      ),
      dataIndex: "tongDoanhThu",
      key: "tongDoanhThu",
      align: "right",
      width: 160,
      render: (val, record) => {
        if (!record.thoiGianKetThuc)
          return <span className="text-gray-300 text-xs italic">--</span>;
        // Màu chữ Cam
        return (
          <span className={`font-semibold`} style={{ color: PRIMARY_COLOR }}>
            {formatMoney(val)}
          </span>
        );
      },
    },
    {
      title: (
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
          Ngày Bắt Đầu
        </span>
      ),
      dataIndex: "thoiGianBatDau",
      key: "thoiGianBatDau",
      width: 140,
      render: (text) => (
        <span className="text-gray-700">{formatDateTime(text)}</span>
      ),
    },
    {
      title: (
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
          Hành Động
        </span>
      ),
      key: "action",
      align: "center",
      width: 100,
      render: (_, record) => (
        <Space size="small">
          {!record.thoiGianKetThuc && (
            <Tooltip title="Kết thúc ca">
              <Button
                icon={<StopOutlined />}
                onClick={handleHeaderEndShift}
                size="small"
                type="primary"
                danger
                className="rounded-lg shadow-sm"
              />
            </Tooltip>
          )}
          <Tooltip title="Xem chi tiết/Ghi chú">
            <Button
              icon={<InfoCircleOutlined />}
              onClick={() => {
                modal.info({
                  // Sử dụng modal.info để hiển thị chi tiết
                  title: "Chi tiết Giao ca",
                  content: (
                    <div className="space-y-3 pt-2">
                      <p>
                        <span className="font-semibold">Mã ca:</span> GC
                        {String(record.id).padStart(5, "0")}
                      </p>
                      <p>
                        <span className="font-semibold">Bắt đầu:</span>{" "}
                        {formatDateTime(record.thoiGianBatDau)}
                      </p>
                      <p>
                        <span className="font-semibold">Kết thúc:</span>{" "}
                        {record.thoiGianKetThuc
                          ? formatDateTime(record.thoiGianKetThuc)
                          : "Đang hoạt động"}
                      </p>
                      <p>
                        <span className="font-semibold">Tiền đầu:</span>{" "}
                        {formatMoney(record.soTienBatDau)}
                      </p>
                      <p>
                        <span className="font-semibold">Doanh thu:</span>{" "}
                        {record.tongDoanhThu
                          ? formatMoney(record.tongDoanhThu)
                          : "---"}
                      </p>
                      {record.ghiChu && (
                        <p>
                          <span className="font-semibold">Ghi chú:</span>{" "}
                          {record.ghiChu}
                        </p>
                      )}
                    </div>
                  ),
                  okText: "Đóng",
                  centered: true,
                  width: 400,
                });
              }}
              size="small"
              className="rounded-lg shadow-sm"
            />
          </Tooltip>
          <Tooltip title="Xóa">
            <Button
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record.id)}
              size="small"
              type="primary"
              danger
              className="rounded-lg shadow-sm"
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  // --- RENDER ---
  return (
    <div className="min-h-screen bg-[#f5f5f5] p-6 font-sans antialiased">
      {/* 💡 CONTEXT HOLDER: Đảm bảo modal hoạt động */}
      {contextHolder}

      {/* --- CUSTOM NOTIFICATION TOAST --- */}
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

      <div className="mx-auto space-y-6">
        {/* TIÊU ĐỀ TRANG (Đồng bộ với Quản lý hóa đơn) */}
        <div className="bg-white flex flex-col gap-3 px-5 py-5 rounded-lg shadow-sm border border-gray-200">
          <div className="font-bold text-4xl text-[#E67E22]">
            Quản lý giao ca
          </div>
          <div className="text-sm text-gray-500">
            <span className="cursor-pointer hover:text-gray-700">
              Trang chủ
            </span>{" "}
            / Quản lý giao ca
          </div>
        </div>

        {/* --- BỘ LỌC (Màu cam) --- */}
        <div className="bg-white p-0 rounded-lg shadow-sm border border-gray-200">
          <div className="bg-[#E67E22] text-white px-6 py-3 rounded-t-lg font-semibold text-lg">
            Bộ lọc giao ca
          </div>
          <div className="p-5 space-y-4">
            <div className="filter-fields">
              <div className="filter-field">
                <label className="font-medium text-gray-600 text-sm">
                  Từ khóa tìm kiếm
                </label>
                <Input
                  placeholder="Nhập mã ca, tên nhân viên hoặc ghi chú..."
                  value={filterForm.search}
                  onChange={(e) =>
                    setFilterForm({ ...filterForm, search: e.target.value })
                  }
                  size="large"
                  className="rounded-lg border-gray-300"
                />
              </div>
              <div className="filter-field">
                <label className="font-medium text-gray-600 text-sm">
                  Ngày tạo
                </label>
                <DatePicker
                  placeholder="Chọn ngày tạo"
                  size="large"
                  className="w-full rounded-lg border-gray-300"
                  onChange={(date) =>
                    setFilterForm({ ...filterForm, ngayTao: date })
                  }
                />
              </div>
              <div className="filter-field">
                <label className="font-medium text-gray-600 text-sm">
                  Trạng thái
                </label>
                <Select
                  placeholder="Chọn trạng thái"
                  size="large"
                  className="w-full rounded-lg"
                  onChange={(val) =>
                    setFilterForm({ ...filterForm, trangThai: val })
                  }
                  allowClear
                >
                  <Option value={true}>Đã hoàn thành</Option>
                  <Option value={false}>Đang hoạt động</Option>
                </Select>
              </div>
              <div className="filter-field filter-field-actions">
                <Button
                  size="large"
                  icon={<ReloadOutlined />}
                  onClick={() =>
                    setFilterForm({
                      search: "",
                      trangThai: null,
                      ngayTao: null,
                    })
                  }
                  className="rounded-lg !bg-white !border-white !text-[#ff8c42] font-medium hover:!bg-amber-800 hover:!text-white transition-all duration-200"
                >
                  Nhập lại
                </Button>
                <Button
                  type="primary"
                  size="large"
                  icon={<SearchOutlined />}
                  onClick={handleFilterSearch}
                  className="rounded-lg font-medium !bg-[#ff8c42] !border-[#ff8c42] hover:!bg-amber-800 hover:!text-white transition-all duration-200"
                >
                  Tìm kiếm
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* --- TABLE HEADER VÀ NÚT ACTION LỚN --- */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-[#ff8c42] px-4 py-3 flex justify-between items-center text-white">
            <h3 className="text-lg font-semibold m-0">
              Danh sách giao ca ({filteredData.length} bản ghi)
            </h3>
            <Space>
              <Button
                icon={<FileExcelOutlined />}
                onClick={() => {}} // Thêm logic export
                className="rounded-lg font-medium !bg-white !border-white !text-[#ff8c42] hover:!bg-amber-800 hover:!text-white transition-all duration-200"
              >
                Xuất Excel
              </Button>
              <Button
                icon={<PlayCircleOutlined />}
                onClick={() => setIsStartModalVisible(true)}
                disabled={!!currentActiveShift}
                className={`rounded-lg font-semibold shadow-md ${
                  currentActiveShift
                    ? "!bg-gray-200 !border-gray-200 !text-gray-500"
                    : "!bg-[#E67E22] !border-[#E67E22] !text-white hover:!bg-amber-700"
                }`}
              >
                {currentActiveShift ? "Đang trong ca" : "Bắt đầu ca mới"}
              </Button>
              {currentActiveShift && (
                <Button
                  icon={<StopOutlined />}
                  onClick={handleHeaderEndShift}
                  type="primary"
                  danger
                  className="rounded-lg font-semibold shadow-md shadow-red-200"
                >
                  Kết thúc ca
                </Button>
              )}
            </Space>
          </div>

          <div className="p-4">
            {/* Tab Segmented cho mobile/gọn gàng */}
            <div className="bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm inline-block mb-4">
              <Segmented
                options={[
                  {
                    label: `Đang hoạt động (${activeCount})`,
                    value: "active",
                    icon: (
                      <SyncOutlined
                        spin
                        className={
                          activeTab === "active"
                            ? "text-orange-500"
                            : "text-gray-400"
                        }
                      />
                    ),
                  },
                  {
                    label: `Đã hoàn thành (${completedCount})`,
                    value: "completed",
                    icon: (
                      <CheckCircleOutlined
                        className={
                          activeTab === "completed"
                            ? "text-green-500"
                            : "text-gray-400"
                        }
                      />
                    ),
                  },
                  {
                    label: `Tất cả (${totalCount})`,
                    value: "all",
                    icon: (
                      <AppstoreOutlined
                        className={
                          activeTab === "all"
                            ? "text-blue-500"
                            : "text-gray-400"
                        }
                      />
                    ),
                  },
                ]}
                value={activeTab}
                onChange={setActiveTab}
                size="middle"
                className="font-medium text-gray-600"
                style={{ "--ant-color-primary": PRIMARY_COLOR }}
              />
            </div>

            <Table
              columns={columns}
              dataSource={filteredData}
              rowKey="id"
              loading={loading}
              pagination={{
                pageSize: 8,
                showSizeChanger: true,
                position: ["bottomCenter"],
                className: "py-6",
                showTotal: (total) => (
                  <span className="text-gray-400 text-xs">
                    Tổng {total} bản ghi
                  </span>
                ),
              }}
              rowClassName={(record, index) =>
                `hover:bg-orange-50/10 transition-colors cursor-pointer`
              }
              locale={{ emptyText: "Không có dữ liệu ca làm việc phù hợp" }}
            />
          </div>
        </div>
      </div>

      {/* --- MODAL BẮT ĐẦU CA --- */}
      <Modal
        title={
          <div className="flex items-center gap-2 text-xl font-bold text-gray-800 pb-3 border-b border-gray-100">
            <PlayCircleOutlined style={{ color: PRIMARY_COLOR }} /> Bắt Đầu Ca
          </div>
        }
        open={isStartModalVisible}
        onCancel={() => setIsStartModalVisible(false)}
        footer={null}
        centered
        width={420}
        className="rounded-2xl"
      >
        <div className="pt-5 space-y-5">
          <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 flex gap-3">
            <WalletOutlined
              style={{ color: PRIMARY_COLOR }}
              className="text-xl"
            />
            <div>
              <div className="text-xs font-bold text-gray-700 uppercase">
                Thông tin bàn giao
              </div>
              <div className="text-xs text-gray-600 mt-1">
                Số tiền đầu ca thường bằng số tiền thực tế trong két lúc nhận
                bàn giao.
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
              Tiền đầu ca (VNĐ) <span className="text-red-500">*</span>
            </label>
            <InputNumber
              // ✅ SỬA WIDTH Ở ĐÂY
              className="w-full rounded-xl py-2 text-base shadow-sm border-gray-200 focus:border-orange-400 hover:border-orange-300"
              style={{ width: "100%" }} // Đảm bảo width 100%
              size="large"
              placeholder="0"
              formatter={(value) =>
                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
              parser={(value) => value?.replace(/\$\s?|(,*)/g, "")}
              prefix={<span className="text-gray-400 mr-1">₫</span>}
              value={startForm.soTienBatDau}
              onChange={(val) =>
                setStartForm({ ...startForm, soTienBatDau: val })
              }
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
              Ghi chú
            </label>
            <TextArea
              className="rounded-xl border-gray-200 focus:border-orange-400 hover:border-orange-300"
              rows={3}
              placeholder="Nhập ghi chú..."
              value={startForm.ghiChu}
              onChange={(e) =>
                setStartForm({ ...startForm, ghiChu: e.target.value })
              }
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              size="large"
              className="rounded-xl border-none bg-gray-100 hover:bg-gray-200 text-gray-600 font-medium"
              onClick={() => setIsStartModalVisible(false)}
            >
              Hủy
            </Button>
            <Button
              type="primary"
              size="large"
              className="rounded-xl font-bold shadow-md shadow-orange-200"
              onClick={handleStartShift}
              loading={submitLoading}
              style={{
                backgroundColor: PRIMARY_COLOR,
                borderColor: PRIMARY_COLOR,
              }}
            >
              Xác Nhận
            </Button>
          </div>
        </div>
      </Modal>

      {/* --- MODAL KẾT THÚC CA --- */}
      <Modal
        title={
          <div className="flex items-center gap-2 text-xl font-bold text-gray-800 pb-3 border-b border-gray-100">
            <StopOutlined className="text-red-500" /> Kết Thúc Ca
          </div>
        }
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
                <div className="text-[10px] text-gray-400 uppercase font-bold">
                  Bắt đầu
                </div>
                <div className="text-sm font-semibold text-gray-800 mt-1">
                  {
                    formatDateTime(selectedGiaoCa.thoiGianBatDau).split(
                      " - "
                    )[0]
                  }
                </div>
              </div>
              <div className="bg-white p-3">
                <div className="text-[10px] text-gray-400 uppercase font-bold text-right">
                  Tiền đầu ca
                </div>
                <div
                  className="text-sm font-bold text-right mt-1"
                  style={{ color: PRIMARY_COLOR }}
                >
                  {formatMoney(selectedGiaoCa.soTienBatDau)}
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
              Ghi chú kết thúc
            </label>
            <TextArea
              className="rounded-xl border-red-200 focus:border-red-400 hover:border-red-300"
              rows={4}
              placeholder="Nhập lý do chênh lệch tiền..."
              value={endForm.ghiChu}
              onChange={(e) =>
                setEndForm({ ...endForm, ghiChu: e.target.value })
              }
            />
          </div>

          <div
            className="text-xs bg-[#fff7e6] p-3 rounded-xl flex gap-2 border border-orange-100"
            style={{ color: PRIMARY_COLOR }}
          >
            <RiseOutlined className="mt-0.5" />
            <span>Hệ thống tự động tính doanh thu & tiền mặt cuối ca.</span>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              size="large"
              className="rounded-xl border-none bg-gray-100 hover:bg-gray-200 text-gray-600 font-medium"
              onClick={() => setIsEndModalVisible(false)}
            >
              Hủy
            </Button>
            <Button
              type="primary"
              danger
              size="large"
              className="rounded-xl font-bold shadow-md shadow-red-200 border-none"
              onClick={handleEndShift}
              loading={submitLoading}
            >
              Kết Thúc Ngay
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
