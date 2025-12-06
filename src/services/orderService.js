import baseUrl from "@/api/instance";
import { createAsyncThunk } from "@reduxjs/toolkit";

// ĐÚNG: nhận tham số orderRequest từ component
export const addOrder = createAsyncThunk(
    "order/addOrder",
    async (orderRequest, { rejectWithValue }) => {
        try {
            const response = await baseUrl.post("hoa-don/add", orderRequest);

            console.log("Đặt hàng thành công:", response.data);
            return response.data; // { success: true, message: "...", data: { hoaDon, paymentUrl } }
        } catch (error) {
            console.error("Lỗi đặt hàng:", error.response?.data);
            // Trả về lỗi chi tiết để component bắt được
            return rejectWithValue(error.response?.data || { message: "Đặt hàng thất bại!" });
        }
    }
);

export const searchOrder = createAsyncThunk(
    "order/searchOrder",
    async (searchText) => {
        const response = await baseUrl.get(`hoa-don?searchText=${searchText}`);
        return response.data;
    }
);

export const orderDetail = createAsyncThunk(
    "order/orderDetail",
    async (id) => {
        const response = await baseUrl.get(`hoa-don/detail/${id}`);
        return response.data;
    }
);

export const taoVietQR = createAsyncThunk(
    "order/taoVietQR",
    async (qrRequest, { rejectWithValue }) => {
        try {
            const response = await baseUrl.post("vietqr/tao-qr", qrRequest);
            console.log("Tạo VietQR:", response.data);
            return response.data; // qrUrl, message, orderId...
        } catch (error) {
            console.error("Lỗi tạo VietQR:", error.response?.data);
            return rejectWithValue(error.response?.data || { message: "Lỗi tạo mã QR!" });
        }
    }
);

export const getThongTinThanhToan = createAsyncThunk(
    "order/getThongTinThanhToan",
    async (idHoaDon, { rejectWithValue }) => {
        try {
            const response = await baseUrl.get(`thanh-toan/thong-tin/${idHoaDon}`);
            console.log("Thông tin thanh toán:", response.data);
            return response.data;
        } catch (error) {
            console.error("Lỗi lấy thông tin thanh toán:", error.response?.data);
            return rejectWithValue(error.response?.data || { message: "Lỗi lấy thông tin thanh toán!" });
        }
    }
);

// 2. Cập nhật thanh toán (một phần hoặc toàn bộ)
export const updateThanhToan = createAsyncThunk(
    "order/updateThanhToan",
    async (thanhToanRequest, { rejectWithValue }) => {
        try {
            const response = await baseUrl.post("thanh-toan/cap-nhat", thanhToanRequest);
            console.log("Cập nhật thanh toán thành công:", response.data);
            return response.data;
        } catch (error) {
            console.error("Lỗi cập nhật thanh toán:", error.response?.data);
            return rejectWithValue(error.response?.data || { message: "Lỗi cập nhật thanh toán!" });
        }
    }
);

// 3. Thanh toán toàn bộ (tiện ích)
export const thanhToanToanBo = createAsyncThunk(
    "order/thanhToanToanBo",
    async ({ idHoaDon, idPhuongThucThanhToan, idNhanVienThucHien }, { rejectWithValue }) => {
        try {
            const response = await baseUrl.post(
                `thanh-toan/toan-bo/${idHoaDon}`,
                null,
                {
                    params: {
                        idPhuongThucThanhToan,
                        idNhanVienThucHien
                    }
                }
            );
            console.log("Thanh toán toàn bộ thành công:", response.data);
            return response.data;
        } catch (error) {
            console.error("Lỗi thanh toán toàn bộ:", error.response?.data);
            return rejectWithValue(error.response?.data || { message: "Lỗi thanh toán toàn bộ!" });
        }
    }
);

// 4. Kiểm tra trạng thái thanh toán
export const checkTrangThaiThanhToan = createAsyncThunk(
    "order/checkTrangThaiThanhToan",
    async (idHoaDon, { rejectWithValue }) => {
        try {
            const response = await baseUrl.get(`thanh-toan/trang-thai/${idHoaDon}`);
            console.log("Trạng thái thanh toán:", response.data);
            return response.data;
        } catch (error) {
            console.error("Lỗi kiểm tra trạng thái thanh toán:", error.response?.data);
            return rejectWithValue(error.response?.data || { message: "Lỗi kiểm tra trạng thái thanh toán!" });
        }
    }
);

// 5. Thanh toán với VNPay
export const thanhToanVNPay = createAsyncThunk(
    "order/thanhToanVNPay",
    async (orderRequest, { rejectWithValue }) => {
        try {
            const response = await baseUrl.post("hoa-don/vnpay/create", orderRequest);
            console.log("Tạo thanh toán VNPay:", response.data);
            return response.data;
        } catch (error) {
            console.error("Lỗi tạo thanh toán VNPay:", error.response?.data);
            return rejectWithValue(error.response?.data || { message: "Lỗi tạo thanh toán VNPay!" });
        }
    }
);

// 6. Xử lý hoàn tiền
export const hoanTienHoaDon = createAsyncThunk(
    "order/hoanTienHoaDon",
    async ({ idHoaDon, hoanTienRequest }, { rejectWithValue }) => {
        try {
            const response = await baseUrl.post(`hoa-don/${idHoaDon}/hoan-tien`, hoanTienRequest);
            console.log("Hoàn tiền thành công:", response.data);
            return response.data;
        } catch (error) {
            console.error("Lỗi hoàn tiền:", error.response?.data);
            return rejectWithValue(error.response?.data || { message: "Lỗi hoàn tiền!" });
        }
    }
);