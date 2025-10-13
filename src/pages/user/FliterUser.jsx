import React, { useEffect } from "react";
import { Form, Input, Select, Row, Col, Button, message } from "antd";
import { useDispatch, useSelector } from "react-redux";

const { Option } = Select;

export default function FliterUser() {
  return (
    <div className="px-10 py-[20px] bg-white my-10">
      <Form layout="vertical" autoComplete="off">
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
        </Row>

        <Row gutter={16} wrap className="w-1/2">
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

        <div className="flex justify-end pr-3 gap-4">
          <button className="border border-[#E67E22] text-[#E67E22] rounded px-6  py-2 cursor-pointer active:bg-[#E67E22] active:text-white">
            Nhập lại
          </button>
          <button
            className=" bg-[#E67E22] text-white rounded px-6 py-2 cursor-pointer active:bg-[#0821ad] active:text-white"
            type="submit"
          >
            Tim kiem
          </button>
        </div>
      </Form>
    </div>
  );
}
