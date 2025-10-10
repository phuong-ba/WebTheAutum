import React, { useEffect, useState } from "react";
import { Form, Input, Select, Row, Col, Button, message } from "antd";
import { khachHangApi } from "/src/api/khachHangApi";

export default function CustomerForm({ customer, onCancel, onSuccess }) {
  const [form] = Form.useForm();
  const [selectedAddressId, setSelectedAddressId] = useState(null);

  useEffect(() => {
    if (customer) {
      form.setFieldsValue({
        hoTen: customer.hoTen,
        gioiTinh: customer.gioiTinh ? "Nam" : "Nữ",
        sdt: customer.sdt,
        email: customer.email,
        tenTaiKhoan: customer.tenTaiKhoan,
        matKhau: "",
        trangThai: customer.trangThai ? "Hoạt động" : "Ngừng",
        tenDiaChi: customer.diaChi?.[0]?.tenDiaChi || "",
        thanhPho: customer.diaChi?.[0]?.thanhPho || "",
        quan: customer.diaChi?.[0]?.quan || "",
        diaChiCuThe: customer.diaChi?.[0]?.diaChiCuThe || "",
      });
      setSelectedAddressId(customer.diaChi?.[0]?.id || null);
    } else {
      form.resetFields();
      setSelectedAddressId(null);
    }
  }, [customer, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const addressPayload = {
        ...(selectedAddressId ? { id: selectedAddressId } : {}),
        tenDiaChi: values.tenDiaChi,
        thanhPho: values.thanhPho,
        quan: values.quan,
        diaChiCuThe: values.diaChiCuThe,
      };
      const payload = {
        hoTen: values.hoTen,
        gioiTinh: values.gioiTinh === "Nam",
        sdt: values.sdt,
        email: values.email,
        tenTaiKhoan: values.tenTaiKhoan,
        matKhau: values.matKhau || undefined,
        trangThai: values.trangThai === "Hoạt động",
        diaChi: [addressPayload],
      };

      if (customer) {
        await khachHangApi.update(customer.id, payload);
        message.success("Cập nhật khách hàng thành công");
      } else {
        await khachHangApi.create(payload);
        message.success("Thêm khách hàng thành công");
      }

      form.resetFields();
      setSelectedAddressId(null);
      onSuccess();
    } catch (err) {
      console.error(err);
      message.error("Lưu khách hàng thất bại");
    }
  };

  return (
    <div style={{ padding: 16, border: "1px solid #f0f0f0", borderRadius: 8 }}>
      <h3>{customer ? "Cập nhật khách hàng" : "Thêm khách hàng mới"}</h3>
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
              label="SĐT"
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
              <Input disabled={!!customer} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="matKhau"
              label="Mật khẩu"
              rules={
                customer ? [] : [{ required: true, message: "Nhập mật khẩu" }]
              }
            >
              <Input.Password placeholder="Nhập nếu muốn đổi/thiết lập" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="tenDiaChi"
              label="Tên địa chỉ"
              rules={[{ required: true, message: "Nhập tên địa chỉ" }]}
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
          <Col span={12}>
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

        <Button type="primary" onClick={handleSubmit} style={{ marginTop: 8 }}>
          Lưu
        </Button>
        <Button onClick={onCancel} style={{ marginLeft: 8, marginTop: 8 }}>
          Hủy
        </Button>
      </Form>
    </div>
  );
}
