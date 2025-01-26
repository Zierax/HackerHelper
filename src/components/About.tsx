import React from 'react';
import { Github, Linkedin, Mail, Twitter } from 'lucide-react';

const About: React.FC = () => {
  const authorInfo = {
    name: "Ziad",
    role: "Web2/Web3 Penetration Tester & Bug Hunter",
    description: `Experienced Web2/Web3 Penetration Tester & Bug Hunter with a focus on uncovering critical vulnerabilities and
    enhancing security for diverse platforms. Skilled in automating security scans through the development of custom
    tools and scripts, driving efficient and thorough assessments. Passionate about cybersecurity, with a proven track
    record of impactful vulnerability discoveries in both traditional web and decentralized environments. Constantly
    innovating to stay ahead of emerging threats in the evolving digital landscape.`,
    skills: [
      "Web2 Security",
      "Web3 Security",
      "Penetration Testing",
      "Bug Hunting",
      "Security Automation",
      "Custom Tool Development",
      "Vulnerability Assessment"
    ],
    socialLinks: [
      {
        name: "GitHub",
        url: "https://github.com/Zierax",
        icon: Github
      },
      {
        name: "LinkedIn",
        url: "https://linkedin.com/in/z14d",
        icon: Linkedin
      },
      {
        name: "Twitter",
        url: "https://twitter.com/Zierax_x",
        icon: Twitter
      },
      {
        name: "Email",
        url: "mailto:zs.01117875692@gmail.com",
        icon: Mail
      }
    ]
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        {/* Header Section */}
        <div className="p-8 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {authorInfo.name}
          </h1>
          <p className="text-xl text-blue-600 dark:text-blue-400 mb-4">
            {authorInfo.role}
          </p>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
            {authorInfo.description}
          </p>
        </div>

        {/* Skills Section */}
        <div className="p-8 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            Skills & Expertise
          </h2>
          <div className="flex flex-wrap gap-2">
            {authorInfo.skills.map((skill, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 
                         rounded-full text-sm font-medium"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* Social Links Section */}
        <div className="p-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            Connect with Me
          </h2>
          <div className="flex flex-wrap gap-4">
            {authorInfo.socialLinks.map((link, index) => {
              const Icon = link.icon;
              return (
                <a
                  key={index}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 
                           rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors
                           text-gray-700 dark:text-gray-200"
                >
                  <Icon className="w-5 h-5" />
                  <span>{link.name}</span>
                </a>
              );
            })}
          </div>
        </div>
      </div>

      {/* Project Info */}
      <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
          About HackerHelper
        </h2>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
          HackerHelper is an all-in-one toolkit designed to assist security researchers, penetration testers,
          and developers in their daily workflows. It combines various tools and utilities into a single,
          easy-to-use interface.
        </p>
        <div className="flex gap-4">
          <a
            href="https://github.com/Zierax/HackerHelper"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 
                     text-white rounded-lg transition-colors"
          >
            <Github className="w-5 h-5" />
            <span>View on GitHub</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default About;
