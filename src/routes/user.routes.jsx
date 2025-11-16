import MainCategory from "@/pages/home/main/MainCategory";
import CustomerLogin from "@/pages/auth/CustomerLogin"; // ⭐ ADD THIS
import { Spin } from "antd";
import React, { Suspense } from "react";

const UserLayout = React.lazy(() => import("@/layouts/user/UserLayout"));
const MainHome = React.lazy(() => import("@/pages/home/main/MainHome"));

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
        path: "/category",
        element: (
          <LazyLoad>
            <MainCategory />
          </LazyLoad>
        ),
      },
    ],
  },
  {
    path: "/customer/login",
    element: <CustomerLogin />,
  },
];

export default userRouters;