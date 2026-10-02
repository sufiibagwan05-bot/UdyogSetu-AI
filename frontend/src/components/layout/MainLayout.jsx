```jsx
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";

function MainLayout() {
  return (
    <div className="app-layout">
      <Navbar />

      <header className="app-header">
        <div className="brand">
          <h1>UdyogSetu AI</h1>
          <p>
            Intelligent Industrial Approval & Compliance
            Management Platform
          </p>
        </div>
      </header>

      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}

export default MainLayout;
```
