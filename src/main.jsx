import React from "react";
import ReactDOM from "react-dom/client";


import "./index.css";
import routers from "./routes/index.routes.jsx";
import store from "./redux/store/index.js";
import { RouterProvider } from "react-router-dom";
import { Provider } from "react-redux";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Provider store={store}>
      <RouterProvider router={routers} />
    </Provider>
  </React.StrictMode>
);
