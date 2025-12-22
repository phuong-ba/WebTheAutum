import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { 
  filterCoAo, 
  addCoAo, 
  updateCoAo, 
  updateTrangThaiCoAo,
  getCoAoDetail 
} from "@/services/coAoService";

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
    maCoAo: "",
    tenCoAo: "",
    ngayTao: null,
    trangThai: undefined,
  },
};

// Async thunks
export const fetchFilterCoAo = createAsyncThunk(
  "coao/filter",
  async (params, { rejectWithValue }) => {
    try {
      const response = await filterCoAo(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchAddCoAo = createAsyncThunk(
  "coao/add",
  async (data, { rejectWithValue }) => {
    try {
      const response = await addCoAo(data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchUpdateTrangThai = createAsyncThunk(
  "coao/updateStatus",
  async ({ id, trangThai }, { rejectWithValue }) => {
    try {
      const response = await updateTrangThaiCoAo(id, trangThai);
      return { id, trangThai, ...response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const coAoSlice = createSlice({
  name: "coao",
  initialState,
  reducers: {
    resetCoAoState: (state) => {
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
      .addCase(fetchFilterCoAo.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchFilterCoAo.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.data = action.payload;
        
        if (action.payload?.data) {
          state.pagination.totalElements = action.payload.totalElements || 0;
          state.pagination.totalPages = action.payload.totalPages || 0;
        }
      })
      .addCase(fetchFilterCoAo.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      // Add
      .addCase(fetchAddCoAo.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchAddCoAo.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(fetchAddCoAo.rejected, (state, action) => {
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
  resetCoAoState,
  updatePagination,
  updateAdvancedFilters,
} = coAoSlice.actions;

export default coAoSlice.reducer;