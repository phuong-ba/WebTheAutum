import React, { useState } from "react";
import { Table, Tag, Button, Space, Dropdown, Menu, Modal } from "antd";
import { EyeOutlined, CheckCircleOutlined } from "@ant-design/icons";
import { toast } from "react-toastify";

// ==================== UTILITY FUNCTIONS ====================
const formatMoney = (value) => {
  if (!value && value !== 0) return "0 ₫";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);
};

const formatDate = (dateString) => {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("vi-VN");
};

const getStatusConfig = (status) => {
  const configs = {
    0: { label: "Chờ xác nhận", color: "#FAAD14" },
    1: { label: "Đã xác nhận", color: "#1890FF" },
    2: { label: "Đang vận chuyển", color: "#13C2C2" },
    3: { label: "Đã thanh toán", color: "#52C41A" },
    4: { label: "Đã hủy", color: "#FF4D4F" },
  };
  return configs[status] || { label: "Không xác định", color: "#999" };
};

export default function BillTable({
  invoices,
  loading,
  currentPage,
  pageSize,
  totalItems,
  selectedRowKeys,
  setSelectedRowKeys,
  onTableChange,
  onStatusChange,
  onServiceChange,
  onViewDetail,
  onXacNhanDonHang,
  onUpdateWithStaff,  // ✅ Thêm prop mới để cập nhật kèm nhân viên
}) {
  const [confirmLoading, setConfirmLoading] = useState(false);

  // ========== DROPDOWN MENU HÀM ==========

  // ✅ Menu trạng thái - CẬP NHẬT ĐỂ THAY ĐỔI NHÂN VIÊN
  const getStatusMenu = (record) => (
    <Menu
      onClick={({ key }) => {
        const newStatus = parseInt(key);
        
        // ✅ Gọi hàm cập nhật kèm nhân viên
        onUpdateWithStaff(record.id, newStatus);
        
        toast.success("Cập nhật trạng thái và nhân viên thành công!");
      }}
    >
      <Menu.Item key="0">Chờ xác nhận</Menu.Item>
      <Menu.Item key="1">Đã xác nhận</Menu.Item>
      <Menu.Item key="2">Đang vận chuyển</Menu.Item>
      <Menu.Item key="3">Đã thanh toán</Menu.Item>
      <Menu.Item key="4">Đã hủy</Menu.Item>
    </Menu>
  );

  // Menu loại hóa đơn
  const getServiceMenu = (record) => (
    <Menu
      onClick={({ key }) => {
        onServiceChange(record.id, key === "true");
        toast.success("Cập nhật loại hóa đơn thành công!");
      }}
    >
      <Menu.Item key="true">Tại quầy</Menu.Item>
      <Menu.Item key="false">Online</Menu.Item>
    </Menu>
  );

  // HÀM XÁC NHẬN ĐƠN HÀNG (giữ nguyên cho trường hợp muốn dùng nút riêng)
  const handleXacNhan = (record) => {
    Modal.confirm({
      title: 'Xác nhận đơn hàng',
      content: (
        <div>
          <p>Bạn có chắc muốn xác nhận đơn hàng <strong>{record.maHoaDon}</strong>?</p>
          <p className="text-gray-500 text-sm mt-2">
            Sau khi xác nhận, nhân viên sẽ được cập nhật và trạng thái đơn hàng sẽ chuyển sang "Đã xác nhận"
          </p>
        </div>
      ),
      okText: 'Xác nhận',
      cancelText: 'Hủy',
      okButtonProps: {
        style: { backgroundColor: '#52c41a', borderColor: '#52c41a' }
      },
      onOk: async () => {
        setConfirmLoading(true);
        try {
          await onXacNhanDonHang(record.id);
          toast.success('Xác nhận đơn hàng thành công!');
        } catch (error) {
          toast.error('Xác nhận thất bại: ' + error.message);
        } finally {
          setConfirmLoading(false);
        }
      },
    });
  };

  // ========== CẤU HÌNH CỘT BẢNG ==========
  const columns = [
    {
      title: "STT",
      key: "stt",
      align: "center",
      width: 60,
      render: (_, __, index) => (currentPage - 1) * pageSize + index + 1,
    },
    {
      title: "MÃ HÓA ĐƠN",
      dataIndex: "maHoaDon",
      key: "maHoaDon",
      align: "center",
      width: 120,
      render: (text, record) => text || record.id,
    },
    {
      title: "TÊN KHÁCH HÀNG",
      key: "tenKhachHang",
      align: "left",
      render: (_, record) => record.khachHang?.hoTen || "—",
    },
    {
      title: "NHÂN VIÊN",
      key: "tenNhanVien",
      align: "left",
      render: (_, record) => record.nhanVien?.hoTen || "—",
    },
    {
      title: "TRẠNG THÁI",
      key: "trangThai",
      align: "center",
      width: 160,
      render: (_, record) => {
        const config = getStatusConfig(record.trangThai);
        return (
          <Dropdown overlay={getStatusMenu(record)} trigger={["click"]}>
            <Tag
              color={config.color}
              style={{
                cursor: "pointer",
                border: `1px solid ${config.color}`,
                backgroundColor: `${config.color}15`,
              }}
            >
              <span style={{ color: config.color }}>{config.label}</span>
            </Tag>
          </Dropdown>
        );
      },
    },
    {
      title: "Dịch Vụ",
      key: "loaiHoaDon",
      align: "center",
      width: 120,
      render: (_, record) => {
        const serviceText = record.loaiHoaDon ? "Tại quầy" : "Online";
        return (
          <Dropdown overlay={getServiceMenu(record)} trigger={["click"]}>
            <Tag
              style={{
                cursor: "pointer",
                border: "1px solid #ccc",
                backgroundColor: "#f9f9f9",
              }}
            >
              {serviceText}
            </Tag>
          </Dropdown>
        );
      },
    },
    {
      title: "HÌNH THỨC TT",
      dataIndex: "hinhThucThanhToan",
      key: "hinhThucThanhToan",
      align: "center",
      render: (text) => text || "—",
    },
    {
      title: "NGÀY TẠO",
      dataIndex: "ngayTao",
      key: "ngayTao",
      align: "center",
      render: (date) => formatDate(date),
    },
    {
      title: "TỔNG TIỀN",
      key: "tongTien",
      align: "right",
      render: (_, record) => {
        const tongTienSauGiam = record.tongTienSauGiam ?? record.tongTien;
        const phiShip = record.loaiHoaDon ? 0 : record.phiVanChuyen || 0;
        const tongCong = tongTienSauGiam + phiShip;
        return (
          <span style={{ color: "#FF6B35", fontWeight: 600 }}>
            {formatMoney(tongCong)}
          </span>
        );
      },
    },
    {
      title: "HÀNH ĐỘNG",
      key: "action",
      align: "center",
      width: 150,
      render: (_, record) => (
        <Space size="small">
          {/* NÚT XÁC NHẬN - Tùy chọn, có thể xóa nếu chỉ dùng dropdown */}
          {record.trangThai === 0 && (
            <Button
              type="primary"
              size="small"
              icon={<CheckCircleOutlined />}
              loading={confirmLoading}
              onClick={() => handleXacNhan(record)}
              style={{ 
                backgroundColor: '#52c41a', 
                borderColor: '#52c41a',
                fontSize: '12px'
              }}
            >
              Xác nhận
            </Button>
          )}

          {/* Nút xem chi tiết */}
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => onViewDetail(record.id)}
            title="Xem chi tiết"
          />
        </Space>
      ),
    },
  ];

  // ========== TABLE ==========
  const rowSelection = {
    selectedRowKeys,
    onChange: (keys) => setSelectedRowKeys(keys),
  };

  return (
    <Table
      rowSelection={rowSelection}
      columns={columns}
      dataSource={invoices}
      rowKey="id"
      bordered
      loading={loading}
      pagination={{
        current: currentPage,
        pageSize: pageSize,
        total: totalItems,
        showSizeChanger: true,
        showTotal: (total) => `Tổng: ${total} hóa đơn`,
        pageSizeOptions: ["5", "10", "20", "50"],
      }}
      scroll={{ x: 1200 }}
      onChange={(pagination) => onTableChange(pagination)}
    />
  );
}