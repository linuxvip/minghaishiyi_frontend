import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { useDebounce } from '../hooks/useDebounce';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  delay?: number;
}

const SearchInput: React.FC<SearchInputProps> = ({ value, onChange, placeholder = '搜索...', delay = 300 }) => {
  const [local, setLocal] = useState(value);
  const debounced = useDebounce(local, delay);

  useEffect(() => {
    onChange(debounced);
  }, [debounced]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setLocal(value);
  }, [value]);

  return (
    <div className="relative">
      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-300" />
      <input
        type="text"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        placeholder={placeholder}
        className="w-56 bg-stone-50 border border-stone-200 rounded-xl py-2 pl-9 pr-3 text-xs font-bold text-stone-700 outline-none focus:ring-2 focus:ring-amber-200 placeholder:text-stone-300"
      />
    </div>
  );
};

export default SearchInput;
