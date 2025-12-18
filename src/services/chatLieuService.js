import baseUrl from "@/api/instance";

// Lấy tất cả chất liệu
export const getAllChatLieu = async () => {
  const res = await baseUrl.get("chat-lieu/playlist");
  return res.data;
};

// Lọc chất liệu + phân trang
export const filterChatLieu = async (params) => {
  const res = await baseUrl.get("chat-lieu/filter", {
    params: {
      pageNo: params.pageNo ?? 0,
      pageSize: params.pageSize ?? 10,
      ...params,
    },
  });
  return res.data;
};

// Thêm chất liệu
export const addChatLieu = async (data) => {
  const res = await baseUrl.post("chat-lieu/add", data);
  return res.data;
};

// Cập nhật chất liệu
export const updateChatLieu = async (id, data) => {
  const res = await baseUrl.put(`chat-lieu/update/${id}`, data);
  return res.data;
};

// Cập nhật trạng thái
export const updateTrangThaiChatLieu = async (id, trangThai) => {
  const res = await baseUrl.put(
    `chat-lieu/update-trang-thai/${id}`,
    null,
    { params: { trangThai } }
  );
  return res.data;
};

// Chi tiết chất liệu
export const getChatLieuDetail = async (id) => {
  const res = await baseUrl.get(`chat-lieu/detail/${id}`);
  return res.data;
};
