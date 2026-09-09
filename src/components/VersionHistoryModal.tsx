import React, { useState } from 'react';
import {
  History,
  RotateCcw,
  X,
  CheckCircle2,
  Clock,
  User,
  Layers,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import { DayInform, VersionSnapshot } from '../types';

interface VersionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  inform: DayInform;
  onRestoreVersion: (snapshot: VersionSnapshot) => void;
}

export const VersionHistoryModal: React.FC<VersionHistoryModalProps> = ({
  isOpen,
  onClose,
  inform,
  onRestoreVersion,
}) => {
  if (!isOpen) return null;

  const history = inform.history || [];
  const [selectedVersionId, setSelectedVersionId] = useState<string>(
    history[0]?.id || ''
  );

  const selectedSnapshot = history.find((v) => v.id === selectedVersionId) || history[0];

  const handleRestore = () => {
    if (!selectedSnapshot) return;
    if (
      window.confirm(
        `[${selectedSnapshot.timestamp}] 버전으로 복구하시겠습니까?\n현재 작성 중인 내용이 해당 시점의 기록으로 변경됩니다.`
      )
    ) {
      onRestoreVersion(selectedSnapshot);
      onClose();
    }
  };

  return (
    <div
      id="version-recovery-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#1c192d]/50 backdrop-blur-xs p-4"
    >
      <div className="bg-white rounded-xl shadow-2xl border border-[#c7c4d8] w-full max-w-5xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="bg-[#2f27ce] text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <History className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold">이전 버전 복구 목록</h2>
              <p className="text-xs text-white/80">
                {inform.date} 인폼의 변경 이력을 확인하고 특정 시점으로 복구할 수 있습니다.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Split view (Version List on Left, Preview on Right) */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-[#c7c4d8]">
          {/* Left: Revision Timeline (5 cols) */}
          <div className="md:col-span-5 flex flex-col h-full overflow-hidden bg-[#f7f1ff]">
            <div className="px-4 py-3 bg-[#ebe5ff] border-b border-[#c7c4d8] text-xs font-bold text-[#1c192d] flex justify-between items-center">
              <span>저장 시점 타임라인 ({history.length})</span>
              <span className="text-[11px] text-[#464555]">최신순</span>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {history.length === 0 ? (
                <p className="text-xs text-[#767587] text-center py-6">
                  저장된 이전 버전이 없습니다.
                </p>
              ) : (
                history.map((snapshot, idx) => {
                  const isSelected = snapshot.id === selectedSnapshot?.id;
                  const isLatest = idx === 0;

                  return (
                    <div
                      key={snapshot.id}
                      onClick={() => setSelectedVersionId(snapshot.id)}
                      className={`p-3 rounded-lg border transition-all cursor-pointer text-xs ${
                        isSelected
                          ? 'bg-white border-[#2f27ce] shadow-xs ring-1 ring-[#2f27ce]'
                          : 'bg-white/70 border-[#c7c4d8] hover:bg-white hover:border-gray-400'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-[#1c192d] flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-[#2f27ce]" />
                          <span>{snapshot.timestamp}</span>
                        </span>
                        {isLatest && (
                          <span className="bg-[#dedcff] text-[#1600ac] text-[10px] font-bold px-1.5 py-0.5 rounded">
                            현재 버전
                          </span>
                        )}
                      </div>

                      <p className="text-[#464555] line-clamp-2 mb-2 font-medium">
                        {snapshot.summary || '정비 내용 갱신'}
                      </p>

                      <div className="flex items-center justify-between text-[11px] text-[#767587] pt-1.5 border-t border-gray-100">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          <span>{snapshot.author}</span>
                        </span>
                        <span>{snapshot.recordCount || snapshot.records?.length || 0}개 항목</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right: Snapshot Preview (7 cols) */}
          <div className="md:col-span-7 flex flex-col h-full overflow-hidden bg-white">
            <div className="px-5 py-3 bg-[#fdf8ff] border-b border-[#c7c4d8] flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-xs font-bold text-[#1c192d]">
                  선택한 시점 데이터 미리보기
                </h3>
                <p className="text-[11px] text-[#767587]">
                  {selectedSnapshot?.timestamp} (작성자: {selectedSnapshot?.author})
                </p>
              </div>

              <button
                id="btn-restore-version-confirm"
                onClick={handleRestore}
                className="bg-[#2f27ce] hover:bg-[#1600ac] text-white px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer active:scale-95"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>이 버전으로 복구</span>
              </button>
            </div>

            {/* Snapshot Record Table */}
            <div className="flex-1 overflow-auto p-4">
              {selectedSnapshot?.records && selectedSnapshot.records.length > 0 ? (
                <table className="w-full text-left border-collapse text-xs border border-[#c7c4d8]">
                  <thead className="bg-[#dedcff] sticky top-0 border-b border-[#c7c4d8] font-bold text-[#1c192d]">
                    <tr>
                      <th className="p-2 border-r border-[#c7c4d8] w-12 text-center">No</th>
                      <th className="p-2 border-r border-[#c7c4d8] w-20">조</th>
                      <th className="p-2 border-r border-[#c7c4d8] w-28">설비 번호</th>
                      <th className="p-2 border-r border-[#c7c4d8]">정비 작업 내용</th>
                      <th className="p-2 w-32">비고</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#c7c4d8]">
                    {selectedSnapshot.records.map((rec, i) => (
                      <tr key={rec.id || i} className="hover:bg-[#f7f1ff]">
                        <td className="p-2 border-r border-[#c7c4d8] text-center text-gray-500">
                          {rec.no || i + 1}
                        </td>
                        <td className="p-2 border-r border-[#c7c4d8] font-semibold text-[#1600ac]">
                          {rec.shift}
                        </td>
                        <td className="p-2 border-r border-[#c7c4d8] font-medium text-gray-800">
                          {rec.equipmentId}
                        </td>
                        <td className="p-2 border-r border-[#c7c4d8] text-gray-700">
                          {rec.workDescription || '-'}
                        </td>
                        <td
                          className={`p-2 ${
                            rec.isRemarkWarning ? 'text-red-600 font-bold' : 'text-gray-500'
                          }`}
                        >
                          {rec.remarks || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-[#767587] py-12">
                  <Layers className="w-10 h-10 text-gray-300 mb-2" />
                  <p>이 스냅샷에 저장된 항목 정보가 없습니다.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-[#ebe5ff] px-6 py-3 border-t border-[#c7c4d8] flex justify-between items-center shrink-0 text-xs">
          <div className="flex items-center gap-1.5 text-[#464555]">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>복구 시 현재 실시간 시트의 데이터가 선택한 시점의 스냅샷으로 덮어씌워집니다.</span>
          </div>

          <button
            onClick={onClose}
            className="border border-[#c7c4d8] bg-white text-[#1c192d] hover:bg-gray-50 px-4 py-1.5 rounded text-xs font-semibold transition-colors cursor-pointer"
          >
            닫기 (메인 복귀)
          </button>
        </div>
      </div>
    </div>
  );
};
