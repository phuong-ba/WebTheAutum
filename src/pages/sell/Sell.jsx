import React, { useState, useEffect } from "react";
import { 
  Row, 
  Col, 
  Card, 
  Button, 
  Typography, 
  message, 
  Form, 
  Divider,
  Space,
  Tag,
  Statistic,
  Badge
} from "antd";
import { 
  PlusOutlined, 
  ShoppingCartOutlined, 
  FileTextOutlined,
  UserOutlined 
} from "@ant-design/icons";
import { useDispatch } from "react-redux";
import banHangApi from "@/api/banHangApi";
import TableSanPhamBanHang from "@/pages/sell/TableSanPhamBanHang";
import { fetchAllKhachHang } from "@/services/khachHangService";
import Cart from "./Cart";

const { Title, Text } = Typography;

export default function Sell() {
  const [hoaDon, setHoaDon] = useState(null);
  const [chiTietHD, setChiTietHD] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dsKhachHang, setDsKhachHang] = useState([]);
  const [formKH] = Form.useForm();
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchAllKhachHang())
      .unwrap()
      .then((res) => res?.isSuccess && setDsKhachHang(res.data))
      .catch(() => message.error("Lỗi load danh sách khách hàng"));
  }, [dispatch]);

  const tongTien = chiTietHD.reduce((sum, i) => sum + (i.thanhTien || 0), 0);
  const soLuongSP = chiTietHD.reduce((sum, i) => sum + (i.soLuong || 0), 0);

  const handleTaoHoaDon = async () => {
    try {
      setLoading(true);
      const res = await banHangApi.createHoaDonMoi();
      if (res.data.isSuccess) {
        const hd = res.data.data;
        const hdChiTiet = hd.hoaDonChiTiets || [];
        setHoaDon(hd);
        setChiTietHD(
          hdChiTiet.map((i) => ({
            id: i.id,
            chiTietSanPham: i.chiTietSanPham,
            tenSanPham: i.chiTietSanPham.tenSanPham,
            soLuong: i.soLuong,
            giaBan: i.giaBan,
            thanhTien: i.thanhTien,
          }))
        );
        message.success(`Đã tạo hóa đơn #${hd.id}`);
      } else message.error(res.data.message);
    } catch (error) {
      console.error(error);
      message.error("Tạo hóa đơn thất bại");
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async (sp) => {
    if (!hoaDon) return message.warning("Vui lòng tạo hóa đơn trước!");
    try {
      setLoading(true);
      const res = await banHangApi.addSanPham(hoaDon.id, sp.id, 1);
      if (res.data.isSuccess) {
        const hd = res.data.data;
        const hdChiTiet = hd.hoaDonChiTiets || [];
        setHoaDon(hd);
        setChiTietHD(
          hdChiTiet.map((i) => ({
            id: i.id,
            chiTietSanPham: i.chiTietSanPham,
            tenSanPham: i.chiTietSanPham.tenSanPham,
            soLuong: i.soLuong,
            giaBan: i.giaBan,
            thanhTien: i.thanhTien,
          }))
        );
        message.success(`Đã thêm ${sp.tenSanPham} vào hóa đơn`);
      } else message.error(res.data.message);
    } catch (error) {
      console.error(error);
      message.error("Thêm sản phẩm thất bại!");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async (idHDCT, chiTietSanPhamId) => {
    try {
      setLoading(true);
      const res = await banHangApi.xoaSanPham(idHDCT);
      if (res.data.isSuccess) {
        setChiTietHD((prev) => prev.filter((i) => i.chiTietSanPham.id !== chiTietSanPhamId));
        message.success("Đã xóa sản phẩm khỏi giỏ hàng");
      } else message.error(res.data.message);
    } catch (error) {
      console.error(error);
      message.error("Xóa thất bại");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckoutCart = async (values) => {
    if (!hoaDon || chiTietHD.length === 0) return message.warning("Giỏ hàng trống hoặc chưa tạo hóa đơn!");
    try {
      setLoading(true);
      const res = await banHangApi.thanhToan(hoaDon.id, values.hoTen, values.sdt);
      if (res.data.isSuccess) {
        message.success("Thanh toán thành công!");
        setChiTietHD([]);
        setHoaDon(null);
        formKH.resetFields();
      } else message.error(res.data.message);
    } catch (error) {
      console.error(error);
      message.error("Thanh toán thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px', background: '#f5f5f5', minHeight: '100vh' }}>
      <div style={{ marginBottom: 24 }}>
        <Space align="center" style={{ marginBottom: 16 }}>
          <ShoppingCartOutlined style={{ fontSize: 28, color: '#1890ff' }} />
          <Title level={2} style={{ margin: 0, color: '#1890ff' }}>Bán Hàng</Title>
        </Space>
        
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={8}>
            <Card size="small">
              <Statistic
                title="Trạng thái"
                value={hoaDon ? "Đang bán" : "Chưa có hóa đơn"}
                valueStyle={{ color: hoaDon ? '#52c41a' : '#faad14' }}
                prefix={hoaDon ? <FileTextOutlined /> : <UserOutlined />}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small">
              <Statistic
                title="Số lượng sản phẩm"
                value={soLuongSP}
                prefix={<ShoppingCartOutlined />}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small">
              <Statistic
                title="Tổng tiền"
                value={tongTien}
                precision={0}
                valueStyle={{ color: '#cf1322' }}
                prefix="₫"
                suffix={
                  <Badge 
                    count={chiTietHD.length} 
                    style={{ backgroundColor: '#52c41a' }}
                  />
                }
              />
            </Card>
          </Col>
        </Row>
      </div>

      <Row gutter={24}>
        {/* Phần giỏ hàng và thông tin khách hàng */}
        <Col span={16}>
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <Card 
              title={
                <Space>
                  <FileTextOutlined />
                  <Text strong>Quản lý hóa đơn</Text>
                  {hoaDon && (
                    <Tag color="blue">Hóa đơn #{hoaDon.id}</Tag>
                  )}
                </Space>
              }
              extra={
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleTaoHoaDon}
                  loading={loading}
                  size="large"
                >
                  Tạo hóa đơn mới
                </Button>
              }
            >
              <Cart
                hoaDon={hoaDon}
                chiTietHD={chiTietHD}
                loading={loading}
                tongTien={tongTien}
                dsKhachHang={dsKhachHang}
                formKH={formKH}
                onDeleteItem={handleDeleteItem}
                onCheckout={handleCheckoutCart}
              />
            </Card>
          </Space>
        </Col>

        {/* Phần danh sách sản phẩm */}
        <Col span={8}>
          <Card 
            title={
              <Space>
                <ShoppingCartOutlined />
                <Text strong>Danh sách sản phẩm</Text>
              </Space>
            }
            style={{ height: 'fit-content' }}
            headStyle={{ background: '#fafafa' }}
          >
            <TableSanPhamBanHang onAddProduct={handleAddProduct} />
          </Card>
        </Col>
      </Row>
    </div>
  );
}