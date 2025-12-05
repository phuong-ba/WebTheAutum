import React, { useEffect, useState, useRef, useMemo } from "react";
import { Form, Input, Select, Radio, message, Spin, Modal, Button } from "antd";
import { useNavigate } from "react-router-dom";
import ClientBreadcrumb from "../ClientBreadcrumb";
import { formatVND } from "@/api/formatVND";
import TextArea from "antd/es/input/TextArea";
import { useDispatch, useSelector } from "react-redux";
import { addOrder, taoVietQR } from "@/services/orderService";
import { fetchPhieuGiamGia } from "@/services/phieuGiamGiaService";
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
import { CheckCircleIcon } from "@phosphor-icons/react";

import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import { fetchAllGGKH } from "@/services/giamGiaKhachHangService";

dayjs.extend(isBetween);

const { Option } = Select;

export default function CheckOut() {
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Redux
  const { data: vouchers } = useSelector((state) => state.phieuGiamGia);
  const dataKhachHang = useSelector((state) => state.khachHang.dataById);
  const {
    phiVanChuyen: shippingFee = 0,
    donViVanChuyen: shippingProviders = [],
    selectedShipping: selectedProvider,
    loading: shippingLoading,
  } = useSelector((state) => state.vanChuyen);
  const { data: giamGiaKhachHangData } = useSelector(
    (state) => state.giamGiaKhachHang
  );

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
  const [availableVouchers, setAvailableVouchers] = useState([]);
  const [voucherModalVisible, setVoucherModalVisible] = useState(false);

  const lastShippingCalculationRef = useRef({ cartHash: null });
  const idKhachHang = JSON.parse(localStorage.getItem("customer_id") || "null");
  const [qrCountdown, setQrCountdown] = useState(300); // 5 phút
  const [qrData, setQrData] = useState(null); // { qrUrl, maDon, noiDung, orderId }
  const qrTimerRef = useRef(null);
  useEffect(() => {
    window.scrollTo(0, 0);
    dispatch(fetchDonViVanChuyen());
    dispatch(fetchPhieuGiamGia());
    dispatch(fetchAllGGKH());

    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    setCartItems(cart);
    fetchProvinces();
  }, [dispatch]);
  useEffect(() => {
    if (qrData && qrCountdown > 0) {
      qrTimerRef.current = setTimeout(() => {
        setQrCountdown((prev) => prev - 1);
      }, 1000);
    } else if (qrCountdown === 0) {
      messageApi.warning("QR thanh toán đã hết hạn!");
      setQrData(null);
    }
    return () => {
      if (qrTimerRef.current) clearTimeout(qrTimerRef.current);
    };
  }, [qrCountdown, qrData]);
  useEffect(() => {
    if (idKhachHang) dispatch(getByIdKhachHang(idKhachHang));
  }, [idKhachHang, dispatch]);

  useEffect(() => {
    if (shippingProviders.length > 0 && !selectedProvider) {
      dispatch(setSelectedShipping("GHN"));
    }
  }, [shippingProviders, selectedProvider, dispatch]);

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

      if (activeAddress.tinhThanhId) {
        loadProvinceAndDistrictNames(
          activeAddress.tinhThanhId,
          activeAddress.quanHuyenId
        );
      }
    }
  }, [dataKhachHang, idKhachHang, form]);

  const subtotal = cartItems.reduce(
    (sum, item) => sum + (item.giaSauGiam || item.gia || 0) * item.quantity,
    0
  );
  const discountAmount = appliedVoucher?.soTienGiam || 0;
  const total = subtotal + shippingFee - discountAmount;

  // Copy hàm kiểm tra điều kiện từ SellInformation
  const checkBasicDiscountConditions = (discount, totalAmount, customer) => {
    if (!discount)
      return { isValid: false, message: "Mã giảm giá không tồn tại" };

    const now = dayjs();
    const start = dayjs(discount.ngayBatDau);
    const end = dayjs(discount.ngayKetThuc);

    if (now.isBefore(start))
      return { isValid: false, message: "Chưa tới thời gian áp dụng" };
    if (now.isAfter(end))
      return { isValid: false, message: "Mã giảm giá đã hết hạn" };
    if (discount.trangThai !== 1)
      return { isValid: false, message: "Mã giảm giá không khả dụng" };

    if (
      discount.giaTriDonHangToiThieu &&
      totalAmount < discount.giaTriDonHangToiThieu
    ) {
      return {
        isValid: false,
        message: `Đơn tối thiểu ${formatVND(discount.giaTriDonHangToiThieu)}`,
        isMinimumAmountNotMet: true,
      };
    }

    if (discount.kieu === 1) {
      // Mã cá nhân
      if (!customer) {
        return {
          isValid: false,
          message: "Yêu cầu đăng nhập để áp dụng mã cá nhân",
        };
      }

      const isCustomerHasDiscount =
        Array.isArray(giamGiaKhachHangData) &&
        giamGiaKhachHangData?.some(
          (ggkh) =>
            ggkh.phieuGiamGiaId === discount.id &&
            ggkh.khachHangId === customer.id
        );

      if (!isCustomerHasDiscount) {
        return {
          isValid: false,
          message: `Mã không áp dụng cho khách hàng ${customer.hoTen}`,
        };
      }
    }

    return { isValid: true, message: "OK" };
  };

  const calculateDiscountAmount = (discount, total) => {
    if (!discount || total <= 0) return 0;

    if (discount.loaiGiamGia === true) {
      return Math.min(discount.giaTriGiamGia, total);
    } else {
      const amount = (total * discount.giaTriGiamGia) / 100;
      if (discount.mucGiaGiamToiDa && amount > discount.mucGiaGiamToiDa) {
        return Math.min(discount.mucGiaGiamToiDa, total);
      }

      return Math.min(amount, total);
    }
  };

  const getAllActiveDiscounts = () => {
    if (!Array.isArray(vouchers)) return [];

    const now = dayjs();
    const customer = dataKhachHang;

    // Mã công khai
    const publicDiscounts = vouchers.filter((discount) => {
      const isActive =
        discount.trangThai === 1 &&
        now.isBetween(
          dayjs(discount.ngayBatDau),
          dayjs(discount.ngayKetThuc),
          null,
          "[]"
        );

      return isActive && discount.kieu === 0;
    });

    // Mã cá nhân
    let personalDiscounts = [];
    if (customer && Array.isArray(giamGiaKhachHangData)) {
      const personalDiscountIds = giamGiaKhachHangData
        .filter((ggkh) => ggkh.khachHangId === customer.id)
        .map((ggkh) => ggkh.phieuGiamGiaId);

      if (personalDiscountIds.length > 0) {
        personalDiscounts = vouchers.filter(
          (discount) =>
            discount.trangThai === 1 &&
            personalDiscountIds.includes(discount.id)
        );
      }
    }

    return [...publicDiscounts, ...personalDiscounts];
  };

  useEffect(() => {
    const updateAvailableVouchers = () => {
      if (cartItems.length === 0) {
        setAvailableVouchers([]);
        return;
      }

      const allActiveDiscounts = getAllActiveDiscounts();
      const available = [];
      const unavailable = [];

      for (const discount of allActiveDiscounts) {
        const condition = checkBasicDiscountConditions(
          discount,
          subtotal,
          dataKhachHang
        );

        if (condition.isValid) {
          const discountAmount = calculateDiscountAmount(discount, subtotal);
          available.push({
            ...discount,
            discountAmount,
          });
        } else {
          unavailable.push({
            discount,
            reason: condition.message,
          });
        }
      }

      available.sort((a, b) => b.discountAmount - a.discountAmount);
      setAvailableVouchers(available);

      if (available.length > 0 && !appliedVoucher) {
        const bestDiscount = available[0];
        const discountAmount = calculateDiscountAmount(bestDiscount, subtotal);
        setAppliedVoucher({
          id: bestDiscount.id,
          tenChuongTrinh: bestDiscount.tenChuongTrinh,
          maGiamGia: bestDiscount.maGiamGia,
          soTienGiam: discountAmount,
          loaiGiamGia: bestDiscount.loaiGiamGia,
          giaTriGiamGia: bestDiscount.giaTriGiamGia,
          mucGiaGiamToiDa: bestDiscount.mucGiaGiamToiDa,
          kieu: bestDiscount.kieu,
        });
      }
    };

    updateAvailableVouchers();
  }, [vouchers, subtotal, dataKhachHang, giamGiaKhachHangData, cartItems]);

  useEffect(() => {
    if (!appliedVoucher || !Array.isArray(vouchers)) return;

    const currentDiscount = vouchers.find((v) => v.id === appliedVoucher.id);
    if (!currentDiscount) {
      setAppliedVoucher(null);
      return;
    }

    const condition = checkBasicDiscountConditions(
      currentDiscount,
      subtotal,
      dataKhachHang
    );

    if (!condition.isValid) {
      messageApi.warning(
        `Mã giảm giá ${appliedVoucher.maGiamGia} không còn khả dụng: ${condition.message}`
      );
      setAppliedVoucher(null);
    }
  }, [appliedVoucher, vouchers, subtotal, dataKhachHang]);

  // API Tỉnh/Quận
  const fetchProvinces = async () => {
    try {
      const res = await diaChiApi.getAllTinhThanh();
      setProvinces(res || []);
    } catch {
      messageApi.error("Không tải được danh sách tỉnh/thành");
    }
  };

  const loadProvinceAndDistrictNames = async (provinceId, districtId) => {
    if (!provinceId) return;
    const province = provinces.find((p) => p.id == provinceId);
    if (province) {
      setProvinceName(province.tenTinh);
      try {
        const res = await diaChiApi.getQuanByTinh(provinceId);
        setDistricts(res || []);
        if (districtId) {
          const district = res.find((d) => d.id == districtId);
          if (district) setDistrictName(district.tenQuan);
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleProvinceChange = async (provinceId) => {
    form.setFieldsValue({ district: undefined });
    setDistricts([]);
    setDistrictName("");

    const province = provinces.find((p) => p.id == provinceId);
    if (province) setProvinceName(province.tenTinh);

    try {
      const res = await diaChiApi.getQuanByTinh(provinceId);
      setDistricts(res || []);
    } catch {
      messageApi.error("Không tải được quận/huyện");
    }
    dispatch(resetShippingFee());
  };

  const handleDistrictChange = (districtId) => {
    const district = districts.find((d) => d.id == districtId);
    if (district) setDistrictName(district.tenQuan);
    dispatch(resetShippingFee());
  };

  useEffect(() => {
    if (!selectedProvider || cartItems.length === 0) return;

    const values = form.getFieldsValue();
    if (!values.province || !values.district || !values.DiaChi) return;

    const currentHash = JSON.stringify({
      province: values.province,
      district: values.district,
      address: values.DiaChi,
      provider: selectedProvider,
      items: cartItems.map((i) => ({ id: i.id, qty: i.quantity })),
    });

    if (lastShippingCalculationRef.current.cartHash === currentHash) return;
    lastShippingCalculationRef.current.cartHash = currentHash;

    const timer = setTimeout(() => {
      const requestData = {
        donViVanChuyen: selectedProvider,
        idTinhGui: 1,
        idQuanGui: 1442,
        idTinhNhan: values.province,
        idQuanNhan: values.district,
        diaChiCuThe: values.DiaChi,
        items: cartItems.map((item) => ({
          idChiTietSanPham: item.id,
          soLuong: item.quantity,
          giaBan: item.giaSauGiam || item.gia || 0,
          khoiLuong: item.khoiLuong || 250,
          chieuDai: item.chieuDai || 30,
          chieuRong: item.chieuRong || 20,
          chieuCao: item.chieuCao || 10,
        })),
      };
      dispatch(tinhPhiVanChuyen(requestData));
    }, 800);

    return () => clearTimeout(timer);
  }, [form, cartItems, selectedProvider, dispatch]);

  const handleSelectShipping = (provider) => {
    dispatch(setSelectedShipping(provider));
  };

  const handleSelectVoucher = (voucher) => {
    const discountAmount = calculateDiscountAmount(voucher, subtotal);
    setAppliedVoucher({
      id: voucher.id,
      tenChuongTrinh: voucher.tenChuongTrinh,
      maGiamGia: voucher.maGiamGia,
      soTienGiam: discountAmount,
      loaiGiamGia: voucher.loaiGiamGia,
      giaTriGiamGia: voucher.giaTriGiamGia,
      mucGiaGiamToiDa: voucher.mucGiaGiamToiDa,
      kieu: voucher.kieu,
    });
    setVoucherModalVisible(false);
    messageApi.success(`Đã áp dụng mã giảm giá: ${voucher.maGiamGia}`);
  };

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
    messageApi.success("Đã hủy áp dụng mã giảm giá");
  };

  const handleShowQR = async (values) => {
    if (cartItems.length === 0) {
      messageApi.error("Giỏ hàng trống!");
      return;
    }

    setLoading(true);

    try {
      // Tạo QR với số tiền và thông tin
      const qr = await dispatch(
        taoVietQR({
          amount: total,
          orderId: `QR_${Date.now()}`,
          noiDung: `THANH TOAN DON HANG ${formatVND(total)} - ${values.HoTen}`,
          tenKhachHang: values.HoTen,
        })
      ).unwrap();

      // Lưu tạm thông tin form để dùng sau
      setFormValues(values);

      // Hiển thị QR
      setQrData({
        qrUrl: qr.qrImageUrl || qr.paymentUrl || qr.qrDataURL,
        noiDung:
          qr.addInfo || qr.noiDung || `THANH TOAN DON HANG ${formatVND(total)}`,
        amount: total,
      });
      setQrCountdown(300);
      setConfirmOpen(true); // Mở modal QR
    } catch (error) {
      messageApi.error("Không tạo được QR thanh toán!");
    } finally {
      setLoading(false);
    }
  };

  // Sửa trong phần handleConfirmOrder
  const handleConfirmOrder = async () => {
    if (!formValues) return;

    setLoading(true);

    const fullAddress = `${formValues.DiaChi}, ${districtName}, ${provinceName}`;

    const idPhuongThucThanhToan = paymentMethod === "cod" ? 1 : 2;

    const orderRequest = {
      idKhachHang: idKhachHang || null,
      idPhieuGiamGia: appliedVoucher?.id || null,
      idPhuongThucThanhToan,
      loaiHoaDon: false, // ONLINE
      phiVanChuyen: shippingFee,
      tongTien: subtotal,
      tongTienSauGiam: total,
      diaChiKhachHang: fullAddress,
      diaChiCuThe: formValues.DiaChi,
      idTinh: formValues.province,
      idQuan: formValues.district,
      hoTen: formValues.HoTen,
      sdt: formValues.SoDienThoai,
      email: formValues.Email || null,
      ghiChu: formValues.note || null,
      soTienThanhToan: paymentMethod === "bank" ? total : null,
      ghiChuThanhToan:
        paymentMethod === "bank"
          ? `Chuyển khoản qua QR - Nội dung: ${
              qrData?.noiDung || "THANH TOAN DON HANG"
            }`
          : null,
      trangThai: 0,

      chiTietList: cartItems.map((item) => ({
        idChiTietSanPham: item.id,
        soLuong: item.quantity,
      })),
    };

    try {
      const result = await dispatch(addOrder(orderRequest)).unwrap();
      const hoaDon = result.data || result;

      localStorage.removeItem("cart");
      setCartItems([]);
      window.dispatchEvent(new Event("cartUpdated"));

      // Hiển thị thông báo khác nhau tùy phương thức thanh toán
      if (paymentMethod === "bank") {
        messageApi.success(
          "Đặt hàng thành công! Đang chờ xác nhận thanh toán."
        );
      } else {
        messageApi.success("Đặt hàng thành công! Đơn hàng đang chờ xác nhận.");
      }

      navigate(`/orders/success/${hoaDon.id}`);
    } catch (error) {
      console.error(error);
      messageApi.error("Tạo đơn hàng thất bại. Vui lòng thử lại!");
    } finally {
      setLoading(false);
      setConfirmOpen(false);
      setQrData(null);
      setQrCountdown(300);
    }
  };
  const onFinish = async (values) => {
    if (!values.province || !values.district) {
      messageApi.error("Vui lòng chọn đầy đủ tỉnh/thành và quận/huyện!");
      return;
    }

    setFormValues(values);

    if (paymentMethod === "bank") {
      await handleShowQR(values);
    } else {
      setConfirmOpen(true);
    }
  };
  const renderVoucherSelector = () => {
    return (
      <div className="mt-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-600">Mã giảm giá</span>
          <button
            type="button"
            onClick={() => setVoucherModalVisible(true)}
            className="text-orange-600 hover:text-orange-800 font-medium"
          >
            {appliedVoucher ? "Đổi mã" : "Chọn mã giảm giá"}
          </button>
        </div>

        {appliedVoucher && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg mb-4">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-green-800 font-medium">
                  {appliedVoucher.tenChuongTrinh}
                </div>
                <div className="text-green-600 text-sm">
                  Mã: {appliedVoucher.maGiamGia}
                </div>
                <div className="text-green-600 text-sm">
                  Giảm: {formatVND(appliedVoucher.soTienGiam)}
                  {appliedVoucher.loaiGiamGia === true
                    ? " VND"
                    : ` (${appliedVoucher.giaTriGiamGia}%)`}
                  {appliedVoucher.mucGiaGiamToiDa &&
                    appliedVoucher.loaiGiamGia === false && (
                      <span className="text-gray-500 text-xs">
                        {" "}
                        (Tối đa: {formatVND(appliedVoucher.mucGiaGiamToiDa)})
                      </span>
                    )}
                </div>
                {appliedVoucher.kieu === 1 && (
                  <div className="text-amber-600 text-xs mt-1">
                    ⭐ Mã cá nhân - Chỉ sử dụng 1 lần duy nhất
                  </div>
                )}
              </div>
              <button
                onClick={handleRemoveVoucher}
                className="text-red-500 hover:text-red-700 text-sm"
              >
                Hủy
              </button>
            </div>
          </div>
        )}

        {/* Modal chọn voucher */}
        <Modal
          title="Chọn mã giảm giá"
          open={voucherModalVisible}
          onCancel={() => setVoucherModalVisible(false)}
          footer={null}
          width={600}
        >
          <div className="max-h-96 overflow-y-auto">
            {availableVouchers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {!dataKhachHang
                  ? "Đăng nhập để xem mã giảm giá cá nhân"
                  : "Không có mã giảm giá khả dụng cho đơn hàng này"}
              </div>
            ) : (
              <div className="space-y-3">
                {availableVouchers.map((voucher) => {
                  // Tính giá trị giảm thực tế để hiển thị
                  const actualDiscount = calculateDiscountAmount(
                    voucher,
                    subtotal
                  );
                  const maxDiscount = voucher.mucGiaGiamToiDa || 0;

                  return (
                    <div
                      key={voucher.id}
                      className={`p-4 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                        appliedVoucher?.id === voucher.id
                          ? "border-orange-500 bg-orange-50"
                          : "border-gray-200"
                      }`}
                      onClick={() => handleSelectVoucher(voucher)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-semibold text-gray-900">
                            {voucher.tenChuongTrinh}
                          </div>
                          <div className="text-sm text-gray-600">
                            Mã:{" "}
                            <span className="font-mono">
                              {voucher.maGiamGia}
                            </span>
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            {voucher.loaiGiamGia === true
                              ? `Giảm ${formatVND(voucher.giaTriGiamGia)}`
                              : `Giảm ${voucher.giaTriGiamGia}%`}
                            {voucher.mucGiaGiamToiDa &&
                              voucher.loaiGiamGia === false && (
                                <span className="text-gray-500">
                                  {" "}
                                  (Tối đa: {formatVND(voucher.mucGiaGiamToiDa)})
                                </span>
                              )}
                          </div>
                          {voucher.giaTriDonHangToiThieu && (
                            <div className="text-xs text-gray-500 mt-1">
                              Đơn tối thiểu:{" "}
                              {formatVND(voucher.giaTriDonHangToiThieu)}
                            </div>
                          )}
                          <div className="text-xs text-gray-500 mt-1">
                            HSD:{" "}
                            {dayjs(voucher.ngayKetThuc).format("DD/MM/YYYY")}
                          </div>
                          {voucher.kieu === 1 && (
                            <div className="text-xs text-amber-600 mt-1">
                              ⭐ Mã cá nhân
                            </div>
                          )}

                          {/* Hiển thị giá trị giảm thực tế */}
                          <div className="text-xs text-blue-600 mt-1">
                            Giảm thực tế: {formatVND(actualDiscount)}
                            {voucher.loaiGiamGia === false &&
                              maxDiscount > 0 && (
                                <span className="text-gray-500">
                                  {" "}
                                  (Giới hạn: {formatVND(maxDiscount)})
                                </span>
                              )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-green-600">
                            -{formatVND(actualDiscount)}
                          </div>
                          <Button
                            size="small"
                            type={
                              appliedVoucher?.id === voucher.id
                                ? "primary"
                                : "default"
                            }
                          >
                            {appliedVoucher?.id === voucher.id
                              ? "Đã chọn"
                              : "Áp dụng"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                <strong>Lưu ý:</strong>
                <ul className="mt-2 space-y-1">
                  <li>• Mỗi đơn hàng chỉ được áp dụng 1 mã giảm giá</li>
                  <li>
                    • Mã cá nhân chỉ dành riêng cho khách hàng đã đăng nhập
                  </li>
                  <li>• Mã có thể không áp dụng được nếu không đủ điều kiện</li>
                  <li>• Giảm giá phần trăm có giới hạn tối đa</li>
                </ul>
              </div>
            </div>
          </div>
        </Modal>
      </div>
    );
  };

  const renderShippingProviderOptions = () => (
    <div className="mt-6 bg-gray-50 p-6 rounded-xl">
      <h4 className="font-semibold mb-4 text-lg">Đơn vị vận chuyển</h4>
      <div className="flex gap-3 flex-wrap mb-4">
        {shippingProviders.length > 0 ? (
          shippingProviders.map((provider) => {
            const value = provider.code || provider.ma || provider;
            const label =
              provider.tenDonVi || provider.name || provider.ten || value;
            return (
              <div
                key={value}
                onClick={() => handleSelectShipping(value)}
                className={`cursor-pointer px-4 py-3 rounded-lg border font-semibold transition-all ${
                  selectedProvider === value
                    ? "bg-orange-600 text-white border-orange-600"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-orange-50"
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
      <div className="text-sm font-medium">
        {shippingLoading
          ? "Đang tính phí vận chuyển..."
          : shippingFee !== undefined
          ? `Phí vận chuyển: ${formatVND(shippingFee)}`
          : "Vui lòng nhập địa chỉ để tính phí"}
      </div>
    </div>
  );

  return (
    <>
      {contextHolder}
      <Spin spinning={loading}>
        <div className="flex flex-col gap-10 py-10 ">
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
                      <Input size="large" placeholder="090xxxxxxx" />
                    </Form.Item>
                  </div>

                  <Form.Item name="Email" label="Email (không bắt buộc)">
                    <Input
                      type="email"
                      size="large"
                      placeholder="email@example.com"
                    />
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
                    label="Địa chỉ chi tiết (số nhà, đường, phường...)"
                    rules={[
                      {
                        required: true,
                        message: "Vui lòng nhập địa chỉ chi tiết",
                      },
                    ]}
                  >
                    <Input size="large" placeholder="Ví dụ: 123 Đường Láng" />
                  </Form.Item>

                  <Form.Item
                    name="note"
                    label="Ghi chú đơn hàng (không bắt buộc)"
                  >
                    <TextArea
                      rows={3}
                      placeholder="Giao hàng giờ hành chính, gọi trước khi giao..."
                    />
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
                          <strong>Chuyển khoản (Quét QR)</strong>
                          <p className="text-gray-600 text-sm">
                            Nhanh – An toàn – Tự động xác nhận
                          </p>
                        </div>
                      </Radio>
                    </Radio.Group>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || cartItems.length === 0}
                    className="w-full mt-10 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xl py-5 rounded-lg transition disabled:opacity-50"
                  >
                    {loading
                      ? "Đang xử lý..."
                      : paymentMethod === "bank"
                      ? "Tạo QR thanh toán"
                      : "Đặt hàng ngay"}
                  </button>
                </Form>
              </div>
            </div>

            <div className="flex flex-col lg:sticky lg:top-6">
              <div className="bg-white shadow-xl rounded-xl p-8 border border-gray-100">
                <h2 className="text-2xl font-bold mb-6 text-gray-800">
                  Đơn hàng của bạn
                </h2>

                <div className="space-y-4 mb-6 max-h-80 overflow-y-auto pr-2 border-b pb-4">
                  {cartItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-start py-3"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {item.tenSanPham || item.ten}
                        </div>
                        <div className="text-sm text-gray-500">
                          {item.tenKichThuoc && `${item.tenKichThuoc} ×`}{" "}
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

                {renderVoucherSelector()}

                <div className="border-t-2 border-gray-200 pt-6 space-y-3">
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
                      {shippingLoading
                        ? "Đang tính..."
                        : shippingFee === 0
                        ? "Miễn phí"
                        : formatVND(shippingFee)}
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

      <Modal
        open={confirmOpen}
        onCancel={() => {
          setConfirmOpen(false);
          setQrData(null);
          setQrCountdown(300);
        }}
        footer={null}
        width={qrData ? 750 : 600}
        maskClosable={false}
        destroyOnClose={true}
        closeIcon={null}
      >
        <div className="p-6">
          {qrData ? (
            <div className="text-center">
              {/* Logo + Tiêu đề */}
              <div className="mb-6">
                <CheckCircleIcon
                  size={70}
                  className="text-green-600 mx-auto mb-4"
                />
                <h2 className="text-3xl font-bold text-gray-800">
                  Quét QR để thanh toán
                </h2>
                <p className="text-lg text-gray-600 mt-2">
                  Vui lòng hoàn tất chuyển khoản trong thời gian còn lại
                </p>
              </div>

              {/* QR Code lớn */}
              <div className="inline-block p-8 bg-white rounded-3xl shadow-2xl border-8 border-gray-100 mb-8">
                <img
                  src={qrData.qrUrl}
                  alt="VietQR"
                  className="w-80 h-80 object-contain"
                />
              </div>

              {/* Đếm ngược lớn */}
              <div className="text-6xl font-bold text-orange-600 mb-8 font-mono tracking-wider">
                {Math.floor(qrCountdown / 60)
                  .toString()
                  .padStart(2, "0")}
                :{(qrCountdown % 60).toString().padStart(2, "0")}
              </div>

              {/* Thông tin chuyển khoản */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-2xl space-y-6 mb-8 border">
                <div>
                  <div className="text-gray-600 text-lg">
                    Số tiền cần chuyển:
                  </div>
                  <div className="text-4xl font-bold text-orange-600">
                    {formatVND(total)}
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-md">
                  <div className="text-gray-600 mb-3 text-lg">
                    Nội dung chuyển khoản:
                  </div>
                  <div className="font-mono text-xl text-blue-700 break-all bg-gray-50 p-4 rounded-lg">
                    {qrData.noiDung}
                  </div>
                </div>

                <div className="text-amber-700 font-bold text-lg bg-amber-50 p-4 rounded-lg">
                  Ghi đúng nội dung để hệ thống tự động xác nhận đơn hàng!
                </div>
              </div>

              {/* Cảnh báo chống bấm nhầm */}
              <div className="bg-red-50 border-2 border-red-300 text-red-700 p-6 rounded-xl mb-6">
                <p className="font-bold text-xl">
                  CHỈ bấm nút bên dưới khi bạn đã chuyển khoản thành công
                </p>
                <p className="text-sm mt-3">
                  Nếu bấm nhầm mà chưa chuyển tiền → đơn hàng sẽ bị hủy sau 5
                  phút và bạn phải đặt lại.
                </p>
              </div>

              {qrCountdown <= 290 ? (
                <Button
                  type="primary"
                  danger
                  size="large"
                  loading={loading}
                  className="w-full h-16 text-xl font-bold"
                  onClick={handleConfirmOrder}
                >
                  Tôi đã chuyển khoản thành công → Xem đơn hàng
                </Button>
              ) : (
                <div className="space-y-4">
                  <Button
                    disabled
                    size="large"
                    className="w-full h-16 text-xl opacity-70"
                  >
                    Chưa thể bấm • Vui lòng chuyển khoản trước
                  </Button>
                  <p className="text-gray-500">
                    Nút sẽ mở sau 10 giây để tránh bấm nhầm
                  </p>
                </div>
              )}

              {/* Nút hủy */}
              <div className="mt-6">
                <Button
                  size="large"
                  className="w-full"
                  onClick={() => {
                    setConfirmOpen(false);
                    setQrData(null);
                    setQrCountdown(300);
                    messageApi.info(
                      "Đã hủy thanh toán QR. Bạn có thể đặt lại đơn hàng."
                    );
                  }}
                >
                  Hủy thanh toán QR
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="text-center">
                <CheckCircleIcon
                  size={70}
                  className="text-orange-600 mx-auto mb-4"
                />
                <h2 className="text-3xl font-bold text-gray-800">
                  Xác nhận đơn hàng
                </h2>
                <p className="text-lg text-gray-600 mt-2">
                  Vui lòng kiểm tra lại thông tin trước khi đặt hàng
                </p>
              </div>

              {/* Thông tin người nhận */}
              <div>
                <h3 className="font-semibold text-lg mb-3">Người nhận</h3>
                <div className="bg-gray-50 p-5 rounded-lg space-y-2 text-base">
                  <p>
                    <strong>Họ tên:</strong> {formValues?.HoTen}
                  </p>
                  <p>
                    <strong>SĐT:</strong> {formValues?.SoDienThoai}
                  </p>
                  {formValues?.Email && (
                    <p>
                      <strong>Email:</strong> {formValues.Email}
                    </p>
                  )}
                </div>
              </div>

              {/* Địa chỉ giao hàng */}
              <div>
                <h3 className="font-semibold text-lg mb-3">
                  Địa chỉ giao hàng
                </h3>
                <div className="bg-gray-50 p-5 rounded-lg text-base">
                  <p className="font-medium">{formValues?.DiaChi}</p>
                  <p className="text-gray-600">
                    {districtName}, {provinceName}
                  </p>
                </div>
              </div>

              {/* Mã giảm giá */}
              {appliedVoucher && (
                <div>
                  <h3 className="font-semibold text-lg mb-3">
                    Mã giảm giá đã áp dụng
                  </h3>
                  <div className="bg-green-50 border border-green-300 p-5 rounded-lg">
                    <p className="font-bold text-green-700">
                      {appliedVoucher.tenChuongTrinh}
                    </p>
                    <p className="text-green-600">
                      Mã: {appliedVoucher.maGiamGia}
                    </p>
                    <p className="font-semibold">
                      Giảm: {formatVND(appliedVoucher.soTienGiam)}
                    </p>
                  </div>
                </div>
              )}

              <div>
                <h3 className="font-semibold text-lg mb-3">
                  Tóm tắt thanh toán
                </h3>
                <div className="bg-gray-50 p-5 rounded-lg space-y-3 text-base">
                  <div className="flex justify-between">
                    <span>Tạm tính:</span>
                    <span>{formatVND(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Phí vận chuyển:</span>
                    <span>
                      {shippingFee === 0 ? "Miễn phí" : formatVND(shippingFee)}
                    </span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-green-600 font-medium">
                      <span>Giảm giá:</span>
                      <span>-{formatVND(discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xl font-bold pt-3 border-t-2 border-orange-500">
                    <span>Tổng cộng:</span>
                    <span className="text-orange-600">{formatVND(total)}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <Button
                  size="large"
                  className="flex-1"
                  onClick={() => setConfirmOpen(false)}
                >
                  Quay lại chỉnh sửa
                </Button>
                <Button
                  type="primary"
                  size="large"
                  danger
                  loading={loading}
                  className="flex-1 text-lg font-bold"
                  onClick={handleConfirmOrder} // ← Đổi thành handleConfirmOrder
                >
                  {loading ? "Đang xử lý..." : "Xác nhận đặt hàng"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
