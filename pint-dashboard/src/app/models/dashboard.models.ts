export interface PubOwner {
  id: string;
  email: string;
  businessName: string;
  contactName: string;
  phoneNumber?: string;
  isVerified: boolean;
  pubId?: string;
  pub?: Pub;
}

export interface Pub {
  id: string;
  name: string;
  address?: string;
  description?: string;
  phoneNumber?: string;
  openingHours?: any;
  photoUrls?: string[];
  location?: any;
  partnershipTier: 'none' | 'basic' | 'premium';
}

export interface PintSession {
  id: string;
  pubName: string;
  eta: string;
  location: any;
  isPrivate: boolean;
  isFeatured: boolean;
  pubId?: string;
  initiator: {
    id: string;
    displayName: string;
    profilePictureUrl?: string;
  };
  attendees: Array<{
    id: string;
    displayName: string;
    profilePictureUrl?: string;
  }>;
  createdAt: string;
}

export interface PubAnalytics {
  sessionsThisMonth: number;
  attendeesThisMonth: number;
  sessionsThisWeek: number;
}

export interface AuthResponse {
  token: string;
  pubOwner: PubOwner;
}

export interface RegisterRequest {
  email: string;
  password: string;
  businessName: string;
  contactName: string;
  phoneNumber?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}