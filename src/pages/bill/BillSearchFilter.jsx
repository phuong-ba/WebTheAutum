import React from 'react';
import { Card, Input, Select, DatePicker, Button, Checkbox } from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';

const { Option } = Select;

export default function BillSearchFilter({
  searchParams,
  setSearchParams,
  filterParams,
  setFilterParams,
  onSearch,
  onReset
}) {
  return (
    <>
      {/* --- Tiêu đề bộ lọc --- */}
      <div
        className="bg-[#E67E22] text-white px-6 py-2 mt-10 rounded-t-lg shadow overflow-hidden"
        style={{
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0
        }}
      >
        <div className="font-bold text-2xl text-white">Bộ lọc hóa đơn</div>
      </div>

      {/* --- Thân bộ lọc --- */}
      <Card
        style={{
          marginBottom: 16,
          backgroundColor: '#fff',
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0
        }}
        bodyStyle={{ padding: '20px' }}
      >
        {/* --- Hàng trên: 3 ô --- */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 12,
            marginBottom: 12
          }}
        >
          {/* Ô nhập tìm kiếm */}
          <Input
            placeholder="Nhập mã HĐ, tên khách hàng hoặc tên nhân viên..."
            value={searchParams.searchText}
            onChange={(e) =>
              setSearchParams({ ...searchParams, searchText: e.target.value })
            }
            onPressEnter={onSearch}
            style={{ height: 40 }}
          />

          {/* Lọc theo dịch vụ (Checkbox nằm gọn góc trái) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'flex-start',
              height: 40,
              border: '1px solid #d9d9d9',
              borderRadius: 6,
              paddingLeft: 10,
              paddingTop: 6
            }}
          >
            <Checkbox.Group
              options={[
                { label: 'Tại quầy', value: 'tai_quay' },
                { label: 'Online', value: 'online' }
              ]}
              value={filterParams.loaiHoaDonList || []}
              onChange={(values) =>
                setFilterParams({ ...filterParams, loaiHoaDonList: values })
              }
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 2
              }}
            />
          </div>

          {/* Hình thức thanh toán */}
          <Select
            placeholder="Hình thức thanh toán"
            value={filterParams.hinhThucThanhToan}
            onChange={(value) =>
              setFilterParams({ ...filterParams, hinhThucThanhToan: value })
            }
            allowClear
            style={{ height: 40 }}
          >
            <Option value="tiền mặt">Tiền mặt</Option>
            <Option value="chuyển khoản">Chuyển khoản</Option>
            <Option value="thẻ">Thẻ</Option>
          </Select>
        </div>

        {/* --- Hàng dưới: 2 ô bên trái --- */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 12
          }}
        >
          <div style={{ gridColumn: '1 / span 1', width: '100%' }}>
            <DatePicker
              placeholder="Chọn ngày tạo"
              value={filterParams.ngayTao}
              onChange={(date) =>
                setFilterParams({ ...filterParams, ngayTao: date })
              }
              style={{ width: '100%', height: 40 }}
            />
          </div>

          <div style={{ gridColumn: '2 / span 1', width: '100%' }}>
            <Select
              placeholder="Trạng thái"
              value={filterParams.trangThai}
              onChange={(value) =>
                setFilterParams({ ...filterParams, trangThai: value })
              }
              allowClear
              style={{ width: '100%', height: 40 }}
            >
              <Option value={0}> Chờ xác nhận</Option>
              <Option value={1}> Chờ giao hàng</Option>
              <Option value={2}> Đang vận chuyển</Option>
              <Option value={3}> Đã thanh toán</Option>
              <Option value={4}> Đã hủy</Option>
            </Select>
          </div>
        </div>

        {/* --- Nút hành động --- */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 12,
            marginTop: 20,
            flexWrap: 'wrap'
          }}
        >
          <Button
            icon={<ReloadOutlined />}
            onClick={onReset}
            className="!bg-white !text-[#ff8c42] hover:!bg-amber-800 hover:!text-white font-medium transition-all duration-200"
          >
            Nhập lại
          </Button>

          <Button
            type="primary"
            icon={<SearchOutlined />}
            onClick={onSearch}
            className="!bg-[#ff8c42] !border-[#ff8c42] hover:!bg-amber-800 hover:!text-white font-medium transition-all duration-200"
          >
            Tìm kiếm
          </Button>
        </div>
      </Card>
    </>
  );
}
