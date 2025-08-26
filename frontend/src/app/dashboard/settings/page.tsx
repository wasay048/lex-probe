"use client";

import React, { useState, useEffect } from "react";
import Button from "@/components/ui/Button";
import { authAPI } from "@/lib/api";
import toast from "react-hot-toast";
import {
  UserIcon,
  KeyIcon,
  BellIcon,
  ShieldCheckIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  Cog6ToothIcon,
  EnvelopeIcon,
  DevicePhoneMobileIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "@/context/AuthContext";

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isEmailVerified: boolean;
  phone?: string;
  company?: string;
  jobTitle?: string;
  timezone?: string;
  language?: string;
  createdAt: string;
}

interface NotificationSettings {
  emailNotifications: {
    analysisComplete: boolean;
    reportGenerated: boolean;
    highRiskDetected: boolean;
    weeklyDigest: boolean;
    securityAlerts: boolean;
  };
  pushNotifications: {
    analysisComplete: boolean;
    reportGenerated: boolean;
    highRiskDetected: boolean;
  };
}

interface SecuritySettings {
  twoFactorEnabled: boolean;
  sessionTimeout: number;
  loginNotifications: boolean;
  apiKeyCreatedAt?: string;
  lastPasswordChange?: string;
}

interface PreferencesSettings {
  theme: "light" | "dark" | "auto";
  dateFormat: string;
  itemsPerPage: number;
  defaultAnalysisPeriod: string;
  riskThreshold: number;
}

