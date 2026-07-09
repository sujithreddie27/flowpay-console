import { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Breadcrumbs, Button, Input, Card, Modal, ModalHeader, ModalBody, ModalFooter, Badge, useToast, useThemeContext } from '@/components';
import {
  Cog6ToothIcon,
  UserCircleIcon,
  ShieldCheckIcon,
  BellIcon,
  CreditCardIcon,
  BanknotesIcon,
  TrashIcon,
  StarIcon,
  PlusIcon,
  EyeIcon,
  EyeSlashIcon,
  SunIcon,
  MoonIcon,
  ComputerDesktopIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { cn } from '@/utils';
import {
  useProfile,
  useUpdateProfile,
  useChangePassword,
  useNotificationPreferences,
  useUpdateNotificationPreferences,
  useAddPaymentMethod,
  useRemovePaymentMethod,
  useSetDefaultPaymentMethod,
} from '@/hooks/useSettings';
import { usePaymentMethods } from '@/hooks/usePayments';
import { useAuth } from '@/hooks/useAuth';
import type { PaymentMethodInfo, NotificationPreferences } from '@/types';

// ============================================================================
// Validation Schemas
// ============================================================================

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  phone: z.string().min(10, 'Phone number must be at least 10 digits').max(15),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Must contain at least one special character'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

const cardSchema = z.object({
  cardNumber: z
    .string()
    .min(16, 'Card number must be 16 digits')
    .max(19, 'Invalid card number')
    .regex(/^[\d\s]+$/, 'Invalid card number'),
  expiryMonth: z.number().min(1).max(12),
  expiryYear: z.number().min(new Date().getFullYear()),
  cvv: z.string().min(3, 'CVV must be 3-4 digits').max(4),
});

const bankSchema = z.object({
  bankAccountNumber: z.string().min(8, 'Account number must be at least 8 digits'),
  bankRoutingNumber: z.string().min(9, 'Routing number must be 9 digits').max(11),
});

const upiSchema = z.object({
  upiId: z.string().min(3, 'Invalid UPI ID').regex(/^[\w.-]+@[\w]+$/, 'Invalid UPI ID format'),
});

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

// ============================================================================
// Tab Navigation
// ============================================================================

type SettingsTab = 'profile' | 'security' | 'notifications' | 'payment-methods' | 'limits' | 'appearance';

const tabs: { id: SettingsTab; label: string; icon: typeof UserCircleIcon }[] = [
  { id: 'profile', label: 'Profile', icon: UserCircleIcon },
  { id: 'security', label: 'Security', icon: ShieldCheckIcon },
  { id: 'notifications', label: 'Notifications', icon: BellIcon },
  { id: 'payment-methods', label: 'Payment Methods', icon: CreditCardIcon },
  { id: 'limits', label: 'Transaction Limits', icon: BanknotesIcon },
  { id: 'appearance', label: 'Appearance', icon: SunIcon },
];

// ============================================================================
// Profile Settings Section
// ============================================================================

const ProfileSection = () => {
  const { user } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const { success, error: showError } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    values: {
      name: profile?.name || user?.name || '',
      phone: profile?.phone || user?.phone || '',
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    try {
      await updateProfile.mutateAsync(data);
      success('Profile updated', 'Your profile has been updated successfully.');
      reset(data);
    } catch {
      showError('Update failed', 'Failed to update profile. Please try again.');
    }
  };

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-secondary-900 dark:text-white">Profile Settings</h2>
        <p className="mt-1 text-sm text-secondary-500 dark:text-secondary-400">
          Update your personal information and contact details.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Input
            label="Full Name"
            {...register('name')}
            error={errors.name?.message}
            placeholder="John Doe"
          />
          <Input
            label="Email Address"
            value={profile?.email || user?.email || ''}
            disabled
            helperText="Email cannot be changed"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Input
            label="Phone Number"
            {...register('phone')}
            error={errors.phone?.message}
            placeholder="+1234567890"
          />
          <Input
            label="Role"
            value={profile?.role || user?.role || ''}
            disabled
            helperText="Contact admin to change role"
          />
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Button
            type="submit"
            isLoading={updateProfile.isPending}
            disabled={!isDirty}
          >
            Save Changes
          </Button>
          {isDirty && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => reset()}
            >
              Cancel
            </Button>
          )}
        </div>
      </form>
    </div>
  );
};

