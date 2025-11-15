import {
  CheckCircleIcon,
  ClockCountdownIcon,
  HourglassMediumIcon,
  PackageIcon,
  TruckIcon,
  XCircleIcon,
} from "@phosphor-icons/react";
import { Select, message } from "antd";
import React, { useState, useEffect } from "react";

const { Option } = Select;

export default function BillInvoiceStatus({
  currentStatus,
  invoiceData,
  isEditing,
  tempStatus,
  tempLoaiHoaDon,
  onTempStatusChange,
  onLoaiHoaDonChange,
}) {
  const steps = [
    { label: "Chờ xác nhận", value: 0, icon: HourglassMediumIcon },
    { label: "Chờ giao hàng", value: 1, icon: PackageIcon },
    { label: "Đang giao hàng", value: 2, icon: TruckIcon },
    { label: "Đã hoàn thành", value: 3, icon: CheckCircleIcon },
    { label: "Đã hủy", value: 4, icon: XCircleIcon },
  ];

  const [statusStep, setStatusStep] = useState(currentStatus || 0);
  const [originalStatus, setOriginalStatus] = useState(currentStatus || 0);
  const [statusHistory, setStatusHistory] = useState({});
  const [currentLoaiHoaDon, setCurrentLoaiHoaDon] = useState(
    tempLoaiHoaDon || false
  );

  // Sync currentStatus
  useEffect(() => {
    if (currentStatus !== undefined) {
      setStatusStep(currentStatus);
      setOriginalStatus(currentStatus);
    }
  }, [currentStatus]);

  // Sync tempLoaiHoaDon
  useEffect(() => {
    if (tempLoaiHoaDon !== undefined) {
      setCurrentLoaiHoaDon(tempLoaiHoaDon);
    }
  }, [tempLoaiHoaDon]);

  // Load invoiceData history
  useEffect(() => {
    if (!invoiceData) return;

    // Kiểm tra localStorage trước
    const storedHistory = localStorage.getItem(
      `invoice_${invoiceData.id}_statusHistory`
    );

    if (storedHistory) {
      setStatusHistory(JSON.parse(storedHistory));
    } else {
      const history = {
        0: invoiceData.ngayTao,
        1: invoiceData.ngayXacNhan,
        2: invoiceData.ngayGiaoHang,
        3: invoiceData.ngayHoanThanh,
        4: invoiceData.ngayHuy,
      };
      setStatusHistory(history);
    }
  }, [invoiceData]);

  // Lưu statusHistory khi chỉnh sửa
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
    localStorage.setItem(
      `invoice_${invoiceData?.id || "temp"}_statusHistory`,
      JSON.stringify(newHistory)
    );
  }, [statusStep, isEditing]);

  // Khi tắt chế độ edit, load lại từ localStorage
  useEffect(() => {
    if (isEditing) return;

    const storedHistory = localStorage.getItem(
      `invoice_${invoiceData?.id || "temp"}_statusHistory`
    );
    if (storedHistory) {
      setStatusHistory(JSON.parse(storedHistory));
    }

    setStatusStep(originalStatus);
  }, [isEditing]);

  const handleStatusChange = (value) => {
    if (!isEditing) return;
    const newStatus = parseInt(value, 10);
    setStatusStep(newStatus);
    onTempStatusChange && onTempStatusChange(newStatus);
  };

  const handleLoaiHoaDonChange = (value) => {
    if (!isEditing) return;

    const newLoaiHoaDon = value === "true";
    let newStatus = tempStatus;

    if (newLoaiHoaDon) {
      newStatus = 3;
      message.info(
        "Đã chuyển sang loại Tại quầy - Trạng thái mặc định: Đã hoàn thành"
      );
    } else {
      newStatus = 1;
      message.info(
        "Đã chuyển sang loại Online - Trạng thái mặc định: Chờ giao hàng"
      );
    }

    setStatusStep(newStatus);
    setCurrentLoaiHoaDon(newLoaiHoaDon);

    onLoaiHoaDonChange && onLoaiHoaDonChange(newLoaiHoaDon);
    onTempStatusChange && onTempStatusChange(newStatus);
  };

  const getStatusColor = (index) => {
    if (index <= statusStep) return "bg-emerald-500";
    if (index === statusStep + 1) return "bg-amber-500";
    return "bg-gray-400";
  };

  const getLineColor = (index) => {
    if (index < statusStep) return "bg-emerald-500";
    if (index === statusStep) return "bg-amber-500";
    return "bg-gray-400";
  };

  const getTextColor = (index) => {
    if (index <= statusStep) return "text-emerald-600";
    if (index === statusStep + 1) return "text-amber-600";
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

  return (
    <div className="bg-white flex flex-col gap-3 rounded-lg shadow overflow-hidden mb-5">
      <div>
        <div className="flex justify-between items-center p-4 bg-gray-200">
          <div className="text-lg font-bold flex gap-2 items-center">
            <ClockCountdownIcon size={24} />
            Trạng thái hóa đơn
          </div>

          {isEditing && (
            <div className="flex gap-4 items-center">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Loại hóa đơn:</span>
                <Select
                  value={currentLoaiHoaDon?.toString() || "false"}
                  className="min-w-[140px]"
                  onChange={handleLoaiHoaDonChange}
                >
                  <Option value="false">Online</Option>
                  <Option value="true">Tại quầy</Option>
                </Select>
              </div>

              <Select
                value={statusStep?.toString() || "0"}
                className="min-w-[160px]"
                onChange={handleStatusChange}
              >
                {steps.map((step, index) => (
                  <Option key={index} value={step.value.toString()}>
                    {step.label}
                  </Option>
                ))}
              </Select>
            </div>
          )}
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
                        isFalseStatus ? "text-orange-600" : getTextColor(index)
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
  );
}
