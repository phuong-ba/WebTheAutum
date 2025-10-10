
import { configureStore } from "@reduxjs/toolkit";

import nhanVienSlice from "../slices/nhanVienSlice";
import chucvuSlice from "../slices/chucVuSlice";
const store = configureStore({
    reducer: {
        nhanvien: nhanVienSlice,
        chucvu: chucvuSlice,
    }

})

export default store;
