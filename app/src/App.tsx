import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './Layout';
import Home from './pages/Home';
import Team from './pages/Team';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="team" element={<Team />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