const ProfileSkeleton = () => (
  <div className="space-y-6 animate-pulse">
    <div className="h-6 bg-secondary-200 dark:bg-secondary-700 rounded w-40" />
    <div className="h-4 bg-secondary-100 dark:bg-secondary-800 rounded w-64" />
    <div className="grid grid-cols-2 gap-5">
      <div className="h-10 bg-secondary-100 dark:bg-secondary-800 rounded" />
      <div className="h-10 bg-secondary-100 dark:bg-secondary-800 rounded" />
    </div>
    <div className="grid grid-cols-2 gap-5">
      <div className="h-10 bg-secondary-100 dark:bg-secondary-800 rounded" />
      <div className="h-10 bg-secondary-100 dark:bg-secondary-800 rounded" />
    </div>
  </div>
);

// ============================================================================
// Security Settings Section
// ============================================================================

const SecuritySection = () => {
  const changePassword = useChangePassword();
  const { success, error: showError } = useToast();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  const onSubmit = async (data: PasswordFormData) => {
    try {
      await changePassword.mutateAsync(data);
      success('Password changed', 'Your password has been updated successfully.');
      reset();
    } catch {
      showError('Password change failed', 'Check your current password and try again.');
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-secondary-900 dark:text-white">Security Settings</h2>
        <p className="mt-1 text-sm text-secondary-500 dark:text-secondary-400">
          Manage your password and two-factor authentication.
        </p>
      </div>

      {/* Change Password */}
      <Card padding="md">
        <h3 className="text-base font-medium text-secondary-900 dark:text-white mb-4">Change Password</h3>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="relative">
            <Input
              label="Current Password"
              type={showCurrentPassword ? 'text' : 'password'}
              {...register('currentPassword')}
              error={errors.currentPassword?.message}
              placeholder="Enter current password"
            />
            <button
              type="button"
              className="absolute right-3 top-8 text-secondary-400 dark:text-secondary-500 hover:text-secondary-600 dark:text-secondary-300"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
            >
              {showCurrentPassword ? (
                <EyeSlashIcon className="h-5 w-5" />
              ) : (
                <EyeIcon className="h-5 w-5" />
              )}
            </button>
          </div>

          <div className="relative">
            <Input
              label="New Password"
              type={showNewPassword ? 'text' : 'password'}
              {...register('newPassword')}
              error={errors.newPassword?.message}
              placeholder="Enter new password"
            />
            <button
              type="button"
              className="absolute right-3 top-8 text-secondary-400 dark:text-secondary-500 hover:text-secondary-600 dark:text-secondary-300"
              onClick={() => setShowNewPassword(!showNewPassword)}
            >
              {showNewPassword ? (
                <EyeSlashIcon className="h-5 w-5" />
              ) : (
                <EyeIcon className="h-5 w-5" />
              )}
            </button>
          </div>

          <Input
            label="Confirm New Password"
            type="password"
            {...register('confirmPassword')}
            error={errors.confirmPassword?.message}
            placeholder="Confirm new password"
          />

          <div className="text-xs text-secondary-500 dark:text-secondary-400 space-y-1">
            <p>Password requirements:</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>Minimum 8 characters</li>
              <li>At least one uppercase and one lowercase letter</li>
              <li>At least one number and one special character</li>
            </ul>
          </div>

          <Button type="submit" isLoading={changePassword.isPending}>
            Update Password
          </Button>
        </form>
      </Card>

      {/* Two-Factor Authentication */}
      <Card padding="md">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-medium text-secondary-900 dark:text-white">
              Two-Factor Authentication
            </h3>
            <p className="mt-1 text-sm text-secondary-500 dark:text-secondary-400">
              Add an extra layer of security to your account using an authenticator app.
            </p>
          </div>
          <Badge variant="warning">Coming Soon</Badge>
        </div>
        <div className="mt-4">
          <Button variant="outline" disabled>
            Set Up 2FA
          </Button>
        </div>
      </Card>

      {/* Active Sessions */}
      <Card padding="md">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-medium text-secondary-900 dark:text-white">Active Sessions</h3>
            <p className="mt-1 text-sm text-secondary-500 dark:text-secondary-400">
              Manage your active sessions across devices.
            </p>
          </div>
          <Badge variant="info">Current Session</Badge>
        </div>
        <div className="mt-4 p-3 bg-secondary-50 dark:bg-secondary-800 rounded-lg border border-secondary-100 dark:border-secondary-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-secondary-900 dark:text-white">This Device</p>
              <p className="text-xs text-secondary-500 dark:text-secondary-400">Active now</p>
            </div>
            <div className="w-2 h-2 rounded-full bg-green-500" />
          </div>
        </div>
      </Card>
    </div>
  );
};

// ============================================================================
// Notification Preferences Section
// ============================================================================

const NotificationsSection = () => {
  const { data: preferences, isLoading } = useNotificationPreferences();
  const updatePreferences = useUpdateNotificationPreferences();
  const { success, error: showError } = useToast();

  const handleToggle = useCallback(
    async (
      channel: keyof NotificationPreferences,
      key: string,
      value: boolean
    ) => {
      if (!preferences) return;

      const updated: NotificationPreferences = {
        ...preferences,
        [channel]: {
          ...preferences[channel],
          [key]: value,
        },
      };

      try {
        await updatePreferences.mutateAsync({ preferences: updated });
        success('Preferences updated', `Notification preference has been ${value ? 'enabled' : 'disabled'}.`);
      } catch {
        showError('Update failed', 'Failed to update notification preferences.');
      }
    },
    [preferences, updatePreferences, success, showError]
  );

  if (isLoading) {
    return <NotificationsSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-secondary-900 dark:text-white">Notification Preferences</h2>
        <p className="mt-1 text-sm text-secondary-500 dark:text-secondary-400">
          Choose how you want to be notified about activity on your account.
        </p>
      </div>

      {/* Email Notifications */}
      <Card padding="md">
        <h3 className="text-base font-medium text-secondary-900 dark:text-white mb-4">Email Notifications</h3>
        <div className="space-y-4">
          <ToggleRow
            label="Transaction Alerts"
            description="Receive email for every transaction"
            checked={preferences?.email.transactionAlerts ?? true}
            onChange={(v) => handleToggle('email', 'transactionAlerts', v)}
            disabled={updatePreferences.isPending}
          />
          <ToggleRow
            label="Payment Reminders"
            description="Reminders for scheduled or pending payments"
            checked={preferences?.email.paymentReminders ?? true}
            onChange={(v) => handleToggle('email', 'paymentReminders', v)}
            disabled={updatePreferences.isPending}
          />
          <ToggleRow
            label="Security Alerts"
            description="Login attempts, password changes, and suspicious activity"
            checked={preferences?.email.securityAlerts ?? true}
            onChange={(v) => handleToggle('email', 'securityAlerts', v)}
            disabled={updatePreferences.isPending}
          />
          <ToggleRow
            label="Newsletter"
            description="Product updates, tips, and announcements"
            checked={preferences?.email.newsletter ?? false}
            onChange={(v) => handleToggle('email', 'newsletter', v)}
            disabled={updatePreferences.isPending}
          />
        </div>
      </Card>

      {/* Push Notifications */}
      <Card padding="md">
        <h3 className="text-base font-medium text-secondary-900 dark:text-white mb-4">Push Notifications</h3>
        <div className="space-y-4">
          <ToggleRow
            label="Transaction Alerts"
            description="Real-time push notifications for transactions"
            checked={preferences?.push.transactionAlerts ?? true}
            onChange={(v) => handleToggle('push', 'transactionAlerts', v)}
            disabled={updatePreferences.isPending}
          />
          <ToggleRow
            label="Payment Reminders"
            description="Push reminders for pending actions"
            checked={preferences?.push.paymentReminders ?? true}
            onChange={(v) => handleToggle('push', 'paymentReminders', v)}
            disabled={updatePreferences.isPending}
          />
          <ToggleRow
            label="Security Alerts"
            description="Immediate alerts for security events"
            checked={preferences?.push.securityAlerts ?? true}
            onChange={(v) => handleToggle('push', 'securityAlerts', v)}
            disabled={updatePreferences.isPending}
          />
        </div>
      </Card>

      {/* SMS Notifications */}
      <Card padding="md">
        <h3 className="text-base font-medium text-secondary-900 dark:text-white mb-4">SMS Notifications</h3>
        <div className="space-y-4">
          <ToggleRow
            label="Transaction Alerts"
            description="SMS for high-value or critical transactions"
            checked={preferences?.sms.transactionAlerts ?? false}
            onChange={(v) => handleToggle('sms', 'transactionAlerts', v)}
            disabled={updatePreferences.isPending}
          />
          <ToggleRow
            label="Security Alerts"
            description="SMS verification codes and security warnings"
            checked={preferences?.sms.securityAlerts ?? true}
            onChange={(v) => handleToggle('sms', 'securityAlerts', v)}
            disabled={updatePreferences.isPending}
          />
        </div>
      </Card>
    </div>
  );
};

const NotificationsSkeleton = () => (
  <div className="space-y-6 animate-pulse">
    <div className="h-6 bg-secondary-200 dark:bg-secondary-700 rounded w-48" />
    <div className="h-4 bg-secondary-100 dark:bg-secondary-800 rounded w-80" />
    {[1, 2, 3].map((i) => (
      <div key={i} className="bg-white dark:bg-secondary-800 border border-secondary-200 dark:border-secondary-700 rounded-lg p-6 space-y-4">
        <div className="h-5 bg-secondary-200 dark:bg-secondary-700 rounded w-36" />
        <div className="h-10 bg-secondary-100 dark:bg-secondary-800 rounded" />
        <div className="h-10 bg-secondary-100 dark:bg-secondary-800 rounded" />
      </div>
    ))}
  </div>
);

// ============================================================================
// Toggle Row Component
// ============================================================================

interface ToggleRowProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}

