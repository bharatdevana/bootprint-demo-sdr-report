import { classifyClikWorksFit, type FitCriterion } from "@/lib/fit-classifier";

export type AccountBrief = {
  slug: string;
  website: string;
  companyName: string;
  researchedOn: string;
  logoUrl: string;
  logoTone?: "light" | "dark";
  description: string;
  score: number;
  totalChecks: number;
  fitLabel: string;
  fitSummary: string;
  segment: string;
  employees: string;
  headquarters: string;
  operatingSince: string;
  businessModel: string;
  recommendation: string;
  whatTheySell: string;
  services: string[];
  whoBuys: string;
  bestSegment: string;
  likelyBuyer: string;
  customerEvidence: Array<{ name: string; evidence: string; relevance: string; url: string }>;
  decisionMakers: Array<{
    name: string;
    title: string;
    relevance: string;
    linkedin: string;
    profileUrl: string;
    confidence: string;
    confidenceTone: "confirmed" | "probable" | "unresolved";
    initials: string;
    evidence: string;
  }>;
  fitChecks: FitCriterion[];
  handoff: { leadWith: string; ask: string; doNotAssume: string };
  sources: Array<{ name: string; detail: string; status: string; url: string }>;
};

const specialtyBoxFit = classifyClikWorksFit({
  isB2B: true,
  employeeRange: { minimum: 2, maximum: 10 },
  operatingYearsMinimum: 64,
  repeatPurchaseModel: "confirmed",
  repeatPurchaseNote: "Inventory and restocking programs",
  outboundOwner: "unknown",
  outboundOwnerNote: "Not established publicly",
  replyOwner: "likely",
  replyOwnerNote: "Jillian is likely; verify assignment",
});

const joshPackagingFit = classifyClikWorksFit({
  isB2B: true,
  employeeRange: { minimum: 51, maximum: 200 },
  operatingYearsMinimum: 35,
  repeatPurchaseModel: "consumable",
  repeatPurchaseNote: "Packaging is consumed and reordered",
  outboundOwner: "unknown",
  outboundOwnerNote: "Sales team exists; ownership unknown",
  replyOwner: "likely",
  replyOwnerNote: "Shlomo is likely; verify assignment",
});

export const specialtyBoxBrief: AccountBrief = {
  slug: "specialty-box", website: "https://specialtybox.com", companyName: "Specialty Box", researchedOn: "September 19, 2026",
  logoUrl: "https://cms.specialtybox.com/wp-content/uploads/2025/07/logo.svg",
  description: "Fourth-generation custom-packaging company serving foodservice, retail, hospitality and multi-location brands.",
  score: specialtyBoxFit.score, totalChecks: specialtyBoxFit.totalChecks, fitLabel: specialtyBoxFit.label, fitSummary: specialtyBoxFit.summary,
  segment: "SMB", employees: "2–10 public", headquarters: "Albany, NY", operatingSince: "1962", businessModel: "B2B packaging",
  recommendation: "Verify team size, outbound ownership and reply handling before outreach.",
  whatTheySell: "Custom boxes, printed bags, food packaging, branded merchandise and inventory programs. Specialty Box combines design and sourcing with storage, restocking and distribution.",
  services: ["Custom packaging", "Food packaging", "Inventory management", "Merch & apparel"],
  whoBuys: "Restaurants, franchise groups, specialty food businesses and retail brands. Case studies show both national multi-location programs and smaller relationship-led accounts.",
  bestSegment: "Multi-location foodservice and retail brands", likelyBuyer: "Operations, procurement, ownership or brand leadership",
  customerEvidence: [
    { name: "Cole Haan", evidence: "Official case study", relevance: "Multi-location retail", url: "https://specialtybox.com/case-study/cole-haan/" },
    { name: "Melting Pot", evidence: "Official case study", relevance: "Restaurant franchise", url: "https://specialtybox.com/case-study/melting-pot/" },
    { name: "Gideon's Bakehouse", evidence: "Official case study", relevance: "Foodservice and retail", url: "https://specialtybox.com/case-study/gideons-bakehouse/" },
  ],
  decisionMakers: [
    { name: "Joshua Fialkoff", title: "CEO", relevance: "Primary commercial decision-maker and growth owner", linkedin: "linkedin.com/in/joshuafialkoff", profileUrl: "https://www.linkedin.com/in/joshuafialkoff", confidence: "Confirmed", confidenceTone: "confirmed", initials: "JF", evidence: "Company association confirmed; public title sources conflict" },
    { name: "Jillian Roan", title: "National Account Executive", relevance: "Commercial contact and likely reply owner", linkedin: "linkedin.com/in/jillian-roan-49350857", profileUrl: "https://www.linkedin.com/in/jillian-roan-49350857", confidence: "Confirmed", confidenceTone: "confirmed", initials: "JR", evidence: "Public profile plus existing client record" },
    { name: "Eric Fialkoff", title: "Commercial leadership", relevance: "Packaging and foodservice relationship expertise", linkedin: "linkedin.com/in/eric-fialkoff-8032b7b", profileUrl: "https://www.linkedin.com/in/eric-fialkoff-8032b7b", confidence: "Probable match", confidenceTone: "probable", initials: "EF", evidence: "Company association confirmed; current title unresolved" },
  ],
  fitChecks: specialtyBoxFit.criteria,
  handoff: { leadWith: "The contrast between a sixty-year relationship business and a sophisticated repeat-order packaging program.", ask: "How are new multi-location foodservice and retail accounts identified today, and who owns follow-up when interest appears?", doNotAssume: "That Specialty Box lacks outbound infrastructure, a CRM or buying intent. None is established by the public record." },
  sources: [
    { name: "Specialty Box website", detail: "Products, services and operating model", status: "Reviewed", url: "https://specialtybox.com/" },
    { name: "About Specialty Box", detail: "Family history and company timeline", status: "Reviewed", url: "https://specialtybox.com/about-us/" },
    { name: "Specialty Box LinkedIn", detail: "Headquarters, size band and founding year", status: "Reviewed", url: "https://www.linkedin.com/company/specialty-box" },
    { name: "Official case studies", detail: "Named customer and delivery evidence", status: "Reviewed", url: "https://specialtybox.com/news/" },
  ],
};

