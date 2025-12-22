import baseUrl from "@/api/instance";

// Lấy tất cả tay áo
export const getAllTayAo = async () => {
  const res = await baseUrl.get("tay-ao/playlist");
  return res.data;
};

// Lọc tay áo + phân trang
export const filterTayAo = async (params) => {
  const res = await baseUrl.get("tay-ao/filter", {
    params: {
      pageNo: params.pageNo ?? 0,
      pageSize: params.pageSize ?? 10,
      ...params,
    },
  });
  return res.data;
};

// Thêm tay áo
export const addTayAo = async (data) => {
  const res = await baseUrl.post("tay-ao/add", data);
  return res.data;
};

// Cập nhật tay áo
export const updateTayAo = async (id, data) => {
  const res = await baseUrl.put(`tay-ao/update/${id}`, data);
  return res.data;
};

// Cập nhật trạng thái
export const updateTrangThaiTayAo = async (id, trangThai) => {
  const res = await baseUrl.put(
    `tay-ao/update-trang-thai/${id}`,
    null,
    { params: { trangThai } }
  );
  return res.data;
};

// Chi tiết tay áo
export const getTayAoDetail = async (id) => {
  const res = await baseUrl.get(`tay-ao/detail/${id}`);
  return res.data;
};