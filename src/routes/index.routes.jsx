import { createBrowserRouter } from "react-router-dom";
import adminRouters from "./admin.routes";
import allRoutes from "./user.routes";

const routers = createBrowserRouter([
  // Route riêng cho màn hình iPad/Display tại quầy
  ...allRoutes,
  ...adminRouters,
]);

export default routers;
