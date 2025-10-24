import React, { useEffect, useState } from "react";
import { Form, Input, Select, Row, Col, Button } from "antd";
import { SearchOutlined, ReloadOutlined } from "@ant-design/icons";
import baseUrl from "@/api/instance";

const { Option } = Select;

export default function FliterProduct({ onFilter }) {
  const [form] = Form.useForm();
  const [dropdownData, setDropdownData] = useState({
    nhaSanXuats: [],
    chatLieus: [],
    kieuDangs: [],
    xuatXus: [],
  });
  const [loading, setLoading] = useState(false);

  const fetchDropdownData = async () => {
    setLoading(true);
    try {
      console.log("🔄 Đang tải danh sách dropdown...");

      const [nhaSanXuatsRes, chatLieusRes, kieuDangsRes, xuatXusRes] =
        await Promise.all([
          baseUrl.get("nha-san-xuat/playlist"),
          baseUrl.get("chat-lieu/playlist"),
          baseUrl.get("kieu-dang/playlist"),
          baseUrl.get("xuat-xu/playlist"),
        ]);

      setDropdownData({
        nhaSanXuats: nhaSanXuatsRes.data?.data || nhaSanXuatsRes.data || [],
        chatLieus: chatLieusRes.data?.data || chatLieusRes.data || [],
        kieuDangs: kieuDangsRes.data?.data || kieuDangsRes.data || [],
        xuatXus: xuatXusRes.data?.data || xuatXusRes.data || [],
      });
    } catch (error) {
      console.error("💥 Lỗi tải dropdown data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDropdownData();
  }, []);

  const onFinish = (values) => {
    console.log("🎯 Filter raw values:", values);

    const cleanedValues = Object.keys(values).reduce((acc, key) => {
      const value = values[key];
      if (value !== undefined && value !== null && value !== "") {
        acc[key] = value;
      }
      return acc;
    }, {});

    console.log("✅ Filter cleaned values:", cleanedValues);

    if (onFilter) {
      onFilter(cleanedValues);
    }
  };

  const onReset = () => {
    form.resetFields();
    if (onFilter) {
      onFilter({});
    }
  };

  return (
    <div className="p-6">
      <Form
        form={form}
        layout="vertical"
        autoComplete="off"
        onFinish={onFinish}
      >
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Form.Item name="searchText" label="Tìm kiếm sản phẩm">
              <Input
                placeholder="Nhập tên sản phẩm, hãng, chất liệu, kiểu dáng hoặc xuất xứ..."
                allowClear
                size="middle"
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8}>
            <Form.Item name="tenNhaSanXuat" label="Hãng">
              <Select
                placeholder="Chọn hãng"
                loading={loading}
                showSearch
                optionFilterProp="children"
                filterOption={(input, option) =>
                  option.children.toLowerCase().includes(input.toLowerCase())
                }
                allowClear
                size="middle"
              >
                {dropdownData.nhaSanXuats.map((item) => (
                  <Option key={item.id} value={item.tenNhaSanXuat}>
                    {item.tenNhaSanXuat}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={8}>
            <Form.Item name="tenChatLieu" label="Chất liệu">
              <Select
                placeholder="Chọn chất liệu"
                loading={loading}
                showSearch
                optionFilterProp="children"
                allowClear
                size="middle"
              >
                {dropdownData.chatLieus.map((item) => (
                  <Option key={item.id} value={item.tenChatLieu}>
                    {item.tenChatLieu}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={8}>
            <Form.Item name="tenKieuDang" label="Kiểu dáng">
              <Select
                placeholder="Chọn kiểu dáng"
                loading={loading}
                showSearch
                optionFilterProp="children"
                allowClear
                size="middle"
              >
                {dropdownData.kieuDangs.map((item) => (
                  <Option key={item.id} value={item.tenKieuDang}>
                    {item.tenKieuDang}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8}>
            <Form.Item name="tenXuatXu" label="Xuất xứ">
              <Select
                placeholder="Chọn xuất xứ"
                loading={loading}
                showSearch
                optionFilterProp="children"
                allowClear
                size="middle"
              >
                {dropdownData.xuatXus.map((item) => (
                  <Option key={item.id} value={item.tenXuatXu}>
                    {item.tenXuatXu}
                  </Option>
                ))}
              </Select>
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

          <Col xs={24} sm={12} md={8}>
          </Col>
        </Row>

        <div className="flex justify-end pr-3 gap-4">
          <button
            type="button"
            onClick={onReset}
            className="border border-[#E67E22] text-[#E67E22] rounded px-6 py-2 cursor-pointer hover:bg-[#E67E22] hover:text-white transition-colors"
          >
            Nhập lại
          </button>
          <button
            className="bg-[#E67E22] text-white rounded px-6 py-2 cursor-pointer hover:bg-[#d35400] transition-colors"
            type="submit"
          >
            Tìm kiếm
          </button>
        </div>
      </Form>
    </div>
  );
}