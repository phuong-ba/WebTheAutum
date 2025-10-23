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

    console.log("Search query:", cleanQuery);
    dispatch(searchNhanVien(cleanQuery));
  };

  const handleReset = () => {
    form.resetFields();
    dispatch(fetchNhanVien());
  };

  return (
    <div className="px-10 py-[20px] bg-white my-10">
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
          <Button onClick={handleReset}>Nhập lại</Button>
          <Button
            htmlType="submit"
            type="primary"
            style={{ background: "#E67E22", borderColor: "#E67E22" }}
          >
            Tìm kiếm
          </Button>
        </div>
      </Form>
    </div>
  );
}
