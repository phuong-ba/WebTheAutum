import React from "react";
import { Form, Input, Select, Row, Col, DatePicker, Button } from "antd";
import { useDispatch } from "react-redux";
import {
  fetchPhieuGiamGia,
  searchPhieuGiamGia,
} from "@/services/phieuGiamGiaService";
import dayjs from "dayjs";

const { Option } = Select;

export default function FliterDiscount() {
  const [form] = Form.useForm();
  const dispatch = useDispatch();

  const handleSearch = (values) => {
    const query = {
      keyword: values.keyword || undefined,
      tuNgay: values.tuNgay
        ? dayjs(values.tuNgay).format("YYYY-MM-DD")
        : undefined,
      denNgay: values.denNgay
        ? dayjs(values.denNgay).format("YYYY-MM-DD")
        : undefined,
      kieu:
        values.kieu !== undefined && values.kieu !== ""
          ? values.kieu
          : undefined,
      loaiGiamGia: convertLoaiGiamGiaToBoolean(values.loaiGiamGia),
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
    dispatch(searchPhieuGiamGia(cleanQuery));
  };

  const convertLoaiGiamGiaToBoolean = (loaiGiamGia) => {
    if (loaiGiamGia === "Tiền mặt") return true;
    if (loaiGiamGia === "Phần trăm") return false;
    return undefined;
  };

  const handleReset = () => {
    form.resetFields();
    dispatch(fetchPhieuGiamGia());
  };

  return (
    <>
      <div className=" bg-white  rounded-lg shadow overflow-hidden">
        <div className="bg-[#E67E22] text-white px-6 py-2">
          <div className="font-bold text-2xl text-white ">
            Bộ Lọc Phiếu Giảm
          </div>
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
                  <Input placeholder="Nhập mã hoặc tên...." />
                </Form.Item>
              </Col>

              <Col flex="1">
                <Form.Item name="tuNgay" label="Từ ngày">
                  <DatePicker className="w-full" format="DD/MM/YYYY" />
                </Form.Item>
              </Col>

              <Col flex="1">
                <Form.Item name="denNgay" label="Đến ngày">
                  <DatePicker className="w-full" format="DD/MM/YYYY" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col flex="1">
                <Form.Item name="kieu" label="Kiểu">
                  <Select placeholder="Chọn kiểu" allowClear>
                    <Option value={0}>Công khai</Option>
                    <Option value={1}>Cá nhân</Option>
                  </Select>
                </Form.Item>
              </Col>

              <Col flex="1">
                <Form.Item name="loaiGiamGia" label="Loại giảm giá">
                  <Select placeholder="Chọn loại giảm giá" allowClear>
                    <Option value="Phần trăm">Phần trăm</Option>
                    <Option value="Tiền mặt">Tiền mặt</Option>
                  </Select>
                </Form.Item>
              </Col>

              <Col flex="1">
                <Form.Item name="trangThai" label="Trạng thái">
                  <Select placeholder="Chọn trạng thái" allowClear>
                    <Option value={true}>Đang diễn ra</Option>
                    <Option value={false}>Đã kết thúc</Option>
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
      </div>
    </>
  );
}
