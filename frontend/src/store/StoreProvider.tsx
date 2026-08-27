'use client';

import { ReactNode, useEffect } from 'react';
import { Provider } from 'react-redux';
import { store } from './store';
import { useAppDispatch, useAppSelector } from './hooks';
import { setCredentials, logout, setLoading } from './slices/authSlice';
import api from '../services/api';
import Cookies from 'js-cookie';
import '../i18n';
import { useTranslation } from 'react-i18next';

function AuthInitializer({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { language } = useAppSelector((state) => state.settings);
  const { i18n } = useTranslation();

  useEffect(() => {
    if (i18n.language !== language) {
      i18n.changeLanguage(language);
    }
  }, [language, i18n]);

  useEffect(() => {
    const initAuth = async () => {
      const token = Cookies.get('access_token');
      const refreshToken = Cookies.get('refresh_token');
      if ((token || refreshToken) && !user) {
        try {
          const res = await api.get<any, any>('/auth/profile');
          if (res.success) {
            const profile = res.data;
            const mappedUser = {
              id: profile.id,
              username: profile.username,
              email: profile.email,
              first_name: profile.first_name,
              last_name: profile.last_name,
              role: profile.Role?.role_code || 'NormalUser',
              role_name: profile.Role?.role_name || 'Normal User',
              avatar_url: profile.avatar_url,
            };
            dispatch(setCredentials({ user: mappedUser, access_token: Cookies.get('access_token') || token || '' }));
          } else {
             dispatch(logout());
          }
        } catch (error) {
          dispatch(logout());
        }
      } else if (!token && !refreshToken) {
         dispatch(setLoading(false));
      }
    };
    initAuth();
  }, [dispatch, user]);

  return <>{children}</>;
}

export default function StoreProvider({ children }: { children: ReactNode }) {
  return (
    <Provider store={store}>
      <AuthInitializer>{children}</AuthInitializer>
    </Provider>
  );
}
