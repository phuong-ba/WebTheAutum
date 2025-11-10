import { createBrowserRouter } from "react-router-dom";
import adminRouters from "./admin.routes";
import userRouters from "./user.routes";

const routers = createBrowserRouter([...adminRouters, ...userRouters]);

export default routers;