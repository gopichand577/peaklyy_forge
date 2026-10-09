import React from "react";
import { Sliders, Settings, User } from "lucide-react";
import { useEditor } from "../../context/EditorContext";

export default function ProfileMenu({ isOpen, onClose }) {
  const { profile, setActiveNav } = useEditor();

  if (!isOpen) return null;

  const handleNavigate = (navTarget) => {
    setActiveNav(navTarget);
    onClose();
  };

  const initial = (profile.displayName || "G").charAt(0).toUpperCase();

  return (
    <div className="profile-menu-popover" role="dialog" aria-label="User Profile Menu">
      <div className="profile-menu-header">
        <div className="profile-menu-avatar">{initial}</div>
        <div className="profile-menu-user-info">
          <strong className="profile-menu-name">{profile.displayName || "Gaurav"}</strong>
          <span className="profile-menu-role">{profile.title || "Developer"}</span>
        </div>
      </div>

      <div className="profile-menu-divider" />

      <div className="profile-menu-items">
        <button
          type="button"
          className="profile-menu-item"
          onClick={() => handleNavigate("profile")}
        >
          <User size={15} />
          <span>Profile</span>
        </button>

        <button
          type="button"
          className="profile-menu-item"
          onClick={() => handleNavigate("settings")}
        >
          <Settings size={15} />
          <span>Settings</span>
        </button>

        <button
          type="button"
          className="profile-menu-item"
          onClick={() => handleNavigate("settings")}
        >
          <Sliders size={15} />
          <span>Preferences</span>
        </button>
      </div>
    </div>
  );
}
