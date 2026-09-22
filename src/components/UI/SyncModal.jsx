import React, { useState } from 'react';
import { Cloud, X, Copy, Check, Smartphone, ArrowRight, RefreshCw } from 'lucide-react';

export default function SyncModal({ 
  isOpen, 
  onClose, 
  deviceId, 
  onSwitchDevice, 
  isCloudConnected 
}) {
  const [inputCode, setInputCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(deviceId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApplyCode = async (e) => {
    e.preventDefault();
    if (!inputCode.trim()) return;
    setIsLoading(true);
    await onSwitchDevice(inputCode.trim().toUpperCase());
    setIsLoading(false);
    setInputCode('');
    onClose();
  };

  return (
    <div className="modal-backdrop">
      <div className="glass-panel sync-modal-card">
        <div className="sync-modal-header">
          <div className="sync-modal-title">
            <div className="sync-status-icon">
              <Cloud size={20} color={isCloudConnected ? '#10b981' : '#64748b'} />
            </div>
            <div>
              <h3>雲端同步與裝置管理</h3>
              <span className="sync-status-badge">
                {isCloudConnected ? '🟢 Supabase 雲端資料庫已連線' : '⚪ 本地模式 (LocalStorage)'}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="drawer-close-btn">
            <X size={18} />
          </button>
        </div>

        <div className="sync-modal-body">
          {/* 目前裝置同步碼 */}
          <div className="sync-box">
            <div className="sync-box-label">你的裝置同步碼 (Sync ID)</div>
            <div className="sync-code-display">
              <span className="code-text">{deviceId}</span>
              <button onClick={handleCopy} className="glass-btn copy-btn" title="複製同步碼">
                {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                <span>{copied ? '已複製' : '複製'}</span>
              </button>
            </div>
            <p className="sync-hint">
              可在手機或其他電腦瀏覽器輸入此代碼，無縫同步你的最愛城市與底圖偏好。
            </p>
          </div>

          {/* 切換/載入其他裝置 */}
          <form onSubmit={handleApplyCode} className="sync-input-group">
            <label className="sync-box-label">輸入其他裝置的同步碼</label>
            <div className="input-with-btn">
              <input
                type="text"
                placeholder="例如：DEV-X9B2C4"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                className="sync-text-input"
              />
              <button
                type="submit"
                disabled={!inputCode.trim() || isLoading}
                className="glass-btn sync-submit-btn"
              >
                {isLoading ? <RefreshCw size={14} className="animate-spin" /> : <ArrowRight size={14} />}
                <span>載入</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
