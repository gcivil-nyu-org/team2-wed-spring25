'use client';
import { useState } from 'react';

export default function ForumSidebarInfo() {
  const [openIndex, setOpenIndex] = useState(null);

  const rules = [
    {
      title: "Be Respectful",
      content:
        "Treat everyone with kindness and dignity. Personal attacks, harassment, or discriminatory remarks will not be tolerated.",
    },
    {
      title: "Stay On Topic",
      content:
        "Keep discussions focused on night safety, walking experiences, community concerns, or tips that help others stay informed.",
    },
    {
      title: "No Hate Speech or Threats",
      content:
        "We’re here to support each other. Posts with hate speech, violent threats, or targeting individuals or groups will be removed.",
    },
    {
      title: "Use the Report Button, Not Public Callouts",
      content:
        "If someone violates the rules or you're concerned about a post, please report it. Avoid calling people out in threads.",
    },
    {
      title: "No Misinformation or Panic Posts",
      content:
        "Share responsibly. Posts that spread unverified fear or rumors will be removed. When in doubt, include a source or say it’s anecdotal.",
    },
    {
      title: "Respect Privacy",
      content:
        "Don’t post identifying details about others (faces, names, addresses, etc.) without consent. This includes both people and private property.",
    },
  ];  

  const resources = [
    {
      label: '📍 Report Streetlight Outage (NYC 311)',
      href: 'https://portal.311.nyc.gov/article/?kanumber=KA-02463',
    },
    {
      label: '🚓 File a Police Report (NYPD)',
      href: 'https://www.nyc.gov/site/nypd/services/victim-services/how-to-report-a-crime.page',
    },
    {
      label: '🧹 Report Sanitation Issues (NYC 311)',
      href: 'https://portal.311.nyc.gov/article/?kanumber=KA-01504',
    },
    {
      label: '🚇 Report Unsafe Subway Conditions (MTA)',
      href: 'https://www.mta.info/contact-us',
    },
    {
      label: '🛡️ Request a Safe Walk (SafeWalks NYC)',
      href: 'https://www.instagram.com/safewalksnyc/?hl=en',
    },
    {
      label: '🧠 Mental Health Support (NYC 988)',
      href: 'https://nyc988.cityofnewyork.us/en/',
    },
    {
      label: '🗣️ Report Street Harassment (Right To Be)',
      href: 'https://righttobe.org/',
    },
  ];  

  const toggleOpen = (index) => {
    setOpenIndex(index === openIndex ? null : index);
  };

  return (
    <div className="flex flex-col gap-3 w-[250px] max-w-[250px] text-sm text-gray-300 pb-2">
      {/* Community Bookmarks Card */}
      <div className="bg-[#1e1e1e] rounded-xl p-4 shadow-[inset_0_1px_2px_rgba(255,255,255,0.05)]">
        <h2 className="font-bold text-sm bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-3">
          Community Bookmarks
        </h2>
        {resources.map((res, i) => (
          <a
            key={i}
            href={res.href}
            target="_blank"
            rel="noreferrer"
            className="block w-full bg-[#2c2c2c] rounded-full px-4 py-1 text-xs text-gray-200 hover:bg-gray-700 hover:text-white hover:ring-1 hover:ring-white/10 transition-all mb-2"
          >
            {res.label}
          </a>
        ))}
      </div>

      {/* Rules Card */}
      <div className="bg-[#1e1e1e] rounded-xl p-4 shadow-[inset_0_1px_2px_rgba(255,255,255,0.05)]">
        <h2 className="font-bold text-sm bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-3">
          Rules
        </h2>
        {rules.map((rule, index) => (
          <div key={index}>
            <button
              onClick={() => toggleOpen(index)}
              className={`w-full text-left text-xs px-4 py-1 rounded-full font-medium transition-all
                ${
                  openIndex === index
                    ? 'bg-gray-700 text-gray-100'
                    : 'text-gray-300 hover:text-white hover:ring-1 hover:ring-white/10'
                }`}
            >
              {index + 1}. {rule.title}
            </button>
            {openIndex === index && (
              <p className="text-xs text-gray-400 px-4 py-2 transition-all duration-200 ease-in-out">
                {rule.content}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