const ToggleRow = ({ label, description, checked, onChange, disabled }: ToggleRowProps) => (
  <div className="flex items-center justify-between py-2">
    <div className="flex-1 mr-4">
      <p className="text-sm font-medium text-secondary-900 dark:text-white">{label}</p>
      <p className="text-xs text-secondary-500 dark:text-secondary-400">{description}</p>
    </div>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
        checked ? 'bg-primary-600' : 'bg-secondary-200 dark:bg-secondary-700',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <span
        className={cn(
          'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
          checked ? 'translate-x-5' : 'translate-x-0'
        )}
      />
    </button>
  </div>
);

// ============================================================================
// Payment Methods Section
// ============================================================================

const PaymentMethodsSection = () => {
  const { data: methods, isLoading } = usePaymentMethods();
  const addMethod = useAddPaymentMethod();
  const removeMethod = useRemovePaymentMethod();
  const setDefault = useSetDefaultPaymentMethod();
  const { success, error: showError } = useToast();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState<PaymentMethodInfo | null>(null);
  const [addType, setAddType] = useState<'card' | 'bank_transfer' | 'upi'>('card');

  const handleSetDefault = async (methodId: string) => {
    try {
      await setDefault.mutateAsync(methodId);
      success('Default updated', 'Default payment method has been changed.');
    } catch {
      showError('Update failed', 'Failed to set default payment method.');
    }
  };

  const handleRemove = async () => {
    if (!showRemoveModal) return;
    try {
      await removeMethod.mutateAsync(showRemoveModal.id);
      success('Method removed', 'Payment method has been removed.');
      setShowRemoveModal(null);
    } catch {
      showError('Remove failed', 'Failed to remove payment method.');
    }
  };

  if (isLoading) {
    return <PaymentMethodsSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-secondary-900 dark:text-white">Payment Methods</h2>
          <p className="mt-1 text-sm text-secondary-500 dark:text-secondary-400">
            Manage your saved cards, bank accounts, and UPI IDs.
          </p>
        </div>
        <Button
          size="sm"
          leftIcon={<PlusIcon className="h-4 w-4" />}
          onClick={() => setShowAddModal(true)}
        >
          Add Method
        </Button>
      </div>

      {/* Payment Methods List */}
      {methods && methods.length > 0 ? (
        <div className="space-y-3">
          {methods.map((method) => (
            <PaymentMethodCard
              key={method.id}
              method={method}
              onSetDefault={() => handleSetDefault(method.id)}
              onRemove={() => setShowRemoveModal(method)}
              isSettingDefault={setDefault.isPending}
            />
          ))}
        </div>
      ) : (
        <Card padding="lg">
          <div className="text-center py-8">
            <CreditCardIcon className="h-12 w-12 text-secondary-300 dark:text-secondary-600 mx-auto mb-3" />
            <h3 className="text-sm font-medium text-secondary-900 dark:text-white">No payment methods</h3>
            <p className="text-sm text-secondary-500 dark:text-secondary-400 mt-1">
              Add a card, bank account, or UPI ID to get started.
            </p>
            <Button
              size="sm"
              className="mt-4"
              leftIcon={<PlusIcon className="h-4 w-4" />}
              onClick={() => setShowAddModal(true)}
            >
              Add Payment Method
            </Button>
          </div>
        </Card>
      )}

      {/* Add Payment Method Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} size="md">
        <ModalHeader>Add Payment Method</ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            {/* Type Selector */}
            <div className="flex gap-2">
              {(['card', 'bank_transfer', 'upi'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setAddType(type)}
                  className={cn(
                    'flex-1 px-3 py-2 text-sm font-medium rounded-lg border transition-colors',
                    addType === type
                      ? 'border-primary-500 bg-primary-50 text-primary-700 dark:border-primary-600 dark:bg-primary-900/20 dark:text-primary-400'
                      : 'border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-800 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-50 dark:hover:bg-secondary-700'
                  )}
                >
                  {type === 'card' && 'Card'}
                  {type === 'bank_transfer' && 'Bank Account'}
                  {type === 'upi' && 'UPI'}
                </button>
              ))}
            </div>

            {/* Form based on type */}
            {addType === 'card' && (
              <AddCardForm
                onSuccess={() => {
                  setShowAddModal(false);
                  success('Card added', 'Your card has been saved securely.');
                }}
                onError={() => showError('Failed', 'Could not add card. Please try again.')}
                addMethod={addMethod}
              />
            )}
            {addType === 'bank_transfer' && (
              <AddBankForm
                onSuccess={() => {
                  setShowAddModal(false);
                  success('Bank account added', 'Your bank account has been linked.');
                }}
                onError={() => showError('Failed', 'Could not add bank account.')}
                addMethod={addMethod}
              />
            )}
            {addType === 'upi' && (
              <AddUpiForm
                onSuccess={() => {
                  setShowAddModal(false);
                  success('UPI added', 'Your UPI ID has been saved.');
                }}
                onError={() => showError('Failed', 'Could not add UPI ID.')}
                addMethod={addMethod}
              />
            )}
          </div>
        </ModalBody>
      </Modal>

      {/* Remove Confirmation Modal */}
      <Modal
        isOpen={!!showRemoveModal}
        onClose={() => setShowRemoveModal(null)}
        size="sm"
      >
        <ModalHeader>Remove Payment Method</ModalHeader>
        <ModalBody>
          <p className="text-sm text-secondary-600 dark:text-secondary-300">
            Are you sure you want to remove this payment method ending in{' '}
            <span className="font-medium">{showRemoveModal?.last4}</span>? This action
            cannot be undone.
          </p>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setShowRemoveModal(null)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleRemove}
            isLoading={removeMethod.isPending}
          >
            Remove
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};

