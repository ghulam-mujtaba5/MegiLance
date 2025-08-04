// @AI-HINT: This is the Dashboard page root component. All styles are per-component only. See Dashboard.common.css, Dashboard.light.css, and Dashboard.dark.css for theming.
import React, { ReactNode } from "react";
import Button from "../components/Button/Button";
import Navbar from "../components/Navbar/Navbar";
import Sidebar from "../components/Sidebar/Sidebar";
import "./Dashboard.common.css";
import "./Dashboard.light.css";
import "./Dashboard.dark.css";

interface DashboardProps {
  theme?: "light" | "dark";
}

const Dashboard: React.FC<DashboardProps> = ({ theme = "light" }) => {
  return (
    <div className={`Dashboard Dashboard--${theme}`}>
      <Navbar theme={theme}>
        <a href="/Dashboard">Dashboard</a>
        <a href="/Login">Logout</a>
      </Navbar>
      <div style={{ display: "flex", width: "100%", maxWidth: 1200, margin: "0 auto" }}>
        <Sidebar theme={theme}>
          <a href="/Dashboard">Overview</a>
          <a href="/Dashboard/projects">Projects</a>
          <a href="/Dashboard/payments">Payments</a>
          <a href="/Dashboard/profile">Profile</a>
        </Sidebar>
        <div style={{ flex: 1 }}>
          <header className="Dashboard-header">
            <h1>Welcome to Your Dashboard</h1>
            <p>Manage your projects, payments, and profile.</p>
          </header>
          <main className="Dashboard-main">
            <section>
              <h2>Quick Actions</h2>
              <Button theme={theme} variant="primary">Create Project</Button>
              <Button theme={theme} variant="secondary">Withdraw Funds</Button>
            </section>
            <section>
              <h2>Recent Activity</h2>
              <ul className="Dashboard-activity">
                <li>Project "Landing Page" paid by client</li>
                <li>Funds withdrawn to USDC wallet</li>
                <li>New review received: ⭐⭐⭐⭐⭐</li>
              </ul>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
