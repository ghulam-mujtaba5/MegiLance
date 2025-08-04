// @AI-HINT: This is the Home page root component. All styles are per-component only. See Home.common.css, Home.light.css, and Home.dark.css for theming.
import React from "react";
import Button from "../components/Button/Button";
import "./Home.common.css";
import "./Home.light.css";
import "./Home.dark.css";

interface HomeProps {
  theme?: "light" | "dark";
}

const Home: React.FC<HomeProps> = ({ theme = "light" }) => {
  return (
    <div className={`Home Home--${theme}`}>
      <header className="Home-header">
        <h1>MegiLance</h1>
        <p>Empowering Freelancers with AI and Secure USDC Payments</p>
      </header>
      <main className="Home-main">
        <Button theme={theme} variant="primary">Get Started</Button>
        <Button theme={theme} variant="secondary">Learn More</Button>
      </main>
    </div>
  );
};

export default Home;
