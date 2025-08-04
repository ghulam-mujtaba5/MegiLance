'use client';
// @AI-HINT: This is the ThemeSwitcher button for toggling light/dark mode. Must be a client component.
import { useTheme } from "../../contexts/ThemeContext";
import styles from "../../layout.module.css";

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  return (
    <div className={styles.ThemeSwitcher}>
      <button
        className={styles.ThemeSwitcherButton}
        onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      >
        Switch to {theme === "light" ? "Dark" : "Light"} Mode
      </button>
    </div>
  );
}
