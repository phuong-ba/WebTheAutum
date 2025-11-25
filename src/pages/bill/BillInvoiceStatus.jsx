import {
  CheckCircleIcon,
  ClockCountdownIcon,
  HourglassMediumIcon,
  PackageIcon,
  TruckIcon,
  XCircleIcon,
} from "@phosphor-icons/react";
import { message, Modal } from "antd";
import React, { useState, useEffect } from "react";
import hoaDonApi from "../../api/HoaDonAPI";

export default function BillInvoiceStatus({
  currentStatus,
  invoiceData,
  isEditing,
  tempLoaiHoaDon,
  invoiceId,
  onStatusChange,
  onTempStatusChange,
}) {
  const steps = [
    { label: "Chờ xác nhận", value: 0, icon: HourglassMediumIcon },
    { label: "Chờ giao hàng", value: 1, icon: PackageIcon },
    { label: "Đang giao hàng", value: 2, icon: TruckIcon },
    { label: "Đã hoàn thành", value: 3, icon: CheckCircleIcon },
    { label: "Đã hủy", value: 4, icon: XCircleIcon },
  ];
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isNextStatusModalOpen, setIsNextStatusModalOpen] = useState(false);
  const [nextStatusInfo, setNextStatusInfo] = useState({});
  const [statusStep, setStatusStep] = useState(currentStatus ?? 0);
  const [originalStatus, setOriginalStatus] = useState(currentStatus ?? 0);
  const [statusHistory, setStatusHistory] = useState({});
  const [currentLoaiHoaDon, setCurrentLoaiHoaDon] = useState(
    tempLoaiHoaDon ?? false
  );

  // Helper: key for localStorage (use invoiceId if có, fallback to invoiceData.id or 'temp')
  const getStorageKey = () =>
    `invoice_${invoiceId ?? invoiceData?.id ?? "temp"}_statusHistory`;

  useEffect(() => {
    if (currentStatus !== undefined) {
      setStatusStep(currentStatus);
      setOriginalStatus(currentStatus);
    }
  }, [currentStatus]);

  useEffect(() => {
    if (tempLoaiHoaDon !== undefined) {
      setCurrentLoaiHoaDon(tempLoaiHoaDon);
    }
  }, [tempLoaiHoaDon]);

  // Khi component mount hoặc invoiceData thay đổi, load history từ localStorage hoặc từ invoiceData
  useEffect(() => {
    if (!invoiceData && !invoiceId) return;

    const storedHistory = localStorage.getItem(getStorageKey());
    if (storedHistory) {
      try {
        setStatusHistory(JSON.parse(storedHistory));
      } catch {
        // nếu parse lỗi thì fallback
        const history = {
          0: invoiceData?.ngayTao,
          1: invoiceData?.ngayXacNhan,
          2: invoiceData?.ngayGiaoHang,
          3: invoiceData?.ngayHoanThanh,
          4: invoiceData?.ngayHuy,
        };
        setStatusHistory(history);
      }
    } else {
      const history = {
        0: invoiceData?.ngayTao,
        1: invoiceData?.ngayXacNhan,
        2: invoiceData?.ngayGiaoHang,
        3: invoiceData?.ngayHoanThanh,
        4: invoiceData?.ngayHuy,
      };
      setStatusHistory(history);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoiceData, invoiceId]);

  // Khi đang chỉnh sửa (isEditing = true) → đảm bảo history có timestamp cho các bước hiện tại
  useEffect(() => {
    if (!isEditing) return;

    const now = new Date().toISOString();
    const newHistory = { ...statusHistory };

    for (let i = 0; i <= statusStep; i++) {
      if (!newHistory[i]) {
        newHistory[i] = now;
      }
    }

    setStatusHistory(newHistory);
    localStorage.setItem(getStorageKey(), JSON.stringify(newHistory));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusStep, isEditing]);

  // Khi không trong chế độ chỉnh sửa: nếu có localStorage thì load lại và reset statusStep thành originalStatus
  useEffect(() => {
    if (isEditing) return;

    const storedHistory = localStorage.getItem(getStorageKey());
    if (storedHistory) {
      try {
        setStatusHistory(JSON.parse(storedHistory));
      } catch {
        // ignore
      }
    }
    setStatusStep(originalStatus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing]);

  // NEW: cập nhật statusHistory logic gọn, lưu localStorage, và thông báo callback
  const updateStatusHistory = (newStatus) => {
    const now = new Date().toISOString();
    const newHistory = { ...statusHistory };

    // Gán timestamp cho bước mới nếu chưa có (hoặc luôn cập nhật để phản ánh thời gian chính xác chuyển trạng thái)
    newHistory[newStatus] = now;

    // (Tùy chọn) Bạn có thể muốn đảm bảo tất cả bước trước cũng có timestamp:
    for (let i = 0; i < newStatus; i++) {
      if (!newHistory[i]) {
        newHistory[i] = now;
      }
    }

    setStatusHistory(newHistory);
    localStorage.setItem(getStorageKey(), JSON.stringify(newHistory));

    // Nếu parent cần biết thay đổi tạm (chưa lưu lên server) => gọi onTempStatusChange
    if (onTempStatusChange) {
      onTempStatusChange(newStatus, newHistory);
    }
  };

  const handleNextStatusClick = () => {
    if (statusStep >= steps.length - 1) {
      message.warning("Đã đạt trạng thái cuối cùng");
      return;
    }

    const newStatus = statusStep + 1;
    const currentStep = steps[statusStep];
    const nextStep = steps[newStatus];

    setNextStatusInfo({
      from: currentStep.label,
      to: nextStep.label,
      newStatus: newStatus,
    });
    setIsNextStatusModalOpen(true);
  };

  const confirmNextStatus = async () => {
    try {
      // Gọi API để cập nhật trạng thái trên server
      await hoaDonApi.updateHoaDon(invoiceId, {
        trangThai: nextStatusInfo.newStatus,
      });

      // Cập nhật local: statusStep và statusHistory
      setStatusStep(nextStatusInfo.newStatus);
      updateStatusHistory(nextStatusInfo.newStatus);

      message.success(
        `Đã chuyển trạng thái thành: ${
          steps[nextStatusInfo.newStatus]?.label || "Không xác định"
        }`
      );

      // Thông báo parent
      if (onStatusChange) {
        onStatusChange(nextStatusInfo.newStatus);
        if (nextStatusInfo.newStatus !== 0) {
          message.info("Đơn hàng đã chuyển trạng thái, không thể chỉnh sửa");
        }
      }
    } catch (error) {
      console.error("Lỗi khi chuyển trạng thái:", error);
      message.error("Chuyển trạng thái thất bại!");
    } finally {
      setIsNextStatusModalOpen(false);
      setNextStatusInfo({});
    }
  };

  const handleCancelOrder = () => {
    setIsCancelModalOpen(true);
  };

  const confirmCancelOrder = async () => {
    try {
      // Gọi API hủy đơn
      await hoaDonApi.updateHoaDon(invoiceId, {
        trangThai: 4,
      });

      // Cập nhật local
      setStatusStep(4);
      updateStatusHistory(4);

      // Thông báo parent
      onStatusChange?.(4);

      message.success({
        content: "Đơn hàng đã được hủy thành công!",
        duration: 3,
        icon: <XCircleIcon size={20} weight="fill" />,
      });
    } catch (error) {
      console.error("Lỗi hủy đơn:", error);
      message.error("Hủy đơn hàng thất bại!");
    } finally {
      setIsCancelModalOpen(false);
    }
  };

  const getStatusColor = (index) => {
    if (index <= statusStep) return "bg-emerald-500";
    return "bg-gray-400";
  };

  const getLineColor = (index) => {
    if (index < statusStep) return "bg-emerald-500";
    return "bg-gray-400";
  };

  const getTextColor = (index) => {
    if (index <= statusStep) return "text-emerald-600";
    return "text-gray-500";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  const getStatusDate = (stepIndex) =>
    statusHistory[stepIndex] ? formatDate(statusHistory[stepIndex]) : "";

  const isFinalStatus = statusStep === 3;
  const isFalseStatus = statusStep === 4;
  const canProceed = statusStep < 3;
  const isCompleted = statusStep === 3;

  const getNextStatusIcon = () => {
    const nextStatus = nextStatusInfo.newStatus;
    if (nextStatus !== undefined && steps[nextStatus]) {
      const IconComponent = steps[nextStatus].icon;
      return <IconComponent size={24} weight="fill" />;
    }
    return <CheckCircleIcon size={24} weight="fill" />;
  };

  return (
    <>
      <div className="bg-white flex flex-col gap-3 rounded-lg shadow overflow-hidden mb-5">
        <div>
          <div className="flex justify-between items-center p-4 bg-gray-200">
            <div className="text-lg font-bold flex gap-2 items-center">
              <ClockCountdownIcon size={24} />
              Trạng thái hóa đơn
            </div>

            <div className="flex gap-2 items-center">
              {canProceed && !isFalseStatus && (
                <div
                  onClick={handleNextStatusClick}
                  className="font-bold text-sm py-2 px-4 min-w-[120px] cursor-pointer select-none text-center rounded-md bg-[#E67E22] text-white hover:bg-amber-600 active:bg-cyan-800 shadow"
                >
                  Chuyển trạng thái
                </div>
              )}

              {!isCompleted && !isFalseStatus && (
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCancelOrder();
                  }}
                  className="font-bold text-sm py-2 px-4 min-w-[120px] cursor-pointer select-none text-center rounded-md bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow transition-colors"
                >
                  Hủy đơn hàng
                </div>
              )}
            </div>
          </div>

          <div
            className={`px-5 py-10 ${
              isFinalStatus || isFalseStatus
                ? "flex justify-center"
                : "flex justify-between items-center"
            }`}
          >
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isCurrent = index === statusStep;
              const isDone = index <= statusStep;

              if ((isFinalStatus || isFalseStatus) && index !== statusStep) {
                return null;
              }

              return (
                <React.Fragment key={index}>
                  <div className="flex flex-col items-center gap-2">
                    <div
                      className={`rounded-full p-3 transition-colors duration-300 ${
                        isFalseStatus ? "bg-orange-600" : getStatusColor(index)
                      }`}
                    >
                      {isFalseStatus ? (
                        <XCircleIcon
                          size={24}
                          className="text-white"
                          weight="fill"
                        />
                      ) : (
                        <Icon
                          size={24}
                          className="text-white"
                          weight={isDone ? "fill" : "regular"}
                        />
                      )}
                    </div>
                    <div className="flex flex-col items-center">
                      <div
                        className={`font-bold ${
                          isFalseStatus
                            ? "text-orange-600"
                            : getTextColor(index)
                        }`}
                      >
                        {step.label}
                      </div>
                      <div className="text-gray-500 font-semibold text-xs text-center max-w-[120px]">
                        {getStatusDate(index)}
                      </div>
                    </div>
                  </div>

                  {!isFinalStatus &&
                    !isFalseStatus &&
                    index < steps.length - 1 && (
                      <div
                        className={`flex-1 h-[2px] mb-12 ${getLineColor(
                          index
                        )} transition-all duration-300`}
                      ></div>
                    )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modal xác nhận chuyển trạng thái */}
      <Modal
        open={isNextStatusModalOpen}
        onCancel={() => setIsNextStatusModalOpen(false)}
        footer={null}
        centered
        width={500}
      >
        <div className="p-2">
          <div className="text-xl font-bold text-[#E67E22] flex items-center gap-2 mb-2">
            {getNextStatusIcon()}
            Xác nhận chuyển trạng thái?
          </div>

          <p className="text-base">
            Bạn có chắc chắn muốn chuyển trạng thái đơn hàng từ{" "}
            <strong className="text-gray-700">"{nextStatusInfo.from}"</strong>{" "}
            sang{" "}
            <strong className="text-emerald-600">"{nextStatusInfo.to}"</strong>?
          </p>

          <ul className="mt-3 text-sm text-gray-600 list-disc pl-5 space-y-1">
            <li>
              Trạng thái sẽ thay đổi từ <strong>{nextStatusInfo.from}</strong> →{" "}
              <strong className="text-emerald-600">{nextStatusInfo.to}</strong>
            </li>
            <li>Thời gian cập nhật sẽ được ghi nhận ngay lập tức</li>
            <li>Sau khi chuyển trạng thái, đơn hàng không thể chỉnh sửa</li>
          </ul>

          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={() => setIsNextStatusModalOpen(false)}
              className="px-5 py-2 rounded-md border border-gray-300 hover:bg-gray-100 font-semibold"
            >
              Quay lại
            </button>

            <button
              onClick={confirmNextStatus}
              className="px-5 py-2 rounded-md bg-[#E67E22] text-white font-bold hover:bg-amber-600 shadow"
            >
              Xác nhận chuyển
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal xác nhận hủy đơn hàng */}
      <Modal
        open={isCancelModalOpen}
        onCancel={() => setIsCancelModalOpen(false)}
        footer={null}
        centered
        width={500}
      >
        <div className="p-2">
          <div className="text-xl font-bold text-red-600 flex items-center gap-2 mb-2">
            <XCircleIcon size={28} weight="fill" />
            Xác nhận hủy đơn hàng?
          </div>

          <p className="text-base">
            Bạn có chắc chắn muốn <strong>hủy đơn hàng</strong> này không?
          </p>

          <ul className="mt-3 text-sm text-gray-600 list-disc pl-5 space-y-1">
            <li>
              Đơn hàng sẽ chuyển sang trạng thái{" "}
              <strong className="text-red-600">ĐÃ HỦY</strong>
            </li>
            <li>Tất cả sản phẩm sẽ được hoàn lại tồn kho ngay lập tức</li>
            <li>
              Hành động này <strong>không thể hoàn tác</strong>
            </li>
          </ul>

          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={() => setIsCancelModalOpen(false)}
              className="px-5 py-2 rounded-md border border-gray-300 hover:bg-gray-100 font-semibold"
            >
              Quay lại
            </button>

            <button
              onClick={confirmCancelOrder}
              className="px-5 py-2 rounded-md bg-red-600 text-white font-bold hover:bg-red-700 shadow"
            >
              Hủy đơn hàng
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
