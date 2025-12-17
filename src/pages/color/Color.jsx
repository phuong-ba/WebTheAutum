import React, { useEffect, useRef, useState } from "react";
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
} from "antd";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchMauSac,
  addMauSac, // Action thêm màu sắc
} from "@/services/mauSacService";
import { useNavigate } from "react-router";
import { PencilLineIcon, ToggleLeftIcon, ToggleRightIcon } from "@phosphor-icons/react";

import ColorBreadcrumb from "./ColorBreadcrumb";
import { ExclamationCircleFilled } from "@ant-design/icons";
import FliterColor from "./FliterColor";

export default function Color() {
  const dispatch = useDispatch();
  const { data } = useSelector((state) => state.mausac);
  const navigate = useNavigate();
  const [messageApi, messageContextHolder] = message.useMessage();
  const fileInputRef = useRef(null);

  // Modal thay đổi trạng thái
  const [isStatusModalVisible, setIsStatusModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  // Modal thêm nhanh màu sắc
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [addForm] = Form.useForm();

  useEffect(() => {
    dispatch(fetchMauSac());
  }, [dispatch]);

  // === Xử lý thay đổi trạng thái (khóa/mở khóa) ===
  const showStatusModal = (record) => {
    setSelectedRecord(record);
    setIsStatusModalVisible(true);
  };

  const handleConfirmStatusChange = async () => {
    if (!selectedRecord) return;

    // Giả sử bạn có action changeStatusMauSac, nếu chưa có thì cần tạo
    // Hiện tại code gốc dùng changeStatusNhanVien → cần thay bằng action phù hợp
    // Tạm thời để comment để bạn thêm sau
    /*
    try {
      await dispatch(changeStatusMauSac({
        id: selectedRecord.id,
        trangThai: !selectedRecord.trangThai,
      }));
      messageApi.success(
        selectedRecord.trangThai
          ? "Khóa màu sắc thành công!"
          : "Mở khóa màu sắc thành công!"
      );
      dispatch(fetchMauSac());
    } catch (error) {
      messageApi.error("Thao tác thất bại!");
    }
    */

    setIsStatusModalVisible(false);
    setSelectedRecord(null);
  };
  const generateMaMauSac = () => {
    const count = data.length + 1;
    return `MS${count.toString().padStart(3, "0")}`;
  };
  // === Xử lý thêm nhanh màu sắc ===
  const showAddModal = () => {
    addForm.resetFields();
    setIsAddModalVisible(true);
  };

  const handleAddMauSac = async () => {
    try {
      const values = await addForm.validateFields();

      let maHex = "";

      // Xử lý trường hợp vẫn còn object (an toàn tuyệt đối)
      if (typeof values.maHex === "object" && values.maHex?.toHexString) {
        maHex = values.maHex.toHexString().toUpperCase();
      } else if (typeof values.maHex === "string") {
        maHex = values.maHex.toUpperCase();
      }

      const tenMauSac = values.tenMauSac?.trim();

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

      messageApi.success("Thêm màu sắc thành công!");
      setIsAddModalVisible(false);
      addForm.resetFields();
      dispatch(fetchMauSac());
    } catch (error) {
      if (error.errorFields) return;
      messageApi.error(error?.message || "Thêm màu sắc thất bại!");
    }
  };
  // === Cột bảng ===
  const columns = [
    {
      title: "STT",
      key: "stt",
      render: (_, __, index) => index + 1,
      width: 60,
      align: "center",
    },
    { title: "MÃ MÀU SẮC", dataIndex: "maMauSac", key: "maMauSac" },
    {
      title: "MÃ HEX",
      dataIndex: "maHex",
      key: "maHex",
      render: (hex) => (hex ? hex.toUpperCase() : ""),
    },
    { title: "TÊN MÀU SẮC", dataIndex: "tenMauSac", key: "tenMauSac" },
    {
      title: "TRẠNG THÁI",
      dataIndex: "trangThai",
      key: "trangThai",
      align: "center",
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
      render: (_, record) => (
        <Space size="middle">
          <a onClick={() => showStatusModal(record)}>
            {record.trangThai ? (
              <ToggleRightIcon weight="fill" size={30} color="#00A96C" />
            ) : (
              <ToggleLeftIcon weight="fill" size={30} color="#c5c5c5" />
            )}
          </a>
          <a onClick={() => navigate(`/admin/update-color/${record.id}`)}>
            <PencilLineIcon size={24} weight="fill" color="#E67E22" />
          </a>
        </Space>
      ),
    },
  ];

  return (
    <>
      {messageContextHolder}

      <div className="p-6 flex flex-col gap-10">
        {/* Header */}
        <div className="bg-white flex flex-col gap-3 px-4 py-[20px] rounded-lg shadow overflow-hidden">
          <div className="font-bold text-4xl text-[#E67E22]">
            Quản lý màu sắc
          </div>
          <ColorBreadcrumb />
        </div>

        <FliterColor
          fileInputRef={fileInputRef}
          data={data}
          navigate={navigate}
          showAddModal={showAddModal}
        />

        <div className="bg-white min-h-[500px] rounded-lg shadow overflow-hidden">
          <div className="flex justify-between items-center bg-[#E67E22] px-6 py-3 rounded-tl-lg rounded-tr-lg">
            <div className="text-white font-bold text-2xl">Danh sách màu</div>
          </div>
          <Table
            columns={columns}
            dataSource={data}
            rowKey="id"
            bordered
            pagination={{ pageSize: 10 }}
            locale={{ emptyText: "Không có dữ liệu" }}
          />
        </div>

        <Modal
          open={isStatusModalVisible}
          onCancel={() => setIsStatusModalVisible(false)}
          footer={null}
          centered
          closable={false}
        >
          <div className="flex flex-col items-center gap-4 p-4">
            <ExclamationCircleFilled
              style={{ fontSize: 64, color: "#faad14" }}
            />
            <h2 className="text-xl font-bold text-center">
              {selectedRecord?.trangThai
                ? "Xác nhận khóa màu sắc"
                : "Xác nhận mở khóa màu sắc"}
            </h2>
            <p className="text-gray-600 text-center">
              Bạn có chắc muốn{" "}
              <span className="font-semibold">
                {selectedRecord?.trangThai ? "khóa" : "mở khóa"}
              </span>{" "}
              màu sắc "<strong>{selectedRecord?.tenMauSac}</strong>" không?
            </p>

            <div className="flex justify-center gap-6 mt-6 w-full">
              <Button
                size="large"
                className="w-40"
                onClick={() => setIsStatusModalVisible(false)}
              >
                Hủy
              </Button>
              <Button
                type={selectedRecord?.trangThai ? "primary" : "default"}
                danger={selectedRecord?.trangThai}
                size="large"
                className="w-40"
                onClick={handleConfirmStatusChange}
              >
                {selectedRecord?.trangThai ? "Khóa" : "Mở khóa"}
              </Button>
            </div>
          </div>
        </Modal>

        <Modal
          title={<span className="text-xl font-bold">Thêm màu sắc mới</span>}
          open={isAddModalVisible}
          onCancel={() => setIsAddModalVisible(false)}
          footer={null}
          width={520}
          destroyOnClose
        >
          <Form form={addForm} layout="vertical" className="mt-6">
            <Form.Item
              name="maHex"
              label="Mã HEX"
              rules={[{ required: true, message: "Vui lòng chọn màu sắc!" }]}
              getValueFromEvent={(color) => {
                // Chuyển object màu thành string HEX có dấu #
                if (color && typeof color === "object" && color.toHexString) {
                  return color.toHexString(); // trả về "#ff0000"
                }
                return color; // fallback
              }}
              normalize={(value) => {
                // Đảm bảo luôn là string uppercase khi hiển thị trong form
                return typeof value === "string" ? value.toUpperCase() : value;
              }}
            >
              <ColorPicker
                format="hex"
                showText={(color) =>
                  color?.toHexString ? color.toHexString().toUpperCase() : ""
                }
                size="large"
                allowClear={false}
              />
            </Form.Item>

            <Form.Item
              name="tenMauSac"
              label="Tên màu sắc"
              rules={[
                { required: true, message: "Vui lòng nhập tên màu sắc!" },
              ]}
            >
              <Input placeholder="VD: Đỏ tươi" />
            </Form.Item>

            <div className="flex justify-end gap-4 mt-8">
              <Button onClick={() => setIsAddModalVisible(false)}>Hủy</Button>
              <Button type="primary" onClick={handleAddMauSac}>
                Thêm mới
              </Button>
            </div>
          </Form>
        </Modal>
      </div>
    </>
  );
}