const SettingsPage: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<
    "profile" | "security" | "notifications" | "preferences" | "danger"
  >("profile");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({
    firstName: "",
    lastName: "",
    email: "",
    role: "",
    isEmailVerified: false,
    phone: "",
    company: "",
    jobTitle: "",
    timezone: "UTC",
    language: "en",
    createdAt: "",
  });

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // Notifications state
  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailNotifications: {
      analysisComplete: true,
      reportGenerated: true,
      highRiskDetected: true,
      weeklyDigest: false,
      securityAlerts: true,
    },
    pushNotifications: {
      analysisComplete: true,
      reportGenerated: false,
      highRiskDetected: true,
    },
  });

  // Security state
  const [security, setSecurity] = useState<SecuritySettings>({
    twoFactorEnabled: false,
    sessionTimeout: 30,
    loginNotifications: true,
  });

  // Preferences state
  const [preferences, setPreferences] = useState<PreferencesSettings>({
    theme: "light",
    dateFormat: "MM/DD/YYYY",
    itemsPerPage: 25,
    defaultAnalysisPeriod: "1y",
    riskThreshold: 0.7,
  });

  // API Key state
  const [apiKey, setApiKey] = useState<string>("");
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    if (user) {
      setProfile({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        phone: "",
        company: "",
        jobTitle: "",
        timezone: "UTC",
        language: "en",
        createdAt: user.createdAt,
      });
    }
    loadSettings();
  }, [user]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      // In a real implementation, you would fetch these from dedicated endpoints
      // For now, we'll use mock data

      // Mock API calls
      // const [notificationsRes, securityRes] = await Promise.all([
      //   userAPI.getNotificationSettings(),
      //   userAPI.getSecuritySettings(),
      // ]);

      // Mock data for now
    } catch (error) {
      console.error("Failed to load settings:", error);
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);

      // In a real implementation:
      // await userAPI.updateProfile(profile);

      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }

    try {
      setSaving(true);

      await authAPI.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      toast.success("Password changed successfully");
    } catch (error) {
      console.error("Failed to change password:", error);
      toast.error("Failed to change password");
    } finally {
      setSaving(false);
    }
  };

  const handleNotificationUpdate = async () => {
    try {
      setSaving(true);

      // In a real implementation:
      // await userAPI.updateNotificationSettings(notifications);

      toast.success("Notification settings updated");
    } catch (error) {
      console.error("Failed to update notifications:", error);
      toast.error("Failed to update notification settings");
    } finally {
      setSaving(false);
    }
  };

  const handleSecurityUpdate = async () => {
    try {
      setSaving(true);

      // In a real implementation:
      // await userAPI.updateSecuritySettings(security);

      toast.success("Security settings updated");
    } catch (error) {
      console.error("Failed to update security settings:", error);
      toast.error("Failed to update security settings");
    } finally {
      setSaving(false);
    }
  };

  const handlePreferencesUpdate = async () => {
    try {
      setSaving(true);

      // In a real implementation:
      // await userAPI.updatePreferences(preferences);

      toast.success("Preferences updated");
    } catch (error) {
      console.error("Failed to update preferences:", error);
      toast.error("Failed to update preferences");
    } finally {
      setSaving(false);
    }
  };

  const generateApiKey = async () => {
    try {
      setSaving(true);

      // In a real implementation:
      // const response = await userAPI.generateApiKey();
      // setApiKey(response.data.apiKey);

      // Mock API key generation
      const mockApiKey =
        "cdp_" +
        Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);
      setApiKey(mockApiKey);

      toast.success("API key generated successfully");
    } catch (error) {
      console.error("Failed to generate API key:", error);
      toast.error("Failed to generate API key");
    } finally {
      setSaving(false);
    }
  };

  const handleAccountDeletion = async () => {
    const confirmText = "DELETE MY ACCOUNT";
    const userInput = prompt(
      `This action cannot be undone. This will permanently delete your account and all associated data.\n\nType "${confirmText}" to confirm:`
    );

    if (userInput !== confirmText) {
      toast.error("Account deletion cancelled");
      return;
    }

    try {
      setSaving(true);

      // In a real implementation:
      // await userAPI.deleteAccount();

      toast.success("Account deletion initiated. You will be logged out.");
      setTimeout(() => {
        logout();
      }, 2000);
    } catch (error) {
      console.error("Failed to delete account:", error);
      toast.error("Failed to delete account");
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: "profile", name: "Profile", icon: UserIcon },
    { id: "security", name: "Security", icon: ShieldCheckIcon },
    { id: "notifications", name: "Notifications", icon: BellIcon },
    { id: "preferences", name: "Preferences", icon: Cog6ToothIcon },
    { id: "danger", name: "Danger Zone", icon: ExclamationTriangleIcon },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="mt-2 text-gray-600">
          Manage your account settings, security preferences, and notification
          options.
        </p>
      </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                    activeTab === tab.id
                      ? "bg-blue-100 text-blue-700 border-r-2 border-blue-500"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  <tab.icon className="h-5 w-5 mr-3" />
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              {/* Profile Tab */}
              {activeTab === "profile" && (
                <div className="p-6">
                  <div className="flex items-center space-x-3 mb-6">
                    <UserIcon className="h-6 w-6 text-blue-600" />
                    <h2 className="text-xl font-semibold text-gray-900">
                      Profile Information
                    </h2>
                  </div>

                  <form onSubmit={handleProfileUpdate} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label
                          htmlFor="firstName"
                          className="block text-sm font-medium text-gray-700 mb-2"
                        >
                          First Name
                        </label>
                        <input
                          id="firstName"
                          type="text"
                          value={profile.firstName}
                          onChange={(e) =>
                            setProfile({
                              ...profile,
                              firstName: e.target.value,
                            })
                          }
                          placeholder="First Name"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="lastName"
                          className="block text-sm font-medium text-gray-700 mb-2"
                        >
                          Last Name
                        </label>
                        <input
                          id="lastName"
                          type="text"
                          value={profile.lastName}
                          onChange={(e) =>
                            setProfile({ ...profile, lastName: e.target.value })
                          }
                          placeholder="Last Name"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="email"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Email Address
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          id="email"
                          type="email"
                          value={profile.email}
                          onChange={(e) =>
                            setProfile({ ...profile, email: e.target.value })
                          }
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                        {profile.isEmailVerified ? (
                          <CheckCircleIcon className="h-5 w-5 text-green-500" />
                        ) : (
                          <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
                        )}
                      </div>
                      <p className="mt-1 text-sm text-gray-500">
                        {profile.isEmailVerified
                          ? "Email verified"
                          : "Email not verified"}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          value={profile.phone}
                          onChange={(e) =>
                            setProfile({ ...profile, phone: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="+1 (555) 123-4567"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Company
                        </label>
                        <input
                          type="text"
                          value={profile.company}
                          onChange={(e) =>
                            setProfile({ ...profile, company: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Your company name"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Job Title
                      </label>
                      <input
                        type="text"
                        value={profile.jobTitle}
                        onChange={(e) =>
                          setProfile({ ...profile, jobTitle: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Your job title"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Timezone
                        </label>
                        <select
                          value={profile.timezone}
                          onChange={(e) =>
                            setProfile({ ...profile, timezone: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          id="timezone"
                          aria-label="Select timezone"
                        >
                          <option value="UTC">UTC</option>
                          <option value="America/New_York">Eastern Time</option>
                          <option value="America/Chicago">Central Time</option>
                          <option value="America/Denver">Mountain Time</option>
                          <option value="America/Los_Angeles">
                            Pacific Time
                          </option>
                          <option value="Europe/London">London</option>
                          <option value="Europe/Paris">Paris</option>
                          <option value="Asia/Tokyo">Tokyo</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Language
                        </label>
                        <select
                          value={profile.language}
                          onChange={(e) =>
                            setProfile({ ...profile, language: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          aria-label="Select language"
                        >
                          <option value="en">English</option>
                          <option value="es">Spanish</option>
                          <option value="fr">French</option>
                          <option value="de">German</option>
                          <option value="zh">Chinese</option>
                          <option value="ja">Japanese</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button type="submit" loading={saving}>
                        Save Changes
                      </Button>
                    </div>
                  </form>
                </div>
              )}

              {/* Security Tab */}
              {activeTab === "security" && (
                <div className="p-6 space-y-8">
                  <div className="flex items-center space-x-3 mb-6">
                    <ShieldCheckIcon className="h-6 w-6 text-blue-600" />
                    <h2 className="text-xl font-semibold text-gray-900">
                      Security Settings
                    </h2>
                  </div>

                  {/* Change Password */}
                  <div className="border-b border-gray-200 pb-8">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Change Password
                    </h3>
                    <form onSubmit={handlePasswordChange} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Current Password
                        </label>
                        <div className="relative">
                          <input
                            type={showPasswords.current ? "text" : "password"}
                            value={passwordData.currentPassword}
                            onChange={(e) =>
                              setPasswordData({
                                ...passwordData,
                                currentPassword: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Enter your current password"
                            required
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowPasswords({
                                ...showPasswords,
                                current: !showPasswords.current,
                              })
                            }
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          >
                            {showPasswords.current ? (
                              <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                            ) : (
                              <EyeIcon className="h-5 w-5 text-gray-400" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          New Password
                        </label>
                        <div className="relative">
                          <input
                            type={showPasswords.new ? "text" : "password"}
                            value={passwordData.newPassword}
                            onChange={(e) =>
                              setPasswordData({
                                ...passwordData,
                                newPassword: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            required
                            minLength={8}
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowPasswords({
                                ...showPasswords,
                                new: !showPasswords.new,
                              })
                            }
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          >
                            {showPasswords.new ? (
                              <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                            ) : (
                              <EyeIcon className="h-5 w-5 text-gray-400" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Confirm New Password
                        </label>
                        <div className="relative">
                          <input
                            type={showPasswords.confirm ? "text" : "password"}
                            value={passwordData.confirmPassword}
                            onChange={(e) =>
                              setPasswordData({
                                ...passwordData,
                                confirmPassword: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            required
                            minLength={8}
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowPasswords({
                                ...showPasswords,
                                confirm: !showPasswords.confirm,
                              })
                            }
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          >
                            {showPasswords.confirm ? (
                              <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                            ) : (
                              <EyeIcon className="h-5 w-5 text-gray-400" />
                            )}
                          </button>
                        </div>
                      </div>

                      <Button type="submit" loading={saving}>
                        Change Password
                      </Button>
                    </form>
                  </div>

                  {/* Two-Factor Authentication */}
                  <div className="border-b border-gray-200 pb-8">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Two-Factor Authentication
                    </h3>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">
                          Add an extra layer of security to your account by
                          enabling two-factor authentication.
                        </p>
                      </div>
                      <div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={security.twoFactorEnabled}
                            onChange={(e) =>
                              setSecurity({
                                ...security,
                                twoFactorEnabled: e.target.checked,
                              })
                            }
                            className="sr-only peer"
                            aria-label="Enable two-factor authentication"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* API Key */}
                  <div className="border-b border-gray-200 pb-8">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      API Key
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Use this API key to access the Cartel Detection Platform
                      programmatically.
                    </p>

                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <div className="flex-1">
                          <input
                            type={showApiKey ? "text" : "password"}
                            value={apiKey || "No API key generated"}
                            readOnly
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-700"
                            aria-label="API Key"
                            title="Your API key for programmatic access"
                          />
                        </div>
                        <Button
                          variant="outline"
                          onClick={() => setShowApiKey(!showApiKey)}
                          leftIcon={
                            showApiKey ? (
                              <EyeSlashIcon className="h-4 w-4" />
                            ) : (
                              <EyeIcon className="h-4 w-4" />
                            )
                          }
                        >
                          {showApiKey ? "Hide" : "Show"}
                        </Button>
                        <Button
                          onClick={generateApiKey}
                          loading={saving}
                          leftIcon={<KeyIcon className="h-4 w-4" />}
                        >
                          Generate New Key
                        </Button>
                      </div>

                      {apiKey && (
                        <p className="text-xs text-yellow-600">
                          ⚠️ Store this key securely. It won't be shown again
                          after you leave this page.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Security Preferences */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Security Preferences
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-700">
                            Login Notifications
                          </p>
                          <p className="text-sm text-gray-500">
                            Get notified when someone logs into your account
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={security.loginNotifications}
                            onChange={(e) =>
                              setSecurity({
                                ...security,
                                loginNotifications: e.target.checked,
                              })
                            }
                            className="sr-only peer"
                            aria-label="Enable login notifications"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Session Timeout (minutes)
                        </label>
                        <select
                          value={security.sessionTimeout}
                          onChange={(e) =>
                            setSecurity({
                              ...security,
                              sessionTimeout: parseInt(e.target.value),
                            })
                          }
                          className="w-48 px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          aria-label="Select session timeout duration"
                        >
                          <option value={15}>15 minutes</option>
                          <option value={30}>30 minutes</option>
                          <option value={60}>1 hour</option>
                          <option value={120}>2 hours</option>
                          <option value={240}>4 hours</option>
                          <option value={480}>8 hours</option>
                        </select>
                      </div>
                    </div>

                    <div className="mt-6">
                      <Button onClick={handleSecurityUpdate} loading={saving}>
                        Save Security Settings
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === "notifications" && (
                <div className="p-6">
                  <div className="flex items-center space-x-3 mb-6">
                    <BellIcon className="h-6 w-6 text-blue-600" />
                    <h2 className="text-xl font-semibold text-gray-900">
                      Notification Preferences
                    </h2>
                  </div>

                  <div className="space-y-8">
                    {/* Email Notifications */}
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                        <EnvelopeIcon className="h-5 w-5 mr-2" />
                        Email Notifications
                      </h3>
                      <div className="space-y-4">
                        {Object.entries(notifications.emailNotifications).map(
                          ([key, value]) => (
                            <div
                              key={key}
                              className="flex items-center justify-between"
                            >
                              <div>
                                <p className="text-sm font-medium text-gray-700 capitalize">
                                  {key.replace(/([A-Z])/g, " $1").trim()}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {key === "analysisComplete" &&
                                    "Get notified when your cartel analysis is complete"}
                                  {key === "reportGenerated" &&
                                    "Get notified when your reports are ready"}
                                  {key === "highRiskDetected" &&
                                    "Get alerted when high-risk cartels are detected"}
                                  {key === "weeklyDigest" &&
                                    "Receive a weekly summary of your activity"}
                                  {key === "securityAlerts" &&
                                    "Get notified about important security events"}
                                </p>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={value}
                                  onChange={(e) =>
                                    setNotifications({
                                      ...notifications,
                                      emailNotifications: {
                                        ...notifications.emailNotifications,
                                        [key]: e.target.checked,
                                      },
                                    })
                                  }
                                  className="sr-only peer"
                                  aria-label={`Enable email notifications for ${key.replace(/([A-Z])/g, " $1").trim()}`}
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                              </label>
                            </div>
                          )
                        )}
                      </div>
                    </div>

                    {/* Push Notifications */}
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                        <DevicePhoneMobileIcon className="h-5 w-5 mr-2" />
                        Push Notifications
                      </h3>
                      <div className="space-y-4">
                        {Object.entries(notifications.pushNotifications).map(
                          ([key, value]) => (
                            <div
                              key={key}
                              className="flex items-center justify-between"
                            >
                              <div>
                                <p className="text-sm font-medium text-gray-700 capitalize">
                                  {key.replace(/([A-Z])/g, " $1").trim()}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {key === "analysisComplete" &&
                                    "Browser notifications for completed analyses"}
                                  {key === "reportGenerated" &&
                                    "Browser notifications for generated reports"}
                                  {key === "highRiskDetected" &&
                                    "Browser notifications for high-risk detections"}
                                </p>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={value}
                                  onChange={(e) =>
                                    setNotifications({
                                      ...notifications,
                                      pushNotifications: {
                                        ...notifications.pushNotifications,
                                        [key]: e.target.checked,
                                      },
                                    })
                                  }
                                  className="sr-only peer"
                                  aria-label={`Enable push notifications for ${key.replace(/([A-Z])/g, " $1").trim()}`}
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                              </label>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-8">
                    <Button onClick={handleNotificationUpdate} loading={saving}>
                      Save Notification Settings
                    </Button>
                  </div>
                </div>
              )}

              {/* Preferences Tab */}
              {activeTab === "preferences" && (
                <div className="p-6">
                  <div className="flex items-center space-x-3 mb-6">
                    <Cog6ToothIcon className="h-6 w-6 text-blue-600" />
                    <h2 className="text-xl font-semibold text-gray-900">
                      Application Preferences
                    </h2>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">
                        Display Settings
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <label
                            htmlFor="theme-select"
                            className="block text-sm font-medium text-gray-700 mb-2"
                          >
                            Theme
                          </label>
                          <select
                            id="theme-select"
                            value={preferences.theme}
                            onChange={(e) =>
                              setPreferences({
                                ...preferences,
                                theme: e.target.value as
                                  | "light"
                                  | "dark"
                                  | "auto",
                              })
                            }
                            className="w-48 px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            aria-label="Select theme"
                          >
                            <option value="light">Light</option>
                            <option value="dark">Dark</option>
                            <option value="auto">Auto</option>
                          </select>
                        </div>

                        <div>
                          <label
                            htmlFor="date-format-select"
                            className="block text-sm font-medium text-gray-700 mb-2"
                          >
                            Date Format
                          </label>
                          <select
                            id="date-format-select"
                            value={preferences.dateFormat}
                            onChange={(e) =>
                              setPreferences({
                                ...preferences,
                                dateFormat: e.target.value,
                              })
                            }
                            className="w-48 px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            aria-label="Select date format"
                          >
                            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                          </select>
                        </div>

                        <div>
                          <label
                            htmlFor="items-per-page-select"
                            className="block text-sm font-medium text-gray-700 mb-2"
                          >
                            Items per page
                          </label>
                          <select
                            id="items-per-page-select"
                            value={preferences.itemsPerPage}
                            onChange={(e) =>
                              setPreferences({
                                ...preferences,
                                itemsPerPage: parseInt(e.target.value),
                              })
                            }
                            className="w-48 px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            aria-label="Select items per page"
                          >
                            <option value="10">10</option>
                            <option value="25">25</option>
                            <option value="50">50</option>
                            <option value="100">100</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">
                        Analysis Settings
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <label
                            htmlFor="analysis-period-select"
                            className="block text-sm font-medium text-gray-700 mb-2"
                          >
                            Default Analysis Period
                          </label>
                          <select
                            id="analysis-period-select"
                            value={preferences.defaultAnalysisPeriod}
                            onChange={(e) =>
                              setPreferences({
                                ...preferences,
                                defaultAnalysisPeriod: e.target.value,
                              })
                            }
                            className="w-48 px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            aria-label="Select default analysis period"
                          >
                            <option value="1y">1 Year</option>
                            <option value="2y">2 Years</option>
                            <option value="3y">3 Years</option>
                            <option value="5y">5 Years</option>
                          </select>
                        </div>

                        <div>
                          <label
                            htmlFor="risk-threshold-select"
                            className="block text-sm font-medium text-gray-700 mb-2"
                          >
                            Risk Threshold for Alerts
                          </label>
                          <select
                            id="risk-threshold-select"
                            value={preferences.riskThreshold}
                            onChange={(e) =>
                              setPreferences({
                                ...preferences,
                                riskThreshold: parseFloat(e.target.value),
                              })
                            }
                            className="w-48 px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            aria-label="Select risk threshold for alerts"
                          >
                            <option value="0.5">50%</option>
                            <option value="0.6">60%</option>
                            <option value="0.7">70%</option>
                            <option value="0.8">80%</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8">
                      <Button
                        onClick={handlePreferencesUpdate}
                        loading={saving}
                      >
                        Save Preferences
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Danger Zone Tab */}
              {activeTab === "danger" && (
                <div className="p-6">
                  <div className="flex items-center space-x-3 mb-6">
                    <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                    <h2 className="text-xl font-semibold text-gray-900">
                      Danger Zone
                    </h2>
                  </div>

                  <div className="space-y-6">
                    <div className="border border-red-200 rounded-lg p-6 bg-red-50">
                      <h3 className="text-lg font-medium text-red-900 mb-2">
                        Delete Account
                      </h3>
                      <p className="text-sm text-red-700 mb-4">
                        Once you delete your account, there is no going back.
                        Please be certain. This action will permanently delete:
                      </p>
                      <ul className="text-sm text-red-700 mb-4 space-y-1">
                        <li>• Your profile and account settings</li>
                        <li>• All searches and analysis results</li>
                        <li>• All projects and associated data</li>
                        <li>• All generated reports</li>
                        <li>• API keys and integrations</li>
                      </ul>
                      <Button
                        variant="danger"
                        onClick={handleAccountDeletion}
                        loading={saving}
                        leftIcon={<TrashIcon className="h-4 w-4" />}
                      >
                        Delete Account
                      </Button>
                    </div>

                    <div className="border border-yellow-200 rounded-lg p-6 bg-yellow-50">
                      <h3 className="text-lg font-medium text-yellow-900 mb-2">
                        Export Data
                      </h3>
                      <p className="text-sm text-yellow-700 mb-4">
                        Download a copy of all your data before deleting your
                        account.
                      </p>
                      <Button
                        variant="outline"
                        className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
                      >
                        Export All Data
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
