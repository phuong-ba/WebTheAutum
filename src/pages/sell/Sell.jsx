import React, { useState, useEffect } from "react";
import SellBreadcrumb from "./SellBreadcrumb";
import SellBill from "./SellBill";
import SellCustomer from "./SellCustomer";
import SellCartProduct from "./SellCartProduct";
import SellInformation from "./SellInformation";
import SellListProduct from "./SellListProduct";
// [MỚI] Import service đồng bộ
import { syncToDisplay } from "@/services/posSync";


export default function Sell() {
 const [selectedBillId, setSelectedBillId] = useState(null);
 const [selectedCustomer, setSelectedCustomer] = useState(null);


 // --- [MỚI] LOGIC ĐỒNG BỘ REAL-TIME SANG MÀN HÌNH KHÁCH ---
 useEffect(() => {
   // Hàm xử lý đồng bộ
   const handleSync = () => {
     // 1. Đọc dữ liệu mới nhất từ LocalStorage
     const bills = JSON.parse(localStorage.getItem("pendingBills")) || [];
    
     // 2. Tìm hóa đơn đang được chọn (active bill)
     let currentBill = null;
     if (selectedBillId) {
       currentBill = bills.find(bill => bill.id === selectedBillId);
     } else if (bills.length > 0) {
       // Nếu chưa chọn bill cụ thể nhưng có list, mặc định lấy bill đầu tiên
       // (Để màn hình khách không bị trống khi mới vào trang)
       currentBill = bills[0];
     }


     // 3. Gửi dữ liệu sang màn hình khách
     // Nếu currentBill tồn tại -> Gửi dữ liệu chi tiết
     // Nếu currentBill là null/undefined -> Gửi lệnh reset màn hình
     syncToDisplay(currentBill);
   };


   // Lắng nghe các sự kiện custom events từ các component con
   // Các sự kiện này được dispatch trong SellBill, SellCartProduct... khi có thay đổi
   window.addEventListener("cartUpdated", handleSync);      // Khi thêm/sửa/xóa giỏ hàng
   window.addEventListener("billsUpdated", handleSync);     // Khi tạo/xóa hóa đơn, áp mã giảm giá
   window.addEventListener("customerSelected", handleSync); // Khi chọn khách hàng


   // Gọi sync lần đầu tiên khi component được mount hoặc khi đổi hóa đơn
   handleSync();


   // Cleanup listener khi unmount
   return () => {
     window.removeEventListener("cartUpdated", handleSync);
     window.removeEventListener("billsUpdated", handleSync);
     window.removeEventListener("customerSelected", handleSync);
   };
 }, [selectedBillId]); // Chạy lại effect này mỗi khi người dùng chọn hóa đơn khác
 // ------------------------------------------------------------


 return (
   <div className="p-6 flex flex-col gap-5">
     <div className="bg-white flex flex-col gap-3 px-4 py-[20px] rounded-lg shadow overflow-hidden">
       <div className="font-bold text-4xl text-[#E67E22]">Quản lý bán hàng</div>
       <SellBreadcrumb />
     </div>


     <div className="flex gap-5 justify-between items-stretch ">
       <div className="flex-[2.5]">
         {/* Danh sách hóa đơn chờ */}
         <SellBill onSelectBill={setSelectedBillId} />
       </div>
       <div className="flex-[1]">
         {/* Chọn khách hàng */}
         <SellCustomer selectedBillId={selectedBillId} onCustomerChange={setSelectedCustomer} />
       </div>
     </div>


     <div className="flex gap-5 justify-between">
       <div className="flex-[2.5] flex flex-col gap-5">
         {/* Giỏ hàng của hóa đơn đang chọn */}
         <SellCartProduct selectedBillId={selectedBillId} />
         {/* Danh sách sản phẩm để thêm vào giỏ */}
         <SellListProduct selectedBillId={selectedBillId} />
       </div>
       <div className="flex-[1]">
         {/* Thông tin thanh toán */}
         <SellInformation selectedBillId={selectedBillId} selectedCustomer={selectedCustomer} />
       </div>
     </div>
   </div>
 );
}

