import React, { useState, useEffect } from "react";
import { Modal, Button, InputNumber, Input, Spin, message } from "antd";
import { PlayCircleOutlined, ExclamationCircleOutlined, WalletOutlined, LogoutOutlined } from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";

const { TextArea } = Input;
const API_BASE = "http://localhost:8080/api";
const PRIMARY_COLOR = "#ff8c42";

// Danh sách route ngoại lệ
const EXCLUDED_ROUTES = [
  "/admin/changeShifts",
  "/login",
  "/register",
  "/forgotpass",
  "/reset-password"
];

const ShiftCheckMiddleware = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [isChecking, setIsChecking] = useState(true);
  const [hasActiveShift, setHasActiveShift] = useState(false);
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [latestCompletedShift, setLatestCompletedShift] = useState(null);
  
  const [startForm, setStartForm] = useState({
    soTienBatDau: null,
    ghiChu: "",
  });

  const getCurrentUser = () => {
    try {
      const userId = localStorage.getItem("user_id");
      const userName = localStorage.getItem("user_name");
      const userEmail = localStorage.getItem("user_email");
      if (userId) return { id: parseInt(userId, 10), hoTen: userName, username: userEmail };
      return null;
    } catch (e) { return null; }
  };

  const shouldCheckShift = () => {
    return !EXCLUDED_ROUTES.some(route => location.pathname.startsWith(route));
  };

  // Hàm xử lý Đăng xuất ngay tại Modal (Tránh bị kẹt)
  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
    window.location.reload(); // Reload để xóa sạch state cũ
  };

  const checkActiveShift = async () => {
    if (!shouldCheckShift()) {
      setIsChecking(false);
      setHasActiveShift(true);
      setShowShiftModal(false); // Ẩn modal nếu vào route ngoại lệ
      return;
    }

    const currentUser = getCurrentUser();
    if (!currentUser) {
      navigate("/login");
      return;
    }

    setIsChecking(true);
    try {
      // LƯU Ý: Nếu Backend có API lọc sẵn thì nên dùng (VD: /giao-ca?status=active) để nhẹ hơn
      const response = await fetch(`${API_BASE}/giao-ca`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("auth_token")}` },
      });

      if (response.ok) {
        const data = await response.json();
        const fullList = Array.isArray(data) ? data : [];

        // Tìm ca active
        const activeShift = fullList.find(
          (gc) => !gc.thoiGianKetThuc && gc.idNhanVien === currentUser.id
        );

        if (activeShift) {
          setHasActiveShift(true);
          setShowShiftModal(false);
        } else {
          // Logic tìm ca gần nhất để fill tiền
          const allCompletedShifts = fullList.filter((gc) => !!gc.thoiGianKetThuc);
          const latestCompleted = allCompletedShifts.sort(
            (a, b) => new Date(b.thoiGianKetThuc) - new Date(a.thoiGianKetThuc)
          )[0];

          setLatestCompletedShift(latestCompleted || null);
          prepareStartForm(latestCompleted);
          setHasActiveShift(false);
          setShowShiftModal(true);
        }
      }
    } catch (error) {
      console.error("Lỗi:", error);
    } finally {
      setIsChecking(false);
    }
  };

  const prepareStartForm = (latestCompleted) => {
    // Logic giữ nguyên như cũ
    const isFirstShift = !latestCompleted;
    if (isFirstShift) {
      setStartForm({ soTienBatDau: 0, ghiChu: "Ca đầu tiên trong phiên, tiền mặt 0 ₫" });
    } else {
      const calculatedEndMoney = latestCompleted.soTienKetThuc ?? ((latestCompleted.tongDoanhThu || 0) + (latestCompleted.soTienBatDau || 0));
      setStartForm({
        soTienBatDau: calculatedEndMoney,
        ghiChu: `Tiền đầu ca từ ca GC${String(latestCompleted.id).padStart(5, "0")} (NV: ${latestCompleted.hoTenNhanVien}).`,
      });
    }
  };

  const handleStartShift = async () => {
    const currentUser = getCurrentUser();
    // Validate cơ bản
    if (!currentUser || startForm.soTienBatDau === null || startForm.soTienBatDau < 0) {
      message.error("Vui lòng kiểm tra lại thông tin tiền đầu ca.");
      return;
    }

    setSubmitLoading(true);
    try {
      const payload = {
        idNhanVien: currentUser.id,
        soTienBatDau: parseFloat(startForm.soTienBatDau),
        ghiChu: startForm.ghiChu || "",
      };

      const response = await fetch(`${API_BASE}/giao-ca/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        message.success("Bắt đầu ca thành công!");
        setShowShiftModal(false);
        setHasActiveShift(true);
        // Quan trọng: Reload lại trang hiện tại để các component con (Dashboard, POS) load lại dữ liệu mới
        window.location.reload(); 
      } else {
        const err = await response.json();
        message.error(err.message || "Lỗi khi tạo ca");
      }
    } catch (error) {
      message.error("Lỗi kết nối server");
    } finally {
      setSubmitLoading(false);
    }
  };

  useEffect(() => {
    checkActiveShift();
  }, [location.pathname]);

  if (isChecking) {
    return <div className="h-screen flex items-center justify-center"><Spin size="large" /></div>;
  }

  // Logic render: Chặn truy cập nếu chưa có ca
  if (!hasActiveShift && shouldCheckShift()) {
    return (
      <>
        {/* Lớp phủ làm mờ và chặn click */}
        <div className="blur-sm pointer-events-none select-none h-screen overflow-hidden">
          {children}
        </div>

        <Modal
          title={
            <div className="flex items-center gap-2 text-xl font-bold text-gray-800 pb-2 border-b">
              <ExclamationCircleOutlined style={{ color: PRIMARY_COLOR }} /> Yêu cầu giao ca
            </div>
          }
          open={showShiftModal}
          closable={false}
          maskClosable={false}
          footer={null}
          centered
          width={500}
        >
          {/* ... (Phần Form giữ nguyên như code của bạn) ... */}
          
          <div className="pt-4 space-y-4">
             {/* Thông báo tiền fill tự động */}
             <div className="bg-orange-50 p-3 rounded-lg border border-orange-100 flex gap-3 items-start">
                <WalletOutlined className="text-orange-500 mt-1" />
                <div className="text-xs text-gray-600">
                   {latestCompletedShift 
                     ? `Hệ thống tự động điền tiền kết thúc của ca trước (Mã: GC${String(latestCompletedShift.id).padStart(5,"0")}) vào tiền đầu ca này.`
                     : "Chưa có ca làm việc nào trước đó. Vui lòng nhập tiền mặt thực tế."}
                </div>
             </div>

             {/* Input Tiền */}
             <div>
                <label className="font-bold text-xs uppercase text-gray-500">Tiền đầu ca <span className="text-red-500">*</span></label>
                <InputNumber 
                    className="w-full mt-1" 
                    size="large" 
                    formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={value => value?.replace(/\$\s?|(,*)/g, '')}
                    value={startForm.soTienBatDau}
                    onChange={(val) => setStartForm({...startForm, soTienBatDau: val})}
                    // Cho phép sửa tiền kể cả khi có gợi ý (để linh hoạt thực tế)
                />
             </div>

             {/* Input Ghi chú */}
             <div>
                <label className="font-bold text-xs uppercase text-gray-500">Ghi chú</label>
                <TextArea 
                    rows={2} 
                    className="mt-1"
                    value={startForm.ghiChu}
                    onChange={(e) => setStartForm({...startForm, ghiChu: e.target.value})}
                />
             </div>

             <div className="flex justify-between items-center pt-2 border-t mt-4">
                {/* NÚT ĐĂNG XUẤT QUAN TRỌNG */}
                <Button 
                    icon={<LogoutOutlined />} 
                    danger 
                    type="text"
                    onClick={handleLogout}
                >
                    Đăng xuất
                </Button>
                
                <div className="flex gap-2">
                    <Button onClick={() => navigate("/admin/changeShifts")}>
                        Quản lý Giao ca
                    </Button>
                    <Button 
                        type="primary" 
                        onClick={handleStartShift} 
                        loading={submitLoading}
                        style={{ background: PRIMARY_COLOR, borderColor: PRIMARY_COLOR }}
                        icon={<PlayCircleOutlined />}
                    >
                        Bắt đầu ca
                    </Button>
                </div>
             </div>
          </div>
        </Modal>
      </>
    );
  }

  return <>{children}</>;
};

export default ShiftCheckMiddleware;