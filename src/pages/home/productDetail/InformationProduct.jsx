import React from "react";

export default function InformationProduct({ detail }) {
  if (!detail) return null;

  // Chỉ lấy đúng các trường yêu cầu
  const data = [
    { label: "Mã kích thước", value: detail.maKichThuoc },
    { label: "Mã màu sắc", value: detail.maMauSac },
    { label: "Mã vạch", value: detail.maVach },
    { label: "Mô tả", value: detail.moTa },
    { label: "Số lượng tồn", value: detail.soLuongTon },
    { label: "Kích thước", value: detail.tenKichThuoc },
    { label: "Màu sắc", value: detail.tenMauSac },
    { label: "Tên sản phẩm", value: detail.tenSanPham },
    { label: "Trọng lượng", value: detail.tenTrongLuong },
  ].filter((item) => item.value !== undefined && item.value !== null);

  return (
    <div className="border rounded-md overflow-hidden">
      <table className="w-full border-collapse">
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
  );
}
