import { useEffect, useState } from "react";
import {
  phanTrang,
  updateTrangThai,
  searchPGG,
  searchTheoNgay,
} from "../../services/DiscountService";

export default function DiscountList({ onCreateNew, onView }) {
  const [discounts, setDiscounts] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [ngayBatDau, setNgayBatDau] = useState("");
  const [ngayKetThuc, setNgayKetThuc] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(5);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    getPhanTrang();
  }, [currentPage, pageSize]);

  const getPhanTrang = async (page = currentPage, size = pageSize) => {
    try {
      setLoading(true);
      const res = await phanTrang(page, size);
      if (res && res.data) {
        setDiscounts(res.data.data || []);
        setTotalPages(res.data.totalPage || 0);
        setTotalElements(res.data.totalElements || 0);
      } else {
        setDiscounts([]);
      }
    } catch (error) {
      console.error("Lỗi khi phân trang:", error);
      setDiscounts([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePageSizeChange = (e) => {
    const newSize = parseInt(e.target.value);
    setPageSize(newSize);
    setCurrentPage(0);
  };

  const handleSearch = async () => {
    if (searchKeyword.trim() === "") return getPhanTrang(0);
    try {
      setLoading(true);
      const res = await searchPGG(searchKeyword);
      if (res?.data) {
        setDiscounts(res.data);
        setTotalPages(1);
        setTotalElements(res.data.length);
      } else setDiscounts([]);
    } catch {
      alert("Không tìm thấy phiếu giảm giá!");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchByDate = async () => {
    try {
      setLoading(true);
      const res = await searchTheoNgay(ngayBatDau, ngayKetThuc);
      if (res?.data) {
        setDiscounts(res.data);
        setTotalPages(1);
        setTotalElements(res.data.length);
      } else setDiscounts([]);
    } catch {
      alert("Không tìm thấy phiếu trong khoảng ngày này!");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      setUpdatingId(id);
      const newStatus = !currentStatus;
      const res = await updateTrangThai(id, newStatus);

      if (res?.isSuccess) {
        setDiscounts((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, trangThai: newStatus } : item
          )
        );
        alert(
          `Đã ${newStatus ? "kích hoạt" : "dừng"} phiếu giảm giá thành công!`
        );
        await getPhanTrang();
      } else {
        alert("Cập nhật trạng thái thất bại!");
      }
    } catch (err) {
      console.error("Lỗi khi đổi trạng thái:", err);
      alert("Có lỗi xảy ra khi cập nhật trạng thái!");
    } finally {
      setUpdatingId(null);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 0 && newPage < totalPages) setCurrentPage(newPage);
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    if (totalPages === 0) return pages;
    let startPage = Math.max(0, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages - 1, startPage + maxVisiblePages - 1);
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(0, endPage - maxVisiblePages + 1);
    }
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  const formatDate = (d) => (d ? new Date(d).toLocaleDateString("vi-VN") : "");

  return (
    <div className="bg-white min-h-[500px]">
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div className="mb-4 lg:mb-0">
            <p className="text-[#E67E22] font-bold text-[30px] mb-4">
              Phiếu giảm giá
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex gap-2">
              <input
                placeholder="Tìm theo mã hoặc tên..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="flex-1 min-w-[250px] px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              />
              <button
                onClick={handleSearch}
                disabled={loading}
                className="px-6 py-2.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors duration-200 font-medium shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  "..."
                ) : (
                  <>
                    <span className="hidden sm:inline">Tìm kiếm</span>
                    <span className="sm:hidden">🔍</span>
                  </>
                )}
              </button>
            </div>
            <button
              onClick={onCreateNew}
              className="px-6 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-200 font-medium shadow-sm hover:shadow-md flex items-center gap-2"
            >
              <span>+</span>
              <span>Tạo mới</span>
            </button>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-2xl mb-8 border border-blue-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Lọc theo thời gian
          </h3>
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Từ ngày
                </label>
                <input
                  type="date"
                  value={ngayBatDau}
                  onChange={(e) => setNgayBatDau(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Đến ngày
                </label>
                <input
                  type="date"
                  value={ngayKetThuc}
                  onChange={(e) => setNgayKetThuc(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>
            <button
              onClick={handleSearchByDate}
              disabled={loading}
              className="px-6 py-2.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors duration-200 font-medium shadow-sm hover:shadow-md whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Đang tải..." : "Áp dụng bộ lọc"}
            </button>
          </div>
        </div>

        {loading && (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        )}

        {!loading && (
          <div className="rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      STT
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Mã
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Tên
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Kiểu
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Loại
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Số lượng
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Bắt đầu
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Kết thúc
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {discounts.map((d, i) => (
                    <tr
                      key={d.id}
                      className="hover:bg-gray-50 transition-colors duration-150 group"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {i + 1 + currentPage * pageSize}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-600">
                        {d.maGiamGia}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                        {d.tenChuongTrinh}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            d.kieu === 0
                              ? "bg-blue-100 text-blue-800"
                              : "bg-purple-100 text-purple-800"
                          }`}
                        >
                          {d.kieu === 0 ? "Công khai" : "Cá nhân"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {d.loaiGiamGia
                          ? `${d.giaTriGiamGia.toLocaleString()}đ`
                          : `${d.giaTriGiamGia}%`}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                        {d.soLuong.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatDate(d.ngayBatDau)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatDate(d.ngayKetThuc)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${
                            d.trangThai
                              ? "bg-green-100 text-green-800 border border-green-200"
                              : "bg-red-100 text-red-800 border border-red-200"
                          }`}
                        >
                          {d.trangThai ? (
                            <>
                              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                              Đang diễn ra
                            </>
                          ) : (
                            <>
                              <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                              Đã kết thúc
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => onView(d.id)}
                            className="inline-flex items-center px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors duration-200 text-sm font-medium"
                          >
                            👁️ Xem
                          </button>

                          <div className="flex items-center gap-2">
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={d.trangThai}
                                onChange={() =>
                                  handleToggleStatus(d.id, d.trangThai)
                                }
                                disabled={updatingId === d.id}
                                className="sr-only peer"
                              />
                              <div
                                className={`w-12 h-6 rounded-full transition-all duration-300 ${
                                  d.trangThai
                                    ? "bg-green-500 peer-checked:bg-green-600"
                                    : "bg-red-500 peer-checked:bg-red-600"
                                } ${
                                  updatingId === d.id
                                    ? "opacity-50 cursor-not-allowed"
                                    : ""
                                }`}
                              >
                                <div
                                  className={`absolute top-0.5 left-0.5 bg-white rounded-full h-5 w-5 transition-transform duration-300 ${
                                    d.trangThai ? "transform translate-x-6" : ""
                                  }`}
                                ></div>
                              </div>
                            </label>
                            <span
                              className={`text-xs font-medium ${
                                updatingId === d.id
                                  ? "text-gray-400"
                                  : "text-gray-600"
                              }`}
                            >
                              {updatingId === d.id
                                ? "..."
                                : d.trangThai
                                ? "ON"
                                : "OFF"}
                            </span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {discounts.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">📋</div>
                <h3 className="text-lg font-semibold text-gray-500 mb-2">
                  Không có dữ liệu
                </h3>
                <p className="text-gray-400">
                  Không tìm thấy phiếu giảm giá nào phù hợp
                </p>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 mt-8 p-6 bg-white rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">
                Hiển thị:
              </span>
              <select
                value={pageSize}
                onChange={handlePageSizeChange}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(0)}
              disabled={currentPage === 0}
              className={`p-2 rounded-lg transition-all duration-200 ${
                currentPage === 0
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-800"
              }`}
              title="Trang đầu"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
                />
              </svg>
            </button>

            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 0}
              className={`p-2 rounded-lg transition-all duration-200 ${
                currentPage === 0
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-800"
              }`}
              title="Trang trước"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>

            <div className="flex items-center gap-1">
              {getPageNumbers().map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`min-w-[40px] h-10 rounded-lg transition-all duration-200 font-medium ${
                    currentPage === page
                      ? "bg-blue-500 text-white shadow-md"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {page + 1}
                </button>
              ))}
            </div>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages - 1}
              className={`p-2 rounded-lg transition-all duration-200 ${
                currentPage >= totalPages - 1
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-800"
              }`}
              title="Trang sau"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>

            <button
              onClick={() => handlePageChange(totalPages - 1)}
              disabled={currentPage >= totalPages - 1}
              className={`p-2 rounded-lg transition-all duration-200 ${
                currentPage >= totalPages - 1
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-800"
              }`}
              title="Trang cuối"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 5l7 7-7 7M5 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>

          <div className="text-sm text-gray-600">
            Trang{" "}
            <span className="font-semibold text-gray-800">
              {currentPage + 1}
            </span>{" "}
            /{" "}
            <span className="font-semibold text-gray-800">
              {totalPages || 1}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
