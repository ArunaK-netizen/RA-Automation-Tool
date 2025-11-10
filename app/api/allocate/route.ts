import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function POST(req: Request) {
  const tempDir = path.join(process.cwd(), 'temp')

  try {
    const formData = await req.formData()
    const coursesFile = formData.get('courses') as File
    const rasFile = formData.get('ras') as File

    if (!coursesFile || !rasFile) {
      return NextResponse.json({ error: 'Missing files' }, { status: 400 })
    }

    // 1. Create temporary directory
    await fs.mkdir(tempDir, { recursive: true })

    // 2. Save uploaded files
    const coursesPath = path.join(tempDir, 'courses.xlsx')
    const rasPath = path.join(tempDir, 'ras.xlsx')
    await fs.writeFile(coursesPath, Buffer.from(await coursesFile.arrayBuffer()))
    await fs.writeFile(rasPath, Buffer.from(await rasFile.arrayBuffer()))

    // 3. Create the L-to-Theory slot map file required by the script
    const slotMapPath = path.join(tempDir, 'l_to_slot_map.csv')
    let slotMapContent = ''
    const theories = ['A1', 'F1', 'D1', 'TB1', 'TG1', 'B1', 'G1', 'E1', 'TC1', 'TAA1',
                     'C1', 'V1', 'V2', 'D1', 'TE1', 'TCC1', 'E1', 'TA1', 'TF1', 'TD1',
                     'A2', 'F2', 'D2', 'TB2', 'TG2', 'B2', 'G2', 'E2', 'TC2', 'TAA2',
                     'C2', 'TD2', 'TBB2', 'D2', 'TE2', 'TCC2', 'E2', 'TA2', 'TF2', 'TDD2']
    for (let i = 1; i <= 160; i++) {
      slotMapContent += `L${i},${theories[i % theories.length]}\n`
    }
    await fs.writeFile(slotMapPath, slotMapContent)

    // 4. Run Python script
    const scriptPath = path.join(process.cwd(), 'scripts', 'run_allocation.py')
    // Ensure you have Python installed and pandas is available (pip install pandas)
    await execAsync(`python "${scriptPath}"`);

    // 5. Read the generated JSON file
    const outputFile = path.join(tempDir, 'allocations.json')
    const outputData = await fs.readFile(outputFile, 'utf-8')
    const result = JSON.parse(outputData)

    // 6. Return the data to the frontend
    return NextResponse.json({ 
      allocations: result.allocations,
      unallocatedLabs: result.unallocatedLabs
    })

  } catch (error) {
    console.error('Error during allocation:', error)
    const err = error as { stdout?: string, stderr?: string };
    return NextResponse.json({
      error: 'Failed to process files',
      details: err.stderr || err.stdout || 'No details'
    }, { status: 500 })
  } finally {
    // 7. Clean up the temporary directory
    await fs.rm(tempDir, { recursive: true, force: true })
  }
}