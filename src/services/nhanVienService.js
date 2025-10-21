import baseUrl from "@/api/instance";
import { createAsyncThunk } from "@reduxjs/toolkit";

export const fetchNhanVien = createAsyncThunk(
    "nhan-vien",
    async (
    ) => {
        try {
            const response = await baseUrl.get(`nhan-vien`);
            return response.data;
        } catch (error) {
            throw error.response?.data || "Đã xảy ra lỗi khi lấy dữ liệu";
        }
    }
);


export const addNhanVien = createAsyncThunk(
    "nhan-vien/add",
    async (nhanvien) => {
        const response = await baseUrl.post("nhan-vien/add", nhanvien);
        return response.data;
    }
);

export const updateNhanVien = createAsyncThunk(
    "nhan-vien/update",
    async ({ id, nhanvien }) => {
        const response = await baseUrl.put(`nhan-vien/update/${id}`, nhanvien);
        return response.data;
    }
);

export const deleteNhanVien = createAsyncThunk(
    "nhan-vien/id",
    async (id) => {
        await baseUrl.delete(`nhan-vien/delete/${id}`);
        return id;
    }
);

export const changeStatusNhanVien = createAsyncThunk("nhan-vien/status/id", async ({ id, trangThai }) => {
    await baseUrl.put(`nhan-vien/update-trang-thai/${id}?trangThai=${trangThai}`);
    return id;
})
export const scanCCCD = (formData) => {
    return axios.post("/api/cccd/scan", formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
};