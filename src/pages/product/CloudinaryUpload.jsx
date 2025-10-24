import React, { useState } from 'react';
import { Upload, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';

const CloudinaryUpload = ({ onUploadSuccess, maxFiles = 8 }) => {
  const [uploadedImages, setUploadedImages] = useState([]);
  const [loading, setLoading] = useState(false);

  const CLOUD_NAME = 'dyg1zkr10'; 
  const UPLOAD_PRESET = 'yaemiko-upload'; 

  const handleUpload = async (file) => {
    setLoading(true);
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);
    
    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );
      
      const data = await response.json();
      
      if (data.secure_url) {
        const newImage = {
          uid: data.public_id,
          name: data.original_filename,
          status: 'done',
          url: data.secure_url,
          thumbUrl: data.secure_url,
          public_id: data.public_id,
          size: data.bytes,
          type: data.format
        };
        
        setUploadedImages(prev => [...prev, newImage]);
        onUploadSuccess?.(newImage);
        message.success(`Upload ảnh "${data.original_filename}" thành công!`);
      } else {
        throw new Error(data.error?.message || 'Upload failed');
      }
    } catch (error) {
      console.error('💥 Upload error:', error);
      message.error(`Upload ảnh thất bại: ${error.message}`);
    } finally {
      setLoading(false);
    }
    
    return false; 
  };

  const handleRemove = async (file) => {
    try {
      setUploadedImages(prev => prev.filter(img => img.uid !== file.uid));
      message.success('Đã xóa ảnh!');
      
    } catch (error) {
      message.error('Lỗi khi xóa ảnh!');
    }
  };

  return (
    <div>
      <Upload
        customRequest={({ file }) => handleUpload(file)}
        fileList={uploadedImages}
        onRemove={handleRemove}
        listType="picture-card"
        accept="image/*"
        multiple
        disabled={loading}
      >
        {uploadedImages.length >= maxFiles ? null : (
          <div>
            {loading ? '⏳ Uploading...' : <UploadOutlined />}
            <div style={{ marginTop: 8 }}>
              {loading ? 'Đang tải...' : 'Upload'}
            </div>
          </div>
        )}
      </Upload>
      
      <div style={{ marginTop: 8, fontSize: '12px', color: '#666' }}>
        📸 Tối đa {maxFiles} ảnh • PNG, JPG, JPEG
      </div>
    </div>
  );
};

export default CloudinaryUpload;