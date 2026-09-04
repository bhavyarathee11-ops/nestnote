'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LogOut, User, LayoutDashboard } from 'lucide-react'

export default function Navbar() {
  const [user, setUser] = useState<any>(null)
  const [role, setRole] = useState<'student' | 'teacher' | null>(null)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        
        const { data: student } = await supabase
          .from('students')
          .select('id')
          .eq('id', user.id)
          .single()
        
        if (student) {
          setRole('student')
        } else {
          const { data: teacher } = await supabase
            .from('teachers')
            .select('id')
            .eq('id', user.id)
            .single()
          if (teacher) setRole('teacher')
        }
      }
    }
    
    getUser()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (['/login/student', '/login/teacher', '/signup/student', '/signup/teacher'].includes(pathname)) {
    return null
  }

  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
      <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-primary">
          NestNote
        </Link>
        
        {user && role && (
          <div className="flex items-center gap-4">
            <Link
              href={role === 'student' ? '/student/dashboard' : '/teacher/dashboard'}
              className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-muted transition-colors"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>
            
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-muted transition-colors text-destructive"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}