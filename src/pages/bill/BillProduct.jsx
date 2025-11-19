import {
  fetchChiTietSanPham,
  giamSoLuong,
  tangSoLuong,
} from "@/services/chiTietSanPhamService";
import {
  ClipboardTextIcon,
  ShoppingCartIcon,
  ArrowCounterClockwise,
} from "@phosphor-icons/react";
import { Table, Space, message, Input, Select, Tooltip, Modal } from "antd";
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

const { Search } = Input;
const { Option } = Select;

export default function BillProduct({
  onAddProduct,
  onRemoveProduct,
  selectedProducts = [],
}) {
  const dispatch = useDispatch();
  const { data } = useSelector((state) => state.chiTietSanPham);
  const [messageApi, contextHolder] = message.useMessage();
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [priceFilter, setPriceFilter] = useState("all");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [sortBy, setSortBy] = useState("default");
  const [returnModalVisible, setReturnModalVisible] = useState(false);
  const [returnProduct, setReturnProduct] = useState(null);
  const [clickedProductId, setClickedProductId] = useState(null);

  useEffect(() => {
    dispatch(fetchChiTietSanPham());
  }, [dispatch]);

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 5,
  });

  const filteredData = data?.filter((product) => product.soLuongTon > 0) || [];

  const isProductSelected = (productId) => {
    return selectedProducts.some((item) => item.id === productId);
  };

  const getSelectedProductQuantity = (productId) => {
    const product = selectedProducts.find((item) => item.id === productId);
    return product ? product.quantity || 1 : 0;
  };

  const getFilteredAndSortedData = () => {
    let result = [...filteredData];

    if (searchKeyword) {
      const keyword = searchKeyword.toLowerCase().trim();
      result = result.filter((product) => {
        const searchFields = [
          product.tenSanPham?.toLowerCase() || "",
          product.tenMauSac?.toLowerCase() || "",
          product.tenKichThuoc?.toLowerCase() || "",
          product.tenTrongLuong?.toLowerCase() || "",
          (product.giaBan || "").toString(),
          (product.giaSauGiam || "").toString(),
        ];
        return searchFields.some((field) => field.includes(keyword));
      });
    }

    if (categoryFilter !== "all") {
      result = result.filter((product) => product.tenMauSac === categoryFilter);
    }

    if (priceFilter !== "all") {
      const price = (product) => product.giaSauGiam ?? product.giaBan ?? 0;
      switch (priceFilter) {
        case "under100k":
          result = result.filter((product) => price(product) < 100000);
          break;
        case "100k-500k":
          result = result.filter(
            (product) => price(product) >= 100000 && price(product) <= 500000
          );
          break;
        case "500k-1M":
          result = result.filter(
            (product) => price(product) > 500000 && price(product) <= 1000000
          );
          break;
        case "over1M":
          result = result.filter((product) => price(product) > 1000000);
          break;
      }
    }

    result.sort((a, b) => {
      const priceA = a.giaSauGiam ?? a.giaBan ?? 0;
      const priceB = b.giaSauGiam ?? b.giaBan ?? 0;

      switch (sortBy) {
        case "name_asc":
          return (a.tenSanPham || "").localeCompare(b.tenSanPham || "");
        case "name_desc":
          return (b.tenSanPham || "").localeCompare(a.tenSanPham || "");
        case "price_asc":
          return priceA - priceB;
        case "price_desc":
          return priceB - priceA;
        case "stock_asc":
          return a.soLuongTon - b.soLuongTon;
        case "stock_desc":
          return b.soLuongTon - a.soLuongTon;
        default:
          return 0;
      }
    });

    return result;
  };

  const getUniqueColors = () => {
    const colors = filteredData
      .map((product) => product.tenMauSac)
      .filter(Boolean);
    return [...new Set(colors)];
  };

  const handleAddToInvoice = async (product) => {
    if (clickedProductId === product.id) return;

    try {
      setClickedProductId(product.id);

      if (product.soLuongTon <= 0) {
        messageApi.warning("Sản phẩm đã hết hàng!");
        setClickedProductId(null);
        return;
      }

      if (onAddProduct) {
        onAddProduct({
          ...product,
          quantity: 1,
        });
      }

      await dispatch(fetchChiTietSanPham()).unwrap();

      messageApi.success("Đã thêm sản phẩm vào hóa đơn!");
    } catch (error) {
      console.error("Lỗi khi thêm sản phẩm:", error);
      messageApi.error("Thêm sản phẩm thất bại!");
    } finally {
      setClickedProductId(null);
    }
  };

  const handleReturnToStock = async (product) => {
    try {
      const selectedQty = getSelectedProductQuantity(product.id);

      if (selectedQty <= 0) {
        messageApi.warning("Sản phẩm này chưa được chọn trong hóa đơn!");
        return;
      }

      await dispatch(tangSoLuong({ id: product.id, soLuong: 1 })).unwrap();

      if (onRemoveProduct) {
        onRemoveProduct(product.id);
      }

      await dispatch(fetchChiTietSanPham()).unwrap();

      messageApi.success("Đã trả sản phẩm về tồn kho!");
    } catch (error) {
      console.error("Lỗi khi trả sản phẩm:", error);
      messageApi.error("Trả sản phẩm thất bại!");
    }
  };

  const showReturnModal = (product) => {
    setReturnProduct(product);
    setReturnModalVisible(true);
  };

  const handleReturnConfirm = async () => {
    if (returnProduct) {
      await handleReturnToStock(returnProduct);
      setReturnModalVisible(false);
      setReturnProduct(null);
    }
  };

  const clearFilters = () => {
    setSearchKeyword("");
    setCategoryFilter("all");
    setPriceFilter("all");
    setSortBy("default");
  };

  const columns = [
    {
      title: "STT",
      key: "stt",
      render: (_, __, index) =>
        (pagination.current - 1) * pagination.pageSize + index + 1,
      width: 60,
      align: "center",
    },
    {
      title: "Ảnh",
      dataIndex: "anhs",
      width: 60,
      render: (anhs) =>
        anhs?.[0]?.duongDanAnh ? (
          <img
            src={anhs[0].duongDanAnh}
            alt="Ảnh"
            style={{
              width: 50,
              height: 50,
              objectFit: "cover",
              borderRadius: 6,
            }}
          />
        ) : (
          <div
            style={{
              width: 50,
              height: 50,
              borderRadius: 6,
              background: "#f3f4f6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span className="text-xs text-gray-400">Không ảnh</span>
          </div>
        ),
    },
    {
      title: "Tên sản phẩm",
      dataIndex: "tenSanPham",
      width: 100,
      render: (text, record) => (
        <Tooltip title={text}>
          <div
            style={{
              maxWidth: 100,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {text}
            {isProductSelected(record.id) && (
              <div className="text-xs text-green-600 font-semibold">
                (Đã chọn: {getSelectedProductQuantity(record.id)})
              </div>
            )}
          </div>
        </Tooltip>
      ),
    },
    {
      title: "Màu sắc",
      dataIndex: "tenMauSac",
      align: "center",
      width: 80,
    },
    {
      title: "Kích thước",
      dataIndex: "tenKichThuoc",
      align: "center",
      width: 80,
    },
    {
      title: "Trọng lượng",
      dataIndex: "tenTrongLuong",
      align: "center",
      width: 90,
    },
    {
      title: "Tồn kho",
      dataIndex: "soLuongTon",
      width: 90,
      align: "center",
      render: (value, record) => (
        <div className="flex flex-col items-center">
          <span
            className={`font-semibold ${
              value <= 5 ? "text-red-600" : "text-green-600"
            }`}
          >
            {value}
          </span>
          {isProductSelected(record.id) && (
            <span className="text-xs text-blue-600">
              → {value + getSelectedProductQuantity(record.id)}
            </span>
          )}
        </div>
      ),
    },
    {
      title: "Giá bán",
      width: 60,
      render: (record) => {
        const currentPrice = record.giaSauGiam ?? record.giaBan ?? 0;
        const hasDiscount =
          record.giaSauGiam && record.giaSauGiam < record.giaBan;

        return (
          <div className="flex flex-col">
            <div className={`font-bold ${hasDiscount ? "text-red-600" : ""}`}>
              {currentPrice.toLocaleString()}₫
            </div>
            {hasDiscount && (
              <div className="text-xs text-gray-500 line-through">
                {record.giaBan.toLocaleString()}₫
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: "HÀNH ĐỘNG",
      key: "action",
      align: "center",
      width: 120,
      render: (_, record) => (
        <Space size="middle">
          {isProductSelected(record.id) ? (
            <Tooltip title="Trả hàng về tồn kho">
              <button
                onClick={() => showReturnModal(record)}
                className="bg-green-500 py-2 px-4 rounded cursor-pointer select-none text-center font-bold text-white hover:bg-green-600 active:bg-green-700 shadow transition-colors"
              >
                <ArrowCounterClockwise size={20} color="#FFF" />
              </button>
            </Tooltip>
          ) : (
            <Tooltip title="Thêm vào hóa đơn">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddToInvoice(record);
                }}
                disabled={
                  record.soLuongTon <= 0 || clickedProductId === record.id
                }
                className="bg-amber-500 py-2 px-4 rounded cursor-pointer select-none text-center font-bold text-white hover:bg-amber-600 active:bg-cyan-800 shadow transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                <ShoppingCartIcon size={20} color="#FFF" />
              </button>
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <>
      {contextHolder}
      <div className="bg-white shadow rounded-lg">
        <div className="p-4 text-2xl font-bold bg-amber-600 text-white rounded-t-lg flex gap-2 opacity-75">
          <ClipboardTextIcon size={32} />
          Danh sách sản phẩm
        </div>
        <div className="p-4">
          <div className="flex items-center justify-between gap-2 p-4 border-b border-gray-300">
            <div className="flex justify-end gap-3 flex-wrap">
              <Search
                placeholder="Tìm theo tên, màu, size, trọng lượng, giá..."
                onSearch={(value) => setSearchKeyword(value)}
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                style={{ width: 250 }}
                allowClear
              />

              <Select
                value={categoryFilter}
                onChange={setCategoryFilter}
                className="min-w-[160px]"
                placeholder="Màu sắc"
              >
                <Option value="all">Tất cả màu</Option>
                {getUniqueColors().map((color) => (
                  <Option key={color} value={color}>
                    {color}
                  </Option>
                ))}
              </Select>

              <Select
                value={priceFilter}
                onChange={setPriceFilter}
                className="min-w-[160px]"
                placeholder="Khoảng giá"
              >
                <Option value="all">Tất cả giá</Option>
                <Option value="under100k">Dưới 100.000₫</Option>
                <Option value="100k-500k">100.000₫ - 500.000₫</Option>
                <Option value="500k-1M">500.000₫ - 1.000.000₫</Option>
                <Option value="over1M">Trên 1.000.000₫</Option>
              </Select>

              <Select
                value={sortBy}
                onChange={setSortBy}
                className="min-w-[160px]"
                placeholder="Sắp xếp"
              >
                <Option value="default">Mặc định</Option>
                <Option value="name_asc">Tên A-Z</Option>
                <Option value="name_desc">Tên Z-A</Option>
                <Option value="price_asc">Giá tăng dần</Option>
                <Option value="price_desc">Giá giảm dần</Option>
                <Option value="stock_asc">Tồn kho tăng dần</Option>
                <Option value="stock_desc">Tồn kho giảm dần</Option>
              </Select>

              {(searchKeyword ||
                categoryFilter !== "all" ||
                priceFilter !== "all" ||
                sortBy !== "default") && (
                <button
                  onClick={clearFilters}
                  className="text-xs bg-gray-500 text-white rounded px-3 py-1 font-semibold hover:bg-gray-600"
                >
                  Xóa lọc
                </button>
              )}
            </div>
          </div>
          <Table
            columns={columns}
            dataSource={getFilteredAndSortedData()}
            rowKey="id"
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              onChange: (page, pageSize) =>
                setPagination({ current: page, pageSize }),
            }}
            onRow={(record) => ({
              // NGĂN SỰ KIỆN CLICK TRÊN TOÀN BỘ HÀNG
              onClick: (e) => {
                // Chỉ xử lý nếu click không phải trên button
                if (!e.target.closest("button")) {
                  console.log("Click trên hàng, không làm gì cả");
                }
              },
            })}
          />
        </div>
      </div>

      {/* Modal xác nhận trả hàng */}
      <Modal
        title="Xác nhận trả hàng"
        open={returnModalVisible}
        onOk={handleReturnConfirm}
        onCancel={() => {
          setReturnModalVisible(false);
          setReturnProduct(null);
        }}
        okText="Xác nhận"
        cancelText="Hủy"
        okButtonProps={{ className: "bg-green-500 hover:bg-green-600" }}
      >
        <p>
          Bạn có chắc muốn trả sản phẩm{" "}
          <strong>{returnProduct?.tenSanPham}</strong> về tồn kho?
        </p>
        <p className="text-sm text-gray-600 mt-2">
          Số lượng tồn kho sẽ tăng từ{" "}
          <strong>{returnProduct?.soLuongTon}</strong> lên{" "}
          <strong>{(returnProduct?.soLuongTon || 0) + 1}</strong>
        </p>
      </Modal>
    </>
  );
}
