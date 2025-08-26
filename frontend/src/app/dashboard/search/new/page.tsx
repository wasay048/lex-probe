"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { searchAPI } from "@/lib/api";
import toast from "react-hot-toast";
import {
  MagnifyingGlassIcon,
  PlusIcon,
  XMarkIcon,
  BuildingOfficeIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  Cog6ToothIcon,
  FunnelIcon,
  DocumentMagnifyingGlassIcon,
  BeakerIcon,
} from "@heroicons/react/24/outline";

interface RiskIndicator {
  id: string;
  category: string;
  indicator: string;
  riskScore: number;
  modusOperandi: string;
  evidenceTypes: string;
  digitalEvidenceTypes: string;
  webResources: string;
  topSources: string;
  openSourceTools: string;
  apiTools: string;
  mvp: boolean;
}

interface Company {
  name: string;
  website: string;
}

interface SearchFormData {
  companies: Company[];
  searchName: string;
  description: string;
  selectedCategories: string[];
  selectedIndicators: string[];
  searchMode: "osint";
}

// Data from CSV file for MVP
const CARTEL_CATEGORIES = [
  "Price Fixing",
  "Market Allocation",
  "Bid Rigging",
  "Facilitating Practices",
  "Structural/Relationship Red Flags",
  "Leniency & Whistleblower Triggers",
];

