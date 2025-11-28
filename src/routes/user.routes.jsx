import OrderDetailOld from "@/components/OrderDetailOld";
import OrderHistory from "@/components/OrderHistory";
import OrderSuccess from "@/components/OrderSuccess";
import CustomerLogin from "@/pages/auth/CustomerLogin";
import { Spin } from "antd";
import React, { Suspense } from "react";

const UserLayout = React.lazy(() => import("@/layouts/user/UserLayout"));
const MainHome = React.lazy(() => import("@/pages/home/main/MainHome"));

const ProductAll = React.lazy(() =>
  import("@/pages/home/productDetail/ProductAll")
);
const CategoryAll = React.lazy(() =>
  import("@/pages/home/productDetail/CategoryAll")
);
const ProductDetail = React.lazy(() =>
  import("@/pages/home/productDetail/ProductDetail")
);
const YourBill = React.lazy(() => import("@/pages/home/order/YourBill"));
const CheckOut = React.lazy(() => import("@/pages/home/cart/CheckOut"));
const OrderDetail = React.lazy(() => import("@/pages/home/order/OrderDetail"));
const ViewCart = React.lazy(() => import("@/pages/home/cart/ViewCart"));
const Coupons = React.lazy(() => import("@/pages/home/coupons/Coupons"));
const contentStyle = {
  padding: 50,
  background: "rgba(0, 0, 0, 0.05)",
  borderRadius: 4,
};
const content = <div style={contentStyle} />;
const LazyLoad = ({ children }) => {
  return (
    <Suspense
      fallback={
        <Spin tip="Loading" size="large">
          {content}
        </Spin>
      }
    >
      {children}
    </Suspense>
  );
};
const userRouters = [
  {
    path: "/",
    element: <UserLayout />,
    children: [
      {
        index: true,
        element: (
          <LazyLoad>
            <MainHome />
          </LazyLoad>
        ),
      },
      {
        path: "product",
        element: (
          <LazyLoad>
            <ProductAll />
          </LazyLoad>
        ),
      },
      {
        path: "category",
        element: (
          <LazyLoad>
            <CategoryAll />
          </LazyLoad>
        ),
      },
      {
        path: "coupons",
        element: (
          <LazyLoad>
            <Coupons />
          </LazyLoad>
        ),
      },
      {
        path: "cart",
        element: (
          <LazyLoad>
            <ViewCart />
          </LazyLoad>
        ),
      },
      {
        path: "checkout",
        element: (
          <LazyLoad>
            <CheckOut />
          </LazyLoad>
        ),
      },
      {
        path: "productDetail/:id",
        element: (
          <LazyLoad>
            <ProductDetail />
          </LazyLoad>
        ),
      },
      {
        path: "your-bill",
        element: (
          <LazyLoad>
            <YourBill />
          </LazyLoad>
        ),
      },
      {
        path: "orders/:id",
        element: (
          <LazyLoad>
            <OrderDetail />
          </LazyLoad>
        ),
      },
      {
        path: "/customer/login",
        element: <CustomerLogin />,
      },
      {
        path: "order-success/:maHoaDon",
        element: (
          <LazyLoad>
            <OrderSuccess />
          </LazyLoad>
        ),
      },

      {
        path: "/orders", // Sẽ khớp với "/profile/orders"
        element: (
          <LazyLoad>
            <OrderHistory />
          </LazyLoad>
        ),
      },
      {
        path: "/ordersss/:maHoaDon",
        element: (
          <LazyLoad>
            <OrderDetailOld />
          </LazyLoad>
        ),
      },
    ],
  },
];

export default userRouters;
