import { test, expect } from '@playwright/test';

// 冒烟防护：验证四柱录入整条链路不产生 React 崩溃。
// 历史回归：useMemo 放在 `if (!isOpen) return null;` 之后，关闭弹窗时触发
// "Rendered fewer hooks than expected" 导致整页崩溃——本测试必须拦截此类回归。
const NET_NOISE = /net::|failed to load resource|networkerror|\/api\//i;

// 仅屏蔽后端接口（/api/ 与 /admin-api/ 前缀），避免误伤 /admin/api/* 等源码模块
const isBackendApi = (url: URL) => {
  const p = url.pathname;
  return p.startsWith('/api/') || p.startsWith('/admin-api/');
};
const blockBackend = async (page: import('@playwright/test').Page) => {
  await page.route(isBackendApi, (route) => route.abort());
};

test('四柱录入：开弹窗 → 选齐四柱 → 展示匹配 → 关闭，页面不崩溃', async ({ page }) => {
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  page.on('pageerror', (e) => pageErrors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error' && !NET_NOISE.test(m.text())) consoleErrors.push(m.text());
  });

  // 本地后端可能未启动：屏蔽 API 调用，只测前端交互
  await blockBackend(page);

  await page.goto('/');
  await page.getByRole('button', { name: '排盘' }).click();
  await expect(page.getByText('开始排盘')).toBeVisible();

  await page.getByRole('button', { name: '四柱', exact: true }).click();
  const modal = page.locator('div.fixed.inset-0.z-\\[200\\]');
  await expect(modal.getByText('查找范围：1900-2100')).toBeVisible();

  // 甲子年 → 丙寅月 → 甲子日 → 甲子时（选择后自动跳步）
  await modal.getByText('甲', { exact: true }).click();
  await modal.getByText('子', { exact: true }).last().click();
  await modal.locator('button', { hasText: /^丙寅$/ }).click();
  await modal.getByText('甲', { exact: true }).last().click();
  await modal.getByText('子', { exact: true }).last().click();
  await modal.locator('button', { hasText: /^甲子$/ }).click();

  // 四柱选齐 → 触发 findAllSolarDatesFromBaZi，展示匹配时间列表（甲子丙寅甲子甲子 在 1900-2100 有命中）
  await expect(modal.getByText('匹配时间（1900-2100）')).toBeVisible();
  await expect(modal.getByText('范围内无匹配时间')).toHaveCount(0);

  // 关闭弹窗后页面仍可交互
  await modal.getByRole('button', { name: '取消' }).click();
  await expect(page.getByText('开始排盘')).toBeVisible();

  // 无 React 崩溃：无未捕获页面错误、无 ErrorBoundary 兜底文案、无脏 console 错误
  expect(pageErrors, `pageerror: ${pageErrors.join('\n')}`).toEqual([]);
  await expect(page.getByText('页面出了点问题')).toHaveCount(0);
  expect(consoleErrors, `console.error: ${consoleErrors.join('\n')}`).toEqual([]);
});

test('匹配时间可选：选第 2 条后排盘，结果使用所选时间', async ({ page }) => {
  await blockBackend(page);
  await page.goto('/');
  await page.getByRole('button', { name: '排盘' }).click();
  await expect(page.getByText('开始排盘')).toBeVisible();

  await page.getByRole('button', { name: '四柱', exact: true }).click();
  const modal = page.locator('div.fixed.inset-0.z-\\[200\\]');

  await modal.getByText('丙', { exact: true }).click();
  await modal.getByText('寅', { exact: true }).last().click();
  await modal.locator('button', { hasText: /^庚寅$/ }).click();
  await modal.getByText('壬', { exact: true }).last().click();
  await modal.getByText('午', { exact: true }).last().click();
  await modal.locator('button', { hasText: /^丙午$/ }).click();

  await expect(modal.getByText('匹配时间（1900-2100）')).toBeVisible();

  const items = modal.locator('button', { hasText: '阳历：' });
  expect(await items.count()).toBeGreaterThan(1);
  const secondTime = (await items.nth(1).textContent())!.match(/阳历：(\d{4}-\d{2}-\d{2} \d{2}:\d{2})/)![1];
  await items.nth(1).click();
  await expect(items.nth(1)).toContainText('已选');

  // 清除旁的「确认」关闭弹窗并确认，然后排盘
  await modal.getByRole('button', { name: '确认' }).click();
  await expect(page.getByText('开始排盘')).toBeVisible();
  await page.getByRole('button', { name: '开始排盘' }).click();

  // DIRECT 模式结果头部阳历显示 "(推算) <所选时间>"
  await expect(page.getByText(`(推算) ${secondTime}`)).toBeVisible();
});

test('四柱弹窗反复开关不崩溃（回归：提前 return 后调用 Hook）', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (e) => pageErrors.push(e.message));
  await blockBackend(page);

  await page.goto('/');
  await page.getByRole('button', { name: '排盘' }).click();
  await expect(page.getByText('开始排盘')).toBeVisible();

  for (let i = 0; i < 3; i++) {
    await page.getByRole('button', { name: '四柱', exact: true }).click();
    await expect(page.getByText('查找范围：1900-2100')).toBeVisible();
    await page.locator('div.fixed.inset-0.z-\\[200\\]').getByRole('button', { name: '取消' }).click();
    await expect(page.getByText('开始排盘')).toBeVisible();
  }

  expect(pageErrors, `pageerror: ${pageErrors.join('\n')}`).toEqual([]);
  await expect(page.getByText('页面出了点问题')).toHaveCount(0);
});
