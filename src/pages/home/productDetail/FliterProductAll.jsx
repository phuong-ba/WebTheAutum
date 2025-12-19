// src/components/client/FliterProductAll.jsx
import React, { useEffect, useState } from "react";
import { Form, Select, Row, Col, Button, Space } from "antd";
import { SearchOutlined, ReloadOutlined } from "@ant-design/icons";
import baseUrl from "@/api/instance";

const { Option } = Select;

export default function FliterProductAll({ onFilter }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [dropdownData, setDropdownData] = useState({
    nhaSanXuats: [],
    chatLieus: [],
    kieuDangs: [],
    xuatXus: [],
  });

  // Lấy dữ liệu cho dropdown
  const fetchDropdownData = async () => {
    setLoading(true);
    try {
      const [nsxRes, clRes, kdRes, xxRes] = await Promise.all([
        baseUrl.get("nha-san-xuat/playlist"),
        baseUrl.get("chat-lieu/playlist"),
        baseUrl.get("kieu-dang/playlist"),
        baseUrl.get("xuat-xu/playlist"),
      ]);

      setDropdownData({
        nhaSanXuats: nsxRes.data?.data || nsxRes.data || [],
        chatLieus: clRes.data?.data || clRes.data || [],
        kieuDangs: kdRes.data?.data || kdRes.data || [],
        xuatXus: xxRes.data?.data || xxRes.data || [],
      });
    } catch (error) {
      console.error("Lỗi tải bộ lọc:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDropdownData();
  }, []);

  // Khi người dùng bấm Tìm kiếm hoặc thay đổi filter
  const handleFilter = (values) => {
    onFilter(values); // Gửi dữ liệu lọc lên component cha (ProductAll)
  };

  // Reset form + gọi lại filter với object rỗng
  const handleReset = () => {
    form.resetFields();
    onFilter({});
  };

  return (
    <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-200">
      <h3 className="text-lg font-bold text-gray-800 mb- mb-6 flex items-center gap-2">
        Bộ lọc sản phẩm
      </h3>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleFilter}
        onValuesChange={(_, allValues) => handleFilter(allValues)} // Lọc ngay khi thay đổi
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Form.Item name="tenNhaSanXuat" label="Hãng sản xuất">
              <Select
                placeholder="Chọn hãng"
                allowClear
                loading={loading}
                showSearch
                optionFilterProp="children"
              >
                {dropdownData.nhaSanXuats.map((item) => (
                  <Option key={item.id} value={item.tenNhaSanXuat}>
                    {item.tenNhaSanXuat}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Form.Item name="tenChatLieu" label="Chất liệu">
              <Select
                placeholder="Chọn chất liệu"
                allowClear
                loading={loading}
                showSearch
              >
                {dropdownData.chatLieus.map((item) => (
                  <Option key={item.id} value={item.tenChatLieu}>
                    {item.tenChatLieu}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Form.Item name="tenKieuDang" label="Kiểu dáng">
              <Select
                placeholder="Chọn kiểu dáng"
                allowClear
                loading={loading}
                showSearch
              >
                {dropdownData.kieuDangs.map((item) => (
                  <Option key={item.id} value={item.tenKieuDang}>
                    {item.tenKieuDang}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Form.Item name="tenXuatXu" label="Xuất xứ">
              <Select
                placeholder="Chọn xuất xứ"
                allowClear
                loading={loading}
                showSearch
              >
                {dropdownData.xuatXus.map((item) => (
                  <Option key={item.id} value={item.tenXuatXu}>
                    {item.tenXuatXu}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <div className="flex justify-end gap-3 mt-4">
          <Button
            icon={<ReloadOutlined />}
            onClick={handleReset}
            className="flex items-center"
          >
            Xóa bộ lọc
          </Button>
        </div>
      </Form>
    </div>
  );
}
