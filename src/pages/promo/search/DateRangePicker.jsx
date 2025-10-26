import React from "react";
import { Calendar } from "lucide-react";

const DateRangePicker = ({
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  className = "",
  disabled = false,
}) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative flex-1">
        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="date"
          value={dateFrom}
          onChange={onDateFromChange}
          disabled={disabled}
          className={`w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 ${
            disabled ? "bg-gray-100 cursor-not-allowed" : ""
          }`}
        />
      </div>
      <span className="text-gray-500 font-medium">đến</span>
      <div className="relative flex-1">
        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="date"
          value={dateTo}
          onChange={onDateToChange}
          disabled={disabled}
          className={`w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 ${
            disabled ? "bg-gray-100 cursor-not-allowed" : ""
          }`}
        />
      </div>
    </div>
  );
};

export default DateRangePicker;

