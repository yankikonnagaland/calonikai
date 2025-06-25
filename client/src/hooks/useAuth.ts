import { useQuery, useQueryClient } from "@tanstack/react-query";

export function useAuth() {
  const queryClient = useQueryClient();
  
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  const logout = async () => {
    try {
      // Check if admin mode and clear admin session
      if (localStorage.getItem('admin_mode') === 'true') {
        localStorage.removeItem('admin_mode');
        localStorage.removeItem('session_id');
        queryClient.clear();
        window.location.href = "/";
        return;
      }
      
      // Call logout API
      await fetch("/api/logout", {
        method: "GET",
        credentials: "include",
      });
      
      // Clear all query cache
      queryClient.clear();
      
      // Force redirect to home page
      window.location.href = "/";
    } catch (error) {
      console.error("Logout error:", error);
      // Force redirect even if logout fails
      queryClient.clear();
      window.location.href = "/";
    }
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    logout,
  };
}