import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { 
  filterXuatXu, 
  addXuatXu, 
  updateXuatXu, 
  updateTrangThaiXuatXu,
  getXuatXuDetail 
} from "@/services/xuatXuService";

const initialState = {
  data: null,
  status: "idle",
  error: null,
  pagination: {
    current: 1,
    pageNo: 0,
    pageSize: 10,
    totalElements: 0,
    totalPages: 0,
  },
  advancedFilters: {
    searchText: "",
    maXuatXu: "",
    tenXuatXu: "",
    ngayTao: null,
    trangThai: undefined,
  },
};

// Async thunks
export const fetchFilterXuatXu = createAsyncThunk(
  "xuatxu/filter",
  async (params, { rejectWithValue }) => {
    try {
      const response = await filterXuatXu(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchAddXuatXu = createAsyncThunk(
  "xuatxu/add",
  async (data, { rejectWithValue }) => {
    try {
      const response = await addXuatXu(data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchUpdateTrangThai = createAsyncThunk(
  "xuatxu/updateStatus",
  async ({ id, trangThai }, { rejectWithValue }) => {
    try {
      const response = await updateTrangThaiXuatXu(id, trangThai);
      return { id, trangThai, ...response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const xuatXuSlice = createSlice({
  name: "xuatxu",
  initialState,
  reducers: {
    resetXuatXuState: (state) => {
      return initialState;
    },
    updatePagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    updateAdvancedFilters: (state, action) => {
      state.advancedFilters = { ...state.advancedFilters, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder
      // Filter
      .addCase(fetchFilterXuatXu.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchFilterXuatXu.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.data = action.payload;
        
        if (action.payload?.data) {
          state.pagination.totalElements = action.payload.totalElements || 0;
          state.pagination.totalPages = action.payload.totalPages || 0;
        }
      })
      .addCase(fetchFilterXuatXu.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      // Add
      .addCase(fetchAddXuatXu.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchAddXuatXu.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(fetchAddXuatXu.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      // Update status
      .addCase(fetchUpdateTrangThai.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchUpdateTrangThai.fulfilled, (state, action) => {
        state.status = "succeeded";
        // Cập nhật trạng thái trong danh sách
        if (state.data?.data && Array.isArray(state.data.data)) {
          const index = state.data.data.findIndex(item => item.id === action.payload.id);
          if (index !== -1) {
            state.data.data[index].trangThai = action.payload.trangThai;
          }
        }
      })
      .addCase(fetchUpdateTrangThai.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      });
  },
});

export const {
  resetXuatXuState,
  updatePagination,
  updateAdvancedFilters,
} = xuatXuSlice.actions;

export default xuatXuSlice.reducer;