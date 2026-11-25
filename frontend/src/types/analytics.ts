export type AnalyticsDateRangeKey = 'today' | 'yesterday' | '7d' | '30d' | '90d' | 'custom';

export interface AnalyticsDateRange {
  type: AnalyticsDateRangeKey;
  startDate: string;
  endDate: string;
  label: string;
}

export interface AnalyticsStatus {
  configured: boolean;
  connected: boolean;
  propertyId: string;
  clientEmail?: string;
  mode: 'live_ga4' | 'hybrid_showroom';
  lastSynced: string;
  error?: string;
}

export interface AnalyticsOverview {
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  returningUsers: number;
  totalSessions: number;
  pageViews: number;
  engagementRate: number; // Percentage, e.g. 68.4
  avgEngagementTime: string; // Formatted e.g. "2m 34s"
  avgEngagementTimeSeconds: number;
  bounceRate: number; // Percentage
  userChangePercent: number;
  sessionChangePercent: number;
  pageViewChangePercent: number;
}

export interface RealtimeAnalytics {
  activeUsersLast30Min: number;
  topActivePages: Array<{
    path: string;
    title: string;
    activeUsers: number;
  }>;
  activeDevices: {
    mobile: number;
    desktop: number;
    tablet: number;
  };
  activeCities: Array<{
    city: string;
    count: number;
  }>;
}

export interface TrafficChannelItem {
  channel: string;
  sessions: number;
  users: number;
  percentage: number;
}

export interface TrafficSourceItem {
  source: string;
  medium: string;
  sessions: number;
  users: number;
  engagementRate: number;
}

export interface TrafficCampaignItem {
  campaign: string;
  clicks: number;
  conversions: number;
}

export interface TrafficAnalytics {
  channels: TrafficChannelItem[];
  sources: TrafficSourceItem[];
  campaigns: TrafficCampaignItem[];
}

export interface CarViewAnalyticsItem {
  id: string;
  title: string;
  path: string;
  brand: string;
  priceInr: number;
  views: number;
  uniqueVisitors: number;
  enquiries: number;
  conversionRate: number;
  thumbnail?: string;
}

export interface CarSearchAnalyticsItem {
  term: string;
  count: number;
  filters?: string;
}

export interface CarEnquiryClickItem {
  carId: string;
  carTitle: string;
  callClicks: number;
  whatsappClicks: number;
  formSubmissions: number;
}

export interface CarAnalytics {
  mostViewed: CarViewAnalyticsItem[];
  searches: CarSearchAnalyticsItem[];
  enquiryClicks: CarEnquiryClickItem[];
}

export interface VisitorCountryItem {
  country: string;
  users: number;
  percentage: number;
  flag?: string;
}

export interface VisitorCityItem {
  city: string;
  country: string;
  users: number;
}

export interface VisitorDeviceItem {
  device: string;
  users: number;
  percentage: number;
}

export interface VisitorBrowserItem {
  browser: string;
  users: number;
  percentage: number;
}

export interface VisitorOsItem {
  os: string;
  users: number;
  percentage: number;
}

export interface VisitorAnalytics {
  countries: VisitorCountryItem[];
  cities: VisitorCityItem[];
  devices: VisitorDeviceItem[];
  browsers: VisitorBrowserItem[];
  os: VisitorOsItem[];
  userType: {
    newUsers: number;
    returningUsers: number;
    newRatio: number;
  };
}

export interface EnquiryAnalytics {
  totalSubmissions: number;
  callClicks: number;
  whatsappClicks: number;
  totalLeads: number;
  conversionRate: number;
  funnel: {
    totalVisitors: number;
    vehicleViews: number;
    interactions: number;
    submissions: number;
  };
}

export interface AnalyticsTimelineItem {
  date: string;
  label: string;
  users: number;
  sessions: number;
  pageViews: number;
  enquiries: number;
}

export interface AnalyticsDashboardResponse {
  dateRange: AnalyticsDateRange;
  status: AnalyticsStatus;
  overview: AnalyticsOverview;
  realtime: RealtimeAnalytics;
  timeline: AnalyticsTimelineItem[];
  traffic: TrafficAnalytics;
  cars: CarAnalytics;
  visitors: VisitorAnalytics;
  enquiries: EnquiryAnalytics;
}
