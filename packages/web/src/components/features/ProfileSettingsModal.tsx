import { useState, useEffect } from 'react';
import { useUpdateProfile, useDeleteAccount } from '../../hooks/useAuth';
import { useAuthStore } from '../../stores/auth';
import { useSettingsModalStore } from '../../stores/settingsModal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

export function ProfileSettingsModal() {
  const user = useAuthStore((s) => s.user);
  const { isOpen, close } = useSettingsModalStore();
  const updateProfileMutation = useUpdateProfile();
  const deleteAccountMutation = useDeleteAccount();

  // Local Form State
  const [newDisplayName, setNewDisplayName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [updateError, setUpdateError] = useState('');
  const [updateSuccess, setUpdateSuccess] = useState(false);

  // Delete Account State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [deleteError, setDeleteError] = useState('');

  // Pre-fill display name when modal opens
  useEffect(() => {
    if (isOpen && user) {
      setNewDisplayName(user.displayName || user.username);
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdateError('');
    setUpdateSuccess(false);

    const hasNewPassword = newPassword.trim() !== '';

    if (!newDisplayName.trim() && !hasNewPassword) {
      setUpdateError('Please fill in at least one field to update');
      return;
    }

    if (hasNewPassword) {
      if (!currentPassword) {
        setUpdateError('Current password is required to change password');
        return;
      }
      if (newPassword.length < 6) {
        setUpdateError('New password must be at least 6 characters');
        return;
      }
    }

    try {
      await updateProfileMutation.mutateAsync({
        displayName: newDisplayName.trim() ? newDisplayName.trim() : undefined,
        currentPassword: hasNewPassword ? currentPassword : undefined,
        newPassword: hasNewPassword ? newPassword : undefined,
      });

      setUpdateSuccess(true);
      setNewDisplayName('');
      setCurrentPassword('');
      setNewPassword('');
      
      // Close modal on success after a short delay
      setTimeout(() => {
        handleCloseModal();
        setUpdateSuccess(false);
      }, 1500);
    } catch (err: any) {
      setUpdateError(err.message || 'Failed to update profile');
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteError('');
    if (deleteInput !== 'delete') {
      setDeleteError('Please type "delete" to confirm');
      return;
    }

    try {
      await deleteAccountMutation.mutateAsync();
      handleCloseModal();
      // user will automatically be logged out and redirected
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to delete account');
    }
  };

  const handleCloseModal = () => {
    close();
    setUpdateError('');
    setUpdateSuccess(false);
    setNewDisplayName('');
    setCurrentPassword('');
    setNewPassword('');
    setDeleteInput('');
    setDeleteError('');
    setIsDeleteModalOpen(false);
  };

  if (isDeleteModalOpen) {
    return (
      <div className="modal-overlay" onClick={handleCloseModal}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="flex justify-between items-center p-lg" style={{ borderBottom: '1px solid var(--color-hairline)' }}>
            <h2 className="text-headline text-danger" style={{ margin: 0, fontSize: 'var(--text-lg)' }}>Delete Account</h2>
            <button
              onClick={handleCloseModal}
              className="interactive text-muted hover:text-ink"
              style={{
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                padding: 0,
                lineHeight: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              aria-label="Close modal"
            >
              &times;
            </button>
          </div>
          
          <div className="flex flex-col gap-md p-lg">
            <p className="text-body-sm text-muted">
              Once you delete your account, there is no going back. All your points and logs will be permanently removed.
            </p>
            <div className="flex flex-col gap-xxs">
              <label htmlFor="deleteInput" className="text-caption text-muted">
                Type <strong>delete</strong> to confirm
              </label>
              <Input
                id="deleteInput"
                type="text"
                placeholder="delete"
                value={deleteInput}
                onChange={(e) => setDeleteInput(e.target.value)}
              />
            </div>
            {deleteError && (
              <div className="text-caption text-danger">
                {deleteError}
              </div>
            )}
          </div>
          
          <div className="flex gap-sm justify-end p-lg" style={{ borderTop: '1px solid var(--color-hairline)' }}>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsDeleteModalOpen(false);
                setDeleteInput('');
                setDeleteError('');
              }}
              disabled={deleteAccountMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleDeleteAccount}
              disabled={deleteInput !== 'delete' || deleteAccountMutation.isPending}
              loading={deleteAccountMutation.isPending}
              style={{ backgroundColor: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}
            >
              Confirm Deletion
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={handleCloseModal}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="flex justify-between items-center p-lg" style={{ borderBottom: '1px solid var(--color-hairline)' }}>
          <h2 className="text-headline" style={{ margin: 0, fontSize: 'var(--text-lg)' }}>Profile Settings</h2>
          <button
            onClick={handleCloseModal}
            className="interactive text-muted hover:text-ink"
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              padding: 0,
              lineHeight: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label="Close settings"
          >
            &times;
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleUpdateProfile} className="flex flex-col gap-md p-lg">
          {/* Display Name field */}
          <div className="flex flex-col gap-xxs">
            <label htmlFor="displayNameInput" className="text-caption text-muted">
              Display Name
            </label>
            <Input
              id="displayNameInput"
              type="text"
              placeholder="Enter display name"
              value={newDisplayName}
              onChange={(e) => setNewDisplayName(e.target.value)}
            />
          </div>

          <div style={{ borderTop: '1px solid var(--color-hairline)', margin: 'var(--space-xs) 0' }} />

          {/* Change Password fields */}
          <div className="flex flex-col gap-md">
            <h3 className="text-body-sm" style={{ fontWeight: 600, margin: 0 }}>Change Password</h3>
            
            <div className="flex flex-col gap-xxs">
              <label htmlFor="currentPasswordInput" className="text-caption text-muted">
                Current Password
              </label>
              <Input
                id="currentPasswordInput"
                type="password"
                placeholder="Required to change password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>

            <div className="flex flex-col gap-xxs">
              <label htmlFor="newPasswordInput" className="text-caption text-muted">
                New Password (min 6 characters)
              </label>
              <Input
                id="newPasswordInput"
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>
          </div>

          {updateError && (
            <div className="text-body-sm text-danger p-xs" style={{ backgroundColor: 'rgba(229, 72, 77, 0.1)', border: '1px solid rgba(229, 72, 77, 0.2)', borderRadius: 'var(--radius-sm)' }}>
              ⚠️ {updateError}
            </div>
          )}

          {updateSuccess && (
            <div className="text-body-sm text-success p-xs" style={{ backgroundColor: 'rgba(48, 164, 108, 0.1)', border: '1px solid rgba(48, 164, 108, 0.2)', borderRadius: 'var(--radius-sm)' }}>
              ✓ Profile updated successfully! Closing...
            </div>
          )}

          {/* Modal Footer */}
          <div className="flex gap-sm justify-end" style={{ marginTop: 'var(--space-md)', borderTop: '1px solid var(--color-hairline)', paddingTop: 'var(--space-md)' }}>
            <Button
              type="button"
              variant="secondary"
              onClick={handleCloseModal}
              disabled={updateProfileMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={updateProfileMutation.isPending}
            >
              Save Changes
            </Button>
          </div>
        </form>

        {/* Delete Account Link */}
        <div className="flex p-lg" style={{ borderTop: '1px solid var(--color-hairline)', backgroundColor: 'rgba(229, 72, 77, 0.04)' }}>
          <button
            type="button"
            className="interactive text-caption text-danger"
            style={{ background: 'none', border: 'none', padding: 0, textDecoration: 'underline', cursor: 'pointer' }}
            onClick={() => setIsDeleteModalOpen(true)}
          >
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}
