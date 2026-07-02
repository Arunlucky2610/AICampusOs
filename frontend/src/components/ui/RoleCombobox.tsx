import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Code2, Globe, Database, Terminal, Monitor, Smartphone,
  Layout, Palette, Users, Briefcase, BarChart3, Brain,
  Sparkles, Search, ChevronDown, Clock, Plus,
  LucideIcon, Shield, GraduationCap, UserCheck,
} from "lucide-react";
import { cn } from "../../utils/cn";

interface RoleOption {
  label: string;
  icon: LucideIcon;
}

const ROLES: RoleOption[] = [
  { label: "Software Engineer", icon: Code2 },
  { label: "Full Stack Developer", icon: Globe },
  { label: "Frontend Developer", icon: Layout },
  { label: "Backend Developer", icon: Terminal },
  { label: "AI/ML Engineer", icon: Brain },
  { label: "Data Scientist", icon: BarChart3 },
  { label: "Data Analyst", icon: BarChart3 },
  { label: "GenAI Engineer", icon: Sparkles },
  { label: "Python Developer", icon: Code2 },
  { label: "Java Developer", icon: Code2 },
  { label: "React Developer", icon: Monitor },
  { label: "Node.js Developer", icon: Globe },
  { label: "DevOps Engineer", icon: Terminal },
  { label: "Cloud Engineer", icon: Globe },
  { label: "Cybersecurity Analyst", icon: Shield },
  { label: "QA Engineer", icon: UserCheck },
  { label: "Mobile App Developer", icon: Smartphone },
  { label: "Android Developer", icon: Smartphone },
  { label: "iOS Developer", icon: Smartphone },
  { label: "UI/UX Designer", icon: Palette },
  { label: "Product Manager", icon: Briefcase },
  { label: "Business Analyst", icon: BarChart3 },
  { label: "System Design Engineer", icon: Monitor },
  { label: "SDE-1", icon: Code2 },
  { label: "SDE-2", icon: Code2 },
  { label: "Graduate Trainee", icon: GraduationCap },
  { label: "Internship", icon: GraduationCap },
  { label: "Placement Interview", icon: Briefcase },
  { label: "HR Interview", icon: Users },
  { label: "Technical Interview", icon: Monitor },
];

const STORAGE_KEY = "mock_interview_recent_roles";
const MAX_RECENT = 5;

function getRecentRoles(): string[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
}

function saveRecentRole(role: string) {
  const recent = getRecentRoles().filter(r => r !== role);
  recent.unshift(role);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)));
}

function roleIcon(role: string): LucideIcon {
  const found = ROLES.find(r => r.label.toLowerCase() === role.toLowerCase());
  return found?.icon || Briefcase;
}

interface RoleComboboxProps {
  value: string;
  onChange: (value: string) => void;
}

