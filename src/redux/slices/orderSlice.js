import { createSlice } from "@reduxjs/toolkit";
import {
    searchOrder,
    orderDetail,
    getThongTinThanhToan,
    updateThanhToan,
    thanhToanToanBo,
    checkTrangThaiThanhToan,
    hoanTienHoaDon
} from "@/services/orderService"; // Giả sử bạn đã chuyển các API thanh toán vào orderService

const orderSlice = createSlice({
    name: "order",
    initialState: {
        status: "idle",
        data: [],
        dataDetail: [],
        paymentInfo: null, // Thông tin thanh toán
        paymentStatus: null, // Trạng thái thanh toán
        refundInfo: null, // Thông tin hoàn tiền
        loadingPayment: false, // Trạng thái loading cho thanh toán
        error: null,
        paymentError: null, // Lỗi riêng cho thanh toán
    },
    reducers: {
        // Clear payment info khi đóng modal
        clearPaymentInfo: (state) => {
            state.paymentInfo = null;
            state.paymentError = null;
        },
        // Clear payment error
        clearPaymentError: (state) => {
            state.paymentError = null;
        },
        // Clear refund info
        clearRefundInfo: (state) => {
            state.refundInfo = null;
        },
        // Set payment amount (cho phép chỉnh sửa số tiền)
        setPaymentAmount: (state, action) => {
            if (state.paymentInfo) {
                state.paymentInfo.soTienThanhToan = action.payload;
            }
        }
    },
    extraReducers: (builder) => {
        // ========== XỬ LÝ TÌM KIẾM & CHI TIẾT ĐƠN HÀNG ==========
        builder
            .addCase(searchOrder.pending, (state, action) => {
                state.status = "pending";
            })
            .addCase(searchOrder.fulfilled, (state, action) => {
                state.status = "successfully";
                state.data = action.payload.content || [];
            })
            .addCase(searchOrder.rejected, (state, action) => {
                state.status = "failed";
                state.error = action.error.message;
            })
            
            .addCase(orderDetail.pending, (state, action) => {
                state.status = "pending";
            })
            .addCase(orderDetail.fulfilled, (state, action) => {
                state.status = "successfully";
                state.dataDetail = action.payload || [];
                console.log("🚀 ~ Chi tiết đơn hàng:", action.payload);
            })
            .addCase(orderDetail.rejected, (state, action) => {
                state.status = "failed";
                state.error = action.error.message;
            })

        // ========== XỬ LÝ API THANH TOÁN ==========

        // 1. Lấy thông tin thanh toán
        .addCase(getThongTinThanhToan.pending, (state) => {
            state.loadingPayment = true;
            state.paymentError = null;
        })
        .addCase(getThongTinThanhToan.fulfilled, (state, action) => {
            state.loadingPayment = false;
            state.paymentInfo = action.payload;
            console.log("💰 Thông tin thanh toán:", action.payload);
        })
        .addCase(getThongTinThanhToan.rejected, (state, action) => {
            state.loadingPayment = false;
            state.paymentError = action.payload?.message || "Lỗi lấy thông tin thanh toán";
        })

        // 2. Cập nhật thanh toán
        .addCase(updateThanhToan.pending, (state) => {
            state.loadingPayment = true;
            state.paymentError = null;
        })
        .addCase(updateThanhToan.fulfilled, (state, action) => {
            state.loadingPayment = false;
            
            // Cập nhật thông tin thanh toán mới
            state.paymentInfo = action.payload;
            
            // Cập nhật dataDetail nếu đang xem chi tiết đơn hàng này
            if (state.dataDetail && state.dataDetail.id === action.payload.idHoaDon) {
                state.dataDetail = {
                    ...state.dataDetail,
                    soTienThanhToan: action.payload.soTienDaThanhToan,
                    trangThai: action.payload.soTienConLai === 0 ? 3 : state.dataDetail.trangThai
                };
            }
            
            console.log("✅ Thanh toán thành công:", action.payload);
        })
        .addCase(updateThanhToan.rejected, (state, action) => {
            state.loadingPayment = false;
            state.paymentError = action.payload?.message || "Lỗi cập nhật thanh toán";
        })

        // 3. Thanh toán toàn bộ
        .addCase(thanhToanToanBo.pending, (state) => {
            state.loadingPayment = true;
            state.paymentError = null;
        })
        .addCase(thanhToanToanBo.fulfilled, (state, action) => {
            state.loadingPayment = false;
            state.paymentInfo = action.payload;
            
            // Cập nhật dataDetail
            if (state.dataDetail && state.dataDetail.id === action.payload.idHoaDon) {
                state.dataDetail = {
                    ...state.dataDetail,
                    soTienThanhToan: action.payload.soTienDaThanhToan,
                    trangThai: 3 // Đã hoàn thành
                };
            }
            
            console.log("✅ Thanh toán toàn bộ thành công:", action.payload);
        })
        .addCase(thanhToanToanBo.rejected, (state, action) => {
            state.loadingPayment = false;
            state.paymentError = action.payload?.message || "Lỗi thanh toán toàn bộ";
        })

        // 4. Kiểm tra trạng thái thanh toán
        .addCase(checkTrangThaiThanhToan.pending, (state) => {
            state.loadingPayment = true;
        })
        .addCase(checkTrangThaiThanhToan.fulfilled, (state, action) => {
            state.loadingPayment = false;
            state.paymentStatus = action.payload;
            console.log("📊 Trạng thái thanh toán:", action.payload);
        })
        .addCase(checkTrangThaiThanhToan.rejected, (state, action) => {
            state.loadingPayment = false;
            state.paymentError = action.payload?.message || "Lỗi kiểm tra trạng thái";
        })

        // 5. Hoàn tiền
        .addCase(hoanTienHoaDon.pending, (state) => {
            state.loadingPayment = true;
            state.paymentError = null;
        })
        .addCase(hoanTienHoaDon.fulfilled, (state, action) => {
            state.loadingPayment = false;
            state.refundInfo = action.payload;
            
            // Cập nhật dataDetail
            if (state.dataDetail && state.dataDetail.id === action.payload.idHoaDon) {
                state.dataDetail = {
                    ...state.dataDetail,
                    trangThai: 4 // Đã hủy
                };
            }
            
            console.log("💸 Hoàn tiền thành công:", action.payload);
        })
        .addCase(hoanTienHoaDon.rejected, (state, action) => {
            state.loadingPayment = false;
            state.paymentError = action.payload?.message || "Lỗi hoàn tiền";
        });
    },
});

export const { 
    clearPaymentInfo, 
    clearPaymentError, 
    clearRefundInfo,
    setPaymentAmount 
} = orderSlice.actions;

export default orderSlice.reducer;