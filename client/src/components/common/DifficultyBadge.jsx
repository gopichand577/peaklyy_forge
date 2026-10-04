export default function DifficultyBadge({ difficulty = "Medium", short = false }) {
  const diff = difficulty || "Medium";
  const label = short && diff === "Medium" ? "Med." : diff;

  return (
    <span className={`forge-diff-tag ${diff.toLowerCase()}`}>
      {label}
    </span>
  );
}
