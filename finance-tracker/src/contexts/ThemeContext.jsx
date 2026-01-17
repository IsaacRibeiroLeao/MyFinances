import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

const ThemeContext = createContext()

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}

const DEFAULT_THEME = {
  name: 'Default',
  colors: {
    primary: '#4F46E5',    // Indigo
    secondary: '#7C3AED',  // Purple
    accent: '#EC4899'      // Pink
  }
}

const THEMES = {
  default: DEFAULT_THEME,
  ocean: {
    name: 'Ocean',
    colors: {
      primary: '#0EA5E9',
      secondary: '#06B6D4',
      accent: '#3B82F6'
    }
  },
  sunset: {
    name: 'Sunset',
    colors: {
      primary: '#F59E0B',
      secondary: '#EF4444',
      accent: '#EC4899'
    }
  },
  forest: {
    name: 'Forest',
    colors: {
      primary: '#10B981',
      secondary: '#059669',
      accent: '#34D399'
    }
  }
}

export function ThemeProvider({ children }) {
  const { user } = useAuth()
  const [currentTheme, setCurrentTheme] = useState(DEFAULT_THEME)
  const [equippedFrame, setEquippedFrame] = useState(null)
  const [equippedBadge, setEquippedBadge] = useState(null)
  const [equippedTitle, setEquippedTitle] = useState(null)

  useEffect(() => {
    if (user) {
      loadUserCustomization()
    }
  }, [user])

  async function loadUserCustomization() {
    try {
      // Load equipped items from inventory
      const { data, error } = await supabase
        .from('user_inventory')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_equipped', true)

      if (error) throw error

      if (data) {
        data.forEach(item => {
          switch (item.item_type) {
            case 'theme':
              const themeName = item.item_data.theme_id
              if (THEMES[themeName]) {
                setCurrentTheme(THEMES[themeName])
              }
              break
            case 'frame':
              setEquippedFrame(item.item_data)
              break
            case 'badge':
              setEquippedBadge(item.item_data)
              break
            case 'title':
              setEquippedTitle(item.item_data)
              break
          }
        })
      }
    } catch (error) {
      console.error('Error loading customization:', error)
    }
  }

  async function equipItem(itemType, itemData) {
    try {
      // Unequip current item of this type
      await supabase
        .from('user_inventory')
        .update({ is_equipped: false })
        .eq('user_id', user.id)
        .eq('item_type', itemType)

      // Check if item exists in inventory
      const { data: existing } = await supabase
        .from('user_inventory')
        .select('id')
        .eq('user_id', user.id)
        .eq('item_type', itemType)
        .eq('item_data', 'item_data', itemData)
        .single()

      if (existing) {
        // Update existing
        await supabase
          .from('user_inventory')
          .update({ is_equipped: true })
          .eq('id', existing.id)
      } else {
        // Insert new
        await supabase
          .from('user_inventory')
          .insert({
            user_id: user.id,
            item_type: itemType,
            item_data: itemData,
            is_equipped: true
          })
      }

      // Update local state
      switch (itemType) {
        case 'theme':
          const themeName = itemData.theme_id
          if (THEMES[themeName]) {
            setCurrentTheme(THEMES[themeName])
          }
          break
        case 'frame':
          setEquippedFrame(itemData)
          break
        case 'badge':
          setEquippedBadge(itemData)
          break
        case 'title':
          setEquippedTitle(itemData)
          break
      }

      return { success: true }
    } catch (error) {
      console.error('Error equipping item:', error)
      return { success: false, error }
    }
  }

  async function unequipItem(itemType) {
    try {
      await supabase
        .from('user_inventory')
        .update({ is_equipped: false })
        .eq('user_id', user.id)
        .eq('item_type', itemType)

      // Reset to default
      switch (itemType) {
        case 'theme':
          setCurrentTheme(DEFAULT_THEME)
          break
        case 'frame':
          setEquippedFrame(null)
          break
        case 'badge':
          setEquippedBadge(null)
          break
        case 'title':
          setEquippedTitle(null)
          break
      }

      return { success: true }
    } catch (error) {
      console.error('Error unequipping item:', error)
      return { success: false, error }
    }
  }

  const value = {
    currentTheme,
    equippedFrame,
    equippedBadge,
    equippedTitle,
    equipItem,
    unequipItem,
    availableThemes: THEMES
  }

  return (
    <ThemeContext.Provider value={value}>
      <style>{`
        :root {
          --color-primary: ${currentTheme.colors.primary};
          --color-secondary: ${currentTheme.colors.secondary};
          --color-accent: ${currentTheme.colors.accent};
        }
      `}</style>
      {children}
    </ThemeContext.Provider>
  )
}
