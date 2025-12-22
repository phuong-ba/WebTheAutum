import React from "react";
import { Form, Input, Select, Row, Col, DatePicker } from "antd";
import { useDispatch } from "react-redux";
import { fetchFilterKieuDang } from "@/redux/slices/kieuDangSlice";
import { updateAdvancedFilters } from "@/redux/slices/kieuDangSlice";
import dayjs from "dayjs";

const { Option } = Select;

export default function FilterStyle({ showAddModal }) {
  const [form] = Form.useForm();
  const dispatch = useDispatch();

  const handleReset = () => {
    form.resetFields();
    dispatch(updateAdvancedFilters({
      searchText: "",
      maKieuDang: "",
      tenKieuDang: "",
      ngayTao: null,
      trangThai: undefined,
    }));
    dispatch(fetchFilterKieuDang({ pageNo: 0, pageSize: 10 }));
  };

  const handleSearch = (values) => {
    const filterParams = { pageNo: 0, pageSize: 10 };
    
    if (values.searchText?.trim()) filterParams.searchText = values.searchText.trim();
    if (values.maKieuDang?.trim()) filterParams.maKieuDang = values.maKieuDang.trim().toUpperCase();
    if (values.tenKieuDang?.trim()) filterParams.tenKieuDang = values.tenKieuDang.trim();
    if (values.trangThai !== undefined) filterParams.trangThai = values.trangThai;
    if (values.ngayTao) filterParams.ngayTao = values.ngayTao.toDate();
    
    dispatch(updateAdvancedFilters({
      searchText: filterParams.searchText || "",
      maKieuDang: filterParams.maKieuDang || "",
      tenKieuDang: filterParams.tenKieuDang || "",
      ngayTao: filterParams.ngayTao || null,
      trangThai: filterParams.trangThai,
    }));
    
    dispatch(fetchFilterKieuDang(filterParams));
  };

  return (
    <div className="p-6">
      <Form form={form} layout="vertical" autoComplete="off" onFinish={handleSearch}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8}>
            <Form.Item name="searchText" label="Tìm kiếm kiểu dáng">
              <Input placeholder="Nhập mã hoặc tên kiểu dáng..." allowClear maxLength={100} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Form.Item name="maKieuDang" label="Mã kiểu dáng">
              <Input placeholder="VD: KD001, AO_THUN..." allowClear maxLength={50} style={{ textTransform: "uppercase" }} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Form.Item name="tenKieuDang" label="Tên kiểu dáng">
              <Input placeholder="VD: Áo thun, Áo sơ mi, Quần jeans..." allowClear maxLength={255} />
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
            Thêm kiểu dáng
          </div>
        </div>
      </Form>
    </div>
  );
}