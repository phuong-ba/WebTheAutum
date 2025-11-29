import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { Link } from "react-router-dom";

const formatCurrency = (amount) => {
  if (typeof amount !== "number") return amount;
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
};

export default function AllProducts() {
  const [products, setProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const dispatch = useDispatch();
  const { data } = useSelector((state) => state.sanPham);
  useEffect(() => {
    dispatch(fetchSanPham());
  }, [dispatch]);
  useEffect(() => {
    fetch("http://localhost:8080/api/san-pham/customer/trang-chu")
      .then((res) => res.json())
      .then((data) => setProducts(data.data || []))
      .catch((err) => console.error(err));
  }, []);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentProducts = products.slice(indexOfFirstItem, indexOfLastItem);

  const totalPages = Math.ceil(products.length / itemsPerPage);

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-4xl font-bold mb-8 text-center text-gray-800">
        Tất cả sản phẩm
      </h1>

      {/* Grid hiển thị sản phẩm */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {currentProducts.map((item) => (
          <div
            key={item.idSanPham}
            className="bg-white rounded-xl shadow-md overflow-hidden transform hover:scale-105 hover:shadow-xl transition-all duration-300"
          >
            <Link to={`/product/${item.idSanPham}`}>
              <div className="relative">
                <img
                  src={item.anhDaiDien || "https://via.placeholder.com/330x500"}
                  alt={item.tenSanPham}
                  className="w-full h-72 object-cover"
                />
                {/* Badge NEW */}
              </div>
              <div className="p-5 flex flex-col gap-3">
                <h2 className="text-gray-800 font-semibold text-lg line-clamp-2">
                  {item.tenSanPham}
                </h2>
                <div className="text-orange-600 font-bold text-lg">
                  {item.giaMin === item.giaMax
                    ? formatCurrency(item.giaMin)
                    : `${formatCurrency(item.giaMin)} - ${formatCurrency(
                        item.giaMax
                      )}`}
                </div>
                <button className="mt-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition">
                  Xem chi tiết
                </button>
              </div>
            </Link>
          </div>
        ))}
      </div>

      {/* Phân trang */}
      <div className="flex justify-center gap-3 mt-10">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-4 py-2 border rounded-lg disabled:opacity-50 hover:bg-gray-200 transition"
        >
          Trước
        </button>

        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <button
            key={page}
            onClick={() => handlePageChange(page)}
            className={`px-4 py-2 border rounded-lg ${
              page === currentPage
                ? "bg-amber-500 text-white border-amber-500"
                : "hover:bg-gray-200 transition"
            }`}
          >
            {page}
          </button>
        ))}

        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-4 py-2 border rounded-lg disabled:opacity-50 hover:bg-gray-200 transition"
        >
          Sau
        </button>
      </div>
    </div>
  );
}
