import React, { useEffect, useState } from "react";
import {
  Form,
  Input,
  Select,
  Row,
  Col,
  message,
  Upload,
  DatePicker,
} from "antd";
import { useDispatch, useSelector } from "react-redux";
import { addNhanVien, fetchNhanVien } from "@/services/nhanVienService";
import { fetchAllChucVu } from "@/services/chucVuService";
import { useNavigate } from "react-router";
import TextArea from "antd/es/input/TextArea";
import TableDiscount from "./TableDiscount";

const { Option } = Select;

export default function AddDiscount() {
  const dispatch = useDispatch();
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    dispatch(fetchAllChucVu());
  }, [dispatch]);

  const onFinish = async (values) => {
    const payload = {
      hoTen: values.tenNhanVien,
      gioiTinh: values.gioiTinh === "Nam",
      sdt: values.soDienThoai,
      diaChi: values.diaChi,
      email: values.email,
      chucVuId: values.chucVu,
      ngaySinh: values.ngaySinh,
      matKhau: values.matKhau || "123456",
      trangThai: true,
    };
    try {
      await dispatch(addNhanVien(payload));
      messageApi.success("Thêm nhân viên thành công!");
      form.resetFields();
      dispatch(fetchNhanVien());
      setTimeout(() => navigate("/user"), 800);
    } catch {
      messageApi.error("Thêm thất bại!");
    }
  };

  return (
    <>
      {contextHolder}
      <div className="bg-white rounded-xl mx-6 my-6 py-5">
        <div className="px-6 pb-5 border-b border-slate-300">
          <p className="font-bold text-2xl text-[#E67E22]">
            Thêm mới khuyến mại
          </p>
        </div>

        <div className="px-10 py-5">
          <Form form={form} layout="vertical" onFinish={onFinish}>
            <Row gutter={16} wrap>
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
                <Form.Item
                  name="soDienThoai"
                  label="Số điện thoại"
                  rules={[{ required: true, message: "Nhập số điện thoại" }]}
                >
                  <Input placeholder="Nhập số điện thoại" />
                </Form.Item>
              </Col>
              <Col flex="1">
                <Form.Item
                  name="soDienThoai"
                  label="Số điện thoại"
                  rules={[{ required: true, message: "Nhập số điện thoại" }]}
                >
                  <Input placeholder="Nhập số điện thoại" />
                </Form.Item>
              </Col>
              <Col flex="1">
                <Form.Item
                  name="soDienThoai"
                  label="Số điện thoại"
                  rules={[{ required: true, message: "Nhập số điện thoại" }]}
                >
                  <DatePicker
                    className="w-full"
                    showTime
                    onChange={(value, dateString) => {
                      console.log("Selected Time: ", value);
                      console.log("Formatted Selected Time: ", dateString);
                    }}
                  />
                </Form.Item>
              </Col>
              <Col flex="1">
                <Form.Item
                  name="soDienThoai"
                  label="Số điện thoại"
                  rules={[{ required: true, message: "Nhập số điện thoại" }]}
                >
                  <DatePicker
                    className="w-full"
                    showTime
                    onChange={(value, dateString) => {
                      console.log("Selected Time: ", value);
                      console.log("Formatted Selected Time: ", dateString);
                    }}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16} wrap>
              <Col flex="1">
                <Form.Item name="gioiTinh" label="Giới tính">
                  <Select placeholder="Chọn giới tính">
                    <Option value="Nam">Nam</Option>
                    <Option value="Nữ">Nữ</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col flex="1">
                <Form.Item name="email" label="Email">
                  <Input placeholder="Nhập email" />
                </Form.Item>
              </Col>
              <Col flex="1">
                <Form.Item name="email" label="Email">
                  <Input placeholder="Nhập email" />
                </Form.Item>
              </Col>
              <Col flex="1">
                <Form.Item name="email" label="Email">
                  <Input placeholder="Nhập email" />
                </Form.Item>
              </Col>
              <Col flex="1">
                <Form.Item name="email" label="Email">
                  <Input placeholder="Nhập email" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16} wrap className="gap-10">
              <Col flex="1">
                <Form.Item name="diaChi" label="Địa chỉ">
                  <TextArea />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </div>
        <TableDiscount />
        <div className="flex justify-center pr-3 gap-4 border-t border-slate-300 py-3 ">
          <button className="border border-[#E67E22] text-[#E67E22] rounded px-6  py-2 cursor-pointer active:bg-[#E67E22] active:text-white">
            Nhập lại
          </button>
          <button
            className=" bg-[#E67E22] text-white rounded px-6 py-2 cursor-pointer active:bg-[#0821ad] active:text-white"
            type="submit"
          >
            Thêm
          </button>
        </div>
      </div>
    </>
  );
}
