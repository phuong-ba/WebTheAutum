import React, { useEffect, useState } from "react";
import { UsersThreeIcon, PlusIcon } from "@phosphor-icons/react";
import { Col, Form, Input, Row, Select, message, Modal, Button } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { fetchAllKhachHang } from "@/services/khachHangService";
import { khachHangApi } from "@/api/khachHangApi";

const { Option } = Select;

export default function SellCustomer({ selectedBillId, onCustomerChange }) {
  const { data } = useSelector((state) => state.khachHang);
  const dispatch = useDispatch();
  const [search, setSearch] = useState("");
  const [form] = Form.useForm();
  const [quickAddForm] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [isQuickAddModalVisible, setIsQuickAddModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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
    const selectedCustomer = data?.find((item) => item.id === value);
    if (selectedCustomer) {
      console.log("Khách hàng được chọn:", selectedCustomer);

      form.setFieldsValue({
        customerId: selectedCustomer.id,
        sdt: selectedCustomer.sdt,
      });
      saveCustomerToBill(selectedCustomer);
      onCustomerChange && onCustomerChange(selectedCustomer);
      setSearch("");
    } else {
      console.log("Không tìm thấy khách hàng với ID:", value);
      form.resetFields(["sdt"]);
      removeCustomerFromBill();
      onCustomerChange && onCustomerChange(null);
      setSearch(""); 
    }
  };

  const saveCustomerToBill = (customer) => {
    if (!selectedBillId) {
      messageApi.warning("Vui lòng chọn hóa đơn trước khi chọn khách hàng!");
      return;
    }

    const bills = JSON.parse(localStorage.getItem("pendingBills")) || [];
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

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      
      if (filteredData && filteredData.length > 0) {
        const firstCustomer = filteredData[0];
        form.setFieldsValue({
          customerId: firstCustomer.id,
          sdt: firstCustomer.sdt,
        });
        saveCustomerToBill(firstCustomer);
        onCustomerChange && onCustomerChange(firstCustomer);
        setSearch("");
        messageApi.info(`Đã chọn khách hàng: ${firstCustomer.hoTen}`);
      } else if (search.trim() !== "") {
        messageApi.warning("Không tìm thấy khách hàng phù hợp!");
      }
    }
  };

  const handleQuickAdd = () => {
    setIsQuickAddModalVisible(true);
  };

  const handleQuickAddCancel = () => {
    setIsQuickAddModalVisible(false);
    quickAddForm.resetFields();
  };

  const handleQuickAddSubmit = async (values) => {
    setIsLoading(true);
    try {
      const existingCustomer = data?.find(item => item.sdt === values.sdt);
      if (existingCustomer) {
        messageApi.warning("Số điện thoại đã tồn tại!");
        return;
      }

      const newCustomer = await khachHangApi.create({
        hoTen: values.hoTen,
        sdt: values.sdt,
        email: values.email,
        gioiTinh: true,
        trangThai: true
      });

      await dispatch(fetchAllKhachHang());

      form.setFieldsValue({
        customerId: newCustomer.id,
        sdt: newCustomer.sdt,
      });
      saveCustomerToBill(newCustomer);
      onCustomerChange && onCustomerChange(newCustomer);

      messageApi.success(`Đã thêm và chọn khách hàng: ${newCustomer.hoTen}`);
      setIsQuickAddModalVisible(false);
      quickAddForm.resetFields();
      
    } catch (error) {
      console.error("Lỗi khi thêm khách hàng:", error);
      messageApi.error("Thêm khách hàng thất bại!");
    } finally {
      setIsLoading(false);
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
            placeholder="Tìm kiếm khách hàng theo tên hoặc số điện thoại"
            onChange={handleSearchChange}
            onKeyDown={handleSearchKeyDown}
            value={search}
            allowClear
            onClear={() => setSearch("")}
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
                    placeholder="Chọn khách hàng"
                    onChange={handleSelectChange}
                    allowClear
                    onClear={() => {
                      removeCustomerFromBill();
                      onCustomerChange && onCustomerChange(null);
                      setSearch("");
                    }}
                    value={form.getFieldValue("customerId")}
                    showSearch={false}
                    defaultActiveFirstOption={false}
                    filterOption={false}
                    notFoundContent={null}
                  >
                    {filteredData?.map((item) => (
                      <Option key={item.id} value={item.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{item.hoTen}</span>
                        </div>
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col flex="1">
                <Form.Item
                  name="sdt"
                  label="Số điện thoại"
                >
                  <Input
                    placeholder="Số điện thoại"
                    readOnly
                    className="readonly-input"
                    style={{ backgroundColor: '#f5f5f5', color: '#666' }}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Form>

          <div className="flex gap-3">
            <div
              onClick={handleQuickAdd}
              className="cursor-pointer select-none text-center py-3 px-4 rounded-xl bg-[#E67E22] font-bold text-white hover:bg-amber-600 active:bg-cyan-800 shadow flex-1"
            >
              Thêm khách hàng
            </div>
          </div>
        </div>
      </div>

      <Modal
        title="Thêm nhanh khách hàng"
        open={isQuickAddModalVisible}
        onCancel={handleQuickAddCancel}
        footer={null}
        width={400}
      >
        <Form
          form={quickAddForm}
          layout="vertical"
          onFinish={handleQuickAddSubmit}
        >
          <Form.Item
            name="hoTen"
            label="Tên khách hàng"
            rules={[
              { required: true, message: "Vui lòng nhập tên khách hàng" },
              { min: 2, message: "Tên phải có ít nhất 2 ký tự" }
            ]}
          >
            <Input placeholder="Nhập tên khách hàng" />
          </Form.Item>

          <Form.Item
            name="sdt"
            label="Số điện thoại"
            rules={[
              { required: true, message: "Vui lòng nhập số điện thoại" },
              {
                pattern: /^0\d{9}$/,
                message: "Số điện thoại phải gồm 10 chữ số và bắt đầu bằng 0",
              },
            ]}
          >
            <Input placeholder="Nhập số điện thoại" />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: "Vui lòng nhập email" },
              {
                pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                message: "Email không đúng định dạng",
              },
              {
                max: 100,
                message: 'Email không được vượt quá 100 ký tự',
              }
            ]}
          >
            <Input placeholder="Nhập email" />
          </Form.Item>

          <Form.Item className="mb-0">
            <div className="flex gap-2 justify-end">
              <Button onClick={handleQuickAddCancel}>
                Hủy
              </Button>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={isLoading}
                className="bg-[#E67E22] border-none hover:bg-amber-600 hover:border-none text-white"
                style={{ backgroundColor: '#E67E22', borderColor: '#E67E22' }}
              >
                Thêm khách hàng
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}