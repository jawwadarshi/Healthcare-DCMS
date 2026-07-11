import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLogin } from '../hooks/useAuth';
import { useAuth } from '../context/AuthContext';
import { usePreWarm } from '../hooks/usePreWarm'; // Added usePreWarm import
import { Button, Input, Card, Loader } from '../components';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginPage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const loginMutation = useLogin();

  // Track backend warmth status
  const isServerAwake = usePreWarm();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      const redirectPath = getDashboardPath(user.role);
      navigate(redirectPath);
    }
  }, [isAuthenticated, user, navigate]);

  const getDashboardPath = (role: string): string => {
    switch (role) {
      case 'admin':
        return '/dashboard/users';
      case 'doctor':
        return '/dashboard/my-appointments';
      case 'staff':
        return '/dashboard/patients';
      case 'patient':
        return '/dashboard';
      default:
        return '/dashboard';
    }
  };

  const onSubmit = async (data: LoginFormData) => {
    try {
      await loginMutation.mutateAsync(data);
      // Redirect will happen via useEffect
    } catch {
      // Error is handled by mutation
    }
  };

  if (loginMutation.isPending) {
    return <Loader fullScreen />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-2xl">DC</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Dental Clinic</h1>
          <p className="text-gray-600 mt-2">Management System</p>
        </div>

        {/* Login Card */}
        <Card className="shadow-xl">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Sign In</h2>

          {/* Error Message */}
          {loginMutation.isError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">
                {loginMutation.error instanceof Error
                  ? loginMutation.error.message
                  : 'An error occurred during login. Please try again.'}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email Input */}
            <Input
              label="Email Address"
              type="email"
              placeholder="admin@dentalclinic.com"
              error={errors.email?.message}
              disabled={loginMutation.isPending}
              {...register('email')}
            />

            {/* Password Input */}
            <Input
              label="Password"
              type="password"
              placeholder="Enter your password"
              error={errors.password?.message}
              disabled={loginMutation.isPending}
              {...register('password')}
            />

            {/* Submit Button with Smart Sleep Protection */}
            <Button
              type="submit"
              className={`w-full mt-6 transition duration-200 ${!isServerAwake ? 'bg-orange-500 hover:bg-orange-600 text-white' : ''
                }`}
              isLoading={loginMutation.isPending}
              disabled={loginMutation.isPending}
            >
              {isServerAwake ? 'Sign In' : 'Connecting To Secure Server...'}
            </Button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm font-semibold text-gray-900 mb-2">Demo Credentials:</p>
            <div className="space-y-1 text-xs text-gray-700">
              <p><strong>Admin:</strong> admin@clinic.com / password123</p>
              <p><strong>Doctor:</strong> doctor@clinic.com / password123</p>
              <p><strong>Staff:</strong> staff@clinic.com / password123</p>
            </div>
          </div>
        </Card>

        {/* Footer */}
        <div className="mt-6 text-center text-gray-600 text-sm">
          <p></p>
        </div>
      </div>
    </div>
  );
};