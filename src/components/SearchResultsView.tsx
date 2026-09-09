import React, { useState } from 'react';
import {
  Search,
  Filter,
  X,
  FileSpreadsheet,
  Download,
  ExternalLink,
  Paperclip,
  CheckSquare,
  Square,
  FileText,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Columns,
} from 'lucide-react';
import { DayInform, MaintenanceRecord, ShiftType } from '../types';
import { exportToCSV } from '../storage';

interface SearchResultsViewProps {
  query: string;
  informs: Record<string, DayInform>;
  onCloseSearch: () => void;
  onJumpToDateSheet: (date: string, recordId: string, shift: ShiftType) => void;
  onShowToast: (msg: string) => void;
}

export const SearchResultsView: React.FC<SearchResultsViewProps> = ({
  query,
  informs,
  onCloseSearch,
  onJumpToDateSheet,
  onShowToast,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [equipmentFilter, setEquipmentFilter] = useState('');
  const [showFilterBar, setShowFilterBar] = useState(false);
  const pageSize = 5;

  // Flatten all records from all dates
  const allRecords: MaintenanceRecord[] = (Object.values(informs) as DayInform[]).flatMap(
    (inform) => inform.records
  );

  // Search filter across equipmentId, workDescription, remarks, date, author
  const searchLower = query.toLowerCase().trim();
  const matchedRecords = allRecords
    .filter((record) => {
      const matchSearch =
        !searchLower ||
        record.equipmentId.toLowerCase().includes(searchLower) ||
        record.workDescription.toLowerCase().includes(searchLower) ||
        record.remarks.toLowerCase().includes(searchLower) ||
        record.date.toLowerCase().includes(searchLower) ||
        record.shift.toLowerCase().includes(searchLower);

      const matchEquipment =
        !equipmentFilter ||
        record.equipmentId.toLowerCase().includes(equipmentFilter.toLowerCase());

      return matchSearch && matchEquipment;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalEntries = matchedRecords.length;
  const totalPages = Math.ceil(totalEntries / pageSize) || 1;
  const paginatedRecords = matchedRecords.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Select all on page
  const handleSelectAll = () => {
    if (selectedIds.length === paginatedRecords.length && paginatedRecords.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedRecords.map((r) => r.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((i) => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // Export matched to CSV
  const handleExportResults = () => {
    const recordsToExport =
      selectedIds.length > 0
        ? matchedRecords.filter((r) => selectedIds.includes(r.id))
        : matchedRecords;

    exportToCSV(recordsToExport, `search_results_${query || 'all'}.csv`);
    onShowToast(`${recordsToExport.length}건의 검색 결과가 엑셀로 내보내기 되었습니다.`);
  };

  return (
    <main
      id="search-results-grid-view"
      className="flex-1 overflow-y-auto bg-[#fdf8ff] p-4 md:p-8 relative pb-16"
    >
      {/* Search Context Header (Matches Image 11) */}
      <header className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#c7c4d8] pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <button
              onClick={onCloseSearch}
              className="text-[#1600ac] hover:underline text-xs flex items-center gap-1 font-semibold cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>실시간 인폼 시트로 복귀</span>
            </button>
          </div>

          <h1 className="text-2xl font-bold text-[#1c192d] tracking-tight">
            통합 검색 결과 뷰 화면
          </h1>

          <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[#464555]">
            <span className="text-sm font-medium">검색 결과:</span>
            <span className="text-sm font-bold text-[#1600ac] bg-[#2f27ce]/10 px-2.5 py-0.5 rounded border border-[#2f27ce]/30">
              "{query || '전체'}"
            </span>
            <span className="text-xs text-[#767587] ml-1">
              (총 {totalEntries}건 검색됨)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowFilterBar(!showFilterBar)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded text-xs font-semibold border transition-colors cursor-pointer ${
              showFilterBar
                ? 'bg-[#1600ac] text-white border-[#1600ac]'
                : 'text-[#464555] hover:text-[#1c192d] hover:bg-[#ebe5ff] border-[#c7c4d8] bg-white'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>필터 적용</span>
          </button>

          <button
            id="btn-close-search-reset"
            onClick={onCloseSearch}
            className="flex items-center gap-1.5 text-[#464555] hover:text-[#ba1a1a] hover:bg-[#ffdad6] hover:border-[#ba1a1a] px-3 py-2 rounded border border-[#c7c4d8] bg-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
            title="검색 초기화 후 실시간 편집 시트로 복귀"
          >
            <X className="w-4 h-4" />
            <span>검색 초기화 (메인 복귀)</span>
          </button>
        </div>
      </header>

      {/* Optional filter bar */}
      {showFilterBar && (
        <div className="mb-4 p-3 bg-white border border-[#c7c4d8] rounded-lg shadow-xs flex flex-wrap items-center gap-3 text-xs animate-in fade-in duration-100">
          <span className="font-bold text-[#1c192d]">설비 필터:</span>
          <input
            type="text"
            value={equipmentFilter}
            onChange={(e) => setEquipmentFilter(e.target.value)}
            placeholder="호기 번호 입력 (예: EQ-A1)..."
            className="px-2.5 py-1 border border-[#c7c4d8] rounded bg-[#fdf8ff] outline-none focus:border-[#1600ac]"
          />
          {equipmentFilter && (
            <button
              onClick={() => setEquipmentFilter('')}
              className="text-red-600 hover:underline text-[11px]"
            >
              필터 제거
            </button>
          )}
          <span className="text-[#767587] ml-auto">
            (과거 데이터 전용 읽기 모드 - 기존 작업 흐름이 방해받지 않습니다)
          </span>
        </div>
      )}

      {/* Data Table Grid View Card */}
      <div className="bg-white rounded-xl border border-[#c7c4d8] shadow-xs overflow-hidden flex flex-col">
        {/* Table Header Options */}
        <div className="bg-[#f7f1ff] px-4 py-2.5 border-b border-[#c7c4d8] flex justify-between items-center text-xs">
          <span className="font-bold text-[#1c192d]">
            유지보수 이력 그리드 (최근 항목순, Read-only)
          </span>

          <div className="flex items-center gap-2">
            {selectedIds.length > 0 && (
              <span className="text-[#2f27ce] font-semibold text-[11px]">
                {selectedIds.length}건 선택됨
              </span>
            )}

            <button
              onClick={handleExportResults}
              className="p-1.5 text-[#464555] hover:bg-[#ebe5ff] rounded transition-colors cursor-pointer flex items-center gap-1"
              title="검색 결과 엑셀 다운로드"
            >
              <Download className="w-4 h-4 text-[#2f27ce]" />
              <span className="hidden sm:inline">엑셀 다운로드</span>
            </button>
          </div>
        </div>

        {/* Read-only Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px] text-xs">
            <thead>
              <tr className="bg-[#dedcff] border-b border-[#c7c4d8] text-[#1c192d] font-bold">
                <th className="py-2.5 px-3 border-r border-[#c7c4d8] w-12 text-center">
                  <button
                    onClick={handleSelectAll}
                    className="p-0.5 text-[#1600ac] cursor-pointer"
                    title="전체 선택"
                  >
                    {selectedIds.length === paginatedRecords.length &&
                    paginatedRecords.length > 0 ? (
                      <CheckSquare className="w-4 h-4" />
                    ) : (
                      <Square className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                </th>
                <th className="py-2.5 px-3 border-r border-[#c7c4d8] w-28">
                  일자 (Date)
                </th>
                <th className="py-2.5 px-3 border-r border-[#c7c4d8] w-20 text-center">
                  교대조
                </th>
                <th className="py-2.5 px-3 border-r border-[#c7c4d8] w-36">
                  장비 ID (Equipment)
                </th>
                <th className="py-2.5 px-3 border-r border-[#c7c4d8] min-w-[320px]">
                  작업 내역 (Work Details)
                </th>
                <th className="py-2.5 px-3 border-r border-[#c7c4d8] w-48">
                  첨부 파일 (Files)
                </th>
                <th className="py-2.5 px-3 border-r border-[#c7c4d8] w-56">
                  비고 (Remarks)
                </th>
                <th className="py-2.5 px-3 text-center w-36">액션</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#c7c4d8] text-[#1c192d]">
              {paginatedRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#767587]">
                    <p className="font-semibold text-sm mb-1">
                      검색어 "{query}"에 일치하는 과거 정비 기록이 없습니다.
                    </p>
                    <p className="text-xs">
                      설비 번호(예: EQ-A1) 또는 작업 키워드로 다시 검색해 보세요.
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedRecords.map((record) => {
                  const isSelected = selectedIds.includes(record.id);
                  const isEmergency =
                    record.isRemarkWarning ||
                    record.workDescription.includes('긴급') ||
                    record.workDescription.includes('경보');

                  return (
                    <tr
                      key={record.id}
                      className={`hover:bg-[#f7f1ff] transition-colors ${
                        isSelected ? 'bg-[#dedcff]/30' : isEmergency ? 'bg-[#ffdad6]/20' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-2.5 px-3 border-r border-[#c7c4d8] text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(record.id)}
                          className="rounded border-[#c7c4d8] text-[#1600ac] focus:ring-[#1600ac] cursor-pointer"
                        />
                      </td>

                      {/* Date */}
                      <td
                        className={`py-2.5 px-3 border-r border-[#c7c4d8] font-mono whitespace-nowrap ${
                          isEmergency ? 'text-[#ba1a1a] font-bold' : ''
                        }`}
                      >
                        {record.date}
                      </td>

                      {/* Shift */}
                      <td className="py-2.5 px-3 border-r border-[#c7c4d8] text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#ebe5ff] text-[#1600ac]">
                          {record.shift}
                        </span>
                      </td>

                      {/* Equipment ID */}
                      <td className="py-2.5 px-3 border-r border-[#c7c4d8] font-bold text-[#1600ac]">
                        {record.equipmentId}
                      </td>

                      {/* Work Details */}
                      <td className="py-2.5 px-3 border-r border-[#c7c4d8]">
                        <p className="text-gray-800">{record.workDescription}</p>
                      </td>

                      {/* Files */}
                      <td className="py-2.5 px-3 border-r border-[#c7c4d8]">
                        <div className="flex flex-wrap gap-1">
                          {record.attachments.length > 0 ? (
                            record.attachments.map((att) => (
                              <span
                                key={att.id}
                                className="inline-flex items-center gap-1 bg-[#ebe5ff] text-[#1600ac] px-2 py-0.5 rounded text-[11px] border border-[#c7c4d8]"
                                title={att.name}
                              >
                                {att.type === 'image' ? (
                                  <ImageIcon className="w-3 h-3 text-[#2f27ce]" />
                                ) : (
                                  <FileText className="w-3 h-3 text-[#2f27ce]" />
                                )}
                                <span className="truncate max-w-[90px]">{att.name}</span>
                              </span>
                            ))
                          ) : (
                            <span className="text-gray-400 text-[11px]">-</span>
                          )}
                        </div>
                      </td>

                      {/* Remarks */}
                      <td
                        className={`py-2.5 px-3 border-r border-[#c7c4d8] ${
                          isEmergency ? 'text-[#ba1a1a] font-semibold' : 'text-[#464555]'
                        }`}
                      >
                        {record.remarks || '-'}
                      </td>

                      {/* Action: Jump to Date Sheet */}
                      <td className="py-2.5 px-3 text-center">
                        <button
                          id={`btn-jump-date-${record.id}`}
                          onClick={() => onJumpToDateSheet(record.date, record.id, record.shift)}
                          className="inline-flex items-center justify-center gap-1.5 text-[#1600ac] hover:bg-[#1600ac] hover:text-white px-2.5 py-1.5 rounded border border-[#1600ac] transition-all text-xs font-semibold cursor-pointer w-full group shadow-xs whitespace-nowrap active:scale-95"
                          title={`${record.date} [${record.shift} 조] 원본 시트로 이동`}
                        >
                          <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                          <span>원본 시트로 이동</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="bg-[#f7f1ff] border-t border-[#c7c4d8] px-4 py-2.5 flex flex-wrap justify-between items-center text-xs text-[#464555]">
          <span>
            총 {totalEntries}건 중 {totalEntries === 0 ? 0 : (currentPage - 1) * pageSize + 1}-
            {Math.min(currentPage * pageSize, totalEntries)}건 표시
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-2.5 py-1 border border-[#c7c4d8] rounded bg-white hover:bg-gray-50 disabled:opacity-40"
            >
              이전
            </button>

            {Array.from({ length: totalPages }).map((_, i) => {
              const page = i + 1;
              const isActive = page === currentPage;
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-2.5 py-1 border rounded font-semibold ${
                    isActive
                      ? 'bg-[#1600ac] text-white border-[#1600ac]'
                      : 'bg-white border-[#c7c4d8] hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              );
            })}

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="px-2.5 py-1 border border-[#c7c4d8] rounded bg-white hover:bg-gray-50 disabled:opacity-40"
            >
              다음
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};
