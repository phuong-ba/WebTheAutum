import React, { useEffect, useState } from "react";
import { Table, Button, Space, Tag, message, Modal } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { khachHangApi } from "/src/api/khachHangApi";
import CustomerForm from "../customer/CustomerForm";

export default function Customer() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [editCustomer, setEditCustomer] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [mode, setMode] = useState("table");
  const pageSize = 6;

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await khachHangApi.getAll();
      setCustomers(Array.isArray(res) ? res : [res]);
    } catch {
      message.error("Không thể tải danh sách khách hàng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleAdd = () => {
    setEditCustomer(null);
    setMode("form");
  };

  const handleEdit = (record) => {
    setEditCustomer(record);
    setMode("form");
  };

  const showDeleteModal = (id) => {
    setDeleteId(id);
    setDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    const oldCustomers = [...customers];
    setCustomers(customers.filter((c) => c.id !== deleteId));
    setDeleteModalVisible(false);

    try {
      const res = await khachHangApi.delete(deleteId);
      console.log("API DELETE trả về:", JSON.stringify(res, null, 2));
      message.success("Đã xóa khách hàng thành công");
    } catch (err) {
      console.error(err);
      message.error("Xóa khách hàng thất bại");
      setCustomers(oldCustomers);
    } finally {
      setDeleteId(null);
    }
  };

  const columns = [
    {
      title: "STT",
      render: (_, __, index) => (currentPage - 1) * pageSize + index + 1,
    },
    { title: "Mã KH", dataIndex: "maKhachHang", key: "maKhachHang" },
    { title: "Họ tên", dataIndex: "hoTen", key: "hoTen" },
    { title: "Giới tính", render: (r) => (r.gioiTinh ? "Nam" : "Nữ") },
    { title: "SĐT", dataIndex: "sdt", key: "sdt" },
    { title: "Email", dataIndex: "email", key: "email" },
    {
      title: "Địa chỉ",
      render: (r) => {
        const addr = r.diaChi?.[0];
        return addr
          ? `${addr.tenDiaChi} (${addr.diaChiCuThe}, ${addr.quan}, ${addr.thanhPho})`
          : "Chưa có địa chỉ";
      },
    },
    {
      title: "Trạng thái",
      render: (r) => (
        <Tag color={r.trangThai ? "green" : "red"}>
          {r.trangThai ? "Hoạt động" : "Ngừng"}
        </Tag>
      ),
    },
    {
      title: "Hành động",
      key: "action",
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined style={{ color: "#1976d2" }} />}
            onClick={() => handleEdit(record)}
          />
          <Button
            type="text"
            icon={<DeleteOutlined style={{ color: "red" }} />}
            onClick={() => showDeleteModal(record.id)}
          />
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24, background: "#fff", borderRadius: 12 }}>
      <h2 style={{ marginBottom: 16, color: "#f57c00" }}>Quản lý khách hàng</h2>
      {mode === "table" && (
        <>
          <Button
            type=""
            icon={<PlusOutlined />}
            onClick={handleAdd}
            style={{ marginBottom: 16 }}
          >
            Thêm mới
          </Button>
          <Table
            columns={columns}
            dataSource={customers}
            rowKey="id"
            loading={loading}
            pagination={{
              current: currentPage,
              pageSize,
              onChange: setCurrentPage,
            }}
          />
        </>
      )}

      {mode === "form" && (
        <CustomerForm
          customer={editCustomer}
          onCancel={() => setMode("table")}
          onSuccess={() => {
            setMode("table");
            fetchCustomers();
          }}
        />
      )}

      <Modal
        visible={deleteModalVisible}
        onOk={confirmDelete}
        onCancel={() => setDeleteModalVisible(false)}
        okText="Xóa"
        cancelText="Hủy"
      >
        Bạn có chắc muốn xóa khách hàng này?
      </Modal>
    </div>
  );
}
