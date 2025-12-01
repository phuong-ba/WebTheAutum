// CheckOut.js
import React, { useEffect, useState, useRef } from "react";
import { Form, Input, Select, Radio, message, Spin } from "antd";
import { useNavigate } from "react-router-dom";
import ClientBreadcrumb from "../ClientBreadcrumb";
import { formatVND } from "@/api/formatVND";
import TextArea from "antd/es/input/TextArea";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { addOrder } from "@/services/orderService";
import { fetchPhieuGiamGia } from "@/services/phieuGiamGiaService";
import { CheckCircleIcon, ShoppingBagIcon } from "@phosphor-icons/react";
import { getByIdKhachHang } from "@/services/khachHangService";
import {
  tinhPhiVanChuyen,
  fetchDonViVanChuyen,
} from "@/services/vanChuyenService";
import {
  setSelectedShipping,
  resetShippingFee,
} from "@/redux/slices/vanChuyenSlice";
import { diaChiApi } from "@/api/diaChiApi";

const { Option } = Select;

export default function CheckOut() {
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Redux selectors
  const { data: vouchers } = useSelector((state) => state.phieuGiamGia);
  const dataKhachHang = useSelector((state) => state.khachHang.dataById);
  const {
    phiVanChuyen: shippingFee,
    donViVanChuyen: shippingProviders,
    selectedShipping: selectedProvider,
    loading: shippingLoading,
    error: shippingError,
  } = useSelector((state) => state.vanChuyen);

  // State
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [formValues, setFormValues] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [appliedVoucher, setAppliedVoucher] = useState(null);
  const [provinceName, setProvinceName] = useState("");
  const [districtName, setDistrictName] = useState("");

  // Refs
  const lastShippingCalculationRef = useRef({
    province: null,
    district: null,
    address: null,
    provider: null,
    cartHash: null,
  });

  const idKhachHang = JSON.parse(localStorage.getItem("customer_id"));

  // Initial setup
  useEffect(() => {
    window.scrollTo(0, 0);
    dispatch(fetchDonViVanChuyen());
    dispatch(fetchPhieuGiamGia());

    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    setCartItems(cart);

    fetchProvinces();
  }, [dispatch]);

  // Load customer data
  useEffect(() => {
    if (idKhachHang) {
      dispatch(getByIdKhachHang(idKhachHang));
    }
  }, [idKhachHang, dispatch]);

  // Auto-select default shipping provider
  useEffect(() => {
    if (shippingProviders.length > 0 && !selectedProvider) {
      dispatch(setSelectedShipping("GHN"));
    }
  }, [shippingProviders, selectedProvider, dispatch]);

  // Auto-fill customer data
  useEffect(() => {
    if (dataKhachHang && idKhachHang) {
      const activeAddress =
        dataKhachHang.diaChi?.find((d) => d.trangThai === true) || {};

      form.setFieldsValue({
        HoTen: dataKhachHang.hoTen,
        SoDienThoai: dataKhachHang.sdt,
        Email: dataKhachHang.email || "",
        DiaChi: activeAddress.diaChiCuThe || "",
        province: activeAddress.tinhThanhId || undefined,
        district: activeAddress.quanHuyenId || undefined,
      });

      // Load province and district names
      if (activeAddress.tinhThanhId) {
        loadProvinceAndDistrictNames(
          activeAddress.tinhThanhId,
          activeAddress.quanHuyenId
        );
      }
    }
  }, [dataKhachHang, idKhachHang, form]);

  // Calculate totals
  const subtotal = cartItems.reduce(
    (sum, item) => sum + (item.giaSauGiam || item.gia || 0) * item.quantity,
    0
  );

  const discountAmount = appliedVoucher?.soTienGiam || 0;
  const total = subtotal + shippingFee - discountAmount;

  // Fetch provinces from your API (giống SellPay)
  const fetchProvinces = async () => {
    try {
      const res = await diaChiApi.getAllTinhThanh();
      setProvinces(res || []);
    } catch {
      messageApi.error("Không tải được danh sách tỉnh/thành");
    }
  };

  // Load province and district names
  const loadProvinceAndDistrictNames = async (provinceId, districtId) => {
    if (provinceId) {
      const province = provinces.find((p) => p.id == provinceId);
      if (province) {
        setProvinceName(province.tenTinh);

        // Load districts for this province
        try {
          const districtsRes = await diaChiApi.getQuanByTinh(provinceId);
          setDistricts(districtsRes || []);

          if (districtId) {
            const district = districtsRes.find((d) => d.id == districtId);
            if (district) {
              setDistrictName(district.tenQuan);
            }
          }
        } catch (err) {
          console.error("Error loading districts:", err);
        }
      }
    }
  };

  // Handle province change - giống SellPay
  const handleProvinceChange = async (provinceId) => {
    form.setFieldsValue({ district: undefined });
    setDistricts([]);
    setDistrictName("");

    const province = provinces.find((p) => p.id == provinceId);
    if (province) {
      setProvinceName(province.tenTinh);
    }

    try {
      const res = await diaChiApi.getQuanByTinh(provinceId);
      setDistricts(res || []);
    } catch (err) {
      console.error("Error loading districts:", err);
      messageApi.error("Không tải được danh sách quận/huyện");
    }

    dispatch(resetShippingFee());
  };

  // Handle district change - giống SellPay
  const handleDistrictChange = (districtId) => {
    const district = districts.find((d) => d.id == districtId);
    if (district) {
      setDistrictName(district.tenQuan);
    }
    dispatch(resetShippingFee());
  };

  // Parse product dimensions
  const parseProductValue = (value, defaultValue = 200) => {
    if (value === null || value === undefined) return defaultValue;
    if (typeof value === "number") return value;
    if (typeof value === "string") {
      return parseInt(value.replace(/[^\d]/g, ""), 10) || defaultValue;
    }
    return defaultValue;
  };

  // Calculate shipping fee - giống SellPay
  const calculateShippingFee = async () => {
    if (!selectedProvider || cartItems.length === 0) return;

    const values = form.getFieldsValue();
    if (!values.province || !values.district || !values.DiaChi) {
      return;
    }

    // Create hash
    const currentHash = JSON.stringify({
      province: values.province,
      district: values.district,
      address: values.DiaChi,
      provider: selectedProvider,
      cartItems: cartItems.map((item) => ({
        id: item.id,
        quantity: item.quantity,
      })),
    });

    if (lastShippingCalculationRef.current.cartHash === currentHash) {
      return;
    }

    lastShippingCalculationRef.current.cartHash = currentHash;

    try {
      // Prepare items
      const shippingItems = cartItems.map((item) => {
        const weight = parseProductValue(item.khoiLuong || item.weight, 250);
        const length = parseProductValue(item.chieuDai || item.length, 30);
        const width = parseProductValue(item.chieuRong || item.width, 20);
        const height = parseProductValue(item.chieuCao || item.height, 2);

        return {
          idChiTietSanPham: item.id,
          soLuong: item.quantity || 1,
          giaBan: item.giaSauGiam || item.giaBan || item.gia || 0,
          khoiLuong: weight,
          chieuDai: length,
          chieuRong: width,
          chieuCao: height,
        };
      });

      // Shop address - CẦN THAY ĐỔI THEO SHOP CỦA BẠN
      const requestData = {
        donViVanChuyen: selectedProvider,
        idTinhGui: 1, // Hà Nội - THAY ĐỔI
        idQuanGui: 1442, // Quận Đống Đa - THAY ĐỔI
        idTinhNhan: values.province,
        idQuanNhan: values.district,
        idPhuongNhan: null,
        diaChiCuThe: values.DiaChi,
        items: shippingItems,
      };

      await dispatch(tinhPhiVanChuyen(requestData)).unwrap();
    } catch (error) {
      console.error("Lỗi tính phí vận chuyển:", error);
    }
  };

  // Auto calculate shipping - giống SellPay
  useEffect(() => {
    if (selectedProvider && cartItems.length > 0) {
      const values = form.getFieldsValue();
      if (values.province && values.district && values.DiaChi) {
        const currentHash = JSON.stringify({
          province: values.province,
          district: values.district,
          address: values.DiaChi,
          provider: selectedProvider,
          cartItems: cartItems.map((item) => ({
            id: item.id,
            quantity: item.quantity,
          })),
        });

        if (lastShippingCalculationRef.current.cartHash !== currentHash) {
          lastShippingCalculationRef.current.cartHash = currentHash;
          const timer = setTimeout(() => {
            calculateShippingFee();
          }, 800);
          return () => clearTimeout(timer);
        }
      }
    }
  }, [form, cartItems, selectedProvider]);

  // Apply best voucher
  const applyBestVoucher = () => {
    if (!vouchers || vouchers.length === 0) return;

    const khachHangId = localStorage.getItem("customer_id");
    const validVouchers = vouchers.filter((v) => {
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
  };

  useEffect(() => {
    applyBestVoucher();
  }, [vouchers, subtotal]);

  // Handle shipping provider selection - giống SellPay
  const handleSelectShipping = (provider) => {
    dispatch(setSelectedShipping(provider));
    setTimeout(() => {
      calculateShippingFee();
    }, 500);
  };

  // Handle order confirmation
  const handleConfirmOrder = async (values) => {
    if (cartItems.length === 0) {
      messageApi.error("Giỏ hàng trống!");
      return;
    }

    if (!values.province || !values.district || !values.DiaChi) {
      messageApi.error("Vui lòng nhập đầy đủ địa chỉ giao hàng!");
      return;
    }

    setLoading(true);

    const orderRequest = {
      khachHangId: idKhachHang || null,
      phieuGiamGiaId: appliedVoucher?.id || null,
      hoTen: values.HoTen,
      sdt: values.SoDienThoai,
      diaChiKhachHang: `${values.DiaChi}, ${districtName}, ${provinceName}`,
      tinhId: values.province,
      quanId: values.district,
      email: values.Email || null,
      tongTien: subtotal,
      tienGiam: discountAmount,
      phiVanChuyen: shippingFee,
      donViVanChuyen: selectedProvider,
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
        navigate(`/orders/success/${hoaDon.maHoaDon}`);
      }
    } catch (error) {
      messageApi.error(error.message || error || "Đặt hàng thất bại!");
    } finally {
      setLoading(false);
      setConfirmOpen(false);
    }
  };

  const onFinish = (values) => {
    if (!values.province || !values.district) {
      messageApi.error("Vui lòng chọn đầy đủ tỉnh/thành và quận/huyện!");
      return;
    }
    setFormValues(values);
    setConfirmOpen(true);
  };

  // Render shipping provider options - giống SellPay
  const renderShippingProviderOptions = () => {
    return (
      <div className="mt-6 bg-gray-50 p-6 rounded-xl">
        <h4 className="font-semibold mb-4 text-lg">Đơn vị vận chuyển</h4>
        <div className="flex gap-3 flex-wrap mb-4">
          {shippingProviders && shippingProviders.length > 0 ? (
            shippingProviders.map((provider) => {
              const value =
                provider.code ||
                provider.ma ||
                provider.id ||
                provider.value ||
                provider;
              const label =
                provider.tenDonVi ||
                provider.name ||
                provider.ten ||
                provider.label ||
                provider.code ||
                provider.ma ||
                String(value);

              return (
                <div
                  key={value}
                  onClick={() => handleSelectShipping(value)}
                  className={`cursor-pointer select-none px-4 py-3 rounded-lg border text-sm font-semibold transition-all ${
                    selectedProvider === value
                      ? "bg-orange-600 text-white border-orange-600"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-orange-50 hover:border-orange-300"
                  }`}
                >
                  {label}
                </div>
              );
            })
          ) : (
            <div className="text-sm text-gray-500">
              Đang tải đơn vị vận chuyển...
            </div>
          )}
        </div>

        <div className="text-sm">
          <div
            className={`font-medium mb-1 ${
              shippingLoading
                ? "text-blue-600"
                : shippingFee
                ? "text-gray-700"
                : "text-gray-500"
            }`}
          >
            {shippingLoading
              ? "🔄 Đang tính phí vận chuyển..."
              : shippingFee
              ? `✅ Phí vận chuyển: ${formatVND(shippingFee)}`
              : "ℹ️ Vui lòng nhập đầy đủ địa chỉ để tính phí vận chuyển"}
          </div>
          {shippingError && (
            <div className="text-red-600 text-xs mt-1">⚠️ {shippingError}</div>
          )}
        </div>
      </div>
    );
  };

  // Render shipping fee in summary
  const renderShippingFeeInSummary = () => (
    <div className="flex justify-between text-base">
      <span className="text-gray-600">Phí vận chuyển</span>
      <span
        className={
          shippingLoading
            ? "text-blue-600"
            : shippingFee === 0
            ? "text-green-600 font-bold"
            : "font-medium"
        }
      >
        {shippingLoading
          ? "Đang tính..."
          : shippingFee === 0
          ? "Miễn phí"
          : formatVND(shippingFee)}
      </span>
    </div>
  );

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
                      <Input size="large" placeholder="Nhập họ tên" />
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
                      <Input size="large" placeholder="Nhập số điện thoại" />
                    </Form.Item>
                  </div>

                  <Form.Item name="Email" label="Email">
                    <Input type="email" size="large" placeholder="Nhập email" />
                  </Form.Item>

                  <div className="grid md:grid-cols-2 gap-4">
                    <Form.Item
                      name="province"
                      label="Tỉnh/Thành phố"
                      rules={[
                        { required: true, message: "Vui lòng chọn tỉnh/thành" },
                      ]}
                    >
                      <Select
                        placeholder="Chọn tỉnh/thành"
                        onChange={handleProvinceChange}
                        showSearch
                        optionFilterProp="children"
                        size="large"
                        allowClear
                      >
                        {provinces.map((p) => (
                          <Option key={p.id} value={p.id}>
                            {p.tenTinh}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>

                    <Form.Item
                      name="district"
                      label="Quận/Huyện"
                      rules={[
                        { required: true, message: "Vui lòng chọn quận/huyện" },
                      ]}
                    >
                      <Select
                        placeholder="Chọn quận/huyện"
                        disabled={!districts.length}
                        onChange={handleDistrictChange}
                        showSearch
                        optionFilterProp="children"
                        size="large"
                        allowClear
                      >
                        {districts.map((d) => (
                          <Option key={d.id} value={d.id}>
                            {d.tenQuan}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </div>

                  <Form.Item
                    name="DiaChi"
                    label="Địa chỉ chi tiết"
                    rules={[
                      { required: true, message: "Vui lòng nhập địa chỉ" },
                    ]}
                  >
                    <Input
                      size="large"
                      placeholder="Số nhà, đường, phường..."
                    />
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
                    disabled={
                      loading || cartItems.length === 0 || shippingLoading
                    }
                    className="w-full mt-10 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xl py-5 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading
                      ? "Đang xử lý..."
                      : shippingLoading
                      ? "Đang tính phí vận chuyển..."
                      : paymentMethod === "bank"
                      ? "Thanh toán qua VNPAY"
                      : "Đặt hàng ngay"}
                  </button>
                </Form>
              </div>
            </div>

            {/* Sidebar Order Summary */}
            <div className="flex flex-col lg:sticky lg:top-6">
              <div className="bg-white shadow-xl rounded-xl p-8 border border-gray-100">
                <h2 className="text-2xl font-bold mb-6 text-gray-800">
                  Đơn hàng của bạn
                </h2>

                <div className="space-y-4 mb-6 max-h-80 overflow-y-auto pr-2">
                  {cartItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-start py-3 border-b border-gray-200"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {item.tenSanPham || item.ten}
                        </div>
                        <div className="text-sm text-gray-500">
                          {item.tenKichThuoc && `Size: ${item.tenKichThuoc}`} ×{" "}
                          {item.quantity}
                        </div>
                      </div>
                      <div className="font-semibold text-gray-900 ml-4">
                        {formatVND(
                          (item.giaSauGiam || item.gia || 0) * item.quantity
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {appliedVoucher && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg mb-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-green-800 font-medium">
                          {appliedVoucher.tenChuongTrinh}
                        </div>
                        <div className="text-green-600 text-sm">
                          Giảm {formatVND(appliedVoucher.soTienGiam)}
                        </div>
                      </div>
                      <button
                        onClick={() => setAppliedVoucher(null)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                )}

                <div className="border-t-2 border-gray-200 pt-6 space-y-3">
                  <div className="flex justify-between text-base">
                    <span className="text-gray-600">Tạm tính</span>
                    <span className="font-medium">{formatVND(subtotal)}</span>
                  </div>

                  {renderShippingFeeInSummary()}

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

                  <div className="flex justify-between items-center pt-4 border-t-2 border-orange-500">
                    <span className="text-xl font-bold text-gray-800">
                      Tổng cộng
                    </span>
                    <span className="text-2xl font-bold text-orange-600">
                      {formatVND(total)}
                    </span>
                  </div>
                </div>
              </div>

              {renderShippingProviderOptions()}
            </div>
          </div>
        </div>
      </Spin>

      {/* Confirmation Modal */}
      {confirmOpen && formValues && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-2xl rounded-xl shadow-lg">
            <div className="p-6">
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold">Xác nhận đơn hàng</h2>
                <p className="text-gray-600 mt-1">
                  Kiểm tra thông tin trước khi đặt hàng
                </p>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <h3 className="font-semibold mb-2">Thông tin người nhận</h3>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p>
                      <strong>Họ tên:</strong> {formValues.HoTen}
                    </p>
                    <p>
                      <strong>SĐT:</strong> {formValues.SoDienThoai}
                    </p>
                    {formValues.Email && (
                      <p>
                        <strong>Email:</strong> {formValues.Email}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Địa chỉ giao hàng</h3>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p>{formValues.DiaChi}</p>
                    <p className="text-gray-600">
                      {districtName}, {provinceName}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Thanh toán</h3>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p>
                      {paymentMethod === "cod"
                        ? "Thanh toán khi nhận hàng (COD)"
                        : "Chuyển khoản ngân hàng"}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Tóm tắt đơn hàng</h3>
                  <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span>Tạm tính:</span>
                      <span>{formatVND(subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Phí vận chuyển:</span>
                      <span>
                        {shippingFee === 0
                          ? "Miễn phí"
                          : formatVND(shippingFee)}
                      </span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Giảm giá:</span>
                        <span>-{formatVND(discountAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-lg pt-2 border-t">
                      <span>Tổng cộng:</span>
                      <span className="text-orange-600">
                        {formatVND(total)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmOpen(false)}
                  className="flex-1 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50"
                >
                  Quay lại
                </button>
                <button
                  onClick={() => handleConfirmOrder(formValues)}
                  disabled={loading}
                  className="flex-1 py-3 bg-orange-600 text-white font-bold rounded-lg hover:bg-orange-700 disabled:opacity-50"
                >
                  {loading ? "Đang xử lý..." : "Xác nhận đặt hàng"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
