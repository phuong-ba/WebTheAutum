import React from "react";

const RangeSlider = ({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  unit = "",
  formatValue = (val) => val,
  className = "",
  disabled = false,
  showLabels = true,
  showInputs = false,
}) => {
  const handleMinChange = (e) => {
    const newMin = Number(e.target.value);
    if (newMin <= value[1]) {
      onChange([newMin, value[1]]);
    }
  };

  const handleMaxChange = (e) => {
    const newMax = Number(e.target.value);
    if (newMax >= value[0]) {
      onChange([value[0], newMax]);
    }
  };

  const handleInputChange = (index, inputValue) => {
    const numValue = Number(inputValue);
    if (isNaN(numValue)) return;

    if (index === 0) {
      // Min input
      if (numValue <= value[1] && numValue >= min) {
        onChange([numValue, value[1]]);
      }
    } else {
      // Max input
      if (numValue >= value[0] && numValue <= max) {
        onChange([value[0], numValue]);
      }
    }
  };

  // Tính phần trăm cho styling
  const minPercent = ((value[0] - min) / (max - min)) * 100;
  const maxPercent = ((value[1] - min) / (max - min)) * 100;

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Input fields (optional) */}
      {showInputs && (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Từ:</label>
            <input
              type="number"
              value={value[0]}
              onChange={(e) => handleInputChange(0, e.target.value)}
              min={min}
              max={max}
              step={step}
              disabled={disabled}
              className="w-20 px-2 py-1 text-sm border border-gray-200 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <span className="text-gray-400">-</span>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Đến:</label>
            <input
              type="number"
              value={value[1]}
              onChange={(e) => handleInputChange(1, e.target.value)}
              min={min}
              max={max}
              step={step}
              disabled={disabled}
              className="w-20 px-2 py-1 text-sm border border-gray-200 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          {unit && <span className="text-sm text-gray-600">{unit}</span>}
        </div>
      )}

      {/* Range slider container */}
      <div className="relative">
        {/* Track */}
        <div className="relative h-2 bg-gray-200 rounded-lg">
          {/* Active range */}
          <div
            className="absolute h-2 bg-green-500 rounded-lg"
            style={{
              left: `${minPercent}%`,
              width: `${maxPercent - minPercent}%`,
            }}
          />
        </div>

        {/* Min handle */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value[0]}
          onChange={handleMinChange}
          disabled={disabled}
          className={`absolute top-0 w-full h-2 bg-transparent appearance-none cursor-pointer slider ${
            disabled ? "opacity-50 cursor-not-allowed" : ""
          }`}
          style={{ zIndex: value[0] > value[1] - (max - min) / 100 ? 5 : 3 }}
        />

        {/* Max handle */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value[1]}
          onChange={handleMaxChange}
          disabled={disabled}
          className={`absolute top-0 w-full h-2 bg-transparent appearance-none cursor-pointer slider ${
            disabled ? "opacity-50 cursor-not-allowed" : ""
          }`}
          style={{ zIndex: 4 }}
        />
      </div>

      {/* Value labels */}
      {showLabels && (
        <div className="flex justify-between text-xs text-gray-500">
          <span>
            {formatValue(min)}
            {unit}
          </span>
          <span>
            {formatValue(max)}
            {unit}
          </span>
        </div>
      )}
    </div>
  );
};

export default RangeSlider;
