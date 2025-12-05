import baseUrl from "./instance";

export const diaChiApi = {
  getAllTinhThanh: async () => {
    const res = await baseUrl.get("dia-chi/tinh-thanh");
    return res.data;
  },

  getQuanByTinh: async (idTinh) => {
    const res = await baseUrl.get("dia-chi/quan-huyen", {
      params: { idTinh },
    });
    return res.data;
  },
};