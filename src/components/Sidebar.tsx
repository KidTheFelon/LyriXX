import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { ALL_CATEGORY, type CustomCategory } from "@/types/category";
import { getIconSvg } from "@/types/icons";
import { IconPicker } from "./IconPicker";
import { ConfirmModal } from "./ConfirmModal";
import { ContextMenu } from "./ContextMenu";
import { IconEdit, IconTrash } from "./Icons";
import { logger } from "@/services/logger";
import { useTranslation } from "@/i18n";

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  activeCategory: string;
  onCategoryChange: (cat: string) => void;
  onAddSong: () => void;
  onAddCategory: (label: string) => void;
  onRenameCategory: (id: string, label: string) => void;
  onUpdateCategoryIcon: (id: string, icon: string) => void;
  onDeleteCategory: (id: string) => void;
  onOpenSettings: () => void;
  onOpenDebug?: () => void;
  categories: CustomCategory[];
  counts: Record<string, number>;
  songsTotal: number;
  sidebarFontSize?: number;
}

const ALL_ICON = (
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
    <path d="M9 18V5l12-2v13" />
    <circle cx="6" cy="18" r="3" />
    <circle cx="18" cy="16" r="3" />
  </svg>
);

export function Sidebar({
  collapsed,
  onToggleCollapse,
  activeCategory,
  onCategoryChange,
  onAddSong,
  onAddCategory,
  onRenameCategory,
  onUpdateCategoryIcon,
  onDeleteCategory,
  onOpenSettings,
  onOpenDebug,
  categories,
  counts,
  songsTotal,
  sidebarFontSize,
}: SidebarProps) {
  const [adding, setAdding] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [addValue, setAddValue] = useState("");
  const [pickerCategoryId, setPickerCategoryId] = useState<string | null>(null);
  const [pickerAnchor, setPickerAnchor] = useState<HTMLElement | null>(null);
  const addInputRef = useRef<HTMLInputElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const iconBtnRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; catId: string } | null>(null);
  const settingsClickCount = useRef(0);
  const settingsClickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    if (adding && addInputRef.current) {
      addInputRef.current.focus();
    }
  }, [adding]);

  useEffect(() => {
    if (renamingId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renamingId]);

  const handleFinishAdd = () => {
    const label = addValue.trim();
    if (label) {
      logger.debug("Sidebar", `add category: ${label}`);
      onAddCategory(label);
    }
    setAddValue("");
    setAdding(false);
  };

  const handleFinishRename = () => {
    const label = renameValue.trim();
    if (label && renamingId) {
      logger.debug("Sidebar", `rename category: ${renamingId} -> ${label}`);
      onRenameCategory(renamingId, label);
    }
    setRenamingId(null);
    setRenameValue("");
  };

  const handleDelete = () => {
    if (confirmDeleteId) {
      logger.debug("Sidebar", `delete category: ${confirmDeleteId}`);
      onDeleteCategory(confirmDeleteId);
      setConfirmDeleteId(null);
    }
  };

  const handleIconClick = (catId: string, btn: HTMLButtonElement | null) => {
    if (btn) {
      setPickerCategoryId(catId);
      setPickerAnchor(btn);
    }
  };

  const handleCtxRename = (cat: CustomCategory) => {
    setRenameValue(cat.label);
    setRenamingId(cat.id);
  };

  const handleCtxIcon = (cat: CustomCategory) => {
    const btn = iconBtnRefs.current.get(cat.id) ?? null;
    if (btn) {
      setPickerCategoryId(cat.id);
      setPickerAnchor(btn);
    }
  };

  const handleCtxDelete = (cat: CustomCategory) => {
    setConfirmDeleteId(cat.id);
  };

  const isAll = activeCategory === ALL_CATEGORY.id;

  return (
    <nav
      className={`sidebar ${collapsed ? "sidebar--collapsed" : ""}`}
      style={sidebarFontSize ? { fontSize: `${sidebarFontSize}px` } : undefined}
    >
      <div className="sidebar-header">
        <div className="sidebar-header-row">
          <button
            className={`btn-add ${collapsed ? "btn-add--icon" : ""}`}
            onClick={onAddSong}
            title={t("create")}
            type="button"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 1.5a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5a.5.5 0 0 1 .5-.5z" />
            </svg>
            {!collapsed && <span>{t("create")}</span>}
          </button>
          <button
            className="btn-collapse"
            onClick={onToggleCollapse}
            title={collapsed ? t("expandSidebar") : t("collapseSidebar")}
            type="button"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {collapsed ? (
                <polyline points="9 18 15 12 9 6" />
              ) : (
                <polyline points="15 18 9 12 15 6" />
              )}
            </svg>
          </button>
        </div>
      </div>

      <div className="sidebar-nav">
        <button
          className={`sidebar-item ${isAll ? "active" : ""}`}
          onClick={() => onCategoryChange(ALL_CATEGORY.id)}
          type="button"
          aria-current={isAll ? "page" : undefined}
        >
          {ALL_ICON}
          {!collapsed && <span>{t("allSongs")}</span>}
          {!collapsed && <span className="sidebar-badge">{songsTotal}</span>}
        </button>

        {collapsed && <div className="sidebar-nav-divider" />}

        {!collapsed && (
          <div className="sidebar-section-header">
            <span>{t("categoriesLabel")}</span>
          </div>
        )}

        {categories.map((cat) => {
          const isActive = activeCategory === cat.id;
          const isRenaming = renamingId === cat.id;
          return (
            <div
              key={cat.id}
              className={`sidebar-item-wrap ${isActive ? "active" : ""}`}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setCtxMenu({ x: e.clientX, y: e.clientY, catId: cat.id });
              }}
            >
              <button
                className={`sidebar-item ${isActive ? "active" : ""}`}
                onClick={() => onCategoryChange(cat.id)}
                onKeyDown={(e) => {
                  if (e.key === "Delete") {
                    e.preventDefault();
                    setConfirmDeleteId(cat.id);
                  }
                }}
                type="button"
                aria-current={isActive ? "page" : undefined}
              >
                <span className="sidebar-item-icon-wrap">
                  <button
                    ref={(el) => {
                      if (el) iconBtnRefs.current.set(cat.id, el);
                      else iconBtnRefs.current.delete(cat.id);
                    }}
                    className="sidebar-item-icon-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleIconClick(cat.id, iconBtnRefs.current.get(cat.id) ?? null);
                    }}
                    title={t("changeIcon")}
                    type="button"
                  >
                    {getIconSvg(cat.icon) ?? getIconSvg("note")}
                  </button>
                </span>
                {!collapsed &&
                  (isRenaming ? (
                    <input
                      ref={renameInputRef}
                      className="sidebar-item-input"
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onBlur={handleFinishRename}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleFinishRename();
                        if (e.key === "Escape") setRenamingId(null);
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span>{cat.label}</span>
                  ))}
                {!collapsed && <span className="sidebar-badge">{counts[cat.id] ?? 0}</span>}
              </button>
              {!collapsed && !isRenaming && (
                <div className="sidebar-item-actions">
                  <button
                    className="sidebar-item-action"
                    title={t("rename")}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setRenameValue(cat.label);
                      setRenamingId(cat.id);
                    }}
                  >
                    <IconEdit size={12} />
                  </button>
                  <button
                    className="sidebar-item-action sidebar-item-action-danger"
                    title={t("delete")}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmDeleteId(cat.id);
                    }}
                  >
                    <IconTrash size={12} />
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {!collapsed &&
          (adding ? (
            <div className="sidebar-add-cat">
              <input
                ref={addInputRef}
                className="sidebar-item-input sidebar-add-cat-input"
                placeholder={t("categoryName")}
                value={addValue}
                onChange={(e) => setAddValue(e.target.value)}
                onBlur={handleFinishAdd}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleFinishAdd();
                  if (e.key === "Escape") {
                    setAddValue("");
                    setAdding(false);
                  }
                }}
              />
            </div>
          ) : (
            <button className="sidebar-add-cat-btn" onClick={() => setAdding(true)} type="button">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                <path d="M6 0a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 6 0z" />
              </svg>
              <span>{t("addCategory")}</span>
            </button>
          ))}
      </div>

      <div className="sidebar-footer">
        <span className="sidebar-version">LyriXX</span>
        <button
          className="sidebar-settings-btn"
          onClick={onOpenSettings}
          onContextMenu={(e) => {
            e.preventDefault();
            settingsClickCount.current++;
            if (settingsClickTimer.current) clearTimeout(settingsClickTimer.current);
            settingsClickTimer.current = setTimeout(() => {
              settingsClickCount.current = 0;
            }, 2000);
            if (settingsClickCount.current >= 5) {
              settingsClickCount.current = 0;
              onOpenDebug?.();
            }
          }}
          title={t("settings")}
          type="button"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
      </div>

      {createPortal(
        <ConfirmModal
          open={!!confirmDeleteId}
          title={t("deleteCategory?")}
          message={t("categoryDeleteMsg")}
          confirmLabel={t("delete")}
          danger
          onConfirm={() => {
            setPickerCategoryId(null);
            setPickerAnchor(null);
            handleDelete();
          }}
          onCancel={() => setConfirmDeleteId(null)}
        />,
        document.body,
      )}

      {pickerCategoryId && pickerAnchor && !confirmDeleteId && (
        <IconPicker
          selected={categories.find((c) => c.id === pickerCategoryId)?.icon ?? "note"}
          onSelect={(iconId) => {
            logger.debug("Sidebar", `update icon: ${pickerCategoryId} -> ${iconId}`);
            onUpdateCategoryIcon(pickerCategoryId, iconId);
            setPickerCategoryId(null);
            setPickerAnchor(null);
          }}
          onClose={() => {
            setPickerCategoryId(null);
            setPickerAnchor(null);
          }}
          anchorEl={pickerAnchor}
        />
      )}

      {ctxMenu && !confirmDeleteId && (
        <ContextMenu
          items={[
            {
              id: "rename",
              label: t("rename"),
              icon: <IconEdit size={14} />,
              onClick: () => {
                const cat = categories.find((c) => c.id === ctxMenu.catId);
                if (cat) handleCtxRename(cat);
              },
            },
            {
              id: "icon",
              label: t("changeIcon"),
              icon: (
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                </svg>
              ),
              onClick: () => {
                const cat = categories.find((c) => c.id === ctxMenu.catId);
                if (cat) handleCtxIcon(cat);
              },
            },
            { id: "separator" },
            {
              id: "delete",
              label: t("delete"),
              danger: true,
              icon: <IconTrash size={14} />,
              onClick: () => {
                const cat = categories.find((c) => c.id === ctxMenu.catId);
                if (cat) handleCtxDelete(cat);
              },
            },
          ]}
          x={ctxMenu.x}
          y={ctxMenu.y}
          onClose={() => setCtxMenu(null)}
        />
      )}
    </nav>
  );
}
