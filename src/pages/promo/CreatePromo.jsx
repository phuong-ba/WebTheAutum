import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { EyeOutlined } from "@ant-design/icons";
import { Image } from "antd";
import { createDotGiamGia,
  updateDotGiamGia,
  checkProductActiveSales,
  getFormData,} from "@/api/service";
import "bootstrap/dist/css/bootstrap.min.css";


const formatDateForInput = (isoDate) => {
  if (!isoDate) return "";
  return isoDate.split("T")[0];
};

const generateMaGiamGia = () => {
  const prefix = "DG";
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}${random}`;
};

const CreatePromo = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Helper function để lấy URL ảnh từ các tên trường có thể
  const getImageUrl = (product) => {
    if (!product) return null;

    // Ưu tiên tìm trong mảng anhs trước
    if (
      product.anhs &&
      Array.isArray(product.anhs) &&
      product.anhs.length > 0
    ) {
      const firstImage = product.anhs[0];
      if (firstImage.duongDanAnh) return firstImage.duongDanAnh;
      if (firstImage.url) return firstImage.url;
      if (firstImage.imageUrl) return firstImage.imageUrl;
    }

    // Tìm trong các trường trực tiếp
    const imageFields = [
      "img",
      "image",
      "anhSanPham",
      "hinhAnh",
      "urlAnh",
      "imagePath",
      "imageUrl",
      "url",
      "anhDaiDien",
      "avatar",
      "thumbnail",
      "photo",
      "picture",
    ];

    for (const field of imageFields) {
      if (product[field]) {
        return product[field];
      }
    }

    // Tìm các trường dynamic (có chứa từ khóa ảnh)
    const dynamicImageFields = Object.keys(product).filter(
      (key) =>
        key.toLowerCase().includes("anh") ||
        key.toLowerCase().includes("img") ||
        key.toLowerCase().includes("image") ||
        key.toLowerCase().includes("url")
    );

    for (const field of dynamicImageFields) {
      if (product[field] && typeof product[field] === "string") {
        return product[field];
      }
    }

    return null;
  };

  const [discount, setDiscount] = useState({
    id: null,
    maGiamGia: "",
    tenDot: "",
    loaiGiamGia: "",
    giaTriGiam: "",
    giaTriToiThieu: "",
    ngayBatDau: "",
    ngayKetThuc: "",
    trangThai: true,
  });

  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [detailProducts, setDetailProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [show, setShow] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState(false);
  // Hàm debug chi tiết cấu trúc dữ liệu
  const debugProductImages = (products) => {
    console.log("=== DEBUG CHI TIẾT CẤU TRÚC DỮ LIỆU ===");
    products.forEach((product, index) => {
      console.log(`📦 Sản phẩm ${index + 1}:`, {
        id: product.id,
        tenSanPham: product.tenSanPham,
        // Tất cả các trường có thể chứa ảnh
        anhs: product.anhs,
        img: product.img,
        image: product.image,
        anhSanPham: product.anhSanPham,
        hinhAnh: product.hinhAnh,
        urlAnh: product.urlAnh,
        imagePath: product.imagePath,
        imageUrl: product.imageUrl,
        url: product.url,
        // Tất cả các trường
        allFields: Object.keys(product),
      });
    });
  };

  // Load dữ liệu sửa
  useEffect(() => {
    const loadEditData = async () => {
      if (location.state?.discount) {
        const d = location.state.discount;
        setDiscount({
          ...d,
          ngayBatDau: formatDateForInput(d.ngayBatDau),
          ngayKetThuc: formatDateForInput(d.ngayKetThuc),
          trangThai: d.trangThai ?? true,
        });

        // Load sản phẩm đã chọn khi sửa
        if (d.id) {
          try {
            setLoading(true);
            const res = await getFormData(d.id, "", 0, 100);
            console.log("📡 API Response (Edit):", res.data);

            let productsData = [];
            let selectedIds = [];

            if (res.data.content) {
              productsData = res.data.content;
            } else if (res.data.products?.content) {
              productsData = res.data.products.content;
              selectedIds = res.data.selectedIds || [];
            }

            const formattedProducts = productsData.map((p) => ({
              ...p,
              ngayBatDau: formatDateForInput(p.ngayBatDau),
              ngayKetThuc: formatDateForInput(p.ngayKetThuc),
            }));

            setProducts(formattedProducts);
            setSelectedProducts(selectedIds);

            console.log("✅ Đã load sản phẩm đã chọn:", selectedIds);
          } catch (error) {
            console.error("Lỗi load sản phẩm khi sửa:", error);
          } finally {
            setLoading(false);
          }
        }
      }
    };

    loadEditData();
  }, [location.state]);

  // Load sản phẩm
  const loadProducts = async () => {
    try {
      setLoading(true);
      const res = await getFormData(discount.id, "", 0, 100);
      console.log("📡 API Response:", res.data);

      let productsData = [];

      if (res.data.content) {
        productsData = res.data.content;
      } else if (res.data.products?.content) {
        productsData = res.data.products.content;
        setSelectedProducts(res.data.selectedIds || []);
      }

      const formattedProducts = productsData.map((p) => ({
        ...p,
        ngayBatDau: formatDateForInput(p.ngayBatDau),
        ngayKetThuc: formatDateForInput(p.ngayKetThuc),
      }));

      setProducts(formattedProducts);

      // Debug cấu trúc dữ liệu
      if (formattedProducts.length > 0) {
        debugProductImages(formattedProducts.slice(0, 3)); // Debug 3 sản phẩm đầu
      }
    } catch (error) {
      console.error("Lỗi load sản phẩm:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Chỉ load products khi không có discount.id (tức là tạo mới)
    if (!discount.id) {
      loadProducts();
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setDiscount((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePickProduct = async (productId) => {
    try {
      const res = await checkProductActiveSales(productId);
      if (res.data > 0) {
        setErrorMessage("Sản phẩm này đang tham gia đợt giảm giá khác!");
        setShow(true);
        return;
      }
    } catch (error) {
      console.error(error);
    }

    setSelectedProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  useEffect(() => {
    const pickedDetails = products
      .filter((p) => selectedProducts.includes(p.id))
      .map((p) => ({ ...p }));
    setDetailProducts(pickedDetails);
    // Debug chi tiết
    if (pickedDetails.length > 0) {
      console.log("=== DEBUG ẢNH SẢN PHẨM ĐÃ CHỌN ===");
      pickedDetails.forEach((product, index) => {
        const imageUrl = getImageUrl(product);
        console.log(`🎯 Sản phẩm đã chọn ${index + 1}:`, {
          id: product.id,
          tenSanPham: product.tenSanPham,
          imageUrl: imageUrl,
          hasImage: !!imageUrl,
          anhs: product.anhs,
        });
      });
    }
  }, [selectedProducts, products]);

  // Tự động tính số tiền tối thiểu theo %
  useEffect(() => {
    if (
      discount.loaiGiamGia === false &&
      detailProducts.length > 0 &&
      discount.giaTriGiam
    ) {
      const avgPrice =
        detailProducts.reduce((sum, p) => sum + p.giaBan, 0) /
        detailProducts.length;
      const minAmount = Math.round(avgPrice * (discount.giaTriGiam / 100));

      setDiscount((prev) => ({
        ...prev,
        giaTriToiThieu: minAmount,
      }));
    }
  }, [discount.loaiGiamGia, discount.giaTriGiam, detailProducts]);

  // Hiển thị thông báo tự ẩn sau 5s
  useEffect(() => {
    if (message || errorMessage) {
      setShow(true);
      const timer = setTimeout(() => {
        setShow(false);
        setTimeout(() => {
          setMessage("");
          setErrorMessage("");
        }, 500);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message, errorMessage]);

  // Kiểm tra hợp lệ
  const validateDiscount = async () => {
    if (!discount.tenDot.trim()) {
      setErrorMessage("Tên đợt giảm giá không được để trống!");
      return false;
    }
    if (
      discount.loaiGiamGia === null ||
      discount.loaiGiamGia === undefined ||
      discount.loaiGiamGia === ""
    ) {
      setErrorMessage("Vui lòng chọn loại giảm giá!");
      return false;
    }
    if (discount.giaTriGiam === "" || discount.giaTriGiam < 0) {
      setErrorMessage("Giá trị giảm không được âm hoặc trống!");
      return false;
    }
    if (discount.loaiGiamGia === false) {
      if (discount.giaTriGiam < 1 || discount.giaTriGiam > 100) {
        setErrorMessage("Giảm theo % phải nằm trong khoảng 1–100!");
        return false;
      }
    }

    if (
      discount.loaiGiamGia === false &&
      detailProducts.length > 0 &&
      discount.giaTriGiam
    ) {
      const avgPrice =
        detailProducts.reduce((sum, p) => sum + p.giaBan, 0) /
        detailProducts.length;
      const minAmount = Math.round(avgPrice * (discount.giaTriGiam / 100));

      setDiscount((prev) => ({
        ...prev,
        giaTriToiThieu: minAmount,
      }));
    }
    if (discount.ngayBatDau && discount.ngayKetThuc) {
      const start = new Date(discount.ngayBatDau);
      const end = new Date(discount.ngayKetThuc);
      if (start > end) {
        setErrorMessage("Ngày bắt đầu không được lớn hơn ngày kết thúc!");
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const valid = await validateDiscount();
    if (!valid) {
      setShow(true);
      return;
    }

    if (!discount.id) {
      setDiscount((prev) => ({
        ...prev,
        maGiamGia: generateMaGiamGia(),
      }));
    }

    setShowConfirm(true);
  };

  const confirmSubmit = async () => {
    setPendingSubmit(true);
    const payload = {
      dotGiamGia: {
        ...discount,
        trangThai: true,
      },
      ctspIds: selectedProducts,
    };

    try {
      if (discount.id) {
        await updateDotGiamGia(discount.id, payload);
        setMessage("Cập nhật đợt giảm giá thành công!");
      } else {
        await createDotGiamGia(payload);
        setMessage("Tạo đợt giảm giá thành công!");
      }
    } catch (error) {
      console.error(error);
      setErrorMessage("Có lỗi xảy ra! Kiểm tra console.");
    } finally {
      setPendingSubmit(false);
      setShowConfirm(false);
    }
  };

  const selectAllDetails = () => setSelectedProducts(products.map((p) => p.id));
  const unselectAllDetails = () => setSelectedProducts([]);

  // Hàm render ảnh
  const renderImage = (record) => {
    const imageUrl = getImageUrl(record);

    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          minHeight: "80px",
        }}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            style={{
              width: 80,
              height: 80,
              objectFit: "cover",
              borderRadius: 4,
              border: "1px solid #d9d9d9",
              display: "block",
            }}
            alt={record.tenSanPham || "Sản phẩm"}
            onError={(e) => {
              e.target.src =
                "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Crect width='80' height='80' fill='%23f9f9f9'/%3E%3Ctext x='50%25' y='45%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='12' fill='%23999'%3ENo Image%3C/text%3E%3C/svg%3E";
            }}
          />
        ) : (
          <div
            style={{
              display: "flex",
              width: 80,
              height: 80,
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#f9f9f9",
              border: "1px dashed #d9d9d9",
              borderRadius: 4,
              fontSize: 12,
              color: "#999",
            }}
          >
            <div>No Image</div>
          </div>
        )}
      </div>
    );
  };

  // Lọc sản phẩm
  const filteredProducts = products.filter((p) => {
    const keyword = searchTerm.toLowerCase().trim();
    return (
      p.maSanPham?.toLowerCase().includes(keyword) ||
      p.tenSanPham?.toLowerCase().includes(keyword)
    );
  });
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredProducts.slice(startIndex, endIndex);

  return (
    <div className="container-fluid p-3 position-relative">
      {/* Thông báo */}
      {(message || errorMessage) && (
        <div className="fixed top-5 right-5 z-50 w-80">
          <div
            className={`transition-opacity duration-500 ${
              show ? "opacity-100" : "opacity-0"
            }`}
          >
            <div
              className={`${
                message ? "bg-green-600" : "bg-red-600"
              } text-white px-4 py-2 rounded shadow-lg relative overflow-hidden`}
            >
              <div>{message || errorMessage}</div>
              <div className="absolute bottom-0 left-0 h-1 bg-white animate-progress" />
            </div>
          </div>
        </div>
      )}

      {/* Popup xác nhận */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-96 text-center shadow-lg animate-fadeScale">
            <h4 className="text-lg font-semibold mb-3">Xác nhận</h4>
            <p className="text-gray-600 mb-5">
              Bạn có chắc muốn lưu đợt giảm giá này?
            </p>
            <div className="d-flex justify-content-center gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="btn btn-secondary px-4"
                disabled={pendingSubmit}
              >
                Hủy
              </button>
              <button
                onClick={confirmSubmit}
                className="btn btn-success px-4"
                disabled={pendingSubmit}
              >
                {pendingSubmit ? "Đang lưu..." : "Xác nhận"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Nội dung chính */}
      <div className="row g-3">
        <div className="col-lg-5">
          <div className="card">
            <div className="card-header fw-semibold">
              Thông Tin Đợt Giảm Giá
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit} className="row g-3">
                <div className="col-12">
                  <label className="form-label">Mã đợt giảm giá</label>
                  <input
                    className="form-control"
                    name="maGiamGia"
                    value={discount.maGiamGia}
                    placeholder="Mã tự động"
                    onChange={handleChange}
                  />
                </div>
                <div className="col-12">
                  <label className="form-label">Tên đợt giảm giá</label>
                  <input
                    className="form-control"
                    name="tenDot"
                    value={discount.tenDot}
                    onChange={handleChange}
                  />
                </div>
                <div className="col-12">
                  <label className="form-label">Loại giảm giá</label>
                  <select
                    className="form-select"
                    name="loaiGiamGia"
                    value={
                      discount.loaiGiamGia === ""
                        ? ""
                        : discount.loaiGiamGia.toString()
                    }
                    onChange={(e) => {
                      const strValue = e.target.value;
                      let value;
                      if (strValue === "") {
                        value = "";
                      } else if (strValue === "false") {
                        value = false;
                      } else {
                        value = true;
                      }
                      setDiscount((prev) => ({ ...prev, loaiGiamGia: value }));
                    }}
                  >
                    <option value="">Chọn loại giảm giá</option>
                    <option value="false">Phần trăm</option>
                    <option value="true">Số tiền</option>
                  </select>
                </div>
                <div className="col-12">
                  <label className="form-label">Giá trị giảm giá</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    name="giaTriGiam"
                    value={discount.giaTriGiam}
                    onChange={handleChange}
                  />
                </div>
                <div className="col-12">
                  <label className="form-label">Số tiền tối thiểu</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    name="giaTriToiThieu"
                    value={discount.giaTriToiThieu}
                    onChange={handleChange}
                    disabled={discount.loaiGiamGia === false}
                  />
                </div>
                <div className="col-6">
                  <label className="form-label">Ngày bắt đầu</label>
                  <input
                    type="date"
                    className="form-control"
                    name="ngayBatDau"
                    value={discount.ngayBatDau}
                    onChange={handleChange}
                  />
                </div>
                <div className="col-6">
                  <label className="form-label">Ngày kết thúc</label>
                  <input
                    type="date"
                    className="form-control"
                    name="ngayKetThuc"
                    value={discount.ngayKetThuc}
                    onChange={handleChange}
                  />
                </div>
                <div className="col-12 d-flex gap-2">
                  <button className="btn btn-success flex-fill" type="submit">
                    {discount.id ? "Cập nhật" : "Thêm"}
                  </button>
                  <button
                    className="btn btn-secondary flex-fill"
                    type="button"
                    onClick={() => navigate("/promo")}
                  >
                    Quay về
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Danh sách sản phẩm */}
        <div className="col-lg-7">
          <div className="card">
            <div className="card-header fw-semibold d-flex justify-content-between align-items-center">
              <span>Danh Sách Sản Phẩm</span>
              <input
                type="text"
                className="form-control w-50"
                placeholder="Tìm theo mã hoặc tên sản phẩm..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
            <div className="card-body">
              {loading ? (
                <div className="text-center">Đang tải sản phẩm...</div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-bordered table-hover align-middle">
                    <thead>
                      <tr>
                        <th>Chọn</th>
                        <th>STT</th>
                        <th>Mã</th>
                        <th>Tên SP</th>
                        <th>Nhà sản xuất</th>
                        <th>Số lượng</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentItems.map((ct, idx) => (
                        <tr key={ct.id}>
                          <td>
                            <input
                              type="checkbox"
                              checked={selectedProducts.includes(ct.id)}
                              onChange={() => handlePickProduct(ct.id)}
                            />
                          </td>
                          <td>{startIndex + idx + 1}</td>
                          <td>{ct.maSanPham}</td>
                          <td>{ct.tenSanPham}</td>
                          <td>{ct.nhaXanXuat || ""}</td>
                          <td>{ct.soLuongTon}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {/* Thanh phân trang */}
                  <div className="d-flex justify-content-between mt-4 text-sm text-gray-700">
                    <div className="d-flex align-items-center gap-2">
                      <span>Hiển thị</span>
                      <select
                        value={itemsPerPage}
                        onChange={(e) => {
                          setItemsPerPage(Number(e.target.value));
                          setCurrentPage(1);
                        }}
                        className="border rounded px-2 py-1"
                      >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                      </select>
                      <span>mục / trang</span>
                      <span className="ml-3">
                        Hiển thị {startIndex + 1} -{" "}
                        {Math.min(endIndex, products.length)} /{" "}
                        {products.length} sản phẩm
                      </span>
                    </div>
                    <div className="d-flex gap-1">
                      <button
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                        className="px-2 py-1 border rounded disabled:opacity-50"
                      >
                        &lt;&lt;
                      </button>
                      <button
                        onClick={() =>
                          setCurrentPage((p) => Math.max(p - 1, 1))
                        }
                        disabled={currentPage === 1}
                        className="px-2 py-1 border rounded disabled:opacity-50"
                      >
                        &lt;
                      </button>
                      {[...Array(totalPages).keys()]
                        .slice(
                          Math.max(0, currentPage - 3),
                          Math.min(totalPages, currentPage + 2)
                        )
                        .map((p) => (
                          <button
                            key={p + 1}
                            onClick={() => setCurrentPage(p + 1)}
                            className={`px-3 py-1 border rounded ${
                              currentPage === p + 1
                                ? "bg-green-600 text-white"
                                : "hover:bg-gray-100"
                            }`}
                          >
                            {p + 1}
                          </button>
                        ))}
                      <button
                        onClick={() =>
                          setCurrentPage((p) => Math.min(p + 1, totalPages))
                        }
                        disabled={currentPage === totalPages}
                        className="px-2 py-1 border rounded disabled:opacity-50"
                      >
                        &gt;
                      </button>
                      <button
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages}
                        className="px-2 py-1 border rounded disabled:opacity-50"
                      >
                        &gt;&gt;
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Chi tiết sản phẩm */}
      <div className="row g-3 mt-3">
        <div className="col-12">
          <div className="card">
            <div className="card-header fw-semibold">
              Danh Sách Chi Tiết Sản Phẩm
            </div>
            <div className="card-body">
              <div className="d-flex gap-2 mb-2 justify-content-end">
                <button
                  className="btn btn-success btn-sm"
                  onClick={selectAllDetails}
                >
                  Chọn tất cả
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={unselectAllDetails}
                >
                  Bỏ chọn tất cả
                </button>
              </div>
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead>
                    <tr>
                      <th style={{ width: "50px" }}>#</th>
                      <th style={{ width: "60px" }}>STT</th>
                      <th style={{ width: "100px", textAlign: "center" }}>
                        Ảnh
                      </th>
                      <th>Thuộc đợt</th>
                      <th>Tên & Chi tiết</th>
                      <th className="text-end" style={{ width: "120px" }}>
                        Giá gốc
                      </th>
                      <th className="text-end" style={{ width: "120px" }}>
                        Giá sau giảm
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailProducts.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center text-muted">
                          Chưa chọn sản phẩm nào
                        </td>
                      </tr>
                    ) : (
                      detailProducts.map((d, idx) => (
                        <tr key={d.id}>
                          <td className="align-middle">
                            <input type="checkbox" checked readOnly />
                          </td>
                          <td className="align-middle">{idx + 1}</td>
                          <td
                            className="align-middle"
                            style={{ padding: "8px", textAlign: "center" }}
                          >
                            {renderImage(d)}
                          </td>
                          <td className="text-muted align-middle">
                            {discount.tenDot || "Chưa chọn đợt giảm"}
                          </td>
                          <td className="align-middle">
                            <div className="fw-semibold">{d.tenSanPham}</div>
                            <div className="text-muted small">
                              {d.mauSac || ""} • {d.kichThuoc || ""}
                            </div>
                          </td>
                          <td className="text-end align-middle">
                            {d.giaBan?.toLocaleString()}đ
                          </td>
                          <td className="text-end fw-bold text-success align-middle">
                            {discount.loaiGiamGia === false
                              ? (
                                  d.giaBan *
                                  (1 - discount.giaTriGiam / 100)
                                )?.toLocaleString()
                              : (
                                  d.giaBan - discount.giaTriGiam
                                )?.toLocaleString()}
                            đ
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes progressBar {
          from { width: 100%; }
          to { width: 0%; }
        }
        .animate-progress {
          animation: progressBar 5s linear forwards;
        }
        @keyframes fadeScale {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fadeScale {
          animation: fadeScale 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default CreatePromo;
