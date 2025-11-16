import axios from "axios";

const API_URL = "http://localhost:8080/api/dia-chi";

export const diaChiApi = {
  getAllTinhThanh: async () => {
    const res = await axios.get(`${API_URL}/tinh-thanh`);
    return res.data;
  },

  getQuanByTinh: async (idTinh) => {
    const res = await axios.get(`${API_URL}/quan-huyen`, {
      params: { idTinh },
    });
    return res.data;
  },
};
