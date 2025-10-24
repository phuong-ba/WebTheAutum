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

import User from "@/pages/user/User";
import AddProduct from "@/pages/product/AddProduct";
import Customer from "@/pages/customer/Customer";
import AddUser from "@/pages/user/AddUser";
import UpdateUser from "@/pages/user/UpdateUser";
import AddDiscount from "@/pages/discount/AddDiscount";
import ProductDetailPage from "@/pages/product/ProductDetailPage";
import MultiProductDetailPage from "@/pages/product/MultiProductDetailPage";
import DetailHoaDon from "@/pages/bill/DetailHoaDon";
import EditHoaDon from "@/pages/bill/EditHoaDon";

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
        path: "DetailHoaDon/:id",  // ⭐ THÊM ROUTE MỚI
        element: (
          <LazyLoad>
            <DetailHoaDon />
          </LazyLoad>
        ),
      },
       {
        path: "bill/edit/:id",  // ⭐ ROUTE SỬA HÓA ĐƠN
        element: (
          <LazyLoad>
            <EditHoaDon />
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
        path: "add-discount",
        element: (
          <LazyLoad>
            <AddDiscount />
          </LazyLoad>
        ),
      },
      {
        path: "update-discount",
        element: (
          <LazyLoad>
            <AddDiscount />
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
        path: "add-product",
        element: (
          <LazyLoad>
            <AddProduct />
          </LazyLoad>
        ),
      },
      {
        path: "detail-product/:id",
        element: (
          <LazyLoad>
            <ProductDetailPage />
          </LazyLoad>
        ),
      },
      {
        path: "detail-products/:ids",
        element: (
          <LazyLoad>
            <MultiProductDetailPage />
          </LazyLoad>
        ),
      },
      {
        path: "user",
        element: (
          <LazyLoad>
            <User />
          </LazyLoad>
        ),
      },
      {
        path: "add-user",
        element: (
          <LazyLoad>
            <AddUser />
          </LazyLoad>
        ),
      },
      {
        path: "update-user",
        element: (
          <LazyLoad>
            <UpdateUser />
          </LazyLoad>
        ),
      },
      {
        path: "customer",
        element: (
          <LazyLoad>
            <Customer />
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
