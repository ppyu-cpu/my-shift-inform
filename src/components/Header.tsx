import React, { useState } from 'react';
import {
  Search,
  PlusCircle,
  FileText,
  Bell,
  Settings,
  LayoutDashboard,
  Home,
  CheckCircle2,
  AlertTriangle,
  Database,
} from 'lucide-react';
import { ActiveScreen } from '../types';

interface HeaderProps {
  currentScreen: ActiveScreen;
  onNavigate: (screen: ActiveScreen) => void;
  onOpenNewInformModal: () => void;
  onOpenEmergencyModal?: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSearchSubmit: (q: string) => void;
  currentDate?: string;
  onDateChange?: (date: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentScreen,
  onNavigate,
  onOpenNewInformModal,
  onOpenEmergencyModal,
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  currentDate,
}) => {
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [showNotifications, setShowNotifications] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && localSearch.trim()) {
      onSearchSubmit(localSearch.trim());
    }
  };

  return (
    <header
      id="top-nav-bar"
      className="bg-[#fdf8ff] text-[#1600ac] border-b border-[#c7c4d8] flex justify-between items-center px-4 md:px-8 w-full h-16 shrink-0 z-50 sticky top-0 shadow-xs"
    >
      <div className="flex items-center gap-4 lg:gap-8">
        <button
          onClick={() => onNavigate('hub')}
          className="flex items-center gap-2 group text-left cursor-pointer whitespace-nowrap shrink-0"
          title="인폼 허브로 이동"
        >
          <span className="text-xl md:text-2xl font-bold tracking-tight text-[#1600ac] group-hover:text-[#2f27ce] transition-colors whitespace-nowrap">
            MaintIntel Pro
          </span>
          <span className="hidden xl:inline-block text-[11px] font-medium bg-[#dedcff] text-[#2f27ce] px-2 py-0.5 rounded whitespace-nowrap">
            v4.2.1
          </span>
        </button>

        <nav className="hidden md:flex items-center gap-2 lg:gap-4 ml-2 lg:ml-6 h-16 shrink-0">
          <button
            onClick={() => onNavigate('hub')}
            className={`h-full flex items-center gap-1.5 px-3 border-b-2 font-medium text-sm transition-colors cursor-pointer whitespace-nowrap ${
              currentScreen === 'hub'
                ? 'border-[#1600ac] text-[#1600ac] font-bold'
                : 'border-transparent text-[#464555] hover:text-[#1600ac]'
            }`}
          >
            <Home className="w-4 h-4 shrink-0" />
            <span className="whitespace-nowrap">인폼 허브</span>
          </button>

          <button
            onClick={() => onNavigate('main')}
            className={`h-full flex items-center gap-1.5 px-3 border-b-2 font-medium text-sm transition-colors cursor-pointer whitespace-nowrap ${
              currentScreen === 'main'
                ? 'border-[#1600ac] text-[#1600ac] font-bold'
                : 'border-transparent text-[#464555] hover:text-[#1600ac]'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 shrink-0" />
            <span className="whitespace-nowrap">실시간 인폼 시트</span>
            {currentDate && (
              <span className="text-xs bg-[#ebe5ff] text-[#2f27ce] px-1.5 py-0.5 rounded font-normal whitespace-nowrap">
                {currentDate}
              </span>
            )}
          </button>

          <button
            onClick={() => onNavigate('reservations')}
            className={`h-full flex items-center gap-1.5 px-3 border-b-2 font-medium text-sm transition-colors cursor-pointer whitespace-nowrap ${
              currentScreen === 'reservations'
                ? 'border-[#1600ac] text-[#1600ac] font-bold'
                : 'border-transparent text-[#464555] hover:text-[#1600ac]'
            }`}
          >
            <Database className="w-4 h-4 shrink-0" />
            <span className="whitespace-nowrap">저장된 예약·대장 (DB)</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          </button>

          <a
            href="#equipment"
            onClick={(e) => {
              e.preventDefault();
              onSearchSubmit('EQ-');
            }}
            className="h-full flex items-center px-3 border-b-2 border-transparent text-[#464555] hover:text-[#1600ac] font-medium text-sm transition-colors whitespace-nowrap"
          >
            Equipment
          </a>
          <a
            href="#work-orders"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('hub');
            }}
            className="h-full flex items-center px-3 border-b-2 border-transparent text-[#464555] hover:text-[#1600ac] font-medium text-sm transition-colors whitespace-nowrap"
          >
            Work Orders
          </a>
        </nav>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Global Quick Search */}
        <div className="relative hidden lg:block w-52 xl:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#767587]" />
          <input
            id="global-header-search"
            type="text"
            value={localSearch}
            onChange={(e) => {
              setLocalSearch(e.target.value);
              onSearchChange(e.target.value);
            }}
            onKeyDown={handleKeyDown}
            placeholder="호기/작업 검색 (Enter)..."
            className="w-full pl-9 pr-8 h-8.5 border border-[#c7c4d8] rounded bg-white text-xs font-normal text-[#1c192d] placeholder-[#767587] focus:border-[#2f27ce] focus:ring-1 focus:ring-[#2f27ce] outline-none transition-all leading-normal"
          />
          {localSearch && (
            <button
              onClick={() => {
                setLocalSearch('');
                onSearchChange('');
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>

        {/* Action Buttons */}
        <button
          id="btn-header-new-inform"
          onClick={onOpenNewInformModal}
          className="bg-[#1600ac] text-white rounded font-medium text-xs sm:text-sm px-3.5 py-1.5 hover:bg-[#2f27ce] transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 whitespace-nowrap shrink-0"
          title="새 정비 인폼 작성"
        >
          <PlusCircle className="w-4 h-4 shrink-0" />
          <span className="whitespace-nowrap">인폼 작성</span>
        </button>

        <button
          onClick={() => {
            alert('새 유지보수 보고서 양식 템플릿을 생성합니다.');
          }}
          className="hidden sm:flex bg-[#2f27ce] text-white rounded font-medium text-xs sm:text-sm px-3.5 py-1.5 hover:opacity-90 transition-opacity items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
        >
          <FileText className="w-3.5 h-3.5 shrink-0" />
          <span className="whitespace-nowrap">New Report</span>
        </button>

        {onOpenEmergencyModal && (
          <button
            id="btn-header-emergency"
            onClick={onOpenEmergencyModal}
            className="border border-red-300 bg-red-50 hover:bg-red-100 text-red-700 rounded font-medium text-xs px-2.5 py-1.5 flex items-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap shrink-0 active:scale-95"
            title="긴급 정비 로그 작성"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />
            <span className="whitespace-nowrap hidden lg:inline">Emergency Log</span>
            <span className="whitespace-nowrap lg:hidden">긴급</span>
          </button>
        )}

        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="text-[#464555] hover:text-[#1600ac] p-1.5 rounded-full hover:bg-[#ebe5ff] transition-colors cursor-pointer relative"
            title="알림"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-xl border border-[#c7c4d8] py-2 z-50 text-xs">
              <div className="px-3 py-1.5 font-bold border-b border-gray-100 flex items-center justify-between text-[#1c192d]">
                <span>실시간 알림 (2)</span>
                <span className="text-[10px] text-[#2f27ce] cursor-pointer">모두 읽음</span>
              </div>
              <div className="p-2.5 hover:bg-purple-50 cursor-pointer border-b border-gray-50 flex items-start gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 mt-1 shrink-0"></span>
                <div>
                  <p className="font-semibold text-gray-800">[이슈] 메인 컴프레서 1호기 과열 경보</p>
                  <p className="text-gray-500 text-[11px]">라인 정지 점검 필요 (Day Shift)</p>
                </div>
              </div>
              <div className="p-2.5 hover:bg-purple-50 cursor-pointer flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-800">[완료] 컨베이어 모터 윤활유 보충</p>
                  <p className="text-gray-500 text-[11px]">정상 가동 승인됨</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={() => alert('MaintIntel Pro 환경 설정: 자동 저장 주기 (5분), 백업 보관 기간 (30일), 알림 연동 완료.')}
          className="text-[#464555] hover:text-[#1600ac] p-1.5 rounded-full hover:bg-[#ebe5ff] transition-colors cursor-pointer"
          title="설정"
        >
          <Settings className="w-5 h-5" />
        </button>

        <div
          className="flex items-center gap-2 pl-1 cursor-pointer"
          title="김철수 수석 엔지니어 (Day Shift)"
        >
          <div className="w-8 h-8 rounded-full overflow-hidden bg-[#e5dffc] ring-1 ring-[#c7c4d8]">
            <img
              alt="Field Engineer Profile"
              className="w-full h-full object-cover"
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80"
            />
          </div>
          <div className="hidden xl:block text-left text-[11px] leading-tight">
            <p className="font-bold text-[#1c192d]">김철수 기사</p>
            <p className="text-[#767587]">보전1팀</p>
          </div>
        </div>
      </div>
    </header>
  );
};
