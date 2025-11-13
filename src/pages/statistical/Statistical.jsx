import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Select, Button, Table, Spin, message } from 'antd';
import {
  ShoppingOutlined, CalendarOutlined, FileTextOutlined, TrophyOutlined, BarChartOutlined, PieChartOutlined, StarOutlined, LineOutlined, ReloadOutlined, ExportOutlined
} from '@ant-design/icons';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import ThongKeAPI from '../../api/ThongKeAPI';

const { Option } = Select;

export default function Statistical() {
  const [viewType, setViewType] = useState('line');
  const [filterType, setFilterType] = useState('month');
  const [loading, setLoading] = useState(false);
  const [orderStatusPeriod, setOrderStatusPeriod] = useState('day');
  const [topProducts, setTopProducts] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);



  // State lưu dữ liệu từ API
  const [statistics, setStatistics] = useState({
    summary: null,
    revenueChart: [],
    topProducts: [],
    orderStatus: [],
    channels: [],
    brands: [],
    detailTable: []
  });

  // Fetch dữ liệu từ API
  const fetchStatistics = async (period) => {
    setLoading(true);
    try {
      const response = await ThongKeAPI.getAllStatistics(period);
      setStatistics(response.data);
      message.success('Đã tải dữ liệu thống kê');
    } catch (error) {
      console.error('Error fetching statistics:', error);
      message.error('Không thể tải dữ liệu thống kê. Vui lòng kiểm tra kết nối!');

      // Giữ dữ liệu cũ nếu có lỗi
      if (!statistics.summary) {
        // Set empty data để tránh crash
        setStatistics({
          summary: {
            today: { revenue: 0, orders: 0, products: 0, growth: '+0%' },
            week: { revenue: 0, orders: 0, products: 0, growth: '+0%' },
            month: { revenue: 0, orders: 0, products: 0, growth: '+0%' },
            year: { revenue: 0, orders: 0, products: 0, growth: '+0%' }
          },
          revenueChart: [],
          topProducts: [],
          orderStatus: [],
          channels: [],
          brands: [],
          detailTable: []
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Load dữ liệu khi component mount hoặc filterType thay đổi
  useEffect(() => {
    fetchStatistics(filterType);
  }, [filterType]);


  useEffect(() => {
    const fetchOrderStatus = async () => {
      try {
        const response = await ThongKeAPI.getOrderStatus(orderStatusPeriod);
        setStatistics((prev) => ({
          ...prev,
          orderStatus: response.data || []
        }));
      } catch (error) {
        console.error('Lỗi khi tải dữ liệu trạng thái đơn hàng:', error);
      }
    };

    fetchOrderStatus();
  }, [orderStatusPeriod]);


  // 🔹 Lấy danh sách sản phẩm bán chạy
  useEffect(() => {
    const fetchTopProducts = async () => {
      try {
        const res = await ThongKeAPI.getTopSellingProducts();
        console.log("📦 Dữ liệu top sản phẩm:", res.data);

        // ✅ Kiểm tra trước khi set
        if (Array.isArray(res.data)) {
          setTopProducts(res.data);
        } else {
          console.warn("⚠️ API không trả về mảng:", res.data);
          setTopProducts([]);
        }
      } catch (err) {
        console.error("Lỗi khi tải top sản phẩm:", err);
      }
    };
    fetchTopProducts();
  }, []);




  // 🔹 Lấy danh sách sản phẩm sắp hết hàng
  useEffect(() => {
    const fetchLowStockProducts = async () => {
      try {
        const res = await ThongKeAPI.getLowStockProducts();
        console.log("📦 API trả về lowStockProducts:", res.data);

        if (Array.isArray(res.data)) {
          setLowStockProducts(res.data);
        } else if (res.data && Array.isArray(res.data.data)) {
          setLowStockProducts(res.data.data);
        } else {
          setLowStockProducts([]);
        }
      } catch (error) {
        console.error("❌ Lỗi khi load sản phẩm sắp hết hàng:", error);
        setLowStockProducts([]);
      }
    };
    fetchLowStockProducts();
  }, []);




  // Format số tiền
  const formatCurrency = (value) => {
    if (!value) return '0 đ';
    return new Intl.NumberFormat('vi-VN').format(value) + ' đ';
  };

  // Chuẩn bị dữ liệu cho biểu đồ doanh thu
  const revenueChartData = statistics.revenueChart?.map(item => ({
    week: item.period,
    value: item.value
  })) || [];

  // Cấu hình columns cho bảng chi tiết
  const columns = [
    {
      title: 'THỜI GIAN',
      dataIndex: 'period',
      key: 'period',
      align: 'center',
    },
    {
      title: 'DOANH THU',
      dataIndex: 'revenue',
      key: 'revenue',
      align: 'right',
    },
    {
      title: 'SỐ ĐƠN HÀNG',
      dataIndex: 'orders',
      key: 'orders',
      align: 'center',
    },
    {
      title: 'GIÁ TRỊ TB/ĐơN',
      dataIndex: 'avgValue',
      key: 'avgValue',
      align: 'right',
    },
    {
      title: 'TĂNG TRƯỞNG',
      dataIndex: 'growth',
      key: 'growth',
      align: 'center',
      render: (text) => <span style={{ color: '#52C41A', fontWeight: 600 }}>{text}</span>
    },
    {
      title: 'TRẠNG THÁI',
      dataIndex: 'status',
      key: 'status',
      align: 'center',
      render: (text) => (
        <span style={{
          background: '#52C41A',
          color: 'white',
          padding: '4px 12px',
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: 500
        }}>
          {text}
        </span>
      )
    },
  ];

  // Thêm key cho detail table
  const detailTableData = statistics.detailTable?.map((item, index) => ({
    ...item,
    key: index.toString()
  })) || [];

  // Render summary cards
  const renderSummaryCard = (title, data, icon, bgColor, iconColor) => {
    if (!data) return null;

    return (
      <Card
        style={{
          borderRadius: '8px',
          border: 'none',
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>
              {formatCurrency(data.revenue)}
            </div>
            <div style={{ color: '#6b7280', marginTop: '4px', fontSize: '14px' }}>{title}</div>
            <div style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px' }}>
              Sản phẩm đã bán: {data.products} | Đơn hàng: {data.orders}
            </div>
          </div>
          <div style={{
            background: bgColor,
            width: '48px',
            height: '48px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {React.createElement(icon, { style: { fontSize: '24px', color: iconColor } })}
          </div>
        </div>
        <div style={{ marginTop: '8px', color: '#6b7280', fontSize: '12px' }}>
          {data.growth}
        </div>
      </Card>
    );
  };

  return (
    <Spin spinning={loading} tip="Đang tải dữ liệu..." size="large">
      <div style={{ padding: '24px', background: '#f5f5f5', minHeight: '100vh' }}>
        {/* HEADER */}
        <div className="bg-white flex flex-col gap-3 px-4 py-[20px] rounded-lg shadow overflow-hidden" style={{ marginBottom: '24px' }}>
          <div className="font-bold text-4xl text-[#E67E22]">
            Thống kê doanh thu
          </div>
        </div>

        {/* Tiêu đề bộ lọc */}
        <div
          className="bg-[#E67E22] text-white px-6 py-2 rounded-t-lg shadow"
          style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}
        >
          <div className="font-bold text-2xl text-white">Bộ lọc thống kê</div>
        </div>

        {/* Header với bộ lọc */}
        <Card
          style={{
            marginBottom: '24px',
            borderRadius: '0 0 8px 8px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            borderTop: 'none'
          }}
          bodyStyle={{ padding: '20px' }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 12,
              marginBottom: 12
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label className="font-medium text-gray-600">
                Khoảng thời gian thống kê
              </label>
              <Select
                value={filterType}
                style={{ width: '100%', height: 40 }}
                onChange={setFilterType}
              >
                <Option value="day">Hôm nay</Option>
                <Option value="week">Tuần này</Option>
                <Option value="month">Tháng này</Option>
                <Option value="year">Năm này</Option>
              </Select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label className="font-medium text-gray-600">
                Loại biểu đồ
              </label>
              <Button.Group style={{ height: 40 }}>
                <Button
                  type={viewType === 'line' ? 'primary' : 'default'}
                  icon={<LineOutlined />}
                  onClick={() => setViewType('line')}
                  style={viewType === 'line' ? { background: '#ff8c42', borderColor: '#ff8c42', height: 40 } : { height: 40 }}
                >
                  Đường
                </Button>
                <Button
                  type={viewType === 'bar' ? 'primary' : 'default'}
                  icon={<BarChartOutlined />}
                  onClick={() => setViewType('bar')}
                  style={viewType === 'bar' ? { background: '#ff8c42', borderColor: '#ff8c42', height: 40 } : { height: 40 }}
                >
                  Cột
                </Button>
              </Button.Group>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label className="font-medium text-gray-600" style={{ visibility: 'hidden' }}>
                Actions
              </label>
              <div style={{ display: 'flex', gap: 12, height: 40 }}>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={() => {
                    setFilterType('month');
                    setOrderStatusPeriod('day');
                    fetchStatistics('month');
                  }}
                  disabled={loading}
                  className="!bg-white !text-[#ff8c42] hover:!bg-amber-800 hover:!text-white font-medium transition-all duration-200"
                  style={{ flex: 1, height: 40 }}
                >
                  Làm mới bộ lọc
                </Button>

                <Button
                  type="primary"
                  icon={<ExportOutlined />}
                  onClick={async () => {
                    try {
                      const res = await ThongKeAPI.exportPdf();
                      const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
                      const link = document.createElement("a");
                      link.href = url;
                      link.setAttribute("download", `BaoCao_ThongKe_${new Date().toISOString().slice(0, 10)}.pdf`);
                      document.body.appendChild(link);
                      link.click();
                      link.remove();
                      message.success("Xuất báo cáo PDF thành công!");
                    } catch (err) {
                      console.error(err);
                      message.error("Không thể xuất báo cáo PDF!");
                    }
                  }}
                  className="!bg-[#ff8c42] !border-[#ff8c42] hover:!bg-amber-800 hover:!text-white font-medium transition-all duration-200"
                  style={{ flex: 1, height: 40 }}
                >
                  Xuất báo cáo
                </Button>

              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', paddingTop: '12px', borderTop: '1px solid #f0f0f0' }}>
            <div>
              <span style={{ color: '#6b7280', fontSize: '14px' }}>Số đơn hàng: </span>
              <span style={{ fontWeight: '600', fontSize: '16px', color: '#1f2937' }}>
                {statistics.summary?.[filterType]?.orders || 0}
              </span>
            </div>
            <div>
              <span style={{ color: '#6b7280', fontSize: '14px' }}>Tổng doanh thu: </span>
              <span style={{ fontWeight: '600', fontSize: '16px', color: '#FF6B35' }}>
                {statistics.summary?.[filterType]?.revenue ? formatCurrency(statistics.summary[filterType].revenue) : '0 đ'}
              </span>
            </div>
          </div>

        </Card>

        {/* Cards thống kê tổng quan */}
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          <Col xs={24} sm={12} lg={6}>
            {renderSummaryCard('Hôm nay', statistics.summary?.today, CalendarOutlined, '#dbeafe', '#3b82f6')}
          </Col>
          <Col xs={24} sm={12} lg={6}>
            {renderSummaryCard('Tuần này', statistics.summary?.week, FileTextOutlined, '#e9d5ff', '#a855f7')}
          </Col>
          <Col xs={24} sm={12} lg={6}>
            {renderSummaryCard('Tháng này', statistics.summary?.month, ShoppingOutlined, '#d1fae5', '#10b981')}
          </Col>
          <Col xs={24} sm={12} lg={6}>
            {renderSummaryCard('Năm này', statistics.summary?.year, BarChartOutlined, '#ccfbf1', '#14b8a6')}
          </Col>
        </Row>

        {/* Biểu đồ doanh thu và sản phẩm bán chạy */}
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          <Col xs={24} lg={16}>
            <Card
              title={
                <span style={{ fontSize: '16px', fontWeight: 600 }}>
                  <BarChartOutlined style={{ marginRight: '8px', color: '#ff6b35' }} />
                  Biểu Đồ Doanh Thu
                </span>
              }
              style={{ borderRadius: '8px', height: '100%', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
            >
              {revenueChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  {viewType === 'line' ? (
                    <LineChart data={revenueChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="week" stroke="#6b7280" style={{ fontSize: '12px' }} />
                      <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                      <Tooltip
                        contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '13px' }}
                        formatter={(value) => formatCurrency(value)}
                      />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#ff6b35"
                        strokeWidth={3}
                        dot={{ fill: '#ff6b35', r: 6 }}
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  ) : (
                    <BarChart data={revenueChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="week" stroke="#6b7280" style={{ fontSize: '12px' }} />
                      <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                      <Tooltip
                        contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '13px' }}
                        formatter={(value) => formatCurrency(value)}
                      />
                      <Bar dataKey="value" fill="#ff6b35" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  )}
                </ResponsiveContainer>

              ) : (
                <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280', fontSize: '14px' }}>
                  Không có dữ liệu
                </div>
              )}
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            <Card
              title={
                <span style={{ fontSize: '16px', fontWeight: 600 }}>
                  <TrophyOutlined style={{ marginRight: '8px', color: '#ff6b35' }} />
                  Sản Phẩm Bán Chạy
                </span>
              }
              style={{ borderRadius: '8px', height: '100%', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
            >
              <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                {statistics.topProducts && statistics.topProducts.length > 0 ? (
                  statistics.topProducts.map((product, index) => (
                    <div
                      key={product.productId}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '12px 0',
                        borderBottom: index < statistics.topProducts.length - 1 ? '1px solid #f0f0f0' : 'none'
                      }}
                    >
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: index === 0 ? '#fbbf24' : index === 1 ? '#d1d5db' : index === 2 ? '#f97316' : '#e5e7eb',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold',
                        color: index < 3 ? 'white' : '#6b7280',
                        marginRight: '12px',
                        flexShrink: 0,
                        fontSize: '13px'
                      }}>
                        {product.rank}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {product.name}
                        </div>
                        <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                          Đã bán: {product.sold} | Giá: {product.price}
                        </div>
                      </div>
                      <div style={{
                        width: '4px',
                        height: '40px',
                        background: '#ff6b35',
                        borderRadius: '2px',
                        marginLeft: '8px'
                      }} />
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '40px 0', textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>
                    Không có dữ liệu sản phẩm
                  </div>
                )}
              </div>
            </Card>
          </Col>
        </Row>

        {/* Biểu đồ tròn */}
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          <Col xs={24} md={8}>
            <Card
              title={
                <span style={{ fontSize: '16px', fontWeight: 600 }}>
                  <PieChartOutlined style={{ marginRight: '8px', color: '#ff6b35' }} />
                  Phân Bổ Trạng Thái Đơn Hàng
                </span>
              }
              style={{ borderRadius: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', height: '100%' }}
              bodyStyle={{ minHeight: '420px' }}
            >

              <div style={{ marginBottom: '12px' }}>
                <Button.Group style={{ width: '100%' }}>
                  <Button
                    type={orderStatusPeriod === 'day' ? 'primary' : 'default'}
                    onClick={() => setOrderStatusPeriod('day')}
                    style={orderStatusPeriod === 'day' ? { background: '#ff6b35', borderColor: '#ff6b35', flex: 1 } : { flex: 1 }}
                  >
                    Ngày
                  </Button>
                  <Button
                    type={orderStatusPeriod === 'month' ? 'primary' : 'default'}
                    onClick={() => setOrderStatusPeriod('month')}
                    style={orderStatusPeriod === 'month' ? { background: '#ff6b35', borderColor: '#ff6b35', flex: 1 } : { flex: 1 }}
                  >
                    Tháng
                  </Button>
                  <Button
                    type={orderStatusPeriod === 'year' ? 'primary' : 'default'}
                    onClick={() => setOrderStatusPeriod('year')}
                    style={orderStatusPeriod === 'year' ? { background: '#ff6b35', borderColor: '#ff6b35', flex: 1 } : { flex: 1 }}
                  >
                    Năm
                  </Button>
                </Button.Group>
              </div>

              {statistics.orderStatus && statistics.orderStatus.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={statistics.orderStatus}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ value }) => value}
                      >
                        {statistics.orderStatus.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '12px', marginTop: '16px' }}>
                    {statistics.orderStatus.map((item) => (
                      <div key={item.name} style={{ display: 'flex', alignItems: 'center', fontSize: '12px' }}>
                        <div style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '2px',
                          background: item.color,
                          marginRight: '6px'
                        }} />
                        <span style={{ color: '#6b7280' }}>{item.name}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div style={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280', fontSize: '14px' }}>
                  Không có dữ liệu
                </div>
              )}
            </Card>
          </Col>

          <Col xs={24} md={8}>
            <Card
              title={
                <span style={{ fontSize: '16px', fontWeight: 600 }}>
                  <ShoppingOutlined style={{ marginRight: '8px', color: '#ff6b35' }} />
                  Phân Phối Đa Kênh
                </span>
              }
              style={{ borderRadius: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', height: '100%' }}
              bodyStyle={{ minHeight: '420px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
            >
              {statistics.channels && statistics.channels.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={statistics.channels}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ value }) => value}
                      >
                        {statistics.channels.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '12px', marginTop: '16px' }}>
                    {statistics.channels.map((item) => (
                      <div key={item.name} style={{ display: 'flex', alignItems: 'center', fontSize: '12px' }}>
                        <div style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '2px',
                          background: item.color,
                          marginRight: '6px'
                        }} />
                        <span style={{ color: '#6b7280' }}>{item.name}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div style={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280', fontSize: '14px' }}>
                  Không có dữ liệu
                </div>
              )}
            </Card>
          </Col>

          <Col xs={24} md={8}>
            <Card
              title={
                <span style={{ fontSize: '16px', fontWeight: 600 }}>
                  <StarOutlined style={{ marginRight: '8px', color: '#ff6b35' }} />
                  Hãng Bán Chạy
                </span>
              }
              style={{ borderRadius: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', height: '100%' }}
              bodyStyle={{ minHeight: '420px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
            >
              {statistics.brands && statistics.brands.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={statistics.brands}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ value }) => (value / 1000000).toFixed(1) + 'M'}
                      >
                        {statistics.brands.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '12px', marginTop: '16px' }}>
                    {statistics.brands.map((item) => (
                      <div key={item.name} style={{ display: 'flex', alignItems: 'center', fontSize: '12px' }}>
                        <div style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '2px',
                          background: item.color,
                          marginRight: '6px'
                        }} />
                        <span style={{ color: '#6b7280' }}>{item.name}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div style={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280', fontSize: '14px' }}>
                  Không có dữ liệu
                </div>
              )}
            </Card>
          </Col>
        </Row>



        {/* Bảng thống kê chi tiết */}
        <div style={{
          marginBottom: 16,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 24px',
          backgroundColor: '#ff8c42',
          borderRadius: '4px 4px 0 0'
        }}>
          <h3 style={{
            fontSize: 16,
            fontWeight: 600,
            margin: 0,
            color: '#fff'
          }}>
            Bảng Thống Kê Chi Tiết
          </h3>
        </div>

        <Card
          style={{ borderRadius: '0 0 8px 8px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
          bodyStyle={{ padding: 0 }}
        >
          <Table
            columns={columns}
            dataSource={detailTableData}
            bordered
            pagination={{
              pageSize: 5,
              showTotal: (total, range) => `Hiển thị ${range[0]}-${range[1]} / ${total} mục`,
              showSizeChanger: true,
              pageSizeOptions: ['5', '10', '20', '50']
            }}
            locale={{ emptyText: 'Không có dữ liệu' }}
            scroll={{ x: 1200 }}
          />
        </Card>
      </div>

      {/* Top sản phẩm bán chạy nhất - Rộng toàn bộ */}
      <div style={{ marginBottom: '24px', padding: '0 24px' }}>
        <div style={{
          marginBottom: 0,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 24px',
          backgroundColor: '#ff8c42',
          borderRadius: '4px 4px 0 0'
        }}>
          <h3 style={{
            fontSize: 16,
            fontWeight: 600,
            margin: 0,
            color: '#fff'
          }}>
            <TrophyOutlined style={{ marginRight: '8px' }} />
            Top sản phẩm bán chạy nhất của cửa hàng
          </h3>
        </div>

        <Card
          style={{ borderRadius: '0 0 8px 8px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
          bodyStyle={{ padding: 0 }}
        >
          <Table
            dataSource={topProducts.map((p, i) => ({ ...p, key: i }))}
            pagination={{
              pageSize: 5,
              showTotal: (total, range) => `Hiển thị ${range[0]}-${range[1]} / ${total} mục`,
              showSizeChanger: true,
              pageSizeOptions: ['5', '10', '20']
            }}
            bordered
            columns={[
              {
                title: '#',
                key: 'index',
                align: 'center',
                width: 60,
                render: (_, __, index) => index + 1
              },
              {
                title: 'Ảnh',
                dataIndex: 'anh',
                key: 'anh',
                width: 100,
                align: 'center',
                render: (img) => (
                  <img
                    src={img || '/placeholder.png'}
                    alt="product"
                    style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: '4px' }}
                  />
                )
              },
              {
                title: 'Tên Sản Phẩm',
                dataIndex: 'tenSanPham',
                key: 'tenSanPham',
                width: '35%'
              },
              {
                title: 'Giá Bán',
                dataIndex: 'giaBan',
                key: 'giaBan',
                align: 'right',
                width: '20%',
                render: (v) => formatCurrency(v)
              },
              {
                title: 'Số Lượng Đã Bán',
                dataIndex: 'tongSoLuongBan',
                key: 'tongSoLuongBan',
                align: 'center',
                width: '15%',
                render: (v) => <span style={{ fontWeight: 600, color: '#52C41A' }}>{v}</span>
              }
            ]}
            locale={{ emptyText: 'Không có dữ liệu' }}
            scroll={{ x: 800 }}
          />
        </Card>
      </div>

      {/* Sản phẩm sắp hết hàng - Rộng toàn bộ */}
      <div style={{ marginBottom: '24px', padding: '0 24px' }}>
        <div style={{
          marginBottom: 0,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 24px',
          backgroundColor: '#ff8c42',
          borderRadius: '4px 4px 0 0'
        }}>
          <h3 style={{
            fontSize: 16,
            fontWeight: 600,
            margin: 0,
            color: '#fff'
          }}>
            <BarChartOutlined style={{ marginRight: '8px' }} />
            Sản Phẩm Sắp Hết Hàng
          </h3>
        </div>

        <Card
          style={{ borderRadius: '0 0 8px 8px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
          bodyStyle={{ padding: 0 }}
        >
          <Table
            dataSource={lowStockProducts.map((p, i) => ({ ...p, key: i }))}
            pagination={{
              pageSize: 5,
              showTotal: (total, range) => `Hiển thị ${range[0]} - ${range[1]} / ${total} mục`,
              showSizeChanger: false
            }}
            bordered
            columns={[
              {
                title: '#',
                key: 'index',
                align: 'center',
                width: 60,
                render: (_, __, index) => index + 1
              },
              {
                title: 'Tên Sản Phẩm',
                dataIndex: 'tenSanPham',
                key: 'tenSanPham',
                width: '60%'
              },
              {
                title: 'Số Lượng',
                dataIndex: 'soLuongTon',
                key: 'soLuongTon',
                align: 'center',
                width: '20%',
                render: (text) => (
                  <span style={{
                    color: text <= 10 ? '#ff4d4f' : text <= 20 ? '#faad14' : '#52c41a',
                    fontWeight: 600,
                    fontSize: '15px'
                  }}>
                    {text}
                  </span>
                )
              },
              {
                title: 'Trạng Thái',
                key: 'trangThai',
                align: 'center',
                width: '20%',
                render: (_, record) => {
                  const soLuong = record.soLuongTon;
                  let bgColor = '#52c41a';
                  let text = 'Bình thường';

                  if (soLuong <= 10) {
                    bgColor = '#ff4d4f';
                    text = 'Nguy cơ cao';
                  } else if (soLuong <= 20) {
                    bgColor = '#faad14';
                    text = 'Cảnh báo';
                  }

                  return (
                    <span style={{
                      background: bgColor,
                      color: 'white',
                      padding: '4px 12px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 500
                    }}>
                      {text}
                    </span>
                  );
                }
              }
            ]}
            locale={{ emptyText: 'Không có dữ liệu' }}
            scroll={{ x: 600 }}
          />
        </Card>
      </div>
    </Spin>
  );
}