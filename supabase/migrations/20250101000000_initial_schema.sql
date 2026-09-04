-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- STUDENTS (their own isolated table)
CREATE TABLE students (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  roll_no TEXT NOT NULL,
  branch TEXT NOT NULL,
  semester INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TEACHERS (their own isolated table, zero overlap with students)
CREATE TABLE teachers (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  department TEXT NOT NULL,
  subjects_taught TEXT[] NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ASSIGNMENTS (created by teachers)
CREATE TABLE assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  branch TEXT NOT NULL,
  semester INT NOT NULL,
  subject TEXT NOT NULL,
  file_url TEXT,
  deadline TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SUBMISSIONS (created by students, linked to assignments)
CREATE TABLE submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  feedback TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

-- Create indexes for performance
CREATE INDEX idx_assignments_branch_semester ON assignments(branch, semester);
CREATE INDEX idx_submissions_student_id ON submissions(student_id);
CREATE INDEX idx_submissions_assignment_id ON submissions(assignment_id);

-- Enable Row Level Security
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- STUDENTS POLICIES
CREATE POLICY "Students can view their own data"
  ON students FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Students can update their own data"
  ON students FOR UPDATE
  USING (id = auth.uid());

-- TEACHERS POLICIES
CREATE POLICY "Teachers can view their own data"
  ON teachers FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Teachers can update their own data"
  ON teachers FOR UPDATE
  USING (id = auth.uid());

-- ASSIGNMENTS POLICIES
CREATE POLICY "Teachers can manage their assignments"
  ON assignments FOR ALL
  USING (teacher_id = auth.uid());

CREATE POLICY "Students can view relevant assignments"
  ON assignments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = auth.uid()
      AND students.branch = assignments.branch
      AND students.semester = assignments.semester
    )
  );

-- SUBMISSIONS POLICIES
CREATE POLICY "Students can manage their submissions"
  ON submissions FOR ALL
  USING (student_id = auth.uid());

CREATE POLICY "Teachers can view submissions for their assignments"
  ON submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM assignments
      WHERE assignments.id = submissions.assignment_id
      AND assignments.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can update submissions for their assignments"
  ON submissions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM assignments
      WHERE assignments.id = submissions.assignment_id
      AND assignments.teacher_id = auth.uid()
    )
  );