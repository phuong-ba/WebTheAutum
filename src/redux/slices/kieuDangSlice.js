import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { 
  filterKieuDang, 
  addKieuDang, 
  updateKieuDang, 
  updateTrangThaiKieuDang,
  getKieuDangDetail 
} from "@/services/kieuDangService";

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
    maKieuDang: "",
    tenKieuDang: "",
    ngayTao: null,
    trangThai: undefined,
  },
};

// Async thunks
export const fetchFilterKieuDang = createAsyncThunk(
  "kieudang/filter",
  async (params, { rejectWithValue }) => {
    try {
      const response = await filterKieuDang(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchAddKieuDang = createAsyncThunk(
  "kieudang/add",
  async (data, { rejectWithValue }) => {
    try {
      const response = await addKieuDang(data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchUpdateTrangThai = createAsyncThunk(
  "kieudang/updateStatus",
  async ({ id, trangThai }, { rejectWithValue }) => {
    try {
      const response = await updateTrangThaiKieuDang(id, trangThai);
      return { id, trangThai, ...response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const kieuDangSlice = createSlice({
  name: "kieudang",
  initialState,
  reducers: {
    resetKieuDangState: (state) => {
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
      .addCase(fetchFilterKieuDang.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchFilterKieuDang.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.data = action.payload;
        
        if (action.payload?.data) {
          state.pagination.totalElements = action.payload.totalElements || 0;
          state.pagination.totalPages = action.payload.totalPages || 0;
        }
      })
      .addCase(fetchFilterKieuDang.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      // Add
      .addCase(fetchAddKieuDang.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchAddKieuDang.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(fetchAddKieuDang.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      // Update status
      .addCase(fetchUpdateTrangThai.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchUpdateTrangThai.fulfilled, (state, action) => {
        state.status = "succeeded";
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
  resetKieuDangState,
  updatePagination,
  updateAdvancedFilters,
} = kieuDangSlice.actions;

export default kieuDangSlice.reducer;