'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatDistanceToNow, format } from 'date-fns'
import { Clock, Calendar, Download, FileText, User, CheckCircle, AlertCircle } from 'lucide-react'
import FileUpload from '@/components/FileUpload'
import LoadingSpinner from '@/components/LoadingSpinner'

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
    file_url: string
    status: 'pending' | 'approved' | 'rejected'
    feedback: string
    submitted_at: string
    reviewed_at: string
  }
}

export default function StudentAssignmentDetail() {
  const params = useParams()
  const router = useRouter()
  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  useEffect(() => {
    const loadAssignment = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/login/student')
          return
        }

        const { data, error } = await supabase
          .from('assignments')
          .select(`
            *,
            teacher:teachers(full_name),
            submission:submissions!submissions_assignment_id_fkey(
              id,
              file_url,
              status,
              feedback,
              submitted_at,
              reviewed_at
            )
          `)
          .eq('id', params.id)
          .single()

        if (error) throw error
        if (!data) {
          router.push('/student/dashboard')
          return
        }

        setAssignment(data)
      } catch (err) {
        console.error('Error loading assignment:', err)
        setError('Failed to load assignment')
      } finally {
        setLoading(false)
      }
    }

    loadAssignment()
  }, [params.id, router, supabase])

  const handleSubmit = async (fileUrl: string) => {
    if (!assignment) return
    setSubmitting(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Please login')

      const { data: student } = await supabase
        .from('students')
        .select('id')
        .eq('id', user.id)
        .single()

      if (!student) throw new Error('Student not found')

      const { error } = await supabase
        .from('submissions')
        .upsert({
          assignment_id: assignment.id,
          student_id: student.id,
          file_url: fileUrl,
          status: 'pending',
          submitted_at: new Date().toISOString()
        })

      if (error) throw error

      // Refresh to show updated submission
      window.location.reload()
    } catch (err) {
      console.error('Error submitting:', err)
      setError('Failed to submit assignment')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    )
  }

  if (error || !assignment) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-destructive/10 text-destructive p-6 rounded-2xl text-center">
          <p className="text-lg font-semibold">Error loading assignment</p>
          <p className="text-sm">{error || 'Assignment not found'}</p>
        </div>
      </div>
    )
  }

  const isDeadlinePassed = new Date(assignment.deadline) < new Date()
  const canSubmit = !isDeadlinePassed && !assignment.submission

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
      <div className="bg-card rounded-2xl p-6 shadow-sm border border-border mb-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">{assignment.title}</h1>
            <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <User className="w-4 h-4" />
                {assignment.teacher.full_name}
              </span>
              <span className="flex items-center gap-1">
                <FileText className="w-4 h-4" />
                {assignment.subject}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {assignment.branch} • Semester {assignment.semester}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-muted rounded-xl">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">
              Due {formatDistanceToNow(new Date(assignment.deadline), { addSuffix: true })}
            </span>
          </div>
        </div>

        <div className="prose max-w-none mb-6">
          <p className="text-foreground/80 whitespace-pre-wrap">{assignment.description}</p>
        </div>

        {assignment.file_url && (
          <a
            href={assignment.file_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition-colors"
          >
            <Download className="w-4 h-4" />
            Download Assignment File
          </a>
        )}
      </div>

      {/* Submission Section */}
      <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
        <h2 className="text-xl font-semibold mb-4">Your Submission</h2>
        
        {assignment.submission ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${
                assignment.submission.status === 'approved' ? 'bg-green-500/10' :
                assignment.submission.status === 'rejected' ? 'bg-destructive/10' :
                'bg-yellow-500/10'
              }`}>
                {assignment.submission.status === 'approved' && <CheckCircle className="w-6 h-6 text-green-500" />}
                {assignment.submission.status === 'rejected' && <AlertCircle className="w-6 h-6 text-destructive" />}
                {assignment.submission.status === 'pending' && <Clock className="w-6 h-6 text-yellow-500" />}
              </div>
              <div>
                <p className="font-medium capitalize">{assignment.submission.status}</p>
                <p className="text-sm text-muted-foreground">
                  Submitted {formatDistanceToNow(new Date(assignment.submission.submitted_at), { addSuffix: true })}
                </p>
              </div>
            </div>

            {assignment.submission.file_url && (
              <a
                href={assignment.submission.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-muted rounded-xl hover:bg-muted/80 transition-colors"
              >
                <FileText className="w-4 h-4" />
                View Your Submission
              </a>
            )}

            {assignment.submission.feedback && (
              <div className="bg-muted/50 p-4 rounded-xl">
                <p className="font-medium mb-1">Teacher Feedback</p>
                <p className="text-sm text-foreground/80">{assignment.submission.feedback}</p>
              </div>
            )}
          </div>
        ) : isDeadlinePassed ? (
          <div className="text-center py-8">
            <Clock className="w-12 h-12 mx-auto text-destructive/50 mb-4" />
            <p className="text-lg font-medium text-destructive">Deadline Passed</p>
            <p className="text-sm text-muted-foreground">You can no longer submit this assignment</p>
          </div>
        ) : (
          <div>
            <p className="text-sm text-muted-foreground mb-4">
              Submit your work before the deadline. Accepted formats: PDF, DOC, DOCX, PNG, JPG (max 10MB)
            </p>
            <FileUpload
              bucket="submission-files"
              onUploadComplete={handleSubmit}
              onError={(err) => setError(err.message)}
            />
          </div>
        )}
      </div>
    </div>
  )
}