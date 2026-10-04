import {
  CheckCircle2,
  ChevronRight,
  Search,
  Shuffle,
  Trophy,
  X,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";
import DifficultyBadge from "../common/DifficultyBadge";

export default function ProblemCatalog({
  problemsList = [],
  openProblem,
  pickRandomProblem,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDifficulty, setFilterDifficulty] = useState("All");
  const [filterTopic, setFilterTopic] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");

  const filteredProblems = useMemo(() => {
    return problemsList.filter((p) => {
      if (
        filterDifficulty !== "All" &&
        p.difficulty?.toLowerCase() !== filterDifficulty.toLowerCase()
      ) {
        return false;
      }
      if (filterTopic !== "All" && !p.topics?.includes(filterTopic)) {
        return false;
      }
      if (filterStatus === "Solved" && !p.isSolved) return false;
      if (filterStatus === "Unsolved" && p.isSolved) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = p.title?.toLowerCase().includes(q);
        const matchNumber = String(p.problemNumber || "").includes(q);
        const matchTags = p.topics?.some((t) => t.toLowerCase().includes(q));
        if (!matchTitle && !matchNumber && !matchTags) return false;
      }
      return true;
    });
  }, [problemsList, filterDifficulty, filterTopic, filterStatus, searchQuery]);

  const solvedCount = problemsList.filter((p) => p.isSolved).length;

  return (
    <div className="forge-practice-catalog">
      <div className="practice-hero-banner">
        <div className="hero-banner-content">
          <div className="hero-brand-tag">
            <Zap size={14} className="text-red" />
            <span>PEAKLYY FORGE PRACTICE</span>
          </div>
          <h2>Algorithmic Problem Catalog</h2>
          <p>
            Solve curated algorithmic challenges with multi-language execution, standard input,
            and real-time automated judge evaluation.
          </p>
        </div>

        <div className="hero-stats-cards">
          <div className="hero-stat-box">
            <div className="stat-box-icon">
              <Trophy size={18} />
            </div>
            <div className="stat-box-info">
              <span className="stat-box-label">Solved</span>
              <strong>
                {solvedCount} / {problemsList.length}
              </strong>
            </div>
          </div>

          <button
            type="button"
            className="forge-pick-random-btn"
            onClick={pickRandomProblem}
            title="Pick a random problem"
          >
            <Shuffle size={15} />
            <span>Pick Random</span>
          </button>
        </div>
      </div>

      <div className="difficulty-quick-chips">
        <button
          type="button"
          className={`diff-chip ${filterDifficulty === "All" ? "active" : ""}`}
          onClick={() => setFilterDifficulty("All")}
        >
          <span>All Problems</span>
          <span className="chip-count">{problemsList.length}</span>
        </button>
        <button
          type="button"
          className={`diff-chip easy ${filterDifficulty === "Easy" ? "active" : ""}`}
          onClick={() => setFilterDifficulty("Easy")}
        >
          <span>Easy</span>
          <span className="chip-count">
            {problemsList.filter((p) => p.difficulty === "Easy").length}
          </span>
        </button>
        <button
          type="button"
          className={`diff-chip medium ${filterDifficulty === "Medium" ? "active" : ""}`}
          onClick={() => setFilterDifficulty("Medium")}
        >
          <span>Medium</span>
          <span className="chip-count">
            {problemsList.filter((p) => p.difficulty === "Medium").length}
          </span>
        </button>
        <button
          type="button"
          className={`diff-chip hard ${filterDifficulty === "Hard" ? "active" : ""}`}
          onClick={() => setFilterDifficulty("Hard")}
        >
          <span>Hard</span>
          <span className="chip-count">
            {problemsList.filter((p) => p.difficulty === "Hard").length}
          </span>
        </button>
      </div>

      <div className="forge-catalog-toolbar">
        <div className="catalog-search-field">
          <Search size={15} className="search-field-icon" />
          <input
            type="text"
            placeholder="Search questions by title, number, or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-field-input"
          />
          {searchQuery && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => setSearchQuery("")}
            >
              <X size={13} />
            </button>
          )}
        </div>

        <div className="catalog-dropdown-filters">
          <div className="dropdown-filter-wrap">
            <select
              value={filterTopic}
              onChange={(e) => setFilterTopic(e.target.value)}
              className="forge-dropdown-select"
            >
              <option value="All">All Topics</option>
              <option value="Arrays">Arrays</option>
              <option value="Strings">Strings</option>
              <option value="Hash Table">Hash Table</option>
              <option value="Math">Math</option>
              <option value="Linked List">Linked List</option>
              <option value="Dynamic Programming">Dynamic Programming</option>
              <option value="Stack">Stack</option>
              <option value="Two Pointers">Two Pointers</option>
              <option value="Binary Search">Binary Search</option>
            </select>
          </div>

          <div className="dropdown-filter-wrap">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="forge-dropdown-select"
            >
              <option value="All">All Status</option>
              <option value="Solved">Solved Only</option>
              <option value="Unsolved">Unsolved Only</option>
            </select>
          </div>
        </div>
      </div>

      <div className="forge-problems-table-card">
        <table className="forge-problems-table">
          <thead>
            <tr>
              <th style={{ width: "55px", textAlign: "center" }}>Status</th>
              <th>Title</th>
              <th>Topics</th>
              <th style={{ width: "130px" }}>Acceptance</th>
              <th style={{ width: "120px" }}>Difficulty</th>
              <th style={{ width: "90px", textAlign: "right" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredProblems.length === 0 ? (
              <tr>
                <td colSpan={6} className="table-empty-row">
                  <p>No challenges match your search filters.</p>
                </td>
              </tr>
            ) : (
              filteredProblems.map((prob) => (
                <tr
                  key={prob.id}
                  onClick={() => openProblem(prob.id)}
                  className="forge-problem-row"
                >
                  <td className="status-cell">
                    {prob.isSolved ? (
                      <span className="solved-indicator-badge" title="Solved">
                        <CheckCircle2 size={16} />
                      </span>
                    ) : (
                      <span className="unsolved-indicator-dot" />
                    )}
                  </td>
                  <td className="title-cell">
                    <span className="problem-num-badge">#{prob.problemNumber}</span>
                    <span className="problem-title-link">{prob.title}</span>
                  </td>
                  <td className="topics-cell">
                    <div className="topics-tag-wrap">
                      {prob.topics?.map((topic) => (
                        <span key={topic} className="forge-topic-tag">
                          {topic}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="acceptance-cell">
                    <span className="acceptance-val">
                      {prob.acceptanceRate || (prob.totalSubmissions > 0 ? "0%" : "—")}
                    </span>
                  </td>
                  <td className="difficulty-cell">
                    <DifficultyBadge difficulty={prob.difficulty} short />
                  </td>
                  <td className="action-cell">
                    <button
                      type="button"
                      className="forge-solve-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        openProblem(prob.id);
                      }}
                    >
                      Solve
                      <ChevronRight size={13} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
