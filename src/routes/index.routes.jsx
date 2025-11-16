import { createBrowserRouter } from "react-router-dom";
import adminRouters from "./admin.routes";
import allRoutes from "./user.routes";

const routers = createBrowserRouter([...allRoutes, ...adminRouters]);

export default routers;
