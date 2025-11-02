import React from "react";
import { Modal, Button } from "antd";
import { ExclamationCircleFilled } from "@ant-design/icons";

const ConfirmModal = ({
  open,
  title,
  description,
  confirmText = "Xác nhận",
  cancelText = "Hủy",
  confirmType = "primary",
  confirmDanger = false,
  loading = false,
  onCancel,
  onConfirm,
}) => {
  return (
    <Modal open={open} footer={null} onCancel={onCancel} centered>
      <div className="flex flex-col items-center gap-4 p-4">
        <ExclamationCircleFilled style={{ fontSize: 64, color: "#faad14" }} />
        <h2 className="text-xl font-bold text-center">{title}</h2>
        <div className="text-gray-600 text-center">{description}</div>

        <div className="flex justify-center gap-6 mt-6 w-full">
          <Button
            size="large"
            className="w-40"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelText}
          </Button>
          <Button
            type={confirmType}
            danger={confirmDanger}
            size="large"
            className="w-40"
            loading={loading}
            onClick={onConfirm}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmModal;
