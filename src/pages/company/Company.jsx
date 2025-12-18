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
  ColorPicker,
  Spin,
} from "antd";
import { useDispatch, useSelector } from "react-redux";
import {
  filterMauSac,
  addMauSac,
  changeStatusMauSac,
} from "@/services/mauSacService";
import { useNavigate } from "react-router";

// ✅ IMPORT ICONS GIỐNG PRODUCT
import {
  ToggleLeftIcon,
  ToggleRightIcon,
  PencilLineIcon,
} from "@phosphor-icons/react";

// Import sync actions từ slice
import {
  updatePagination,
  updateAdvancedFilters,
  resetMauSacState,
} from "@/redux/slices/mauSacSlice";
import FliterCompany from "./FliterCompany";
import CompanyBreadcrumb from "./CompanyBreadcrumb";

export default function Company() {
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
  } = useSelector((state) => state.mausac);

  // Modal states
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isAddConfirmModalVisible, setIsAddConfirmModalVisible] =
    useState(false);
  const [addForm] = Form.useForm();
  const [addFormValues, setAddFormValues] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [statusLoading, setStatusLoading] = useState(null);

  // Transform data để đảm bảo luôn là array
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
      filterMauSac({
        pageNo: 0,
        pageSize: reduxPagination.pageSize || 10,
        searchText: "",
        maMauSac: "",
        tenMauSac: "",
        trangThai: undefined,
      })
    );
  }, [dispatch, reduxPagination.pageSize]);

  // ✅ XỬ LÝ THAY ĐỔI TRẠNG THÁI - GIỐNG PRODUCT
  const handleChangeStatus = (record) => {
    if (!record?.id) {
      return messageApi.error("Thông tin màu sắc không hợp lệ");
    }

    const action = record.trangThai ? "Kết thúc" : "Kích hoạt";
    const newStatus = !record.trangThai;

    modal.confirm({
      title: `Xác nhận ${action}`,
      content: `Bạn có chắc muốn ${action.toLowerCase()} màu sắc "${
        record.tenMauSac
      }"?`,
      okText: action,
      cancelText: "Hủy",
      async onOk() {
        setStatusLoading(record.id);

        try {
          await dispatch(
            changeStatusMauSac({
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

  // === Xử lý thêm màu sắc ===
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
      let maHex = "";
      if (
        typeof addFormValues.maHex === "object" &&
        addFormValues.maHex?.toHexString
      ) {
        maHex = addFormValues.maHex.toHexString().toUpperCase();
      } else if (typeof addFormValues.maHex === "string") {
        maHex = addFormValues.maHex.toUpperCase();
      }

      const tenMauSac = addFormValues.tenMauSac?.trim();

      if (!maHex || !tenMauSac) {
        messageApi.error("Vui lòng nhập đầy đủ thông tin!");
        return;
      }

      if (!/^#[0-9A-F]{6}$/i.test(maHex)) {
        messageApi.error("Mã HEX không hợp lệ!");
        return;
      }

      await dispatch(
        addMauSac({
          maHex,
          tenMauSac,
          trangThai: true,
        })
      ).unwrap();

      setIsAddConfirmModalVisible(false);
      setIsAddModalVisible(false);
      addForm.resetFields();

      messageApi.success({
        content: `Đã thêm màu sắc "${tenMauSac}" thành công!`,
        duration: 3,
      });

      handleRefreshCurrentPage();
    } catch (error) {
      console.error("Add color error:", error);
      messageApi.error({
        content: error?.message || "Thêm màu sắc thất bại!",
        duration: 3,
      });
    } finally {
      setIsAdding(false);
      setAddFormValues(null);
    }
  };

  // === Xử lý phân trang ===
  const handleTableChange = (newPagination) => {
    dispatch(
      updatePagination({
        current: newPagination.current,
        pageSize: newPagination.pageSize,
      })
    );

    const pageNo = newPagination.current - 1;

    dispatch(
      filterMauSac({
        pageNo,
        pageSize: newPagination.pageSize,
        searchText: reduxAdvancedFilters.searchText || "",
        maMauSac: reduxAdvancedFilters.maMauSac || "",
        tenMauSac: reduxAdvancedFilters.tenMauSac || "",
        trangThai: reduxAdvancedFilters.trangThai,
        ngayTao: reduxAdvancedFilters.ngayTao,
      })
    );
  };

  // Refresh trang hiện tại
  const handleRefreshCurrentPage = () => {
    dispatch(
      filterMauSac({
        pageNo: reduxPagination.pageNo || 0,
        pageSize: reduxPagination.pageSize || 10,
        searchText: reduxAdvancedFilters.searchText || "",
        maMauSac: reduxAdvancedFilters.maMauSac || "",
        tenMauSac: reduxAdvancedFilters.tenMauSac || "",
        trangThai: reduxAdvancedFilters.trangThai,
        ngayTao: reduxAdvancedFilters.ngayTao,
      })
    );
  };

  // === Xem tất cả (reset filters) ===
  const handleShowAll = () => {
    dispatch(
      updateAdvancedFilters({
        searchText: "",
        maMauSac: "",
        tenMauSac: "",
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
      filterMauSac({
        pageNo: 0,
        pageSize: 10,
        searchText: "",
        maMauSac: "",
        tenMauSac: "",
        trangThai: undefined,
      })
    );
  };

  // ✅ CỘT BẢNG - ĐỒNG NHẤT VỚI PRODUCT
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
      title: "MÃ MÀU SẮC",
      dataIndex: "maMauSac",
      key: "maMauSac",
      width: 130,
      render: (text) => <Tag color="blue">{text || "N/A"}</Tag>,
    },
    {
      title: "MÃ HEX",
      dataIndex: "maHex",
      key: "maHex",
      align: "center",
      width: 180,
      render: (hex, record) => (
        <div className="flex items-center justify-center gap-2">
          {hex ? (
            <>
              <div
                className="w-6 h-6 rounded border shadow-sm"
                style={{
                  backgroundColor: hex,
                  borderColor: "#d9d9d9",
                }}
                title={`Màu: ${record.tenMauSac} (${hex})`}
              />
              <span className="font-mono text-sm font-medium">
                {hex.toUpperCase()}
              </span>
            </>
          ) : (
            <span className="text-gray-400">N/A</span>
          )}
        </div>
      ),
    },
    {
      title: "TÊN MÀU SẮC",
      dataIndex: "tenMauSac",
      key: "tenMauSac",
      width: 200,
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
          {/* ✅ TOGGLE BUTTON - GIỐNG PRODUCT */}
          <a
            onClick={(e) => {
              e.preventDefault();
              handleChangeStatus(record);
            }}
            style={{
              cursor: statusLoading === record.id ? "not-allowed" : "pointer",
              opacity: statusLoading === record.id ? 0.6 : 1,
            }}
          >
            {statusLoading === record.id ? (
              <span>...</span>
            ) : record.trangThai ? (
              <ToggleRightIcon weight="fill" size={30} color="#00A96C" />
            ) : (
              <ToggleLeftIcon weight="fill" size={30} color="#c5c5c5" />
            )}
          </a>

          {/* ✅ EDIT BUTTON - GIỐNG PRODUCT */}
          <Button
            type="link"
            icon={<PencilLineIcon size={24} weight="fill" color="#E67E22" />}
            onClick={() => navigate(`/admin/update-color/${record.id}`)}
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
            {error || "Không thể tải dữ liệu"}
          </div>
          <div className="flex gap-3">
            <Button type="primary" danger onClick={handleShowAll}>
              Thử lại
            </Button>
            <Button onClick={() => dispatch(resetMauSacState())}>
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

      {/* ✅ HEADER - GIỐNG PRODUCT */}
      <div className="bg-white flex flex-col gap-3 px-4 py-[20px] rounded-lg shadow overflow-hidden">
        <div className="font-bold text-4xl text-[#E67E22]">Quản lý màu sắc</div>
        <div className="flex justify-between items-center mb-2">
          <CompanyBreadcrumb />
        </div>
      </div>

      {/* ✅ FILTER SECTION - GIỐNG PRODUCT */}
      <div className="bg-white rounded-lg shadow mb-6 overflow-hidden mt-6">
        <div className="bg-[#E67E22] text-white px-6 py-3">
          <div className="font-bold text-2xl text-white">Bộ lọc màu sắc</div>
        </div>
        <div className="p-4">
          <FliterCompany showAddModal={showAddModal} />
        </div>
      </div>

      {/* ✅ TABLE SECTION - GIỐNG PRODUCT */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="bg-[#E67E22] text-white px-6 py-3 flex justify-between items-center">
          <div className="font-bold text-2xl text-white">
            Danh sách màu sắc ({stats.total} màu)
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
          }}
          onChange={handleTableChange}
          locale={{
            emptyText: "Không có dữ liệu màu sắc",
          }}
          className="custom-table"
        />
      </div>

      {/* ========== MODALS ========== */}

      {/* Modal thêm màu sắc */}
      <Modal
        title={<span className="text-xl font-bold">Thêm màu sắc mới</span>}
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
            name="maHex"
            label="Mã HEX"
            rules={[{ required: true, message: "Vui lòng chọn màu sắc!" }]}
            getValueFromEvent={(color) =>
              color?.toHexString ? color.toHexString() : color
            }
            normalize={(value) =>
              typeof value === "string" ? value.toUpperCase() : value
            }
          >
            <ColorPicker
              format="hex"
              showText={(color) =>
                color?.toHexString ? color.toHexString().toUpperCase() : ""
              }
              size="large"
              allowClear={false}
              disabled={isAdding}
            />
          </Form.Item>

          <Form.Item
            name="tenMauSac"
            label="Tên màu sắc"
            rules={[
              { required: true, message: "Vui lòng nhập tên màu sắc!" },
              { min: 2, message: "Tên màu sắc phải có ít nhất 2 ký tự!" },
              { max: 100, message: "Tên màu sắc không quá 100 ký tự!" },
            ]}
          >
            <Input
              placeholder="VD: Đỏ tươi, Xanh dương, Vàng cam..."
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

      {/* Modal xác nhận thêm màu sắc */}
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
          <div className="text-5xl">✅</div>
          <h2 className="text-xl font-bold text-center">
            Xác nhận thêm màu sắc
          </h2>

          {addFormValues && (
            <div className="w-full bg-gray-50 rounded-lg p-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="font-medium text-gray-700 w-32">Mã HEX:</div>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded border"
                      style={{
                        backgroundColor:
                          typeof addFormValues.maHex === "object"
                            ? addFormValues.maHex.toHexString?.()
                            : addFormValues.maHex,
                      }}
                    />
                    <span className="font-semibold font-mono">
                      {typeof addFormValues.maHex === "object"
                        ? addFormValues.maHex.toHexString?.().toUpperCase()
                        : addFormValues.maHex?.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="font-medium text-gray-700 w-32">Tên màu:</div>
                  <div className="font-semibold text-gray-900">
                    {addFormValues.tenMauSac}
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
            Bạn có chắc muốn thêm màu sắc này vào hệ thống?
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
              style={{ backgroundColor: "#52c41a", borderColor: "#52c41a" }}
            >
              {isAdding ? "Đang thêm..." : "Xác nhận thêm"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
