import React from "react";
import ReactDOM from "react-dom/client";

import "./index.css";
import routers from "./routes/index.routes.jsx";
import store from "./redux/store/index.js";
import { RouterProvider } from "react-router-dom";
import { Provider } from "react-redux";
// ✅ Thêm 2 dòng này
import { ToastContainer } from "react-toastify";
import 'antd/dist/reset.css'; // CSS của Ant Design
import 'react-toastify/dist/ReactToastify.css'; 

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Provider store={store}>
      <RouterProvider router={routers} />

      {/* ✅ Thêm ToastContainer ở đây */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        pauseOnHover
        theme="colored"
      />
    </Provider>
  </React.StrictMode>



);
