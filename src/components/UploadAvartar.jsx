import React, { useEffect, useState } from "react";
import { Upload, message } from "antd";
import { LoadingOutlined, PlusOutlined } from "@ant-design/icons";

export default function UploadAvartar({ imageUrl: initialImage, onUploaded }) {
  const [imageUrl, setImageUrl] = useState(initialImage || null);
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    setImageUrl(initialImage || null);
  }, [initialImage]);

  const beforeUpload = async (file) => {
    const isImage = file.type === "image/jpeg" || file.type === "image/png";
    if (!isImage) {
      messageApi.error("Chỉ được tải lên file JPG/PNG!");
      return Upload.LIST_IGNORE;
    }

    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      messageApi.error("Ảnh phải nhỏ hơn 2MB!");
      return Upload.LIST_IGNORE;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "datn_fe");

      const response = await fetch(
        "https://api.cloudinary.com/v1_1/dtwxhfutf/image/upload",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (data.secure_url) {
        setImageUrl(data.secure_url);
        onUploaded?.(data.secure_url);
        messageApi.success("Tải ảnh thành công!");
      } else {
        messageApi.error("Upload thất bại!");
      }
    } catch (err) {
      console.error("Upload error:", err);
      messageApi.error("Upload ảnh thất bại!");
    } finally {
      setLoading(false);
    }

    return false;
  };

  const uploadButton = (
    <button style={{ border: 0, background: "none" }} type="button">
      {loading ? <LoadingOutlined /> : <PlusOutlined />}
      <div style={{ marginTop: 8 }}>Upload</div>
    </button>
  );

  return (
    <>
      {contextHolder}
      <div className="user flex justify-center py-4">
        <Upload
          listType="picture-circle"
          showUploadList={false}
          beforeUpload={beforeUpload}
        >
          {imageUrl ? (
            <img
              className="w-[240px] h-[240px] border rounded-full object-cover"
              src={imageUrl}
              alt="avatar"
            />
          ) : (
            uploadButton
          )}
        </Upload>
      </div>
    </>
  );
}
