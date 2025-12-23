import React, { useEffect, useState, useMemo } from "react";
import {
  Space,
  Table,
  Tag,
  message,
  Modal,
  Button,
  Form,
  Input,
  Spin,
} from "antd";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchFilterCoAo,
  fetchAddCoAo,
  fetchUpdateTrangThai,
} from "@/redux/slices/coAoSlice";
import {
  updatePagination,
  updateAdvancedFilters,
  resetCoAoState,
} from "@/redux/slices/coAoSlice";
import FilterCollar from "./FilterCollar";
import { ToggleLeftIcon, ToggleRightIcon } from "@phosphor-icons/react";
import CollarBreadcrumb from "./CollarBreadcrumb";

export default function Collar() {
  const dispatch = useDispatch();
  const [messageApi, messageContextHolder] = message.useMessage();
  const [modal, contextHolder] = Modal.useModal();

  // Lấy state từ Redux
  const coAoState = useSelector((state) => state?.coao);

  // Fallback values
  const rawData = coAoState?.data || null;
  const status = coAoState?.status || "idle";
  const error = coAoState?.error || null;
  const reduxPagination = coAoState?.pagination || {
    current: 1,
    pageNo: 0,
    pageSize: 10,
    totalElements: 0,
    totalPages: 0,
  };
  const reduxAdvancedFilters = coAoState?.advancedFilters || {
    searchText: "",
    maCoAo: "",
    tenCoAo: "",
    ngayTao: null,
    trangThai: undefined,
  };

  // Modal states
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isAddConfirmModalVisible, setIsAddConfirmModalVisible] =
    useState(false);
  const [addForm] = Form.useForm();
  const [addFormValues, setAddFormValues] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [statusLoading, setStatusLoading] = useState(null);

  // Transform data
  const tableData = useMemo(() => {
    if (!rawData) return [];
    if (Array.isArray(rawData)) return rawData;
    if (rawData.data && Array.isArray(rawData.data)) return rawData.data;
    if (rawData.content && Array.isArray(rawData.content))
      return rawData.content;
    return [];
  }, [rawData]);

  // Fetch initial data
  useEffect(() => {
    dispatch(
      fetchFilterCoAo({
        pageNo: 0,
        pageSize: reduxPagination.pageSize || 10,
        searchText: "",
        maCoAo: "",
        tenCoAo: "",
        trangThai: undefined,
      })
    );
  }, [dispatch, reduxPagination.pageSize]);

  // Xử lý thay đổi trạng thái
  const handleChangeStatus = (record) => {
    if (!record?.id) {
      return messageApi.error("Thông tin cổ áo không hợp lệ");
    }

    const action = record.trangThai ? "Kết thúc" : "Kích hoạt";
    const newStatus = !record.trangThai;

    modal.confirm({
      title: `Xác nhận ${action}`,
      content: `Bạn có chắc muốn ${action.toLowerCase()} cổ áo "${
        record.tenCoAo
      }"?`,
      okText: action,
      cancelText: "Hủy",
      async onOk() {
        setStatusLoading(record.id);

        try {
          await dispatch(
            fetchUpdateTrangThai({
              id: record.id,
              trangThai: newStatus,
            })
          ).unwrap();

          messageApi.success(`${action} thành công!`);
          handleRefreshCurrentPage();
        } catch (err) {
          messageApi.error(err.response?.data?.message || "Có lỗi xảy ra");
        } finally {
          setStatusLoading(null);
        }
      },
    });
  };

  // Xử lý thêm cổ áo
  const showAddModal = () => {
    addForm.resetFields();
    setIsAddModalVisible(true);
  };

  const handleAddSubmit = async () => {
    try {
      const values = await addForm.validateFields();
      setAddFormValues(values);
      setIsAddConfirmModalVisible(true);
    } catch (error) {
      console.error("Form validation error:", error);
    }
  };

  const handleConfirmAdd = async () => {
    if (!addFormValues) return;

    setIsAdding(true);

    try {
      const maCoAo = addFormValues.maCoAo?.trim().toUpperCase();
      const tenCoAo = addFormValues.tenCoAo?.trim();

      if (!tenCoAo) {
        messageApi.error("Vui lòng nhập đầy đủ thông tin!");
        return;
      }

      await dispatch(
        fetchAddCoAo({
          maCoAo,
          tenCoAo,
          trangThai: true,
        })
      ).unwrap();

      setIsAddConfirmModalVisible(false);
      setIsAddModalVisible(false);
      addForm.resetFields();

      messageApi.success(`Đã thêm cổ áo "${tenCoAo}" thành công!`);
      handleRefreshCurrentPage();
    } catch (error) {
      messageApi.error(error?.message || "Thêm cổ áo thất bại!");
    } finally {
      setIsAdding(false);
      setAddFormValues(null);
    }
  };

  // Xử lý phân trang
  const handleTableChange = (newPagination) => {
    dispatch(
      updatePagination({
        current: newPagination.current,
        pageSize: newPagination.pageSize,
      })
    );

    const pageNo = newPagination.current - 1;

    dispatch(
      fetchFilterCoAo({
        pageNo,
        pageSize: newPagination.pageSize,
        searchText: reduxAdvancedFilters.searchText || "",
        maCoAo: reduxAdvancedFilters.maCoAo || "",
        tenCoAo: reduxAdvancedFilters.tenCoAo || "",
        trangThai: reduxAdvancedFilters.trangThai,
        ngayTao: reduxAdvancedFilters.ngayTao,
      })
    );
  };

  // Refresh trang hiện tại
  const handleRefreshCurrentPage = () => {
    dispatch(
      fetchFilterCoAo({
        pageNo: reduxPagination.pageNo || 0,
        pageSize: reduxPagination.pageSize || 10,
        searchText: reduxAdvancedFilters.searchText || "",
        maCoAo: reduxAdvancedFilters.maCoAo || "",
        tenCoAo: reduxAdvancedFilters.tenCoAo || "",
        trangThai: reduxAdvancedFilters.trangThai,
        ngayTao: reduxAdvancedFilters.ngayTao,
      })
    );
  };

  // Cột bảng
  const columns = [
    {
      title: "STT",
      key: "stt",
      render: (_, __, index) => {
        const currentPage = Number(reduxPagination.current) || 1;
        const pageSize = Number(reduxPagination.pageSize) || 10;
        const stt = (currentPage - 1) * pageSize + index + 1;
        return (
          <div className="flex items-center justify-center">
            <span className="text-gray-600">
              {String(Math.max(1, stt)).padStart(2, "0")}
            </span>
          </div>
        );
      },
      width: 60,
      align: "center",
    },
    {
      title: "MÃ CỔ ÁO",
      dataIndex: "maCoAo",
      key: "maCoAo",
      width: 150,
      align: "center",
      render: (text) => (
        <Tag color="blue" className="font-semibold">
          {text || "N/A"}
        </Tag>
      ),
    },
    {
      title: "TÊN CỔ ÁO",
      dataIndex: "tenCoAo",
      key: "tenCoAo",
      width: 250,
      align: "center",
      render: (text) => (
        <span className="font-medium text-gray-900">{text || "N/A"}</span>
      ),
    },
    {
      title: "TRẠNG THÁI",
      dataIndex: "trangThai",
      key: "trangThai",
      align: "center",
      width: 160,
      render: (value) =>
        value ? (
          <Tag color="#E9FBF4" style={{ border: "1px solid #00A96C" }}>
            <div className="text-[#00A96C]">Đang hoạt động</div>
          </Tag>
        ) : (
          <Tag color="red">Ngừng hoạt động</Tag>
        ),
    },
    {
      title: "HÀNH ĐỘNG",
      key: "action",
      align: "center",
      width: 120,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            onClick={() => handleChangeStatus(record)}
            disabled={statusLoading === record.id}
            icon={
              statusLoading === record.id ? (
                <Spin size="small" />
              ) : record.trangThai ? (
                <ToggleRightIcon weight="fill" size={30} color="#00A96C" />
              ) : (
                <ToggleLeftIcon weight="fill" size={30} color="#c5c5c5" />
              )
            }
          />
        </Space>
      ),
    },
  ];

  // Hiển thị loading
  if (status === "loading" && !isAdding) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex justify-center items-center">
        <Spin size="large" tip="Đang tải dữ liệu..." />
      </div>
    );
  }

  // Hiển thị lỗi
  if (status === "failed") {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-700 font-medium mb-2">Đã xảy ra lỗi</div>
          <div className="text-red-600 mb-4">
            {error?.message || "Không thể tải dữ liệu"}
          </div>
          <Button
            type="primary"
            danger
            onClick={() => dispatch(resetCoAoState())}
          >
            Thử lại
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {messageContextHolder}
      {contextHolder}

      {/* Header */}
      <div className="bg-white flex justify-between items-center gap-3 px-4 py-5 rounded-lg shadow">
        <div>
          <div className="font-bold text-4xl text-[#E67E22]">Quản lý cổ áo</div>
          <CollarBreadcrumb />
        </div>
        <div
          onClick={showAddModal}
          className="bg-[#E67E22] text-white text-xs rounded-md px-6 py-2 cursor-pointer font-bold hover:bg-amber-700 select-none"
        >
          Thêm cổ áo
        </div>
      </div>

      {/* Filter */}
      {/* <div className="bg-white rounded-lg shadow mb-6 overflow-hidden mt-6">
        <div className="bg-[#E67E22] text-white px-6 py-3">
          <div className="font-bold text-2xl text-white">Bộ lọc cổ áo</div>
        </div>
        <div className="p-4">
          <FilterCollar showAddModal={showAddModal} />
        </div>
      </div> */}

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden mt-6">
        <div className="bg-[#E67E22] text-white px-6 py-3">
          <div className="font-bold text-2xl text-white">Danh sách cổ áo</div>
        </div>
        <Table
          columns={columns}
          dataSource={tableData}
          rowKey="id"
          loading={status === "loading"}
          pagination={{
            current: reduxPagination.current,
            pageSize: reduxPagination.pageSize,
            total: reduxPagination.totalElements || tableData.length,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} của ${total} cổ áo`,
          }}
          onChange={handleTableChange}
          locale={{ emptyText: "Không có dữ liệu cổ áo" }}
          className="custom-table"
        />
      </div>

      {/* Modals */}
      {/* Add Modal */}
      <Modal
        title="Thêm cổ áo mới"
        open={isAddModalVisible}
        onCancel={() => {
          if (!isAdding) {
            setIsAddModalVisible(false);
            addForm.resetFields();
          }
        }}
        footer={null}
        width={520}
        destroyOnClose
      >
        <Form form={addForm} layout="vertical" className="mt-6">
          <Form.Item
            name="tenCoAo"
            label="Tên cổ áo"
            rules={[
              { required: true, message: "Vui lòng nhập tên cổ áo!" },
              { min: 2, message: "Tên cổ áo phải có ít nhất 2 ký tự!" },
            ]}
          >
            <Input
              placeholder="VD: Cổ tròn, Cổ tim, Cổ V..."
              disabled={isAdding}
            />
          </Form.Item>
          <div className="flex justify-end gap-4 mt-8">
            <Button
              onClick={() => setIsAddModalVisible(false)}
              disabled={isAdding}
            >
              Hủy
            </Button>
            <Button type="primary" onClick={handleAddSubmit} loading={isAdding}>
              Tiếp tục
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Confirm Add Modal */}
      <Modal
        open={isAddConfirmModalVisible}
        onCancel={() => !isAdding && setIsAddConfirmModalVisible(false)}
        footer={null}
        centered
      >
        <div className="flex flex-col items-center gap-4 p-4">
          <h2 className="text-xl font-bold text-center">Xác nhận thêm cổ áo</h2>
          {addFormValues && (
            <div className="w-full bg-gray-50 rounded-lg p-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="font-medium text-gray-700 w-32">
                    Tên cổ áo:
                  </div>
                  <div className="font-semibold text-gray-900">
                    {addFormValues.tenCoAo}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="font-medium text-gray-700 w-32">
                    Trạng thái:
                  </div>
                  <Tag color="#E9FBF4" style={{ border: "1px solid #00A96C" }}>
                    <div className="text-[#00A96C]">Đang hoạt động</div>
                  </Tag>
                </div>
              </div>
            </div>
          )}
          <p className="text-gray-600 text-center mt-2">
            Bạn có chắc muốn thêm cổ áo này vào hệ thống?
          </p>
          <div className="flex justify-center gap-6 mt-6 w-full">
            <Button
              size="large"
              className="w-40"
              onClick={() => setIsAddConfirmModalVisible(false)}
              disabled={isAdding}
            >
              Hủy
            </Button>
            <Button
              type="primary"
              size="large"
              className="w-40"
              onClick={handleConfirmAdd}
              loading={isAdding}
            >
              {isAdding ? "Đang thêm..." : "Xác nhận thêm"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
