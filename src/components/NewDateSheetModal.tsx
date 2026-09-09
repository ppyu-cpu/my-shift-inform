import React, { useState } from 'react';
import { Calendar, X, Plus, User } from 'lucide-react';
import { ShiftType } from '../types';

interface NewDateSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingDates: string[];
  onCreateDateSheet: (date: string, shift: ShiftType, author: string, summary: string) => void;
}

export const NewDateSheetModal: React.FC<NewDateSheetModalProps> = ({
  isOpen,
  onClose,
  existingDates,
  onCreateDateSheet,
}) => {
  if (!isOpen) return null;

  // Default to tomorrow or next available date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const [date, setDate] = useState(tomorrowStr);
  const [shift, setShift] = useState<ShiftType>('DAY');
  const [author, setAuthor] = useState('김철수 기사');
  const [summary, setSummary] = useState('신규 교대 점검 및 정기 보전 작업 시작');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) return;
    if (existingDates.includes(date)) {
      if (
        !window.confirm(
          `해당 일자(${date})의 인폼 시트가 이미 존재합니다. 해당 시트로 이동하시겠습니까?`
        )
      ) {
        return;
      }
    }
    onCreateDateSheet(date, shift, author, summary);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-[#1c192d]/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-[#c7c4d8] w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
        <div className="bg-[#1600ac] text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-sm">
            <Calendar className="w-5 h-5" />
            <span>신규 일자 인폼 생성</span>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div>
            <label className="block font-bold text-[#464555] mb-1">
              생성할 인폼 일자 <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full p-2 border border-[#c7c4d8] rounded bg-[#fdf8ff] focus:border-[#1600ac] outline-none text-xs font-semibold"
              required
            />
          </div>

          <div>
            <label className="block font-bold text-[#464555] mb-1">시작 교대조</label>
            <select
              value={shift}
              onChange={(e) => setShift(e.target.value as ShiftType)}
              className="w-full p-2 border border-[#c7c4d8] rounded bg-[#fdf8ff] outline-none"
            >
              <option value="DAY">DAY (주간 08:00 - 16:00)</option>
              <option value="SW">SW (오후 16:00 - 24:00)</option>
              <option value="GY">GY (야간 00:00 - 08:00)</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-[#464555] mb-1">초기 작성자</label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="w-full p-2 border border-[#c7c4d8] rounded bg-[#fdf8ff] outline-none"
              required
            />
          </div>

          <div>
            <label className="block font-bold text-[#464555] mb-1">인폼 요약 / 작업 목표</label>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={2}
              className="w-full p-2 border border-[#c7c4d8] rounded bg-[#fdf8ff] outline-none resize-none"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 border border-[#c7c4d8] rounded text-[#464555] hover:bg-gray-50"
            >
              취소
            </button>
            <button
              type="submit"
              className="bg-[#1600ac] hover:bg-[#2f27ce] text-white font-bold px-4 py-1.5 rounded flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>시트 생성 및 진입</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
