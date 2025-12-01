import { createBrowserRouter } from "react-router-dom";
import adminRouters from "./admin.routes";
import allRoutes from "./user.routes";
import CustomerDisplay from "../components/CustomerDisplay";


const routers = createBrowserRouter([
 // Route riêng cho màn hình iPad/Display tại quầy
 {
   path: "/display",
   element: <CustomerDisplay />,
 },
 ...allRoutes,
 ...adminRouters,
]);


export default routers;



