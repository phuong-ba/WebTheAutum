import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { 
  filterTayAo, 
  addTayAo, 
  updateTayAo, 
  updateTrangThaiTayAo,
  getTayAoDetail 
} from "@/services/tayAoService";

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
    maTayAo: "",
    tenTayAo: "",
    ngayTao: null,
    trangThai: undefined,
  },
};

// Async thunks
export const fetchFilterTayAo = createAsyncThunk(
  "tayao/filter",
  async (params, { rejectWithValue }) => {
    try {
      const response = await filterTayAo(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchAddTayAo = createAsyncThunk(
  "tayao/add",
  async (data, { rejectWithValue }) => {
    try {
      const response = await addTayAo(data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchUpdateTrangThai = createAsyncThunk(
  "tayao/updateStatus",
  async ({ id, trangThai }, { rejectWithValue }) => {
    try {
      const response = await updateTrangThaiTayAo(id, trangThai);
      return { id, trangThai, ...response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const tayAoSlice = createSlice({
  name: "tayao",
  initialState,
  reducers: {
    resetTayAoState: (state) => {
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
      .addCase(fetchFilterTayAo.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchFilterTayAo.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.data = action.payload;
        
        if (action.payload?.data) {
          state.pagination.totalElements = action.payload.totalElements || 0;
          state.pagination.totalPages = action.payload.totalPages || 0;
        }
      })
      .addCase(fetchFilterTayAo.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      // Add
      .addCase(fetchAddTayAo.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchAddTayAo.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(fetchAddTayAo.rejected, (state, action) => {
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
  resetTayAoState,
  updatePagination,
  updateAdvancedFilters,
} = tayAoSlice.actions;

export default tayAoSlice.reducer;