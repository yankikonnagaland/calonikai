import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">C</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Calonik.ai
              </span>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-md text-justify ml-[-10px] mr-[-10px] pl-[15px] pr-[15px]">
              Smart calorie tracking and weight management with AI-powered food recognition. 
              Achieve your fitness goals with personalized nutrition insights.
            </p>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Subscribe to Premium from within the app for enhanced features and AI-powered nutrition insights.
            </div>
            
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white tracking-wider uppercase mb-4">
              Features
            </h3>
            <ul className="space-y-3">
              <li><span className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 cursor-pointer">Calorie Tracking</span></li>
              <li><span className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 cursor-pointer">AI Food Recognition</span></li>
              <li><span className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 cursor-pointer">Exercise Tracking</span></li>
              <li><span className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 cursor-pointer">Weight Management</span></li>
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white tracking-wider uppercase mb-4">
              Legal
            </h3>
            <ul className="space-y-3">
              <li>
                <Link 
                  href="/privacy-policy" 
                  className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link 
                  href="/terms-conditions" 
                  className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                >
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link 
                  href="/refund-policy" 
                  className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                >
                  Refund Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-gray-400 dark:text-gray-400 text-center text-[14px]">
              <strong>Disclaimer:</strong> Calonik.ai provides general informational purposes only—not medical advice, diagnosis, or treatment. Calorie estimates, nutritional data, and health suggestions are approximations and may not suit everyone. Always consult a qualified healthcare professional before altering your diet or exercise. Individual results vary, and Calonik.ai is not liable for health outcomes related to app use.
            </p>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-500 dark:text-gray-400 text-sm">© 2025 Calonik.ai | Pikonik | Kikonic Tech | All rights reserved.</p>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-2 md:mt-0">
              Made with ❤️ for healthier living
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}