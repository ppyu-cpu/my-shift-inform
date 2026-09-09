export type ShiftType = 'DAY' | 'SW' | 'GY';
export type WorkStatusType = '작성 중' | '완료됨';

export interface FileAttachment {
  id: string;
  name: string;
  size?: string;
  type: 'image' | 'pdf' | 'document' | 'other';
  url?: string;
  dataUrl?: string; // base64 preview or object url for photo
}

export interface MaintenanceRecord {
  id: string;
  no: number;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  shift: ShiftType;
  equipmentId: string; // e.g. EQ-A1-004
  workDescription: string;
  workStatus?: WorkStatusType; // '작성 중' | '완료됨'
  savedAt?: string; // 저장된 시점 (YYYY-MM-DD HH:mm:ss)
  author?: string;
  attachments: FileAttachment[];
  remarks: string; // 비고
  isRemarkWarning?: boolean;
}

export interface VersionSnapshot {
  id: string;
  timestamp: string; // YYYY-MM-DD HH:mm:ss
  author: string;
  shift: ShiftType;
  summary: string;
  recordCount: number;
  records: MaintenanceRecord[];
}

export interface DayInform {
  date: string; // YYYY-MM-DD
  title?: string;
  author: string;
  activeShift: ShiftType;
  status: '진행 중' | '승인됨' | '이슈 있음' | '작성 완료';
  issueCount: number;
  completionRate: number; // percentage
  summary: string;
  records: MaintenanceRecord[];
  history: VersionSnapshot[];
  lastSaved: string; // YYYY-MM-DD HH:mm:ss
}

export type ActiveScreen = 'hub' | 'main' | 'search' | 'reservations';
