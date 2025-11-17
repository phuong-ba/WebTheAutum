import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  Heart, 
  ShoppingCart, 
  Share, 
  Minus, 
  Plus,
  Check,
  X,
  ArrowLeft,
  Star,
  Truck,
  ShieldCheck,
  Package
} from '@phosphor-icons/react';

const formatCurrency = (amount) => {
  if (typeof amount !== 'number') return amount;
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
};

export default function ProductDetail() {
  const { idSanPham } = useParams();
  const navigate = useNavigate();

  const [productDetail, setProductDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedColorId, setSelectedColorId] = useState(null);
  const [selectedCtspId, setSelectedCtspId] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!idSanPham) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorMessage("");
    
    fetch(`http://localhost:8080/api/san-pham/customer/detail/${idSanPham}`)
      .then(res => {
        if (!res.ok) {
          if (res.status === 404) {
             throw new Error("Sản phẩm không tồn tại.");
          }
          throw new Error("Không thể tải chi tiết sản phẩm.");
        }
        return res.json();
      })
      .then(data => {
        if (data.isSuccess && data.data) {
          setProductDetail(data.data);
          if (data.data.mauSacList && data.data.mauSacList.length > 0) {
            const firstColor = data.data.mauSacList[0];
            setSelectedColorId(firstColor.idMauSac);
            // Tự động chọn size đầu tiên của màu đầu tiên
            if (firstColor.kichThuocList && firstColor.kichThuocList.length > 0) {
              setSelectedCtspId(firstColor.kichThuocList[0].idCtsp);
            }
          }
        } else {
          throw new Error(data.message || "Lỗi dữ liệu từ server.");
        }
      })
      .catch(err => {
        toast.error(err.message);
        setErrorMessage(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [idSanPham]);

  // Lấy màu đang chọn
  const selectedColor = useMemo(() => {
    return productDetail?.mauSacList.find(
      (m) => m.idMauSac === selectedColorId
    );
  }, [selectedColorId, productDetail]);

  // Lấy TẤT CẢ các size có trong sản phẩm
  const allSizes = useMemo(() => {
    if (!productDetail?.mauSacList) return [];
    
    const sizeMap = new Map();
    
    productDetail.mauSacList.forEach(color => {
      color.kichThuocList.forEach(size => {
        if (!sizeMap.has(size.tenKichThuoc)) {
          sizeMap.set(size.tenKichThuoc, {
            tenKichThuoc: size.tenKichThuoc,
            variants: []
          });
        }
        sizeMap.get(size.tenKichThuoc).variants.push({
          idCtsp: size.idCtsp,
          idMauSac: color.idMauSac,
          soLuongTon: size.soLuongTon,
          giaBan: size.giaBan
        });
      });
    });
    
    const sizeOrder = ["XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL", "Free size", "One size"];
    
    return Array.from(sizeMap.values()).sort((a, b) => {
      const indexA = sizeOrder.indexOf(a.tenKichThuoc);
      const indexB = sizeOrder.indexOf(b.tenKichThuoc);
      return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
    });
  }, [productDetail]);

  // Kiểm tra size có available cho màu đã chọn không
  const isSizeAvailableForColor = (sizeData) => {
    if (!selectedColorId) return false;
    const variant = sizeData.variants.find(v => v.idMauSac === selectedColorId);
    return variant && variant.soLuongTon > 0;
  };

  // Lấy variant cho size và màu đã chọn
  const finalSelectedVariant = useMemo(() => {
    if (!selectedCtspId || !allSizes.length) return null;
    
    for (const sizeData of allSizes) {
      const variant = sizeData.variants.find(v => v.idCtsp === selectedCtspId);
      if (variant) return { ...variant, tenKichThuoc: sizeData.tenKichThuoc };
    }
    return null;
  }, [selectedCtspId, allSizes]);

  // Tính giá hiển thị
  const displayPrice = useMemo(() => {
    // Nếu đã chọn size, hiển thị giá của size đó
    if (finalSelectedVariant) {
      return finalSelectedVariant.giaBan;
    }
    
    // Nếu chỉ chọn màu, hiển thị giá của size đầu tiên của màu đó
    if (selectedColor && selectedColor.kichThuocList && selectedColor.kichThuocList.length > 0) {
      return selectedColor.kichThuocList[0].giaBan;
    }
    
    // Fallback: giá của size đầu tiên của màu đầu tiên
    return productDetail?.mauSacList[0]?.kichThuocList[0]?.giaBan || 0;
  }, [finalSelectedVariant, selectedColor, productDetail]);

  // Tính khoảng giá của màu đang chọn
  const colorPriceRange = useMemo(() => {
    if (!selectedColor || !selectedColor.kichThuocList) return null;
    
    const prices = selectedColor.kichThuocList.map(kt => kt.giaBan);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    
    return { minPrice, maxPrice };
  }, [selectedColor]);

  const displayImage = selectedColor?.duongDanAnh || productDetail?.mauSacList[0]?.duongDanAnh || 'https://via.placeholder.com/600x800?text=No+Image';
  const maxQuantity = finalSelectedVariant?.soLuongTon || 0;
  const isOutOfStock = maxQuantity === 0;

  const handleSelectColor = (idMauSac) => {
    setSelectedColorId(idMauSac);
    setSelectedCtspId(null); // Reset size khi đổi màu
    setQuantity(1);
    setErrorMessage("");
  };

  const handleSelectSize = (sizeData) => {
    if (!selectedColorId) {
      setErrorMessage("Vui lòng chọn màu sắc trước.");
      return;
    }
    
    const variant = sizeData.variants.find(v => v.idMauSac === selectedColorId);
    
    if (!variant || variant.soLuongTon === 0) {
      setErrorMessage(`Size ${sizeData.tenKichThuoc} không có sẵn cho màu này.`);
      return;
    }
    
    setSelectedCtspId(variant.idCtsp);
    setQuantity(1);
    setErrorMessage("");
  };

  const handleQuantityChange = (type) => {
    setErrorMessage("");
    if (type === 'increase') {
      if (quantity < maxQuantity) {
        setQuantity(prev => prev + 1);
      } else {
        toast.warn(`Chỉ có ${maxQuantity} sản phẩm trong kho.`);
      }
    } else {
      if (quantity > 1) {
        setQuantity(prev => prev - 1);
      }
    }
  };

  const handleAddToCart = () => {
    if (!selectedColorId) {
      setErrorMessage("Vui lòng chọn màu sắc.");
      return;
    }
    if (!selectedCtspId) {
      setErrorMessage("Vui lòng chọn kích thước.");
      return;
    }
    if (quantity <= 0 || quantity > maxQuantity) {
      setErrorMessage(`Số lượng không hợp lệ. Tối đa ${maxQuantity} sản phẩm.`);
      return;
    }

    try {
      const cartJson = localStorage.getItem("cart") || "[]";
      let cart = JSON.parse(cartJson);
      
      const existingItemIndex = cart.findIndex(
        (item) => item.id === finalSelectedVariant.idCtsp
      );

      if (existingItemIndex > -1) {
        if (cart[existingItemIndex].quantity + quantity > maxQuantity) {
            toast.error(`Vượt quá ${maxQuantity} sản phẩm tồn kho.`);
            return;
        }
        cart[existingItemIndex].quantity += quantity;
      } else {
        const newItem = {
          id: finalSelectedVariant.idCtsp,
          tenSanPham: productDetail.tenSanPham,
          hinhAnh: selectedColor.duongDanAnh,
          gia: finalSelectedVariant.giaBan,
          mauSac: selectedColor.tenMauSac,
          size: finalSelectedVariant.tenKichThuoc,
          quantity: quantity,
        };
        cart.push(newItem);
      }

      localStorage.setItem("cart", JSON.stringify(cart));
      toast.success(`Đã thêm ${quantity} sản phẩm vào giỏ hàng!`);
      
    } catch (error) {
      console.error("Lỗi khi thêm vào giỏ hàng:", error);
      toast.error("Không thể thêm vào giỏ hàng.");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-orange-50/30 via-white to-orange-50/30">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-200 border-t-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Đang tải sản phẩm...</p>
        </div>
      </div>
    );
  }

  if (errorMessage && !productDetail) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-orange-50/30 via-white to-orange-50/30">
        <div className="text-center p-10 bg-white border border-red-200 rounded-2xl shadow-lg max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X size={32} className="text-red-500" weight="bold" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Lỗi!</h2>
          <p className="text-gray-600 mb-6">{errorMessage}</p>
          <button 
            onClick={() => navigate('/')} 
            className="px-6 py-3 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition-colors"
          >
            Quay về trang chủ
          </button>
        </div>
      </div>
    );
  }
  
  if (!productDetail) {
    return <div className="text-center p-10 text-gray-600">Không có dữ liệu sản phẩm.</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50/30 via-white to-orange-50/30">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb & Back */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 font-medium transition-colors"
          >
            <ArrowLeft size={20} weight="bold" />
            Quay lại
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Cột Trái: Hình ảnh */}
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 p-4">
            <img 
              src={displayImage} 
              alt={productDetail.tenSanPham}
              className="w-full h-auto object-contain max-h-[600px]"
            />
          </div>

          {/* Cột Phải: Thông tin */}
          <div className="flex flex-col gap-6">
            {/* Title & Rating */}
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-3">
                {productDetail.tenSanPham}
              </h1>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={16} weight="fill" className="text-orange-400" />
                  ))}
                  <span className="text-gray-600 ml-1">(4.8)</span>
                </div>
                <span className="text-gray-400">|</span>
                <span className="text-gray-600">Đã bán 1.2k</span>
              </div>
            </div>

            {/* Price - Hiển thị theo màu và size */}
            <div className="bg-orange-50 border border-orange-100 rounded-xl p-4">
              {finalSelectedVariant ? (
                // Đã chọn cả màu và size - Hiển thị giá chính xác
                <div className="text-3xl font-bold text-orange-600">
                  {formatCurrency(displayPrice)}
                </div>
              ) : selectedColor && colorPriceRange ? (
                // Chỉ chọn màu - Hiển thị khoảng giá của màu
                <div>
                  {colorPriceRange.minPrice === colorPriceRange.maxPrice ? (
                    <div className="text-3xl font-bold text-orange-600">
                      {formatCurrency(colorPriceRange.minPrice)}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="text-3xl font-bold text-orange-600">
                        {formatCurrency(colorPriceRange.minPrice)}
                      </div>
                      <span className="text-gray-400 text-xl">-</span>
                      <div className="text-3xl font-bold text-orange-600">
                        {formatCurrency(colorPriceRange.maxPrice)}
                      </div>
                    </div>
                  )}
                  <p className="text-sm text-gray-500 mt-1">Chọn size để xem giá chính xác</p>
                </div>
              ) : (
                <div className="text-3xl font-bold text-orange-600">
                  {formatCurrency(displayPrice)}
                </div>
              )}
            </div>

            {/* Color Selection */}
            <div className="border-t pt-6">
              <div className="mb-3">
                <span className="text-sm font-semibold text-gray-700">Màu sắc: </span>
                <span className="text-sm text-gray-600">{selectedColor?.tenMauSac || 'Chọn màu'}</span>
              </div>
              <div className="flex flex-wrap gap-3">
                {productDetail.mauSacList.map((color) => (
                  <button
                    key={color.idMauSac}
                    onClick={() => handleSelectColor(color.idMauSac)}
                    className={`relative w-16 h-16 rounded-lg border-2 overflow-hidden transition-all
                      ${selectedColorId === color.idMauSac 
                        ? 'border-orange-500 ring-2 ring-orange-200' 
                        : 'border-gray-200 hover:border-gray-300'}
                    `}
                  >
                    <img 
                      src={color.duongDanAnh || 'https://via.placeholder.com/100'} 
                      alt={color.tenMauSac} 
                      className="w-full h-full object-cover"
                    />
                    {selectedColorId === color.idMauSac && (
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                        <Check size={20} weight="bold" className="text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Size Selection - Hiển thị tất cả */}
            <div className="border-t pt-6">
              <div className="mb-3">
                <span className="text-sm font-semibold text-gray-700">Kích thước: </span>
                <span className="text-sm text-gray-600">
                  {finalSelectedVariant?.tenKichThuoc || 'Chọn size'}
                </span>
              </div>
              <div className="flex flex-wrap gap-3">
                {allSizes.map((sizeData) => {
                  const isAvailable = isSizeAvailableForColor(sizeData);
                  const isSelected = finalSelectedVariant?.tenKichThuoc === sizeData.tenKichThuoc;
                  
                  return (
                    <button
                      key={sizeData.tenKichThuoc}
                      onClick={() => handleSelectSize(sizeData)}
                      disabled={!isAvailable}
                      className={`min-w-[60px] px-4 py-2.5 rounded-lg border-2 font-medium text-sm transition-all
                        ${isSelected 
                          ? 'bg-orange-500 text-white border-orange-500' 
                          : isAvailable
                          ? 'bg-white text-gray-800 border-gray-200 hover:border-orange-300'
                          : 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed line-through'}
                      `}
                    >
                      {sizeData.tenKichThuoc}
                    </button>
                  );
                })}
              </div>
              {finalSelectedVariant && (
                <p className="text-sm text-gray-500 mt-2">
                  Còn lại: {finalSelectedVariant.soLuongTon} sản phẩm
                </p>
              )}
            </div>

            {/* Quantity */}
            <div className="border-t pt-6">
              <span className="text-sm font-semibold text-gray-700 block mb-3">Số lượng</span>
              <div className="flex items-center gap-4">
                <div className="flex items-center border-2 border-gray-200 rounded-lg">
                  <button 
                    onClick={() => handleQuantityChange('decrease')}
                    disabled={quantity <= 1 || !finalSelectedVariant}
                    className="p-3 hover:bg-gray-50 disabled:opacity-30 transition-colors"
                  >
                    <Minus size={18} weight="bold" />
                  </button>
                  <input 
                    type="number" 
                    min="1" 
                    max={maxQuantity}
                    value={quantity}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (val >= 1 && val <= maxQuantity) setQuantity(val);
                    }}
                    className="w-16 text-center text-lg font-semibold border-x-2 border-gray-200 outline-none"
                    disabled={!finalSelectedVariant}
                  />
                  <button 
                    onClick={() => handleQuantityChange('increase')}
                    disabled={quantity >= maxQuantity || !finalSelectedVariant}
                    className="p-3 hover:bg-gray-50 disabled:opacity-30 transition-colors"
                  >
                    <Plus size={18} weight="bold" />
                  </button>
                </div>
                <span className="text-sm text-gray-500">Tối đa {maxQuantity}</span>
              </div>
              {errorMessage && (
                <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                  <X size={16} weight="bold" />
                  {errorMessage}
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-6">
              <button
                onClick={handleAddToCart}
                disabled={!finalSelectedVariant || isOutOfStock}
                className="flex-1 flex items-center justify-center gap-2 bg-orange-500 text-white py-4 rounded-lg font-semibold text-lg
                  hover:bg-orange-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                <ShoppingCart size={24} weight="bold" />
                {isOutOfStock ? "Hết hàng" : "Thêm vào giỏ"}
              </button>
              <button className="p-4 border-2 border-gray-200 rounded-lg hover:border-red-300 hover:bg-red-50 transition-colors">
                <Heart size={24} />
              </button>
              <button className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors">
                <Share size={24} />
              </button>
            </div>

            {/* Benefits */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Truck size={24} className="text-orange-500" />
                <div className="text-sm">
                  <p className="font-semibold text-gray-800">Miễn phí vận chuyển</p>
                  <p className="text-gray-500">Toàn quốc</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <ShieldCheck size={24} className="text-orange-500" />
                <div className="text-sm">
                  <p className="font-semibold text-gray-800">Đổi trả 7 ngày</p>
                  <p className="text-gray-500">Miễn phí</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Package size={24} className="text-orange-500" />
                <div className="text-sm">
                  <p className="font-semibold text-gray-800">Hàng chính hãng</p>
                  <p className="text-gray-500">100%</p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Mô tả sản phẩm</h3>
              <div className="text-gray-600 leading-relaxed space-y-2">
                <p>✓ Chất liệu cao cấp, thoáng mát</p>
                <p>✓ Form dáng hiện đại, dễ phối đồ</p>
                <p>✓ Đường may tỉ mỉ, bền đẹp</p>
                <p>✓ Dễ dàng giặt ủi, bảo quản</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}