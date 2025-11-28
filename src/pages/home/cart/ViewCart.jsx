import React, { useEffect, useState } from "react";
import { Minus, Plus, X } from "lucide-react";
import ClientBreadcrumb from "../ClientBreadcrumb";
import { NavLink, useNavigate } from "react-router";
import { message, Modal } from "antd";
import { formatVND } from "@/api/formatVND";

export default function ViewCart() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [messageApi, messageContextHolder] = message.useMessage();

  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  useEffect(() => {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    setItems(cart);
  }, []);

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(items));
    window.dispatchEvent(new Event("cartUpdated"));
  }, [items]);

  const showDeleteModal = (id) => {
    setDeleteId(id);
    setIsModalOpen(true);
  };

  const handleOk = () => {
    setItems((prev) => prev.filter((item) => item.id !== deleteId));

    setIsModalOpen(false);

    messageApi.success("Xóa sản phẩm thành công");
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  const updateQuantity = (id, delta) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          let newQuantity = item.quantity + delta;

          if (newQuantity > item.soLuongTon) {
            newQuantity = item.soLuongTon;
            messageApi.warning("Số lượng đã đạt tối đa");
          }

          if (newQuantity < 1) {
            newQuantity = 1;
            messageApi.warning("Số lượng phải lớn hơn 1");
          }

          return { ...item, quantity: newQuantity };
        }
        return item;
      })
    );
  };
  const subtotal = items.reduce(
    (sum, item) => sum + item.giaSauGiam * item.quantity,
    0
  );

  return (
    <>
      {messageContextHolder}

      <div className="px-4">
        <div className="max-w-7xl mx-auto flex flex-col gap-5">
          <div>
            <div className="text-3xl font-bold text-gray-900">Giỏ hàng</div>
            <ClientBreadcrumb />
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-gray-100 text-sm font-medium text-gray-700">
                  <div className="col-span-5 font-bold">Sản phẩm</div>
                  <div className="col-span-2 text-center font-bold">Giá</div>
                  <div className="col-span-3 text-center font-bold">
                    Số lượng
                  </div>
                  <div className="col-span-2 text-right font-bold">Xóa</div>
                </div>

                {items.length === 0 ? (
                  <div className="p-10 text-center text-gray-600">
                    <p className="text-lg font-medium">
                      Giỏ hàng của bạn đang trống
                    </p>
                  </div>
                ) : (
                  items.map((item) => (
                    <div
                      key={item.id}
                      className="grid grid-cols-12 gap-4 px-6 py-6 border-b border-gray-300 hover:bg-gray-50 transition"
                    >
                      <div className="col-span-5 flex flex-col gap-1">
                        <div className="flex items-center gap-4">
                          <div className="bg-gray-100 min-w-[78px] min-h-[100px] max-w-[78px] max-h-[100px] flex items-center p-2">
                            <img
                              src={item.duongDanAnh || item.image}
                              alt={item.tenSanPham}
                              className="object-cover rounded"
                            />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 line-clamp-2">
                              {item.tenSanPham}
                            </div>

                            <div className="text-sm text-gray-500">
                              Size: {item.tenKichThuoc || "N/A"}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="col-span-2 flex flex-col items-center justify-center">
                        <span className="font-bold text-sm text-orange-600">
                          {formatVND(item.giaSauGiam)}
                        </span>
                        <span className="font-bold text-xs text-gray-500 line-through">
                          {formatVND(item.giaBan)}
                        </span>
                      </div>

                      <div className="col-span-3 flex items-center justify-center">
                        <div className="flex items-center border border-gray-300 rounded-lg">
                          <div
                            onClick={() => updateQuantity(item.id, -1)}
                            className="p-2 transition cursor-pointer select-none"
                          >
                            <Minus className="w-4 h-4" />
                          </div>

                          <input
                            type="number"
                            value={item.quantity}
                            min={1}
                            onChange={(e) => {
                              let value = Number(e.target.value);

                              if (value < 1) {
                                value = 1;
                                messageApi.warning("Số lượng phải lớn hơn 1");
                              } else if (value > item.soLuongTon) {
                                value = item.soLuongTon;
                                messageApi.warning("Số lượng đã đạt tối đa");
                              }

                              setItems((prev) =>
                                prev.map((it) =>
                                  it.id === item.id
                                    ? { ...it, quantity: value }
                                    : it
                                )
                              );
                            }}
                            className="w-12 text-center bg-transparent outline-none mx-2 appearance-none 
  [&::-webkit-inner-spin-button]:appearance-none 
  [&::-webkit-outer-spin-button]:appearance-none"
                          />

                          <div
                            onClick={() => updateQuantity(item.id, 1)}
                            className="p-2 transition cursor-pointer select-none"
                          >
                            <Plus className="w-4 h-4" />
                          </div>
                        </div>
                      </div>

                      <div className="col-span-2 flex items-center justify-end">
                        <div
                          onClick={() => showDeleteModal(item.id)}
                          className="text-gray-400 hover:text-red-600 transition cursor-pointer select-none"
                        >
                          <X className="w-5 h-5" />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-6">
                <h2 className="text-xl font-bold mb-4">Tổng giỏ hàng</h2>

                <div className="space-y-4 text-gray-700">
                  <div className="flex justify-between">
                    <p className="font-medium mb-3">Tổng sản phẩm</p>
                    <span className="font-medium">{totalQuantity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tạm tính</span>
                    <span className="font-medium">{formatVND(subtotal)}</span>
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex justify-between text-lg font-bold text-gray-900">
                      <span>Tổng cộng</span>
                      <span>{formatVND(subtotal)}</span>
                    </div>
                  </div>

                  <div
                    className="w-full mt-6 py-4 bg-gray-900 text-white font-bold rounded-lg hover:bg-gray-800 transition text-center cursor-pointer"
                    onClick={() => {
                      if (items.length === 0) {
                        messageApi.warning(
                          "Chưa có sản phẩm nào để thanh toán!"
                        );
                        return;
                      }
                      navigate(`/checkout`);
                    }}
                  >
                    Tiến hành thanh toán
                  </div>

                  <div
                    onClick={() => navigate("/product")}
                    className="w-full mt-3 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition text-center cursor-pointer"
                  >
                    Tiếp tục mua sắm
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* MODAL XOÁ */}
        <Modal
          title="Xác nhận xóa"
          open={isModalOpen}
          onOk={handleOk}
          onCancel={handleCancel}
          okText="Xóa"
          cancelText="Hủy"
          okType="danger"
        >
          <p>Bạn có chắc muốn xóa sản phẩm này không?</p>
        </Modal>
      </div>
    </>
  );
}
