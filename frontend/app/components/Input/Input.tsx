// @AI-HINT: This is the Input component entry point. All styles are per-component only. See Input.common.css, Input.light.css, and Input.dark.css for theming.
import React, { InputHTMLAttributes } from "react";
import "./Input.common.css";
import "./Input.light.css";
import "./Input.dark.css";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  theme?: "light" | "dark";
}

const Input: React.FC<InputProps> = ({ theme = "light", type = "text", placeholder = "", ...rest }) => {
  return (
    <input
      className={`Input Input--${theme}`}
      type={type}
      placeholder={placeholder}
      {...rest}
    />
  );
};

export default Input;
