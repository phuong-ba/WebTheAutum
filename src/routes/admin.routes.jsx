import React, { Suspense } from "react";
import { Spin } from "antd";
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import AdminLayout from "@/layouts/admin/AdminLayout";
import Statistical from "@/pages/statistical/Statistical";
import Sell from "@/pages/sell/Sell";
import Product from "@/pages/product/Product";
import Bill from "@/pages/bill/Bill";
import Category from "@/pages/category/Category";
import Collection from "@/pages/collection/Collection";
import Warehouse from "@/pages/warehouse/Warehouse";
import Discount from "@/pages/discount/Discount";
import Promo from "@/pages/promo/Promo";
<<<<<<< HEAD
import Exam from "@/pages/user/Exam";
=======
import User from "@/pages/user/User";
import AddProduct from "@/pages/product/AddProduct";
>>>>>>> ff5553e3896905d4358ef9d6866ad56f0d31aefc

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
const adminRouters = [
  {
    path: "/",
    element: <AdminLayout />,
    children: [
      {
        path: "product",
        element: (
          <LazyLoad>
            <Product />
          </LazyLoad>
        ),
      },
      {
        path: "bill",
        element: (
          <LazyLoad>
            <Bill />
          </LazyLoad>
        ),
      },
      {
        path: "sell",
        element: (
          <LazyLoad>
            <Sell />
          </LazyLoad>
        ),
      },
      {
        path: "statistical",
        element: (
          <LazyLoad>
            <Statistical />
          </LazyLoad>
        ),
      },
      {
        path: "category",
        element: (
          <LazyLoad>
            <Category />
          </LazyLoad>
        ),
      },
      {
        path: "collection",
        element: (
          <LazyLoad>
            <Collection />
          </LazyLoad>
        ),
      },
      {
        path: "warehouse",
        element: (
          <LazyLoad>
            <Warehouse />
          </LazyLoad>
        ),
      },
      {
        path: "discount",
        element: (
          <LazyLoad>
            <Discount />
          </LazyLoad>
        ),
      },
      {
        path: "promo",
        element: (
          <LazyLoad>
            <Promo />
          </LazyLoad>
        ),
      },
      {
<<<<<<< HEAD
        path: "user",
        element: (
          <LazyLoad>
            <Exam />
=======
        path: "add-product",
        element: (
          <LazyLoad>
            <AddProduct />
          </LazyLoad>
        ),
      },
      {
        path: "user",
        element: (
          <LazyLoad>
            <User />
>>>>>>> ff5553e3896905d4358ef9d6866ad56f0d31aefc
          </LazyLoad>
        ),
      },
    ],
  },
  {
    path: "/login",
    element: (
      <LazyLoad>
        <Login />
      </LazyLoad>
    ),
  },
  {
    path: "/register",
    element: (
      <LazyLoad>
        <Register />
      </LazyLoad>
    ),
  },
];

export default adminRouters;
