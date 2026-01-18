import React from 'react';
import { Facebook, Twitter, Instagram, Mail, Phone, MapPin } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-white mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">M</span>
              </div>
              <h2 className="text-2xl font-bold">
                Machinery<span className="text-primary-400">Mart</span>
              </h2>
            </div>
            <p className="text-gray-400 mb-4">
              India's largest AI-powered marketplace for buying and selling machinery.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white"><Facebook size={20} /></a>
              <a href="#" className="text-gray-400 hover:text-white"><Twitter size={20} /></a>
              <a href="#" className="text-gray-400 hover:text-white"><Instagram size={20} /></a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-400 hover:text-white">Browse Machinery</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white">Sell Your Machine</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white">How It Works</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white">Pricing</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white">Blog</a></li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Categories</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-400 hover:text-white">Tractors</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white">Excavators</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white">Harvesters</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white">Trucks</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white">Forklifts</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-center space-x-2">
                <Phone size={16} className="text-primary-400" />
                <span className="text-gray-400">+91 98765 43210</span>
              </li>
              <li className="flex items-center space-x-2">
                <Mail size={16} className="text-primary-400" />
                <span className="text-gray-400">help@machinerymart.com</span>
              </li>
              <li className="flex items-center space-x-2">
                <MapPin size={16} className="text-primary-400" />
                <span className="text-gray-400">Mumbai, Maharashtra</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} MachineryMart. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;