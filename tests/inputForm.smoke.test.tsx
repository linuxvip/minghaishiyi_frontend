import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import InputForm from '../components/InputForm';
import { ToastProvider } from '../components/Toast';
import { UserAuthProvider } from '../user/contexts/UserAuthContext';

const renderForm = () =>
  render(
    <ToastProvider>
      <UserAuthProvider>
        <InputForm onCalculate={async () => true} />
      </UserAuthProvider>
    </ToastProvider>
  );

// 月柱/时柱按钮由「干+支」两个 span 组成，getByText 默认只匹配直接文本节点，需按整体 textContent 匹配
const combo = (s: string) => (content: string, el: Element | null) =>
  el?.tagName === 'BUTTON' && el.textContent === s;

// 回归防护：useMemo 等 Hook 被放在 `if (!isOpen) return null;` 之后会触发
// "Rendered fewer hooks than expected"，关闭弹窗时崩溃。此测试反复开合弹窗守护该规则。
describe('InputForm 四柱弹窗冒烟测试', () => {
  it('打开 → 关闭 → 再打开 → 再关闭 不崩溃', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByText('四柱'));
    expect(await screen.findByText('查找范围：1900-2100')).toBeInTheDocument();

    await user.click(screen.getByText('取消'));
    expect(screen.queryByText('查找范围：1900-2100')).not.toBeInTheDocument();

    await user.click(screen.getByText('四柱'));
    expect(await screen.findByText('查找范围：1900-2100')).toBeInTheDocument();

    await user.click(screen.getByText('取消'));
    expect(screen.queryByText('查找范围：1900-2100')).not.toBeInTheDocument();
    expect(screen.getByText('开始排盘')).toBeInTheDocument();
  });

  it('选齐四柱后展示匹配时间列表', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByText('四柱'));

    // 年柱天干 → 年柱地支 → 月柱 → 日柱天干 → 日柱地支 → 时柱（全自动跳步）
    // 选干支后总览格会同步显示，选项区在 DOM 中位于总览之后，用 last() 命中选项按钮
    await user.click(screen.getByText('甲', { exact: true }));
    await user.click(screen.getAllByText('子', { exact: true }).at(-1)!);
    await user.click(screen.getByText(combo('丙寅')));
    await user.click(screen.getAllByText('甲', { exact: true }).at(-1)!);
    await user.click(screen.getAllByText('子', { exact: true }).at(-1)!);
    await user.click(screen.getByText(combo('甲子')));

    // 四柱选齐后触发 findAllSolarDatesFromBaZi，应展示匹配列表而非崩溃
    expect(await screen.findByText('匹配时间（1900-2100）')).toBeInTheDocument();
  });

  it('重选年干时清空年支与月柱，日柱/时柱保留', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByText('四柱'));
    await user.click(screen.getByText('甲', { exact: true }));
    await user.click(screen.getAllByText('子', { exact: true }).at(-1)!);
    await user.click(screen.getByText(combo('丙寅')));
    await user.click(screen.getAllByText('甲', { exact: true }).at(-1)!);
    await user.click(screen.getAllByText('子', { exact: true }).at(-1)!);
    await user.click(screen.getByText(combo('甲子')));
    expect(await screen.findByText('匹配时间（1900-2100）')).toBeInTheDocument();

    // 点总览的年干格跳回 yearGan 步骤，改选「乙」
    const yearCol = screen.getByText('年柱').closest('div.flex') as HTMLElement;
    await user.click(within(yearCol).getAllByRole('button')[0]);
    await user.click(screen.getByText('乙', { exact: true }));

    // 年支、月柱被清空 → 未选齐 → 匹配列表消失
    expect(screen.queryByText('匹配时间（1900-2100）')).not.toBeInTheDocument();

    const monthCol = screen.getByText('月柱').closest('div.flex') as HTMLElement;
    const dayCol = screen.getByText('日柱').closest('div.flex') as HTMLElement;
    const hourCol = screen.getByText('时柱').closest('div.flex') as HTMLElement;
    expect(within(yearCol).getAllByRole('button')[0]).toHaveTextContent('乙');
    expect(within(yearCol).getAllByRole('button')[1]).toHaveTextContent('');
    expect(within(monthCol).getAllByRole('button')[0]).toHaveTextContent('');
    expect(within(monthCol).getAllByRole('button')[1]).toHaveTextContent('');
    expect(within(dayCol).getAllByRole('button')[0]).toHaveTextContent('甲');
    expect(within(dayCol).getAllByRole('button')[1]).toHaveTextContent('子');
    expect(within(hourCol).getAllByRole('button')[0]).toHaveTextContent('甲');
    expect(within(hourCol).getAllByRole('button')[1]).toHaveTextContent('子');
  });

  it('匹配时间可选：选第 2 条后确认，排盘提交所选时间', async () => {
    const user = userEvent.setup();
    let captured: Record<string, unknown> | undefined;
    render(
      <ToastProvider>
        <UserAuthProvider>
          <InputForm onCalculate={async (data) => { captured = data; return true; }} />
        </UserAuthProvider>
      </ToastProvider>
    );

    await user.click(screen.getByText('四柱'));
    // 表单下方「即时局预览」会渲染当前时刻干支（含丙），须将查询限定在弹窗内
    const modal = (await screen.findByText('查找范围：1900-2100')).closest('div.fixed.inset-0') as HTMLElement;
    const m = within(modal);

    await m.getByText('丙', { exact: true }).click();
    await m.getAllByText('寅', { exact: true }).at(-1)!.click();
    await m.getByText(combo('庚寅')).click();
    await m.getAllByText('壬', { exact: true }).at(-1)!.click();
    await m.getAllByText('午', { exact: true }).at(-1)!.click();
    await m.getByText(combo('丙午')).click();

    await m.findByText('匹配时间（1900-2100）');
    const items = m.getAllByRole('button').filter((b) => b.textContent?.includes('阳历：'));
    expect(items.length).toBeGreaterThan(1);

    const secondMatch = items[1].textContent!.match(/阳历：(\d{4}-\d{2}-\d{2} \d{2}:\d{2})/);
    expect(secondMatch).not.toBeNull();

    await user.click(items[1]);
    expect(items[1]).toHaveTextContent('已选');

    // 清除旁的「确认」→ 弹窗关闭
    await m.getByText('确认').click();
    expect(screen.queryByText('查找范围：1900-2100')).not.toBeInTheDocument();

    await user.click(screen.getByText('开始排盘'));
    expect(captured).toBeDefined();
    const ms = (captured!.directData as { matchedSolar?: { year: number; month: number; day: number; hour: number; minute: number } }).matchedSolar;
    expect(ms).toBeDefined();
    const fmt = `${ms!.year}-${String(ms!.month).padStart(2, '0')}-${String(ms!.day).padStart(2, '0')} ${String(ms!.hour).padStart(2, '0')}:${String(ms!.minute).padStart(2, '0')}`;
    expect(fmt).toBe(secondMatch![1]);
  });
});
