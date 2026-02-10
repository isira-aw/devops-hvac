'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { Bot } from 'lucide-react';
import LiveDashboardTemplate from '@/components/LiveDashboardTemplate';

const steps = [
  {
    num: '01',
    title: 'Create Your Account',
    label: 'Setup',
    desc: 'Sign up for free in seconds. Set up your organization profile and invite your team members.',
    color: 'bg-blue-500',
    preview: 'Dashboard Setup View'
  },
  {
    num: '02',
    title: 'Connect Your Devices',
    label: 'Integration',
    desc: 'Add your HVAC units using our simple pairing process. We support all major brands.',
    color: 'bg-indigo-500',
    preview: 'Device Pairing Screen'
  },
  {
    num: '03',
    title: 'Configure Settings',
    label: 'Customization',
    desc: 'Set up your preferences, create schedules, and define alert thresholds effortlessly.',
    color: 'bg-purple-500',
    preview: 'Schedule Manager'
  },
  {
    num: '04',
    title: 'Start Optimizing',
    label: 'Launch',
    desc: 'Monitor your systems and watch your energy efficiency improve automatically.',
    color: 'bg-emerald-500',
    preview: 'Efficiency Analytics'
  },
];

export default function HomePage() {
  const [activeTab, setActiveTab] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const { isAuthenticated, isLoading, logout, user } = useAuth();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Intersection Observer for animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-visible');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -80px 0px' }
    );

    document.querySelectorAll('.animate-on-scroll').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const headerHeight = 80;
      const position = element.getBoundingClientRect().top + window.pageYOffset - headerHeight;
      window.scrollTo({ top: position, behavior: 'smooth' });
      setMobileMenuOpen(false);
    }
  };

  return (
    <>
      <style jsx global>{`
        :root {
          --primary: #094166;
          --primary-dark: #062d47;
          --primary-light: #0c5a8a;
          --primary-lighter: #1a7ab8;
          --background: #FCF6F5;
          --accent: #06b6d4;
          --success: #10b981;
        }

        .animate-on-scroll {
          opacity: 0;
          transform: translateY(40px);
          transition: opacity 0.7s ease-out, transform 0.7s ease-out;
        }

        .animate-on-scroll.animate-visible {
          opacity: 1;
          transform: translateY(0);
        }

        .animate-left {
          transform: translateX(-60px);
        }

        .animate-left.animate-visible {
          transform: translateX(0);
        }

        .animate-right {
          transform: translateX(60px);
        }

        .animate-right.animate-visible {
          transform: translateX(0);
        }

        .animate-scale {
          transform: scale(0.85);
        }

        .animate-scale.animate-visible {
          transform: scale(1);
        }

        .stagger-1 { transition-delay: 0.1s; }
        .stagger-2 { transition-delay: 0.2s; }
        .stagger-3 { transition-delay: 0.3s; }
        .stagger-4 { transition-delay: 0.4s; }
        .stagger-5 { transition-delay: 0.5s; }
        .stagger-6 { transition-delay: 0.6s; }
        .stagger-7 { transition-delay: 0.7s; }
        .stagger-8 { transition-delay: 0.8s; }

        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(15deg); }
          50% { transform: translateY(-30px) rotate(25deg); }
        }

        @keyframes pulse-glow {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.5; }
          50% { transform: translate(-50%, -50%) scale(1.2); opacity: 0.8; }
        }

        @keyframes rotate-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes float-card {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        @keyframes grow-bar {
          from { height: 0; }
        }

        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .floating-cube {
          animation: float 8s ease-in-out infinite;
        }

        .hero-glow {
          animation: pulse-glow 6s ease-in-out infinite;
        }

        .rotating-circle {
          animation: rotate-slow 30s linear infinite;
        }

        .rotating-circle-reverse {
          animation: rotate-slow 20s linear infinite reverse;
        }

        .floating-feature {
          animation: float-card 4s ease-in-out infinite;
        }

        .chart-bar {
          animation: grow-bar 1.5s ease-out forwards;
        }

        .cta-bg-rotate {
          animation: rotate 25s linear infinite;
        }

        html {
          scroll-behavior: smooth;
        }

        /* Mobile optimizations */
        @media (max-width: 768px) {
          .animate-on-scroll {
            transform: translateY(20px);
          }
          
          .animate-left, .animate-right {
            transform: translateY(20px);
          }
          
          .animate-left.animate-visible, 
          .animate-right.animate-visible {
            transform: translateY(0);
          }
        }
      `}</style>

      <div className="min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
        {/* Header */}
        <header
          className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
            isScrolled ? 'py-2 md:py-3 shadow-lg' : 'py-3 md:py-4'
          }`}
          style={{ backgroundColor: 'rgba(9, 65, 102, 0.95)', backdropFilter: 'blur(12px)' }}
        >
          <div className="max-w-7xl mx-auto px-4 md:px-6 flex justify-between items-center">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 text-white">
              <CloudIcon className="w-6 h-6 md:w-7 md:h-7" />
              <span className="text-base md:text-lg lg:text-xl font-bold tracking-tight">Smart HVAC</span>
            </Link>

            {/* Desktop menu */}
            <div className="hidden lg:flex items-center space-x-2">
              {['What It Is', 'Features', 'How It Works', 'About Us', 'FAQ'].map((item) => (
                <button
                  key={item}
                  onClick={() => scrollToSection(item.toLowerCase().replace(/\s+/g, '-'))}
                  className="text-white/80 hover:text-white hover:bg-white/10 px-3 py-2 rounded-lg transition-all text-sm font-medium"
                >
                  {item}
                </button>
              ))}

              <div className="border-l border-white/20 pl-2 flex items-center gap-2">
                <Link href="/dashboard" className="text-white hover:bg-white/10 px-3 py-2 rounded text-sm font-medium">
                  Dashboard
                </Link>

                {user ? (
                  <span className="px-3 py-2 font-medium text-white text-sm">
                    {user.username}
                  </span>
                ) : (
                  <Link
                    href="/login"
                    className="text-white hover:bg-white/10 px-3 py-2 rounded text-sm font-medium"
                  >
                    Login
                  </Link>
                )}

                <Link href="/register" className="bg-white text-primary px-4 py-2 rounded-lg hover:bg-gray-100 font-medium text-sm">
                  Register
                </Link>

                <Link href="/" className="bg-white/20 text-white px-3 py-2 rounded-lg hover:bg-white/30">
                  <i className="lni lni-home text-lg"></i>
                </Link>
              </div>
            </div>

            {/* Mobile hamburger button */}
            <button
              className="lg:hidden p-2 hover:opacity-75 text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <i className={`lni ${mobileMenuOpen ? 'lni-close' : 'lni-menu'} text-xl`}></i>
            </button>
          </div>

          {/* Mobile menu dropdown */}
          {mobileMenuOpen && (
            <div className="lg:hidden mt-4 pt-4 border-t border-white/20 px-4">
              <div className="flex flex-col space-y-3">
                {['What It Is', 'Features', 'How It Works', 'About Us', 'FAQ'].map((item) => (
                  <button
                    key={item}
                    onClick={() => {
                      scrollToSection(item.toLowerCase().replace(/\s+/g, '-'));
                      setMobileMenuOpen(false);
                    }}
                    className="text-white/90 hover:bg-white/10 px-3 py-2 rounded text-left font-medium"
                  >
                    {item}
                  </button>
                ))}

                <Link 
                  href="/dashboard" 
                  className="text-white/90 hover:bg-white/10 px-3 py-2 rounded text-left font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>

                {user ? (
                  <span className="px-3 py-2 font-medium text-white text-center">
                    {user.username}
                  </span>
                ) : (
                  <Link
                    href="/login"
                    className="text-white/90 hover:bg-white/10 px-3 py-2 rounded text-center font-medium"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Login
                  </Link>
                )}

                <Link 
                  href="/register" 
                  className="bg-white text-primary px-4 py-2 rounded-lg hover:bg-gray-100 text-center font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Register
                </Link>
              </div>
            </div>
          )}
        </header>

        {/* SECTION 1: HERO */}
        <section className="min-h-screen flex items-center pt-24 md:pt-32 pb-12 md:pb-20 px-4 md:px-6 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #041c2c 0%, #062d47 50%, #041c2c 100%)' }}>
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="floating-cube absolute rounded-xl border border-white/10"
                style={{
                  width: `${40 + i * 10}px`,
                  height: `${40 + i * 10}px`,
                  top: `${10 + i * 10}%`,
                  left: i % 2 === 0 ? `${5 + i * 5}%` : 'auto',
                  right: i % 2 !== 0 ? `${5 + i * 5}%` : 'auto',
                  background: 'linear-gradient(135deg, rgba(9, 65, 102, 0.3), rgba(6, 182, 212, 0.3))',
                  animationDelay: `${-i * 0.5}s`,
                  backdropFilter: 'blur(5px)',
                }}
              />
            ))}
            <div
              className="hero-glow absolute w-[300px] h-[300px] md:w-[600px] md:h-[600px] rounded-full top-1/2 left-1/2"
              style={{ background: 'radial-gradient(circle, rgba(9, 65, 102, 0.3) 0%, transparent 70%)' }}
            />
          </div>

          <div className="max-w-5xl mx-auto text-center relative z-10 w-full">
            <div className="animate-on-scroll inline-flex items-center gap-2 bg-white/10 border border-white/20 px-4 md:px-5 py-2 rounded-full mb-6 md:mb-8 backdrop-blur-sm">
              <BoltIcon className="w-3 h-3 md:w-4 md:h-4 text-cyan-400" />
              <span className="text-[var(--primary-lighter)] text-xs md:text-sm font-medium">Next-Gen Climate Control Technology</span>
            </div>

            <h1 className="animate-on-scroll stagger-1 text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black text-white mb-4 md:mb-6 tracking-tight leading-tight px-4">
              Smart HVAC<br />
              <span className="bg-gradient-to-r from-[var(--primary-lighter)] to-cyan-400 bg-clip-text text-transparent">
                IoT Control System
              </span>
            </h1>
          </div>
        </section>

        {/* SECTION 2: WHAT IT IS */}
        <section id="what-it-is" className="py-12 md:py-16 lg:py-24 px-4 md:px-6 bg-white">
          <SectionHeader
            label="WHAT IT IS"
            title="A Complete"
            titleHighlight="Climate Intelligence"
            titleEnd="Platform"
            description="Combining IoT sensors, AI analytics, and universal accessibility to transform how you manage climate control"
          />

          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-8 md:gap-12 lg:gap-16 items-center">
              <div className="animate-on-scroll animate-left relative order-2 lg:order-1">
                <div
                  className="rounded-2xl md:rounded-3xl p-6 md:p-8 text-white relative overflow-hidden"
                  style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))' }}
                >
                  <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-[radial-gradient(circle,rgba(255,255,255,0.1)_0%,transparent_60%)]" />
                  <h3 className="text-xl md:text-2xl font-bold mb-3 md:mb-4 relative z-10">Complete Control Center</h3>
                  <p className="text-white/90 leading-relaxed relative z-10 text-sm md:text-base">
                    A unified dashboard that brings all your HVAC systems together. Monitor, analyze, and control everything from one intelligent platform designed for modern building management.
                  </p>
                </div>

                <div className="hidden xl:flex floating-feature absolute -top-5 -right-5 bg-white rounded-2xl px-4 py-3 shadow-lg items-center gap-3">
                  <DashboardIcon className="w-5 h-5 text-[var(--primary)]" />
                  <span className="font-semibold text-gray-800 text-sm">Real-time Dashboard</span>
                </div>
                <div className="hidden xl:flex floating-feature absolute -bottom-5 -left-5 bg-white rounded-2xl px-4 py-3 shadow-lg items-center gap-3" style={{ animationDelay: '1s' }}>
                  <BellIcon className="w-5 h-5 text-[var(--primary)]" />
                  <span className="font-semibold text-gray-800 text-sm">Smart Alerts</span>
                </div>
                <div className="hidden xl:flex floating-feature absolute top-1/2 -right-10 bg-white rounded-2xl px-4 py-3 shadow-lg items-center gap-3" style={{ animationDelay: '2s' }}>
                  <ChartIcon className="w-5 h-5 text-[var(--primary)]" />
                  <span className="font-semibold text-gray-800 text-sm">Analytics</span>
                </div>
              </div>

              <div className="animate-on-scroll animate-right order-1 lg:order-2">
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-gray-900 mb-4 md:mb-6 leading-tight">
                  The <span style={{ color: 'var(--primary)' }}>Smart Solution</span> You've Been Waiting For
                </h2>
                <p className="text-gray-500 text-base md:text-lg mb-6 md:mb-8 leading-relaxed">
                  Smart HVAC transforms reactive maintenance into proactive optimization. Our platform gives you complete visibility and control over your entire climate infrastructure.
                </p>

                <div className="space-y-4 md:space-y-5">
                  {[
                    { icon: <EyeIcon className="w-4 h-4 md:w-5 md:h-5 text-white" />, title: '360° Visibility', desc: 'See every unit, every metric, every moment in real-time' },
                    { icon: <CpuIcon className="w-4 h-4 md:w-5 md:h-5 text-white" />, title: 'AI Optimization', desc: 'Machine learning that continuously improves efficiency' },
                    { icon: <CogIcon className="w-4 h-4 md:w-5 md:h-5 text-white" />, title: 'Automated Actions', desc: 'Set rules and let the system handle the rest' },
                  ].map((feature) => (
                    <div key={feature.title} className="flex items-start gap-3 md:gap-4">
                      <div
                        className="w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg, var(--primary-light), var(--primary))' }}
                      >
                        {feature.icon}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-1 text-sm md:text-base">{feature.title}</h4>
                        <p className="text-gray-500 text-xs md:text-sm">{feature.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-12 md:mt-16 lg:mt-20"></div>

          <div className="max-w-7xl mx-auto">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {[
                {
                  icon: <NetworkIcon className="w-6 h-6 md:w-8 md:h-8 text-white" />,
                  iconBg: 'linear-gradient(135deg, #0c5a8a, #094166)',
                  title: 'IoT Connected',
                  description: 'Connect all your HVAC units to a unified platform. Real-time monitoring and control at your fingertips.',
                  features: ['Multi-protocol support', 'Seamless device pairing', 'Edge computing enabled'],
                },
                {
                  icon: <CpuIcon className="w-6 h-6 md:w-8 md:h-8 text-white" />,
                  iconBg: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
                  title: 'AI-Powered',
                  description: 'Machine learning algorithms predict maintenance needs and optimize energy consumption automatically.',
                  features: ['Predictive maintenance', 'Smart scheduling', 'Anomaly detection'],
                },
                {
                  icon: <MobileIcon className="w-6 h-6 md:w-8 md:h-8 text-white" />,
                  iconBg: 'linear-gradient(135deg, #06b6d4, #0891b2)',
                  title: 'Universal Access',
                  description: 'Control your systems from any device, anywhere. Web, mobile, and API access for complete flexibility.',
                  features: ['Cross-platform apps', 'RESTful API', 'Voice assistant ready'],
                },
              ].map((card, i) => (
                <div
                  key={card.title}
                  className={`animate-on-scroll animate-scale stagger-${i + 1} bg-gradient-to-br from-gray-50 to-white border border-gray-100 rounded-2xl md:rounded-3xl p-6 md:p-8 relative overflow-hidden transition-all duration-400 hover:-translate-y-2 hover:shadow-2xl group`}
                >
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--primary)] to-cyan-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-400" />
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center mb-4 md:mb-6" style={{ background: card.iconBg }}>
                    {card.icon}
                  </div>
                  <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2 md:mb-3">{card.title}</h3>
                  <p className="text-gray-500 mb-4 md:mb-6 leading-relaxed text-sm md:text-base">{card.description}</p>
                  <ul className="space-y-2 md:space-y-3">
                    {card.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 md:gap-3 text-gray-600 text-xs md:text-sm">
                        <CheckCircleIcon className="w-4 h-4 md:w-5 md:h-5 text-emerald-500 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 5: KEY FEATURES */}
        <section id="features" className="py-12 md:py-16 lg:py-24 px-4 md:px-6 bg-white overflow-hidden">
          <div className="max-w-7xl mx-auto">
            <SectionHeader
              label="KEY FEATURES"
              title="Everything You Need to"
              titleHighlight="Take Control"
              description="Powerful tools designed for modern building management"
            />

            <div className="mt-12 md:mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-gray-200 border border-gray-200 rounded-3xl md:rounded-[2.5rem] overflow-hidden">
              {[
                { icon: <DashboardIcon />, color: "text-blue-600", title: 'Real-time Monitoring', desc: 'Track temperature, humidity, and energy usage in real-time.', tag: 'Core' },
                { icon: <CogIcon />, color: "text-purple-600", title: 'Remote Control', desc: 'Adjust fan speed and modes from anywhere via smartphone.', tag: 'Remote' },
                { icon: <BellIcon />, color: "text-cyan-600", title: 'Smart Alerts', desc: 'Instant notifications for faults and maintenance needs.', tag: 'Alerts' },
                { icon: <ChartIcon />, color: "text-emerald-600", title: 'Energy Analytics', desc: 'Analyze consumption patterns and identify waste easily.', tag: 'Data' },
                { icon: <Bot />, color: "text-orange-600", title: ' AI Powered Assistant', desc: 'AI-driven insights and recommendations for optimal HVAC performance.', tag: 'Chatbot' },
                { icon: <ShieldIcon />, color: "text-red-600", title: 'Enterprise Security', desc: 'Bank-level encryption and two-factor authentication.', tag: 'Security' },
              ].map((feature, i) => (
                <div
                  key={feature.title}
                  className="group relative bg-white p-6 md:p-10 overflow-hidden transition-all duration-500 min-h-[220px] md:min-h-[250px] flex flex-col"
                >
                  <div className={`absolute -right-12 md:-right-16 -bottom-12 md:-bottom-16 w-48 h-48 md:w-64 md:h-64 opacity-[0.2] transition-all duration-700 ease-in-out pointer-events-none transform group-hover:scale-150 group-hover:-rotate-12 group-hover:opacity-[0.1] ${feature.color}`}>
                    {React.cloneElement(feature.icon, { className: "w-full h-full" })}
                  </div>

                  <div className="relative z-10 flex flex-col h-full max-w-[280px]">
                    <div className="mb-6 md:mb-8 flex items-center gap-3">
                      <div className={`h-1 w-6 rounded-full bg-current ${feature.color} transition-all duration-500 group-hover:w-12`} />
                      <span className={`text-[10px] font-black tracking-widest uppercase ${feature.color}`}>
                        {feature.tag}
                      </span>
                    </div>

                    <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-3 md:mb-4 tracking-tight">
                      {feature.title}
                    </h3>

                    <p className="text-gray-500 text-sm md:text-base leading-relaxed">
                      {feature.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 6: HOW IT WORKS */}
        <section id="how-it-works" className="py-12 md:py-16 lg:py-24 px-4 md:px-6 bg-slate-50">
          <SectionHeader
            label="HOW IT WORKS"
            title="Get Started in"
            titleHighlight="4 Simple Steps"
            description="From signup to full control in minutes, not months"
          />
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 lg:gap-16 items-center">
              {/* LEFT: Navigation Rail */}
              <div className="lg:col-span-5 space-y-3 md:space-y-4">
                {steps.map((step, idx) => (
                  <button
                    key={step.num}
                    onClick={() => setActiveTab(idx)}
                    className={`w-full text-left p-6 md:p-8 rounded-2xl md:rounded-3xl transition-all duration-500 relative overflow-hidden ${
                      activeTab === idx
                        ? 'bg-white shadow-xl shadow-blue-900/5 scale-105'
                        : 'hover:bg-white/50 opacity-60'
                    }`}
                  >
                    {activeTab === idx && (
                      <motion.div
                        layoutId="activeBar"
                        className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      />
                    )}

                    <div className="flex items-center gap-3 md:gap-4 mb-2">
                      <span className={`text-xs font-bold tracking-widest uppercase ${activeTab === idx ? 'text-primary' : 'text-gray-400'}`}>
                        {step.label}
                      </span>
                    </div>
                    <h3 className={`text-xl md:text-2xl font-bold ${activeTab === idx ? 'text-gray-900' : 'text-gray-500'}`}>
                      {step.title}
                    </h3>

                    <AnimatePresence>
                      {activeTab === idx && (
                        <motion.p
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="text-gray-500 mt-3 md:mt-4 leading-relaxed overflow-hidden text-sm md:text-base"
                        >
                          {step.desc}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </button>
                ))}
              </div>

              {/* RIGHT: Visual Showcase */}
              <div className="lg:col-span-7 relative h-[350px] md:h-[450px] lg:h-[500px] w-full bg-gray-900 rounded-2xl md:rounded-[2.5rem] shadow-2xl overflow-hidden border-4 md:border-[8px] border-white">
                <div className={`absolute inset-0 opacity-20 transition-colors duration-700 ${steps[activeTab].color}`} />

                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -20, opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="absolute inset-0 flex flex-col items-center justify-center p-8 md:p-12 text-center"
                  >
                    <div className="w-full h-full rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center">
                      <span className="text-white font-medium text-base md:text-lg italic opacity-50 px-4">
                        [UI Mockup: {steps[activeTab].preview}]
                      </span>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 8: ARCHITECTURE */}
        <section className="py-12 md:py-16 lg:py-24 px-4 md:px-6" style={{ backgroundColor: '#0a1929' }}>
          <div className="max-w-7xl mx-auto">
            <SectionHeader
              label="ARCHITECTURE"
              title="Enterprise-Grade"
              titleHighlight="System Design"
              highlightColor="var(--primary-lighter)"
              description="A scalable, secure, and resilient architecture built for mission-critical operations"
              dark
            />

            <div className="max-w-3xl mx-auto space-y-4 md:space-y-6">
              {[
                { icon: <MobileIcon className="w-5 h-5 md:w-6 md:h-6 text-white" />, bg: 'linear-gradient(135deg, #0c5a8a, #094166)', title: 'Presentation Layer', desc: 'Responsive web dashboard and native mobile apps for iOS and Android', tags: ['React', 'React Native', 'TypeScript'] },
                { icon: <CodeIcon className="w-5 h-5 md:w-6 md:h-6 text-white" />, bg: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', title: 'Application Layer', desc: 'RESTful APIs, WebSocket connections, and business logic processing', tags: ['Node.js', 'Express', 'GraphQL'] },
                { icon: <CpuIcon className="w-5 h-5 md:w-6 md:h-6 text-white" />, bg: 'linear-gradient(135deg, #06b6d4, #0891b2)', title: 'Intelligence Layer', desc: 'Machine learning models for prediction, optimization, and anomaly detection', tags: ['Python', 'TensorFlow', 'scikit-learn'] },
                { icon: <NetworkIcon className="w-5 h-5 md:w-6 md:h-6 text-white" />, bg: 'linear-gradient(135deg, #10b981, #059669)', title: 'Data & IoT Layer', desc: 'Time-series database, message queuing, and device communication protocols', tags: ['PostgreSQL', 'InfluxDB', 'MQTT'] },
              ].map((layer, i) => (
                <div
                  key={layer.title}
                  className={`animate-on-scroll stagger-${i + 1} bg-white/[0.03] border border-white/10 rounded-xl md:rounded-2xl p-4 md:p-6 flex items-center gap-4 md:gap-6 transition-all hover:bg-white/[0.06] hover:translate-x-2`}
                >
                  <div className="w-[50px] h-[50px] md:w-[60px] md:h-[60px] rounded-xl md:rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: layer.bg }}>
                    {layer.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white text-base md:text-lg font-semibold mb-1">{layer.title}</h4>
                    <p className="text-white/60 text-xs md:text-sm mb-2 md:mb-3">{layer.desc}</p>
                    <div className="flex flex-wrap gap-2">
                      {layer.tags.map((tag) => (
                        <span key={tag} className="bg-white/10 text-white/80 px-2 md:px-3 py-1 rounded-full text-[10px] md:text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 9: LIVE DEMO */}
        <section id="demo" className="py-12 md:py-16 lg:py-24 px-4 md:px-6" style={{ background: 'linear-gradient(180deg, white 0%, #f9fafb 100%)' }}>
          <div className="max-w-7xl mx-auto">
            <SectionHeader
              label="LIVE DEMO"
              title="See It In"
              titleHighlight="Action"
              description="Experience the power of Smart HVAC with our interactive dashboard preview"
            />

            <div className="animate-on-scroll stagger-3 bg-white border border-gray-200 rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl">
              <div className="bg-gray-800 px-4 md:px-6 py-3 md:py-4 flex items-center gap-2 md:gap-3">
                <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-red-500" />
                <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-yellow-500" />
                <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-green-500" />
                <span className="text-white text-xs md:text-sm ml-2 md:ml-4 truncate">Smart HVAC Dashboard - Building A</span>
              </div>

                <LiveDashboardTemplate />
            </div>
          </div>
        </section>

        {/* SECTION 12: ABOUT */}
        <section id="about-us" className="py-12 md:py-16 lg:py-24 px-4 md:px-6 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0a1929 0%, #0d2137 100%)' }}>
          <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }} />

          <div className="max-w-7xl mx-auto relative z-10">
            <SectionHeader
              label="ABOUT US"
              title="Built by"
              titleHighlight="Engineers"
              highlightColor="var(--primary-lighter)"
              titleEnd="for Engineers"
              description="Our mission is to make building management smarter, simpler, and more sustainable"
              dark
            />

            <div className="grid lg:grid-cols-2 gap-8 md:gap-12 lg:gap-16 items-center">
              <div className="animate-on-scroll animate-left">
                <h3 className="text-xl md:text-2xl font-bold text-white mb-4 md:mb-6">Our Story</h3>
                <p className="text-white/70 text-base md:text-lg leading-relaxed mb-3 md:mb-4">
                  Smart HVAC was born from a simple frustration: why is managing building climate so complicated in 2026? We set out to build the platform we wished existed.
                </p>
                <p className="text-white/70 text-base md:text-lg leading-relaxed mb-6 md:mb-8">
                  Our team combines decades of experience in IoT, machine learning, and building automation. We've worked with Fortune 500 companies, managed data centers, and now we're bringing that expertise to everyone.
                </p>

                <div className="flex flex-wrap gap-6 md:gap-8 lg:gap-12">
                  {[
                    { value: '15+', label: 'Years Experience' },
                    { value: '50+', label: 'Team Members' },
                    { value: '10K+', label: 'Happy Customers' },
                  ].map((stat) => (
                    <div key={stat.label}>
                      <div className="text-2xl md:text-3xl font-extrabold" style={{ color: 'var(--primary-lighter)' }}>{stat.value}</div>
                      <div className="text-white/60 text-xs md:text-sm">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="animate-on-scroll animate-right flex justify-center">
                <div className="bg-white/5 border border-white/10 rounded-2xl md:rounded-3xl p-6 md:p-8 lg:p-10 text-center backdrop-blur-sm w-full max-w-md">
                  <div
                    className="w-[100px] h-[100px] md:w-[120px] md:h-[120px] rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6"
                    style={{ background: 'linear-gradient(135deg, var(--primary), var(--accent))' }}
                  >
                    <UsersIcon className="w-10 h-10 md:w-12 md:h-12 text-white" />
                  </div>
                  <h4 className="text-white text-xl md:text-2xl font-bold mb-2">Smart HVAC Team</h4>
                  <p className="mb-3 md:mb-4 text-sm md:text-base" style={{ color: 'var(--primary-lighter)' }}>Engineering Excellence</p>
                  <p className="text-white/60 leading-relaxed text-sm md:text-base">
                    A diverse team of engineers, designers, and domain experts passionate about transforming how buildings work.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 13: FAQ */}
        <section id="faq" className="py-12 md:py-16 lg:py-24 px-4 md:px-6 bg-white">
          <div className="max-w-7xl mx-auto">
            <SectionHeader
              label="FAQ"
              title="Frequently Asked"
              titleHighlight="Questions"
              description="Everything you need to know about Smart HVAC"
            />

            <div className="max-w-3xl mx-auto space-y-3 md:space-y-4">
              {[
                { q: 'What HVAC systems are compatible with Smart HVAC?', a: 'Smart HVAC supports all major HVAC brands and protocols including Modbus, BACnet, LonWorks, and more. Our universal gateway can connect to virtually any modern HVAC system. Contact us for specific compatibility questions.' },
                { q: 'How long does installation take?', a: 'Most installations are completed within 1-2 days. Our plug-and-play gateways connect to your existing infrastructure without disrupting operations. You\'ll start seeing data within minutes of connecting.' },
                { q: 'Is my data secure?', a: 'Absolutely. We use bank-level 256-bit AES encryption, SOC 2 Type II certified data centers, and offer two-factor authentication. Your data never leaves our secure infrastructure and you retain full ownership.' },
                { q: 'What kind of support do you offer?', a: 'We provide 24/7 technical support via phone, email, and chat. Enterprise customers get a dedicated account manager and priority response times. Our average response time is under 15 minutes.' },
                { q: 'Can I try Smart HVAC before committing?', a: 'Yes! We offer a 30-day free trial with full access to all features. No credit card required. We\'ll even provide a demo gateway so you can test with your actual systems before making a decision.' },
                { q: 'What\'s the pricing model?', a: 'We offer flexible pricing based on the number of connected devices. Plans start at $49/month for small buildings and scale to enterprise agreements for large portfolios. Volume discounts are available.' },
              ].map((faq, i) => (
                <div
                  key={i}
                  className={`animate-on-scroll stagger-${i + 1} border border-gray-100 rounded-xl md:rounded-2xl overflow-hidden transition-all hover:shadow-lg`}
                >
                  <button
                    onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                    className="w-full px-4 md:px-6 py-4 md:py-5 flex justify-between items-center text-left bg-white hover:bg-gray-50 transition-colors gap-4"
                  >
                    <h4 className="font-semibold text-gray-800 text-sm md:text-base pr-2">{faq.q}</h4>
                    <ChevronDownIcon
                      className={`w-5 h-5 flex-shrink-0 transition-transform duration-300 text-[var(--primary)] ${
                        activeFaq === i ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  <div
                    className={`overflow-hidden transition-all duration-400 ${activeFaq === i ? 'max-h-[300px]' : 'max-h-0'}`}
                  >
                    <p className="px-4 md:px-6 pb-4 md:pb-5 text-gray-500 leading-relaxed text-sm md:text-base">{faq.a}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="py-16 md:py-24 lg:py-32 px-4 md:px-6 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)' }}>
          <div className="cta-bg-rotate absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-[radial-gradient(circle,rgba(255,255,255,0.1)_0%,transparent_50%)]" />

          <div className="max-w-3xl mx-auto text-center relative z-10">
            <h2 className="animate-on-scroll text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-white mb-4 md:mb-6 tracking-tight px-4">
              Ready to Transform Your Building?
            </h2>
            <p className="animate-on-scroll stagger-1 text-base md:text-lg lg:text-xl text-white/85 mb-6 md:mb-10 max-w-2xl mx-auto px-4">
              Join 10,000+ organizations already using Smart HVAC to save energy, reduce costs, and improve comfort.
            </p>
            <div className="animate-on-scroll stagger-2 flex flex-col sm:flex-row justify-center gap-3 md:gap-4 px-4">
              <a
                href="#"
                className="inline-flex items-center justify-center gap-2 md:gap-3 bg-white px-6 md:px-10 py-3 md:py-4 rounded-xl text-base md:text-lg font-bold transition-all hover:-translate-y-1 hover:shadow-2xl"
                style={{ color: 'var(--primary)' }}
              >
                Start Free Trial
                <ArrowRightIcon className="w-4 h-4 md:w-5 md:h-5" />
              </a>
              <a
                href="#"
                className="inline-flex items-center justify-center gap-2 md:gap-3 bg-transparent border-2 border-white/50 text-white px-6 md:px-10 py-3 md:py-4 rounded-xl text-base md:text-lg font-semibold transition-all hover:bg-white/10 hover:border-white hover:-translate-y-1"
              >
                <PhoneIcon className="w-4 h-4 md:w-5 md:h-5" />
                Schedule Demo
              </a>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 md:py-16 px-4 md:px-6" style={{ backgroundColor: '#0a1929' }}>
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12 pb-8 md:pb-12 border-b border-white/10">
              <div className="lg:col-span-1">
                <a href="#" className="flex items-center gap-2 text-white mb-4">
                  <CloudIcon className="w-6 h-6 md:w-7 md:h-7" />
                  <span className="text-lg md:text-xl font-bold">Smart HVAC</span>
                </a>
                <p className="text-gray-400 leading-relaxed mb-4 md:mb-6 max-w-xs text-sm md:text-base">
                  Intelligent climate control for modern buildings. Save energy, reduce costs, and create comfortable spaces.
                </p>
                <div className="flex gap-2 md:gap-3">
                  {[TwitterIcon, LinkedInIcon, GithubIcon, YoutubeIcon].map((Icon, i) => (
                    <a
                      key={i}
                      href="#"
                      className="w-9 h-9 md:w-10 md:h-10 bg-white/5 rounded-xl flex items-center justify-center text-gray-400 transition-all hover:bg-[var(--primary)] hover:text-white"
                    >
                      <Icon className="w-4 h-4 md:w-5 md:h-5" />
                    </a>
                  ))}
                </div>
              </div>

              {[
                { title: 'Product', links: ['Features', 'How It Works', 'Pricing', 'Integrations', 'API Docs'] },
                { title: 'Company', links: ['About Us', 'Careers', 'Blog', 'Press Kit', 'Contact'] },
                { title: 'Support', links: ['Help Center', 'Documentation', 'Community', 'Status', 'Security'] },
              ].map((col) => (
                <div key={col.title}>
                  <h4 className="text-white font-semibold mb-4 md:mb-5 text-sm md:text-base">{col.title}</h4>
                  <ul className="space-y-2 md:space-y-3">
                    {col.links.map((link) => (
                      <li key={link}>
                        <a href="#" className="text-gray-400 hover:text-white transition-colors text-xs md:text-sm">
                          {link}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="pt-6 md:pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-gray-500 text-xs md:text-sm text-center md:text-left">&copy; 2026 Smart HVAC IoT System. All rights reserved.</p>
              <div className="flex flex-wrap justify-center gap-4 md:gap-8">
                {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map((link) => (
                  <a key={link} href="#" className="text-gray-500 hover:text-white transition-colors text-xs md:text-sm">
                    {link}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

// Section Header Component
function SectionHeader({
  label,
  title,
  titleHighlight,
  titleEnd,
  description,
  dark,
  highlightColor,
}: {
  label: string;
  title: string;
  titleHighlight: string;
  titleEnd?: string;
  description: string;
  dark?: boolean;
  highlightColor?: string;
}) {
  return (
    <div className="text-center mb-12 md:mb-16 px-4">
      <span
        className="animate-on-scroll inline-block px-4 md:px-5 py-1.5 md:py-2 rounded-full text-white text-xs md:text-sm font-semibold mb-4 md:mb-5"
        style={{ background: 'linear-gradient(135deg, var(--primary-light), var(--accent))' }}
      >
        {label}
      </span>
      <h2
        className={`animate-on-scroll stagger-1 text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold mb-3 md:mb-4 tracking-tight leading-tight ${
          dark ? 'text-white' : 'text-gray-900'
        }`}
      >
        {title}{' '}
        <span style={{ color: highlightColor || 'var(--primary)' }}>{titleHighlight}</span>
        {titleEnd && ` ${titleEnd}`}
      </h2>
      <p className={`animate-on-scroll stagger-2 text-sm md:text-base lg:text-lg max-w-2xl mx-auto leading-relaxed ${dark ? 'text-white/60' : 'text-gray-500'}`}>
        {description}
      </p>
    </div>
  );
}

// SVG Icons (unchanged from original)
function CloudIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
    </svg>
  );
}

function MenuIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function BoltIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}

function NetworkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="16" y="16" width="6" height="6" rx="1" />
      <rect x="2" y="16" width="6" height="6" rx="1" />
      <rect x="9" y="2" width="6" height="6" rx="1" />
      <path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3" />
      <path d="M12 12V8" />
    </svg>
  );
}

function CpuIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="16" rx="2" ry="2" />
      <rect x="9" y="9" width="6" height="6" />
      <line x1="9" y1="1" x2="9" y2="4" />
      <line x1="15" y1="1" x2="15" y2="4" />
      <line x1="9" y1="20" x2="9" y2="23" />
      <line x1="15" y1="20" x2="15" y2="23" />
      <line x1="20" y1="9" x2="23" y2="9" />
      <line x1="20" y1="14" x2="23" y2="14" />
      <line x1="1" y1="9" x2="4" y2="9" />
      <line x1="1" y1="14" x2="4" y2="14" />
    </svg>
  );
}

function MobileIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
      <line x1="12" y1="18" x2="12.01" y2="18" />
    </svg>
  );
}

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function AlertTriangleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function DashboardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  );
}

function BellIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function ChartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

function CogIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function PlugIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22v-5" />
      <path d="M9 8V2" />
      <path d="M15 8V2" />
      <path d="M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8Z" />
    </svg>
  );
}

function CogsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  );
}

function RocketIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
      <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
      <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
    </svg>
  );
}

function CodeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function LeafIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
    </svg>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function TwitterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

function YoutubeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}