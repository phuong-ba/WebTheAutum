import React from "react";
import { Form, Input, Select, Row, Col, Button } from "antd";
import { useDispatch } from "react-redux";

const { Option } = Select;

export default function FliterUser() {
  const dispatch = useDispatch();
  const [form] = Form.useForm();

  return (
    <div className="px-10 py-[20px] bg-white my-10">
      <Form form={form} layout="vertical" autoComplete="off">
        <Row gutter={16} wrap>
          <Col flex="1">
            <Form.Item name="maNhanVien" label="Mã nhân viên">
              <Input placeholder="Nhập mã nhân viên" />
            </Form.Item>
          </Col>

          <Col flex="1">
            <Form.Item name="tenNhanVien" label="Tên nhân viên">
              <Input placeholder="Nhập tên nhân viên" />
            </Form.Item>
          </Col>

          <Col flex="1">
            <Form.Item name="email" label="Email">
              <Input placeholder="Nhập email" />
            </Form.Item>
          </Col>
        </Row>

        <div className="flex justify-end pr-3 gap-4">
          <button
            type="button"
            className="border border-[#E67E22] text-[#E67E22] rounded px-6  py-2 cursor-pointer active:bg-[#E67E22] active:text-white"
          >
            Nhập lại
          </button>
          <button
            className=" bg-[#E67E22] text-white rounded px-6 py-2 cursor-pointer active:bg-[#0821ad] active:text-white"
            type="submit"
          >
            Tìm kiếm
          </button>
        </div>
      </Form>
    </div>
  );
}
