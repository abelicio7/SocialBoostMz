import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Zap } from "lucide-react";

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the session from the URL hash (OAuth callback)
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error("Auth callback error:", error);
          navigate("/auth");
          return;
        }

        if (session) {
          // Check if user is admin
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', session.user.id)
            .eq('role', 'admin')
            .maybeSingle();

          if (roleData) {
            navigate("/admin");
          } else {
            navigate("/dashboard");
          }
        } else {
          navigate("/auth");
        }
      } catch (error) {
        console.error("Auth callback error:", error);
        navigate("/auth");
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 rounded-xl gradient-gold mx-auto mb-6 flex items-center justify-center animate-pulse">
          <Zap className="w-8 h-8 text-primary-foreground" />
        </div>
        <h2 className="font-display text-xl font-semibold mb-2">A processar...</h2>
        <p className="text-muted-foreground">Por favor aguarde um momento</p>
      </div>
    </div>
  );
};

export default AuthCallback;
