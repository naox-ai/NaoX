import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './lib/auth.jsx';
import { Web3Provider } from './lib/web3.jsx';
import { Navbar } from './components/Navbar.jsx';
import { Footer } from './components/Footer.jsx';
import { ExplorePage } from './pages/ExplorePage.jsx';
import { AgentDetailPage } from './pages/AgentDetailPage.jsx';
import { AuthPage } from './pages/AuthPage.jsx';
import { PublishPage } from './pages/PublishPage.jsx';
import { DashboardPage } from './pages/DashboardPage.jsx';
import { CategoriesPage } from './pages/CategoriesPage.jsx';
import LoadingScreen from './components/LoadingScreen.jsx';

function App() {
  return (
    <AuthProvider>
      <Web3Provider>
        <BrowserRouter>
          <div className='fixed top-0 w-full min-w-screen min-h-screen z-[55]'>
            <LoadingScreen />
          </div>
          <div className="min-h-screen flex flex-col bg-bg">
            <Navbar />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<ExplorePage />} />
                <Route path="/agent/:slug" element={<AgentDetailPage />} />
                <Route path="/categories" element={<CategoriesPage />} />
                <Route path="/publish" element={<PublishPage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/signin" element={<AuthPage mode="signin" />} />
                <Route path="/signup" element={<AuthPage mode="signup" />} />
                <Route path="*" element={<ExplorePage />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </BrowserRouter>
      </Web3Provider>
    </AuthProvider>
  );
}

export default App;
