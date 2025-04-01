
import { Outlet } from "react-router-dom";
import Header from "./components/Header";
import Banner from "./components/Banner";

function App() {
  return (
    <div>
      <Header />
      <Banner />
      <main className="pt-20">
        <Outlet />
      </main>
    </div>
  );
}

export default App;