const { z } = require('zod');
const prisma = require('../config/db');

const farmerSchema = z.object({
  name: z.string(),
  farmerCode: z.string(),
  village: z.string(),
  landArea: z.number().positive(),
  bankName: z.string(),
  accountNumber: z.string(),
  ifscCode: z.string(),
});

exports.registerFarmer = async (req, res) => {
  try {
    const data = farmerSchema.parse(req.body);
    const farmer = await prisma.farmer.create({ data });
    res.status(201).json(farmer);
  } catch (error) {
    res.status(400).json({ message: error.message || 'Error creating farmer' });
  }
};

exports.getAllFarmers = async (req, res) => {
  const farmers = await prisma.farmer.findMany();
  res.json(farmers);
};

exports.verifyFarmer = async (req, res) => {
  try {
    const { id } = req.params;
    const farmer = await prisma.farmer.update({
      where: { id },
      data: { isVerified: true }
    });
    res.json(farmer);
  } catch (error) {
    res.status(400).json({ message: 'Error verifying farmer' });
  }
};
