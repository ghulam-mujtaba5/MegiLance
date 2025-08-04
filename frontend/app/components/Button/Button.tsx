// @AI-HINT: This is the Button component entry point. All styles are per-component only. See Button.common.css, Button.light.css, and Button.dark.css for theming.
// Do not use globals.css or any theme-wide CSS files.
import React, { ReactNode, ButtonHTMLAttributes } from "react";
import "./Button.common.css";
import "./Button.light.css";
import "./Button.dark.css";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  theme?: "light" | "dark";
  variant?: "primary" | "secondary";
  children: ReactNode;
}

const Button: React.FC<ButtonProps> = ({ theme = "light", variant = "primary", children, ...rest }) => {
  return (
    <button
      className={`Button Button--${variant} Button--${theme}`}
      {...rest}
    >
      {children}
    </button>
  );
};

export default Button;
