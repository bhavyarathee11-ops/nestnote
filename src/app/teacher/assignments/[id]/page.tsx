'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatDistanceToNow, format } from 'date-fns'
import { ArrowLeft, CheckCircle, XCircle, Clock, User, FileText, Download } from 'lucide-react'
import Link from 'next/link'
import LoadingSpinner from '@/components/LoadingSpinner'

interface Submission {
  id: string
  file_url: string
  status: 'pending' | 'approved' | 'rejected'
  feedback: string
  submitted_at: string
  reviewed_at: string
  student: {
    full_name: string
    roll_no: string
    branch: string
    semester: number
  }
}

interface Assignment {
  id: string
  title: string
  description: string
  branch: string
  semester: number
  subject: string
  deadline: string
  submissions: Submission[]
}

export default function TeacherAssignmentReview() {
  const params = useParams()
  const router = useRouter()
  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reviewing, setReviewing] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{ [key: string]: string }>({})
  const supabase = createClient()

  useEffect(() => {
    const loadAssignment = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/login/teacher')
          return
        }

        const { data, error } = await supabase
          .from('assignments')
          .select(`
            *,
            submissions(
              id,
              file_url,
              status,
              feedback,
              submitted_at,
              reviewed_at,
              student:students(
                full_name,
                roll_no,
                branch,
                semester
              )
            )
          `)
          .eq('id', params.id)
          .single()

        if (error) throw error
        if (!data) {
          router.push('/teacher/dashboard')
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

  const handleReview = async (submissionId: string, status: 'approved' | 'rejected') => {
    setReviewing(submissionId)
    try {
      const { error } = await supabase
        .from('submissions')
        .update({
          status,
          feedback: feedback[submissionId] || '',
          reviewed_at: new Date().toISOString()
        })
        .eq('id', submissionId)

      if (error) throw error

      // Refresh to show updated status
      window.location.reload()
    } catch (err) {
      console.error('Error reviewing submission:', err)
      setError('Failed to review submission')
    } finally {
      setReviewing(null)
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

  const pendingSubmissions = assignment.submissions.filter(s => s.status === 'pending')
  const reviewedSubmissions = assignment.submissions.filter(s => s.status !== 'pending')

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-fade-in">
      <Link
        href="/teacher/dashboard"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </Link>

      <div className="bg-card rounded-2xl p-6 shadow-sm border border-border mb-6">
        <h1 className="text-3xl font-bold mb-2">{assignment.title}</h1>
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <span>{assignment.subject}</span>
          <span>{assignment.branch} • Semester {assignment.semester}</span>
          <span>Due {formatDistanceToNow(new Date(assignment.deadline), { addSuffix: true })}</span>
          <span className="font-medium">
            {assignment.submissions.length} submissions
          </span>
        </div>
      </div>

      {/* Pending Submissions */}
      {pendingSubmissions.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-yellow-500" />
            Pending Reviews ({pendingSubmissions.length})
          </h2>
          <div className="grid gap-4">
            {pendingSubmissions.map((submission) => (
              <div key={submission.id} className="bg-card rounded-2xl p-6 shadow-sm border border-border">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold">{submission.student.full_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {submission.student.roll_no} • {submission.student.branch} • Semester {submission.student.semester}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Submitted {formatDistanceToNow(new Date(submission.submitted_at), { addSuffix: true })}
                    </p>
                    {submission.file_url && (
                      <a
                        href={submission.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-2"
                      >
                        <Download className="w-3 h-3" />
                        Download Submission
                      </a>
                    )}
                  </div>
                  <div className="flex flex-col gap-3 w-full md:w-auto">
                    <textarea
                      placeholder="Add feedback (optional)"
                      value={feedback[submission.id] || ''}
                      onChange={(e) => setFeedback({ ...feedback, [submission.id]: e.target.value })}
                      className="w-full md:w-64 px-3 py-2 text-sm rounded-xl border border-input bg-background focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleReview(submission.id, 'approved')}
                        disabled={reviewing === submission.id}
                        className="flex-1 px-4 py-2 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {reviewing === submission.id ? <LoadingSpinner /> : <><CheckCircle className="w-4 h-4" /> Approve</>}
                      </button>
                      <button
                        onClick={() => handleReview(submission.id, 'rejected')}
                        disabled={reviewing === submission.id}
                        className="flex-1 px-4 py-2 bg-destructive text-destructive-foreground rounded-xl font-medium hover:bg-destructive/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {reviewing === submission.id ? <LoadingSpinner /> : <><XCircle className="w-4 h-4" /> Reject</>}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reviewed Submissions */}
      {reviewedSubmissions.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            Reviewed Submissions ({reviewedSubmissions.length})
          </h2>
          <div className="grid gap-4">
            {reviewedSubmissions.map((submission) => (
              <div key={submission.id} className="bg-card rounded-2xl p-6 shadow-sm border border-border">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{submission.student.full_name}</p>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        submission.status === 'approved' ? 'bg-green-500/10 text-green-500' : 'bg-destructive/10 text-destructive'
                      }`}>
                        {submission.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {submission.student.roll_no} • {submission.student.branch} • Semester {submission.student.semester}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Submitted {formatDistanceToNow(new Date(submission.submitted_at), { addSuffix: true })}
                    </p>
                    {submission.feedback && (
                      <div className="mt-2 p-3 bg-muted/50 rounded-xl">
                        <p className="text-sm font-medium">Feedback</p>
                        <p className="text-sm text-foreground/80">{submission.feedback}</p>
                      </div>
                    )}
                    {submission.file_url && (
                      <a
                        href={submission.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-2"
                      >
                        <Download className="w-3 h-3" />
                        Download Submission
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {assignment.submissions.length === 0 && (
        <div className="text-center py-12 bg-card rounded-2xl border border-border">
          <FileText className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-lg font-semibold mb-2">No submissions yet</p>
          <p className="text-muted-foreground">Students haven't submitted anything for this assignment</p>
        </div>
      )}
    </div>
  )
}