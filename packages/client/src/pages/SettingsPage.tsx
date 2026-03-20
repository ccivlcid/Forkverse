import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore.js';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        navigate(`/@${user.username}?tab=profile`, { replace: true });
      } else {
        navigate('/login?redirect=/settings', { replace: true });
      }
    }
  }, [user, isLoading, navigate]);

  return null;
}
