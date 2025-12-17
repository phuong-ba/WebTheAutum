import React from "react";
import { Form, Input, Select, Row, Col, Button } from "antd";
import { useDispatch } from "react-redux";
import { searchNhanVien, fetchNhanVien } from "@/services/nhanVienService";
import { useNavigate } from "react-router";
import {
  ExportOutlined,
  ImportOutlined,
  PlusSquareOutlined,
  ReloadOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { fetchMauSac } from "@/services/mauSacService";

const { Option } = Select;

export default function FliterColor({ showAddModal }) {
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleReset = () => {
    form.resetFields();
    dispatch(fetchMauSac());
  };

  return (
    <>
      <div className=" bg-white  rounded-lg shadow overflow-hidden">
        <div className="bg-[#E67E22] text-white px-6 py-2">
          <div className="font-bold text-2xl text-white ">Bộ Lọc màu sắc</div>
        </div>
        <div className="px-6 py-3">
          <Form form={form} layout="vertical" autoComplete="off">
            <Row gutter={16}>
              <Col flex="1">
                <Form.Item name="keyword" label="Từ khóa tìm kiếm">
                  <Input placeholder="Nhập mã, tên, email, sđt, địa chỉ..." />
                </Form.Item>
              </Col>

              <Col flex="1">
                <Form.Item name="trangThai" label="Trạng thái">
                  <Select placeholder="Chọn trạng thái" allowClear>
                    <Option value={true}>Hoạt động</Option>
                    <Option value={false}>Ngưng hoạt động</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <div className="flex justify-end gap-4 pr-3">
              <div
                onClick={handleReset}
                className="border  text-white rounded-md px-6 py-2 cursor-pointer bg-gray-400 font-bold hover:bg-amber-700 active:bg-cyan-800 select-none"
              >
                <ReloadOutlined /> Nhập lại
              </div>
              <div
                onClick={() => form.submit()}
                className="bg-[#E67E22] text-white rounded-md px-6 py-2 cursor-pointer font-bold hover:bg-amber-700 active:bg-cyan-800 select-none"
              >
                <SearchOutlined /> Tìm kiếm
              </div>
              <div className="flex gap-3">
                <div
                  onClick={showAddModal}
                  className="bg-[#E67E22] text-white rounded-md px-6 py-2 cursor-pointer font-bold hover:bg-amber-800 hover:text-white active:bg-cyan-800 select-none"
                >
                  <PlusSquareOutlined /> Thêm mới
                </div>
              </div>
            </div>
          </Form>
        </div>
      </div>
    </>
  );
}
