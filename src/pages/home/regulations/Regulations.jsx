import React from "react";

export default function Regulations() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 font-sans text-gray-800">
      <h1 className="text-4xl font-bold text-center mb-10">
        Quy Định & Điều Khoản Cửa Hàng
      </h1>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">1. Giới thiệu</h2>
        <p className="leading-relaxed">
          Chào mừng quý khách đến với website cửa hàng của chúng tôi. Khi truy
          cập và sử dụng website, quý khách đồng ý tuân thủ các quy định và điều
          khoản dưới đây. Chúng tôi có quyền thay đổi, chỉnh sửa hoặc bổ sung
          các điều khoản này mà không cần thông báo trước. Quý khách vui lòng
          kiểm tra định kỳ để cập nhật thông tin mới nhất.
        </p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">2. Quy định mua hàng</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            Quý khách cần cung cấp thông tin chính xác khi đặt hàng (họ tên, địa
            chỉ, số điện thoại, email).
          </li>
          <li>
            Đơn hàng chỉ được xác nhận sau khi chúng tôi liên hệ và quý khách
            thanh toán (nếu áp dụng).
          </li>
          <li>
            Giá sản phẩm được niêm yết trên website, có thể thay đổi mà không
            báo trước.
          </li>
          <li>
            Chúng tôi có quyền từ chối đơn hàng nếu sản phẩm hết hàng hoặc nghi
            ngờ thông tin không chính xác.
          </li>
        </ul>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">3. Chính sách giao hàng</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Giao hàng toàn quốc qua đối tác vận chuyển uy tín.</li>
          <li>
            Thời gian giao hàng: 3-7 ngày tùy khu vực (không tính thứ 7, Chủ
            Nhật và ngày lễ).
          </li>
          <li>
            Phí vận chuyển được tính dựa trên trọng lượng và địa chỉ nhận hàng.
          </li>
          <li>
            Quý khách kiểm tra hàng hóa ngay khi nhận, nếu có vấn đề vui lòng
            liên hệ ngay với nhân viên giao hàng.
          </li>
        </ul>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">
          4. Chính sách đổi trả hàng
        </h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            Đổi trả trong vòng 7-30 ngày kể từ ngày nhận hàng (tùy sản phẩm).
          </li>
          <li>
            Sản phẩm phải còn nguyên tem mác, hộp đựng, chưa qua sử dụng và kèm
            hóa đơn.
          </li>
          <li>
            Đổi trả miễn phí nếu lỗi từ nhà sản xuất (hỏng hóc, sai mẫu mã).
          </li>
          <li>
            Không áp dụng đổi trả với sản phẩm khuyến mãi, hàng giảm giá sâu
            hoặc đồ lót, mỹ phẩm đã mở seal.
          </li>
          <li>
            Chi phí vận chuyển đổi trả do quý khách chịu (trừ trường hợp lỗi từ
            chúng tôi).
          </li>
        </ul>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">5. Chính sách bảo hành</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            Bảo hành theo quy định của nhà sản xuất (thường từ 6-24 tháng tùy
            sản phẩm).
          </li>
          <li>
            Bảo hành lỗi kỹ thuật từ nhà sản xuất, không bảo hành lỗi do sử dụng
            sai cách, thiên tai hoặc tự ý sửa chữa.
          </li>
          <li>
            Quý khách xuất trình hóa đơn và phiếu bảo hành khi yêu cầu bảo hành.
          </li>
          <li>Thời gian xử lý bảo hành: 7-30 ngày tùy trường hợp.</li>
        </ul>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">6. Bảo mật thông tin</h2>
        <p className="leading-relaxed">
          Chúng tôi cam kết bảo mật thông tin cá nhân của quý khách theo quy
          định pháp luật Việt Nam. Thông tin chỉ được sử dụng để xử lý đơn hàng
          và liên lạc với quý khách, không chia sẻ cho bên thứ ba trừ trường hợp
          pháp luật yêu cầu.
        </p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">
          7. Giải quyết tranh chấp
        </h2>
        <p className="leading-relaxed">
          Mọi tranh chấp phát sinh sẽ được giải quyết thông qua thương lượng.
          Nếu không thành, sẽ đưa ra Tòa án có thẩm quyền tại Việt Nam.
        </p>
      </section>
    </div>
  );
}
