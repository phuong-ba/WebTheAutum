import React, { useEffect, useState } from "react";
import {
  Form,
  Input,
  Row,
  Col,
  message,
  DatePicker,
  Modal,
  Select,
} from "antd";
import { useDispatch } from "react-redux";
import { useNavigate, useLocation } from "react-router";
import dayjs from "dayjs";
import {
  addDotGiamGia,
  updateDotGiamGia,
  getSanPhamTheoDot,
} from "@/services/dotGiamGiaService";
import TableSanPham from "./TableSanPham";
import TableChiTietSanPham from "./TableChiTietSanPham";
import PromoBreadcrumb from "./PromoBreadcrumb";

const { Option } = Select;

export default function AddPromo() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [modal, modalContextHolder] = Modal.useModal();

  const editingItem = location.state?.dotGiamGia || null;
  const [selectedSanPhamKeys, setSelectedSanPhamKeys] = useState([]);
  const [selectedChiTietKeys, setSelectedChiTietKeys] = useState({});
  const [chiTietSanPhamData, setChiTietSanPhamData] = useState({});
  const [loaiGiamGia, setLoaiGiamGia] = useState(
    form.getFieldValue("loaiGiamGia") || "Tiền mặt"
  );
  const [giaTriGiamState, setGiaTriGiamState] = useState(
    form.getFieldValue("giaTriGiam") || 0
  );
  const [giaTriToiThieuState, setGiaTriToiThieuState] = useState(
    form.getFieldValue("giaTriToiThieu") || 0
  );

  const now = dayjs();

  useEffect(() => {
    form.setFieldsValue({
      giaTriToiThieu: loaiGiamGia === "Tiền mặt" ? giaTriGiamState : 0,
    });
    setGiaTriToiThieuState(loaiGiamGia === "Tiền mặt" ? giaTriGiamState : 0);
  }, [loaiGiamGia, giaTriGiamState]);

  useEffect(() => {
    if (loaiGiamGia === "Tiền mặt") {
      form.setFieldsValue({ giaTriToiThieu: giaTriGiamState });
      setGiaTriToiThieuState(giaTriGiamState);
    }
  }, [giaTriGiamState, loaiGiamGia]);

  console.log("🚀 ~ AddPromo ~ chiTietSanPhamData:", chiTietSanPhamData);
  useEffect(() => {
    if (loaiGiamGia === "Phần trăm") {
      let tongGiam = 0;
      Object.values(chiTietSanPhamData).forEach((chiTietArr) => {
        chiTietArr.forEach((item) => {
          tongGiam += item.giaBan * (giaTriGiamState / 100);
        });
      });

      // Nếu vượt quá 100, đặt về 0
      if (giaTriGiamState > 100) {
        tongGiam = 0;
      }

      form.setFieldsValue({ giaTriToiThieu: tongGiam });
      setGiaTriToiThieuState(tongGiam);
    } else {
      form.setFieldsValue({ giaTriToiThieu: giaTriGiamState });
      setGiaTriToiThieuState(giaTriGiamState);
    }
  }, [chiTietSanPhamData, giaTriGiamState, loaiGiamGia]);
  useEffect(() => {
    const fetchData = async () => {
      console.log("🚀 ~ fetchData ~ editingItem:", editingItem);
      if (editingItem) {
        try {
          const res = await dispatch(
            getSanPhamTheoDot(editingItem.id)
          ).unwrap();
          const sanPhamIds = res.data.map((sp) => sp.sanPhamId);
          console.log("🚀 ~ fetchData ~ sanPhamIds:", sanPhamIds);
          setSelectedSanPhamKeys(sanPhamIds);

          const chiTietMap = {};
          console.log("🚀 ~ fetchData ~ chiTietMap:", chiTietMap);
          res.data.forEach((sp) => {
            chiTietMap[sp.sanPhamId] = sp.chiTietIds;
          });
          setSelectedChiTietKeys(chiTietMap);

          // Fill form
          form.setFieldsValue({
            tenDot: editingItem.tenDot,
            ngayBatDau: dayjs(editingItem.ngayBatDau),
            ngayKetThuc: dayjs(editingItem.ngayKetThuc),
            loaiGiamGia: editingItem.loaiGiamGia ? "Tiền mặt" : "Phần trăm",
            giaTriGiam: editingItem.giaTriGiam,
            giaTriToiThieu: editingItem.giaTriToiThieu,
          });
        } catch (err) {
          console.error(err);
          messageApi.error(
            "Không thể tải danh sách chi tiết theo đợt giảm giá!"
          );
        }
      }
    };
    fetchData();
  }, [editingItem, dispatch]);

  const disabledDateBeforeToday = (current) =>
    current && current < now.startOf("day");
  const disabledEndDate = (current, startDate) => {
    if (!startDate) return current && current < now.startOf("day");
    return (
      current &&
      (current < startDate.startOf("day") || current < now.startOf("day"))
    );
  };

  const handleSanPhamSelectChange = (keys) => {
    setSelectedSanPhamKeys(keys);

    setSelectedChiTietKeys((prev) => {
      const newChiTiet = {};
      keys.forEach((id) => {
        if (prev[id]) newChiTiet[id] = prev[id];
      });
      return newChiTiet;
    });

    setChiTietSanPhamData((prev) => {
      const newData = {};
      keys.forEach((id) => {
        if (prev[id]) newData[id] = prev[id];
      });
      return newData;
    });
  };

  const handleSubmit = async (values) => {
    const start = dayjs(values.ngayBatDau);
    const end = dayjs(values.ngayKetThuc);
    const isUpdate = !!editingItem;
    let autoTrangThai = !end.isBefore(now, "day");

    const allChiTietIds = Object.values(selectedChiTietKeys).flat();
    if (allChiTietIds.length === 0) {
      messageApi.error("Vui lòng chọn ít nhất một chi tiết sản phẩm!");
      return;
    }

    const payload = {
      maGiamGia: values.maGiamGia,
      tenDot: values.tenDot,
      loaiGiamGia: values.loaiGiamGia === "Tiền mặt",
      giaTriGiam: Number(values.giaTriGiam ?? 0),
      giaTriToiThieu: Number(values.giaTriToiThieu ?? 0),
      ngayBatDau: values.ngayBatDau?.format("YYYY-MM-DD"),
      ngayKetThuc: values.ngayKetThuc?.format("YYYY-MM-DD"),
      trangThai: autoTrangThai,
      ctspIds: allChiTietIds,
      sanphamIds: selectedSanPhamKeys,
    };

    try {
      if (isUpdate) {
        await dispatch(
          updateDotGiamGia({ id: editingItem.id, dotGiamGia: payload })
        ).unwrap();
        messageApi.success("Cập nhật đợt giảm giá thành công!");
      } else {
        await dispatch(addDotGiamGia(payload)).unwrap();
        messageApi.success("✅ Thêm đợt giảm giá thành công!");
        form.resetFields();
        setSelectedSanPhamKeys([]);
        setSelectedChiTietKeys({});
      }
      setTimeout(() => navigate("/promo"), 800);
    } catch (err) {
      console.error(err);
      messageApi.error(isUpdate ? "Cập nhật thất bại!" : "Thêm thất bại!");
    }
  };

  const onFinish = (values) => {
    const action = editingItem ? "Cập nhật" : "Thêm";
    modal.confirm({
      title: `Xác nhận ${action}`,
      content: `Bạn có chắc muốn ${action.toLowerCase()} đợt giảm giá này không?`,
      okText: action,
      cancelText: "Hủy",
      async onOk() {
        await handleSubmit(values);
      },
    });
  };

  return (
    <>
      {contextHolder}
      {modalContextHolder}
      <div className="p-6 flex flex-col gap-12">
        <div className="bg-white flex flex-col gap-3 px-4 py-[20px] rounded-lg shadow overflow-hidden">
          <div className="font-bold text-4xl text-[#E67E22]">
            Quản lý đợt giảm giá
          </div>
          <PromoBreadcrumb />
        </div>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-3">
            <div className="font-bold text-2xl text-[#E67E22]">
              {editingItem ? "Cập nhật đợt giảm giá" : "Thêm mới đợt giảm giá"}
            </div>
          </div>

          <div className="bg-white rounded-xl mx-6 my-6 py-5 px-10">
            <Form
              form={form}
              layout="vertical"
              onFinish={onFinish}
              onFinishFailed={() =>
                messageApi.error("Vui lòng nhập đầy đủ thông tin!")
              }
            >
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item
                    name="tenDot"
                    label="Tên đợt giảm giá"
                    rules={[
                      { required: true, message: "Vui lòng nhập tên đợt" },
                    ]}
                  >
                    <Input placeholder="Nhập tên đợt giảm giá" />
                  </Form.Item>
                </Col>

                <Col span={8}>
                  <Form.Item
                    name="ngayBatDau"
                    label="Ngày bắt đầu"
                    rules={[{ required: true, message: "Chọn ngày bắt đầu" }]}
                  >
                    <DatePicker
                      className="w-full"
                      disabledDate={disabledDateBeforeToday}
                    />
                  </Form.Item>
                </Col>

                <Col span={8}>
                  <Form.Item
                    name="ngayKetThuc"
                    label="Ngày kết thúc"
                    dependencies={["ngayBatDau"]}
                    rules={[{ required: true, message: "Chọn ngày kết thúc" }]}
                  >
                    <DatePicker
                      className="w-full"
                      disabledDate={(current) =>
                        disabledEndDate(
                          current,
                          form.getFieldValue("ngayBatDau")
                        )
                      }
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item
                    name="loaiGiamGia"
                    label="Loại giảm giá"
                    rules={[
                      { required: true, message: "Chưa chọn loại giảm giá" },
                    ]}
                  >
                    <Select
                      placeholder="Chọn loại"
                      onChange={(val) => setLoaiGiamGia(val)}
                      value={loaiGiamGia}
                    >
                      <Option value="Phần trăm">Phần trăm</Option>
                      <Option value="Tiền mặt">Tiền mặt</Option>
                    </Select>
                  </Form.Item>
                </Col>

                <Col span={8}>
                  <Form.Item
                    name="giaTriGiam"
                    label="Giá trị"
                    rules={[
                      { required: true, message: "Nhập giá trị giảm" },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          const loaiGiam = getFieldValue("loaiGiamGia");
                          if (loaiGiam === "Phần trăm") {
                            if (value < 0 || value > 100) {
                              return Promise.reject(
                                new Error("Giá trị giảm % phải từ 0 đến 100")
                              );
                            }
                          }
                          return Promise.resolve();
                        },
                      }),
                    ]}
                  >
                    <Input
                      placeholder="Nhập giá trị giảm"
                      value={giaTriGiamState}
                      onChange={(e) =>
                        setGiaTriGiamState(Number(e.target.value))
                      }
                    />
                  </Form.Item>
                </Col>

                <Col span={8}>
                  <Form.Item name="giaTriToiThieu" label="Số tiền giảm">
                    <Input
                      placeholder="Tự tính theo % giảm"
                      value={giaTriToiThieuState}
                      disabled
                    />
                  </Form.Item>
                </Col>
              </Row>

              <TableSanPham
                selectedRowKeys={selectedSanPhamKeys}
                onSelectChange={handleSanPhamSelectChange}
              />
              {selectedSanPhamKeys.length > 0 && (
                <div className="flex justify-end gap-3 mb-4">
                  <button
                    type="button"
                    onClick={() => {
                      const newChiTiet = {};
                      selectedSanPhamKeys.forEach((id) => {
                        const data = chiTietSanPhamData[id] || [];
                        newChiTiet[id] = data.map((item) => item.id);
                      });
                      setSelectedChiTietKeys(newChiTiet);
                      messageApi.success("Đã chọn tất cả chi tiết sản phẩm");
                    }}
                    className="border border-green-600 text-green-600 rounded px-4 py-1 hover:bg-green-600 hover:text-white"
                  >
                    Chọn tất cả
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const cleared = {};
                      selectedSanPhamKeys.forEach((id) => {
                        cleared[id] = [];
                      });
                      setSelectedChiTietKeys(cleared);
                      messageApi.info("Đã bỏ chọn tất cả chi tiết sản phẩm");
                    }}
                    className="border border-red-600 text-red-600 rounded px-4 py-1 hover:bg-red-600 hover:text-white"
                  >
                    Bỏ chọn tất cả
                  </button>
                </div>
              )}
              {selectedSanPhamKeys.length > 0 ? (
                selectedSanPhamKeys.map((sanPhamId) => (
                  <TableChiTietSanPham
                    key={sanPhamId}
                    sanPhamId={sanPhamId}
                    selectedRowKeys={selectedChiTietKeys[sanPhamId] || []}
                    loaiGiamGia={loaiGiamGia}
                    giaTriGiam={giaTriGiamState}
                    giaTriGiamToiThieu={form.getFieldValue("giaTriToiThieu")}
                    onSelectChange={(keys) =>
                      setSelectedChiTietKeys((prev) => ({
                        ...prev,
                        [sanPhamId]: keys,
                      }))
                    }
                    onDataChange={(data) =>
                      setChiTietSanPhamData((prev) => ({
                        ...prev,
                        [sanPhamId]: data,
                      }))
                    }
                  />
                ))
              ) : (
                <TableChiTietSanPham
                  sanPhamId={null}
                  selectedRowKeys={[]}
                  loaiGiamGia={form.getFieldValue("loaiGiamGia")}
                  giaTriGiam={form.getFieldValue("giaTriGiam")}
                  giaTriGiamToiThieu={form.getFieldValue("giaTriToiThieu")}
                  onSelectChange={() => {}}
                  onDataChange={() => {}}
                />
              )}

              <div className="flex justify-center gap-4 border-t pt-4 mt-6">
                <button
                  type="button"
                  onClick={() => navigate("/promo")}
                  className="border border-[#E67E22] text-[#E67E22] rounded px-6 py-2 hover:bg-[#E67E22] hover:text-white"
                >
                  Quay lại
                </button>
                <button
                  type="submit"
                  className="bg-[#E67E22] text-white rounded px-6 py-2 hover:bg-[#cf6a12]"
                >
                  {editingItem ? "Cập nhật" : "Thêm"}
                </button>
              </div>
            </Form>
          </div>
        </div>
      </div>
    </>
  );
}
