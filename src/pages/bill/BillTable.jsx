import React, { useState } from "react";
import { Table, Tag, Button, Space, Dropdown, Menu } from "antd";
import { EyeOutlined, DownOutlined } from "@ant-design/icons";
import { toast } from "react-toastify";

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
    1: { label: "Chờ giao hàng", color: "#FAAD14" },
    2: { label: "Đang giao hàng", color: "#FAAD14" },
    3: { label: "Đã hoàn thành", color: "#52C41A" },
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
}) {
  const getStatusMenu = (record) => (
    <Menu
      onClick={({ key }) => {
        onStatusChange(record.id, parseInt(key));
        toast.success("Cập nhật trạng thái thành công!");
      }}
    >
      <Menu.Item key="0"> Chờ xác nhận</Menu.Item>
      <Menu.Item key="1"> Chờ giao hàng</Menu.Item>
      <Menu.Item key="2"> Đang giao hàng</Menu.Item>
      <Menu.Item key="3"> Đã hoàn thành</Menu.Item>
      <Menu.Item key="4"> Đã hủy</Menu.Item>
    </Menu>
  );

  const getServiceMenu = (record) => (
    <Menu
      onClick={({ key }) => {
        onServiceChange(record.id, key === "true");
        toast.success("Cập nhật loại hóa đơn thành công!");
      }}
    >
      <Menu.Item key="true"> Tại quầy</Menu.Item>
      <Menu.Item key="false"> Online</Menu.Item>
    </Menu>
  );

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
      render: (_, record) => record.khachHang?.hoTen || "Khách lẻ", // SỬA Ở ĐÂY
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
              <span style={{ color: config.color }}>{config.label}</span>{" "}
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
      width: 100,
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => onViewDetail(record.id)}
          />
        </Space>
      ),
    },
  ];

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
