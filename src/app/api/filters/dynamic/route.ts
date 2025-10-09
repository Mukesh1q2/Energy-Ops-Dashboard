import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { fetchStorageData } from '@/lib/excel-data-helper'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const moduleName = searchParams.get('module') || 'storage-operations'
    const fileId = searchParams.get('fileId')

    // Get all uploaded files to extract headers and data structure
    const uploadedFiles = await db.uploadedFile.findMany({
      where: {
        status: 'completed',
        OR: [
          { file_type: 'excel' },
          { file_type: 'csv' }
        ]
      },
      orderBy: { created_at: 'desc' }
    })

    // Get unique values from database for different modules
    let filterOptions: any = {
      regions: [],
      states: [],
      technologyTypes: [],
      unitNames: [],
      contractNames: [],
      contractTypes: [],
      marketTypes: [],
      storageTypes: [],
      dataSources: uploadedFiles.map(file => ({
        id: file.id,
        name: file.original_name,
        type: file.file_type,
        uploadedAt: file.created_at
      }))
    }

    // Fetch unique values based on module type
    switch (moduleName) {
      case 'storage-operations':
        // Get storage-related data from database
        const storageData = await db.electricityData.findMany({
          where: {
            OR: [
              { technology_type: { contains: 'Storage' } },
              { technology_type: { contains: 'storage' } },
              { technology_type: { contains: 'Battery' } },
              { technology_type: { contains: 'battery' } },
              { resource_type: { contains: 'Storage' } },
              { resource_type: { contains: 'storage' } }
            ]
          },
          select: {
            region: true,
            state: true,
            technology_type: true,
            capacity_mw: true
          }
        })

        // Also fetch storage data from uploaded Excel files
        let excelStorageData: any[] = []
        try {
          excelStorageData = await fetchStorageData(1000)
        } catch (err) {
          console.log('No Excel storage data available:', err)
        }

        // Merge Prisma and Excel filter options
        const allRegions = [
          ...storageData.map(item => item.region),
          ...excelStorageData.map(item => item.region)
        ].filter(Boolean)
        
        const allStates = [
          ...storageData.map(item => item.state),
          ...excelStorageData.map(item => item.state)
        ].filter(Boolean)
        
        const allStorageTypes = [
          ...storageData.map(item => item.technology_type),
          ...excelStorageData.map(item => item.storage_type)
        ].filter(Boolean)

        filterOptions.regions = [...new Set(allRegions)]
        filterOptions.states = [...new Set(allStates)]
        filterOptions.storageTypes = [...new Set(allStorageTypes)]
        
        // If no data from either source, provide defaults
        if (filterOptions.storageTypes.length === 0) {
          filterOptions.storageTypes = ['Battery', 'Pumped Hydro', 'Compressed Air', 'Flywheel', 'Thermal']
        }
        break

      case 'dmo':
        // Get DMO-related data from all three tables
        const [generatorData, contractData, marketData] = await Promise.all([
          db.dMOGeneratorScheduling.findMany({
            select: { region: true, state: true, technology_type: true, plant_name: true, contract_name: true }
          }),
          db.dMOContractScheduling.findMany({
            select: { region: true, state: true, contract_name: true, contract_type: true }
          }),
          db.dMOMarketBidding.findMany({
            select: { region: true, state: true, plant_name: true, market_type: true }
          })
        ])

        filterOptions.regions = [...new Set([
          ...generatorData.map(item => item.region),
          ...contractData.map(item => item.region),
          ...marketData.map(item => item.region)
        ].filter(Boolean))]

        filterOptions.states = [...new Set([
          ...generatorData.map(item => item.state),
          ...contractData.map(item => item.state),
          ...marketData.map(item => item.state)
        ].filter(Boolean))]

        filterOptions.technologyTypes = [...new Set(generatorData.map(item => item.technology_type).filter(Boolean))]
        filterOptions.unitNames = [...new Set([
          ...generatorData.map(item => item.plant_name),
          ...marketData.map(item => item.plant_name)
        ].filter(Boolean))]

        filterOptions.contractNames = [...new Set([
          ...generatorData.map(item => item.contract_name),
          ...contractData.map(item => item.contract_name)
        ].filter(Boolean))]

        filterOptions.contractTypes = [...new Set(contractData.map(item => item.contract_type).filter(Boolean))]
        filterOptions.marketTypes = [...new Set(marketData.map(item => item.market_type).filter(Boolean))]
        break

      default:
        // Generic data for other modules
        const genericData = await db.electricityData.findMany({
          select: {
            region: true,
            state: true,
            technology_type: true,
            contract_name: true,
            contract_type: true
          }
        })

        filterOptions.regions = [...new Set(genericData.map(item => item.region).filter(Boolean))]
        filterOptions.states = [...new Set(genericData.map(item => item.state).filter(Boolean))]
        filterOptions.technologyTypes = [...new Set(genericData.map(item => item.technology_type).filter(Boolean))]
        filterOptions.contractNames = [...new Set(genericData.map(item => item.contract_name).filter(Boolean))]
        filterOptions.contractTypes = [...new Set(genericData.map(item => item.contract_type).filter(Boolean))]
    }

    // If specific file is requested, get its headers and sample data
    let fileDetails = null
    if (fileId) {
      const file = await db.uploadedFile.findUnique({
        where: { id: fileId }
      })

      if (file && file.processed_data) {
        const processedData = Array.isArray(file.processed_data) ? file.processed_data : []
        if (processedData.length > 0) {
          const headers = Object.keys(processedData[0])
          const sampleData = processedData.slice(0, 5) // First 5 rows as sample
          
          fileDetails = {
            id: file.id,
            name: file.original_name,
            headers,
            sampleData,
            totalRows: processedData.length
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        filterOptions,
        fileDetails,
        selectedFile: fileId
      }
    })

  } catch (error) {
    console.error('Error fetching dynamic filters:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch dynamic filters',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}