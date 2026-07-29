import { Activities } from '@/components/Activities'
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
import { SearchPanel } from '@/components/SearchPanel'
import { Stays } from '@/components/Stays'
import { Transport } from '@/components/Transport'
import { VoiceGuide } from '@/components/VoiceGuide'
import { AppProvider } from '@/state/store'

// No router in this prototype (single scrolling page) — /admin is the one
// exception, checked once at load. Reload the page to leave it.
const isAdminPath = window.location.pathname.replace(/\/+$/, '') === '/admin'

export default function App() {
  return (
    <AppProvider>
      <AuthSync />

      {isAdminPath ? (
        <AdminDashboard />
      ) : (
        <>
          <Header />

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

          <Footer />

          {/* Overlays */}
          <CartDrawer />
          <PaywallModal />
          <VoiceGuide />
          <AuthModal />
        </>
      )}
    </AppProvider>
  )
}
