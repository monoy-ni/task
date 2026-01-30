import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key is missing. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env file');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface UserProfile {
  id: string;
  email: string;
  tier: 'free' | 'monthly' | 'yearly';
  daily_quota: number;
  daily_used: number;
  last_reset_date: string;
  total_purchased: number;
  total_purchased_used: number;
  subscription_expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionPurchase {
  id: string;
  user_id: string;
  type: 'monthly' | 'yearly' | 'pack_20' | 'pack_100';
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed';
  payment_method: 'wechat' | 'alipay';
  created_at: string;
}

export interface UsageLog {
  id: string;
  user_id: string;
  action: string;
  tokens_used: number;
  created_at: string;
}

// Subscription tier configs
export const TIER_CONFIGS = {
  free: {
    name: '免费试用',
    dailyQuota: 0,
    purchaseDiscount: 1,
    description: '注册送10次，永久有效',
  },
  monthly: {
    name: '月卡',
    dailyQuota: 10,
    purchaseDiscount: 0.8,
    description: '每日10次 + 购买8折',
    price: 29,
  },
  yearly: {
    name: '年卡',
    dailyQuota: 30,
    purchaseDiscount: 0.5,
    description: '每日30次 + 购买5折',
    price: 298,
  },
} as const;

export const PACK_CONFIGS = {
  pack_20: {
    name: '20次包',
    uses: 20,
    price: 9.9,
    description: '永不过期',
  },
  pack_100: {
    name: '100次包',
    uses: 100,
    price: 39,
    description: '永不过期，性价比',
  },
} as const;
