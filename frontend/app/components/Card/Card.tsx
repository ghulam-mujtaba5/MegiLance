// @AI-HINT: This is the Card component entry point. All styles are per-component only. See Card.common.css, Card.light.css, and Card.dark.css for theming.
import React, { ReactNode, HTMLAttributes } from "react";
import "./Card.common.css";
import "./Card.light.css";
import "./Card.dark.css";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  theme?: "light" | "dark";
  children: ReactNode;
}

const Card: React.FC<CardProps> = ({ theme = "light", children, ...rest }) => {
  return (
    <div className={`Card Card--${theme}`} {...rest}>
      {children}
    </div>
  );
};

export default Card;
