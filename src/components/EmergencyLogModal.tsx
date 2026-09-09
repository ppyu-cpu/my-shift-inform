import React, { useState } from 'react';
import { AlertTriangle, X, Send } from 'lucide-react';
import { ShiftType } from '../types';

interface EmergencyLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitEmergency: (entry: {
    equipmentId: string;
    issue: string;
    shift: ShiftType;
    actionTaken: string;
  }) => void;
}

export const EmergencyLogModal: React.FC<EmergencyLogModalProps> = ({
  isOpen,
  onClose,
  onSubmitEmergency,
}) => {
  if (!isOpen) return null;

  const [equipmentId, setEquipmentId] = useState('');
  const [issue, setIssue] = useState('');
  const [shift, setShift] = useState<ShiftType>('DAY');
  const [actionTaken, setActionTaken] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!equipmentId || !issue) {
      alert('설비 번호와 긴급 이슈 내용을 입력하세요.');
      return;
    }
    onSubmitEmergency({ equipmentId, issue, shift, actionTaken });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-2xl border-2 border-red-500 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
        <div className="bg-red-600 text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-sm">
            <AlertTriangle className="w-5 h-5" />
            <span>Emergency Log (긴급 장애/안전 로그 등록)</span>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
          <div>
            <label className="block font-bold text-gray-700 mb-1">
              장애 설비 번호 <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={equipmentId}
              onChange={(e) => setEquipmentId(e.target.value)}
              placeholder="예: EQ-C3-001 (메인 라인 프레스)"
              className="w-full p-2 border border-red-300 rounded font-bold text-red-600 outline-none focus:ring-1 focus:ring-red-500"
              required
            />
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">교대조</label>
            <select
              value={shift}
              onChange={(e) => setShift(e.target.value as ShiftType)}
              className="w-full p-2 border rounded border-gray-300 outline-none"
            >
              <option value="DAY">DAY (주간)</option>
              <option value="SW">SW (오후)</option>
              <option value="GY">GY (야간)</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">
              발생 상황 및 비상 정지 사유 <span className="text-red-600">*</span>
            </label>
            <textarea
              value={issue}
              onChange={(e) => setIssue(e.target.value)}
              placeholder="과열 경보, 모터 누전, 벨트 절단 등 긴급 발생 상황을 상세히 작성..."
              rows={3}
              className="w-full p-2 border rounded border-gray-300 outline-none resize-none"
              required
            />
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">즉각 조치 사항</label>
            <input
              type="text"
              value={actionTaken}
              onChange={(e) => setActionTaken(e.target.value)}
              placeholder="전원 차단 완료, 안전 밸브 잠금, 제조팀 통보 완료"
              className="w-full p-2 border rounded border-gray-300 outline-none"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 border border-gray-300 rounded text-gray-600 hover:bg-gray-50"
            >
              취소
            </button>
            <button
              type="submit"
              className="bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-1.5 rounded flex items-center gap-1.5 shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>긴급 등록</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
