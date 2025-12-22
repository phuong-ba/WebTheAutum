import baseUrl from "@/api/instance";

// Lấy tất cả cổ áo
export const getAllCoAo = async () => {
  const res = await baseUrl.get("co-ao/playlist");
  return res.data;
};

// Lọc cổ áo + phân trang
export const filterCoAo = async (params) => {
  const res = await baseUrl.get("co-ao/filter", {
    params: {
      pageNo: params.pageNo ?? 0,
      pageSize: params.pageSize ?? 10,
      ...params,
    },
  });
  return res.data;
};

// Thêm cổ áo
export const addCoAo = async (data) => {
  const res = await baseUrl.post("co-ao/add", data);
  return res.data;
};

// Cập nhật cổ áo
export const updateCoAo = async (id, data) => {
  const res = await baseUrl.put(`co-ao/update/${id}`, data);
  return res.data;
};

// Cập nhật trạng thái
export const updateTrangThaiCoAo = async (id, trangThai) => {
  const res = await baseUrl.put(
    `co-ao/update-trang-thai/${id}`,
    null,
    { params: { trangThai } }
  );
  return res.data;
};

// Chi tiết cổ áo
export const getCoAoDetail = async (id) => {
  const res = await baseUrl.get(`co-ao/detail/${id}`);
  return res.data;
};