import { InvoiceIcon, TrashIcon } from "@phosphor-icons/react";
import Search from "antd/es/input/Search";
import React, { useState, useEffect } from "react";
import { message } from "antd";
import { useDispatch } from "react-redux";
import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';
import {
 tangSoLuong,
 fetchChiTietSanPham,
 giamSoLuong,
} from "@/services/chiTietSanPhamService";


export default function SellBill({ onSelectBill }) {
 const dispatch = useDispatch();
 const [bills, setBills] = useState([]);
 const [messageApi, contextHolder] = message.useMessage();
 const [selectedBillId, setSelectedBillId] = useState(null);
 const [stompClient, setStompClient] = useState(null);


 // ✅ Kết nối WebSocket khi component mount
 useEffect(() => {
   const socket = new SockJS('http://localhost:8080/ws');
   const client = Stomp.over(socket);
   client.debug = () => {}; // Tắt debug log


   client.connect({}, () => {
     console.log('✅ SellBill: Đã kết nối WebSocket');
     setStompClient(client);
   }, (err) => {
     console.error('❌ SellBill: Lỗi kết nối Socket', err);
   });


   return () => {
     if (client && client.connected) {
       client.disconnect();
       console.log('👋 SellBill: Đã ngắt kết nối WebSocket');
     }
   };
 }, []);


 const loadBills = () => {
   const savedBills = JSON.parse(localStorage.getItem("pendingBills")) || [];
   setBills(savedBills);
 };


 useEffect(() => {
   loadBills();


   const savedBills = JSON.parse(localStorage.getItem("pendingBills")) || [];
   if (savedBills.length > 0 && !selectedBillId) {
     setSelectedBillId(savedBills[0].id);
     onSelectBill(savedBills[0].id);
   }
 }, []);


 useEffect(() => {
   const handleBillsUpdated = () => {
     loadBills();
   };


   window.addEventListener("billsUpdated", handleBillsUpdated);
   return () => {
     window.removeEventListener("billsUpdated", handleBillsUpdated);
   };
 }, []);


 const onSearch = (value, _e, info) => console.log(info?.source, value);


 const saveBills = (billsData) => {
   localStorage.setItem("pendingBills", JSON.stringify(billsData));
   setBills(billsData);
   window.dispatchEvent(new Event("billsUpdated"));
 };


 const handleCreateBill = () => {
   if (bills.length >= 6) {
     messageApi.warning("Chỉ được tạo tối đa 6 hóa đơn chờ!");
     return;
   }


   const newBill = {
     id: Date.now(),
     name: `HD_${Date.now()}`,
     status: "Chờ xử lý",
     productCount: 0,
     totalAmount: 0,
     cart: [],
     createdAt: new Date().toISOString(),
   };


   const updatedBills = [...bills, newBill];
   saveBills(updatedBills);


   setSelectedBillId(newBill.id);
   onSelectBill(newBill.id);


   messageApi.success("Đã tạo hóa đơn mới!");
 };


 const handleRestoreInventory = async (billToDelete) => {
   if (!billToDelete || !billToDelete.cart || billToDelete.cart.length === 0) {
     return true;
   }


   try {
     const restorePromises = billToDelete.cart.map(async (product) => {
       await dispatch(
         tangSoLuong({
           id: product.idChiTietSanPham,
           soLuong: product.quantity,
         })
       ).unwrap();
     });


     await Promise.all(restorePromises);


     dispatch(fetchChiTietSanPham());


     return true;
   } catch (error) {
     console.error("Lỗi khi hoàn trả tồn kho:", error);
     return false;
   }
 };


 const handleDeleteBill = async (id) => {
   const billToDelete = bills.find((bill) => bill.id === id);
   if (!billToDelete) return;


   const hasProducts = billToDelete.cart && billToDelete.cart.length > 0;


   if (hasProducts) {
     const confirmed = window.confirm(
       `Hóa đơn ${billToDelete.name} có ${billToDelete.productCount} sản phẩm. Bạn có chắc muốn xóa và hoàn trả tồn kho?`
     );


     if (!confirmed) {
       return;
     }


     const restoreSuccess = await handleRestoreInventory(billToDelete);


     if (!restoreSuccess) {
       messageApi.error("Lỗi khi hoàn trả tồn kho, không thể xóa hóa đơn!");
       return;
     }
   }


   // ✅ GỬI THÔNG BÁO HỦY SANG CUSTOMER DISPLAY
   if (stompClient && stompClient.connected) {
     const cancelPayload = {
       maHoaDon: billToDelete.name || `Đơn #${billToDelete.id}`,
       tenKhachHang: billToDelete.customer?.hoTen || "Khách lẻ",
       sdtKhachHang: billToDelete.customer?.sdt || "",
       tongTien: billToDelete.totalAmount || 0,
       items: billToDelete.cart || [],
       trangThai: 4 // 4 = Đã hủy
     };
    
     stompClient.send("/topic/display", {}, JSON.stringify(cancelPayload));
     console.log("✅ Đã gửi trạng thái CANCELLED sang màn hình khách");
   }


   const updatedBills = bills.filter((bill) => bill.id !== id);
   saveBills(updatedBills);


   if (selectedBillId === id) {
     if (updatedBills.length > 0) {
       setSelectedBillId(updatedBills[0].id);
       onSelectBill(updatedBills[0].id);
     } else {
       setSelectedBillId(null);
       onSelectBill(null);
     }
   }


   const successMessage = hasProducts
     ? "Đã xóa hóa đơn và hoàn trả tồn kho thành công!"
     : "Đã xóa hóa đơn!";


   messageApi.success(successMessage);
 };


 const handleSelectBill = (billId) => {
   setSelectedBillId(billId);
   onSelectBill(billId);
 };


 const selectedBill = bills.find((bill) => bill.id === selectedBillId);


 return (
   <>
     {contextHolder}
     <div className="bg-white py-5 px-4 flex flex-col gap-3 rounded-lg shadow overflow-hidden h-full">
       <div className="flex gap-3 p-2 items-center">
         <Search placeholder="Tìm kiếm hóa đơn..." onSearch={onSearch} />
         <div
           className="font-bold text-sm py-2 px-4 min-w-[120px] cursor-pointer select-none text-center rounded-md bg-[#E67E22] text-white hover:bg-amber-600 active:bg-cyan-800 shadow"
           onClick={handleCreateBill}
         >
           Tạo hóa đơn
         </div>
       </div>


       <div className="shadow overflow-hidden rounded-lg min-h-[160px] m-2">
         <div className="p-4 font-bold text-2xl bg-amber-600 opacity-75 rounded-t-lg text-white flex gap-2 items-center justify-between">
           <div className="flex items-center gap-2">
             <InvoiceIcon size={32} />
             <span>
               Hóa đơn chờ {selectedBill && `- ${selectedBill.name}`}
             </span>
           </div>
         </div>


         <div className="grid grid-cols-3 xl:grid-cols-3 lg:grid-cols-2 md:grid-cols-1 gap-5 py-4 px-5">
           {bills.length === 0 ? (
             <div className="col-span-4 text-center py-8 text-gray-500">
               <div className="text-lg font-semibold">Chưa có hóa đơn nào</div>
               <div className="text-sm">Nhấn "Tạo hóa đơn" để bắt đầu</div>
             </div>
           ) : (
             bills.map((bill) => (
               <div
                 key={bill.id}
                 className={`border-2 border-amber-600 opacity-75 rounded px-4 py-4 flex flex-col gap-3 min-w-[200px] cursor-pointer transition-all ${
                   selectedBillId === bill.id
                     ? "bg-green-50 shadow-lg border-green-500"
                     : "bg-emerald-50 hover:shadow-md"
                 }`}
                 onClick={() => handleSelectBill(bill.id)}
               >
                 <div className="flex items-center gap-2 justify-between">
                   <div className="font-semibold">{bill.name}</div>
                   <div className="text-xs bg-amber-600 text-white rounded px-4 font-semibold ">
                     {bill.status}
                   </div>
                 </div>
                 <div className="flex justify-between items-center gap-2">
                   <div className="font-semibold text-gray-500 text-sm">
                     {bill.productCount} sản phẩm
                   </div>
                   {bill.totalAmount > 0 && (
                     <div className="font-semibold text-red-600 text-sm">
                       {bill.totalAmount.toLocaleString()} VND
                     </div>
                   )}
                 </div>
                 <div className="flex justify-between items-center gap-2">
                   <div className="text-xs text-gray-500">
                     {selectedBillId === bill.id
                       ? "Đang chọn"
                       : "Nhấn để chọn"}
                   </div>
                   <div
                     className="border border-red-700 p-2 rounded cursor-pointer hover:bg-red-50"
                     onClick={(e) => {
                       e.stopPropagation();
                       handleDeleteBill(bill.id);
                     }}
                   >
                     <TrashIcon
                       size={16}
                       weight="bold"
                       className="text-red-800"
                     />
                   </div>
                 </div>
               </div>
             ))
           )}
         </div>
       </div>
     </div>
   </>
 );
}

