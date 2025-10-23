import React, { useState, useEffect } from 'react';
import { Table, Button, message, Image, Tag, Spin, Collapse, Divider } from 'antd';
import { ArrowLeftOutlined, EyeOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import baseUrl from '@/api/instance';

const { Panel } = Collapse;

export default function MultiProductDetailPage() {
  const { ids } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [productsData, setProductsData] = useState([]);
  
  console.log('📦 Product IDs từ URL:', ids);

  const fetchMultipleProductDetails = async () => {
    if (!ids) return;
    
    const idArray = ids.split(',');
    setLoading(true);
    
    try {
      console.log('🔄 Đang tải chi tiết nhiều sản phẩm...');
      
      const promises = idArray.map(id => 
        baseUrl.get(`/san-pham/${id}/detail`)
      );
      
      const responses = await Promise.all(promises);
      
      const successfulData = responses
        .filter(response => response.data.success)
        .map(response => response.data.data);
      
      console.log('✅ Data từ API:', successfulData);
      setProductsData(successfulData);
      
      if (successfulData.length > 0) {
        message.success(`Tải thành công ${successfulData.length} sản phẩm`);
      }
    } catch (error) {
      console.error('❌ Lỗi API:', error);
      message.error('Lỗi khi tải chi tiết sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMultipleProductDetails();
  }, [ids]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price || 0);
  };

  const productColumns = [
    {
      title: 'STT',
      key: 'stt',
      width: 80,
      align: 'center',
      render: () => (
        <div className="flex items-center justify-center">
          <span>01</span>
        </div>
      )
    },
    {
      title: 'TÊN SẢN PHẨM',
      dataIndex: 'tenSanPham',
      key: 'tenSanPham',
      align: 'center',
      render: (text) => <span className="font-medium">{text}</span>
    },
    {
      title: 'HÃNG',
      dataIndex: 'tenNhaSanXuat',
      key: 'tenNhaSanXuat',
      align: 'center',
    },
    {
      title: 'XUẤT XỨ',
      dataIndex: 'tenXuatXu',
      key: 'tenXuatXu',
      align: 'center',
    },
    {
      title: 'CHẤT LIỆU',
      dataIndex: 'tenChatLieu',
      key: 'tenChatLieu',
      align: 'center',
    },
    {
      title: 'KIỂU DÁNG',
      dataIndex: 'tenKieuDang',
      key: 'tenKieuDang',
      align: 'center',
    },
    {
      title: 'CỔ ÁO',
      dataIndex: 'tenCoAo',
      key: 'tenCoAo',
      align: 'center',
    },
    {
      title: 'TAY ÁO',
      dataIndex: 'tenTayAo',
      key: 'tenTayAo',
      align: 'center',
    },
    {
      title: 'MÔ TẢ',
      dataIndex: 'moTa',
      key: 'moTa',
      align: 'center',
      render: (text) => <span className="text-gray-600 text-sm">{text || 'Chưa có mô tả'}</span>
    },
  ];

  const variantColumns = [
    {
      title: 'STT',
      key: 'stt',
      width: 80,
      align: 'center',
      render: (_, __, index) => (
        <div className="flex items-center justify-center">
          <span>{String(index + 1).padStart(2, '0')}</span>
        </div>
      )
    },
    {
      title: "ẢNH",
      key: "image",
      width: 150,
      align: "center",
      render: (_, record) => {
        const imageUrl = record.anhs?.[0]?.duongDanAnh;
    
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
            {imageUrl ? (
              <>
                <Image
                  src={imageUrl}
                  width={120}
                  height={120}
                  style={{ 
                    objectFit: 'cover', 
                    borderRadius: 4, 
                    border: '1px solid #d9d9d9' 
                  }}
                  preview={{
                    mask: <EyeOutlined />
                  }}
                />
              </>
            ) : (
              <div 
                className="flex flex-col items-center justify-center bg-gray-50 border border-dashed border-gray-300 rounded"
                style={{ width: 120, height: 120 }}
              >
                <span className="text-gray-400 text-sm">No Image</span>
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: "TRỌNG LƯỢNG",
      dataIndex: "trongLuong",
      key: "trongLuong",
      align: "center",
      render: (text) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: 'KÍCH THƯỚC',
      dataIndex: 'tenKichThuoc',
      key: 'tenKichThuoc',
      align: 'center',
      render: (text) => <Tag color="green">{text}</Tag>
    },
    {
      title: 'MÀU SẮC',
      dataIndex: 'tenMauSac',
      key: 'tenMauSac',
      align: 'center',
      render: (text) => <Tag color="volcano">{text}</Tag>
    },
    {
      title: 'GIÁ CẢ',
      dataIndex: 'giaBan',
      key: 'giaBan',
      align: 'center',
      render: (price) => (
        <span className="text-[#E67E22] font-bold text-lg">
          {formatPrice(price)}
        </span>
      )
    },
    {
      title: 'SỐ LƯỢNG',
      dataIndex: 'soLuongTon',
      key: 'soLuongTon',
      align: 'center',
      render: (quantity) => (
        <span className={`font-bold ${quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
          {quantity}
        </span>
      )
    },
    {
      title: 'MÃ VẠCH',
      dataIndex: 'maVach',
      key: 'maVach',
      align: 'center',
      render: (maVach) => (
        <div className="text-center">
          <div className="font-mono text-xs bg-gray-100 p-1 rounded border">
            {maVach}
          </div>
          <div className="text-xs text-gray-500 mt-1">QR Code</div>
        </div>
      )
    },
    {
      title: 'TRẠNG THÁI',
      dataIndex: 'trangThai',
      key: 'trangThai',
      align: 'center',
      render: (status) => (
        <Tag color={status ? 'green' : 'red'}>
          {status ? 'Hoạt động' : 'Ngừng hoạt động'}
        </Tag>
      )
    },
  ];

  const renderProductDetail = (productData, index) => {
    const productDataSource = [
      {
        key: '1',
        tenSanPham: productData.tenSanPham,
        tenNhaSanXuat: productData.tenNhaSanXuat,
        tenXuatXu: productData.tenXuatXu,
        tenChatLieu: productData.tenChatLieu,
        tenKieuDang: productData.tenKieuDang,
        tenCoAo: productData.tenCoAo,
        tenTayAo: productData.tenTayAo,
        moTa: productData.chiTietSanPhams?.[0]?.moTa || 'Chưa có mô tả',
      }
    ];

    const variantDataSource = productData.chiTietSanPhams?.map((variant, idx) => ({
      key: variant.id,
      ...variant,
      stt: idx + 1
    })) || [];

    return (
      <div key={productData.id} className="mb-8">
        <div className="bg-gradient-to-r from-[#E67E22] to-[#D35400] text-white px-6 py-4 rounded-t-lg">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">
              Sản phẩm {index + 1}: {productData.tenSanPham}
            </h2>
            <Tag color="orange" className="text-lg">
              {productData.maSanPham}
            </Tag>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 my-4 px-6">
          <div className="bg-white rounded-lg shadow-md p-4 text-center border-l-4 border-[#E67E22]">
            <div className="text-3xl font-bold text-[#E67E22]">{productData.tongSoLuong || 0}</div>
            <div className="text-gray-600 text-sm mt-1">Tổng số lượng</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 text-center border-l-4 border-green-500">
            <div className="text-xl font-bold text-green-600">
              {formatPrice(productData.giaThapNhat)}
            </div>
            <div className="text-gray-600 text-sm mt-1">Giá thấp nhất</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 text-center border-l-4 border-red-500">
            <div className="text-xl font-bold text-red-600">
              {formatPrice(productData.giaCaoNhat)}
            </div>
            <div className="text-gray-600 text-sm mt-1">Giá cao nhất</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 text-center border-l-4 border-blue-500">
            <div className="text-3xl font-bold text-blue-600">
              {variantDataSource.length}
            </div>
            <div className="text-gray-600 text-sm mt-1">Số biến thể</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md mb-4 overflow-hidden">
          <div className="bg-gray-100 px-6 py-3 border-b">
            <h3 className="text-md font-semibold text-gray-700">Thông tin chi tiết</h3>
          </div>
          <Table
            columns={productColumns}
            dataSource={productDataSource}
            pagination={false}
            bordered
            size="small"
          />
        </div>

        <Collapse 
          defaultActiveKey={index === 0 ? ['1'] : []} 
          className="bg-white rounded-lg shadow-md overflow-hidden"
        >
          <Panel 
            header={
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-700">
                  📦 Danh sách biến thể ({variantDataSource.length} biến thể)
                </span>
              </div>
            } 
            key="1"
          >
            <Table
              columns={variantColumns}
              dataSource={variantDataSource}
              pagination={false}
              bordered
              size="small"
              locale={{
                emptyText: 'Không có biến thể nào'
              }}
            />
          </Panel>
        </Collapse>

        {index < productsData.length - 1 && (
          <Divider className="my-8" style={{ borderColor: '#E67E22', borderWidth: 2 }} />
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Spin size="large" tip="Đang tải chi tiết sản phẩm..." />
      </div>
    );
  }

  if (productsData.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl text-gray-400 mb-4">📦</div>
          <p className="text-gray-600">Không tìm thấy sản phẩm</p>
          <Button 
            type="primary" 
            onClick={() => navigate(-1)}
            className="mt-4"
          >
            <ArrowLeftOutlined /> Quay lại
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-lg shadow">
        <div className="text-sm text-gray-600">
          <span 
            className="cursor-pointer hover:text-[#E67E22]"
            onClick={() => navigate('/product')}
          >
            Quản lý sản phẩm
          </span>
          <span className="mx-2">/</span>
          <span className="text-gray-900 font-medium">
            Chi tiết {productsData.length} sản phẩm đã chọn
          </span>
        </div>
        
        <Button 
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(-1)}
          type="primary"
          className="bg-[#E67E22]"
        >
          Quay lại
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-2xl font-bold text-[#E67E22] mb-4">
          📊 Tổng quan {productsData.length} sản phẩm
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-[#E67E22]">
              {productsData.reduce((sum, p) => sum + (p.tongSoLuong || 0), 0)}
            </div>
            <div className="text-gray-600 text-sm">Tổng số lượng</div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg text-center">
            <div className="text-xl font-bold text-green-600">
              {formatPrice(Math.min(...productsData.map(p => p.giaThapNhat || Infinity)))}
            </div>
            <div className="text-gray-600 text-sm">Giá thấp nhất</div>
          </div>
          <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-lg text-center">
            <div className="text-xl font-bold text-red-600">
              {formatPrice(Math.max(...productsData.map(p => p.giaCaoNhat || 0)))}
            </div>
            <div className="text-gray-600 text-sm">Giá cao nhất</div>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-blue-600">
              {productsData.reduce((sum, p) => sum + (p.chiTietSanPhams?.length || 0), 0)}
            </div>
            <div className="text-gray-600 text-sm">Tổng biến thể</div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {productsData.map((product, index) => renderProductDetail(product, index))}
      </div>
    </div>
  );
}