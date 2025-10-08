import React, { useEffect, useState } from "react";
import {
  Table,
  Button,
  Space,
  Tag,
  Form,
  Input,
  Select,
  Row,
  Col,
  message,
  Modal,
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { khachHangApi } from "/src/api/khachHangApi";

export default function CustomerPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [editId, setEditId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [mode, setMode] = useState("table");
  const [form] = Form.useForm();
  const pageSize = 6;

  // Lấy dữ liệu khách hàng
  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await khachHangApi.getAll();
      setCustomers(Array.isArray(res) ? res : [res]);
    } catch (err) {
      message.error("Không thể tải danh sách khách hàng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Thêm mới
  const handleAdd = () => {
    setEditId(null);
    form.resetFields();
    setMode("form");
  };

  // Sửa
  const handleEdit = (record) => {
    const diaChi = record.diaChi?.[0] || {};
    form.setFieldsValue({
      hoTen: record.hoTen,
      gioiTinh: record.gioiTinh ? "Nam" : "Nữ",
      sdt: record.sdt,
      email: record.email,
      tenTaiKhoan: record.tenTaiKhoan,
      trangThai: record.trangThai ? "Hoạt động" : "Ngừng",
      thanhPho: diaChi.thanhPho,
      quan: diaChi.quan,
      diaChiCuThe: diaChi.diaChiCuThe,
    });
    setEditId(record.id);
    setMode("form");
  };

  // Xóa
  const handleDelete = (id) => {
    setDeleteId(id);
  };

  // Lưu thêm/sửa
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        hoTen: values.hoTen,
        gioiTinh: values.gioiTinh === "Nam",
        sdt: values.sdt,
        email: values.email,
        tenTaiKhoan: values.tenTaiKhoan,
        matKhau: values.matKhau || undefined,
        trangThai: values.trangThai === "Hoạt động",
        diaChi: [
          {
            thanhPho: values.thanhPho,
            quan: values.quan,
            diaChiCuThe: values.diaChiCuThe,
          },
        ],
      };

      if (editId) {
        await khachHangApi.update(editId, payload);
        message.success("Cập nhật khách hàng thành công");
      } else {
        await khachHangApi.create(payload);
        message.success("Thêm khách hàng thành công");
      }

      form.resetFields();
      setMode("table");
      fetchCustomers();
    } catch (err) {
      message.error("Lưu khách hàng thất bại");
    }
  };

  // Cột bảng
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
        const d = r.diaChi?.[0];
        return d
          ? `${d.diaChiCuThe}, ${d.quan}, ${d.thanhPho}`
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
            onClick={() => handleDelete(record.id)}
          />
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24, background: "#fff", borderRadius: 12 }}>
      <h2 style={{ marginBottom: 16, color: "#f57c00" }}>Quản lý khách hàng</h2>

      {/* Bảng */}
      {mode === "table" && (
        <>
          <Button
            type="primary"
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
              onChange: (page) => setCurrentPage(page),
            }}
          />
        </>
      )}

      {/* Form nhập liệu */}
      {mode === "form" && (
        <div
          style={{ padding: 16, border: "1px solid #f0f0f0", borderRadius: 8 }}
        >
          <h3>{editId ? "Cập nhật khách hàng" : "Thêm khách hàng mới"}</h3>
          <Form layout="vertical" form={form}>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="hoTen"
                  label="Họ tên"
                  rules={[{ required: true, message: "Nhập họ tên" }]}
                >
                  <Input />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="gioiTinh"
                  label="Giới tính"
                  rules={[{ required: true, message: "Chọn giới tính" }]}
                >
                  <Select
                    options={[
                      { label: "Nam", value: "Nam" },
                      { label: "Nữ", value: "Nữ" },
                    ]}
                  />
                </Form.Item>
              </Col>

              <Col span={12}>
                <Form.Item
                  name="sdt"
                  label="Số điện thoại"
                  rules={[{ required: true, message: "Nhập số điện thoại" }]}
                >
                  <Input />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="email"
                  label="Email"
                  rules={[{ required: true, message: "Nhập email" }]}
                >
                  <Input />
                </Form.Item>
              </Col>

              <Col span={12}>
                <Form.Item
                  name="tenTaiKhoan"
                  label="Tên tài khoản"
                  rules={[{ required: true, message: "Nhập tên tài khoản" }]}
                >
                  <Input disabled={!!editId} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="matKhau"
                  label="Mật khẩu"
                  rules={[{ message: "Nhập mật khẩu" }]}
                >
                  <Input />
                </Form.Item>
              </Col>

              <Col span={12}>
                <Form.Item
                  name="thanhPho"
                  label="Thành phố"
                  rules={[{ required: true, message: "Nhập thành phố" }]}
                >
                  <Input />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="quan"
                  label="Quận/Huyện"
                  rules={[{ required: true, message: "Nhập quận/huyện" }]}
                >
                  <Input />
                </Form.Item>
              </Col>

              <Col span={24}>
                <Form.Item
                  name="diaChiCuThe"
                  label="Địa chỉ cụ thể"
                  rules={[{ required: true, message: "Nhập địa chỉ cụ thể" }]}
                >
                  <Input />
                </Form.Item>
              </Col>

              <Col span={12}>
                <Form.Item
                  name="trangThai"
                  label="Trạng thái"
                  rules={[{ required: true, message: "Chọn trạng thái" }]}
                >
                  <Select
                    options={[
                      { label: "Hoạt động", value: "Hoạt động" },
                      { label: "Ngừng", value: "Ngừng" },
                    ]}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Button
              type="primary"
              onClick={handleSubmit}
              style={{ marginTop: 8 }}
            >
              Lưu
            </Button>
            <Button
              onClick={() => {
                form.resetFields();
                setMode("table");
              }}
              style={{ marginLeft: 8, marginTop: 8 }}
            >
              Hủy
            </Button>
          </Form>
        </div>
      )}

      {/* Modal xác nhận xóa */}
      <Modal
        open={!!deleteId}
        title="Xác nhận xóa khách hàng"
        okText="Xóa"
        okType="danger"
        cancelText="Hủy"
        onCancel={() => setDeleteId(null)}
        onOk={async () => {
          try {
            await khachHangApi.delete(deleteId);
            message.success("Xóa khách hàng thành công");
            setDeleteId(null);
            fetchCustomers();
          } catch (err) {
            console.error("❌ Lỗi API:", err);
            message.error("Không thể xóa khách hàng");
          }
        }}
      >
        <p>Bạn có chắc chắn muốn xóa khách hàng này không?</p>
      </Modal>
    </div>
  );
}
