import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

interface SystemConfig { site_name: string; site_subtitle: string; footer_text: string; qrcode_url: string; avatar_url: string; wx_qrcode_url: string; [key: string]: string; }

const defaults: SystemConfig = { site_name: '命海拾遗', site_subtitle: '探索八字玄机 · 洞悉人生运势', footer_text: 'Ming Hai Shi Yi · 命海拾遗', qrcode_url: '/qrcode.jpg', avatar_url: '/avatar.jpg', wx_qrcode_url: '/wx_qrcode.jpg' };

const ConfigContext = createContext<SystemConfig>(defaults);

export const useConfig = () => useContext(ConfigContext);

// localStorage 缓存：避免每次访问都拉取 /api/system-configs/
const CACHE_KEY = 'mhsy_config_cache';
const CACHE_TTL = 60 * 60 * 1000; // 1 小时

function readCache(): SystemConfig | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { ts, data } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) return null;
    return { ...defaults, ...(data as Partial<SystemConfig>) } as unknown as SystemConfig;
  } catch {
    return null;
  }
}

function writeCache(data: SystemConfig) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data }));
  } catch {
    // localStorage 不可用时静默降级
  }
}

export const ConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<SystemConfig>(() => readCache() || defaults);

  useEffect(() => {
    let cancelled = false;
    axios.get('/api/system-configs/')
      .then(({ data }) => {
        if (cancelled) return;
        setConfig(prev => ({ ...prev, ...data }));
        writeCache({ ...defaults, ...data });
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  return <ConfigContext.Provider value={config}>{children}</ConfigContext.Provider>;
};
