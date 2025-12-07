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
import { SealPercentIcon } from "@phosphor-icons/react";

const { Option } = Select;

export default function AddPromo() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [modal, modalContextHolder] = Modal.useModal();
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);

  const editingItem = location.state?.dotGiamGia || null;
  const [selectedSanPhamKeys, setSelectedSanPhamKeys] = useState([]);
  const [selectedChiTietKeys, setSelectedChiTietKeys] = useState({});
  const [chiTietSanPhamData, setChiTietSanPhamData] = useState({});
  const [loaiGiamGia, setLoaiGiamGia] = useState(
    form.getFieldValue("loaiGiamGia") || "Phần trăm"
  );
  const [giaTriGiamState, setGiaTriGiamState] = useState(
    form.getFieldValue("giaTriGiam") || 0
  );
  const [giaTriToiThieuState, setGiaTriToiThieuState] = useState(
    form.getFieldValue("giaTriToiThieu") || 0
  );
  const [loading, setLoading] = useState(false);

  const now = dayjs();

  useEffect(() => {
    // Đảm bảo loaiGiamGia luôn là "Phần trăm"
    if (!editingItem) {
      form.setFieldsValue({
        loaiGiamGia: "Phần trăm",
        giaTriToiThieu: 0,
      });
      setLoaiGiamGia("Phần trăm");
      setGiaTriToiThieuState(0);
    }
  }, []);

  useEffect(() => {
    form.setFieldsValue({
      giaTriToiThieu: 0,
    });
    setGiaTriToiThieuState(0);
  }, [loaiGiamGia, giaTriGiamState]);

  useEffect(() => {
    let tongGiam = 0;
    Object.entries(chiTietSanPhamData).forEach(([spId, chiTietArr]) => {
      const selectedIds = selectedChiTietKeys[spId] || [];
      chiTietArr
        .filter((item) => selectedIds.includes(item.id))
        .forEach((item) => {
          tongGiam += item.giaBan * (giaTriGiamState / 100);
        });
    });

    if (giaTriGiamState > 100) tongGiam = 0;

    form.setFieldsValue({ giaTriToiThieu: tongGiam });
    setGiaTriToiThieuState(tongGiam);
  }, [chiTietSanPhamData, selectedChiTietKeys, giaTriGiamState, loaiGiamGia]);

  useEffect(() => {
    const fetchData = async () => {
      if (editingItem) {
        setLoading(true);
        try {
          const res = await dispatch(
            getSanPhamTheoDot(editingItem.id)
          ).unwrap();

          // Lấy danh sách sản phẩm duy nhất từ API
          const uniqueSanPhamIds = [
            ...new Set(res.data.map((item) => item.sanPhamId)),
          ];
          console.log("🚀 ~ fetchData ~ uniqueSanPhamIds:", uniqueSanPhamIds);
          setSelectedSanPhamKeys(uniqueSanPhamIds);

          // Tạo map cho chi tiết sản phẩm: {sanPhamId: [chiTietId1, chiTietId2, ...]}
          const chiTietMap = {};
          res.data.forEach((item) => {
            const { sanPhamId, chiTietId } = item;
            if (!chiTietMap[sanPhamId]) {
              chiTietMap[sanPhamId] = [];
            }
            if (!chiTietMap[sanPhamId].includes(chiTietId)) {
              chiTietMap[sanPhamId].push(chiTietId);
            }
          });

          console.log("🚀 ~ fetchData ~ chiTietMap:", chiTietMap);
          setSelectedChiTietKeys(chiTietMap);

          // Chuẩn bị dữ liệu chi tiết sản phẩm cho TableChiTietSanPham
          const chiTietDataMap = {};
          res.data.forEach((item) => {
            const { sanPhamId, chiTietId, ...rest } = item;
            if (!chiTietDataMap[sanPhamId]) {
              chiTietDataMap[sanPhamId] = [];
            }
            // Tạo object với id là chiTietId
            chiTietDataMap[sanPhamId].push({
              id: chiTietId,
              ...rest,
            });
          });

          console.log("🚀 ~ fetchData ~ chiTietDataMap:", chiTietDataMap);
          setChiTietSanPhamData(chiTietDataMap);

          form.setFieldsValue({
            tenDot: editingItem.tenDot,
            ngayBatDau: dayjs(editingItem.ngayBatDau),
            ngayKetThuc: dayjs(editingItem.ngayKetThuc),
            loaiGiamGia: "Phần trăm",
            giaTriGiam: editingItem.giaTriGiam,
            giaTriToiThieu: editingItem.giaTriToiThieu,
          });
          setLoaiGiamGia("Phần trăm");
          setGiaTriGiamState(editingItem.giaTriGiam);
          setGiaTriToiThieuState(editingItem.giaTriToiThieu);
        } catch (err) {
          console.error("Lỗi khi tải dữ liệu:", err);
          messageApi.error(
            "Không thể tải danh sách chi tiết theo đợt giảm giá!"
          );
        } finally {
          setLoading(false);
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
    let autoTrangThai;
    if (now.isBefore(start, "day")) {
      autoTrangThai = 0;
    } else if (now.isAfter(end, "day")) {
      autoTrangThai = 2;
    } else {
      autoTrangThai = 1;
    }

    const allChiTietIds = Object.values(selectedChiTietKeys).flat();
    if (allChiTietIds.length === 0) {
      messageApi.error("Vui lòng chọn ít nhất một chi tiết sản phẩm!");
      return;
    }

    const payload = {
      maGiamGia: values.maGiamGia,
      tenDot: values.tenDot,
      loaiGiamGia: false, // false = Phần trăm
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
      setTimeout(() => navigate("/admin/promo"), 800);
    } catch (err) {
      console.error(err);
      messageApi.error(isUpdate ? "Cập nhật thất bại!" : "Thêm thất bại!");
    }
  };

  const onFinish = (values) => {
    setConfirmModalVisible(true);
    form.__submitValues = values;
  };

  if (loading) {
    return <div className="p-6 text-center">Đang tải dữ liệu...</div>;
  }

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
          <div className="px-6 py-3 bg-[#E67E22]">
            <div className="font-bold text-2xl text-white">
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
                    initialValue="Phần trăm"
                  >
                    <Select
                      placeholder="Chọn loại"
                      onChange={(val) => setLoaiGiamGia(val)}
                      value={loaiGiamGia}
                      disabled
                    >
                      <Option value="Phần trăm" style={{ color: "#999" }}>
                        Phần trăm
                      </Option>
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
                    className="bg-green-600 text-white border border-green-600 rounded px-4 py-1 hover:bg-white hover:text-green-600 transition duration-200"
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
                    className="bg-red-600 text-white border border-red-600 rounded px-4 py-1 hover:bg-white hover:text-red-600 transition duration-200"
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
                    initialData={chiTietSanPhamData[sanPhamId] || []}
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
                <div
                  type="button"
                  onClick={() => navigate("/admin/promo")}
                  className=" text-black bg-gray-400 font-semibold rounded-md px-6 py-2 cursor-pointer flex items-center gap-2 hover:bg-amber-700 hover:text-white active:bg-cyan-800 select-none"
                >
                  Quay lại
                </div>
                <div
                  onClick={async () => {
                    try {
                      const values = await form.validateFields();
                      onFinish(values);
                    } catch (error) {
                      messageApi.error("Vui lòng nhập đầy đủ thông tin!");
                    }
                  }}
                  className="bg-[#E67E22] text-white rounded-md px-6 py-2 cursor-pointer font-semibold hover:bg-amber-700  active:bg-cyan-800 select-none"
                >
                  {editingItem ? "Cập nhật" : "Thêm"}
                </div>
              </div>
            </Form>
          </div>
        </div>
      </div>
      <Modal
        open={confirmModalVisible}
        onCancel={() => setConfirmModalVisible(false)}
        footer={null}
        width={450}
        centered
        closable={false}
      >
        <div className="flex flex-col items-center gap-4 p-4">
          <div className="text-2xl font-bold mb-2 text-[#E67E22]">
            Xác nhận {editingItem ? "cập nhật" : "thêm"} đợt giảm giá
          </div>
          <SealPercentIcon size={120} style={{ color: "#E67E22" }} />
          <div className="text-gray-600 mb-4 text-center">
            Bạn có chắc chắn muốn {editingItem ? "cập nhật" : "thêm"} đợt giảm
            giá này không?
          </div>

          <div className="flex justify-center gap-6 w-full">
            <div
              className="w-40 cursor-pointer text-center py-3 rounded-xl bg-[#b8b8b8] font-bold text-white hover:bg-amber-600 active:bg-rose-900 shadow"
              onClick={() => setConfirmModalVisible(false)}
            >
              Hủy
            </div>
            <div
              className="w-40 cursor-pointer text-center py-3 rounded-xl bg-[#E67E22] font-bold text-white hover:bg-amber-600 active:bg-cyan-800 shadow"
              onClick={async () => {
                const values = form.__submitValues;
                if (values) {
                  await handleSubmit(values);
                }
                setConfirmModalVisible(false);
              }}
            >
              Đồng ý
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
