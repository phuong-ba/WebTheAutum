import React, { useState } from "react";
import hoaDonApi from "@/api/HoaDonAPI";
import { message } from "antd";
import { useNavigate } from "react-router";

export default function SellPay({ 
  cartTotal, 
  appliedDiscount, 
  selectedCustomer, 
  onRemoveDiscount,
  cartItems,
  selectedBillId,
  onClearCart
}) {
  const [paymentMethod, setPaymentMethod] = useState(null);
  const discountAmount = appliedDiscount?.discountAmount || 0;
  const finalAmount = appliedDiscount?.finalAmount || cartTotal;
  const shippingFee = 0;
  const [messageApi, contextHolder] = message.useMessage();
  const navigate = useNavigate();

  const handlePayment = async () => {
    if (cartTotal === 0) {
      messageApi.warning("Giỏ hàng đang trống! Vui lòng thêm sản phẩm trước khi thanh toán.");
      return;
    }

    if (!paymentMethod) {
      messageApi.warning("Vui lòng chọn phương thức thanh toán!");
      return;
    }

    const confirmMessage = `XÁC NHẬN THANH TOÁN\n
Tổng tiền hàng: ${cartTotal.toLocaleString()} VND
Giảm giá: ${discountAmount.toLocaleString()} VND
Thành tiền: ${finalAmount.toLocaleString()} VND
Mã giảm giá: ${appliedDiscount?.code || "Không áp dụng"}
Phương thức: ${paymentMethod}

Bạn có chắc chắn muốn thanh toán?`;

    if (!window.confirm(confirmMessage)) return;

    try {
      let chiTietList = [];

      if (cartItems && cartItems.length > 0) {
        chiTietList = cartItems.map(item => ({
          idChiTietSanPham: item.idChiTietSanPham || item.id,
          soLuong: item.quantity || item.soLuong,
          giaBan: item.price || item.giaBan,
          ghiChu: typeof item.ghiChu === "string" ? item.ghiChu : ""
        }));
      } else if (selectedBillId) {
        const bills = JSON.parse(localStorage.getItem("pendingBills")) || [];
        const currentBill = bills.find(bill => bill.id === selectedBillId);

        if (currentBill && currentBill.items && currentBill.items.length > 0) {
          chiTietList = currentBill.items.map(item => ({
            idChiTietSanPham: item.idChiTietSanPham || item.id,
            soLuong: item.quantity || item.soLuong,
            giaBan: item.price || item.giaBan,
            ghiChu: typeof item.ghiChu === "string" ? item.ghiChu : ""
          }));
        }
      }

      if (chiTietList.length === 0) {
        messageApi.error("❌ Không có sản phẩm trong giỏ hàng! Vui lòng thêm sản phẩm trước khi thanh toán.");
        return;
      }

      const currentUser = JSON.parse(localStorage.getItem("currentUser"));

      const diaChiKhachHang = typeof selectedCustomer?.diaChi === "string" 
        ? selectedCustomer.diaChi 
        : "Chưa có địa chỉ";

      const hoaDonMoi = {
        loaiHoaDon: true,
        phiVanChuyen: 0,
        tongTien: cartTotal,
        tongTienSauGiam: finalAmount,
        ghiChu: `Thanh toán bằng ${paymentMethod}${appliedDiscount?.code ? `, mã giảm ${appliedDiscount.code}` : ""}`,
        diaChiKhachHang: diaChiKhachHang,
        ngayThanhToan: new Date().toISOString(),
        trangThai: 1,
        idKhachHang: selectedCustomer?.id || null,
        idNhanVien: 1,
        idPhieuGiamGia: appliedDiscount?.id || null,
        nguoiTao: currentUser?.id || 1,
        chiTietList: chiTietList,
        idPhuongThucThanhToan: paymentMethod === "Tiền mặt" ? 1 
                              : paymentMethod === "Chuyển khoản" ? 2 
                              : 3,
        soTienThanhToan: finalAmount,
        ghiChuThanhToan: `Thanh toán bằng ${paymentMethod}`,
      };

      console.log("Payload gửi lên backend:", JSON.stringify(hoaDonMoi, null, 2));

      const res = await hoaDonApi.create(hoaDonMoi);

      if (res.data?.isSuccess) {
        messageApi.success("✅ Thanh toán thành công!");

        if (selectedBillId) {
          const bills = JSON.parse(localStorage.getItem("pendingBills")) || [];
          const updatedBills = bills.filter(bill => bill.id !== selectedBillId);
          localStorage.setItem("pendingBills", JSON.stringify(updatedBills));
          window.dispatchEvent(new Event("billsUpdated"));
        }

        if (onRemoveDiscount) onRemoveDiscount();

        if (onClearCart) onClearCart();
       const newBillId = res.data.data?.id || res.data.data;
        if (newBillId) {
          navigate(`/admin/detail-bill/${newBillId}`);
        } else {
          console.warn("Không tìm thấy ID hóa đơn mới trả về từ API");
        }
      } else {
        messageApi.error("❌ Lỗi khi lưu hóa đơn: " + (res.data?.message || ""));
      }
    } catch (error) {
      console.error("❌ Lỗi khi gọi API:", error);
      messageApi.error("Thanh toán thất bại! Vui lòng thử lại.");
    }
  };

  const paymentOptions = ["Chuyển khoản", "Tiền mặt", "Cả hai"];

  return (
    <>
      {contextHolder}
      <div className="bg-gray-50 p-5 rounded-lg border-l-4 border border-amber-700">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-4">
            <div className="flex justify-between font-bold">
              <span>Tổng tiền hàng:</span> <span>{cartTotal.toLocaleString()} vnd</span>
            </div>
            <div className="flex justify-between font-bold">
              <span>Giảm giá:</span>{" "}
              <span className="text-red-800">-{discountAmount.toLocaleString()} vnd</span>
            </div>
            <div className="flex justify-between font-bold">
              <span>Phí vận chuyển:</span> <span>{shippingFee.toLocaleString()} vnd</span>
            </div>
          </div>
          <div className="flex justify-between font-bold text-lg">
            <span>Tổng thanh toán:</span>{" "}
            <span className="text-amber-600">{finalAmount.toLocaleString()} vnd</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="font-bold">Phương thức thanh toán:</div>
        <div className="flex gap-2">
          {paymentOptions.map((option) => (
            <div
              key={option}
              onClick={() => setPaymentMethod(option)}
              className={`cursor-pointer select-none text-center py-2 px-6 rounded-xl bg-[#FFF] font-bold border shadow ${
                paymentMethod === option
                  ? "bg-amber-600 text-white border-amber-600"
                  : "text-amber-600 hover:text-white hover:bg-amber-600 border-gray-300"
              }`}
            >
              {option}
            </div>
          ))}
        </div>
      </div>

      <div 
        onClick={handlePayment}
        className="cursor-pointer select-none text-center py-3 rounded-xl bg-[#E67E22] font-bold text-white hover:bg-amber-600 active:bg-cyan-800 shadow"
      >
        Thanh toán
      </div>
    </>
  );
}