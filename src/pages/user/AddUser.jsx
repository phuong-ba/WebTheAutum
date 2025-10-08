import React, { useEffect } from "react";
import { Form, Input, Select, Row, Col, Button, message } from "antd";
import { useDispatch, useSelector } from "react-redux";
import {
  addNhanVien,
  fetchNhanVien,
  updateNhanVien,
} from "@/services/nhanVienService";
import { fetchAllChucVu } from "@/services/chucVuService";

const { Option } = Select;

export default function AddUser({ editingUser, onFinishUpdate }) {
  const { data } = useSelector((state) => state.chucvu);

  const [form] = Form.useForm();
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(fetchAllChucVu());
  }, [dispatch]);
  useEffect(() => {
    if (editingUser && data?.length) {
      form.setFieldsValue({
        maNhanVien: editingUser.maNhanVien,
        tenNhanVien: editingUser.hoTen,
        gioiTinh: editingUser.gioiTinh ? "Nam" : "Nữ",
        soDienThoai: editingUser.sdt,
        diaChi: editingUser.diaChi,
        email: editingUser.email,
        chucVu: editingUser.chucVuId,
        taiKhoan: editingUser.taiKhoan,
        matKhau: editingUser.matKhau,
      });
    } else {
      form.resetFields();
    }
  }, [editingUser, form, data]);

  const onFinish = async (values) => {
    try {
      const payload = {
        maNhanVien: values.maNhanVien,
        hoTen: values.tenNhanVien,
        gioiTinh: values.gioiTinh === "Nam",
        sdt: values.soDienThoai,
        diaChi: values.diaChi,
        email: values.email,
        chucVuId: values.chucVu,
        taiKhoan: values.taiKhoan,
        matKhau: values.matKhau,
        trangThai: true,
      };

      if (editingUser) {
        await dispatch(
          updateNhanVien({ id: editingUser.id, nhanvien: payload })
        );
        message.success("Cập nhật nhân viên thành công!");
        onFinishUpdate();
      } else {
        await dispatch(addNhanVien(payload));
        message.success("Thêm nhân viên thành công!");
        dispatch(fetchNhanVien());
      }

      form.resetFields();
    } catch (error) {
      message.error({
        content: "Thao tác thất bại! Vui lòng thử lại.",
        duration: 3,
        placement: "topRight",
      });
    }
  };

  return (
    <div className="px-10 py-[20px] bg-white my-10">
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        autoComplete="off"
      >
        <Row gutter={16} wrap>
          <Col flex="1">
            <Form.Item
              name="maNhanVien"
              label="Mã nhân viên"
              rules={[{ required: true, message: "Nhập mã nhân viên" }]}
            >
              <Input placeholder="Nhập mã nhân viên" />
            </Form.Item>
          </Col>

          <Col flex="1">
            <Form.Item
              name="tenNhanVien"
              label="Tên nhân viên"
              rules={[{ required: true, message: "Nhập tên nhân viên" }]}
            >
              <Input placeholder="Nhập tên nhân viên" />
            </Form.Item>
          </Col>

          <Col flex="1">
            <Form.Item name="gioiTinh" label="Giới tính">
              <Select placeholder="Chọn giới tính">
                <Option value="Nam">Nam</Option>
                <Option value="Nữ">Nữ</Option>
              </Select>
            </Form.Item>
          </Col>

          <Col flex="1">
            <Form.Item name="soDienThoai" label="Số điện thoại">
              <Input placeholder="Nhập số điện thoại" />
            </Form.Item>
          </Col>

          <Col flex="1">
            <Form.Item
              name="chucVu"
              label="Chức vụ"
              rules={[{ required: true, message: "Vui lòng chọn chức vụ" }]}
            >
              <Select placeholder="Chọn chức vụ">
                {data?.map((cv) => (
                  <Option key={cv.id} value={cv.id}>
                    {cv.tenChucVu}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16} wrap>
          <Col flex="1">
            <Form.Item name="diaChi" label="Địa chỉ">
              <Input placeholder="Nhập địa chỉ" />
            </Form.Item>
          </Col>

          <Col flex="1">
            <Form.Item name="email" label="Email">
              <Input placeholder="Nhập email" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16} wrap>
          <Col flex="1">
            <Form.Item
              name="taiKhoan"
              label="Tài khoản"
              rules={[{ required: true, message: "Nhập tài khoản" }]}
            >
              <Input placeholder="Nhập tài khoản" />
            </Form.Item>
          </Col>

          <Col flex="1">
            <Form.Item
              name="matKhau"
              label="Mật khẩu"
              rules={[{ required: true, message: "Nhập mật khẩu" }]}
            >
              <Input.Password placeholder="Nhập mật khẩu" />
            </Form.Item>
          </Col>
        </Row>

        <div className="flex justify-end pr-5 gap-4">
          <Button onClick={() => form.resetFields()}>Nhập lại</Button>
          <Button type="primary" htmlType="submit">
            {editingUser ? "Cập nhật nhân viên" : "Thêm nhân viên"}
          </Button>
        </div>
      </Form>
    </div>
  );
}
