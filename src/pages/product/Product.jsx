import FliterProduct from "./FliterProduct";
import React, { useEffect, useState } from "react";
import { Space, Table, Tag, message, Modal, Button } from "antd";
import { useDispatch, useSelector } from "react-redux";
import {
  ToggleLeftIcon,
  ToggleRightIcon,
  PencilLineIcon,
  EyeIcon,
} from "@phosphor-icons/react";
import { useNavigate } from "react-router";
import baseUrl from "@/api/instance";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export default function Product() {
  const { data } = useSelector((state) => state.nhanvien || {});
  const dispatch = useDispatch();
  const [statusLoading, setStatusLoading] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [messageApi, messageContextHolder] = message.useMessage();
  const [modal, contextHolder] = Modal.useModal();
  const [exportLoading, setExportLoading] = useState(false);

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 5,
    total: 0,
  });

  const [filteredData, setFilteredData] = useState(null);
  const [currentFilters, setCurrentFilters] = useState({});

  const navigate = useNavigate();

  const changeStatusSanPham = async ({ id, trangThai }) => {
    try {
      console.log(
        "🟡 Calling API:",
        `san-pham/update-trang-thai/${id}?trangThai=${trangThai}`
      );
      const response = await baseUrl.put(
        `san-pham/update-trang-thai/${id}?trangThai=${trangThai}`
      );
      console.log("✅ API Response:", response.data);

      if (
        response.data &&
        response.data.message === "Cập nhập trạng thái thành công"
      ) {
        return { success: true, message: response.data.message };
      }

      return response.data;
    } catch (error) {
      console.error("❌ API Error:", error);
      throw error;
    }
  };

  const handleEditProduct = (record) => {
    navigate(`/admin/edit-product/${record.id}`);
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys, selectedRows) => {
      setSelectedRowKeys(newSelectedRowKeys);
      setSelectedRows(selectedRows);
    },
    type: "checkbox",
  };

  const formatPrice = (price) => {
    if (!price) return "0₫";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const handleExportExcel = async () => {
    const dataToExport = filteredData || products;

    if (!dataToExport || dataToExport.length === 0) {
      messageApi.warning("Không có dữ liệu để xuất Excel");
      return;
    }

    setExportLoading(true);
    try {
      console.log("📊 Bắt đầu xuất Excel...");

      const excelData = dataToExport.map((product, index) => ({
        STT: index + 1,
        "Mã sản phẩm": product.maSanPham || "",
        "Tên sản phẩm": product.tenSanPham || "",
        Hãng: product.tenNhaSanXuat || "",
        "Kiểu dáng": product.tenKieuDang || "",
        "Chất liệu": product.tenChatLieu || "",
        "Xuất xứ": product.tenXuatXu || "",
        "Số lượng": product.tongSoLuong || 0,
        "Giá thấp nhất": formatPriceForExcel(product.giaThapNhat),
        "Giá cao nhất": formatPriceForExcel(product.giaCaoNhat),
        "Trạng thái": product.trangThai ? "Đang hoạt động" : "Ngừng hoạt động",
        "Ngày tạo": formatDate(product.ngayTao),
        "Ngày sửa": formatDate(product.ngaySua),
      }));

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(excelData);

      const columnWidths = [
        { wch: 5 },
        { wch: 12 },
        { wch: 30 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 10 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
      ];
      worksheet["!cols"] = columnWidths;

      XLSX.utils.book_append_sheet(workbook, worksheet, "Danh sách sản phẩm");

      const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });

      const dataBlob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const timestamp = new Date().getTime();
      const fileName = `danh-sach-san-pham-${timestamp}.xlsx`;

      saveAs(dataBlob, fileName);

      console.log("✅ Xuất Excel thành công:", fileName);
      messageApi.success(
        `Đã xuất file Excel thành công! (${dataToExport.length} sản phẩm)`
      );
    } catch (error) {
      console.error("❌ Lỗi xuất Excel:", error);
      messageApi.error("Lỗi khi xuất file Excel: " + error.message);
    } finally {
      setExportLoading(false);
    }
  };

  const formatPriceForExcel = (price) => {
    if (!price) return "0 ₫";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    try {
      return new Date(dateString).toLocaleDateString("vi-VN");
    } catch (error) {
      return "";
    }
  };

  const fetchProducts = async (pageNo = 0, pageSize = 5, filters = {}) => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();

      queryParams.append("pageNo1", pageNo);
      queryParams.append("pageSize1", pageSize);

      Object.keys(filters).forEach((key) => {
        if (
          filters[key] !== undefined &&
          filters[key] !== null &&
          filters[key] !== ""
        ) {
          queryParams.append(key, filters[key]);
        }
      });

      console.log(
        "🔍 FILTER REQUEST:",
        `san-pham/filter?${queryParams.toString()}`
      );

      const response = await baseUrl.get(
        `san-pham/filter?${queryParams.toString()}`
      );

      console.log("📦 FILTER RESPONSE:", response.data);

      let resultData = [];
      let totalItems = 0;

      if (response.data && response.data.data) {
        const responseData = response.data.data;

        if (responseData.data && Array.isArray(responseData.data)) {
          resultData = responseData.data;
          totalItems =
            responseData.totalElements || responseData.totalPage * pageSize;
          console.log("✅ Filter PageableObject:", {
            items: resultData.length,
            totalPage: responseData.totalPage,
            currentPage: responseData.currentPage,
            totalElements: responseData.totalElements,
            calculatedTotal: totalItems,
          });
        } else if (Array.isArray(responseData)) {
          resultData = responseData;
          totalItems = resultData.length;
          console.log("✅ Filter Array:", resultData.length);
        }
      }

      console.log("✅ PROCESSED FILTER DATA:", {
        isArray: Array.isArray(resultData),
        length: resultData.length,
        totalItems: totalItems,
        data: resultData.slice(0, 3),
      });

      if (!Array.isArray(resultData)) {
        console.error("🔴 Data không phải array:", resultData);
        messageApi.error("Dữ liệu trả về không đúng định dạng");
        resultData = [];
      }

      setProducts(resultData);
      setCurrentFilters(filters);

      if (Object.keys(filters).length > 0) {
        setFilteredData(resultData);
      } else {
        setFilteredData(null);
      }

      setPagination({
        current: pageNo + 1,
        pageSize: pageSize,
        total: totalItems,
      });

      if (resultData.length > 0) {
        messageApi.success(`Tìm thấy ${totalItems} sản phẩm`);
      } else {
        messageApi.info("Không tìm thấy sản phẩm phù hợp");
      }
    } catch (error) {
      console.error("💥 FILTER ERROR:", error);
      messageApi.error(
        "Lỗi tìm kiếm sản phẩm: " +
          (error.response?.data?.message || error.message)
      );
      setProducts([]);
      setFilteredData(null);
      setPagination((prev) => ({ ...prev, total: 0 }));
    } finally {
      setLoading(false);
    }
  };

  const handleChangeStatus = (record) => {
    if (!record?.id) {
      return messageApi.error("Thông tin sản phẩm không hợp lệ");
    }

    const action = record.trangThai ? "Kết thúc" : "Kích hoạt";
    const newStatus = !record.trangThai;

    modal.confirm({
      title: `Xác nhận ${action}`,
      content: `Bạn có chắc muốn ${action.toLowerCase()} "${
        record.tenSanPham
      }"?`,
      okText: action,
      cancelText: "Hủy",
      async onOk() {
        setStatusLoading(record.id);
        const originalStatus = record.trangThai;

        setProducts((prev) =>
          prev.map((item) =>
            item.id === record.id ? { ...item, trangThai: newStatus } : item
          )
        );

        try {
          const result = await changeStatusSanPham({
            id: record.id,
            trangThai: newStatus,
          });

          const isSuccess =
            result?.success === true || result?.message?.includes("thành công");

          if (isSuccess) {
            messageApi.success(`${action} thành công!`);
            if (Object.keys(currentFilters).length > 0) {
              fetchProducts(
                pagination.current - 1,
                pagination.pageSize,
                currentFilters
              );
            } else {
              fetchProductsWithPaging(
                pagination.current - 1,
                pagination.pageSize
              );
            }
          } else {
            setProducts((prev) =>
              prev.map((item) =>
                item.id === record.id
                  ? { ...item, trangThai: originalStatus }
                  : item
              )
            );
            messageApi.error(result?.message || "Cập nhật trạng thái thất bại");
          }
        } catch (err) {
          console.error("🔴 Lỗi API:", err);
          setProducts((prev) =>
            prev.map((item) =>
              item.id === record.id
                ? { ...item, trangThai: originalStatus }
                : item
            )
          );
          messageApi.error(err.response?.data?.message || "Có lỗi xảy ra");
        } finally {
          setStatusLoading(null);
        }
      },
    });
  };

  const fetchProductsWithPaging = async (pageNo = 0, pageSize = 5) => {
    setLoading(true);
    try {
      console.log("📄 Loading products with paging:", { pageNo, pageSize });

      const response = await baseUrl.get(
        `san-pham/playlist/paging?pageNo1=${pageNo}&pageSize1=${pageSize}`
      );

      console.log("📦 PAGING RESPONSE:", response.data);

      let productsData = [];
      let totalItems = 0;

      if (response.data && response.data.data) {
        const responseData = response.data.data;

        if (responseData.data && Array.isArray(responseData.data)) {
          productsData = responseData.data;
          totalItems =
            responseData.totalElements || responseData.totalPage * pageSize;
          console.log("✅ Case PageableObject:", {
            items: productsData.length,
            totalPage: responseData.totalPage,
            currentPage: responseData.currentPage,
            totalElements: responseData.totalElements,
            calculatedTotal: totalItems,
          });
        } else if (Array.isArray(responseData)) {
          productsData = responseData;
          totalItems = productsData.length;
          console.log("✅ Case Array:", productsData.length);
        }
      }

      console.log("✅ FINAL PROCESSED DATA:", {
        productsCount: productsData.length,
        totalItems: totalItems,
        sample: productsData.slice(0, 2),
      });

      setFilteredData(null);
      setCurrentFilters({});
      setProducts(productsData);
      setPagination({
        current: pageNo + 1,
        pageSize: pageSize,
        total: totalItems,
      });
    } catch (error) {
      console.error("❌ Lỗi tải sản phẩm:", error);
      messageApi.error(
        error.response?.data?.message || "Lỗi tải danh sách sản phẩm"
      );
      setProducts([]);
      setPagination((prev) => ({ ...prev, total: 0 }));
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = (filterValues) => {
    console.log("🎯 Filter raw:", filterValues);

    const cleanedFilters = Object.keys(filterValues).reduce((acc, key) => {
      const value = filterValues[key];
      if (value !== undefined && value !== null && value !== "") {
        acc[key] = value;
      }
      return acc;
    }, {});

    console.log("✅ Filter cleaned:", cleanedFilters);

    fetchProducts(0, pagination.pageSize, cleanedFilters);
  };

  const handleViewMultipleDetails = () => {
    if (selectedRowKeys.length === 0) {
      messageApi.warning("Vui lòng chọn ít nhất 1 sản phẩm để xem chi tiết");
      return;
    }
    if (selectedRowKeys.length > 10) {
      messageApi.warning("Chỉ có thể xem tối đa 10 sản phẩm cùng lúc");
      return;
    }
    navigate(`/admin/detail-products/${selectedRowKeys.join(",")}`);
  };

  useEffect(() => {
    console.log("🚀 Product Component Mounted");
    fetchProductsWithPaging(0, pagination.pageSize);
  }, []);

  const totalProducts = pagination.total || 0;
  const dataForStats = products || [];
  const totalQuantity = dataForStats.reduce(
    (sum, p) => sum + (Number(p.tongSoLuong) || 0),
    0
  );
  const activeProducts = dataForStats.filter((p) =>
    Boolean(p.trangThai)
  ).length;

  const columns = [
    {
      title: "STT",
      key: "stt",
      render: (_, __, index) => {
        const currentPage = Number(pagination.current) || 1;
        const pageSize = Number(pagination.pageSize) || 5;
        const stt = (currentPage - 1) * pageSize + index + 1;

        return (
          <div className="flex items-center justify-center">
            <span className="text-gray-600">
              {String(Math.max(1, stt)).padStart(2, "0")}
            </span>
          </div>
        );
      },
      width: 70,
      align: "center",
    },
    {
      title: "TÊN SẢN PHẨM",
      dataIndex: "tenSanPham",
      key: "tenSanPham",
      render: (text) => (
        <span className="font-medium text-gray-900">{text || "N/A"}</span>
      ),
    },
    {
      title: "MÃ SẢN PHẨM",
      dataIndex: "maSanPham",
      key: "maSanPham",
      render: (text) => <Tag color="blue">{text || "N/A"}</Tag>,
    },
    {
      title: "HÃNG",
      dataIndex: "tenNhaSanXuat",
      key: "tenNhaSanXuat",
      align: "center",
      render: (text) => text || "N/A",
    },
    {
      title: "KIỂU DÁNG",
      dataIndex: "tenKieuDang",
      key: "tenKieuDang",
      align: "center",
      render: (text) => text || "N/A",
    },
    {
      title: "CHẤT LIỆU",
      dataIndex: "tenChatLieu",
      key: "tenChatLieu",
      align: "center",
      render: (text) => text || "N/A",
    },
    {
      title: "XUẤT XỨ",
      dataIndex: "tenXuatXu",
      key: "tenXuatXu",
      align: "center",
      render: (text) => text || "N/A",
    },
    {
      title: "SỐ LƯỢNG",
      dataIndex: "tongSoLuong",
      key: "tongSoLuong",
      align: "center",
      width: 120,
      render: (quantity, record) => {
        const qty = Number(quantity) || 0;
        return (
          <div className="text-center">
            <span
              className={`font-bold text-lg ${
                qty === 0
                  ? "text-red-500"
                  : qty < 10
                  ? "text-orange-500"
                  : "text-green-500"
              }`}
            >
              {qty}
            </span>
            {record.chiTietSanPhams && (
              <div className="text-xs text-gray-400 mt-1">
                {record.chiTietSanPhams.length} biến thể
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: "KHOẢNG GIÁ",
      key: "khoangGia",
      align: "center",
      width: 200,
      render: (_, record) => {
        if (!record.giaThapNhat && !record.giaCaoNhat) {
          return <span className="text-gray-400 text-sm">Chưa có giá</span>;
        }
        if (record.giaThapNhat === record.giaCaoNhat) {
          return (
            <div className="text-center">
              <span className="font-bold text-[#E67E22] text-lg">
                {formatPrice(record.giaThapNhat)}
              </span>
            </div>
          );
        }
        return (
          <div className="text-center">
            <div className="font-semibold text-green-600">
              {formatPrice(record.giaThapNhat)}
            </div>
            <div className="text-gray-400 text-xs">─</div>
            <div className="font-semibold text-green-600">
              {formatPrice(record.giaCaoNhat)}
            </div>
          </div>
        );
      },
    },
    {
      title: "TRẠNG THÁI",
      dataIndex: "trangThai",
      key: "trangThai",
      align: "center",
      width: 130,
      render: (value) =>
        value ? (
          <Tag color="#E9FBF4" style={{ border: "1px solid #00A96C" }}>
            <div className="text-[#00A96C] ">Đang hoạt động</div>
          </Tag>
        ) : (
          <Tag color="red">Ngừng hoạt động</Tag>
        ),
    },
    {
      title: "HÀNH ĐỘNG",
      key: "action",
      align: "center",
      width: 150,
      render: (_, record) => (
        <Space>
          {/* <Button
            type="link"
            icon={<EyeIcon size={24} />}
            onClick={() => navigate(`/admin/detail-product/${record.id}`)}
          ></Button>{" "} */}
          <a
            onClick={(e) => {
              e.preventDefault();
              handleChangeStatus(record);
            }}
            style={{
              cursor: statusLoading === record.id ? "not-allowed" : "pointer",
              opacity: statusLoading === record.id ? 0.6 : 1,
            }}
          >
            {statusLoading === record.id ? (
              <span>...</span>
            ) : record.trangThai ? (
              <ToggleRightIcon weight="fill" size={30} color="#00A96C" />
            ) : (
              <ToggleLeftIcon weight="fill" size={30} color="#c5c5c5" />
            )}
          </a>
          <Button
            type="link"
            icon={<PencilLineIcon size={24} weight="fill" color="#E67E22" />}
            onClick={() => handleEditProduct(record)}
          ></Button>
        </Space>
      ),
    },
  ];

  const handleTableChange = (newPagination, filters, sorter) => {
    console.log("🔄 Table change:", {
      current: newPagination.current,
      pageSize: newPagination.pageSize,
      total: newPagination.total,
    });

    const pageNo = newPagination.current - 1;
    const pageSize = newPagination.pageSize;

    if (Object.keys(currentFilters).length > 0) {
      console.log("📌 Có filter, gọi fetchProducts");
      fetchProducts(pageNo, pageSize, currentFilters);
    } else {
      console.log("📌 Không filter, gọi fetchProductsWithPaging");
      fetchProductsWithPaging(pageNo, pageSize);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {messageContextHolder}
      {contextHolder}
      <div className="bg-white flex flex-col gap-3 px-4 py-[20px] rounded-lg shadow overflow-hidden">
        <div className="font-bold text-4xl text-[#E67E22]">
          Quản lý sản phẩm
        </div>
        <div className="flex justify-between items-center mb-2">
          <div className="text-sm text-gray-600">
            <span
              className="cursor-pointer hover:text-[#E67E22]"
              onClick={() => navigate("/")}
            >
              Trang chủ
            </span>
            <span className="mx-2">/</span>
            <span className="text-gray-900 font-medium">Quản lý sản phẩm</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow mb-6 overflow-hidden mt-6">
        <div className="bg-[#E67E22] text-white px-6 py-3">
          <div className="font-bold text-2xl text-white">Bộ lọc sản phẩm</div>
        </div>
        <div className="p-4">
          <FliterProduct
            editingUser={editingUser}
            onFinishUpdate={() => {
              setEditingUser(null);
              if (Object.keys(currentFilters).length > 0) {
                fetchProducts(
                  pagination.current - 1,
                  pagination.pageSize,
                  currentFilters
                );
              } else {
                fetchProductsWithPaging(
                  pagination.current - 1,
                  pagination.pageSize
                );
              }
            }}
            onFilter={handleFilter}
            handleExportExcel={handleExportExcel}
            products={products}
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="bg-[#E67E22] text-white px-6 py-3 flex justify-between items-center">
          <div className="font-bold text-2xl text-white">
            Danh sách sản phẩm ({totalProducts} sản phẩm)
          </div>
          <div className="flex gap-4">
            {selectedRowKeys.length > 0 && (
              <div
                onClick={handleViewMultipleDetails}
                className="rounded px-6 py-2 cursor-pointer hover:bg-[#d35400] hover:text-white transition-colors font-medium text-[#E67E22] bg-white  active:bg-cyan-800"
              >
                Xem {selectedRowKeys.length} sản phẩm
              </div>
            )}
          </div>
        </div>

        <Table
          rowSelection={rowSelection}
          columns={columns}
          dataSource={products}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
          }}
          onChange={handleTableChange}
          locale={{ emptyText: "Không có dữ liệu sản phẩm" }}
          className="custom-table"
        />
      </div>
    </div>
  );
}
