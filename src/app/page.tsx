'use client'

import Link from 'next/link'
import { FileText, Clock, CheckCircle } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen animate-fade-in">
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-6 tracking-tight">
            <span className="text-primary">NestNote</span>
            <br />
            A calmer way to manage
            <br />
            college assignments
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed">
            Replace scattered WhatsApp groups, emails, and PDFs with one structured workflow. 
            Teachers upload, students submit, and everyone stays organized.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/login/student"
              className="px-8 py-4 bg-primary text-primary-foreground rounded-2xl font-semibold hover:shadow-lg transition-all hover:scale-105"
            >
              Login as Student
            </Link>
            <Link
              href="/login/teacher"
              className="px-8 py-4 bg-secondary text-secondary-foreground rounded-2xl font-semibold hover:shadow-lg transition-all hover:scale-105"
            >
              Login as Teacher
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-card/50">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-background shadow-sm">
              <FileText className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Structured Assignments</h3>
              <p className="text-muted-foreground">
                Teachers upload assignments tagged by branch, semester, and subject.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-background shadow-sm">
              <Clock className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Deadline Tracking</h3>
              <p className="text-muted-foreground">
                Color-coded badges show upcoming, urgent, and overdue deadlines.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-background shadow-sm">
              <CheckCircle className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Review & Feedback</h3>
              <p className="text-muted-foreground">
                Teachers approve or reject submissions with feedback.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}