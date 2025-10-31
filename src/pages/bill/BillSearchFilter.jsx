import React, { useEffect, useState } from 'react';
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
  const [selectedValues, setSelectedValues] = useState(
    filterParams.loaiHoaDonList || []
  );
  const [dropdownOpen, setDropdownOpen] = useState(false);
useEffect(() => {
  setSelectedValues(filterParams.loaiHoaDonList || []);
}, [filterParams.loaiHoaDonList]);
  const getDisplayText = () => {
     const map = { true : 'Tại quầy', false: 'Online' }; 
    if (selectedValues.length === 0) return undefined;
    return selectedValues.map((v) => map[v]).join(', ');
  };

  const handleSelectChange = (values) => {
    setSelectedValues(values);
    setFilterParams({ ...filterParams, loaiHoaDonList: values });
  };

  const handleDropdownVisibleChange = (open) => {
    setDropdownOpen(open);
  };

  return (
    <>
      {/* --- Tiêu đề bộ lọc --- */}
      <div
        className="bg-[#E67E22] text-white px-6 py-2 mt-10 rounded-t-lg shadow"
        style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}
      >
        <div className="font-bold text-2xl text-white">Bộ lọc hóa đơn</div>
      </div>

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
          {/* Từ khóa tìm kiếm */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label className="font-medium text-gray-600">Từ khóa tìm kiếm</label>
            <Input
              placeholder="Nhập mã HĐ, tên khách hàng hoặc tên nhân viên..."
              value={searchParams.searchText}
              onChange={(e) =>
                setSearchParams({ ...searchParams, searchText: e.target.value })
              }
              onPressEnter={onSearch}
              style={{ height: 40 }}
            />
          </div>



          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label className="font-medium text-gray-600"> Dịch vụ</label>
            <Select
              placeholder="Chọn hình thức"
              open={dropdownOpen}
              onDropdownVisibleChange={handleDropdownVisibleChange}
              value={getDisplayText()}
              style={{
                width: '100%',
                height: 40,
                borderRadius: 6
              }}
              dropdownRender={() => (
                <div style={{ padding: 8 }}>
                  <Checkbox.Group
                    options={[
                      { label: 'Tại quầy', value: true },
                      { label: 'Online', value: false }
                    ]}
                    value={selectedValues}
                    onChange={(vals) => handleSelectChange(vals)}
                    style={{ display: 'flex', flexDirection: 'column', gap: 6 }}
                  />
                </div>
              )}
              dropdownMatchSelectWidth={false}
            />
          </div>

          {/* Hình thức thanh toán */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label className="font-medium text-gray-600">Hình thức thanh toán</label>
            <Select
              placeholder="Chọn hình thức thanh toán"
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
        </div>

        {/* --- Hàng dưới: 2 ô --- */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 12
          }}
        >
          {/* Ngày tạo */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label className="font-medium text-gray-600">Ngày tạo</label>
            <DatePicker
              placeholder="Chọn ngày tạo"
              value={filterParams.ngayTao}
              onChange={(date) =>
                setFilterParams({ ...filterParams, ngayTao: date })
              }
              style={{ width: '100%', height: 40 }}
            />
          </div>

          {/* Trạng thái */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label className="font-medium text-gray-600">Trạng thái</label>
            <Select
              placeholder="Chọn trạng thái"
              value={filterParams.trangThai}
              onChange={(value) =>
                setFilterParams({ ...filterParams, trangThai: value })
              }
              allowClear
              style={{ width: '100%', height: 40 }}
            >
              <Option value={0}>Chờ xác nhận</Option>
              <Option value={1}>Chờ giao hàng</Option>
              <Option value={2}>Đang vận chuyển</Option>
              <Option value={3}>Đã thanh toán</Option>
              <Option value={4}>Đã hủy</Option>
            </Select>
          </div>
        </div>

        {/* --- Nút hành động --- */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 12,
            marginTop: 20
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
