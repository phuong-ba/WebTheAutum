import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { 
  filterHang, 
  addHang, 
  updateHang, 
  updateTrangThaiHang,
  getHangDetail 
} from "@/services/hangService";

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
    maNhaSanXuat: "",
    tenNhaSanXuat: "",
    ngayTao: null,
    trangThai: undefined,
  },
};

// Async thunks
export const fetchFilterHang = createAsyncThunk(
  "hang/filter",
  async (params, { rejectWithValue }) => {
    try {
      const response = await filterHang(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchAddHang = createAsyncThunk(
  "hang/add",
  async (data, { rejectWithValue }) => {
    try {
      const response = await addHang(data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchUpdateTrangThai = createAsyncThunk(
  "hang/updateStatus",
  async ({ id, trangThai }, { rejectWithValue }) => {
    try {
      const response = await updateTrangThaiHang(id, trangThai);
      return { id, trangThai, ...response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const hangSlice = createSlice({
  name: "hang",
  initialState,
  reducers: {
    resetHangState: (state) => {
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
      .addCase(fetchFilterHang.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchFilterHang.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.data = action.payload;
        
        if (action.payload?.data) {
          state.pagination.totalElements = action.payload.totalElements || 0;
          state.pagination.totalPages = action.payload.totalPages || 0;
        }
      })
      .addCase(fetchFilterHang.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      // Add
      .addCase(fetchAddHang.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchAddHang.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(fetchAddHang.rejected, (state, action) => {
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
  resetHangState,
  updatePagination,
  updateAdvancedFilters,
} = hangSlice.actions;

export default hangSlice.reducer;