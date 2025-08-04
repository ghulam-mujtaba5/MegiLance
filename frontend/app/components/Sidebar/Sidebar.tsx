// @AI-HINT: This is the Sidebar component entry point. All styles are per-component only. See Sidebar.common.css, Sidebar.light.css, and Sidebar.dark.css for theming.
import React, { ReactNode, HTMLAttributes } from "react";
import "./Sidebar.common.css";
import "./Sidebar.light.css";
import "./Sidebar.dark.css";

interface SidebarProps extends HTMLAttributes<HTMLElement> {
  theme?: "light" | "dark";
  children?: ReactNode;
}

const Sidebar: React.FC<SidebarProps> = ({ theme = "light", children, ...rest }) => {
  return (
    <aside className={`Sidebar Sidebar--${theme}`} {...rest}>
      {children}
    </aside>
  );
};

export default Sidebar;
