import baseUrl from "./instance";

const nhanVienApi = {
  getAll() {
    return baseUrl.get("nhan-vien");
  }
};

export default nhanVienApi;