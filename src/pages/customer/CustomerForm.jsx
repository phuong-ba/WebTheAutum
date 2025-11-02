import React, { useEffect, useState } from "react";
import {
  Form,
  Input,
  Select,
  Row,
  Col,
  Button,
  Card,
  Divider,
  Table,
  Space,
  Radio,
  DatePicker,
  notification,
} from "antd";
import { flushSync } from "react-dom";
import dayjs from "dayjs";
import {
  PlusOutlined,
  EnvironmentOutlined,
  DeleteOutlined,
  StarOutlined,
  StarFilled,
  EditOutlined,
} from "@ant-design/icons";
import { khachHangApi } from "/src/api/khachHangApi";
import { diaChiApi } from "/src/api/diaChiApi";
import AddressSelect from "./AddressSelect";
import { debounce } from "lodash";
import CustomerBreadcrumb from "../customer/CustomerBreadcrumb";
export default function CustomerForm({ customer, onCancel, onSuccess }) {
  const [form] = Form.useForm();
  const [addresses, setAddresses] = useState([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 5 });

  const [quanList, setQuanList] = useState([]);

  const [api, contextHolder] = notification.useNotification();
  const openNotification = (type, title, description, duration = 2) => {
    api[type]({
      message: title,
      description,
      placement: "topRight",
      duration,
    });
  };

  // Load khi sửa khách hàng
  useEffect(() => {
    if (customer) {
      const updated = (customer.diaChi || []).map((a, idx) => ({
        key: a.id || Date.now() + idx,
        id: a.id,
        tenDiaChi: a.tenDiaChi,
        thanhPho: a.tinhThanhId,
        quan: a.quanHuyenId,
        tenTinh: a.tenTinh,
        tenQuan: a.tenQuan,
        diaChiCuThe: a.diaChiCuThe,
        trangThai: a.trangThai ?? idx === 0,
      }));
      setAddresses(updated);

      form.setFieldsValue({
        hoTen: customer.hoTen,
        sdt: customer.sdt,
        email: customer.email,
        gioiTinh: customer.gioiTinh ? "Nam" : "Nữ",
        ngaySinh: customer.ngaySinh ? dayjs(customer.ngaySinh) : null,
      });
    } else {
      form.resetFields();
      setAddresses([]);
    }
  }, [customer]);

  // Thêm hoặc cập nhật địa chỉ
  const handleAddOrUpdateAddress = async () => {
    try {
      const values = await form.validateFields([
        "tenDiaChi",
        "thanhPho",
        "quan",
        "diaChiCuThe",
      ]);

      const tinhList = await diaChiApi.getAllTinhThanh();
      const tinh = tinhList.find((t) => t.id === values.thanhPho);

      const quanRes = await diaChiApi.getQuanByTinh(values.thanhPho);
      const quan = quanRes.find((q) => q.id === values.quan);

      const tenTinh = tinh?.tenTinh || "";
      const tenQuan = quan?.tenQuan || "";

      if (editingAddress) {
        // Cập nhật
        setAddresses((prev) =>
          prev.map((a) =>
            a.key === editingAddress.key
              ? { ...a, ...values, tenTinh, tenQuan }
              : a
          )
        );
        openNotification(
          "success",
          "Cập nhật thành công",
          "Địa chỉ đã được cập nhật!"
        );
      } else {
        // Thêm mới
        const newAddr = {
          key: Date.now(),
          ...values,
          tenTinh,
          tenQuan,
          trangThai: addresses.length === 0, // Mặc định cho địa chỉ đầu tiên
        };
        setAddresses((prev) => [...prev, newAddr]);
        openNotification("success", "Thêm thành công", "Đã thêm địa chỉ mới!");
      }

      form.resetFields(["tenDiaChi", "tenTinh", "tenQuan", "diaChiCuThe"]);
      setShowAddressForm(false);
      setEditingAddress(null);
    } catch (error) {
      console.error(error);
      openNotification(
        "warning",
        "Thiếu thông tin",
        "Vui lòng nhập đầy đủ thông tin!"
      );
    }
  };

  const handleDeleteAddress = (key) => {
    setAddresses((prev) => {
      const deleted = prev.find((a) => a.key === key);
      const remaining = prev.filter((a) => a.key !== key);
      if (deleted?.trangThai && remaining.length > 0) {
        remaining[0].trangThai = true;
      }

      return remaining;
    });

    openNotification("success", "Đã xóa", "Địa chỉ đã được xóa!");
  };

  const handleSetDefault = (key) => {
    flushSync(() => {
      setAddresses((prev) =>
        prev.map((a) => ({ ...a, trangThai: a.key === key }))
      );
    });
    openNotification("success", "Đặt mặc định", "Địa chỉ này là mặc định!");
  };

  const handleEditAddress = (record) => {
    setShowAddressForm(true);
    setEditingAddress(record);
  };
  //--gọi check
  const debouncedCheck = debounce((field) => checkExists(field), 500);
  //--
  //--check email và sdt
  const checkExists = async (field) => {
    const email = field === "email" ? form.getFieldValue("email") : null;
    const sdt = field === "sdt" ? form.getFieldValue("sdt") : null;

    if (!email && !sdt) return;

    try {
      const exists = await khachHangApi.checkEmailAndSDt(email, sdt);

      if (field === "email") {
        form.setFields([
          { name: "email", errors: exists ? ["Email này đã tồn tại!"] : [] },
        ]);
      } else if (field === "sdt") {
        form.setFields([
          { name: "sdt", errors: exists ? ["SĐT này đã tồn tại!"] : [] },
        ]);
      }
    } catch (error) {
      console.error("Lỗi kiểm tra:", error);
    }
  };

  //---
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      // check email + sdt cùng lúc
      const exists = await khachHangApi.checkEmailAndSDt(
        values.email,
        values.sdt
      );

      const errors = [];
      if (exists.emailExists)
        errors.push({ name: "email", errors: ["Email này đã tồn tại!"] });
      if (exists.sdtExists)
        errors.push({ name: "sdt", errors: ["SĐT này đã tồn tại!"] });

      if (errors.length > 0) {
        form.setFields(errors);
        openNotification("error", "Thất bại", "Không thể lưu khách hàng!");
        return; // dừng submit
      }

      const payload = {
        ...customer,
        hoTen: values.hoTen,
        gioiTinh: values.gioiTinh === "Nam",
        sdt: values.sdt,
        ngaySinh: values.ngaySinh ? values.ngaySinh.format("YYYY-MM-DD") : null,
        email: values.email,
        diaChi: addresses.map((a) => ({
          ...(a.id ? { id: a.id } : {}),
          tenDiaChi: a.tenDiaChi,
          tinhThanhId: a.thanhPho,
          quanHuyenId: a.quan,
          diaChiCuThe: a.diaChiCuThe,
          trangThai: a.trangThai,
        })),
      };

      let res;
      if (customer?.id) {
        res = await khachHangApi.update(customer.id, payload);
        openNotification(
          "success",
          "Cập nhật thành công",
          "Thông tin khách hàng đã được lưu!"
        );
        setTimeout(() => {
          onSuccess(res);
        }, 1400);
      } else {
        res = await khachHangApi.create(payload);
        openNotification(
          "success",
          "Thêm thành công",
          "Khách hàng mới đã được thêm!"
        );
        setTimeout(() => {
          onSuccess(res);
        }, 1400);
      }

      // onSuccess(res);
    } catch (err) {
      console.error(err);
      openNotification("error", "Thất bại", "Không thể lưu khách hàng!");
    }
  };

  const columns = [
    { title: "Loại địa chỉ", dataIndex: "tenDiaChi" },
    {
      title: "Thành phố",
      dataIndex: "tenTinh",
      render: (_, record) => record.tenTinh || "",
    },
    {
      title: "Quận/Huyện",
      dataIndex: "tenQuan",
      render: (_, record) => record.tenQuan || "",
    },
    { title: "Địa chỉ cụ thể", dataIndex: "diaChiCuThe" },
    {
      title: "Mặc định",
      align: "center",
      render: (_, record) =>
        record.trangThai ? (
          <StarFilled style={{ color: "#faad14", fontSize: 18 }} />
        ) : (
          <StarOutlined
            style={{ color: "#999", fontSize: 18, cursor: "pointer" }}
            onClick={() => handleSetDefault(record.key)}
          />
        ),
    },
    {
      title: "Thao tác",
      align: "center",
      render: (_, record) => (
        <Space>
          <EditOutlined
            style={{ color: "#1890ff", cursor: "pointer" }}
            onClick={() => handleEditAddress(record)}
          />
          <DeleteOutlined
            style={{ color: "red", cursor: "pointer" }}
            onClick={() => handleDeleteAddress(record.key)}
          />
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6 bg-[#f9f9fb] min-h-screen">
      {contextHolder}

      {/* Header trên cùng */}
      <div className="bg-white rounded-md shadow-sm border border-gray-100 p-5 mb-6">
        <h2 className="text-2xl font-bold text-[#E67E22] mb-1">
          {customer ? "Cập nhật khách hàng" : "Thêm khách hàng mới"}
        </h2>
        <p className="text-sm text-gray-500">
          <CustomerBreadcrumb />
        </p>
      </div>

      {/* Form chính */}
      <div className="bg-white rounded-md shadow-sm border border-gray-100 p-8">
        <Form layout="vertical" form={form}>
          <Row gutter={[24, 8]}>
            <Col span={12}>
              <Form.Item
                name="hoTen"
                label={<span className="font-semibold">Tên khách hàng</span>}
                rules={[{ required: true, message: "Nhập tên khách hàng!" }]}
              >
                <Input placeholder="Nhập tên khách hàng" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="sdt"
                label={<span className="font-semibold">Số điện thoại</span>}
                rules={[
                  { required: true, message: "Nhập số điện thoại!" },
                  { pattern: /^[0-9]{9,11}$/, message: "SĐT không hợp lệ!" },
                ]}
              >
                <Input
                  placeholder="Nhập số điện thoại"
                  onChange={() => debouncedCheck("sdt")}
                />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="email"
                label={<span className="font-semibold">Email</span>}
                rules={[
                  { required: true, message: "Nhập email!" },
                  { type: "email", message: "Email không hợp lệ!" },
                ]}
              >
                <Input
                  placeholder="Nhập email"
                  onChange={() => debouncedCheck("email")}
                />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="gioiTinh"
                label={<span className="font-semibold">Giới tính</span>}
                rules={[{ required: true, message: "Chọn giới tính!" }]}
              >
                <Radio.Group>
                  <Radio value="Nam">Nam</Radio>
                  <Radio value="Nữ">Nữ</Radio>
                </Radio.Group>
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="ngaySinh"
                label={<span className="font-semibold">Ngày sinh</span>}
                rules={[{ required: true, message: "Chọn ngày sinh!" }]}
              >
                <DatePicker
                  format="DD/MM/YYYY"
                  style={{ width: "100%" }}
                  placeholder="Chọn ngày sinh"
                />
              </Form.Item>
            </Col>
          </Row>

          {/* Địa chỉ khách hàng */}
          <Divider className="my-6" />

          <Card
            title={
              <div className="flex items-center gap-2 text-[#E67E22] font-semibold">
                <EnvironmentOutlined />
                <span>Địa chỉ khách hàng ({addresses.length})</span>
              </div>
            }
            extra={
              !showAddressForm && (
                <Button
                  icon={<PlusOutlined />}
                  style={{
                    backgroundColor: "#E67E22",
                    color: "white",
                    border: "none",
                  }}
                  onClick={() => {
                    setShowAddressForm(true);
                    setEditingAddress(null);
                  }}
                >
                  Thêm địa chỉ
                </Button>
              )
            }
            bordered={false}
            className="shadow-sm rounded-md border border-gray-100"
          >
            {!showAddressForm ? (
              <Table
                dataSource={addresses}
                columns={columns}
                rowKey="key"
                pagination={pagination}
                onChange={(p) => setPagination(p)}
                locale={{ emptyText: "Chưa có địa chỉ nào" }}
              />
            ) : (
              <>
                <AddressSelect
                  form={form}
                  editingAddress={editingAddress}
                  setQuanList={setQuanList}
                />
                <div className="text-right mt-4">
                  <Button
                    onClick={() => {
                      form.resetFields([
                        "tenDiaChi",
                        "thanhPho",
                        "quan",
                        "diaChiCuThe",
                      ]);
                      setShowAddressForm(false);
                      setEditingAddress(null);
                    }}
                    style={{ marginRight: 8 }}
                  >
                    Hủy
                  </Button>
                  <Button
                    type="primary"
                    style={{
                      backgroundColor: "#E67E22",
                      border: "none",
                    }}
                    onClick={handleAddOrUpdateAddress}
                  >
                    {editingAddress ? "Cập nhật" : "Lưu địa chỉ"}
                  </Button>
                </div>
              </>
            )}
          </Card>

          <Divider className="my-6" />

          {/* Nút hành động */}
          <div className="text-right mt-4">
            <Button onClick={onCancel} style={{ marginRight: 8 }}>
              Hủy
            </Button>
            <Button
              type="primary"
              style={{
                backgroundColor: "#E67E22",
                border: "none",
              }}
              onClick={handleSubmit}
            >
              Lưu khách hàng
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
}
