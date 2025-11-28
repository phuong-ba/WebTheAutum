import React, { useEffect, useState } from "react";
import { Form, Input, Select, Radio, message, Spin } from "antd";
import { NavLink, useNavigate } from "react-router-dom";
import ClientBreadcrumb from "../ClientBreadcrumb";
import { formatVND } from "@/api/formatVND";
import TextArea from "antd/es/input/TextArea";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { addOrder } from "@/services/orderService";
import { fetchPhieuGiamGia } from "@/services/phieuGiamGiaService";

const { Option } = Select;
const API_BASE = "https://provinces.open-api.vn/api/v2";

export default function CheckOut() {
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { data } = useSelector((state) => state.phieuGiamGia);

  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [shippingFee, setShippingFee] = useState(20000);
  const [paymentMethod, setPaymentMethod] = useState("cod");

  const [provinces, setProvinces] = useState([]);
  const [wards, setWards] = useState([]);

  const [appliedVoucher, setAppliedVoucher] = useState(null); // voucher áp dụng tự động

  useEffect(() => {
    dispatch(fetchPhieuGiamGia());
  }, [dispatch]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    setCartItems(cart);
  }, []);

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.giaSauGiam * item.quantity,
    0
  );

  const discountAmount = appliedVoucher?.soTienGiam || 0;
  const total = subtotal + shippingFee - discountAmount;

  useEffect(() => {
    fetchProvinces();
  }, []);

  const fetchProvinces = async () => {
    try {
      const res = await axios.get(`${API_BASE}/p/`);
      setProvinces(res.data || []);
    } catch {
      messageApi.error("Không tải được danh sách tỉnh/thành");
    }
  };

  const handleProvinceChange = async (provinceCode) => {
    form.setFieldsValue({ ward: undefined });
    setWards([]);
    try {
      const res = await axios.get(`${API_BASE}/p/${provinceCode}?depth=2`);
      setWards(res.data.wards || []);
    } catch {
      messageApi.error("Không tải được phường/xã");
    }
  };

  const applyBestVoucher = () => {
    if (!data || data.length === 0) return;

    const khachHangId = localStorage.getItem("customer_id");

    const validVouchers = data.filter((v) => {
      if (v.trangThai !== 1) return false;
      if (v.soLuongDung <= 0) return false;
      if (subtotal < v.giaTriDonHangToiThieu) return false;
      if (v.kieu === 1 && !khachHangId) return false;
      return true;
    });

    if (validVouchers.length === 0) return;

    const vouchersWithDiscount = validVouchers.map((v) => {
      const discount =
        v.loaiGiamGia === false
          ? Math.min((subtotal * v.giaTriGiamGia) / 100, v.mucGiaGiamToiDa)
          : v.giaTriGiamGia;
      return { ...v, discount };
    });

    const bestVoucher = vouchersWithDiscount.reduce((max, v) =>
      v.discount > max.discount ? v : max
    );

    setAppliedVoucher({
      id: bestVoucher.id,
      tenChuongTrinh: bestVoucher.tenChuongTrinh,
      soTienGiam: bestVoucher.discount,
    });

    messageApi.success(
      `Áp dụng tự động voucher giảm nhiều nhất: ${bestVoucher.tenChuongTrinh}`
    );
  };

  useEffect(() => {
    applyBestVoucher();
  }, [data, subtotal]);

  const removeVoucher = () => {
    setAppliedVoucher(null);
    messageApi.info("Đã xóa mã giảm giá");
  };

  const onFinish = async (values) => {
    if (cartItems.length === 0) {
      messageApi.error("Giỏ hàng trống!");
      return;
    }

    setLoading(true);

    const orderRequest = {
      khachHangId: null,
      phieuGiamGiaId: appliedVoucher?.id || null,
      hoTen: values.HoTen,
      sdt: values.SoDienThoai,
      diaChiKhachHang: values.DiaChi,
      tinhId: values.province || null,
      quanId: values.ward || null,
      email: values.Email || null,
      tongTien: subtotal,
      tienGiam: discountAmount,
      phiVanChuyen: shippingFee,
      paymentMethod: paymentMethod === "bank" ? "Chuyển khoản" : "Tiền mặt",
      items: cartItems.map((item) => ({
        id: item.id,
        quantity: item.quantity,
      })),
    };

    try {
      const result = await dispatch(addOrder(orderRequest)).unwrap();

      messageApi.success(result.message || "Đặt hàng thành công!");
      localStorage.removeItem("cart");
      setCartItems([]);

      const { hoaDon, paymentUrl } = result.data || {};

      if (paymentMethod === "bank" && paymentUrl) {
        window.location.href = paymentUrl;
      } else {
        navigate(`/order-success?code=${hoaDon.maHoaDon}`);
      }
    } catch (error) {
      messageApi.error(error.message || error || "Đặt hàng thất bại!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {contextHolder}
      <Spin spinning={loading}>
        <div className="flex flex-col gap-10 py-10 max-w-7xl mx-auto px-4">
          <div>
            <h1 className="text-3xl font-bold">Thanh toán</h1>
            <ClientBreadcrumb />
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Form thông tin */}
            <div className="lg:col-span-2">
              <div className="bg-white shadow-lg rounded-lg p-8">
                <h2 className="text-2xl font-bold mb-6">Thông tin giao hàng</h2>
                <Form form={form} layout="vertical" onFinish={onFinish}>
                  <div className="grid md:grid-cols-2 gap-4">
                    <Form.Item
                      name="HoTen"
                      label="Họ tên người nhận"
                      rules={[
                        { required: true, message: "Vui lòng nhập họ tên" },
                      ]}
                    >
                      <Input size="large" />
                    </Form.Item>
                    <Form.Item
                      name="SoDienThoai"
                      label="Số điện thoại"
                      rules={[
                        {
                          required: true,
                          message: "Vui lòng nhập số điện thoại",
                        },
                        {
                          pattern: /^0\d{9}$/,
                          message: "Số điện thoại không hợp lệ",
                        },
                      ]}
                    >
                      <Input size="large" />
                    </Form.Item>
                  </div>

                  <Form.Item name="Email" label="Email (không bắt buộc)">
                    <Input type="email" size="large" />
                  </Form.Item>

                  <div className="grid md:grid-cols-2 gap-4">
                    <Form.Item name="province" label="Tỉnh/Thành phố">
                      <Select
                        placeholder="Chọn tỉnh/thành"
                        onChange={handleProvinceChange}
                        showSearch
                        optionFilterProp="children"
                        size="large"
                      >
                        {provinces.map((p) => (
                          <Option key={p.code} value={p.code}>
                            {p.name}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                    <Form.Item name="ward" label="Phường/Xã">
                      <Select
                        placeholder="Chọn phường/xã"
                        disabled={!wards.length}
                        showSearch
                        optionFilterProp="children"
                        size="large"
                      >
                        {wards.map((w) => (
                          <Option key={w.code} value={w.code}>
                            {w.name}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </div>

                  <Form.Item
                    name="DiaChi"
                    label="Địa chỉ chi tiết (số nhà, đường...)"
                    rules={[
                      { required: true, message: "Vui lòng nhập địa chỉ" },
                    ]}
                  >
                    <Input size="large" placeholder="Ví dụ: 123 Nguyễn Trãi" />
                  </Form.Item>

                  <Form.Item name="note" label="Ghi chú đơn hàng">
                    <TextArea rows={3} placeholder="Ghi chú về đơn hàng..." />
                  </Form.Item>

                  <div className="mt-8">
                    <h3 className="text-lg font-semibold mb-4">
                      Phương thức thanh toán
                    </h3>
                    <Radio.Group
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      value={paymentMethod}
                      className="flex flex-col gap-4"
                    >
                      <Radio value="cod">
                        <div>
                          <strong>Thanh toán khi nhận hàng (COD)</strong>
                          <p className="text-gray-600 text-sm">
                            Quý khách trả tiền khi nhận hàng
                          </p>
                        </div>
                      </Radio>
                      <Radio value="bank">
                        <div>
                          <strong>Chuyển khoản ngân hàng (VNPAY)</strong>
                          <p className="text-gray-600 text-sm">
                            Thanh toán an toàn qua cổng VNPAY
                          </p>
                        </div>
                      </Radio>
                    </Radio.Group>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || cartItems.length === 0}
                    className="w-full mt-10 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xl py-5 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading
                      ? "Đang xử lý..."
                      : paymentMethod === "bank"
                      ? "Thanh toán qua VNPAY"
                      : "Đặt hàng ngay"}
                  </button>
                </Form>
              </div>
            </div>

            {/* Đơn hàng của bạn */}
            <div className="flex flex-col lg:sticky lg:top-6">
              <div className="bg-white shadow-xl rounded-xl p-8 border border-gray-100">
                <h2 className="text-2xl font-bold mb-6 text-gray-800">
                  Đơn hàng của bạn
                </h2>

                <div className="space-y-5 mb-6">
                  {cartItems.map((item) => (
                    <div
                      key={item.id + item.tenKichThuoc}
                      className="flex justify-between items-start py-3 border-b border-gray-200 last:border-0"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 text-base">
                          {item.tenSanPham}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          Size: {item.tenKichThuoc} × {item.quantity}
                        </div>
                      </div>
                      <div className="font-semibold text-gray-900 text-lg ml-4">
                        {formatVND(item.giaSauGiam * item.quantity)}
                      </div>
                    </div>
                  ))}
                </div>

                {appliedVoucher && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg flex justify-between items-center">
                    <div>
                      <span className="text-green-800 font-medium">
                        Đã áp dụng: {appliedVoucher.tenChuongTrinh}
                      </span>
                      <span className="text-green-600 block text-sm">
                        -{formatVND(appliedVoucher.soTienGiam)}
                      </span>
                    </div>
                  </div>
                )}

                <div className="border-t-2 border-gray-200 pt-6 space-y-4">
                  <div className="flex justify-between text-base">
                    <span className="text-gray-600">Tạm tính</span>
                    <span className="font-medium">{formatVND(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-base">
                    <span className="text-gray-600">Phí vận chuyển</span>
                    <span
                      className={
                        shippingFee === 0
                          ? "text-green-600 font-bold"
                          : "font-medium"
                      }
                    >
                      {shippingFee === 0 ? "Miễn phí" : formatVND(shippingFee)}
                    </span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-base">
                      <span className="text-green-600 font-medium">
                        Giảm giá
                      </span>
                      <span className="text-green-600 font-bold">
                        -{formatVND(discountAmount)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-5 border-t-2 border-orange-500">
                    <span className="text-xl font-bold text-gray-800">
                      Tổng cộng
                    </span>
                    <span className="text-3xl font-bold text-orange-600">
                      {formatVND(total)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 bg-gray-50 p-6 rounded-xl">
                <h4 className="font-semibold mb-4 text-lg">Phí vận chuyển</h4>
                <Radio.Group
                  value={shippingFee}
                  onChange={(e) => setShippingFee(e.target.value)}
                  className="space-y-3"
                >
                  <Radio value={20000} className="block">
                    Giao hàng tiêu chuẩn - 20.000đ
                  </Radio>
                  <Radio value={25000} className="block">
                    Giao hàng nhanh - 25.000đ
                  </Radio>
                  <Radio value={0} className="block">
                    Miễn phí vận chuyển
                  </Radio>
                </Radio.Group>
              </div>
            </div>
          </div>
        </div>
      </Spin>
    </>
  );
}
