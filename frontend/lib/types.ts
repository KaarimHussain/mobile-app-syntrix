export type Role = 'owner' | 'employee' | 'manager';

export interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  active: boolean;
  createdAt: string;
}

export type PropertyStatus = 'available' | 'rented' | 'sold';

export interface Property {
  _id: string;
  title: string;
  location: string;
  type: 'rent' | 'sale';
  askingPrice: number;
  finalPrice?: number;
  status: PropertyStatus;
  images: string[];
  assignedEmployeeId?: string;
  createdAt: string;
  updatedAt: string;
}

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface Deal {
  _id: string;
  propertyId: string;
  employeeId: string;
  source: 'direct_owner' | 'agent';
  agentName?: string;
  negotiatedPrice: number;
  finalPrice: number;
  commissionRate: number; // percent
  commissionAmount: number;
  paymentStatus: 'pending' | 'partial' | 'paid';
  approvalStatus: ApprovalStatus;
  createdAt: string;
}

export interface Task {
  _id: string;
  title: string;
  type: 'visit' | 'follow_up' | 'other';
  assignedTo: string;
  assignedBy: string;
  propertyId?: string;
  dueDate: string;
  status: 'pending' | 'in_progress' | 'completed';
  createdAt: string;
}

export interface AppNotification {
  _id: string;
  userId: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
}
