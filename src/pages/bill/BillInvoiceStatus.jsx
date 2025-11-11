import {
  CheckCircleIcon,
  ClockCountdownIcon,
  HourglassMediumIcon,
  PackageIcon,
  TruckIcon,
} from "@phosphor-icons/react";
import { Select } from "antd";
import React, { useState, useEffect } from "react";

const { Option } = Select;

export default function BillInvoiceStatus({ 
  currentStatus, 
  invoiceData,
  isEditing,
  onTempStatusChange
}) {
  const steps = [
    { label: "Chờ xác nhận", value: 0, icon: HourglassMediumIcon },
    { label: "Chờ giao hàng", value: 1, icon: PackageIcon },
    { label: "Đang giao hàng", value: 2, icon: TruckIcon },
    { label: "Đã hoàn thành", value: 3, icon: CheckCircleIcon },
    { label: "Đã hủy", value: 4, icon: CheckCircleIcon },
  ];

  const [statusStep, setStatusStep] = useState(currentStatus || 0);
  const [originalStatus, setOriginalStatus] = useState(currentStatus || 0); 
  const [statusHistory, setStatusHistory] = useState({});

  useEffect(() => {
    if (currentStatus !== undefined) {
      setStatusStep(currentStatus);
      setOriginalStatus(currentStatus); 
    }
  }, [currentStatus]);

  useEffect(() => {
    if (invoiceData) {
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

  useEffect(() => {
    if (isEditing) {
      setOriginalStatus(statusStep);
    } else {
      setStatusStep(originalStatus);
    }
  }, [isEditing]);

  const handleSelectChange = (value) => {
    if (!isEditing) return;
    
    const newStatus = parseInt(value, 10);
    setStatusStep(newStatus);
    
    if (onTempStatusChange) {
      onTempStatusChange(newStatus);
    }
  };

  const getStatusColor = (index) => {
    if (index < statusStep) return "bg-emerald-500"; 
    if (index === statusStep) return "bg-emerald-500";
    if (index === statusStep + 1) return "bg-amber-500";
    return "bg-gray-400"; 
  };

  const getLineColor = (index) => {
    if (index < statusStep) return "bg-emerald-500"; 
    if (index === statusStep) return "bg-amber-500";
    return "bg-gray-400"; 
  };

  const getTextColor = (index) => {
    if (index <= statusStep) return 'text-emerald-600';
    if (index === statusStep + 1) return 'text-amber-600'; 
    return 'text-gray-500'; 
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    
    try {
      if (typeof dateString === 'string') {
        const date = new Date(dateString);
        return date.toLocaleString('vi-VN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
      return "";
    } catch (error) {
      return "";
    }
  };

  const getStatusDate = (stepIndex) => {
    return statusHistory[stepIndex] ? formatDate(statusHistory[stepIndex]) : "";
  };

  const isFinalStatus = statusStep === 3 || statusStep === 4;

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
              <Select
                value={statusStep.toString()}
                className="min-w-[160px]"
                onChange={handleSelectChange}
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

        <div className={`px-5 py-10 ${isFinalStatus ? 'flex justify-center' : 'flex justify-between items-center'}`}>
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isCurrent = index === statusStep; 
            const isDone = index <= statusStep;

            if (isFinalStatus && index !== statusStep) {
              return null;
            }

            return (
              <React.Fragment key={index}>
                <div className="flex flex-col items-center gap-2">
                  <div
                    className={`${getStatusColor(index)} rounded-full p-3 transition-colors duration-300`}
                  >
                    <Icon 
                      size={24} 
                      className="text-white" 
                      weight={isDone ? "fill" : "regular"}
                    />
                  </div>
                  <div className="flex flex-col items-center">
                    <div className={`font-bold ${getTextColor(index)}`}>
                      {step.label}
                    </div>
                    <div className="text-gray-500 font-semibold text-xs text-center max-w-[120px]">
                      {getStatusDate(index)}
                    </div>
                  </div>
                </div>

                {!isFinalStatus && index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-[2px] mb-12 ${getLineColor(index)} transition-all duration-300`}
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