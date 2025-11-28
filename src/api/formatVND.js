export  const formatVND = (value) => {
    if (!value) return "0 đ";
    return new Intl.NumberFormat("vi-VN").format(value) + " đ";
};
