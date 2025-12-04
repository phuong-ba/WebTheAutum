import React, { useEffect, useState } from "react";
import { Alert, Button, Space } from "antd";
import { authService } from "@/services/authService";
import { useNavigate } from "react-router-dom";
import {
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  StopOutlined,
} from "@ant-design/icons";
import { isShiftEnded } from "@/utils/shiftStatusHelper";

/**
 * Component hiển thị trạng thái giao ca cho nhân viên
 * Cảnh báo khi giao ca sắp hết, đã hết, hoặc đã kết thúc
 */
export default function ShiftStatusAlert() {
  const navigate = useNavigate();
  const [shiftStatus, setShiftStatus] = useState(null);
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    const role = authService.getUserRole();
    const isEmployee = role?.trim().toLowerCase() === "nhân viên";

    if (!isEmployee) {
      setShowAlert(false);
      return;
    }

    // Kiểm tra trạng thái giao ca
    const shiftInfo = authService.getShiftInfo();
    const shiftStatus = authService.getShiftStatus();
    const isEnded = isShiftEnded();

    if (isEnded || shiftStatus === "inactive") {
      setShiftStatus("ended");
      setShowAlert(true);
    } else if (shiftStatus === "completed") {
      setShiftStatus("completed");
      setShowAlert(true);
    } else if (shiftStatus === "active") {
      setShiftStatus("active");
      setShowAlert(true);
    } else {
      setShowAlert(false);
    }
  }, []);

  if (!showAlert || !shiftStatus) return null;

  if (shiftStatus === "ended") {
    return (
      <Alert
        type="error"
        showIcon
        icon={<StopOutlined />}
        message="❌ Ca làm việc đã kết thúc"
        description="Bạn đã kết thúc ca làm việc. Không thể sử dụng các chức năng khác cho đến khi bắt đầu ca mới."
        style={{
          position: "fixed",
          top: 20,
          right: 20,
          zIndex: 9999,
          maxWidth: 450,
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
        }}
        action={
          <Space>
            <Button
              size="small"
              danger
              onClick={() => navigate("/admin/changeShifts")}
            >
              Bắt đầu ca mới
            </Button>
            <Button
              size="small"
              type="text"
              onClick={() => setShowAlert(false)}
            >
              Đóng
            </Button>
          </Space>
        }
      />
    );
  }

  if (shiftStatus === "completed") {
    return (
      <Alert
        type="error"
        showIcon
        icon={<ExclamationCircleOutlined />}
        message="⚠️ Giao ca đã kết thúc"
        description="Giao ca của bạn đã kết thúc. Vui lòng bắt đầu giao ca mới để tiếp tục làm việc."
        style={{
          position: "fixed",
          top: 20,
          right: 20,
          zIndex: 9999,
          maxWidth: 400,
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
        }}
        action={
          <Space>
            <Button
              size="small"
              danger
              onClick={() => navigate("/admin/changeShifts")}
            >
              Bắt đầu giao ca
            </Button>
            <Button
              size="small"
              type="text"
              onClick={() => setShowAlert(false)}
            >
              Đóng
            </Button>
          </Space>
        }
      />
    );
  }

  if (shiftStatus === "active") {
    return (
      <Alert
        type="info"
        showIcon
        icon={<ClockCircleOutlined />}
        message="✅ Giao ca đang hoạt động"
        description="Bạn đã bắt đầu giao ca. Nhấp để quản lý giao ca của bạn."
        style={{
          position: "fixed",
          top: 20,
          right: 20,
          zIndex: 9999,
          maxWidth: 400,
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
        }}
        action={
          <Space>
            <Button
              size="small"
              onClick={() => navigate("/admin/changeShifts")}
            >
              Quản lý
            </Button>
            <Button
              size="small"
              type="text"
              onClick={() => setShowAlert(false)}
            >
              Đóng
            </Button>
          </Space>
        }
      />
    );
  }

  return null;
}
