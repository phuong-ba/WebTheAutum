import React, { useState, useEffect } from "react";
import {
  Card,
  Row,
  Col,
  Table,
  Input,
  Button,
  Typography,
  message,
  Form,
  Select,
  Divider,
} from "antd";
import {
  DeleteOutlined,
  ShoppingCartOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { useDispatch } from "react-redux";
import banHangApi from "@/api/banHangApi";
import TableSanPhamBanHang from "@/pages/sell/TableSanPhamBanHang";
import { fetchAllKhachHang } from "@/services/khachHangService";

const { Title, Text } = Typography;

export default function Sell() {
  const [chiTietHD, setChiTietHD] = useState([]);
  const [hoaDonId, setHoaDonId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dsKhachHang, setDsKhachHang] = useState([]);
  const [formKH] = Form.useForm();
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchAllKhachHang())
      .unwrap()
      .then((res) => {
        if (res?.isSuccess) setDsKhachHang(res.data);
      })
      .catch(() => message.error("Lỗi load danh sách khách hàng"));
  }, [dispatch]);

  const tongTien = chiTietHD.reduce((sum, i) => sum + (i.thanhTien || 0), 0);

  const handleTaoHoaDon = async () => {
    try {
      setLoading(true);
      const res = await banHangApi.createHoaDonMoi();
      if (res.data.isSuccess) {
        setHoaDonId(res.data.data.id);
        setChiTietHD([]);
        message.success("Đã tạo hóa đơn rỗng");
      } else {
        message.error(res.data.message);
      }
    } catch (error) {
      console.error(error);
      message.error("Tạo hóa đơn thất bại");
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async (sp) => {
    if (!hoaDonId) {
      message.warning("Vui lòng tạo hóa đơn trước!");
      return;
    }

    try {
      setLoading(true);
      const res = await banHangApi.addSanPham(hoaDonId, sp.id, 1);
      if (res.data.isSuccess) {
        const existIndex = chiTietHD.findIndex(
          (i) => i.chiTietSanPham.id === sp.id
        );
        const updatedCart = [...chiTietHD];
        const giaBan = sp.giaBan;

        if (existIndex >= 0) {
          updatedCart[existIndex].soLuong += 1;
          updatedCart[existIndex].thanhTien =
            updatedCart[existIndex].soLuong * giaBan;
        } else {
          updatedCart.push({
            id: Date.now(),
            chiTietSanPham: sp,
            tenSanPham: sp.tenSanPham,
            soLuong: 1,
            giaBan,
            thanhTien: giaBan,
          });
        }
        setChiTietHD(updatedCart);
        message.success(`Đã thêm ${sp.tenSanPham}`);
      } else {
        message.error(res.data.message);
      }
    } catch (error) {
      console.error(error);
      message.error("Thêm sản phẩm thất bại!");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, chiTietSanPhamId) => {
    try {
      setLoading(true);
      await banHangApi.xoaSanPham(id);
      setChiTietHD(
        chiTietHD.filter((i) => i.chiTietSanPham.id !== chiTietSanPhamId)
      );
      message.success("Đã xóa sản phẩm khỏi giỏ hàng");
    } catch (error) {
      console.error(error);
      message.error("Xóa thất bại");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckoutCart = async (values) => {
    if (!hoaDonId || chiTietHD.length === 0) {
      message.warning("Giỏ hàng trống hoặc chưa tạo hóa đơn!");
      return;
    }

    try {
      setLoading(true);
      const res = await banHangApi.thanhToan(hoaDonId, values);
      if (res.data.isSuccess) {
        message.success("Thanh toán thành công!");
        setChiTietHD([]);
        setHoaDonId(null);
        formKH.resetFields();
      } else {
        message.error(res.data.message);
      }
    } catch (error) {
      console.error(error);
      message.error("Thanh toán thất bại");
    } finally {
      setLoading(false);
    }
  };

  const columnsCart = [
    {
      title: "#",
      key: "stt",
      render: (_, __, idx) => idx + 1,
      width: 60,
      align: "center",
    },
    { title: "Tên sản phẩm", dataIndex: "tenSanPham" },
    {
      title: "SL",
      dataIndex: "soLuong",
      align: "center",
      width: 80,
    },
    {
      title: "Đơn giá",
      dataIndex: "giaBan",
      render: (v) => v?.toLocaleString() + " ₫",
      align: "right",
      width: 120,
    },
    {
      title: "Thành tiền",
      dataIndex: "thanhTien",
      render: (v) => v?.toLocaleString() + " ₫",
      align: "right",
      width: 150,
    },
    {
      title: "Thao tác",
      key: "action",
      align: "center",
      width: 80,
      render: (record) => (
        <Button
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleDelete(record.id, record.chiTietSanPham.id)}
        />
      ),
    },
  ];

  return (
    <div style={{ padding: 20 }}>
      <Title level={3}>Bán hàng</Title>

      <Row gutter={16}>
        {/* GIỎ HÀNG */}
        <Col span={17}>
          <Card
            title="Giỏ hàng"
            extra={
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleTaoHoaDon}
                loading={loading}
              >
                Tạo hóa đơn
              </Button>
            }
          >
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
        </Col>

        {/* THÔNG TIN KHÁCH HÀNG */}
        <Col span={7}>
          <Card title="Thông tin khách hàng">
            <Form
              layout="vertical"
              form={formKH}
              onFinish={handleCheckoutCart}
            >
              <Form.Item label="Khách hàng" name="tenKhachHang">
                <Select
                  showSearch
                  placeholder="Chọn khách hàng"
                  allowClear
                  options={dsKhachHang.map((kh) => ({
                    label: kh.tenKhachHang,
                    value: kh.tenKhachHang,
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
        </Col>
      </Row>

      {/* DANH SÁCH SẢN PHẨM */}
      <Card title="Danh sách sản phẩm" style={{ marginTop: 20 }}>
        <TableSanPhamBanHang onAddProduct={handleAddProduct} />
      </Card>
    </div>
  );
}
