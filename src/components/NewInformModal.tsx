import React, { useState } from 'react';
import {
  X,
  Save,
  Upload,
  Calendar,
  Layers,
  Wrench,
  Paperclip,
  Check,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Image as ImageIcon,
} from 'lucide-react';
import { ShiftType, WorkStatusType, FileAttachment } from '../types';

interface NewInformModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDate: string;
  defaultShift: ShiftType;
  onCreateEntry: (entry: {
    date: string;
    shift: ShiftType;
    equipmentId: string;
    workDescription: string;
    workStatus: WorkStatusType;
    remarks: string;
    author: string;
    savedAt: string;
    attachments: FileAttachment[];
  }) => void;
}

export const NewInformModal: React.FC<NewInformModalProps> = ({
  isOpen,
  onClose,
  defaultDate,
  defaultShift,
  onCreateEntry,
}) => {
  if (!isOpen) return null;

  const [date, setDate] = useState(defaultDate);
  const [shift, setShift] = useState<ShiftType>(defaultShift);
  const [author, setAuthor] = useState('김철수 기사');
  const [equipmentId, setEquipmentId] = useState('');
  const [workDescription, setWorkDescription] = useState('');
  const [workStatus, setWorkStatus] = useState<WorkStatusType>('완료됨');
  const [remarks, setRemarks] = useState('정상 가동 확인');
  const [attachedFiles, setAttachedFiles] = useState<FileAttachment[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const processFile = (file: File) => {
    const isImg = file.type.includes('image');
    const type = isImg ? 'image' : file.type.includes('pdf') ? 'pdf' : 'document';
    const size = `${(file.size / 1024 / 1024).toFixed(1)} MB`;

    if (isImg) {
      const reader = new FileReader();
      reader.onload = () => {
        setAttachedFiles((prev) => [
          ...prev,
          {
            id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            name: file.name,
            type,
            size,
            dataUrl: reader.result as string,
          },
        ]);
      };
      reader.readAsDataURL(file);
    } else {
      setAttachedFiles((prev) => [
        ...prev,
        {
          id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          name: file.name,
          type,
          size,
        },
      ]);
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      Array.from(e.dataTransfer.files).forEach(processFile);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      Array.from(e.target.files).forEach(processFile);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!equipmentId.trim()) {
      alert('설비 번호(호기)를 입력해 주세요.');
      return;
    }
    if (!workDescription.trim()) {
      alert('정비 작업 내용을 입력해 주세요.');
      return;
    }

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

    onCreateEntry({
      date,
      shift,
      equipmentId: equipmentId.trim(),
      workDescription: workDescription.trim(),
      workStatus,
      remarks: remarks.trim(),
      author,
      savedAt: nowStr,
      attachments: attachedFiles,
    });
    onClose();
  };

  return (
    <div
      id="new-inform-modal-overlay"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#1c192d]/45 backdrop-blur-xs p-4 overflow-y-auto"
    >
      <div className="bg-white rounded-xl shadow-2xl border border-[#c7c4d8] w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8">
        {/* Modal Header */}
        <div className="bg-[#2f27ce] text-white px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-white" />
            <div>
              <h2 className="text-base font-bold">새 정비 인폼 작성</h2>
              <p className="text-[11px] text-white/80">
                입력하신 정보와 첨부파일은 Firebase 데이터베이스에 실시간 영구 보관됩니다.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="hover:bg-white/10 rounded-full p-1 transition-colors cursor-pointer text-white/80 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Date */}
            <div>
              <label className="block font-bold text-[#464555] mb-1">일자</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-1.5 border border-[#c7c4d8] rounded bg-[#fdf8ff] focus:border-[#2f27ce] outline-none text-xs"
                required
              />
            </div>

            {/* Shift */}
            <div>
              <label className="block font-bold text-[#464555] mb-1">교대조</label>
              <select
                value={shift}
                onChange={(e) => setShift(e.target.value as ShiftType)}
                className="w-full px-3 py-1.5 border border-[#c7c4d8] rounded bg-[#fdf8ff] focus:border-[#2f27ce] outline-none text-xs font-semibold"
              >
                <option value="DAY">DAY (주간 08:00-16:00)</option>
                <option value="SW">SW (오후 16:00-24:00)</option>
                <option value="GY">GY (야간 00:00-08:00)</option>
              </select>
            </div>

            {/* Author */}
            <div>
              <label className="block font-bold text-[#464555] mb-1">담당 엔지니어</label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full px-3 py-1.5 border border-[#c7c4d8] rounded bg-[#fdf8ff] focus:border-[#2f27ce] outline-none text-xs font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Equipment ID */}
            <div>
              <label className="block font-bold text-[#464555] mb-1">
                설비 번호 (호기) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={equipmentId}
                onChange={(e) => setEquipmentId(e.target.value)}
                placeholder="예: EQ-A1-004, EQ-B2-012"
                className="w-full px-3 py-1.5 border border-[#c7c4d8] rounded bg-[#fdf8ff] focus:border-[#2f27ce] outline-none text-xs font-bold text-[#1600ac]"
                required
              />
            </div>

            {/* Work Status (작성 중 vs 완료됨) */}
            <div>
              <label className="block font-bold text-[#464555] mb-1">
                정비 작업 상태 <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setWorkStatus('작성 중')}
                  className={`flex-1 py-1.5 px-3 rounded border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                    workStatus === '작성 중'
                      ? 'bg-amber-50 border-amber-400 text-amber-800 ring-2 ring-amber-400/30'
                      : 'bg-white border-[#c7c4d8] text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>작성 중 (진행)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setWorkStatus('완료됨')}
                  className={`flex-1 py-1.5 px-3 rounded border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                    workStatus === '완료됨'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/30'
                      : 'bg-white border-[#c7c4d8] text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>완료됨 (정비완료)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Work Description */}
          <div>
            <label className="block font-bold text-[#464555] mb-1">
              정비 내용 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={workDescription}
              onChange={(e) => setWorkDescription(e.target.value)}
              placeholder="정비 작업 내용을 상세히 입력하세요 (예: 컨베이어 벨트 장력 조절 및 모터 윤활유 보충)..."
              rows={3}
              className="w-full px-3 py-1.5 border border-[#c7c4d8] rounded bg-[#fdf8ff] focus:border-[#2f27ce] outline-none text-xs resize-none"
              required
            />
          </div>

          {/* Remarks */}
          <div>
            <label className="block font-bold text-[#464555] mb-1">비고 및 특이사항</label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="예: 정상 가동 확인, 부품 입고 대기 (내일 예정)"
              className="w-full px-3 py-1.5 border border-[#c7c4d8] rounded bg-[#fdf8ff] focus:border-[#2f27ce] outline-none text-xs"
            />
          </div>

          {/* File & Photo Attachment */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-bold text-[#464555]">
                사진 및 파일 첨부 (이미지 미리보기 지원)
              </label>
              <span className="text-[11px] text-gray-400 font-normal">
                {attachedFiles.length}개 파일 첨부됨
              </span>
            </div>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleFileDrop}
              className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center transition-colors cursor-pointer ${
                isDragging
                  ? 'border-[#2f27ce] bg-[#ebe5ff]'
                  : 'border-[#c7c4d8] bg-[#f7f1ff] hover:bg-[#ebe5ff]'
              }`}
            >
              <Upload className="w-8 h-8 text-[#2f27ce] mb-1" />
              <p className="text-xs font-semibold text-[#1c192d]">
                정비 사진 또는 파일을 드래그하거나 선택하여 첨부
              </p>
              <p className="text-[11px] text-[#767587] mt-0.5">
                PNG, JPG, PDF, 문서 지원 (실시간 썸네일 확인 가능)
              </p>
              <label className="mt-2 text-xs bg-white text-[#2f27ce] border border-[#c7c4d8] px-3.5 py-1.5 rounded-md cursor-pointer hover:bg-gray-50 font-semibold shadow-xs">
                파일 및 사진 선택
                <input
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx,.txt"
                  onChange={handleFileInput}
                  className="hidden"
                />
              </label>
            </div>

            {/* Attached file list & Photo previews */}
            {attachedFiles.length > 0 && (
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {attachedFiles.map((file, i) => (
                  <div
                    key={file.id || i}
                    className="flex items-center gap-2 p-2 bg-[#f4f2ff] border border-[#c7c4d8]/60 rounded-lg text-xs"
                  >
                    {file.dataUrl ? (
                      <img
                        src={file.dataUrl}
                        alt={file.name}
                        className="w-10 h-10 object-cover rounded border border-[#c7c4d8] shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-white border border-[#c7c4d8] rounded flex items-center justify-center shrink-0 text-[#2f27ce]">
                        <Paperclip className="w-4 h-4" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[#1c192d] truncate">{file.name}</p>
                      <p className="text-[10px] text-gray-500">{file.size || '파일'}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAttachedFiles(attachedFiles.filter((_, idx) => idx !== i))}
                      className="text-gray-400 hover:text-red-600 p-1 cursor-pointer"
                      title="첨부 파일 삭제"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="bg-[#f7f1ff] -mx-6 -mb-6 px-6 py-3 border-t border-[#c7c4d8] flex items-center justify-between">
            <div className="text-[11px] text-gray-500 flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Firebase Firestore 실시간 저장 준비됨</span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-[#464555] font-semibold hover:bg-gray-200 rounded transition-colors cursor-pointer"
              >
                취소
              </button>
              <button
                type="submit"
                className="bg-[#2f27ce] hover:bg-[#1600ac] text-white rounded px-5 py-2 font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>저장 (DB 반영)</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

