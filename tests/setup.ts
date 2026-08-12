import '@testing-library/jest-dom/vitest';

class MemoryStorage implements Storage {
  private m = new Map<string, string>();

  get length(): number {
    return this.m.size;
  }

  clear(): void {
    this.m.clear();
  }

  getItem(key: string): string | null {
    return this.m.has(key) ? this.m.get(key)! : null;
  }

  key(index: number): string | null {
    return [...this.m.keys()][index] ?? null;
  }

  removeItem(key: string): void {
    this.m.delete(key);
  }

  setItem(key: string, value: string): void {
    this.m.set(key, String(value));
  }
}

// jsdom 30 默认不暴露 localStorage，补一个内存实现避免 undefined
if (!globalThis.localStorage) {
  Object.defineProperty(globalThis, 'localStorage', {
    value: new MemoryStorage(),
    configurable: true,
  });
}

// jsdom 未实现 scrollTo / scrollIntoView，日期滚轮组件会调用
if (typeof globalThis.Element !== 'undefined' && !Element.prototype.scrollTo) {
  Element.prototype.scrollTo = () => {};
}
if (typeof globalThis.Element !== 'undefined' && !Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}
