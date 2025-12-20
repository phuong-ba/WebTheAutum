import React, { useState } from "react";
import { Form, Input, Select, Row, Col, Button, DatePicker } from "antd";
import { useDispatch } from "react-redux";
import { ReloadOutlined } from "@ant-design/icons";
import { fetchFilterChatLieu } from "@/redux/slices/chatLieuSlice";
import { updateAdvancedFilters } from "@/redux/slices/chatLieuSlice";
import dayjs from "dayjs";

const { Option } = Select;

export default function FilterMaterial({ showAddModal }) {
  const [form] = Form.useForm();
  const dispatch = useDispatch();

  const handleReset = () => {
    form.resetFields();
    
    dispatch(updateAdvancedFilters({
      searchText: "",
      maChatLieu: "",
      tenChatLieu: "",
      ngayTao: null,
      trangThai: undefined,
    }));

    dispatch(
      fetchFilterChatLieu({
        pageNo: 0,
        pageSize: 10,
        searchText: "",
        maChatLieu: "",
        tenChatLieu: "",
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
    
    if (values.maChatLieu && values.maChatLieu.toString().trim()) {
      filterParams.maChatLieu = values.maChatLieu.toString().trim().toUpperCase();
    }
    
    if (values.tenChatLieu && values.tenChatLieu.toString().trim()) {
      filterParams.tenChatLieu = values.tenChatLieu.toString().trim();
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
      maChatLieu: filterParams.maChatLieu || "",
      tenChatLieu: filterParams.tenChatLieu || "",
      ngayTao: filterParams.ngayTao || null,
      trangThai: filterParams.trangThai,
    }));
    
    dispatch(fetchFilterChatLieu(filterParams));
  };

  return (
    <div className="p-6">
      <Form form={form} layout="vertical" autoComplete="off" onFinish={handleSearch}>
        {/* Row 1: Search + Mã chất liệu + Tên chất liệu */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8}>
            <Form.Item name="searchText" label="Tìm kiếm chất liệu">
              <Input
                placeholder="Nhập mã hoặc tên chất liệu..."
                allowClear
                maxLength={100}
                size="middle"
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={8}>
            <Form.Item name="maChatLieu" label="Mã chất liệu">
              <Input
                placeholder="VD: CL001, VAI_COTTON..."
                allowClear
                maxLength={50}
                size="middle"
                style={{ textTransform: "uppercase" }}
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={8}>
            <Form.Item name="tenChatLieu" label="Tên chất liệu">
              <Input
                placeholder="VD: Cotton, Polyester, Da thật..."
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
            Thêm chất liệu
          </div>
        </div>
      </Form>
    </div>
  );
}