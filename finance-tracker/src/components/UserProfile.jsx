import { useState, useEffect, useRef } from 'react'
import { User, Edit2, Save, X, Mail, Calendar, Trophy, TrendingUp, Camera, Trash2, Upload } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'
import { format } from 'date-fns'

export default function UserProfile() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [userStats, setUserStats] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [uploading, setUploading] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    loadUserProfile()
  }, [user])

  async function loadUserProfile() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      
      if (data) {
        setUserStats(data)
        setUsername(data.username || '')
        setAvatarUrl(data.avatar_url || null)
      } else {
        // Initialize if doesn't exist
        const { data: newStats, error: insertError } = await supabase
          .from('user_stats')
          .insert({
            user_id: user.id,
            username: user.email?.split('@')[0] || 'User',
            total_points: 0,
            level: 1
          })
          .select()
          .single()

        if (insertError) throw insertError
        setUserStats(newStats)
        setUsername(newStats.username)
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveUsername() {
    if (!username.trim()) {
      setMessage(t('usernameRequired'))
      return
    }

    try {
      setSaving(true)
      setMessage('')

      const { error } = await supabase
        .from('user_stats')
        .update({ username: username.trim() })
        .eq('user_id', user.id)

      if (error) throw error

      setMessage(t('usernameSaved'))
      setIsEditing(false)
      loadUserProfile()
      
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      console.error('Error saving username:', error)
      if (error.code === '23505') {
        setMessage(t('usernameAlreadyTaken'))
      } else {
        setMessage(t('errorSavingUsername'))
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleAvatarUpload(event) {
    try {
      setUploading(true)
      setMessage('')

      const file = event.target.files?.[0]
      if (!file) return

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setMessage(t('invalidFileType'))
        return
      }

      // Validate file size (15MB)
      if (file.size > 15 * 1024 * 1024) {
        setMessage(t('fileTooLarge'))
        return
      }

      // Delete old avatar if exists
      if (avatarUrl) {
        const oldPath = avatarUrl.split('/').pop()
        await supabase.storage.from('avatars').remove([`${user.id}/${oldPath}`])
      }

      // Upload new avatar
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `${user.id}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      // Update database
      const { error: updateError } = await supabase
        .from('user_stats')
        .update({ avatar_url: publicUrl })
        .eq('user_id', user.id)

      if (updateError) throw updateError

      setAvatarUrl(publicUrl)
      setMessage(t('avatarUpdated'))
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      console.error('Error uploading avatar:', error)
      setMessage(t('errorUploadingAvatar'))
    } finally {
      setUploading(false)
    }
  }

  async function handleDeleteAvatar() {
    if (!confirm(t('confirmDeleteAvatar'))) return

    try {
      setUploading(true)
      setMessage('')

      if (avatarUrl) {
        const oldPath = avatarUrl.split('/').pop()
        await supabase.storage.from('avatars').remove([`${user.id}/${oldPath}`])
      }

      const { error } = await supabase
        .from('user_stats')
        .update({ avatar_url: null })
        .eq('user_id', user.id)

      if (error) throw error

      setAvatarUrl(null)
      setMessage(t('avatarDeleted'))
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      console.error('Error deleting avatar:', error)
      setMessage(t('errorDeletingAvatar'))
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-20 bg-gray-100 rounded"></div>
        </div>
      </div>
    )
  }

  const memberSince = user?.created_at ? new Date(user.created_at) : new Date()

  return (
    <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-xl shadow-lg p-4 sm:p-6 lg:p-8 border-2 border-indigo-200">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-3 rounded-full">
            <User className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{t('userProfile')}</h2>
            <p className="text-xs sm:text-sm text-gray-600">{t('manageYourProfile')}</p>
          </div>
        </div>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${
          message.includes(t('saved')) || message.includes(t('Saved'))
            ? 'bg-green-100 text-green-800 border border-green-200'
            : 'bg-red-100 text-red-800 border border-red-200'
        }`}>
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Profile Picture Section */}
        <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-gray-200 lg:col-span-2">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <Camera className="w-5 h-5 text-indigo-600" />
            <span>{t('profilePicture')}</span>
          </h3>

          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Avatar Display */}
            <div className="relative">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-indigo-200 shadow-lg bg-gradient-to-br from-indigo-100 to-purple-100">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="w-16 h-16 text-indigo-400" />
                  </div>
                )}
              </div>
              {avatarUrl && (
                <button
                  onClick={handleDeleteAvatar}
                  disabled={uploading}
                  className="absolute -bottom-2 -right-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-lg transition disabled:opacity-50"
                  title={t('deleteAvatar')}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Upload Controls */}
            <div className="flex-1 text-center sm:text-left">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg transition disabled:opacity-50 shadow-md"
              >
                {uploading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>{t('uploading')}</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    <span>{avatarUrl ? t('changePhoto') : t('uploadPhoto')}</span>
                  </>
                )}
              </button>
              <p className="text-xs text-gray-500 mt-2">
                {t('photoRequirements')}
              </p>
            </div>
          </div>
        </div>

        {/* Username Section */}
        <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
              <User className="w-5 h-5 text-indigo-600" />
              <span>{t('username')}</span>
            </h3>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="text-indigo-600 hover:text-indigo-700 transition"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-3">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                placeholder={t('enterUsername')}
                maxLength={30}
              />
              <div className="flex space-x-2">
                <button
                  onClick={handleSaveUsername}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? t('saving') : t('save')}</span>
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false)
                    setUsername(userStats?.username || '')
                    setMessage('')
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-2xl font-bold text-indigo-600">{userStats?.username || 'User'}</p>
              <p className="text-xs text-gray-500 mt-1">{t('displayedOnLeaderboard')}</p>
            </div>
          )}
        </div>

        {/* Email Section */}
        <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <Mail className="w-5 h-5 text-indigo-600" />
            <span>{t('email')}</span>
          </h3>
          <p className="text-lg text-gray-700 break-all">{user?.email}</p>
          <p className="text-xs text-gray-500 mt-1">{t('cannotChangeEmail')}</p>
        </div>

        {/* Member Since */}
        <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-indigo-600" />
            <span>{t('memberSince')}</span>
          </h3>
          <p className="text-2xl font-bold text-gray-900">
            {format(memberSince, 'MMM dd, yyyy')}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {Math.floor((new Date() - memberSince) / (1000 * 60 * 60 * 24))} {t('daysAgo')}
          </p>
        </div>

        {/* Stats Summary */}
        <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <Trophy className="w-5 h-5 text-yellow-600" />
            <span>{t('yourStats')}</span>
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">{t('level')}</span>
              <span className="text-lg font-bold text-indigo-600">{userStats?.level || 1}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">{t('totalPoints')}</span>
              <span className="text-lg font-bold text-yellow-600">
                {(userStats?.total_points || 0).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">{t('currentStreak')}</span>
              <span className="text-lg font-bold text-orange-600">
                {userStats?.current_streak || 0} 🔥
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Tips */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <TrendingUp className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-blue-900 mb-1">{t('profileTip')}</h4>
            <p className="text-sm text-blue-700">{t('profileTipDesc')}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
