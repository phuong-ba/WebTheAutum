import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Space, Button, message } from "antd";
import { ExportOutlined, PrinterOutlined } from "@ant-design/icons";
import { toast } from "react-toastify";
import hoaDonApi from "../../api/HoaDonAPI";
import BillSearchFilter from "./BillSearchFilter";
import BillTable from "./BillTable";
import PromoBreadcrumb from "../promo/PromoBreadcrumb";
import BillBreadcrumb from "./BillBreadcrumb";

export default function InvoiceManager() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  // Filter states
  const [searchParams, setSearchParams] = useState({
    searchText: "",
  });

  const [filterParams, setFilterParams] = useState({
    trangThai: undefined,
    ngayTao: null,
    loaiHoaDon: undefined,
    hinhThucThanhToan: undefined,
  });

  const [currentFilters, setCurrentFilters] = useState({});

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async (page = 0, size = 5) => {
    try {
      setLoading(true);
      const response = await hoaDonApi.getAllHoaDon(page, size);
      setInvoices(response.data.content || []);
      setTotalItems(response.data.totalElements || 0);
    } catch (err) {
      message.error("Không thể tải danh sách hóa đơn");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    const hasSearchValue =
      searchParams.searchText.trim() !== "" ||
      filterParams.trangThai !== undefined ||
      filterParams.ngayTao !== null ||
      filterParams.loaiHoaDon !== undefined ||
      filterParams.hinhThucThanhToan !== undefined;
    if (!hasSearchValue) {
      toast.warning(
        "⚠️ Vui lòng nhập hoặc chọn ít nhất một điều kiện tìm kiếm!"
      );
      return;
    }
    const params = {
      ...searchParams,
      ...filterParams,
      ngayTao: filterParams.ngayTao
        ? filterParams.ngayTao.format("YYYY-MM-DD")
        : null,
    };
    try {
      setLoading(true);
      setCurrentPage(1);
      setCurrentFilters(params);
      const response = await hoaDonApi.searchAndFilter({
        ...params,
        page: 0,
        size: pageSize,
      });
      setInvoices(response.data.content || []);
      setTotalItems(response.data.totalElements || 0);
    } catch (err) {
      message.error("Không thể tìm kiếm");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSearchParams({ searchText: "" });
    setFilterParams({
      trangThai: undefined,
      ngayTao: null,
      loaiHoaDon: undefined,
      hinhThucThanhToan: undefined,
    });
    setCurrentFilters({});
    setCurrentPage(1);
    fetchInvoices(0, pageSize);
  };

  const handleExport = async () => {
    try {
      if (!invoices || invoices.length === 0) {
        toast.warning("⚠️ Không có dữ liệu để xuất!");
        return;
      }
      const loadingToastId = toast.loading("⏳ Đang xuất file Excel...");
      const response = await hoaDonApi.exportExcel();
      const blobData =
        response.data instanceof Blob
          ? response.data
          : new Blob([response.data], {
              type: response.headers["content-type"],
            });

      if (!blobData || blobData.size === 0) {
        toast.update(loadingToastId, {
          render: "❌ Server không trả về dữ liệu hợp lệ!",
          type: "error",
          isLoading: false,
          autoClose: 3000,
        });
        return;
      }
      const url = window.URL.createObjectURL(blobData);
      const a = document.createElement("a");
      a.href = url;
      a.download = `HoaDon_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.update(loadingToastId, {
        render: "✅ Xuất Excel thành công!",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
    } catch (err) {
      console.error("Export error:", err);
      toast.error("❌ Không thể xuất file Excel!");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = async () => {
    try {
      if (!invoices || invoices.length === 0) {
        toast.warning("⚠️ Không có hóa đơn để in!");
        return;
      }
      const loadingToast = toast.loading("⏳ Đang tạo file PDF...");
      setLoading(true);

      const invoiceIds = invoices.map((inv) => inv.id);
      const response = await hoaDonApi.printInvoices(invoiceIds);

      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      window.open(url, "_blank");

      setTimeout(() => window.URL.revokeObjectURL(url), 100);
      toast.update(loadingToast, {
        render: `✅ Đã in ${invoices.length} hóa đơn thành công!`,
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
    } catch (err) {
      console.error(err);
      toast.error("❌ Không thể in danh sách!");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (invoiceId, newStatus) => {
    const oldInvoices = [...invoices];
    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === invoiceId ? { ...inv, trangThai: newStatus } : inv
      )
    );

    try {
      await hoaDonApi.updateStatus(invoiceId, newStatus);
      message.success("Cập nhật trạng thái thành công!");
    } catch (err) {
      setInvoices(oldInvoices);
      message.error("Không thể cập nhật trạng thái!");
    }
  };

  const handleServiceChange = async (invoiceId, newService) => {
    const oldInvoices = [...invoices];
    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === invoiceId ? { ...inv, loaiHoaDon: newService } : inv
      )
    );

    try {
      await hoaDonApi.updateService(invoiceId, newService);
      message.success("Cập nhật dịch vụ thành công!");
    } catch (err) {
      setInvoices(oldInvoices);
      message.error("Không thể cập nhật dịch vụ!");
    }
  };

  const handleTableChange = (pagination) => {
    const page = pagination.current - 1;
    setCurrentPage(pagination.current);
    setPageSize(pagination.pageSize);

    if (Object.keys(currentFilters).length > 0) {
      handleSearch();
    } else {
      fetchInvoices(page, pagination.pageSize);
    }
  };

  const handleViewDetail = (invoiceId) => {
    navigate(`/admin/detail-bill/${invoiceId}`);
  };

  return (
    <div className="p-6 flex flex-col gap-5">
      <div className="bg-white flex flex-col gap-3 px-4 py-[20px] rounded-lg shadow overflow-hidden">
        <div className="font-bold text-4xl text-[#E67E22]">Quản lý hóa đơn</div>
        <BillBreadcrumb />
      </div>

      <BillSearchFilter
        searchParams={searchParams}
        setSearchParams={setSearchParams}
        filterParams={filterParams}
        setFilterParams={setFilterParams}
        onSearch={handleSearch}
        onReset={handleReset}
        handlePrint={handlePrint}
        handleExport={handleExport}
      />

      <div className="bg-white min-h-[500px] rounded-lg shadow overflow-hidden">
        <div className="flex justify-between items-center bg-[#E67E22] px-6 py-3 rounded-tl-lg rounded-tr-lg">
          <div className="text-white font-bold text-2xl">
            Danh sách hoá đơn
          </div>
        </div>
        <BillTable
          invoices={invoices}
          loading={loading}
          currentPage={currentPage}
          pageSize={pageSize}
          totalItems={totalItems}
          selectedRowKeys={selectedRowKeys}
          setSelectedRowKeys={setSelectedRowKeys}
          onTableChange={handleTableChange}
          onStatusChange={handleStatusChange}
          onServiceChange={handleServiceChange}
          onViewDetail={handleViewDetail}
        />
      </div>
    </div>
  );
}
