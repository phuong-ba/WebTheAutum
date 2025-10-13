


import { fetchNhanVien } from "@/services/nhanVienService";
import { createSlice } from "@reduxjs/toolkit";

const nhanVienSlice = createSlice({
    name: "nhanvien",
    initialState: {
        status: "idle",
        data: [],
        totalElement: 0,
        number: 0,
        size: 4,
        newDetail: null,
        error: null,
    },
    reducers: {
        changePage: (state, action) => {
            console.log(action.payload)
            state.number = action.payload
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchNhanVien.pending, (state, action) => {
                state.status = "pending";
            })
            .addCase(fetchNhanVien.fulfilled, (state, action) => {
                state.status = "successfully";
                state.data = action.payload.data || [];
                state.totalElement = action.payload.totalElements;
                state.number = action.payload.number;
                state.size = action.payload.size;
            })
            .addCase(fetchNhanVien.rejected, (state, action) => {
                state.status = "failed";
                state.error = action.error.message;
            })
    }
})
export const { changePage } = nhanVienSlice.actions;
export default nhanVienSlice.reducer;