// ============================================================================
// Payment Method Card
// ============================================================================

interface PaymentMethodCardProps {
  method: PaymentMethodInfo;
  onSetDefault: () => void;
  onRemove: () => void;
  isSettingDefault: boolean;
}

const PaymentMethodCard = ({
  method,
  onSetDefault,
  onRemove,
  isSettingDefault,
}: PaymentMethodCardProps) => {
  const getIcon = () => {
    switch (method.type) {
      case 'card':
        return <CreditCardIcon className="h-8 w-8 text-blue-500" />;
      case 'bank_transfer':
        return <BanknotesIcon className="h-8 w-8 text-green-500" />;
      case 'upi':
        return (
          <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
            <span className="text-xs font-bold text-purple-600">UPI</span>
          </div>
        );
      default:
        return <CreditCardIcon className="h-8 w-8 text-secondary-400 dark:text-secondary-500" />;
    }
  };

  const getLabel = () => {
    switch (method.type) {
      case 'card':
        return `•••• •••• •••• ${method.last4}`;
      case 'bank_transfer':
        return `${method.bankName || 'Bank Account'} •••• ${method.last4}`;
      case 'upi':
        return `UPI •••• ${method.last4}`;
      default:
        return `•••• ${method.last4}`;
    }
  };

  const getExpiry = () => {
    if (method.type === 'card' && method.expiryMonth && method.expiryYear) {
      return `Expires ${String(method.expiryMonth).padStart(2, '0')}/${method.expiryYear}`;
    }
    return null;
  };

  return (
    <div className="flex items-center justify-between p-4 border border-secondary-200 dark:border-secondary-700 rounded-lg bg-white dark:bg-secondary-800 hover:border-secondary-300 dark:hover:border-secondary-600 transition-colors">
      <div className="flex items-center gap-4">
        {getIcon()}
        <div>
          <p className="text-sm font-medium text-secondary-900 dark:text-white">{getLabel()}</p>
          <div className="flex items-center gap-2 mt-0.5">
            {getExpiry() && (
              <span className="text-xs text-secondary-500 dark:text-secondary-400">{getExpiry()}</span>
            )}
            {method.isDefault && (
              <Badge variant="success" className="text-xs">Default</Badge>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {!method.isDefault && (
          <button
            type="button"
            onClick={onSetDefault}
            disabled={isSettingDefault}
            className="p-2 text-secondary-400 dark:text-secondary-500 hover:text-yellow-500 transition-colors rounded-lg hover:bg-secondary-50 dark:hover:bg-secondary-800"
            title="Set as default"
          >
            <StarIcon className="h-5 w-5" />
          </button>
        )}
        {method.isDefault && (
          <span className="p-2 text-yellow-500">
            <StarIconSolid className="h-5 w-5" />
          </span>
        )}
        <button
          type="button"
          onClick={onRemove}
          className="p-2 text-secondary-400 dark:text-secondary-500 hover:text-red-500 transition-colors rounded-lg hover:bg-secondary-50 dark:hover:bg-secondary-800"
          title="Remove"
        >
          <TrashIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// Add Card Form
// ============================================================================

interface AddFormProps {
  onSuccess: () => void;
  onError: () => void;
  addMethod: ReturnType<typeof useAddPaymentMethod>;
}

const AddCardForm = ({ onSuccess, onError, addMethod }: AddFormProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(cardSchema),
    defaultValues: {
      cardNumber: '',
      expiryMonth: new Date().getMonth() + 1,
      expiryYear: new Date().getFullYear(),
      cvv: '',
    },
  });

  const onSubmit = async (data: z.infer<typeof cardSchema>) => {
    try {
      await addMethod.mutateAsync({
        type: 'card',
        cardNumber: data.cardNumber.replace(/\s/g, ''),
        expiryMonth: data.expiryMonth,
        expiryYear: data.expiryYear,
        cvv: data.cvv,
      });
      onSuccess();
    } catch {
      onError();
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="Card Number"
        {...register('cardNumber')}
        error={errors.cardNumber?.message}
        placeholder="1234 5678 9012 3456"
        maxLength={19}
      />
      <div className="grid grid-cols-3 gap-3">
        <Input
          label="Month"
          type="number"
          {...register('expiryMonth', { valueAsNumber: true })}
          error={errors.expiryMonth?.message}
          placeholder="MM"
          min={1}
          max={12}
        />
        <Input
          label="Year"
          type="number"
          {...register('expiryYear', { valueAsNumber: true })}
          error={errors.expiryYear?.message}
          placeholder="YYYY"
          min={new Date().getFullYear()}
        />
        <Input
          label="CVV"
          type="password"
          {...register('cvv')}
          error={errors.cvv?.message}
          placeholder="•••"
          maxLength={4}
        />
      </div>
      <Button type="submit" className="w-full" isLoading={addMethod.isPending}>
        Add Card
      </Button>
    </form>
  );
};

// ============================================================================
// Add Bank Form
// ============================================================================

const AddBankForm = ({ onSuccess, onError, addMethod }: AddFormProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(bankSchema),
    defaultValues: {
      bankAccountNumber: '',
      bankRoutingNumber: '',
    },
  });

  const onSubmit = async (data: z.infer<typeof bankSchema>) => {
    try {
      await addMethod.mutateAsync({
        type: 'bank_transfer',
        bankAccountNumber: data.bankAccountNumber,
        bankRoutingNumber: data.bankRoutingNumber,
      });
      onSuccess();
    } catch {
      onError();
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="Account Number"
        {...register('bankAccountNumber')}
        error={errors.bankAccountNumber?.message}
        placeholder="Enter account number"
      />
      <Input
        label="Routing Number"
        {...register('bankRoutingNumber')}
        error={errors.bankRoutingNumber?.message}
        placeholder="Enter routing/IFSC code"
      />
      <Button type="submit" className="w-full" isLoading={addMethod.isPending}>
        Add Bank Account
      </Button>
    </form>
  );
};

// ============================================================================
// Add UPI Form
// ============================================================================

const AddUpiForm = ({ onSuccess, onError, addMethod }: AddFormProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(upiSchema),
    defaultValues: {
      upiId: '',
    },
  });

  const onSubmit = async (data: z.infer<typeof upiSchema>) => {
    try {
      await addMethod.mutateAsync({
        type: 'upi',
        upiId: data.upiId,
      });
      onSuccess();
    } catch {
      onError();
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="UPI ID"
        {...register('upiId')}
        error={errors.upiId?.message}
        placeholder="yourname@upi"
      />
      <Button type="submit" className="w-full" isLoading={addMethod.isPending}>
        Add UPI ID
      </Button>
    </form>
  );
};

const PaymentMethodsSkeleton = () => (
  <div className="space-y-6 animate-pulse">
    <div className="flex items-center justify-between">
      <div className="h-6 bg-secondary-200 dark:bg-secondary-700 rounded w-40" />
      <div className="h-8 bg-secondary-200 dark:bg-secondary-700 rounded w-24" />
    </div>
    {[1, 2, 3].map((i) => (
      <div key={i} className="h-16 bg-secondary-100 dark:bg-secondary-800 border border-secondary-200 dark:border-secondary-700 rounded-lg" />
    ))}
  </div>
);

// ============================================================================
// Transaction Limits Section
// ============================================================================

const TransactionLimitsSection = () => {
  const limits = [
    {
      label: 'Single Transaction Limit',
      amount: '₹5,00,000',
      used: '₹1,25,000',
      percentage: 25,
      period: 'Per transaction',
    },
    {
      label: 'Daily Transaction Limit',
      amount: '₹25,00,000',
      used: '₹8,50,000',
      percentage: 34,
      period: 'Resets at midnight',
    },
    {
      label: 'Monthly Transaction Limit',
      amount: '₹1,00,00,000',
      used: '₹42,00,000',
      percentage: 42,
      period: 'Resets on 1st of every month',
    },
    {
      label: 'Daily Transfer Count',
      amount: '50 transactions',
      used: '12 transactions',
      percentage: 24,
      period: 'Resets at midnight',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-secondary-900 dark:text-white">Transaction Limits</h2>
        <p className="mt-1 text-sm text-secondary-500 dark:text-secondary-400">
          View your current transaction limits and usage. Contact support to request limit increases.
        </p>
      </div>

      <div className="space-y-4">
        {limits.map((limit) => (
          <Card key={limit.label} padding="md">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-sm font-medium text-secondary-900 dark:text-white">{limit.label}</p>
                <p className="text-xs text-secondary-500 dark:text-secondary-400">{limit.period}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-secondary-900 dark:text-white">{limit.amount}</p>
                <p className="text-xs text-secondary-500 dark:text-secondary-400">Used: {limit.used}</p>
              </div>
            </div>
            <div className="w-full bg-secondary-200 dark:bg-secondary-700 rounded-full h-2">
              <div
                className={cn(
                  'h-2 rounded-full transition-all',
                  limit.percentage > 80
                    ? 'bg-red-500'
                    : limit.percentage > 50
                    ? 'bg-yellow-500'
                    : 'bg-green-500'
                )}
                style={{ width: `${limit.percentage}%` }}
              />
            </div>
            <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-1 text-right">
              {limit.percentage}% utilized
            </p>
          </Card>
        ))}
      </div>

      <Card padding="md" className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-3">
          <InformationIcon className="h-5 w-5 text-blue-500 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-blue-900 dark:text-blue-200">Need higher limits?</p>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-0.5">
              Contact support or your account manager to request a limit increase.
              Higher limits may require additional KYC verification.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

const InformationIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
  </svg>
);

// ============================================================================
// Appearance Section
// ============================================================================

const AppearanceSection = () => {
  const { theme, setTheme, isDark } = useThemeContext();

  const themeOptions: { id: 'light' | 'dark' | 'system'; label: string; description: string; icon: typeof SunIcon }[] = [
    { id: 'light', label: 'Light', description: 'Always use light theme', icon: SunIcon },
    { id: 'dark', label: 'Dark', description: 'Always use dark theme', icon: MoonIcon },
    { id: 'system', label: 'System', description: 'Follow your system preference', icon: ComputerDesktopIcon },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-secondary-900 dark:text-white">Appearance</h2>
        <p className="mt-1 text-sm text-secondary-500 dark:text-secondary-400">
          Customize how FlowPay looks on your device.
        </p>
      </div>

      <Card padding="md">
        <h3 className="text-base font-medium text-secondary-900 dark:text-white mb-4">Theme</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {themeOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = theme === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setTheme(option.id)}
                className={cn(
                  'flex flex-col items-center gap-3 rounded-xl border-2 p-4 transition-all',
                  isSelected
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 ring-1 ring-primary-500'
                    : 'border-secondary-200 dark:border-secondary-700 hover:border-secondary-300 dark:hover:border-secondary-600 hover:bg-secondary-50 dark:hover:bg-secondary-800'
                )}
              >
                <div className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-lg',
                  isSelected
                    ? 'bg-primary-100 dark:bg-primary-900/40'
                    : 'bg-secondary-100 dark:bg-secondary-800'
                )}>
                  <Icon className={cn(
                    'h-5 w-5',
                    isSelected
                      ? 'text-primary-600 dark:text-primary-400'
                      : 'text-secondary-500 dark:text-secondary-400'
                  )} />
                </div>
                <div className="text-center">
                  <p className={cn(
                    'text-sm font-medium',
                    isSelected
                      ? 'text-primary-700 dark:text-primary-300'
                      : 'text-secondary-900 dark:text-white'
                  )}>
                    {option.label}
                  </p>
                  <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-0.5">
                    {option.description}
                  </p>
                </div>
                {isSelected && (
                  <div className="h-1.5 w-1.5 rounded-full bg-primary-500" />
                )}
              </button>
            );
          })}
        </div>
      </Card>

      <Card padding="md">
        <h3 className="text-base font-medium text-secondary-900 dark:text-white mb-2">Preview</h3>
        <p className="text-sm text-secondary-500 dark:text-secondary-400 mb-4">
          Currently using <span className="font-medium text-secondary-900 dark:text-white">{isDark ? 'dark' : 'light'}</span> mode
          {theme === 'system' && ' (following system preference)'}.
        </p>
        <div className="flex items-center gap-4">
          <div className="flex-1 rounded-lg bg-secondary-100 dark:bg-secondary-800 p-3 border border-secondary-200 dark:border-secondary-700">
            <div className="h-2 w-3/4 rounded bg-secondary-300 dark:bg-secondary-600 mb-2" />
            <div className="h-2 w-1/2 rounded bg-secondary-200 dark:bg-secondary-700" />
          </div>
        </div>
      </Card>
    </div>
  );
};

