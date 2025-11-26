import React from "react";
import { Tabs } from "antd";

export default function InformationProduct() {
  const data = [
    { label: "Kích thước màn hình", value: "Màn hình 10.4 inch" },
    { label: "Màu sắc", value: "Xám, Xám đậm, Đen Mystic" },
    { label: "Độ phân giải màn hình", value: "1920 x 1200 Pixels" },
    { label: "Độ phân giải tối đa", value: "2000 x 1200" },
    { label: "Bộ vi xử lý", value: "2.3 GHz (128 GB)" },
    {
      label: "Chip đồ họa",
      value: "Exynos 9611, 8 nhân (4x2.3GHz + 4x1.7GHz)",
    },
    { label: "Loại kết nối không dây", value: "802.11a/b/g/n/ac, Bluetooth" },
    { label: "Thời lượng pin trung bình", value: "13 giờ" },
    { label: "Dòng sản phẩm", value: "Samsung Galaxy Tab S6 Lite WiFi" },
    { label: "Mã sản phẩm", value: "SM-P610ZAAEXOR" },
    { label: "Nền tảng phần cứng", value: "Android" },
    {
      label: "Kích thước sản phẩm",
      value: "0.28 x 6.07 x 9.63 inches",
    },
  ];

  return (
    <>
      <div className="border rounded-md overflow-hidden ">
        <table className="w-full border-collapse ">
          <tbody>
            {data.map((row, index) => (
              <tr key={index} className="border">
                <td className="border px-4 py-3 bg-gray-50 font-medium w-1/3">
                  {row.label}
                </td>
                <td className="border px-4 py-3">{row.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
