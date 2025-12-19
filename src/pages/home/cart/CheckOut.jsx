import React, { useEffect, useState, useRef } from "react";
import {
  Form,
  Input,
  Select,
  Radio,
  message,
  Spin,
  Modal,
  Button,
  Tag,
} from "antd";
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
  setShippingFees,
} from "@/redux/slices/vanChuyenSlice";
import { diaChiApi } from "@/api/diaChiApi";
import {
  CheckCircleIcon,
  TruckIcon,
  RocketIcon,
  ClockIcon,
} from "@phosphor-icons/react";

import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import { fetchAllGGKH } from "@/services/giamGiaKhachHangService";
import { DollarSignIcon } from "lucide-react";

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
    shippingFees: allShippingFees = [],
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
  const [comparingShipping, setComparingShipping] = useState(false);

  const lastShippingCalculationRef = useRef({ cartHash: null });
  const idKhachHang = JSON.parse(localStorage.getItem("customer_id") || "null");
  const [qrCountdown, setQrCountdown] = useState(300);
  const [qrData, setQrData] = useState(null);
  const qrTimerRef = useRef(null);

  // THÊM: State để theo dõi thay đổi địa chỉ
  const [addressChanged, setAddressChanged] = useState(false);

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
    return () => clearTimeout(qrTimerRef.current);
  }, [qrCountdown, qrData]);

  useEffect(() => {
    if (idKhachHang) dispatch(getByIdKhachHang(idKhachHang));
  }, [idKhachHang, dispatch]);

  // Tự động chọn phí giao hàng rẻ nhất khi có danh sách phí
  useEffect(() => {
    if (allShippingFees.length > 0 && !selectedProvider) {
      const sortedByPrice = [...allShippingFees].sort(
        (a, b) => a.phiVanChuyen - b.phiVanChuyen
      );
      const cheapest = sortedByPrice[0];
      if (cheapest) {
        const code =
          cheapest.code || cheapest.ma || cheapest.id || cheapest.provider;
        dispatch(setSelectedShipping(code));
        messageApi.success(
          `Đã chọn ${
            cheapest.tenDonVi || "đơn vị vận chuyển"
          } có phí thấp nhất: ${formatVND(cheapest.phiVanChuyen)}`
        );
      }
    }
  }, [allShippingFees, selectedProvider, dispatch]);

  // Điền thông tin khách hàng nếu đã đăng nhập
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

  // === TỰ ĐỘNG TÍNH PHÍ VẬN CHUYỂN CHO TẤT CẢ ĐƠN VỊ ===
  useEffect(() => {
    if (cartItems.length === 0) {
      dispatch(resetShippingFee());
      return;
    }

    const values = form.getFieldsValue();
    const { province, district, DiaChi } = values;

    if (!province || !district || !DiaChi?.trim()) {
      dispatch(resetShippingFee());
      return;
    }

    const currentHash = JSON.stringify({
      province,
      district,
      DiaChi: DiaChi.trim(),
      items: cartItems.map((i) => ({ id: i.id, qty: i.quantity })),
    });

    if (lastShippingCalculationRef.current.cartHash === currentHash) return;

    lastShippingCalculationRef.current.cartHash = currentHash;

    const calculateAllShippingFees = async () => {
      setComparingShipping(true);
      const fees = [];

      for (const provider of shippingProviders) {
        const providerCode = provider.code || provider.ma || provider;

        const requestData = {
          donViVanChuyen: providerCode,
          idTinhGui: 1,
          idQuanGui: 1442,
          idTinhNhan: province,
          idQuanNhan: district,
          diaChiCuThe: DiaChi.trim(),
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

        try {
          const result = await dispatch(tinhPhiVanChuyen(requestData));
          if (result.payload?.phiVanChuyen !== undefined) {
            fees.push({
              ...provider,
              code: providerCode,
              phiVanChuyen: result.payload.phiVanChuyen,
              thoiGianDuKien: result.payload.thoiGianDuKien || "3-5 ngày",
            });
          }
        } catch (error) {
          console.error(`Lỗi tính phí cho ${providerCode}:`, error);
        }
      }

      // Lưu tất cả phí vào Redux
      dispatch(setShippingFees(fees));

      // Tự động chọn phí rẻ nhất
      if (fees.length > 0) {
        const sortedFees = [...fees].sort(
          (a, b) => a.phiVanChuyen - b.phiVanChuyen
        );
        const cheapest = sortedFees[0];
        dispatch(setSelectedShipping(cheapest.code));
      }

      setComparingShipping(false);
      setAddressChanged(false);
    };

    const timer = setTimeout(() => {
      calculateAllShippingFees();
    }, 800);

    return () => clearTimeout(timer);
  }, [
    shippingProviders,
    cartItems,
    dispatch,
    addressChanged,
    form.getFieldValue("province"),
    form.getFieldValue("district"),
    form.getFieldValue("DiaChi"),
  ]);

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

      for (const discount of allActiveDiscounts) {
        const condition = checkBasicDiscountConditions(
          discount,
          subtotal,
          dataKhachHang
        );

        if (condition.isValid) {
          const discountAmount = calculateDiscountAmount(discount, subtotal);
          available.push({ ...discount, discountAmount });
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
    setAddressChanged(true);
    lastShippingCalculationRef.current.cartHash = null;
  };

  const handleDistrictChange = (districtId) => {
    const district = districts.find((d) => d.id == districtId);
    if (district) setDistrictName(district.tenQuan);

    dispatch(resetShippingFee());
    setAddressChanged(true);
    lastShippingCalculationRef.current.cartHash = null;
  };

  const handleAddressDetailChange = (e) => {
    const value = e.target.value;
    if (value?.trim()) {
      dispatch(resetShippingFee());
      setAddressChanged(true);
      lastShippingCalculationRef.current.cartHash = null;
    }
  };

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
      const qr = await dispatch(
        taoVietQR({
          amount: total,
          orderId: `QR_${Date.now()}`,
          noiDung: `THANH TOAN DON HANG ${formatVND(total)} - ${values.HoTen}`,
          tenKhachHang: values.HoTen,
        })
      ).unwrap();

      setFormValues(values);
      setQrData({
        qrUrl: qr.qrImageUrl || qr.paymentUrl || qr.qrDataURL,
        noiDung:
          qr.addInfo || qr.noiDung || `THANH TOAN DON HANG ${formatVND(total)}`,
        amount: total,
      });
      setQrCountdown(300);
      setConfirmOpen(true);
    } catch (error) {
      messageApi.error("Không tạo được QR thanh toán!");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmOrder = async () => {
    if (!formValues) return;

    setLoading(true);
    const fullAddress = `${formValues.DiaChi}, ${districtName}, ${provinceName}`;
    const idPhuongThucThanhToan = paymentMethod === "cod" ? 1 : 2;

    const orderRequest = {
      idKhachHang: idKhachHang || null,
      idPhieuGiamGia: appliedVoucher?.id || null,
      idPhuongThucThanhToan,
      loaiHoaDon: false,
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

      messageApi.success(
        paymentMethod === "bank"
          ? "Đặt hàng thành công! Đang chờ xác nhận thanh toán."
          : "Đặt hàng thành công! Đơn hàng đang chờ xác nhận."
      );

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
            className="text-orange-600 hover:text-orange-800 font-medium cursor-pointer"
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
                className="text-red-500 hover:text-red-700 text-sm cursor-pointer"
              >
                Hủy
              </button>
            </div>
          </div>
        )}

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

  const renderShippingProviderOptions = () => {
    // Sắp xếp phí vận chuyển từ thấp đến cao
    const sortedShippingFees = [...allShippingFees].sort(
      (a, b) => a.phiVanChuyen - b.phiVanChuyen
    );

    const getProviderIcon = (providerName) => {
      const name = String(providerName || "").toLowerCase();
      if (name.includes("nhanh") || name.includes("fast"))
        return <RocketIcon size={20} />;
      if (name.includes("tiết kiệm") || name.includes("economy"))
        return <DollarSignIcon size={20} />;
      if (name.includes("tiêu chuẩn") || name.includes("standard"))
        return <TruckIcon size={20} />;
      return <TruckIcon size={20} />;
    };

    const getDeliveryTimeColor = (time) => {
      if (time?.includes("1-2") || time?.includes("nhanh"))
        return "text-green-600";
      if (time?.includes("3-5") || time?.includes("tiêu chuẩn"))
        return "text-blue-600";
      return "text-gray-600";
    };

    return (
      <div className="mt-6 bg-gray-50 p-6 rounded-xl">
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-semibold text-lg">Đơn vị vận chuyển</h4>
          {comparingShipping && (
            <Tag color="processing">
              <div className="flex items-center gap-2">
                <ClockIcon /> Đang so sánh phí...
              </div>
            </Tag>
          )}
        </div>

        <div className="space-y-3 mb-4">
          {sortedShippingFees.length > 0 ? (
            sortedShippingFees.map((provider) => {
              const isCheapest = sortedShippingFees[0]?.code === provider.code;
              const isSelected = selectedProvider === provider.code;

              return (
                <div
                  key={provider.code}
                  onClick={() => handleSelectShipping(provider.code)}
                  className={`cursor-pointer p-4 rounded-lg border transition-all ${
                    isSelected
                      ? "bg-orange-50 border-orange-500 ring-2 ring-orange-200"
                      : "bg-white border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg ${
                          isSelected ? "bg-orange-100" : "bg-gray-100"
                        }`}
                      >
                        {getProviderIcon(provider.tenDonVi)}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 flex items-center gap-2">
                          {provider.tenDonVi ||
                            provider.name ||
                            provider.ten ||
                            provider.code}
                          {isCheapest && (
                            <Tag color="green" className="text-xs">
                              Rẻ nhất
                            </Tag>
                          )}
                        </div>
                        <div
                          className={`text-sm ${getDeliveryTimeColor(
                            provider.thoiGianDuKien
                          )} flex items-center`}
                        >
                          <ClockIcon size={12} className="inline mr-1" />
                          {provider.thoiGianDuKien || "3-5 ngày"}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={`text-lg font-bold ${
                          isCheapest ? "text-green-600" : "text-gray-900"
                        }`}
                      >
                        {provider.phiVanChuyen === 0
                          ? "Miễn phí"
                          : formatVND(provider.phiVanChuyen)}
                      </div>
                      {isSelected && (
                        <div className="text-xs text-orange-600 mt-1 flex items-center">
                          <CheckCircleIcon size={12} className="inline mr-1" />
                          Đã chọn
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : comparingShipping ? (
            <div className="text-center py-6">
              <Spin size="small" />
              <p className="text-gray-500 mt-2">
                Đang tính toán phí vận chuyển...
              </p>
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500">
              {!form.getFieldValue("province") ||
              !form.getFieldValue("district") ||
              !form.getFieldValue("DiaChi")
                ? "Vui lòng nhập đầy đủ địa chỉ để tính phí"
                : "Không có đơn vị vận chuyển khả dụng"}
            </div>
          )}
        </div>

        <div className="text-sm font-medium border-t pt-4">
          {shippingLoading
            ? "Đang tính phí vận chuyển..."
            : shippingFee !== undefined
            ? `Phí vận chuyển đã chọn: ${formatVND(shippingFee)}`
            : "Vui lòng nhập địa chỉ để tính phí"}
        </div>
      </div>
    );
  };

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
                    <Input
                      size="large"
                      placeholder="Ví dụ: 123 Đường Láng"
                      onChange={handleAddressDetailChange}
                    />
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
                    disabled={
                      loading || cartItems.length === 0 || comparingShipping
                    }
                    className="w-full mt-10 bg-orange-600 text-white font-bold text-xl py-5 rounded-lg transition disabled:opacity-50 cursor-pointer"
                  >
                    {comparingShipping
                      ? "Đang tính phí vận chuyển..."
                      : loading
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
                      {comparingShipping
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
        width={1000}
        centered
        maskClosable={false}
        destroyOnClose={true}
        closeIcon={null}
        className="checkout-confirm-modal"
      >
        <div className="p-6 md:p-8">
          {qrData ? (
            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              <div>
                <div className="text-center md:text-left flex flex-col items-center">
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                    Quét QR để thanh toán
                  </h2>
                  <p className="text-gray-600 mt-2">
                    Hoàn tất chuyển khoản trong thời gian còn lại
                  </p>
                </div>

                <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-200">
                  <div className="text-center">
                    <img
                      src={qrData.qrUrl}
                      alt="VietQR"
                      className="w-64 h-64 md:w-80 md:h-80 mx-auto object-contain"
                    />
                    <div className="mt-6 text-5xl font-bold text-orange-600 font-mono">
                      {Math.floor(qrCountdown / 60)
                        .toString()
                        .padStart(2, "0")}
                      :{(qrCountdown % 60).toString().padStart(2, "0")}
                    </div>
                    <p className="text-gray-500 mt-2">Thời gian còn lại</p>
                  </div>
                </div>
              </div>
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-4">
                    Thông tin chuyển khoản
                  </h3>

                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
                    <div className="mb-6">
                      <p className="text-gray-700 font-medium">Số tiền</p>
                      <p className="text-4xl font-bold text-orange-600 mt-1">
                        {formatVND(total)}
                      </p>
                    </div>

                    <div className="bg-white rounded-xl p-5 shadow">
                      <p className="text-gray-700 font-medium mb-3">
                        Nội dung chuyển khoản
                      </p>
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-300 font-mono text-blue-800 break-all">
                        {qrData.noiDung}
                      </div>
                      <div className="mt-4 bg-amber-50 px-2 py-3 rounded-lg text-amber-800 font-semibold text-xs">
                        ⚠️ Ghi đúng nội dung để tự động xác nhận đơn!
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-5  text-center">
                  <div className="font-bold text-red-700 text-md">
                    Chỉ bấm khi đã chuyển khoản thành công!
                  </div>
                  <div className="text-red-600 text-sm mt-2">
                    Bấm nhầm → đơn hàng sẽ bị hủy sau 5 phút.
                  </div>
                </div>

                <div className="space-y-3 flex flex-col gap-3">
                  {qrCountdown <= 290 ? (
                    <Button
                      type="primary"
                      danger
                      size="large"
                      loading={loading}
                      onClick={handleConfirmOrder}
                      className="w-full h-14 text-lg font-bold rounded-xl"
                    >
                      Đã chuyển khoản → Xác nhận đơn hàng
                    </Button>
                  ) : (
                    <Button
                      disabled
                      size="large"
                      className="w-full h-14 text-lg rounded-xl"
                    >
                      Chưa thể xác nhận • Vui lòng chuyển khoản trước
                    </Button>
                  )}

                  <Button
                    size="large"
                    onClick={() => {
                      setConfirmOpen(false);
                      setQrData(null);
                      setQrCountdown(300);
                      messageApi.info("Đã hủy thanh toán QR");
                    }}
                    className="w-full rounded-xl"
                  >
                    Hủy thanh toán QR
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div className="text-center md:text-left">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                  Xác nhận đơn hàng
                </h2>
                <p className="text-gray-600 mt-2 text-lg">
                  Vui lòng kiểm tra kỹ thông tin trước khi đặt hàng
                </p>
              </div>
              <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                <div className="space-y-6">
                  <div className="bg-white rounded-2xl shadow-md border border-orange-200 overflow-hidden">
                    <div className="bg-orange-50 px-6 py-4 border-b border-orange-200">
                      <div className="font-bold text-orange-800 text-xl">
                        Tóm tắt thanh toán
                      </div>
                    </div>
                    <div className="p-6 space-y-4">
                      <div className="flex justify-between text-lg">
                        <span className="text-gray-600">Tạm tính</span>
                        <span className="font-semibold">
                          {formatVND(subtotal)}
                        </span>
                      </div>
                      <div className="flex justify-between text-lg">
                        <span className="text-gray-600">Phí vận chuyển</span>
                        <span className="font-semibold">
                          {shippingFee === 0
                            ? "Miễn phí"
                            : formatVND(shippingFee)}
                        </span>
                      </div>
                      {discountAmount > 0 && (
                        <div className="flex justify-between text-lg text-green-600 font-bold">
                          <span>Giảm giá</span>
                          <span>-{formatVND(discountAmount)}</span>
                        </div>
                      )}
                      <div className="pt-4 border-t-2 border-orange-400 flex justify-between items-center">
                        <span className="text-xl font-bold text-gray-800">
                          Tổng cộng
                        </span>
                        <span className="text-xl font-bold text-orange-600">
                          {formatVND(total)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-6">
                    <div className="bg-white rounded-2xl shadow-md border border-blue-200 overflow-hidden">
                      <div className="bg-blue-50 px-5 py-3 border-b border-blue-200">
                        <div className="font-bold text-blue-800">
                          Người nhận
                        </div>
                      </div>
                      <div className="p-5 space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Họ tên:</span>
                          <strong className="text-gray-900">
                            {formValues?.HoTen}
                          </strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">SĐT:</span>
                          <span className="text-gray-900">
                            {formValues?.SoDienThoai}
                          </span>
                        </div>
                        {formValues?.Email && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Email:</span>
                            <span className="text-gray-900">
                              {formValues.Email}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-8">
                  <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">
                    <div className="bg-orange-50 px-6 py-4 border-b border-orange-200">
                      <div className="font-bold text-xl text-orange-800">
                        Sản phẩm
                      </div>
                    </div>
                    <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
                      {cartItems.map((item, index) => (
                        <div
                          key={item.id}
                          className={`flex justify-between items-start pb-4 ${
                            index !== cartItems.length - 1
                              ? "border-b border-gray-200"
                              : ""
                          }`}
                        >
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900 text-lg">
                              {item.tenSanPham || item.ten}
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              {item.tenKichThuoc && (
                                <span className="font-medium">
                                  {item.tenKichThuoc} ×{" "}
                                </span>
                              )}
                              Số lượng: <strong>{item.quantity}</strong>
                            </div>
                          </div>
                          <div className="font-bold text-gray-900 text-lg ml-4">
                            {formatVND(
                              (item.giaSauGiam || item.gia || 0) * item.quantity
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl shadow-md border border-green-200 overflow-hidden">
                    <div className="bg-green-50 px-5 py-3 border-b border-green-200">
                      <div className="font-bold text-green-800">Giao đến</div>
                    </div>
                    <div className="p-5">
                      <p className="font-medium text-gray-900 text-base">
                        {formValues?.DiaChi}
                      </p>
                      <p className="text-gray-700 mt-2">
                        {districtName}, {provinceName}
                      </p>
                    </div>
                  </div>
                  {formValues?.note && (
                    <div className="bg-amber-50 border border-amber-300 rounded-2xl p-5">
                      <div className="font-semibold text-amber-800 mb-2">
                        Ghi chú của bạn
                      </div>
                      <div className="text-amber-900 italic">
                        "{formValues.note}"
                      </div>
                    </div>
                  )}
                  <div className="space-y-4 flex flex-col gap-3">
                    <Button
                      type="primary"
                      danger
                      size="large"
                      loading={loading}
                      onClick={handleConfirmOrder}
                      className="w-full h-16 text-xl font-bold rounded-2xl shadow-xl hover:shadow-2xl transition-shadow"
                    >
                      {loading ? "Đang xử lý..." : "Xác nhận đặt hàng (COD)"}
                    </Button>

                    <Button
                      size="large"
                      onClick={() => setConfirmOpen(false)}
                      className="w-full h-12 rounded-2xl border-2 border-gray-300"
                    >
                      Quay lại chỉnh sửa
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
