import { Link } from 'react-router-dom';
import { CheckCircle, ArrowRight, Zap, Shield, TrendingUp, Users } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">C</span>
              </div>
              <span className="ml-3 text-xl font-bold text-gray-900">Cloudritz CRM</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/login" className="text-gray-700 hover:text-gray-900 font-medium">
                Sign In
              </Link>
              <Link 
                to="/onboarding" 
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-semibold"
              >
                Start Free Trial
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Complete CRM Solution for
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Modern Businesses</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Manage inventory, customers, invoices, and sales analytics in one powerful platform. 
            Start your 14-day free trial today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/onboarding"
              className="bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 font-semibold text-lg flex items-center justify-center"
            >
              Start Free Trial <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
            <a 
              href="#features"
              className="bg-white text-gray-700 px-8 py-4 rounded-lg hover:bg-gray-50 font-semibold text-lg border-2 border-gray-200"
            >
              Learn More
            </a>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            ✓ 14 days free trial • ✓ No credit card required • ✓ Cancel anytime
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Everything You Need</h2>
          <p className="text-xl text-gray-600">Powerful features to grow your business</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Fast & Efficient</h3>
            <p className="text-gray-600">Lightning-fast performance with real-time updates and instant search.</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Secure & Reliable</h3>
            <p className="text-gray-600">Bank-level security with automatic backups and 99.9% uptime.</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Sales Analytics</h3>
            <p className="text-gray-600">Powerful insights and reports to track your business growth.</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-orange-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Multi-User</h3>
            <p className="text-gray-600">Collaborate with your team with role-based access control.</p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Simple, Transparent Pricing</h2>
          <p className="text-xl text-gray-600">Choose the plan that fits your business</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Basic */}
          <div className="bg-white p-8 rounded-xl shadow-lg border-2 border-gray-200">
            <h3 className="text-2xl font-bold mb-2">Basic</h3>
            <p className="text-gray-600 mb-4">For small businesses</p>
            <div className="mb-6">
              <span className="text-4xl font-bold">₹999</span>
              <span className="text-gray-600">/month</span>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center"><CheckCircle className="w-5 h-5 text-green-500 mr-2" /> 5 Users</li>
              <li className="flex items-center"><CheckCircle className="w-5 h-5 text-green-500 mr-2" /> 1000 Products</li>
              <li className="flex items-center"><CheckCircle className="w-5 h-5 text-green-500 mr-2" /> 500 Invoices/month</li>
              <li className="flex items-center"><CheckCircle className="w-5 h-5 text-green-500 mr-2" /> Basic Reports</li>
            </ul>
            <Link to="/onboarding" className="block w-full bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 font-semibold text-center">
              Start Trial
            </Link>
          </div>

          {/* Professional */}
          <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-8 rounded-xl shadow-xl text-white transform scale-105">
            <div className="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full inline-block mb-4">
              MOST POPULAR
            </div>
            <h3 className="text-2xl font-bold mb-2">Professional</h3>
            <p className="text-blue-100 mb-4">For growing businesses</p>
            <div className="mb-6">
              <span className="text-4xl font-bold">₹2,999</span>
              <span className="text-blue-100">/month</span>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center"><CheckCircle className="w-5 h-5 mr-2" /> 15 Users</li>
              <li className="flex items-center"><CheckCircle className="w-5 h-5 mr-2" /> Unlimited Products</li>
              <li className="flex items-center"><CheckCircle className="w-5 h-5 mr-2" /> Unlimited Invoices</li>
              <li className="flex items-center"><CheckCircle className="w-5 h-5 mr-2" /> Advanced Reports</li>
              <li className="flex items-center"><CheckCircle className="w-5 h-5 mr-2" /> WhatsApp Integration</li>
            </ul>
            <Link to="/onboarding" className="block w-full bg-white text-blue-600 py-3 rounded-lg hover:bg-blue-50 font-semibold text-center">
              Start Trial
            </Link>
          </div>

          {/* Enterprise */}
          <div className="bg-white p-8 rounded-xl shadow-lg border-2 border-gray-200">
            <h3 className="text-2xl font-bold mb-2">Enterprise</h3>
            <p className="text-gray-600 mb-4">For large organizations</p>
            <div className="mb-6">
              <span className="text-4xl font-bold">₹9,999</span>
              <span className="text-gray-600">/month</span>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center"><CheckCircle className="w-5 h-5 text-green-500 mr-2" /> Unlimited Users</li>
              <li className="flex items-center"><CheckCircle className="w-5 h-5 text-green-500 mr-2" /> Everything in Pro</li>
              <li className="flex items-center"><CheckCircle className="w-5 h-5 text-green-500 mr-2" /> White Label</li>
              <li className="flex items-center"><CheckCircle className="w-5 h-5 text-green-500 mr-2" /> Custom Domain</li>
              <li className="flex items-center"><CheckCircle className="w-5 h-5 text-green-500 mr-2" /> Priority Support</li>
            </ul>
            <Link to="/onboarding" className="block w-full bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 font-semibold text-center">
              Start Trial
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-br from-blue-600 to-purple-600 py-20">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Transform Your Business?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join hundreds of businesses already using Cloudritz CRM
          </p>
          <Link 
            to="/onboarding"
            className="inline-flex items-center bg-white text-blue-600 px-8 py-4 rounded-lg hover:bg-blue-50 font-semibold text-lg"
          >
            Start Your Free Trial <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">C</span>
                </div>
                <span className="ml-2 text-white font-bold">Cloudritz CRM</span>
              </div>
              <p className="text-sm">Complete business management solution for modern enterprises.</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="hover:text-white">Features</a></li>
                <li><a href="#pricing" className="hover:text-white">Pricing</a></li>
                <li><Link to="/onboarding" className="hover:text-white">Start Trial</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">About Us</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
                <li><a href="#" className="hover:text-white">Support</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
            <p>© 2024 Cloudritz Tech. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