export function RoleCombobox({ value, onChange }: RoleComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [customMode, setCustomMode] = useState(false);
  const [customValue, setCustomValue] = useState("");
  const [recentRoles, setRecentRoles] = useState<string[]>(getRecentRoles);
  const [activeIdx, setActiveIdx] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = ROLES.filter(r =>
    r.label.toLowerCase().includes(search.toLowerCase())
  );
  const showCustom = search.trim() && !filtered.some(r => r.label.toLowerCase() === search.toLowerCase());

  const items = [
    ...(recentRoles.length > 0 && !search ? [{ type: "header" as const, label: "Recent" }] : []),
    ...(recentRoles.length > 0 && !search
      ? recentRoles.map(r => ({ type: "recent" as const, label: r }))
      : []),
    ...(recentRoles.length > 0 && !search ? [{ type: "divider" as const }] : []),
    ...(!search ? [{ type: "header" as const, label: "All Roles" }] : []),
    ...filtered.map(r => ({ type: "role" as const, label: r.label })),
    ...(showCustom ? [{ type: "custom" as const, label: `Custom: "${search}"` }] : []),
  ];

  const selectedIdx = items.findIndex(
    i => i.type !== "header" && i.type !== "divider" && i.label === (i.type === "custom" ? `Custom: "${value}"` : value)
  );

  useEffect(() => { setActiveIdx(-1); }, [search]);

  useEffect(() => {
    if (open) {
      setSearch("");
      setCustomMode(false);
      setCustomValue("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSelect = useCallback((label: string) => {
    const actual = label.startsWith('Custom: "') && label.endsWith('"')
      ? label.slice(8, -1)
      : label;
    onChange(actual);
    saveRecentRole(actual);
    setRecentRoles(getRecentRoles());
    setOpen(false);
  }, [onChange]);

  const handleCustomSubmit = useCallback(() => {
    const trimmed = customValue.trim();
    if (trimmed) {
      onChange(trimmed);
      saveRecentRole(trimmed);
      setRecentRoles(getRecentRoles());
      setOpen(false);
      setCustomMode(false);
      setCustomValue("");
    }
  }, [customValue, onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const selectable = items.filter(i => i.type !== "header" && i.type !== "divider");
      const cur = selectable.findIndex(i => i.label === items[activeIdx]?.label);
      const next = Math.min(cur + 1, selectable.length - 1);
      setActiveIdx(items.findIndex(i => i.label === selectable[next]?.label));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const selectable = items.filter(i => i.type !== "header" && i.type !== "divider");
      const cur = selectable.findIndex(i => i.label === items[activeIdx]?.label);
      const prev = Math.max(cur - 1, 0);
      setActiveIdx(items.findIndex(i => i.label === selectable[prev]?.label));
    } else if (e.key === "Enter" && activeIdx >= 0) {
      e.preventDefault();
      const item = items[activeIdx];
      if (item && item.type !== "header" && item.type !== "divider") {
        if (item.type === "custom") {
          setCustomMode(true);
          setCustomValue(search);
        } else {
          handleSelect(item.label);
        }
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }, [activeIdx, items, handleSelect, search]);

  const ActiveIcon = roleIcon(value);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={cn(
          "flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-sm outline-none transition-all",
          open
            ? "border-[#6C4CF1] ring-1 ring-[#6C4CF1]"
            : "border-[#E8ECF1] hover:border-[#6C4CF1]/30",
        )}
      >
        <ActiveIcon size={15} className="shrink-0 text-[#6C4CF1]" />
        <span className={cn("flex-1 text-left", value ? "text-[#111827]" : "text-[#9CA3AF]")}>
          {value || "Select a role..."}
        </span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={14} className="text-[#6B7280]" />
        </motion.div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-xl border border-[#E8ECF1] bg-white shadow-xl"
          >
            {/* Search input */}
            <div className="flex items-center gap-2 border-b border-[#E8ECF1] px-3 py-2">
              <Search size={14} className="shrink-0 text-[#9CA3AF]" />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search roles..."
                className="w-full bg-transparent text-sm outline-none text-[#111827] placeholder:text-[#9CA3AF]"
              />
            </div>

            {/* List */}
            <div className="max-h-64 overflow-y-auto py-1" onKeyDown={handleKeyDown}>
              {items.map((item, i) => {
                if (item.type === "header") {
                  return (
                    <div key={item.label} className="flex items-center gap-1.5 px-3 py-1.5">
                      {item.label === "Recent" && <Clock size={11} className="text-[#9CA3AF]" />}
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF]">
                        {item.label}
                      </span>
                    </div>
                  );
                }
                if (item.type === "divider") {
                  return <div key="divider" className="mx-3 my-1 border-t border-[#E8ECF1]" />;
                }

                const isActive = activeIdx === i;
                const isSelected = item.label.replace(/^Custom: "/, "").replace(/"$/, "") === value;
                const Icon = item.type === "custom" ? Plus : item.type === "recent" ? Clock : roleIcon(item.label);

                return (
                  <button
                    key={`${item.type}-${item.label}`}
                    type="button"
                    onMouseEnter={() => setActiveIdx(i)}
                    onClick={() => {
                      if (item.type === "custom") {
                        setCustomMode(true);
                        setCustomValue(search);
                      } else {
                        handleSelect(item.label);
                      }
                    }}
                    className={cn(
                      "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors",
                      isActive ? "bg-[#6C4CF1]/10 text-[#6C4CF1]" : "text-[#374151]",
                      isSelected && !isActive && "bg-[#F5F7FA] font-medium",
                    )}
                  >
                    <Icon size={14} className={cn(
                      "shrink-0",
                      isActive ? "text-[#6C4CF1]" : "text-[#9CA3AF]",
                    )} />
                    <span className="truncate">
                      {item.type === "custom" ? (
                        <>
                          Add "<span className="font-medium">{search}</span>"
                        </>
                      ) : (
                        item.label
                      )}
                    </span>
                    {isSelected && (
                      <span className="ml-auto text-[10px] font-semibold text-[#6C4CF1]">Selected</span>
                    )}
                  </button>
                );
              })}

              {items.filter(i => i.type !== "header" && i.type !== "divider").length === 0 && (
                <div className="px-3 py-6 text-center text-xs text-[#9CA3AF]">
                  {search ? (
                    <div className="space-y-2">
                      <p>No roles matching "{search}"</p>
                      <button
                        onClick={() => { setCustomMode(true); setCustomValue(search); }}
                        className="rounded-lg bg-[#6C4CF1]/10 px-3 py-1.5 text-xs font-medium text-[#6C4CF1] transition hover:bg-[#6C4CF1]/20"
                      ><Plus size={12} className="inline mr-1" />Add "{search}" as custom role</button>
                    </div>
                  ) : (
                    "No roles available"
                  )}
                </div>
              )}
            </div>

            {/* Custom role inline input */}
            <AnimatePresence>
              {customMode && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-[#E8ECF1] overflow-hidden"
                >
                  <div className="flex items-center gap-2 px-3 py-2">
                    <input
                      type="text"
                      value={customValue}
                      onChange={e => setCustomValue(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") handleCustomSubmit(); if (e.key === "Escape") setOpen(false); }}
                      placeholder="Enter custom role..."
                      className="flex-1 rounded-lg border border-[#E8ECF1] px-2.5 py-1.5 text-xs outline-none focus:border-[#6C4CF1]"
                      autoFocus
                    />
                    <button
                      onClick={handleCustomSubmit}
                      disabled={!customValue.trim()}
                      className="rounded-lg bg-[#6C4CF1] px-2.5 py-1.5 text-[10px] font-semibold text-white transition hover:bg-[#5A3DD8] disabled:opacity-50"
                    >Add</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
