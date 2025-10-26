import React, { useState } from "react";
import axios from "axios";

export default function UploadImage() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [url, setUrl] = useState("");

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
  };

  const handleUpload = async () => {
    if (!file) return alert("Chưa chọn file!");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post("http://localhost:8080/api/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setUrl(res.data);
      alert("Upload thành công!");
    } catch (err) {
      console.error(err);
      alert("Upload thất bại!");
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: "40px" }}>
      <h2>Upload hình ảnh lên Cloudinary</h2>
      <input type="file" accept="image/*" onChange={handleFileChange} />
      <br /><br />
      {preview && <img src={preview} alt="preview" width="250" />}
      <br /><br />
      <button onClick={handleUpload}>Tải lên</button>

      {url && (
        <>
          <h4>Ảnh đã upload:</h4>
          <img src={url} alt="uploaded" width="300" />
          <p>{url}</p>
        </>
      )}
    </div>
  );
}
