import React from 'react';
import {
  Sun,
  Sunset,
  Moon,
  BarChart3,
  AlertTriangle,
  HelpCircle,
  LogOut,
  Wrench,
} from 'lucide-react';
import { ShiftType } from '../types';

interface SidebarProps {
  selectedShift?: ShiftType | 'ALL';
  onSelectShift?: (shift: ShiftType | 'ALL') => void;
  onOpenEmergencyModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  selectedShift = 'ALL',
  onSelectShift,
  onOpenEmergencyModal,
}) => {
  return (
    <aside
      id="side-nav-bar"
      className="hidden md:flex flex-col bg-[#f7f1ff] text-[#1600ac] border-r border-[#c7c4d8] w-60 xl:w-64 shrink-0 h-full py-6 select-none shadow-xs"
    >
      {/* Brand / Section title */}
      <div className="px-4 mb-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-[#2f27ce] flex items-center justify-center text-white shadow-xs">
          <Wrench className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-[#1c192d] tracking-tight">Fleet Ops</h2>
          <p className="text-xs text-[#464555]">운영 센터 (현장 보전)</p>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 flex flex-col gap-1.5 overflow-y-auto text-xs">
        <div className="px-2 py-1 text-[11px] font-semibold text-[#767587] uppercase tracking-wider">
          교대 근무조 필터
        </div>

        <button
          onClick={() => onSelectShift?.('ALL')}
          className={`px-3 py-2 rounded-lg flex items-center justify-between transition-colors cursor-pointer text-left ${
            selectedShift === 'ALL'
              ? 'bg-[#dedcff] text-[#1600ac] font-bold shadow-xs'
              : 'text-[#464555] hover:bg-[#ebe5ff]'
          }`}
        >
          <span className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-[#1600ac]"></span>
            <span>전체 교대조 (ALL)</span>
          </span>
        </button>

        <button
          onClick={() => onSelectShift?.('DAY')}
          className={`px-3 py-2 rounded-lg flex items-center justify-between gap-1 transition-colors cursor-pointer text-left ${
            selectedShift === 'DAY'
              ? 'bg-[#dedcff] text-[#1600ac] font-bold shadow-xs'
              : 'text-[#464555] hover:bg-[#ebe5ff]'
          }`}
        >
          <span className="flex items-center gap-2 whitespace-nowrap">
            <Sun className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="whitespace-nowrap">Day Shift (주간)</span>
          </span>
          <span className="text-[10px] bg-white/80 px-1.5 py-0.5 rounded text-gray-600 border border-[#c7c4d8] whitespace-nowrap shrink-0">
            08:00 - 16:00
          </span>
        </button>

        <button
          onClick={() => onSelectShift?.('SW')}
          className={`px-3 py-2 rounded-lg flex items-center justify-between gap-1 transition-colors cursor-pointer text-left ${
            selectedShift === 'SW'
              ? 'bg-[#dedcff] text-[#1600ac] font-bold shadow-xs'
              : 'text-[#464555] hover:bg-[#ebe5ff]'
          }`}
        >
          <span className="flex items-center gap-2 whitespace-nowrap">
            <Sunset className="w-4 h-4 text-orange-600 shrink-0" />
            <span className="whitespace-nowrap">Swing Shift (오후)</span>
          </span>
          <span className="text-[10px] bg-white/80 px-1.5 py-0.5 rounded text-gray-600 border border-[#c7c4d8] whitespace-nowrap shrink-0">
            16:00 - 24:00
          </span>
        </button>

        <button
          onClick={() => onSelectShift?.('GY')}
          className={`px-3 py-2 rounded-lg flex items-center justify-between gap-1 transition-colors cursor-pointer text-left ${
            selectedShift === 'GY'
              ? 'bg-[#dedcff] text-[#1600ac] font-bold shadow-xs'
              : 'text-[#464555] hover:bg-[#ebe5ff]'
          }`}
        >
          <span className="flex items-center gap-2 whitespace-nowrap">
            <Moon className="w-4 h-4 text-indigo-600 shrink-0" />
            <span className="whitespace-nowrap">Graveyard Shift (야간)</span>
          </span>
          <span className="text-[10px] bg-white/80 px-1.5 py-0.5 rounded text-gray-600 border border-[#c7c4d8] whitespace-nowrap shrink-0">
            00:00 - 08:00
          </span>
        </button>

        <div className="my-2 border-t border-[#c7c4d8]"></div>

        <button
          onClick={() => alert('설비 가동률 및 정비 통계 대시보드: 주간 가동률 99.2%, 평균 고장 복구 시간(MTTR) 24분')}
          className="px-3 py-2 rounded-lg flex items-center gap-2.5 text-[#464555] hover:bg-[#ebe5ff] transition-colors cursor-pointer text-left"
        >
          <BarChart3 className="w-4 h-4 text-[#2f27ce]" />
          <span className="font-medium">Analytics (정비 통계)</span>
        </button>
      </nav>

      {/* Emergency Action */}
      <div className="px-3 mt-auto pt-4 border-t border-[#c7c4d8] flex flex-col gap-2">
        <button
          id="btn-emergency-log"
          onClick={onOpenEmergencyModal}
          className="w-full border-2 border-[#ba1a1a] text-[#ba1a1a] hover:bg-[#ffdad6] hover:text-[#93000a] py-2 rounded-lg flex items-center justify-center gap-2 font-bold text-xs transition-colors cursor-pointer shadow-xs active:scale-95"
        >
          <AlertTriangle className="w-4 h-4 text-[#ba1a1a]" />
          <span>Emergency Log (긴급 로그)</span>
        </button>

        <div className="flex flex-col gap-1 pt-2">
          <button
            onClick={() =>
              alert(
                'MaintIntel Pro 정비 인폼 시스템 도움말:\n1. 홈: 당일 인폼 진입 및 과거 대장 열람\n2. 메인 시트: 실시간 편집, 사진 첨부, 엑셀 내보내기, 버전 복구\n3. 통합 검색: 과거 이력 전용 조회 및 원본 시트 바로가기'
              )
            }
            className="flex items-center gap-2.5 px-3 py-1.5 text-xs text-[#464555] hover:bg-[#ebe5ff] rounded-md transition-colors text-left"
          >
            <HelpCircle className="w-4 h-4" />
            <span>도움말 및 가이드</span>
          </button>
          <button
            onClick={() => alert('엔지니어 세션이 유지되고 있습니다.')}
            className="flex items-center gap-2.5 px-3 py-1.5 text-xs text-[#464555] hover:bg-[#ebe5ff] rounded-md transition-colors text-left"
          >
            <LogOut className="w-4 h-4" />
            <span>로그아웃</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
