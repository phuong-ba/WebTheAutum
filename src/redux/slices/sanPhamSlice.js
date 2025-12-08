import { fetchBanChay, fetchDanhMuc, fetchSanPham, fetchSanPhamDetail } from "@/services/sanPhamService";
import { createSlice } from "@reduxjs/toolkit";

const sanPhamSlice = createSlice({
  name: "sanPham",
  initialState: {
    status: "idle",
    data: [],
    dataDetail: null,
    dataDanhMuc: [],
    dataBanChay: [], // Luôn là mảng rỗng
    newDetail: null,
    error: null,
    loading: false, // Thêm loading state
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSanPham.pending, (state, action) => {
        state.status = "pending";
        state.loading = true;
      })
      .addCase(fetchSanPham.fulfilled, (state, action) => {
        state.status = "successfully";
        state.loading = false;
        // Đảm bảo data là mảng
        state.data = Array.isArray(action.payload?.data) ? action.payload.data : [];
      })
      .addCase(fetchSanPham.rejected, (state, action) => {
        state.status = "failed";
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(fetchDanhMuc.pending, (state, action) => {
        state.status = "pending";
        state.loading = true;
      })
      .addCase(fetchDanhMuc.fulfilled, (state, action) => {
        state.status = "successfully";
        state.loading = false;
        state.dataDanhMuc = Array.isArray(action.payload?.data) ? action.payload.data : [];
      })
      .addCase(fetchDanhMuc.rejected, (state, action) => {
        state.status = "failed";
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(fetchSanPhamDetail.pending, (state, action) => {
        state.status = "pending";
        state.loading = true;
      })
      .addCase(fetchSanPhamDetail.fulfilled, (state, action) => {
        state.status = "successfully";
        state.loading = false;
        state.dataDetail = action.payload?.data || null;
      })
      .addCase(fetchSanPhamDetail.rejected, (state, action) => {
        state.status = "failed";
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(fetchBanChay.pending, (state, action) => {
        state.status = "pending";
        state.loading = true;
        state.dataBanChay = []; // Reset về mảng rỗng khi bắt đầu fetch
      })
      .addCase(fetchBanChay.fulfilled, (state, action) => {
        state.status = "successfully";
        state.loading = false;
        
        // Xử lý nhiều trường hợp có thể xảy ra
        let dataArray = [];
        
        if (action.payload) {
          // Trường hợp 1: payload có trường data
          if (action.payload.data && Array.isArray(action.payload.data)) {
            dataArray = action.payload.data;
          } 
          // Trường hợp 2: payload là mảng trực tiếp
          else if (Array.isArray(action.payload)) {
            dataArray = action.payload;
          }
          // Trường hợp 3: payload là object có thể chứa mảng
          else if (typeof action.payload === 'object') {
            // Thử tìm các trường thông dụng
            if (Array.isArray(action.payload.content)) {
              dataArray = action.payload.content;
            } else if (Array.isArray(action.payload.items)) {
              dataArray = action.payload.items;
            } else if (Array.isArray(action.payload.results)) {
              dataArray = action.payload.results;
            } else if (Array.isArray(action.payload.list)) {
              dataArray = action.payload.list;
            }
          }
        }
        
        console.log("DataBanChay từ API:", dataArray);
        state.dataBanChay = dataArray;
      })
      .addCase(fetchBanChay.rejected, (state, action) => {
        state.status = "failed";
        state.loading = false;
        state.error = action.error.message;
        state.dataBanChay = []; // Đảm bảo vẫn là mảng rỗng khi có lỗi
      });
  },
});

export default sanPhamSlice.reducer;