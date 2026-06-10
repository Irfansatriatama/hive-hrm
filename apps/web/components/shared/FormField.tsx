'use client';

import React, { useRef, useState } from 'react';
import * as Lucide from 'lucide-react';

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export function Input({ label, id, name, error, required, className = '', ...props }: FormFieldProps) {
  const errorBorder = error ? 'border-red-500 focus:ring-red-200' : 'border-slate-200 focus:ring-primary/15';

  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={id} className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider select-none">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <input
        id={id}
        name={name || id}
        required={required}
        className={`block w-full px-4 py-2.5 rounded-lg border text-xs text-slate-800 focus:outline-none focus:ring-2 focus:border-primary transition ${errorBorder} ${className}`}
        {...props}
      />
      {error && <p className="text-[10px] text-red-500 font-bold animate-fade-in">{error}</p>}
    </div>
  );
}

interface SelectOption {
  value: string | number;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  error?: string;
}

export function Select({ label, id, name, options = [], error, required, className = '', ...props }: SelectProps) {
  const errorBorder = error ? 'border-red-500 focus:ring-red-200' : 'border-slate-200 focus:ring-primary/15';

  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={id} className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider select-none">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <select
        id={id}
        name={name || id}
        required={required}
        className={`block w-full px-4 py-2.5 rounded-lg border text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:border-primary transition cursor-pointer ${errorBorder} ${className}`}
        {...props}
      >
        {options.map((opt, i) => (
          <option key={i} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-[10px] text-red-500 font-bold animate-fade-in">{error}</p>}
    </div>
  );
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({ label, id, name, error, required, className = '', ...props }: TextareaProps) {
  const errorBorder = error ? 'border-red-500 focus:ring-red-200' : 'border-slate-200 focus:ring-primary/15';

  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={id} className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider select-none">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <textarea
        id={id}
        name={name || id}
        required={required}
        className={`block w-full px-4 py-2.5 rounded-lg border text-xs text-slate-800 focus:outline-none focus:ring-2 focus:border-primary transition resize-y ${errorBorder} ${className}`}
        {...props}
      />
      {error && <p className="text-[10px] text-red-500 font-bold animate-fade-in">{error}</p>}
    </div>
  );
}

interface ToggleProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Toggle({ label, id, name, checked, onChange, className = '', ...props }: ToggleProps) {
  return (
    <label className={`flex items-center gap-3 select-none cursor-pointer ${className}`}>
      <div className="relative">
        <input
          type="checkbox"
          id={id}
          name={name || id}
          checked={checked}
          onChange={onChange}
          className="sr-only peer"
          {...props}
        />
        <div className="block w-10 h-6 bg-slate-250 rounded-full transition duration-200 peer-checked:bg-primary" />
        <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition duration-200 shadow-sm transform peer-checked:translate-x-4" />
      </div>
      {label && <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">{label}</span>}
    </label>
  );
}

interface FileInputProps {
  label?: string;
  id: string;
  name?: string;
  required?: boolean;
  error?: string;
  onChange?: (file: File | null) => void;
  accept?: string;
}

export function FileInput({ label, id, name, required, error, onChange, accept }: FileInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string>('Belum memilih file');
  const errorBorder = error ? 'border-red-500' : 'border-slate-200 hover:border-slate-350';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      setFileName(file.name);
      onChange?.(file);
    } else {
      setFileName('Belum memilih file');
      onChange?.(null);
    }
  };

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider select-none">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <div
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer ${errorBorder} transition relative bg-slate-50/50 hover:bg-slate-50`}
      >
        <input
          type="file"
          id={id}
          name={name || id}
          ref={fileInputRef}
          accept={accept}
          onChange={handleFileChange}
          className="hidden"
        />
        <Lucide.UploadCloud className="w-8 h-8 text-slate-400 mx-auto mb-2" />
        <span className="block text-xs font-semibold text-slate-600">
          Seret file ke sini atau klik untuk mencari
        </span>
        <span className="block text-[10px] text-slate-400 mt-1">
          {fileName}
        </span>
      </div>
      {error && <p className="text-[10px] text-red-500 font-bold animate-fade-in">{error}</p>}
    </div>
  );
}

// Compound component export
const FormField = {
  Input,
  Select,
  Textarea,
  Toggle,
  File: FileInput,
};

export default FormField;
