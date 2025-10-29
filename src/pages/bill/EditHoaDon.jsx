import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import hoaDonApi from '../../api/HoaDonAPI';
import { toast } from 'react-toastify';

const EditHoaDon = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [invoice, setInvoice] = useState(null);

  // Form data - CHỈ GIỮ NHỮNG TRƯỜNG CÓ THỂ SỬA
  const [formData, setFormData] = useState({
    hoTenKhachHang: '',
    sdtKhachHang: '',
    emailKhachHang: '',
    diaChiKhachHang: '',
    ghiChu: ''
  });

  const [errors, setErrors] = useState({});

  // ================== LOAD DATA ==================
  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);

      // 1. Kiểm tra có thể sửa không
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

      // CHỈ SET NHỮNG TRƯỜNG CÓ THỂ SỬA
      setFormData({
        hoTenKhachHang: invoiceData.tenKhachHang || '',
        sdtKhachHang: invoiceData.sdtKhachHang || '',
        emailKhachHang: invoiceData.emailKhachHang || '',
        diaChiKhachHang: invoiceData.diaChiKhachHang || '',
        ghiChu: invoiceData.ghiChu || ''
      });

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

    if (!window.confirm('Xác nhận cập nhật thông tin hóa đơn?')) {
      return;
    }

    try {
      setSaving(true);

      // CHỈ GỬI NHỮNG TRƯỜNG CÓ THỂ SỬA
      const requestBody = {
        hoTenKhachHang: formData.hoTenKhachHang,
        sdtKhachHang: formData.sdtKhachHang,
        emailKhachHang: formData.emailKhachHang,
        diaChiKhachHang: formData.diaChiKhachHang,
        ghiChu: formData.ghiChu
      };

      const response = await hoaDonApi.updateHoaDon(id, requestBody);
      const result = response.data;

      if (result.success || response.status === 200) {
        toast.success('Cập nhật hóa đơn thành công!');
        navigate(`/DetailHoaDon/${id}`, {
          state: { refreshData: true }
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

  // ================== HELPER FUNCTIONS ==================
  const formatMoney = (amount) => {
    if (!amount && amount !== 0) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const tinhTongTien = () => {
    if (!invoice) return { tongSanPham: 0, tienGiamGia: 0, phiVC: 0, tongCong: 0 };

    const tongSanPham = (invoice.chiTietSanPhams || []).reduce(
      (sum, ct) => sum + (parseFloat(ct.thanhTien) || 0),
      0
    );

    let tienGiamGia = 0;
    if (invoice.phieuGiamGia) {
      const pgg = invoice.phieuGiamGia;
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

    const phiVC = parseFloat(invoice.phiVanChuyen) || 0;
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
              <h2 className="text-2xl font-bold text-gray-800">Sửa thông tin hóa đơn</h2>
              <p className="text-sm text-gray-500">Mã hóa đơn: {invoice?.maHoaDon}</p>
              <p className="text-xs text-blue-600 mt-1">
                ℹ️ Chỉ có thể sửa thông tin khách hàng và ghi chú
              </p>
            </div>
            <button
              onClick={() => navigate(`/DetailHoaDon/${id}`)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
            >
              ← Quay lại
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            {/* Thông tin khách hàng - CÓ THỂ SỬA */}
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
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                      errors.hoTenKhachHang
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
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                      errors.sdtKhachHang
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
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                      errors.emailKhachHang
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
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                      errors.diaChiKhachHang
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

            {/* Chi tiết sản phẩm - READONLY */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center text-gray-700">
                <span className="mr-2">📦</span> Chi tiết sản phẩm
                <span className="ml-2 text-xs text-gray-500 font-normal">(Không thể chỉnh sửa)</span>
              </h3>

              <div className="space-y-3">
                {(invoice?.chiTietSanPhams || []).map((product, index) => (
                  <div
                    key={index}
                    className="border rounded-lg p-4 bg-gray-50 flex flex-col md:flex-row gap-4 items-start opacity-75"
                  >
                    {/* Hình ảnh sản phẩm */}
                    <div className="w-24 h-24 flex-shrink-0 overflow-hidden rounded-lg border bg-white">
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
                    </div>

                    {/* Thông tin sản phẩm */}
                    <div className="flex-1 w-full">
                      <div className="mb-3">
                        <p className="font-medium text-gray-800 text-lg">
                          {product.tenSanPham}
                        </p>
                        <p className="text-sm text-gray-600">
                          Màu: {product.mauSac} | Size: {product.kichThuoc}
                        </p>
                      </div>

                      <div className="grid grid-cols-4 gap-3">
                        <div>
                          <label className="block text-sm font-medium mb-1 text-gray-700">
                            Số lượng
                          </label>
                          <input
                            type="number"
                            value={product.soLuong}
                            readOnly
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-1 text-gray-700">
                            Đơn giá
                          </label>
                          <input
                            type="text"
                            value={formatMoney(product.giaBan)}
                            readOnly
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-1 text-gray-700">
                            Thành tiền
                          </label>
                          <input
                            type="text"
                            value={formatMoney(product.thanhTien)}
                            readOnly
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 font-medium"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-1 text-gray-700">
                            Ghi chú
                          </label>
                          <input
                            type="text"
                            value={product.ghiChu || ''}
                            readOnly
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                            placeholder="Không có"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {(!invoice?.chiTietSanPhams || invoice.chiTietSanPhams.length === 0) && (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <p className="text-gray-500">Không có sản phẩm nào</p>
                  </div>
                )}
              </div>
            </div>
   

            {/* Ghi chú - CÓ THỂ SỬA */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-1 text-gray-700">
                Ghi chú
              </label>
              <textarea
                value={formData.ghiChu}
                onChange={(e) => handleInputChange('ghiChu', e.target.value)}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="Nhập ghi chú..."
              />
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