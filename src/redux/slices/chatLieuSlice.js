import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { 
  filterChatLieu, 
  addChatLieu, 
  updateChatLieu, 
  updateTrangThaiChatLieu,
  getChatLieuDetail 
} from "@/services/chatLieuService";

const initialState = {
  data: null,
  status: "idle", // "idle" | "loading" | "succeeded" | "failed"
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
    maChatLieu: "",
    tenChatLieu: "",
    ngayTao: null,
    trangThai: undefined,
  },
};

export const fetchFilterChatLieu = createAsyncThunk(
  "chatlieu/filter",
  async (params, { rejectWithValue }) => {
    try {
      const response = await filterChatLieu(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchAddChatLieu = createAsyncThunk(
  "chatlieu/add",
  async (data, { rejectWithValue }) => {
    try {
      const response = await addChatLieu(data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchUpdateChatLieu = createAsyncThunk(
  "chatlieu/update",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await updateChatLieu(id, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchUpdateTrangThai = createAsyncThunk(
  "chatlieu/updateStatus",
  async ({ id, trangThai }, { rejectWithValue }) => {
    try {
      const response = await updateTrangThaiChatLieu(id, trangThai);
      return { id, trangThai, ...response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchChatLieuDetail = createAsyncThunk(
  "chatlieu/detail",
  async (id, { rejectWithValue }) => {
    try {
      const response = await getChatLieuDetail(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const chatLieuSlice = createSlice({
  name: "chatlieu",
  initialState,
  reducers: {
    resetChatLieuState: (state) => {
      return initialState;
    },
    updatePagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    updateAdvancedFilters: (state, action) => {
      state.advancedFilters = { ...state.advancedFilters, ...action.payload };
    },
    setCurrentData: (state, action) => {
      state.data = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Filter
      .addCase(fetchFilterChatLieu.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchFilterChatLieu.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.data = action.payload;
        
        if (action.payload?.data) {
          state.pagination.totalElements = action.payload.totalElements || 0;
          state.pagination.totalPages = action.payload.totalPages || 0;
        }
      })
      .addCase(fetchFilterChatLieu.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      // Add
      .addCase(fetchAddChatLieu.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchAddChatLieu.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(fetchAddChatLieu.rejected, (state, action) => {
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
  resetChatLieuState,
  updatePagination,
  updateAdvancedFilters,
  setCurrentData,
} = chatLieuSlice.actions;

export default chatLieuSlice.reducer;