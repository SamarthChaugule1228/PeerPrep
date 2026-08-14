import React from 'react';
import { useAuth } from '../context/AuthContext';
import { HeroSection, FeaturesSection, CTASection } from '../components/Home/HomeSections';
import { FeaturesRulesModal } from '../components/FeaturesRulesModal';

const Home = () => {
  const { isAuthenticated } = useAuth();
  const [showFeaturesModal, setShowFeaturesModal] = React.useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black text-white overflow-hidden">
      {/* Navigation Spacer */}
      <div className="h-20 sm:h-24"></div>

      <main className="relative">
        {/* Hero Section */}
        <HeroSection />

        {/* Features Section */}
        <FeaturesSection />

        {/* CTA Section */}
        <CTASection />

        {/* Footer */}
        <footer className="border-t border-white/10 bg-gradient-to-b from-transparent to-gray-900/50 mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
              <div>
                <h3 className="font-bold text-lg mb-4">PeerPrep</h3>
                <p className="text-gray-400 text-sm">Practice interviews. Get better. Together.</p>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Product</h4>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li><a href="#" className="hover:text-white transition">Features</a></li>
                  <li><a href="#" className="hover:text-white transition">Pricing</a></li>
                  <li><a href="#" className="hover:text-white transition">How it works</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Company</h4>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li><a href="#" className="hover:text-white transition">About</a></li>
                  <li><a href="#" className="hover:text-white transition">Blog</a></li>
                  <li><a href="#" className="hover:text-white transition">Contact</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Legal</h4>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li><a href="#" className="hover:text-white transition">Privacy</a></li>
                  <li><a href="#" className="hover:text-white transition">Terms</a></li>
                  <li><a href="#" className="hover:text-white transition">Security</a></li>
                </ul>
              </div>
            </div>

            <div className="border-t border-white/10 pt-8">
              <p className="text-center text-sm text-gray-400">
                © 2026 PeerPrep. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </main>

      {/* Features & Rules Modal */}
      {showFeaturesModal && (
        <FeaturesRulesModal onClose={() => setShowFeaturesModal(false)} />
      )}
    </div>
  );
};

export default Home;
