import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Clear existing data
  await prisma.dMOGeneratorScheduling.deleteMany()
  await prisma.dMOContractScheduling.deleteMany()
  await prisma.dMOMarketBidding.deleteMany()

  // Sample data for DMO Generator Scheduling
  const generatorSchedulingData = []
  const technologies = ['Coal', 'Gas', 'Hydro', 'Solar', 'Wind', 'Storage']
  const plants = ['Plant-001', 'Plant-002', 'Plant-003', 'Plant-004', 'Plant-005']
  const contracts = ['Contract-A', 'Contract-B', 'Contract-C', null]
  const regions = ['Northern', 'Western', 'Southern', 'Eastern']
  const states = ['Delhi', 'Maharashtra', 'Tamil Nadu', 'West Bengal', 'Gujarat']

  for (let i = 0; i < 100; i++) {
    const date = new Date(2024, 0, 1)
    date.setDate(date.getDate() + i)
    
    generatorSchedulingData.push({
      id: `gen-sched-${i}`,
      time_period: date,
      region: regions[Math.floor(Math.random() * regions.length)],
      state: states[Math.floor(Math.random() * states.length)],
      plant_id: plants[Math.floor(Math.random() * plants.length)],
      plant_name: plants[Math.floor(Math.random() * plants.length)],
      technology_type: technologies[Math.floor(Math.random() * technologies.length)],
      contract_name: contracts[Math.floor(Math.random() * contracts.length)],
      scheduled_mw: Math.floor(Math.random() * 500) + 100,
      actual_mw: Math.floor(Math.random() * 500) + 80,
      created_at: new Date()
    })
  }

  // Sample data for DMO Contract Scheduling
  const contractSchedulingData = []
  const contractTypes = ['PPA', 'Tender', 'Merchant', 'REC', 'Banking']
  const contractNames = ['Contract-A', 'Contract-B', 'Contract-C', 'Contract-D', 'Contract-E']

  for (let i = 0; i < 80; i++) {
    const date = new Date(2024, 0, 1)
    date.setDate(date.getDate() + i)
    
    contractSchedulingData.push({
      id: `contract-sched-${i}`,
      time_period: date,
      region: regions[Math.floor(Math.random() * regions.length)],
      state: states[Math.floor(Math.random() * states.length)],
      contract_name: contractNames[Math.floor(Math.random() * contractNames.length)],
      contract_type: contractTypes[Math.floor(Math.random() * contractTypes.length)],
      scheduled_mw: Math.floor(Math.random() * 300) + 50,
      actual_mw: Math.floor(Math.random() * 300) + 40,
      cumulative_mw: Math.floor(Math.random() * 1000) + 200,
      created_at: new Date()
    })
  }

  // Sample data for DMO Market Bidding
  const marketBiddingData = []
  const marketTypes = ['Day-Ahead', 'Real-Time', 'Term-Ahead', 'Ancillary Services']

  for (let i = 0; i < 120; i++) {
    const date = new Date(2024, 0, 1)
    date.setDate(date.getDate() + i)
    
    marketBiddingData.push({
      id: `market-bid-${i}`,
      time_period: date,
      region: regions[Math.floor(Math.random() * regions.length)],
      state: states[Math.floor(Math.random() * states.length)],
      plant_id: plants[Math.floor(Math.random() * plants.length)],
      plant_name: plants[Math.floor(Math.random() * plants.length)],
      market_type: marketTypes[Math.floor(Math.random() * marketTypes.length)],
      bid_price_rs_per_mwh: Math.floor(Math.random() * 5000) + 2000,
      bid_volume_mw: Math.floor(Math.random() * 100) + 10,
      clearing_price_rs_per_mwh: Math.floor(Math.random() * 5000) + 2000,
      cleared_volume_mw: Math.floor(Math.random() * 100) + 10,
      created_at: new Date()
    })
  }

  // Insert data into database
  await prisma.dMOGeneratorScheduling.createMany({
    data: generatorSchedulingData
  })

  await prisma.dMOContractScheduling.createMany({
    data: contractSchedulingData
  })

  await prisma.dMOMarketBidding.createMany({
    data: marketBiddingData
  })

  console.log('Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })