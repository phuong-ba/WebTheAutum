import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import hoaDonApi from '../../api/HoaDonAPI';
import axios from "axios";
import { toast } from 'react-toastify';




const EditHoaDon = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [invoice, setInvoice] = useState(null);
  const [allProducts, setAllProducts] = useState([]);
  const [allPhieuGiamGia, setAllPhieuGiamGia] = useState([]);




  // Form data
  const [formData, setFormData] = useState({
    hoTenKhachHang: '',
    sdtKhachHang: '',
    emailKhachHang: '',
    diaChiKhachHang: '',
    phiVanChuyen: 0,
    idPhieuGiamGia: null,
    ghiChu: '',
    chiTietSanPhams: []
  });

  // UI state
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [errors, setErrors] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedProductDetail, setSelectedProductDetail] = useState(null);
  const [productVariants, setProductVariants] = useState([]);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedQuantity, setSelectedQuantity] = useState(1);

  // ================== LOAD DATA ==================

  useEffect(() => {
    loadData();

  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);

      // 1. Kiểm tra có thể sửa không
      try {
        const res = await hoaDonApi.getAllProducts(); // ✅ lấy kết quả trả về
      } catch (error) {
        console.error("❌ Lỗi load sản phẩm:", error);
      }
      const canEditRes = await hoaDonApi.canEdit(id);
      const canEditData = canEditRes.data?.canEdit ?? false;
      setCanEdit(canEditData);

      if (!canEditData) {
        toast.info('Hóa đơn này không thể sửa! Chỉ có thể sửa hóa đơn ở trạng thái "Chờ xác nhận".');
        navigate(`/DetailHoaDon/${id}`);
        return;
      }
      // 2. Load chi tiết hóa đơn
      const detailRes = await hoaDonApi.getDetail(id);
      const invoiceData = detailRes.data?.data || detailRes.data;
      setInvoice(invoiceData);
      setFormData({
        idKhachHang: invoiceData.khachHang?.id || null,
        hoTenKhachHang: invoiceData.tenKhachHang || '',
        sdtKhachHang: invoiceData.sdtKhachHang || '',
        emailKhachHang: invoiceData.emailKhachHang || '',
        diaChiKhachHang: invoiceData.diaChiKhachHang || '',
        phiVanChuyen: invoiceData.phiVanChuyen || 0,
        idPhieuGiamGia: invoiceData.phieuGiamGia?.id || null,
        ghiChu: invoiceData.ghiChu || '',
        chiTietSanPhams: (invoiceData.chiTietSanPhams || []).map(ct => ({
          id: ct.idChiTietSanPham ?? ct.chiTietSanPham?.id, // id của chi tiết hóa đơn
          idChiTietSanPham: ct.idChiTietSanPham ?? null, // Không fallback sang id hóa đơn
          tenSanPham: ct.tenSanPham || '',
          mauSac: ct.mauSac || '',
          kichThuoc: ct.kichThuoc || '',
          soLuong: ct.soLuong || 1,
          giaBan: ct.giaBan || 0,
          thanhTien: ct.thanhTien || 0,
          ghiChu: ct.ghiChu || ''
        }))

      });
      console.log(invoiceData);


      try {
        const productsRes = await hoaDonApi.getAllProducts();
        const rawData = productsRes.data?.data || productsRes.data || [];
        const productsData = Array.isArray(rawData) ? rawData : [];
        setAllProducts(productsData);
      } catch (err) {
        console.error('❌ Lỗi load sản phẩm:', err);
        toast.warn('Không thể tải danh sách sản phẩm. Vui lòng kiểm tra API.');
      }


      // 5. Load danh sách phiếu giảm giá - ⭐ FIXED
      try {
        const pggRes = await hoaDonApi.getAllPhieuGiamGia();

        // ⭐ XỬ LÝ RESPONSE ĐÚNG FORMAT
        const pggData = pggRes.data?.data || pggRes.data || [];

        setAllPhieuGiamGia(pggData);
      } catch (err) {
        console.warn('⚠️ Không load được phiếu giảm giá:', err);
      }

    } catch (error) {
      console.error('❌ Lỗi load data:', error);
      toast.error('Không thể tải dữ liệu hóa đơn');
      navigate('/bill');
    } finally {
      setLoading(false);
    }
  };

  // ================== HANDLE CHANGES ==================
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };
  const handleRemoveProduct = (index) => {
    if (window.confirm('Xóa sản phẩm này khỏi hóa đơn?')) {
      const newProducts = formData.chiTietSanPhams.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        chiTietSanPhams: newProducts
      }));
    }
  };

  const handleSelectProduct = (product) => {
    setSelectedProductDetail(product);
    const variants = allProducts.filter(p =>
      (p?.idChiTietSanPham === product?.idChiTietSanPham) ||
      (p.tenSanPham === product.tenSanPham)
    );
    setProductVariants(variants);
    setSelectedVariant(null);
    setSelectedQuantity(1);
  };
  // console.log(filteredProducts)
    ;
  const handleConfirmAddProduct = () => {
    if (!selectedVariant) {
      toast.info('Vui lòng chọn biến thể sản phẩm (màu, kích cỡ)');
      return;
    }

    if (selectedQuantity <= 0) {
      toast.info('Vui lòng nhập số lượng hợp lệ');
      return;
    }
    const variantId = selectedVariant.idChiTietSanPham;
    console.log(selectedVariant);
        setFormData(prev => {
      const existingIndex = prev.chiTietSanPhams.findIndex(
        ct => ct.idChiTietSanPham === variantId
      );
      let updatedProducts;

      if (existingIndex !== -1) {
        updatedProducts = [...prev.chiTietSanPhams];
        const existing = updatedProducts[existingIndex];

        const newSoLuong = existing.soLuong + parseInt(selectedQuantity);
        updatedProducts[existingIndex] = {
          ...existing,
          soLuong: newSoLuong,
          thanhTien: newSoLuong * existing.giaBan,
        };

        toast.success(`Đã cập nhật số lượng: ${existing.tenSanPham} (SL: ${newSoLuong})`);
      } else {
        // ✅ Nếu chưa có, thêm sản phẩm mới
        const newProduct = {
          idChiTietSanPham: selectedVariant?.idChiTietSanPham,
          tenSanPham: selectedVariant.sanPham?.tenSanPham ?? selectedVariant.tenSanPham ?? "Không rõ tên",
          mauSac: selectedVariant.mauSac?.tenMau ?? selectedVariant.mauSac ?? "Không rõ màu",
          kichThuoc: selectedVariant.kichThuoc?.tenKichThuoc ?? selectedVariant.kichThuoc ?? "Không rõ size",
          soLuong: parseInt(selectedQuantity),
          giaBan: selectedVariant.giaBan ?? 0,
          thanhTien: parseInt(selectedQuantity) * (selectedVariant.giaBan ?? 0),
          ghiChu: ''
        };

        updatedProducts = [...prev.chiTietSanPhams, newProduct];
        toast.success(`Đã thêm: ${newProduct.tenSanPham} (SL: ${selectedQuantity})`);
      }

      return {
        ...prev,
        chiTietSanPhams: updatedProducts
      };
    });
    setSearchTerm('');
    setFilteredProducts([]);
    setSelectedProductDetail(null);
    setProductVariants([]);
    setSelectedVariant(null);
    setSelectedQuantity(1);
    setShowAddProduct(false);
  };


  const handleSearchProduct = (value) => {
    setSearchTerm(value);

    if (!value.trim()) {
      setFilteredProducts([]);
      return;
    }
    const filtered = allProducts.filter(product => {
      const searchLower = value.toLowerCase();
      const tenSanPham = product.sanPham?.tenSanPham || product.tenSanPham || '';
      const moTa = product.moTa || '';
      const maVach = product.maVach || '';

      return (
        tenSanPham.toLowerCase().includes(searchLower) ||
        moTa.toLowerCase().includes(searchLower) ||
        maVach.toLowerCase().includes(searchLower)
      );
    });
    console.log(filtered);


    setFilteredProducts(filtered);
  };
  console.log(formData.chiTietSanPhams);
  // ================== VALIDATION ==================
  const validateForm = () => {
    const newErrors = {};

    if (!formData.hoTenKhachHang?.trim()) {
      newErrors.hoTenKhachHang = 'Vui lòng nhập tên khách hàng';
    }

    if (!formData.sdtKhachHang?.trim()) {
      newErrors.sdtKhachHang = 'Vui lòng nhập số điện thoại';
    } else if (!/^[0-9]{10}$/.test(formData.sdtKhachHang)) {
      newErrors.sdtKhachHang = 'Số điện thoại không hợp lệ (10 số)';
    }

    if (formData.emailKhachHang && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.emailKhachHang)) {
      newErrors.emailKhachHang = 'Email không hợp lệ';
    }

    if (!formData.diaChiKhachHang?.trim()) {
      newErrors.diaChiKhachHang = 'Vui lòng nhập địa chỉ';
    }

    if (formData.chiTietSanPhams.length === 0) {
      newErrors.chiTietSanPhams = 'Hóa đơn phải có ít nhất 1 sản phẩm';
    }
    formData.chiTietSanPhams.forEach((product, index) => {
      if (!product.soLuong || product.soLuong <= 0) {
        newErrors[`product_${index}_soLuong`] = 'Số lượng phải lớn hơn 0';
      }
      if (!product.giaBan || product.giaBan <= 0) {
        newErrors[`product_${index}_giaBan`] = 'Giá bán phải lớn hơn 0';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ================== SUBMIT ==================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.info('Vui lòng kiểm tra lại thông tin');
      return;
    }
    if (!window.confirm('Xác nhận cập nhật hóa đơn?')) {
      return;
    }
    try {
      setSaving(true);
      const requestBody = {
        hoTenKhachHang: formData.hoTenKhachHang,
        sdtKhachHang: formData.sdtKhachHang,
        emailKhachHang: formData.emailKhachHang,
        diaChiKhachHang: formData.diaChiKhachHang,
        phiVanChuyen: formData.phiVanChuyen,
        idPhieuGiamGia: formData.idPhieuGiamGia,
        ghiChu: formData.ghiChu,
        chiTietSanPhams: formData.chiTietSanPhams.map(ct => ({
          idChiTietSanPham: ct.idChiTietSanPham,
          soLuong: ct.soLuong,
          giaBan: ct.giaBan,
          ghiChu: ct.ghiChu
        }))

      };

      console.log(requestBody);
      const response = await hoaDonApi.updateHoaDon(id, requestBody);
      const result = response.data;
      if (result.success || response.status === 200) {
        toast.success('Cập nhật hóa đơn thành công!');
        navigate(`/DetailHoaDon/${id}`, {
          state: { refreshData: true }  // ← Thêm cái này
        });
      } else {
        toast.error('Lỗi: ' + (result.message || 'Không thể cập nhật'));
      }
    } catch (error) {
      console.error('❌ Lỗi update:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Không thể cập nhật hóa đơn';
      toast.error('Lỗi: ' + errorMsg);
    } finally {
      setSaving(false);
    }
  };
  const handleCloseModal = () => {
    setShowAddProduct(false);
    setSearchTerm('');
    setFilteredProducts([]);
    setSelectedProductDetail(null);
    setProductVariants([]);
    setSelectedVariant(null);
    setSelectedQuantity(1);
  };
  console.log(formData.chiTietSanPhams);
  console.log(selectedVariant);
  const handleUploadImage = async (index, e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      // Gọi API upload ảnh lên BE
      const res = await axios.post("http://localhost:8080/api/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const imageUrl = res.data;
      setFormData((prev) => {
        const updated = [...prev.chiTietSanPhams];
        updated[index].hinhAnh = imageUrl;
        return { ...prev, chiTietSanPhams: updated };
      });

      toast.success("Tải ảnh lên thành công!");
    } catch (error) {
      console.error("❌ Lỗi upload ảnh:", error);
      toast.error("Không thể tải ảnh lên");
    }
  };
  // ================== TÍNH TOÁN ==================
  const formatMoney = (amount) => {
    if (!amount && amount !== 0) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const tinhTongTien = () => {
    const tongSanPham = formData.chiTietSanPhams.reduce(
      (sum, ct) => sum + (parseFloat(ct.thanhTien) || 0),
      0
    );
    let tienGiamGia = 0;
    if (formData.idPhieuGiamGia) {
      const pgg = allPhieuGiamGia.find(p => p.id === parseInt(formData.idPhieuGiamGia));
      if (pgg) {  
        const loaiGiam = pgg.loaiGiamGia;
        if (loaiGiam === 1 || loaiGiam === true) {
          tienGiamGia = tongSanPham * (pgg.giaTriGiamGia / 100);
          if (pgg.mucGiaGiamToiDa && tienGiamGia > pgg.mucGiaGiamToiDa) {
            tienGiamGia = pgg.mucGiaGiamToiDa;
          }
        } else {
          tienGiamGia = pgg.giaTriGiamGia;
        }
      }
    }

    const phiVC = parseFloat(formData.phiVanChuyen) || 0;
    const tongCong = tongSanPham + phiVC - tienGiamGia;

    return { tongSanPham, tienGiamGia, phiVC, tongCong };
  };

  const { tongSanPham, tienGiamGia, phiVC, tongCong } = tinhTongTien();

  // ================== RENDER ==================
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
          <p className="text-gray-600 font-medium">Đang tải thông tin...</p>
        </div>
      </div>
    );
  }

  if (!canEdit) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <span className="text-6xl">🚫</span>
          <p className="text-red-600 font-semibold text-lg mt-4">Hóa đơn này không thể sửa</p>
          <button
            onClick={() => navigate(`/DetailHoaDon/${id}`)}
            className="mt-6 px-6 py-3 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700"
          >
            ← Quay lại
          </button>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm">
          {/* Header */}
          <div className="border-b px-6 py-4 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Sửa hóa đơn</h2>
              <p className="text-sm text-gray-500">Mã hóa đơn: {invoice?.maHoaDon}</p>
            </div>
            <button
              onClick={() => navigate(`/DetailHoaDon/${id}`)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
            >
              ← Quay lại
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            {/* Thông tin khách hàng */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center text-gray-700">
                <span className="mr-2">👤</span> Thông tin khách hàng
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">
                    Họ tên <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.hoTenKhachHang}
                    onChange={(e) => handleInputChange('hoTenKhachHang', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${errors.hoTenKhachHang
                      ? 'border-red-500 focus:ring-red-200'
                      : 'border-gray-300 focus:ring-blue-200'
                      }`}
                  />
                  {errors.hoTenKhachHang && (
                    <p className="text-red-500 text-sm mt-1">{errors.hoTenKhachHang}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">
                    Số điện thoại <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.sdtKhachHang}
                    onChange={(e) => handleInputChange('sdtKhachHang', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${errors.sdtKhachHang
                      ? 'border-red-500 focus:ring-red-200'
                      : 'border-gray-300 focus:ring-blue-200'
                      }`}
                  />
                  {errors.sdtKhachHang && (
                    <p className="text-red-500 text-sm mt-1">{errors.sdtKhachHang}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Email</label>
                  <input
                    type="email"
                    value={formData.emailKhachHang}
                    onChange={(e) => handleInputChange('emailKhachHang', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${errors.emailKhachHang
                      ? 'border-red-500 focus:ring-red-200'
                      : 'border-gray-300 focus:ring-blue-200'
                      }`}
                  />
                  {errors.emailKhachHang && (
                    <p className="text-red-500 text-sm mt-1">{errors.emailKhachHang}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">
                    Địa chỉ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.diaChiKhachHang}
                    onChange={(e) => handleInputChange('diaChiKhachHang', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${errors.diaChiKhachHang
                      ? 'border-red-500 focus:ring-red-200'
                      : 'border-gray-300 focus:ring-blue-200'
                      }`}
                  />
                  {errors.diaChiKhachHang && (
                    <p className="text-red-500 text-sm mt-1">{errors.diaChiKhachHang}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Chi tiết sản phẩm */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold flex items-center text-gray-700">
                  <span className="mr-2">📦</span> Chi tiết sản phẩm
                </h3>
                {/* <button
                  type="button"
                  onClick={() => setShowAddProduct(true)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium transition-all"
                >
                  + Thêm sản phẩm
                </button> */}
              </div>

              {errors.chiTietSanPhams && (
                <p className="text-red-500 text-sm mb-2">{errors.chiTietSanPhams}</p>
              )}

              <div className="space-y-3">
                {formData.chiTietSanPhams.map((product, index) => (
                  <div
                    key={index}
                    className="border rounded-lg p-4 bg-gray-50 flex flex-col md:flex-row gap-4 items-start"
                  >
                    {/* Hình ảnh sản phẩm */}
                    <div className="w-24 h-24 flex-shrink-0 overflow-hidden rounded-lg border bg-white relative">
                      <img
                        src={
                          product.hinhAnh ||
                          product.anhSanPham ||
                          product.sanPham?.anhSanPham ||
                          "https://via.placeholder.com/100x100?text=No+Image"
                        }
                        alt={product.tenSanPham}
                        className="w-full h-full object-cover"
                      />
                      <label
                        className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-xs text-center py-1 cursor-pointer hover:bg-opacity-80"
                      >
                        Tải ảnh
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleUploadImage(index, e)}
                          className="hidden"
                        />
                      </label>
                    </div>


                    {/* Thông tin sản phẩm */}
                    <div className="flex-1 w-full">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-medium text-gray-800 text-lg">
                            {product.tenSanPham}
                          </p>
                          <p className="text-sm text-gray-600">
                            Màu: {product.mauSac} | Size: {product.kichThuoc}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveProduct(index)}
                          className="text-red-500 hover:text-red-700 ml-4 font-medium"
                        >
                          🗑️ Xóa
                        </button>
                      </div>

                      <div className="grid grid-cols-4 gap-3">
                        <div>
                          <label className="block text-sm font-medium mb-1 text-gray-700">
                            Số lượng
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={product.soLuong}
                            readOnly
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${errors[`product_${index}_soLuong`]
                              ? 'border-red-500 focus:ring-red-200'
                              : 'border-gray-300 focus:ring-blue-200'
                              }`}
                          />
                          {errors[`product_${index}_soLuong`] && (
                            <p className="text-red-500 text-xs mt-1">
                              {errors[`product_${index}_soLuong`]}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-1 text-gray-700">
                            Đơn giá
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={product.giaBan}
                            readOnly
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${errors[`product_${index}_giaBan`]
                              ? 'border-red-500 focus:ring-red-200'
                              : 'border-gray-300 focus:ring-blue-200'
                              }`}
                          />
                          {errors[`product_${index}_giaBan`] && (
                            <p className="text-red-500 text-xs mt-1">
                              {errors[`product_${index}_giaBan`]}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-1 text-gray-700">
                            Thành tiền
                          </label>
                          <input
                            type="text"
                            value={formatMoney(product.thanhTien)}
                            readOnly
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-1 text-gray-700">
                            Ghi chú
                          </label>
                          <input
                            type="text"
                            value={product.ghiChu}
                            readOnly
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
                            placeholder="Ghi chú..."
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {formData.chiTietSanPhams.length === 0 && (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <p className="text-gray-500">
                      Chưa có sản phẩm nào. Nhấn "Thêm sản phẩm" để bắt đầu.
                    </p>
                  </div>
                )}
              </div>
            </div>

            // ⭐ MODAL MỚI
            {showAddProduct && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 w-full max-w-3xl shadow-xl max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-gray-800">Thêm sản phẩm</h3>
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="text-gray-400 hover:text-gray-600 text-2xl"
                    >
                      ×
                    </button>
                  </div>

                  {!selectedProductDetail ? (
                    <>
                      {/* Thanh tìm kiếm */}
                      <div className="mb-4">
                        <input
                          type="text"
                          value={searchTerm}
                          onChange={(e) => handleSearchProduct(e.target.value)}
                          placeholder="Tìm kiếm theo tên, mô tả hoặc mã vạch sản phẩm..."
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm"
                          autoFocus
                        />
                        {searchTerm && (
                          <p className="text-sm text-gray-500 mt-1">
                            Tìm thấy {filteredProducts.length} sản phẩm
                          </p>
                        )}
                      </div>

                      {/* Danh sách sản phẩm */}
                      <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
                        {filteredProducts.length > 0 ? (
                          <div className="divide-y">
                            {filteredProducts.map(product => (
                              <div
                                key={product.id}
                                onClick={() => handleSelectProduct(product)}
                                className="p-4 hover:bg-blue-50 cursor-pointer transition-colors"
                              >
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <p className="font-medium text-gray-800">
                                      {product.sanPham?.tenSanPham || product.tenSanPham || 'Không rõ tên'}
                                    </p>
                                    <p className="text-sm text-gray-600 mt-1">
                                      {product.moTa || 'Không có mô tả'}
                                    </p>
                                    <div className="flex gap-4 text-xs text-gray-500 mt-2">
                                      <span>Mã: {product.maVach}</span>
                                      <span>Tồn: {product.soLuongTon}</span>
                                      <span className="font-medium text-orange-600">
                                        {new Intl.NumberFormat('vi-VN', {
                                          style: 'currency',
                                          currency: 'VND'
                                        }).format(product.giaBan)}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="ml-4 text-blue-600 text-2xl flex-shrink-0">→</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : searchTerm ? (
                          <div className="p-8 text-center text-gray-500">
                            <p>Không tìm thấy sản phẩm nào 🔍</p>
                          </div>
                        ) : (
                          <div className="p-8 text-center text-gray-500">
                            <p>Nhập từ khóa để tìm kiếm sản phẩm</p>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Chọn biến thể */}
                      <div className="mb-4">
                        <button
                          type="button"
                          onClick={() => setSelectedProductDetail(null)}
                          className="text-blue-600 hover:text-blue-800 mb-3 font-medium text-sm"
                        >
                          ← Quay lại tìm kiếm
                        </button>

                        <div className="bg-gray-50 p-4 rounded-lg mb-4">
                          <p className="font-semibold text-gray-800">
                            {selectedProductDetail.sanPham?.tenSanPham || selectedProductDetail.tenSanPham}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            {selectedProductDetail.moTa}
                          </p>
                        </div>

                        <div className="space-y-4">
                          {/* Chọn biến thể (màu, size) */}
                          <div>
                            <label className="block text-sm font-medium mb-2 text-gray-700">
                              Chọn biến thể (Màu - Kích cỡ) <span className="text-red-500">*</span>
                            </label>
                            <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-lg">
                              <div className="divide-y">
                                {productVariants.map(variant => (
                                  <div
                                    key={variant.id}
                                    onClick={() => setSelectedVariant(variant)}
                                    className={`p-3 cursor-pointer transition-colors ${selectedVariant?.id === variant.id
                                      ? 'bg-blue-100 border-l-4 border-l-blue-500'
                                      : 'hover:bg-gray-50'
                                      }`}
                                  >
                                    <div className="flex justify-between items-center">
                                      <div>
                                        <p className="font-medium text-gray-800">
                                          {variant.mauSac?.tenMau || variant.mauSac || 'N/A'} - {variant.kichThuoc?.tenKichThuoc || variant.kichThuoc || 'N/A'}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                          Tồn kho: {variant.soLuongTon} | Giá: {new Intl.NumberFormat('vi-VN', {
                                            style: 'currency',
                                            currency: 'VND'
                                          }).format(variant.giaBan)}
                                        </p>
                                      </div>
                                      {selectedVariant?.id === variant.id && (
                                        <span className="text-blue-600 text-lg">✓</span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Chọn số lượng */}
                          {selectedVariant && (
                            <div>
                              <label className="block text-sm font-medium mb-2 text-gray-700">
                                Số lượng <span className="text-red-500">*</span>
                              </label>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setSelectedQuantity(Math.max(1, selectedQuantity - 1))}
                                  className="px-3 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 font-medium"
                                >
                                  −
                                </button>
                                <input
                                  type="number"
                                  value={selectedQuantity}
                                  onChange={(e) => setSelectedQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                  min="1"
                                  max={selectedVariant.soLuongTon}
                                  className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-blue-200"
                                />
                                <button
                                  type="button"
                                  onClick={() => setSelectedQuantity(Math.min(selectedVariant.soLuongTon, selectedQuantity + 1))}
                                  className="px-3 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 font-medium"
                                >
                                  +
                                </button>
                                <span className="text-sm text-gray-500 ml-2">
                                  (Tồn: {selectedVariant.soLuongTon})
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Hiển thị tổng */}
                          {selectedVariant && (
                            <div className="bg-blue-50 p-3 rounded-lg">
                              <div className="flex justify-between items-center">
                                <span className="font-medium text-gray-700">Tổng tiền:</span>
                                <span className="text-lg font-bold text-orange-600">
                                  {new Intl.NumberFormat('vi-VN', {
                                    style: 'currency',
                                    currency: 'VND'
                                  }).format(selectedQuantity * selectedVariant.giaBan)}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="flex justify-end gap-2 mt-4">
                        <button
                          type="button"
                          onClick={handleCloseModal}
                          className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400 font-medium transition-all"
                        >
                          Hủy
                        </button>
                        <button
                          type="button"
                          onClick={handleConfirmAddProduct}
                          disabled={!selectedVariant}
                          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-all"
                        >
                          Thêm vào hóa đơn
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Phí vận chuyển & Giảm giá */}
            <div className="mb-6 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Phí vận chuyển (₫)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.phiVanChuyen}
                  onChange={(e) => handleInputChange('phiVanChuyen', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Phiếu giảm giá</label>
                <select
                  value={formData.idPhieuGiamGia || ''}
                  onChange={(e) => handleInputChange('idPhieuGiamGia', e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  <option value="">-- Không sử dụng --</option>
                  {allPhieuGiamGia.map(pgg => (
                    <option key={pgg.id} value={pgg.id}>
                      {pgg.maGiamGia} - {pgg.tenChuongTrinh}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Ghi chú */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-1 text-gray-700">Ghi chú</label>
              <textarea
                value={formData.ghiChu}
                readOnly
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="Nhập ghi chú..."
              />
            </div>

            {/* Tổng tiền */}
            <div className="border-t pt-4 mb-6">
              <div className="flex justify-end">
                <div className="w-96 bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between mb-2 text-gray-700">
                    <span>Tạm tính:</span>
                    <span className="font-medium">{formatMoney(tongSanPham)}</span>
                  </div>
                  <div className="flex justify-between mb-2 text-gray-700">
                    <span>Phí vận chuyển:</span>
                    <span className="font-medium">{formatMoney(phiVC)}</span>
                  </div>
                  <div className="flex justify-between mb-2 text-red-600">
                    <span>Giảm giá:</span>
                    <span className="font-medium">-{formatMoney(tienGiamGia)}</span>
                  </div>
                  <div className="flex justify-between text-xl font-bold border-t border-gray-300 pt-3 mt-2">
                    <span className="text-gray-800">Tổng cộng:</span>
                    <span className="text-orange-600">{formatMoney(tongCong)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate(`/DetailHoaDon/${id}`)}
                className="px-6 py-2 bg-gray-300 rounded-lg hover:bg-gray-400 font-medium transition-all"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-all flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Đang lưu...
                  </>
                ) : (
                  <>
                    💾 Lưu thay đổi
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditHoaDon;