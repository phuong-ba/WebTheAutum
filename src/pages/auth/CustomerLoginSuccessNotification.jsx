import { useEffect } from 'react';
import { notification } from 'antd';
import { CheckCircleFilled, ShoppingOutlined } from '@ant-design/icons';

export default function CustomerLoginSuccessNotification() {
  const [api, contextHolder] = notification.useNotification();

  useEffect(() => {
    const raw = localStorage.getItem('customer_login_success');
    if (!raw) return;

    try {
      const data = JSON.parse(raw);
      const timeDiff = Date.now() - data.timestamp;

      if (timeDiff < 3000) {
        setTimeout(() => {
          api.open({
            message: (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircleFilled style={{ color: '#52c41a', fontSize: 22 }} />
                <span style={{ fontSize: 18, fontWeight: 600 }}>Đăng nhập thành công</span>
              </div>
            ),
            description: (
              <div style={{ marginTop: 6, fontSize: 15, lineHeight: 1.45 }}>
                <div><strong>Xin chào:</strong> {data.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                  <ShoppingOutlined style={{ fontSize: 16, color: '#ff8c00' }} />
                  <span style={{ fontSize: 14, color: '#666' }}>{data.email}</span>
                </div>
              </div>
            ),
            duration: 4,
            placement: 'topRight',
            style: {
              width: 340,
              borderRadius: 12,
              padding: '14px 16px',
              border: '2px solid #ffa940',
              boxShadow: '0 6px 24px rgba(255, 140, 0, 0.2)',
              background: 'linear-gradient(135deg, #fff 0%, #fff8f0 100%)',
            },
          });
        }, 300);
      }

      localStorage.removeItem('customer_login_success');
    } catch {
      localStorage.removeItem('customer_login_success');
    }
  }, [api]);

  return contextHolder;
}