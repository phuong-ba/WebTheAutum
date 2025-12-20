import { InvoiceIcon, TrashIcon } from "@phosphor-icons/react";
import Search from "antd/es/input/Search";
import React, { useState, useEffect, useRef } from "react";
import { message, Modal, Spin } from "antd";
import { useDispatch } from "react-redux";
import SockJS from "sockjs-client";
import { Stomp } from "@stomp/stompjs";
import {
  tangSoLuong,
  fetchChiTietSanPham,
} from "@/services/chiTietSanPhamService";
import hoaDonApi from "@/api/HoaDonAPI";
import { getCurrentUserId, getCurrentUserName } from "@/utils/authHelper";

export default function SellBill({ onSelectBill }) {
  const dispatch = useDispatch();
  const [bills, setBills] = useState([]);
  const [messageApi, contextHolder] = message.useMessage();
  const [selectedBillId, setSelectedBillId] = useState(null);
  const [stompClient, setStompClient] = useState(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [billToDelete, setBillToDelete] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [updatingBills, setUpdatingBills] = useState({});

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
  const lastCleanupDateRef = useRef(
    localStorage.getItem("lastCleanupDate") || ""
  );
  const cleanupCheckedRef = useRef(false);

  // Lấy thông tin người dùng hiện tại
  useEffect(() => {
    const userId = getCurrentUserId();
    setCurrentUserId(userId);
  }, []);

  /* ================= WEBSOCKET ================= */
  useEffect(() => {
    const socket = new SockJS(apiBaseUrl);
    const client = Stomp.over(socket);
    client.debug = () => {};

    client.connect({}, () => setStompClient(client));
    return () => client?.connected && client.disconnect();
  }, []);

  /* ================= KIỂM TRA VÀ XÓA HÓA ĐƠN CŨ TỰ ĐỘNG ================= */
  useEffect(() => {
    const performAutoCleanup = async () => {
      // Chỉ kiểm tra một lần khi component mount
      if (cleanupCheckedRef.current) return;

      const today = new Date().toDateString();
      const lastCleanup = lastCleanupDateRef.current;

      // Nếu đã kiểm tra hôm nay rồi thì bỏ qua
      if (lastCleanup === today) {
        cleanupCheckedRef.current = true;
        return;
      }

      try {
        console.log("Kiểm tra và xóa hóa đơn chờ từ ngày trước...");

        // Lấy tất cả hóa đơn chờ từ API
        const res = await hoaDonApi.getHoaDonCho();
        const apiBills = res.data.data || [];

        // Lấy hóa đơn từ localStorage
        const localBills =
          JSON.parse(localStorage.getItem("pendingBills")) || [];

        const billsToDelete = [];
        const todayBills = [];

        // Phân loại hóa đơn: cũ vs mới (hôm nay)
        for (const apiBill of apiBills) {
          const billDate = new Date(apiBill.ngayTao).toDateString();

          if (billDate === today) {
            todayBills.push(apiBill);
          } else {
            billsToDelete.push(apiBill);
          }
        }

        // Xóa các hóa đơn cũ
        let deletedCount = 0;
        for (const bill of billsToDelete) {
          try {
            // Hoàn kho trước khi xóa
            const localBill = localBills.find((b) => b.id === bill.id);
            if (localBill?.cart?.length) {
              await Promise.all(
                localBill.cart.map((p) =>
                  dispatch(
                    tangSoLuong({
                      id: p.idChiTietSanPham,
                      soLuong: p.quantity,
                    })
                  ).unwrap()
                )
              );
            }

            // Xóa từ API
            await hoaDonApi.deleteHoaDon(bill.id);
            deletedCount++;

            // Gửi thông báo websocket nếu cần
            if (stompClient?.connected) {
              stompClient.send(
                "/topic/display",
                {},
                JSON.stringify({
                  maHoaDon: bill.maHoaDon || `HD_${bill.id}`,
                  tongTien: localBill?.totalAmount || 0,
                  items: localBill?.cart || [],
                  trangThai: 4,
                })
              );
            }

            console.log(`Đã xóa hóa đơn cũ: ${bill.maHoaDon || bill.id}`);
          } catch (error) {
            console.error(`Lỗi xóa hóa đơn ${bill.id}:`, error);
          }
        }

        // Cập nhật localStorage - chỉ giữ lại hóa đơn của ngày hôm nay
        const updatedLocalBills = localBills.filter((localBill) => {
          if (!localBill.createdAt) return false;
          const billDate = new Date(localBill.createdAt).toDateString();
          return billDate === today;
        });
        localStorage.setItem("pendingBills", JSON.stringify(updatedLocalBills));

        // Lưu ngày kiểm tra cuối cùng
        localStorage.setItem("lastCleanupDate", today);
        lastCleanupDateRef.current = today;
        cleanupCheckedRef.current = true;

        // Tải lại danh sách hóa đơn (chỉ hóa đơn của hôm nay)
        if (deletedCount > 0) {
          console.log(
            `Đã tự động xóa ${deletedCount} hóa đơn chờ từ ngày trước`
          );

          // Tải lại danh sách hóa đơn hiện tại
          await loadBills();

          // Hiển thị thông báo
          messageApi.info({
            content: `Đã tự động xóa ${deletedCount} hóa đơn chờ từ ngày trước`,
            duration: 5,
          });
        }
      } catch (error) {
        console.error("Lỗi kiểm tra hóa đơn cũ:", error);
        cleanupCheckedRef.current = true;
      }
    };

    // Thực hiện kiểm tra khi component mount
    if (currentUserId && stompClient) {
      performAutoCleanup();
    }
  }, [currentUserId, stompClient, dispatch, messageApi]);

  /* ================= TẢI DANH SÁCH HÓA ĐƠN ================= */
  const loadBills = async () => {
    try {
      const res = await hoaDonApi.getHoaDonCho();
      const list = res.data.data || [];

      // Lấy thông tin từ localStorage
      const localBills = JSON.parse(localStorage.getItem("pendingBills")) || [];
      const today = new Date().toDateString();

      // Lọc chỉ lấy hóa đơn của ngày hôm nay
      const todayBills = list.filter((hd) => {
        const billDate = new Date(hd.ngayTao).toDateString();
        return billDate === today;
      });

      const mapped = todayBills.map((hd) => {
        const localBill = localBills.find((bill) => bill.id === hd.id);

        return {
          id: hd.id,
          name: hd.maHoaDon || `HD_${hd.id}`,
          status: "Chờ xử lý",
          productCount: localBill?.cart?.length || 0,
          totalAmount: localBill?.totalAmount || 0,
          cart: localBill?.cart || [],
          createdAt: hd.ngayTao,
          nhanVienId: hd.nhanVien?.id,
          nhanVienName:
            hd.nhanVien?.tenNhanVien || getCurrentUserName() || "Nhân viên",
        };
      });

      setBills(mapped);

      // Tự động chọn hóa đơn đầu tiên nếu chưa có hóa đơn nào được chọn
      if (mapped.length > 0 && !selectedBillId) {
        setSelectedBillId(mapped[0].id);
        onSelectBill(mapped[0].id);
      } else if (mapped.length === 0) {
        setSelectedBillId(null);
        onSelectBill(null);
      }
    } catch (error) {
      console.error("Lỗi tải danh sách hóa đơn:", error);
      messageApi.error("Không thể tải danh sách hóa đơn");
    }
  };

  /* ================= CẬP NHẬT TỪ LOCALSTORAGE ================= */
  useEffect(() => {
    const updateBillsFromLocalStorage = () => {
      const localBills = JSON.parse(localStorage.getItem("pendingBills")) || [];
      const today = new Date().toDateString();

      setBills((prevBills) => {
        return prevBills.map((bill) => {
          const localBill = localBills.find((lb) => lb.id === bill.id);
          if (localBill) {
            return {
              ...bill,
              productCount: localBill.cart?.length || 0,
              totalAmount: localBill.totalAmount || 0,
              cart: localBill.cart || [],
            };
          }
          return bill;
        });
      });
    };

    const handleCartUpdated = () => {
      updateBillsFromLocalStorage();
    };

    const handleStorageChange = (e) => {
      if (e.key === "pendingBills") {
        updateBillsFromLocalStorage();
      }
    };

    window.addEventListener("cartUpdated", handleCartUpdated);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("cartUpdated", handleCartUpdated);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  /* ================= KHỞI TẠO ================= */
  useEffect(() => {
    loadBills();
  }, [currentUserId]);

  const onSearch = (value) => console.log(value);

  /* ================= TẠO HÓA ĐƠN MỚI ================= */
  const handleCreateBill = async () => {
    if (bills.length >= 6) {
      messageApi.warning("Chỉ được tạo tối đa 6 hóa đơn chờ!");
      return;
    }

    if (!currentUserId) {
      messageApi.error("Vui lòng đăng nhập để tạo hóa đơn!");
      return;
    }

    setLoading(true);
    try {
      const res = await hoaDonApi.createHoaDonRong({
        trangThai: 5,
        idNhanVien: currentUserId,
      });

      const hd = res.data.data;
      console.log("Hóa đơn vừa tạo:", hd);

      // Tạo bill object với thông tin từ response
      const newBill = {
        id: hd.id,
        name: hd.maHoaDon || `HD_${hd.id}`,
        originalMaHoaDon: hd.maHoaDon,
        status: "Chờ xử lý",
        productCount: 0,
        totalAmount: 0,
        cart: [],
        createdAt: hd.ngayTao,
        nhanVienId: currentUserId,
        nhanVienName: getCurrentUserName() || "Nhân viên",
        isNew: true,
      };

      // Lưu vào localStorage
      const localBills = JSON.parse(localStorage.getItem("pendingBills")) || [];
      localBills.push(newBill);
      localStorage.setItem("pendingBills", JSON.stringify(localBills));

      // Cập nhật state ngay lập tức
      setBills((prev) => [...prev, newBill]);
      setSelectedBillId(newBill.id);
      onSelectBill(newBill.id);

      // Đánh dấu đang cập nhật cho bill này
      setUpdatingBills((prev) => ({
        ...prev,
        [newBill.id]: true,
      }));

      messageApi.success("Đã tạo hóa đơn mới!");

      // Nếu chưa có mã, thử tải lại sau 1.5 giây để lấy mã đã được tính
      if (!hd.maHoaDon) {
        setTimeout(() => {
          updateBillCode(newBill.id);
        }, 1500);
      } else {
        // Nếu đã có mã, xóa flag updating
        setTimeout(() => {
          setUpdatingBills((prev) => {
            const updated = { ...prev };
            delete updated[newBill.id];
            return updated;
          });
        }, 500);
      }
    } catch (error) {
      console.error("Lỗi tạo hóa đơn:", error);
      messageApi.error("Không thể tạo hóa đơn!");
    } finally {
      setLoading(false);
    }
  };

  /* ================= CẬP NHẬT MÃ HÓA ĐƠN ================= */
  const updateBillCode = async (billId) => {
    try {
      // Gọi API lấy chi tiết hóa đơn để có mã mới nhất
      const detailRes = await hoaDonApi.getHoaDonById(billId);
      const updatedHd = detailRes.data.data;

      if (updatedHd.maHoaDon) {
        // Cập nhật state
        setBills((prevBills) =>
          prevBills.map((bill) =>
            bill.id === billId ? { ...bill, name: updatedHd.maHoaDon } : bill
          )
        );

        // Cập nhật localStorage
        const localBills =
          JSON.parse(localStorage.getItem("pendingBills")) || [];
        const updatedLocalBills = localBills.map((bill) =>
          bill.id === billId ? { ...bill, name: updatedHd.maHoaDon } : bill
        );
        localStorage.setItem("pendingBills", JSON.stringify(updatedLocalBills));
      }
    } catch (error) {
      console.error("Lỗi cập nhật mã hóa đơn:", error);
    } finally {
      // Xóa flag updating
      setUpdatingBills((prev) => {
        const updated = { ...prev };
        delete updated[billId];
        return updated;
      });
    }
  };

  /* ================= HOÀN KHO ================= */
  const handleRestoreInventory = async (bill) => {
    if (!bill.cart?.length) return true;

    try {
      await Promise.all(
        bill.cart.map((p) =>
          dispatch(
            tangSoLuong({
              id: p.idChiTietSanPham,
              soLuong: p.quantity,
            })
          ).unwrap()
        )
      );
      dispatch(fetchChiTietSanPham());
      return true;
    } catch {
      return false;
    }
  };

  /* ================= XÓA HÓA ĐƠN ================= */
  const showDeleteConfirm = (bill) => {
    setBillToDelete(bill);
    setDeleteModalVisible(true);
  };

  const handleDeleteConfirm = async () => {
    if (!billToDelete) return;

    // Hoàn kho nếu có sản phẩm trong giỏ
    if (billToDelete.cart.length) {
      const ok = await handleRestoreInventory(billToDelete);
      if (!ok) {
        messageApi.error("Hoàn kho thất bại!");
        return;
      }
    }

    try {
      await hoaDonApi.deleteHoaDon(billToDelete.id);
    } catch {
      messageApi.error("Xóa hóa đơn thất bại!");
      return;
    }

    // Xóa khỏi localStorage
    const localBills = JSON.parse(localStorage.getItem("pendingBills")) || [];
    const updatedLocalBills = localBills.filter(
      (bill) => bill.id !== billToDelete.id
    );
    localStorage.setItem("pendingBills", JSON.stringify(updatedLocalBills));

    // Gửi thông báo websocket nếu cần
    if (stompClient?.connected) {
      stompClient.send(
        "/topic/display",
        {},
        JSON.stringify({
          maHoaDon: billToDelete.name,
          tongTien: billToDelete.totalAmount,
          items: billToDelete.cart,
          trangThai: 4,
        })
      );
    }

    // Cập nhật state
    const updated = bills.filter((b) => b.id !== billToDelete.id);
    setBills(updated);

    if (selectedBillId === billToDelete.id) {
      const next = updated[0]?.id || null;
      setSelectedBillId(next);
      onSelectBill(next);
    }

    messageApi.success("Đã xóa hóa đơn!");
    setDeleteModalVisible(false);
    setBillToDelete(null);
  };

  const handleDeleteCancel = () => {
    setDeleteModalVisible(false);
    setBillToDelete(null);
  };

  const handleSelectBill = (billId) => {
    setSelectedBillId(billId);
    onSelectBill(billId);
  };

  const selectedBill = bills.find((b) => b.id === selectedBillId);

  /* ================= KIỂM TRA NGÀY MỚI KHI TAB ĐƯỢC FOCUS ================= */
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Khi tab trở lại focus, kiểm tra ngày mới
        const today = new Date().toDateString();
        const lastCleanup = localStorage.getItem("lastCleanupDate") || "";

        if (lastCleanup !== today) {
          // Reset flag để thực hiện cleanup lại
          cleanupCheckedRef.current = false;
          lastCleanupDateRef.current = "";
          loadBills();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  /* ================= RENDER ================= */
  return (
    <>
      {contextHolder}

      <Modal
        title="Xác nhận xóa hóa đơn"
        open={deleteModalVisible}
        onOk={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        okText="Xóa"
        cancelText="Hủy"
        okButtonProps={{ danger: true }}
        centered
      >
        <p>
          Bạn có chắc muốn xóa hóa đơn <strong>"{billToDelete?.name}"</strong>?
        </p>
        {billToDelete?.cart?.length > 0 && (
          <p className="text-red-600 mt-2">
            ⚠️ {billToDelete.cart.length} sản phẩm sẽ được hoàn trả về kho
          </p>
        )}
      </Modal>

      <div className="bg-white py-5 px-4 flex flex-col gap-3 rounded-lg shadow overflow-hidden h-full">
        <div className="flex gap-3 p-2 items-center">
          <Search placeholder="Tìm kiếm hóa đơn..." onSearch={onSearch} />
          <div
            className={`font-bold text-sm py-2 px-4 min-w-[120px] cursor-pointer select-none text-center rounded-md ${
              currentUserId
                ? "bg-[#E67E22] text-white hover:bg-amber-600 active:bg-cyan-800 shadow"
                : "bg-gray-400 text-gray-200 cursor-not-allowed"
            }`}
            onClick={currentUserId ? handleCreateBill : null}
            disabled={loading || !currentUserId}
          >
            {loading ? "Đang tạo..." : "Tạo hóa đơn"}
          </div>
        </div>

        {!currentUserId && (
          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-3 mb-3 rounded">
            <p className="font-bold">Thông báo</p>
            <p>Vui lòng đăng nhập để có thể tạo hóa đơn.</p>
          </div>
        )}

        <div className="shadow overflow-hidden rounded-lg min-h-[160px] m-2">
          <div className="p-4 font-bold text-2xl bg-amber-600 opacity-75 rounded-t-lg text-white flex gap-2 items-center justify-between">
            <div className="flex items-center gap-2">
              <InvoiceIcon size={32} />
              <span>
                Hóa đơn chờ {selectedBill && `- ${selectedBill.name}`}
              </span>
            </div>
            <div className="text-sm font-normal">
              Tổng: {bills.length} hóa đơn
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
                  className={`border-2 border-amber-600 opacity-75 rounded px-4 py-4 flex flex-col gap-3 min-w-[200px] cursor-pointer transition-all relative ${
                    selectedBillId === bill.id
                      ? "bg-green-50 shadow-lg border-green-500"
                      : "bg-emerald-50 hover:shadow-md"
                  }`}
                  onClick={() => handleSelectBill(bill.id)}
                >
                  {/* Loading overlay cho hóa đơn đang cập nhật */}
                  {updatingBills[bill.id] && (
                    <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center rounded z-10">
                      <Spin size="small" />
                    </div>
                  )}

                  <div className="flex items-center gap-2 justify-between">
                    <div className="font-semibold flex items-center gap-2">
                      {bill.name}
                      {updatingBills[bill.id] && (
                        <span className="text-xs text-blue-500 animate-pulse">
                          (đang cập nhật...)
                        </span>
                      )}
                    </div>
                    <div className="text-xs bg-amber-600 text-white rounded px-4 font-semibold">
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
                        showDeleteConfirm(bill);
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
