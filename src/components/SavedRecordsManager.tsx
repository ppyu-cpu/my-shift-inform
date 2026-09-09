import React, { useState, useEffect } from 'react';
import {
  Database,
  Search,
  Filter,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  ExternalLink,
  RefreshCw,
  Trash2,
  Paperclip,
  Eye,
  X,
  Wrench,
  Check,
  ChevronRight,
} from 'lucide-react';
import { MaintenanceRecord, ShiftType, WorkStatusType, FileAttachment } from '../types';
import {
  fetchAllRecordsFromFirebase,
  saveRecordToFirebase,
  deleteRecordFromFirebase,
} from '../services/firebaseService';

interface SavedRecordsManagerProps {
  onJumpToDateSheet: (date: string, recordId: string, shift: ShiftType) => void;
  onShowToast: (msg: string) => void;
  onClose: () => void;
}

export const SavedRecordsManager: React.FC<SavedRecordsManagerProps> = ({
  onJumpToDateSheet,
  onShowToast,
  onClose,
}) => {
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | WorkStatusType>('ALL');
  const [shiftFilter, setShiftFilter] = useState<ShiftType | 'ALL'>('ALL');
  const [previewAttachment, setPreviewAttachment] = useState<FileAttachment | null>(null);

  const loadRecords = async () => {
    setLoading(true);
    try {
      const data = await fetchAllRecordsFromFirebase();
      // Sort newest savedAt or date first
      data.sort((a, b) => {
        const timeA = a.savedAt || `${a.date} ${a.time || '00:00'}`;
        const timeB = b.savedAt || `${b.date} ${b.time || '00:00'}`;
        return timeB.localeCompare(timeA);
      });
      setRecords(data);
    } catch (err) {
      console.error('Failed to load records:', err);
      onShowToast('데이터베이스 불러오기 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, []);

  const handleToggleStatus = async (record: MaintenanceRecord) => {
    const newStatus: WorkStatusType = record.workStatus === '완료됨' ? '작성 중' : '완료됨';
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const updated: MaintenanceRecord = {
      ...record,
      workStatus: newStatus,
      savedAt: nowStr,
    };

    setRecords((prev) => prev.map((r) => (r.id === record.id ? updated : r)));

    const success = await saveRecordToFirebase(updated);
    if (success) {
      onShowToast(`[${record.equipmentId}] 정비 상태가 '${newStatus}'(으)로 업데이트되었습니다.`);
    } else {
      onShowToast('Firebase 저장 중 문제가 발생했습니다.');
    }
  };

  const handleDeleteRecord = async (record: MaintenanceRecord) => {
    if (!window.confirm(`설비 [${record.equipmentId}] 정비 기록을 Firebase에서 영구 삭제하시겠습니까?`)) {
      return;
    }
    const success = await deleteRecordFromFirebase(record.id, record.date);
    if (success) {
      setRecords((prev) => prev.filter((r) => r.id !== record.id));
      onShowToast(`[${record.equipmentId}] 정비 기록이 삭제되었습니다.`);
    } else {
      onShowToast('삭제 처리 실패');
    }
  };

  const filteredRecords = records.filter((r) => {
    if (statusFilter !== 'ALL' && (r.workStatus || '작성 중') !== statusFilter) {
      return false;
    }
    if (shiftFilter !== 'ALL' && r.shift !== shiftFilter) {
      return false;
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchEquip = (r.equipmentId || '').toLowerCase().includes(q);
      const matchDesc = (r.workDescription || '').toLowerCase().includes(q);
      const matchAuthor = (r.author || '').toLowerCase().includes(q);
      const matchDate = (r.date || '').toLowerCase().includes(q);
      const matchRemarks = (r.remarks || '').toLowerCase().includes(q);
      return matchEquip || matchDesc || matchAuthor || matchDate || matchRemarks;
    }
    return true;
  });

  const completedCount = records.filter((r) => r.workStatus === '완료됨').length;
  const inProgressCount = records.filter((r) => (r.workStatus || '작성 중') === '작성 중').length;

  return (
    <div className="flex-1 flex flex-col h-full bg-[#fdf8ff] overflow-hidden">
      {/* Top Header */}
      <div className="bg-white border-b border-[#c7c4d8] px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-[#ebe5ff] text-[#2f27ce] rounded-lg">
              <Database className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-[#1c192d]">
              Firebase 정비 예약 및 인폼 저장 대장
            </h1>
            <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Firestore 연결됨
            </span>
          </div>
          <p className="text-xs text-[#767587] mt-1">
            인폼 작성 화면에서 저장된 일자, 교대조, 설비번호, 정비내용, 첨부파일 및 작업 상태(작성 중/완료됨)를 실시간으로 조회하고 관리합니다.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadRecords}
            disabled={loading}
            className="px-3 py-1.5 text-xs bg-white border border-[#c7c4d8] text-[#1c192d] hover:bg-[#f4f2ff] rounded font-medium flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
            title="Firebase 데이터 새로고침"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>새로고침</span>
          </button>
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs bg-[#2f27ce] text-white hover:bg-[#1600ac] rounded font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <span>인폼 시트로 복귀</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="px-6 py-3 bg-[#f7f1ff] border-b border-[#c7c4d8] grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-white p-3 rounded-lg border border-[#c7c4d8] shadow-2xs">
          <span className="text-gray-500 block text-[11px]">총 저장 기록</span>
          <span className="text-lg font-bold text-[#1c192d]">{records.length}건</span>
        </div>
        <div className="bg-white p-3 rounded-lg border border-[#c7c4d8] shadow-2xs">
          <span className="text-amber-600 block text-[11px] flex items-center gap-1">
            <Clock className="w-3 h-3" /> 작성 중 (진행)
          </span>
          <span className="text-lg font-bold text-amber-700">{inProgressCount}건</span>
        </div>
        <div className="bg-white p-3 rounded-lg border border-[#c7c4d8] shadow-2xs">
          <span className="text-emerald-600 block text-[11px] flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> 정비 완료
          </span>
          <span className="text-lg font-bold text-emerald-700">{completedCount}건</span>
        </div>
        <div className="bg-white p-3 rounded-lg border border-[#c7c4d8] shadow-2xs">
          <span className="text-gray-500 block text-[11px]">완료율</span>
          <span className="text-lg font-bold text-[#2f27ce]">
            {records.length > 0 ? Math.round((completedCount / records.length) * 100) : 0}%
          </span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="px-6 py-3 bg-white border-b border-[#c7c4d8] flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-1 min-w-[240px] max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="설비번호, 정비내용, 담당자, 일자 검색..."
              className="w-full pl-9 pr-3 py-1.5 bg-[#fdf8ff] border border-[#c7c4d8] rounded text-xs outline-none focus:border-[#2f27ce]"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Status Filter */}
          <div className="flex items-center gap-1 border border-[#c7c4d8] rounded bg-[#fdf8ff] p-0.5">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer ${
                statusFilter === 'ALL'
                  ? 'bg-[#2f27ce] text-white shadow-2xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              전체 ({records.length})
            </button>
            <button
              onClick={() => setStatusFilter('작성 중')}
              className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer ${
                statusFilter === '작성 중'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'text-gray-600 hover:text-amber-700'
              }`}
            >
              작성 중 ({inProgressCount})
            </button>
            <button
              onClick={() => setStatusFilter('완료됨')}
              className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer ${
                statusFilter === '완료됨'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-gray-600 hover:text-emerald-700'
              }`}
            >
              완료됨 ({completedCount})
            </button>
          </div>

          {/* Shift Filter */}
          <select
            value={shiftFilter}
            onChange={(e) => setShiftFilter(e.target.value as ShiftType | 'ALL')}
            className="px-2.5 py-1.5 border border-[#c7c4d8] rounded bg-[#fdf8ff] text-xs outline-none text-gray-700"
          >
            <option value="ALL">전체 교대조</option>
            <option value="DAY">DAY (주간)</option>
            <option value="SW">SW (오후)</option>
            <option value="GY">GY (야간)</option>
          </select>
        </div>
      </div>

      {/* Main Records List / Table */}
      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-500">
            <RefreshCw className="w-8 h-8 text-[#2f27ce] animate-spin mb-3" />
            <p className="font-semibold text-sm">Firebase 데이터베이스에서 정비 예약 내역을 불러오는 중...</p>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="text-center py-20 bg-white border border-[#c7c4d8] rounded-xl p-8">
            <AlertCircle className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-gray-700">해당 조건의 저장된 정비 내역이 없습니다.</p>
            <p className="text-xs text-gray-500 mt-1">
              상단 [인폼 작성] 버튼을 클릭하여 새로운 정비 인폼을 데이터베이스에 등록해 보세요.
            </p>
          </div>
        ) : (
          <div className="bg-white border border-[#c7c4d8] rounded-xl shadow-xs overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#ebe5ff] text-[#1600ac] font-bold border-b border-[#c7c4d8]">
                  <th className="px-3 py-2.5 w-12 text-center">No</th>
                  <th className="px-3 py-2.5 w-24">작업 상태</th>
                  <th className="px-3 py-2.5 w-28">일자 / 시간</th>
                  <th className="px-3 py-2.5 w-20">교대조</th>
                  <th className="px-3 py-2.5 w-28">설비 번호</th>
                  <th className="px-4 py-2.5">정비 작업 내용</th>
                  <th className="px-3 py-2.5 w-36">첨부파일 / 사진</th>
                  <th className="px-3 py-2.5 w-32">비고</th>
                  <th className="px-3 py-2.5 w-36">저장 시점 (DB)</th>
                  <th className="px-3 py-2.5 w-28 text-center">액션</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#c7c4d8]">
                {filteredRecords.map((record, index) => {
                  const isCompleted = record.workStatus === '완료됨';
                  return (
                    <tr
                      key={record.id}
                      className="hover:bg-[#f7f1ff] transition-colors"
                    >
                      {/* No */}
                      <td className="px-3 py-3 text-center font-bold text-gray-500">
                        {index + 1}
                      </td>

                      {/* Work Status Badge with Toggle */}
                      <td className="px-3 py-3">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(record)}
                          className={`px-2 py-1 rounded text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all border ${
                            isCompleted
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                              : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                          }`}
                          title="클릭하여 상태 변경"
                        >
                          {isCompleted ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                              <span>완료됨</span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3 text-amber-600 shrink-0" />
                              <span>작성 중</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Date & Time */}
                      <td className="px-3 py-3 font-semibold text-[#1c192d] whitespace-nowrap">
                        <div>{record.date}</div>
                        <div className="text-[11px] text-gray-500 font-normal">
                          {record.time || '시간 미지정'}
                        </div>
                      </td>

                      {/* Shift */}
                      <td className="px-3 py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            record.shift === 'DAY'
                              ? 'bg-blue-100 text-blue-800'
                              : record.shift === 'SW'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}
                        >
                          {record.shift}
                        </span>
                      </td>

                      {/* Equipment ID */}
                      <td className="px-3 py-3 font-bold text-[#1600ac] whitespace-nowrap">
                        {record.equipmentId}
                      </td>

                      {/* Work Description */}
                      <td className="px-4 py-3 text-[#1c192d] max-w-xs">
                        <p className="line-clamp-2 leading-relaxed font-medium">
                          {record.workDescription || '(정비 내용 없음)'}
                        </p>
                        {record.author && (
                          <span className="text-[11px] text-gray-400 mt-0.5 block">
                            작성: {record.author}
                          </span>
                        )}
                      </td>

                      {/* Attachments / Photos */}
                      <td className="px-3 py-3">
                        {record.attachments && record.attachments.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5 items-center">
                            {record.attachments.map((att, attIdx) => (
                              <button
                                key={att.id || attIdx}
                                type="button"
                                onClick={() => setPreviewAttachment(att)}
                                className="group relative border border-[#c7c4d8] rounded p-1 hover:border-[#2f27ce] bg-white cursor-pointer shadow-2xs flex items-center gap-1"
                                title={`${att.name} (클릭하여 미리보기)`}
                              >
                                {att.dataUrl ? (
                                  <img
                                    src={att.dataUrl}
                                    alt={att.name}
                                    className="w-7 h-7 object-cover rounded"
                                  />
                                ) : (
                                  <Paperclip className="w-3.5 h-3.5 text-[#2f27ce]" />
                                )}
                                <span className="text-[10px] text-gray-700 max-w-[60px] truncate">
                                  {att.name}
                                </span>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-[11px]">첨부 없음</span>
                        )}
                      </td>

                      {/* Remarks */}
                      <td className="px-3 py-3 text-gray-600 text-[11px]">
                        {record.remarks ? (
                          <span
                            className={
                              record.isRemarkWarning
                                ? 'text-red-600 font-semibold flex items-center gap-1'
                                : ''
                            }
                          >
                            {record.isRemarkWarning && <AlertCircle className="w-3 h-3 shrink-0" />}
                            {record.remarks}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>

                      {/* Saved Timestamp */}
                      <td className="px-3 py-3 text-gray-500 font-mono text-[11px] whitespace-nowrap">
                        {record.savedAt || record.date}
                      </td>

                      {/* Action Buttons */}
                      <td className="px-3 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              onJumpToDateSheet(record.date, record.id, record.shift)
                            }
                            className="p-1.5 bg-[#ebe5ff] hover:bg-[#dedcff] text-[#1600ac] rounded cursor-pointer transition-colors font-semibold"
                            title="해당 일자 및 교대조 인폼 시트로 이동"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteRecord(record)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded cursor-pointer transition-colors"
                            title="Firebase에서 삭제"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Attachment / Photo Preview Modal */}
      {previewAttachment && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-[#1c192d]/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-[#c7c4d8] max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95">
            <div className="bg-[#2f27ce] text-white px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Paperclip className="w-4 h-4" />
                <span className="font-bold text-xs truncate max-w-xs">
                  {previewAttachment.name}
                </span>
              </div>
              <button
                onClick={() => setPreviewAttachment(null)}
                className="text-white/80 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 flex flex-col items-center">
              {previewAttachment.dataUrl ? (
                <img
                  src={previewAttachment.dataUrl}
                  alt={previewAttachment.name}
                  className="max-h-96 max-w-full rounded object-contain border border-[#c7c4d8]"
                />
              ) : (
                <div className="py-12 text-center text-gray-500 text-xs">
                  <FileText className="w-12 h-12 text-[#2f27ce] mx-auto mb-2" />
                  <p className="font-semibold">{previewAttachment.name}</p>
                  <p className="text-[11px] text-gray-400 mt-1">
                    {previewAttachment.size || '문서 파일'}
                  </p>
                </div>
              )}
            </div>
            <div className="px-4 py-2.5 bg-[#f7f1ff] border-t border-[#c7c4d8] flex justify-end">
              <button
                onClick={() => setPreviewAttachment(null)}
                className="px-4 py-1.5 bg-[#2f27ce] text-white rounded text-xs font-semibold cursor-pointer"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
