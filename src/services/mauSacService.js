import baseUrl from "@/api/instance";
import { createAsyncThunk } from "@reduxjs/toolkit";

// ============ FILTER API (SỬ DỤNG /filter) ============
export const filterMauSac = createAsyncThunk(
  "mausac/filter",
  async (filterParams = {}, { rejectWithValue }) => {
    try {
      console.log("🔍 Filter colors API:", filterParams);
      
      // Build params cho API filter mới
      const params = {
        pageNo: filterParams.pageNo || 0,
        pageSize: filterParams.pageSize || 10,
      };
      
      // Thêm searchText (tìm trong cả mã, tên)
      if (filterParams.searchText !== undefined && filterParams.searchText !== null) {
        params.searchText = filterParams.searchText.toString().trim();
      }
      
      // Thêm mã màu sắc
      if (filterParams.maMauSac !== undefined && filterParams.maMauSac !== null) {
        params.maMauSac = filterParams.maMauSac.toString().trim();
      }
      
      // Thêm tên màu sắc
      if (filterParams.tenMauSac !== undefined && filterParams.tenMauSac !== null) {
        params.tenMauSac = filterParams.tenMauSac.toString().trim();
      }
      
      // Thêm ngày tạo (nếu có)
      if (filterParams.ngayTao !== undefined && filterParams.ngayTao !== null) {
        params.ngayTao = filterParams.ngayTao;
      }
      
      // Thêm trạng thái
      if (filterParams.trangThai !== undefined && filterParams.trangThai !== null) {
        params.trangThai = filterParams.trangThai;
      }
      
      console.log("📤 Calling /filter API with params:", params);
      
      // GỌI ENDPOINT FILTER MỚI
      const response = await baseUrl.get("mau-sac/filter", { params });
      
      console.log("✅ Filter response:", {
        hasData: !!response.data?.data?.data,
        dataLength: response.data?.data?.data?.length,
        totalElements: response.data?.data?.totalElements,
        pageNo: response.data?.data?.currentPage,
        pageSize: response.data?.data?.totalPages
      });
      
      return response.data;
      
    } catch (error) {
      console.error("❌ Filter error:", error);
      return rejectWithValue(
        error.response?.data || "Đã xảy ra lỗi khi lọc dữ liệu"
      );
    }
  }
);

// ============ SEARCH API CŨ (TƯƠNG THÍCH /search) ============
export const searchMauSac = createAsyncThunk(
  "mausac/search",
  async (searchParams = {}, { rejectWithValue }) => {
    try {
      console.log("🔍 Search API (tương thích cũ):", searchParams);
      
      // Build params cho API search cũ
      const params = {
        pageNo: searchParams.pageNo || 0,
        pageSize: searchParams.pageSize || 10,
      };
      
      // Thêm keyword (tương thích cũ)
      if (searchParams.keyword !== undefined && searchParams.keyword !== null) {
        params.keyword = searchParams.keyword.toString().trim();
      }
      
      // Thêm trạng thái
      if (searchParams.trangThai !== undefined && searchParams.trangThai !== null) {
        params.trangThai = searchParams.trangThai;
      }
      
      console.log("📤 Calling /search API with params:", params);
      
      // Vẫn gọi endpoint search cũ
      const response = await baseUrl.get("mau-sac/search", { params });
      
      console.log("✅ Search response:", {
        hasData: !!response.data?.data?.data,
        dataLength: response.data?.data?.data?.length,
        totalElements: response.data?.data?.totalElements,
      });
      
      return response.data;
      
    } catch (error) {
      console.error("❌ Search error:", error);
      return rejectWithValue(
        error.response?.data || "Đã xảy ra lỗi khi tìm kiếm"
      );
    }
  }
);

// ============ FETCH ALL (VỚI PHÂN TRANG) ============
export const fetchMauSac = createAsyncThunk(
  "mausac/fetchAll",
  async (params = {}, { rejectWithValue }) => {
    try {
      console.log("🔍 Fetch all colors with pagination:", params);
      
      const defaultParams = {
        pageNo: params.pageNo || 0,
        pageSize: params.pageSize || 10,
        keyword: params.keyword || "",
        trangThai: params.trangThai
      };
      
      console.log("📤 Fetch API params:", defaultParams);
      
      // Có thể gọi filter với params rỗng
      const response = await baseUrl.get("mau-sac/filter", { 
        params: { 
          pageNo: defaultParams.pageNo,
          pageSize: defaultParams.pageSize,
          searchText: "",
        }
      });
      
      console.log("✅ Fetch response:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Fetch error:", error);
      return rejectWithValue(
        error.response?.data || "Đã xảy ra lỗi khi lấy dữ liệu"
      );
    }
  }
);

// ============ CRUD OPERATIONS (GIỮ NGUYÊN) ============

// Add new color
export const addMauSac = createAsyncThunk(
  "mausac/add",
  async (mauSac, { rejectWithValue }) => {
    try {
      console.log("➕ Adding new color:", mauSac);
      const response = await baseUrl.post("mau-sac/add", mauSac);
      console.log("✅ Add response:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Add error:", error);
      return rejectWithValue(
        error.response?.data || "Đã xảy ra lỗi khi thêm màu sắc"
      );
    }
  }
);

// Update color
export const updateMauSac = createAsyncThunk(
  "mausac/update",
  async ({ id, mauSac }, { rejectWithValue }) => {
    try {
      console.log("✏️ Updating color ID:", id, "data:", mauSac);
      const response = await baseUrl.put(`mau-sac/update/${id}`, mauSac);
      console.log("✅ Update response:", response.data);
      return { id, ...mauSac, ...response.data };
    } catch (error) {
      console.error("❌ Update error:", error);
      return rejectWithValue(
        error.response?.data || "Đã xảy ra lỗi khi cập nhật"
      );
    }
  }
);

// Delete color
export const deleteMauSac = createAsyncThunk(
  "mausac/delete",
  async (id, { rejectWithValue }) => {
    try {
      console.log("🗑️ Deleting color ID:", id);
      await baseUrl.delete(`mau-sac/delete/${id}`);
      console.log("✅ Delete successful for ID:", id);
      return id;
    } catch (error) {
      console.error("❌ Delete error:", error);
      return rejectWithValue(
        error.response?.data || "Đã xảy ra lỗi khi xóa màu sắc"
      );
    }
  }
);

// Change status (active/inactive)
export const changeStatusMauSac = createAsyncThunk(
  "mausac/changeStatus",
  async ({ id, trangThai }, { rejectWithValue }) => {
    try {
      console.log("🔄 Changing status for color ID:", id, "to:", trangThai);
      
      const response = await baseUrl.put(
        `mau-sac/update-trang-thai/${id}`,
        null,
        {
          params: { trangThai }
        }
      );
      
      console.log("✅ Status change response:", response.data);
      
      return {
        id,
        trangThai,
        message: response.data?.message || "Cập nhật trạng thái thành công"
      };
      
    } catch (error) {
      console.error("❌ Status change error:", error);
      return rejectWithValue(
        error.response?.data || "Đã xảy ra lỗi khi thay đổi trạng thái"
      );
    }
  }
);