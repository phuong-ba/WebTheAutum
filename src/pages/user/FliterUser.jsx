import React from "react";
import { Form, Input, Select, Row, Col, Button } from "antd";
import { useDispatch } from "react-redux";
import { searchNhanVien, fetchNhanVien } from "@/services/nhanVienService";

const { Option } = Select;

export default function FilterUser() {
  const [form] = Form.useForm();
  const dispatch = useDispatch();

  const handleSearch = (values) => {
    const query = {
      keyword: values.keyword || undefined,
      gioiTinh:
        values.gioiTinh !== undefined && values.gioiTinh !== ""
          ? values.gioiTinh
          : undefined,
      chucVu:
        values.chucVu !== undefined && values.chucVu !== ""
          ? values.chucVu
          : undefined,
      trangThai:
        values.trangThai !== undefined && values.trangThai !== ""
          ? values.trangThai
          : undefined,
    };

    const cleanQuery = Object.fromEntries(
      Object.entries(query).filter(
        ([_, value]) => value !== undefined && value !== ""
      )
    );

    dispatch(searchNhanVien(cleanQuery));
  };

  const handleReset = () => {
    form.resetFields();
    dispatch(fetchNhanVien());
  };

  return (
    <>
      <div className=" bg-white  rounded-lg shadow overflow-hidden">
        <div className="bg-[#E67E22] text-white px-6 py-2">
          <div className="font-bold text-2xl text-white ">Bộ Lọc Nhân Viên</div>
        </div>
        <div className="px-6 py-3">
          <Form
            form={form}
            layout="vertical"
            autoComplete="off"
            onFinish={handleSearch}
          >
            <Row gutter={16}>
              <Col flex="1">
                <Form.Item name="keyword" label="Từ khóa tìm kiếm">
                  <Input placeholder="Nhập mã, tên, email, sđt, địa chỉ..." />
                </Form.Item>
              </Col>

              <Col flex="1">
                <Form.Item name="gioiTinh" label="Giới tính">
                  <Select placeholder="Chọn giới tính" allowClear>
                    <Option value={true}>Nam</Option>
                    <Option value={false}>Nữ</Option>
                  </Select>
                </Form.Item>
              </Col>

              <Col flex="1">
                <Form.Item name="chucVu" label="Chức vụ">
                  <Select placeholder="Chọn chức vụ" allowClear>
                    <Option value="1">Quản lý</Option>
                    <Option value="2">Nhân viên</Option>
                  </Select>
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
              <button
                onClick={handleReset}
                className="bg-white text-[#E67E22] border rounded px-6 py-2 cursor-pointer
              active:bg-[#A0522D] active:text-white transition-colors font-medium"
              >
                Nhập lại
              </button>
              <button
                htmlType="submit"
                className="bg-[#E67E22] text-white border rounded px-6 py-2 cursor-pointer 
             hover:border-[#d35400] active:bg-[#A0522D] active:text-white transition-colors font-medium"
              >
                Tìm kiếm
              </button>
            </div>
          </Form>
        </div>
      </div>
    </>
  );
}