const RISK_INDICATORS_DATA: RiskIndicator[] = [
  // Price Fixing
  {
    id: "price_fixing_identical",
    category: "Price Fixing",
    indicator: "Identical base prices or surcharges without justification",
    riskScore: 5,
    modusOperandi:
      "Firms agree to charge the same or nearly identical prices or surcharges, eliminating price competition.",
    evidenceTypes:
      "Price lists, invoices, or contracts showing identical pricing across competitors.",
    digitalEvidenceTypes:
      "Audit algorithm settings, shared API access logs, and metadata from pricing software.",
    webResources:
      "Google Shopping: https://shopping.google.com, Amazon: https://www.amazon.com",
    topSources: "Amazon, Google Shopping, PriceRunner",
    openSourceTools: "Amazon, Google Shopping, PriceRunner",
    apiTools: "SerpAPI, Bright Data, Diffbot",
    mvp: true,
  },
  {
    id: "price_fixing_coordinated",
    category: "Price Fixing",
    indicator: "Coordinated or simultaneous price changes",
    riskScore: 5,
    modusOperandi:
      "Competitors align price increases or reductions to signal and maintain a collusive pricing regime.",
    evidenceTypes:
      "Internal emails, press releases, or price change notices with aligned timing.",
    digitalEvidenceTypes:
      "Scrape logs from price-tracking bots, platform notifications, or digital pricing triggers.",
    webResources: "PriceSpy, Wayback Machine, BusinessWire",
    topSources: "Wayback Machine, Company Newsrooms, BusinessWire",
    openSourceTools: "Wayback Machine, BusinessWire, Company News Sites",
    apiTools: "Factiva, AlphaSense, ShadowDragon",
    mvp: true,
  },
  {
    id: "price_fixing_future_intentions",
    category: "Price Fixing",
    indicator: "Exchange of future pricing intentions",
    riskScore: 4,
    modusOperandi:
      "Firms share non-public future pricing strategies to align decisions and avoid competitive pressure.",
    evidenceTypes:
      "Emails, meeting records, or chat logs discussing planned price changes.",
    digitalEvidenceTypes:
      "Encrypted chat logs, collaboration notes, AI-generated pricing insights shared via platforms.",
    webResources: "Reddit, LinkedIn, Seeking Alpha",
    topSources: "Reddit, LinkedIn, Seeking Alpha",
    openSourceTools: "Reddit, LinkedIn, Seeking Alpha",
    apiTools: "ShadowDragon, AlphaSense, Meltwater",
    mvp: true,
  },
  {
    id: "price_fixing_converging_margins",
    category: "Price Fixing",
    indicator: "Converging profit margins despite cost differences",
    riskScore: 4,
    modusOperandi:
      "Despite different costs, firms maintain similar margins, often due to tacit collusion.",
    evidenceTypes:
      "Internal margin reports, competitor benchmarking data, and cost structure analysis.",
    digitalEvidenceTypes:
      "Shared analytics dashboards, BI tools' usage logs, or integrated cost analysis sheets.",
    webResources: "MarketWatch, Google Finance",
    topSources: "Morningstar, SEC EDGAR, Yahoo Finance",
    openSourceTools: "Yahoo Finance, Morningstar, Public EDGAR filings",
    apiTools: "Bloomberg API, Xignite, Refinitiv",
    mvp: true,
  },
  {
    id: "price_fixing_industry_norms",
    category: "Price Fixing",
    indicator: "Industry norms to maintain pricing",
    riskScore: 3,
    modusOperandi:
      "Market players enforce 'rules' or unwritten agreements to sustain coordinated pricing.",
    evidenceTypes:
      "Meeting minutes, trade association discussions, or memos referencing 'industry rules'.",
    digitalEvidenceTypes:
      "Webinar recordings, industry sentiment tools, or AI analytics from forum discussions.",
    webResources: "OECD iLibrary, TradePub",
    topSources: "OECD, Trade Associations, Conference Websites",
    openSourceTools: "OECD Library, Trade Conferences, Webinar Recordings",
    apiTools: "Meltwater, AlphaSense, LexisNexis API",
    mvp: true,
  },
  {
    id: "price_fixing_communications_enforcement",
    category: "Price Fixing",
    indicator: "Communications showing price enforcement",
    riskScore: 5,
    modusOperandi:
      "Internal messages reveal monitoring or reprimanding rivals for price undercutting.",
    evidenceTypes:
      "Emails warning competitors about undercutting or requesting price alignment.",
    digitalEvidenceTypes:
      "Telegram/Signal logs, admin activity on private forums, or warnings in group chats.",
    webResources: "Telegram, Discord",
    topSources: "Telegram Channels, Discord Forums, Pastebin",
    openSourceTools: "Pastebin, Telegram (public channels), Discord",
    apiTools: "SocialGist, Echosec, ShadowDragon",
    mvp: true,
  },
  {
    id: "price_fixing_trade_associations",
    category: "Price Fixing",
    indicator: "Use of trade associations to discuss pricing",
    riskScore: 3,
    modusOperandi:
      "Trade bodies act as forums to align or signal price changes informally.",
    evidenceTypes:
      "Trade meeting agendas, attendance records, or minutes documenting sensitive topics.",
    digitalEvidenceTypes:
      "Webinar chat logs, calendar invites, video call platforms' metadata.",
    webResources: "Eventbrite, Zoom Events",
    topSources: "Eventbrite, YouTube (conference videos), Association Websites",
    openSourceTools:
      "Eventbrite, YouTube (conference uploads), Public Association Pages",
    apiTools: "Event Registry API, LexisNexis, AlphaSense",
    mvp: true,
  },
  {
    id: "price_fixing_public_signaling",
    category: "Price Fixing",
    indicator: "Public signaling through media or trade press",
    riskScore: 3,
    modusOperandi:
      "Companies announce pricing changes publicly to signal intentions to rivals.",
    evidenceTypes:
      "News articles, press releases, or speeches indicating price intentions.",
    digitalEvidenceTypes:
      "Web archives, coordinated press releases, LinkedIn post analytics.",
    webResources: "PR Newswire, Business Wire",
    topSources: "PR Newswire, Twitter, LinkedIn",
    openSourceTools: "Twitter, LinkedIn, PR Newswire",
    apiTools: "Factiva, GDELT, Meltwater",
    mvp: true,
  },
  {
    id: "price_fixing_cost_margin_exchange",
    category: "Price Fixing",
    indicator: "Exchange of cost or margin data between firms",
    riskScore: 4,
    modusOperandi:
      "Competitors share sensitive financial data to align profitability and prices.",
    evidenceTypes:
      "Shared spreadsheets, benchmarking studies, or internal emails with margin details.",
    digitalEvidenceTypes:
      "Shared dashboards, cloud folder sharing logs, anonymized survey participation records.",
    webResources: "Benchmarks Online, Kaggle",
    topSources: "Benchmarking Portals, Gartner, Industry Surveys",
    openSourceTools: "Public survey results, news summaries, SlideShare",
    apiTools: "PitchBook, FactSet, CB Insights",
    mvp: true,
  },
  {
    id: "price_fixing_suspicious_benchmarking",
    category: "Price Fixing",
    indicator: "Suspicious benchmarking or data sharing",
    riskScore: 3,
    modusOperandi:
      "Joint benchmarking exercises disguise coordination under the guise of best practices.",
    evidenceTypes:
      "Third-party reports or communications between participants discussing data benchmarks.",
    digitalEvidenceTypes:
      "Benchmark access reports, SaaS logs showing repeated peer access.",
    webResources: "Statista, Datawrapper",
    topSources: "Kaggle Datasets, Shared PowerBI dashboards, Datawrapper",
    openSourceTools: "Kaggle, Google Data Studio Public Dashboards, GitHub",
    apiTools: "Gartner (API access partners), Bright Data, ShadowDragon",
    mvp: true,
  },
  {
    id: "price_fixing_pricing_audits",
    category: "Price Fixing",
    indicator: "Pricing audits coordinated by industry bodies",
    riskScore: 2,
    modusOperandi:
      "Industry bodies conduct pricing audits that facilitate implicit collusion.",
    evidenceTypes:
      "Audit reports, association memos, or firm submissions showing pricing comparisons.",
    digitalEvidenceTypes:
      "Portal activity logs, shared audit dashboards, report distribution metadata.",
    webResources: "ICAEW, Deloitte Insights",
    topSources:
      "Industry Portals, ISO Certification Sites, Audit Platform Demos",
    openSourceTools: "ISO Sites, Industry Org Websites, Certification Portals",
    apiTools: "Certik, Bright Data, DataMiner APIs",
    mvp: true,
  },
  {
    id: "price_fixing_email_arrangements",
    category: "Price Fixing",
    indicator: "Emails referring to price fixing arrangements",
    riskScore: 5,
    modusOperandi:
      "Internal communications explicitly discuss price-fixing agreements or expectations.",
    evidenceTypes:
      "Direct messages, email threads, or attachments outlining the cartel agreement.",
    digitalEvidenceTypes:
      "Recovered draft emails, cloud doc version history, disappearing message traces.",
    webResources: "Pastebin, BreachForums (archived)",
    topSources: "WikiLeaks, Pastebin, DocumentCloud",
    openSourceTools: "WikiLeaks, Pastebin, DocumentCloud",
    apiTools: "ShadowDragon, Intel 471, DomainTools",
    mvp: true,
  },

  // Market Allocation
  {
    id: "market_allocation_no_poaching",
    category: "Market Allocation",
    indicator: "No-poaching behavior for key customers",
    riskScore: 5,
    modusOperandi:
      "Competitors avoid soliciting each other's clients as part of an allocation scheme.",
    evidenceTypes:
      "Customer complaints, internal sales policies, or sales rep instructions.",
    digitalEvidenceTypes:
      "Ad network settings, CRM customer flags, platform-level blacklists.",
    webResources: "LinkedIn Ads, X Ads",
    topSources: "Job Boards, CRM Tools Knowledge Bases, LinkedIn Job Insights",
    openSourceTools: "Job Boards, LinkedIn, Recruitment Sites",
    apiTools: "",
    mvp: true,
  },
  {
    id: "market_allocation_exclusive_assignments",
    category: "Market Allocation",
    indicator: "Exclusive customer assignments",
    riskScore: 5,
    modusOperandi:
      "Certain customers are unofficially assigned to specific competitors.",
    evidenceTypes: "Contracts, internal allocation tables, or strategic plans.",
    digitalEvidenceTypes:
      "SaaS configuration settings, segmentation rules, sales team workflows.",
    webResources: "HubSpot, Insightly",
    topSources:
      "Sales Enablement Portals, HubSpot Resources, Internal Portals (leaked)",
    openSourceTools: "HubSpot Resources, CRM Demo Sites",
    apiTools: "",
    mvp: true,
  },
  {
    id: "market_allocation_lack_competition",
    category: "Market Allocation",
    indicator: "Lack of competition in overlapping markets",
    riskScore: 4,
    modusOperandi:
      "Despite overlapping capabilities, firms consistently do not compete head-to-head.",
    evidenceTypes:
      "Market analysis reports and customer surveys showing unchallenged monopolies.",
    digitalEvidenceTypes:
      "Digital marketing heatmaps, auction logs, and online marketplace participation records.",
    webResources: "SimilarWeb, SEMrush",
    topSources: "Google Maps Business Listings, SEMrush, SpyFu",
    openSourceTools: "Google Maps, SEMrush (free tools), Business Registries",
    apiTools: "",
    mvp: true,
  },

  // Bid Rigging
  {
    id: "bid_rigging_rotating_winners",
    category: "Bid Rigging",
    indicator: "Rotating tender winners over time",
    riskScore: 5,
    modusOperandi:
      "Firms take turns winning contracts to divide market benefits equally.",
    evidenceTypes:
      "Historical bid data showing patterns in winner rotation and turn-taking.",
    digitalEvidenceTypes:
      "Tender platform analytics showing repetitive win-loss patterns.",
    webResources: "Tenders Electronic Daily (TED), eTenders South Africa",
    topSources: "Government Tender Portals, OpenOpps, EU TED",
    openSourceTools: "Gov Procurement Portals, OpenOpps, EU TED",
    apiTools: "",
    mvp: true,
  },
  {
    id: "bid_rigging_identical_formats",
    category: "Bid Rigging",
    indicator: "Identical bid formats or wording",
    riskScore: 5,
    modusOperandi:
      "Bids feature near-identical phrasing or formatting, suggesting coordination.",
    evidenceTypes: "Side-by-side bid analyses highlighting identical content.",
    digitalEvidenceTypes:
      "Version history in collaboration tools, AI content generation traces.",
    webResources: "DropBox, Google Docs",
    topSources: "DocumentCloud, Scribd, Procurement Portals",
    openSourceTools: "DocumentCloud, Scribd, Bid Archives",
    apiTools: "",
    mvp: true,
  },
  {
    id: "bid_rigging_same_ip_location",
    category: "Bid Rigging",
    indicator: "Bids submitted from same IP or location",
    riskScore: 4,
    modusOperandi:
      "Technical traces show colluding firms used the same infrastructure to submit bids.",
    evidenceTypes:
      "IT logs, server data, or metadata linking submissions to same origin.",
    digitalEvidenceTypes: "VPN logs, IP addresses, browser fingerprint data.",
    webResources: "Shodan, VirusTotal",
    topSources: "Bidding Platform Logs, FOIA Results, Leak Archives",
    openSourceTools: "Bid Platform Logs (if leaked), FOIA Logs",
    apiTools: "",
    mvp: true,
  },
  {
    id: "bid_rigging_losers_subcontractors",
    category: "Bid Rigging",
    indicator: "Losers becoming subcontractors to winners",
    riskScore: 5,
    modusOperandi:
      "Prearranged deals allow losing bidders to benefit as subcontractors.",
    evidenceTypes:
      "Contracts or project records showing subcontracting relationships.",
    digitalEvidenceTypes:
      "Contract management system records, digital approval workflows.",
    webResources: "Dun & Bradstreet, Crunchbase",
    topSources:
      "Project Directories, Contract Award Sites, Subcontracting Platforms",
    openSourceTools: "Contract Award Pages, Project Databases",
    apiTools: "",
    mvp: true,
  },

  // Facilitating Practices
  {
    id: "facilitating_closed_meetings",
    category: "Facilitating Practices",
    indicator: "Closed meetings between competitors",
    riskScore: 4,
    modusOperandi:
      "Secretive in-person or virtual meetings facilitate illegal coordination.",
    evidenceTypes:
      "Calendars, hotel bookings, and surveillance records indicating private meetings.",
    digitalEvidenceTypes:
      "Virtual meeting room invites, password-protected link logs, video call app records.",
    webResources: "Zoom, Microsoft Teams",
    topSources: "Zoom Invite Leaks, Event Registries, Webinar Platforms",
    openSourceTools: "Event Registries, Zoom Invites (leaked), Webinar Portals",
    apiTools: "",
    mvp: true,
  },
  {
    id: "facilitating_public_signaling",
    category: "Facilitating Practices",
    indicator: "Signaling via public channels",
    riskScore: 3,
    modusOperandi:
      "Public announcements are used to communicate plans to other colluding firms.",
    evidenceTypes:
      "Timing of public announcements aligned with competitor responses.",
    digitalEvidenceTypes:
      "Social media activity history, time-linked announcements, reaction metrics.",
    webResources: "LinkedIn, Twitter (X)",
    topSources: "Twitter, LinkedIn, Blogs",
    openSourceTools: "Blogs, Tweets, Press Rooms",
    apiTools: "",
    mvp: true,
  },
  {
    id: "facilitating_internal_documents",
    category: "Facilitating Practices",
    indicator: "Internal documents referencing coordination",
    riskScore: 5,
    modusOperandi:
      "Company records show plans or discussions about aligning behavior.",
    evidenceTypes:
      "Presentations, notes, or business plans referring to collusion.",
    digitalEvidenceTypes:
      "Document revision history, internal note annotations, collaboration timelines.",
    webResources: "Google Drive, Evernote",
    topSources: "Google Docs, Evernote, Quip",
    openSourceTools: "Google Docs (indexed), Public GitHub Repos",
    apiTools: "",
    mvp: true,
  },
  {
    id: "facilitating_collusive_messaging",
    category: "Facilitating Practices",
    indicator: "Screenshots of collusive messaging",
    riskScore: 5,
    modusOperandi:
      "Chats, emails, or screenshots show explicit illegal coordination.",
    evidenceTypes:
      "Screenshots, exported chats, or printed WhatsApp/Telegram discussions.",
    digitalEvidenceTypes:
      "Chat app data exports, screenshot metadata, phone seizure logs.",
    webResources: "Imgur, Lightshot",
    topSources: "Image Boards, Reddit, Court Case Exhibits",
    openSourceTools: "Reddit Leaks, Court Filings, Exhibits",
    apiTools: "",
    mvp: true,
  },

  // Structural/Relationship Red Flags
  {
    id: "structural_employee_movements",
    category: "Structural/Relationship Red Flags",
    indicator: "Employee movements between firms",
    riskScore: 2,
    modusOperandi:
      "Frequent staff rotation supports informal alignment or information sharing.",
    evidenceTypes: "HR records, resumes, and internal emails.",
    digitalEvidenceTypes:
      "Social media career timelines, internal access logs post-transition.",
    webResources: "LinkedIn, Glassdoor",
    topSources: "LinkedIn, Glassdoor, Wayback Machine",
    openSourceTools: "LinkedIn, Resume Sites",
    apiTools: "",
    mvp: true,
  },
  {
    id: "structural_shared_advisors",
    category: "Structural/Relationship Red Flags",
    indicator: "Shared legal or compliance advisors",
    riskScore: 2,
    modusOperandi:
      "Common advisors may inadvertently or knowingly pass sensitive info.",
    evidenceTypes:
      "Advisory contracts, legal opinions, or billing records linking firms.",
    digitalEvidenceTypes:
      "Encrypted legal file trails, communication metadata, shared client platform use.",
    webResources: "Legal 500, Chambers and Partners",
    topSources: "Law Firm Websites, Client Lists, Legal Directories",
    openSourceTools: "Law Firm Webpages, Legal Conferences",
    apiTools: "",
    mvp: true,
  },

  // Leniency & Whistleblower Triggers
  {
    id: "leniency_meeting_agendas",
    category: "Leniency & Whistleblower Triggers",
    indicator: "Cartel meeting agendas found in raids",
    riskScore: 5,
    modusOperandi:
      "Investigators uncover formal meeting notes describing illegal coordination.",
    evidenceTypes: "Physical or digital documents retrieved during dawn raids.",
    digitalEvidenceTypes:
      "Calendar entries, cloud doc recoveries, platform invite records.",
    webResources: "Wikileaks, The Intercept",
    topSources: "Search Warrants, Raid Reports, Court Filings",
    openSourceTools: "Court Docs, Prosecutor Websites",
    apiTools: "",
    mvp: true,
  },
  {
    id: "leniency_secrecy_measures",
    category: "Leniency & Whistleblower Triggers",
    indicator: "Use of secrecy measures for collusion",
    riskScore: 4,
    modusOperandi:
      "Cartel members use specific practices to avoid detection and ensure secrecy.",
    evidenceTypes:
      "Use of encrypted apps, burner devices, or pseudonyms in communication.",
    digitalEvidenceTypes:
      "Auto-expiry cloud doc setups, secure messaging app configurations.",
    webResources: "Tor Project, Tails OS",
    topSources: "Telegram, Signal, Tor Project",
    openSourceTools: "Tor Project, Signal Website, Encrypted App Demos",
    apiTools: "",
    mvp: true,
  },
  {
    id: "price_fixing_future_intentions",
    category: "Price Fixing",
    indicator: "Exchange of future pricing intentions",
    riskScore: 4,
    modusOperandi:
      "Firms share non-public future pricing strategies to align decisions and avoid competitive pressure.",
    evidenceTypes:
      "Emails, meeting records, or chat logs discussing planned price changes.",
    digitalEvidenceTypes:
      "Encrypted chat logs, collaboration notes, AI-generated pricing insights shared via platforms.",
    webResources: "Reddit, LinkedIn, Seeking Alpha",
    topSources: "Reddit, LinkedIn, Seeking Alpha",
    openSourceTools: "Reddit, LinkedIn, Seeking Alpha",
    apiTools: "ShadowDragon, AlphaSense, Meltwater",
    mvp: true,
  },
  {
    id: "market_allocation_geographic",
    category: "Market Allocation",
    indicator: "Geographic market division",
    riskScore: 5,
    modusOperandi:
      "Competitors agree to divide territories and avoid competing in each other's regions.",
    evidenceTypes:
      "Market analysis reports and customer surveys showing unchallenged monopolies.",
    digitalEvidenceTypes:
      "Digital marketing heatmaps, auction logs, and online marketplace participation records.",
    webResources: "SimilarWeb, SEMrush, Google Maps",
    topSources: "Google Maps Business Listings, SEMrush, SpyFu",
    openSourceTools: "Google Maps, SEMrush (free tools), Business Registries",
    apiTools: "",
    mvp: true,
  },
  {
    id: "market_allocation_customers",
    category: "Market Allocation",
    indicator: "Customer allocation agreements",
    riskScore: 5,
    modusOperandi:
      "Firms divide customers among themselves to eliminate competition.",
    evidenceTypes: "Contracts, internal allocation tables, or strategic plans.",
    digitalEvidenceTypes:
      "Client segmentation enforced via shared SaaS platforms or pre-programmed CRM logic.",
    webResources: "HubSpot, Insightly, LinkedIn Sales",
    topSources: "Sales Enablement Portals, HubSpot Resources, Internal Portals",
    openSourceTools: "HubSpot Resources, CRM Demo Sites",
    apiTools: "",
    mvp: true,
  },
  {
    id: "bid_rigging_rotation",
    category: "Bid Rigging",
    indicator: "Rotating tender winners over time",
    riskScore: 5,
    modusOperandi:
      "Firms take turns winning contracts to divide market benefits equally.",
    evidenceTypes:
      "Historical bid data showing patterns in winner rotation and turn-taking.",
    digitalEvidenceTypes:
      "Tender platform analytics showing repetitive win-loss patterns.",
    webResources: "Tenders Electronic Daily (TED), eTenders",
    topSources: "Government Tender Portals, OpenOpps, EU TED",
    openSourceTools: "Gov Procurement Portals, OpenOpps, EU TED",
    apiTools: "",
    mvp: true,
  },
  {
    id: "bid_rigging_identical",
    category: "Bid Rigging",
    indicator: "Identical bid formats or wording",
    riskScore: 5,
    modusOperandi:
      "Bids feature near-identical phrasing or formatting, suggesting coordination.",
    evidenceTypes: "Side-by-side bid analyses highlighting identical content.",
    digitalEvidenceTypes:
      "Version history in collaboration tools, AI content generation traces.",
    webResources: "DocumentCloud, Scribd, Procurement Portals",
    topSources: "DocumentCloud, Scribd, Bid Archives",
    openSourceTools: "DocumentCloud, Scribd, Bid Archives",
    apiTools: "",
    mvp: true,
  },
  {
    id: "facilitating_closed_meetings",
    category: "Facilitating Practices",
    indicator: "Closed meetings between competitors",
    riskScore: 4,
    modusOperandi:
      "Secretive in-person or virtual meetings facilitate illegal coordination.",
    evidenceTypes:
      "Calendars, hotel bookings, and surveillance records indicating private meetings.",
    digitalEvidenceTypes:
      "Virtual meeting room invites, password-protected link logs, video call app records.",
    webResources: "Zoom, Microsoft Teams, Event Registries",
    topSources: "Event Registries, Zoom Invites, Webinar Portals",
    openSourceTools: "Event Registries, Zoom Invites (leaked), Webinar Portals",
    apiTools: "",
    mvp: true,
  },
];

