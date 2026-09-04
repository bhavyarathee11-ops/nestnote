'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { formatDistanceToNow } from 'date-fns'
import { Plus, Clock, CheckCircle, AlertCircle, FileText } from 'lucide-react'
import EmptyState from '@/components/EmptyState'

interface Assignment {
  id: string
  title: string
  subject: string
  branch: string
  semester: number
  deadline: string
  submissions: Array<{ status: string }>
}

export default function TeacherDashboard() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ total: 0, pending: 0, upcoming: 0 })
  const supabase = createClient()

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: teacherData } = await supabase
          .from('teachers')
          .select('id')
          .eq('id', user.id)
          .single()

        if (!teacherData) return

        const { data: assignmentsData } = await supabase
          .from('assignments')
          .select(`
            *,
            submissions(id, status)
          `)
          .eq('teacher_id', teacherData.id)
          .order('created_at', { ascending: false })

        if (assignmentsData) {
          setAssignments(assignmentsData)
          
          const now = new Date()
          const total = assignmentsData.length
          const pending = assignmentsData.reduce((acc, a) => 
            acc + a.submissions.filter(s => s.status === 'pending').length, 0
          )
          const upcoming = assignmentsData.filter(a => 
            new Date(a.deadline) > now
          ).length

          setStats({ total, pending, upcoming })
        }
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-secondary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Teacher Dashboard</h1>
          <p className="text-muted-foreground">Manage your assignments and review submissions</p>
        </div>
        <Link
          href="/teacher/assignments/new"
          className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-2xl font-semibold hover:shadow-lg transition-all hover:scale-105"
        >
          <Plus className="w-5 h-5" />
          New Assignment
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Assignments</p>
              <p className="text-3xl font-bold">{stats.total}</p>
            </div>
            <FileText className="w-8 h-8 text-primary/60" />
          </div>
        </div>
        <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pending Reviews</p>
              <p className="text-3xl font-bold">{stats.pending}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-500/60" />
          </div>
        </div>
        <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Upcoming Deadlines</p>
              <p className="text-3xl font-bold">{stats.upcoming}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-orange-500/60" />
          </div>
        </div>
      </div>

      {assignments.length === 0 ? (
        <EmptyState
          title="No assignments yet"
          description="Create your first assignment to get started."
          icon="file"
        />
      ) : (
        <div className="grid gap-4">
          {assignments.map((assignment) => {
            const pendingCount = assignment.submissions.filter(s => s.status === 'pending').length
            const totalSubmissions = assignment.submissions.length
            
            return (
              <Link
                key={assignment.id}
                href={`/teacher/assignments/${assignment.id}`}
                className="block bg-card rounded-2xl p-6 shadow-sm hover:shadow-md transition-all hover:scale-[1.02] border border-border hover:border-secondary/20"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold">{assignment.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {assignment.subject} • {assignment.branch} • Semester {assignment.semester}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Due {formatDistanceToNow(new Date(assignment.deadline), { addSuffix: true })}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="text-center">
                      <p className="text-lg font-semibold">{totalSubmissions}</p>
                      <p className="text-xs text-muted-foreground">Submissions</p>
                    </div>
                    {pendingCount > 0 && (
                      <div className="text-center">
                        <p className="text-lg font-semibold text-yellow-500">{pendingCount}</p>
                        <p className="text-xs text-muted-foreground">Pending</p>
                      </div>
                    )}
                    <CheckCircle className={`w-5 h-5 ${totalSubmissions > 0 && pendingCount === 0 ? 'text-green-500' : 'text-muted-foreground'}`} />
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}