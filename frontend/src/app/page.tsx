import Link from "next/link";
import Logo from "@/components/ui/Logo";
import {
  ShieldCheckIcon,
  ChartBarIcon,
  DocumentTextIcon,
  ArrowRightIcon,
  EyeIcon,
  LockClosedIcon,
  GlobeAltIcon,
} from "@heroicons/react/24/outline";

export default function HomePage() {
  console.log("API_BASE_URL", process.env.NEXT_PUBLIC_API_BASE_URL);
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-amber-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Logo href="/" size="md" />
            <div className="hidden md:flex items-center space-x-8">
              <Link
                href="#features"
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                Features
              </Link>
              <Link
                href="#how-it-works"
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                How it Works
              </Link>
              <Link
                href="#pricing"
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                Pricing
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/login"
                className="text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Advanced Legal Intelligence with
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-amber-500">
                {" "}
                AI-Powered Analytics
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Cutting-edge artificial intelligence analyzes legal and market
              data to identify compliance risks, potential violations, and
              anti-competitive behavior. Strengthen your legal strategy and
              ensure regulatory compliance.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12">
              <Link
                href="/register"
                className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-3 rounded-lg text-lg font-medium inline-flex items-center justify-center transition-all shadow-lg hover:shadow-xl"
              >
                Start Free Trial
                <ArrowRightIcon className="ml-2 h-5 w-5" />
              </Link>
              <Link
                href="/login"
                className="border border-gray-300 hover:border-gray-400 bg-white text-gray-700 px-8 py-3 rounded-lg text-lg font-medium inline-flex items-center justify-center transition-all hover:shadow-md"
              >
                <EyeIcon className="mr-2 h-5 w-5" />
                View Demo
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-3xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-teal-600 mb-2">
                  99.2%
                </div>
                <div className="text-gray-600">Analysis Accuracy</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-teal-600 mb-2">
                  500+
                </div>
                <div className="text-gray-600">Legal Cases Analyzed</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-teal-600 mb-2">
                  24/7
                </div>
                <div className="text-gray-600">Continuous Monitoring</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Powerful Features for Market Surveillance
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Our comprehensive platform provides everything you need to detect
              and prevent cartel activities.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-8 rounded-xl border border-blue-200">
              <ChartBarIcon className="h-12 w-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Advanced Market Analysis
              </h3>
              <p className="text-gray-600">
                Comprehensive analysis of market trends, pricing patterns, and
                competitive dynamics across multiple industries and regions.
              </p>
            </div>

            <div className="bg-gradient-to-br from-red-50 to-red-100 p-8 rounded-xl border border-red-200">
              <ShieldCheckIcon className="h-12 w-12 text-red-600 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                AI-Powered Risk Detection
              </h3>
              <p className="text-gray-600">
                Machine learning algorithms identify suspicious activities and
                potential cartel behavior with unprecedented accuracy and speed.
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 p-8 rounded-xl border border-green-200">
              <DocumentTextIcon className="h-12 w-12 text-green-600 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Compliance & Reporting
              </h3>
              <p className="text-gray-600">
                Generate detailed compliance reports for regulatory authorities
                and maintain comprehensive audit trails.
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-8 rounded-xl border border-purple-200">
              <LockClosedIcon className="h-12 w-12 text-purple-600 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Secure & Private
              </h3>
              <p className="text-gray-600">
                Enterprise-grade security with end-to-end encryption and
                compliance with international data protection standards.
              </p>
            </div>

            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-8 rounded-xl border border-yellow-200">
              <GlobeAltIcon className="h-12 w-12 text-yellow-600 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Global Coverage
              </h3>
              <p className="text-gray-600">
                Monitor markets across multiple countries and jurisdictions with
                localized compliance and regulatory frameworks.
              </p>
            </div>

            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-8 rounded-xl border border-indigo-200">
              <ArrowRightIcon className="h-12 w-12 text-indigo-600 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Real-time Alerts
              </h3>
              <p className="text-gray-600">
                Instant notifications when suspicious activities are detected,
                enabling rapid response to potential threats.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-600 py-20">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
            Ready to Protect Your Market?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join leading organizations using our platform to ensure fair
            competition and market integrity.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/register"
              className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-3 rounded-lg text-lg font-medium transition-colors shadow-lg"
            >
              Start Your Free Trial
            </Link>
            <Link
              href="/login"
              className="border border-white text-white hover:bg-white hover:text-blue-600 px-8 py-3 rounded-lg text-lg font-medium transition-colors"
            >
              Sign In to Continue
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center mb-4">
                <ShieldCheckIcon className="h-8 w-8 text-blue-400" />
                <span className="ml-2 text-xl font-bold">
                  Cartel Detection Platform
                </span>
              </div>
              <p className="text-gray-300 mb-4">
                Advanced AI-powered platform for detecting cartel behavior and
                ensuring fair market competition.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-300">
                <li>
                  <Link href="#" className="hover:text-white">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    API
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-300">
                <li>
                  <Link href="#" className="hover:text-white">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    Privacy
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-300">
            <p>&copy; 2024 Cartel Detection Platform. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
