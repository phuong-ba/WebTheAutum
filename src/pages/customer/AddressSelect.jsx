import React, { useEffect, useState } from "react";
import { Form, Select, Input, Row, Col } from "antd";
import { diaChiApi } from "/src/api/diaChiApi";

export default function AddressSelect({ form, editingAddress, setQuanList }) {
  const [tinhList, setTinhList] = useState([]);
  const [localQuanList, setLocalQuanList] = useState([]); // danh sách quận riêng cho component

  // 🟢 Load danh sách tỉnh/thành khi mount
  useEffect(() => {
    diaChiApi.getAllTinhThanh().then(setTinhList).catch(console.error);
  }, []);

  // 🟢 Load quận khi đang edit
  useEffect(() => {
    if (editingAddress?.thanhPho) {
      diaChiApi
        .getQuanByTinh(editingAddress.thanhPho)
        .then((res) => {
          setLocalQuanList(res);
          if (setQuanList) setQuanList(res); // đồng bộ ra CustomerForm
        })
        .catch(console.error);
    } else {
      setLocalQuanList([]);
      if (setQuanList) setQuanList([]);
    }
  }, [editingAddress, setQuanList]);

  // 🟢 Khi edit địa chỉ -> fill vào form
  useEffect(() => {
    if (editingAddress) {
      form.setFieldsValue({
        tenDiaChi: editingAddress.tenDiaChi,
        thanhPho: editingAddress.thanhPho,
        quan: editingAddress.quan,
        diaChiCuThe: editingAddress.diaChiCuThe,
      });
    } else {
      form.resetFields(["tenDiaChi", "thanhPho", "quan", "diaChiCuThe"]);
    }
  }, [editingAddress, form]);

  // 🟢 Khi thay đổi tỉnh/thành
  const handleTinhChange = async (idTinh) => {
    form.setFieldsValue({ quan: null }); // reset quận
    try {
      const res = await diaChiApi.getQuanByTinh(idTinh);
      setLocalQuanList(res); // cập nhật local quận
      if (setQuanList) setQuanList(res); // đồng bộ ra CustomerForm
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Row gutter={16}>
      <Col span={8}>
        <Form.Item
          name="tenDiaChi"
          label="Loại địa chỉ"
          rules={[{ required: true, message: "Nhập loại địa chỉ!" }]}
        >
          <Input placeholder="Ví dụ: Nhà riêng, Công ty..." />
        </Form.Item>
      </Col>

      <Col span={8}>
        <Form.Item
          name="thanhPho"
          label="Tỉnh/Thành phố"
          rules={[{ required: true, message: "Chọn tỉnh/thành!" }]}
        >
          <Select
            placeholder="Chọn tỉnh/thành"
            onChange={handleTinhChange}
            allowClear
          >
            {tinhList.map((t) => (
              <Select.Option key={t.id} value={t.id}>
                {t.tenTinh}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
      </Col>

      <Col span={8}>
        <Form.Item
          name="quan"
          label="Quận/Huyện"
          rules={[{ required: true, message: "Chọn quận/huyện!" }]}
        >
          <Select placeholder="Chọn quận/huyện" allowClear>
            {localQuanList.map((q) => (
              <Select.Option key={q.id} value={q.id}>
                {q.tenQuan}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
      </Col>

      <Col span={24}>
        <Form.Item
          name="diaChiCuThe"
          label="Địa chỉ cụ thể"
          rules={[{ required: true, message: "Nhập địa chỉ cụ thể!" }]}
        >
          <Input.TextArea rows={2} placeholder="Địa chỉ cụ thể" />
        </Form.Item>
      </Col>
    </Row>
  );
}
