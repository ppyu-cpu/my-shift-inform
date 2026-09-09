import React, { useState, useEffect } from 'react';
import {
  Search,
  Calendar,
  Filter,
  Save,
  Download,
  History,
  Paperclip,
  Plus,
  Trash2,
  Image as ImageIcon,
  FileText,
  Home,
  Columns3,
  Rows,
  Upload,
  AlertCircle,
  Clock,
  CheckCircle2,
  Wrench,
  X,
} from 'lucide-react';
import { DayInform, MaintenanceRecord, ShiftType } from '../types';
import { exportToCSV } from '../storage';

interface MainInformSheetProps {
  inform: DayInform;
  availableDates: string[];
  targetShift?: ShiftType;
  onDateChange: (date: string) => void;
  onUpdateInform: (updated: DayInform) => void;
  onOpenVersionHistory: () => void;
  onNavigateToHub: () => void;
  onSearchSubmit: (query: string) => void;
  onShowToast: (msg: string) => void;
  highlightRecordId?: string;
  onClearHighlight?: () => void;
}

export const MainInformSheet: React.FC<MainInformSheetProps> = ({
  inform,
  availableDates,
  targetShift,
  onDateChange,
  onUpdateInform,
  onOpenVersionHistory,
  onNavigateToHub,
  onSearchSubmit,
  onShowToast,
  highlightRecordId,
  onClearHighlight,
}) => {
  const [activeTabShift, setActiveTabShift] = useState<ShiftType>(
    targetShift || inform.activeShift || 'DAY'
  );
  const [viewStyle, setViewStyle] = useState<'tabs' | 'three-columns'>('tabs');
  const [searchInput, setSearchInput] = useState('');
  const [filterEquipment, setFilterEquipment] = useState('');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  // Sync active shift and tab whenever targetShift, highlightRecordId, or inform.date changes
  useEffect(() => {
    let matchedShift: ShiftType | undefined = targetShift;

    if (highlightRecordId) {
      const targetRecord = inform.records.find((r) => r.id === highlightRecordId);
      if (targetRecord) {
        matchedShift = targetRecord.shift;
      }
    }

    if (matchedShift) {
      setActiveTabShift(matchedShift);
      setViewStyle('tabs');
    } else if (inform.activeShift) {
      setActiveTabShift(inform.activeShift);
    }

    if (highlightRecordId) {
      const timer = setTimeout(() => {
        const rowEl = document.getElementById(`record-row-${highlightRecordId}`);
        if (rowEl) {
          rowEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [highlightRecordId, targetShift, inform.date]);

  // File upload helper
  const handleFileUpload = (recordId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImg = file.type.includes('image');
    const type = isImg ? ('image' as const) : file.type.includes('pdf') ? ('pdf' as const) : ('document' as const);
    const size = `${(file.size / 1024 / 1024).toFixed(1)} MB`;

    const attachWithDataUrl = (dataUrl?: string) => {
      const newAttachment = {
        id: `att-${Date.now()}`,
        name: file.name,
        size,
        type,
        dataUrl,
      };

      const updatedRecords = inform.records.map((r) => {
        if (r.id === recordId) {
          return {
            ...r,
            attachments: [...r.attachments, newAttachment],
            savedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
          };
        }
        return r;
      });

      onUpdateInform({
        ...inform,
        records: updatedRecords,
        lastSaved: new Date().toISOString().replace('T', ' ').substring(0, 19),
      });
      onShowToast(`파일 "${file.name}"이 첨부되었습니다.`);
    };

    if (isImg) {
      const reader = new FileReader();
      reader.onload = () => attachWithDataUrl(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      attachWithDataUrl();
    }
    e.target.value = '';
  };

  // Remove attachment
  const handleRemoveAttachment = (recordId: string, attachmentId: string) => {
    const updatedRecords = inform.records.map((r) => {
      if (r.id === recordId) {
        return {
          ...r,
          attachments: r.attachments.filter((a) => a.id !== attachmentId),
        };
      }
      return r;
    });
    onUpdateInform({
      ...inform,
      records: updatedRecords,
    });
  };

  // Cell field change
  const handleCellChange = (
    recordId: string,
    field: keyof MaintenanceRecord,
    value: any
  ) => {
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const updatedRecords = inform.records.map((r) => {
      if (r.id === recordId) {
        const updated = { ...r, [field]: value, savedAt: nowStr };
        if (field === 'remarks') {
          updated.isRemarkWarning =
            value.includes('대기') ||
            value.includes('경보') ||
            value.includes('긴급') ||
            value.includes('이상') ||
            value.includes('주의');
        }
        return updated;
      }
      return r;
    });

    onUpdateInform({
      ...inform,
      records: updatedRecords,
      lastSaved: nowStr,
    });
  };

  // Add new row to current shift
  const handleAddRow = (shift: ShiftType = activeTabShift) => {
    const nowTime = new Date().toTimeString().substring(0, 5);
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const shiftRecords = inform.records.filter((r) => r.shift === shift);
    const newNo = shiftRecords.length + 1;

    const newRecord: MaintenanceRecord = {
      id: `rec-${Date.now()}`,
      no: newNo,
      date: inform.date,
      time: nowTime,
      shift,
      equipmentId: 'EQ-A1-001',
      workDescription: '',
      workStatus: '완료됨',
      savedAt: nowStr,
      author: inform.author || '담당 엔지니어',
      attachments: [],
      remarks: '정상 가동 확인',
      isRemarkWarning: false,
    };

    const updated = {
      ...inform,
      records: [...inform.records, newRecord],
      lastSaved: nowStr,
    };
    onUpdateInform(updated);
    onShowToast(`${shift} 교대조에 새 정비 행이 추가되었습니다.`);
  };

  // Delete row
  const handleDeleteRow = (recordId: string) => {
    const updatedRecords = inform.records.filter((r) => r.id !== recordId);
    onUpdateInform({
      ...inform,
      records: updatedRecords,
    });
    onShowToast('정비 기록 행이 삭제되었습니다.');
  };

  // Manual save with version snapshot
  const handleSaveSheet = () => {
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const snapshot = {
      id: `ver-${Date.now()}`,
      timestamp: nowStr,
      author: inform.author || '김철수 기사',
      shift: activeTabShift,
      summary: `정비 인폼 수동 저장 및 업데이트 (총 ${inform.records.length}건)`,
      recordCount: inform.records.length,
      records: JSON.parse(JSON.stringify(inform.records)),
    };

    const updated: DayInform = {
      ...inform,
      lastSaved: nowStr,
      history: [snapshot, ...inform.history],
    };
    onUpdateInform(updated);
    onShowToast(`정비 인폼이 성공적으로 저장되었습니다. (저장 시점: ${nowStr})`);
  };

  // Export current date CSV
  const handleExportCSV = () => {
    exportToCSV(inform.records, `maintintel_inform_${inform.date}.csv`);
    onShowToast(`${inform.date} 인폼 데이터 엑셀 내보내기가 완료되었습니다.`);
  };

  // Filtered records by shift
  const dayRecords = inform.records.filter((r) => r.shift === 'DAY');
  const swRecords = inform.records.filter((r) => r.shift === 'SW');
  const gyRecords = inform.records.filter((r) => r.shift === 'GY');

  const currentTabRecords = inform.records.filter((r) => {
    if (r.shift !== activeTabShift) return false;
    if (filterEquipment && !r.equipmentId.toLowerCase().includes(filterEquipment.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <div id="main-inform-screen" className="flex-1 flex flex-col bg-[#f7f1ff] overflow-hidden relative">
      {/* Top Filter & Toolbar Bar */}
      <div className="bg-white border-b border-[#c7c4d8] px-4 md:px-8 py-2.5 shrink-0 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-30 shadow-xs">
        <div className="flex flex-1 items-center gap-2 sm:gap-3 min-w-[280px]">
          {/* Breadcrumb / Return to Hub */}
          <button
            onClick={onNavigateToHub}
            className="flex items-center gap-1 text-xs font-semibold text-[#1600ac] hover:bg-[#ebe5ff] px-2.5 py-1.5 rounded transition-colors cursor-pointer border border-[#c7c4d8]"
            title="일자별 인폼 허브로 복귀"
          >
            <Home className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">인폼 허브</span>
          </button>

          {/* Search input to screen 4 */}
          <div className="relative flex-1 max-w-xl">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#767587]" />
            <input
              id="inform-sheet-search"
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchInput.trim()) {
                  onSearchSubmit(searchInput.trim());
                }
              }}
              placeholder="설비 번호, 정비 내용 등 키워드 검색 후 Enter (통합 검색 뷰)..."
              className="w-full pl-9 pr-8 py-1.5 border border-[#c7c4d8] rounded bg-[#fdf8ff] focus:border-[#2f27ce] focus:ring-1 focus:ring-[#2f27ce] outline-none text-xs text-[#1c192d] placeholder-[#767587] transition-all"
            />
            {searchInput && (
              <button
                onClick={() => onSearchSubmit(searchInput)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] bg-[#1600ac] text-white px-1.5 py-0.5 rounded cursor-pointer"
              >
                검색
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Date Picker */}
          <div className="relative flex items-center">
            <Calendar className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#767587] pointer-events-none" />
            <input
              type="date"
              value={inform.date}
              onChange={(e) => onDateChange(e.target.value)}
              className="pl-8 pr-2 py-1.5 border border-[#c7c4d8] rounded bg-white text-xs font-semibold text-[#1c192d] focus:border-[#2f27ce] outline-none cursor-pointer"
            />
          </div>

          {/* View Mode Toggle: Tab View vs 3-Column Parallel View */}
          <div className="border border-[#c7c4d8] rounded flex bg-white text-xs overflow-hidden">
            <button
              onClick={() => setViewStyle('tabs')}
              className={`px-2.5 py-1.5 flex items-center gap-1 font-medium transition-colors cursor-pointer ${
                viewStyle === 'tabs'
                  ? 'bg-[#ebe5ff] text-[#1600ac] font-bold'
                  : 'text-[#464555] hover:bg-gray-50'
              }`}
              title="단일 교대조 탭 뷰 (Image 1)"
            >
              <Rows className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">탭 뷰</span>
            </button>
            <button
              onClick={() => setViewStyle('three-columns')}
              className={`px-2.5 py-1.5 flex items-center gap-1 font-medium transition-colors cursor-pointer border-l border-[#c7c4d8] ${
                viewStyle === 'three-columns'
                  ? 'bg-[#ebe5ff] text-[#1600ac] font-bold'
                  : 'text-[#464555] hover:bg-gray-50'
              }`}
              title="3단 교대조 병렬 그리드 (Image 3/7)"
            >
              <Columns3 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">3단 병렬 뷰</span>
            </button>
          </div>

          {/* Quick Filter */}
          <div className="relative">
            <button
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className="bg-[#ebe5ff] border border-[#c7c4d8] text-[#1c192d] px-2.5 py-1.5 rounded text-xs font-medium hover:bg-[#e5dffc] transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>필터</span>
            </button>

            {showFilterDropdown && (
              <div className="absolute right-0 mt-1 w-60 bg-white border border-[#c7c4d8] rounded-lg shadow-lg p-3 z-50 text-xs">
                <p className="font-bold text-[#1c192d] mb-1.5">설비 번호 필터링</p>
                <input
                  type="text"
                  value={filterEquipment}
                  onChange={(e) => setFilterEquipment(e.target.value)}
                  placeholder="예: EQ-A1, EQ-B2..."
                  className="w-full p-1.5 border border-[#c7c4d8] rounded text-xs mb-2 outline-none"
                />
                {filterEquipment && (
                  <button
                    onClick={() => setFilterEquipment('')}
                    className="text-[11px] text-red-600 hover:underline"
                  >
                    필터 해제
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative pb-12">
        {/* Style A: Tabs View (Matches Image 1) */}
        {viewStyle === 'tabs' ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Shift Tabs */}
            <div className="flex items-center gap-4 px-4 md:px-8 bg-white border-b border-[#c7c4d8] shrink-0">
              {(['DAY', 'SW', 'GY'] as ShiftType[]).map((shift) => {
                const count = inform.records.filter((r) => r.shift === shift).length;
                const isActive = activeTabShift === shift;
                return (
                  <button
                    key={shift}
                    onClick={() => setActiveTabShift(shift)}
                    className={`py-2 px-3 font-bold text-xs flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
                      isActive
                        ? 'text-[#1600ac] border-[#1600ac]'
                        : 'text-[#767587] border-transparent hover:text-[#1c192d]'
                    }`}
                  >
                    <span>{shift}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        isActive ? 'bg-[#dedcff] text-[#1600ac]' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}

              <div className="ml-auto text-xs text-[#767587] flex items-center gap-2">
                <span>담당 기사: <strong>{inform.author}</strong></span>
              </div>
            </div>

            {/* Spreadsheet Table View */}
            <div className="flex-1 overflow-auto p-4 md:p-8">
              {/* Jump from Search Notice Banner */}
              {highlightRecordId && (
                <div className="bg-[#dedcff] border border-[#1600ac]/40 text-[#1600ac] px-4 py-2.5 rounded-lg mb-4 flex items-center justify-between text-xs shadow-xs">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-[#1600ac]" />
                    <span>
                      <strong>검색 원본 항목 펼침 완료:</strong> {inform.date} [{activeTabShift} 조] 시트로 이동하여 해당 정비 내역 행을 열었습니다.
                    </span>
                  </div>
                  {onClearHighlight && (
                    <button
                      onClick={onClearHighlight}
                      className="text-xs bg-white text-[#1600ac] hover:bg-[#ebe5ff] px-2.5 py-1 rounded font-medium border border-[#1600ac]/20 cursor-pointer flex items-center gap-1"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>강조 닫기</span>
                    </button>
                  )}
                </div>
              )}

              <div className="bg-white border border-[#c7c4d8] rounded-xl shadow-xs overflow-hidden flex flex-col h-full">
                <div className="overflow-x-auto flex-1">
                  <table className="w-full text-left border-collapse text-xs min-w-[1000px]">
                    <thead className="bg-[#dedcff] sticky top-0 z-10 border-b border-[#c7c4d8]">
                      <tr className="text-[#1c192d] font-bold">
                        <th className="border-r border-[#c7c4d8] px-3 py-2 w-14 text-center">No.</th>
                        <th className="border-r border-[#c7c4d8] px-3 py-2 w-28 text-center">작업 상태</th>
                        <th className="border-r border-[#c7c4d8] px-3 py-2 w-36">날짜/시간</th>
                        <th className="border-r border-[#c7c4d8] px-3 py-2 w-44">설비 번호(호기)</th>
                        <th className="border-r border-[#c7c4d8] px-3 py-2">정비 작업 내용</th>
                        <th className="border-r border-[#c7c4d8] px-3 py-2 w-52">사진 및 파일 첨부</th>
                        <th className="border-r border-[#c7c4d8] px-3 py-2 w-44">비고</th>
                        <th className="border-r border-[#c7c4d8] px-3 py-2 w-32">저장 시점</th>
                        <th className="px-2 py-2 w-12 text-center">삭제</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#c7c4d8]">
                      {currentTabRecords.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="py-12 text-center text-[#767587]">
                            <p className="mb-2">해당 교대조({activeTabShift})에 등록된 정비 내역이 없습니다.</p>
                            <button
                              onClick={() => handleAddRow(activeTabShift)}
                              className="bg-[#1600ac] text-white px-3 py-1.5 rounded text-xs font-semibold hover:bg-[#2f27ce] cursor-pointer inline-flex items-center gap-1"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>첫 번째 정비 행 추가</span>
                            </button>
                          </td>
                        </tr>
                      ) : (
                        currentTabRecords.map((record, index) => {
                          const isHighlighted = highlightRecordId === record.id;
                          const isCompleted = (record.workStatus || '완료됨') === '완료됨';
                          return (
                            <tr
                              key={record.id}
                              id={`record-row-${record.id}`}
                              className={`transition-all duration-300 ${
                                isHighlighted
                                  ? 'bg-[#dedcff] ring-2 ring-[#1600ac] font-medium shadow-xs'
                                  : index % 2 === 1
                                  ? 'bg-[#fdf8ff] hover:bg-[#f2ecff]'
                                  : 'bg-white hover:bg-[#f7f1ff]'
                              }`}
                            >
                              {/* No */}
                              <td className="border-r border-[#c7c4d8] px-3 py-2 text-center font-medium text-gray-500">
                                {record.no}
                              </td>

                              {/* Work Status with direct toggle */}
                              <td className="border-r border-[#c7c4d8] px-2 py-1.5 text-center">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const next = isCompleted ? '작성 중' : '완료됨';
                                    handleCellChange(record.id, 'workStatus', next);
                                  }}
                                  className={`px-2 py-1 rounded text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer border transition-colors ${
                                    isCompleted
                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                                      : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                                  }`}
                                  title="클릭하여 상태 변경 (작성 중 ↔ 완료됨)"
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

                              {/* Date / Time */}
                              <td className="border-r border-[#c7c4d8] px-3 py-1.5 text-[#464555]">
                                <input
                                  type="text"
                                  value={`${record.date} ${record.time}`}
                                  onChange={(e) => {
                                    const parts = e.target.value.split(' ');
                                    if (parts.length >= 2) {
                                      handleCellChange(record.id, 'time', parts[1]);
                                    }
                                  }}
                                  className="w-full bg-transparent border-b border-transparent hover:border-gray-300 focus:border-[#1600ac] focus:bg-white outline-none px-1 py-0.5 rounded text-xs font-mono"
                                />
                              </td>

                              {/* Equipment ID */}
                              <td className="border-r border-[#c7c4d8] px-3 py-1.5 font-bold text-[#1600ac]">
                                <input
                                  type="text"
                                  value={record.equipmentId}
                                  onChange={(e) =>
                                    handleCellChange(record.id, 'equipmentId', e.target.value)
                                  }
                                  placeholder="EQ-A1-001"
                                  className="w-full bg-transparent border-b border-transparent hover:border-gray-300 focus:border-[#1600ac] focus:bg-white outline-none px-1 py-0.5 rounded text-xs font-semibold"
                                />
                              </td>

                              {/* Work Description */}
                              <td className="border-r border-[#c7c4d8] px-3 py-1.5">
                                <textarea
                                  value={record.workDescription}
                                  onChange={(e) =>
                                    handleCellChange(record.id, 'workDescription', e.target.value)
                                  }
                                  placeholder="정비 작업 내용을 상세히 입력하세요..."
                                  rows={2}
                                  className="w-full bg-transparent border-b border-transparent hover:border-gray-300 focus:border-[#1600ac] focus:bg-white outline-none px-1 py-0.5 rounded text-xs resize-none"
                                />
                              </td>

                              {/* Attachment with photo thumbnail */}
                              <td className="border-r border-[#c7c4d8] px-3 py-1.5">
                                <div className="flex flex-col gap-1.5">
                                  {record.attachments.map((att) => (
                                    <div
                                      key={att.id}
                                      className="flex items-center justify-between gap-1 bg-[#ebe5ff] text-[#1600ac] px-2 py-0.5 rounded border border-[#c7c4d8] text-[11px] group"
                                    >
                                      <div className="flex items-center gap-1.5 truncate max-w-[140px]">
                                        {att.dataUrl ? (
                                          <img
                                            src={att.dataUrl}
                                            alt={att.name}
                                            className="w-4 h-4 object-cover rounded shrink-0 border border-[#c7c4d8]"
                                          />
                                        ) : att.type === 'image' ? (
                                          <ImageIcon className="w-3 h-3 text-[#2f27ce] shrink-0" />
                                        ) : (
                                          <FileText className="w-3 h-3 text-[#2f27ce] shrink-0" />
                                        )}
                                        <span className="truncate font-medium" title={att.name}>
                                          {att.name}
                                        </span>
                                      </div>
                                      <button
                                        onClick={() => handleRemoveAttachment(record.id, att.id)}
                                        className="text-gray-400 hover:text-red-600 cursor-pointer ml-1"
                                        title="첨부 삭제"
                                      >
                                        ✕
                                      </button>
                                    </div>
                                  ))}

                                  <label className="inline-flex items-center gap-1 text-[11px] text-[#767587] hover:text-[#1600ac] cursor-pointer py-0.5">
                                    <Paperclip className="w-3 h-3" />
                                    <span>+ 파일/사진 추가</span>
                                    <input
                                      type="file"
                                      multiple
                                      accept="image/*,.pdf,.doc,.docx,.txt"
                                      onChange={(e) => handleFileUpload(record.id, e)}
                                      className="hidden"
                                    />
                                  </label>
                                </div>
                              </td>

                              {/* Remarks */}
                              <td className="border-r border-[#c7c4d8] px-3 py-1.5">
                                <input
                                  type="text"
                                  value={record.remarks}
                                  onChange={(e) =>
                                    handleCellChange(record.id, 'remarks', e.target.value)
                                  }
                                  placeholder="비고 입력..."
                                  className={`w-full bg-transparent border-b border-transparent hover:border-gray-300 focus:border-[#1600ac] focus:bg-white outline-none px-1 py-0.5 rounded text-xs ${
                                    record.isRemarkWarning
                                      ? 'text-[#ba1a1a] font-bold'
                                      : 'text-[#464555]'
                                  }`}
                                />
                              </td>

                              {/* Saved At (시점) */}
                              <td className="border-r border-[#c7c4d8] px-2.5 py-1.5 text-gray-500 font-mono text-[10px] whitespace-nowrap">
                                {record.savedAt ? (
                                  <div>
                                    <div>{record.savedAt.split(' ')[0]}</div>
                                    <div className="text-gray-400">{record.savedAt.split(' ')[1] || ''}</div>
                                  </div>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>

                              {/* Delete Action */}
                              <td className="px-2 py-1.5 text-center">
                                <button
                                  onClick={() => handleDeleteRow(record.id)}
                                  className="text-gray-400 hover:text-[#ba1a1a] p-1 rounded hover:bg-red-50 transition-colors cursor-pointer"
                                  title="행 삭제"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Table Bottom Action bar */}
                <div className="bg-[#fdf8ff] border-t border-[#c7c4d8] px-4 py-2 flex items-center justify-between shrink-0">
                  <button
                    onClick={() => handleAddRow(activeTabShift)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1600ac] hover:bg-[#dedcff] px-3 py-1 rounded transition-colors cursor-pointer border border-[#c7c4d8]"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ 정비 항목 행 추가</span>
                  </button>

                  <span className="text-xs text-[#767587]">
                    {activeTabShift} 교대조: 총 {currentTabRecords.length}개 항목
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Style B: 3-Column Parallel View (Matches Image 3 & 7) */
          <div className="flex-1 overflow-hidden p-4 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
            {(['DAY', 'SW', 'GY'] as ShiftType[]).map((shift) => {
              const records = inform.records.filter((r) => r.shift === shift);
              return (
                <div
                  key={shift}
                  className="bg-white border border-[#c7c4d8] rounded-xl shadow-xs flex flex-col h-full overflow-hidden"
                >
                  {/* Column Header */}
                  <div className="bg-[#ebe5ff] border-b border-[#c7c4d8] px-4 py-2.5 flex justify-between items-center shrink-0">
                    <span className="font-bold text-sm text-[#1c192d]">{shift}</span>
                    <button
                      onClick={() => handleAddRow(shift)}
                      className="text-xs text-[#1600ac] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>추가</span>
                    </button>
                  </div>

                  {/* Column Table */}
                  <div className="flex-1 overflow-auto">
                    <table className="w-full text-left border-collapse text-xs min-w-[320px]">
                      <thead className="bg-[#dedcff] sticky top-0 z-10 border-b border-[#c7c4d8]">
                        <tr className="text-[#1c192d] font-bold">
                          <th className="border-r border-[#c7c4d8] px-2.5 py-2 w-28">설비 번호</th>
                          <th className="border-r border-[#c7c4d8] px-2.5 py-2">정비 내용</th>
                          <th className="px-2.5 py-2 w-20 text-center">첨부</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#c7c4d8]">
                        {records.length === 0 ? (
                          <tr>
                            <td colSpan={3} className="py-8 text-center text-[#767587]">
                              등록된 정비 내역 없음
                            </td>
                          </tr>
                        ) : (
                          records.map((rec) => {
                            const isHighlighted = highlightRecordId === rec.id;
                            return (
                              <tr
                                key={rec.id}
                                id={`col-record-row-${rec.id}`}
                                className={`transition-colors ${
                                  isHighlighted
                                    ? 'bg-[#dedcff] ring-2 ring-[#1600ac] font-medium'
                                    : 'hover:bg-[#f7f1ff]'
                                }`}
                              >
                              <td className="border-r border-[#c7c4d8] px-2.5 py-2 font-bold text-[#1600ac]">
                                {rec.equipmentId}
                              </td>
                              <td className="border-r border-[#c7c4d8] px-2.5 py-2">
                                <p className="text-gray-800">{rec.workDescription || '(작업 내용 없음)'}</p>
                                {rec.remarks && (
                                  <p
                                    className={`mt-0.5 text-[11px] ${
                                      rec.isRemarkWarning ? 'text-[#ba1a1a] font-semibold' : 'text-gray-500'
                                    }`}
                                  >
                                    {rec.remarks}
                                  </p>
                                )}
                              </td>
                              <td className="px-2 py-2 text-center">
                                {rec.attachments.length > 0 ? (
                                  <span
                                    className="inline-flex items-center gap-1 text-[#2f27ce] text-[11px] font-medium truncate max-w-[80px]"
                                    title={rec.attachments[0].name}
                                  >
                                    <Paperclip className="w-3 h-3" />
                                    <span>{rec.attachments.length}개</span>
                                  </span>
                                ) : (
                                  <label className="text-gray-400 hover:text-[#1600ac] cursor-pointer">
                                    <Plus className="w-3 h-3 inline" />
                                    <input
                                      type="file"
                                      onChange={(e) => handleFileUpload(rec.id, e)}
                                      className="hidden"
                                    />
                                  </label>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Floating Action Button: "저장" (Save) */}
        <button
          id="btn-save-inform-fab"
          onClick={handleSaveSheet}
          className="absolute bottom-16 right-8 bg-[#2f27ce] hover:bg-[#1600ac] text-white rounded-full px-6 py-3 font-bold text-sm shadow-lg hover:shadow-xl transition-all flex items-center gap-2 cursor-pointer z-40 active:scale-95"
          title="정비 인폼 저장"
        >
          <Save className="w-4 h-4" />
          <span>저장</span>
        </button>
      </main>

      {/* Footer Bar (Matches Image 1 & 3) */}
      <footer
        id="inform-sheet-footer"
        className="bg-[#ebe5ff] text-[#1600ac] border-t border-[#c7c4d8] fixed bottom-0 left-0 w-full px-4 md:px-8 py-2 flex flex-wrap justify-between items-center z-40 shrink-0 text-xs shadow-xs"
      >
        <div className="text-[#464555] flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-[#767587]" />
          <span>마지막 자동 저장: <strong>{inform.lastSaved || '2024-05-20 14:30:15'}</strong></span>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={handleExportCSV}
            className="text-[#1600ac] hover:underline transition-colors cursor-pointer flex items-center gap-1 font-semibold"
          >
            <Download className="w-3.5 h-3.5" />
            <span>엑셀 내보내기</span>
          </button>

          <button
            onClick={onOpenVersionHistory}
            className="text-[#1600ac] hover:underline transition-colors cursor-pointer flex items-center gap-1 font-semibold"
          >
            <History className="w-3.5 h-3.5" />
            <span>이전 버전 복구 목록</span>
          </button>

          <span className="text-[#767587] hidden lg:inline">
            © 2024 Maintenance Information Systems v4.2.1
          </span>
        </div>
      </footer>
    </div>
  );
};
