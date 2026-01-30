import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, UserProfile } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, token: string) => Promise<void>;
  signOut: () => Promise<void>;
  sendOtp: (email: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
  hasQuota: () => boolean;
  useQuota: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user profile from database
  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        // If profile doesn't exist, create it
        if (error.code === 'PGRST116') {
          const { data: newUser, error: createError } = await supabase
            .from('profiles')
            .insert({
              id: userId,
              email: user?.email || '',
              tier: 'free',
              daily_quota: 0,
              daily_used: 0,
              last_reset_date: new Date().toISOString().split('T')[0],
              total_purchased: 10, // Free trial: 10 uses
              total_purchased_used: 0,
            })
            .select()
            .single();

          if (!createError && newUser) {
            setUserProfile(newUser);
            return;
          }
        }
        console.error('Error fetching profile:', error);
        return;
      }

      // Check if we need to reset daily quota
      const today = new Date().toISOString().split('T')[0];
      if (data?.last_reset_date !== today && data.tier !== 'free') {
        const { data: updated } = await supabase
          .from('profiles')
          .update({
            daily_used: 0,
            last_reset_date: today,
          })
          .eq('id', userId)
          .select()
          .single();

        if (updated) {
          setUserProfile(updated);
        } else {
          setUserProfile(data);
        }
      } else {
        setUserProfile(data);
      }
    } catch (err) {
      console.error('Error in fetchProfile:', err);
    }
  };

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) throw error;

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          await fetchProfile(session.user.id);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setUserProfile(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const sendOtp = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
      },
    });

    if (error) {
      throw error;
    }
  };

  const signIn = async (email: string, token: string) => {
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });

    if (error) {
      throw error;
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUserProfile(null);
    setSession(null);
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  const hasQuota = (): boolean => {
    if (!userProfile) return false;

    // Check daily quota (for subscription tiers)
    if (userProfile.tier !== 'free') {
      const remainingDaily = userProfile.daily_quota - userProfile.daily_used;
      if (remainingDaily > 0) return true;
    }

    // Check purchased quota
    const remainingPurchased = userProfile.total_purchased - userProfile.total_purchased_used;
    return remainingPurchased > 0;
  };

  const useQuota = async (): Promise<boolean> => {
    if (!userProfile || !user) return false;

    // Try to use daily quota first
    if (userProfile.tier !== 'free' && userProfile.daily_used < userProfile.daily_quota) {
      const { error } = await supabase
        .from('profiles')
        .update({ daily_used: userProfile.daily_used + 1 })
        .eq('id', user.id);

      if (!error) {
        await refreshProfile();
        return true;
      }
    }

    // Try to use purchased quota
    const remainingPurchased = userProfile.total_purchased - userProfile.total_purchased_used;
    if (remainingPurchased > 0) {
      const { error } = await supabase
        .from('profiles')
        .update({ total_purchased_used: userProfile.total_purchased_used + 1 })
        .eq('id', user.id);

      if (!error) {
        await refreshProfile();
        return true;
      }
    }

    return false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        session,
        loading,
        signIn,
        signOut,
        sendOtp,
        refreshProfile,
        hasQuota,
        useQuota,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
