import React from 'react';
import { Menu, Search, ShoppingCart, User } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">M</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-800">
              Machinery<span className="text-primary-600">Mart</span>
            </h1>
          </div>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-2xl mx-8">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search machinery, tractors, excavators..."
                className="w-full pl-12 pr-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <Search className="absolute left-4 top-2.5 text-gray-400" size={20} />
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex items-center space-x-6">
            <button className="flex items-center space-x-2 text-gray-600 hover:text-primary-600 transition-colors">
              <ShoppingCart size={20} />
              <span className="hidden md:inline">Cart</span>
            </button>
            
            <button className="flex items-center space-x-2 text-gray-600 hover:text-primary-600 transition-colors">
              <User size={20} />
              <span className="hidden md:inline">Login</span>
            </button>
            
            <button className="bg-primary-600 text-white px-6 py-2 rounded-full hover:bg-primary-700 transition-colors">
              Sell Machine
            </button>
            
            <button className="md:hidden">
              <Menu size={24} />
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;