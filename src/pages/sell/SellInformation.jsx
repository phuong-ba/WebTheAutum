import React, { useState, useEffect, useMemo } from "react";
import {
  InfoIcon,
  TagIcon,
  ToggleLeftIcon,
  ToggleRightIcon,
} from "@phosphor-icons/react";
import { Checkbox, Col, Form, Input, Row, Tabs, message, Spin } from "antd";
import SellPay from "./SellPay";
import { fetchPhieuGiamGia } from "@/services/phieuGiamGiaService";
import { fetchAllGGKH } from "@/services/giamGiaKhachHangService";
import { useDispatch, useSelector } from "react-redux";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";

dayjs.extend(isBetween);

export default function SellInformation({ selectedBillId, onDiscountApplied }) {
  const [cartItems, setCartItems] = useState([]);
  const dispatch = useDispatch();
  const { data: discountData, loading, error } = useSelector(
    (state) => state.phieuGiamGia
  );
  const { data: giamGiaKhachHangData, status: giamGiaKHStatus } = useSelector(
    (state) => state.giamGiaKhachHang
  );
  const [messageApi, contextHolder] = message.useMessage();
  const [isDelivery, setIsDelivery] = useState(false);
  const [appliedDiscount, setAppliedDiscount] = useState(null);
  const [cartTotal, setCartTotal] = useState(0);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [forceUpdate, setForceUpdate] = useState(0);

  // Load dữ liệu mã giảm giá và giảm giá khách hàng
  useEffect(() => {
    const loadDiscounts = async () => {
      try {
        await dispatch(fetchPhieuGiamGia());
        await dispatch(fetchAllGGKH());
      } catch (err) {
        console.error("❌ Lỗi khi load dữ liệu giảm giá:", err);
        messageApi.error("Không thể tải dữ liệu mã giảm giá");
      }
    };
    loadDiscounts();
  }, [dispatch, messageApi]);

  // ✅ SỬA: Cập nhật dữ liệu hóa đơn hiện tại khi selectedBillId thay đổi
  useEffect(() => {
    const updateCartData = () => {
      if (selectedBillId) {
        const bills = JSON.parse(localStorage.getItem("pendingBills")) || [];
        const currentBill = bills.find((bill) => bill.id === selectedBillId);
        
        if (currentBill) {
          // ✅ QUAN TRỌNG: Lấy cartItems từ cả 'cart' và 'items'
          const itemsFromCart = currentBill.cart || [];
          const itemsFromItems = currentBill.items || [];
          
          // ✅ Kết hợp cả hai nguồn, ưu tiên 'cart' trước
          const allCartItems = itemsFromCart.length > 0 ? itemsFromCart : itemsFromItems;
          
          setCartItems(allCartItems);
          setCartTotal(currentBill.totalAmount || 0);
          setAppliedDiscount(currentBill.appliedDiscount || null);
          setSelectedCustomer(
            currentBill.customer
              ? {
                  ...currentBill.customer,
                  id:
                    currentBill.customer.id ||
                    currentBill.customer.idKhachHang ||
                    currentBill.customer.khachHangId,
                }
              : null
          );

          console.log("🛒 CartItems được lấy:", allCartItems);
          console.log("📊 Tổng tiền:", currentBill.totalAmount);
        }
      } else {
        setCartItems([]);
        setCartTotal(0);
        setAppliedDiscount(null);
        setSelectedCustomer(null);
      }
    };

    updateCartData();
    
    // ✅ Lắng nghe sự kiện cập nhật
    window.addEventListener("billsUpdated", updateCartData);
    window.addEventListener("cartUpdated", updateCartData);
    
    return () => {
      window.removeEventListener("billsUpdated", updateCartData);
      window.removeEventListener("cartUpdated", updateCartData);
    };
  }, [selectedBillId]);

  // Force update khi khách hàng thay đổi
  useEffect(() => {
    setForceUpdate((prev) => prev + 1);
  }, [selectedCustomer]);

  // Kiểm tra điều kiện mã giảm giá
  const checkDiscountConditions = (discount, totalAmount) => {
    if (!discount) return { isValid: false, message: "Mã giảm giá không tồn tại" };

    const now = dayjs();
    const start = dayjs(discount.ngayBatDau);
    const end = dayjs(discount.ngayKetThuc);

    if (now.isBefore(start)) return { isValid: false, message: "Chưa tới thời gian áp dụng" };
    if (now.isAfter(end)) return { isValid: false, message: "Mã giảm giá đã hết hạn" };
    if (discount.trangThai !== 1) return { isValid: false, message: "Mã giảm giá không khả dụng" };

    if (discount.giaTriDonHangToiThieu && totalAmount < discount.giaTriDonHangToiThieu) {
      return { isValid: false, message: `Đơn tối thiểu ${discount.giaTriDonHangToiThieu.toLocaleString()} VND` };
    }

    if (discount.kieu === 1) {
      if (!selectedCustomer)
        return { isValid: false, message: "Yêu cầu chọn khách hàng để áp dụng mã cá nhân" };

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

  // Tính số tiền giảm
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

  // Lọc mã giảm giá theo trạng thái, thời gian và khách hàng
  const getFilteredDiscounts = () => {
    if (!Array.isArray(discountData)) return [];

    const now = dayjs();

    const result = discountData.filter((discount) => {
      const isActive =
        discount.trangThai === 1 &&
        now.isBetween(dayjs(discount.ngayBatDau), dayjs(discount.ngayKetThuc), null, "[]");
      if (!isActive) return false;

      if (discount.kieu === 0) return true;

      if (discount.kieu === 1) {
        if (!selectedCustomer) return false;

        const isCustomerHasDiscount = giamGiaKhachHangData?.some(
          (ggkh) =>
            ggkh.phieuGiamGiaId === discount.id &&
            ggkh.khachHangId === selectedCustomer.id
        );

        return isCustomerHasDiscount;
      }

      return false;
    });

    return result;
  };

  // Mã giảm giá khả dụng (đáp ứng điều kiện)
  const getAvailableDiscounts = () => {
    const filtered = getFilteredDiscounts();
    return filtered.filter((d) => checkDiscountConditions(d, cartTotal).isValid);
  };

  // Lấy mã giảm giá tốt nhất (giảm nhiều nhất)
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

  // Dùng useMemo tối ưu tính toán lại khi dependencies thay đổi
  const availableDiscounts = useMemo(() => {
    return getAvailableDiscounts();
  }, [discountData, giamGiaKhachHangData, selectedCustomer, cartTotal, forceUpdate]);

  const bestDiscount = useMemo(() => {
    return getBestDiscount(availableDiscounts);
  }, [availableDiscounts, cartTotal]);

  const personalDiscounts = useMemo(() => {
    return availableDiscounts.filter((d) => d.kieu === 1);
  }, [availableDiscounts]);

  const publicDiscounts = useMemo(() => {
    return availableDiscounts.filter((d) => d.kieu === 0);
  }, [availableDiscounts]);

  // Áp dụng mã giảm giá vào hóa đơn hiện tại (localStorage)
  const applyDiscount = (discount) => {
    if (!selectedBillId) return messageApi.warning("Vui lòng chọn hóa đơn!");
    const condition = checkDiscountConditions(discount, cartTotal);
    if (!condition.isValid) return messageApi.warning(condition.message);

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
            },
          }
        : b
    );

    localStorage.setItem("pendingBills", JSON.stringify(updated));
    setAppliedDiscount(updated.find((b) => b.id === selectedBillId)?.appliedDiscount);

    if (onDiscountApplied) {
      onDiscountApplied({
        discountAmount,
        finalAmount: final,
        discountCode: discount.maGiamGia,
      });
    }

    messageApi.success(`Áp dụng ${discount.maGiamGia} thành công`);
    window.dispatchEvent(new Event("billsUpdated"));
  };

  // Xóa mã giảm giá
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

    if (onDiscountApplied) {
      onDiscountApplied({ discountAmount: 0, finalAmount: cartTotal, discountCode: null });
    }

    messageApi.success("Đã xóa mã giảm giá!");
    window.dispatchEvent(new Event("billsUpdated"));
  };

  const handleToggleDelivery = () => setIsDelivery((prev) => !prev);

  const onChange = (key) => {
    // console.log("Tab changed", key);
  };

  const isLoading = loading || giamGiaKHStatus === "pending";

  const items = [
    {
      key: "1",
      label: "Mã tốt nhất",
      children: (
        <div className="flex flex-col gap-4">
          {isLoading ? (
            <div className="text-center py-4">
              <Spin size="large" />
              <div>Đang tải mã giảm giá...</div>
            </div>
          ) : bestDiscount ? (
            <div className="relative p-4 border-2 border-gray-300 rounded-xl flex flex-col items-start gap-3 bg-amber-50">
              <div className="absolute font-semibold bg-amber-700 right-0 top-0 rounded-tr-xl rounded-bl-xl py-1 px-4 text-white">
                Mã tốt nhất
              </div>
              <div className="text-white font-semibold px-5 py-1 rounded-md bg-amber-700">
                {bestDiscount.maGiamGia}
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1 items-center">
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
              </div>
              <button
                onClick={() => applyDiscount(bestDiscount)}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 font-semibold"
              >
                Áp dụng mã này
              </button>
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              {selectedCustomer
                ? "Không có mã giảm giá khả dụng cho khách hàng này"
                : "Không có mã giảm giá khả dụng. Vui lòng chọn khách hàng để xem thêm mã giảm giá cá nhân."}
            </div>
          )}
          {/* ✅ TRUYỀN cartItems và selectedBillId cho SellPay */}
          <SellPay
            cartTotal={cartTotal}
            appliedDiscount={appliedDiscount}
            onRemoveDiscount={removeDiscount}
            selectedCustomer={selectedCustomer}
            cartItems={cartItems} // ✅ Đã có dữ liệu
            selectedBillId={selectedBillId} // ✅ Đã có dữ liệu
          />
        </div>
      ),
    },
    {
      key: "2",
      label: "Mã thay thế",
      children: (
        <div className="flex flex-col gap-2">
          {isLoading ? (
            <div className="text-center py-4">
              <Spin size="large" />
              <div>Đang tải mã giảm giá...</div>
            </div>
          ) : availableDiscounts.length > 0 ? (
            <>
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="font-semibold text-blue-700">
                  Tổng số mã khả dụng: {availableDiscounts.length}
                </div>
                <div className="text-sm text-blue-600">
                  Công khai: {publicDiscounts.length} | Cá nhân: {personalDiscounts.length}
                </div>
              </div>

              {personalDiscounts.length > 0 && (
                <div className="mb-4 p-3 bg-[#E9FBF4] border border-[#00A96C] rounded-lg">
                  <div className="font-semibold text-[#00A96C]">
                    🎯 Tìm thấy {personalDiscounts.length} mã giảm giá cá nhân cho {selectedCustomer?.hoTen}
                  </div>
                </div>
              )}

              {availableDiscounts.map((discount) => (
                <div
                  key={discount.id}
                  className={`relative p-4 border-2 rounded-xl flex flex-col items-start gap-3 ${
                    discount.kieu === 1
                      ? "border-[#00A96C] bg-[#E9FBF4]"
                      : "border-gray-300 bg-amber-50"
                  }`}
                >
                  {discount.kieu === 1 && (
                    <div className="absolute font-semibold bg-[#00A96C] right-0 top-0 rounded-tr-xl rounded-bl-xl py-1 px-4 text-white">
                      Cá nhân
                    </div>
                  )}
                  <div
                    className={`text-white font-semibold px-5 py-1 rounded-md ${
                      discount.kieu === 1 ? "bg-[#00A96C]" : "bg-amber-700"
                    }`}
                  >
                    {discount.maGiamGia}
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1 items-center">
                        <TagIcon size={24} weight="fill" />
                        <span className="font-semibold text-xl">Giảm:</span>
                      </div>
                      <span className="text-lg font-semibold text-red-800">
                        {discount.loaiGiamGia
                          ? `-${discount.giaTriGiamGia.toLocaleString()} VND`
                          : `-${discount.giaTriGiamGia}%`}
                      </span>
                    </div>
                    <div className="text-md font-semibold text-gray-700">
                      Hết hạn: {dayjs(discount.ngayKetThuc).format("DD/MM/YYYY")}
                    </div>
                    <div className="text-md font-semibold text-gray-700">
                      {discount.giaTriDonHangToiThieu
                        ? `Đơn tối thiểu: ${discount.giaTriDonHangToiThieu.toLocaleString()} VND`
                        : discount.mucGiaGiamToiDa
                        ? `Giảm tối đa: ${discount.mucGiaGiamToiDa.toLocaleString()} VND`
                        : "Không có điều kiện"}
                    </div>
                    {discount.kieu === 1 && selectedCustomer && (
                      <div className="text-md font-semibold text-[#00A96C]">
                        ✓ Dành riêng cho {selectedCustomer.hoTen}
                      </div>
                    )}
                    {discount.kieu === 0 && (
                      <div className="text-md font-semibold text-blue-600">
                        ✓ Áp dụng cho mọi khách hàng
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => applyDiscount(discount)}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 font-semibold"
                  >
                    Áp dụng mã này
                  </button>
                </div>
              ))}
            </>
          ) : (
            <div className="text-center py-4 text-gray-500">
              {selectedCustomer
                ? "Không có mã giảm giá thay thế khả dụng"
                : "Không có mã giảm giá thay thế khả dụng. Vui lòng chọn khách hàng để xem thêm mã giảm giá cá nhân."}
            </div>
          )}
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
              <Form layout="vertical">
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

                <div className="flex justify-between">
                  <span>Giao hàng tận nhà</span>
                  <Checkbox />
                </div>
              </Form>
            </div>
          </div>
        )}

        <div className="p-4 flex flex-col gap-4">
          <div className="font-semibold text-2xl">Mã giảm giá</div>

          <Tabs
            defaultActiveKey="1"
            items={items}
            onChange={onChange}
            className="custom-tabs"
          />
        </div>
      </div>
    </>
  );
}