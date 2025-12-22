import React, { useState } from "react";
import { Form, Input, Select, Row, Col, Button, DatePicker } from "antd";
import { useDispatch } from "react-redux";
import { ReloadOutlined } from "@ant-design/icons";
import { fetchFilterXuatXu } from "@/redux/slices/xuatXuSlice";
import { updateAdvancedFilters } from "@/redux/slices/xuatXuSlice";
import dayjs from "dayjs";

const { Option } = Select;

export default function FilterXuatXu({ showAddModal }) {
  const [form] = Form.useForm();
  const dispatch = useDispatch();

  const handleReset = () => {
    form.resetFields();
    
    dispatch(updateAdvancedFilters({
      searchText: "",
      maXuatXu: "",
      tenXuatXu: "",
      ngayTao: null,
      trangThai: undefined,
    }));

    dispatch(
      fetchFilterXuatXu({
        pageNo: 0,
        pageSize: 10,
        searchText: "",
        maXuatXu: "",
        tenXuatXu: "",
        trangThai: undefined,
      })
    );
  };

  const handleSearch = (values) => {
    console.log("🔍 Filter submitted:", values);
    
    const filterParams = {
      pageNo: 0,
      pageSize: 10,
    };
    
    if (values.searchText && values.searchText.toString().trim()) {
      filterParams.searchText = values.searchText.toString().trim();
    }
    
    if (values.maXuatXu && values.maXuatXu.toString().trim()) {
      filterParams.maXuatXu = values.maXuatXu.toString().trim().toUpperCase();
    }
    
    if (values.tenXuatXu && values.tenXuatXu.toString().trim()) {
      filterParams.tenXuatXu = values.tenXuatXu.toString().trim();
    }
    
    if (values.trangThai !== undefined && values.trangThai !== null) {
      filterParams.trangThai = values.trangThai;
    }
    
    if (values.ngayTao) {
      filterParams.ngayTao = values.ngayTao.toDate();
    }
    
    console.log("📤 Calling filter API with:", filterParams);
    
    // Cập nhật filters vào Redux
    dispatch(updateAdvancedFilters({
      searchText: filterParams.searchText || "",
      maXuatXu: filterParams.maXuatXu || "",
      tenXuatXu: filterParams.tenXuatXu || "",
      ngayTao: filterParams.ngayTao || null,
      trangThai: filterParams.trangThai,
    }));
    
    dispatch(fetchFilterXuatXu(filterParams));
  };

  return (
    <div className="p-6">
      <Form form={form} layout="vertical" autoComplete="off" onFinish={handleSearch}>
        {/* Row 1: Search + Mã xuất xứ + Tên xuất xứ */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8}>
            <Form.Item name="searchText" label="Tìm kiếm xuất xứ">
              <Input
                placeholder="Nhập mã hoặc tên xuất xứ..."
                allowClear
                maxLength={100}
                size="middle"
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={8}>
            <Form.Item name="maXuatXu" label="Mã xuất xứ">
              <Input
                placeholder="VD: XX001, VIET_NAM..."
                allowClear
                maxLength={50}
                size="middle"
                style={{ textTransform: "uppercase" }}
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={8}>
            <Form.Item name="tenXuatXu" label="Tên xuất xứ">
              <Input
                placeholder="VD: Việt Nam, Trung Quốc, Mỹ..."
                allowClear
                maxLength={255}
                size="middle"
              />
            </Form.Item>
          </Col>
        </Row>

        {/* Row 2: Date + Status */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8}>
            <Form.Item name="ngayTao" label="Ngày tạo từ">
              <DatePicker
                placeholder="Chọn ngày tạo"
                format="DD/MM/YYYY"
                style={{ width: "100%" }}
                size="middle"
                disabledDate={(current) =>
                  current && current > dayjs().endOf("day")
                }
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={8}>
            <Form.Item name="trangThai" label="Trạng thái">
              <Select placeholder="Chọn trạng thái" allowClear size="middle">
                <Option value={true}>Đang hoạt động</Option>
                <Option value={false}>Ngừng hoạt động</Option>
              </Select>
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={8}></Col>
        </Row>

        {/* Action buttons */}
        <div className="flex justify-end gap-4 pr-3">
          <div
            onClick={handleReset}
            className="border text-white rounded-md px-6 py-2 cursor-pointer bg-gray-400 font-bold hover:bg-gray-500 active:bg-gray-600 select-none"
          >
            Nhập lại
          </div>
          <div
            onClick={() => form.submit()}
            className="bg-[#E67E22] text-white rounded-md px-6 py-2 cursor-pointer font-bold hover:bg-amber-700 active:bg-cyan-800 select-none"
          >
            Tìm kiếm
          </div>
          <div
            onClick={showAddModal}
            className="bg-[#E67E22] text-white rounded-md px-6 py-2 cursor-pointer font-bold hover:bg-amber-700 active:bg-cyan-800 select-none"
          >
            Thêm xuất xứ
          </div>
        </div>
      </Form>
    </div>
  );
}