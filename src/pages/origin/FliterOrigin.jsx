import React, { useState } from "react";
import { Form, Input, Select, Row, Col, Button, DatePicker } from "antd";
import { useDispatch } from "react-redux";
import {
  PlusSquareOutlined,
  ReloadOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { filterMauSac } from "@/services/mauSacService";

const { Option } = Select;

export default function FliterOrigin({ showAddModal }) {
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  
  // Xử lý reset form
  const handleReset = () => {
    form.resetFields();
    
    // Fetch tất cả với filter rỗng
    dispatch(filterMauSac({
      pageNo: 0,
      pageSize: 10,
      searchText: "",
      maMauSac: "",
      tenMauSac: "",
      trangThai: undefined,
    }));
  };

  // Xử lý tìm kiếm
  const handleSearch = (values) => {
    console.log("🔍 Filter submitted:", values);
    
    const filterParams = {
      pageNo: 0,
      pageSize: 10,
    };
    
    if (values.searchText && values.searchText.toString().trim()) {
      filterParams.searchText = values.searchText.toString().trim();
    }
    
    if (values.maMauSac && values.maMauSac.toString().trim()) {
      filterParams.maMauSac = values.maMauSac.toString().trim();
    }
    
    if (values.tenMauSac && values.tenMauSac.toString().trim()) {
      filterParams.tenMauSac = values.tenMauSac.toString().trim();
    }
    
    if (values.trangThai !== undefined && values.trangThai !== null) {
      filterParams.trangThai = values.trangThai;
    }
    
    if (values.ngayTao) {
      filterParams.ngayTao = values.ngayTao.toDate();
    }
    
    console.log("📤 Calling filter API with:", filterParams);
    dispatch(filterMauSac(filterParams));
  };

  return (
    <div className="p-6">
      <Form 
        form={form} 
        layout="vertical" 
        autoComplete="off"
        onFinish={handleSearch}
      >
        {/* Row 1: Search + Status + Brand/Material equivalent */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8}>
            <Form.Item 
              name="searchText" 
              label="Tìm kiếm màu sắc"
            >
              <Input 
                placeholder="Nhập mã màu hoặc tên màu..." 
                allowClear
                maxLength={100}
                size="middle"
              />
            </Form.Item>
          </Col>
          
          <Col xs={24} sm={12} md={8}>
            <Form.Item 
              name="maMauSac" 
              label="Mã màu sắc"
            >
              <Input 
                placeholder="VD: MS001, RED001..." 
                allowClear
                maxLength={50}
                size="middle"
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={8}>
            <Form.Item 
              name="tenMauSac" 
              label="Tên màu sắc"
            >
              <Input 
                placeholder="VD: Đỏ tươi, Xanh dương..." 
                allowClear
                maxLength={100}
                size="middle"
              />
            </Form.Item>
          </Col>
        </Row>

        {/* Row 2: Date + Status + Empty space (matching Product's 3-column layout) */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8}>
            <Form.Item 
              name="ngayTao" 
              label="Ngày tạo từ"
            >
              <DatePicker 
                placeholder="Chọn ngày bắt đầu"
                format="DD/MM/YYYY"
                style={{ width: '100%' }}
                size="middle"
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={8}>
            <Form.Item 
              name="trangThai" 
              label="Trạng thái"
            >
              <Select 
                placeholder="Chọn trạng thái" 
                allowClear
                size="middle"
              >
                <Option value={true}>Đang hoạt động</Option>
                <Option value={false}>Ngừng hoạt động</Option>
              </Select>
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={8}></Col>
        </Row>

        {/* Action buttons - matching Product style */}
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
            Thêm màu sắc
          </div>
        </div>
      </Form>
    </div>
  );
}