import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const coursesFile = formData.get('courses') as File
    const rasFile = formData.get('ras') as File

    if (!coursesFile || !rasFile) {
      return NextResponse.json({ error: 'Missing files' }, { status: 400 })
    }

    // Forward files to the external Python backend service
    const backendUrl = process.env.BACKEND_URL
    const apiKey = process.env.BACKEND_API_KEY

    if (!backendUrl) {
      return NextResponse.json({ error: 'Backend URL not configured' }, { status: 500 })
    }

    const externalForm = new FormData()
    externalForm.append('courses', coursesFile)
    externalForm.append('ras', rasFile)

    const resp = await fetch(`${backendUrl.replace(/\/$/, '')}/allocate`, {
      method: 'POST',
      body: externalForm,
      headers: apiKey ? { 'X-API-KEY': apiKey } : undefined
    })

    const json = await resp.json()
    if (!resp.ok) {
      return NextResponse.json({ error: 'Allocation service failed', details: json }, { status: 502 })
    }

    return NextResponse.json({
      allocations: json.allocations || [],
      unallocatedLabs: json.unallocatedLabs || []
    })

  } catch (err) {
    console.error('Error during allocation:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}