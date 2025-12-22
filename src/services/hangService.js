import baseUrl from "@/api/instance";

// Lấy tất cả hãng
export const getAllHang = async () => {
  const res = await baseUrl.get("nha-san-xuat/playlist");
  return res.data;
};

// Lọc hãng + phân trang
export const filterHang = async (params) => {
  const res = await baseUrl.get("nha-san-xuat/filter", {
    params: {
      pageNo: params.pageNo ?? 0,
      pageSize: params.pageSize ?? 10,
      ...params,
    },
  });
  return res.data;
};

// Thêm hãng
export const addHang = async (data) => {
  const res = await baseUrl.post("nha-san-xuat/add", data);
  return res.data;
};

// Cập nhật hãng
export const updateHang = async (id, data) => {
  const res = await baseUrl.put(`nha-san-xuat/update/${id}`, data);
  return res.data;
};

// Cập nhật trạng thái
export const updateTrangThaiHang = async (id, trangThai) => {
  const res = await baseUrl.put(
    `nha-san-xuat/update-trang-thai/${id}`,
    null,
    { params: { trangThai } }
  );
  return res.data;
};

// Chi tiết hãng
export const getHangDetail = async (id) => {
  const res = await baseUrl.get(`nha-san-xuat/detail/${id}`);
  return res.data;
};