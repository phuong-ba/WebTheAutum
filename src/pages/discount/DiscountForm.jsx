import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Form,
  Input,
  InputNumber,
  DatePicker,
  Radio,
  Button,
  Table,
  Card,
  message,
} from "antd";
import { fetchAllKhachHang } from "@/services/khachHangService";
export default function DiscountForm({ onCancel, onSave }) {
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const { data, loading } = useSelector((state) => state.khachHang);
  const [khachHangs, setKhachHangs] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [kieu, setKieu] = useState("0");
  useEffect(() => {
    dispatch(fetchAllKhachHang());
  }, [dispatch]);
  useEffect(() => {
    if (Array.isArray(data)) setKhachHangs(data);
  }, [data]);
  const handleSubmit = (values) => {
    if (values.kieu === "1" && selectedIds.length === 0) {
      message.warning("Vui lòng chọn ít nhất 1 khách hàng cho phiếu cá nhân!");
      return;
    }
    message.success("Đã lưu phiếu giảm giá!");
    onSave?.({ ...values, khachHangIds: selectedIds });
  };
  const rowSelection = {
    selectedRowKeys: selectedIds,
    onChange: (keys) => setSelectedIds(keys),
    getCheckboxProps: () => ({ disabled: kieu === "0" }),
  };
  const columns = [
    { title: "Tên", dataIndex: "hoTen", key: "hoTen" },
    { title: "Số điện thoại", dataIndex: "sdt", key: "sdt" },
    { title: "Email", dataIndex: "email", key: "email" },
    { title: "Giới tính", dataIndex: "gioiTinh", key: "gioiTinh" },
  ];
  return (
    <Card
      title={
        <span className="text-lg font-semibold text-orange-600">
          {" "}
          Tạo phiếu giảm giá{" "}
        </span>
      }
      className="shadow-md rounded-2xl bg-white"
    >
      {" "}
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{ loaiGiamGia: "%", soLuong: 0, kieu: "0" }}
      >
        {" "}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {" "}
          <div className="space-y-4">
            {" "}
            <Form.Item
              name="maGiamGia"
              label="Mã phiếu giảm giá"
              rules={[{ required: true, message: "Vui lòng nhập mã phiếu" }]}
            >
              {" "}
              <Input placeholder="Nhập mã phiếu giảm giá" />{" "}
            </Form.Item>{" "}
            <Form.Item
              name="tenChuongTrinh"
              label="Tên phiếu giảm giá"
              rules={[{ required: true, message: "Vui lòng nhập tên phiếu" }]}
            >
              {" "}
              <Input placeholder="Nhập tên chương trình" />{" "}
            </Form.Item>{" "}
            <div className="grid grid-cols-2 gap-3">
              {" "}
              <Form.Item
                name="giaTriGiamGia"
                label="Giá trị giảm"
                rules={[{ required: true, message: "Nhập giá trị giảm" }]}
              >
                {" "}
                <InputNumber min={0} className="w-full" />{" "}
              </Form.Item>{" "}
              <Form.Item name="loaiGiamGia" label="Loại">
                {" "}
                <Radio.Group>
                  {" "}
                  <Radio value="%">%</Radio> <Radio value="vnd">₫</Radio>{" "}
                </Radio.Group>{" "}
              </Form.Item>{" "}
            </div>{" "}
            <div className="grid grid-cols-2 gap-3">
              {" "}
              <Form.Item
                name="mucGiaGiamToiDa"
                label="Giá trị tối đa"
                rules={[{ required: true, message: "Nhập giá trị tối đa" }]}
              >
                {" "}
                <InputNumber min={0} className="w-full" />{" "}
              </Form.Item>{" "}
              <Form.Item
                name="soLuong"
                label="Số lượng"
                rules={[{ required: true, message: "Nhập số lượng" }]}
              >
                {" "}
                <InputNumber min={0} className="w-full" />{" "}
              </Form.Item>{" "}
            </div>{" "}
            <Form.Item name="giaTriDonHangToiThieu" label="Giá trị tối thiểu">
              {" "}
              <InputNumber min={0} className="w-full" />{" "}
            </Form.Item>{" "}
            <div className="grid grid-cols-2 gap-3">
              {" "}
              <Form.Item
                name="ngayBatDau"
                label="Từ ngày"
                rules={[{ required: true, message: "Chọn ngày bắt đầu" }]}
              >
                {" "}
                <DatePicker
                  showTime
                  className="w-full"
                  format="DD-MM-YYYY"
                />{" "}
              </Form.Item>{" "}
              <Form.Item
                name="ngayKetThuc"
                label="Đến ngày"
                rules={[{ required: true, message: "Chọn ngày kết thúc" }]}
              >
                {" "}
                <DatePicker
                  showTime
                  className="w-full"
                  format="DD-MM-YYYY"
                />{" "}
              </Form.Item>{" "}
            </div>{" "}
            <Form.Item name="kieu" label="Kiểu">
              {" "}
              <Radio.Group
                onChange={(e) => {
                  setKieu(e.target.value);
                  if (e.target.value === "0") setSelectedIds([]);
                }}
              >
                {" "}
                <Radio value="0">Công khai</Radio>{" "}
                <Radio value="1">Cá nhân</Radio>{" "}
              </Radio.Group>{" "}
            </Form.Item>{" "}
          </div>{" "}
          <div>
            {" "}
            <div className="flex items-center justify-between mb-2">
              {" "}
              <h3 className="font-semibold text-gray-700">
                {" "}
                Danh sách khách hàng áp dụng{" "}
              </h3>{" "}
              <Input.Search
                placeholder="Tìm kiếm khách hàng"
                className="w-64"
                allowClear
                onSearch={(val) => {
                  const filtered = data.filter((k) =>
                    k.hoTen.toLowerCase().includes(val.toLowerCase())
                  );
                  setKhachHangs(filtered);
                }}
              />{" "}
            </div>{" "}
            <Table
              rowKey="id"
              columns={columns}
              dataSource={khachHangs}
              rowSelection={rowSelection}
              pagination={{ pageSize: 10 }}
              size="small"
              loading={loading}
              className={kieu === "0" ? "opacity-60 pointer-events-none" : ""}
            />{" "}
          </div>{" "}
        </div>{" "}
        <div className="flex justify-end gap-3 mt-6">
          {" "}
          <Button onClick={onCancel}>Hủy</Button>{" "}
          <Button type="primary" htmlType="submit" onClick={handleSubmit}>
            {" "}
            Lưu{" "}
          </Button>{" "}
        </div>{" "}
      </Form>{" "}
    </Card>
  );
}
