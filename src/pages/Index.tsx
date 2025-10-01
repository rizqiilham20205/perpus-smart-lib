import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { AuthForm } from "@/components/AuthForm";
import { Layout } from "@/components/Layout";
import { Dashboard } from "@/components/Dashboard";
import { BooksManager } from "@/components/BooksManager";
import { MembersManager } from "@/components/MembersManager";
import { TransactionsManager } from "@/components/TransactionsManager";

const Index = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Memuat...</p>
      </div>
    );
  }

  if (!session) {
    return <AuthForm />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard />;
      case "books":
        return <BooksManager />;
      case "members":
        return <MembersManager />;
      case "transactions":
        return <TransactionsManager />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderContent()}
    </Layout>
  );
};

export default Index;
