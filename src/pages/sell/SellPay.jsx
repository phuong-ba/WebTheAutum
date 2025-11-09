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
  onClearCart,
  isDelivery,
  addressForm,
  tinhList,
  localQuanList
}) {
  const [paymentMethod, setPaymentMethod] = useState(null);
  const discountAmount = appliedDiscount?.discountAmount || 0;
  const actualDiscountAmount = Math.min(discountAmount, cartTotal);
  const finalAmount = Math.max(cartTotal - actualDiscountAmount, 0);
  const shippingFee = 0;
  const [messageApi, contextHolder] = message.useMessage();
  const navigate = useNavigate();

  const handlePayment = async () => {
    if (cartTotal === 0) {
      messageApi.warning("Giỏ hàng đang trống! Vui lòng thêm sản phẩm trước khi thanh toán.");
      return;
    }

    if (!selectedCustomer) {
      messageApi.warning("Vui lòng chọn khách hàng trước khi thanh toán!");
      return;
    }

    if (!paymentMethod) {
      messageApi.warning("Vui lòng chọn phương thức thanh toán!");
      return;
    }

    if (isDelivery) {
      if (!addressForm) {
        messageApi.warning("Vui lòng nhập địa chỉ giao hàng!");
        return;
      }

      const formValues = addressForm.getFieldsValue();
      if (!formValues.thanhPho || !formValues.quan || !formValues.diaChiCuThe) {
        messageApi.warning("Vui lòng nhập đầy đủ thông tin địa chỉ giao hàng!");
        return;
      }
    }

    let shippingAddress = null;
    if (isDelivery && addressForm) {
      try {
        const formValues = addressForm.getFieldsValue();
        console.log("📝 Form values từ SellInformation:", formValues);
        
        if (formValues.thanhPho && formValues.quan && formValues.diaChiCuThe) {
          const tinhName = tinhList?.find(t => t.id === formValues.thanhPho)?.tenTinh || '';
          const quanName = localQuanList?.find(q => q.id === formValues.quan)?.tenQuan || '';
          
          shippingAddress = {
            fullAddress: `${formValues.diaChiCuThe}, ${quanName}, ${tinhName}`,
            idTinh: formValues.thanhPho,
            idQuan: formValues.quan,
            diaChiCuThe: formValues.diaChiCuThe,
            hoTen: formValues.HoTen || selectedCustomer.hoTen,
            sdt: formValues.SoDienThoai || selectedCustomer.sdt,
            tenTinh: tinhName,
            tenQuan: quanName
          };
          
          console.log("📍 Địa chỉ từ form vừa nhập:", shippingAddress);
          
          const bills = JSON.parse(localStorage.getItem("pendingBills")) || [];
          const updatedBills = bills.map((bill) => {
            if (bill.id === selectedBillId) {
              return {
                ...bill,
                shippingAddress: shippingAddress
              };
            }
            return bill;
          });
          localStorage.setItem("pendingBills", JSON.stringify(updatedBills));
          console.log("💾 Đã lưu địa chỉ vào localStorage");
        }
      } catch (error) {
        console.error("❌ Lỗi khi lấy giá trị form:", error);
      }
    }

    const totalWithShipping = finalAmount + shippingFee;
    
    const confirmMessage = `XÁC NHẬN THANH TOÁN\n
        Khách hàng: ${selectedCustomer.hoTen}
        Số điện thoại: ${selectedCustomer.sdt}
        ${isDelivery ? `📍 Giao hàng: ${shippingAddress?.fullAddress || 'Địa chỉ giao hàng'}` : '🏪 Mua tại quầy'}
        Tổng tiền hàng: ${cartTotal.toLocaleString()} VND
        Giảm giá: ${discountAmount.toLocaleString()} VND
        ${isDelivery ? `Phí vận chuyển: ${shippingFee.toLocaleString()} VND` : ''}
        Thành tiền: ${totalWithShipping.toLocaleString()} VND
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
          ghiChu: typeof item.ghiChu === "string" ? item.ghiChu : "",
          trangThai: 0 
        }));
      } else if (selectedBillId) {
        const bills = JSON.parse(localStorage.getItem("pendingBills")) || [];
        const currentBill = bills.find(bill => bill.id === selectedBillId);

        if (currentBill && currentBill.items && currentBill.items.length > 0) {
          chiTietList = currentBill.items.map(item => ({
            idChiTietSanPham: item.idChiTietSanPham || item.id,
            soLuong: item.quantity || item.soLuong,
            giaBan: item.price || item.giaBan,
            ghiChu: typeof item.ghiChu === "string" ? item.ghiChu : "",
            trangThai: 0
          }));
        }
      }

      if (chiTietList.length === 0) {
        messageApi.error("❌ Không có sản phẩm trong giỏ hàng! Vui lòng thêm sản phẩm trước khi thanh toán.");
        return;
      }

      const currentUser = JSON.parse(localStorage.getItem("currentUser"));
      
      let diaChiKhachHang = "Chưa có địa chỉ";
      let idTinh = null;
      let idQuan = null;
      let diaChiCuThe = "";

      if (shippingAddress) {
        diaChiKhachHang = shippingAddress.fullAddress;
        idTinh = shippingAddress.idTinh;
        idQuan = shippingAddress.idQuan;
        diaChiCuThe = shippingAddress.diaChiCuThe;
        
        console.log("✅ Sử dụng địa chỉ từ FORM vừa nhập");
      } 
      else {
        const bills = JSON.parse(localStorage.getItem("pendingBills")) || [];
        const currentBill = bills.find(bill => bill.id === selectedBillId);
        const savedShippingAddress = currentBill?.shippingAddress;

        if (savedShippingAddress && savedShippingAddress.idTinh && savedShippingAddress.idQuan) {
          diaChiKhachHang = savedShippingAddress.fullAddress;
          idTinh = savedShippingAddress.idTinh;
          idQuan = savedShippingAddress.idQuan;
          diaChiCuThe = savedShippingAddress.diaChiCuThe || "";
          
          console.log("✅ Sử dụng địa chỉ từ localStorage");
        } 
        else if (selectedCustomer?.diaChi) {
          const customerAddress = selectedCustomer.diaChi;
          diaChiKhachHang = customerAddress.dia_chi_cu_the || customerAddress.diaChiCuThe || "Chưa có địa chỉ";
          idTinh = customerAddress.tinhThanhId || customerAddress.id_tinh || customerAddress.idTinh;
          idQuan = customerAddress.quanHuyenId || customerAddress.id_quan || customerAddress.idQuan;
          diaChiCuThe = customerAddress.dia_chi_cu_the || customerAddress.diaChiCuThe || "";
          
          console.log("✅ Sử dụng địa chỉ từ KHÁCH HÀNG");
        } else {
          console.log("❌ Không có địa chỉ nào");
        }
      }

      console.log("📊 Thông tin địa chỉ cuối cùng:", {
        diaChiKhachHang,
        idTinh,
        idQuan, 
        diaChiCuThe,
        hasShippingAddress: !!shippingAddress
      });

      let trangThai;
    
    if (isDelivery) {
        trangThai = 1;
    } else {
        trangThai = 3;
    }

      const hoaDonMoi = {
        loaiHoaDon: isDelivery ? false : true,
        phiVanChuyen: 0, 
        tongTien: cartTotal,
        tongTienSauGiam: finalAmount,
        ghiChu: `${isDelivery ? 'Giao hàng - ' : 'Tại quầy - '}Thanh toán bằng ${paymentMethod}${appliedDiscount?.code ? `, mã giảm ${appliedDiscount.code}` : ""}`,
        diaChiKhachHang: diaChiKhachHang,
        ngayThanhToan: new Date().toISOString(),
        trangThai: trangThai, 
        idKhachHang: selectedCustomer?.id || null,
        idNhanVien: 1,
        idPhieuGiamGia: appliedDiscount?.id || null,
        nguoiTao: currentUser?.id || 1,
        chiTietList: chiTietList,
        idPhuongThucThanhToan: paymentMethod === "Tiền mặt" ? 1 
                              : paymentMethod === "Chuyển khoản" ? 2 
                              : 3,
        soTienThanhToan: totalWithShipping,
        ghiChuThanhToan: `${isDelivery ? 'Giao hàng - ' : 'Tại quầy - '}Thanh toán bằng ${paymentMethod}`,
        idTinh: idTinh,
        idQuan: idQuan,
        diaChiCuThe: diaChiCuThe
      };

      console.log("🚀 FINAL PAYLOAD gửi lên BE:", JSON.stringify(hoaDonMoi, null, 2));

      const res = await hoaDonApi.create(hoaDonMoi);

      if (res.data?.isSuccess) {
        const successMessage = isDelivery 
          ? "✅ Đặt hàng thành công! Đơn hàng đang chờ giao hàng." 
          : "✅ Thanh toán thành công! Đơn hàng đã hoàn tất.";
        
        messageApi.success(successMessage);

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
      messageApi.error(`${isDelivery ? 'Đặt hàng' : 'Thanh toán'} thất bại! Vui lòng thử lại.`);
    }
  };

  const paymentOptions = ["Chuyển khoản", "Tiền mặt"];
  
  const totalWithShipping = finalAmount + shippingFee;

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
              <span className="text-red-800">{actualDiscountAmount.toLocaleString()} vnd</span>
            </div>
            {isDelivery && (
              <div className="flex justify-between font-bold">
                <span>Phí vận chuyển:</span> <span>{shippingFee.toLocaleString()} vnd</span>
              </div>
            )}
          </div>
          <div className="flex justify-between font-bold text-lg">
            <span>Tổng thanh toán:</span>{" "}
            <span className="text-amber-600">{totalWithShipping.toLocaleString()} vnd</span>
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

      {!selectedCustomer && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="text-yellow-700 text-sm font-semibold">
            ⚠️ Vui lòng chọn khách hàng trước khi thanh toán
          </div>
        </div>
      )}

      {isDelivery && selectedCustomer && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="text-blue-700 text-sm font-semibold">
            📦 Đơn hàng sẽ được giao đến địa chỉ bạn nhập
          </div>
        </div>
      )}

      <div 
        onClick={handlePayment}
        className={`cursor-pointer select-none text-center py-3 rounded-xl font-bold text-white shadow ${
          !selectedCustomer 
            ? "bg-gray-400 cursor-not-allowed" 
            : "bg-[#E67E22] hover:bg-amber-600 active:bg-cyan-800"
        }`}
      >
        {!selectedCustomer 
          ? "Vui lòng chọn khách hàng" 
          : isDelivery ? "Đặt hàng" : "Thanh toán"}
      </div>
    </>
  );
}