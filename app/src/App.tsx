import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
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
import AdminSponsorshipInquiries from './pages/AdminSponsorshipInquiries';
import AdminSponsorship from './pages/AdminSponsorship';
import AdminSponsorshipDiscoveryQuestions from './pages/AdminSponsorshipDiscoveryQuestions';
import AdminSponsorshipDiscoverySubmissions from './pages/AdminSponsorshipDiscoverySubmissions';
import AdminSponsorshipBanners from './pages/AdminSponsorshipBanners';
import AdminArticlesList from './pages/AdminArticlesList';
import AdminEventsList from './pages/AdminEventsList';
import AdminGalleryList from './pages/AdminGalleryList';
import AdminPodcastList from './pages/AdminPodcastList';
import AdminWatchList from './pages/AdminWatchList';
import AdminTeamList from './pages/AdminTeamList';
import AdminSocialLinks from './pages/AdminSocialLinks';
import WorkWithUs from './pages/WorkWithUs';
import ListenWatch from './pages/ListenWatch';
import Sponsorship from './pages/Sponsorship';
import './App.css';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function AuthSessionHandler() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    const handleSessionExpired = () => {
      logout();
      navigate('/superuser', { replace: true });
    };
    window.addEventListener('auth:session-expired', handleSessionExpired);
    return () => window.removeEventListener('auth:session-expired', handleSessionExpired);
  }, [logout, navigate]);
  return null;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AuthSessionHandler />
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
            <Route path="gallery/:categorySlug" element={<Gallery />} />
            <Route path="listen-watch" element={<ListenWatch />} />
            <Route path="work-with-us" element={<WorkWithUs />} />
            <Route path="sponsorship" element={<Sponsorship />} />
          </Route>
          <Route path="superuser" element={<AdminLogin />} />
          <Route path="admin" element={<AdminDashboard />} />
          <Route path="admin/work-with-us-submissions" element={<AdminWorkWithUsSubmissions />} />
          <Route path="admin/newsletter-signups" element={<AdminNewsletterSignups />} />
          <Route path="admin/sponsorship-inquiries" element={<AdminSponsorshipInquiries />} />
          <Route path="admin/sponsorship" element={<AdminSponsorship />} />
          <Route path="admin/sponsorship-discovery-questions" element={<AdminSponsorshipDiscoveryQuestions />} />
          <Route path="admin/sponsorship-discovery-submissions" element={<AdminSponsorshipDiscoverySubmissions />} />
          <Route path="admin/sponsorship-banners" element={<AdminSponsorshipBanners />} />
          <Route path="admin/articles" element={<AdminArticlesList />} />
          <Route path="admin/events" element={<AdminEventsList />} />
          <Route path="admin/gallery" element={<AdminGalleryList />} />
          <Route path="admin/show" element={<AdminPodcastList />} />
          <Route path="admin/watch" element={<AdminWatchList />} />
          <Route path="admin/team" element={<AdminTeamList />} />
          <Route path="admin/social-links" element={<AdminSocialLinks />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
