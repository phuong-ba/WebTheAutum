import React, { useEffect, useState } from "react";
import {
  ClockIcon,
  PackageIcon,
  TruckIcon,
  CheckCircleIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
  StorefrontIcon,
  MapPinIcon,
  CreditCardIcon,
  UserIcon,
  CalendarIcon,
  MoneyIcon,
} from "@phosphor-icons/react";
import { Input, Button, Tag, Empty } from "antd";
import ClientBreadcrumb from "../ClientBreadcrumb";
import { useNavigate } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import { searchOrder } from "@/services/orderService";

export default function YourBill() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { data: allOrders } = useSelector((state) => state.order);

  const [searchText, setSearchText] = useState("");
  const [searchedOrders, setSearchedOrders] = useState([]);

  const customerToken = localStorage.getItem("customer_token");
  const customerId = localStorage.getItem("customer_id");

  useEffect(() => {
    dispatch(searchOrder(""));
  }, [dispatch]);

  const handleSearch = () => {
    if (!searchText.trim()) {
      setSearchedOrders([]);
      return;
    }
    const result = allOrders?.filter((order) =>
      order.maHoaDon.toLowerCase().includes(searchText.toLowerCase())
    );
    setSearchedOrders(result || []);
  };

  const isSearching = searchedOrders.length > 0;
  const ordersToShow = isSearching
    ? searchedOrders
    : customerToken
    ? allOrders?.filter((order) => order.khachHang?.id === Number(customerId))
    : [];
  console.log("🚀 ~ YourBill ~ ordersToShow:", ordersToShow);

  const hasOrders = ordersToShow && ordersToShow.length > 0;

  const getStatusInfo = (trangThai) => {
    switch (trangThai) {
      case 0:
        return { icon: <ClockIcon />, color: "orange", text: "Chờ xác nhận" };
      case 1:
        return { icon: <PackageIcon />, color: "blue", text: "Chờ giao hàng" };
      case 2:
        return { icon: <TruckIcon />, color: "purple", text: "Đang giao" };
      case 3:
        return {
          icon: <CheckCircleIcon />,
          color: "green",
          text: "Hoàn thành",
        };
      case 4:
        return { icon: <XCircleIcon />, color: "red", text: "Đã hủy" };
      default:
        return { icon: <ClockIcon />, color: "gray", text: "Không xác định" };
    }
  };

  const formatMoney = (amount) => {
    return Number(amount).toLocaleString("vi-VN") + " đ";
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 rounded-2xl">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col gap-6 mb-10">
          <div className="flex items-start gap-4">
            <div className="bg-orange-500 rounded-xl p-4">
              <ClockIcon size={40} weight="bold" className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Lịch sử đơn hàng
              </h1>
              <p className="text-gray-500 mt-1">
                Theo dõi chi tiết tất cả đơn hàng của bạn
              </p>
            </div>
          </div>
          <ClientBreadcrumb />
        </div>

        <div className="bg-white rounded-2xl shadow-sm border p-6 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <MagnifyingGlassIcon
              size={28}
              weight="bold"
              className="text-orange-500"
            />
            <h2 className="text-xl font-bold">Tra cứu đơn hàng</h2>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 max-w-3xl">
            <Input
              size="large"
              placeholder="Nhập mã đơn hàng (VD: HD001234)"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onPressEnter={handleSearch}
              prefix={
                <MagnifyingGlassIcon size={20} className="text-gray-400" />
              }
            />
            <Button
              type="primary"
              size="large"
              className="bg-orange-500 hover:bg-orange-600 font-bold"
              onClick={handleSearch}
            >
              Tra cứu
            </Button>
          </div>
        </div>

        {hasOrders ? (
          <div className="space-y-6">
            {ordersToShow.map((order) => {
              const status = getStatusInfo(order.trangThai);
              return (
                <div
                  key={order.id}
                  onClick={() => navigate(`/orders/${order.id}`)}
                  className="bg-white rounded-2xl shadow hover:shadow-lg transition-all cursor-pointer border border-gray-200 overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-2xl font-bold text-orange-600">
                          {order.maHoaDon}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                          <CalendarIcon size={16} />
                          {new Date(order.ngayTao).toLocaleString("vi-VN")}
                        </div>
                      </div>

                      <Tag color={status.color} className="text-base px-3 py-1">
                        <div className="flex items-center gap-2">
                          <div className="text-lg">{status.icon}</div>
                          <div>{status.text}</div>
                        </div>
                      </Tag>
                    </div>

                    {/* Thông tin chính */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-700">
                      <div className="space-y-3">
                        <div className="flex items-start gap-2">
                          <UserIcon
                            size={20}
                            className="text-orange-500 mt-0.5"
                          />
                          <div>
                            <strong>Khách hàng:</strong>{" "}
                            {order.khachHang?.hoTen || "Khách lẻ"} <br />
                            <span className="text-sm text-gray-500">
                              {order.khachHang?.sdt || ""}{" "}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <MapPinIcon
                            size={20}
                            className="text-orange-500 mt-0.5"
                          />
                          <div>
                            <strong>Địa chỉ giao:</strong>{" "}
                            {order.diaChiKhachHang || "Không có"}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <StorefrontIcon
                            size={20}
                            className="text-orange-500"
                          />
                          <strong>Loại đơn:</strong>{" "}
                          {order.loaiHoaDon ? "Tại quầy" : "Giao hàng Online"}
                        </div>

                        {order.nhanVien && (
                          <div className="flex items-center gap-2">
                            <UserIcon size={20} className="text-orange-500" />
                            <strong>Nhân viên:</strong> {order.nhanVien.hoTen}
                          </div>
                        )}
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <MoneyIcon size={20} className="text-green-600" />
                          <div>
                            <strong>Tổng tiền:</strong>{" "}
                            {formatMoney(order.tongTien)} <br />
                            <span className="text-lg font-bold text-green-600">
                              Sau giảm giá: {formatMoney(order.tongTienSauGiam)}
                            </span>
                          </div>
                        </div>

                        {order.phiVanChuyen > 0 && (
                          <div className="text-sm">
                            Phí vận chuyển: {formatMoney(order.phiVanChuyen)}
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          <CreditCardIcon
                            size={20}
                            className="text-orange-500"
                          />
                          <strong>Thanh toán:</strong>{" "}
                          {order.hinhThucThanhToan || "Chưa thanh toán"}
                        </div>

                        {order.ngayThanhToan && (
                          <div className="text-sm text-gray-500">
                            Thanh toán lúc:{" "}
                            {new Date(order.ngayThanhToan).toLocaleString(
                              "vi-VN"
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Ghi chú */}
                    {order.ghiChu && (
                      <div className="mt-5 pt-5 border-t border-gray-200">
                        <p className="text-sm text-gray-600">
                          <strong>Ghi chú:</strong> {order.ghiChu}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border p-16 text-center">
            <Empty
              description={
                searchText
                  ? "Không tìm thấy đơn hàng với mã này."
                  : customerToken
                  ? "Bạn chưa có đơn hàng nào."
                  : "Vui lòng đăng nhập hoặc nhập mã đơn hàng để tra cứu."
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}
