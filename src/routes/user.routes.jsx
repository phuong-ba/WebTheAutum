import OrderDetail from "@/components/OrderDetail";
import OrderHistory from "@/components/OrderHistory";
import PaymentFailed from "@/components/PaymentFailed";
import PaymentSuccess from "@/components/PaymentSuccess";
import CustomerLogin from "@/pages/auth/CustomerLogin";
import AllProducts from "@/pages/home/AllProducts";
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
const CheckOut = React.lazy(() => import("@/pages/home/cart/CheckOut"));
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
        path: "productdetail",
        element: (
          <LazyLoad>
            <ProductDetail />
          </LazyLoad>
        ),
      },
      {
        path: "/customer/login",
        element: <CustomerLogin />,
      },
      // {
      //   path: "cart", // Sẽ khớp với đường dẫn "/cart"
      //   element: (
      //     <LazyLoad>
      //       <Cart />
      //     </LazyLoad>
      //   ),
      // },
      // {
      //   path: "checkout", // Sẽ khớp với đường dẫn "/checkout"
      //   element: <LazyLoad><Checkout /></LazyLoad>,
      // },
      // {
      //   path: "order-success/:maHoaDon",
      //   element: ( <LazyLoad> <OrderSuccess /> </LazyLoad> ),
      // },

      {
        path: "/orders", // Sẽ khớp với "/profile/orders"
        element: (
          <LazyLoad>
            {" "}
            <OrderHistory />{" "}
          </LazyLoad>
        ),
      },
      {
        path: "/orders/:maHoaDon",
        element: (
          <LazyLoad>
            {" "}
            <OrderDetail />{" "}
          </LazyLoad>
        ),
      },
      {
        path: "/product/:idSanPham",
        element: (
          <LazyLoad>
            {" "}
            <ProductDetail />{" "}
          </LazyLoad>
        ),
      },
      {
        path: "/payment/success",
        element: (
          <LazyLoad>
            {" "}
            <PaymentSuccess />{" "}
          </LazyLoad>
        ),
      },
      {
        path: "/payment/failed",
        element: (
          <LazyLoad>
            {" "}
            <PaymentFailed />{" "}
          </LazyLoad>
        ),
      },
      {
        path: "/products",
        element: (
          <LazyLoad>
            {" "}
            <AllProducts />{" "}
          </LazyLoad>
        ),
      },
    ],
  },
];

export default userRouters;