export const joshPackagingBrief: AccountBrief = {
  slug: "josh-packaging", website: "https://www.joshpackaging.com/", companyName: "Josh Packaging, Inc.", researchedOn: "September 19, 2026",
  logoUrl: "https://images.squarespace-cdn.com/content/v1/67080dbf5601dd58850dd225/0fda2094-4a22-4586-8d61-2befbeed111d/Josh+Pkg+Logo+-+White+No+Gradient.png", logoTone: "dark",
  description: "Family-owned flexible-packaging manufacturer serving food, agriculture, retail and consumer-product markets from Hauppauge, New York.",
  score: joshPackagingFit.score, totalChecks: joshPackagingFit.totalChecks, fitLabel: joshPackagingFit.label, fitSummary: joshPackagingFit.summary,
  segment: "Mid-market", employees: "51–200 public", headquarters: "Hauppauge, NY", operatingSince: "35+ years", businessModel: "B2B manufacturing",
  recommendation: "Verify exact headcount, outbound ownership and reply routing before outreach.",
  whatTheySell: "Custom flexible packaging, including bags, pouches, roll stock and lidding film. Josh Packaging also provides flexographic printing, solventless lamination, converting, design and specialty coatings.",
  services: ["Flexible packaging", "Pouches & roll stock", "Printing & lamination", "Converting & design"],
  whoBuys: "Food manufacturers, distributors and brands across agriculture, bakery, frozen foods, snacks, produce, supplements, coffee, pet food and other packaged-goods categories.",
  bestSegment: "Food manufacturers and distributors with recurring packaging demand", likelyBuyer: "Sales, operations, procurement, ownership or packaging leadership",
  customerEvidence: [
    { name: "Costco", evidence: "Logo on official customer page", relevance: "Relationship details not disclosed", url: "https://www.joshpackaging.com/customers" },
    { name: "Trader Joe's", evidence: "Logo on official customer page", relevance: "Relationship details not disclosed", url: "https://www.joshpackaging.com/customers" },
    { name: "Walmart", evidence: "Logo on official customer page", relevance: "Relationship details not disclosed", url: "https://www.joshpackaging.com/customers" },
  ],
  decisionMakers: [
    { name: "Abe Golshirazian", title: "President and Co-Founder", relevance: "Executive owner for company-wide commercial decisions", linkedin: "linkedin.com/in/abe-golshirazian-60830268", profileUrl: "https://www.linkedin.com/in/abe-golshirazian-60830268", confidence: "Confirmed", confidenceTone: "confirmed", initials: "AG", evidence: "Official leadership page and company LinkedIn evidence" },
    { name: "Shlomo Golshirazian", title: "Director of Sales", relevance: "Primary commercial contact and likely reply owner", linkedin: "linkedin.com/in/shlomo-golshirazian", profileUrl: "https://www.linkedin.com/in/shlomo-golshirazian", confidence: "Confirmed", confidenceTone: "confirmed", initials: "SG", evidence: "Official leadership page and current sales activity" },
    { name: "Aharon Golshirazian", title: "Director of Operations", relevance: "Operations contact for manufacturing and supply continuity", linkedin: "linkedin.com/in/aharon-golshirazian-5473261b3", profileUrl: "https://www.linkedin.com/in/aharon-golshirazian-5473261b3", confidence: "Confirmed", confidenceTone: "confirmed", initials: "AG", evidence: "Official title; an older purchasing title is treated as stale" },
  ],
  fitChecks: joshPackagingFit.criteria,
  handoff: { leadWith: "Their in-house flexible-packaging operation and broad food-market coverage, without treating customer logos as detailed case studies.", ask: "How does the sales team prioritize new accounts across food categories, and who owns follow-up once a packaging opportunity becomes qualified?", doNotAssume: "That Josh Packaging lacks outbound infrastructure, a CRM or active demand. The public record does not establish those conditions." },
  sources: [
    { name: "Josh Packaging website", detail: "Products, markets and operating model", status: "Reviewed", url: "https://www.joshpackaging.com/" },
    { name: "About Josh Packaging", detail: "Company history and leadership team", status: "Reviewed", url: "https://www.joshpackaging.com/about" },
    { name: "Official customer page", detail: "Company-stated customer-logo evidence", status: "Reviewed", url: "https://www.joshpackaging.com/customers" },
    { name: "Printing and lamination", detail: "Manufacturing capability evidence", status: "Reviewed", url: "https://www.joshpackaging.com/printing-lamination" },
    { name: "Josh Packaging LinkedIn", detail: "Employee band, headquarters and founding claim", status: "Reviewed", url: "https://www.linkedin.com/company/josh-packaging-inc" },
  ],
};