const NewSearchPage: React.FC = () => {
  const router = useRouter();
  const [formData, setFormData] = useState<SearchFormData>({
    companies: [],
    searchName: "",
    description: "",
    selectedCategories: [],
    selectedIndicators: [],
    searchMode: "osint",
  });

  const [currentCompany, setCurrentCompany] = useState<Company>({
    name: "",
    website: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const addCompany = () => {
    if (
      currentCompany.name.trim() &&
      currentCompany.website.trim() &&
      !formData.companies.find((c) => c.name === currentCompany.name.trim())
    ) {
      setFormData((prev) => ({
        ...prev,
        companies: [
          ...prev.companies,
          {
            name: currentCompany.name.trim(),
            website: currentCompany.website.trim(),
          },
        ],
      }));
      setCurrentCompany({ name: "", website: "" });
      if (errors.companies) {
        setErrors((prev) => ({ ...prev, companies: "" }));
      }
    }
  };

  const removeCompany = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      companies: prev.companies.filter((_, i) => i !== index),
    }));
  };

  const toggleCategory = (category: string) => {
    const newCategories = formData.selectedCategories.includes(category)
      ? formData.selectedCategories.filter((c) => c !== category)
      : [...formData.selectedCategories, category];

    setFormData((prev) => ({
      ...prev,
      selectedCategories: newCategories,
    }));

    // Auto-select/deselect indicators when category is toggled
    const categoryIndicators = RISK_INDICATORS_DATA.filter(
      (ind) => ind.category === category && ind.mvp
    );

    if (newCategories.includes(category)) {
      // Add all indicators from this category
      const newIndicators = Array.from(
        new Set([
          ...formData.selectedIndicators,
          ...categoryIndicators.map((ind) => ind.id),
        ])
      );
      setFormData((prev) => ({ ...prev, selectedIndicators: newIndicators }));
    } else {
      // Remove all indicators from this category
      const indicatorIdsToRemove = categoryIndicators.map((ind) => ind.id);
      const newIndicators = formData.selectedIndicators.filter(
        (id) => !indicatorIdsToRemove.includes(id)
      );
      setFormData((prev) => ({ ...prev, selectedIndicators: newIndicators }));
    }
  };

  const toggleIndicator = (indicatorId: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedIndicators: prev.selectedIndicators.includes(indicatorId)
        ? prev.selectedIndicators.filter((id) => id !== indicatorId)
        : [...prev.selectedIndicators, indicatorId],
    }));
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (formData.companies.length < 2) {
      newErrors.companies = "Exactly 2 companies are required for comparison";
    } else if (formData.companies.length > 2) {
      newErrors.companies = "Maximum 2 companies allowed per search";
    }

    if (!formData.searchName.trim()) {
      newErrors.searchName = "Search name is required";
    }

    if (formData.selectedIndicators.length === 0) {
      newErrors.indicators = "At least one risk indicator must be selected";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Use current date as default date range since we removed time period selection
      const now = new Date();
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(now.getFullYear() - 1);

      const dateRange = {
        from: oneYearAgo.toISOString(),
        to: now.toISOString(),
      };

      // Get selected indicators with full data
      const selectedIndicatorsData = RISK_INDICATORS_DATA.filter((ind) =>
        formData.selectedIndicators.includes(ind.id)
      ).map((indicator) => ({
        category: indicator.category,
        indicator: indicator.indicator,
        riskScore: indicator.riskScore,
        isSelected: true,
      }));

      // Transform to backend format
      const searchData = {
        companies: formData.companies.map((company) => ({
          name: company.name,
          website: company.website.startsWith("http")
            ? company.website
            : `https://${company.website}`,
          industry: "Unknown", // Will be determined by scraping
          region: "Global",
        })),
        filters: {
          dateRange,
          industries: [],
          regions: [],
          searchName: formData.searchName.trim(),
          searchType: "past" as const, // Default to past analysis
        },
        selectedIndicators: formData.selectedIndicators,
        searchMode: formData.searchMode,
        description: formData.description.trim(), // Add description for OpenAI prompt
      };

      const response = await searchAPI.executeSearch(searchData);

      console.log("Full API response:", response);
      console.log("Response data:", response.data);
      console.log("Response data.data:", response.data.data);

      if (response.data.success) {
        const searchId = response.data.data?.searchId;

        console.log("Extracted searchId:", searchId);

        if (!searchId) {
          console.error("No searchId in response:", response.data);
          console.error(
            "Available keys in response.data.data:",
            Object.keys(response.data.data || {})
          );
          throw new Error("Search ID not returned from server");
        }

        toast.success("Cartel detection analysis initiated successfully!");
        console.log("Redirecting to:", `/dashboard/search/${searchId}`);
        router.push(`/dashboard/search/${searchId}`);
      } else {
        throw new Error(response.data.message || "Failed to start analysis");
      }
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Failed to start analysis";
      console.error("Search submission error:", error.response?.data || error);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const getIndicatorsForCategory = (category: string) => {
    return RISK_INDICATORS_DATA.filter(
      (ind) => ind.category === category && ind.mvp
    );
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          New Cartel Detection Analysis
        </h1>
        <p className="text-gray-600">
          Configure your search parameters to analyze potential cartel
          behavior between companies. Enter company details, select risk
          categories and indicators, then choose your search mode.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Search Configuration */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ChartBarIcon className="h-6 w-6 text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                Search Configuration
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Search Name"
                name="searchName"
                value={formData.searchName}
                onChange={handleInputChange}
                error={errors.searchName}
                placeholder="e.g., Tech Giants Market Analysis"
                disabled={loading}
                required
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Search Mode
                </label>
                <select
                  name="searchMode"
                  value={formData.searchMode}
                  onChange={handleInputChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading}
                  title="Search Mode"
                >
                  <option value="osint">Open Source Intelligence</option>
                </select>
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                AI Analysis Instructions (Optional)
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Provide specific instructions for the AI analysis. E.g., 'Focus on pricing patterns in the last 6 months' or 'Look for market division evidence in European markets'..."
                disabled={loading}
              />
              <p className="text-sm text-gray-500 mt-1">
                These instructions will be used to guide the OpenAI analysis. Be
                specific about what aspects you want the AI to focus on.
              </p>
            </div>
          </div>

          {/* Companies */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-green-100 rounded-lg">
                <BuildingOfficeIcon className="h-6 w-6 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                Companies to Analyze (Minimum 2 Required)
              </h2>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input
                  placeholder="Enter company name (e.g., Apple Inc.)"
                  value={currentCompany.name}
                  onChange={(e) =>
                    setCurrentCompany((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  disabled={loading || formData.companies.length >= 2}
                  label="Company Name"
                />
                <Input
                  placeholder="Enter company website (e.g., apple.com)"
                  value={currentCompany.website}
                  onChange={(e) =>
                    setCurrentCompany((prev) => ({
                      ...prev,
                      website: e.target.value,
                    }))
                  }
                  onKeyPress={(e) =>
                    e.key === "Enter" && (e.preventDefault(), addCompany())
                  }
                  disabled={loading || formData.companies.length >= 2}
                  label="Company Website"
                />
              </div>

              <div className="flex justify-end">
                <Button
                  type="button"
                  onClick={addCompany}
                  disabled={
                    !currentCompany.name.trim() ||
                    !currentCompany.website.trim() ||
                    formData.companies.length >= 2 ||
                    loading
                  }
                  leftIcon={<PlusIcon className="h-4 w-4" />}
                >
                  Add Company
                </Button>
              </div>

              {formData.companies.length >= 2 && (
                <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-2">
                  Maximum 2 companies allowed for analysis.
                </p>
              )}

              {errors.companies && (
                <p className="text-sm text-red-600">{errors.companies}</p>
              )}

              {formData.companies.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">
                    Companies Added ({formData.companies.length}/2):
                  </p>
                  <div className="space-y-2">
                    {formData.companies.map((company, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3"
                      >
                        <div>
                          <p className="font-medium text-green-800">
                            {company.name}
                          </p>
                          <p className="text-sm text-green-600">
                            {company.website}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeCompany(index)}
                          className="text-green-500 hover:text-green-700"
                          disabled={loading}
                          title="Remove company"
                        >
                          <XMarkIcon className="h-5 w-5 text-red-600" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Categories Selection */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-purple-100 rounded-lg">
                <FunnelIcon className="h-6 w-6 text-purple-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                Risk Categories
              </h2>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Select the categories of cartel behavior you want to analyze. Each
              category contains specific indicators that will be used for web
              scraping and analysis.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {CARTEL_CATEGORIES.map((category) => {
                const indicatorCount =
                  getIndicatorsForCategory(category).length;
                return (
                  <div
                    key={category}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      formData.selectedCategories.includes(category)
                        ? "border-purple-500 bg-purple-50"
                        : "border-gray-300 hover:border-gray-400"
                    }`}
                    onClick={() => toggleCategory(category)}
                  >
                    <div className="flex items-center space-x-2 mb-2">
                      <input
                        type="checkbox"
                        checked={formData.selectedCategories.includes(category)}
                        onChange={() => toggleCategory(category)}
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                        disabled={loading}
                        title={`Select ${category} category`}
                        aria-label={`Select ${category} category`}
                      />
                      <span className="font-medium text-gray-900">
                        {category}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {indicatorCount} indicators available
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 text-sm text-gray-500">
              Selected: {formData.selectedCategories.length} categories
            </div>
          </div>

          {/* Risk Indicators */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-red-100 rounded-lg">
                <DocumentMagnifyingGlassIcon className="h-6 w-6 text-red-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                Risk Indicators
              </h2>
            </div>

            {errors.indicators && (
              <p className="text-sm text-red-600 mb-4">{errors.indicators}</p>
            )}

            <p className="text-sm text-gray-600 mb-4">
              Select specific risk indicators to analyze. These indicators will
              guide our AI agents to scrape relevant data from websites, news
              sources, and compare with third-party platforms.
            </p>

            <div className="space-y-4">
              {CARTEL_CATEGORIES.map((category) => {
                const categoryIndicators = getIndicatorsForCategory(category);
                if (categoryIndicators.length === 0) return null;

                return (
                  <div
                    key={category}
                    className="border border-gray-200 rounded-lg"
                  >
                    <div
                      className={`p-4 bg-gray-50 border-b border-gray-200 ${
                        formData.selectedCategories.includes(category)
                          ? "bg-purple-50"
                          : ""
                      }`}
                    >
                      <h3 className="font-medium text-gray-900">{category}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {categoryIndicators.length} indicators available for AI
                        analysis
                      </p>
                    </div>

                    {formData.selectedCategories.includes(category) && (
                      <div className="p-4 space-y-3">
                        {categoryIndicators.map((indicator) => (
                          <div
                            key={indicator.id}
                            className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                              formData.selectedIndicators.includes(indicator.id)
                                ? "border-red-500 bg-red-50"
                                : "border-gray-300 hover:border-gray-400"
                            }`}
                            onClick={() => toggleIndicator(indicator.id)}
                          >
                            <div className="flex items-start space-x-3">
                              <input
                                type="checkbox"
                                checked={formData.selectedIndicators.includes(
                                  indicator.id
                                )}
                                onChange={() => toggleIndicator(indicator.id)}
                                className="mt-1 h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                                disabled={loading}
                                title={`Select indicator: ${indicator.indicator}`}
                                aria-label={`Select indicator: ${indicator.indicator}`}
                              />
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                  <h4 className="font-medium text-gray-900">
                                    {indicator.indicator}
                                  </h4>
                                  <span
                                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                      indicator.riskScore >= 5
                                        ? "bg-red-100 text-red-800"
                                        : indicator.riskScore >= 4
                                          ? "bg-orange-100 text-orange-800"
                                          : indicator.riskScore >= 3
                                            ? "bg-yellow-100 text-yellow-800"
                                            : "bg-green-100 text-green-800"
                                    }`}
                                  >
                                    Risk: {indicator.riskScore}/5
                                  </span>
                                </div>

                                <p className="text-sm text-gray-600 mb-3">
                                  {indicator.modusOperandi}
                                </p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                                  <div className="bg-blue-50 p-2 rounded">
                                    <p className="font-medium text-blue-800 mb-1">
                                      Evidence Types:
                                    </p>
                                    <p className="text-blue-700">
                                      {indicator.evidenceTypes}
                                    </p>
                                  </div>

                                  <div className="bg-green-50 p-2 rounded">
                                    <p className="font-medium text-green-800 mb-1">
                                      Sources to Monitor:
                                    </p>
                                    <p className="text-green-700">
                                      {indicator.topSources}
                                    </p>
                                  </div>

                                  <div className="bg-yellow-50 p-2 rounded">
                                    <p className="font-medium text-yellow-800 mb-1">
                                      OSINT Tools:
                                    </p>
                                    <p className="text-yellow-700">
                                      {indicator.openSourceTools}
                                    </p>
                                  </div>

                                  {indicator.apiTools && (
                                    <div className="bg-purple-50 p-2 rounded">
                                      <p className="font-medium text-purple-800 mb-1">
                                        API Tools:
                                      </p>
                                      <p className="text-purple-700">
                                        {indicator.apiTools}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Selected: {formData.selectedIndicators.length} indicators
              </div>
              <div className="flex items-center space-x-2 text-xs text-gray-400">
                <BeakerIcon className="h-4 w-4" />
                <span>AI-powered analysis will process these indicators</span>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={loading}
              leftIcon={<MagnifyingGlassIcon className="h-4 w-4" />}
              className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
            >
              Start Cartel Analysis
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewSearchPage;
