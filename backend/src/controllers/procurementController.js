const { z } = require('zod');
const prisma = require('../config/db');

// Validation for a single procurement
const procurementSchema = z.object({
  slipNo: z.string(),
  farmerId: z.string(),
  cropId: z.string(),
  grossWeight: z.number(),
  tareWeight: z.number(),
  moisture: z.number(),
  grade: z.string(),
  rateApplied: z.number(),
  localTimestamp: z.string().transform(val => new Date(val)),
});

// Helper for AI Flagging
const performAIChecks = async (data, farmer) => {
  const flags = [];

  // 1. Yield Check (Example: Max 2500kg per hectare)
  const yieldPerHectare = data.netWeight / Number(farmer.landArea);
  if (yieldPerHectare > 2500) {
    flags.push("High yield for land size");
  }

  // 2. Frequency Check (Same farmer in last hour)
  const oneHourAgo = new Date(data.localTimestamp.getTime() - 60 * 60 * 1000);
  const recentPurchases = await prisma.procurement.count({
    where: {
      farmerId: data.farmerId,
      localTimestamp: { gte: oneHourAgo }
    }
  });
  if (recentPurchases > 0) {
    flags.push("Farmer appeared twice in one hour");
  }

  return {
    isFlagged: flags.length > 0,
    reason: flags.join(", ")
  };
};

exports.createProcurement = async (req, res) => {
  try {
    const body = procurementSchema.parse(req.body);
    const farmer = await prisma.farmer.findUnique({ where: { id: body.farmerId } });

    if (!farmer) return res.status(404).json({ message: "Farmer not found" });

    if (!farmer.isVerified) {
      return res.status(400).json({ message: "Cannot create procurement: Farmer bank details are pending verification." });
    }

    // Business Rule: Moisture Deduction
    // 1% reduction for each moisture point above 12%
    let netWeight = body.grossWeight - body.tareWeight;
    if (body.moisture > 12) {
      const deductionPercent = (body.moisture - 12) / 100;
      netWeight = netWeight * (1 - deductionPercent);
    }

    const totalAmount = netWeight * (body.rateApplied / 100); // rate is per quintal, so divide by 100 for kg

    // AI Checks
    const aiResult = await performAIChecks({ ...body, netWeight }, farmer);

    const procurement = await prisma.procurement.create({
      data: {
        ...body,
        operatorId: req.user.id,
        netWeight,
        totalAmount,
        aiFlagged: aiResult.isFlagged,
        aiFlagReason: aiResult.reason,
        syncStatus: 'SYNCED'
      }
    });

    res.status(201).json(procurement);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.syncProcurements = async (req, res) => {
  const { records } = req.body; // Array of procurement records

  try {
    const results = await prisma.$transaction(async (prisma) => {
      const synced = [];
      for (const record of records) {
        // Validate each record
        const validated = procurementSchema.parse(record);

        const farmer = await prisma.farmer.findUnique({ where: { id: validated.farmerId } });
        if (!farmer) throw new Error(`Farmer ${validated.farmerId} not found`);

        let netWeight = validated.grossWeight - validated.tareWeight;
        if (validated.moisture > 12) {
          netWeight = netWeight * (1 - (validated.moisture - 12) / 100);
        }
        const totalAmount = netWeight * (validated.rateApplied / 100);

        const p = await prisma.procurement.upsert({
          where: { slipNo: validated.slipNo },
          update: { syncStatus: 'SYNCED' },
          create: {
            ...validated,
            operatorId: req.user.id,
            netWeight,
            totalAmount,
            syncStatus: 'SYNCED'
          }
        });
        synced.push(p);
      }
      return synced;
    });

    res.json({ syncedCount: results.length });
  } catch (e) {
    console.error(`Sync failed:`, e.message);
    res.status(400).json({ message: e.message || 'Sync failed' });
  }
};

exports.getProcurements = async (req, res) => {
  const procurements = await prisma.procurement.findMany({
    include: { farmer: true, crop: true },
    orderBy: { createdAt: 'desc' }
  });
  res.json(procurements);
};

exports.approvePayment = async (req, res) => {
  const { id } = req.params;
  const p = await prisma.procurement.update({
    where: { id },
    data: { paymentStatus: 'APPROVED' }
  });
  res.json(p);
};

// Helper for CSV escaping
const escapeCsvField = (field) => {
  const stringField = String(field);
  if (/^[@=+-]/.test(stringField)) {
    return `'${stringField}`;
  }
  return stringField;
};

exports.generateBankFile = async (req, res) => {
  const approved = await prisma.procurement.findMany({
    where: { paymentStatus: 'APPROVED' },
    include: { farmer: true }
  });

  let csv = "FarmerName,AccountNumber,IFSC,Amount\n";
  approved.forEach(p => {
    csv += `${escapeCsvField(p.farmer.name)},${escapeCsvField(p.farmer.accountNumber)},${escapeCsvField(p.farmer.ifscCode)},${p.totalAmount}\n`;
  });

  res.header('Content-Type', 'text/csv');
  res.attachment('bank_payment_file.csv');
  res.send(csv);
};
