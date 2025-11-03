import React, { useEffect, useState } from "react";
import {
  Form,
  Input,
  Select,
  Row,
  Col,
  message,
  DatePicker,
  Modal,
  Radio,
} from "antd";
import { useDispatch } from "react-redux";
import { useLocation, useNavigate } from "react-router";
import dayjs from "dayjs";
import {
  addPhieuGiamGia,
  fetchPhieuGiamGia,
  updatePhieuGiamGia,
} from "@/services/phieuGiamGiaService";
import { fetchAllKhachHang } from "@/services/khachHangService";
import TextArea from "antd/es/input/TextArea";
import TableKhachHang from "./TableKhachHang";
import { getKhachHangTheoPhieuGiam } from "@/services/phieuGiamGiaService";
import DiscountBreadcrumb from "@/pages/discount/DiscountBreadcrumb";
import { prependItem } from "@/redux/slices/phieuGiamGiaSlice";
import { SealPercentIcon, UserCirclePlusIcon } from "@phosphor-icons/react";

const { Option } = Select;

export default function AddDiscount() {
  const dispatch = useDispatch();
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [messageApi, messageContextHolder] = message.useMessage();
  const location = useLocation();
  const editingItem = location.state?.phieuGiamGia || null;
  const [kieu, setKieu] = useState(editingItem?.kieu ?? 0);
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  const [trangThai, setTrangThai] = useState(editingItem?.trangThai ?? 0);
  const [modal, contextHolder] = Modal.useModal();
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);

  const currentDate = dayjs();

  useEffect(() => {
    dispatch(fetchAllKhachHang());
  }, [dispatch]);

  useEffect(() => {
    const loadKhachHangTheoPhieu = async () => {
      if (editingItem?.id && editingItem.kieu === 1) {
        try {
          const res = await getKhachHangTheoPhieuGiam(editingItem.id);
          setSelectedCustomers(res.data || []);
        } catch (err) {
          console.error("Lỗi khi lấy khách hàng theo phiếu:", err);
        }
      }
    };
    loadKhachHangTheoPhieu();
  }, [editingItem]);

  useEffect(() => {
    if (editingItem) {
      form.setFieldsValue({
        maGiamGia: editingItem.maGiamGia,
        tenChuongTrinh: editingItem.tenChuongTrinh,
        kieu: editingItem.kieu,
        loaiGiamGia: editingItem.loaiGiamGia ? "Tiền mặt" : "Phần trăm",
        giaTriGiamGia: editingItem.giaTriGiamGia,
        mucGiaGiamToiDa: editingItem.mucGiaGiamToiDa,
        soLuongDung: editingItem.soLuongDung ?? 0,
        giaTriDonHangToiThieu: editingItem.giaTriDonHangToiThieu ?? 0,
        ngayBatDau: editingItem.ngayBatDau
          ? dayjs(editingItem.ngayBatDau)
          : null,
        ngayKetThuc: editingItem.ngayKetThuc
          ? dayjs(editingItem.ngayKetThuc)
          : null,
        moTa: editingItem.moTa,
        trangThai: editingItem.trangThai ?? 0,
      });
      setKieu(editingItem.kieu);
      setTrangThai(editingItem.trangThai ?? 0);
    }
  }, [editingItem, form]);

  useEffect(() => {
    if (kieu === 1) {
      form.setFieldsValue({
        soLuongDung: selectedCustomers.length,
      });
    }
  }, [selectedCustomers, kieu, form]);

  const disabledDateBeforeToday = (current) => {
    return current && current < currentDate.startOf("day");
  };

  const disabledEndDate = (current, startDate) => {
    if (!startDate) {
      return current && current < currentDate.startOf("day");
    }
    return (
      current &&
      (current < startDate.startOf("day") ||
        current < currentDate.startOf("day"))
    );
  };

  const handleSubmit = async (values) => {
    const now = dayjs();
    const start = dayjs(values.ngayBatDau);
    const end = dayjs(values.ngayKetThuc);
    const isUpdate = !!editingItem;

    let autoTrangThai = 0;
    if (start.isAfter(now, "day")) {
    autoTrangThai = 0;
  } else if (
    (start.isBefore(now, "day") || start.isSame(now, "day")) &&
    (end.isAfter(now, "day") || end.isSame(now, "day"))
  ) {
    autoTrangThai = 1; 
  } else if (end.isBefore(now, "day")) {
    autoTrangThai = 2;
  }

    const payload = {
      maGiamGia: values.maGiamGia,
      tenChuongTrinh: values.tenChuongTrinh,
      loaiGiamGia: values.loaiGiamGia === "Tiền mặt",
      giaTriGiamGia: Number(values.giaTriGiamGia ?? 0),
      mucGiaGiamToiDa: Number(values.mucGiaGiamToiDa ?? 0),
      soLuongDung:
        values.kieu === 1
          ? selectedCustomers.length
          : Number(values.soLuongDung ?? 0),
      giaTriDonHangToiThieu: Number(values.giaTriDonHangToiThieu ?? 0),
      kieu: values.kieu,
      ngayBatDau: values.ngayBatDau?.format("YYYY-MM-DDTHH:mm:ss"),
      ngayKetThuc: values.ngayKetThuc?.format("YYYY-MM-DDTHH:mm:ss"),
      moTa: values.moTa ?? "",
      idKhachHangs: values.kieu === 1 ? selectedCustomers : [],
      trangThai: autoTrangThai,
    };

    try {
      if (isUpdate) {
        await dispatch(
          updatePhieuGiamGia({ id: editingItem.id, phieuGiamGia: payload })
        );
        messageApi.success("Cập nhật phiếu giảm giá thành công!");
      } else {
        const res = await dispatch(addPhieuGiamGia(payload)).unwrap();
        messageApi.success("✅ Thêm phiếu giảm giá thành công!");
        dispatch(prependItem(res));
        form.resetFields();
        setSelectedCustomers([]);
      }
      setTimeout(() => navigate("/admin/discount"), 800);
    } catch (err) {
      console.error(err);
      messageApi.error(isUpdate ? "Cập nhật thất bại!" : "Thêm thất bại!");
    }
  };

  const onFinish = (values) => {
    if (values.kieu === 1 && selectedCustomers.length === 0) {
      messageApi.error(
        "Vui lòng chọn ít nhất 1 khách hàng cho kiểu 'Cá nhân'!"
      );
      return;
    }
    setConfirmModalVisible(true);
    form.__submitValues = values; // Lưu tạm giá trị form để dùng khi nhấn Đồng ý
  };

  return (
    <>
      {contextHolder}
      {messageContextHolder}
      <div className="p-6 flex flex-col gap-10">
        <div className="bg-white flex flex-col gap-3 px-4 py-[20px] rounded-lg shadow overflow-hidden">
          <div className="font-bold text-4xl text-[#E67E22]">
            Quản lý phiếu giảm giá
          </div>
          <DiscountBreadcrumb />
        </div>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-3 bg-[#E67E22]">
            <div className="font-bold text-2xl text-white">
              {editingItem ? "Cập nhật khuyến mại" : "Thêm mới khuyến mại"}
            </div>
          </div>

          <div className="px-10 py-5">
            <Form
              form={form}
              layout="vertical"
              initialValues={{ kieu: 0 }}
              onFinish={onFinish}
              onFinishFailed={() =>
                messageApi.error("Vui lòng nhập đầy đủ và đúng thông tin!")
              }
            >
              <Row gutter={16} wrap className="gap-10">
                <Col flex="1">
                  <Form.Item
                    name="tenChuongTrinh"
                    label="Tên chương trình"
                    rules={[
                      {
                        required: true,
                        message: "Vui lòng nhập tên chương trình",
                      },
                      {
                        min: 3,
                        message: "Tên chương trình phải có ít nhất 3 ký tự",
                      },
                    ]}
                  >
                    <Input placeholder="Nhập tên chương trình" />
                  </Form.Item>
                </Col>

                <Col flex="1">
                  <Form.Item
                    name="ngayBatDau"
                    label="Từ ngày"
                    rules={[
                      { required: true, message: "Vui lòng chọn ngày bắt đầu" },
                    ]}
                  >
                    <DatePicker
                      className="w-full"
                      showTime
                      disabledDate={disabledDateBeforeToday}
                      placeholder="Chọn ngày bắt đầu"
                    />
                  </Form.Item>
                </Col>

                <Col flex="1">
                  <Form.Item
                    name="ngayKetThuc"
                    label="Đến ngày"
                    dependencies={["ngayBatDau"]}
                    rules={[
                      {
                        required: true,
                        message: "Vui lòng chọn ngày kết thúc",
                      },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          const start = getFieldValue("ngayBatDau");
                          if (!value || !start) return Promise.resolve();
                          const startDate = dayjs(start);
                          const endDate = dayjs(value);

                          if (
                            (endDate.isValid() &&
                              startDate.isValid() &&
                              endDate.isAfter(startDate)) ||
                            endDate.isSame(startDate)
                          ) {
                            return Promise.resolve();
                          }
                          return Promise.reject(
                            new Error(
                              "Ngày kết thúc không được trước ngày bắt đầu"
                            )
                          );
                        },
                      }),
                    ]}
                  >
                    <DatePicker
                      className="w-full"
                      showTime
                      disabledDate={(current) => {
                        const startDate = form.getFieldValue("ngayBatDau");
                        return disabledEndDate(current, startDate);
                      }}
                      placeholder="Chọn ngày kết thúc"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16} wrap className="gap-10">
                <Col flex="1">
                  <Form.Item
                    name="loaiGiamGia"
                    label="Loại giảm giá"
                    rules={[
                      {
                        required: true,
                        message: "Vui lòng chọn loại giảm giá",
                      },
                    ]}
                  >
                    <Select placeholder="Chọn loại giảm">
                      <Option value="Phần trăm">Phần trăm</Option>
                      <Option value="Tiền mặt">Tiền mặt</Option>
                    </Select>
                  </Form.Item>
                </Col>

                <Col flex="1">
                  <Form.Item
                    name="giaTriGiamGia"
                    label="Giá trị giảm"
                    rules={[
                      { required: true, message: "Vui lòng nhập giá trị giảm" },
                      {
                        validator: (_, value) => {
                          if (!value || isNaN(value)) {
                            return Promise.reject(
                              new Error("Giá trị phải là số")
                            );
                          }
                          if (Number(value) <= 0) {
                            return Promise.reject(
                              new Error("Giá trị giảm phải lớn hơn 0")
                            );
                          }
                          if (
                            form.getFieldValue("loaiGiamGia") === "Phần trăm" &&
                            Number(value) > 100
                          ) {
                            return Promise.reject(
                              new Error(
                                "Giảm phần trăm không được vượt quá 100%"
                              )
                            );
                          }
                          return Promise.resolve();
                        },
                      },
                    ]}
                  >
                    <Input placeholder="Nhập giá trị giảm" />
                  </Form.Item>
                </Col>

                <Col flex="1">
                  <Form.Item
                    name="mucGiaGiamToiDa"
                    label="Mức giảm tối đa"
                    rules={[
                      {
                        required: true,
                        message: "Vui lòng nhập mức giảm tối đa",
                      },
                      {
                        validator: (_, value) => {
                          if (isNaN(value) || Number(value) < 0) {
                            return Promise.reject(
                              new Error("Mức giảm tối đa phải là số không âm")
                            );
                          }
                          return Promise.resolve();
                        },
                      },
                    ]}
                  >
                    <Input placeholder="Nhập mức giảm tối đa" />
                  </Form.Item>
                </Col>

                <Col flex="1">
                  <Form.Item
                    name="giaTriDonHangToiThieu"
                    label="Giá trị đơn hàng tối thiểu"
                    rules={[
                      {
                        validator: (_, value) => {
                          if (!value) return Promise.resolve();
                          if (isNaN(value) || Number(value) < 0) {
                            return Promise.reject(
                              new Error(
                                "Giá trị đơn hàng tối thiểu không hợp lệ"
                              )
                            );
                          }
                          return Promise.resolve();
                        },
                      },
                    ]}
                  >
                    <Input placeholder="Nhập giá trị đơn hàng tối thiểu" />
                  </Form.Item>
                </Col>

                <Col flex="1">
                  <Form.Item
                    name="soLuongDung"
                    label="Số lượng phiếu"
                    rules={[
                      {
                        validator: (_, value) => {
                          if (!value) return Promise.resolve();
                          if (isNaN(value) || Number(value) < 0) {
                            return Promise.reject(
                              new Error("Số lượng phải là số không âm")
                            );
                          }
                          return Promise.resolve();
                        },
                      },
                    ]}
                  >
                    <Input
                      placeholder="Nhập số lượng phiếu giảm giá"
                      readOnly={kieu === 1}
                      value={kieu === 1 ? selectedCustomers.length : undefined}
                    />
                  </Form.Item>
                </Col>
                <Col flex="1">
                  <Form.Item
                    name="kieu"
                    label="Kiểu"
                    rules={[
                      {
                        required: true,
                        message: "Vui lòng chọn kiểu giảm giá",
                      },
                    ]}
                  >
                    <Radio.Group
                      onChange={(e) => setKieu(e.target.value)}
                      value={kieu}
                    >
                      <Radio value={0}>Công khai</Radio>
                      <Radio value={1}>Cá nhân</Radio>
                    </Radio.Group>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16} wrap className="gap-10">
                <Col flex="1">
                  <Form.Item
                    name="moTa"
                    label="Mô tả"
                    rules={[
                      {
                        max: 200,
                        message: "Mô tả không được vượt quá 200 ký tự",
                      },
                    ]}
                  >
                    <TextArea
                      rows={3}
                      placeholder="Nhập mô tả (tối đa 200 ký tự)"
                    />
                  </Form.Item>
                </Col>
              </Row>

              {kieu === 1 && (
                <div className="mt-5 border-t border-dashed border-gray-300 pt-5">
                  <TableKhachHang
                    onSelectChange={(keys) => setSelectedCustomers(keys)}
                    selectedRowKeys={selectedCustomers}
                  />
                </div>
              )}

              <div className="flex justify-center pr-3 gap-4 border-t border-slate-300 py-3 mt-6">
                <div
                  type="button"
                  onClick={() => navigate("/admin/discount")}
                  className=" text-white bg-gray-400 font-semibold rounded-md px-6 py-2 cursor-pointer flex items-center gap-2 hover:bg-amber-700 hover:text-white active:bg-cyan-800 select-none"
                >
                  Quay lại
                </div>

                <div
                  type="button"
                  onClick={() => {
                    form.resetFields();
                    setSelectedCustomers([]);
                    setTrangThai(true);
                    setKieu(0);
                  }}
                  className=" text-white bg-gray-400 font-semibold rounded-md px-6 py-2 cursor-pointer flex items-center gap-2 hover:bg-amber-700 hover:text-white active:bg-cyan-800 select-none"
                >
                  Nhập lại
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
          <div className="text-xl font-bold mb-2 text-[#E67E22]">
            Xác nhận {editingItem ? "cập nhật" : "thêm"} phiếu giảm giá
          </div>
          <SealPercentIcon size={120} style={{ color: "#E67E22" }} />
          <div className="text-gray-600 mb-4 text-center">
            Bạn có chắc chắn muốn {editingItem ? "cập nhật" : "thêm"} phiếu giảm
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
