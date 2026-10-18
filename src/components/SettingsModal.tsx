"use client";

import React, { useState } from "react";
import { X, UserCheck, Shield, Check, Heart } from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  participants: string[];
  myName: string;
  crushName: string;
  relationshipStatus: string;
  onUpdateRoles: (myName: string, crushName: string) => void;
  onChangeStatus: (status: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  participants,
  myName,
  crushName,
  relationshipStatus,
  onUpdateRoles,
  onChangeStatus,
}) => {
  const [selectedMe, setSelectedMe] = useState(myName);
  const [selectedCrush, setSelectedCrush] = useState(crushName);
  const [selectedStatus, setSelectedStatus] = useState(relationshipStatus);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onUpdateRoles(selectedMe, selectedCrush);
    onChangeStatus(selectedStatus);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 select-none">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-gray-800">
              身份偏好与关系设置
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-md flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 text-xs">
          {/* 1. 角色设定 */}
          {participants.length > 0 ? (
            <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-100 space-y-3">
              <div className="flex items-center gap-1.5 font-medium text-gray-700">
                <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>发言角色归属</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-500 mb-1 block">谁是【我】（右侧绿气泡）</label>
                  <select
                    value={selectedMe}
                    onChange={(e) => setSelectedMe(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs text-gray-800 outline-none focus:border-emerald-500"
                  >
                    {participants.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-gray-500 mb-1 block">谁是【对方Crush】（左侧）</label>
                  <select
                    value={selectedCrush}
                    onChange={(e) => setSelectedCrush(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs text-gray-800 outline-none focus:border-emerald-500"
                  >
                    {participants.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ) : null}

          {/* 2. 关系定位设定 */}
          <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-100 space-y-2">
            <label className="text-gray-700 font-medium flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 text-rose-500" />
              当前关系阶段定位
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs text-gray-800 outline-none focus:border-emerald-500"
            >
              <option value="Crush / 暧昧升温中">Crush / 暧昧升温中</option>
              <option value="Crush / 刚刚认识">Crush / 刚刚认识</option>
              <option value="Crush / 破冰拉扯">Crush / 破冰拉扯</option>
              <option value="Crush / 忽冷忽热">Crush / 忽冷忽热</option>
              <option value="普通朋友 / 试探边界">普通朋友 / 试探边界</option>
            </select>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs text-gray-600 hover:bg-gray-200/60 rounded-lg transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors flex items-center gap-1 shadow-xs"
          >
            {savedSuccess ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>已保存</span>
              </>
            ) : (
              <span>保存设置</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
