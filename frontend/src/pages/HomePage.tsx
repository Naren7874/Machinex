import { useState, useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import LoadingSpinner from '../components/LoadingSpinner';
import { Truck, Tractor, Wrench, Shield, Star, TrendingUp, CheckCircle } from 'lucide-react';

const HomePage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [healthStatus, setHealthStatus] = useState<any>(null);

  useEffect(() => {
    // Test backend connection
    fetch(`${import.meta.env.VITE_API_URL}/health`)
      .then(res => res.json())
      .then(data => {
        setHealthStatus(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  const categories = [
    { icon: <Tractor />, name: 'Tractors', count: '1,200+' },
    { icon: <Truck />, name: 'Excavators', count: '850+' },
    { icon: <Wrench />, name: 'Farm Equipment', count: '2,500+' },
  ];

  const features = [
    {
      icon: <Shield className="text-green-500" />,
      title: 'Verified Sellers',
      description: 'All sellers are verified with KYC documents'
    },
    {
      icon: <Star className="text-yellow-500" />,
      title: 'AI-Powered Inspection',
      description: 'Get instant valuation using AI image analysis'
    },
    {
      icon: <TrendingUp className="text-blue-500" />,
      title: 'Price Analytics',
      description: 'Smart pricing suggestions based on market trends'
    },
    {
      icon: <CheckCircle className="text-purple-500" />,
      title: 'Escrow Protection',
      description: 'Secure payments with buyer protection'
    }
  ];

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-50 to-blue-50 py-16 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Buy & Sell <span className="text-primary-600">Machinery</span><br />
            <span className="text-3xl md:text-5xl">with AI Power</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            India's first WhatsApp + AI based marketplace for machinery. 
            List, sell, or buy machinery in minutes with zero commission.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="btn-primary text-lg px-8 py-3">
              Start Selling
            </button>
            <button className="btn-secondary text-lg px-8 py-3">
              Browse Machinery
            </button>
          </div>
          
          {/* Backend Status */}
          {healthStatus && (
            <div className="mt-8 inline-flex items-center space-x-2 bg-white px-4 py-2 rounded-full shadow-sm">
              <div className={`w-3 h-3 rounded-full ${healthStatus.status === 'healthy' ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm">
                Backend: {healthStatus.status} • Service: {healthStatus.service}
              </span>
            </div>
          )}
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Popular Categories</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {categories.map((category, index) => (
              <div key={index} className="card hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-center justify-center w-16 h-16 bg-primary-100 rounded-lg mb-4 mx-auto">
                  <div className="text-primary-600">{category.icon}</div>
                </div>
                <h3 className="text-xl font-semibold text-center mb-2">{category.name}</h3>
                <p className="text-gray-600 text-center">{category.count} Machines Available</p>
                <button className="mt-4 text-primary-600 hover:text-primary-700 font-medium">
                  Explore →
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-gray-50 py-16 px-4">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose MachineryMart?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-white rounded-lg shadow-sm">
                    {feature.icon}
                  </div>
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto text-center">
          <div className="max-w-2xl mx-auto card">
            <h2 className="text-3xl font-bold mb-4">Ready to Sell Your Machinery?</h2>
            <p className="text-gray-600 mb-8">
              Just send a WhatsApp message with photos and get instant valuation!
            </p>
            <button className="btn-primary text-lg px-8 py-3">
              📱 Chat on WhatsApp
            </button>
            <p className="mt-4 text-sm text-gray-500">
              No app download required • 24/7 AI Assistant
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default HomePage;