import React from 'react';
import { useAuth } from '../context/AuthContext';
import { HeroSection, FeaturesSection, CTASection } from '../components/Home/HomeSections';
import FeaturesRulesModal from '../components/FeaturesRulesModal';

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
      </main>

      {/* Features & Rules Modal */}
      {showFeaturesModal && (
        <FeaturesRulesModal onClose={() => setShowFeaturesModal(false)} />
      )}
    </div>
  );
};

export default Home;