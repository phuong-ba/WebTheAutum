import {
  CheckCircleIcon,
  ClockCountdownIcon,
  HourglassMediumIcon,
  PackageIcon,
  TruckIcon,
} from "@phosphor-icons/react";
import { Select } from "antd";
import React, { useState } from "react";

export default function BillInvoiceStatus() {
  const steps = [
    { label: "Chờ xác nhận", icon: HourglassMediumIcon },
    { label: "Chờ giao hàng", icon: PackageIcon },
    { label: "Đang giao", icon: TruckIcon },
    { label: "Hoàn thành", icon: CheckCircleIcon },
  ];

  const [statusStep, setStatusStep] = useState(0);

  const handleNextStatus = () => {
    setStatusStep((prev) =>
      prev < steps.length - 1 ? prev + 1 : steps.length - 1
    );
  };

  const handleSelectChange = (value) => {
    const newIndex = parseInt(value, 10);
    setStatusStep(newIndex);
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
            <div className="flex gap-4 items-center">
              <Select
                value={statusStep.toString()}
                className="min-w-[160px]"
                onChange={handleSelectChange}
              >
                {steps.map((step, index) => (
                  <Option key={index} value={index.toString()}>
                    {step.label}
                  </Option>
                ))}
              </Select>

              <div
                onClick={handleNextStatus}
                className="font-bold text-sm py-2 px-4 min-w-[120px] cursor-pointer select-none text-center rounded-md bg-[#E67E22] text-white hover:bg-amber-600 active:bg-cyan-800 shadow"
              >
                Chuyển trạng thái
              </div>
            </div>
          </div>

          <div className="px-5 py-10 flex justify-between items-center">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isCurrent = index === statusStep;
              const isNext = index === statusStep + 1;
              const isDone = index <= statusStep;
              const isFinal = statusStep === steps.length - 1;

              let circleColor = "bg-gray-600";
              if (isFinal) circleColor = "bg-emerald-500";
              else if (isCurrent || index < statusStep)
                circleColor = "bg-emerald-500";
              else if (isNext) circleColor = "bg-amber-500";

              let lineColor = "bg-gray-600";
              if (isFinal) lineColor = "bg-emerald-500";
              else if (index <= statusStep - 1) lineColor = "bg-emerald-500";
              else if (index === statusStep) lineColor = "bg-amber-500";

              return (
                <React.Fragment key={index}>
                  <div className="flex flex-col items-center gap-2">
                    <div
                      className={`${circleColor} rounded-full p-3 transition-colors duration-300`}
                    >
                      <Icon size={24} className="text-white" weight="fill" />
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="font-bold">{step.label}</div>
                      <div className="text-gray-500 font-semibold text-xs">
                        21:33:28 28-09-2025
                      </div>
                    </div>
                  </div>

                  {index < steps.length - 1 && (
                    <div
                      className={`flex-1 h-[2px] mb-12 ${lineColor} transition-all duration-300`}
                    ></div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
