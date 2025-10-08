import { useEffect, useState } from "react";
import {
  addPGG,
  getPhieuGiamGiaById,
  updatePGG,
  getAllKhachHang,
  getKhachHangIdsByPGGId,
} from "../../services/DiscountService";

export default function DiscountForm({ discountId, onCancel, onSave }) {
  const [formData, setFormData] = useState({
    maGiamGia: "",
    tenChuongTrinh: "",
    kieu: 0,
    loaiGiamGia: true,
    giaTriGiamGia: 0,
    mucGiaGiamToiDa: 0,
    giaTriDonHangToiThieu: 0,
    moTa: "",
    soLuong: 0,
    ngayTao: "",
    ngayBatDau: "",
    ngayKetThuc: "",
    idKhachHangs: [],
  });
  const [khachHangs, setKhachHangs] = useState([]);

  useEffect(() => {
    fetchKhachHangs();
    if (discountId) {
      loadDiscountData();
    }
  }, [discountId]);

  const fetchKhachHangs = async () => {
    try {
      const data = await getAllKhachHang();
      setKhachHangs(data);
    } catch (error) {
      console.error("Lỗi khi lấy khách hàng:", error);
    }
  };

  const loadDiscountData = async () => {
    try {
      const data = await getPhieuGiamGiaById(discountId);
      let khachHangIds = [];
      if (data.kieu === 1) {
        const khachHangIdsData = await getKhachHangIdsByPGGId(discountId);
        khachHangIds = khachHangIdsData.map((id) => id.toString());
      }
      setFormData({
        ...data,
        kieu: Number(data.kieu),
        loaiGiamGia: Boolean(data.loaiGiamGia),
        ngayBatDau: formatDateTimeLocal(data.ngayBatDau),
        ngayKetThuc: formatDateTimeLocal(data.ngayKetThuc),
        idKhachHangs: khachHangIds,
      });
    } catch (error) {
      console.error("Lỗi khi xem chi tiết:", error);
      alert("Lỗi khi xem chi tiết: " + error.message);
    }
  };

  const formatDateTimeLocal = (dateStr) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 16);
    } catch {
      return "";
    }
  };

  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? "" : d.toLocaleDateString("vi-VN");
    } catch {
      return "";
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (
      name === "giaTriGiamGia" &&
      formData.loaiGiamGia === false &&
      Number(value) > 100
    ) {
      alert("Giá trị giảm không được vượt quá 100%");
      return;
    }

    setFormData({ ...formData, [name]: value });
  };

  const handleKieuChange = (value) => {
    const newKieu = Number(value);
    setFormData({
      ...formData,
      kieu: newKieu,
      ...(newKieu === 0 && { idKhachHangs: [] }),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        ...formData,
        idKhachHangs:
          formData.kieu === 1
            ? formData.idKhachHangs.map((id) => Number(id))
            : [],
        giaTriGiamGia: Number(formData.giaTriGiamGia),
        mucGiaGiamToiDa: Number(formData.mucGiaGiamToiDa),
        giaTriDonHangToiThieu: Number(formData.giaTriDonHangToiThieu),
        soLuong: Number(formData.soLuong),
        kieu: Number(formData.kieu),
        loaiGiamGia:
          formData.loaiGiamGia === "true" || formData.loaiGiamGia === true,
      };

      if (discountId) {
        await updatePGG(submitData, discountId);
        alert("Cập nhật thành công!");
      } else {
        await addPGG(submitData);
        alert("Thêm mới thành công!");
      }

      onSave();
    } catch (error) {
      console.error("Lỗi khi lưu:", error);
      alert("Lỗi khi lưu: " + error.message);
    }
  };

  const handleKhachHangSelect = (khachHangId) => {
    if (formData.kieu !== 1) return;

    const isSelected = formData.idKhachHangs.includes(khachHangId.toString());
    let newSelected;
    if (isSelected) {
      newSelected = formData.idKhachHangs.filter(
        (id) => id !== khachHangId.toString()
      );
    } else {
      newSelected = [...formData.idKhachHangs, khachHangId.toString()];
    }
    setFormData({ ...formData, idKhachHangs: newSelected });
  };

  const handleSelectAllKhachHang = (e) => {
    if (formData.kieu !== 1) return;

    if (e.target.checked) {
      const allIds = khachHangs.map((kh) => kh.id.toString());
      setFormData({ ...formData, idKhachHangs: allIds });
    } else {
      setFormData({ ...formData, idKhachHangs: [] });
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg">
      <div className="mb-6">
        <h4 className="text-xl font-semibold text-gray-800">
          Tạo phiếu giảm giá
        </h4>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block mb-2 font-semibold text-gray-700">
                  Mã phiếu giảm giá
                </label>
                <input
                  type="text"
                  name="maGiamGia"
                  value={formData.maGiamGia}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block mb-2 font-semibold text-gray-700">
                  Tên phiếu giảm giá
                </label>
                <input
                  type="text"
                  name="tenChuongTrinh"
                  value={formData.tenChuongTrinh}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div className="border-t border-gray-300 my-4"></div>

            <div>
              <h5 className="mb-4 text-lg font-semibold text-gray-800">
                Giá trị
              </h5>

              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      name="giaTriGiamGia"
                      value={formData.giaTriGiamGia}
                      onChange={handleChange}
                      className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="0"
                      max={formData.loaiGiamGia === false ? "100" : undefined}
                      required
                    />

                    <select
                      name="loaiGiamGia"
                      value={formData.loaiGiamGia}
                      onChange={handleChange}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="false">%</option>
                      <option value="true">Tiền mặt</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-gray-700 font-medium">Số lượng</span>
                    <input
                      type="number"
                      name="soLuong"
                      value={formData.soLuong}
                      onChange={handleChange}
                      className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="0"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-700 w-32">Mức giảm tối đa</span>
                    <input
                      type="number"
                      name="mucGiaGiamToiDa"
                      value={formData.mucGiaGiamToiDa}
                      onChange={handleChange}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="0"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-gray-700 w-32">
                      Đơn hàng tối thiểu
                    </span>
                    <input
                      type="number"
                      name="giaTriDonHangToiThieu"
                      value={formData.giaTriDonHangToiThieu}
                      onChange={handleChange}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="0"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-300 my-4"></div>

            <div className="space-y-4">
              <div>
                <label className="block mb-2 font-semibold text-gray-700">
                  Từ ngày
                </label>
                <input
                  type="datetime-local"
                  name="ngayBatDau"
                  value={formData.ngayBatDau}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block mb-2 font-semibold text-gray-700">
                  Đến ngày
                </label>
                <input
                  type="datetime-local"
                  name="ngayKetThuc"
                  value={formData.ngayKetThuc}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
            <div className="border-t border-gray-300 my-4"></div>
            <div>
              <label className="block mb-3 font-semibold text-gray-700">
                Kiểu
              </label>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="kieu"
                    value="0"
                    checked={formData.kieu == 0}
                    onChange={(e) => handleKieuChange(e.target.value)}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="text-gray-700">Công khai</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="kieu"
                    value="1"
                    checked={formData.kieu == 1}
                    onChange={(e) => handleKieuChange(e.target.value)}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="text-gray-700">Cá nhân</span>
                </label>
              </div>
            </div>
          </div>

          <div>
            <div className="bg-white p-4 rounded-lg border border-gray-200 h-full">
              <h5 className="mb-4 text-lg font-semibold text-gray-800">
                Tìm kiếm khách hàng
              </h5>

              <div
                className={`border border-gray-300 rounded-lg overflow-hidden ${
                  formData.kieu !== 1 ? "opacity-50 pointer-events-none" : ""
                }`}
              >
                <div className="overflow-x-auto max-h-96">
                  <table className="min-w-full border-collapse">
                    <thead className="sticky top-0 bg-gray-100">
                      <tr>
                        <th className="p-3 border border-gray-300 text-center w-12">
                          <input
                            type="checkbox"
                            onChange={handleSelectAllKhachHang}
                            checked={
                              formData.idKhachHangs.length ===
                                khachHangs.length && khachHangs.length > 0
                            }
                            disabled={formData.kieu !== 1}
                            className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        </th>
                        <th className="p-3 border border-gray-300 font-semibold text-gray-700 text-left">
                          Tên
                        </th>
                        <th className="p-3 border border-gray-300 font-semibold text-gray-700 text-left">
                          Số điện thoại
                        </th>
                        <th className="p-3 border border-gray-300 font-semibold text-gray-700 text-left">
                          Email
                        </th>
                        <th className="p-3 border border-gray-300 font-semibold text-gray-700 text-left">
                          Ngày sinh
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {khachHangs.map((kh, index) => (
                        <tr
                          key={kh.id}
                          className={
                            index % 2 === 0 ? "bg-white" : "bg-gray-50"
                          }
                        >
                          <td className="p-3 border border-gray-300 text-center">
                            <input
                              type="checkbox"
                              checked={formData.idKhachHangs.includes(
                                kh.id.toString()
                              )}
                              onChange={() => handleKhachHangSelect(kh.id)}
                              disabled={formData.kieu !== 1}
                              className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                          </td>
                          <td className="p-3 border border-gray-300 text-gray-600">
                            {kh.hoTen}
                          </td>
                          <td className="p-3 border border-gray-300 text-gray-600">
                            {kh.soDienThoai}
                          </td>
                          <td className="p-3 border border-gray-300 text-gray-600">
                            {kh.email}
                          </td>
                          <td className="p-3 border border-gray-300 text-gray-600">
                            {kh.ngaySinh ? formatDisplayDate(kh.ngaySinh) : ""}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-8 pt-6 border-t border-gray-200">
          <button
            type="submit"
            className="px-6 py-2.5 bg-green-500 text-white font-medium rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
          >
            {discountId ? "Cập nhật" : "Lưu"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2.5 bg-gray-500 text-white font-medium rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
          >
            Hủy
          </button>
        </div>
      </form>
    </div>
  );
}
