import React from "react";
import { Form, Input, Select, Row, Col, DatePicker } from "antd";
import { useDispatch } from "react-redux";
import { fetchFilterTayAo } from "@/redux/slices/tayAoSlice";
import { updateAdvancedFilters } from "@/redux/slices/tayAoSlice";
import dayjs from "dayjs";

const { Option } = Select;

export default function FilterSleeve({ showAddModal }) {
  const [form] = Form.useForm();
  const dispatch = useDispatch();

  const handleReset = () => {
    form.resetFields();
    dispatch(updateAdvancedFilters({
      searchText: "",
      maTayAo: "",
      tenTayAo: "",
      ngayTao: null,
      trangThai: undefined,
    }));
    dispatch(fetchFilterTayAo({ pageNo: 0, pageSize: 10 }));
  };

  const handleSearch = (values) => {
    const filterParams = { pageNo: 0, pageSize: 10 };
    
    if (values.searchText?.trim()) filterParams.searchText = values.searchText.trim();
    if (values.maTayAo?.trim()) filterParams.maTayAo = values.maTayAo.trim().toUpperCase();
    if (values.tenTayAo?.trim()) filterParams.tenTayAo = values.tenTayAo.trim();
    if (values.trangThai !== undefined) filterParams.trangThai = values.trangThai;
    if (values.ngayTao) filterParams.ngayTao = values.ngayTao.toDate();
    
    dispatch(updateAdvancedFilters({
      searchText: filterParams.searchText || "",
      maTayAo: filterParams.maTayAo || "",
      tenTayAo: filterParams.tenTayAo || "",
      ngayTao: filterParams.ngayTao || null,
      trangThai: filterParams.trangThai,
    }));
    
    dispatch(fetchFilterTayAo(filterParams));
  };

  return (
    <div className="p-6">
      <Form form={form} layout="vertical" autoComplete="off" onFinish={handleSearch}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8}>
            <Form.Item name="searchText" label="Tìm kiếm tay áo">
              <Input placeholder="Nhập mã hoặc tên tay áo..." allowClear maxLength={100} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Form.Item name="maTayAo" label="Mã tay áo">
              <Input placeholder="VD: TA001, TAY_DAI..." allowClear maxLength={50} style={{ textTransform: "uppercase" }} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Form.Item name="tenTayAo" label="Tên tay áo">
              <Input placeholder="VD: Tay dài, Tay ngắn, Tay lỡ..." allowClear maxLength={255} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8}>
            <Form.Item name="ngayTao" label="Ngày tạo từ">
              <DatePicker
                placeholder="Chọn ngày tạo"
                format="DD/MM/YYYY"
                style={{ width: "100%" }}
                disabledDate={(current) => current && current > dayjs().endOf("day")}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Form.Item name="trangThai" label="Trạng thái">
              <Select placeholder="Chọn trạng thái" allowClear>
                <Option value={true}>Đang hoạt động</Option>
                <Option value={false}>Ngừng hoạt động</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={8}></Col>
        </Row>

        <div className="flex justify-end gap-4 pr-3">
          <div
            onClick={handleReset}
            className="border text-white rounded-md px-6 py-2 cursor-pointer bg-gray-400 font-bold hover:bg-gray-500 select-none"
          >
            Nhập lại
          </div>
          <div
            onClick={() => form.submit()}
            className="bg-[#E67E22] text-white rounded-md px-6 py-2 cursor-pointer font-bold hover:bg-amber-700 select-none"
          >
            Tìm kiếm
          </div>
          <div
            onClick={showAddModal}
            className="bg-[#E67E22] text-white rounded-md px-6 py-2 cursor-pointer font-bold hover:bg-amber-700 select-none"
          >
            Thêm tay áo
          </div>
        </div>
      </Form>
    </div>
  );
}