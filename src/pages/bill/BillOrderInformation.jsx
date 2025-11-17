import { DollarOutlined } from "@ant-design/icons";
import { Card, Alert, Spin } from "antd";
import React, { useState, useEffect } from "react";
import hoaDonApi from "../../api/HoaDonAPI";
import { useParams, useLocation } from "react-router-dom";

export default function BillOrderInformation() {
  const { id } = useParams();
  const location = useLocation();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchInvoiceDetail = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const response = await hoaDonApi.getDetail(id);
      let invoiceData = response.data?.data || response.data;
      if (!invoiceData || !invoiceData.id) {
        throw new Error("Dữ liệu hóa đơn không hợp lệ");
      }

      setInvoice(invoiceData);
      setError(null);
    } catch (err) {
      console.error("❌ Lỗi tải chi tiết hóa đơn:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoiceDetail();
  }, [id]);

  useEffect(() => {
    if (location.state?.refreshData) {
      fetchInvoiceDetail();
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [location.state?.refreshData]);

  const getStatusText = (status) => {
    const statusMap = {
      0: "Chờ xác nhận",
      1: "Chờ giao hàng",
      2: "Đang giao hàng",
      3: "Đã hoàn thành",
      4: "Đã hủy",
    };
    return statusMap[status] || `Trạng thái ${status}`;
  };

  const getInvoiceType = (loaiHoaDon) => {
    return loaiHoaDon ? "Tại quầy" : "Online";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return dateString.substring(0, 16).replace("T", " ");
    }
  };

  if (loading) {
    return (
      <Card
        title={
          <>
            <DollarOutlined /> Thông tin đơn hàng
          </>
        }
        style={{ height: "100%" }}
      >
        <div className="flex justify-center items-center h-32">
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card
        title={
          <>
            <DollarOutlined /> Thông tin đơn hàng
          </>
        }
        style={{ height: "100%" }}
      >
        <Alert message="Lỗi" description={error} type="error" showIcon />
      </Card>
    );
  }

  if (!invoice) {
    return (
      <Card
        title={
          <>
            <DollarOutlined /> Thông tin đơn hàng
          </>
        }
        style={{ height: "100%" }}
      >
        <Alert message="Không có dữ liệu hóa đơn" type="warning" showIcon />
      </Card>
    );
  }

  return (
    <Card
      title={
        <>
          <DollarOutlined /> Thông tin đơn hàng
        </>
      }
      style={{ height: "100%" }}
    >
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <div type="secondary">Mã đơn hàng:</div>
          <div className="font-bold text-sm">{invoice.maHoaDon}</div>
        </div>

        <div className="flex justify-between items-center">
          <div type="secondary">Loại đơn:</div>
          <div className="font-semibold text-xs border-2 border-emerald-600 px-2 py-1 rounded-full">
            {getInvoiceType(invoice.loaiHoaDon)}
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div type="secondary">Trạng thái:</div>
          <div
            className={`font-bold text-xs px-3 py-1 rounded-full flex items-center ${
              invoice.trangThai === 4
                ? "bg-red-500 text-white"
                : "bg-emerald-600 text-white"
            }`}
          >
            {getStatusText(invoice.trangThai)}
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div type="secondary">Phiếu giảm giá:</div>
          <div className="font-bold text-sm">
            {invoice.maGiamGia || "Không có"}
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div type="secondary">Ngày mua:</div>
          <div className="font-bold text-sm">{formatDate(invoice.ngayTao)}</div>
        </div>
      </div>
    </Card>
  );
}
