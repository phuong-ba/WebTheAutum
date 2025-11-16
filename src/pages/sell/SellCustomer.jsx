import React, { useEffect, useState } from "react";
import { UsersThreeIcon } from "@phosphor-icons/react";
import { Col, Form, Input, Row, Select, message } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { fetchAllKhachHang } from "@/services/khachHangService";

const { Option } = Select;

export default function SellCustomer({ selectedBillId, onCustomerChange }) {
  const { data } = useSelector((state) => state.khachHang);
  const dispatch = useDispatch();
  const [search, setSearch] = useState("");
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    dispatch(fetchAllKhachHang());
  }, [dispatch]);

  useEffect(() => {
    if (selectedBillId) {
      const bills = JSON.parse(localStorage.getItem("pendingBills")) || [];
      const currentBill = bills.find((bill) => bill.id === selectedBillId);

      if (currentBill && currentBill.customer) {
        form.setFieldsValue({
          customerId: currentBill.customer.id,
          sdt: currentBill.customer.sdt,
        });
        onCustomerChange && onCustomerChange(currentBill.customer);
      } else {
        form.resetFields();
        onCustomerChange && onCustomerChange(null);
      }
    } else {
      form.resetFields();
      onCustomerChange && onCustomerChange(null);
    }
  }, [selectedBillId, form, onCustomerChange]);

  const filteredData = data
    ?.filter((item) => item.trangThai === true)
    ?.filter((item) =>
      search.trim() === ""
        ? true
        : item.hoTen.toLowerCase().includes(search.toLowerCase()) ||
          item.sdt.includes(search)
    );

  const handleSelectChange = (value) => {
  const selectedCustomer = filteredData.find((item) => item.id === value);
  if (selectedCustomer) {
    console.log("Khách hàng được chọn:", selectedCustomer);
    console.log("ID khách hàng:", selectedCustomer.id);

    form.setFieldsValue({
      customerId: selectedCustomer.id,
      sdt: selectedCustomer.sdt,
    });
    saveCustomerToBill(selectedCustomer);
    onCustomerChange && onCustomerChange(selectedCustomer);
  } else {
    console.log("Không tìm thấy khách hàng với ID:", value);
    form.resetFields(["sdt"]);
    removeCustomerFromBill();
    onCustomerChange && onCustomerChange(null);
  }
};

  const saveCustomerToBill = (customer) => {
    if (!selectedBillId) {
      messageApi.warning("Vui lòng chọn hóa đơn trước khi chọn khách hàng!");
      return;
    }

    const bills = JSON.parse(localStorage.getItem("pendingBills")) || [];
    console.log("🚀 ~ saveCustomerToBill ~ bills:", bills)
    const updatedBills = bills.map((bill) => {
      if (bill.id === selectedBillId) {
        return {
          ...bill,
          customer: {
            id: customer.id,
            hoTen: customer.hoTen,
            sdt: customer.sdt,
            email: customer.email,
            diaChi: customer.diaChi,
          },
        };
      }
      return bill;
    });

    localStorage.setItem("pendingBills", JSON.stringify(updatedBills));
    messageApi.success(`Đã chọn khách hàng: ${customer.hoTen}`);

    window.dispatchEvent(new Event("billsUpdated"));
  };

  // Xóa khách hàng khỏi hóa đơn trong localStorage
  const removeCustomerFromBill = () => {
    if (!selectedBillId) return;

    const bills = JSON.parse(localStorage.getItem("pendingBills")) || [];
    const updatedBills = bills.map((bill) => {
      if (bill.id === selectedBillId) {
        const { customer, ...rest } = bill;
        return rest;
      }
      return bill;
    });

    localStorage.setItem("pendingBills", JSON.stringify(updatedBills));
    messageApi.success("Đã xóa khách hàng khỏi hóa đơn");

    window.dispatchEvent(new Event("billsUpdated"));
  };

  // Cập nhật search text
  const handleSearchChange = (val) => {
    setSearch(val);
  };

  // Xử lý nhập số điện thoại thủ công
  const handlePhoneChange = (e) => {
    const phoneValue = e.target.value;
    form.setFieldsValue({ sdt: phoneValue });

    if (phoneValue.length === 10 && /^0\d{9}$/.test(phoneValue)) {
      const customerByPhone = data?.find(
        (item) => item.sdt === phoneValue && item.trangThai === true
      );
      if (customerByPhone) {
        form.setFieldsValue({
          customerId: customerByPhone.id,
        });
        saveCustomerToBill(customerByPhone);
        onCustomerChange && onCustomerChange(customerByPhone);
      }
    }
  };

  return (
    <>
      {contextHolder}
      <div className="shadow overflow-hidden bg-white rounded-lg h-full">
        <div className="p-3 font-bold text-xl bg-gray-200 rounded-t-lg flex gap-2 items-center">
          <UsersThreeIcon size={24} />
          Khách hàng
        </div>
        <div className="gap-5 py-4 px-5 flex flex-col ">
          <Input.Search
            placeholder="Tìm kiếm khách hàng theo tên hoặc sđt..."
            onChange={(e) => handleSearchChange(e.target.value)}
            value={search}
            allowClear
            style={{ marginBottom: 16 }}
          />
          <Form layout="vertical" form={form}>
            <Row gutter={16} wrap>
              <Col flex="1">
                <Form.Item
                  name="customerId"
                  label="Tên Khách hàng"
                  rules={[{ required: true, message: "Chọn tên Khách hàng" }]}
                >
                  <Select
                    showSearch
                    placeholder="Chọn khách hàng"
                    optionFilterProp="children"
                    filterOption={false}
                    onSearch={handleSearchChange}
                    onChange={handleSelectChange}
                    allowClear
                    onClear={() => {
                      removeCustomerFromBill();
                      onCustomerChange && onCustomerChange(null);
                    }}
                    value={form.getFieldValue("customerId")}
                  >
                    {filteredData?.map((item) => (
                      <Option key={item.id} value={item.id}>
                        {item.hoTen} - {item.sdt}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col flex="1">
                <Form.Item
                  name="sdt"
                  label="Số điện thoại"
                  rules={[
                    { required: true, message: "Nhập số điện thoại" },
                    {
                      pattern: /^0\d{9}$/,
                      message:
                        "Số điện thoại phải gồm 10 chữ số và bắt đầu bằng 0",
                    },
                  ]}
                >
                  <Input
                    placeholder="Nhập số điện thoại"
                    onChange={handlePhoneChange}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Form>
          <div
            onClick={() => window.location.assign("/admin/add-customer")}
            className="cursor-pointer select-none text-center py-3 rounded-xl bg-[#E67E22] font-bold text-white hover:bg-amber-600 active:bg-cyan-800 shadow"
          >
            Thêm khách hàng
          </div>
        </div>
      </div>
    </>
  );
}
