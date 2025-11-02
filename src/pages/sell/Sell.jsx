  import React, { useState } from "react";
  import {
    Card,
    Row,
    Col,
    Table,
    Input,
    Button,
    Space,
    Typography,
    message,
    Form,
    Modal,
    Select,
  } from "antd";
  import {
    DeleteOutlined,
    ShoppingCartOutlined,
    FileAddOutlined,
    UserAddOutlined,
  } from "@ant-design/icons";
  import hoaDonApi from "@/api/HoaDonAPI";
  import TableSanPhamBanHang from "@/pages/sell/TableSanPhamBanHang";

  const { Title, Text } = Typography;

  export default function BanHang() {
    const [hoaDon, setHoaDon] = useState(null);
    const [hoaDonCho, setHoaDonCho] = useState([]);
    const [chiTietHD, setChiTietHD] = useState([]);
    const [sanPhamId, setSanPhamId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [formKH] = Form.useForm();

    const handleTaoHoaDon = async () => {
      try {
        const res = await hoaDonApi.createHoaDonMoi();
        setHoaDon(res.data);
        setChiTietHD([]);
        message.success(`Tạo hóa đơn mới: ${res.data.maHoaDon}`);
      } catch {
        message.error("Không thể tạo hóa đơn mới");
      }
    };

    const handleAddProduct = async (sp) => {
      if (!hoaDon) return message.warning("Vui lòng tạo hóa đơn trước!");
      try {
        setLoading(true);
        const res = await hoaDonApi.addSanPham(hoaDon.id, sp.id, 1);
        setChiTietHD(res.data.hoaDonChiTiets || []);
        message.success(`Đã thêm ${sp.tenSanPham}`);
      } catch {
        message.error("Lỗi thêm sản phẩm!");
      } finally {
        setLoading(false);
      }
    };

    const handleDelete = async (id) => {
      try {
        await hoaDonApi.xoaSanPham(id);
        setChiTietHD(chiTietHD.filter((i) => i.id !== id));
        message.success("Đã xóa sản phẩm");
      } catch {
        message.error("Không xóa được sản phẩm");
      }
    };

    const handleThanhToan = async (values) => {
      Modal.confirm({
        title: "Xác nhận thanh toán?",
        icon: <ShoppingCartOutlined />,
        onOk: async () => {
          try {
            await hoaDonApi.thanhToan(hoaDon.id, values);
            message.success("Thanh toán thành công!");
            setHoaDon(null);
            setChiTietHD([]);
            formKH.resetFields();
          } catch {
            message.error("Thanh toán thất bại!");
          }
        },
      });
    };

    const tongTien = chiTietHD.reduce((sum, i) => sum + i.thanhTien, 0);

    const columnsCart = [
      { title: "#", render: (_, __, index) => index + 1 },
      { title: "Tên sản phẩm", dataIndex: "tenSanPham" },
      { title: "Số lượng", dataIndex: "soLuong" },
      {
        title: "Giá",
        dataIndex: "giaBan",
        render: (v) => v.toLocaleString() + " ₫",
      },
      {
        title: "Thành tiền",
        dataIndex: "thanhTien",
        render: (v) => v.toLocaleString() + " ₫",
      },
      {
        title: "Thao tác",
        render: (record) => (
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          />
        ),
      },
    ];

    return (
      <div className="banhang-container">
        <Title level={3} style={{ color: "#2c7a7b" }}>
          Quản Lý Bán Hàng
        </Title>

        <Row gutter={16}>
          <Col span={16}>
            <Card>
              <Space style={{ width: "100%" }}>
                <Input.Search
                  placeholder="Nhập ID sản phẩm..."
                  enterButton="Xem chi tiết"
                  onSearch={(id) => setSanPhamId(id)}
                />
                <Button
                  type="primary"
                  icon={<FileAddOutlined />}
                  onClick={handleTaoHoaDon}
                >
                  Tạo hóa đơn
                </Button>
              </Space>
            </Card>

            <Card title="Sản phẩm trong giỏ hàng" className="mt-2">
              <Table
                rowKey="id"
                columns={columnsCart}
                dataSource={chiTietHD}
                pagination={false}
              />
              <div className="flex justify-end mt-2">
                <Text strong>Tổng tiền: {tongTien.toLocaleString()} ₫</Text>
              </div>
            </Card>
          </Col>

          <Col span={8}>
            <Card title="Khách hàng">
              <Form layout="vertical" form={formKH} onFinish={handleThanhToan}>
                <Form.Item
                  label="Tên khách hàng"
                  name="tenKhachHang"
                  rules={[{ required: true, message: "Nhập tên khách hàng" }]}
                >
                  <Input prefix={<UserAddOutlined />} />
                </Form.Item>
                <Form.Item
                  label="Số điện thoại"
                  name="sdt"
                  rules={[{ required: true, message: "Nhập số điện thoại" }]}
                >
                  <Input type="number" prefix="+84" />
                </Form.Item>
                <Button type="primary" block htmlType="submit">
                  Thanh toán
                </Button>
              </Form>
            </Card>
          </Col>
        </Row>

        <Card
          title="Chi tiết sản phẩm"
          style={{ marginTop: 20 }}
          bodyStyle={{ paddingTop: 10 }}
        >
          <TableSanPhamBanHang
            sanPhamId={sanPhamId}
            onAddProduct={handleAddProduct}
          />
        </Card>
      </div>
    );
  }
