import { Route, Routes } from 'react-router-dom'

import { Activities } from '@/components/Activities'
import { AiSearchPage } from '@/components/AiSearchPage'
import { AdminDashboard } from '@/components/AdminDashboard'
import { AuthModal } from '@/components/AuthModal'
import { AuthSync } from '@/components/AuthSync'
import { CartDrawer } from '@/components/CartDrawer'
import { Companion } from '@/components/Companion'
import { Faq } from '@/components/Faq'
import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import { Hero } from '@/components/Hero'
import { Packages } from '@/components/Packages'
import { PaywallModal } from '@/components/PaywallModal'
import { Plans } from '@/components/Plans'
import { ProductDetailPage } from '@/components/ProductDetailPage'
import { SearchPanel } from '@/components/SearchPanel'
import { Stays } from '@/components/Stays'
import { TourGuidePanel } from '@/components/TourGuidePanel'
import { TraditionalSearchPage } from '@/components/TraditionalSearchPage'
import { Transport } from '@/components/Transport'
<<<<<<< HEAD
import { PageTransition, TopLoadingBar } from '@/components/ui/PageTransition'
import { VoiceGuide } from '@/components/VoiceGuide'
import { AppProvider } from '@/state/store'

function Home() {
  return (
    <>
      <Hero />
      <SearchPanel />
      <Stays />
      <Activities />
      <Transport />
      <Packages />
      <Companion />
      <Plans />
      <Faq />
    </>
  )
}
=======
import { VisitorBeacon } from '@/components/VisitorBeacon'
import { VoiceGuide } from '@/components/VoiceGuide'
import { AppProvider } from '@/state/store'

// No router in this prototype (single scrolling page) — /admin is the one
// exception, checked once at load. Reload the page to leave it.
const isAdminPath = window.location.pathname.replace(/\/+$/, '') === '/admin'
>>>>>>> main

export default function App() {
  return (
    <AppProvider>
<<<<<<< HEAD
      <TopLoadingBar />
      <Header />

      <main>
        <PageTransition>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/listing/:category/:id" element={<ProductDetailPage />} />
            <Route path="/search" element={<AiSearchPage />} />
            <Route path="/search/traditional" element={<TraditionalSearchPage />} />
          </Routes>
        </PageTransition>
      </main>
=======
      <AuthSync />

      {isAdminPath ? (
        <AdminDashboard />
      ) : (
        <>
          <VisitorBeacon />
          <Header />
>>>>>>> main

          <main>
            <Hero />
            <SearchPanel />
            <Stays />
            <Activities />
            <Transport />
            <Packages />
            <Companion />
            <Plans />
            <Faq />
          </main>

<<<<<<< HEAD
      {/* Overlays */}
      <CartDrawer />
      <PaywallModal />
      <VoiceGuide />
      <TourGuidePanel />
      <AuthModal />
=======
          <Footer />

          {/* Overlays */}
          <CartDrawer />
          <PaywallModal />
          <VoiceGuide />
          <AuthModal />
        </>
      )}
>>>>>>> main
    </AppProvider>
  )
}
