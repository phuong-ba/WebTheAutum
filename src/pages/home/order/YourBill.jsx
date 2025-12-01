import React, { useEffect, useState } from "react";
import {
  ClipboardTextIcon,
  ClockIcon,
  PackageIcon,
  ShoppingCartIcon,
  MagnifyingGlassIcon,
} from "@phosphor-icons/react";
import { Input, Empty, Button } from "antd";
import ClientBreadcrumb from "../ClientBreadcrumb";
import { useNavigate } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import { searchOrder } from "@/services/orderService";

export default function YourBill() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { data } = useSelector((state) => state.order);
  const [searchText, setSearchText] = useState("");
  const customerToken = localStorage.getItem("customer_token");
  const customerId = localStorage.getItem("customer_id");
  const [searchedOrders, setSearchedOrders] = useState([]);
  useEffect(() => {
    dispatch(searchOrder("")); // gọi tất cả hóa đơn
  }, [dispatch]);

  const displayedOrders = searchText
    ? data?.filter((order) =>
        order.maHoaDon.toLowerCase().includes(searchText.toLowerCase())
      )
    : customerToken
    ? data?.filter((order) => order.khachHang.id.toString() === customerId)
    : [];

  const handleSearch = () => {
    if (!searchText) {
      setSearchedOrders([]); // nếu không nhập gì thì không hiển thị
      return;
    }

    const result = data?.filter(
      (order) => order.maHoaDon.toLowerCase() === searchText.toLowerCase()
    );

    setSearchedOrders(result);
  };
  const isSearching = searchedOrders.length > 0;
  const ordersToShow = isSearching
    ? searchedOrders
    : customerToken
    ? data?.filter((order) => order.khachHang.id.toString() === customerId)
    : [];

  const hasOrders = ordersToShow && ordersToShow.length > 0;
  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex flex-col gap-6 mb-10">
          <div className="flex items-start gap-4">
            <div className="bg-orange-500 rounded-xl p-4">
              <ClockIcon size={40} weight="bold" className="text-white" />
            </div>
            <div className="flex flex-col gap-2">
              <div className="text-3xl font-bold text-gray-900">
                Lịch sử đơn hàng
              </div>
              <p className="text-gray-500 mt-1">
                Quản lý và theo dõi tất cả đơn hàng của bạn
              </p>
            </div>
          </div>
          <ClientBreadcrumb />
        </div>
        <div className="my-10 bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <ClipboardTextIcon
              size={28}
              weight="bold"
              className="text-orange-500"
            />
            <div className="text-xl font-bold">Tra cứu đơn hàng</div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 max-w-3xl">
            <Input
              size="large"
              placeholder="Nhập mã đơn hàng để tra cứu"
              className="flex-1 text-base"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onPressEnter={handleSearch}
              prefix={
                <MagnifyingGlassIcon size={20} className="text-gray-400 mr-2" />
              }
            />
            <Button
              type="primary"
              size="large"
              className="bg-orange-500 hover:bg-orange-600 font-bold px-8 rounded-lg"
              icon={<MagnifyingGlassIcon size={20} weight="bold" />}
              onClick={handleSearch}
            >
              Tra cứu
            </Button>
          </div>
        </div>

        {hasOrders ? (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
            {ordersToShow.map((order) => (
              <div
                key={order.id}
                className="mb-4 p-4 border border-gray-200 rounded-xl hover:shadow-md transition cursor-pointer"
                onClick={() => navigate(`/orders/${order.id}`)}
              >
                <div className="flex justify-between items-center mb-2">
                  <div className="font-bold text-lg">{order.maHoaDon}</div>
                  <div className="text-gray-500 text-sm">
                    {new Date(order.ngayTao).toLocaleDateString("vi-VN")}
                  </div>
                </div>
                <div className="text-gray-700 mb-1">
                  Khách hàng: {order.khachHang.hoTen} - {order.khachHang.sdt}
                </div>
                <div className="text-gray-700 mb-1">
                  Địa chỉ: {order.diaChiKhachHang}
                </div>
                <div className="text-gray-700 mb-1">
                  Tổng tiền: {order.tongTien.toLocaleString("vi-VN")} đ
                </div>
                <div className="text-gray-700">
                  Thanh toán: {order.hinhThucThanhToan}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-16 text-center">
            {searchText
              ? "Không tìm thấy đơn hàng."
              : !customerToken
              ? "Vui lòng đăng nhập để xem hóa đơn của bạn hoặc tra cứu hóa đơn bằng mã hóa đơn."
              : "Bạn chưa có đơn hàng nào."}
          </div>
        )}
      </div>
    </div>
  );
}
