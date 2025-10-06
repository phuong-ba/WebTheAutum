const API = "http://localhost:8080/api/phieu-giam-gia";
const KH_API = "http://localhost:8080/api/khach-hang";

export const getPhieuGiamGia = async () => {
  const res = await fetch(API);
  if (!res.ok) throw new Error("Lỗi khi fetch API");
  return await res.json();
};

export const deletePGG = async (id) => {
  const res = await fetch(`${API}/delete/${id}`, {
    method: "DELETE",
  });
  const erros = await res.text();
  throw new Error("Fail roi" + erros);
};

export const addPGG = async (data) => {
  const res = await fetch(`${API}/add`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return await res.json();
};

export const updatePGG = async (data, id) => {
  console.log("Dữ liệu gửi đi:", data);

  const res = await fetch(`${API}/update/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Lỗi: ${errorText}`);
  }

  return await res.json();
};

export const getPhieuGiamGiaById = async (id) => {
  const res = await fetch(`${API}/detail/${id}`);
  if (!res.ok) throw new Error("Fail roi");
  const result = await res.json();
  return result.data;
};

export const phanTrang = async (page, size) => {
  const res = await fetch(`${API}/phan-trang?pageNo=${page}&pageSize=${size}`);
  if (!res.ok) throw new Error("Lỗi khi fetch API");
  return await res.json();
};

export const updateTrangThai = async (id, trangThai) => {
  const res = await fetch(
    `${API}/update-trang-thai/${id}?trangThai=${trangThai}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
    }
  );
  if (!res.ok) {
    if (!res.ok) throw new Error("Lỗi khi fetch API");
  }
  return await res.json();
};

export const searchPGG = async (keyword) => {
  const res = await fetch(`${API}/search-all?keyword=${keyword}`);
  if (!res.ok) throw new Error("Lỗi khi tìm kiếm");
  return await res.json();
};

export const searchTheoNgay = async (ngayBatDau, ngayKetThuc) => {
  const res = await fetch(
    `${API}/search-by-date?ngayBatDau=${ngayBatDau}&ngayKetThuc=${ngayKetThuc}`
  );
  if (!res.ok) throw new Error("Lỗi khi tìm kiếm theo ngày");
  return await res.json();
};

export const getAllKhachHang = async () => {
  const res = await fetch(KH_API);
  if (!res.ok) {
    const msg = await res.text();
    throw new Error("Lỗi khi lấy danh sách khách hàng: " + msg);
  }
  const result = await res.json();
  return result.data || [];
};

export const getKhachHangIdsByPGGId = async (id) => {
  const res = await fetch(`${API}/khach-hang-id/${id}`);
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error("Lỗi khi lấy danh sách khách hàng: " + errorText);
  }
  const result = await res.json();
  return result.data || [];
};
