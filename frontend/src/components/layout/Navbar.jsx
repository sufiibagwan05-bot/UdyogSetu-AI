```jsx
import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav className="app-navbar">
      <div className="nav-brand">
        <Link to="/">UdyogSetu AI</Link>
      </div>

      <div className="nav-links">
        <Link to="/">Dashboard</Link>
        <Link to="/analytics">Analytics</Link>
      </div>
    </nav>
  );
}

export default Navbar;
```
