import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './Layout';
import Home from './pages/Home';
import Team from './pages/Team';
import Stories from './pages/Stories';
import Coverage from './pages/Coverage';
import Gallery from './pages/Gallery';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="stories" element={<Stories />} />
          <Route path="coverage" element={<Coverage />} />
          <Route path="team" element={<Team />} />
          <Route path="gallery" element={<Gallery />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
