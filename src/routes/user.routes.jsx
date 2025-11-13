import { Spin } from "antd";
import React, { Suspense } from "react";

const UserLayout = React.lazy(() => import("@/layouts/user/UserLayout"));
const MainHome = React.lazy(() => import("@/pages/home/main/MainHome"));
const Cart = React.lazy(() => import("@/components/Cart"));
const Checkout = React.lazy(() => import("@/components/Checkout"));
const OrderSuccess = React.lazy(() => import("@/components/OrderSuccess"));
const OrderHistory = React.lazy(() => import("@/components/OrderHistory"));
const OrderDetail = React.lazy(() => import("@/components/OrderDetail"));
const ProductDetail = React.lazy(() => import("@/pages/home/ProductDetail"));
const PaymentSuccess = React.lazy(() => import("@/components/PaymentSuccess"));
const PaymentFailed = React.lazy(() => import("@/components/PaymentFailed"))
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
        path: "cart", // Sẽ khớp với đường dẫn "/cart"
        element: (
          <LazyLoad>
            <Cart />
          </LazyLoad>
        ),
      },
      {
        path: "checkout", // Sẽ khớp với đường dẫn "/checkout"
        element: <LazyLoad><Checkout /></LazyLoad>,
      },
      {
        path: "order-success/:maHoaDon", 
        element: ( <LazyLoad> <OrderSuccess /> </LazyLoad> ),
      },

      {
        path: "/orders", // Sẽ khớp với "/profile/orders"
        element: ( <LazyLoad> <OrderHistory /> </LazyLoad> ),
      },
      {
        path: "/orders/:maHoaDon", 
        element: ( <LazyLoad> <OrderDetail /> </LazyLoad> ),
      },
      {
        path: "/product/:idSanPham", 
        element: ( <LazyLoad> <ProductDetail /> </LazyLoad> ),
      },
      {
        path: "/payment/success", 
        element: ( <LazyLoad> <PaymentSuccess  /> </LazyLoad> ),
      },
      {
        path: "/payment/failed", 
        element: ( <LazyLoad> <PaymentFailed  /> </LazyLoad> ),
      },
      
    ],
  },
];

export default userRouters;
