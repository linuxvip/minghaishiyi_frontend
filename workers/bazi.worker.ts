import { calculateBaZi } from '../utils/baziCalc';
import { BaZiChart, CalendarType, Gender } from '../types';

interface WorkerRequest {
  id: number;
  input: {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
    gender: string;
    type: string;
    directData?: unknown;
    useTrueSolarTime?: boolean;
    longitude?: number;
    second?: number;
    timezoneOffset?: number;
    sect?: number;
  };
}

interface WorkerResponse {
  id: number;
  ok: boolean;
  result?: BaZiChart;
  error?: string;
}

const scope = self as unknown as {
  onmessage: ((e: MessageEvent) => void) | null;
  postMessage: (msg: WorkerResponse) => void;
};

scope.onmessage = (e: MessageEvent) => {
  const { id, input } = (e.data || {}) as Partial<WorkerRequest>;
  if (!input || id === undefined) return;
  try {
    const result = calculateBaZi(
      input.year, input.month, input.day, input.hour, input.minute,
      input.gender as Gender, input.type as CalendarType, input.directData,
      input.useTrueSolarTime, input.longitude,
      { second: input.second, timezoneOffset: input.timezoneOffset, sect: input.sect }
    );
    scope.postMessage({ id, ok: true, result });
  } catch (err) {
    scope.postMessage({ id, ok: false, error: err instanceof Error ? err.message : String(err) });
  }
};
