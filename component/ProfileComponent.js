"use client"

import { useState, useEffect } from "react"
import { 
  User, 
  Mail, 
  Phone, 
  Shield, 
  KeyRound, 
  Save, 
  Clock, 
  CalendarDays, 
  LockKeyhole
} from "lucide-react"
import toast from "react-hot-toast"
import BackButton from "@/lib/BackButton"
import Image from "next/image"

export default function ProfilePage({session}) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  // Mapped from your database object
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    mobile: "",
    role: "user",
    isBlocked: false,
    createdAt: "",
    lastLogin: "",
    lastPasswordChange: ""
  })

  const [passwords, setPasswords] = useState({
    newPassword: "",
    confirmPassword: ""
  })

  useEffect(() => {

  const fetchProfile = async () => {

    try {

      const res = await fetch(`/api/profile/${session.user.id}`)
      const data = await res.json()

      setProfile(data)
      setLoading(false)

    } catch (error) {

      toast.error("Failed to load profile")

    }

  }

  fetchProfile()

}, [session.user.id])

  const handleProfileChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value })
  }

  const handleSaveProfile = async (e) => {

  e.preventDefault()

  setSaving(true)

  try {

    const res = await fetch("/api/profile/update", {

      method: "PUT",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        id: session.user.id,
        name: profile.name,
        mobile: profile.mobile
      })

    })

    const data = await res.json()

    if (data.success) {

      toast.success("Profile updated successfully")

    } else {

      toast.error("Update failed")

    }

  } catch {

    toast.error("Server error")

  }

  setSaving(false)

}

 const handleUpdatePassword = async (e) => {

  e.preventDefault()

  if (passwords.newPassword !== passwords.confirmPassword) {
    return toast.error("Passwords do not match")
  }

  if (passwords.newPassword.length < 6) {
    return toast.error("Password must be at least 6 characters")
  }

  setSavingPassword(true)

  try {

    const res = await fetch("/api/profile/update/password", {

      method: "PUT",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        id: session.user.id,
        password: passwords.newPassword
      })

    })

    const data = await res.json()

    if (data.success) {

      toast.success("Password updated")

      setPasswords({
        newPassword: "",
        confirmPassword: ""
      })

    } else {

      toast.error("Password update failed")

    }

  } catch {

    toast.error("Server error")

  }

  setSavingPassword(false)

}

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-white p-4 md:p-8 font-sans">
        <div className="space-y-6 animate-pulse">
          
          {/* Header Skeleton */}
          <div className="w-24 h-9 bg-gray-100 rounded-xl"></div>
          <div>
            <div className="w-48 h-8 bg-gray-200 rounded-lg"></div>
            <div className="w-72 h-4 bg-gray-100 rounded-md mt-2"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* LEFT COLUMN SKELETON */}
            <div className="md:col-span-4 space-y-6">
              {/* User Summary Card */}
              <div className="bg-white rounded-[1rem] p-6 shadow-sm border border-gray-100 flex flex-col items-center text-center">
                <div className="w-24 h-24 bg-gray-200 rounded-full mb-4"></div>
                <div className="w-32 h-6 bg-gray-200 rounded-md mb-2"></div>
                <div className="w-48 h-4 bg-gray-100 rounded-md mb-4"></div>
                <div className="flex gap-2 w-full justify-center">
                  <div className="w-20 h-6 bg-gray-100 rounded-full"></div>
                  <div className="w-20 h-6 bg-gray-100 rounded-full"></div>
                </div>
              </div>

              {/* Account Activity Stats */}
              <div className="bg-white rounded-[1rem] p-6 shadow-sm border border-gray-100 space-y-6">
                <div className="w-32 h-4 bg-gray-200 rounded-md mb-2"></div>
                
                {/* 3 Stat Rows */}
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-9 h-9 bg-gray-100 rounded-lg shrink-0"></div>
                    <div className="space-y-2 w-full pt-1">
                      <div className="w-24 h-3 bg-gray-100 rounded-md"></div>
                      <div className="w-36 h-4 bg-gray-200 rounded-md"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT COLUMN SKELETON */}
            <div className="md:col-span-8 space-y-6">
              
              {/* Personal Info Form */}
              <div className="bg-white rounded-[1rem] p-6 lg:p-8 shadow-sm border border-gray-100">
                <div className="w-48 h-6 bg-gray-200 rounded-md mb-6"></div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* 4 Input Fields */}
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="space-y-2">
                      <div className="w-24 h-4 bg-gray-100 rounded-md"></div>
                      <div className="w-full h-[46px] bg-gray-50 border border-gray-100 rounded-xl"></div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 flex justify-end">
                  <div className="w-40 h-11 bg-gray-200 rounded-xl"></div>
                </div>
              </div>

              {/* Password Form */}
              <div className="bg-white rounded-[1rem] p-6 lg:p-8 shadow-sm border border-gray-100">
                <div className="w-48 h-6 bg-gray-200 rounded-md mb-6"></div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* 2 Input Fields */}
                  {[1, 2].map((i) => (
                    <div key={i} className="space-y-2">
                      <div className="w-32 h-4 bg-gray-100 rounded-md"></div>
                      <div className="w-full h-[46px] bg-gray-50 border border-gray-100 rounded-xl"></div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex justify-end">
                  <div className="w-44 h-11 bg-gray-100 rounded-xl"></div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    )
  }

  // Helper to format dates nicely
  const formatDate = (isoString) => {
    if (!isoString) return "N/A"
    return new Date(isoString).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
    })
  }

  return (
    <div className="min-h-screen w-full bg-white p-4 md:p-8 font-sans text-gray-800">
      <div className=" space-y-6">
        
        {/* Header */}
        <BackButton />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your profile details and security preferences.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* LEFT COLUMN: User Summary Card */}
          <div className="md:col-span-4 space-y-6">
            <div className="bg-white rounded-[1rem] p-6 shadow-sm border border-gray-100 flex flex-col items-center text-center">
                {session?.user?.role === 'admin' ?
              <Image src={'/own.avif'} height={128} width={128} alt="admin" className="rounded-full mb-3" />
              :<div className="w-24 h-24 bg-blue-50 text-blue-900 rounded-full flex items-center justify-center text-3xl font-bold mb-4 shadow-sm">
                {profile.name.charAt(0).toUpperCase()}
              </div> }
              <h2 className="text-xl font-semibold text-gray-900">{profile.name}</h2>
              <p className="text-sm text-gray-500 mb-4">{profile.email}</p>
              
              <div className="flex gap-2 w-full justify-center">
                <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${
                  profile.role === 'admin' ? 'bg-gray-50 text-gray-700 border-gray-200' : 'bg-blue-50 text-blue-700 border-blue-200'
                }`}>
                  {profile.role.toUpperCase()}
                </span>
                <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${
                  profile.isBlocked ? 'bg-red-50 text-red-600 border-red-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                }`}>
                  {profile.isBlocked ? 'BLOCKED' : 'ACTIVE'}
                </span>
              </div>
            </div>

            {/* Account Activity Stats */}
            <div className="bg-white rounded-[1rem] p-6 shadow-sm border border-gray-100 space-y-4">
              <h3 className="font-semibold text-gray-900 mb-2 text-sm uppercase tracking-wider">Account Activity</h3>
              
              <div className="flex items-start gap-3">
                <div className="p-2 bg-gray-50 rounded-lg text-gray-500"><Clock size={16} /></div>
                <div>
                  <p className="text-xs text-gray-500">Last Login</p>
                  <p className="text-sm font-medium text-gray-900">{formatDate(profile.lastLogin)}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-gray-50 rounded-lg text-gray-500"><CalendarDays size={16} /></div>
                <div>
                  <p className="text-xs text-gray-500">Member Since</p>
                  <p className="text-sm font-medium text-gray-900">{formatDate(profile.createdAt)}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-gray-50 rounded-lg text-gray-500"><LockKeyhole size={16} /></div>
                <div>
                  <p className="text-xs text-gray-500">Last Password Change</p>
                  <p className="text-sm font-medium text-gray-900">{formatDate(profile.lastPasswordChange)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Edit Forms */}
          <div className="md:col-span-8 space-y-6">
            
            {/* Personal Information Form */}
            <form onSubmit={handleSaveProfile} className="bg-white rounded-[1rem] p-6 lg:p-8 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <User className="text-gray-400" size={20} /> Personal Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Full Name (Editable) */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Full Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="name"
                      value={profile.name}
                      onChange={handleProfileChange}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all text-gray-900"
                      required
                    />
                  </div>
                </div>

                {/* Email (Read-Only) */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700 flex justify-between">
                    Email Address <span className="text-xs text-red-500 bg-red-50 px-2 py-0.5 rounded-full font-semibold">Locked</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      value={profile.email}
                      readOnly
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 bg-gray-50 rounded-xl text-gray-500 cursor-not-allowed select-none"
                    />
                  </div>
                </div>

                {/* Mobile (Editable) */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Mobile Number</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="tel"
                      name="mobile"
                      value={profile.mobile}
                      onChange={handleProfileChange}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all text-gray-900"
                    />
                  </div>
                </div>

                {/* Role (Editable) */}
                <div className="space-y-1.5">
                   <label className="text-sm font-medium text-gray-700 flex justify-between">
                    Role <span className="text-xs text-red-500 bg-red-50 px-2 py-0.5 rounded-full font-semibold">Locked</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Shield className="h-4 w-4 text-gray-400" />
                    </div>
                    <select
                      name="role"
                      value={profile.role}
                      readOnly
                      disabled
                      onChange={handleProfileChange}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 bg-gray-50 rounded-xl text-gray-500 cursor-not-allowed select-none"
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>

              </div>

              <div className="mt-8 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-medium rounded-xl transition-colors flex items-center gap-2 disabled:opacity-70"
                >
                  {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={18} />}
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>

            {/* Update Password Form */}
            <form onSubmit={handleUpdatePassword} className="bg-white rounded-[1rem] p-6 lg:p-8 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <KeyRound className="text-gray-400" size={20} /> Security & Password
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">New Password</label>
                  <input
                    type="password"
                    value={passwords.newPassword}
                    onChange={(e) => setPasswords({...passwords, newPassword: e.target.value})}
                    placeholder="Enter new password"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Confirm Password</label>
                  <input
                    type="password"
                    value={passwords.confirmPassword}
                    onChange={(e) => setPasswords({...passwords, confirmPassword: e.target.value})}
                    placeholder="Confirm new password"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="submit"
                  disabled={savingPassword || !passwords.newPassword}
                  className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {savingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>

          </div>
        </div>
      </div>
    </div>
  )
}