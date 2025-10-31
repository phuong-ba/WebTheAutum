import React from "react";
import { Card, Input, Select, DatePicker, Checkbox, Form } from "antd";
import {
  SearchOutlined,
  ReloadOutlined,
  ExportOutlined,
  PrinterOutlined,
} from "@ant-design/icons";

const { Option } = Select;

export default function BillSearchFilter({
  searchParams,
  setSearchParams,
  filterParams,
  setFilterParams,
  onSearch,
  onReset,
  handleExport,
  handlePrint,
}) {
  return (
    <>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="bg-[#E67E22] text-white px-6 py-2">
          <div className="font-bold text-2xl text-white">Bộ Lọc Hóa Đơn</div>
        </div>

        <div className="px-6 py-3">
          <Form
            style={{
              backgroundColor: "#fff",
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
              borderTopLeftRadius: 0,
              borderTopRightRadius: 0,
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: 12,
                marginBottom: 12,
              }}
            >
              {/* Ô tìm kiếm */}
              <div className="flex flex-col gap-1">
                <label className="font-semibold text-gray-700 text-sm">
                  Tìm kiếm
                </label>
                <Input
                  placeholder="Nhập mã HĐ, tên KH hoặc tên NV..."
                  value={searchParams.searchText}
                  onChange={(e) =>
                    setSearchParams({
                      ...searchParams,
                      searchText: e.target.value,
                    })
                  }
                  onPressEnter={onSearch}
                  style={{ height: 40 }}
                />
              </div>

              {/* Hình thức thanh toán */}
              <div className="flex flex-col gap-1">
                <label className="font-semibold text-gray-700 text-sm">
                  Hình thức thanh toán
                </label>
                <Select
                  placeholder="Chọn hình thức thanh toán"
                  value={filterParams.hinhThucThanhToan}
                  onChange={(value) =>
                    setFilterParams({
                      ...filterParams,
                      hinhThucThanhToan: value,
                    })
                  }
                  allowClear
                  style={{ height: 40 }}
                >
                  <Option value="tiền mặt">Tiền mặt</Option>
                  <Option value="chuyển khoản">Chuyển khoản</Option>
                  <Option value="thẻ">Thẻ</Option>
                </Select>
              </div>

              {/* Ngày tạo */}
              <div className="flex flex-col gap-1">
                <label className="font-semibold text-gray-700 text-sm">
                  Ngày tạo
                </label>
                <DatePicker
                  placeholder="Chọn ngày tạo"
                  value={filterParams.ngayTao}
                  onChange={(date) =>
                    setFilterParams({ ...filterParams, ngayTao: date })
                  }
                  style={{ width: "100%", height: 40 }}
                />
              </div>

              {/* Trạng thái */}
              <div className="flex flex-col gap-1">
                <label className="font-semibold text-gray-700 text-sm">
                  Trạng thái
                </label>
                <Select
                  placeholder="Chọn trạng thái"
                  value={filterParams.trangThai}
                  onChange={(value) =>
                    setFilterParams({ ...filterParams, trangThai: value })
                  }
                  allowClear
                  style={{ width: "100%", height: 40 }}
                >
                  <Option value={0}>Chờ xác nhận</Option>
                  <Option value={1}>Chờ giao hàng</Option>
                  <Option value={2}>Đang vận chuyển</Option>
                  <Option value={3}>Đã thanh toán</Option>
                  <Option value={4}>Đã hủy</Option>
                </Select>
              </div>

              {/* Loại hóa đơn */}
              <div
                style={{
                  gridColumn: "1 / span 4",
                  marginTop: 8,
                }}
              >
                <label className="font-semibold text-gray-700 text-sm">
                  Loại hóa đơn
                </label>
                <Checkbox.Group
                  options={[
                    { label: "Tại quầy", value: "tai_quay" },
                    { label: "Online", value: "online" },
                  ]}
                  value={filterParams.loaiHoaDonList || []}
                  onChange={(values) =>
                    setFilterParams({
                      ...filterParams,
                      loaiHoaDonList: values,
                    })
                  }
                  style={{
                    display: "flex",
                    gap: 20,
                    marginTop: 4,
                  }}
                />
              </div>
            </div>

            {/* Nút hành động */}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 12,
                marginTop: 20,
                flexWrap: "wrap",
              }}
            >
              <div
                onClick={onReset}
                className="border text-white rounded-md px-6 py-2 cursor-pointer bg-gray-400 font-bold hover:bg-amber-700 active:bg-cyan-800 select-none"
              >
                <ReloadOutlined /> Nhập lại
              </div>

              <div
                onClick={onSearch}
                className="bg-[#E67E22] text-white rounded-md px-6 py-2 cursor-pointer font-bold hover:bg-amber-800 hover:text-white active:bg-cyan-800 select-none"
              >
                <SearchOutlined /> Tìm kiếm
              </div>

              <div
                onClick={handleExport}
                className="bg-[#E67E22] text-white rounded-md px-6 py-2 cursor-pointer font-bold hover:bg-amber-800 hover:text-white active:bg-cyan-800 select-none"
              >
                <ExportOutlined /> Xuất Excel
              </div>

              <div
                onClick={handlePrint}
                className="bg-[#E67E22] text-white rounded-md px-6 py-2 cursor-pointer font-bold hover:bg-amber-800 hover:text-white active:bg-cyan-800 select-none"
              >
                <PrinterOutlined /> In danh sách
              </div>
            </div>
          </Form>
        </div>
      </div>
    </>
  );
}
