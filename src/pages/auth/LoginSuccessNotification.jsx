import { useEffect } from 'react';
import { notification } from 'antd';
import { CheckCircleFilled, UserOutlined, CrownOutlined } from '@ant-design/icons';

export default function LoginSuccessNotification() {
  const [api, contextHolder] = notification.useNotification();

  useEffect(() => {
    const raw = localStorage.getItem('login_success_data');
    if (!raw) return;

    try {
      const data = JSON.parse(raw);
      const timeDiff = Date.now() - data.timestamp;

      if (timeDiff < 3000) {
        setTimeout(() => {
          const isAdmin = (data.role || '').toLowerCase().includes('quản lý') 
                       || (data.role || '').toLowerCase().includes('admin');

          const roleIcon = isAdmin 
            ? <CrownOutlined style={{ fontSize: 18, color: '#d4a72c' }} />
            : <UserOutlined style={{ fontSize: 18, color: '#1677ff' }} />;

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
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <strong>Vai trò:</strong> {roleIcon} {data.role}
                </div>
              </div>
            ),
            duration: 4,
            placement: 'top',
            style: {
              width: 340,
              borderRadius: 10,
              padding: '14px 16px',
              border: '1px solid #eaeaea',
              boxShadow: '0 6px 20px rgba(0,0,0,0.12)',
              background: '#ffffff',
            },
          });
        }, 300);
      }

      localStorage.removeItem('login_success_data');
    } catch {
      localStorage.removeItem('login_success_data');
    }
  }, [api]);

  return contextHolder;
}
