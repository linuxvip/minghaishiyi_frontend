import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

interface SystemConfig { site_name: string; site_subtitle: string; footer_text: string; qrcode_url: string; avatar_url: string; wx_qrcode_url: string; [key: string]: string; }

const defaults: SystemConfig = { site_name: '命海拾遗', site_subtitle: '探索八字玄机 · 洞悉人生运势', footer_text: 'Ming Hai Shi Yi · 命海拾遗', qrcode_url: '/qrcode.jpg', avatar_url: '/avatar.jpg', wx_qrcode_url: '/wx_qrcode.jpg' };

const ConfigContext = createContext<SystemConfig>(defaults);

export const useConfig = () => useContext(ConfigContext);

export const ConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<SystemConfig>(defaults);

  useEffect(() => {
    axios.get('/api/system-configs/').then(({ data }) => setConfig(prev => ({ ...prev, ...data }))).catch(() => {});
  }, []);

  return <ConfigContext.Provider value={config}>{children}</ConfigContext.Provider>;
};
