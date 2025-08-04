// @AI-HINT: This is the Navbar component entry point. All styles are per-component only. See Navbar.common.css, Navbar.light.css, and Navbar.dark.css for theming.
import React, { ReactNode, HTMLAttributes } from "react";
import "./Navbar.common.css";
import "./Navbar.light.css";
import "./Navbar.dark.css";

interface NavbarProps extends HTMLAttributes<HTMLElement> {
  theme?: "light" | "dark";
  children?: ReactNode;
}

const Navbar: React.FC<NavbarProps> = ({ theme = "light", children, ...rest }) => {
  return (
    <nav className={`Navbar Navbar--${theme}`} {...rest}>
      <div className="Navbar-logo">MegiLance</div>
      <div className="Navbar-links">{children}</div>
    </nav>
  );
};

export default Navbar;
