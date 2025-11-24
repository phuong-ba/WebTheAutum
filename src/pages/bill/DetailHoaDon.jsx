import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Timeline,
  Spin,
  Divider,
  Row,
  Col,
  Typography,
  Empty,
  Modal,
  Input,
  Form,
  Select,
  message,
  InputNumber,
} from "antd";
import {
  EditOutlined,
  PrinterOutlined,
  MailOutlined,
  ArrowLeftOutlined,
  LockOutlined,
  ShoppingOutlined,
  UserOutlined,
  DollarOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { TrashIcon } from "lucide-react";
import {
  tangSoLuong,
  fetchChiTietSanPham,
  giamSoLuong,
} from "@/services/chiTietSanPhamService";
import hoaDonApi from "../../api/HoaDonAPI";
import { fetchNhanVien } from "@/services/nhanVienService";
import { fetchPhuongThuc } from "@/services/phuongThucThanhToanService";
import BillOrderInformation from "./BillOrderInformation";
import BillInvoiceStatus from "./BillInvoiceStatus";
import BillInvoiceHistory from "./BillInvoiceHistory";
import { FloppyDiskIcon, XCircleIcon, XIcon } from "@phosphor-icons/react";
import BillProduct from "./BillProduct";
import { diaChiApi } from "/src/api/diaChiApi";
import { useDispatch, useSelector } from "react-redux";
const { Title, Text } = Typography;

const DetailHoaDon = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [canEdit, setCanEdit] = useState(false);
  const [lichSuHoaDon, setLichSuHoaDon] = useState([]);
  const [emailModalVisible, setEmailModalVisible] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailForm] = Form.useForm();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm] = Form.useForm();
  const [tempStatus, setTempStatus] = useState(0);
  const [tempLoaiHoaDon, setTempLoaiHoaDon] = useState(false);
  const [addressModalVisible, setAddressModalVisible] = useState(false);
  const [customerAddresses, setCustomerAddresses] = useState([]);
  const [showBillProduct, setShowBillProduct] = useState(false);
  const [editingQuantities, setEditingQuantities] = useState({});
  const [tinhList, setTinhList] = useState([]);
  const [quanMap, setQuanMap] = useState({});
  const [localQuanList, setLocalQuanList] = useState([]);
  const [addressForm] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const dispatch = useDispatch();

  const [deletedProducts, setDeletedProducts] = useState([]);

  const [invoiceProducts, setInvoiceProducts] = useState([]);

  const { data: productList } = useSelector((state) => state.chiTietSanPham);

  const [nhanVienList, setNhanVienList] = useState([]);
  const [phuongThucList, setPhuongThucList] = useState([]);
  const [formErrors, setFormErrors] = useState({});
  const [lichSuThanhToan, setLichSuThanhToan] = useState([]);

  const [canEditCustomerInfo, setCanEditCustomerInfo] = useState(false);
  const [canEditProducts, setCanEditProducts] = useState(false);
  const [tongTien, setTongTien] = useState(0);

  const getProductKey = (product) => {
    return product.idChiTietSanPham;
  };

  const fetchLichSuThanhToan = async () => {
    try {
      const response = await hoaDonApi.getLichSuThanhToan(id);
      setLichSuThanhToan(response.data || []);
    } catch (err) {
      console.error("❌ Lỗi tải lịch sử thanh toán:", err);
      setLichSuThanhToan([]);
    }
  };

  const calculateTotal = (products) => {
    return products.reduce((total, product) => {
      return (
        total + (product.thanhTien || product.giaBan * product.soLuong || 0)
      );
    }, 0);
  };

  const calculateFinalTotal = () => {
    if (!invoice)
      return {
        tongTienSanPham: 0,
        phiVanChuyen: 0,
        tongTienTruocGiam: 0,
        tienGiamGia: 0,
        tongTienCuoiCung: 0,
        phieuGiamGiaInfo: null,
      };

    const tongTienSanPham = calculateTotal(invoiceProducts);

    const phiVanChuyen = !invoice.loaiHoaDon ? invoice.phiVanChuyen || 0 : 0;

    let tienGiamGia = 0;
    let tongTienCuoiCung = tongTienSanPham + phiVanChuyen;
    let phieuGiamGiaInfo = null;

    if (invoice.tongTienSauGiam != null && invoice.tongTien != null) {
      tienGiamGia = invoice.tongTien - invoice.tongTienSauGiam;
      tongTienCuoiCung = invoice.tongTienSauGiam;
    } else if (invoice.phieuGiamGia) {
      const pgg = invoice.phieuGiamGia;
      phieuGiamGiaInfo = {
        maPhieu: pgg.maPhieu || "PGG" + pgg.id,
        tenPhieu: pgg.tenPhieu || "Phiếu giảm giá",
        loaiGiamGia: pgg.loaiGiamGia,
        giaTriGiamGia: pgg.giaTriGiamGia,
        giamToiDa: pgg.mucGiaGiamToiDa || pgg.giamToiDa,
      };

      if (invoice.tongTienSauGiam != null) {
        tongTienCuoiCung = invoice.tongTienSauGiam;
        tienGiamGia =
          (invoice.tongTien || tongTienSanPham + phiVanChuyen) -
          tongTienCuoiCung;
      }
    } else if (invoice.maGiamGia || invoice.tenChuongTrinh) {
      console.warn("Backend chưa trả tongTienSauGiam dù có mã giảm giá!");
    }

    tongTienCuoiCung = Math.max(0, tongTienCuoiCung);
    tienGiamGia = Math.max(0, tienGiamGia);

    return {
      tongTienSanPham,
      phiVanChuyen,
      tongTienTruocGiam: tongTienSanPham + phiVanChuyen,
      tienGiamGia,
      tongTienCuoiCung,
      phieuGiamGiaInfo,
    };
  };

  useEffect(() => {
    const total = calculateTotal(invoiceProducts);
    setTongTien(total);
    console.log(`💰 Tổng tiền cập nhật: ${formatMoney(total)}`);
  }, [invoiceProducts]);

  const checkEditPermissions = (status) => {
    if (status === 0) {
      setCanEditCustomerInfo(true);
      setCanEditProducts(true);
    } else {
      setCanEditCustomerInfo(false);
      setCanEditProducts(false);
    }
  };
  useEffect(() => {
    if (invoice && !isEditing && invoice.chiTietSanPhams) {
      setInvoiceProducts(invoice.chiTietSanPhams);
      const initialQuantities = {};
      invoice.chiTietSanPhams.forEach((product) => {
        const key = getProductKey(product);
        initialQuantities[key] = product.soLuong;
      });
      setEditingQuantities(initialQuantities);
    }
  }, [invoice]);
  // useEffect(() => {
  //   if (invoice?.chiTietSanPhams) {
  //     setInvoiceProducts(invoice.chiTietSanPhams);

  //     const initialQuantities = {};
  //     invoice.chiTietSanPhams.forEach((product) => {
  //       const key = getProductKey(product);
  //       initialQuantities[key] = product.soLuong;
  //     });
  //     setEditingQuantities(initialQuantities);

  //     dispatch(fetchChiTietSanPham());
  //   }
  // }, [invoice, dispatch]);
  useEffect(() => {
    dispatch(fetchChiTietSanPham());
  }, [dispatch]);

  // useEffect(() => {
  //   if (invoice?.chiTietSanPhams) {
  //     setInvoiceProducts(invoice.chiTietSanPhams);

  //     const initialQuantities = {};
  //     invoice.chiTietSanPhams.forEach((product) => {
  //       const key = getProductKey(product);
  //       initialQuantities[key] = product.soLuong;
  //     });
  //     setEditingQuantities(initialQuantities);
  //   }
  // }, [invoice]);

  useEffect(() => {
    diaChiApi
      .getAllTinhThanh()
      .then(setTinhList)
      .catch((err) => {
        console.error("Lỗi load tỉnh/thành:", err);
        messageApi.error("Không thể tải danh sách tỉnh/thành");
      });
  }, [messageApi]);
  const handleTempStatusChange = (newStatus) => {
    setTempStatus(newStatus);
  };

  const handleLoaiHoaDonChange = (newLoaiHoaDon) => {
    setTempLoaiHoaDon(newLoaiHoaDon);
  };
  const handleTinhChange = async (idTinh) => {
    if (!idTinh) {
      setLocalQuanList([]);
      editForm.setFieldsValue({ quan: null });
      return;
    }

    editForm.setFieldsValue({ quan: null });

    if (quanMap[idTinh]) {
      setLocalQuanList(quanMap[idTinh]);
      return;
    }

    try {
      const res = await diaChiApi.getQuanByTinh(idTinh);
      setQuanMap((prev) => ({ ...prev, [idTinh]: res }));
      setLocalQuanList(res);
    } catch (err) {
      console.error("Lỗi load quận/huyện:", err);
      messageApi.error("Không thể tải danh sách quận/huyện");
    }
  };
  const handleEditToggle = () => {
    setIsEditing(true);
    setTempStatus(invoice?.trangThai || 0);
    setTempLoaiHoaDon(invoice?.loaiHoaDon || false);

    const kh = invoice.khachHang || {};

    const defaultAddress = kh.diaChi?.find((addr) => addr.trangThai === true);

    const fallbackAddress = defaultAddress || (kh.diaChi?.[0] ?? null);

    let currentAddress = invoice.diaChiKhachHang || "";
    let diaChiCuThe = "";
    let idTinh = null;
    let idQuan = null;

    if (fallbackAddress) {
      diaChiCuThe = fallbackAddress.diaChiCuThe || "";

      const tinhThanh = fallbackAddress.tinhThanh || {};
      const tenTinh = tinhThanh.tenTinh || "";
      idTinh =
        tinhThanh.id || fallbackAddress.tinhThanhId || fallbackAddress.idTinh;

      const quanHuyen = fallbackAddress.quanHuyen || {};
      const tenQuan = quanHuyen.tenQuan || "";
      idQuan =
        quanHuyen.id || fallbackAddress.quanHuyenId || fallbackAddress.idQuan;

      if (!currentAddress) {
        currentAddress = [diaChiCuThe, tenQuan, tenTinh]
          .filter(Boolean)
          .join(", ");
      }
    }

    editForm.setFieldsValue({
      hoTenKhachHang: kh.hoTen || invoice.tenKhachHang || "",
      sdtKhachHang: kh.sdt || invoice.sdtKhachHang || "",
      emailKhachHang: kh.email || invoice.emailKhachHang || "",
      ghiChu: invoice.ghiChu || "",

      diaChiCuThe: diaChiCuThe,
      thanhPho: idTinh,
      quan: idQuan,
      idDiaChi: fallbackAddress?.id || null,

      trangThai: invoice.trangThai,
      loaiHoaDon: invoice.loaiHoaDon,
      hinhThucThanhToan: invoice.hinhThucThanhToan,
      idNhanVien: invoice.idNhanVien,
      idPhuongThucThanhToan: invoice.idPhuongThucThanhToan,
    });

    if (idTinh) {
      handleTinhChange(idTinh).then(() => {
        editForm.setFieldsValue({ quan: idQuan });
      });
    }
  };

  const validationRules = {
    hoTenKhachHang: [
      { required: true, message: "Vui lòng nhập tên khách hàng!" },
      { min: 2, message: "Tên phải có ít nhất 2 ký tự!" },
      { max: 100, message: "Tên không được quá 100 ký tự!" },
      {
        pattern: /^[a-zA-ZÀ-ỹ\s]+$/,
        message: "Tên chỉ được chứa chữ cái và khoảng trắng!",
      },
    ],
    sdtKhachHang: [
      { required: true, message: "Vui lòng nhập số điện thoại!" },
      {
        pattern: /(84|0[3|5|7|8|9])+([0-9]{8})\b/,
        message: "Số điện thoại không hợp lệ (VD: 0912345678)!",
      },
    ],
    emailKhachHang: [{ type: "email", message: "Email không hợp lệ!" }],
    diaChiKhachHang: [
      { required: true, message: "Vui lòng nhập địa chỉ!" },
      { min: 10, message: "Địa chỉ phải có ít nhất 10 ký tự!" },
      { max: 200, message: "Địa chỉ không được quá 200 ký tự!" },
    ],
    tenNhanVien: [
      { max: 100, message: "Tên nhân viên không được quá 100 ký tự!" },
    ],
    ghiChu: [{ max: 500, message: "Ghi chú không được quá 500 ký tự!" }],
    trangThai: [{ required: true, message: "Vui lòng chọn trạng thái!" }],
    hinhThucThanhToan: [
      { required: true, message: "Vui lòng chọn hình thức thanh toán!" },
    ],
    idNhanVien: [{ required: true, message: "Vui lòng chọn nhân viên!" }],
    idPhuongThucThanhToan: [
      { required: true, message: "Vui lòng chọn phương thức thanh toán!" },
    ],
  };

  const handleSave = async () => {
    try {
      const values = await editForm.validateFields();

      const tenTinh =
        values.thanhPho && tinhList.length > 0
          ? tinhList.find((t) => t.id === values.thanhPho)?.tenTinh || ""
          : "";
      const tenQuan =
        values.thanhPho && quanMap[values.thanhPho]
          ? quanMap[values.thanhPho].find((q) => q.id === values.quan)
              ?.tenQuan || ""
          : "";

      const fullAddress = [values.diaChiCuThe || "", tenQuan, tenTinh]
        .filter(Boolean)
        .join(", ")
        .trim();

      const currentChiTietSanPhams = invoiceProducts.map((product) => ({
        idChiTietSanPham: getChiTietSanPhamId(product),
        soLuong: product.soLuong,
        giaBan: product.giaBan || product.giaSauGiam || 0,
        ghiChu: product.ghiChu || "",
      }));

      const requestData = {
        ...values,
        idDiaChi: values.idDiaChi ?? null,
        diaChiCuThe: values.diaChiCuThe ?? null,
        thanhPho: values.thanhPho ?? null,
        quan: values.quan ?? null,
        diaChiKhachHang: fullAddress || "Chưa có địa chỉ",

        trangThai: tempStatus,
        loaiHoaDon: tempLoaiHoaDon,

        chiTietSanPhams: currentChiTietSanPhams,
      };

      console.log("Gửi cập nhật hóa đơn:", {
        chiTietSanPhams: requestData.chiTietSanPhams,
        totalProducts: requestData.chiTietSanPhams.length,
      });

      await hoaDonApi.updateHoaDon(id, requestData);

      message.success("Cập nhật hóa đơn thành công!");
      setIsEditing(false);
      setDeletedProducts([]);
      setEditingQuantities({});
      setInvoiceProducts([]);

      await fetchInvoiceDetail();
      await fetchLichSuThanhToan();
    } catch (err) {
      console.error("Lỗi khi lưu hóa đơn:", err);
      if (err.errorFields) {
        message.error("Vui lòng kiểm tra lại các trường thông tin!");
      } else {
        message.error(
          err.response?.data?.message || "Cập nhật hóa đơn thất bại!"
        );
      }
    }
  };

  const openAddressModal = () => {
    if (!invoice?.khachHang) {
      message.warning("Không có thông tin khách hàng!");
      return;
    }

    const diaChiList = invoice.khachHang.diaChi;
    if (!diaChiList || !Array.isArray(diaChiList) || diaChiList.length === 0) {
      message.info("Khách hàng chưa có địa chỉ nào được lưu.");
      return;
    }

    const addresses = diaChiList.map((addr) => ({
      ...addr,
      tinhTen: addr.tinhThanh || addr.tenTinh || "Không xác định",
      quanTen: addr.quanHuyen || addr.tenQuan || "Không xác định",
      diaChiCuThe: addr.diaChiCuThe || "",
      idTinh: addr.idTinh || addr.tinhThanhId,
      idQuan: addr.idQuan || addr.quanHuyenId,
    }));

    setCustomerAddresses(addresses);
    setAddressModalVisible(true);
  };
  const handleSelectAddress = async (record) => {
    if (!record) return;

    const idTinh = record.idTinh || record.tinhThanhId;
    const idQuan = record.idQuan || record.quanHuyenId;

    const fullAddress = [
      record.diaChiCuThe || "",
      record.quanTen || "",
      record.tinhTen || "",
    ]
      .filter(Boolean)
      .join(", ");

    editForm.setFieldsValue({
      diaChiCuThe: record.diaChiCuThe || "",
      thanhPho: idTinh,
      quan: idQuan,
      idDiaChi: record.id,
    });

    if (idTinh && idQuan) {
      if (!quanMap[idTinh]) {
        const fakeQuanList = [
          { id: idQuan, tenQuan: record.quanTen || "Quận/Huyện" },
        ];
        setQuanMap((prev) => ({ ...prev, [idTinh]: fakeQuanList }));
        setLocalQuanList(fakeQuanList);
      } else if (!quanMap[idTinh].some((q) => q.id === idQuan)) {
        setQuanMap((prev) => ({
          ...prev,
          [idTinh]: [...prev[idTinh], { id: idQuan, tenQuan: record.quanTen }],
        }));
        setLocalQuanList((prev) => [
          ...prev,
          { id: idQuan, tenQuan: record.quanTen },
        ]);
      } else {
        setLocalQuanList(quanMap[idTinh]);
      }
    }

    setInvoice((prev) => ({ ...prev, diaChiKhachHang: fullAddress }));
    message.success("Đã chọn địa chỉ giao hàng!");
    setAddressModalVisible(false);
  };
  const handleCancelEdit = () => {
    setIsEditing(false);
    setDeletedProducts([]);
    setEditingQuantities({});
    setFormErrors({});
    setTempStatus(invoice?.trangThai || 0);
    setTempLoaiHoaDon(invoice?.loaiHoaDon || false);
    setInvoiceProducts(invoice?.chiTietSanPhams || []);

    if (invoice?.chiTietSanPhams) {
      setInvoiceProducts(invoice.chiTietSanPhams);
      const initialQuantities = {};
      invoice.chiTietSanPhams.forEach((p) => {
        initialQuantities[getProductKey(p)] = p.soLuong;
      });
      setEditingQuantities(initialQuantities);
    }

    editForm.resetFields();
  };

  const handleDeleteProductFromInvoice = async (productKey) => {
    if (!canEditProducts) {
      message.warning("Không thể xóa sản phẩm ở trạng thái hiện tại!");
      return;
    }

    const product = invoiceProducts.find(
      (p) => getProductKey(p) === productKey
    );
    if (!product) return;

    const chiTietId = getChiTietSanPhamId(product);
    if (chiTietId && product.soLuong > 0) {
      try {
        await dispatch(
          tangSoLuong({ id: chiTietId, soLuong: product.soLuong })
        ).unwrap();
        messageApi.success(`Đã trả ${product.soLuong} sản phẩm về tồn kho!`);
      } catch (err) {
        console.error("Lỗi khi trả tồn kho:", err);
        messageApi.error("Không thể trả lại tồn kho!");
        return;
      }
    }

    setDeletedProducts((prev) => [
      ...prev,
      {
        idChiTietSanPham: chiTietId,
        soLuong: product.soLuong,
        productKey: productKey,
      },
    ]);

    const updated = invoiceProducts.filter(
      (p) => getProductKey(p) !== productKey
    );
    setInvoiceProducts(updated);
    setEditingQuantities((prev) => {
      const newState = { ...prev };
      delete newState[productKey];
      return newState;
    });

    await dispatch(fetchChiTietSanPham()).unwrap();
    messageApi.success("Đã xóa sản phẩm khỏi hóa đơn!");
  };

  const handleIncreaseQuantity = async (productKey) => {
    if (!canEditProducts) {
      message.warning("Không thể thay đổi số lượng ở trạng thái hiện tại!");
      return;
    }

    const product = invoiceProducts.find(
      (p) => getProductKey(p) === productKey
    );
    if (!product) return;

    const chiTietId = getChiTietSanPhamId(product);
    if (!chiTietId) return;

    try {
      const currentProduct = productList.find((p) => p.id === chiTietId);
      if (!currentProduct || currentProduct.soLuongTon <= 0) {
        messageApi.warning("Sản phẩm đã hết hàng!");
        return;
      }

      await dispatch(giamSoLuong({ id: chiTietId, soLuong: 1 })).unwrap();

      const updatedProducts = invoiceProducts.map((p) => {
        if (getProductKey(p) === productKey) {
          const newQuantity = p.soLuong + 1;
          const newThanhTien = newQuantity * p.giaBan;
          return {
            ...p,
            soLuong: newQuantity,
            thanhTien: newThanhTien,
          };
        }
        return p;
      });

      setInvoiceProducts(updatedProducts);
      setEditingQuantities((prev) => ({
        ...prev,
        [productKey]: product.soLuong + 1,
      }));

      await dispatch(fetchChiTietSanPham()).unwrap();
      messageApi.success("Đã tăng số lượng!");
    } catch (error) {
      console.error("Lỗi khi tăng số lượng:", error);
      messageApi.error("Không thể tăng số lượng (hết hàng hoặc lỗi hệ thống)");
    }
  };

  const handleDecreaseQuantity = async (productKey) => {
    if (!canEditProducts) {
      message.warning("Không thể thay đổi số lượng ở trạng thái hiện tại!");
      return;
    }

    const product = invoiceProducts.find(
      (p) => getProductKey(p) === productKey
    );
    if (!product || product.soLuong <= 1) return;

    try {
      const chiTietId = getChiTietSanPhamId(product);

      await dispatch(tangSoLuong({ id: chiTietId, soLuong: 1 })).unwrap();

      const updatedProducts = invoiceProducts.map((p) => {
        if (getProductKey(p) === productKey) {
          const newQuantity = p.soLuong - 1;
          const newThanhTien = newQuantity * p.giaBan;
          return {
            ...p,
            soLuong: newQuantity,
            thanhTien: newThanhTien,
          };
        }
        return p;
      });

      setInvoiceProducts(updatedProducts);
      setEditingQuantities((prev) => ({
        ...prev,
        [productKey]: product.soLuong - 1,
      }));

      await dispatch(fetchChiTietSanPham()).unwrap();
      messageApi.success("Đã giảm số lượng!");
    } catch (error) {
      console.error("Lỗi khi giảm số lượng:", error);
      messageApi.error("Lỗi khi giảm số lượng!");
    }
  };

  const getChiTietSanPhamId = (product) => {
    return (
      product.idChiTietSanPham ||
      product.chiTietSanPham?.id ||
      product.idCTSP ||
      product.id
    );
  };

  const handleQuantityChange = (productId, newQuantity) => {
    if (!canEditProducts) {
      message.warning("Không thể thay đổi số lượng ở trạng thái hiện tại!");
      return;
    }

    if (!newQuantity || newQuantity < 1) return;

    setEditingQuantities((prev) => ({
      ...prev,
      [productId]: newQuantity,
    }));
  };

  const handleApplyQuantity = async (productId) => {
    if (!canEditProducts) {
      message.warning("Không thể thay đổi số lượng ở trạng thái hiện tại!");
      return;
    }

    const newQuantity = editingQuantities[productId];
    const product = invoiceProducts.find((p) => getProductKey(p) === productId);
    if (!product || !newQuantity || newQuantity === product.soLuong) return;

    const chiTietId = getChiTietSanPhamId(product);
    if (!chiTietId) {
      messageApi.error("Không xác định được sản phẩm!");
      return;
    }

    const quantityDiff = newQuantity - product.soLuong;

    try {
      if (quantityDiff > 0) {
        const currentProduct = productList.find((p) => p.id === chiTietId);
        if (!currentProduct || currentProduct.soLuongTon < quantityDiff) {
          messageApi.warning(
            `Chỉ còn ${currentProduct?.soLuongTon || 0} sản phẩm trong kho!`
          );
          setEditingQuantities((prev) => ({
            ...prev,
            [productId]: product.soLuong,
          }));
          return;
        }

        await dispatch(
          giamSoLuong({ id: chiTietId, soLuong: quantityDiff })
        ).unwrap();
      } else if (quantityDiff < 0) {
        await dispatch(
          tangSoLuong({ id: chiTietId, soLuong: Math.abs(quantityDiff) })
        ).unwrap();
      }

      const updatedProducts = invoiceProducts.map((p) => {
        if (getProductKey(p) === productId) {
          const newThanhTien = newQuantity * p.giaBan;
          return {
            ...p,
            soLuong: newQuantity,
            thanhTien: newThanhTien,
          };
        }
        return p;
      });

      setInvoiceProducts(updatedProducts);

      await dispatch(fetchChiTietSanPham()).unwrap();
      messageApi.success(`Cập nhật số lượng thành ${newQuantity}`);
    } catch (error) {
      console.error("Cập nhật số lượng thất bại:", error);
      messageApi.error("Cập nhật số lượng thất bại!");
      setEditingQuantities((prev) => ({
        ...prev,
        [productId]: product.soLuong,
      }));
    }
  };

  const handleQuantityKeyPress = (e, productId) => {
    if (e.key === "Enter") {
      handleApplyQuantity(productId);
    }
  };

  const handleAddProductToInvoice = async (product) => {
    if (!canEditProducts) {
      message.warning("Không thể thêm sản phẩm ở trạng thái hiện tại!");
      return;
    }

    try {
      if (product.soLuongTon <= 0) {
        messageApi.warning("Sản phẩm đã hết hàng!");
        return;
      }

      const productIdToCheck = product.id;

      await dispatch(
        giamSoLuong({ id: productIdToCheck, soLuong: 1 })
      ).unwrap();

      const existingProduct = invoiceProducts.find(
        (p) => p.idChiTietSanPham === productIdToCheck
      );

      let updatedProducts;
      if (existingProduct) {
        updatedProducts = invoiceProducts.map((p) => {
          if (p.idChiTietSanPham === productIdToCheck) {
            return {
              ...p,
              soLuong: p.soLuong + 1,
              thanhTien: (p.soLuong + 1) * p.giaBan,
            };
          }
          return p;
        });
      } else {
        const newProduct = {
          id: null,
          idChiTietSanPham: product.id,
          tenSanPham: product.tenSanPham,
          mauSac: product.tenMauSac,
          kichThuoc: product.tenKichThuoc,
          giaBan: product.giaSauGiam ?? product.giaBan ?? 0,
          soLuong: 1,
          thanhTien: product.giaSauGiam ?? product.giaBan ?? 0,
          anhUrls: product.anhs?.map((a) => a.duongDanAnh) || [],
        };
        updatedProducts = [...invoiceProducts, newProduct];
      }

      const finalProducts = [];
      const productMap = new Map();

      updatedProducts.forEach((p) => {
        const key = p.idChiTietSanPham;
        if (productMap.has(key)) {
          const existing = productMap.get(key);
          existing.soLuong += p.soLuong;
          existing.thanhTien = existing.soLuong * existing.giaBan;
        } else {
          productMap.set(key, { ...p });
        }
      });

      finalProducts.push(...productMap.values());

      console.log(`📊 Kết quả cuối cùng: ${finalProducts.length} sản phẩm`);
      finalProducts.forEach((p) => {
        console.log(`   - ${p.tenSanPham}: ${p.soLuong} cái`);
      });

      setInvoiceProducts(finalProducts);

      setEditingQuantities((prev) => ({
        ...prev,
        [productIdToCheck]: (prev[productIdToCheck] || 0) + 1,
      }));

      await dispatch(fetchChiTietSanPham()).unwrap();
      messageApi.success("Đã thêm sản phẩm vào hóa đơn!");
    } catch (error) {
      console.error("Thêm sản phẩm thất bại:", error);
      messageApi.error("Thêm sản phẩm thất bại! Có thể đã hết hàng.");
    }
  };

  useEffect(() => {
    fetchInvoiceDetail();
    fetchLichSuHoaDon();
    fetchLichSuThanhToan();
    checkCanEdit();
    fetchAllNhanVien();
    getAllPhuongThucThanhToan();
  }, [id]);

  useEffect(() => {
    if (location.state?.refreshData) {
      fetchInvoiceDetail();
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [location.state?.refreshData]);

  const fetchInvoiceDetail = async () => {
    try {
      setLoading(true);

      const response = await hoaDonApi.getDetail(id);

      let invoiceData = response.data?.data || response.data;

      if (!invoiceData || !invoiceData.id) {
        throw new Error("Dữ liệu hóa đơn không hợp lệ");
      }

      setInvoice(invoiceData);
      setTempStatus(invoiceData.trangThai || 0);
      setTempLoaiHoaDon(invoiceData.loaiHoaDon || false);
      checkEditPermissions(invoiceData.trangThai || 0);
      setError(null);
    } catch (err) {
      console.error("❌ Lỗi tải chi tiết hóa đơn:", err);
      console.error("❌ Error response:", err.response);
      console.error("❌ Error message:", err.message);
      setError("Không thể tải thông tin hóa đơn");
    } finally {
      setLoading(false);
    }
  };

  const checkCanEdit = async () => {
    try {
      const res = await hoaDonApi.canEdit(id);
      setCanEdit(res.data?.canEdit || false);
    } catch (error) {
      console.error("Error checking edit permission:", error);
      setCanEdit(false);
    }
  };

  const fetchLichSuHoaDon = async () => {
    try {
      const response = await hoaDonApi.getLichSu(id);
      setLichSuHoaDon(response.data || []);
    } catch (err) {
      console.error("❌ Lỗi tải lịch sử:", err);
      setLichSuHoaDon([]);
    }
  };

  const fetchAllNhanVien = async () => {
    try {
      const res = await fetchNhanVien();
      setNhanVienList(res.data || []);
    } catch (err) {
      console.error("❌ Lỗi tải nhân viên:", err);
    }
  };

  const getAllPhuongThucThanhToan = async () => {
    try {
      const res = await fetchPhuongThuc();
      setPhuongThucList(res.data || []);
    } catch (err) {
      console.error("❌ Lỗi tải phương thức:", err);
    }
  };

  const handlePrint = () => {
    if (!invoice) return;

    const printArea = document.querySelector(".print-area");
    const clone = printArea.cloneNode(true);

    const row = clone.querySelector(".customer-payment-row");
    if (row) {
      row.style.display = "flex";
      row.style.flexDirection = "row";
      row.style.justifyContent = "space-between";
      row.style.alignItems = "stretch";
      row.style.gap = "20px";
      row.style.marginBottom = "20px";

      row.querySelectorAll(".ant-col").forEach((col) => {
        col.style.flex = "1";
        col.style.maxWidth = "48%";
        col.style.width = "48%";
        col.style.boxSizing = "border-box";
        col.style.padding = "0 8px";
      });

      row.querySelectorAll(".ant-card").forEach((card) => {
        card.style.border = "1px solid #ddd";
        card.style.boxShadow = "none";
        card.style.margin = "0";
        card.style.pageBreakInside = "avoid";
      });

      row.querySelectorAll(".ant-card-head").forEach((head) => {
        head.style.padding = "10px 12px";
        head.style.fontSize = "14px";
        head.style.fontWeight = "bold";
      });

      row.querySelectorAll(".ant-card-body").forEach((body) => {
        body.style.padding = "12px";
        body.style.fontSize = "13px";
      });
    }

    const printContent = clone;
    printContent.style.zoom = "0.9";
    printContent.style.transform = "scale(0.9)";
    printContent.style.transformOrigin = "top left";
    printContent.style.width = "calc(100% / 0.9)";

    const printWindow = window.open("", "_blank", "width=1000,height=600");

    printWindow.document.write(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Hóa đơn #${invoice.maHoaDon}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: "Times New Roman", Times, serif, Arial;
      padding: 15mm;
      background: white;
      -webkit-print-color-adjust: exact;
      color-adjust: exact;
    }

    body, .print-area {
      font-size: 14px !important;
      line-height: 1.6 !important;
    }

    h1, h2, h3, .ant-card-head-title {
      font-weight: bold !important;
      color: #333 !important;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
      font-size: 13px;
    }
    th, td {
      border: 1px solid #000;
      padding: 10px 8px;
      text-align: left;
    }
    th {
      background-color: #f5f5f5;
      font-weight: bold;
    }

    .no-print,
    .ant-btn,
    .ant-breadcrumb,
    .ant-table-pagination,
    .ant-modal,
    .ant-modal-mask,
    .history-section {
      display: none !important;
    }

    /* Tóm tắt đơn hàng */
    .ant-card {
      page-break-inside: avoid;
      break-inside: avoid;
      margin-bottom: 16px;
    }

    /* Căn giữa tiêu đề */
    .ant-typography {
      margin: 0 !important;
    }

    @page {
      size: A4 portrait;
      margin: 10mm;
    }

    img {
      max-width: 70px !important;
      height: auto !important;
      image-rendering: -webkit-optimize-contrast;
    }
  </style>
</head>
<body>
  ${printContent.outerHTML}
</body>
</html>
  `);

    printWindow.document.close();

    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
        setTimeout(() => printWindow.close(), 500);
      }, 300);
    };
  };

  const handleSendEmail = () => {
    if (!invoice) return;

    emailForm.setFieldsValue({
      email: invoice.emailKhachHang || "",
      subject: `Hóa đơn #${invoice.maHoaDon}`,
      message: `Kính gửi ${invoice.tenKhachHang},\n\nCảm ơn quý khách đã mua hàng tại cửa hàng chúng tôi.\nĐính kèm là hóa đơn chi tiết cho đơn hàng #${invoice.maHoaDon}.\n\nTrân trọng,\nAutumn Store`,
    });
    setEmailModalVisible(true);
  };

  const handleEmailSubmit = async (values) => {
    try {
      setSendingEmail(true);

      const response = await hoaDonApi.sendEmail(id, {
        email: values.email,
        subject: values.subject,
        message: values.message,
      });

      message.success("✅ Đã gửi email thành công!");
      setEmailModalVisible(false);
      emailForm.resetFields();
    } catch (error) {
      console.error("Lỗi gửi email:", error);
      message.error("❌ Không thể gửi email. Vui lòng thử lại!");
    } finally {
      setSendingEmail(false);
    }
  };

  const handleCancelEmail = () => {
    setEmailModalVisible(false);
    emailForm.resetFields();
  };

  const formatMoney = (amount) => {
    if (!amount && amount !== 0) return "0 ₫";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusTag = (status) => {
    const statusMap = {
      0: { label: "Chờ xác nhận", color: "warning" },
      1: { label: "Chờ giao hàng", color: "processing" },
      2: { label: "Đang giao hàng", color: "cyan" },
      3: { label: "Đã hoàn thành", color: "success" },
      4: { label: "Đã hủy", color: "error" },
    };
    const config = statusMap[status] || {
      label: "Không xác định",
      color: "default",
    };
    return <Tag color={config.color}>{config.label}</Tag>;
  };

  const getTimelineIcon = (hanhDong) => {
    if (hanhDong?.includes("Tạo")) return "📝";
    if (hanhDong?.includes("Cập nhật")) return "✏️";
    if (hanhDong?.includes("Xác nhận")) return "✅";
    if (hanhDong?.includes("Hủy")) return "❌";
    if (hanhDong?.includes("Giao")) return "🚚";
    return "📋";
  };

  const productColumns = [
    {
      title: "Sản phẩm",
      key: "product",
      render: (_, record) => (
        <Space align="start">
          {record.anhUrls && record.anhUrls.length > 0 ? (
            <img
              src={record.anhUrls[0]}
              alt={record.tenSanPham}
              style={{
                width: 60,
                height: 60,
                objectFit: "cover",
                borderRadius: 8,
                border: "1px solid #f0f0f0",
              }}
            />
          ) : (
            <div
              style={{
                width: 60,
                height: 60,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 8,
                border: "1px solid #f0f0f0",
                backgroundColor: "#fafafa",
                color: "#999",
                fontSize: 12,
                textAlign: "center",
                padding: 2,
              }}
            >
              Chưa có ảnh
            </div>
          )}

          <div>
            <div style={{ fontWeight: 500 }}>{record.tenSanPham}</div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              <span>Màu: {record.mauSac || "—"}</span> |{" "}
              <span>Size: {record.kichThuoc || "—"}</span>
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: "Giá bán",
      dataIndex: "giaBan",
      key: "giaBan",
      render: (value) => value.toLocaleString("vi-VN") + " ₫",
    },
    {
      title: "Số lượng",
      dataIndex: "soLuong",
      key: "soLuong",
      render: (value, record) => {
        const productKey = getProductKey(record);
        const currentQuantity = editingQuantities[productKey] ?? value;

        return isEditing ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleDecreaseQuantity(productKey)}
              className="w-6 h-6 flex items-center justify-center bg-gray-200 rounded hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed"
              disabled={currentQuantity <= 1}
            >
              -
            </button>

            <InputNumber
              min={1}
              max={1000}
              value={currentQuantity}
              onChange={(val) => handleQuantityChange(productKey, val)}
              onBlur={() => handleApplyQuantity(productKey)}
              onPressEnter={(e) => handleQuantityKeyPress(e, productKey)}
              style={{
                width: 40,
                textAlign: "center",
              }}
              className="no-spinner"
              size="small"
            />

            <button
              onClick={() => handleIncreaseQuantity(productKey)}
              className="w-6 h-6 flex items-center justify-center bg-gray-200 rounded hover:bg-gray-300"
            >
              +
            </button>
          </div>
        ) : (
          <span>{value}</span>
        );
      },
    },
    {
      title: "Thành tiền",
      dataIndex: "thanhTien",
      key: "thanhTien",
      render: (value) => formatMoney(value || 0),
    },
    ...(isEditing && canEditProducts
      ? [
          {
            title: "Thao tác",
            key: "actions",
            width: 80,
            align: "center",
            render: (_, record) => {
              const productKey = getProductKey(record);

              const handleDelete = async () => {
                // Confirm trước khi xóa (tùy chọn, khuyến khích)
                const confirm = await Modal.confirm({
                  title: "Xóa sản phẩm khỏi hóa đơn?",
                  content: (
                    <div>
                      <p>
                        <strong>{record.tenSanPham}</strong> (x{record.soLuong})
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        Số lượng sẽ được hoàn lại vào tồn kho ngay lập tức.
                      </p>
                    </div>
                  ),
                  okText: "Xóa và hoàn kho",
                  okButtonProps: { danger: true },
                  cancelText: "Hủy",
                });

                if (!confirm) return;

                const chiTietId = getChiTietSanPhamId(record);
                const soLuongXoa = record.soLuong || 1;

                if (!chiTietId) {
                  message.error("Không xác định được sản phẩm!");
                  return;
                }

                try {
                  // BƯỚC 1: Hoàn tồn kho ngay lập tức
                  await dispatch(
                    tangSoLuong({ id: chiTietId, soLuong: soLuongXoa })
                  ).unwrap();

                  // BƯỚC 2: Xóa khỏi danh sách hiển thị
                  setInvoiceProducts((prev) =>
                    prev.filter((p) => getProductKey(p) !== productKey)
                  );

                  // BƯỚC 3: Xóa số lượng đang edit
                  setEditingQuantities((prev) => {
                    const newQty = { ...prev };
                    delete newQty[productKey];
                    return newQty;
                  });

                  message.success(
                    `Đã xóa sản phẩm và hoàn ${soLuongXoa} cái về tồn kho!`
                  );
                } catch (err) {
                  console.error("Lỗi hoàn tồn kho khi xóa:", err);
                  message.error("Không thể hoàn tồn kho. Vui lòng thử lại!");
                }
              };

              return (
                <Button
                  type="text"
                  danger
                  size="small"
                  icon={<TrashIcon size={18} />}
                  onClick={handleDelete}
                  title="Xóa sản phẩm khỏi hóa đơn"
                  className="hover:bg-red-50"
                />
              );
            },
          },
        ]
      : []),
  ];

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f5f5f5",
        }}
      >
        <Space direction="vertical" align="center">
          <Spin size="large" />
          <Text>Đang tải thông tin hóa đơn...</Text>
        </Space>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f5f5f5",
        }}
      >
        <Card style={{ maxWidth: 500, width: "100%" }}>
          <Empty
            description={
              <Space direction="vertical" align="center">
                <Text type="danger" strong style={{ fontSize: 16 }}>
                  {error}
                </Text>
                <Button
                  icon={<ArrowLeftOutlined />}
                  onClick={() => navigate(-1)}
                >
                  Quay lại
                </Button>
              </Space>
            }
          />
        </Card>
      </div>
    );
  }

  if (!invoice) return null;

  const finalTotal = calculateFinalTotal();

  return (
    <>
      {contextHolder}
      <div
        style={{ padding: 24, backgroundColor: "#f5f5f5", minHeight: "100vh" }}
        className="detail-hoadon"
      >
        <div style={{ margin: "0 auto" }} className="print-area">
          <Card className="no-print" style={{ marginBottom: 16 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <Title level={3} style={{ margin: 0 }}>
                  CHI TIẾT ĐƠN HÀNG
                </Title>
                <Text type="secondary">Mã đơn hàng: {invoice?.maHoaDon}</Text>
              </div>
              <Space>
                {isEditing ? (
                  <Space>
                    <div
                      className="flex gap-1 items-center cursor-pointer select-none text-center py-2 px-6 rounded-lg bg-[#E67E22] font-bold text-sm text-white hover:bg-cyan-800 active:bg-cyan-800 shadow transition-colors"
                      onClick={handleSave}
                    >
                      <FloppyDiskIcon size={20} weight="fill" /> Lưu
                    </div>
                    <div
                      className="flex gap-1 items-center cursor-pointer select-none  text-center py-2 px-6 rounded-lg bg-[#777676] font-bold text-sm text-white   hover:bg-red-600 active:bg-rose-900 border  active:border-[#808080] shadow transition-colors"
                      onClick={handleCancelEdit}
                    >
                      <XCircleIcon size={20} weight="fill" /> Hủy
                    </div>
                  </Space>
                ) : canEdit ? (
                  <div
                    onClick={handleEditToggle}
                    className="font-bold text-sm py-2 px-4 min-w-[120px] cursor-pointer select-none text-center rounded-md bg-[#E67E22] text-white hover:bg-amber-600 active:bg-cyan-800 shadow"
                  >
                    Chỉnh sửa
                  </div>
                ) : (
                  <Button icon={<LockOutlined />} disabled>
                    Không thể sửa
                  </Button>
                )}

                <Button icon={<PrinterOutlined />} onClick={handlePrint}>
                  In đơn hàng
                </Button>
                <Button icon={<MailOutlined />} onClick={handleSendEmail}>
                  Gửi email
                </Button>
              </Space>
            </div>
          </Card>

          <Form form={editForm} layout="vertical">
            <Row gutter={16}>
              <Col xs={24} lg={16}>
                <BillInvoiceStatus
                  invoiceId={id}
                  currentStatus={invoice?.trangThai}
                  invoiceData={invoice}
                  isEditing={isEditing}
                  tempStatus={tempStatus}
                  tempLoaiHoaDon={tempLoaiHoaDon}
                  onTempStatusChange={handleTempStatusChange}
                  onLoaiHoaDonChange={handleLoaiHoaDonChange}
                  onStatusChange={(newStatus) => {
                    setInvoice((prev) =>
                      prev ? { ...prev, trangThai: newStatus } : null
                    );
                    fetchInvoiceDetail();
                  }}
                />
                <Row
                  gutter={16}
                  style={{ marginBottom: 16 }}
                  className="customer-payment-row"
                >
                  <Col xs={24} md={12}>
                    <Card
                      title={
                        <div className="flex justify-between items-center">
                          <div>
                            <UserOutlined /> Thông tin khách hàng
                          </div>
                          {isEditing && canEditCustomerInfo && (
                            <div
                              className="cursor-pointer select-none text-center py-2 px-6 rounded-lg bg-[#E67E22] font-bold text-sm text-white hover:bg-amber-600 active:bg-cyan-800 shadow transition-colors"
                              onClick={openAddressModal}
                            >
                              Chọn địa chỉ
                            </div>
                          )}
                        </div>
                      }
                      style={{ height: "100%" }}
                    >
                      <Space
                        direction="vertical"
                        style={{ width: "100%" }}
                        size="small"
                      >
                        <div>
                          <Text type="secondary">Tên khách hàng:</Text>
                          {isEditing && canEditCustomerInfo ? (
                            <Form.Item
                              name="hoTenKhachHang"
                              rules={validationRules.hoTenKhachHang}
                              style={{ marginBottom: 0, marginTop: 4 }}
                            >
                              <Input placeholder="Nhập tên khách hàng..." />
                            </Form.Item>
                          ) : (
                            <div>
                              <Text strong>
                                {invoice?.khachHang?.hoTen ||
                                  invoice?.tenKhachHang ||
                                  "Khách lẻ"}
                              </Text>
                            </div>
                          )}
                        </div>
                        {/* Email */}
                        <div>
                          <Text type="secondary">Email:</Text>
                          {isEditing && canEditCustomerInfo ? (
                            <Form.Item
                              name="emailKhachHang"
                              rules={validationRules.emailKhachHang}
                              style={{ marginBottom: 0, marginTop: 4 }}
                            >
                              <Input placeholder="email@example.com" />
                            </Form.Item>
                          ) : (
                            <div>
                              <Text strong>
                                {invoice?.khachHang?.email ||
                                  invoice?.emailKhachHang ||
                                  "—"}
                              </Text>
                            </div>
                          )}
                        </div>
                        {/* Số điện thoại */}
                        <div>
                          <Text type="secondary">Số điện thoại:</Text>
                          {isEditing && canEditCustomerInfo ? (
                            <Form.Item
                              name="sdtKhachHang"
                              rules={validationRules.sdtKhachHang}
                              style={{ marginBottom: 0, marginTop: 4 }}
                            >
                              <Input placeholder="0912345678" />
                            </Form.Item>
                          ) : (
                            <div>
                              <Text strong>
                                {invoice?.khachHang?.sdt ||
                                  invoice?.sdtKhachHang ||
                                  "—"}
                              </Text>
                            </div>
                          )}
                        </div>
                        <div>
                          <Text type="secondary">Địa chỉ giao hàng:</Text>
                          <Form.Item name="idDiaChi" noStyle>
                            <Input type="hidden" />
                          </Form.Item>
                          {isEditing && canEditCustomerInfo ? (
                            <>
                              <Row gutter={16} style={{ marginTop: 8 }}>
                                <Col span={12}>
                                  <Form.Item
                                    name="thanhPho"
                                    label="Tỉnh/Thành phố"
                                    rules={[
                                      {
                                        required: true,
                                        message: "Chọn tỉnh/thành!",
                                      },
                                    ]}
                                  >
                                    <Select
                                      placeholder="Chọn tỉnh/thành"
                                      onChange={handleTinhChange}
                                      showSearch
                                      optionFilterProp="children"
                                      filterOption={(input, option) =>
                                        (option?.children ?? "")
                                          .toLowerCase()
                                          .includes(input.toLowerCase())
                                      }
                                    >
                                      {tinhList.map((t) => (
                                        <Select.Option key={t.id} value={t.id}>
                                          {t.tenTinh}
                                        </Select.Option>
                                      ))}
                                    </Select>
                                  </Form.Item>
                                </Col>
                                <Col span={12}>
                                  <Form.Item
                                    name="quan"
                                    label="Quận/Huyện"
                                    rules={[
                                      {
                                        required: true,
                                        message: "Chọn quận/huyện!",
                                      },
                                    ]}
                                  >
                                    <Select
                                      placeholder="Chọn quận/huyện"
                                      disabled={!localQuanList.length}
                                      showSearch
                                    >
                                      {localQuanList.map((q) => (
                                        <Select.Option key={q.id} value={q.id}>
                                          {q.tenQuan}
                                        </Select.Option>
                                      ))}
                                    </Select>
                                  </Form.Item>
                                </Col>
                              </Row>

                              <Form.Item
                                name="diaChiCuThe"
                                label="Số nhà, đường"
                                rules={[
                                  {
                                    required: true,
                                    message: "Nhập địa chỉ cụ thể!",
                                  },
                                ]}
                              >
                                <Input placeholder="Nhập số nhà, tên đường..." />
                              </Form.Item>
                            </>
                          ) : (
                            <div style={{ marginTop: 8 }}>
                              <Text strong>
                                {(() => {
                                  if (invoice?.diaChiKhachHang) {
                                    return invoice.diaChiKhachHang;
                                  }

                                  const defaultAddress =
                                    invoice?.khachHang?.diaChi?.find(
                                      (addr) => addr.trangThai === true
                                    );

                                  if (defaultAddress) {
                                    const diaChiCuThe =
                                      defaultAddress.diaChiCuThe || "";
                                    const tenQuan =
                                      defaultAddress.quanHuyen?.tenQuan ||
                                      defaultAddress.tenQuan ||
                                      "";
                                    const tenTinh =
                                      defaultAddress.tinhThanh?.tenTinh ||
                                      defaultAddress.tenTinh ||
                                      "";

                                    return (
                                      [diaChiCuThe, tenQuan, tenTinh]
                                        .filter(Boolean)
                                        .join(", ") ||
                                      "Chưa có địa chỉ chi tiết"
                                    );
                                  }

                                  if (invoice?.khachHang?.diaChi?.length > 0) {
                                    return "Có địa chỉ nhưng chưa đặt mặc định";
                                  }

                                  return invoice?.tenKhachHang?.includes(
                                    "Khách lẻ"
                                  ) || !invoice?.khachHang
                                    ? "Khách lẻ – Nhận tại quầy"
                                    : "Chưa có địa chỉ giao hàng";
                                })()}
                              </Text>
                            </div>
                          )}
                        </div>
                      </Space>
                    </Card>
                  </Col>

                  <Col xs={24} md={12}>
                    <BillOrderInformation />
                  </Col>
                </Row>

                <Card
                  title={
                    <>
                      <div className="flex justify-between items-center">
                        <div>
                          <ShoppingOutlined /> Danh sách sản phẩm chọn
                        </div>
                        {isEditing && canEditProducts && (
                          <div
                            onClick={() => setShowBillProduct((prev) => !prev)}
                            className="cursor-pointer select-none text-center py-2 px-6 rounded-lg bg-[#E67E22] font-bold text-xs text-white hover:bg-amber-600 active:bg-cyan-800 shadow"
                          >
                            {showBillProduct ? "Ẩn sản phẩm" : "Thêm sản phẩm"}
                          </div>
                        )}
                      </div>
                    </>
                  }
                  style={{ marginBottom: 16 }}
                >
                  {invoiceProducts && invoiceProducts.length > 0 ? (
                    <Table
                      columns={productColumns}
                      dataSource={invoiceProducts}
                      rowKey={(record) => getProductKey(record)}
                      pagination={false}
                    />
                  ) : (
                    <Empty description="Không có sản phẩm" />
                  )}
                </Card>

                {showBillProduct && isEditing && canEditProducts && (
                  <div style={{ marginBottom: 16 }}>
                    <BillProduct onAddProduct={handleAddProductToInvoice} />
                  </div>
                )}
                <Card title="Ghi chú của khách" style={{ marginBottom: 16 }}>
                  <div>
                    <Text type="secondary">Ghi chú:</Text>
                    {isEditing && canEditCustomerInfo ? (
                      <Form.Item
                        name="ghiChu"
                        rules={validationRules.ghiChu}
                        style={{ marginBottom: 0, marginTop: 4 }}
                      >
                        <Input.TextArea
                          rows={3}
                          placeholder="Nhập ghi chú..."
                        />
                      </Form.Item>
                    ) : (
                      <div>
                        <Text>{invoice?.ghiChu || "Không có ghi chú"}</Text>
                      </div>
                    )}
                  </div>
                </Card>
              </Col>

              <Col xs={24} lg={8}>
                <Card title="Tóm tắt đơn hàng" style={{ marginBottom: 16 }}>
                  <Space
                    direction="vertical"
                    style={{ width: "100%" }}
                    size="middle"
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <Text>Tạm tính sản phẩm:</Text>
                      <Text strong>
                        {formatMoney(finalTotal.tongTienSanPham)}
                      </Text>
                    </div>

                    {!invoice.loaiHoaDon && finalTotal.phiVanChuyen > 0 && (
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <Text>Phí vận chuyển:</Text>
                        <Text strong>
                          {formatMoney(finalTotal.phiVanChuyen)}
                        </Text>
                      </div>
                    )}

                    {finalTotal.tienGiamGia > 0 && (
                      <>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            color: "#ff4d4f",
                          }}
                        >
                          <Text type="danger">Giảm giá:</Text>
                          <Text type="danger" strong>
                            -{formatMoney(finalTotal.tienGiamGia)}
                          </Text>
                        </div>
                        {finalTotal.phieuGiamGiaInfo && (
                          <div
                            style={{
                              fontSize: "12px",
                              color: "#d4380d",
                              background: "#fff2e8",
                              padding: "4px 8px",
                              borderRadius: 4,
                            }}
                          >
                            Áp dụng:{" "}
                            <strong>
                              {finalTotal.phieuGiamGiaInfo.tenPhieu}
                            </strong>
                            {finalTotal.phieuGiamGiaInfo.maPhieu &&
                              ` (${finalTotal.phieuGiamGiaInfo.maPhieu})`}
                          </div>
                        )}
                      </>
                    )}

                    <Divider style={{ margin: "12px 0" }} />

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <Text strong style={{ fontSize: 18 }}>
                        Tổng cộng:
                      </Text>
                      <Text strong style={{ fontSize: 20, color: "#ff4d4f" }}>
                        {formatMoney(finalTotal.tongTienCuoiCung)}
                      </Text>
                    </div>
                  </Space>
                </Card>

                <Card
                  title={
                    <>
                      <ClockCircleOutlined /> Lịch sử đơn hàng
                    </>
                  }
                  className="history-section"
                >
                  {lichSuHoaDon && lichSuHoaDon.length > 0 ? (
                    <Timeline
                      items={lichSuHoaDon.map((item, index) => ({
                        dot: (
                          <span style={{ fontSize: 18 }}>
                            {getTimelineIcon(item.hanhDong)}
                          </span>
                        ),
                        color: index === 0 ? "green" : "gray",
                        children: (
                          <div>
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                marginBottom: 4,
                              }}
                            >
                              <Text strong>{item.hanhDong}</Text>
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                {formatDate(item.ngayCapNhat)}
                              </Text>
                            </div>
                            {item.moTa && (
                              <Text
                                type="secondary"
                                style={{
                                  fontSize: 13,
                                  display: "block",
                                  marginBottom: 4,
                                }}
                              >
                                {item.moTa}
                              </Text>
                            )}
                            {item.nguoiThucHien && (
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                Người thực hiện:{" "}
                                <Text strong style={{ fontSize: 12 }}>
                                  {item.nguoiThucHien}
                                </Text>
                              </Text>
                            )}
                          </div>
                        ),
                      }))}
                    />
                  ) : (
                    <Timeline
                      items={[
                        {
                          dot: "",
                          children: (
                            <Space>
                              <Text type="secondary">
                                {formatDate(invoice.ngayTao)}
                              </Text>
                              <Text>Đơn hàng được tạo thành công</Text>
                            </Space>
                          ),
                        },
                      ]}
                    />
                  )}
                </Card>
                <BillInvoiceHistory />
              </Col>
            </Row>
          </Form>
        </div>

        <Modal
          title={
            <Space>
              <MailOutlined /> Gửi hóa đơn qua email
            </Space>
          }
          open={emailModalVisible}
          onCancel={handleCancelEmail}
          footer={null}
          width={600}
        >
          <Form form={emailForm} layout="vertical" onFinish={handleEmailSubmit}>
            <Form.Item
              label="Email người nhận"
              name="email"
              rules={[
                { required: true, message: "Vui lòng nhập email!" },
                { type: "email", message: "Email không hợp lệ!" },
              ]}
            >
              <Input
                placeholder="example@email.com"
                prefix={<MailOutlined />}
              />
            </Form.Item>

            <Form.Item
              label="Tiêu đề"
              name="subject"
              rules={[{ required: true, message: "Vui lòng nhập tiêu đề!" }]}
            >
              <Input placeholder="Tiêu đề email" />
            </Form.Item>

            <Form.Item
              label="Nội dung"
              name="message"
              rules={[{ required: true, message: "Vui lòng nhập nội dung!" }]}
            >
              <Input.TextArea rows={6} placeholder="Nội dung email..." />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
              <Space>
                <Button onClick={handleCancelEmail}>Hủy</Button>
                <Button type="primary" htmlType="submit" loading={sendingEmail}>
                  Gửi email
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>

        {addressModalVisible && (
          <Modal
            title={
              <span className="text-xl font-bold">Chọn địa chỉ giao hàng</span>
            }
            open={addressModalVisible}
            onCancel={() => setAddressModalVisible(false)}
            footer={null}
            width={800}
          >
            <Table
              dataSource={customerAddresses}
              rowKey={(record) =>
                record.id ||
                `${record.tinhThanhId}-${record.quanHuyenId}-${record.diaChiCuThe}`
              }
              pagination={false}
              onRow={(record) => ({
                onClick: () => handleSelectAddress(record),
                className: "cursor-pointer hover:bg-blue-50",
              })}
              columns={[
                {
                  title: <strong>Tên địa chỉ</strong>,
                  dataIndex: "tenDiaChi",
                  key: "tenDiaChi",
                  render: (text) => (
                    <span className="font-medium">{text || "—"}</span>
                  ),
                },
                {
                  title: <strong>Tỉnh/Thành phố</strong>,
                  dataIndex: "tinhTen",
                  key: "tinhTen",
                  width: "30%",
                },
                {
                  title: <strong>Quận/Huyện</strong>,
                  dataIndex: "quanTen",
                  key: "quanTen",
                  width: "30%",
                },
                {
                  title: <strong>Số nhà, đường</strong>,
                  dataIndex: "diaChiCuThe",
                  key: "diaChiCuThe",
                  render: (text) => text || "—",
                },
              ]}
            />
            {customerAddresses.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Khách hàng chưa có địa chỉ nào được lưu.
              </div>
            )}
          </Modal>
        )}
      </div>
    </>
  );
};

export default DetailHoaDon;
