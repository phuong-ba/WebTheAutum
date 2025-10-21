import React, { useEffect, useState } from "react";
import { Space, Table, Tag, message, Modal, Image, Upload } from "antd";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router";
import { PlusOutlined } from "@ant-design/icons";
export default function ProductDetail() {
  const { data } = useSelector((state) => state.nhanvien);
  const [editingUser, setEditingUser] = useState(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState("");
  const navigate = useNavigate();
  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys) => {
      setSelectedRowKeys(newSelectedRowKeys);
    },
    type: "checkbox", // chọn nhiều
  };
  const getBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  const [fileList, setFileList] = useState([
    {
      uid: "-1",
      name: "image.png",
      status: "done",
      url: "https://zos.alipayobjects.com/rmsportal/jkjgkEfvpUPVyRjUImniVslZfWPnJuuZ.png",
    },
  ]);
  const columns = [
    {
      title: "STT",
      key: "stt",
      render: (_, __, index) => index + 1,
      width: 60,
      align: "center",
    },
    { title: "TÊN SẢN PHẨM", dataIndex: "maNhanVien", key: "maNhanVien" },
    { title: "HÃNG", dataIndex: "hoTen", key: "hoTen" },
    {
      title: "XUẤT XỨ",
      dataIndex: "gioiTinh",
      key: "gioiTinh",
      render: (value) => (value ? "Nam" : "Nữ"),
      align: "center",
    },
    { title: "CHẤT LIỆU", dataIndex: "sdt", key: "sdt" },
    { title: "KIỂU DÁNG", dataIndex: "diaChi", key: "diaChi" },
    { title: "SỐ LƯỢNG", dataIndex: "chucVuName", key: "chucVuName" },
    { title: "ĐƠN GIÁ", dataIndex: "email", key: "email" },
    {
      title: "NGÀY BẮT ĐẦU",
      dataIndex: "ngayTao",
      key: "ngayTao",
      render: (date) =>
        new Date(date).toLocaleDateString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }),
      align: "center",
    },
    {
      title: "TRẠNG THÁI",
      dataIndex: "trangThai",
      key: "trangThai",
      render: (value) =>
        value ? (
          <Tag color="#E9FBF4">
            <div className="text-[#00A96C] ">Đang hoạt động</div>
          </Tag>
        ) : (
          <Tag color="red">Ngừng hoạt động</Tag>
        ),
      align: "center",
    },
    {
      title: "HÀNH ĐỘNG",
      key: "action",
      align: "center",
      render: (_, record) => (
        <Space size="middle">
          <a onClick={() => setEditingUser(record)}>Sửa</a>
          <a onClick={() => handleDelete(record)}>Xóa</a>
        </Space>
      ),
    },
  ];
  const handlePreview = async (file) => {
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj);
    }
    setPreviewImage(file.url || file.preview);
    setPreviewOpen(true);
  };
  const handleChange = ({ fileList: newFileList }) => setFileList(newFileList);
  const uploadButton = (
    <button style={{ border: 0, background: "none" }} type="button">
      <PlusOutlined />
      <div style={{ marginTop: 8 }}>Upload</div>
    </button>
  );
  return (
    <>
      <div className="bg-white min-h-[500px] px-5 py-[32px]">
        <div className="flex justify-between items-center mb-5">
          <p className="text-[#E67E22] font-bold text-[18px] mb-4">
            Chi tiết biến thể
          </p>
        </div>
        <Table
          rowSelection={rowSelection}
          columns={columns}
          dataSource={data}
          rowKey="id"
          bordered
          pagination={{ pageSize: 5 }}
        />
        <div className="product-detail">
          <div className="border-b border-b-amber-400 my-5 pb-2">
            <p className="font-bold text-md text-[#E67E22]">
              Thông tin sản phẩm
            </p>
          </div>

          <Upload
            width={"240px"}
            action="https://660d2bd96ddfa2943b33731c.mockapi.io/api/upload"
            listType="picture-card"
            fileList={fileList}
            onPreview={handlePreview}
            onChange={handleChange}
          >
            {fileList.length >= 8 ? null : uploadButton}
          </Upload>
          {previewImage && (
            <Image
              wrapperStyle={{ display: "none" }}
              preview={{
                visible: previewOpen,
                onVisibleChange: (visible) => setPreviewOpen(visible),
                afterOpenChange: (visible) => !visible && setPreviewImage(""),
              }}
              src={previewImage}
            />
          )}
        </div>
        <div className="flex flex-col items-end  pr-3 gap-4">
          <div className="flex gap-4">
            <button className="border border-[#E67E22] font-[Roboto] text-[#E67E22] rounded px-6 h-8 cursor-pointer active:bg-[#E67E22] active:text-white">
              Nhập lại
            </button>
            <button
              className=" bg-[#E67E22]  font-[Roboto] text-white rounded px-6  cursor-pointer h-8 active:bg-[#0821ad] active:text-white"
              type="submit"
            >
              Tạo biến thể
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
