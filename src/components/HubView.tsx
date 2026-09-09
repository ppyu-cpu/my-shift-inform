import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  Plus,
  ArrowRight,
  History,
  Filter,
  FileSpreadsheet,
  Upload,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Download,
  List,
  CalendarDays,
  Clock,
  Database,
} from 'lucide-react';
import { DayInform, ShiftType } from '../types';
import { exportToCSV } from '../storage';

interface HubViewProps {
  informs: Record<string, DayInform>;
  todayDate: string;
  onEnterTodayInform: () => void;
  onSelectDateInform: (date: string) => void;
  onOpenNewDateModal: () => void;
  onImportInforms: (imported: Record<string, DayInform>) => void;
  onShowToast: (msg: string) => void;
  onNavigateToReservations?: () => void;
  selectedShiftFilter?: ShiftType | 'ALL';
  onSelectShiftFilter?: (shift: ShiftType | 'ALL') => void;
}

export const HubView: React.FC<HubViewProps> = ({
  informs,
  todayDate,
  onEnterTodayInform,
  onSelectDateInform,
  onOpenNewDateModal,
  onImportInforms,
  onShowToast,
  onNavigateToReservations,
  selectedShiftFilter = 'ALL',
  onSelectShiftFilter,
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 5;

  // Get or fallback today's inform
  const allInformsList: DayInform[] = Object.values(informs) as DayInform[];
  const todayInform = informs[todayDate] || allInformsList[0];

  // Sorted informs by date desc
  const sortedInformsList = [...allInformsList].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Apply filters
  const filteredList = sortedInformsList.filter((item) => {
    if (selectedShiftFilter !== 'ALL' && item.activeShift !== selectedShiftFilter) {
      return false;
    }
    if (statusFilter !== 'ALL' && item.status !== statusFilter) {
      return false;
    }
    return true;
  });

  const totalPages = Math.ceil(filteredList.length / pageSize) || 1;
  const paginatedList = filteredList.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Bulk Excel Export
  const handleBulkExport = () => {
    const allRecords = allInformsList.flatMap((inf) => inf.records);
    exportToCSV(allRecords, `maintintel_all_informs_${todayDate}.csv`);
    onShowToast(`전체 ${allRecords.length}건의 정비 인폼 데이터가 엑셀로 내보내기 되었습니다.`);
  };

  // Import JSON/CSV simulation
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        if (typeof parsed === 'object') {
          onImportInforms(parsed);
          onShowToast('인폼 데이터 가져오기가 성공적으로 완료되었습니다.');
        }
      } catch {
        onShowToast('올바른 JSON 데이터 형식의 파일이 아닙니다.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div id="hub-view-container" className="flex-1 overflow-y-auto bg-[#fdf8ff] p-4 md:p-8">
      {/* Page Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#1c192d] tracking-tight flex items-center gap-3">
            <span>일자별 인폼 허브</span>
            <span className="text-xs bg-[#e2dfff] text-[#1600ac] px-2.5 py-1 rounded-full font-semibold">
              Shift Ledger Hub
            </span>
          </h1>
          <p className="text-sm text-[#464555] mt-1">
            일일 유지보수 교대조 보고서 관리, 신규 인폼 작성 및 과거 기록 열람
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onNavigateToReservations && (
            <button
              onClick={onNavigateToReservations}
              className="border border-[#1600ac]/30 bg-[#ebe5ff] text-[#1600ac] hover:bg-[#dedcff] px-3.5 py-1.5 rounded text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs whitespace-nowrap"
              title="Firebase 데이터베이스에 저장된 예약 및 정비 내역 다시 확인"
            >
              <Database className="w-4 h-4 text-[#2f27ce]" />
              <span>Firebase 정비 대장·예약 확인</span>
            </button>
          )}

          <button
            id="btn-create-new-date-top"
            onClick={onOpenNewDateModal}
            className="bg-[#1600ac] hover:bg-[#2f27ce] text-white px-3.5 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs active:scale-95 whitespace-nowrap"
            title="새로운 날짜의 인폼 시트 생성"
          >
            <Plus className="w-4 h-4" />
            <span>신규 일자 인폼 생성</span>
          </button>

          <button
            onClick={handleBulkExport}
            className="border border-[#c7c4d8] bg-white text-[#1600ac] hover:bg-[#ebe5ff] px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs whitespace-nowrap"
            title="모든 과거 인폼 엑셀 내보내기"
          >
            <Download className="w-4 h-4 text-[#2f27ce]" />
            <span>엑셀 일괄 내보내기</span>
          </button>

          <label className="border border-[#c7c4d8] bg-white text-[#464555] hover:bg-[#ebe5ff] px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs whitespace-nowrap">
            <Upload className="w-4 h-4 text-[#767587]" />
            <span>인폼 가져오기</span>
            <input type="file" accept=".json" onChange={handleImportFile} className="hidden" />
          </label>
        </div>
      </div>

      {/* Priority 1: Today's Inform Hero Card (Full Width) */}
      <section className="mb-8 w-full">
        <div className="w-full bg-white border border-[#c7c4d8] rounded-xl p-5 md:p-6 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-[#1600ac]"></div>

          <div>
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-[#dedcff] flex items-center justify-center text-[#1600ac]">
                  <CalendarIcon className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#1c192d] flex items-center gap-2">
                    <span>오늘의 인폼</span>
                    <span className="text-xs font-medium text-[#767587]">({todayDate})</span>
                  </h2>
                  <p className="text-xs text-[#464555]">
                    당일 교대조 실시간 정비 스프레드시트
                  </p>
                </div>
              </div>

              <span className="bg-[#2f27ce] text-white px-2.5 py-1 rounded text-xs font-bold shadow-xs">
                {todayInform?.status || '진행 중'}
              </span>
            </div>

            {/* Stat Boxes */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              <div className="p-3 bg-[#f7f1ff] rounded-lg border border-[#c7c4d8]/80">
                <p className="text-[#464555] text-xs font-medium mb-1">담당자</p>
                <p className="text-sm font-bold text-[#1c192d]">
                  {todayInform?.author || '김철수 기사'}
                </p>
              </div>

              <div className="p-3 bg-[#f7f1ff] rounded-lg border border-[#c7c4d8]/80">
                <p className="text-[#464555] text-xs font-medium mb-1">교대조</p>
                <p className="text-sm font-bold text-[#1c192d]">
                  {todayInform?.activeShift === 'DAY'
                    ? 'Day Shift (주간)'
                    : todayInform?.activeShift === 'SW'
                    ? 'Swing Shift (오후)'
                    : 'Graveyard Shift (야간)'}
                </p>
              </div>

              <div className="p-3 bg-[#f7f1ff] rounded-lg border border-[#c7c4d8]/80">
                <p className="text-[#464555] text-xs font-medium mb-1">주요 이슈</p>
                <p className="text-sm font-bold text-[#ba1a1a] flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{todayInform?.issueCount || 0}건 발생</span>
                </p>
              </div>

              <div className="p-3 bg-[#f7f1ff] rounded-lg border border-[#c7c4d8]/80">
                <p className="text-[#464555] text-xs font-medium mb-1">완료율</p>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-[#1600ac]">
                    {todayInform?.completionRate || 65}%
                  </p>
                  <span className="text-[10px] text-gray-500">
                    {todayInform?.records?.length || 4}건 입력
                  </span>
                </div>
              </div>
            </div>

            {/* Recent update summary */}
            <div className="border-t border-[#c7c4d8]/80 pt-3">
              <h3 className="text-xs font-bold text-[#1c192d] mb-1">최근 업데이트 요약</h3>
              <p className="text-xs text-[#464555] line-clamp-2 bg-[#fdf8ff] p-2.5 rounded border border-[#c7c4d8]/60">
                {todayInform?.summary ||
                  'A동 3번 컨베이어 벨트 모터 이상 소음 발생. 긴급 윤활유 주입 조치 완료. B동 배기 팬 필터 교체 예정.'}
              </p>
            </div>
          </div>

          {/* CTA Major Button */}
          <div className="mt-5 pt-3 flex items-center justify-between border-t border-gray-100">
            <span className="text-xs text-[#767587]">
              마지막 저장: {todayInform?.lastSaved || '2024-05-20 14:30:15'}
            </span>

            <button
              id="btn-goto-today-inform"
              onClick={onEnterTodayInform}
              className="bg-[#1600ac] hover:bg-[#2f27ce] text-white px-5 py-2.5 rounded-lg font-bold text-sm flex items-center gap-2 shadow-sm hover:shadow transition-all cursor-pointer group active:scale-98 whitespace-nowrap"
            >
              <span>오늘 인폼 바로가기 (실시간 시트 진입)</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      {/* Priority 2: Past Informs Ledger (과거 인폼 대장) */}
      <section className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-[#5c5c79]" />
            <h2 className="text-lg font-bold text-[#1c192d]">과거 인폼 대장</h2>
            <span className="text-xs text-[#767587] font-medium">
              (총 {filteredList.length}건 등록됨)
            </span>
          </div>

          {/* Controls & Filter */}
          <div className="flex items-center gap-2">
            {/* View Mode */}
            <div className="border border-[#c7c4d8] rounded flex bg-white text-xs overflow-hidden">
              <button
                onClick={() => setViewMode('list')}
                className={`px-2.5 py-1.5 flex items-center gap-1 border-r border-[#c7c4d8] font-medium transition-colors cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-[#ebe5ff] text-[#1600ac] font-bold'
                    : 'text-[#464555] hover:bg-gray-50'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>리스트형</span>
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`px-2.5 py-1.5 flex items-center gap-1 font-medium transition-colors cursor-pointer ${
                  viewMode === 'calendar'
                    ? 'bg-[#ebe5ff] text-[#1600ac] font-bold'
                    : 'text-[#464555] hover:bg-gray-50'
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span>캘린더형</span>
              </button>
            </div>

            {/* Shift Filter */}
            <div className="flex items-center gap-1 border border-[#c7c4d8] rounded bg-white px-2 py-1 text-xs">
              <Clock className="w-3.5 h-3.5 text-gray-500" />
              <select
                id="select-hub-shift-filter"
                value={selectedShiftFilter}
                onChange={(e) => onSelectShiftFilter?.(e.target.value as ShiftType | 'ALL')}
                className="bg-transparent border-none text-xs text-[#1c192d] outline-none cursor-pointer"
              >
                <option value="ALL">전체 교대조</option>
                <option value="DAY">Day Shift (주간)</option>
                <option value="SW">Swing Shift (오후)</option>
                <option value="GY">Graveyard Shift (야간)</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1 border border-[#c7c4d8] rounded bg-white px-2 py-1 text-xs">
              <Filter className="w-3.5 h-3.5 text-gray-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent border-none text-xs text-[#1c192d] outline-none cursor-pointer"
              >
                <option value="ALL">전체 상태</option>
                <option value="승인됨">승인됨</option>
                <option value="진행 중">진행 중</option>
                <option value="이슈 있음">이슈 있음</option>
              </select>
            </div>
          </div>
        </div>

        {/* View Mode Render */}
        {viewMode === 'list' ? (
          <div className="bg-white border border-[#c7c4d8] rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[760px] text-xs">
                <thead>
                  <tr className="bg-[#dedcff] text-[#1c192d] border-b border-[#c7c4d8] font-bold">
                    <th className="py-2.5 px-3 border-r border-[#c7c4d8] w-28">일자</th>
                    <th className="py-2.5 px-3 border-r border-[#c7c4d8] w-28">교대조</th>
                    <th className="py-2.5 px-3 border-r border-[#c7c4d8] w-28">담당자</th>
                    <th className="py-2.5 px-3 border-r border-[#c7c4d8] w-28">상태</th>
                    <th className="py-2.5 px-3 border-r border-[#c7c4d8]">주요 내용 요약</th>
                    <th className="py-2.5 px-3 border-r border-[#c7c4d8] w-24 text-center">
                      기록 건수
                    </th>
                    <th className="py-2.5 px-3 text-center w-28">액션</th>
                  </tr>
                </thead>
                <tbody className="text-[#1c192d] divide-y divide-[#c7c4d8]">
                  {paginatedList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-[#767587]">
                        해당 조건의 인폼 내역이 없습니다.
                      </td>
                    </tr>
                  ) : (
                    paginatedList.map((item) => {
                      const isIssue = item.status === '이슈 있음';
                      const isToday = item.date === todayDate;

                      return (
                        <tr
                          key={item.date}
                          className={`hover:bg-[#f7f1ff] transition-colors ${
                            isIssue ? 'bg-[#ffdad6]/25' : isToday ? 'bg-[#dedcff]/20' : ''
                          }`}
                        >
                          <td className="py-2.5 px-3 border-r border-[#c7c4d8] font-semibold whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <span>{item.date}</span>
                              {isToday && (
                                <span className="text-[10px] bg-[#1600ac] text-white px-1.5 py-0.2 rounded">
                                  오늘
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="py-2.5 px-3 border-r border-[#c7c4d8]">
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                                item.activeShift === 'DAY'
                                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                                  : item.activeShift === 'SW'
                                  ? 'bg-orange-50 text-orange-800 border-orange-200'
                                  : 'bg-indigo-50 text-indigo-800 border-indigo-200'
                              }`}
                            >
                              {item.activeShift === 'DAY'
                                ? 'Day'
                                : item.activeShift === 'SW'
                                ? 'Swing'
                                : 'Graveyard'}
                            </span>
                          </td>

                          <td className="py-2.5 px-3 border-r border-[#c7c4d8] font-medium text-[#464555]">
                            {item.author}
                          </td>

                          <td className="py-2.5 px-3 border-r border-[#c7c4d8]">
                            <span
                              className={`font-semibold flex items-center gap-1.5 ${
                                isIssue
                                  ? 'text-[#ba1a1a]'
                                  : item.status === '진행 중'
                                  ? 'text-[#2f27ce]'
                                  : 'text-green-700'
                              }`}
                            >
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  isIssue
                                    ? 'bg-[#ba1a1a]'
                                    : item.status === '진행 중'
                                    ? 'bg-[#2f27ce]'
                                    : 'bg-green-600'
                                }`}
                              ></span>
                              <span>{item.status}</span>
                            </span>
                          </td>

                          <td
                            className={`py-2.5 px-3 border-r border-[#c7c4d8] max-w-[340px] truncate ${
                              isIssue ? 'font-semibold text-[#ba1a1a]' : 'text-[#464555]'
                            }`}
                            title={item.summary}
                          >
                            {item.summary}
                          </td>

                          <td className="py-2.5 px-3 border-r border-[#c7c4d8] text-center text-[#767587]">
                            {item.records?.length || 0}개 항목
                          </td>

                          <td className="py-2.5 px-3 text-center">
                            <button
                              onClick={() => onSelectDateInform(item.date)}
                              className={`px-3 py-1 rounded text-xs font-semibold cursor-pointer transition-colors ${
                                isIssue
                                  ? 'bg-[#ba1a1a] text-white hover:bg-[#93000a]'
                                  : 'bg-[#1600ac] text-white hover:bg-[#2f27ce]'
                              }`}
                            >
                              {isIssue ? '리뷰' : '열람'}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-4 py-3 flex items-center justify-between border-t border-[#c7c4d8] bg-[#fdf8ff] text-xs">
              <span className="text-[#464555]">
                총 {filteredList.length}건 중{' '}
                {filteredList.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}-
                {Math.min(currentPage * pageSize, filteredList.length)}건 표시
              </span>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1 border border-[#c7c4d8] rounded hover:bg-white disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-2 font-medium">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className="p-1 border border-[#c7c4d8] rounded hover:bg-white disabled:opacity-40 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Calendar Style Grid */
          <div className="bg-white border border-[#c7c4d8] rounded-xl p-4 shadow-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredList.map((item) => (
                <div
                  key={item.date}
                  onClick={() => onSelectDateInform(item.date)}
                  className="p-3.5 rounded-lg border border-[#c7c4d8] hover:border-[#1600ac] hover:shadow-xs transition-all cursor-pointer bg-[#fdf8ff] group flex flex-col justify-between"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-sm text-[#1c192d] group-hover:text-[#1600ac]">
                      {item.date}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                        item.status === '이슈 있음'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>

                  <p className="text-xs text-[#464555] line-clamp-2 mb-3">
                    {item.summary}
                  </p>

                  <div className="pt-2 border-t border-gray-200 flex justify-between items-center text-[11px] text-[#767587]">
                    <span>담당: {item.author}</span>
                    <span className="text-[#1600ac] font-bold group-hover:underline">
                      시트 열기 →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
