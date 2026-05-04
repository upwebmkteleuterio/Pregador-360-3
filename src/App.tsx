import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import { Layout } from './components/Layout';
import Generate from './pages/Generate';
import ContentView from './pages/ContentView';
import Library from './pages/Library';
import Editor from './pages/Editor';
import Tags from './pages/Tags';
import BibleSearch from './pages/BibleSearch';
import PreachingMode from './pages/PreachingMode';
import NotesList from './pages/NotesList';
import NoteEditor from './pages/NoteEditor';
import Login from './pages/Login';
import ChoosePlan from './pages/ChoosePlan';
import Profile from './pages/Profile';
import Subscription from './pages/Subscription';
import AdminUsers from './pages/AdminUsers';
import AdminPlans from './pages/AdminPlans';
import LandingPage from './pages/LandingPage';
import { ExportModal, HistoryDrawer, MoreMenu, TagModal, CreateEditTagModal, DeleteConfirmModal, DeleteTagConfirmModal, AiCreditsModal, AudioPlayerDrawer } from './components/Modals';
import { AuthProvider } from './components/AuthProvider';
import { useStore } from './store/useStore';
import { Loader2 } from 'lucide-react';

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

function AppRoutes() {
  const { auth, authLoading } = useStore();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-main)]">
        <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
      </div>
    );
  }

  // Se NÃO estiver autenticado
  if (!auth.isAuthenticated) {
    return (
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        {/* Qualquer outra rota redireciona para a Landing Page se deslogado */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  // Se ESTIVER autenticado
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Generate />} />
        <Route path="/library" element={<Library />} />
        <Route path="/editor/:id" element={<Editor />} />
        <Route path="/bible" element={<BibleSearch />} />
        <Route path="/tags" element={<Tags />} />
        <Route path="/notes" element={<NotesList />} />
        <Route path="/notes/edit/:id" element={<NoteEditor />} />
        <Route path="/view/:id" element={<ContentView />} />
        <Route path="/preach/:id" element={<PreachingMode />} />
        <Route path="/plans" element={<ChoosePlan />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/subscription" element={<Subscription />} />
        {auth.user?.isAdmin && (
          <>
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/plans" element={<AdminPlans />} />
          </>
        )}
        {/* Qualquer outra rota redireciona para o Home (Generate) se logado */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <ScrollToTop />
        <AppRoutes />
        <ExportModal />
        <HistoryDrawer />
        <MoreMenu />
        <TagModal />
        <CreateEditTagModal />
        <DeleteConfirmModal />
        <DeleteTagConfirmModal />
        <AiCreditsModal />
        <AudioPlayerDrawer />
      </AuthProvider>
    </Router>
  );
}