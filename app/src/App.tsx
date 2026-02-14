import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './Layout';
import Home from './pages/Home';
import Team from './pages/Team';
import Stories from './pages/Stories';
import StoryDetail from './pages/StoryDetail';
import Coverage from './pages/Coverage';
import EventGallery from './pages/EventGallery';
import Events from './pages/Events';
import Gallery from './pages/Gallery';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AdminWorkWithUsSubmissions from './pages/AdminWorkWithUsSubmissions';
import AdminNewsletterSignups from './pages/AdminNewsletterSignups';
import WorkWithUs from './pages/WorkWithUs';
import ListenWatch from './pages/ListenWatch';
import './App.css';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="stories" element={<Stories />} />
            <Route path="stories/:id" element={<StoryDetail />} />
            <Route path="coverage" element={<Coverage />} />
            <Route path="coverage/event/:eventId" element={<EventGallery />} />
            <Route path="events" element={<Events />} />
            <Route path="team" element={<Team />} />
            <Route path="gallery" element={<Gallery />} />
            <Route path="listen-watch" element={<ListenWatch />} />
            <Route path="work-with-us" element={<WorkWithUs />} />
          </Route>
          <Route path="superuser" element={<AdminLogin />} />
          <Route path="admin" element={<AdminDashboard />} />
          <Route path="admin/work-with-us-submissions" element={<AdminWorkWithUsSubmissions />} />
          <Route path="admin/newsletter-signups" element={<AdminNewsletterSignups />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
