import baseUrl from "./instance";

export const getAllDotGiamGia = () => baseUrl.get("dot-giam-gia");

export const getDotGiamGiaById = (id) => baseUrl.get(`dot-giam-gia/${id}`);

export const createDotGiamGia = (data) => baseUrl.post("dot-giam-gia", data);

export const updateDotGiamGia = (id, data) => baseUrl.put(`dot-giam-gia/${id}`, data);

export const deleteDotGiamGia = (id) => baseUrl.delete(`dot-giam-gia/${id}`);