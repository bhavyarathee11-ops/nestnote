'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { formatDistanceToNow, isPast, differenceInDays } from 'date-fns'
import { Clock, AlertCircle, CheckCircle, FileText } from 'lucide-react'
import EmptyState from '@/components/EmptyState'

interface Assignment {
  id: string
  title: string
  description: string
  branch: string
  semester: number
  subject: string
  file_url: string
  deadline: string
  created_at: string
  teacher: { full_name: string }
  submission?: {
    id: string
    status: 'pending' | 'approved' | 'rejected'
    submitted_at: string
  }
}

export default function StudentDashboard() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [student, setStudent] = useState<any>(null)
  const [filters, setFilters] = useState({ branch: '', semester: '', subject: '' })
  const [subjects, setSubjects] = useState<string[]>([])
  const supabase = createClient()

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: studentData } = await supabase
          .from('students')
          .select('*')
          .eq('id', user.id)
          .single()
        
        if (studentData) {
          setStudent(studentData)
          setFilters({
            branch: studentData.branch,
            semester: String(studentData.semester),
            subject: ''
          })
        }

        const { data: assignmentsData } = await supabase
          .from('assignments')
          .select(`
            *,
            teacher:teachers(full_name),
            submission:submissions!submissions_assignment_id_fkey(
              id,
              status,
              submitted_at
            )
          `)
          .eq('branch', studentData?.branch || '')
          .eq('semester', studentData?.semester || 0)
          .order('deadline', { ascending: true })

        if (assignmentsData) {
          setAssignments(assignmentsData)
          const uniqueSubjects = [...new Set(assignmentsData.map(a => a.subject))]
          setSubjects(uniqueSubjects)
        }
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const getDeadlineStatus = (deadline: string) => {
    const now = new Date()
    const deadlineDate = new Date(deadline)
    const daysUntil = differenceInDays(deadlineDate, now)
    
    if (isPast(deadlineDate)) return 'overdue'
    if (daysUntil <= 2) return 'urgent'
    return 'upcoming'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'overdue': return 'bg-destructive/10 text-destructive'
      case 'urgent': return 'bg-orange-500/10 text-orange-500'
      case 'upcoming': return 'bg-primary/10 text-primary'
      default: return 'bg-muted text-muted-foreground'
    }
  }

  const getSubmissionStatus = (submission?: Assignment['submission']) => {
    if (!submission) return { label: 'Not submitted', color: 'text-muted-foreground', icon: AlertCircle }
    switch (submission.status) {
      case 'pending': return { label: 'Pending review', color: 'text-yellow-500', icon: Clock }
      case 'approved': return { label: 'Approved ✓', color: 'text-green-500', icon: CheckCircle }
      case 'rejected': return { label: 'Rejected ✗', color: 'text-destructive', icon: AlertCircle }
      default: return { label: 'Unknown', color: 'text-muted-foreground', icon: AlertCircle }
    }
  }

  const filteredAssignments = assignments.filter(a => {
    if (filters.subject && a.subject !== filters.subject) return false
    return true
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground">Loading your assignments...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Your Assignments</h1>
        <p className="text-muted-foreground">
          {student?.branch} • Semester {student?.semester}
        </p>
      </div>

      <div className="flex flex-wrap gap-4 mb-8">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium mb-1">Branch</label>
          <input
            type="text"
            value={filters.branch}
            disabled
            className="w-full px-4 py-2 rounded-xl border border-border bg-muted/50 text-muted-foreground cursor-not-allowed"
          />
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium mb-1">Semester</label>
          <input
            type="text"
            value={filters.semester}
            disabled
            className="w-full px-4 py-2 rounded-xl border border-border bg-muted/50 text-muted-foreground cursor-not-allowed"
          />
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium mb-1">Subject</label>
          <select
            value={filters.subject}
            onChange={(e) => setFilters({ ...filters, subject: e.target.value })}
            className="w-full px-4 py-2 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary focus:outline-none transition-all"
          >
            <option value="">All Subjects</option>
            {subjects.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {filteredAssignments.length === 0 ? (
        <EmptyState
          title="No assignments yet"
          description="Check back later for new assignments from your teachers."
          icon="file"
        />
      ) : (
        <div className="grid gap-4">
          {filteredAssignments.map((assignment) => {
            const deadlineStatus = getDeadlineStatus(assignment.deadline)
            const submissionInfo = getSubmissionStatus(assignment.submission)
            
            return (
              <Link
                key={assignment.id}
                href={`/student/assignments/${assignment.id}`}
                className="block bg-card rounded-2xl p-6 shadow-sm hover:shadow-md transition-all hover:scale-[1.02] border border-border hover:border-primary/20"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-start gap-2 flex-wrap">
                      <h3 className="text-lg font-semibold truncate">{assignment.title}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor(deadlineStatus)}`}>
                        {deadlineStatus.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {assignment.subject} • {assignment.teacher.full_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Due {formatDistanceToNow(new Date(assignment.deadline), { addSuffix: true })}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className={`flex items-center gap-2 ${submissionInfo.color}`}>
                      <submissionInfo.icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{submissionInfo.label}</span>
                    </div>
                    <FileText className="w-5 h-5 text-muted-foreground" />
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