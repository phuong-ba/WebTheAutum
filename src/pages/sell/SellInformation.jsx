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
  Modal,
  Table,
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
  const [addressModalVisible, setAddressModalVisible] = useState(false);
  const [customerAddresses, setCustomerAddresses] = useState([]);
  const isApplyingRef = useRef(false);
  const lastAppliedDiscountRef = useRef(null);

  const [availableDiscounts, setAvailableDiscounts] = useState([]);
  const [unavailableDueToMinimum, setUnavailableDueToMinimum] = useState([]);
  const [unavailableDueToUsage, setUnavailableDueToUsage] = useState([]);

  const [tinhList, setTinhList] = useState([]);
  const [localQuanList, setLocalQuanList] = useState([]);
  const [addressForm] = Form.useForm();

  // --- SỬA: Thêm state để lưu quận theo tỉnh ---
  const [quanMap, setQuanMap] = useState({});

  // --- SỬA: Tính toán lại discountAmount mỗi khi cartTotal thay đổi ---
  const calculatedDiscount = useMemo(() => {
    if (!appliedDiscount || cartTotal === 0) {
      return {
        discountAmount: 0,
        finalAmount: cartTotal,
      };
    }

    let discountAmount = 0;

    if (appliedDiscount.type === "fixed") {
      // Giảm giá cố định
      discountAmount = Math.min(appliedDiscount.value, cartTotal);
    } else {
      // Giảm giá phần trăm
      discountAmount = (cartTotal * appliedDiscount.value) / 100;

      // Kiểm tra giới hạn tối đa nếu có
      if (
        appliedDiscount.maxDiscountAmount &&
        discountAmount > appliedDiscount.maxDiscountAmount
      ) {
        discountAmount = appliedDiscount.maxDiscountAmount;
      }

      // Đảm bảo không giảm quá tổng tiền
      discountAmount = Math.min(discountAmount, cartTotal);
    }

    const finalAmount = Math.max(0, cartTotal - discountAmount);

    return {
      discountAmount,
      finalAmount,
    };
  }, [appliedDiscount, cartTotal]);

  // --- SỬA: Cập nhật localStorage khi calculatedDiscount thay đổi ---
  useEffect(() => {
    if (appliedDiscount && selectedBillId) {
      const bills = JSON.parse(localStorage.getItem("pendingBills")) || [];
      const currentBill = bills.find((bill) => bill.id === selectedBillId);

      if (!currentBill) return;

      // Chỉ cập nhật nếu có sự thay đổi thực sự
      const currentDiscountAmount =
        currentBill.appliedDiscount?.discountAmount || 0;
      const currentFinalAmount =
        currentBill.appliedDiscount?.finalAmount || cartTotal;

      if (
        currentDiscountAmount !== calculatedDiscount.discountAmount ||
        currentFinalAmount !== calculatedDiscount.finalAmount
      ) {
        const updated = bills.map((b) => {
          if (b.id === selectedBillId && b.appliedDiscount) {
            return {
              ...b,
              appliedDiscount: {
                ...b.appliedDiscount,
                discountAmount: calculatedDiscount.discountAmount,
                finalAmount: calculatedDiscount.finalAmount,
              },
            };
          }
          return b;
        });

        localStorage.setItem("pendingBills", JSON.stringify(updated));

        if (onDiscountApplied) {
          onDiscountApplied({
            discountAmount: calculatedDiscount.discountAmount,
            finalAmount: calculatedDiscount.finalAmount,
            discountCode: appliedDiscount.code,
          });
        }

        window.dispatchEvent(new Event("billsUpdated"));
      }
    }
  }, [
    calculatedDiscount.discountAmount,
    calculatedDiscount.finalAmount,
    selectedBillId,
  ]); // Chỉ theo dõi giá trị cụ thể

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

  // --- SỬA: openAddressModal - Load quận cho TẤT CẢ tỉnh ---
  const openAddressModal = async () => {
    if (!selectedCustomer) {
      messageApi.warning("Vui lòng chọn khách hàng trước!");
      return;
    }

    try {
      const addresses = selectedCustomer.allAddresses || [];

      if (addresses.length === 0) {
        messageApi.info("Khách hàng chưa có địa chỉ nào.");
        return;
      }

      // Lấy danh sách tỉnh cần load quận
      const tinhIds = [
        ...new Set(
          addresses
            .map((addr) => addr.tinhThanhId || addr.id_tinh || addr.idTinh)
            .filter(Boolean)
        ),
      ];

      // Load quận cho từng tỉnh
      const newQuanMap = { ...quanMap };
      await Promise.all(
        tinhIds.map(async (idTinh) => {
          if (!newQuanMap[idTinh]) {
            try {
              const res = await diaChiApi.getQuanByTinh(idTinh);
              newQuanMap[idTinh] = res;
            } catch (err) {
              console.error(`Lỗi load quận cho tỉnh ${idTinh}:`, err);
              newQuanMap[idTinh] = [];
            }
          }
        })
      );

      setQuanMap(newQuanMap);

      // Chuẩn hóa địa chỉ với tên tỉnh/quận
      const normalized = addresses.map((addr) => {
        const idTinh = addr.tinhThanhId || addr.id_tinh || addr.idTinh;
        const idQuan = addr.quanHuyenId || addr.id_quan || addr.idQuan;

        const tinh = tinhList.find((t) => t.id === idTinh);
        const quanList = newQuanMap[idTinh] || [];
        const quan = quanList.find((q) => q.id === idQuan);

        return {
          ...addr,
          tinhTen: addr.tenTinh || tinh?.tenTinh || "Không xác định",
          quanTen: addr.tenQuan || quan?.tenQuan || "Không xác định",
          diaChiCuThe: addr.dia_chi_cu_the || addr.diaChiCuThe || "",
        };
      });

      setCustomerAddresses(normalized);
      setAddressModalVisible(true);
    } catch (err) {
      console.error("Lỗi tải địa chỉ:", err);
      messageApi.error("Không thể tải danh sách địa chỉ");
    }
  };

  const handleSelectAddress = async (record) => {
    const idTinh =
      record.tinhThanhId || record.id_tinh || record.idTinh || record.thanhPho;
    const idQuan =
      record.quanHuyenId || record.id_quan || record.idQuan || record.quan;
    const diaChiCuThe = record.dia_chi_cu_the || record.diaChiCuThe || "";

    try {
      let quanList = [];
      if (idTinh) {
        quanList = await handleTinhChange(idTinh);
      }

      const formValues = {
        HoTen: selectedCustomer.hoTen,
        SoDienThoai: selectedCustomer.sdt,
        thanhPho: idTinh,
        quan: idQuan,
        diaChiCuThe,
      };

      addressForm.setFieldsValue(formValues);
      messageApi.success("Đã chọn địa chỉ thành công!");
    } catch (err) {
      console.error("Lỗi khi chọn địa chỉ:", err);
      messageApi.error("Không thể cập nhật quận/huyện");
    } finally {
      setAddressModalVisible(false);
    }
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

      for (const discount of allActiveDiscounts) {
        const condition = checkBasicDiscountConditions(discount, cartTotal);

        if (condition.isValid) {
          available.push(discount);
        } else if (condition.isMinimumAmountNotMet) {
          unavailableMin.push({
            discount,
            reason: condition.message,
          });
        }
      }

      setAvailableDiscounts(available);
      setUnavailableDueToMinimum(unavailableMin);
      setUnavailableDueToUsage([]);
    };

    updateDiscounts();
  }, [discountData, giamGiaKhachHangData, selectedCustomer, cartTotal]);

  const bestDiscount = useMemo(() => {
    return getBestDiscount(availableDiscounts);
  }, [availableDiscounts, cartTotal]);

  // --- SỬA QUAN TRỌNG: Đơn giản hóa logic tự động áp dụng mã giảm giá ---
  useEffect(() => {
    const autoApplyBestDiscount = async () => {
      // Điều kiện để không chạy auto apply
      if (
        !selectedBillId ||
        cartTotal === 0 ||
        loading ||
        checkingSingleDiscount ||
        isApplyingRef.current ||
        availableDiscounts.length === 0
      ) {
        return;
      }

      const bestDiscount = getBestDiscount(availableDiscounts);

      if (!bestDiscount) return;

      // Kiểm tra điều kiện áp dụng
      const condition = checkBasicDiscountConditions(bestDiscount, cartTotal);
      if (!condition.isValid) return;

      // Chỉ áp dụng nếu:
      // 1. Chưa có mã nào được áp dụng HOẶC
      // 2. Mã hiện tại không phải là mã tốt nhất HOẶC
      // 3. Có sự thay đổi về cartTotal mà mã hiện tại không còn khả dụng
      const shouldApply =
        !appliedDiscount ||
        appliedDiscount.id !== bestDiscount.id ||
        (appliedDiscount &&
          !checkBasicDiscountConditions(appliedDiscount, cartTotal).isValid);

      if (shouldApply) {
        console.log(
          "🔄 Tự động áp dụng mã giảm giá tốt nhất:",
          bestDiscount.maGiamGia
        );

        try {
          isApplyingRef.current = true;
          await applyDiscount(bestDiscount);
          setAutoAppliedDiscount(true);
        } catch (error) {
          console.error("❌ Lỗi khi tự động áp dụng mã giảm giá:", error);
        } finally {
          isApplyingRef.current = false;
        }
      }
    };

    // Thêm timeout nhỏ để tránh chạy quá nhiều lần
    const timeoutId = setTimeout(autoApplyBestDiscount, 100);
    return () => clearTimeout(timeoutId);
  }, [
    cartTotal,
    availableDiscounts,
    appliedDiscount,
    selectedBillId,
    loading,
    checkingSingleDiscount,
  ]);

  // --- SỬA: Thêm useEffect để xóa mã giảm giá khi không đủ điều kiện ---
  useEffect(() => {
    const checkAndRemoveInvalidDiscount = () => {
      if (!appliedDiscount || !selectedBillId || cartTotal === 0) return;

      // Kiểm tra xem mã đang áp dụng có còn hợp lệ không
      const currentDiscount = discountData?.find(
        (d) => d.id === appliedDiscount.id
      );
      if (!currentDiscount) {
        removeDiscount();
        return;
      }

      const condition = checkBasicDiscountConditions(
        currentDiscount,
        cartTotal
      );
      if (!condition.isValid) {
        console.log("🔄 Xóa mã giảm giá do không đủ điều kiện");
        removeDiscount();
      }
    };

    checkAndRemoveInvalidDiscount();
  }, [cartTotal, appliedDiscount, discountData, selectedBillId]);

  useEffect(() => {
    if (selectedCustomer && appliedDiscount?.isPersonal) {
      const currentCustomerId = selectedCustomer.id;

      const isDiscountForCurrentCustomer = giamGiaKhachHangData?.some(
        (ggkh) =>
          ggkh.phieuGiamGiaId === appliedDiscount.id &&
          ggkh.khachHangId === currentCustomerId
      );

      if (!isDiscountForCurrentCustomer) {
        removeDiscount();
      }
    } else if (!selectedCustomer && appliedDiscount?.isPersonal) {
      removeDiscount();
    }
  }, [selectedCustomer, appliedDiscount, giamGiaKhachHangData]);

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

      if (idTinh && !quanMap[idTinh]) {
        diaChiApi
          .getQuanByTinh(idTinh)
          .then((res) => {
            setQuanMap((prev) => ({ ...prev, [idTinh]: res }));
            setLocalQuanList(res);
          })
          .catch((err) => {
            console.error("Lỗi load quận/huyện:", err);
          });
      } else if (quanMap[idTinh]) {
        setLocalQuanList(quanMap[idTinh]);
      }
    } else {
      setLocalQuanList([]);
    }
  }, [selectedCustomer, quanMap]);

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
    const setupAddress = async () => {
      if (selectedCustomer && isDelivery) {
        const defaultAddr = selectedCustomer.diaChi;
        if (defaultAddr) {
          const idTinh =
            defaultAddr.tinhThanhId ||
            defaultAddr.id_tinh ||
            defaultAddr.idTinh ||
            defaultAddr.thanhPho;

          const idQuan =
            defaultAddr.quanHuyenId ||
            defaultAddr.id_quan ||
            defaultAddr.idQuan ||
            defaultAddr.quan;

          const diaChiCuThe =
            defaultAddr.dia_chi_cu_the || defaultAddr.diaChiCuThe || "";

          const formValues = {
            HoTen: selectedCustomer.hoTen,
            SoDienThoai: selectedCustomer.sdt,
            thanhPho: idTinh,
            quan: idQuan,
            diaChiCuThe,
          };

          addressForm.setFieldsValue(formValues);

          if (idTinh) {
            try {
              await handleTinhChange(idTinh);
              addressForm.setFieldsValue({ quan: idQuan });
            } catch (err) {
              console.error("Lỗi load quận mặc định:", err);
            }
          }
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
    };

    setupAddress();
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
    const currentTinh = addressForm.getFieldValue("thanhPho");
    if (currentTinh && quanMap[currentTinh]) {
      setLocalQuanList(quanMap[currentTinh]);
    }
  }, [quanMap, addressForm]);

  // --- SỬA: Đơn giản hóa việc theo dõi thay đổi bill ---
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

    const handleBillsUpdated = () => {
      if (selectedBillId) {
        updateCartData();
      }
    };

    window.addEventListener("billsUpdated", handleBillsUpdated);
    window.addEventListener("cartUpdated", handleBillsUpdated);
    window.addEventListener("customerSelected", handleBillsUpdated);

    return () => {
      window.removeEventListener("billsUpdated", handleBillsUpdated);
      window.removeEventListener("cartUpdated", handleBillsUpdated);
      window.removeEventListener("customerSelected", handleBillsUpdated);
    };
  }, [selectedBillId]);

  const normalizeCustomerData = (customerData) => {
    if (!customerData) return null;

    let addresses = [];
    let defaultAddress = null;

    if (customerData.diaChi && Array.isArray(customerData.diaChi)) {
      addresses = customerData.diaChi;
      defaultAddress =
        addresses.find((addr) => addr.trangThai === true) ||
        addresses[0] ||
        null;
    } else if (customerData.diaChi && typeof customerData.diaChi === "object") {
      addresses = [customerData.diaChi];
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
      allAddresses: addresses,
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
    console.log("handleTinhChange called with:", idTinh);
    addressForm.setFieldsValue({ quan: null });

    if (quanMap[idTinh]) {
      console.log("Dùng cache quận:", quanMap[idTinh]);
      setLocalQuanList(quanMap[idTinh]);
      return quanMap[idTinh];
    }

    try {
      const res = await diaChiApi.getQuanByTinh(idTinh);
      console.log("Load quận từ API:", res);

      setQuanMap((prev) => {
        const newMap = { ...prev, [idTinh]: res };
        return newMap;
      });

      setLocalQuanList(res);
      return res;
    } catch (err) {
      console.error("Lỗi load quận:", err);
      messageApi.error("Không thể tải danh sách quận/huyện");
      throw err;
    }
  };

  const handleRemoveCustomerFromDiscount = async (discountId, customerId) => {
    try {
      const response = await removeCustomerFromDiscount(discountId, customerId);

      if (response?.isSuccess) {
        console.log(
          `Đã xoá khách hàng ${customerId} khỏi phiếu giảm giá ${discountId} sau khi thanh toán`
        );
        await dispatch(fetchAllGGKH());
        return true;
      } else {
        console.warn(
          "Không thể xoá khách hàng khỏi giảm giá sau khi thanh toán"
        );
        return false;
      }
    } catch (error) {
      console.error(
        "Lỗi khi xoá khách hàng khỏi giảm giá sau khi thanh toán:",
        error
      );
      return false;
    }
  };

  // --- SỬA: Hàm applyDiscount - Thêm maxDiscountAmount ---
  const applyDiscount = async (discount) => {
    if (!selectedBillId || cartTotal === 0) return;

    try {
      const condition = checkBasicDiscountConditions(discount, cartTotal);
      if (!condition.isValid) return;

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
                maxDiscountAmount: discount.mucGiaGiamToiDa || null,
                loaiPhieu: discount.kieu === 1 ? "CÁ_NHÂN" : "CÔNG_KHAI",
                isPersonal: discount.kieu === 1,
                customerId: selectedCustomer?.id,
                shouldRemoveAfterPayment: discount.kieu === 1,
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
      console.error("❌ Lỗi khi áp dụng mã giảm giá:", error);
      messageApi.error("Lỗi khi áp dụng mã giảm giá");
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

    window.dispatchEvent(new Event("billsUpdated"));
  };

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
                ? `-${calculatedDiscount.discountAmount.toLocaleString()} VND`
                : `-${appliedDiscount.value}%`}
            </span>
          </div>
          <div className="text-md font-semibold text-gray-700">
            {appliedDiscount.name}
          </div>
          {appliedDiscount.isPersonal && (
            <div className="text-md font-semibold text-amber-600">
              Mã cá nhân chỉ sử dụng 1 lần duy nhất
            </div>
          )}
        </div>
      </div>
    );
  };

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
          {bestDiscount.kieu === 1 && (
            <div className="text-md font-semibold text-amber-600">
              Chỉ sử dụng 1 lần duy nhất
            </div>
          )}
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
              {renderAppliedDiscount()}
              {renderAvailableDiscounts()}
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
            removeCustomerFromDiscount={handleRemoveCustomerFromDiscount}
            discountAmount={calculatedDiscount.discountAmount}
            finalAmount={calculatedDiscount.finalAmount}
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
                      name="HoTen"
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
                      name="SoDienThoai"
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
                <div
                  className="cursor-pointer select-none text-center py-2 rounded-xl bg-[#E67E22] font-bold text-white hover:bg-amber-600 active:bg-cyan-800 shadow"
                  onClick={openAddressModal}
                >
                  Chọn địa chỉ
                </div>
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

      {addressModalVisible && (
        <Modal
          title={
            <span className="text-xl font-bold">Chọn địa chỉ giao hàng</span>
          }
          open={addressModalVisible}
          onCancel={() => setAddressModalVisible(false)}
          footer={null}
          width={800}
        >
          <Table
            dataSource={customerAddresses}
            rowKey={(record) =>
              record.id ||
              `${record.tinhThanhId}-${record.quanHuyenId}-${record.diaChiCuThe}`
            }
            pagination={false}
            onRow={(record) => ({
              onClick: () => handleSelectAddress(record),
              className: "cursor-pointer hover:bg-blue-50",
            })}
            columns={[
              {
                title: <strong>Tên địa chỉ</strong>,
                dataIndex: "tenDiaChi",
                key: "tenDiaChi",
                render: (text) => (
                  <span className="font-medium">{text || "—"}</span>
                ),
              },
              {
                title: <strong>Tỉnh/Thành phố</strong>,
                dataIndex: "tinhTen",
                key: "tinhTen",
                width: "30%",
              },
              {
                title: <strong>Quận/Huyện</strong>,
                dataIndex: "quanTen",
                key: "quanTen",
                width: "30%",
              },
              {
                title: <strong>Số nhà, đường</strong>,
                dataIndex: "diaChiCuThe",
                key: "diaChiCuThe",
                render: (text) => text || "—",
              },
            ]}
          />
          {customerAddresses.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Khách hàng chưa có địa chỉ nào được lưu.
            </div>
          )}
        </Modal>
      )}
    </>
  );
}
