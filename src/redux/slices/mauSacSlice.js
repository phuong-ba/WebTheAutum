import {
  filterMauSac,
  searchMauSac,
  fetchMauSac,
  addMauSac,
  updateMauSac,
  deleteMauSac,
  changeStatusMauSac,
} from "@/services/mauSacService";
import { createSlice } from "@reduxjs/toolkit";

const mauSacSlice = createSlice({
  name: "mausac",
  initialState: {
    status: "idle", // idle, loading, success, failed
    data: [],
    // Pagination info
    pagination: {
      current: 1,
      pageSize: 10,
      total: 0,
      totalElements: 0,
      totalPages: 0,
      pageNo: 0,
    },
    // Search filters (tương thích cũ)
    filters: {
      keyword: "",
      trangThai: undefined,
    },
    // Filter mới (cho filter đầy đủ)
    advancedFilters: {
      searchText: "",
      maMauSac: "",
      tenMauSac: "",
      ngayTao: null,
      trangThai: undefined,
    },
    newDetail: null,
    error: null,
  },
  reducers: {
    // Reset state về ban đầu
    resetMauSacState: (state) => {
      state.status = "idle";
      state.data = [];
      state.pagination = {
        current: 1,
        pageSize: 10,
        total: 0,
        totalElements: 0,
        totalPages: 0,
        pageNo: 0,
      };
      state.filters = {
        keyword: "",
        trangThai: undefined,
      };
      state.advancedFilters = {
        searchText: "",
        maMauSac: "",
        tenMauSac: "",
        ngayTao: null,
        trangThai: undefined,
      };
      state.error = null;
    },
    // Xóa lỗi
    clearError: (state) => {
      state.error = null;
    },
    // Cập nhật filters cũ (cho search đơn giản)
    updateFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    // Cập nhật advanced filters (cho filter đầy đủ)
    updateAdvancedFilters: (state, action) => {
      state.advancedFilters = { ...state.advancedFilters, ...action.payload };
    },
    // Cập nhật pagination
    updatePagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    // Manual update item
    updateItemInState: (state, action) => {
      const { id, updates } = action.payload;
      const index = state.data.findIndex(item => item.id === id);
      if (index !== -1) {
        state.data[index] = { ...state.data[index], ...updates };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // ===== FILTER (API /filter mới) =====
      .addCase(filterMauSac.pending, (state) => {
        console.log("⏳ Filter pending...");
        state.status = "loading";
        state.error = null;
      })
      .addCase(filterMauSac.fulfilled, (state, action) => {
        console.log("✅ Filter fulfilled");
        state.status = "success";
        handlePageableResponse(state, action.payload);
      })
      .addCase(filterMauSac.rejected, (state, action) => {
        console.error("❌ Filter rejected:", action.payload);
        state.status = "failed";
        state.error = action.payload || action.error.message;
      })

      // ===== SEARCH (API /search cũ) =====
      .addCase(searchMauSac.pending, (state) => {
        console.log("⏳ Search pending...");
        state.status = "loading";
        state.error = null;
      })
      .addCase(searchMauSac.fulfilled, (state, action) => {
        console.log("✅ Search fulfilled");
        state.status = "success";
        handlePageableResponse(state, action.payload);
      })
      .addCase(searchMauSac.rejected, (state, action) => {
        console.error("❌ Search rejected:", action.payload);
        state.status = "failed";
        state.error = action.payload || action.error.message;
      })

      // ===== FETCH ALL =====
      .addCase(fetchMauSac.pending, (state) => {
        console.log("⏳ Fetch pending...");
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchMauSac.fulfilled, (state, action) => {
        console.log("✅ Fetch fulfilled");
        state.status = "success";
        handlePageableResponse(state, action.payload);
      })
      .addCase(fetchMauSac.rejected, (state, action) => {
        console.error("❌ Fetch rejected:", action.payload);
        state.status = "failed";
        state.error = action.payload || action.error.message;
      })

      // ===== ADD =====
      .addCase(addMauSac.pending, (state) => {
        console.log("⏳ Add pending...");
        state.status = "loading";
        state.error = null;
      })
      .addCase(addMauSac.fulfilled, (state, action) => {
        console.log("✅ Add fulfilled");
        state.status = "success";
        state.newDetail = action.payload;
      })
      .addCase(addMauSac.rejected, (state, action) => {
        console.error("❌ Add rejected:", action.payload);
        state.status = "failed";
        state.error = action.payload || action.error.message;
      })

      // ===== UPDATE =====
      .addCase(updateMauSac.pending, (state) => {
        console.log("⏳ Update pending...");
        state.status = "loading";
        state.error = null;
      })
      .addCase(updateMauSac.fulfilled, (state, action) => {
        console.log("✅ Update fulfilled");
        state.status = "success";
        const { id, ...updates } = action.payload;
        const index = state.data.findIndex(item => item.id === id);
        if (index !== -1) {
          state.data[index] = { ...state.data[index], ...updates };
        }
      })
      .addCase(updateMauSac.rejected, (state, action) => {
        console.error("❌ Update rejected:", action.payload);
        state.status = "failed";
        state.error = action.payload || action.error.message;
      })

      // ===== DELETE =====
      .addCase(deleteMauSac.pending, (state) => {
        console.log("⏳ Delete pending...");
        state.status = "loading";
        state.error = null;
      })
      .addCase(deleteMauSac.fulfilled, (state, action) => {
        console.log("✅ Delete fulfilled");
        state.status = "success";
        state.data = state.data.filter(item => item.id !== action.payload);
        state.pagination.totalElements = state.data.length;
        state.pagination.total = state.data.length;
      })
      .addCase(deleteMauSac.rejected, (state, action) => {
        console.error("❌ Delete rejected:", action.payload);
        state.status = "failed";
        state.error = action.payload || action.error.message;
      })

      // ===== CHANGE STATUS =====
      .addCase(changeStatusMauSac.pending, (state) => {
        console.log("⏳ Change status pending...");
        state.status = "loading";
        state.error = null;
      })
      .addCase(changeStatusMauSac.fulfilled, (state, action) => {
        console.log("✅ Change status fulfilled");
        state.status = "success";
        const { id, trangThai } = action.payload;
        const index = state.data.findIndex(item => item.id === id);
        if (index !== -1) {
          state.data[index].trangThai = trangThai;
        }
      })
      .addCase(changeStatusMauSac.rejected, (state, action) => {
        console.error("❌ Change status rejected:", action.payload);
        state.status = "failed";
        state.error = action.payload || action.error.message;
      });
  },
});

// Helper function để xử lý PageableObject response
const handlePageableResponse = (state, payload) => {
  if (!payload) {
    state.data = [];
    state.pagination.totalElements = 0;
    return;
  }
  
  console.log("📦 Processing response payload:", {
    data: payload.data,
    isDataObject: typeof payload.data === 'object',
    dataData: payload.data?.data,
    dataContent: payload.data?.content
  });
  
  // Case 1: ResponseObject chứa PageableObject
  if (payload.data && payload.data.data && Array.isArray(payload.data.data)) {
    state.data = payload.data.data;
    state.pagination = {
      current: (payload.data.currentPage || 0) + 1, // 0-based → 1-based
      pageSize: 10, // Mặc định hoặc lấy từ BE
      total: payload.data.totalElements || 0,
      totalElements: payload.data.totalElements || 0,
      totalPages: payload.data.totalPage || 0,
      pageNo: payload.data.currentPage || 0,
    };
  }
  // Case 2: Direct PageableObject
  else if (payload.data && Array.isArray(payload.data)) {
    state.data = payload.data;
    state.pagination.totalElements = payload.totalElements || state.data.length;
    state.pagination.total = payload.totalElements || state.data.length;
    if (payload.pageNo !== undefined) {
      state.pagination.current = payload.pageNo + 1;
      state.pagination.pageNo = payload.pageNo;
    }
    if (payload.pageSize !== undefined) {
      state.pagination.pageSize = payload.pageSize;
    }
  }
  // Case 3: Direct array
  else if (Array.isArray(payload)) {
    state.data = payload;
    state.pagination.totalElements = payload.length;
    state.pagination.total = payload.length;
  }
  // Case 4: Other structure
  else {
    console.warn("⚠️ Unknown response structure:", payload);
    state.data = [];
    state.pagination.totalElements = 0;
  }
  
  console.log("📊 Final state:", {
    dataLength: state.data.length,
    pagination: state.pagination
  });
};

// EXPORT SYNC ACTIONS
export const { 
  resetMauSacState, 
  clearError, 
  updateFilters,
  updateAdvancedFilters, // Thêm mới
  updatePagination,
  updateItemInState 
} = mauSacSlice.actions;

// EXPORT REDUCER
export default mauSacSlice.reducer;