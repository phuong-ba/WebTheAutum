import React from "react";
import { Card, Table, Divider, Typography, Button, Form, Input, Select } from "antd";
import { DeleteOutlined, ShoppingCartOutlined } from "@ant-design/icons";

const { Text } = Typography;

export default function CartPanel({
  hoaDon,
  chiTietHD,
  loading,
  tongTien,
  dsKhachHang,
  formKH,
  onDeleteItem,
  onCheckout,
}) {
  const columnsCart = [
    { title: "#", key: "stt", render: (_, __, idx) => idx + 1, width: 60, align: "center" },
    { title: "Tên sản phẩm", dataIndex: "tenSanPham", render: (val) => val || "-" },
    { title: "SL", dataIndex: "soLuong", align: "center", render: (val) => val || "-", width: 80 },
    { title: "Đơn giá", dataIndex: "giaBan", align: "right", render: (val) => val?.toLocaleString() + " ₫" || "-", width: 120 },
    {
      title: "Thao tác",
      key: "action",
      align: "center",
      width: 80,
      render: (record) => (
        <Button
          danger
          icon={<DeleteOutlined />}
          onClick={() => onDeleteItem(record.id, record.chiTietSanPham.id)}
        />
      ),
    },
  ];

  return (
    <div>
      <Card title={`Giỏ hàng ${hoaDon ? `(Hóa đơn #${hoaDon.id})` : ""}`}>
        {hoaDon && (
          <div style={{ marginBottom: 10 }}>
            <Text strong>Ngày tạo: </Text>
            <Text>{new Date(hoaDon.ngayTao).toLocaleString()}</Text>
          </div>
        )}

        <Table
          rowKey="id"
          columns={columnsCart}
          dataSource={chiTietHD}
          pagination={false}
          loading={loading}
          locale={{ emptyText: "Chưa có sản phẩm" }}
          scroll={{ y: 300 }}
        />
        <Divider />
        <div style={{ textAlign: "right" }}>
          <Text strong>Tổng: {tongTien.toLocaleString()} ₫</Text>
        </div>
      </Card>

      <Card title="Thông tin khách hàng" style={{ marginTop: 16 }}>
        <Form layout="vertical" form={formKH} onFinish={onCheckout}>
          <Form.Item label="Khách hàng" name="hoTen">
            <Select
              showSearch
              placeholder="Chọn khách hàng"
              allowClear
              options={dsKhachHang.map((kh) => ({
                label: kh.hoTen,
                value: kh.hoTen,
              }))}
            />
          </Form.Item>

          <Form.Item label="SĐT" name="sdt">
            <Input placeholder="Nhập số điện thoại" />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              block
              icon={<ShoppingCartOutlined />}
              htmlType="submit"
              loading={loading}
            >
              Thanh toán
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
