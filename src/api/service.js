import baseUrl from "./instance";

// Lấy tất cả đợt giảm giá
export const getAllDotGiamGia = () => {
  return baseUrl.get("dot-giam-gia-add");
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
  let url = "dot-giam-gia-add/form-data";
  
  return baseUrl.get(url, {
    params: {
      dotId,
      q,
      mauSacId,
      kichThuocId,
      page,
      size
    }
  });
};

// Tạo mới đợt giảm giá
export const createDotGiamGia = (data) => {
  return baseUrl.post("dot-giam-gia-add", data);
};

// Cập nhật đợt giảm giá
export const updateDotGiamGia = (id, data) => {
  return baseUrl.put(`dot-giam-gia-add/${id}`, data);
};

// Xóa đợt giảm giá
export const deleteDotGiamGia = (id) => {
  return baseUrl.delete(`dot-giam-gia-add/${id}`);
};

// Kiểm tra sản phẩm có đang trong đợt giảm giá nào không
export const checkProductActiveSales = (ctspId) => {
  return baseUrl.get(`dot-giam-gia-add/check-product/${ctspId}`);
};