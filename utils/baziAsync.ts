import { BaZiChart, CalendarType, Gender } from '../types';

export interface BaziCalcInput {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  gender: Gender;
  type: CalendarType;
  directData?: any;
  useTrueSolarTime?: boolean;
  longitude?: number;
  second?: number;
  timezoneOffset?: number;
  sect?: number;
}

let worker: Worker | null = null;
let workerFailed = false;
let seq = 0;
const pending = new Map<number, { resolve: (v: BaZiChart) => void; reject: (e: Error) => void }>();

const calcViaWorker = (input: BaziCalcInput): Promise<BaZiChart> => {
  const id = ++seq;
  return new Promise<BaZiChart>((resolve, reject) => {
    pending.set(id, { resolve, reject });
    try {
      worker!.postMessage({ id, input });
    } catch (err) {
      pending.delete(id);
      reject(err instanceof Error ? err : new Error(String(err)));
    }
  });
};

/**
 * 异步排盘：优先在 Web Worker 中计算，避免阻塞主线程；
 * Worker 不可用或出错时，回退到主线程计算（动态 import，不影响首屏 bundle）。
 */
export const calculateBaZiAsync = async (input: BaziCalcInput): Promise<BaZiChart> => {
  if (typeof Worker !== 'undefined' && !workerFailed) {
    try {
      if (!worker) {
        const w = new Worker(new URL('../workers/bazi.worker.ts', import.meta.url), { type: 'module' });
        w.onmessage = (e: MessageEvent) => {
          const { id, ok, result, error } = e.data || {};
          const p = pending.get(id);
          if (!p) return;
          pending.delete(id);
          if (ok) p.resolve(result as BaZiChart);
          else p.reject(new Error(error || '排盘计算失败'));
        };
        w.onerror = (e) => {
          workerFailed = true;
          const errors = Array.from(pending.values());
          pending.clear();
          errors.forEach((p) => p.reject(new Error('排盘 Worker 异常: ' + e.message)));
        };
        worker = w;
      }
      return await calcViaWorker(input);
    } catch (err) {
      console.warn('[bazi] Worker 计算失败，回退到主线程。', err);
    }
  }
  const { calculateBaZi } = await import('./baziCalc');
  return calculateBaZi(
    input.year, input.month, input.day, input.hour, input.minute,
    input.gender, input.type, input.directData,
    input.useTrueSolarTime, input.longitude,
    { second: input.second, timezoneOffset: input.timezoneOffset, sect: input.sect }
  );
};
