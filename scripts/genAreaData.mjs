#!/usr/bin/env node
/**
 * 生成 utils/areaData.ts（省→市→区县 三级 + 中心经度）
 *
 * 数据源：simonkuang/cn-pcas-geo 的 xzqh_with_amap_coordinates.json
 *   （民政部行政区划 + 高德开放平台中心点坐标，GCJ-02，99.94% 覆盖，含港澳台）
 *
 * 转换规则：
 *   - 直辖市（京津沪渝）children 直接是区县 → 插入同名“市”节点，保持三级结构
 *   - 省直辖县市（如海南“五指山市*”）作为市级节点展示，去除尾部 `*`
 *   - 区县缺经度 → 用所属市经度；市缺 → 用所属省经度
 *   - 台湾/港澳新数据集无下级 → 保留原手工子级数据
 *
 * 用法：node scripts/genAreaData.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/xzqh_with_amap_coordinates.json'), 'utf8'));
const OUT = path.join(__dirname, '..', 'utils', 'areaData.ts');

// 港澳台：保留原有手工子级（新数据源无其下级区划）
const HK_MC_TW = {
  台湾省: { l: 121.5, c: [
    { n: '台北市', l: 121.5 }, { n: '高雄市', l: 120.31 }, { n: '台中市', l: 120.67 }, { n: '台南市', l: 120.21 },
  ] },
  香港特别行政区: { l: 114.17, c: [{ n: '香港', l: 114.17 }] },
  澳门特别行政区: { l: 113.54, c: [{ n: '澳门', l: 113.54 }] },
};

const DIRECT_CITIES = new Set(['北京市', '天津市', '上海市', '重庆市']);

const r2 = (x) => Math.round(x * 100) / 100;
const clean = (n) => String(n).replace(/\*$/, '');

const leaf = (n, lng, lat) => {
  const parts = [`n: "${n}"`];
  if (lng != null) parts.push(`l: ${r2(lng)}`);
  if (lat != null) parts.push(`lat: ${r2(lat)}`);
  return `{ ${parts.join(', ')} }`;
};
const branch = (n, lng, lat, body) => {
  const parts = [`n: "${n}"`];
  if (lng != null) parts.push(`l: ${r2(lng)}`);
  if (lat != null) parts.push(`lat: ${r2(lat)}`);
  return `{ ${parts.join(', ')}, c: [${body}] }`;
};

function districts(children, flng, flat) {
  return children.map((d) => leaf(clean(d.name), d.center?.longitude ?? flng, d.center?.latitude ?? flat));
}

function cities(children, flng, flat) {
  return children.map((c) => {
    const lng = c.center?.longitude ?? flng;
    const lat = c.center?.latitude ?? flat;
    const sub = c.children || [];
    return sub.length ? branch(clean(c.name), lng, lat, districts(sub, lng, lat).join(', ')) : leaf(clean(c.name), lng, lat);
  });
}

const lines = [];
for (const p of SRC) {
  const name = p.name;
  const pLng = p.center?.longitude ?? 120.0;
  const pLat = p.center?.latitude ?? 34.5;
  const kids = p.children || [];

  if (HK_MC_TW[name]) {
    const h = HK_MC_TW[name];
    lines.push(branch(name, pLng, pLat, h.c.map((x) => leaf(x.n, x.l, undefined)).join(', ')));
  } else if (DIRECT_CITIES.has(name)) {
    lines.push(branch(name, pLng, pLat, branch(name, pLng, pLat, districts(kids, pLng, pLat).join(', '))));
  } else {
    lines.push(branch(name, pLng, pLat, cities(kids, pLng, pLat).join(', ')));
  }
}

// 统计
let prov = 0, city = 0, dist = 0, noLng = 0, noLat = 0;
for (const p of SRC) {
  prov++;
  if (p.center?.longitude == null) noLng++;
  if (p.center?.latitude == null) noLat++;
  const kids = p.children || [];
  const isDirect = DIRECT_CITIES.has(p.name);
  for (const c of kids) {
    city++;
    if (c.center?.longitude == null) noLng++;
    if (c.center?.latitude == null) noLat++;
    if (isDirect) dist++; // 直辖市 children 即区县
    else for (const d of c.children || []) {
      dist++;
      if (d.center?.longitude == null) noLng++;
      if (d.center?.latitude == null) noLat++;
    }
  }
}

const banner = `
export type { AreaNode };
interface AreaNode {
  n: string; // 名称
  l?: number; // 经度
  lat?: number; // 纬度
  c?: AreaNode[]; // 子级
}

/**
 * 中国行政区划及经纬度简表（省→市→区县 三级）
 * 经纬度用于“真太阳时”推算，坐标源：高德开放平台行政区划数据（GCJ-02）。
 * 本文件由 scripts/genAreaData.mjs 自动生成，请勿手改。
 * 统计：${prov} 省级 / ${city} 市级 / ${dist} 区县级；缺经度 ${noLng} 处、缺纬度 ${noLat} 处（已按上级兜底）。
 */
export const CHINA_AREA_DATA: AreaNode[] = [
`;

fs.writeFileSync(OUT, banner + lines.map((l) => `  ${l},`).join('\n') + '\n];\n');

console.log(`✅ 已生成 ${OUT}`);
console.log(`统计: ${prov} 省 / ${city} 市 / ${dist} 区县；缺经度 ${noLng} / 缺纬度 ${noLat}（已兜底）`);
console.log(`文件大小: ${(fs.statSync(OUT).size / 1024).toFixed(1)} KB`);
