import { LoadingOutlined, PlusOutlined } from "@ant-design/icons";
import { Upload } from "antd";
import React, { useState } from "react";

const getBase64 = (img, callback) => {
  const reader = new FileReader();
  reader.addEventListener("load", () => callback(reader.result));
  reader.readAsDataURL(img);
};

const beforeUpload = (file) => {
  const isJpgOrPng = file.type === "image/jpeg" || file.type === "image/png";
  if (!isJpgOrPng) message.error("Chỉ được tải lên file JPG/PNG!");
  const isLt2M = file.size / 1024 / 1024 < 2;
  if (!isLt2M) message.error("Ảnh phải nhỏ hơn 2MB!");
  return isJpgOrPng && isLt2M;
};
export default function UploadAvartar() {
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState();
  const uploadButton = (
    <button style={{ border: 0, background: "none" }} type="button">
      {loading ? <LoadingOutlined /> : <PlusOutlined />}
      <div style={{ marginTop: 8 }}>Upload</div>
    </button>
  );
  const handleChange = (info) => {
    if (info.file.status === "uploading") {
      setLoading(true);
      return;
    }
    if (info.file.status === "done") {
      getBase64(info.file.originFileObj, (url) => {
        setLoading(false);
        setImageUrl(url);
      });
    }
  };

  return (
    <>
      <div className="user flex justify-center py-4">
        <Upload
          name="avatar"
          listType="picture-circle"
          className="avatar-uploader"
          showUploadList={false}
          action="https://660d2bd96ddfa2943b33731c.mockapi.io/api/upload"
          beforeUpload={beforeUpload}
          onChange={handleChange}
        >
          {imageUrl ? (
            <img
              draggable={false}
              src={imageUrl}
              alt="avatar"
              style={{ width: "100%" }}
            />
          ) : (
            uploadButton
          )}
        </Upload>
      </div>
    </>
  );
}
