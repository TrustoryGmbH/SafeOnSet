
export type Language = 'en' | 'de' | 'ar';

export interface Message {
  id: string;
  date: string;
  text: string;
  contact: string;
  score: number;
  department?: string;
}

export interface ShootDay {
  day: number;
  date: string; // ISO string YYYY-MM-DD
}

export interface User {
  name: string;
  email: string;
  role: string;
}

export interface TeamMember {
  name: string;
  email: string;
  role: string;
}

export interface Production {
  id: string;
  name: string;
  coordinator: string;
  email: string;
  status: 'Active' | 'Pending' | 'Invited' | 'Finished';
  team?: TeamMember[];
  // New Registration Fields
  country?: string;
  periodStart?: string;
  periodEnd?: string;
  officeAddress?: string;
  billingAddress?: string;
  trustContactType?: 'themis' | 'internal' | 'none';
  trustContactInfo?: string;
}

export interface Translation {
  appSub: string;
  role: string;
  hMood: string;
  hTrend: string;
  hAccess: string;
  pdf: string;
  email: string;
  inbox: string;
  inboxTitle: string;
  mobTitle: string;
  mobQuest: string;
  happy: string;
  stress: string;
  submit: string;
  compTitle: string;
  compDesc: string;
  compContact: string;
  alert: string;
  dir: 'ltr' | 'rtl';
  day: string;
  today: string;
  explTitle100: string;
  explText100: string;
  explTitle90: string;
  explText90: string;
  explTitle80: string;
  explText80: string;
  imprBtn: string;
  imprTitle: string;
  imprText: string; // New
  privacyTitle: string; // New
  privacyText: string; // New
  termsTitle: string; // New
  termsText: string; // New
  votingClosed: string;
  votingClosedDesc: string;
  btnPositive: string;
  btnNegative: string;
  disclaimerText: string;
  selectDept: string;
  deptLabel: string;
  depts: {
    production: string;
    direction: string;
    camera: string;
    lighting: string;
    sound: string;
    art: string;
    costume: string;
    makeup: string;
    catering: string;
    cast: string;
    other: string;
  };
  adminLogin: string;
  otpSent: string;
  otpPlaceholder: string;
  sendCode: string;
  verifyCode: string;
  backToEmail: string;
  adminDash: string;
  addProd: string;
  prodName: string;
  prodCoord: string;
  prodEmail: string;
  invite: string;
  status: string;
  logout: string;
  thankYou: string;
  voteRegistered: string;
  alreadyVoted: string;
  alreadyVotedDesc: string;
  viewStats: string;
  prodStats: string;
  currentScore: string;
  recentIncidents: string;
  noIncidents: string;
  close: string;
  manage: string;
  manageProd: string;
  endProd: string;
  reactivateProd: string;
  prodEnded: string;
  teamMembers: string;
  addMember: string;
  roleLabel: string;
  nameLabel: string;
  emailLabel: string;
  add: string;
  maxMembers: string;
  generalInfo: string;
  edit: string;
  save: string;
  cancel: string;
  inviteSent: string;
  // Registration
  registerProd: string;
  regTitle: string;
  regDesc: string;
  countryLabel: string;
  selectCountry: string;
  otherCountryPlaceholder: string;
  period: string;
  periodStart: string;
  periodEnd: string;
  officeAddr: string;
  billingAddr: string;
  trustSection: string;
  optional: string;
  trustThemis: string;
  trustInternal: string;
  trustInternalName: string;
  regSuccess: string;
  regSuccessDesc: string;
  // New Tabs
  tabSchedule: string;
  tabDetails: string;
  // Landing Page
  landHero: string;
  landSub: string;
  landCTA: string;
  feat1Title: string;
  feat1Desc: string;
  feat1More: string;
  feat2Title: string;
  feat2Desc: string;
  feat2More: string;
  feat3Title: string;
  feat3Desc: string;
  feat3More: string;
  howTitle: string;
  how1: string;
  how2: string;
  how3: string;
  // Trust Badges
  trustBadge1: string;
  trustBadge2: string;
  // Trust Section
  trustSecTitle: string;
  trustSecSub: string;
  trustSecFeat1: string;
  trustSecFeat2: string;
  trustCardTitle: string;
  trustCardName: string;
  trustCardBtn: string;
}
