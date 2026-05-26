import axios from 'axios';

export const getFormErrorMessage = (err: unknown): string => {
  if (axios.isAxiosError(err) && err.response?.data) {
    const data = err.response.data;
    if (typeof data === 'string') return data;
    const messages: string[] = [];
    for (const [field, errors] of Object.entries(data as Record<string, unknown>)) {
      if (errors && Array.isArray(errors)) {
        messages.push(`${field}: ${errors.join('、')}`);
      } else if (errors && typeof errors === 'string') {
        messages.push(`${field}: ${errors}`);
      }
    }
    if (messages.length > 0) return messages.join('；');
  }
  return '保存失败，请检查输入数据';
};