// ============================================================================
// Settings Page (Main Export)
// ============================================================================

export const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  const renderSection = () => {
    switch (activeTab) {
      case 'profile':
        return <ProfileSection />;
      case 'security':
        return <SecuritySection />;
      case 'notifications':
        return <NotificationsSection />;
      case 'payment-methods':
        return <PaymentMethodsSection />;
      case 'limits':
        return <TransactionLimitsSection />;
      case 'appearance':
        return <AppearanceSection />;
      default:
        return null;
    }
  };

  return (
    <div className="p-6">
      <Breadcrumbs />

      <div className="max-w-5xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <Cog6ToothIcon className="h-8 w-8 text-secondary-400 dark:text-secondary-500" />
            <h1 className="text-3xl font-bold text-secondary-900 dark:text-white">Settings</h1>
          </div>
          <p className="text-secondary-600 dark:text-secondary-300">
            Manage your account settings and preferences
          </p>
        </div>

        {/* Tab Layout */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Tabs */}
          <nav className="lg:w-56 flex-shrink-0">
            <ul className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <li key={tab.id}>
                    <button
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        'flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium rounded-lg w-full whitespace-nowrap transition-colors',
                        activeTab === tab.id
                          ? 'bg-primary-50 text-primary-700 border border-primary-200'
                          : 'text-secondary-600 dark:text-secondary-300 hover:text-secondary-900 dark:text-white hover:bg-secondary-50 dark:bg-secondary-800'
                      )}
                    >
                      <Icon className="h-5 w-5 flex-shrink-0" />
                      {tab.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Content Area */}
          <div className="flex-1 min-w-0">
            <div className="bg-white dark:bg-secondary-800 border border-secondary-200 dark:border-secondary-700 rounded-xl p-6 lg:p-8">
              {renderSection()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
