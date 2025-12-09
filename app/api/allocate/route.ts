import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const coursesFile = formData.get('courses') as File
    const rasFile = formData.get('ras') as File

    if (!coursesFile || !rasFile) {
      return NextResponse.json({ error: 'Missing files' }, { status: 400 })
    }

    const backendUrl = process.env.BACKEND_URL
    const apiKey = process.env.BACKEND_API_KEY

    if (!backendUrl) {
      return NextResponse.json({ error: 'Backend URL not configured' }, { status: 500 })
    }

    // Build form for backend
    const externalForm = new FormData()
    externalForm.append('courses', coursesFile)
    externalForm.append('ras', rasFile)

    const resp = await fetch(`${backendUrl.replace(/\/$/, '')}/allocate`, {
      method: 'POST',
      body: externalForm,
      headers: apiKey ? { 'X-API-KEY': apiKey } : undefined
    })

    // Read raw text first (so we can debug HTML errors)
    const raw = await resp.text()

    let json
    try {
      json = JSON.parse(raw)
    } catch (e) {
      console.error("Backend returned non-JSON response:", raw)

      return NextResponse.json({
        error: "Backend returned invalid JSON",
        rawResponse: raw
      }, { status: 502 })
    }

    // Backend responded with JSON but not OK
    if (!resp.ok) {
      return NextResponse.json({
        error: 'Allocation service failed',
        details: json
      }, { status: 502 })
    }

    // Return successful allocation result
    return NextResponse.json({
      allocations: json.allocations || [],
      unallocatedLabs: json.unallocatedLabs || []
    })

  } catch (err) {
    console.error('Error during allocation:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
