import axios from "axios";

const API_URL = "http://localhost:8080/api/dot-giam-gia-add"; // đổi port nếu cần

// Lấy tất cả đợt giảm giá
export const getAllDotGiamGia = () => {
  return axios.get(API_URL);
};

// Lấy form data (sản phẩm + trạng thái chọn)
export const getFormData = (
  dotId = null,
  q = "",
  mauSacId = null,
  kichThuocId = null,
  page = 0,
  size = 10
) => {
  let url = `${API_URL}/form-data?page=${page}&size=${size}&q=${encodeURIComponent(q)}`;

  if (dotId !== null) url += `&dotId=${dotId}`;
  if (mauSacId !== null) url += `&mauSacId=${mauSacId}`;
  if (kichThuocId !== null) url += `&kichThuocId=${kichThuocId}`;

  return axios.get(url);
};


// Tạo mới đợt giảm giá
export const createDotGiamGia = (data) => {
  return axios.post(API_URL, data);
};

// Cập nhật đợt giảm giá
export const updateDotGiamGia = (id, data) => {
  return axios.put(`${API_URL}/${id}`, data);
};

// Xóa đợt giảm giá
export const deleteDotGiamGia = (id) => {
  return axios.delete(`${API_URL}/${id}`);
};

// Kiểm tra sản phẩm có đang trong đợt giảm giá nào không
export const checkProductActiveSales = (ctspId) => {
  return axios.get(`${API_URL}/check-product/${ctspId}`);
};
