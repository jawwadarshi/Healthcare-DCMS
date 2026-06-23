/*import { useMutation } from '@tanstack/react-query';
import { authService, type LoginRequest } from '../services/auth.service';
import { useAuth as useAuthContext } from '../context/AuthContext';

export const useLogin = () => {
  const { login: contextLogin } = useAuthContext();

  return useMutation({
    mutationFn: (credentials: LoginRequest) => authService.login(credentials),
    onSuccess: (data) => {

      contextLogin(data.token, data.user);
    },
  });
};

export const useLogout = () => {
  const { logout: contextLogout } = useAuthContext();

  return useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      contextLogout();
    },
  });
}; */
import { useMutation } from '@tanstack/react-query';
import { authService, type LoginRequest } from '../services/auth.service';
import { useAuth as useAuthContext } from '../context/AuthContext';

export const useLogin = () => {
  const { login: contextLogin } = useAuthContext();

  return useMutation({
    mutationFn: (credentials: LoginRequest) => authService.login(credentials),
    onSuccess: (response: any) => {
      /**
       * BACKEND DATA CHECK:
       * Most of your project uses a standard ApiResponse structure: { success: true, data: { ... } }
       * We check for 'response.data.token' first, then fallback to 'response.token'
       */
      const token = response?.data?.token || response?.token;
      const user = response?.data?.user || response?.user;

      if (token && user) {
        // This calls your AuthContext.login, which handles localStorage.setItem('authToken')
        contextLogin(token, user);
      } else {
        console.error(
          "Auth Error: Token or User missing in backend response. Received:",
          response
        );
      }
    },
  });
};

export const useLogout = () => {
  const { logout: contextLogout } = useAuthContext();

  return useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      contextLogout();
    },
  });
};
