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
  Badge,
} from "antd";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchFilterChatLieu,
  fetchAddChatLieu,
  fetchUpdateTrangThai,
} from "@/redux/slices/chatLieuSlice";
import { useNavigate } from "react-router-dom";

// Icons
import {
  ToggleLeftIcon,
  ToggleRightIcon,
  PencilLineIcon,
} from "@phosphor-icons/react";
// Actions từ slice
import {
  updatePagination,
  updateAdvancedFilters,
  resetChatLieuState,
} from "@/redux/slices/chatLieuSlice";

// Components
import MaterialBreadcrumb from "./MaterialBreadcrumb";
import dayjs from "dayjs";
import FilterMaterial from "./FliterMaterial";

export default function Material() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [messageApi, messageContextHolder] = message.useMessage();
  const [modal, contextHolder] = Modal.useModal();

  // Lấy state từ Redux
  const {
    data: rawData,
    status,
    error,
    pagination: reduxPagination,
    advancedFilters: reduxAdvancedFilters,
  } = useSelector((state) => state.chatlieu);

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
    if (typeof rawData === "object" && rawData !== null) {
      const arrayKeys = Object.keys(rawData).filter((key) =>
        Array.isArray(rawData[key])
      );
      if (arrayKeys.length > 0) return rawData[arrayKeys[0]];
    }
    return [];
  }, [rawData]);

  // Thống kê
  const stats = useMemo(() => {
    const activeCount = tableData.filter(
      (item) => item.trangThai === true
    ).length;
    const inactiveCount = tableData.filter(
      (item) => item.trangThai === false
    ).length;

    return {
      total: tableData.length,
      active: activeCount,
      inactive: inactiveCount,
      activePercent:
        tableData.length > 0
          ? Math.round((activeCount / tableData.length) * 100)
          : 0,
    };
  }, [tableData]);

  // Fetch initial data
  useEffect(() => {
    dispatch(
      fetchFilterChatLieu({
        pageNo: 0,
        pageSize: reduxPagination.pageSize || 10,
        searchText: "",
        maChatLieu: "",
        tenChatLieu: "",
        trangThai: undefined,
      })
    );
  }, [dispatch, reduxPagination.pageSize]);

  // Xử lý thay đổi trạng thái
  const handleChangeStatus = (record) => {
    if (!record?.id) {
      return messageApi.error("Thông tin chất liệu không hợp lệ");
    }

    const action = record.trangThai ? "Kết thúc" : "Kích hoạt";
    const newStatus = !record.trangThai;

    modal.confirm({
      title: `Xác nhận ${action}`,
      content: `Bạn có chắc muốn ${action.toLowerCase()} chất liệu "${
        record.tenChatLieu
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
          console.error("🔴 Lỗi API:", err);
          messageApi.error(err.response?.data?.message || "Có lỗi xảy ra");
        } finally {
          setStatusLoading(null);
        }
      },
    });
  };

  // Xử lý thêm chất liệu
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
      const maChatLieu = addFormValues.maChatLieu?.trim().toUpperCase();
      const tenChatLieu = addFormValues.tenChatLieu?.trim();

      if (!maChatLieu || !tenChatLieu) {
        messageApi.error("Vui lòng nhập đầy đủ thông tin!");
        return;
      }

      await dispatch(
        fetchAddChatLieu({
          maChatLieu,
          tenChatLieu,
          trangThai: true,
        })
      ).unwrap();

      setIsAddConfirmModalVisible(false);
      setIsAddModalVisible(false);
      addForm.resetFields();

      messageApi.success({
        content: `Đã thêm chất liệu "${tenChatLieu}" thành công!`,
        duration: 3,
      });

      handleRefreshCurrentPage();
    } catch (error) {
      console.error("Add material error:", error);
      messageApi.error({
        content: error?.message || "Thêm chất liệu thất bại!",
        duration: 3,
      });
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
      fetchFilterChatLieu({
        pageNo,
        pageSize: newPagination.pageSize,
        searchText: reduxAdvancedFilters.searchText || "",
        maChatLieu: reduxAdvancedFilters.maChatLieu || "",
        tenChatLieu: reduxAdvancedFilters.tenChatLieu || "",
        trangThai: reduxAdvancedFilters.trangThai,
        ngayTao: reduxAdvancedFilters.ngayTao,
      })
    );
  };

  // Refresh trang hiện tại
  const handleRefreshCurrentPage = () => {
    dispatch(
      fetchFilterChatLieu({
        pageNo: reduxPagination.pageNo || 0,
        pageSize: reduxPagination.pageSize || 10,
        searchText: reduxAdvancedFilters.searchText || "",
        maChatLieu: reduxAdvancedFilters.maChatLieu || "",
        tenChatLieu: reduxAdvancedFilters.tenChatLieu || "",
        trangThai: reduxAdvancedFilters.trangThai,
        ngayTao: reduxAdvancedFilters.ngayTao,
      })
    );
  };

  // Xem tất cả (reset filters)
  const handleShowAll = () => {
    dispatch(
      updateAdvancedFilters({
        searchText: "",
        maChatLieu: "",
        tenChatLieu: "",
        ngayTao: null,
        trangThai: undefined,
      })
    );

    dispatch(
      updatePagination({
        current: 1,
        pageNo: 0,
        pageSize: 10,
      })
    );

    dispatch(
      fetchFilterChatLieu({
        pageNo: 0,
        pageSize: 10,
        searchText: "",
        maChatLieu: "",
        tenChatLieu: "",
        trangThai: undefined,
      })
    );
  };

  // Định dạng ngày tháng
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return dayjs(dateString).format("DD/MM/YYYY HH:mm");
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
      title: "MÃ CHẤT LIỆU",
      dataIndex: "maChatLieu",
      key: "maChatLieu",
      width: 150,
      align: "center",
      render: (text) => (
        <Tag color="blue" className="font-semibold">
          {text || "N/A"}
        </Tag>
      ),
    },
    {
      title: "TÊN CHẤT LIỆU",
      dataIndex: "tenChatLieu",
      key: "tenChatLieu",
      width: 250,
      align: "center",
      render: (text) => (
        <span className="font-medium text-gray-900">{text || "N/A"}</span>
      ),
    },
    // {
    //   title: "NGÀY TẠO",
    //   dataIndex: "ngayTao",
    //   key: "ngayTao",
    //   width: 180,
    //   render: (date) => (
    //     <span className="text-gray-600">{formatDate(date)}</span>
    //   ),
    // },
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
          {/* Toggle button */}
          <Button
            type="link"
            onClick={(e) => {
              e.preventDefault();
              handleChangeStatus(record);
            }}
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

          {/* Edit button */}
          <Button
            type="link"
            icon={<PencilLineIcon size={24} weight="fill" color="#E67E22" />}
            onClick={() => navigate(`/admin/update-material/${record.id}`)}
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
          <div className="flex gap-3">
            <Button type="primary" danger onClick={handleShowAll}>
              Thử lại
            </Button>
            <Button onClick={() => dispatch(resetChatLieuState())}>
              Reset state
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {messageContextHolder}
      {contextHolder}

      <div className="bg-white flex flex-col gap-3 px-4 py-[20px] rounded-lg shadow overflow-hidden">
        <div className="font-bold text-4xl text-[#E67E22]">
          Quản lý chất liệu
        </div>
        <MaterialBreadcrumb />
      </div>

      <div className="bg-white rounded-lg shadow mb-6 overflow-hidden mt-6">
        <div className="bg-[#E67E22] text-white px-6 py-3">
          <div className="font-bold text-2xl text-white">Bộ lọc chất liệu</div>
        </div>
        <div className="p-4">
          <FilterMaterial showAddModal={showAddModal} />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="bg-[#E67E22] text-white px-6 py-3 flex justify-between items-center">
          <div className="font-bold text-2xl text-white">
            Danh sách chất liệu 
          </div>
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
              `${range[0]}-${range[1]} của ${total} chất liệu`,
          }}
          onChange={handleTableChange}
          locale={{
            emptyText: "Không có dữ liệu chất liệu",
          }}
          className="custom-table"
        />
      </div>

      {/* ========== MODALS ========== */}

      {/* Modal thêm chất liệu */}
      <Modal
        title={<span className="text-xl font-bold">Thêm chất liệu mới</span>}
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
        maskClosable={!isAdding}
      >
        <Form form={addForm} layout="vertical" className="mt-6">
          <Form.Item
            name="tenChatLieu"
            label="Tên chất liệu"
            rules={[
              { required: true, message: "Vui lòng nhập tên chất liệu!" },
              { min: 2, message: "Tên chất liệu phải có ít nhất 2 ký tự!" },
              { max: 255, message: "Tên chất liệu không quá 255 ký tự!" },
            ]}
          >
            <Input
              placeholder="VD: Cotton, Polyester, Da thật..."
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

      {/* Modal xác nhận thêm chất liệu */}
      <Modal
        open={isAddConfirmModalVisible}
        onCancel={() => {
          if (!isAdding) {
            setIsAddConfirmModalVisible(false);
          }
        }}
        footer={null}
        centered
        closable={!isAdding}
        maskClosable={!isAdding}
        destroyOnClose
      >
        <div className="flex flex-col items-center gap-4 p-4">
          <h2 className="text-xl font-bold text-center">Xác nhận thêm chất liệu</h2>
          
          {addFormValues && (
            <div className="w-full bg-gray-50 rounded-lg p-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="font-medium text-gray-700 w-32">Tên chất liệu:</div>
                  <div className="font-semibold text-gray-900">{addFormValues.tenChatLieu}</div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="font-medium text-gray-700 w-32">Trạng thái:</div>
                  <Tag color="#E9FBF4" style={{ border: "1px solid #00A96C" }}>
                    <div className="text-[#00A96C]">Đang hoạt động</div>
                  </Tag>
                </div>
              </div>
            </div>
          )}
          
          <p className="text-gray-600 text-center mt-2">
            Bạn có chắc muốn thêm chất liệu này vào hệ thống?
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
              style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
            >
              {isAdding ? 'Đang thêm...' : 'Xác nhận thêm'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
