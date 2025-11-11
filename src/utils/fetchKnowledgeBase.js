import {
  fetchAllProducts,
  fetchAllGiamGiaKhachHang,
  fetchPhuongThucThanhToan,
  fetchChiTietSanPhamBySanPhamId,
} from "@/api/ChatBotAPI";

export async function fetchKnowledgeBase() {
  try {
    const products = await fetchAllProducts();
    const discounts = await fetchAllGiamGiaKhachHang();
    const paymentMethods = await fetchPhuongThucThanhToan();

    const productDetails = {};
    for (const p of products) {
      const details = await fetchChiTietSanPhamBySanPhamId(p.id);
      productDetails[p.id] = details;
    }

    return { products, productDetails, discounts, paymentMethods };
  } catch (err) {
    console.error("fetchKnowledgeBase error:", err);
    return {};
  }
}
