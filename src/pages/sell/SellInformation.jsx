import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  InfoIcon,
  TagIcon,
  ToggleLeftIcon,
  ToggleRightIcon,
} from "@phosphor-icons/react";
import {
  Checkbox,
  Col,
  Form,
  Input,
  Row,
  Tabs,
  message,
  Spin,
  Select,
} from "antd";
import SellPay from "./SellPay";
import { fetchPhieuGiamGia } from "@/services/phieuGiamGiaService";
import {
  fetchAllGGKH,
  removeCustomerFromDiscount,
} from "@/services/giamGiaKhachHangService";
import hoaDonApi from "@/api/HoaDonAPI";
import { useDispatch, useSelector } from "react-redux";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import { diaChiApi } from "/src/api/diaChiApi";

dayjs.extend(isBetween);

export default function SellInformation({ selectedBillId, onDiscountApplied }) {
  const [cartItems, setCartItems] = useState([]);
  const dispatch = useDispatch();
  const {
    data: discountData,
    loading,
    error,
  } = useSelector((state) => state.phieuGiamGia);
  const { data: giamGiaKhachHangData, status: giamGiaKHStatus } = useSelector(
    (state) => state.giamGiaKhachHang
  );
  const [messageApi, contextHolder] = message.useMessage();
  const [isDelivery, setIsDelivery] = useState(false);
  const [appliedDiscount, setAppliedDiscount] = useState(null);
  const [cartTotal, setCartTotal] = useState(0);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [forceUpdate, setForceUpdate] = useState(0);
  const [checkingSingleDiscount, setCheckingSingleDiscount] = useState(false);
  const [autoAppliedDiscount, setAutoAppliedDiscount] = useState(false);

  const isApplyingRef = useRef(false);
  const lastAppliedDiscountRef = useRef(null);

  const [availableDiscounts, setAvailableDiscounts] = useState([]);
  const [unavailableDueToMinimum, setUnavailableDueToMinimum] = useState([]);
  const [unavailableDueToUsage, setUnavailableDueToUsage] = useState([]);

  const [tinhList, setTinhList] = useState([]);
  const [localQuanList, setLocalQuanList] = useState([]);
  const [addressForm] = Form.useForm();

  const getPersonalDiscountsForCustomer = () => {
    if (!selectedCustomer || !Array.isArray(giamGiaKhachHangData)) return [];

    const personalDiscountIds = giamGiaKhachHangData
      .filter((ggkh) => ggkh.khachHangId === selectedCustomer.id)
      .map((ggkh) => ggkh.phieuGiamGiaId);

    if (personalDiscountIds.length === 0) return [];

    return discountData.filter(
      (discount) =>
        discount.kieu === 1 && personalDiscountIds.includes(discount.id)
    );
  };

  const getAllActiveDiscounts = () => {
    if (!Array.isArray(discountData)) return [];

    const now = dayjs();

    const publicDiscounts = discountData.filter((discount) => {
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

    const personalDiscounts = getPersonalDiscountsForCustomer().filter(
      (discount) => {
        const isActive =
          discount.trangThai === 1 &&
          now.isBetween(
            dayjs(discount.ngayBatDau),
            dayjs(discount.ngayKetThuc),
            null,
            "[]"
          );

        return isActive;
      }
    );

    return [...publicDiscounts, ...personalDiscounts];
  };

  const checkBasicDiscountConditions = (discount, totalAmount) => {
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

    // QUAN TRỌNG: Kiểm tra điều kiện đơn hàng tối thiểu
    if (
      discount.giaTriDonHangToiThieu &&
      totalAmount < discount.giaTriDonHangToiThieu
    ) {
      return {
        isValid: false,
        message: `Đơn tối thiểu ${discount.giaTriDonHangToiThieu.toLocaleString()} VND`,
        isMinimumAmountNotMet: true,
      };
    }

    if (discount.kieu === 1) {
      if (!selectedCustomer)
        return {
          isValid: false,
          message: "Yêu cầu chọn khách hàng để áp dụng mã cá nhân",
        };

      const isCustomerHasDiscount = giamGiaKhachHangData?.some(
        (ggkh) =>
          ggkh.phieuGiamGiaId === discount.id &&
          ggkh.khachHangId === selectedCustomer.id
      );

      if (!isCustomerHasDiscount) {
        return {
          isValid: false,
          message: `Mã không áp dụng cho khách hàng ${selectedCustomer.hoTen}`,
        };
      }
      // ĐÃ XOÁ KIỂM TRA KHÁCH HÀNG ĐÃ SỬ DỤNG MÃ HAY CHƯA
    }

    return { isValid: true, message: "OK" };
  };

  const calculateDiscountAmount = (discount, total) => {
    if (discount.loaiGiamGia) {
      return Math.min(discount.giaTriGiamGia, total);
    } else {
      const amount = (total * discount.giaTriGiamGia) / 100;
      if (discount.mucGiaGiamToiDa && amount > discount.mucGiaGiamToiDa) {
        return discount.mucGiaGiamToiDa;
      }
      return amount;
    }
  };

  const getBestDiscount = (available) => {
    if (!available.length) return null;

    let best = available[0];
    let max = calculateDiscountAmount(best, cartTotal);

    for (let d of available) {
      const val = calculateDiscountAmount(d, cartTotal);
      if (val > max) {
        max = val;
        best = d;
      }
    }

    return best;
  };

  useEffect(() => {
    const updateDiscounts = () => {
      const allActiveDiscounts = getAllActiveDiscounts();
      const available = [];
      const unavailableMin = [];
      const unavailableUsage = [];

      for (const discount of allActiveDiscounts) {
        const condition = checkBasicDiscountConditions(discount, cartTotal);

        if (condition.isValid) {
          available.push(discount);
        } else if (condition.isMinimumAmountNotMet) {
          unavailableMin.push({
            discount,
            reason: condition.message,
          });
        } else if (condition.isAlreadyUsed) {
          unavailableUsage.push({
            discount,
            reason: condition.message,
          });
        }
      }

      setAvailableDiscounts(available);
      setUnavailableDueToMinimum(unavailableMin);
      setUnavailableDueToUsage(unavailableUsage);
    };

    updateDiscounts();
  }, [
    discountData,
    giamGiaKhachHangData,
    selectedCustomer,
    cartTotal,
    // ĐÃ XOÁ usedDiscountCustomers khỏi dependency
  ]);

  const bestDiscount = useMemo(() => {
    return getBestDiscount(availableDiscounts);
  }, [availableDiscounts, cartTotal]);

  // EFFECT QUAN TRỌNG: Tự động áp dụng/xóa mã giảm giá dựa trên điều kiện
  useEffect(() => {
    const handleAutoDiscount = async () => {
      if (
        !selectedBillId ||
        cartTotal === 0 ||
        loading ||
        checkingSingleDiscount ||
        isApplyingRef.current
      ) {
        return;
      }

      const bestDiscount = getBestDiscount(availableDiscounts);

      // Nếu có mã tốt nhất và đủ điều kiện
      if (bestDiscount && !appliedDiscount) {
        console.log(
          "🔄 Tự động áp dụng mã giảm giá tốt nhất:",
          bestDiscount.maGiamGia
        );

        try {
          isApplyingRef.current = true;
          const condition = checkBasicDiscountConditions(
            bestDiscount,
            cartTotal
          );

          if (condition.isValid) {
            await applyDiscount(bestDiscount);
            setAutoAppliedDiscount(true);
            console.log(
              "✅ Đã tự động áp dụng mã giảm giá:",
              bestDiscount.maGiamGia
            );
          }
        } catch (error) {
          console.error("Lỗi khi tự động áp dụng mã giảm giá:", error);
        } finally {
          isApplyingRef.current = false;
        }
      }
      // Nếu không có mã khả dụng hoặc không đủ điều kiện, nhưng đang có mã áp dụng
      else if (!bestDiscount && appliedDiscount) {
        console.log("🔄 Tự động xóa mã giảm giá do không đủ điều kiện");
        removeDiscount();
      }
      // Nếu mã đang áp dụng không còn khả dụng
      else if (
        appliedDiscount &&
        bestDiscount &&
        appliedDiscount.id !== bestDiscount.id
      ) {
        console.log("🔄 Tự động chuyển sang mã giảm giá tốt hơn");
        try {
          isApplyingRef.current = true;
          const condition = checkBasicDiscountConditions(
            bestDiscount,
            cartTotal
          );

          if (condition.isValid) {
            await applyDiscount(bestDiscount);
            setAutoAppliedDiscount(true);
            console.log(
              "✅ Đã chuyển sang mã giảm giá tốt hơn:",
              bestDiscount.maGiamGia
            );
          }
        } catch (error) {
          console.error("Lỗi khi chuyển mã giảm giá:", error);
        } finally {
          isApplyingRef.current = false;
        }
      }
    };

    handleAutoDiscount();
  }, [
    selectedBillId,
    cartTotal,
    appliedDiscount,
    availableDiscounts,
    loading,
    checkingSingleDiscount,
    selectedCustomer,
  ]);

  useEffect(() => {
    setAutoAppliedDiscount(false);
    lastAppliedDiscountRef.current = null;
    isApplyingRef.current = false;
  }, [selectedBillId]);

  useEffect(() => {
    if (selectedCustomer && appliedDiscount?.isPersonal) {
      const currentCustomerId = selectedCustomer.id;

      const isDiscountForCurrentCustomer = giamGiaKhachHangData?.some(
        (ggkh) =>
          ggkh.phieuGiamGiaId === appliedDiscount.id &&
          ggkh.khachHangId === currentCustomerId
      );

      if (!isDiscountForCurrentCustomer) {
        console.log("🔄 Khách hàng thay đổi, tự động xóa mã giảm giá cá nhân");
        removeDiscount();
      }
    } else if (!selectedCustomer && appliedDiscount?.isPersonal) {
      console.log("🔄 Đã bỏ chọn khách hàng, tự động xóa mã giảm giá cá nhân");
      removeDiscount();
    }
  }, [selectedCustomer, appliedDiscount, giamGiaKhachHangData]);

  // Các useEffect khác giữ nguyên
  useEffect(() => {
    diaChiApi
      .getAllTinhThanh()
      .then(setTinhList)
      .catch((err) => {
        console.error("Lỗi load tỉnh/thành:", err);
        messageApi.error("Không thể tải danh sách tỉnh/thành");
      });
  }, [messageApi]);

  useEffect(() => {
    if (selectedCustomer?.diaChi) {
      const idTinh =
        selectedCustomer.diaChi.tinhThanhId ||
        selectedCustomer.diaChi.id_tinh ||
        selectedCustomer.diaChi.idTinh ||
        selectedCustomer.diaChi.thanhPho;

      if (idTinh) {
        diaChiApi
          .getQuanByTinh(idTinh)
          .then((res) => {
            setLocalQuanList(res);
          })
          .catch((err) => {
            console.error("Lỗi load quận/huyện:", err);
            messageApi.error("Không thể tải danh sách quận/huyện");
          });
      } else {
        setLocalQuanList([]);
      }
    } else {
      setLocalQuanList([]);
    }
  }, [selectedCustomer, messageApi]);

  useEffect(() => {
    if (selectedBillId) {
      const bills = JSON.parse(localStorage.getItem("pendingBills")) || [];
      const currentBill = bills.find((bill) => bill.id === selectedBillId);

      if (currentBill) {
        const billIsDelivery = currentBill.isDelivery || false;
        setIsDelivery(billIsDelivery);
      }
    } else {
      setIsDelivery(false);
    }
  }, [selectedBillId]);

  useEffect(() => {
    if (selectedCustomer && isDelivery) {
      const customerAddress = selectedCustomer.diaChi;

      if (customerAddress) {
        const formValues = {
          HoTen: selectedCustomer.hoTen,
          SoDienThoai: selectedCustomer.sdt,
          thanhPho:
            customerAddress.tinhThanhId ||
            customerAddress.id_tinh ||
            customerAddress.idTinh ||
            customerAddress.thanhPho ||
            null,
          quan:
            customerAddress.quanHuyenId ||
            customerAddress.id_quan ||
            customerAddress.idQuan ||
            customerAddress.quan ||
            null,
          diaChiCuThe:
            customerAddress.dia_chi_cu_the || customerAddress.diaChiCuThe || "",
        };

        addressForm.setFieldsValue(formValues);
      } else {
        addressForm.setFieldsValue({
          HoTen: selectedCustomer.hoTen,
          SoDienThoai: selectedCustomer.sdt,
          thanhPho: null,
          quan: null,
          diaChiCuThe: "",
        });
      }
    } else if (!selectedCustomer && isDelivery) {
      addressForm.resetFields();
    }
  }, [selectedCustomer, isDelivery, addressForm]);

  useEffect(() => {
    if (cartTotal === 0 && appliedDiscount) {
      removeDiscount();
    }
  }, [cartTotal, appliedDiscount]);

  useEffect(() => {
    const loadDiscounts = async () => {
      try {
        await dispatch(fetchPhieuGiamGia());
        await dispatch(fetchAllGGKH());
      } catch (err) {
        console.error("Lỗi khi load dữ liệu giảm giá:", err);
        messageApi.error("Không thể tải dữ liệu mã giảm giá");
      }
    };
    loadDiscounts();
  }, [dispatch, messageApi]);

  useEffect(() => {
    const updateCartData = () => {
      if (selectedBillId) {
        const bills = JSON.parse(localStorage.getItem("pendingBills")) || [];
        const currentBill = bills.find((bill) => bill.id === selectedBillId);

        if (currentBill) {
          const itemsFromCart = currentBill.cart || [];
          const itemsFromItems = currentBill.items || [];

          const allCartItems =
            itemsFromCart.length > 0 ? itemsFromCart : itemsFromItems;

          setCartItems(allCartItems);
          setCartTotal(currentBill.totalAmount || 0);
          setAppliedDiscount(currentBill.appliedDiscount || null);

          const normalizedCustomer = normalizeCustomerData(
            currentBill.customer
          );
          setSelectedCustomer(normalizedCustomer);
        }
      } else {
        setCartItems([]);
        setCartTotal(0);
        setAppliedDiscount(null);
        setSelectedCustomer(null);
      }
    };

    updateCartData();

    window.addEventListener("billsUpdated", updateCartData);
    window.addEventListener("cartUpdated", updateCartData);
    window.addEventListener("customerSelected", updateCartData);

    return () => {
      window.removeEventListener("billsUpdated", updateCartData);
      window.removeEventListener("cartUpdated", updateCartData);
      window.removeEventListener("customerSelected", updateCartData);
    };
  }, [selectedBillId]);

  const normalizeCustomerData = (customerData) => {
    if (!customerData) return null;

    let defaultAddress = null;

    if (customerData.diaChi && Array.isArray(customerData.diaChi)) {
      defaultAddress =
        customerData.diaChi.find((addr) => addr.trangThai === true) ||
        customerData.diaChi[0] ||
        null;
    } else if (customerData.diaChi && typeof customerData.diaChi === "object") {
      defaultAddress = customerData.diaChi;
    }

    return {
      id:
        customerData.id || customerData.idKhachHang || customerData.khachHangId,
      hoTen: customerData.ho_ten || customerData.hoTen || "",
      sdt: customerData.sdt || "",
      email: customerData.email || "",
      gioiTinh: customerData.gioi_tinh || customerData.gioiTinh,
      ngaySinh: customerData.ngay_sinh || customerData.ngaySinh,
      diaChi: defaultAddress,
    };
  };

  const handleToggleDelivery = () => {
    const newIsDelivery = !isDelivery;
    setIsDelivery(newIsDelivery);

    if (!newIsDelivery) {
      addressForm.resetFields();
    }

    if (selectedBillId) {
      const bills = JSON.parse(localStorage.getItem("pendingBills")) || [];
      const updatedBills = bills.map((bill) => {
        if (bill.id === selectedBillId) {
          return {
            ...bill,
            isDelivery: newIsDelivery,
          };
        }
        return bill;
      });
      localStorage.setItem("pendingBills", JSON.stringify(updatedBills));
      window.dispatchEvent(new Event("billsUpdated"));
    }
  };

  const handleTinhChange = async (idTinh) => {
    addressForm.setFieldsValue({ quan: null });
    try {
      const res = await diaChiApi.getQuanByTinh(idTinh);
      setLocalQuanList(res);
    } catch (err) {
      console.error("Lỗi load quận/huyện:", err);
      messageApi.error("Không thể tải danh sách quận/huyện");
    }
  };

  const removeCustomerFromDiscount = async (discountId, customerId) => {
    try {
      const response = await removeCustomerFromDiscount(discountId, customerId);

      if (response?.isSuccess) {
        console.log(
          `✅ Đã xoá khách hàng ${customerId} khỏi phiếu giảm giá ${discountId}`
        );
        await dispatch(fetchAllGGKH());
        return true;
      } else {
        console.warn("Không thể xoá khách hàng khỏi giảm giá");
        return false;
      }
    } catch (error) {
      console.error("Lỗi khi xoá khách hàng khỏi giảm giá:", error);
      return false;
    }
  };

  const applyDiscount = async (discount) => {
    if (!selectedBillId) return;

    if (cartTotal === 0) {
      return;
    }

    try {
      const condition = checkBasicDiscountConditions(discount, cartTotal);

      if (!condition.isValid) {
        return;
      }

      const discountAmount = calculateDiscountAmount(discount, cartTotal);
      const final = Math.max(0, cartTotal - discountAmount);

      const bills = JSON.parse(localStorage.getItem("pendingBills")) || [];
      const updated = bills.map((b) =>
        b.id === selectedBillId
          ? {
              ...b,
              appliedDiscount: {
                id: discount.id,
                code: discount.maGiamGia,
                name: discount.tenChuongTrinh,
                discountAmount,
                finalAmount: final,
                type: discount.loaiGiamGia ? "fixed" : "percentage",
                value: discount.giaTriGiamGia,
                loaiPhieu: discount.kieu === 1 ? "CÁ_NHÂN" : "CÔNG_KHAI",
                isPersonal: discount.kieu === 1,
              },
            }
          : b
      );

      localStorage.setItem("pendingBills", JSON.stringify(updated));
      setAppliedDiscount(
        updated.find((b) => b.id === selectedBillId)?.appliedDiscount
      );

      if (onDiscountApplied) {
        onDiscountApplied({
          discountAmount,
          finalAmount: final,
          discountCode: discount.maGiamGia,
        });
      }

      console.log(`✅ Áp dụng ${discount.maGiamGia} thành công`);
      window.dispatchEvent(new Event("billsUpdated"));
    } catch (error) {
      messageApi.destroy(loadingMessage);
      console.error("Lỗi khi áp dụng mã giảm giá:", error);
    }
  };

  const removeDiscount = () => {
    if (!selectedBillId) return;

    const bills = JSON.parse(localStorage.getItem("pendingBills")) || [];
    const updated = bills.map((b) => {
      if (b.id === selectedBillId) {
        const { appliedDiscount, ...rest } = b;
        return rest;
      }
      return b;
    });

    localStorage.setItem("pendingBills", JSON.stringify(updated));
    setAppliedDiscount(null);
    setAutoAppliedDiscount(false);
    lastAppliedDiscountRef.current = null;

    if (onDiscountApplied) {
      onDiscountApplied({
        discountAmount: 0,
        finalAmount: cartTotal,
        discountCode: null,
      });
    }

    console.log("✅ Đã xóa mã giảm giá!");
    window.dispatchEvent(new Event("billsUpdated"));
  };

  // COMPONENT HIỂN THỊ MÃ GIẢM GIÁ ĐÃ ĐƯỢC ÁP DỤNG
  const renderAppliedDiscount = () => {
    if (!appliedDiscount) return null;

    return (
      <div className="relative p-4 border-2 border-[#00A96C] bg-[#E9FBF4] rounded-xl flex flex-col items-start gap-3">
        <div className="absolute font-semibold bg-[#00A96C] right-0 top-0 rounded-tr-xl rounded-bl-xl py-1 px-4 text-white">
          Đã áp dụng
        </div>
        <div className="text-white font-semibold px-5 py-1 rounded-md bg-[#00A96C]">
          {appliedDiscount.code}
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="flex gap-2 items-center">
              <TagIcon size={24} weight="fill" />
              <span className="font-semibold text-xl">Giảm:</span>
            </div>
            <span className="text-lg font-semibold text-red-800">
              {appliedDiscount.type === "fixed"
                ? `-${appliedDiscount.value.toLocaleString()} VND`
                : `-${appliedDiscount.value}%`}
            </span>
          </div>
          <div className="text-md font-semibold text-gray-700">
            {appliedDiscount.name}
          </div>
          {appliedDiscount.isPersonal && selectedCustomer && (
            <div className="text-md font-semibold text-[#00A96C]">
              ✓ Mã cá nhân dành riêng cho {selectedCustomer.hoTen}
            </div>
          )}
          {autoAppliedDiscount && (
            <div className="text-md font-semibold text-[#00A96C]">
              ✓ Đã tự động áp dụng mã giảm giá tốt nhất
            </div>
          )}
        </div>
      </div>
    );
  };

  // COMPONENT HIỂN THỊ MÃ GIẢM GIÁ ĐANG KHẢ DỤNG (CHỈ HIỂN THỊ, KHÔNG CÓ NÚT)
  const renderAvailableDiscounts = () => {
    if (availableDiscounts.length === 0 || appliedDiscount) return null;

    const bestDiscount = getBestDiscount(availableDiscounts);
    if (!bestDiscount) return null;

    return (
      <div className="relative p-4 border-2 border-amber-500 bg-amber-50 rounded-xl flex flex-col items-start gap-3">
        <div className="absolute font-semibold bg-amber-700 right-0 top-0 rounded-tr-xl rounded-bl-xl py-1 px-4 text-white">
          Mã tốt nhất
        </div>
        <div className="text-white font-semibold px-5 py-1 rounded-md bg-amber-700">
          {bestDiscount.maGiamGia}
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="flex gap-2 items-center">
              <TagIcon size={24} weight="fill" />
              <span className="font-semibold text-xl">Giảm:</span>
            </div>
            <span className="text-lg font-semibold text-red-800">
              {bestDiscount.loaiGiamGia
                ? `-${bestDiscount.giaTriGiamGia.toLocaleString()} VND`
                : `-${bestDiscount.giaTriGiamGia}%`}
            </span>
          </div>
          <div className="text-md font-semibold text-gray-700">
            Hết hạn: {dayjs(bestDiscount.ngayKetThuc).format("DD/MM/YYYY")}
          </div>
          <div className="text-md font-semibold text-gray-700">
            {bestDiscount.giaTriDonHangToiThieu
              ? `Đơn tối thiểu: ${bestDiscount.giaTriDonHangToiThieu.toLocaleString()} VND`
              : bestDiscount.mucGiaGiamToiDa
              ? `Giảm tối đa: ${bestDiscount.mucGiaGiamToiDa.toLocaleString()} VND`
              : "Không có điều kiện"}
          </div>
          {bestDiscount.kieu === 1 && selectedCustomer && (
            <div className="text-md font-semibold text-[#00A96C]">
              ✓ Mã cá nhân dành riêng cho {selectedCustomer.hoTen}
            </div>
          )}
          <div className="text-md font-semibold text-[#00A96C] mt-2">
            ✅ Mã giảm giá sẽ được tự động áp dụng
          </div>
        </div>
      </div>
    );
  };

  const items = [
    {
      key: "1",
      label: "Mã giảm giá",
      children: (
        <div className="flex flex-col gap-4">
          {loading || checkingSingleDiscount ? (
            <div className="text-center py-4">
              <Spin size="large" />
              <div>Đang tải mã giảm giá...</div>
            </div>
          ) : (
            <>
              {/* Hiển thị mã đã áp dụng */}
              {renderAppliedDiscount()}

              {/* Hiển thị mã khả dụng (chỉ khi chưa có mã nào được áp dụng) */}
              {renderAvailableDiscounts()}

              {/* Hiển thị thông báo khi không có mã nào */}
              {!appliedDiscount && availableDiscounts.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  {cartTotal > 0
                    ? selectedCustomer
                      ? "Không có mã giảm giá khả dụng cho khách hàng này"
                      : "Không có mã giảm giá khả dụng. Vui lòng chọn khách hàng để xem thêm mã giảm giá cá nhân."
                    : "Thêm sản phẩm vào giỏ hàng để xem mã giảm giá"}
                </div>
              )}
            </>
          )}

          <SellPay
            cartTotal={cartTotal}
            appliedDiscount={appliedDiscount}
            onRemoveDiscount={removeDiscount}
            selectedCustomer={selectedCustomer}
            cartItems={cartItems}
            selectedBillId={selectedBillId}
            isDelivery={isDelivery}
            addressForm={addressForm}
            tinhList={tinhList}
            localQuanList={localQuanList}
            removeCustomerFromDiscount={removeCustomerFromDiscount}
          />
        </div>
      ),
    },
  ];

  return (
    <>
      {contextHolder}
      <div className="shadow overflow-hidden bg-white rounded-lg h-full">
        <div className="p-3 font-bold text-xl bg-gray-200 rounded-t-lg flex gap-2 justify-between">
          <div className="flex gap-2 items-center">
            <InfoIcon size={24} />
            Thông tin đơn
          </div>
          <div
            className="flex items-center gap-2 cursor-pointer select-none"
            onClick={handleToggleDelivery}
          >
            {isDelivery ? (
              <>
                <ToggleRightIcon weight="fill" size={30} color="#00A96C" />
                <span className="text-sm font-semibold text-gray-600">
                  Bán giao hàng
                </span>
              </>
            ) : (
              <>
                <ToggleLeftIcon weight="fill" size={30} color="#c5c5c5" />
                <span className="text-sm font-semibold text-gray-600">
                  Bán giao hàng
                </span>
              </>
            )}
          </div>
        </div>

        {isDelivery && (
          <div className="p-4 flex flex-col gap-4">
            <div className="font-semibold text-2xl">Thông tin người nhận</div>
            <div className="p-4 border border-gray-300 rounded-xl">
              <Form
                layout="vertical"
                form={addressForm}
                onFinish={() => {}}
                initialValues={{
                  thanhPho: null,
                  quan: null,
                }}
              >
                <Row gutter={16} wrap>
                  <Col flex="1">
                    <Form.Item
                      name="hoTen"
                      label="Tên Khách hàng"
                      rules={[
                        { required: true, message: "Nhập tên Khách hàng" },
                      ]}
                    >
                      <Input placeholder="Nhập tên Khách hàng" />
                    </Form.Item>
                  </Col>
                  <Col flex="1">
                    <Form.Item
                      name="sdt"
                      label="Số điện thoại"
                      rules={[
                        { required: true, message: "Nhập số điện thoại" },
                        {
                          pattern: /^0\d{9}$/,
                          message:
                            "Số điện thoại phải gồm 10 chữ số và bắt đầu bằng 0",
                        },
                      ]}
                    >
                      <Input placeholder="Nhập số điện thoại" />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={16} wrap>
                  <Col flex="1">
                    <Form.Item
                      name="thanhPho"
                      label="Tỉnh/Thành phố"
                      rules={[{ required: true, message: "Chọn tỉnh/thành!" }]}
                    >
                      <Select
                        placeholder="Chọn tỉnh/thành"
                        onChange={handleTinhChange}
                        showSearch
                        optionFilterProp="children"
                        filterOption={(input, option) =>
                          option.children
                            .toLowerCase()
                            .includes(input.toLowerCase())
                        }
                      >
                        {tinhList.map((t) => (
                          <Select.Option key={t.id} value={t.id}>
                            {t.tenTinh}
                          </Select.Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col flex="1">
                    <Form.Item
                      name="quan"
                      label="Quận/Huyện"
                      rules={[{ required: true, message: "Chọn quận/huyện!" }]}
                    >
                      <Select
                        placeholder="Chọn quận/huyện"
                        disabled={!localQuanList.length}
                        showSearch
                        optionFilterProp="children"
                        filterOption={(input, option) =>
                          option.children
                            .toLowerCase()
                            .includes(input.toLowerCase())
                        }
                      >
                        {localQuanList.map((q) => (
                          <Select.Option key={q.id} value={q.id}>
                            {q.tenQuan}
                          </Select.Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>
                <Form.Item
                  name="diaChiCuThe"
                  label="Số nhà, đường"
                  rules={[{ required: true, message: "Nhập địa chỉ" }]}
                >
                  <Input placeholder="Nhập địa chỉ cụ thể" />
                </Form.Item>

                <div className="flex justify-between items-center mt-4">
                  <span className="font-medium">Giao hàng tận nhà</span>
                  <Checkbox defaultChecked />
                </div>
              </Form>
            </div>
          </div>
        )}

        <div className="p-4 flex flex-col gap-4">
          <div className="font-semibold text-2xl">Mã giảm giá</div>
          <Tabs defaultActiveKey="1" items={items} className="custom-tabs" />
        </div>
      </div>
    </>
  );
}
