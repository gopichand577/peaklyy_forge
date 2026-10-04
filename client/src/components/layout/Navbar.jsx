import { Bell, ChevronDown, Code2, Zap } from "lucide-react";
import { useEditor } from "../../context/EditorContext";

export default function Navbar() {
  const { activeNav, setActiveNav } = useEditor();

  return (
    <header className="navbar">
      <nav className="nav-center-switcher" aria-label="Main Navigation">
        <button
          type="button"
          className={`nav-tab-btn ${activeNav === "compiler" ? "active" : ""}`}
          onClick={() => setActiveNav("compiler")}
        >
          <Code2 size={16} />
          <span>Compiler</span>
        </button>

        <button
          type="button"
          className={`nav-tab-btn ${activeNav === "practice" ? "active" : ""}`}
          onClick={() => setActiveNav("practice")}
        >
          <Zap size={15} />
          <span>Practice</span>
        </button>
      </nav>

      <div className="nav-user-section">
        <button className="icon-button notification-btn" aria-label="Notifications" title="Notifications">
          <Bell size={18} />
          <span className="notification-dot" />
        </button>

        <div className="user-profile-lockup">
          <div className="user-avatar">G</div>
          <div className="user-greeting">
            <small>Good Morning,</small>
            <strong>Gaurav</strong>
          </div>
          <ChevronDown size={14} className="user-chevron" />
        </div>
      </div>
    </header>
  );
}
