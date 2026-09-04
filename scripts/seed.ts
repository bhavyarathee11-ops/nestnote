import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    }
  }
)

async function seed() {
  console.log('🌱 Seeding database...')

  const users = [
    { email: 'teacher1@nestnote.com', password: 'password123', role: 'teacher' },
    { email: 'teacher2@nestnote.com', password: 'password123', role: 'teacher' },
    { email: 'student1@nestnote.com', password: 'password123', role: 'student' },
    { email: 'student2@nestnote.com', password: 'password123', role: 'student' },
    { email: 'student3@nestnote.com', password: 'password123', role: 'student' },
    { email: 'student4@nestnote.com', password: 'password123', role: 'student' },
  ]

  const userIds: Record<string, string> = {}

  for (const user of users) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
    })
    
    if (error) {
      console.error(`Error creating ${user.email}:`, error.message)
    } else if (data.user) {
      userIds[user.email] = data.user.id
      console.log(`✅ Created user: ${user.email}`)
    }
  }

  const teacher1Id = userIds['teacher1@nestnote.com']
  const teacher2Id = userIds['teacher2@nestnote.com']

  if (teacher1Id) {
    await supabase
      .from('teachers')
      .insert({
        id: teacher1Id,
        full_name: 'Dr. Sarah Johnson',
        department: 'Computer Science',
        subjects_taught: ['Data Structures', 'Algorithms', 'Database Systems']
      })
    console.log('✅ Created teacher: Dr. Sarah Johnson')
  }

  if (teacher2Id) {
    await supabase
      .from('teachers')
      .insert({
        id: teacher2Id,
        full_name: 'Prof. Michael Chen',
        department: 'Computer Science',
        subjects_taught: ['Web Development', 'Mobile Apps', 'Software Engineering']
      })
    console.log('✅ Created teacher: Prof. Michael Chen')
  }

  const student1Id = userIds['student1@nestnote.com']
  const student2Id = userIds['student2@nestnote.com']
  const student3Id = userIds['student3@nestnote.com']
  const student4Id = userIds['student4@nestnote.com']

  const students = [
    { id: student1Id, full_name: 'Alice Wang', roll_no: 'CS2023001', branch: 'Computer Science', semester: 5 },
    { id: student2Id, full_name: 'Bob Patel', roll_no: 'CS2023002', branch: 'Computer Science', semester: 5 },
    { id: student3Id, full_name: 'Carol Davis', roll_no: 'CS2023003', branch: 'Information Technology', semester: 3 },
    { id: student4Id, full_name: 'David Kim', roll_no: 'CS2023004', branch: 'Information Technology', semester: 3 },
  ]

  for (const student of students) {
    if (student.id) {
      await supabase
        .from('students')
        .insert(student)
      console.log(`✅ Created student: ${student.full_name}`)
    }
  }

  if (teacher1Id) {
    const assignments = [
      {
        teacher_id: teacher1Id,
        title: 'Binary Tree Implementation',
        description: 'Implement a binary search tree with insert, delete, and traversal operations. Include detailed comments and test cases.',
        branch: 'Computer Science',
        semester: 5,
        subject: 'Data Structures',
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        file_url: 'https://example.com/sample-assignment.pdf'
      },
      {
        teacher_id: teacher1Id,
        title: 'SQL Query Optimization',
        description: 'Write optimized SQL queries for the given database schema. Explain your optimization strategies.',
        branch: 'Computer Science',
        semester: 5,
        subject: 'Database Systems',
        deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        file_url: 'https://example.com/sample-assignment2.pdf'
      },
    ]

    for (const assignment of assignments) {
      const { data, error } = await supabase
        .from('assignments')
        .insert(assignment)
        .select()
        .single()
      
      if (error) {
        console.error('Error creating assignment:', error)
      } else if (data) {
        console.log(`✅ Created assignment: ${data.title}`)
        
        if (student1Id && student2Id) {
          const submissions = [
            {
              assignment_id: data.id,
              student_id: student1Id,
              file_url: 'https://example.com/submission1.pdf',
              status: 'approved',
              feedback: 'Great work! Excellent implementation.',
              submitted_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
              reviewed_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
              assignment_id: data.id,
              student_id: student2Id,
              file_url: 'https://example.com/submission2.pdf',
              status: 'pending',
              submitted_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
            }
          ]

          for (const submission of submissions) {
            await supabase
              .from('submissions')
              .insert(submission)
            console.log(`✅ Created submission for ${assignment.title}`)
          }
        }
      }
    }
  }

  if (teacher2Id) {
    const assignment = {
      teacher_id: teacher2Id,
      title: 'React Component Library',
      description: 'Build a reusable component library with 5+ components. Include documentation and example usage.',
      branch: 'Information Technology',
      semester: 3,
      subject: 'Web Development',
      deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
      file_url: 'https://example.com/sample-assignment3.pdf'
    }

    const { data, error } = await supabase
      .from('assignments')
      .insert(assignment)
      .select()
      .single()
    
    if (error) {
      console.error('Error creating assignment:', error)
    } else if (data) {
      console.log(`✅ Created assignment: ${data.title}`)
    }
  }

  console.log('✅ Seeding complete!')
}

seed().catch(console.error)