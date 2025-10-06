import { useEffect, useState } from "react";
import {
  addPGG,
  getPhieuGiamGiaById,
  phanTrang,
  updateTrangThai,
  updatePGG,
  searchPGG,
  searchTheoNgay,
  getAllKhachHang,
  getKhachHangIdsByPGGId,
} from "../../services/DiscountService";

export default function Discount() {
  const [discounts, setDiscounts] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(5);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [ngayBatDau, setNgayBatDau] = useState("");
  const [ngayKetThuc, setNgayKetThuc] = useState("");
  const [khachHangs, setKhachHangs] = useState([]);
  const [isCreating, setIsCreating] = useState(false);

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

  const resetForm = () => {
    setFormData({
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
    setIsCreating(false);
  };

  useEffect(() => {
    getPhanTrang();
    fetchKhachHangs();
  }, [currentPage, pageSize]);

  const getPhanTrang = async (page = currentPage, size = pageSize) => {
    try {
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
      await addPGG(submitData);
      alert("Thêm mới thành công!");
      setCurrentPage(0);
      getPhanTrang(0, pageSize);
      resetForm();
    } catch (error) {
      console.error("Lỗi khi thêm:", error);
      alert("Lỗi khi thêm mới: " + error.message);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      if (!formData.id) {
        alert("Không tìm thấy ID phiếu giảm giá!");
        return;
      }
      console.log("📤 Bắt đầu cập nhật phiếu giảm giá ID:", formData.id);
      const submitData = {
        ...formData,
        idKhachHangs:
          formData.kieu === 1
            ? formData.idKhachHangs.map((id) => Number(id))
            : [],
      };

      console.log("🚀 Dữ liệu gửi đi:", submitData);

      const res = await updatePGG(submitData, formData.id);
      console.log("✅ Response từ server:", res);

      // Kiểm tra response theo cấu trúc của bạn
      if (res && (res.success !== false || res.status === "SUCCESS")) {
        alert("Cập nhật thành công!");
        resetForm();
        setCurrentPage(0);
        getPhanTrang(0, pageSize);
        setIsCreating(false);
      } else {
        alert("Cập nhật thất bại: " + (res.message || "Không rõ lỗi"));
      }
    } catch (error) {
      console.error("❌ Lỗi khi cập nhật:", error);
      alert("Lỗi khi cập nhật: " + error.message);
    }
  };

  const handleView = async (id) => {
    try {
      const data = await getPhieuGiamGiaById(id);

      let khachHangIds = [];
      if (data.kieu === 1) {
        const khachHangIdsData = await getKhachHangIdsByPGGId(id);
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
      setIsCreating(true);
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

  const handlePageChange = (newPage) => {
    if (newPage >= 0 && newPage < totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handlePageSizeChange = (e) => {
    const newSize = parseInt(e.target.value);
    setPageSize(newSize);
    setCurrentPage(0);
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

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      const newStatus = !currentStatus;
      const res = await updateTrangThai(id, newStatus);
      if (res && res.isSuccess) {
        setDiscounts((prevDiscounts) =>
          prevDiscounts.map((item) =>
            item.id === id ? { ...item, trangThai: newStatus } : item
          )
        );
      }
    } catch (error) {
      console.error("Lỗi khi toggle trạng thái:", error);
    }
  };

  const handleSearch = async () => {
    try {
      if (searchKeyword.trim() === "") {
        getPhanTrang(0);
        return;
      }
      const res = await searchPGG(searchKeyword);
      if (res && res.data) {
        setDiscounts(res.data);
        setTotalPages(1);
        setTotalElements(res.data.length);
      } else {
        setDiscounts([]);
      }
    } catch (error) {
      console.error("Lỗi khi tìm kiếm:", error);
      alert("Không tìm thấy phiếu giảm giá!");
    }
  };

  const handleSearchByDate = async () => {
    try {
      const res = await searchTheoNgay(ngayBatDau, ngayKetThuc);
      if (res && res.data) {
        setDiscounts(res.data);
        setTotalPages(1);
        setTotalElements(res.data.length);
      } else {
        setDiscounts([]);
      }
    } catch (error) {
      console.error("Lỗi khi tìm theo ngày:", error);
      alert("Không tìm thấy phiếu trong khoảng ngày này!");
    }
  };

  const fetchKhachHangs = async () => {
    try {
      const data = await getAllKhachHang();
      setKhachHangs(data);
    } catch (error) {
      console.error("Lỗi khi lấy khách hàng:", error);
    }
  };

  const handleKhachHangSelect = (khachHangId) => {
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
    if (e.target.checked) {
      const allIds = khachHangs.map((kh) => kh.id.toString());
      setFormData({ ...formData, idKhachHangs: allIds });
    } else {
      setFormData({ ...formData, idKhachHangs: [] });
    }
  };

  const handleCreateNew = () => {
    resetForm();
    setIsCreating(true);
  };

  const handleCancel = () => {
    resetForm();
  };

  return (
    <div
      style={{ backgroundColor: "white", minHeight: "100vh", padding: "20px" }}
    >
      {!isCreating ? (
        <div>
          <div style={{ marginBottom: "20px" }}>
            <h4 style={{ color: "#333", marginBottom: "10px" }}>
              Phiếu giảm giá
            </h4>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "15px",
              }}
            >
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="Tìm phiếu giảm giá theo mã hoặc tên"
                style={{
                  padding: "8px 12px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  marginRight: "10px",
                  width: "300px",
                }}
              />
              <button
                type="button"
                onClick={handleSearch}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#6c757d",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  marginRight: "15px",
                  cursor: "pointer",
                }}
              >
                Tìm
              </button>

              <button
                type="button"
                onClick={handleCreateNew}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#28a745",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Tạo mới
              </button>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "15px",
                marginBottom: "20px",
                padding: "15px",
                backgroundColor: "#f8f9fa",
                borderRadius: "4px",
              }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "5px",
                    fontWeight: "500",
                  }}
                >
                  Từ ngày
                </label>
                <input
                  type="date"
                  value={ngayBatDau}
                  onChange={(e) => setNgayBatDau(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "6px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "5px",
                    fontWeight: "500",
                  }}
                >
                  Đến ngày
                </label>
                <input
                  type="date"
                  value={ngayKetThuc}
                  onChange={(e) => setNgayKetThuc(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "6px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                  }}
                />
              </div>
              <div style={{ display: "flex", alignItems: "end", gap: "10px" }}>
                <button
                  type="button"
                  onClick={handleSearchByDate}
                  style={{
                    padding: "6px 12px",
                    backgroundColor: "#17a2b8",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    height: "32px",
                  }}
                >
                  Lọc
                </button>
              </div>
            </div>
          </div>

          <div
            style={{
              backgroundColor: "white",
              borderRadius: "4px",
              overflow: "hidden",
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "#e9ecef" }}>
                  <th
                    style={{
                      padding: "12px",
                      border: "1px solid #dee2e6",
                      textAlign: "center",
                      fontWeight: "600",
                    }}
                  >
                    STT
                  </th>
                  <th
                    style={{
                      padding: "12px",
                      border: "1px solid #dee2e6",
                      fontWeight: "600",
                    }}
                  >
                    Mã
                  </th>
                  <th
                    style={{
                      padding: "12px",
                      border: "1px solid #dee2e6",
                      fontWeight: "600",
                    }}
                  >
                    Tên
                  </th>
                  <th
                    style={{
                      padding: "12px",
                      border: "1px solid #dee2e6",
                      fontWeight: "600",
                    }}
                  >
                    Kiểu
                  </th>
                  <th
                    style={{
                      padding: "12px",
                      border: "1px solid #dee2e6",
                      fontWeight: "600",
                    }}
                  >
                    Loại
                  </th>
                  <th
                    style={{
                      padding: "12px",
                      border: "1px solid #dee2e6",
                      textAlign: "center",
                      fontWeight: "600",
                    }}
                  >
                    Số lượng
                  </th>
                  <th
                    style={{
                      padding: "12px",
                      border: "1px solid #dee2e6",
                      fontWeight: "600",
                    }}
                  >
                    Ngày bắt đầu
                  </th>
                  <th
                    style={{
                      padding: "12px",
                      border: "1px solid #dee2e6",
                      fontWeight: "600",
                    }}
                  >
                    Ngày kết thúc
                  </th>
                  <th
                    style={{
                      padding: "12px",
                      border: "1px solid #dee2e6",
                      fontWeight: "600",
                    }}
                  >
                    Trạng thái
                  </th>
                  <th
                    style={{
                      padding: "12px",
                      border: "1px solid #dee2e6",
                      textAlign: "center",
                      fontWeight: "600",
                    }}
                  >
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody>
                {discounts.map((item, index) => (
                  <tr
                    key={item.id}
                    style={{
                      backgroundColor: index % 2 === 0 ? "#f8f9fa" : "white",
                    }}
                  >
                    <td
                      style={{
                        padding: "12px",
                        border: "1px solid #dee2e6",
                        textAlign: "center",
                      }}
                    >
                      {index + 1 + currentPage * pageSize}
                    </td>
                    <td
                      style={{ padding: "12px", border: "1px solid #dee2e6" }}
                    >
                      {item.maGiamGia}
                    </td>
                    <td
                      style={{ padding: "12px", border: "1px solid #dee2e6" }}
                    >
                      {item.tenChuongTrinh}
                    </td>
                    <td
                      style={{ padding: "12px", border: "1px solid #dee2e6" }}
                    >
                      {item.kieu == 0 ? "Công khai" : "Cá nhân"}
                    </td>
                    <td
                      style={{ padding: "12px", border: "1px solid #dee2e6" }}
                    >
                      {item.loaiGiamGia
                        ? `${item.giaTriGiamGia?.toLocaleString()} đ`
                        : `${item.giaTriGiamGia}%`}
                    </td>
                    <td
                      style={{
                        padding: "12px",
                        border: "1px solid #dee2e6",
                        textAlign: "center",
                      }}
                    >
                      {item.soLuong}
                    </td>
                    <td
                      style={{ padding: "12px", border: "1px solid #dee2e6" }}
                    >
                      {formatDisplayDate(item.ngayBatDau)}
                    </td>
                    <td
                      style={{ padding: "12px", border: "1px solid #dee2e6" }}
                    >
                      {formatDisplayDate(item.ngayKetThuc)}
                    </td>
                    <td
                      style={{ padding: "12px", border: "1px solid #dee2e6" }}
                    >
                      <span
                        style={{
                          padding: "4px 8px",
                          borderRadius: "4px",
                          fontSize: "12px",
                          backgroundColor: item.trangThai
                            ? "#d4edda"
                            : "#f8d7da",
                          color: item.trangThai ? "#155724" : "#721c24",
                        }}
                      >
                        {item.trangThai ? "Đang diễn ra" : "Đã kết thúc"}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: "12px",
                        border: "1px solid #dee2e6",
                        textAlign: "center",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "center",
                          gap: "8px",
                        }}
                      >
                        <button
                          onClick={() => handleView(item.id)}
                          title="Xem/Sửa chi tiết"
                          style={{
                            padding: "6px 10px",
                            backgroundColor: "#17a2b8",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "12px",
                          }}
                        >
                          Xem
                        </button>
                        <button
                          onClick={() =>
                            handleToggleStatus(item.id, item.trangThai)
                          }
                          title="Đổi trạng thái"
                          style={{
                            padding: "6px 10px",
                            backgroundColor: item.trangThai
                              ? "#dc3545"
                              : "#28a745",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "12px",
                          }}
                        >
                          {item.trangThai ? "Dừng" : "Kích hoạt"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {discounts.length === 0 && (
              <div
                style={{
                  padding: "40px",
                  textAlign: "center",
                  color: "#6c757d",
                }}
              >
                Không có dữ liệu
              </div>
            )}

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "15px",
                borderTop: "1px solid #dee2e6",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "10px" }}
              >
                <span>Hiển thị:</span>
                <select
                  value={pageSize}
                  onChange={handlePageSizeChange}
                  style={{
                    padding: "6px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                  }}
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
                <span style={{ color: "#6c757d" }}>
                  Tổng: {totalElements} bản ghi
                </span>
              </div>

              <div
                style={{ display: "flex", alignItems: "center", gap: "5px" }}
              >
                <button
                  onClick={() => handlePageChange(0)}
                  disabled={currentPage === 0}
                  style={{
                    padding: "6px 10px",
                    border: "1px solid #ddd",
                    backgroundColor: currentPage === 0 ? "#f8f9fa" : "white",
                    color: currentPage === 0 ? "#6c757d" : "#007bff",
                    cursor: currentPage === 0 ? "not-allowed" : "pointer",
                    borderRadius: "4px",
                  }}
                >
                  ⟪
                </button>
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 0}
                  style={{
                    padding: "6px 10px",
                    border: "1px solid #ddd",
                    backgroundColor: currentPage === 0 ? "#f8f9fa" : "white",
                    color: currentPage === 0 ? "#6c757d" : "#007bff",
                    cursor: currentPage === 0 ? "not-allowed" : "pointer",
                    borderRadius: "4px",
                  }}
                >
                  ⟨
                </button>

                {getPageNumbers().map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    style={{
                      padding: "6px 10px",
                      border: "1px solid #ddd",
                      backgroundColor:
                        currentPage === page ? "#007bff" : "white",
                      color: currentPage === page ? "white" : "#007bff",
                      cursor: "pointer",
                      borderRadius: "4px",
                    }}
                  >
                    {page + 1}
                  </button>
                ))}

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages - 1}
                  style={{
                    padding: "6px 10px",
                    border: "1px solid #ddd",
                    backgroundColor:
                      currentPage >= totalPages - 1 ? "#f8f9fa" : "white",
                    color:
                      currentPage >= totalPages - 1 ? "#6c757d" : "#007bff",
                    cursor:
                      currentPage >= totalPages - 1 ? "not-allowed" : "pointer",
                    borderRadius: "4px",
                  }}
                >
                  ⟩
                </button>
                <button
                  onClick={() => handlePageChange(totalPages - 1)}
                  disabled={currentPage >= totalPages - 1}
                  style={{
                    padding: "6px 10px",
                    border: "1px solid #ddd",
                    backgroundColor:
                      currentPage >= totalPages - 1 ? "#f8f9fa" : "white",
                    color:
                      currentPage >= totalPages - 1 ? "#6c757d" : "#007bff",
                    cursor:
                      currentPage >= totalPages - 1 ? "not-allowed" : "pointer",
                    borderRadius: "4px",
                  }}
                >
                  ⟫
                </button>
              </div>

              <div style={{ color: "#6c757d" }}>
                Trang {currentPage + 1} / {totalPages || 1}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div
          style={{
            backgroundColor: "white",
            padding: "20px",
            borderRadius: "4px",
          }}
        >
          <div style={{ marginBottom: "20px" }}>
            <h4 style={{ color: "#333", margin: 0 }}>
              Phiếu giảm giá /{" "}
              {formData.id ? "Chỉnh sửa phiếu giảm giá" : "Tạo phiếu giảm giá"}
            </h4>
          </div>

          <form onSubmit={formData.id ? handleUpdate : handleSubmit}>
            <div style={{ marginBottom: "20px" }}>
              <div style={{ marginBottom: "15px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "5px",
                    fontWeight: "600",
                  }}
                >
                  Mã phiếu giảm giá
                </label>
                <input
                  type="text"
                  name="maGiamGia"
                  value={formData.maGiamGia}
                  onChange={handleChange}
                  style={{
                    width: "100%",
                    maxWidth: "400px",
                    padding: "8px 12px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                  }}
                  required
                />
              </div>

              <div style={{ marginBottom: "15px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "5px",
                    fontWeight: "600",
                  }}
                >
                  Tên phiếu giảm giá
                </label>
                <input
                  type="text"
                  name="tenChuongTrinh"
                  value={formData.tenChuongTrinh}
                  onChange={handleChange}
                  style={{
                    width: "100%",
                    maxWidth: "400px",
                    padding: "8px 12px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                  }}
                  required
                />
              </div>
            </div>

            <div
              style={{
                marginBottom: "20px",
                padding: "15px",
                backgroundColor: "#f8f9fa",
                borderRadius: "4px",
              }}
            >
              <h5 style={{ marginBottom: "15px", color: "#333" }}>Giá trị</h5>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "15px",
                  flexWrap: "wrap",
                }}
              >
                <input
                  type="number"
                  name="giaTriGiamGia"
                  value={formData.giaTriGiamGia}
                  onChange={handleChange}
                  style={{
                    width: "120px",
                    padding: "8px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                  }}
                  min="0"
                  max={formData.loaiGiamGia === false ? "100" : undefined}
                  required
                />

                <select
                  name="loaiGiamGia"
                  value={formData.loaiGiamGia}
                  onChange={handleChange}
                  style={{
                    padding: "8px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                  }}
                >
                  <option value="true">Tiền mặt</option>
                  <option value="false">Phần trăm</option>
                </select>

                <span style={{ margin: "0 10px" }}>Số lượng</span>
                <input
                  type="number"
                  name="soLuong"
                  value={formData.soLuong}
                  onChange={handleChange}
                  style={{
                    width: "120px",
                    padding: "8px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                  }}
                  min="0"
                  required
                />
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "15px",
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <span style={{ marginRight: "5px" }}>Mức giảm tối đa:</span>
                  <input
                    type="number"
                    name="mucGiaGiamToiDa"
                    value={formData.mucGiaGiamToiDa}
                    onChange={handleChange}
                    style={{
                      width: "150px",
                      padding: "8px",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                    }}
                    min="0"
                  />
                </div>

                <div>
                  <span style={{ marginRight: "5px" }}>
                    Đơn hàng tối thiểu:
                  </span>
                  <input
                    type="number"
                    name="giaTriDonHangToiThieu"
                    value={formData.giaTriDonHangToiThieu}
                    onChange={handleChange}
                    style={{
                      width: "150px",
                      padding: "8px",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                    }}
                    min="0"
                  />
                </div>
              </div>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <div style={{ marginBottom: "15px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "5px",
                    fontWeight: "600",
                  }}
                >
                  Từ ngày
                </label>
                <input
                  type="datetime-local"
                  name="ngayBatDau"
                  value={formData.ngayBatDau}
                  onChange={handleChange}
                  style={{
                    padding: "8px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                  }}
                  required
                />
              </div>

              <div style={{ marginBottom: "15px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "5px",
                    fontWeight: "600",
                  }}
                >
                  Đến ngày
                </label>
                <input
                  type="datetime-local"
                  name="ngayKetThuc"
                  value={formData.ngayKetThuc}
                  onChange={handleChange}
                  style={{
                    padding: "8px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                  }}
                  required
                />
              </div>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "10px",
                  fontWeight: "600",
                }}
              >
                Kiểu
              </label>
              <div style={{ display: "flex", gap: "20px" }}>
                <label
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <input
                    type="radio"
                    name="kieu"
                    value="0"
                    checked={formData.kieu == 0}
                    onChange={(e) =>
                      setFormData({ ...formData, kieu: Number(e.target.value) })
                    }
                  />
                  Công khai
                </label>
                <label
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <input
                    type="radio"
                    name="kieu"
                    value="1"
                    checked={formData.kieu == 1}
                    onChange={(e) =>
                      setFormData({ ...formData, kieu: Number(e.target.value) })
                    }
                  />
                  Cá nhân
                </label>
              </div>
            </div>

            {formData.kieu === 1 && (
              <div style={{ marginBottom: "20px" }}>
                <h5 style={{ marginBottom: "15px", color: "#333" }}>
                  Tìm kiếm khách hàng
                </h5>
                <div
                  style={{
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    overflow: "hidden",
                  }}
                >
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ backgroundColor: "#e9ecef" }}>
                        <th
                          style={{
                            padding: "12px",
                            border: "1px solid #dee2e6",
                            textAlign: "center",
                            width: "40px",
                          }}
                        >
                          <input
                            type="checkbox"
                            onChange={handleSelectAllKhachHang}
                            checked={
                              formData.idKhachHangs.length ===
                                khachHangs.length && khachHangs.length > 0
                            }
                          />
                        </th>
                        <th
                          style={{
                            padding: "12px",
                            border: "1px solid #dee2e6",
                            fontWeight: "600",
                          }}
                        >
                          Tên
                        </th>
                        <th
                          style={{
                            padding: "12px",
                            border: "1px solid #dee2e6",
                            fontWeight: "600",
                          }}
                        >
                          Số điện thoại
                        </th>
                        <th
                          style={{
                            padding: "12px",
                            border: "1px solid #dee2e6",
                            fontWeight: "600",
                          }}
                        >
                          Email
                        </th>
                        <th
                          style={{
                            padding: "12px",
                            border: "1px solid #dee2e6",
                            fontWeight: "600",
                          }}
                        >
                          Ngày sinh
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {khachHangs.map((kh, index) => (
                        <tr
                          key={kh.id}
                          style={{
                            backgroundColor:
                              index % 2 === 0 ? "#f8f9fa" : "white",
                          }}
                        >
                          <td
                            style={{
                              padding: "12px",
                              border: "1px solid #dee2e6",
                              textAlign: "center",
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={formData.idKhachHangs.includes(
                                kh.id.toString()
                              )}
                              onChange={() => handleKhachHangSelect(kh.id)}
                            />
                          </td>
                          <td
                            style={{
                              padding: "12px",
                              border: "1px solid #dee2e6",
                            }}
                          >
                            {kh.hoTen}
                          </td>
                          <td
                            style={{
                              padding: "12px",
                              border: "1px solid #dee2e6",
                            }}
                          >
                            {kh.soDienThoai}
                          </td>
                          <td
                            style={{
                              padding: "12px",
                              border: "1px solid #dee2e6",
                            }}
                          >
                            {kh.email}
                          </td>
                          <td
                            style={{
                              padding: "12px",
                              border: "1px solid #dee2e6",
                            }}
                          >
                            {kh.ngaySinh ? formatDisplayDate(kh.ngaySinh) : ""}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div style={{ display: "flex", gap: "10px", marginTop: "25px" }}>
              <button
                type="submit"
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#28a745",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: "500",
                }}
              >
                {formData.id ? "Cập nhật" : "Lưu"}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#6c757d",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Hủy
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
