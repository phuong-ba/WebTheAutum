import baseUrl from "./instance";

const chiTietSanPhamApi = {
  getAll() {
    return baseUrl.get("chi-tiet-san-pham");
  },
  
  getById(id) {
    return baseUrl.get(`chi-tiet-san-pham/${id}`);
  },
  
  getBySanPhamId(sanPhamId) {
    return baseUrl.get(`chi-tiet-san-pham/san-pham/${sanPhamId}`);
  }
};

export default chiTietSanPhamApi;