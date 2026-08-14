import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button, Container, GradientText, Badge, Card } from '../UI/Button';
import { ASSETS } from '../../config/assets';
import { Zap, Users, Clock, Star, MessageSquare, Shield } from 'lucide-react';

/**
 * Hero Section Component
 */
export const HeroSection = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8 },
    },
  };

  return (
    <section className="min-h-screen relative flex items-center pt-20 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-8 right-10 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-2000"></div>
      </div>

      <Container className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        {/* Left Content */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="text-white space-y-8"
        >
          <motion.div variants={itemVariants}>
            <Badge variant="default" className="inline-block">
              👥 PRACTICE • IMPROVE • SUCCEED
            </Badge>
          </motion.div>

          <motion.div variants={itemVariants} className="space-y-4">
            <h1 className="text-5xl md:text-6xl font-bold leading-tight">
              Practice Interviews.
              <br />
              Get Better. <GradientText>Together.</GradientText>
            </h1>
            <p className="text-xl text-gray-300 leading-relaxed max-w-lg">
              PeerPrep connects you with the right peers or interviewers instantly or at your
              preferred time. Practice, improve, and succeed together.
            </p>
          </motion.div>

          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4">
            <Link to="/dashboard">
              <Button variant="primary" size="lg" className="w-full sm:w-auto">
                <Zap size={20} />
                Start Instant Interview
              </Button>
            </Link>
            <Link to="/scheduled-interviews">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                📅 Schedule Interview
              </Button>
            </Link>
          </motion.div>

          {/* Features Below CTA */}
          <motion.div
            variants={itemVariants}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8 border-t border-white/10"
          >
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Users size={20} className="text-purple-400" />
                <h3 className="font-semibold">Smart Matching</h3>
              </div>
              <p className="text-sm text-gray-400">Match based on skills, role & preferences</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Clock size={20} className="text-purple-400" />
                <h3 className="font-semibold">Real-time Sessions</h3>
              </div>
              <p className="text-sm text-gray-400">Video, audio & code in real time</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <MessageSquare size={20} className="text-purple-400" />
                <h3 className="font-semibold">Feedback & Growth</h3>
              </div>
              <p className="text-sm text-gray-400">Get constructive feedback & improve faster</p>
            </div>
          </motion.div>
        </motion.div>

        {/* Right Illustration */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative hidden md:block"
        >
          <div className="relative">
            <img
              src={ASSETS.illustrations.heroDevelopers}
              alt="Developers collaborating on code"
              className="w-full h-auto object-cover rounded-2xl shadow-2xl"
            />
            <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-purple-500/20 rounded-full blur-2xl"></div>
            <div className="absolute -top-6 -left-6 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl"></div>
          </div>
        </motion.div>
      </Container>
    </section>
  );
};

/**
 * Features Section Component
 */
export const FeaturesSection = () => {
  const features = [
    {
      icon: <Users size={28} />,
      title: 'Smart Matching',
      description: 'Get paired with study partners based on your skills and interview goals',
    },
    {
      icon: <Clock size={28} />,
      title: 'Scheduled Interviews',
      description: 'Book and schedule mock interviews at your convenience',
    },
    {
      icon: <MessageSquare size={28} />,
      title: 'Real-time Collaboration',
      description: 'Chat, share code, and collaborate during interview sessions',
    },
    {
      icon: <Star size={28} />,
      title: 'Feedback System',
      description: 'Get detailed feedback after each interview session',
    },
    {
      icon: <Zap size={28} />,
      title: 'Live Editor',
      description: 'Write and execute code together in real-time',
    },
    {
      icon: <Shield size={28} />,
      title: 'Secure Platform',
      description: 'Your data and sessions are fully encrypted and secure',
    },
  ];

  return (
    <section id="features" className="py-20 relative overflow-hidden">
      <Container>
        <div className="space-y-16">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center space-y-4 max-w-2xl mx-auto"
          >
            <Badge variant="default" className="inline-block mx-auto">
              ✨ KEY FEATURES
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-white">
              Everything you need to <GradientText>ace your interviews</GradientText>
            </h2>
            <p className="text-xl text-gray-400">
              Comprehensive tools and features designed to help you practice and improve
            </p>
          </motion.div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full group cursor-pointer">
                  <div className="space-y-4">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 text-white flex items-center justify-center group-hover:scale-110 transition-transform">
                      {feature.icon}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-gray-400 text-sm leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
};

/**
 * CTA Section Component
 */
export const CTASection = () => {
  return (
    <section className="py-20 relative overflow-hidden">
      <Container>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-3xl p-12 md:p-16 text-center space-y-8"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white">
            Ready to ace your <span className="underline decoration-purple-300">interviews</span>?
          </h2>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            Join hundreds of professionals preparing for their dream roles. Start practicing today!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button variant="primary" size="lg" className="bg-white text-purple-600 hover:bg-gray-100">
                Get Started Free
              </Button>
            </Link>
            <Link to="/">
              <Button variant="secondary" size="lg">
                Learn More
              </Button>
            </Link>
          </div>
        </motion.div>
      </Container>
    </section>
  );
};
