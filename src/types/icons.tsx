import type { ReactNode } from "react";

export interface CategoryIconDef {
  id: string;
  label: string;
  svg: ReactNode;
}

const S = (props: { d: string }) => <path d={props.d} />;
const C = (props: { cx: number; cy: number; r: number }) => (
  <circle cx={props.cx} cy={props.cy} r={props.r} />
);
const R = (props: { x: number; y: number; w: number; h: number; rx?: number }) => (
  <rect x={props.x} y={props.y} width={props.w} height={props.h} rx={props.rx ?? 0} />
);
const L = (props: { x1: number; y1: number; x2: number; y2: number }) => (
  <line x1={props.x1} y1={props.y1} x2={props.x2} y2={props.y2} />
);
const PL = (props: { points: string }) => <polyline points={props.points} />;
const PG = (props: { points: string }) => <polygon points={props.points} />;
function wrap(id: string, label: string, children: ReactNode): CategoryIconDef {
  return {
    id,
    label,
    svg: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {children}
      </svg>
    ),
  };
}

export const CATEGORY_ICONS: CategoryIconDef[] = [
  wrap(
    "note",
    "Нота",
    <>
      <S d="M9 18V5l12-2v13" />
      <C cx={6} cy={18} r={3} />
      <C cx={18} cy={16} r={3} />
    </>,
  ),
  wrap(
    "notes",
    "Ноты",
    <>
      <S d="M17 20V5L9 7v11" />
      <C cx={6} cy={18} r={3} />
      <C cx={14} cy={16} r={3} />
      <L x1={9} y1={7} x2={17} y2={5} />
    </>,
  ),
  wrap(
    "mic",
    "Микрофон",
    <>
      <S d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <S d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <L x1={12} y1={19} x2={12} y2={23} />
      <L x1={8} y1={23} x2={16} y2={23} />
    </>,
  ),
  wrap(
    "headphones",
    "Наушники",
    <>
      <S d="M3 18v-6a9 9 0 0 1 18 0v6" />
      <S d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
    </>,
  ),
  wrap(
    "guitar",
    "Гитара",
    <>
      <S d="M11 3h2v12" />
      <C cx={11} cy={17} r={3} />
      <S d="M13 9c2 0 4-1 4-3 0-2-2-3-4-3" />
      <S d="M7 5c0 2 2 3 4 3" />
    </>,
  ),
  wrap(
    "piano",
    "Пианино",
    <>
      <R x={2} y={4} w={20} h={16} rx={2} />
      <L x1={6} y1={4} x2={6} y2={20} />
      <L x1={10} y1={4} x2={10} y2={20} />
      <L x1={14} y1={4} x2={14} y2={20} />
      <L x1={18} y1={4} x2={18} y2={20} />
      <L x1={2} y1={12} x2={22} y2={12} />
    </>,
  ),
  wrap(
    "radio",
    "Радио",
    <>
      <S d="M4 6h16" />
      <S d="M4 10h16" />
      <S d="M4 14h16" />
      <S d="M4 18h16" />
      <R x={2} y={4} w={20} h={16} rx={2} />
    </>,
  ),
  wrap(
    "speaker",
    "Колонка",
    <>
      <R x={8} y={2} w={8} h={20} rx={2} />
      <C cx={12} cy={15} r={3} />
      <S d="M12 9v3" />
    </>,
  ),
  wrap(
    "album",
    "Альбом",
    <>
      <C cx={12} cy={12} r={10} />
      <C cx={12} cy={12} r={3} />
      <S d="M12 2v10" />
    </>,
  ),
  wrap(
    "disc",
    "Диск",
    <>
      <C cx={12} cy={12} r={10} />
      <C cx={12} cy={12} r={4} />
      <S d="M12 12h8" />
    </>,
  ),
  wrap(
    "star",
    "Звезда",
    <>
      <PG points="12 2 15.5 9 22 9.5 17 14.5 18.5 22 12 18.5 5.5 22 7 14.5 2 9.5 8.5 9" />
    </>,
  ),
  wrap(
    "heart",
    "Сердце",
    <>
      <S d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </>,
  ),
  wrap(
    "folder",
    "Папка",
    <>
      <S d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </>,
  ),
  wrap(
    "file",
    "Файл",
    <>
      <S d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <PL points="14 2 14 8 20 8" />
    </>,
  ),
  wrap(
    "pencil",
    "Карандаш",
    <>
      <S d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    </>,
  ),
  wrap(
    "pen",
    "Перо",
    <>
      <S d="M12 19l7-7 3 3-7 7-3-3z" />
      <S d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
      <S d="M2 2l7.586 7.586" />
      <C cx={11} cy={11} r={2} />
    </>,
  ),
  wrap(
    "book",
    "Книга",
    <>
      <S d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <S d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </>,
  ),
  wrap(
    "tag",
    "Тег",
    <>
      <S d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <L x1={7} y1={7} x2={7.01} y2={7} />
    </>,
  ),
  wrap(
    "flag",
    "Флаг",
    <>
      <S d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <L x1={4} y1={22} x2={4} y2={15} />
    </>,
  ),
  wrap(
    "bookmark",
    "Закладка",
    <>
      <S d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </>,
  ),
  wrap(
    "camera",
    "Камера",
    <>
      <S d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <C cx={12} cy={13} r={4} />
    </>,
  ),
  wrap(
    "film",
    "Фильм",
    <>
      <R x={2} y={2} w={20} h={20} rx={2} />
      <S d="M7 2v20M17 2v20M2 12h20M2 7h5M2 17h5M17 7h5M17 17h5" />
    </>,
  ),
  wrap(
    "image",
    "Картинка",
    <>
      <R x={3} y={3} w={18} h={18} rx={2} />
      <C cx={8.5} cy={8.5} r={1.5} />
      <S d="M21 15l-5-5L5 21" />
    </>,
  ),
  wrap(
    "gear",
    "Шестерня",
    <>
      <C cx={12} cy={12} r={3} />
      <S d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1.51-1 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </>,
  ),
  wrap(
    "lock",
    "Замок",
    <>
      <R x={5} y={11} w={14} h={10} rx={2} />
      <S d="M8 11V7a4 4 0 0 1 8 0v4" />
      <C cx={12} cy={16} r={1} />
      <L x1={12} y1={16} x2={12} y2={18} />
    </>,
  ),
  wrap(
    "key",
    "Ключ",
    <>
      <C cx={8} cy={15} r={5} />
      <L x1={12} y1={11} x2={20} y2={3} />
      <L x1={18} y1={5} x2={20} y2={7} />
      <L x1={15} y1={8} x2={17} y2={10} />
    </>,
  ),
  wrap(
    "bulb",
    "Лампочка",
    <>
      <S d="M9 18h6" />
      <S d="M10 22h4" />
      <S d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14" />
    </>,
  ),
  wrap(
    "cloud",
    "Облако",
    <>
      <S d="M17.5 19a4.5 4.5 0 0 0 .5-8.97 6 6 0 0 0-11.85-1.65A4.5 4.5 0 0 0 6 19h11.5z" />
    </>,
  ),
  wrap(
    "globe",
    "Глобус",
    <>
      <C cx={12} cy={12} r={10} />
      <S d="M2 12h20" />
      <S d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </>,
  ),
  wrap(
    "bell",
    "Колокольчик",
    <>
      <S d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <S d="M13.73 21a2 2 0 0 1-3.46 0" />
    </>,
  ),
  wrap(
    "smile",
    "Смайлик",
    <>
      <C cx={12} cy={12} r={10} />
      <S d="M8 14s1.5 2 4 2 4-2 4-2" />
      <C cx={9} cy={9} r={1} />
      <C cx={15} cy={9} r={1} />
    </>,
  ),
  wrap(
    "diamond",
    "Ромб",
    <>
      <PG points="12 2 22 12 12 22 2 12" />
    </>,
  ),
];

export function getIconSvg(id: string): ReactNode {
  return CATEGORY_ICONS.find((i) => i.id === id)?.svg ?? null;
}

export const DEFAULT_ICON_ID = "note";
