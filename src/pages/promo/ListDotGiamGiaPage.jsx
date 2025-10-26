import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import {
  Edit,
  Trash2,
  Search,
  Filter,
  Calendar,
  Download,
  Plus,
  RotateCcw,
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import useSearchFilter from "../../hooks/useSearchFilter";
import { getAllDotGiamGia, deleteDotGiamGia } from "../../api/dotGiamGia";
import { AdvancedSearch } from "./search";

export default function ListDotGiamGiaPage() {
  const [dotList, setDotList] = useState([]);
  const [filteredList, setFilteredList] = useState([]);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [show, setShow] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const navigate = useNavigate();

  const exportToExcel = () => {
    if (filteredList.length === 0) return;

    const data = filteredList.map((d, i) => ({
      STT: i + 1,
      "Mã đợt": d.maGiamGia,
      "Tên đợt": d.tenDot,
      "Loại giảm": d.loaiGiamGia === false ? "Phần trăm" : "Số tiền cố định",
      "Giá trị giảm":
        d.loaiGiamGia === false
          ? `${d.giaTriGiam}%`
          : `${Number(d.giaTriGiam).toLocaleString()} VNĐ`,
      "Điều kiện":
        d.loaiGiamGia === false
          ? `Giảm tối đa: ${Number(d.giaTriToiThieu).toLocaleString()} VNĐ`
          : `Đơn tối thiểu: ${Number(d.giaTriToiThieu).toLocaleString()} VNĐ`,
      "Ngày bắt đầu": formatDate(d.ngayBatDau),
      "Ngày kết thúc": formatDate(d.ngayKetThuc),
      "Trạng thái": getDiscountStatus(d.ngayBatDau, d.ngayKetThuc),
    }));

    // Tạo workbook và worksheet
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "DanhSachDotGiamGia");

    // Chuyển sang file Excel và lưu
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const blob = new Blob([excelBuffer], {
      type: "application/octet-stream",
    });
    saveAs(blob, "DanhSachDotGiamGia.xlsx");
  };

  // Sử dụng hook tìm kiếm mới
  const {
    filters,
    setSearchTerm,
    setDateFrom,
    setDateTo,
    setSelectedOption,
    setRangeValue,
    resetFilters,
    removeFilter,
    getActiveFilters,
  } = useSearchFilter({
    searchTerm: "",
    dateFrom: "",
    dateTo: "",
    selectedOption: "Tất cả",
    rangeValue: [0, 100], // Giá trị giảm từ 0% đến 100%
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const totalPages = Math.ceil(filteredList.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredList.slice(startIndex, endIndex);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (message || errorMessage) {
      setShow(true);
      const timer = setTimeout(() => {
        setShow(false);
        setTimeout(() => {
          setMessage("");
          setErrorMessage("");
        }, 500);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message, errorMessage]);

  const fetchData = async () => {
    try {
      const res = await getAllDotGiamGia();

      setDotList(res.data);
      setFilteredList(res.data);
    } catch (err) {
      setErrorMessage("Không thể tải danh sách!");
    }
  };
  useEffect(() => {
    let filtered = dotList.filter((d) => {
      const matchSearch =
        d.maGiamGia?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        d.tenDot?.toLowerCase().includes(filters.searchTerm.toLowerCase());

      // Lấy ngày hiện tại (loại bỏ giờ phút giây)
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const ngayKetThuc = new Date(d.ngayKetThuc);
      ngayKetThuc.setHours(0, 0, 0, 0);

      // Nếu quá ngày kết thúc thì coi như đã kết thúc (trangThai = false)
      const isEnded = ngayKetThuc < today;
      const trangThaiThucTe = isEnded ? false : d.trangThai;

      const matchTrangThai =
        filters.selectedOption === "Tất cả" ||
        (filters.selectedOption === "Đang/Sắp diễn ra" &&
          trangThaiThucTe === true) ||
        (filters.selectedOption === "Đã kết thúc" && trangThaiThucTe === false);

      const matchDate = (() => {
        if (!filters.dateFrom && !filters.dateTo) return true;

        const start = new Date(d.ngayBatDau);
        const end = new Date(d.ngayKetThuc);
        const from = filters.dateFrom ? new Date(filters.dateFrom) : null;
        const to = filters.dateTo ? new Date(filters.dateTo) : null;

        // Kiểm tra giao nhau giữa 2 khoảng thời gian
        if (from && to) {
          return start <= to && end >= from;
        } else if (from) {
          return end >= from;
        } else if (to) {
          return start <= to;
        }
        return true;
      })();

      const matchDiscount =
        d.loaiGiamGia === false // phần trăm
          ? Number(d.giaTriGiam) >= filters.rangeValue[0] &&
            Number(d.giaTriGiam) <= filters.rangeValue[1]
          : true;
      return matchSearch && matchTrangThai && matchDate && matchDiscount;
    });

    setFilteredList(filtered);
  }, [dotList, filters]);

  const handleDeleteClick = (id) => {
    setDeleteId(id);
    setShowConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      await deleteDotGiamGia(deleteId);
      setMessage("Xóa thành công!");
      fetchData();
    } catch (err) {
      setErrorMessage("Lỗi khi xóa!");
    } finally {
      setShowConfirm(false);
      setDeleteId(null);
    }
  };

  // Tùy chọn cho dropdown
  const statusOptions = [
    { value: "Tất cả", label: "Tất cả trạng thái" },
    { value: "Đang/Sắp diễn ra", label: "Đang/Sắp diễn ra" },
    { value: "Đã kết thúc", label: "Đã kết thúc" },
  ];

  // Function để format ngày tháng
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  // Function để lấy trạng thái đợt giảm giá
  const getDiscountStatus = (ngayBatDau, ngayKetThuc) => {
    // Lấy ngày hiện tại (loại bỏ giờ phút giây)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const start = new Date(ngayBatDau);
    start.setHours(0, 0, 0, 0);

    const end = new Date(ngayKetThuc);
    end.setHours(0, 0, 0, 0);

    if (today < start) {
      return "Sắp diễn ra";
    } else if (today >= start && today <= end) {
      return "Đang diễn ra";
    } else {
      return "Đã kết thúc";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* --- Thông báo --- */}
      {(message || errorMessage) && (
        <div className="fixed top-5 right-5 z-50 w-80">
          <div
            className={`transition-opacity duration-500 ${
              show ? "opacity-100" : "opacity-0"
            }`}
          >
            <div
              className={`${
                message ? "bg-green-600" : "bg-red-600"
              } text-white px-4 py-2 rounded-lg shadow-lg relative overflow-hidden`}
            >
              <div>{message || errorMessage}</div>
              <div className="absolute bottom-0 left-0 h-1 bg-white animate-progress" />
            </div>
          </div>
        </div>
      )}

      {/* --- Popup xác nhận --- */}
      {showConfirm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50">
          <div
            className="bg-white rounded-xl p-6 w-96 shadow-lg text-center animate-fadeScale"
            style={{ animation: "fadeScale 0.25s ease-out" }}
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Xác nhận
            </h3>
            <p className="text-gray-600 mb-6 text-sm">
              Bạn có chắc chắn muốn xóa đợt giảm giá này không?
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setShowConfirm(false)}
                className="bg-gray-200 text-gray-800 px-5 py-2 rounded-md hover:bg-gray-300 transition"
              >
                Hủy
              </button>
              <button
                onClick={confirmDelete}
                className="bg-orange-400 text-white px-5 py-2 rounded-md hover:bg-orange-700 transition"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="bg-white rounded-xl shadow-sm border border-yellow-400 p-4 w-full mb-6">
        <h1 className="text-xl font-semibold text-orange-600">
          Quản Lý Đợt Giảm Giá
        </h1>

        <nav className="flex mb-3" aria-label="Breadcrumb">
          {/* breadcrumb của bạn */}
        </nav>

        {/* Breadcrumb và Tiêu đề */}
        <div className="mb-6">
          <nav className="flex mb-3" aria-label="Breadcrumb">
            <ol className="inline-flex items-center space-x-1">
              <li className="inline-flex items-center">
                <a
                  href="/"
                  className="text-sm font-medium text-orange-400 hover:text-orange-700 underline"
                >
                  Trang chủ
                </a>
              </li>
              <li aria-current="page">
                <div className="flex items-center">
                  <span className="mx-2 text-gray-400">/</span>
                  <span className="text-sm font-medium text-gray-700">
                    Đợt giảm giá
                  </span>
                </div>
              </li>
            </ol>
          </nav>
        </div>
      </div>

      {/* Bộ lọc tìm kiếm mới */}
      <AdvancedSearch
        title="Bộ Lọc Đợt Giảm Giá"
        searchValue={filters.searchTerm}
        onSearchChange={(e) => setSearchTerm(e.target.value)}
        searchPlaceholder="Mã đợt, tên đợt..."
        // Date range
        showDateRange={true}
        dateFrom={filters.dateFrom}
        dateTo={filters.dateTo}
        onDateFromChange={(e) => setDateFrom(e.target.value)}
        onDateToChange={(e) => setDateTo(e.target.value)}
        // Range slider for discount
        showRange={true}
        rangeValue={filters.rangeValue}
        onRangeChange={setRangeValue}
        rangeMin={0}
        rangeMax={100}
        rangeStep={1}
        rangeUnit="%"
        rangeLabel="Giá trị giảm"
        formatRangeValue={(val) => val}
        // Select dropdown
        showSelect={true}
        selectValue={filters.selectedOption}
        onSelectChange={(e) => setSelectedOption(e.target.value)}
        selectOptions={statusOptions}
        selectLabel="Trạng thái"
        // Filter chips
        showFilterChips={true}
        activeFilters={getActiveFilters()}
        onRemoveFilter={removeFilter}
        // Actions
        onReset={resetFilters}
        onExport={exportToExcel}
        onCreate={() => navigate("/promo/create")}
        showReset={true}
        showExport={true}
        showCreate={true}
        resetLabel="Đặt lại bộ lọc"
        exportLabel="Xuất Excel"
        createLabel="Thêm Đợt Giảm Giá"
      />

      {/* --- Bảng danh sách --- */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex items-center gap-2 p-6 border-b border-gray-100">
          <Calendar className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-orang-400">
            Danh Sách Đợt Giảm Giá
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  STT
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mã đợt
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tên đợt
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Giá Trị
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Loại Phiếu
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng Thái
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ngày Bắt Đầu
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ngày Kết Thúc
                </th>
                <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hành Động
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredList.length === 0 ? (
                <tr>
                  <td
                    colSpan="9"
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Calendar className="w-8 h-8 text-gray-300" />
                      <span>Không có dữ liệu</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredList.map((d, i) => (
                  <tr
                    key={d.id}
                    className="hover:bg-gray-50 transition-colors duration-150"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 align-middle">
                      {startIndex + i + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 align-middle">
                      {d.maGiamGia}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 align-middle">
                      {d.tenDot}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 align-middle">
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {d.loaiGiamGia === false
                            ? `${Number(d.giaTriGiam)}%`
                            : `${Number(d.giaTriGiam).toLocaleString()} ₫`}
                        </span>
                        {d.giaTriToiThieu && d.giaTriToiThieu > 0 && (
                          <span className="text-xs text-gray-500">
                            {d.loaiGiamGia === false
                              ? `Giảm tối đa: ${Number(
                                  d.giaTriToiThieu
                                ).toLocaleString()} ₫`
                              : `Đơn tối thiểu: ${Number(
                                  d.giaTriToiThieu
                                ).toLocaleString()} ₫`}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap align-middle">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          d.loaiGiamGia === false
                            ? "bg-purple-100 text-purple-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {d.loaiGiamGia === false ? "Phần trăm" : "Số tiền"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center align-middle">
                      {(() => {
                        const status = getDiscountStatus(
                          d.ngayBatDau,
                          d.ngayKetThuc
                        );

                        if (status === "Sắp diễn ra") {
                          return (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              Sắp diễn ra
                            </span>
                          );
                        } else if (status === "Đang diễn ra") {
                          return (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Đang diễn ra
                            </span>
                          );
                        } else {
                          return (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-800">
                              Đã kết thúc
                            </span>
                          );
                        }
                      })()}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 align-middle">
                      {formatDate(d.ngayBatDau)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 align-middle">
                      {formatDate(d.ngayKetThuc)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center align-middle">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          className="flex items-center justify-center w-8 h-8 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-150"
                          onClick={() =>
                            navigate("/promo/create", {
                              state: { discount: d },
                            })
                          }
                          title="Sửa"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          className="flex items-center justify-center w-8 h-8 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-150"
                          onClick={() => handleDeleteClick(d.id)}
                          title="Xóa"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* --- Thanh phân trang --- */}
        <div className="border-t border-gray-100 p-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3 text-sm text-gray-700">
              <span>Hiển thị</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <span>mục/trang</span>
              <span className="text-gray-500">
                Hiển thị {startIndex + 1} -{" "}
                {Math.min(endIndex, filteredList.length)} /{" "}
                {filteredList.length} mục
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="px-3 py-2 border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors duration-150"
              >
                &lt;&lt;
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors duration-150"
              >
                &lt;
              </button>

              {[...Array(totalPages).keys()]
                .slice(
                  Math.max(0, currentPage - 3),
                  Math.min(totalPages, currentPage + 2)
                )
                .map((p) => (
                  <button
                    key={p + 1}
                    onClick={() => setCurrentPage(p + 1)}
                    className={`px-3 py-2 border rounded-lg transition-colors duration-150 ${
                      currentPage === p + 1
                        ? "bg-orange-400 text-white border-orange-400"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    {p + 1}
                  </button>
                ))}

              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(p + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="px-3 py-2 border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors duration-150"
              >
                &gt;
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="px-3 py-2 border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors duration-150"
              >
                &gt;&gt;
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes progressBar {
          from { width: 100%; }
          to { width: 0%; }
        }
        .animate-progress {
          animation: progressBar 5s linear forwards;
        }
        @keyframes fadeScale {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        
        /* Custom slider styles */
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #ea580c;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #ea580c;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .slider::-webkit-slider-track {
          background: #e5e7eb;
          height: 8px;
          border-radius: 4px;
        }
        
        .slider::-moz-range-track {
          background: #e5e7eb;
          height: 8px;
          border-radius: 4px;
          border: none;
        }
        
        .slider::-webkit-slider-runnable-track {
          background: linear-gradient(to right, #ea580c 0%, #ea580c var(--value, 0%), #e5e7eb var(--value, 0%), #e5e7eb 100%);
        }
      `}</style>
    </div>
  );
}
