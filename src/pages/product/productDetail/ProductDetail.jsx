import React, { useEffect, useState } from "react";
import {
  Space,
  Table,
  Tag,
  message,
  Modal,
  Image,
  Button,
  Form,
  InputNumber,
  Popconfirm,
  Input,
  Tooltip,
} from "antd";
import CloudinaryUpload from "../CloudinaryUpload";
import {
  EditOutlined,
  DeleteOutlined,
  SaveOutlined,
  CloseOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import baseUrl from "@/api/instance";
import "./ProductDetail.css";

export default function ProductDetail({
  bienTheList = [],
  loading = false,
  onResetCallback,
  onShowConfirmModal,
}) {
  const [variants, setVariants] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState("");
  const [editingKey, setEditingKey] = useState("");
  const [form] = Form.useForm();
  const [quickInputModal, setQuickInputModal] = useState(false);
  const [quickInputForm] = Form.useForm();
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    if (!Array.isArray(bienTheList) || bienTheList.length === 0) {
      setVariants([]);
      setSelectedRowKeys([]);
      setValidationErrors({});
      return;
    }

    const transformedVariants = bienTheList.map((bienThe, index) => {
      const tenSanPham =
        bienThe.tenSanPham ||
        bienThe.sanPham?.tenSanPham ||
        bienThe.sanPhamTen ||
        "Sản phẩm chưa đặt tên";

      return {
        key: bienThe.id || `bien-the-${index}-${Date.now()}`,
        idChiTietSanPham: bienThe.id,
        tenSanPham,
        tenCoAo: bienThe.tenCoAo || bienThe.coAo?.tenCoAo || "N/A",
        tenTayAo: bienThe.tenTayAo || bienThe.tayAo?.tenTayAo || "N/A",
        tenTrongLuong:
          bienThe.tenTrongLuong || bienThe.trongLuong?.tenTrongLuong || "N/A",
        tenKichThuoc:
          bienThe.tenKichThuoc || bienThe.kichThuoc?.tenKichThuoc || "N/A",
        tenMauSac: bienThe.tenMauSac || bienThe.mauSac?.tenMauSac || "N/A",
        donGia: bienThe.giaBan || bienThe.donGia || 0,
        soLuong: bienThe.soLuongTon || bienThe.soLuong || 0,
        moTa: bienThe.moTa || "",
        idMauSac: bienThe.idMauSac || bienThe.mauSac?.id,
        idKichThuoc: bienThe.idKichThuoc || bienThe.kichThuoc?.id,
        idCoAo: bienThe.idCoAo || bienThe.coAo?.id,
        idTayAo: bienThe.idTayAo || bienThe.tayAo?.id,
        idTrongLuong: bienThe.idTrongLuong || bienThe.trongLuong?.id,
        imageUrl: null,
        imageId: null,
      };
    });

    setVariants(transformedVariants);
    setSelectedRowKeys(transformedVariants.map((v) => v.key));
    setValidationErrors({});

    transformedVariants.forEach((variant) => {
      if (variant.idChiTietSanPham) {
        loadImageForVariant(variant.idChiTietSanPham);
      }
    });
  }, [bienTheList]);

  const apiCall = async (url, method = "GET", data = null) => {
    try {
      const config = { method };
      if (data) config.data = data;

      const response = await baseUrl(url, config);
      return response.data?.success
        ? { success: true, data: response.data }
        : { success: false, error: response.data?.message };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || "Lỗi kết nối",
      };
    }
  };

  const capNhatSoLuong = (idChiTietSanPham, soLuong) =>
    apiCall(`/chi-tiet-san-pham/${idChiTietSanPham}/so-luong`, "PATCH", {
      soLuong,
    });

  const capNhatGia = (idChiTietSanPham, donGia) =>
    apiCall(`/chi-tiet-san-pham/${idChiTietSanPham}/gia`, "PATCH", { donGia });

  const xoaBienThe = (idChiTietSanPham) =>
    apiCall(`/chi-tiet-san-pham/${idChiTietSanPham}`, "DELETE");

  const loadImageForVariant = async (idChiTietSanPham) => {
    try {
      const response = await baseUrl.get(`/anh/bien-the/${idChiTietSanPham}`);
      if (response.data.success && response.data.data?.length > 0) {
        const image = response.data.data[0];
        setVariants((prev) =>
          prev.map((v) =>
            v.idChiTietSanPham === idChiTietSanPham
              ? { ...v, imageUrl: image.duongDanAnh, imageId: image.id }
              : v
          )
        );
      }
    } catch (error) {
      console.error("Lỗi load ảnh:", error);
    }
  };

  const handleUploadImageForVariant = async (variantKey, uploadedImage) => {
    const variant = variants.find((v) => v.key === variantKey);
    if (!variant?.idChiTietSanPham) {
      message.error("Biến thể chưa được lưu, không thể upload ảnh");
      return;
    }

    try {
      const response = await baseUrl.post(
        `/anh/${variant.idChiTietSanPham}/single`,
        { imageUrl: uploadedImage.url }
      );

      if (response.data.success) {
        const imgUrl = uploadedImage.url || response.data.data.imageUrl;
        setVariants((prev) =>
          prev.map((v) =>
            v.key === variantKey
              ? { ...v, imageUrl: imgUrl, imageId: response.data.data.id }
              : v
          )
        );
        message.success("Đã lưu ảnh cho biến thể");
      }
    } catch (error) {
      message.error("Lỗi khi lưu ảnh");
    }
  };

  const handleDeleteImage = async (variantKey) => {
    const variant = variants.find((v) => v.key === variantKey);
    if (!variant?.imageId) return;

    try {
      await baseUrl.delete(`/anh/${variant.imageId}`);
      setVariants((prev) =>
        prev.map((v) =>
          v.key === variantKey ? { ...v, imageUrl: null, imageId: null } : v
        )
      );
      message.success("Đã xóa ảnh");
    } catch (error) {
      message.error("Lỗi khi xóa ảnh");
    }
  };

  const isEditing = (record) => record.key === editingKey;

  const handleEdit = (record) => {
    form.setFieldsValue({
      soLuong: record.soLuong,
      donGia: record.donGia,
      moTa: record.moTa,
    });
    setEditingKey(record.key);
  };

  const handleCancel = () => setEditingKey("");

  const handleSave = async (key) => {
    try {
      const row = await form.validateFields();
      const newData = [...variants];
      const index = newData.findIndex((item) => key === item.key);

      if (index > -1) {
        const item = newData[index];
        const updatedItem = { ...item, ...row };

        newData.splice(index, 1, updatedItem);
        setVariants(newData);
        setEditingKey("");

        setValidationErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[`price_${key}`];
          delete newErrors[`quantity_${key}`];
          return newErrors;
        });

        if (updatedItem.idChiTietSanPham) {
          if (row.soLuong !== undefined && row.soLuong !== item.soLuong) {
            const result = await capNhatSoLuong(
              updatedItem.idChiTietSanPham,
              row.soLuong
            );
            if (!result.success) throw new Error(result.error);
          }

          if (row.donGia !== undefined && row.donGia !== item.donGia) {
            const result = await capNhatGia(
              updatedItem.idChiTietSanPham,
              parseFloat(row.donGia)
            );
            if (!result.success) throw new Error(result.error);
          }
        }

        message.success("Cập nhật biến thể thành công");
      }
    } catch (error) {
      message.error(error.message || "Lỗi khi cập nhật biến thể");
    }
  };

  const handleQuickUpdate = async (key, field, value, apiFunction) => {
    try {
      const variant = variants.find((v) => v.key === key);
      if (!variant?.idChiTietSanPham) return;

      if (value === undefined || value === null || value === "") {
        return;
      }

      const updatedVariants = variants.map((v) =>
        v.key === key ? { ...v, [field]: value } : v
      );
      setVariants(updatedVariants);

      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        if (field === "donGia") delete newErrors[`price_${key}`];
        if (field === "soLuong") delete newErrors[`quantity_${key}`];
        return newErrors;
      });

      const result = await apiFunction(variant.idChiTietSanPham, value);
      if (!result.success) throw new Error(result.error);
    } catch (error) {
      message.error(error.message || `Lỗi khi cập nhật ${field}`);
    }
  };

  const handleQuickQuantityChange = (key, value) =>
    handleQuickUpdate(key, "soLuong", value, capNhatSoLuong);

  const handleQuickPriceChange = (key, value) =>
    handleQuickUpdate(key, "donGia", parseFloat(value), capNhatGia);

  const handleQuickInputAll = async (values) => {
    try {
      const { soLuong, donGia } = values;

      console.log("📦 Quick input raw values:", { soLuong, donGia });

      if (selectedRowKeys.length === 0) {
        message.warning("Vui lòng chọn ít nhất một biến thể để áp dụng");
        return;
      }

      const hasSoLuong = soLuong !== undefined && soLuong !== null;
      const hasDonGia = donGia !== undefined && donGia !== null;

      console.log("🔧 Has values:", { hasSoLuong, hasDonGia });

      if (!hasSoLuong && !hasDonGia) {
        message.warning("Vui lòng nhập ít nhất một giá trị để áp dụng");
        return;
      }

      const updatedVariants = variants.map((v) => {
        if (selectedRowKeys.includes(v.key)) {
          const updates = { ...v };
          if (hasSoLuong) updates.soLuong = soLuong;
          if (hasDonGia) updates.donGia = donGia;
          return updates;
        }
        return v;
      });

      setVariants(updatedVariants);

      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        selectedRowKeys.forEach((key) => {
          if (hasSoLuong) delete newErrors[`quantity_${key}`];
          if (hasDonGia) delete newErrors[`price_${key}`];
        });
        return newErrors;
      });

      const updatePromises = selectedRowKeys.map(async (key) => {
        const variant = updatedVariants.find((v) => v.key === key);
        if (!variant?.idChiTietSanPham) return Promise.resolve();

        const promises = [];
        if (hasSoLuong) {
          promises.push(capNhatSoLuong(variant.idChiTietSanPham, soLuong));
        }
        if (hasDonGia) {
          promises.push(
            capNhatGia(variant.idChiTietSanPham, parseFloat(donGia))
          );
        }
        return Promise.all(promises);
      });

      await Promise.all(updatePromises);

      message.success(
        `Đã cập nhật ${selectedRowKeys.length} biến thể thành công`
      );
      setQuickInputModal(false);
      quickInputForm.resetFields();
    } catch (error) {
      console.error("❌ Quick input error:", error);
      message.error("Lỗi khi cập nhật hàng loạt");
    }
  };

  const handleDelete = async (record) => {
    try {
      if (record.idChiTietSanPham) {
        const result = await xoaBienThe(record.idChiTietSanPham);
        if (!result.success) throw new Error(result.error);
      }

      const updatedVariants = variants.filter(
        (variant) => variant.key !== record.key
      );
      setVariants(updatedVariants);
      setSelectedRowKeys((prev) => prev.filter((key) => key !== record.key));

      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[`price_${record.key}`];
        delete newErrors[`quantity_${record.key}`];
        return newErrors;
      });

      message.success("Xóa biến thể thành công");
    } catch (error) {
      message.error(error.message || "Lỗi khi xóa biến thể");
    }
  };

  const handleDeleteMultiple = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning("Vui lòng chọn ít nhất một biến thể để xóa");
      return;
    }

    Modal.confirm({
      title: "Xác nhận xóa",
      icon: <ExclamationCircleOutlined />,
      content: `Bạn có chắc muốn xóa ${selectedRowKeys.length} biến thể đã chọn?`,
      okText: "Xóa",
      cancelText: "Hủy",
      okType: "danger",
      onOk: async () => {
        try {
          const deletePromises = selectedRowKeys.map(async (key) => {
            const variant = variants.find((v) => v.key === key);
            return variant?.idChiTietSanPham
              ? await xoaBienThe(variant.idChiTietSanPham)
              : { success: true };
          });

          await Promise.all(deletePromises);
          const updatedVariants = variants.filter(
            (variant) => !selectedRowKeys.includes(variant.key)
          );

          setVariants(updatedVariants);

          setValidationErrors((prev) => {
            const newErrors = { ...prev };
            selectedRowKeys.forEach((key) => {
              delete newErrors[`price_${key}`];
              delete newErrors[`quantity_${key}`];
            });
            return newErrors;
          });

          setSelectedRowKeys([]);
          message.success(
            `Đã xóa ${selectedRowKeys.length} biến thể thành công`
          );
        } catch (error) {
          message.error("Lỗi khi xóa biến thể");
        }
      },
    });
  };

  const validateVariantsBeforeCreate = () => {
    const errors = {};
    let hasError = false;

    variants.forEach((variant, index) => {
      if (!variant.donGia || variant.donGia <= 0) {
        errors[`price_${variant.key}`] = `Biến thể ${index + 1} (${
          variant.tenMauSac
        }/${variant.tenKichThuoc}) chưa có đơn giá hợp lệ`;
        hasError = true;
      }

      if (
        variant.soLuong === undefined ||
        variant.soLuong === null ||
        variant.soLuong < 0
      ) {
        errors[`quantity_${variant.key}`] = `Biến thể ${index + 1} (${
          variant.tenMauSac
        }/${variant.tenKichThuoc}) chưa có số lượng hợp lệ`;
        hasError = true;
      }
    });

    setValidationErrors(errors);
    return !hasError;
  };

  const handleTaoSanPham = () => {
    setValidationErrors({});

    if (!validateVariantsBeforeCreate()) {
      message.error(
        "Vui lòng kiểm tra lại thông tin các biến thể trước khi tạo sản phẩm"
      );

      const firstErrorKey = Object.keys(validationErrors)[0];
      if (firstErrorKey) {
        const variantKey = firstErrorKey.split("_")[1];
        const element = document.querySelector(
          `[data-variant-key="${variantKey}"]`
        );
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
      return;
    }

    if (variants.length === 0) {
      message.error("Không có biến thể nào để tạo sản phẩm");
      return;
    }

    const totalQuantity = variants.reduce(
      (total, v) => total + (v.soLuong || 0),
      0
    );
    const totalValue = variants.reduce(
      (total, v) => total + v.donGia * (v.soLuong || 0),
      0
    );

    const handleConfirm = () => {
      console.log("🎯 Bắt đầu tạo sản phẩm với các biến thể:", variants);
      message.success(
        `Đã tạo thành công ${variants.length} biến thể sản phẩm!`
      );
      handleReset();
    };

    onShowConfirmModal?.({
      totalVariants: variants.length,
      totalQuantity,
      totalValue,
      variantsWithStock: variants.filter((v) => v.soLuong > 0).length,
      variantsData: variants,
      isPreview: false,
      onConfirm: handleConfirm,
    });
  };

  const handleReset = () => {
    setVariants([]);
    setSelectedRowKeys([]);
    setEditingKey("");
    setValidationErrors({});
    onResetCallback?.();
    message.info("Đã làm mới danh sách biến thể");
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: setSelectedRowKeys,
    type: "checkbox",
  };

  const renderEditableCell = (record, dataIndex, component, rules = []) => {
    const editable = isEditing(record);
    return editable ? (
      <Form.Item name={dataIndex} style={{ margin: 0 }} rules={rules}>
        {component}
      </Form.Item>
    ) : (
      component
    );
  };

  const ValidationSummary = () => {
    if (Object.keys(validationErrors).length === 0) return null;

    const priceErrors = Object.values(validationErrors).filter((error) =>
      error.includes("đơn giá")
    ).length;

    const quantityErrors = Object.values(validationErrors).filter((error) =>
      error.includes("số lượng")
    ).length;

    return (
      <div className="validation-summary">
        <div className="validation-stats">
          {priceErrors > 0 && (
            <div className="validation-stat-item">
              <span className="error-count">{priceErrors}</span>
              <span>biến thể thiếu đơn giá</span>
            </div>
          )}
          {quantityErrors > 0 && (
            <div className="validation-stat-item">
              <span className="error-count">{quantityErrors}</span>
              <span>biến thể thiếu số lượng</span>
            </div>
          )}
        </div>
        <div className="validation-errors-list">
          {Object.entries(validationErrors)
            .slice(0, 3)
            .map(([key, message]) => (
              <div key={key} className="validation-error-item">
                • {message}
              </div>
            ))}
          {Object.keys(validationErrors).length > 3 && (
            <div className="validation-more">
              ...và {Object.keys(validationErrors).length - 3} lỗi khác
            </div>
          )}
        </div>
      </div>
    );
  };

  const ErrorIndicator = ({ record, field }) => {
    const errorKey = `${field}_${record.key}`;
    const hasError = validationErrors[errorKey];

    if (!hasError) return null;

    return (
      <Tooltip title={validationErrors[errorKey]} placement="top">
        <WarningOutlined
          style={{
            color: "#ff4d4f",
            marginLeft: "4px",
            fontSize: "12px",
          }}
        />
      </Tooltip>
    );
  };

  const columns = [
    {
      title: "STT",
      key: "stt",
      render: (_, __, index) => (
        <div className="flex items-center justify-center">
          <span className="text-gray-600">
            {String(index + 1).padStart(2, "0")}
          </span>
        </div>
      ),
      width: 60,
      align: "center",
    },
    {
      title: "ẢNH",
      key: "image",
      width: 120,
      align: "center",
      render: (_, record) => (
        <div className="flex flex-col gap-2 items-center">
          {record.imageUrl ? (
            <>
              <Image
                src={record.imageUrl}
                width={80}
                height={80}
                style={{
                  objectFit: "cover",
                  borderRadius: 4,
                  border: "1px solid #d9d9d9",
                }}
                preview={{
                  mask: <EyeOutlined />,
                }}
              />
              <Popconfirm
                title="Xác nhận xóa ảnh"
                description="Bạn có chắc muốn xóa ảnh này?"
                onConfirm={() => handleDeleteImage(record.key)}
                okText="Có"
                cancelText="Không"
              >
                <Button danger size="small" type="text">
                  Xóa ảnh
                </Button>
              </Popconfirm>
            </>
          ) : (
            <CloudinaryUpload
              onUploadSuccess={(img) =>
                handleUploadImageForVariant(record.key, img)
              }
              maxFiles={1}
            />
          )}
        </div>
      ),
    },
    {
      title: "TÊN SẢN PHẨM",
      dataIndex: "tenSanPham",
      key: "tenSanPham",
      width: 200,
      render: (text) => (
        <span className="font-medium text-gray-900">{text}</span>
      ),
    },
    {
      title: "MÀU SẮC",
      dataIndex: "tenMauSac",
      key: "tenMauSac",
      align: "center",
      width: 100,
      render: (text) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: "KÍCH THƯỚC",
      dataIndex: "tenKichThuoc",
      key: "tenKichThuoc",
      align: "center",
      width: 100,
      render: (text) => <span className="text-gray-700">{text}</span>,
    },
    {
      title: "CỔ ÁO",
      dataIndex: "tenCoAo",
      key: "tenCoAo",
      align: "center",
      width: 100,
      render: (text) => <span className="text-gray-700">{text}</span>,
    },
    {
      title: "TAY ÁO",
      dataIndex: "tenTayAo",
      key: "tenTayAo",
      align: "center",
      width: 100,
      render: (text) => <span className="text-gray-700">{text}</span>,
    },
    {
      title: "SỐ LƯỢNG",
      dataIndex: "soLuong",
      key: "soLuong",
      align: "center",
      width: 120,
      render: (_, record) => {
        const errorKey = `quantity_${record.key}`;
        const hasError = validationErrors[errorKey];

        return (
          <div
            className={`cell-container ${hasError ? "error-cell" : ""}`}
            data-variant-key={record.key}
          >
            {renderEditableCell(
              record,
              "soLuong",
              <div className="input-with-validation">
                <InputNumber
                  min={0}
                  value={record.soLuong}
                  onChange={(value) => {
                    handleQuickQuantityChange(record.key, value);
                  }}
                  style={{
                    width: 80,
                    borderColor: hasError ? "#ff4d4f" : undefined,
                  }}
                  status={hasError ? "error" : ""}
                />
                <ErrorIndicator record={record} field="quantity" />
              </div>,
              [{ required: true, message: "Vui lòng nhập số lượng" }]
            )}
          </div>
        );
      },
    },
    {
      title: "ĐƠN GIÁ",
      dataIndex: "donGia",
      key: "donGia",
      align: "center",
      width: 150,
      render: (_, record) => {
        const errorKey = `price_${record.key}`;
        const hasError = validationErrors[errorKey];

        return (
          <div
            className={`cell-container ${hasError ? "error-cell" : ""}`}
            data-variant-key={record.key}
          >
            {renderEditableCell(
              record,
              "donGia",
              <div className="input-with-validation">
                <InputNumber
                  min={0}
                  value={record.donGia}
                  onChange={(value) => {
                    handleQuickPriceChange(record.key, value);
                  }}
                  formatter={(value) =>
                    `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                  }
                  parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
                  addonAfter="₫"
                  style={{
                    width: 130,
                    borderColor: hasError ? "#ff4d4f" : undefined,
                  }}
                  status={hasError ? "error" : ""}
                />
                <ErrorIndicator record={record} field="price" />
              </div>,
              [{ required: true, message: "Vui lòng nhập đơn giá" }]
            )}
          </div>
        );
      },
    },
    {
      title: "MÔ TẢ",
      dataIndex: "moTa",
      key: "moTa",
      width: 150,
      render: (_, record) =>
        renderEditableCell(
          record,
          "moTa",
          isEditing(record) ? (
            <Input placeholder="Mô tả" />
          ) : (
            <span className="text-gray-600">
              {record.moTa || "Chưa có mô tả"}
            </span>
          )
        ),
    },
    {
      title: "HÀNH ĐỘNG",
      key: "action",
      align: "center",
      width: 150,
      render: (_, record) => {
        const editable = isEditing(record);
        return editable ? (
          <Space size="small">
            <Button
              type="link"
              size="small"
              onClick={() => handleSave(record.key)}
              icon={<SaveOutlined />}
              className="text-green-500"
            >
              Lưu
            </Button>
            <Button
              type="link"
              size="small"
              danger
              onClick={handleCancel}
              icon={<CloseOutlined />}
            >
              Hủy
            </Button>
          </Space>
        ) : (
          <Space size="small">
            <Button
              type="link"
              size="small"
              onClick={() => handleEdit(record)}
              icon={<EditOutlined />}
              disabled={editingKey !== ""}
              className="text-green-500"
            >
              Sửa
            </Button>
            <Popconfirm
              title="Xác nhận xóa"
              description="Bạn có chắc muốn xóa biến thể này?"
              onConfirm={() => handleDelete(record)}
              okText="Có"
              cancelText="Không"
            >
              <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                Xóa
              </Button>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow mb-6 overflow-hidden">
      <div className="bg-[#E67E22] text-white px-6 py-3 flex justify-between items-center">
        <div className="font-bold text-2xl text-white">
          Chi tiết biến thể ({variants.length} biến thể)
        </div>
        <div className="flex gap-3">
          {selectedRowKeys.length > 0 && (
            <>
              <button
                onClick={() => setQuickInputModal(true)}
                className="border border-white text-white rounded px-4 py-1.5 cursor-pointer hover:bg-white hover:text-[#E67E22] transition-colors font-medium text-sm"
              >
                Nhập nhanh ({selectedRowKeys.length})
              </button>
              <Popconfirm
                title="Xác nhận xóa"
                description={`Bạn có chắc muốn xóa ${selectedRowKeys.length} biến thể đã chọn?`}
                onConfirm={handleDeleteMultiple}
                okText="Có"
                cancelText="Không"
              >
                <button className="border border-white text-white rounded px-4 py-1.5 cursor-pointer hover:bg-white hover:text-[#E67E22] transition-colors font-medium text-sm">
                  Xóa đã chọn ({selectedRowKeys.length})
                </button>
              </Popconfirm>
            </>
          )}
        </div>
      </div>

      <div className="p-6">
        <ValidationSummary />

        <Form form={form} component={false}>
          <Table
            components={{
              body: {
                cell: (props) => (
                  <td {...props} className="ant-table-cell">
                    {props.children}
                  </td>
                ),
              },
            }}
            rowSelection={rowSelection}
            columns={columns}
            dataSource={variants}
            rowKey="key"
            bordered
            pagination={{
              pageSize: 5,
              showSizeChanger: true,
              pageSizeOptions: ["5", "10", "20"],
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} của ${total} biến thể`,
            }}
            scroll={{ x: 1800 }}
            locale={{
              emptyText:
                "Chưa có biến thể nào. Hãy tạo biến thể để hiển thị ở đây.",
            }}
          />
        </Form>

        <Modal
          open={previewOpen}
          footer={null}
          onCancel={() => setPreviewOpen(false)}
        >
          <img alt="preview" style={{ width: "100%" }} src={previewImage} />
        </Modal>

        <Modal
          title={
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "20px" }}>⚡</span>
              <span style={{ fontSize: "18px", fontWeight: "bold" }}>
                NHẬP NHANH GIÁ & SỐ LƯỢNG
              </span>
            </div>
          }
          open={quickInputModal}
          onCancel={() => {
            setQuickInputModal(false);
            quickInputForm.resetFields();
          }}
          onOk={() => quickInputForm.submit()}
          okText="Áp dụng"
          cancelText="Hủy"
          width={500}
          centered
        >
          <div
            style={{
              background: "#fff7e6",
              border: "1px solid #ffd591",
              padding: "12px",
              borderRadius: "8px",
              marginBottom: "20px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "8px",
              }}
            >
              <span style={{ fontWeight: "bold", color: "#d46b08" }}>
                Thông tin
              </span>
            </div>
            <p style={{ margin: 0, color: "#8c8c8c", fontSize: "13px" }}>
              Giá trị sẽ được áp dụng cho{" "}
              <strong>{selectedRowKeys.length}</strong> biến thể đã chọn.
              <br />
              <strong>Để trống nếu không muốn thay đổi trường đó.</strong>
            </p>
          </div>

          <Form
            form={quickInputForm}
            onFinish={handleQuickInputAll}
            layout="vertical"
            initialValues={{
              soLuong: undefined,
              donGia: undefined,
            }}
          >
            <Form.Item
              name="soLuong"
              label={<span style={{ fontWeight: "bold" }}>Số lượng</span>}
            >
              <InputNumber
                min={0}
                placeholder="Nhập số lượng cho tất cả"
                style={{ width: "100%" }}
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="donGia"
              label={<span style={{ fontWeight: "bold" }}>Đơn giá</span>}
            >
              <InputNumber
                min={0}
                placeholder="Nhập đơn giá cho tất cả"
                formatter={(value) => {
                  if (value === undefined || value === null || value === "") {
                    return "";
                  }
                  return `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                }}
                parser={(value) => {
                  if (!value || value === "") {
                    return undefined;
                  }
                  const parsed = value.replace(/\$\s?|(,*)/g, "");
                  const num = Number(parsed);
                  return isNaN(num) ? undefined : num;
                }}
                addonAfter="₫"
                style={{ width: "100%" }}
                size="large"
              />
            </Form.Item>
          </Form>
        </Modal>

        <div className="flex justify-end gap-3 mt-6">
          <div
            onClick={handleReset}
            className="border  text-white rounded-md px-6 py-2 cursor-pointer bg-gray-400 font-bold hover:bg-amber-700 active:bg-cyan-800 select-none"
          >
            Nhập lại
          </div>
          <div
            onClick={handleTaoSanPham}
            disabled={variants.length === 0 || loading}
            className={`bg-[#E67E22] text-white rounded-md px-6 py-2 cursor-pointer font-bold hover:bg-amber-700 active:bg-cyan-800 select-none ${
              Object.keys(validationErrors).length > 0
                ? "opacity-50 cursor-not-allowed"
                : ""
            }`}
          >
            {loading ? "⏳ Đang tạo..." : `Tạo sản phẩm (${variants.length})`}
          </div>
        </div>
      </div>

      <Modal
        open={previewOpen}
        footer={null}
        onCancel={() => setPreviewOpen(false)}
      >
        <img alt="preview" style={{ width: "100%" }} src={previewImage} />
      </Modal>
    </div>
  );
}
