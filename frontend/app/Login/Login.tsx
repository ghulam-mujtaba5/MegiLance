// @AI-HINT: This is the Login page root component. All styles are per-component only. See Login.common.css, Login.light.css, and Login.dark.css for theming.
import React from "react";
import Button from "../components/Button/Button";
import "./Login.common.css";
import "./Login.light.css";
import "./Login.dark.css";

interface LoginProps {
  theme?: "light" | "dark";
}

const Login: React.FC<LoginProps> = ({ theme = "light" }) => {
  return (
    <div className={`Login Login--${theme}`}>
      <header className="Login-header">
        <h1>Sign In</h1>
      </header>
      <main className="Login-main">
        <form className="Login-form">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" name="email" required />
          <label htmlFor="password">Password</label>
          <input id="password" type="password" name="password" required />
          <Button theme={theme} variant="primary" type="submit">Sign In</Button>
        </form>
      </main>
    </div>
  );
};

export default Login;
