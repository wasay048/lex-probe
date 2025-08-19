import React from "react";
import Logo from "@/components/ui/Logo";

const Intro = () => {
  return (
    <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-teal-600 to-amber-600 p-12 items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-black opacity-20"></div>
      <div className="relative z-10 text-white max-w-md">
        <div className="flex items-center justify-center mb-8">
          <Logo size="xl" />
        </div>

        <h1 className="text-4xl font-bold mb-6 leading-tight">
          Join the Legal Intelligence Revolution
        </h1>

        <p className="text-xl text-teal-100 mb-8 leading-relaxed">
          Get started with our advanced AI-powered legal research platform and
          transform your legal practice with intelligent insights.
        </p>

        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-green-400 rounded-full flex items-center justify-center">
              <svg
                className="w-5 h-5 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <span className="text-teal-100">Free 14-day trial</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-green-400 rounded-full flex items-center justify-center">
              <svg
                className="w-5 h-5 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <span className="text-teal-100">No credit card required</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-green-400 rounded-full flex items-center justify-center">
              <svg
                className="w-5 h-5 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <span className="text-teal-100">AI-powered insights</span>
          </div>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute top-10 right-10 w-20 h-20 bg-white bg-opacity-10 rounded-full"></div>
      <div className="absolute bottom-10 left-10 w-16 h-16 bg-white bg-opacity-10 rounded-full"></div>
      <div className="absolute top-1/2 right-20 w-12 h-12 bg-white bg-opacity-10 rounded-full"></div>
    </div>
  );
};

export default Intro;
