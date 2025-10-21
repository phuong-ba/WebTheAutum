import ExcelJS from "exceljs";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { message } from "antd";

export const downloadTemplate = async () => {
  try {
    const workbook = new ExcelJS.Workbook();
    const mainSheet = workbook.addWorksheet("Mẫu khách hàng");
    const gioiTinhSheet = workbook.addWorksheet("GiớiTinh");

    const headers = [
      "Tên khách hàng",
      "Số điện thoại",
      "Email",
      "Ngày sinh (yyyy-mm-dd) vd: 2000-01-30",
      "Giới tính (1: nam, 0: nữ)",
    ];
    mainSheet.addRow(headers);
    mainSheet.getRow(1).font = { bold: true };
    mainSheet.columns = headers.map(() => ({ width: 25 }));
    mainSheet.getColumn(4).numFmt = "@";
    // === Dữ liệu dropdown cho giới tính ===
    gioiTinhSheet.getCell("A1").value = 1;
    gioiTinhSheet.getCell("A2").value = 0;

    const maxRow = 100;
    for (let i = 2; i <= maxRow; i++) {
      mainSheet.getCell(`E${i}`).dataValidation = {
        type: "list",
        allowBlank: false,
        formulae: ["=GiớiTinh!$A$1:$A$2"],
        showDropDown: true,
      };
    }

    gioiTinhSheet.state = "veryHidden";

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), "MauNhapKhachHang.xlsx");
    message.success("✅ File mẫu đã được tải thành công!");
  } catch (err) {
    console.error(err);
    message.error("❌ Không thể tạo file mẫu Excel.");
  }
};

export const importFromExcel = async (
  file,
  khachHangApi,
  fetchCustomers,
  setLoading
) => {
  if (!file) return;
  try {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(sheet, { defval: "" });

    if (jsonData.length === 0) {
      message.warning("⚠️ File Excel không có dữ liệu!");
      return;
    }

    setLoading(true);

    for (const item of jsonData) {
      const newCustomer = {
        hoTen: item["Tên khách hàng"],
        sdt: item["Số điện thoại"],
        email: item["Email"],
        ngaySinh: item["Ngày sinh (yyyy-mm-dd)"] || null,
        gioiTinh: item["Giới tính (1: nam, 0: nữ)"] == 1,
      };

      await khachHangApi.create(newCustomer);
    }

    message.success("✅ Nhập dữ liệu khách hàng từ Excel thành công!");
    fetchCustomers();
  } catch (err) {
    console.error(err);
    message.error("❌ Lỗi khi nhập file Excel!");
  } finally {
    setLoading(false);
  }
};

// 🔹 3️⃣ XUẤT DANH SÁCH RA EXCEL
export const exportToExcel = async (data) => {
  try {
    const worksheetData = data.map((item) => ({
      "Tên khách hàng": item.hoTen,
      "Số điện thoại": item.sdt,
      Email: item.email,
      "Ngày sinh (yyyy-mm-dd)": item.ngaySinh || "",
      "Giới tính (1: nam, 0: nữ)": item.gioiTinh ? 1 : 0,
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "KhachHang");

    const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buffer]), "DanhSachKhachHang.xlsx");

    message.success("✅ Đã xuất danh sách khách hàng!");
  } catch (err) {
    console.error(err);
    message.error("❌ Xuất Excel thất bại!");
  }
};
